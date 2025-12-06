package com.example.project.controller.course;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.project.dto.CourseSearchDTO;
import com.example.project.entity.course.Course;
import com.example.project.entity.course.CourseChapter;
import com.example.project.mapper.course.CourseMapper;
import com.example.project.mapper.course.CourseChapterMapper;
import com.example.project.service.course.CourseService;
import com.example.project.service.course.StudentCourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 课程管理控制器
 * 负责课程的增删改查操作
 */
@RestController
@RequestMapping("/api/course")
@CrossOrigin(origins = "*")
public class CourseController {
    
    @Autowired
    private CourseService courseService;
    
    @Autowired
    private CourseMapper courseMapper;
    
    @Autowired
    private CourseChapterMapper courseChapterMapper;
    
    @Autowired
    private StudentCourseService studentCourseService;
    
    /**
     * 创建课程
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createCourse(
            @RequestParam("courseName") String courseName,
            @RequestParam("teacherId") String teacherId,
            @RequestParam("teacherName") String teacherName,
            @RequestParam(value = "courseDescription", required = false) String courseDescription,
            @RequestParam(value = "major", required = false) String major,
            @RequestParam(value = "classification", required = false) String classification,
            @RequestParam(value = "startTime", required = false) @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") Date startTime,
            @RequestParam(value = "endTime", required = false) @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") Date endTime,
            @RequestParam(value = "creatorUsername", required = false) String creatorUsername,
            @RequestParam(value = "image", required = false) MultipartFile image) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            System.out.println("开始创建课程: " + courseName);
            
            Course course = courseService.createCourse(courseName, teacherId, teacherName, 
                                                      courseDescription, major, classification,
                                                      startTime, endTime, creatorUsername, image);
            
            System.out.println("课程创建成功，ID: " + course.getId());
            
            response.put("success", true);
            response.put("message", "课程创建成功");
            response.put("data", course);
            response.put("code", 200);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("课程创建失败: " + e.getMessage());
            e.printStackTrace();
            
            response.put("success", false);
            response.put("message", "创建失败: " + e.getMessage());
            response.put("code", 500);
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * 获取课程列表（分页）
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getCourseList(
            @RequestParam(value = "pageNumber", defaultValue = "1") Integer pageNumber,
            @RequestParam(value = "pageSize", defaultValue = "10") Integer pageSize,
            @RequestParam(value = "teacherId", required = false) String teacherId,
            @RequestParam(value = "keyword", required = false) String keyword) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            IPage<Course> page = courseService.getCourseList(pageNumber, pageSize, teacherId, keyword);
            
            Map<String, Object> data = new HashMap<>();
            data.put("list", page.getRecords());
            data.put("total", page.getTotal());
            data.put("pageNumber", page.getCurrent());
            data.put("pageSize", page.getSize());
            data.put("totalPages", page.getPages());
            
            response.put("success", true);
            response.put("data", data);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "获取失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 获取课程详情
     */
    @GetMapping("/{courseId}")
    public ResponseEntity<Map<String, Object>> getCourseDetail(@PathVariable String courseId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Course course = courseService.getCourseDetail(courseId);
            
            if (course == null) {
                response.put("success", false);
                response.put("message", "课程不存在");
                return ResponseEntity.notFound().build();
            }
            
            response.put("success", true);
            response.put("data", course);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "获取失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 更新课程信息
     */
    @PutMapping("/{courseId}")
    public ResponseEntity<Map<String, Object>> updateCourse(
            @PathVariable String courseId,
            @RequestParam("teacherId") String teacherId,
            @RequestParam(value = "courseName", required = false) String courseName,
            @RequestParam(value = "courseDescription", required = false) String courseDescription,
            @RequestParam(value = "major", required = false) String major,
            @RequestParam(value = "classification", required = false) String classification,
            @RequestParam(value = "startTime", required = false) @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") Date startTime,
            @RequestParam(value = "endTime", required = false) @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") Date endTime,
            @RequestParam(value = "image", required = false) MultipartFile image) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            courseService.updateCourse(courseId, teacherId, courseName, courseDescription, 
                                      major, classification, startTime, endTime, image);
            
            response.put("success", true);
            response.put("message", "更新成功");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "更新失败: " + e.getMessage());
            
            // 如果是权限错误，返回403
            if (e.getMessage().contains("无权限")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 删除课程
     */
    @DeleteMapping("/{courseId}")
    public ResponseEntity<Map<String, Object>> deleteCourse(
            @PathVariable String courseId,
            @RequestParam("teacherId") String teacherId) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            courseService.deleteCourse(courseId, teacherId);
            
            response.put("success", true);
            response.put("message", "删除成功");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "删除失败: " + e.getMessage());
            
