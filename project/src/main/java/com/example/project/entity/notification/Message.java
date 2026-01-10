package com.example.project.entity.notification;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.io.Serializable;
import java.util.Date;

@Data
@TableName("message")
public class Message implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long messageId;

    private String receiverId;
    private String receiverType;
    private String messageType; // 'INTERACTION' 为互动消息
    private String title;
    private String content;
    private String relatedId; // 存放 course_comment 的 ID
    private Integer isRead;

    // 如果是系统消息，这两个字段可以为空，否则存放发送者ID
    private String senderId;
    private String senderType;

    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date createTime;

    // 以下字段不参与数据库映射，由 Mapper 动态注入
    @TableField(exist = false)
    private String senderName;

    @TableField(exist = false)
    private String senderAvatar;

    @TableField(exist = false)
    private String courseId;
}
