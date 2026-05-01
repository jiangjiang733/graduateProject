package com.example.project.service.exam;

import com.example.project.dto.exam.ExamGradingDTO;
import com.example.project.dto.exam.StudentExamDetailDTO;
import com.example.project.entity.exam.StudentExam;

import java.util.List;

public interface ExamGradingService {
    
    /**
     * 获取待批改试卷列表
     */
    List<StudentExam> getPendingExams(Long examId);
    
    /**
     * 获取学生试卷详情
     */
    StudentExamDetailDTO getStudentExamDetail(Long studentExamId);
    
    /**
     * 批改试卷
     */
    void gradeExam(Long studentExamId, ExamGradingDTO gradingDTO);
    
    /**
     * 自动批改客观题
     */
    /**
     * 自动批改客观题
     */
    void autoGradeObjectiveQuestions(Long studentExamId);

    /**
     * 一键AI批改主观题
     */
    void autoAiGradeExamPaper(Long studentExamId);

    /**
     * 一键发布某考卷下所有待发布的成绩 (将所有状态为2的设为3)
     */
    void publishExamGrades(Long examId);

    /**
     * 多选发布指定的学生试卷成绩
     */
    void publishSelectedExamGrades(java.util.List<Long> studentExamIds);
}
