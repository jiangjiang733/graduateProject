package com.example.project.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * 邮件服务类
 */
@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    /**
     * 发送验证码邮件
     * 
     * @param toEmail 收件人邮箱
     * @param code    验证码
     * @param type    类型（register、reset 或 update）
     */
    public void sendVerificationCode(String toEmail, String code, String type) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);

            if ("register".equals(type)) {
                message.setSubject("注册验证码");
                message.setText("您好！\n\n您正在注册账号。\n\n您的验证码是：" + code + "\n 验证码有效期为5分钟，请及时使用。\n\n如果这不是您本人的操作，请忽略此邮件。\n\n智能教室系统团队");
            } else if ("reset".equals(type)) {
                message.setSubject("密码重置验证码");
                message.setText("您好！\n\n您正在重置账号密码。\n\n您的验证码是：" + code + "\n 验证码有效期为5分钟，请及时使用。\n\n如果这不是您本人的操作，请立即修改密码以保护账号安全。\n\n智能教室系统团队");
            } else if ("update".equals(type)) {
                message.setSubject("邮箱修改验证码");
                message.setText("您好！\n\n您正在修改账号的邮箱地址。\n\n您的验证码是：" + code + "\n 验证码有效期为5分钟，请及时使用。\n\n如果这不是您本人的操作，请立即检查账号安全。\n\n智能教室系统团队");
            } else {
                throw new IllegalArgumentException("不支持的邮件类型: " + type);
            }

            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("邮件发送失败: " + e.getMessage(), e);
        }
    }

    /**
     * 发送普通邮件
     * 
     * @param toEmail 收件人邮箱
     * @param subject 邮件主题
     * @param content 邮件内容
     */
    public void sendSimpleEmail(String toEmail, String subject, String content) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(content);

            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("邮件发送失败: " + e.getMessage(), e);
        }
    }
}
