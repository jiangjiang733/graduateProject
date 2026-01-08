package com.example.project.dto.exam;

import lombok.Data;
import java.util.List;
import java.util.Date;

@Data
public class StudentExamSubmitDTO {
    private Long examId;
    private Long studentId;
    private List<StudentAnswerDTO> answers;
    private Date submitTime;
}
