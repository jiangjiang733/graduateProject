package com.example.project.controller.exam;

import com.example.project.common.Result;
import com.example.project.service.exam.ExamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.example.project.entity.exam.Exam;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/student/exam")
public class StudentExamController {

    @Autowired
    private ExamService examService;

    /**
     * 获取学生的所有考试列表（仅限已选课程且已发布）
     */
    @GetMapping("/list")
    public Result<List<Map<String, Object>>> listExams(
            @RequestParam String studentId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String courseId) {
        try {
            List<Map<String, Object>> exams = examService.getStudentExams(studentId, status, courseId);
            return Result.success(exams);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

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

    /**
     * 提交试卷
     */
    @PostMapping("/{examId}/submit")
    public Result<String> submitExam(
            @PathVariable Long examId,
            @RequestBody com.example.project.dto.exam.StudentExamSubmitDTO submitDTO) {
        try {
            submitDTO.setExamId(examId);
            examService.submitExam(submitDTO);
            return Result.success("试卷提交成功");
        } catch (Exception e) {
            e.printStackTrace();
            return Result.error(e.getMessage());
        }
    }

    /**
     * 获取学生考试成绩详情（包含答题记录和正确答案）
     */
    @GetMapping("/{examId}/result")
    public Result<Map<String, Object>> getExamResult(
            @PathVariable Long examId,
            @RequestParam String studentId) {
        try {
            Map<String, Object> result = examService.getStudentExamResult(examId, studentId);
            return Result.success(result);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
}
