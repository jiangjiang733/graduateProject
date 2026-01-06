package com.example.project.service.course.impl;

import com.example.project.entity.course.CourseResource;
import com.example.project.mapper.course.CourseResourceMapper;
import com.example.project.service.course.CourseResourceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
public class CourseResourceServiceImpl implements CourseResourceService {

    @Autowired
    private CourseResourceMapper courseResourceMapper;

    @Value("${file.course.resource-dir:./uploads/course/resource}")
    private String resourceDir;

    @Override
    public List<CourseResource> getResourcesByCourseId(String courseId) {
        return courseResourceMapper.selectByCourseId(courseId);
    }

    @Override
    @Transactional
    public CourseResource uploadResource(String courseId, String title, String uploaderId, String uploaderName,
            MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("文件不能为空");
        }

        // 保存文件
        String fileUrl = saveResourceFile(file);
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
        }

        CourseResource resource = new CourseResource();
        resource.setCourseId(courseId);
        resource.setTitle(title != null && !title.isEmpty() ? title : originalFilename);
        resource.setFileName(originalFilename);
        resource.setFileUrl(fileUrl);
        resource.setFileSize(file.getSize());
        resource.setFileType(extension);
        resource.setUploaderId(uploaderId);
        resource.setUploaderName(uploaderName);
        resource.setDownloadCount(0);
        resource.setCreateTime(new Date());

        courseResourceMapper.insert(resource);
        return resource;
    }

    @Override
    @Transactional
    public void deleteResource(Long id) {
        CourseResource resource = courseResourceMapper.selectById(id);
        if (resource != null) {
            deleteFileFromUrl(resource.getFileUrl());
            courseResourceMapper.deleteById(id);
        }
    }

    @Override
    @Transactional
    public void incrementDownloadCount(Long id) {
        courseResourceMapper.incrementDownloadCount(id);
    }

    private String saveResourceFile(MultipartFile file) {
        try {
            Path dirPath = Paths.get(resourceDir).toAbsolutePath().normalize();
            Files.createDirectories(dirPath);

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String filename = "res_" + System.currentTimeMillis() + "_" +
                    UUID.randomUUID().toString().substring(0, 8) + extension;

            Path filePath = dirPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            return "/uploads/course/resource/" + filename;
        } catch (Exception e) {
            throw new RuntimeException("文件保存失败: " + e.getMessage(), e);
        }
    }

    private void deleteFileFromUrl(String fileUrl) {
        try {
            String filename = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
            Path filePath = Paths.get(resourceDir).toAbsolutePath().resolve(filename);
            if (Files.exists(filePath)) {
                Files.delete(filePath);
            }
        } catch (Exception e) {
            System.err.println("删除文件失败: " + e.getMessage());
        }
    }
}
