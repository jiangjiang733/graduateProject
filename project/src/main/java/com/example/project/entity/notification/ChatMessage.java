package com.example.project.entity.notification;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.io.Serializable;
import java.util.Date;

/**
 * 私信/聊天详细记录实体
 */
@Data
@TableName("chat_message")
public class ChatMessage implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 发送者ID
     */
    private String senderId;

    /**
     * 发送者类型/角色 (STUDENT/TEACHER)
     */
    @com.baomidou.mybatisplus.annotation.TableField("sender_role")
    private String senderType;

    /**
     * 接收者ID
     */
    private String receiverId;

    /**
     * 接收者类型/角色 (STUDENT/TEACHER)
     */
    @com.baomidou.mybatisplus.annotation.TableField("receiver_role")
    private String receiverType;

    /**
     * 消息内容
     */
    private String content;

    /**
     * 消息类型 (TEXT/IMAGE/FILE)
     */
    @com.baomidou.mybatisplus.annotation.TableField("msg_type")
    private String msgType;

    /**
     * 是否已读 (0:未读, 1:已读)
     */
    private Integer isRead;

    /**
     * 发送时间
     */
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date createTime;
}
