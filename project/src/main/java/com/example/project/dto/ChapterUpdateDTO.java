package com.example.project.dto;

import lombok.Data;

@Data
public class ChapterUpdateDTO {
    private String chapterTitle;
    private Integer chapterOrder;
    private String textContent;
    private String coverImage;
    private Long parentId;
}
