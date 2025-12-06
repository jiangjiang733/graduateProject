package com.example.project.dto.classmanage;

import lombok.Data;

import java.io.Serializable;

@Data
public class ClassCreateDTO implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    private String courseId;
    
    private String className;
    
    private String description;
    
    private Integer maxStudents;
    
    private String teacherId;
}
