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
    private String correctAnswer;
    private String studentAnswer;
    private Integer isCorrect;
    private BigDecimal score;
    private Integer questionScore;
    private String teacherComment;
}
