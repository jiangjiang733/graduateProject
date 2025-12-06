package com.example.project.dto.enrollment;

import lombok.Data;

import java.io.Serializable;

/**
 * 报名审核DTO
 */
@Data
public class EnrollmentReviewDTO implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 状态: approved(通过)/rejected(拒绝)
     */
    private String status;
    
    /**
     * 拒绝原因（拒绝时必填）
     */
    private String reason;
}
