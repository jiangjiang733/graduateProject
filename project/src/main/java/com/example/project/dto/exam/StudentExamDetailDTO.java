package com.example.project.dto.exam;

import lombok.Data;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

@Data
public class StudentExamDetailDTO {
    private Long studentExamId;
    private Long examId;
    private String studentId;
    private String studentName;
    private Date startTime;
    private Date submitTime;
    private Integer totalScore;
    private BigDecimal obtainedScore;
    private Integer status;
    private List<StudentAnswerDTO> answers;
}
