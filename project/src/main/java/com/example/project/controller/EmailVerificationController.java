package com.example.project.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.project.common.Result;
import com.example.project.entity.Student;
import com.example.project.entity.Teacher;
import com.example.project.mapper.StudentUserMapper;
import com.example.project.mapper.TeacherUserMapper;
import com.example.project.service.EmailService;
import com.example.project.service.VerificationCodeService;
import com.example.project.util.AESUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 邮箱验证与密码找回控制器
 */
@RestController
@RequestMapping("/api/email")
public class EmailVerificationController {

    @Autowired
    private EmailService emailService;

    @Autowired
    private VerificationCodeService verificationCodeService;

    @Autowired
    private StudentUserMapper studentUserMapper;

    @Autowired
    private TeacherUserMapper teacherUserMapper;

    /**
     * 发送注册验证码
     * 
     * @param requestData 包含 email 和 userType (student/teacher)
     */
    @PostMapping("/send-register-code")
    public Result<String> sendRegisterCode(@RequestBody Map<String, String> requestData) {
        try {
            String email = requestData.get("email");
            String userType = requestData.get("userType"); // student 或 teacher

            if (email == null || email.trim().isEmpty()) {
                return Result.error("邮箱不能为空");
            }

            // 检查邮箱是否已被注册
            if ("student".equals(userType)) {
                QueryWrapper<Student> wrapper = new QueryWrapper<>();
                wrapper.eq("students_email", email);
                if (studentUserMapper.selectCount(wrapper) > 0) {
                    return Result.error("该邮箱已被注册");
                }
            } else if ("teacher".equals(userType)) {
                QueryWrapper<Teacher> wrapper = new QueryWrapper<>();
                wrapper.eq("teacher_email", email);
                if (teacherUserMapper.selectCount(wrapper) > 0) {
                    return Result.error("该邮箱已被注册");
                }
            }

            // 生成验证码
            String code = verificationCodeService.generateAndStore(email, "register");

            // 发送邮件
            emailService.sendVerificationCode(email, code, "register");

            return Result.success("验证码已发送到您的邮箱，请注意查收");
        } catch (Exception e) {
            return Result.error("验证码发送失败: " + e.getMessage());
        }
    }

    /**
     * 验证注册验证码
     * 
     * @param requestData 包含 email 和 code
     */
    @PostMapping("/verify-register-code")
    public Result<String> verifyRegisterCode(@RequestBody Map<String, String> requestData) {
        try {
            String email = requestData.get("email");
            String code = requestData.get("code");

            if (email == null || code == null) {
                return Result.error("邮箱和验证码不能为空");
            }

            boolean isValid = verificationCodeService.verify(email, "register", code);

            if (isValid) {
                return Result.success("验证码验证成功");
            } else {
                return Result.error("验证码错误或已过期");
            }
        } catch (Exception e) {
            return Result.error("验证失败: " + e.getMessage());
        }
    }

    /**
     * 发送密码找回验证码
     * 
     * @param requestData 包含 email 和 userType (student/teacher)
     */
    @PostMapping("/send-reset-code")
    public Result<String> sendResetCode(@RequestBody Map<String, String> requestData) {
        try {
            String email = requestData.get("email");
            String userType = requestData.get("userType");

            if (email == null || email.trim().isEmpty()) {
                return Result.error("邮箱不能为空");
            }

            // 检查邮箱是否已注册
            boolean emailExists = false;
            if ("student".equals(userType)) {
                QueryWrapper<Student> wrapper = new QueryWrapper<>();
                wrapper.eq("students_email", email);
                emailExists = studentUserMapper.selectCount(wrapper) > 0;
            } else if ("teacher".equals(userType)) {
                QueryWrapper<Teacher> wrapper = new QueryWrapper<>();
                wrapper.eq("teacher_email", email);
                emailExists = teacherUserMapper.selectCount(wrapper) > 0;
            }

            if (!emailExists) {
                return Result.error("该邮箱未注册");
            }

            // 生成验证码
            String code = verificationCodeService.generateAndStore(email, "reset");

            // 发送邮件
            emailService.sendVerificationCode(email, code, "reset");

            return Result.success("验证码已发送到您的邮箱，请注意查收");
        } catch (Exception e) {
            return Result.error("验证码发送失败: " + e.getMessage());
        }
    }

