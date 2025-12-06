package com.example.project.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * 课程评论DTO，支持树形结构
 */
@Data
public class CourseCommentDTO implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    private Long commentId;
    
    private String courseId;
    
    private Long chapterId;
    
    private String userId;
    
    private String userName;
    
    private String userType;
    
    private String content;
    
    private Long parentId;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date createTime;
    
    /**
     * 回复列表（子评论）
     */
    private List<CourseCommentDTO> replies = new ArrayList<>();
}
