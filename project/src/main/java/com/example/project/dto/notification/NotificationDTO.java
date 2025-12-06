package com.example.project.dto.notification;

import lombok.Data;

import java.util.Date;

@Data
public class NotificationDTO {
    private Long notificationId;
    private String title;
    private String content;
    private String targetType;
    private Integer priority;
    private String createBy;
    private Date createTime;
    private Date expireTime;
}
