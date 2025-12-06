package com.example.project.service;

import com.example.project.dto.DashboardStatisticsDTO;
import com.example.project.dto.TodoItemDTO;
import com.example.project.entity.course.Course;

import java.util.List;
import java.util.Map;

/**
 * Dashboard服务接口
 */
public interface DashboardService {
    
    /**
     * 获取统计数据
     */
    DashboardStatisticsDTO getStatistics(String teacherId);
    
    /**
     * 获取最近课程
     */
    List<Course> getRecentCourses(String teacherId, Integer limit);
    
    /**
     * 获取待办事项
     */
    List<TodoItemDTO> getTodoList(String teacherId);
    
    /**
     * 获取最近留言
     */
    List<Map<String, Object>> getRecentMessages(String teacherId, Integer limit);
    
    /**
     * 获取本周课程表
     */
    List<Map<String, Object>> getWeekSchedule(String teacherId);
}
