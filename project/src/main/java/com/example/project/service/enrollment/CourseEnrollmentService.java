package com.example.project.service.enrollment;

import com.example.project.dto.enrollment.EnrollmentApplyDTO;
import com.example.project.entity.enrollment.CourseEnrollment;

import java.util.List;
import java.util.Map;

/**
 * 课程报名服务接口
 */
public interface CourseEnrollmentService {

    /**
     * 学生申请报名
     * 
     * @param applyDTO 报名申请信息
     * @return 报名记录
     */
    CourseEnrollment applyEnrollment(EnrollmentApplyDTO applyDTO);

    /**
     * 检查学生是否已报名某课程
     * 
     * @param studentId 学生ID
     * @param courseId  课程ID
     * @return 报名状态信息
     */
    Map<String, Object> checkEnrollmentStatus(String studentId, String courseId);

    /**
     * 获取学生的报名列表
     * 
     * @param studentId 学生ID
     * @return 报名列表
     */
    List<CourseEnrollment> getStudentEnrollments(String studentId);

    /**
     * 获取课程的报名列表
     */
    List<Map<String, Object>> getCourseEnrollments(String courseId);

    /**
     * 获取教师所有课程的报名列表
     */
    List<Map<String, Object>> getTeacherEnrollments(String teacherId);

    /**
     * 教师审核报名申请
     * 
     * @param enrollmentId 报名ID
     * @param status       状态 (approved/rejected)
     * @param reason       拒绝原因（可选）
     */
    void reviewEnrollment(Long enrollmentId, String status, String reason);

    /**
     * 取消报名
     * 
     * @param enrollmentId 报名ID
     */
    void cancelEnrollment(Long enrollmentId);
}
