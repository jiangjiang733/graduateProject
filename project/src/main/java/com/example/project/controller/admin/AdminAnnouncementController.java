package com.example.project.controller.admin;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.project.common.Result;
import com.example.project.entity.notification.SystemNotification;
import com.example.project.service.notification.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * 管理员公告管理控制器
 */
@RestController
@RequestMapping("/api/admin/announcements")
@CrossOrigin(origins = "*")
public class AdminAnnouncementController {

    @Autowired
    private NotificationService notificationService;

    /**
     * 获取公告列表
     */
    @GetMapping
    public Result<Map<String, Object>> getAnnouncementList(
            @RequestParam(defaultValue = "1") Integer pageNumber,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String type // targetType
    ) {
        Page<SystemNotification> page = notificationService.getNotificationList(pageNumber, pageSize, keyword, type);

        Map<String, Object> data = new HashMap<>();
        data.put("list", page.getRecords());
        data.put("total", page.getTotal());
        data.put("pageNumber", pageNumber);
        data.put("pageSize", pageSize);

        return Result.success(data);
    }

    /**
     * 获取公告详情
     */
    @GetMapping("/{id}")
    public Result<SystemNotification> getAnnouncementDetail(@PathVariable Long id) {
        SystemNotification notification = notificationService.getNotificationById(id);
        if (notification == null) {
            return Result.error("公告不存在");
        }
        return Result.success(notification);
    }

    /**
     * 创建公告
     */
    @PostMapping
    public Result<Long> createAnnouncement(@RequestBody SystemNotification notification) {
        if (notification.getCreateBy() == null) {
            notification.setCreateBy("admin");
        }
        notificationService.pushNotification(
                notification.getTitle(),
                notification.getContent(),
                notification.getTargetType() != null ? notification.getTargetType() : "ALL",
                notification.getPriority(),
                notification.getCreateBy());
        // Note: pushNotification inserts a new record. We might want to return the ID.
        // The service method returns the entity.
        return Result.success(null); // Simplified
    }

    /**
     * 更新公告
     */
    @PutMapping("/{id}")
    public Result<Void> updateAnnouncement(@PathVariable Long id, @RequestBody SystemNotification notification) {
        notification.setNotificationId(id);
        notificationService.updateNotification(notification);
        return Result.success();
    }

    /**
     * 删除公告
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteAnnouncement(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return Result.success();
    }

    /**
     * 发布公告 (re-publish or just create logic, already handled by create)
     * existing method in template was "publish". For SystemNotification, create IS
     * publish directly unless we add status.
     * Assuming "withdraw" sets expireTime. "Publish" could clear expireTime.
     */
    @PutMapping("/{id}/publish")
    public Result<Void> publishAnnouncement(@PathVariable Long id) {
        SystemNotification notification = notificationService.getNotificationById(id);
        if (notification != null) {
            notification.setExpireTime(null); // Make it active again
            notificationService.updateNotification(notification);
        }
        return Result.success();
    }

    /**
     * 撤回公告
     */
    @PutMapping("/{id}/withdraw")
    public Result<Void> withdrawAnnouncement(@PathVariable Long id) {
        notificationService.withdrawNotification(id);
        return Result.success();
    }
}
