package com.example.project.service.course;

import com.example.project.entity.course.Course;
import com.example.project.mapper.course.CourseMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * 课程权限验证服务
 * 负责验证教师对课程的操作权限
 */
@Service
public class CoursePermissionService {
    
    @Autowired
    private CourseMapper courseMapper;
    
    /**
     * 验证教师是否是课程创建者
     * 
     * @param courseId 课程ID
     * @param teacherId 教师ID
     * @return true-是创建者，false-不是创建者
     * @throws RuntimeException 如果课程不存在
     */
    public boolean isCourseOwner(String courseId, String teacherId) {
        Course course = courseMapper.selectById(courseId);
        
        if (course == null) {
            throw new RuntimeException("课程不存在");
        }
        
        return course.getTeacherId().equals(teacherId);
    }
    
    /**
     * 验证教师是否有权限编辑课程
     * 
     * @param courseId 课程ID
     * @param teacherId 教师ID
     * @throws RuntimeException 如果课程不存在或无权限
     */
    public void validateEditPermission(String courseId, String teacherId) {
        if (!isCourseOwner(courseId, teacherId)) {
            throw new RuntimeException("无权限编辑此课程");
        }
    }
    
    /**
     * 验证教师是否有权限删除课程
     * 
     * @param courseId 课程ID
     * @param teacherId 教师ID
     * @throws RuntimeException 如果课程不存在或无权限
     */
    public void validateDeletePermission(String courseId, String teacherId) {
        if (!isCourseOwner(courseId, teacherId)) {
            throw new RuntimeException("无权限删除此课程");
        }
    }
    
    /**
     * 验证教师是否有权限查看课程
     * 目前所有教师都可以查看公开课程，只有创建者可以查看私密课程
     * 
     * @param courseId 课程ID
     * @param teacherId 教师ID
     * @return true-有权限，false-无权限
     */
    public boolean canViewCourse(String courseId, String teacherId) {
        Course course = courseMapper.selectById(courseId);
        
        if (course == null) {
            return false;
        }
        
        // 如果是公开课程，所有人都可以查看
        if (course.getState() == 1) {
            return true;
        }
        
        // 如果是私密课程，只有创建者可以查看
        return course.getTeacherId().equals(teacherId);
    }
    
    /**
     * 获取课程并验证权限
     * 
     * @param courseId 课程ID
     * @param teacherId 教师ID
     * @return 课程对象
     * @throws RuntimeException 如果课程不存在或无权限
     */
    public Course getCourseWithPermission(String courseId, String teacherId) {
        Course course = courseMapper.selectById(courseId);
        
        if (course == null) {
            throw new RuntimeException("课程不存在");
        }
        
        if (!isCourseOwner(courseId, teacherId)) {
            throw new RuntimeException("无权限访问此课程");
        }
        
        return course;
    }
}
