package com.example.project.dto;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 待办事项DTO
 */
@Data
public class TodoItemDTO {
    
    /**
     * 待办类型：HOMEWORK-作业批改，EXAM-考试批改，MESSAGE-留言回复
     */
    private String type;
    
    /**
     * 待办标题
     */
    private String title;
    
    /**
     * 待办描述
     */
    private String description;
    
    /**
     * 关联ID（作业ID、考试ID、留言ID）
     */
    private Long relatedId;
    
    /**
     * 课程名称
     */
    private String courseName;
    
    /**
     * 截止时间
     */
    private LocalDateTime deadline;
    
    /**
     * 待处理数量
     */
    private Integer count;
    
    /**
     * 优先级：HIGH-高，MEDIUM-中，LOW-低
     */
    private String priority;
}