            // 如果是权限错误，返回403
            if (e.getMessage().contains("无权限")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 搜索和筛选课程
     */
    @PostMapping("/search")
    public ResponseEntity<Map<String, Object>> searchCourses(@RequestBody CourseSearchDTO searchDTO) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            QueryWrapper<Course> wrapper = new QueryWrapper<>();
            
            // 筛选类型
            if ("MY".equals(searchDTO.getFilterType()) && searchDTO.getTeacherId() != null) {
                wrapper.eq("teacher_id", searchDTO.getTeacherId());
            }
            
            // 关键词搜索（使用数据库实际列名）
            if (searchDTO.getKeyword() != null && !searchDTO.getKeyword().isEmpty()) {
                wrapper.and(w -> w
                    .like("name", searchDTO.getKeyword())
                    .or()
                    .like("course_code", searchDTO.getKeyword())
                );
            }
            
            wrapper.eq("state", 1).orderByDesc("create_time");
            
            List<Course> courses = courseMapper.selectList(wrapper);
            
            response.put("success", true);
            response.put("data", courses);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "搜索失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 切换课程状态（公开/私密）
     */
    @PutMapping("/{courseId}/state")
    public ResponseEntity<Map<String, Object>> toggleCourseState(
            @PathVariable String courseId,
            @RequestParam("teacherId") String teacherId,
            @RequestParam("state") Integer state) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            courseService.toggleCourseState(courseId, teacherId, state);
            
            response.put("success", true);
            response.put("message", "课程状态更新成功");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "状态更新失败: " + e.getMessage());
            
            // 如果是权限错误，返回403
            if (e.getMessage().contains("无权限")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 验证课程权限
     */
    @GetMapping("/{courseId}/check-permission")
    public ResponseEntity<Map<String, Object>> checkPermission(
            @PathVariable String courseId,
            @RequestParam String userId) {
        
        Map<String, Object> response = new HashMap<>();
        
        Course course = courseMapper.selectById(courseId);
        if (course == null) {
            response.put("success", false);
            response.put("message", "课程不存在");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
        
        boolean isOwner = course.getTeacherId().equals(userId);
        
        Map<String, Object> data = new HashMap<>();
        data.put("isOwner", isOwner);
        data.put("canEdit", isOwner);
        data.put("canView", true);
        
        response.put("success", true);
        response.put("data", data);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 获取课程统计信息
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getCourseStats(@RequestParam String teacherId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            QueryWrapper<Course> wrapper = new QueryWrapper<>();
            wrapper.eq("teacher_id", teacherId);
            
            List<Course> allCourses = courseMapper.selectList(wrapper);
            
            // 基础课程统计
            long totalCourses = allCourses.size();
            long activeCourses = allCourses.stream().filter(c -> c.getState() == 1).count();
            long draftCourses = allCourses.stream().filter(c -> c.getState() == 0).count();
            
            // 获取章节统计
            long totalChapters = 0;
            for (Course course : allCourses) {
                QueryWrapper<CourseChapter> chapterWrapper = new QueryWrapper<>();
                chapterWrapper.eq("course_id", course.getId());
                totalChapters += courseChapterMapper.selectCount(chapterWrapper);
            }
            
            // 获取学生统计（需要注入StudentCourseService）
            Map<String, Object> studentStats = studentCourseService.getTeacherStudentStats(teacherId);
            long totalStudents = studentStats != null ? 
                ((Number) studentStats.getOrDefault("totalStudents", 0)).longValue() : 0;
            long activeStudents = studentStats != null ? 
                ((Number) studentStats.getOrDefault("activeStudents", 0)).longValue() : 0;
            long completedStudents = studentStats != null ? 
                ((Number) studentStats.getOrDefault("completedStudents", 0)).longValue() : 0;
            
            // 计算本月新增课程
            long newCoursesThisMonth = allCourses.stream()
                .filter(c -> {
                    if (c.getCreateTime() == null) return false;
                    Calendar cal = Calendar.getInstance();
                    cal.add(Calendar.MONTH, -1);
                    return c.getCreateTime().after(cal.getTime());
                })
                .count();
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalCourses", totalCourses);
            stats.put("activeCourses", activeCourses);
            stats.put("draftCourses", draftCourses);
            stats.put("totalChapters", totalChapters);
            stats.put("totalStudents", totalStudents);
            stats.put("activeStudents", activeStudents);
            stats.put("completedStudents", completedStudents);
            stats.put("newCoursesThisMonth", newCoursesThisMonth);
            
            response.put("success", true);
            response.put("data", stats);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "获取统计失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
