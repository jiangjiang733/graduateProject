package com.example.project.service.enrollment.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.project.dto.enrollment.EnrollmentApplyDTO;
import com.example.project.entity.Student;
import com.example.project.entity.enrollment.CourseEnrollment;
import com.example.project.mapper.StudentUserMapper;
import com.example.project.mapper.enrollment.CourseEnrollmentMapper;
import com.example.project.service.enrollment.CourseEnrollmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * 课程报名服务实现类
 */
@Service
public class CourseEnrollmentServiceImpl implements CourseEnrollmentService {
    
    @Autowired
    private CourseEnrollmentMapper enrollmentMapper;
    
    @Autowired
    private StudentUserMapper studentUserMapper;
    
    @Override
    @Transactional
    public CourseEnrollment applyEnrollment(EnrollmentApplyDTO applyDTO) {
        // 检查是否已经报名
        QueryWrapper<CourseEnrollment> wrapper = new QueryWrapper<>();
        wrapper.eq("student_id", applyDTO.getStudentId());
        wrapper.eq("course_id", applyDTO.getCourseId());
        
        CourseEnrollment existing = enrollmentMapper.selectOne(wrapper);
        if (existing != null) {
            if ("pending".equals(existing.getStatus())) {
                throw new RuntimeException("您已提交报名申请，请等待审核");
            } else if ("approved".equals(existing.getStatus())) {
                throw new RuntimeException("您已成功报名该课程");
            } else if ("rejected".equals(existing.getStatus())) {
                throw new RuntimeException("您的报名申请已被拒绝");
            }
        }
        
        // 获取学生信息
        Student student = studentUserMapper.selectById(applyDTO.getStudentId());
        
        // 创建报名记录
        CourseEnrollment enrollment = new CourseEnrollment();
        enrollment.setStudentId(applyDTO.getStudentId());
        enrollment.setStudentName(student != null ? student.getStudentsUsername() : null);
        enrollment.setStudentEmail(student != null ? student.getStudentsEmail() : null);
        enrollment.setCourseId(applyDTO.getCourseId());
        enrollment.setCourseName(applyDTO.getCourseName());
        enrollment.setTeacherId(applyDTO.getTeacherId());
        enrollment.setStatus("pending");
        enrollment.setApplyTime(new Date());
        
        enrollmentMapper.insert(enrollment);
        
        return enrollment;
    }
    
    @Override
    public Map<String, Object> checkEnrollmentStatus(String studentId, String courseId) {
        QueryWrapper<CourseEnrollment> wrapper = new QueryWrapper<>();
        wrapper.eq("student_id", studentId);
        wrapper.eq("course_id", courseId);
        
        CourseEnrollment enrollment = enrollmentMapper.selectOne(wrapper);
        
        Map<String, Object> result = new HashMap<>();
        if (enrollment != null) {
            result.put("enrolled", true);
            result.put("status", enrollment.getStatus());
            result.put("enrollmentId", enrollment.getId());
            result.put("applyTime", enrollment.getApplyTime());
            result.put("reviewTime", enrollment.getReviewTime());
            result.put("rejectReason", enrollment.getRejectReason());
        } else {
            result.put("enrolled", false);
            result.put("status", null);
        }
        
        return result;
    }
    
    @Override
    public List<CourseEnrollment> getStudentEnrollments(String studentId) {
        QueryWrapper<CourseEnrollment> wrapper = new QueryWrapper<>();
        wrapper.eq("student_id", studentId);
        wrapper.orderByDesc("apply_time");
        
        return enrollmentMapper.selectList(wrapper);
    }
    
    @Override
    public List<Map<String, Object>> getCourseEnrollments(String courseId) {
        QueryWrapper<CourseEnrollment> wrapper = new QueryWrapper<>();
        wrapper.eq("course_id", courseId);
        wrapper.orderByDesc("apply_time");
        
        List<CourseEnrollment> enrollments = enrollmentMapper.selectList(wrapper);
        
        List<Map<String, Object>> result = new ArrayList<>();
        for (CourseEnrollment enrollment : enrollments) {
            Map<String, Object> data = new HashMap<>();
            data.put("id", enrollment.getId());
            data.put("studentId", enrollment.getStudentId());
            data.put("studentName", enrollment.getStudentName());
            data.put("studentEmail", enrollment.getStudentEmail());
            data.put("courseId", enrollment.getCourseId());
            data.put("courseName", enrollment.getCourseName());
            data.put("status", enrollment.getStatus());
            data.put("applyTime", enrollment.getApplyTime());
            data.put("reviewTime", enrollment.getReviewTime());
            data.put("rejectReason", enrollment.getRejectReason());
            
            // 获取学生头像（如果需要）
            Student student = studentUserMapper.selectById(enrollment.getStudentId());
            if (student != null) {
                data.put("studentAvatar", student.getStudentsHead());
            }
            
            result.add(data);
        }
        
        return result;
    }
    
    @Override
    @Transactional
    public void reviewEnrollment(Long enrollmentId, String status, String reason) {
        CourseEnrollment enrollment = enrollmentMapper.selectById(enrollmentId);
        if (enrollment == null) {
            throw new RuntimeException("报名记录不存在");
        }
        
        if (!"pending".equals(enrollment.getStatus())) {
            throw new RuntimeException("该报名申请已经审核过了");
        }
        
        if (!"approved".equals(status) && !"rejected".equals(status)) {
            throw new RuntimeException("无效的审核状态");
        }
        
        enrollment.setStatus(status);
        enrollment.setReviewTime(new Date());
        
        if ("rejected".equals(status)) {
            if (reason == null || reason.trim().isEmpty()) {
                throw new RuntimeException("拒绝报名时必须填写原因");
            }
            enrollment.setRejectReason(reason);
        }
        
        enrollmentMapper.updateById(enrollment);
    }
    
    @Override
    @Transactional
    public void cancelEnrollment(Long enrollmentId) {
        CourseEnrollment enrollment = enrollmentMapper.selectById(enrollmentId);
        if (enrollment == null) {
            throw new RuntimeException("报名记录不存在");
        }
        
        if ("approved".equals(enrollment.getStatus())) {
            throw new RuntimeException("已通过的报名无法取消");
        }
        
        enrollmentMapper.deleteById(enrollmentId);
    }
}
