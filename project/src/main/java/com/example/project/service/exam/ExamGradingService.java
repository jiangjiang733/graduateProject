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
    void autoGradeObjectiveQuestions(Long studentExamId);
}
