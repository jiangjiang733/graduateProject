package com.example.project.controller.admin;

import com.example.project.common.Result;
import com.example.project.entity.Student;
import com.example.project.entity.Teacher;
import com.example.project.mapper.StudentUserMapper;
import com.example.project.mapper.TeacherUserMapper;
import com.example.project.util.AESUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * 密码诊断和修复工具
 */
@RestController
@RequestMapping("/api/admin/password-diagnostic")
@CrossOrigin(origins = "*")
public class PasswordDiagnosticController {

    @Autowired
    private StudentUserMapper studentUserMapper;

    @Autowired
    private TeacherUserMapper teacherUserMapper;

    /**
     * 诊断密码加密状态
     */
    @GetMapping("/diagnose")
    public Result<Map<String, Object>> diagnose() {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, String>> studentDiagnosis = new ArrayList<>();
        List<Map<String, String>> teacherDiagnosis = new ArrayList<>();

        // 诊断学生密码
        List<Student> students = studentUserMapper.selectList(null);
        for (Student s : students) {
            Map<String, String> info = new HashMap<>();
            info.put("id", String.valueOf(s.getStudentsId()));
            info.put("username", s.getStudentsUsername());

            String pwd = s.getStudentsPassword();
            if (pwd == null || pwd.isEmpty()) {
                info.put("status", "空密码");
                info.put("raw", "null");
                info.put("decrypted", "N/A");
            } else if (pwd.startsWith("$2a$") || pwd.startsWith("$2b$") || pwd.startsWith("$2y$")) {
                info.put("status", "BCrypt格式");
                info.put("raw", pwd.substring(0, Math.min(20, pwd.length())) + "...");
                info.put("decrypted", "无法解密");
            } else {
                info.put("raw", pwd);
                try {
                    String decrypted = AESUtil.decrypt(pwd);
                    if (decrypted != null) {
                        info.put("status", "AES加密");
                        info.put("decrypted", decrypted);
                    } else {
                        info.put("status", "AES解密返回null");
                        info.put("decrypted", "null");
                    }
                } catch (Exception e) {
                    info.put("status", "AES解密异常: " + e.getMessage());
                    info.put("decrypted", "异常");
                }
            }
            studentDiagnosis.add(info);
        }

        // 诊断教师密码
        List<Teacher> teachers = teacherUserMapper.selectList(null);
        for (Teacher t : teachers) {
            Map<String, String> info = new HashMap<>();
            info.put("id", String.valueOf(t.getTeacherId()));
            info.put("username", t.getTeacherUsername());

            String pwd = t.getTeacherPassword();
            if (pwd == null || pwd.isEmpty()) {
                info.put("status", "空密码");
                info.put("raw", "null");
                info.put("decrypted", "N/A");
            } else if (pwd.startsWith("$2a$") || pwd.startsWith("$2b$") || pwd.startsWith("$2y$")) {
                info.put("status", "BCrypt格式");
                info.put("raw", pwd.substring(0, Math.min(20, pwd.length())) + "...");
                info.put("decrypted", "无法解密");
            } else {
                info.put("raw", pwd);
                try {
                    String decrypted = AESUtil.decrypt(pwd);
                    if (decrypted != null) {
                        info.put("status", "AES加密");
                        info.put("decrypted", decrypted);
                    } else {
                        info.put("status", "AES解密返回null");
                        info.put("decrypted", "null");
                    }
                } catch (Exception e) {
                    info.put("status", "AES解密异常: " + e.getMessage());
                    info.put("decrypted", "异常");
                }
            }
            teacherDiagnosis.add(info);
        }

        result.put("students", studentDiagnosis);
        result.put("teachers", teacherDiagnosis);
        result.put("aesKey", "graduation_proj_");
        result.put("defaultPasswordEncrypted", AESUtil.encrypt("123456"));

        return Result.success(result);
    }

    /**
     * 批量修复密码 - 将所有密码重置为AES加密的123456
     */
    @PostMapping("/fix-all")
    public Result<Map<String, Object>> fixAll() {
        String defaultPassword = AESUtil.encrypt("123456");

        int studentCount = 0;
        int teacherCount = 0;

        // 修复学生密码
        List<Student> students = studentUserMapper.selectList(null);
        for (Student s : students) {
            Student update = new Student();
            update.setStudentsId(s.getStudentsId());
            update.setStudentsPassword(defaultPassword);
            studentUserMapper.updateById(update);
            studentCount++;
        }

        // 修复教师密码
        List<Teacher> teachers = teacherUserMapper.selectList(null);
        for (Teacher t : teachers) {
            Teacher update = new Teacher();
            update.setTeacherId(t.getTeacherId());
            update.setTeacherPassword(defaultPassword);
            teacherUserMapper.updateById(update);
            teacherCount++;
        }

        Map<String, Object> result = new HashMap<>();
        result.put("studentFixed", studentCount);
        result.put("teacherFixed", teacherCount);
        result.put("defaultPassword", "123456");
        result.put("message", "所有密码已重置为: 123456");

        return Result.success(result);
    }
}
