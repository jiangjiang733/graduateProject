package com.example.project.service.notification.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.project.entity.notification.SystemNotification;
import com.example.project.mapper.notification.SystemNotificationMapper;
import com.example.project.service.notification.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Date;

@Service
public class NotificationServiceImpl implements NotificationService {

    @Autowired
    private SystemNotificationMapper systemNotificationMapper;

    @Override
    public Page<SystemNotification> getNotificationList(Integer pageNumber, Integer pageSize, String keyword,
            String type) {
        Page<SystemNotification> page = new Page<>(pageNumber, pageSize);
        QueryWrapper<SystemNotification> queryWrapper = new QueryWrapper<>();

        queryWrapper.and(wrapper -> wrapper
                .isNull("expire_time")
                .or()
                .gt("expire_time", new Date()));

        if (StringUtils.hasText(keyword)) {
            queryWrapper.like("title", keyword);
        }
        if (StringUtils.hasText(type)) {
            queryWrapper.eq("target_type", type);
        }

        queryWrapper.orderByDesc("priority", "create_time");

        return systemNotificationMapper.selectPage(page, queryWrapper);
    }

    @Override
    public SystemNotification getNotificationById(Long id) {
        return systemNotificationMapper.selectById(id);
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

    @Override
    public void updateNotification(SystemNotification notification) {
        systemNotificationMapper.updateById(notification);
    }

    @Override
    public void deleteNotification(Long id) {
        systemNotificationMapper.deleteById(id);
    }

    @Override
    public void withdrawNotification(Long id) {
        // Set expire time to now to "withdraw" it
        SystemNotification notification = new SystemNotification();
        notification.setNotificationId(id);
        notification.setExpireTime(new Date());
        systemNotificationMapper.updateById(notification);
    }
}
