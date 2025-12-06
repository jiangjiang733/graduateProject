package com.example.project.controller.notification;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.project.common.Result;
import com.example.project.entity.notification.SystemNotification;
import com.example.project.service.notification.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notification")
public class NotificationController {
    
    @Autowired
    private NotificationService notificationService;
    
    /**
     * 获取系统通知列表
     */
    @GetMapping("/teacher")
    public Result<Page<SystemNotification>> getNotificationList(
            @RequestParam(defaultValue = "1") Integer pageNumber,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        try {
            Page<SystemNotification> notificationPage = notificationService.getNotificationList(pageNumber, pageSize);
            return Result.success(notificationPage);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
}
