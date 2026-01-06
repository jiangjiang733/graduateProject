package com.example.project.mapper.course;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.project.entity.course.CourseComment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface CourseCommentMapper extends BaseMapper<CourseComment> {

    @Select("SELECT cc.*, COALESCE(s.students_head, t.teacher_head, cc.user_avatar) as user_avatar, ch.chapter_title " +
            "FROM course_comment cc " +
            "LEFT JOIN student_user s ON cc.user_id = s.students_id AND cc.user_type = 'STUDENT' " +
            "LEFT JOIN teacher_user t ON cc.user_id = t.teacher_id AND cc.user_type = 'TEACHER' " +
            "LEFT JOIN course_chapter ch ON cc.chapter_id = ch.chapter_id " +
            "WHERE cc.course_id = #{courseId} ORDER BY cc.create_time DESC")
    List<CourseComment> selectByCourseId(@Param("courseId") String courseId);

    @Select("SELECT cc.*, COALESCE(s.students_head, t.teacher_head, cc.user_avatar) as user_avatar, ch.chapter_title " +
            "FROM course_comment cc " +
            "LEFT JOIN student_user s ON cc.user_id = s.students_id AND cc.user_type = 'STUDENT' " +
            "LEFT JOIN teacher_user t ON cc.user_id = t.teacher_id AND cc.user_type = 'TEACHER' " +
            "LEFT JOIN course_chapter ch ON cc.chapter_id = ch.chapter_id " +
            "WHERE cc.chapter_id = #{chapterId} ORDER BY cc.create_time DESC")
    List<CourseComment> selectByChapterId(@Param("chapterId") Long chapterId);

    @Select("SELECT cc.*, COALESCE(s.students_head, t.teacher_head, cc.user_avatar) as user_avatar, ch.chapter_title " +
            "FROM course_comment cc " +
            "LEFT JOIN student_user s ON cc.user_id = s.students_id AND cc.user_type = 'STUDENT' " +
            "LEFT JOIN teacher_user t ON cc.user_id = t.teacher_id AND cc.user_type = 'TEACHER' " +
            "LEFT JOIN course_chapter ch ON cc.chapter_id = ch.chapter_id " +
            "WHERE cc.course_id = #{courseId} ORDER BY cc.create_time DESC LIMIT #{limit}")
    List<CourseComment> selectRecentComments(@Param("courseId") String courseId, @Param("limit") int limit);

    @Select({
            "<script>",
            "SELECT cc.*, COALESCE(s.students_head, t.teacher_head, cc.user_avatar) as user_avatar ",
            "FROM course_comment cc",
            "LEFT JOIN student_user s ON cc.user_id = s.students_id AND cc.user_type = 'STUDENT'",
            "LEFT JOIN teacher_user t ON cc.user_id = t.teacher_id AND cc.user_type = 'TEACHER'",
            "INNER JOIN course c ON cc.course_id = c.id",
            "WHERE c.teacher_id = #{teacherId}",
            "<if test='courseId != null and courseId != \"\"'>",
            "AND cc.course_id = #{courseId}",
            "</if>",
            "<if test='keyword != null and keyword != \"\"'>",
            "AND (cc.content LIKE CONCAT('%', #{keyword}, '%') OR cc.user_name LIKE CONCAT('%', #{keyword}, '%'))",
            "</if>",
            "ORDER BY cc.create_time DESC",
            "LIMIT #{pageSize} OFFSET #{offset}",
            "</script>"
    })
    List<CourseComment> selectTeacherComments(
            @Param("teacherId") String teacherId,
            @Param("pageNumber") int pageNumber,
            @Param("pageSize") int pageSize,
            @Param("courseId") String courseId,
            @Param("keyword") String keyword,
            @Param("offset") int offset);
}
