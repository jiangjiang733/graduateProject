package com.example.project.service.notification;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.project.entity.notification.Message;
import java.util.List;

public interface MessageService {
    
    Message sendMessage(String senderId, String senderType, String receiverId, String receiverType,
                      String messageType, String title, String content, String relatedId);
    
    void saveMessage(Message message);
    
    Page<Message> getMessageList(String receiverId, String receiverType, Integer isRead, 
                               Integer pageNumber, Integer pageSize);
    
    void markAsRead(Long messageId, String receiverId, String receiverType);
    
    void markAsReadBatch(List<Long> messageIds, String receiverId, String receiverType);
    
    void deleteMessage(Long messageId, String receiverId, String receiverType);
    
    Integer getUnreadCount(String receiverId, String receiverType);
}
