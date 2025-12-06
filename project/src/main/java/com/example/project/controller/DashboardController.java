package com.example.project.controller;

import com.example.project.common.Result;
import com.example.project.dto.DashboardStatisticsDTO;
import com.example.project.dto.TodoItemDTO;
import com.example.project.entity.course.Course;
import com.example.project.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 教师主页Dashboard控制器
 */
@RestController
@RequestMapping("/api/teacher")
@CrossOrigin(origins = "*")
public class DashboardController {
    
    @Autowired
    private DashboardService dashboardService;
    
    /**
     * 获取教师主页数据
     */
    @GetMapping("/dashboard")
    public Result<Map<String, Object>> getDashboardData(@RequestParam String teacherId) {
        try {
            Map<String, Object> data = new HashMap<>();
            
            // 获取统计数据
            DashboardStatisticsDTO statistics = dashboardService.getStatistics(teacherId);
            data.put("statistics", statistics);
            
            // 获取最近课程
            List<Course> recentCourses = dashboardService.getRecentCourses(teacherId, 5);
            data.put("recentCourses", recentCourses);
            
            // 获取待办事项
            List<TodoItemDTO> todoList = dashboardService.getTodoList(teacherId);
            data.put("todoList", todoList);
            
            // 获取最近留言
            List<Map<String, Object>> recentMessages = dashboardService.getRecentMessages(teacherId, 5);
            data.put("recentMessages", recentMessages);
            
            // 获取本周课程表
            List<Map<String, Object>> weekSchedule = dashboardService.getWeekSchedule(teacherId);
            data.put("weekSchedule", weekSchedule);
            
            return Result.success(data);
        } catch (Exception e) {
            e.printStackTrace();
            return Result.error("获取主页数据失败: " + e.getMessage());
        }
    }
    
    /**
     * 获取统计数据
     */
    @GetMapping("/statistics")
    public Result<DashboardStatisticsDTO> getStatistics(@RequestParam String teacherId) {
        try {
            DashboardStatisticsDTO statistics = dashboardService.getStatistics(teacherId);
            return Result.success(statistics);
        } catch (Exception e) {
            return Result.error("获取统计数据失败: " + e.getMessage());
        }
    }
    
    /**
     * 获取最近课程
     */
    @GetMapping("/recent-courses")
    public Result<List<Course>> getRecentCourses(
            @RequestParam String teacherId,
            @RequestParam(defaultValue = "5") Integer limit) {
        try {
            List<Course> courses = dashboardService.getRecentCourses(teacherId, limit);
            return Result.success(courses);
        } catch (Exception e) {
            return Result.error("获取最近课程失败: " + e.getMessage());
        }
    }
    
    /**
     * 获取待办事项
     */
    @GetMapping("/todo-list")
    public Result<List<TodoItemDTO>> getTodoList(@RequestParam String teacherId) {
        try {
            List<TodoItemDTO> todoList = dashboardService.getTodoList(teacherId);
            return Result.success(todoList);
        } catch (Exception e) {
            return Result.error("获取待办事项失败: " + e.getMessage());
        }
    }
    
    /**
     * 获取最近留言
     */
    @GetMapping("/recent-messages")
    public Result<List<Map<String, Object>>> getRecentMessages(
            @RequestParam String teacherId,
            @RequestParam(defaultValue = "5") Integer limit) {
        try {
            List<Map<String, Object>> messages = dashboardService.getRecentMessages(teacherId, limit);
            return Result.success(messages);
        } catch (Exception e) {
            return Result.error("获取最近留言失败: " + e.getMessage());
        }
    }
    
    /**
     * 获取本周课程表
     */
    @GetMapping("/week-schedule")
    public Result<List<Map<String, Object>>> getWeekSchedule(@RequestParam String teacherId) {
        try {
            List<Map<String, Object>> schedule = dashboardService.getWeekSchedule(teacherId);
            return Result.success(schedule);
        } catch (Exception e) {
            return Result.error("获取课程表失败: " + e.getMessage());
        }
    }
}
