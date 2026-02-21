package com.example.project.dto;

import lombok.Data;

@Data
public class ChapterUpdateDTO {
    private String chapterTitle;
    private Integer chapterOrder;
    private String chapterType; // 章节类型: FOLDER, VIDEO, PDF, TEXT, MIXED
    private String textContent;
    private String coverImage;
    private Long parentId;
}
