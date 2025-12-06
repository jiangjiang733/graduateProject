package com.example.project.dto.exam;

import lombok.Data;

import java.math.BigDecimal;
import java.util.Map;

@Data
public class ExamStatisticsDTO {
    private Long examId;
    private Integer totalStudents;
    private Integer submittedCount;
    private Integer gradedCount;
    private BigDecimal averageScore;
    private BigDecimal maxScore;
    private BigDecimal minScore;
    private BigDecimal passRate;
    private Map<String, Integer> scoreDistribution;
}
