package com.example.project.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.project.common.Result;
import com.example.project.entity.Student;
import com.example.project.mapper.StudentUserMapper;
import com.example.project.service.UniquenessCheckService;
import com.example.project.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

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
        boolean names = uniquenessCheckService.checkFieldExists(studentUserMapper, Student.class, "students_username", student.getStudentsUsername());
        boolean emails = uniquenessCheckService.checkFieldExists(studentUserMapper, Student.class, "students_email", student.getStudentsEmail());

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
}