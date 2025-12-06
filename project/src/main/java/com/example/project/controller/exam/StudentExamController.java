package com.example.project.controller.exam;

import com.example.project.common.Result;
import com.example.project.service.exam.ExamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/student/exam")
public class StudentExamController {
    
    @Autowired
    private ExamService examService;
    
    /**
     * 学生获取考试详情（需要验证选课资格）
     */
    @GetMapping("/{examId}")
    public Result<Map<String, Object>> getExamForStudent(
            @PathVariable Long examId,
            @RequestParam String studentId) {
        try {
            // 验证学生是否有资格参加考试
            boolean isEligible = examService.validateStudentEligibility(examId, studentId);
            if (!isEligible) {
                return Result.error("您未选修此课程，无法参加考试");
            }
            
            // 获取考试详情
            Map<String, Object> examWithQuestions = examService.getExamWithQuestions(examId);
            if (examWithQuestions.get("exam") == null) {
                return Result.error("考试不存在");
            }
            
            return Result.success(examWithQuestions);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 验证学生是否有资格参加考试
     */
    @GetMapping("/{examId}/check-eligibility")
    public Result<Boolean> checkEligibility(
            @PathVariable Long examId,
            @RequestParam String studentId) {
        try {
            boolean isEligible = examService.validateStudentEligibility(examId, studentId);
            return Result.success(isEligible);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
}
