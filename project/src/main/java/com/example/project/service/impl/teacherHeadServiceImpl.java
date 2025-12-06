package com.example.project.service.impl;

import com.example.project.entity.Teacher;
import com.example.project.mapper.TeacherUserMapper;
import com.example.project.service.teacherHeadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import jakarta.annotation.PostConstruct;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.io.IOException;

@Service
public class teacherHeadServiceImpl implements teacherHeadService {

    @Value("${file.upload-dir}")
    private String fileUploadDir;
    private Path uploadPath;
    
    @Autowired
    private TeacherUserMapper teacherUserMapper;
    
    @PostConstruct
    public void init() {
        uploadPath = Paths.get(fileUploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(uploadPath);
        } catch (Exception e) {
            throw new RuntimeException("无法创建上传目录: " + uploadPath + " - " + e.getMessage());
        }
    }
    
    @Override
    public Teacher getTeacherById(Integer id) {
        return teacherUserMapper.selectById(id);
    }
    
    @Override
    public void updateAvatar(Integer id, MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("文件为空");
        }
        
        // 验证文件类型
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("只能上传图片文件");
        }
        
        // 验证文件大小 (最大5MB)
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("文件大小不能超过5MB");
        }
        
        String fileName = file.getOriginalFilename();
        String extension = "";
        
        if (fileName != null && fileName.contains(".")) {
            extension = fileName.substring(fileName.lastIndexOf("."));
        }
        
        // 生成唯一文件名
        String newFileName = "avatar_" + System.currentTimeMillis() + "_" + 
                           UUID.randomUUID().toString().substring(0, 8) + extension;
        
        try {
            // 先删除旧头像
            deleteOldAvatar(id);
            
            Path filePath = uploadPath.resolve(newFileName);
            Files.copy(file.getInputStream(), filePath);
            
            // 更新数据库
            Teacher teacher = new Teacher();
            teacher.setTeacherId(id);
            teacher.setTeacherHead("/uploads/avatar/" + newFileName);
            teacherUserMapper.updateById(teacher);
            
        } catch (Exception e) {
            throw new RuntimeException("文件保存失败: " + e.getMessage(), e);
        }
    }
    
    /**
     * 删除旧头像文件
     * @param teacherId 教师ID
     */
    private void deleteOldAvatar(Integer teacherId) {
        try {
            // 获取当前教师的头像信息
            Teacher teacher = teacherUserMapper.selectById(teacherId);
            if (teacher != null && teacher.getTeacherHead() != null) {
                String oldAvatarPath = teacher.getTeacherHead();
                // 提取文件名
                String fileName = oldAvatarPath.substring(oldAvatarPath.lastIndexOf("/") + 1);
                Path oldFilePath = uploadPath.resolve(fileName);
                
                // 删除旧文件
                Files.deleteIfExists(oldFilePath);
            }
        } catch (IOException e) {
            // 记录日志但不影响新头像上传
            System.err.println("删除旧头像失败: " + e.getMessage());
        }
    }
}
