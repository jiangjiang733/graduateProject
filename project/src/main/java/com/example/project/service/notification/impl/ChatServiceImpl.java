package com.example.project.service.notification.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.example.project.entity.notification.ChatMessage;
import com.example.project.mapper.notification.ChatMessageMapper;
import com.example.project.service.notification.ChatService;
import com.example.project.service.SensitiveWordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.Map;

@Service
public class ChatServiceImpl implements ChatService {

    @Autowired
    private ChatMessageMapper chatMessageMapper;

    @Autowired
    private SensitiveWordService sensitiveWordService;

    @Override
    @Transactional
    public ChatMessage sendChatMessage(ChatMessage message) {
        // 敏感词拦截检查
        if (sensitiveWordService != null && sensitiveWordService.hasSensitiveWords(message.getContent())) {
            throw new RuntimeException("消息发送失败：检测到敏感内容，请文明交流");
        }

        if (message.getCreateTime() == null) {
            message.setCreateTime(new Date());
        }
        message.setIsRead(0);
        chatMessageMapper.insert(message);
        return message;
    }

    @Override
    public List<ChatMessage> getHistory(String user1Id, String user1Type, String user2Id, String user2Type) {
        QueryWrapper<ChatMessage> wrapper = new QueryWrapper<>();
        wrapper.and(w -> w.eq("sender_id", user1Id).eq("sender_role", user1Type).eq("receiver_id", user2Id)
                .eq("receiver_role", user2Type))
                .or(w -> w.eq("sender_id", user2Id).eq("sender_role", user2Type).eq("receiver_id", user1Id)
                        .eq("receiver_role", user1Type))
                .orderByAsc("create_time");

        return chatMessageMapper.selectList(wrapper);
    }

    @Override
    public List<Map<String, Object>> getContactList(String userId, String userType) {
        return chatMessageMapper.getContactList(userId, userType);
    }

    @Override
    public List<Map<String, Object>> getActiveContacts(String userId, String userType) {
        if ("TEACHER".equalsIgnoreCase(userType)) {
            return chatMessageMapper.getTeacherActiveContacts(userId);
        } else if ("ADMIN".equalsIgnoreCase(userType)) {
            return chatMessageMapper.getAdminActiveContacts();
        } else {
            return chatMessageMapper.getStudentActiveContacts(userId);
        }
    }

    @Override
    @Transactional
    public void markChatAsRead(String currentUserId, String currentUserType, String senderId, String senderType) {
        UpdateWrapper<ChatMessage> wrapper = new UpdateWrapper<>();
        wrapper.eq("receiver_id", currentUserId)
                .eq("receiver_role", currentUserType)
                .eq("sender_id", senderId)
                .eq("sender_role", senderType)
                .set("is_read", 1);

        chatMessageMapper.update(null, wrapper);
    }

    @Override
    public Integer getTotalUnreadCount(String userId, String userType) {
        QueryWrapper<ChatMessage> wrapper = new QueryWrapper<>();
        wrapper.eq("receiver_id", userId)
                .eq("receiver_role", userType)
                .eq("is_read", 0);

        // 如果不是管理员，其主消息中心不统计来自管理员的未读（由独立组件处理）
        if (!"ADMIN".equalsIgnoreCase(userType)) {
            wrapper.ne("sender_role", "ADMIN");
        }

        return Math.toIntExact(chatMessageMapper.selectCount(wrapper));
    }

    @Override
    public Map<String, Object> getAdminChatInfo(String userId, String userType) {
        // 固定管理员 ID 为 "1", 角色为 "ADMIN"
        String adminId = "1";
        String adminType = "ADMIN";

        // 获取最后一条消息
        QueryWrapper<ChatMessage> lastMsgWrapper = new QueryWrapper<>();
        lastMsgWrapper.and(w -> w.eq("sender_id", userId).eq("sender_role", userType).eq("receiver_id", adminId)
                .eq("receiver_role", adminType))
                .or(w -> w.eq("sender_id", adminId).eq("sender_role", adminType).eq("receiver_id", userId)
                        .eq("receiver_role", userType))
                .orderByDesc("create_time")
                .last("LIMIT 1");

        ChatMessage lastMsg = chatMessageMapper.selectOne(lastMsgWrapper);

        // 获取管理员发给当前用户的未读数
        QueryWrapper<ChatMessage> unreadWrapper = new QueryWrapper<>();
        unreadWrapper.eq("sender_id", adminId)
                .eq("sender_role", adminType)
                .eq("receiver_id", userId)
                .eq("receiver_role", userType)
                .eq("is_read", 0);

        Integer unreadCount = Math.toIntExact(chatMessageMapper.selectCount(unreadWrapper));

        Map<String, Object> result = new java.util.HashMap<>();
        result.put("contactId", adminId);
        result.put("contactType", adminType);
        result.put("contactName", "系统管理员");
        result.put("unreadCount", unreadCount);
        result.put("lastMessage", lastMsg != null ? lastMsg.getContent() : null);
        result.put("lastTime", lastMsg != null ? lastMsg.getCreateTime() : null);

        return result;
    }
}
