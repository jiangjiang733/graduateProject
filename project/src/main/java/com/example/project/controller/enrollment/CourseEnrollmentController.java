package com.example.project.controller.enrollment;

import com.example.project.common.Result;
import com.example.project.dto.enrollment.EnrollmentApplyDTO;
import com.example.project.dto.enrollment.EnrollmentReviewDTO;
import com.example.project.entity.enrollment.CourseEnrollment;
import com.example.project.service.enrollment.CourseEnrollmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 课程报名Controller
 */
@RestController
@RequestMapping("/api/enrollment")
public class CourseEnrollmentController {

    @Autowired
    private CourseEnrollmentService enrollmentService;

    /**
     * 学生申请报名
     * POST /api/enrollment/apply
     */
    @PostMapping("/apply")
    public Result<CourseEnrollment> applyEnrollment(@RequestBody EnrollmentApplyDTO applyDTO) {
        try {
            CourseEnrollment enrollment = enrollmentService.applyEnrollment(applyDTO);
            return Result.success("报名申请已提交", enrollment);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 检查学生是否已报名某课程
     * GET /api/enrollment/check?studentId={studentId}&courseId={courseId}
     */
    @GetMapping("/check")
    public Result<Map<String, Object>> checkEnrollmentStatus(
            @RequestParam String studentId,
            @RequestParam String courseId) {
        try {
            Map<String, Object> status = enrollmentService.checkEnrollmentStatus(studentId, courseId);
            return Result.success(status);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 获取学生的报名列表
     * GET /api/enrollment/student/{studentId}
     */
    @GetMapping("/student/{studentId}")
    public Result<List<CourseEnrollment>> getStudentEnrollments(@PathVariable String studentId) {
        try {
            List<CourseEnrollment> enrollments = enrollmentService.getStudentEnrollments(studentId);
            return Result.success(enrollments);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 获取课程的报名列表（教师用）
     * GET /api/enrollment/course/{courseId}
     */
    @GetMapping("/course/{courseId}")
    public Result<List<Map<String, Object>>> getCourseEnrollments(@PathVariable String courseId) {
        try {
            List<Map<String, Object>> enrollments = enrollmentService.getCourseEnrollments(courseId);
            return Result.success(enrollments);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 获取教师所有课程的报名列表
     * GET /api/enrollment/teacher/{teacherId}
     */
    @GetMapping("/teacher/{teacherId}")
    public Result<List<Map<String, Object>>> getTeacherEnrollments(@PathVariable String teacherId) {
        try {
            List<Map<String, Object>> enrollments = enrollmentService.getTeacherEnrollments(teacherId);
            return Result.success(enrollments);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 教师审核报名申请
     * PUT /api/enrollment/{enrollmentId}/review
     */
    @PutMapping("/{enrollmentId}/review")
    public Result<String> reviewEnrollment(
            @PathVariable Long enrollmentId,
            @RequestBody EnrollmentReviewDTO reviewDTO) {
        try {
            enrollmentService.reviewEnrollment(
                    enrollmentId,
                    reviewDTO.getStatus(),
                    reviewDTO.getReason());

            String message = "approved".equals(reviewDTO.getStatus()) ? "报名申请已通过" : "报名申请已拒绝";

            return Result.success(message);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 取消报名
     * DELETE /api/enrollment/{enrollmentId}
     */
    @DeleteMapping("/{enrollmentId}")
    public Result<String> cancelEnrollment(@PathVariable Long enrollmentId) {
        try {
            enrollmentService.cancelEnrollment(enrollmentId);
            return Result.success("操作成功");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 教师直接添加学生到课程
     * POST /api/enrollment/direct-enroll
     */
    @PostMapping("/direct-enroll")
    public Result<CourseEnrollment> directEnroll(
            @RequestParam String studentId,
            @RequestParam String courseId) {
        try {
            CourseEnrollment enrollment = enrollmentService.directEnroll(studentId, courseId);
            return Result.success("学生已成功加入课程", enrollment);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
}
