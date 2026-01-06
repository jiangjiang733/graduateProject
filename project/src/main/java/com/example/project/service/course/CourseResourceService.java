package com.example.project.service.course;

import com.example.project.entity.course.CourseResource;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface CourseResourceService {
    List<CourseResource> getResourcesByCourseId(String courseId);

    CourseResource uploadResource(String courseId, String title, String uploaderId, String uploaderName,
            MultipartFile file);

    void deleteResource(Long id);

    void incrementDownloadCount(Long id);
}
