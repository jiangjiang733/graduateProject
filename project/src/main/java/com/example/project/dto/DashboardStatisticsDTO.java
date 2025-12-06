package com.example.project.dto;

import lombok.Data;

/**
 * Dashboard统计数据DTO
 */
@Data
public class DashboardStatisticsDTO {
    
    /**
     * 课程总数
     */
    private Integer courseCount;
    
    /**
     * 学生总数
     */
    private Integer studentCount;
    
    /**
     * 待批改作业数
     */
    private Integer pendingHomeworkCount;
    
    /**
     * 待处理留言数
     */
    private Integer unreadMessageCount;
    
    /**
     * 进行中的考试数
     */
    private Integer ongoingExamCount;
    
    /**
     * 今日新增学生数
     */
    private Integer todayNewStudentCount;
}
