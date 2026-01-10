package com.example.project.mapper.course;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.project.entity.course.CourseComment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface CourseCommentMapper extends BaseMapper<CourseComment> {

        @Select("SELECT cc.*, " +
                        "CASE WHEN cc.user_type = 'STUDENT' THEN s.students_username ELSE t.teacher_username END as user_name, "
                        +
                        "CASE WHEN cc.user_type = 'STUDENT' THEN s.students_head ELSE t.teacher_head END as user_avatar, "
                        +
                        "CASE WHEN cc.target_user_type = 'STUDENT' THEN s2.students_username WHEN cc.target_user_type = 'TEACHER' THEN t2.teacher_username ELSE NULL END as target_user_name, "
                        +
                        "CASE WHEN cc.target_user_type = 'STUDENT' THEN s2.students_head WHEN cc.target_user_type = 'TEACHER' THEN t2.teacher_head ELSE NULL END as target_user_avatar, "
                        +
                        "ch.chapter_title " +
                        "FROM course_comment cc " +
                        "LEFT JOIN student_user s ON cc.user_id = CAST(s.students_id AS CHAR) AND cc.user_type = 'STUDENT' "
                        +
                        "LEFT JOIN teacher_user t ON cc.user_id = CAST(t.teacher_id AS CHAR) AND cc.user_type = 'TEACHER' "
                        +
                        "LEFT JOIN student_user s2 ON cc.target_user_id = CAST(s2.students_id AS CHAR) AND cc.target_user_type = 'STUDENT' "
                        +
                        "LEFT JOIN teacher_user t2 ON cc.target_user_id = CAST(t2.teacher_id AS CHAR) AND cc.target_user_type = 'TEACHER' "
                        +
                        "LEFT JOIN course_chapter ch ON cc.chapter_id = ch.chapter_id " +
                        "WHERE cc.course_id = #{courseId} ORDER BY cc.create_time DESC")
        List<CourseComment> selectByCourseId(@Param("courseId") String courseId);

        @Select("SELECT cc.*, " +
                        "CASE WHEN cc.user_type = 'STUDENT' THEN s.students_username ELSE t.teacher_username END as user_name, "
                        +
                        "CASE WHEN cc.user_type = 'STUDENT' THEN s.students_head ELSE t.teacher_head END as user_avatar, "
                        +
                        "CASE WHEN cc.target_user_type = 'STUDENT' THEN s2.students_username WHEN cc.target_user_type = 'TEACHER' THEN t2.teacher_username ELSE NULL END as target_user_name, "
                        +
                        "CASE WHEN cc.target_user_type = 'STUDENT' THEN s2.students_head WHEN cc.target_user_type = 'TEACHER' THEN t2.teacher_head ELSE NULL END as target_user_avatar, "
                        +
                        "ch.chapter_title " +
                        "FROM course_comment cc " +
                        "LEFT JOIN student_user s ON cc.user_id = CAST(s.students_id AS CHAR) AND cc.user_type = 'STUDENT' "
                        +
                        "LEFT JOIN teacher_user t ON cc.user_id = CAST(t.teacher_id AS CHAR) AND cc.user_type = 'TEACHER' "
                        +
                        "LEFT JOIN student_user s2 ON cc.target_user_id = CAST(s2.students_id AS CHAR) AND cc.target_user_type = 'STUDENT' "
                        +
                        "LEFT JOIN teacher_user t2 ON cc.target_user_id = CAST(t2.teacher_id AS CHAR) AND cc.target_user_type = 'TEACHER' "
                        +
                        "LEFT JOIN course_chapter ch ON cc.chapter_id = ch.chapter_id " +
                        "WHERE cc.chapter_id = #{chapterId} ORDER BY cc.create_time DESC")
        List<CourseComment> selectByChapterId(@Param("chapterId") Long chapterId);

        @Select("SELECT cc.*, " +
                        "CASE WHEN cc.user_type = 'STUDENT' THEN s.students_username ELSE t.teacher_username END as user_name, "
                        +
                        "CASE WHEN cc.user_type = 'STUDENT' THEN s.students_head ELSE t.teacher_head END as user_avatar, "
                        +
                        "CASE WHEN cc.target_user_type = 'STUDENT' THEN s2.students_username WHEN cc.target_user_type = 'TEACHER' THEN t2.teacher_username ELSE NULL END as target_user_name, "
                        +
                        "CASE WHEN cc.target_user_type = 'STUDENT' THEN s2.students_head WHEN cc.target_user_type = 'TEACHER' THEN t2.teacher_head ELSE NULL END as target_user_avatar, "
                        +
                        "ch.chapter_title " +
                        "FROM course_comment cc " +
                        "LEFT JOIN student_user s ON cc.user_id = CAST(s.students_id AS CHAR) AND cc.user_type = 'STUDENT' "
                        +
                        "LEFT JOIN teacher_user t ON cc.user_id = CAST(t.teacher_id AS CHAR) AND cc.user_type = 'TEACHER' "
                        +
                        "LEFT JOIN student_user s2 ON cc.target_user_id = CAST(s2.students_id AS CHAR) AND cc.target_user_type = 'STUDENT' "
                        +
                        "LEFT JOIN teacher_user t2 ON cc.target_user_id = CAST(t2.teacher_id AS CHAR) AND cc.target_user_type = 'TEACHER' "
                        +
                        "LEFT JOIN course_chapter ch ON cc.chapter_id = ch.chapter_id " +
                        "WHERE cc.course_id = #{courseId} ORDER BY cc.create_time DESC LIMIT #{limit}")
        List<CourseComment> selectRecentComments(@Param("courseId") String courseId, @Param("limit") int limit);

        @Select({
                        "<script>",
                        "SELECT cc.*, ",
                        "CASE WHEN cc.user_type = 'STUDENT' THEN s.students_username ELSE t.teacher_username END as user_name, ",
                        "CASE WHEN cc.user_type = 'STUDENT' THEN s.students_head ELSE t.teacher_head END as user_avatar, ",
                        "CASE WHEN cc.target_user_type = 'STUDENT' THEN s2.students_username WHEN cc.target_user_type = 'TEACHER' THEN t2.teacher_username ELSE NULL END as target_user_name, ",
                        "CASE WHEN cc.target_user_type = 'STUDENT' THEN s2.students_head WHEN cc.target_user_type = 'TEACHER' THEN t2.teacher_head ELSE NULL END as target_user_avatar ",
                        "FROM course_comment cc",
                        "LEFT JOIN student_user s ON cc.user_id = CAST(s.students_id AS CHAR) AND cc.user_type = 'STUDENT'",
                        "LEFT JOIN teacher_user t ON cc.user_id = CAST(t.teacher_id AS CHAR) AND cc.user_type = 'TEACHER'",
                        "LEFT JOIN student_user s2 ON cc.target_user_id = CAST(s2.students_id AS CHAR) AND cc.target_user_type = 'STUDENT'",
                        "LEFT JOIN teacher_user t2 ON cc.target_user_id = CAST(t2.teacher_id AS CHAR) AND cc.target_user_type = 'TEACHER'",
                        "INNER JOIN course c ON cc.course_id = c.id",
                        "WHERE c.teacher_id = #{teacherId}",
                        "<if test='courseId != null and courseId != \"\"'>",
                        "AND cc.course_id = #{courseId}",
                        "</if>",
                        "<if test='keyword != null and keyword != \"\"'>",
                        "AND (cc.content LIKE CONCAT('%', #{keyword}, '%') OR ",
                        "CASE WHEN cc.user_type = 'STUDENT' THEN s.students_username ELSE t.teacher_username END LIKE CONCAT('%', #{keyword}, '%'))",
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
