package com.example.project.mapper.course;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.project.entity.course.StudentCourse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

@Mapper
public interface StudentCourseMapper extends BaseMapper<StudentCourse> {

    /**
     * 获取教师课程的学生统计数据
     */
    @Select({
            "SELECT ",
            "COUNT(*) as totalStudents,",
            "COUNT(CASE WHEN sc.status = 1 THEN 1 END) as activeStudents,",
            "COUNT(CASE WHEN sc.status = 2 THEN 1 END) as completedStudents,",
            "COALESCE(AVG(sc.progress), 0) as avgProgress,",
            "COALESCE(AVG(sc.total_study_time), 0) as avgStudyTime",
            "FROM student_course sc",
            "INNER JOIN course c ON sc.course_id = c.id",
            "INNER JOIN teacher_user t ON c.teacher_id = t.teacher_id",
            "WHERE c.teacher_id = #{teacherId}"
    })
    Map<String, Object> getTeacherStudentStats(@Param("teacherId") String teacherId);

    /**
     * 获取特定课程的学生统计数据
     */
    @Select({
            "SELECT ",
            "COUNT(*) as totalStudents,",
            "COUNT(CASE WHEN sc.status = 1 THEN 1 END) as activeStudents,",
            "COUNT(CASE WHEN sc.status = 2 THEN 1 END) as completedStudents,",
            "COALESCE(AVG(sc.progress), 0) as avgProgress,",
            "COALESCE(AVG(sc.total_study_time), 0) as avgStudyTime,",
            "COUNT(CASE WHEN DATE(sc.join_time) = CURDATE() THEN 1 END) as newStudentsToday,",
            "COUNT(CASE WHEN DATE(sc.join_time) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as newStudentsThisWeek",
            "FROM student_course sc",
            "INNER JOIN course c ON sc.course_id = c.id",
            "INNER JOIN student_user s ON sc.student_id = s.students_id",
            "WHERE sc.course_id = #{courseId}"
    })
    Map<String, Object> getCourseStudentStats(@Param("courseId") String courseId);

    /**
     * 获取课程的学生列表
     */
    @Select({
            "SELECT sc.*, s.students_username as studentName",
            "FROM student_course sc",
            "INNER JOIN student_user s ON sc.student_id = s.students_id",
            "INNER JOIN course c ON sc.course_id = c.id",
            "WHERE sc.course_id = #{courseId}",
            "ORDER BY sc.join_time DESC",
            "LIMIT #{limit} OFFSET #{offset}"
    })
    List<StudentCourse> getCourseStudents(
            @Param("courseId") String courseId,
            @Param("limit") int limit,
            @Param("offset") int offset);

    /**
     * 获取教师所有课程的学生列表
     */
    @Select({
            "<script>",
            "SELECT sc.*, s.students_username as studentName, c.name as courseName",
            "FROM student_course sc",
            "INNER JOIN student_user s ON sc.student_id = s.students_id",
            "INNER JOIN course c ON sc.course_id = c.id",
            "INNER JOIN teacher_user t ON c.teacher_id = t.teacher_id",
            "WHERE c.teacher_id = #{teacherId}",
            "<if test='courseId != null and courseId != \"\"'>",
            "AND sc.course_id = #{courseId}",
            "</if>",
            "<if test='keyword != null and keyword != \"\"'>",
            "AND (s.students_username LIKE CONCAT('%', #{keyword}, '%') OR c.name LIKE CONCAT('%', #{keyword}, '%'))",
            "</if>",
            "ORDER BY sc.last_active_time DESC",
            "LIMIT #{limit} OFFSET #{offset}",
            "</script>"
    })
    List<StudentCourse> getTeacherStudents(
            @Param("teacherId") String teacherId,
            @Param("courseId") String courseId,
            @Param("keyword") String keyword,
            @Param("limit") int limit,
            @Param("offset") int offset);

    /**
     * 获取课程活跃度数据（按日期）
     */
    @Select({
            "SELECT ",
            "DATE(sc.last_active_time) as date,",
            "COUNT(DISTINCT sc.student_id) as activeStudents,",
            "COALESCE(SUM(sc.total_study_time), 0) as totalStudyTime",
            "FROM student_course sc",
            "INNER JOIN course c ON sc.course_id = c.id",
            "INNER JOIN student_user s ON sc.student_id = s.students_id",
            "WHERE sc.course_id = #{courseId}",
            "AND sc.last_active_time >= DATE_SUB(CURDATE(), INTERVAL #{days} DAY)",
            "AND sc.last_active_time IS NOT NULL",
            "GROUP BY DATE(sc.last_active_time)",
            "ORDER BY date"
    })
    List<Map<String, Object>> getCourseActivityData(
            @Param("courseId") String courseId,
            @Param("days") int days);

    /**
     * 获取学生加入的课程列表（包含课程详细信息）
     */
    @Select({
            "SELECT sc.*, c.name as courseName, c.teacher_name as teacherName, c.image as courseImage, c.classification as classification",
            "FROM student_course sc",
            "INNER JOIN course c ON sc.course_id = c.id",
            "WHERE sc.student_id = #{studentId}",
            "ORDER BY sc.last_active_time DESC"
    })
    List<Map<String, Object>> getStudentJoinedCourses(@Param("studentId") String studentId);
}