package com.example.project.service.notification;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.project.entity.notification.SystemNotification;

public interface NotificationService {

    /**
     * 获取系统通知列表
     */
    /**
     * Get system notification list
     */
    Page<SystemNotification> getNotificationList(Integer pageNumber, Integer pageSize, String keyword, String type);

    /**
     * Get notification by ID
     */
    SystemNotification getNotificationById(Long id);

    /**
     * Push system notification
     */
    SystemNotification pushNotification(String title, String content, String targetType,
            Integer priority, String createBy);

    /**
     * Update notification
     */
    void updateNotification(SystemNotification notification);

    /**
     * Delete notification
     */
    void deleteNotification(Long id);

    /**
     * Withdraw notification (physically delete or status change? typically physical
     * delete or mark as expired)
     */
    void withdrawNotification(Long id);
}
