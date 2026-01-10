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

    // 评论者ID (关联student_user或teacher_user的user_id)
    @com.baomidou.mybatisplus.annotation.TableField("user_id")
    private String userId;

    // 评论者类型 (STUDENT 或 TEACHER)
    @com.baomidou.mybatisplus.annotation.TableField("user_type")
    private String userType;

    // 评论内容
    private String content;

    // 父评论ID (如果是回复，则不为空)
    @com.baomidou.mybatisplus.annotation.TableField("parent_id")
    private Long parentId;

    // 被回复的用户ID (如果是回复某人，则不为空，关联student_user或teacher_user的user_id)
    @com.baomidou.mybatisplus.annotation.TableField("target_user_id")
    private String targetUserId;

    // 被回复的用户类型 (STUDENT 或 TEACHER)
    @com.baomidou.mybatisplus.annotation.TableField("target_user_type")
    private String targetUserType;

    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date createTime;

    @com.baomidou.mybatisplus.annotation.TableField(exist = false)
    private String chapterTitle;

    @com.baomidou.mybatisplus.annotation.TableField(exist = false)
    private String userName;

    // 评论者头像（通过关联查询获取）
    @com.baomidou.mybatisplus.annotation.TableField(exist = false)
    private String userAvatar;

    // 被回复用户的用户名（通过关联查询获取）
    @com.baomidou.mybatisplus.annotation.TableField(exist = false)
    private String targetUserName;

    // 被回复用户的头像（通过关联查询获取）
    @com.baomidou.mybatisplus.annotation.TableField(exist = false)
    private String targetUserAvatar;
}
