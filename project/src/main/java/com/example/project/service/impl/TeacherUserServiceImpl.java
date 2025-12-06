package com.example.project.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.project.entity.Teacher;
import com.example.project.exception.UnauthorizedException;
import com.example.project.mapper.TeacherUserMapper;
import com.example.project.service.TeacherUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.UUID;

@Service
public class TeacherUserServiceImpl implements TeacherUserService {
    
    @Autowired
    private TeacherUserMapper teacherUserMapper;
    // 上传路径
    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;
    //加密算法
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    
    @Override
    public Teacher register(String username, String password, String email, String department, String level) {
        // 检查用户名是否已存在
        if (isUsernameExists(username)) {
            throw new RuntimeException("用户名已存在");
        }
        
        // 检查邮箱是否已存在
        if (email != null && !email.isEmpty() && isEmailExists(email)) {
            throw new RuntimeException("邮箱已被注册");
        }
        
        // 创建教师对象
        Teacher teacher = new Teacher();
        teacher.setTeacherUsername(username);
        teacher.setTeacherPassword(passwordEncoder.encode(password));
        teacher.setTeacherEmail(email);
        teacher.setTeacherDepartment(department);
        teacher.setTeacherLevel(level);
        
        // 保存到数据库
        teacherUserMapper.insert(teacher);
        
        // 返回时不包含密码
        teacher.setTeacherPassword(null);
        return teacher;
    }
    
    @Override
    public Teacher login(String username, String password) {
        // 查询教师
        QueryWrapper<Teacher> wrapper = new QueryWrapper<>();
        wrapper.eq("teacher_username", username);
        Teacher teacher = teacherUserMapper.selectOne(wrapper);
        
        if (teacher == null) {
            throw new UnauthorizedException("用户名或密码错误");
        }
        
        // 验证密码
        if (!passwordEncoder.matches(password, teacher.getTeacherPassword())) {
            throw new UnauthorizedException("用户名或密码错误");
        }
        
        // 返回时不包含密码
        teacher.setTeacherPassword(null);
        return teacher;
    }
    
    @Override
    public Teacher getTeacherById(Integer teacherId) {
        Teacher teacher = teacherUserMapper.selectById(teacherId);
        if (teacher != null) {
            teacher.setTeacherPassword(null);
        }
        return teacher;
    }
    
    @Override
    public void updateTeacherInfo(Integer teacherId, String email, String department, String level, String phone) {
        Teacher teacher = new Teacher();
        teacher.setTeacherId(teacherId);
        teacher.setTeacherEmail(email);
        teacher.setTeacherDepartment(department);
        teacher.setTeacherLevel(level);
        teacher.setTeacherPhone(phone);
        
        teacherUserMapper.updateById(teacher);
    }
    
    @Override
    public void updatePassword(Integer teacherId, String oldPassword, String newPassword) {
        // 获取教师信息
        Teacher teacher = teacherUserMapper.selectById(teacherId);
        if (teacher == null) {
            throw new RuntimeException("教师不存在");
        }
        
        // 验证旧密码
        if (!passwordEncoder.matches(oldPassword, teacher.getTeacherPassword())) {
            throw new RuntimeException("原密码错误");
        }
        
        // 更新密码
        teacher.setTeacherPassword(passwordEncoder.encode(newPassword));
        teacherUserMapper.updateById(teacher);
    }
    
    @Override
    public String uploadAvatar(Integer teacherId, MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("文件不能为空");
        }
        
        try {
            // 获取项目根目录的绝对路径
            String projectPath = System.getProperty("user.dir");
            File uploadPath = new File(projectPath, "uploads/avatar");
            
            // 创建上传目录
            if (!uploadPath.exists()) {
                boolean created = uploadPath.mkdirs();
                if (!created) {
                    throw new RuntimeException("无法创建上传目录: " + uploadPath.getAbsolutePath());
                }
            }
            
            // 生成文件名
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = UUID.randomUUID().toString() + extension;
            
            // 保存文件
            File dest = new File(uploadPath, filename);
            file.transferTo(dest);
            
            // 打印日志，方便调试
            System.out.println("头像保存路径: " + dest.getAbsolutePath());
            
            // 更新数据库 - 使用/uploads/avatar/以匹配WebMvcConfig中的映射
            String avatarUrl = "/uploads/avatar/" + filename;
            Teacher teacher = new Teacher();
            teacher.setTeacherId(teacherId);
            teacher.setTeacherHead(avatarUrl);
            teacherUserMapper.updateById(teacher);
            
            return avatarUrl;
        } catch (IOException e) {
            throw new RuntimeException("文件上传失败: " + e.getMessage());
        }
    }
    
    @Override
    public boolean isUsernameExists(String username) {
        QueryWrapper<Teacher> wrapper = new QueryWrapper<>();
        wrapper.eq("teacher_username", username);
        return teacherUserMapper.selectCount(wrapper) > 0;
    }
    
    @Override
    public boolean isEmailExists(String email) {
        QueryWrapper<Teacher> wrapper = new QueryWrapper<>();
        wrapper.eq("teacher_email", email);
        return teacherUserMapper.selectCount(wrapper) > 0;
    }
}
