package com.example.project.dto.classmanage;

import lombok.Data;

import java.util.Date;

@Data
public class ClassDTO {
    private Long classId;
    private String courseId;
    private String className;
    private String classCode;
    private Integer maxStudents;
    private Integer currentStudents;
    private Date createTime;
}
