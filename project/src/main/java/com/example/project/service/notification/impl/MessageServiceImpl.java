package com.example.project.service.notification.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.project.entity.notification.Message;
import com.example.project.mapper.notification.MessageMapper;
import com.example.project.service.notification.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
public class MessageServiceImpl implements MessageService {
    
    @Autowired
    private MessageMapper messageMapper;
    
    @Override
    public Message sendMessage(String receiverId, String receiverType, String messageType,
                              String title, String content, String relatedId) {
        Message message = new Message();
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
    public Page<Message> getMessageList(String teacherId, Integer isRead, Integer pageNumber, Integer pageSize) {
        Page<Message> page = new Page<>(pageNumber, pageSize);
        QueryWrapper<Message> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("receiver_id", teacherId);
        queryWrapper.eq("receiver_type", "TEACHER");
        
        if (isRead != null) {
            queryWrapper.eq("is_read", isRead);
        }
        
        queryWrapper.orderByDesc("create_time");
        
        return messageMapper.selectPage(page, queryWrapper);
    }
    
    @Override
    public void markAsRead(Long messageId) {
        Message message = messageMapper.selectById(messageId);
        if (message != null) {
            message.setIsRead(1);
            messageMapper.updateById(message);
        }
    }
    
    @Override
    public void deleteMessage(Long messageId) {
        messageMapper.deleteById(messageId);
    }
    
    @Override
    public Integer getUnreadCount(String teacherId) {
        QueryWrapper<Message> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("receiver_id", teacherId);
        queryWrapper.eq("receiver_type", "TEACHER");
        queryWrapper.eq("is_read", 0);
        
        return Math.toIntExact(messageMapper.selectCount(queryWrapper));
    }
}
