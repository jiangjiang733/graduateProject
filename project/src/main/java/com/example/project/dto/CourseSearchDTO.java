package com.example.project.dto;

import lombok.Data;

@Data
public class CourseSearchDTO {
    private String teacherId;      // 教师ID（用于筛选我的课程）
    private String keyword;        // 搜索关键词（课程名或课程码）
    private String filterType;     // 筛选类型：MY/ALL
    private Integer pageNumber;
    private Integer pageSize;
}
