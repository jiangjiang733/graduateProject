package com.example.project.mapper.course;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.project.entity.course.CourseProgress;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface CourseProgressMapper extends BaseMapper<CourseProgress> {
    
    @Select("SELECT * FROM course_progress WHERE student_id = #{studentId} AND course_id = #{courseId}")
    List<CourseProgress> selectByStudentAndCourse(@Param("studentId") String studentId, @Param("courseId") String courseId);
    
    @Select("SELECT * FROM course_progress WHERE student_id = #{studentId} AND chapter_id = #{chapterId}")
    CourseProgress selectByStudentAndChapter(@Param("studentId") String studentId, @Param("chapterId") Long chapterId);
}
