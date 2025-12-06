package com.example.project.controller.course;

import com.example.project.entity.course.StudentCourse;
import com.example.project.service.course.StudentCourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 课程数据分析控制器
 * 提供课程学习数据分析相关API
 */
@RestController
@RequestMapping("/api/course/analytics")
@CrossOrigin(origins = "*")
public class CourseAnalyticsController {
    
    @Autowired
    private StudentCourseService studentCourseService;
    
    /**
     * 获取特定课程的详细分析数据
     * 
     * GET /api/course/analytics/{courseId}
     */
    @GetMapping("/{courseId}")
    public ResponseEntity<Map<String, Object>> getCourseAnalytics(@PathVariable String courseId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 获取课程学生统计
            Map<String, Object> studentStats = studentCourseService.getCourseStudentStats(courseId);
            
            // 获取活跃度数据（最近30天）
            List<Map<String, Object>> activityData = studentCourseService.getCourseActivityData(courseId, 30);
            
            Map<String, Object> analytics = new HashMap<>();
            analytics.put("studentStats", studentStats);
            analytics.put("activityData", activityData);
            
            response.put("success", true);
            response.put("data", analytics);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "获取分析数据失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 获取课程的学生列表
     * 
     * GET /api/course/analytics/{courseId}/students
     */
    @GetMapping("/{courseId}/students")
    public ResponseEntity<Map<String, Object>> getCourseStudents(
            @PathVariable String courseId,
            @RequestParam(defaultValue = "1") int pageNumber,
            @RequestParam(defaultValue = "20") int pageSize) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<StudentCourse> students = studentCourseService.getCourseStudents(courseId, pageNumber, pageSize);
            
            response.put("success", true);
            response.put("data", students);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "获取学生列表失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 获取教师所有课程的学生数据
     * 
     * GET /api/course/analytics/teacher/{teacherId}/students
     */
    @GetMapping("/teacher/{teacherId}/students")
    public ResponseEntity<Map<String, Object>> getTeacherStudents(
            @PathVariable String teacherId,
            @RequestParam(required = false) String courseId,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int pageNumber,
            @RequestParam(defaultValue = "20") int pageSize) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<StudentCourse> students = studentCourseService.getTeacherStudents(
                teacherId, courseId, keyword, pageNumber, pageSize);
            
            response.put("success", true);
            response.put("data", students);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "获取学生数据失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 获取课程活跃度趋势数据
     * 
     * GET /api/course/analytics/{courseId}/activity
     */
    @GetMapping("/{courseId}/activity")
    public ResponseEntity<Map<String, Object>> getCourseActivity(
            @PathVariable String courseId,
            @RequestParam(defaultValue = "30") int days) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<Map<String, Object>> activityData = studentCourseService.getCourseActivityData(courseId, days);
            
            response.put("success", true);
            response.put("data", activityData);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "获取活跃度数据失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 学生加入课程
     * 
     * POST /api/course/analytics/join
     */
    @PostMapping("/join")
    public ResponseEntity<Map<String, Object>> joinCourse(
            @RequestParam String studentId,
            @RequestParam String courseId) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            boolean success = studentCourseService.joinCourse(studentId, courseId);
            
            if (success) {
                response.put("success", true);
                response.put("message", "加入课程成功");
            } else {
                response.put("success", false);
                response.put("message", "加入课程失败，可能已经加入过该课程");
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "加入课程失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 更新学生学习进度
     * 
     * POST /api/course/analytics/progress
     */
    @PostMapping("/progress")
    public ResponseEntity<Map<String, Object>> updateProgress(
            @RequestParam String studentId,
            @RequestParam String courseId,
            @RequestParam int progress,
            @RequestParam(defaultValue = "0") int studyTime) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            boolean success = studentCourseService.updateStudentProgress(studentId, courseId, progress, studyTime);
            
            if (success) {
                response.put("success", true);
                response.put("message", "进度更新成功");
            } else {
                response.put("success", false);
                response.put("message", "进度更新失败");
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "进度更新失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}