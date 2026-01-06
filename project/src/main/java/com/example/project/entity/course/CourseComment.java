package com.example.project.entity.course;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.io.Serializable;
import java.util.Date;

@Data
@TableName("course_comment")
public class CourseComment implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(value = "comment_id", type = IdType.AUTO)
    private Long commentId;

    @com.baomidou.mybatisplus.annotation.TableField("course_id")
    private String courseId;

    @com.baomidou.mybatisplus.annotation.TableField("chapter_id")
    private Long chapterId;

    @com.baomidou.mybatisplus.annotation.TableField("user_id")
    private String userId;

    @com.baomidou.mybatisplus.annotation.TableField("user_name")
    private String userName;

    @com.baomidou.mybatisplus.annotation.TableField("user_type")
    private String userType;

    @com.baomidou.mybatisplus.annotation.TableField("user_avatar")
    private String userAvatar;

    private String content;

    @com.baomidou.mybatisplus.annotation.TableField("parent_id")
    private Long parentId;

    @com.baomidou.mybatisplus.annotation.TableField("target_user_id")
    private String targetUserId;

    @com.baomidou.mybatisplus.annotation.TableField("target_user_name")
    private String targetUserName;

    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date createTime;

    @com.baomidou.mybatisplus.annotation.TableField(exist = false)
    private String chapterTitle;
}
