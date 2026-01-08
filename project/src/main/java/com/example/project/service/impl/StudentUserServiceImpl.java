package com.example.project.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.project.entity.Student;
import com.example.project.entity.enrollment.CourseEnrollment;
import com.example.project.mapper.StudentUserMapper;
import com.example.project.mapper.enrollment.CourseEnrollmentMapper;
import com.example.project.service.StudentUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.UUID;

@Service
public class StudentUserServiceImpl implements StudentUserService {

    @Autowired
    private StudentUserMapper studentUserMapper;

    @Autowired
    private CourseEnrollmentMapper courseEnrollmentMapper;

    @Override
    public Student getStudentById(Integer studentId) {
        Student student = studentUserMapper.selectById(studentId);
        if (student != null) {
            student.setStudentsPassword(null);
        }
        return student;
    }

    @Override
    public void updateStudentInfo(Integer studentId, String email, String birthday, String sex, String major,
            String grade) {
        Student student = new Student();
        student.setStudentsId(studentId);
        student.setStudentsEmail(email);
        student.setStudentsBirthday(birthday);
        student.setStudentSex(sex);
        student.setStudentsMajor(major);
        student.setStudentsGrade(grade);
        studentUserMapper.updateById(student);
    }

    @Override
    public void updatePassword(Integer studentId, String oldPassword, String newPassword) {
        Student student = studentUserMapper.selectById(studentId);
        if (student == null) {
            throw new RuntimeException("学生不存在");
        }

        org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder passwordEncoder = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();

        // Check if the current password in DB is hashed (starts with $2a$)
        boolean isHash = student.getStudentsPassword().startsWith("$2a$");

        if (isHash) {
            if (!passwordEncoder.matches(oldPassword, student.getStudentsPassword())) {
                throw new RuntimeException("原密码错误");
            }
        } else {
            // Fallback for old plain text passwords
            if (!student.getStudentsPassword().equals(oldPassword)) {
                throw new RuntimeException("原密码错误");
            }
        }

        student.setStudentsPassword(passwordEncoder.encode(newPassword));
        studentUserMapper.updateById(student);
    }

    @Override
    public String uploadAvatar(Integer studentId, MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("文件不能为空");
        }

        try {
            String projectPath = System.getProperty("user.dir");
            File uploadPath = new File(projectPath, "uploads/avatar");

            if (!uploadPath.exists()) {
                uploadPath.mkdirs();
            }

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = UUID.randomUUID().toString() + extension;

            File dest = new File(uploadPath, filename);
            file.transferTo(dest);

            String avatarUrl = "/uploads/avatar/" + filename;
            Student student = new Student();
            student.setStudentsId(studentId);
            student.setStudentsHead(avatarUrl);
            studentUserMapper.updateById(student);

            return avatarUrl;
        } catch (IOException e) {
            throw new RuntimeException("文件上传失败: " + e.getMessage());
        }
    }

    @Override
    public java.util.Map<String, Object> getStudentStatistics(Integer studentId) {
        java.util.Map<String, Object> stats = new java.util.HashMap<>();

        // 获取报名统计
        QueryWrapper<CourseEnrollment> wrapper = new QueryWrapper<>();
        wrapper.eq("student_id", studentId);

        long total = courseEnrollmentMapper.selectCount(wrapper);

        wrapper.clear();
        wrapper.eq("student_id", studentId).eq("status", "approved");
        long approved = courseEnrollmentMapper.selectCount(wrapper);

        stats.put("enrolledCourses", total);
        stats.put("learningCourses", approved);
        stats.put("completedCourses", 0); // 暂时没完成状态，设为0

        return stats;
    }
}
