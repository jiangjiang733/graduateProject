package com.example.project.service;

import com.example.project.entity.Student;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

public interface StudentUserService {
    Student getStudentById(Integer studentId);

    void updateStudentInfo(Integer studentId, String email, String birthday, String sex, String major, String grade);

    void updatePassword(Integer studentId, String oldPassword, String newPassword);

    String uploadAvatar(Integer studentId, MultipartFile file);

    Map<String, Object> getStudentStatistics(Integer studentId);
}
