package com.example.project.entity;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Getter;
import lombok.Setter;
@Setter
@Getter
@TableName("teacher_user")
public class Teacher {
    @TableId(type = IdType.AUTO)
    private Integer teacherId;    // 教师ID，主键
    private String teacherUsername;       // 用户名
    private String teacherPassword;       // 密码
    private String teacherEmail;   // 教师邮箱
    private String teacherHead;//教师头像
    private String teacherDepartment;//教师院系
    private String teacherLevel;//教师职级
    private String teacherPhone;//教师电话号码
    @Override
    public String toString() {
        return "teacherUser{" +
                "teacherId=" + teacherId +
                ", teacher_username='" + teacherUsername + '\'' +
                ", teacher_password='" + teacherPassword + '\'' +
                ", teacher_email='" + teacherEmail + '\'' +
                '}';
    }
    }