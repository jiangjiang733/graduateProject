package com.example.project.mapper.course;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.project.entity.course.CourseSchedule;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 课程时间表Mapper接口
 */
@Mapper
public interface CourseScheduleMapper extends BaseMapper<CourseSchedule> {

    /**
     * 查找时间冲突的课程
     * @param courseId 课程ID
     * @param dayOfWeek 星期几
     * @param startSection 开始节次
     * @param endSection 结束节次
     * @param startWeek 开始周数
     * @param endWeek 结束周数
     * @return 冲突的课程时间列表
     */
    @Select("SELECT * FROM course_schedule " +
            "WHERE course_id = #{courseId} " +
            "AND day_of_week = #{dayOfWeek} " +
            "AND status = 1 " +
            "AND NOT (end_section < #{startSection} OR start_section > #{endSection}) " +
            "AND NOT (end_week < #{startWeek} OR start_week > #{endWeek})")
    List<CourseSchedule> findConflicts(
            @Param("courseId") String courseId,
            @Param("dayOfWeek") Integer dayOfWeek,
            @Param("startSection") Integer startSection,
            @Param("endSection") Integer endSection,
            @Param("startWeek") Integer startWeek,
            @Param("endWeek") Integer endWeek
    );

    /**
     * 查找学生的课程表
     * @param studentId 学生ID
     * @param week 周数
     * @return 学生的课程时间列表
     */
    @Select("SELECT cs.* FROM course_schedule cs " +
            "INNER JOIN student_course sc ON cs.course_id = sc.course_id " +
            "WHERE sc.student_id = #{studentId} " +
            "AND cs.status = 1 " +
            "AND cs.start_week <= #{week} " +
            "AND cs.end_week >= #{week} " +
            "ORDER BY cs.day_of_week, cs.start_section")
    List<CourseSchedule> findStudentSchedule(
            @Param("studentId") String studentId,
            @Param("week") Integer week
    );
}
