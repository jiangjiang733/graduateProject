package com.example.project.controller.notification;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.project.common.Result;
import com.example.project.entity.notification.Message;
import com.example.project.service.notification.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/message")
public class MessageController {
    
    @Autowired
    private MessageService messageService;
    
    /**
     * 获取消息列表
     */
    @GetMapping("/teacher/{teacherId}")
    public Result<Page<Message>> getMessageList(
            @PathVariable String teacherId,
            @RequestParam(required = false) Integer isRead,
            @RequestParam(defaultValue = "1") Integer pageNumber,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        try {
            Page<Message> messagePage = messageService.getMessageList(teacherId, isRead, pageNumber, pageSize);
            return Result.success(messagePage);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 标记消息为已读
     */
    @PutMapping("/{messageId}/read")
    public Result<String> markAsRead(@PathVariable Long messageId) {
        try {
            messageService.markAsRead(messageId);
            return Result.success("标记成功");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 删除消息
     */
    @DeleteMapping("/{messageId}")
    public Result<String> deleteMessage(@PathVariable Long messageId) {
        try {
            messageService.deleteMessage(messageId);
            return Result.success("删除成功");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 获取未读消息数量
     */
    @GetMapping("/teacher/{teacherId}/unread-count")
    public Result<Map<String, Integer>> getUnreadCount(@PathVariable String teacherId) {
        try {
            Integer unreadCount = messageService.getUnreadCount(teacherId);
            Map<String, Integer> data = new HashMap<>();
            data.put("unreadCount", unreadCount);
            return Result.success(data);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
}
