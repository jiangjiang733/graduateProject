package com.example.project.dto.exam;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ExamGradingDTO {
    private String teacherId;
    private List<AnswerGradeDTO> answers;
    
    @Data
    public static class AnswerGradeDTO {
        private Long answerId;
        private BigDecimal score;
        private String teacherComment;
    }
}
