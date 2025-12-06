package com.example.project.dto.classmanage;

import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;

@Data
public class StudentProgressDTO implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    private String studentId;
    
    private String studentName;
    
    private String courseId;
    
    private Integer totalChapters;
    
    private Integer completedChapters;
    
    private BigDecimal progressPercentage;
    
    private Integer totalExams;
    
    private Integer completedExams;
    
    private BigDecimal averageExamScore;
    
    private Integer totalReports;
    
    private Integer submittedReports;
}
