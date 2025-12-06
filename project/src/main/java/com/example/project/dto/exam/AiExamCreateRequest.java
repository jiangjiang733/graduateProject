package com.example.project.dto.exam;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.util.Date;

/**
 * AI创建考试请求DTO
 */
@Data
public class AiExamCreateRequest {
    
    /**
     * 课程ID
     */
    private String courseId;
    
    /**
     * 教师ID
     */
    private String teacherId;
    
    /**
     * 考试标题
     */
    private String examTitle;
    
    /**
     * 课程名称（用于AI生成）
     */
    private String courseName;
    
    /**
     * 题目数量
     */
    private Integer questionCount = 5;
    
    /**
     * 题型（逗号分隔：SINGLE,MULTIPLE,JUDGE）
     */
    private String questionTypes = "SINGLE,MULTIPLE";
    
    /**
     * 开始时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date startTime;
    
    /**
     * 结束时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date endTime;
}
