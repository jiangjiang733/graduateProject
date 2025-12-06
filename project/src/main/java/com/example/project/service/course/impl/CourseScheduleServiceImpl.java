package com.example.project.service.course.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.project.entity.course.Course;
import com.example.project.entity.course.CourseSchedule;
import com.example.project.mapper.course.CourseMapper;
import com.example.project.mapper.course.CourseScheduleMapper;
import com.example.project.service.course.CourseScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class CourseScheduleServiceImpl implements CourseScheduleService {

    @Autowired
    private CourseScheduleMapper scheduleMapper;

    @Autowired
    private CourseMapper courseMapper;

    @Override
    @Transactional
    public CourseSchedule addSchedule(CourseSchedule schedule) {
        // 验证参数
        validateSchedule(schedule);

        // 检查时间冲突
        if (hasConflict(schedule)) {
            throw new IllegalArgumentException("该时间段已有其他课程安排，存在冲突");
        }

        // 设置默认值
        if (schedule.getStatus() == null) {
            schedule.setStatus(1);
        }
        if (schedule.getCreateTime() == null) {
            schedule.setCreateTime(LocalDateTime.now());
        }
        if (schedule.getUpdateTime() == null) {
            schedule.setUpdateTime(LocalDateTime.now());
        }

        // 保存
        scheduleMapper.insert(schedule);
        return schedule;
    }

    @Override
    public List<CourseSchedule> getCourseSchedules(String courseId) {
        QueryWrapper<CourseSchedule> wrapper = new QueryWrapper<>();
        wrapper.eq("course_id", courseId)
                .eq("status", 1)
                .orderByAsc("day_of_week", "start_section");
        return scheduleMapper.selectList(wrapper);
    }

    @Override
    @Transactional
    public CourseSchedule updateSchedule(CourseSchedule schedule) {
        // 验证参数
        validateSchedule(schedule);

        // 检查时间冲突（排除自己）
        List<CourseSchedule> conflicts = scheduleMapper.findConflicts(
                schedule.getCourseId(),
                schedule.getDayOfWeek(),
                schedule.getStartSection(),
                schedule.getEndSection(),
                schedule.getStartWeek(),
                schedule.getEndWeek()
        );

        // 过滤掉自己
        conflicts.removeIf(s -> s.getScheduleId().equals(schedule.getScheduleId()));

        if (!conflicts.isEmpty()) {
            throw new IllegalArgumentException("该时间段已有其他课程安排，存在冲突");
        }

        schedule.setUpdateTime(LocalDateTime.now());
        scheduleMapper.updateById(schedule);
        return schedule;
    }

    @Override
    @Transactional
    public void deleteSchedule(Long scheduleId) {
        CourseSchedule schedule = scheduleMapper.selectById(scheduleId);
        if (schedule == null) {
            throw new IllegalArgumentException("课程时间不存在");
        }

        // 软删除
        schedule.setStatus(0);
        schedule.setUpdateTime(LocalDateTime.now());
        scheduleMapper.updateById(schedule);
    }

    @Override
    public Map<Integer, Map<Integer, Map<String, Object>>> getStudentSchedule(String studentId, Integer week) {
        System.out.println("Service: 查询学生课程表");
        System.out.println("  学生ID: " + studentId);
        System.out.println("  周数: " + week);
        
        // 获取学生的课程表
        List<CourseSchedule> schedules = scheduleMapper.findStudentSchedule(studentId, week);
        System.out.println("  查询到 " + schedules.size() + " 条课程时间记录");

        // 组织数据结构：{dayOfWeek: {section: {courseInfo}}}
        Map<Integer, Map<Integer, Map<String, Object>>> scheduleMap = new HashMap<>();

        for (CourseSchedule schedule : schedules) {
            System.out.println("  处理课程: " + schedule.getCourseId() + 
                             ", 星期" + schedule.getDayOfWeek() + 
                             ", 第" + schedule.getStartSection() + "-" + schedule.getEndSection() + "节");
            
            // 获取课程信息
            Course course = courseMapper.selectById(schedule.getCourseId());
            if (course == null) {
                System.out.println("    警告: 课程不存在，跳过");
                continue;
            }
            
            System.out.println("    课程名称: " + course.getCourseName());

            // 为每个节次创建课程信息
            for (int section = schedule.getStartSection(); section <= schedule.getEndSection(); section++) {
                scheduleMap
                        .computeIfAbsent(schedule.getDayOfWeek(), k -> new HashMap<>())
                        .put(section, createCourseInfo(schedule, course));
            }
        }

        System.out.println("Service: 课程表组织完成，共 " + scheduleMap.size() + " 天有课");
        return scheduleMap;
    }

    @Override
    public boolean hasConflict(CourseSchedule schedule) {
        List<CourseSchedule> conflicts = scheduleMapper.findConflicts(
                schedule.getCourseId(),
                schedule.getDayOfWeek(),
                schedule.getStartSection(),
                schedule.getEndSection(),
                schedule.getStartWeek(),
                schedule.getEndWeek()
        );
        return !conflicts.isEmpty();
    }

    /**
     * 验证课程时间参数
     */
    private void validateSchedule(CourseSchedule schedule) {
        if (schedule.getCourseId() == null || schedule.getCourseId().isEmpty()) {
            throw new IllegalArgumentException("课程ID不能为空");
        }

        if (schedule.getDayOfWeek() == null || schedule.getDayOfWeek() < 1 || schedule.getDayOfWeek() > 7) {
            throw new IllegalArgumentException("星期必须在1-7之间");
        }

        if (schedule.getStartSection() == null || schedule.getStartSection() < 1 || schedule.getStartSection() > 12) {
            throw new IllegalArgumentException("开始节次必须在1-12之间");
        }

        if (schedule.getEndSection() == null || schedule.getEndSection() < 1 || schedule.getEndSection() > 12) {
            throw new IllegalArgumentException("结束节次必须在1-12之间");
        }

        if (schedule.getStartSection() > schedule.getEndSection()) {
            throw new IllegalArgumentException("开始节次不能大于结束节次");
        }

        if (schedule.getStartWeek() == null || schedule.getStartWeek() < 1) {
            throw new IllegalArgumentException("开始周数必须大于0");
        }

        if (schedule.getEndWeek() == null || schedule.getEndWeek() < 1) {
            throw new IllegalArgumentException("结束周数必须大于0");
        }

        if (schedule.getStartWeek() > schedule.getEndWeek()) {
            throw new IllegalArgumentException("开始周数不能大于结束周数");
        }
    }

    /**
     * 创建课程信息对象
     */
    private Map<String, Object> createCourseInfo(CourseSchedule schedule, Course course) {
        Map<String, Object> info = new HashMap<>();
        info.put("courseId", course.getId());
        info.put("courseName", course.getCourseName());
        info.put("teacherName", course.getTeacherName());
        info.put("location", schedule.getLocation());
        info.put("scheduleId", schedule.getScheduleId());
        info.put("startSection", schedule.getStartSection());
        info.put("endSection", schedule.getEndSection());
        return info;
    }
}
