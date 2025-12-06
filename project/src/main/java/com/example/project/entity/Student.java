package com.example.project.entity;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Getter;
import lombok.Setter;
@Setter
@Getter
@TableName("student_user")
public class Student {
    @TableId(type = IdType.AUTO)
    private Integer studentsId;    // 学生ID，主键
    private String studentsUsername;       // 用户名
    private String studentsPassword;       // 密码
    private String studentsEmail;   // 学生邮箱
    private String studentsHead;//学生头像
    private String studentsBirthday;//学生出生日期
    private String studentSex;//学生性别
    @Override
    public String toString() {
        return "StudentUser{" +
                "studentsId=" + studentsId +
                ", students_username='" + studentsUsername + '\'' +
                ", students_password='" + studentsPassword + '\'' +
                ", students_email='" + studentsEmail + '\'' +
                '}';
    }
}