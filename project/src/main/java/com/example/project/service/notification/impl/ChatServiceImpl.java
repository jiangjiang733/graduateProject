package com.example.project.service.notification.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.example.project.entity.notification.ChatMessage;
import com.example.project.mapper.notification.ChatMessageMapper;
import com.example.project.service.notification.ChatService;
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

    @Override
    @Transactional
    public ChatMessage sendChatMessage(ChatMessage message) {
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

        return Math.toIntExact(chatMessageMapper.selectCount(wrapper));
    }
}
