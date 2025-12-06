package com.example.project.controller.course;

import com.example.project.dto.CourseCommentDTO;
import com.example.project.entity.course.CourseComment;
import com.example.project.service.course.CourseCommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 课程评论管理控制器
 * 负责评论的增删查操作
 * 需求: 6.1, 6.2, 6.3, 6.4, 6.5
 */
@RestController
@RequestMapping("/api/course/comment")
@CrossOrigin(origins = "*")
public class CourseCommentController {
    
    @Autowired
    private CourseCommentService courseCommentService;
    
    /**
     * POST /api/course/comment
     * Request Body: {
     *   "courseId": "string",
     *   "chapterId": "long",
     *   "userId": "string",
     *   "userName": "string",
     *   "userType": "TEACHER",
     *   "content": "string",
     *   "parentId": "long" (optional, for replies)
     * }
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> addComment(@RequestBody CourseComment comment) {
        Map<String, Object> response = new HashMap<>();
        try {
            CourseComment newComment;
            
            // 如果有parentId，则是回复评论
            if (comment.getParentId() != null && comment.getParentId() > 0) {
                newComment = courseCommentService.replyComment(comment);
            } else {
                newComment = courseCommentService.addComment(comment);
            }
            
            Map<String, Object> data = new HashMap<>();
            data.put("commentId", newComment.getCommentId());
            response.put("code", 200);
            response.put("message", "评论发布成功");
            response.put("data", data);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("code", 500);
            response.put("message", "评论发布失败: " + e.getMessage());
            response.put("data", null);
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 获取章节讨论列表（树形结构）
     *  教师可以查看所有评论
     *  学生在讨论中发表评论时，教师可以查看
     * GET /api/course/comment/chapter/{chapterId}
     * Response: 树形结构的评论列表，包含回复
     */
    @GetMapping("/chapter/{chapterId}")
    public ResponseEntity<Map<String, Object>> getChapterComments(@PathVariable Long chapterId) {
        Map<String, Object> response = new HashMap<>();
        try {
            List<CourseCommentDTO> comments = courseCommentService.getChapterCommentsTree(chapterId);
            response.put("code", 200);
            response.put("data", comments);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("code", 500);
            response.put("message", "获取失败: " + e.getMessage());
            response.put("data", null);
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 获取课程评论
     * 
     * GET /api/course/comment/course/{courseId}
     */
    @GetMapping("/course/{courseId}")
    public ResponseEntity<Map<String, Object>> getCourseComments(@PathVariable String courseId) {
        Map<String, Object> response = new HashMap<>();
        try {
            List<CourseComment> comments = courseCommentService.getCourseComments(courseId);
            response.put("code", 200);
            response.put("data", comments);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("code", 500);
            response.put("message", "获取失败: " + e.getMessage());
            response.put("data", null);
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 获取最新评论
     * 
     * GET /api/course/comment/recent/{courseId}?limit=10
     */
    @GetMapping("/recent/{courseId}")
    public ResponseEntity<Map<String, Object>> getRecentComments(
            @PathVariable String courseId,
            @RequestParam(defaultValue = "10") int limit) {
        
        Map<String, Object> response = new HashMap<>();
        try {
            List<CourseComment> comments = courseCommentService.getRecentComments(courseId, limit);
            response.put("code", 200);
            response.put("data", comments);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("code", 500);
            response.put("message", "获取失败: " + e.getMessage());
            response.put("data", null);
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 获取教师所有课程的评论（用于评论管理）
     * 
     * GET /api/course/comment/teacher/{teacherId}
     */
    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<Map<String, Object>> getTeacherComments(
            @PathVariable String teacherId,
            @RequestParam(defaultValue = "1") int pageNumber,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String courseId,
            @RequestParam(required = false) String keyword) {
        
        Map<String, Object> response = new HashMap<>();
        try {
            List<CourseComment> comments = courseCommentService.getTeacherComments(
                teacherId, pageNumber, pageSize, courseId, keyword);
            response.put("code", 200);
            response.put("data", comments);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("code", 500);
            response.put("message", "获取失败: " + e.getMessage());
            response.put("data", null);
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 删除讨论
     * 需求 6.5: 教师可以删除讨论及其所有评论
     * 
     * DELETE /api/course/comment/{commentId}
     */
    @DeleteMapping("/{commentId}")
    public ResponseEntity<Map<String, Object>> deleteComment(@PathVariable Long commentId) {
        Map<String, Object> response = new HashMap<>();
        try {
            courseCommentService.deleteComment(commentId);
            response.put("code", 200);
            response.put("message", "评论删除成功");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("code", 500);
            response.put("message", "删除失败: " + e.getMessage());
            response.put("data", null);
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
