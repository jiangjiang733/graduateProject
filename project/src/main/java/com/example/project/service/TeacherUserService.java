package com.example.project.service;

import com.example.project.entity.Teacher;
import org.springframework.web.multipart.MultipartFile;

public interface TeacherUserService {
    
    /**
     * 教师注册
     */
    Teacher register(String username, String password, String email, String department, String level);
    
    /**
     * 教师登录
     */
    Teacher login(String username, String password);
    
    /**
     * 根据ID获取教师信息
     */
    Teacher getTeacherById(Integer teacherId);
    
    /**
     * 更新教师信息
     */
    void updateTeacherInfo(Integer teacherId, String email, String department, String level, String phone);
    
    /**
     * 修改密码
     */
    void updatePassword(Integer teacherId, String oldPassword, String newPassword);
    
    /**
     * 上传头像
     */
    String uploadAvatar(Integer teacherId, MultipartFile file);
    
    /**
     * 检查用户名是否存在
     */
    boolean isUsernameExists(String username);
    
    /**
     * 检查邮箱是否存在
     */
    boolean isEmailExists(String email);
}
