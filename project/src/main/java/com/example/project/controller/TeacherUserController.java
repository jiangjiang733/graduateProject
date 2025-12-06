package com.example.project.controller;

import com.example.project.common.Result;
import com.example.project.entity.Teacher;
import com.example.project.service.TeacherUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/teacher")
public class TeacherUserController {
    
    @Autowired
    private TeacherUserService teacherUserService;
    
    @Autowired
    private com.example.project.util.JwtUtil jwtUtil;
    /**
     * 教师登录
     */
    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody Map<String, String> loginData) {
        try {
            String username = loginData.get("teacherUsername");
            String password = loginData.get("teacherPassword");
            
            Teacher teacher = teacherUserService.login(username, password);
            
            // 生成JWT Token
            String token = jwtUtil.generateToken(teacher.getTeacherId(), teacher.getTeacherUsername(), "TEACHER");
            
            Map<String, Object> data = new HashMap<>();
            data.put("teacherId", teacher.getTeacherId());
            data.put("teacherUsername", teacher.getTeacherUsername());
            data.put("teacherEmail", teacher.getTeacherEmail());
            data.put("teacherHead", teacher.getTeacherHead());
            data.put("teacherDepartment", teacher.getTeacherDepartment());
            data.put("teacherLevel", teacher.getTeacherLevel());
            data.put("token", token);
            
            return Result.success("登录成功", data);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
    /**
     * 教师注册
     */
    @PostMapping("/register")
    public Result<Teacher> register(@RequestBody Map<String, String> registerData) {
        try {
            String username = registerData.get("teacherUsername");
            String password = registerData.get("teacherPassword");
            String email = registerData.get("teacherEmail");
            String department = registerData.get("teacherDepartment");
            String level = registerData.get("teacherLevel");
            
            Teacher teacher = teacherUserService.register(username, password, email, department, level);
            return Result.success("注册成功", teacher);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
    /**
     * 获取教师信息
     */
    @GetMapping("/profile/{teacherId}")
    public Result<Teacher> getProfile(@PathVariable Integer teacherId) {
        try {
            Teacher teacher = teacherUserService.getTeacherById(teacherId);
            if (teacher == null) {
                return Result.error("教师不存在");
            }
            return Result.success(teacher);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
    /**
     * 更新教师信息
     */
    @PutMapping("/profile/{teacherId}")
    public Result<String> updateProfile(@PathVariable Integer teacherId, @RequestBody Map<String, String> profileData) {
        try {
            String email = profileData.get("teacherEmail");
            String department = profileData.get("teacherDepartment");
            String level = profileData.get("teacherLevel");
            String phone = profileData.get("teacherPhone");
            
            teacherUserService.updateTeacherInfo(teacherId, email, department, level, phone);
            return Result.success("个人信息更新成功");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
    /**
     * 修改密码
     */
    @PutMapping("/password/{teacherId}")
    public Result<String> updatePassword(@PathVariable Integer teacherId, @RequestBody Map<String, String> pwdData) {
        try {
            String oldPassword = pwdData.get("oldPassword");
            String newPassword = pwdData.get("newPassword");
            
            teacherUserService.updatePassword(teacherId, oldPassword, newPassword);
            return Result.success("密码修改成功");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 上传头像
     */
    @PostMapping("/avatar/{teacherId}")
    public Result<Map<String, String>> uploadAvatar(@PathVariable Integer teacherId, @RequestParam("avatar") MultipartFile file) {
        try {
            String avatarUrl = teacherUserService.uploadAvatar(teacherId, file);
            Map<String, String> data = new HashMap<>();
            data.put("avatarUrl", avatarUrl);
            return Result.success("头像上传成功", data);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
}
