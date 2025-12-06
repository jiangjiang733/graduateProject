package com.example.project.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.project.dto.DashboardStatisticsDTO;
import com.example.project.dto.TodoItemDTO;
import com.example.project.entity.course.Course;
import com.example.project.mapper.course.CourseMapper;
import com.example.project.mapper.course.CourseScheduleMapper;
import com.example.project.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Dashboard服务实现
 */
@Service
public class DashboardServiceImpl implements DashboardService {
    
    @Autowired
    private CourseMapper courseMapper;
    
    @Autowired(required = false)
    private CourseScheduleMapper courseScheduleMapper;
    
    @Override
    public DashboardStatisticsDTO getStatistics(String teacherId) {
        DashboardStatisticsDTO statistics = new DashboardStatisticsDTO();
        
        try {
            // 获取课程总数
            QueryWrapper<Course> courseWrapper = new QueryWrapper<>();
            courseWrapper.eq("teacher_id", teacherId);
            courseWrapper.eq("state", 1);
            Long courseCount = courseMapper.selectCount(courseWrapper);
            statistics.setCourseCount(courseCount.intValue());
            
            // 获取学生总数（通过student_course表统计）
            // 这里暂时设置为0，后续实现student_course表后再完善
            statistics.setStudentCount(0);
            
            // 获取待批改作业数（通过homework_submission表统计）
            // 暂时设置为0，后续实现homework表后再完善
            statistics.setPendingHomeworkCount(0);
            
            // 获取待处理留言数（通过student_message表统计）
            // 暂时设置为0，后续实现message表后再完善
            statistics.setUnreadMessageCount(0);
            
            // 获取进行中的考试数
            statistics.setOngoingExamCount(0);
            
            // 今日新增学生数
            statistics.setTodayNewStudentCount(0);
            
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        return statistics;
    }
    
    @Override
    public List<Course> getRecentCourses(String teacherId, Integer limit) {
        try {
            QueryWrapper<Course> wrapper = new QueryWrapper<>();
            wrapper.eq("teacher_id", teacherId);
            wrapper.eq("state", 1);
            wrapper.orderByDesc("update_time");
            wrapper.last("LIMIT " + limit);
            
            return courseMapper.selectList(wrapper);
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }
    
    @Override
    public List<TodoItemDTO> getTodoList(String teacherId) {
        List<TodoItemDTO> todoList = new ArrayList<>();
        
        try {
            // 待批改作业（后续实现homework表后完善）
            // 暂时返回空列表
            
            // 即将开始的考试（后续实现exam表后完善）
            
            // 未回复的留言（后续实现message表后完善）
            
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        return todoList;
    }
    
    @Override
    public List<Map<String, Object>> getRecentMessages(String teacherId, Integer limit) {
        List<Map<String, Object>> messages = new ArrayList<>();
        
        try {
            // 从student_message表获取最近留言
            // 后续实现message表后完善
            
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        return messages;
    }
    
    @Override
    public List<Map<String, Object>> getWeekSchedule(String teacherId) {
        List<Map<String, Object>> schedule = new ArrayList<>();
        
        try {
            if (courseScheduleMapper == null) {
                return schedule;
            }
            
            // 获取教师的所有课程
            QueryWrapper<Course> courseWrapper = new QueryWrapper<>();
            courseWrapper.eq("teacher_id", teacherId);
            courseWrapper.eq("state", 1);
            List<Course> courses = courseMapper.selectList(courseWrapper);
            
            if (courses.isEmpty()) {
                return schedule;
            }
            
            // 获取当前周数（简化处理，实际应该根据学期开始时间计算）
            int currentWeek = getCurrentWeek();
            
            // 获取本周的课程安排
            List<String> courseIds = courses.stream()
                    .map(Course::getId)
                    .collect(Collectors.toList());
            
            // 从course_schedule表查询（后续实现）
            // 暂时返回空列表
            
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        return schedule;
    }
    
    /**
     * 获取当前周数（简化实现）
     */
    private int getCurrentWeek() {
        LocalDate now = LocalDate.now();
        LocalDate semesterStart = LocalDate.of(now.getYear(), 9, 1); // 假设9月1日开学
        
        if (now.isBefore(semesterStart)) {
            semesterStart = semesterStart.minusYears(1);
        }
        
        long days = java.time.temporal.ChronoUnit.DAYS.between(semesterStart, now);
        return (int) (days / 7) + 1;
    }
}
