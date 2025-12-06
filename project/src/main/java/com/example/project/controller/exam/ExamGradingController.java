package com.example.project.controller.exam;

import com.example.project.common.Result;
import com.example.project.dto.exam.ExamGradingDTO;
import com.example.project.dto.exam.ExamStatisticsDTO;
import com.example.project.dto.exam.StudentExamDetailDTO;
import com.example.project.entity.exam.StudentExam;
import com.example.project.service.exam.ExamGradingService;
import com.example.project.service.exam.ExamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exam/grading")
public class ExamGradingController {
    
    @Autowired
    private ExamGradingService examGradingService;
    
    @Autowired
    private ExamService examService;
    
    /**
     * 获取待批改试卷列表
     */
    @GetMapping("/{examId}/pending")
    public Result<List<StudentExam>> getPendingExams(@PathVariable Long examId) {
        try {
            List<StudentExam> exams = examGradingService.getPendingExams(examId);
            return Result.success(exams);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 获取学生试卷详情
     */
    @GetMapping("/submission/{studentExamId}")
    public Result<StudentExamDetailDTO> getStudentExamDetail(@PathVariable Long studentExamId) {
        try {
            StudentExamDetailDTO detail = examGradingService.getStudentExamDetail(studentExamId);
            return Result.success(detail);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 批改试卷
     */
    @PutMapping("/{studentExamId}")
    public Result<String> gradeExam(@PathVariable Long studentExamId, @RequestBody ExamGradingDTO gradingDTO) {
        try {
            examGradingService.gradeExam(studentExamId, gradingDTO);
            return Result.success("批改成功");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 获取考试统计
     */
    @GetMapping("/{examId}/statistics")
    public Result<ExamStatisticsDTO> getExamStatistics(@PathVariable Long examId) {
        try {
            ExamStatisticsDTO statistics = examService.getExamStatistics(examId);
            return Result.success(statistics);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
}
