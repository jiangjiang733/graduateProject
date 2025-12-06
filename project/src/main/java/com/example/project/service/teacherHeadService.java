package com.example.project.service;

import com.example.project.entity.Teacher;
import org.springframework.web.multipart.MultipartFile;

public interface teacherHeadService {
    Teacher getTeacherById(Integer id);
    void updateAvatar(Integer id, MultipartFile file);
}
