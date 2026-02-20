package com.example.project.controller.admin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.project.common.Result;
import com.example.project.entity.Student;
import com.example.project.entity.Teacher;
import com.example.project.mapper.StudentUserMapper;
import com.example.project.mapper.TeacherUserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import com.example.project.util.AESUtil;
import java.util.*;

/**
 * 管理员用户 management controller
 */
@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminUserController {

    @Autowired
    private StudentUserMapper studentUserMapper;

    @Autowired
    private TeacherUserMapper teacherUserMapper;

    /**
     * Get student list
     */
    @GetMapping("/students")
    public Result<Map<String, Object>> getStudentList(
            @RequestParam(defaultValue = "1") Integer pageNumber,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String keyword) {
        Page<Student> page = new Page<>(pageNumber, pageSize);
        LambdaQueryWrapper<Student> queryWrapper = new LambdaQueryWrapper<>();

        if (StringUtils.hasText(keyword)) {
            queryWrapper.and(w -> w
                    .like(Student::getStudentsUsername, keyword)
                    .or()
                    .like(Student::getStudentsEmail, keyword));
        }

        queryWrapper.orderByDesc(Student::getStudentsId);
        Page<Student> studentPage = studentUserMapper.selectPage(page, queryWrapper);

        List<Student> students = studentPage.getRecords();
        // 处理密码显示：BCrypt无法解密，AES可以解密
        for (Student s : students) {
            if (StringUtils.hasText(s.getStudentsPassword())) {
                String pwd = s.getStudentsPassword();
                // 判断是否是BCrypt加密（以$2a$、$2b$或$2y$开头）
                if (pwd.startsWith("$2a$") || pwd.startsWith("$2b$") || pwd.startsWith("$2y$")) {
                    s.setStudentsPassword("[BCrypt加密-无法查看]");
                } else {
                    // AES加密可以解密
                    try {
                        String decrypted = AESUtil.decrypt(pwd);
                        if (decrypted != null && !decrypted.isEmpty()) {
                            s.setStudentsPassword(decrypted);
                        } else {
                            // 显示原始密码的前几个字符以便诊断
                            String preview = pwd.length() > 10 ? pwd.substring(0, 10) + "..." : pwd;
                            s.setStudentsPassword("[解密失败: " + preview + "]");
                        }
                    } catch (Exception e) {
                        String preview = pwd.length() > 10 ? pwd.substring(0, 10) + "..." : pwd;
                        s.setStudentsPassword("[异常: " + preview + "]");
                    }
                }
            } else {
                s.setStudentsPassword("[空密码]");
            }
        }

        Map<String, Object> data = new HashMap<>();
        data.put("list", students);
        data.put("total", studentPage.getTotal());
        data.put("pageNumber", pageNumber);
        data.put("pageSize", pageSize);

        return Result.success(data);
    }

    /**
     * Get student detail
     */
    @GetMapping("/students/{id}")
    public Result<Student> getStudentDetail(@PathVariable Integer id) {
        Student student = studentUserMapper.selectById(id);
        if (student != null && StringUtils.hasText(student.getStudentsPassword())) {
            // 判断是否是BCrypt加密
            if (student.getStudentsPassword().startsWith("$2a$") ||
                    student.getStudentsPassword().startsWith("$2b$") ||
                    student.getStudentsPassword().startsWith("$2y$")) {
                student.setStudentsPassword("[BCrypt加密-无法查看]");
            } else {
                // AES加密可以解密
                try {
                    String decrypted = AESUtil.decrypt(student.getStudentsPassword());
                    student.setStudentsPassword(decrypted != null ? decrypted : "[解密失败]");
                } catch (Exception e) {
                    student.setStudentsPassword("[解密失败]");
                }
            }
        }
        if (student == null) {
            return Result.error("学生不存在");
        }
        return Result.success(student);
    }

    /**
     * Create student
     */
    @PostMapping("/students")
    public Result<Integer> createStudent(@RequestBody Student student) {
        if (StringUtils.hasText(student.getStudentsPassword())) {
            student.setStudentsPassword(AESUtil.encrypt(student.getStudentsPassword()));
        }
        studentUserMapper.insert(student);
        return Result.success(student.getStudentsId());
    }

    /**
     * Update student info
     */
    @PutMapping("/students/{id}")
    public Result<Void> updateStudent(@PathVariable Integer id, @RequestBody Student student) {
        student.setStudentsId(id);
        if (StringUtils.hasText(student.getStudentsPassword())) {
            student.setStudentsPassword(AESUtil.encrypt(student.getStudentsPassword()));
        }
        studentUserMapper.updateById(student);
        return Result.success();
    }

    /**
     * Delete student
     */
    @DeleteMapping("/students/{id}")
    public Result<Void> deleteStudent(@PathVariable Integer id) {
        studentUserMapper.deleteById(id);
        return Result.success();
    }

    /**
     * Batch delete students
     */
    @PostMapping("/students/batch-delete")
    public Result<Void> batchDeleteStudents(@RequestBody Map<String, List<Integer>> data) {
        List<Integer> ids = data.get("ids");
        if (ids != null && !ids.isEmpty()) {
            studentUserMapper.deleteBatchIds(ids);
        }
        return Result.success();
    }

    /**
     * Reset student password
     */
    @PutMapping("/students/{id}/reset-password")
    public Result<String> resetStudentPassword(@PathVariable Integer id) {
        Student student = new Student();
        student.setStudentsId(id);
        student.setStudentsPassword(AESUtil.encrypt("123456")); // Default password encrypted
        studentUserMapper.updateById(student);
        // 返回新密码，让前端可以立即更新显示
        return Result.success("密码已重置为: 123456", "123456");
    }

    /**
     * Get teacher list
     */
    @GetMapping("/teachers")
    public Result<Map<String, Object>> getTeacherList(
            @RequestParam(defaultValue = "1") Integer pageNumber,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String keyword) {
        Page<Teacher> page = new Page<>(pageNumber, pageSize);
        LambdaQueryWrapper<Teacher> queryWrapper = new LambdaQueryWrapper<>();

        if (StringUtils.hasText(keyword)) {
            queryWrapper.and(w -> w
                    .like(Teacher::getTeacherUsername, keyword)
                    .or()
                    .like(Teacher::getTeacherEmail, keyword));
        }

        queryWrapper.orderByDesc(Teacher::getTeacherId);
        Page<Teacher> teacherPage = teacherUserMapper.selectPage(page, queryWrapper);

        List<Teacher> teachers = teacherPage.getRecords();
        // 处理密码显示：BCrypt无法解密，AES可以解密
        for (Teacher t : teachers) {
            if (StringUtils.hasText(t.getTeacherPassword())) {
                String pwd = t.getTeacherPassword();
                // 判断是否是BCrypt加密（以$2a$、$2b$或$2y$开头）
                if (pwd.startsWith("$2a$") || pwd.startsWith("$2b$") || pwd.startsWith("$2y$")) {
                    t.setTeacherPassword("[BCrypt加密-无法查看]");
                } else {
                    // AES加密可以解密
                    try {
                        String decrypted = AESUtil.decrypt(pwd);
                        if (decrypted != null && !decrypted.isEmpty()) {
                            t.setTeacherPassword(decrypted);
                        } else {
                            // 显示原始密码的前几个字符以便诊断
                            String preview = pwd.length() > 10 ? pwd.substring(0, 10) + "..." : pwd;
                            t.setTeacherPassword("[解密失败: " + preview + "]");
                        }
                    } catch (Exception e) {
                        String preview = pwd.length() > 10 ? pwd.substring(0, 10) + "..." : pwd;
                        t.setTeacherPassword("[异常: " + preview + "]");
                    }
                }
            } else {
                t.setTeacherPassword("[空密码]");
            }
        }

        Map<String, Object> data = new HashMap<>();
        data.put("list", teachers);
        data.put("total", teacherPage.getTotal());
        data.put("pageNumber", pageNumber);
        data.put("pageSize", pageSize);

        return Result.success(data);
    }

    /**
     * Get teacher detail
     */
    @GetMapping("/teachers/{id}")
    public Result<Teacher> getTeacherDetail(@PathVariable Integer id) {
        Teacher teacher = teacherUserMapper.selectById(id);
        if (teacher != null && StringUtils.hasText(teacher.getTeacherPassword())) {
            // 判断是否是BCrypt加密
            if (teacher.getTeacherPassword().startsWith("$2a$") ||
                    teacher.getTeacherPassword().startsWith("$2b$") ||
                    teacher.getTeacherPassword().startsWith("$2y$")) {
                teacher.setTeacherPassword("[BCrypt加密-无法查看]");
            } else {
                // AES加密可以解密
                try {
                    String decrypted = AESUtil.decrypt(teacher.getTeacherPassword());
                    teacher.setTeacherPassword(decrypted != null ? decrypted : "[解密失败]");
                } catch (Exception e) {
                    teacher.setTeacherPassword("[解密失败]");
                }
            }
        }
        if (teacher == null) {
            return Result.error("教师不存在");
        }
        return Result.success(teacher);
    }

    /**
     * Create teacher
     */
    @PostMapping("/teachers")
    public Result<Integer> createTeacher(@RequestBody Teacher teacher) {
        if (StringUtils.hasText(teacher.getTeacherPassword())) {
            teacher.setTeacherPassword(AESUtil.encrypt(teacher.getTeacherPassword()));
        }
        teacherUserMapper.insert(teacher);
        return Result.success(teacher.getTeacherId());
    }

    /**
     * Update teacher info
     */
    @PutMapping("/teachers/{id}")
    public Result<Void> updateTeacher(@PathVariable Integer id, @RequestBody Teacher teacher) {
        teacher.setTeacherId(id);
        if (StringUtils.hasText(teacher.getTeacherPassword())) {
            teacher.setTeacherPassword(AESUtil.encrypt(teacher.getTeacherPassword()));
        }
        teacherUserMapper.updateById(teacher);
        return Result.success();
    }

    /**
     * Delete teacher
     */
    @DeleteMapping("/teachers/{id}")
    public Result<Void> deleteTeacher(@PathVariable Integer id) {
        teacherUserMapper.deleteById(id);
        return Result.success();
    }

    /**
     * Batch delete teachers
     */
    @PostMapping("/teachers/batch-delete")
    public Result<Void> batchDeleteTeachers(@RequestBody Map<String, List<Integer>> data) {
        List<Integer> ids = data.get("ids");
        if (ids != null && !ids.isEmpty()) {
            teacherUserMapper.deleteBatchIds(ids);
        }
        return Result.success();
    }

    /**
     * Reset teacher password
     */
    @PutMapping("/teachers/{id}/reset-password")
    public Result<String> resetTeacherPassword(@PathVariable Integer id) {
        Teacher teacher = new Teacher();
        teacher.setTeacherId(id);
        teacher.setTeacherPassword(AESUtil.encrypt("123456")); // Default password encrypted
        teacherUserMapper.updateById(teacher);
        // 返回新密码，让前端可以立即更新显示
        return Result.success("密码已重置为: 123456", "123456");
    }
}
