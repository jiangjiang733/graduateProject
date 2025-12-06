package com.example.project.entity.enrollment;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.io.Serializable;
import java.util.Date;

/**
 * 课程报名实体类
 */
@Data
@TableName("course_enrollment")
public class CourseEnrollment implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 报名ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;
    
    /**
     * 学生ID
     */
    private String studentId;
    
    /**
     * 学生姓名
     */
    private String studentName;
    
    /**
     * 学生邮箱
     */
    private String studentEmail;
    
    /**
     * 课程ID
     */
    private String courseId;
    
    /**
     * 课程名称
     */
    private String courseName;
    
    /**
     * 教师ID
     */
    private String teacherId;
    
    /**
     * 状态: pending(待审核)/approved(已通过)/rejected(已拒绝)
     */
    private String status;
    
    /**
     * 申请时间
     */
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date applyTime;
    
    /**
     * 审核时间
     */
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date reviewTime;
    
    /**
     * 拒绝原因
     */
    private String rejectReason;
}
