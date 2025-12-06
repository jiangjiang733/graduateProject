package com.example.project.service.notification.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.project.entity.notification.SystemNotification;
import com.example.project.mapper.notification.SystemNotificationMapper;
import com.example.project.service.notification.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
public class NotificationServiceImpl implements NotificationService {
    
    @Autowired
    private SystemNotificationMapper systemNotificationMapper;
    
    @Override
    public Page<SystemNotification> getNotificationList(Integer pageNumber, Integer pageSize) {
        Page<SystemNotification> page = new Page<>(pageNumber, pageSize);
        QueryWrapper<SystemNotification> queryWrapper = new QueryWrapper<>();
        
        // 只获取未过期的通知或没有过期时间的通知
        queryWrapper.and(wrapper -> wrapper
            .isNull("expire_time")
            .or()
            .gt("expire_time", new Date())
        );
        
        // 按优先级降序，创建时间降序排序
        queryWrapper.orderByDesc("priority", "create_time");
        
        return systemNotificationMapper.selectPage(page, queryWrapper);
    }
    
    @Override
    public SystemNotification pushNotification(String title, String content, String targetType,
                                              Integer priority, String createBy) {
        SystemNotification notification = new SystemNotification();
        notification.setTitle(title);
        notification.setContent(content);
        notification.setTargetType(targetType);
        notification.setPriority(priority != null ? priority : 3);
        notification.setCreateBy(createBy);
        notification.setCreateTime(new Date());
        
        systemNotificationMapper.insert(notification);
        return notification;
    }
}
