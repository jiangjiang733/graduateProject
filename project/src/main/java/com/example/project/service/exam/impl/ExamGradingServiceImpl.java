package com.example.project.service.exam.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.project.dto.exam.ExamGradingDTO;
import com.example.project.dto.exam.StudentAnswerDTO;
import com.example.project.dto.exam.StudentExamDetailDTO;
import com.example.project.entity.Student;
import com.example.project.entity.exam.ExamQuestion;
import com.example.project.entity.exam.StudentAnswer;
import com.example.project.entity.exam.StudentExam;
import com.example.project.mapper.StudentUserMapper;
import com.example.project.mapper.exam.ExamQuestionMapper;
import com.example.project.mapper.exam.StudentAnswerMapper;
import com.example.project.mapper.exam.StudentExamMapper;
import com.example.project.service.exam.ExamGradingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
public class ExamGradingServiceImpl implements ExamGradingService {
    
    @Autowired
    private StudentExamMapper studentExamMapper;
    
    @Autowired
    private StudentAnswerMapper studentAnswerMapper;
    
    @Autowired
    private ExamQuestionMapper examQuestionMapper;
    
    @Autowired
    private StudentUserMapper studentUserMapper;
    
    @Override
    public List<StudentExam> getPendingExams(Long examId) {
        QueryWrapper<StudentExam> wrapper = new QueryWrapper<>();
        wrapper.eq("exam_id", examId);
        wrapper.in("status", 2, 3); // 2-已提交, 3-已批改
        wrapper.orderByAsc("submit_time");
        return studentExamMapper.selectList(wrapper);
    }
    
    @Override
    public StudentExamDetailDTO getStudentExamDetail(Long studentExamId) {
        // 获取学生考试记录
        StudentExam studentExam = studentExamMapper.selectById(studentExamId);
        if (studentExam == null) {
            throw new RuntimeException("学生考试记录不存在");
        }
        
        // 获取学生信息
        Student student = studentUserMapper.selectById(Integer.parseInt(studentExam.getStudentId()));
        
        // 构建DTO
        StudentExamDetailDTO detailDTO = new StudentExamDetailDTO();
        detailDTO.setStudentExamId(studentExam.getStudentExamId());
        detailDTO.setExamId(studentExam.getExamId());
        detailDTO.setStudentId(studentExam.getStudentId());
        detailDTO.setStudentName(student != null ? student.getStudentsUsername() : "未知");
        detailDTO.setStartTime(studentExam.getStartTime());
        detailDTO.setSubmitTime(studentExam.getSubmitTime());
        detailDTO.setTotalScore(studentExam.getTotalScore());
        detailDTO.setObtainedScore(studentExam.getObtainedScore());
        detailDTO.setStatus(studentExam.getStatus());
        
        // 获取学生答题记录
        QueryWrapper<StudentAnswer> answerWrapper = new QueryWrapper<>();
        answerWrapper.eq("student_exam_id", studentExamId);
        List<StudentAnswer> studentAnswers = studentAnswerMapper.selectList(answerWrapper);
        
        // 构建答题详情列表
        List<StudentAnswerDTO> answerDTOs = new ArrayList<>();
        for (StudentAnswer answer : studentAnswers) {
            // 获取试题信息
            ExamQuestion question = examQuestionMapper.selectById(answer.getQuestionId());
            
            StudentAnswerDTO answerDTO = new StudentAnswerDTO();
            answerDTO.setAnswerId(answer.getAnswerId());
            answerDTO.setQuestionId(answer.getQuestionId());
            answerDTO.setStudentAnswer(answer.getStudentAnswer());
            answerDTO.setIsCorrect(answer.getIsCorrect());
            answerDTO.setScore(answer.getScore());
            answerDTO.setTeacherComment(answer.getTeacherComment());
            
            if (question != null) {
                answerDTO.setQuestionType(question.getQuestionType());
                answerDTO.setQuestionContent(question.getQuestionContent());
                answerDTO.setQuestionOptions(question.getQuestionOptions());
                answerDTO.setCorrectAnswer(question.getCorrectAnswer());
                answerDTO.setQuestionScore(question.getScore());
            }
            
            answerDTOs.add(answerDTO);
        }
        
        detailDTO.setAnswers(answerDTOs);
        
        return detailDTO;
    }
    
