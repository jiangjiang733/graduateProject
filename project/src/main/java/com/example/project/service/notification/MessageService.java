package com.example.project.service.notification;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.project.entity.notification.Message;

public interface MessageService {
    
    /**
     * 发送消息
     */
    Message sendMessage(String receiverId, String receiverType, String messageType, 
                       String title, String content, String relatedId);
    
    /**
     * 获取消息列表（支持分页和筛选）
     */
    Page<Message> getMessageList(String teacherId, Integer isRead, Integer pageNumber, Integer pageSize);
    
    /**
     * 标记消息为已读
     */
    void markAsRead(Long messageId);
    
    /**
     * 删除消息
     */
    void deleteMessage(Long messageId);
    
    /**
     * 获取未读消息数量
     */
    Integer getUnreadCount(String teacherId);
}