    /**
     * 验证密码找回验证码并重置密码
     * 
     * @param requestData 包含 email, code, newPassword 和 userType
     */
    @PostMapping("/reset-password")
    public Result<String> resetPassword(@RequestBody Map<String, String> requestData) {
        try {
            String email = requestData.get("email");
            String code = requestData.get("code");
            String newPassword = requestData.get("newPassword");
            String userType = requestData.get("userType");

            if (email == null || code == null || newPassword == null) {
                return Result.error("邮箱、验证码和新密码不能为空");
            }

            // 验证验证码
            boolean isValid = verificationCodeService.verify(email, "reset", code);
            if (!isValid) {
                return Result.error("验证码错误或已过期");
            }

            // 加密新密码
            String encryptedPassword = AESUtil.encrypt(newPassword);

            // 更新密码
            if ("student".equals(userType)) {
                QueryWrapper<Student> wrapper = new QueryWrapper<>();
                wrapper.eq("students_email", email);
                Student student = studentUserMapper.selectOne(wrapper);
                if (student != null) {
                    student.setStudentsPassword(encryptedPassword);
                    studentUserMapper.updateById(student);
                } else {
                    return Result.error("用户不存在");
                }
            } else if ("teacher".equals(userType)) {
                QueryWrapper<Teacher> wrapper = new QueryWrapper<>();
                wrapper.eq("teacher_email", email);
                Teacher teacher = teacherUserMapper.selectOne(wrapper);
                if (teacher != null) {
                    teacher.setTeacherPassword(encryptedPassword);
                    teacherUserMapper.updateById(teacher);
                } else {
                    return Result.error("用户不存在");
                }
            } else {
                return Result.error("用户类型错误");
            }

            return Result.success("密码重置成功，请使用新密码登录");
        } catch (Exception e) {
            return Result.error("密码重置失败: " + e.getMessage());
        }
    }

    /**
     * 发送修改邮箱验证码
     * 
     * @param requestData 包含 email 和 userType (student/teacher)
     */
    @PostMapping("/send-update-email-code")
    public Result<String> sendUpdateEmailCode(@RequestBody Map<String, String> requestData) {
        try {
            String email = requestData.get("email");
            String userType = requestData.get("userType");

            if (email == null || email.trim().isEmpty()) {
                return Result.error("邮箱不能为空");
            }

            // 检查新邮箱是否已被其他用户使用
            if ("student".equals(userType)) {
                QueryWrapper<Student> wrapper = new QueryWrapper<>();
                wrapper.eq("students_email", email);
                if (studentUserMapper.selectCount(wrapper) > 0) {
                    return Result.error("该邮箱已被使用");
                }
            } else if ("teacher".equals(userType)) {
                QueryWrapper<Teacher> wrapper = new QueryWrapper<>();
                wrapper.eq("teacher_email", email);
                if (teacherUserMapper.selectCount(wrapper) > 0) {
                    return Result.error("该邮箱已被使用");
                }
            }

            // 生成验证码
            String code = verificationCodeService.generateAndStore(email, "update");

            // 发送邮件
            emailService.sendVerificationCode(email, code, "update");

            return Result.success("验证码已发送到您的邮箱，请注意查收");
        } catch (Exception e) {
            return Result.error("验证码发送失败: " + e.getMessage());
        }
    }

    /**
     * 验证并更新邮箱
     * 
     * @param requestData 包含 userId, email, code 和 userType
     */
    @PostMapping("/update-email")
    public Result<String> updateEmail(@RequestBody Map<String, String> requestData) {
        try {
            String userId = requestData.get("userId");
            String email = requestData.get("email");
            String code = requestData.get("code");
            String userType = requestData.get("userType");

            if (userId == null || email == null || code == null) {
                return Result.error("用户ID、邮箱和验证码不能为空");
            }

            // 验证验证码
            boolean isValid = verificationCodeService.verify(email, "update", code);
            if (!isValid) {
                return Result.error("验证码错误或已过期");
            }

            // 更新邮箱
            if ("student".equals(userType)) {
                Student student = studentUserMapper.selectById(userId);
                if (student != null) {
                    student.setStudentsEmail(email);
                    studentUserMapper.updateById(student);
                } else {
                    return Result.error("用户不存在");
                }
            } else if ("teacher".equals(userType)) {
                Teacher teacher = teacherUserMapper.selectById(userId);
                if (teacher != null) {
                    teacher.setTeacherEmail(email);
                    teacherUserMapper.updateById(teacher);
                } else {
                    return Result.error("用户不存在");
                }
            } else {
                return Result.error("用户类型错误");
            }

            return Result.success("邮箱修改成功");
        } catch (Exception e) {
            return Result.error("邮箱修改失败: " + e.getMessage());
        }
    }
}
