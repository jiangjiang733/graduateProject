package com.example.project.mapper.course;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.project.entity.course.Course;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

public interface CourseMapper extends BaseMapper<Course> {

    /**
     * 查询所有课程（关联教师信息）
     */
    @Select("SELECT c.*, " +
            "t.teacher_username as teacher_name, " +
            "t.teacher_head as teacher_avatar " +
            "FROM course c " +
            "LEFT JOIN teacher_user t ON c.teacher_id = CAST(t.teacher_id AS CHAR)")
    List<Course> selectAllWithTeacherInfo();

    /**
     * 根据教师ID查询课程（关联教师信息）
     */
    @Select("SELECT c.*, " +
            "t.teacher_username as teacher_name, " +
            "t.teacher_head as teacher_avatar " +
            "FROM course c " +
            "LEFT JOIN teacher_user t ON c.teacher_id = CAST(t.teacher_id AS CHAR) " +
            "WHERE c.teacher_id = #{teacherId}")
    List<Course> selectByTeacherIdWithInfo(@Param("teacherId") String teacherId);

    /**
     * 根据ID查询单个课程（关联教师信息）
     */
    @Select("SELECT c.*, " +
            "t.teacher_username as teacher_name, " +
            "t.teacher_head as teacher_avatar " +
            "FROM course c " +
            "LEFT JOIN teacher_user t ON c.teacher_id = CAST(t.teacher_id AS CHAR) " +
            "WHERE c.id = #{courseId}")
    Course selectByIdWithTeacherInfo(@Param("courseId") String courseId);
}
