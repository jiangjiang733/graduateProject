package com.example.project.service.course;

import com.example.project.entity.course.StudentCourse;

import java.util.List;
import java.util.Map;

public interface StudentCourseService {
    
    /**
     * 获取教师的学生统计数据
     */
    Map<String, Object> getTeacherStudentStats(String teacherId);
    
    /**
     * 获取特定课程的学生统计数据
     */
    Map<String, Object> getCourseStudentStats(String courseId);
    
    /**
     * 获取课程的学生列表
     */
    List<StudentCourse> getCourseStudents(String courseId, int pageNumber, int pageSize);
    
    /**
     * 获取教师所有课程的学生列表
     */
    List<StudentCourse> getTeacherStudents(String teacherId, String courseId, String keyword, int pageNumber, int pageSize);
    
    /**
     * 获取课程活跃度数据
     */
    List<Map<String, Object>> getCourseActivityData(String courseId, int days);
    
    /**
     * 学生加入课程
     */
    boolean joinCourse(String studentId, String courseId);
    
    /**
     * 更新学生学习进度
     */
    boolean updateStudentProgress(String studentId, String courseId, int progress, int studyTime);
}