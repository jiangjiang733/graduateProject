package com.example.project.dto.homework;

import lombok.Data;

import java.util.Date;

@Data
public class LabReportDTO {
    private Long reportId;
    private String courseId;
    private String teacherId;
    private String reportTitle;
    private String reportDescription;
    private Date deadline;
    private Integer totalScore;
    private String attachmentUrl;
    private Integer status;
    private Date createTime;
    private Integer submittedCount;
    private Integer totalStudents;
    private String courseName;
    private String questionList;
}
