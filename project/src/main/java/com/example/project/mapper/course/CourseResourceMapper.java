package com.example.project.mapper.course;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.project.entity.course.CourseResource;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface CourseResourceMapper extends BaseMapper<CourseResource> {

    @Select("SELECT * FROM course_resource WHERE course_id = #{courseId} ORDER BY create_time DESC")
    List<CourseResource> selectByCourseId(@Param("courseId") String courseId);

    @Update("UPDATE course_resource SET download_count = download_count + 1 WHERE resource_id = #{id}")
    int incrementDownloadCount(@Param("id") Long id);
}
