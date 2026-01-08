package com.example.project.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.project.common.Result;
import com.example.project.entity.Student;
import com.example.project.mapper.StudentUserMapper;
import com.example.project.service.UniquenessCheckService;
import com.example.project.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

// 学生用户控制器
@RestController
@RequestMapping(value = "api")
public class StudentUserController {
    // 注入StudentUserMapper
    @Autowired
    private StudentUserMapper studentUserMapper;

    @Autowired
    private UniquenessCheckService uniquenessCheckService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private com.example.project.service.StudentUserService studentUserService;

    // 学生登录
    @PostMapping("/studentLogin")
    public Result<Map<String, Object>> query(@RequestBody Student student) {
        QueryWrapper<Student> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("students_username", student.getStudentsUsername());
        Student dbStudent = studentUserMapper.selectOne(queryWrapper);

        if (dbStudent == null) {
            return Result.error("用户不存在");
        }

        if (!dbStudent.getStudentsPassword().equals(student.getStudentsPassword())) {
            return Result.error("密码错误");
        }

        // 生成Token
        String token = jwtUtil.generateToken(dbStudent.getStudentsId(), dbStudent.getStudentsUsername(), "STUDENT");

        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("student", dbStudent);
        result.put("message", "欢迎您," + dbStudent.getStudentsUsername() + "回来");

        return Result.success("登录成功", result);
    }

    // 用户添加
    @RequestMapping(value = "/addStudent", method = RequestMethod.POST)
    public Result<Map<String, Object>> Add(@RequestBody Student student) {
        // 数据的唯一性的校验
        boolean names = uniquenessCheckService.checkFieldExists(studentUserMapper, Student.class, "students_username",
                student.getStudentsUsername());
        boolean emails = uniquenessCheckService.checkFieldExists(studentUserMapper, Student.class, "students_email",
                student.getStudentsEmail());

        if (names || emails) {
            if (names && emails) {
                return Result.error("用户名和邮箱均被使用");
            } else if (names) {
                return Result.error("学生用户名已存在了");
            } else if (emails) {
                return Result.error("邮箱已被绑定");
            }
        }

        try {
            studentUserMapper.insert(student);
            return Result.success("注册成功");
        } catch (Exception e) {
            return Result.error("注册失败: " + e.getMessage());
        }
    }

    /**
     * 获取学生信息
     */
    @GetMapping("/student/profile/{studentId}")
    public Result<Student> getProfile(@PathVariable Integer studentId) {
        try {
            Student student = studentUserService.getStudentById(studentId);
            if (student == null) {
                return Result.error("学生不存在");
            }
            return Result.success(student);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 更新学生信息
     */
    @PutMapping("/student/profile/{studentId}")
    public Result<String> updateProfile(@PathVariable Integer studentId, @RequestBody Map<String, String> profileData) {
        try {
            String email = profileData.get("studentsEmail");
            String birthday = profileData.get("studentsBirthday");
            String sex = profileData.get("studentSex");
            String major = profileData.get("studentsMajor");
            String grade = profileData.get("studentsGrade");

            studentUserService.updateStudentInfo(studentId, email, birthday, sex, major, grade);
            return Result.success("个人信息更新成功");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 修改密码
     */
    @PutMapping("/student/password/{studentId}")
    public Result<String> updatePassword(@PathVariable Integer studentId, @RequestBody Map<String, String> pwdData) {
        try {
            String oldPassword = pwdData.get("oldPassword");
            String newPassword = pwdData.get("newPassword");

            studentUserService.updatePassword(studentId, oldPassword, newPassword);
            return Result.success("密码修改成功");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 上传头像
     */
    @PostMapping("/student/avatar/{studentId}")
    public Result<Map<String, String>> uploadAvatar(@PathVariable Integer studentId,
            @RequestParam("avatar") MultipartFile file) {
        try {
            String avatarUrl = studentUserService.uploadAvatar(studentId, file);
            Map<String, String> data = new HashMap<>();
            data.put("avatarUrl", avatarUrl);
            return Result.success("头像上传成功", data);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 获取学生统计数据
     */
    @GetMapping("/student/statistics/{studentId}")
    public Result<Map<String, Object>> getStatistics(@PathVariable Integer studentId) {
        try {
            Map<String, Object> stats = studentUserService.getStudentStatistics(studentId);
            return Result.success(stats);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
}