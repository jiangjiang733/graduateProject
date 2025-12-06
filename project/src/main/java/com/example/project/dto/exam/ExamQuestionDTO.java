package com.example.project.dto.exam;

import lombok.Data;

@Data
public class ExamQuestionDTO {
    private Long questionId;
    private String questionType;
    private String questionContent;
    private String questionOptions;
    private String correctAnswer;
    private Integer score;
    private Integer questionOrder;
    private String analysis;
}
