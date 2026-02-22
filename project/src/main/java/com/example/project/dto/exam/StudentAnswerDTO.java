package com.example.project.dto.exam;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class StudentAnswerDTO {
    private Long answerId;
    private Long questionId;
    private String questionType;
    private String questionContent;
    private String questionOptions;
    /** 正确答案 (from ExamQuestion.answer) */
    private String answer;
    /** 兼容字段，与 answer 相同 */
    private String correctAnswer;
    private String studentAnswer;
    private Integer isCorrect;
    /** 学生获得的分数 */
    private BigDecimal score;
    /** 题目满分 */
    private Integer questionScore;
    private String teacherComment;
    private String analysis;
}
