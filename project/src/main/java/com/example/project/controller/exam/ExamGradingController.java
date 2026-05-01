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
     * AI一键批改学生整份试卷
     */
    @PostMapping("/ai/grade-paper/{studentExamId}")
    public Result<String> autoGradePaper(@PathVariable Long studentExamId) {
        try {
            examGradingService.autoAiGradeExamPaper(studentExamId);
            return Result.success("AI辅助批阅完成，请预览详情并进行复核。");
        } catch (Exception e) {
            return Result.error("AI批阅出现异常：" + e.getMessage());
        }
    }

    @Autowired
    private com.example.project.service.ai.AiQuestionGeneratorService aiQuestionGeneratorService;

    /**
     * AI智能批改单道简答题
     */
    @PostMapping("/ai/grade-answer")
    public Result<java.util.Map<String, Object>> autoGradeAnswer(@RequestBody java.util.Map<String, Object> requestInfo) {
        try {
            String questionContent = (String) requestInfo.get("questionContent");
            String referenceAnswer = (String) requestInfo.get("referenceAnswer");
            String studentAnswer = (String) requestInfo.get("studentAnswer");
            int maxScore = requestInfo.get("maxScore") != null ? Integer.parseInt(requestInfo.get("maxScore").toString()) : 0;
            
            java.util.Map<String, Object> gradeResult = aiQuestionGeneratorService.gradeShortAnswer(questionContent, referenceAnswer, studentAnswer, maxScore);
            return Result.success(gradeResult);
        } catch (Exception e) {
            return Result.error("AI批改失败：" + e.getMessage());
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

    /**
     * 一键发布所有待发布成绩
     */
    @PostMapping("/publish-all/{examId}")
    public Result<String> publishAllGrades(@PathVariable Long examId) {
        try {
            examGradingService.publishExamGrades(examId);
            return Result.success("一键发布成功");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 批量/多选发布学生成绩
     */
    @PostMapping("/publish-selected")
    public Result<String> publishSelectedGrades(@RequestBody List<Long> studentExamIds) {
        try {
            examGradingService.publishSelectedExamGrades(studentExamIds);
            return Result.success("选中答卷已成功发布");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
}
