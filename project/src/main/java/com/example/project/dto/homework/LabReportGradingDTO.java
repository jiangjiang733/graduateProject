package com.example.project.dto.homework;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class LabReportGradingDTO {
    private String teacherId;
    private BigDecimal score;
    private String teacherComment;
}
