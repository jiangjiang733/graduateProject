package com.example.project.dto.notification;

import lombok.Data;

import java.util.Date;

@Data
public class MessageDTO {
    private Long messageId;
    private String receiverId;
    private String receiverType;
    private String messageType;
    private String title;
    private String content;
    private String relatedId;
    private Integer isRead;
    private Date createTime;
}
