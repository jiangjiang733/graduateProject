package com.example.project.dto.enrollment;

import lombok.Data;

import java.io.Serializable;

/**
 * 报名申请DTO
 */
@Data
public class EnrollmentApplyDTO implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 学生ID
     */
    private String studentId;
    
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
}
