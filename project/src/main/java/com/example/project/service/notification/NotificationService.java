package com.example.project.service.notification;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.project.entity.notification.SystemNotification;

public interface NotificationService {
    
    /**
     * 获取系统通知列表
     */
    Page<SystemNotification> getNotificationList(Integer pageNumber, Integer pageSize);
    
    /**
     * 推送系统通知
     */
    SystemNotification pushNotification(String title, String content, String targetType, 
                                       Integer priority, String createBy);
}
