package com.example.project.service.course;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.project.entity.course.Course;
import org.springframework.web.multipart.MultipartFile;

import java.util.Date;

public interface CourseService {
    
    /**
     * 创建课程
     */
    Course createCourse(String courseName, String teacherId, String teacherName, 
                       String courseDescription, String major, String classification,
                       Date startTime, Date endTime, String creatorUsername,
                       MultipartFile image);
    
    /**
     * 获取课程列表（分页）
     */
    IPage<Course> getCourseList(Integer pageNumber, Integer pageSize, 
                                String teacherId, String keyword);
    
    /**
     * 获取课程详情
     */
    Course getCourseDetail(String courseId);
    
    /**
     * 更新课程信息
     */
    void updateCourse(String courseId, String teacherId, String courseName, 
                     String courseDescription, String major, String classification,
                     Date startTime, Date endTime,
                     MultipartFile image);
    
    /**
     * 删除课程
     */
    void deleteCourse(String courseId, String teacherId);
    
    /**
     * 切换课程状态（公开/私密）
     */
    void toggleCourseState(String courseId, String teacherId, Integer state);
}
