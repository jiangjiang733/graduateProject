package com.example.project.mapper.exam;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.project.entity.exam.Exam;
import com.example.project.entity.course.Course;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface ExamMapper extends BaseMapper<Exam> {
    
    /**
     * 根据课程ID查询课程信息
     */
    @Select("SELECT * FROM course WHERE id = #{courseId}")
    Course selectCourseById(String courseId);
}
