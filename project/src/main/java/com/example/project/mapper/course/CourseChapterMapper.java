package com.example.project.mapper.course;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.project.entity.course.CourseChapter;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface CourseChapterMapper extends BaseMapper<CourseChapter> {
    
    @Select("SELECT * FROM course_chapter WHERE course_id = #{courseId} AND (status IS NULL OR status = 1) ORDER BY chapter_order ASC")
    List<CourseChapter> selectByCourseId(@Param("courseId") String courseId);
    
    @Select("SELECT * FROM course_chapter WHERE parent_id = #{parentId} AND (status IS NULL OR status = 1) ORDER BY chapter_order ASC")
    List<CourseChapter> selectByParentId(@Param("parentId") Long parentId);
    
    @Select("SELECT * FROM course_chapter WHERE course_id = #{courseId} AND parent_id IS NULL AND (status IS NULL OR status = 1) ORDER BY chapter_order ASC")
    List<CourseChapter> selectRootChapters(@Param("courseId") String courseId);
    
    @Update("UPDATE course_chapter SET status = 0 WHERE chapter_id = #{chapterId}")
    int logicDeleteById(@Param("chapterId") Long chapterId);
    
    @Update("UPDATE course_chapter SET status = 0 WHERE course_id = #{courseId}")
    int logicDeleteByCourseId(@Param("courseId") String courseId);
}
