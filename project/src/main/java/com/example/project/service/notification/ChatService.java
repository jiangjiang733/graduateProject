package com.example.project.service.notification;

import com.example.project.entity.notification.ChatMessage;
import java.util.List;
import java.util.Map;

public interface ChatService {

    /**
     * 发送消息
     */
    ChatMessage sendChatMessage(ChatMessage message);

    /**
     * 获取两人之间的聊天记录
     */
    List<ChatMessage> getHistory(String user1Id, String user1Type, String user2Id, String user2Type);

    /**
     * 获取联系人列表（包含最后一条消息和未读数）
     */
    List<Map<String, Object>> getContactList(String userId, String userType);

    /**
     * 获取基于课程关联的活跃联系人（教师找学生，学生找教师）
     */
    List<Map<String, Object>> getActiveContacts(String userId, String userType);

    /**
     * 标记某人发送的消息为已读
     */
    void markChatAsRead(String currentUserId, String currentUserType, String senderId, String senderType);

    /**
     * 获取总未读私信数
     */
    Integer getTotalUnreadCount(String userId, String userType);
}
