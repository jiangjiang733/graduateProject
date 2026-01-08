package com.example.project.service.notification.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.project.entity.notification.Message;
import com.example.project.mapper.notification.MessageMapper;
import com.example.project.service.notification.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;

@Service
public class MessageServiceImpl implements MessageService {

    @Autowired
    private MessageMapper messageMapper;

    @Override
    public Message sendMessage(String senderId, String senderType, String receiverId, String receiverType,
            String messageType,
            String title, String content, String relatedId) {
        Message message = new Message();
        message.setSenderId(senderId);
        message.setSenderType(senderType);
        message.setReceiverId(receiverId);
        message.setReceiverType(receiverType);
        message.setMessageType(messageType);
        message.setTitle(title);
        message.setContent(content);
        message.setRelatedId(relatedId);
        message.setIsRead(0);
        message.setCreateTime(new Date());

        messageMapper.insert(message);
        return message;
    }

    @Override
    public void saveMessage(Message message) {
        if (message.getCreateTime() == null) {
            message.setCreateTime(new Date());
        }
        if (message.getIsRead() == null) {
            message.setIsRead(0);
        }
        messageMapper.insert(message);
    }

    @Override
    public Page<Message> getMessageList(String receiverId, String receiverType, Integer isRead, Integer pageNumber,
            Integer pageSize) {
        Page<Message> page = new Page<>(pageNumber, pageSize);
        QueryWrapper<Message> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("receiver_id", receiverId);
        queryWrapper.eq("receiver_type", receiverType);

        if (isRead != null) {
            queryWrapper.eq("is_read", isRead);
        }

        queryWrapper.orderByDesc("create_time");

        return messageMapper.selectPage(page, queryWrapper);
    }

    @Override
    public void markAsRead(Long messageId, String receiverId, String receiverType) {
        QueryWrapper<Message> wrapper = new QueryWrapper<>();
        wrapper.eq("message_id", messageId);
        wrapper.eq("receiver_id", receiverId);
        wrapper.eq("receiver_type", receiverType);

        Message message = messageMapper.selectOne(wrapper);
        if (message != null) {
            message.setIsRead(1);
            messageMapper.updateById(message);
        }
    }

    @Override
    @Transactional
    public void markAsReadBatch(java.util.List<Long> messageIds, String receiverId, String receiverType) {
        if (messageIds == null || messageIds.isEmpty())
            return;

        Message update = new Message();
        update.setIsRead(1);

        QueryWrapper<Message> wrapper = new QueryWrapper<>();
        wrapper.in("message_id", messageIds);
        wrapper.eq("receiver_id", receiverId);
        wrapper.eq("receiver_type", receiverType);

        messageMapper.update(update, wrapper);
    }

    @Override
    public void deleteMessage(Long messageId, String receiverId, String receiverType) {
        QueryWrapper<Message> wrapper = new QueryWrapper<>();
        wrapper.eq("message_id", messageId);
        wrapper.eq("receiver_id", receiverId);
        wrapper.eq("receiver_type", receiverType);
        messageMapper.delete(wrapper);
    }

    @Override
    public Integer getUnreadCount(String receiverId, String receiverType) {
        QueryWrapper<Message> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("receiver_id", receiverId);
        queryWrapper.eq("receiver_type", receiverType);
        queryWrapper.eq("is_read", 0);

        return Math.toIntExact(messageMapper.selectCount(queryWrapper));
    }
}
