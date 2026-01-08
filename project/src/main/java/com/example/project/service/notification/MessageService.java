package com.example.project.service.notification;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.project.entity.notification.Message;

public interface MessageService {

    /**
     * 发送消息
     */
    Message sendMessage(String senderId, String senderType, String receiverId, String receiverType, String messageType,
            String title, String content, String relatedId);

    /**
     * 保存消息对象
     */
    void saveMessage(Message message);

    /**
     * 获取消息列表（支持分页和筛选）
     */
    Page<Message> getMessageList(String receiverId, String receiverType, Integer isRead, Integer pageNumber,
            Integer pageSize);

    /**
     * 标记消息为已读
     */
    void markAsRead(Long messageId, String receiverId, String receiverType);

    /**
     * 批量标记为已读
     */
    void markAsReadBatch(java.util.List<Long> messageIds, String receiverId, String receiverType);

    /**
     * 删除消息
     */
    void deleteMessage(Long messageId, String receiverId, String receiverType);

    /**
     * 获取未读消息数量
     */
    Integer getUnreadCount(String receiverId, String receiverType);
}
