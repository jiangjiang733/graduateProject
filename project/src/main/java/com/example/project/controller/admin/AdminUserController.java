package com.example.project.controller.admin;

import com.example.project.common.Result;
import com.example.project.entity.Student;
import com.example.project.entity.Teacher;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * 管理员用户管理控制器
 */
@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminUserController {

    // ==================== 学生管理 ====================

    /**
     * 获取学生列表
     */
    @GetMapping("/students")
    public Result<Map<String, Object>> getStudentList(
            @RequestParam(defaultValue = "1") Integer pageNumber,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status
    ) {
        // TODO: 实现实际的数据库查询
        Map<String, Object> data = new HashMap<>();
        data.put("list", new ArrayList<>());
        data.put("total", 0);
        data.put("pageNumber", pageNumber);
        data.put("pageSize", pageSize);
        
        return Result.success(data);
    }

    /**
     * 获取学生详情
     */
    @GetMapping("/students/{id}")
    public Result<Student> getStudentDetail(@PathVariable Long id) {
        // TODO: 实现实际的数据库查询
        return Result.success(new Student());
    }

    /**
     * 创建学生
     */
    @PostMapping("/students")
    public Result<Long> createStudent(@RequestBody Student student) {
        // TODO: 实现实际的数据库插入
        return Result.success(1L);
    }

    /**
     * 更新学生信息
     */
    @PutMapping("/students/{id}")
    public Result<Void> updateStudent(@PathVariable Long id, @RequestBody Student student) {
        // TODO: 实现实际的数据库更新
        return Result.success();
    }

    /**
     * 删除学生
     */
    @DeleteMapping("/students/{id}")
    public Result<Void> deleteStudent(@PathVariable Long id) {
        // TODO: 实现实际的数据库删除
        return Result.success();
    }

    /**
     * 批量删除学生
     */
    @PostMapping("/students/batch-delete")
    public Result<Void> batchDeleteStudents(@RequestBody Map<String, List<Long>> data) {
        List<Long> ids = data.get("ids");
        // TODO: 实现实际的批量删除
        return Result.success();
    }

    /**
     * 启用/禁用学生账号
     */
    @PutMapping("/students/{id}/status")
    public Result<Void> toggleStudentStatus(@PathVariable Long id, @RequestBody Map<String, Integer> data) {
        Integer status = data.get("status");
        // TODO: 实现实际的状态更新
        return Result.success();
    }

    /**
     * 重置学生密码
     */
    @PutMapping("/students/{id}/reset-password")
    public Result<Void> resetStudentPassword(@PathVariable Long id) {
        // TODO: 实现实际的密码重置，默认密码 123456
        return Result.success();
    }

    // ==================== 教师管理 ====================

    /**
     * 获取教师列表
     */
    @GetMapping("/teachers")
    public Result<Map<String, Object>> getTeacherList(
            @RequestParam(defaultValue = "1") Integer pageNumber,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status
    ) {
        // TODO: 实现实际的数据库查询
        Map<String, Object> data = new HashMap<>();
        data.put("list", new ArrayList<>());
        data.put("total", 0);
        data.put("pageNumber", pageNumber);
        data.put("pageSize", pageSize);
        
        return Result.success(data);
    }

    /**
     * 获取教师详情
     */
    @GetMapping("/teachers/{id}")
    public Result<Teacher> getTeacherDetail(@PathVariable Long id) {
        // TODO: 实现实际的数据库查询
        return Result.success(new Teacher());
    }

    /**
     * 创建教师
     */
    @PostMapping("/teachers")
    public Result<Long> createTeacher(@RequestBody Teacher teacher) {
        // TODO: 实现实际的数据库插入
        return Result.success(1L);
    }

    /**
     * 更新教师信息
     */
    @PutMapping("/teachers/{id}")
    public Result<Void> updateTeacher(@PathVariable Long id, @RequestBody Teacher teacher) {
        // TODO: 实现实际的数据库更新
        return Result.success();
    }

    /**
     * 删除教师
     */
    @DeleteMapping("/teachers/{id}")
    public Result<Void> deleteTeacher(@PathVariable Long id) {
        // TODO: 实现实际的数据库删除
        return Result.success();
    }

    /**
     * 批量删除教师
     */
    @PostMapping("/teachers/batch-delete")
    public Result<Void> batchDeleteTeachers(@RequestBody Map<String, List<Long>> data) {
        List<Long> ids = data.get("ids");
        // TODO: 实现实际的批量删除
        return Result.success();
    }

    /**
     * 启用/禁用教师账号
     */
    @PutMapping("/teachers/{id}/status")
    public Result<Void> toggleTeacherStatus(@PathVariable Long id, @RequestBody Map<String, Integer> data) {
        Integer status = data.get("status");
        // TODO: 实现实际的状态更新
        return Result.success();
    }

    /**
     * 重置教师密码
     */
    @PutMapping("/teachers/{id}/reset-password")
    public Result<Void> resetTeacherPassword(@PathVariable Long id) {
        // TODO: 实现实际的密码重置，默认密码 123456
        return Result.success();
    }
}