    @Override
    @Transactional
    public void gradeExam(Long studentExamId, ExamGradingDTO gradingDTO) {
        // 获取学生考试记录
        StudentExam studentExam = studentExamMapper.selectById(studentExamId);
        if (studentExam == null) {
            throw new RuntimeException("学生考试记录不存在");
        }
        
        // 先自动批改客观题
        autoGradeObjectiveQuestions(studentExamId);
        
        // 批改主观题
        BigDecimal totalObtainedScore = BigDecimal.ZERO;
        
        if (gradingDTO.getAnswers() != null) {
            for (ExamGradingDTO.AnswerGradeDTO answerGrade : gradingDTO.getAnswers()) {
                StudentAnswer answer = studentAnswerMapper.selectById(answerGrade.getAnswerId());
                if (answer != null) {
                    answer.setScore(answerGrade.getScore());
                    answer.setTeacherComment(answerGrade.getTeacherComment());
                    studentAnswerMapper.updateById(answer);
                }
            }
        }
        
        // 计算总分
        QueryWrapper<StudentAnswer> wrapper = new QueryWrapper<>();
        wrapper.eq("student_exam_id", studentExamId);
        List<StudentAnswer> allAnswers = studentAnswerMapper.selectList(wrapper);
        
        for (StudentAnswer answer : allAnswers) {
            if (answer.getScore() != null) {
                totalObtainedScore = totalObtainedScore.add(answer.getScore());
            }
        }
        
        // 更新学生考试记录
        studentExam.setObtainedScore(totalObtainedScore);
        studentExam.setStatus(3); // 已批改
        studentExam.setGradedBy(gradingDTO.getTeacherId());
        studentExam.setGradedTime(new Date());
        studentExamMapper.updateById(studentExam);
    }
    
    @Override
    @Transactional
    public void autoGradeObjectiveQuestions(Long studentExamId) {
        // 获取所有答题记录
        QueryWrapper<StudentAnswer> wrapper = new QueryWrapper<>();
        wrapper.eq("student_exam_id", studentExamId);
        List<StudentAnswer> studentAnswers = studentAnswerMapper.selectList(wrapper);
        
        for (StudentAnswer answer : studentAnswers) {
            // 获取试题信息
            ExamQuestion question = examQuestionMapper.selectById(answer.getQuestionId());
            if (question == null) {
                continue;
            }
            
            // 只批改客观题：单选(SINGLE)、多选(MULTIPLE)、判断(JUDGE)
            String questionType = question.getQuestionType();
            if ("SINGLE".equals(questionType) || "MULTIPLE".equals(questionType) || "JUDGE".equals(questionType)) {
                String correctAnswer = question.getCorrectAnswer();
                String studentAnswer = answer.getStudentAnswer();
                
                // 判断答案是否正确
                boolean isCorrect = false;
                if (studentAnswer != null && correctAnswer != null) {
                    // 对于多选题，需要比较排序后的答案
                    if ("MULTIPLE".equals(questionType)) {
                        isCorrect = normalizeAnswer(studentAnswer).equals(normalizeAnswer(correctAnswer));
                    } else {
                        isCorrect = studentAnswer.trim().equalsIgnoreCase(correctAnswer.trim());
                    }
                }
                
                // 更新答题记录
                answer.setIsCorrect(isCorrect ? 1 : 0);
                answer.setScore(isCorrect ? new BigDecimal(question.getScore()) : BigDecimal.ZERO);
                studentAnswerMapper.updateById(answer);
            }
        }
    }
    
    /**
     * 标准化答案（用于多选题比较）
     * 将答案字符串按字母排序
     */
    private String normalizeAnswer(String answer) {
        if (answer == null) {
            return "";
        }
        char[] chars = answer.trim().toUpperCase().toCharArray();
        java.util.Arrays.sort(chars);
        return new String(chars);
    }
}
