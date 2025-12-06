package com.example.project.entity.course;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Setter
@Getter
@TableName("course_chapter")
public class CourseChapter {
    @TableId(type = IdType.AUTO)
    private Long chapterId;           // 章节ID
    private String courseId;          // 课程ID
    private Long parentId;            // 父章节ID（树形结构）
    private String chapterTitle;      // 章节标题
    private Integer chapterOrder;     // 章节顺序
    private String chapterType;       // 章节类型：FOLDER/VIDEO/PDF/TEXT
    private String videoUrl;          // 视频URL
    private String pdfUrl;            // PDF文件URL
    private String pdfContent;        // PDF提取的文本内容
    private String textContent;       // 文字内容
    private Integer duration;         // 视频时长（秒）
    private String coverImage;        // 章节封面图片URL
    private LocalDateTime createTime; // 创建时间
    private LocalDateTime updateTime; // 更新时间
    private Integer status;           // 状态：1-正常，0-已删除
}
