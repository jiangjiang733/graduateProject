package com.example.project.controller.notification;

import com.example.project.common.Result;
import com.example.project.entity.notification.ChatMessage;
import com.example.project.service.notification.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class ChatController {

    @Autowired
    private ChatService chatService;

    /**
     * 发送私信
     */
    @PostMapping("/send")
    public Result<ChatMessage> sendMessage(@RequestBody ChatMessage message) {
        try {
            ChatMessage saved = chatService.sendChatMessage(message);
            return Result.success("发送成功", saved);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 获取聊天历史
     */
    @GetMapping("/history")
    public Result<List<ChatMessage>> getHistory(
            @RequestParam String user1Id,
            @RequestParam String user1Type,
            @RequestParam String user2Id,
            @RequestParam String user2Type) {
        try {
            List<ChatMessage> history = chatService.getHistory(user1Id, user1Type, user2Id, user2Type);
            return Result.success(history);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 获取联系人列表
     */
    @GetMapping("/contacts/{type}/{userId}")
    public Result<List<Map<String, Object>>> getContacts(
            @PathVariable String userId,
            @PathVariable String type) {
        try {
            List<Map<String, Object>> contacts = chatService.getContactList(userId, type.toUpperCase());
            return Result.success(contacts);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 获取基于课程定义的活跃联系人（学生找老师，老师找学生）
     */
    @GetMapping("/active-contacts/{type}/{userId}")
    public Result<List<Map<String, Object>>> getActiveContacts(
            @PathVariable String userId,
            @PathVariable String type) {
        try {
            List<Map<String, Object>> contacts = chatService.getActiveContacts(userId, type.toUpperCase());
            return Result.success(contacts);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 标记已读
     */
    @PostMapping("/read")
    public Result<Void> markRead(
            @RequestParam String currentUserId,
            @RequestParam String currentUserType,
            @RequestParam String senderId,
            @RequestParam String senderType) {
        try {
            chatService.markChatAsRead(currentUserId, currentUserType, senderId, senderType);
            return Result.success("已标记为已读");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 获取总未读数
     */
    @GetMapping("/unread-count/{type}/{userId}")
    public Result<Integer> getUnreadCount(
            @PathVariable String userId,
            @PathVariable String type) {
        try {
            Integer count = chatService.getTotalUnreadCount(userId, type.toUpperCase());
            return Result.success(count);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
}
