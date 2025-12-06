package com.example.project.service.course;

import com.example.project.entity.course.CourseSchedule;

import java.util.List;
import java.util.Map;

public interface CourseScheduleService {

    /**
     * 添加课程时间
     * @param schedule 课程时间信息
     * @return 添加后的课程时间
     */
    CourseSchedule addSchedule(CourseSchedule schedule);

    /**
     * 获取课程的所有时间安排
     * @param courseId 课程ID
     * @return 课程时间列表
     */
    List<CourseSchedule> getCourseSchedules(String courseId);

    /**
     * 更新课程时间
     * @param schedule 课程时间信息
     * @return 更新后的课程时间
     */
    CourseSchedule updateSchedule(CourseSchedule schedule);

    /**
     * 删除课程时间
     * @param scheduleId 时间表ID
     */
    void deleteSchedule(Long scheduleId);

    /**
     * 获取学生的课程表
     * @param studentId 学生ID
     * @param week 周数
     * @return 课程表数据，按星期和节次组织
     */
    Map<Integer, Map<Integer, Map<String, Object>>> getStudentSchedule(String studentId, Integer week);

    /**
     * 检查时间冲突
     * @param schedule 课程时间信息
     * @return 是否有冲突
     */
    boolean hasConflict(CourseSchedule schedule);
}
