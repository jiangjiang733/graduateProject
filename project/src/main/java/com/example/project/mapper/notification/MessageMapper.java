package com.example.project.mapper.notification;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.project.entity.notification.Message;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface MessageMapper extends BaseMapper<Message> {
}
