package com.example.project.service;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.project.entity.Teacher;
import com.example.project.mapper.TeacherUserMapper;
import org.springframework.stereotype.Service;
/*
mapper,对应的用户的mapper接口
entityClass，对应的是实体类类型
filedName，校验的字段名
filedValue，校验的字段名的值
*/

//校验唯一性
@Service
public  class UniquenessCheckService {
    public <T> boolean checkFieldExists(BaseMapper<T>mapper,Class<T>entityClass,String filedName,Object filedValue) {
//        动态构建查询条件
        QueryWrapper<T> wrapper = new QueryWrapper<>();
        wrapper.eq(filedName,filedValue);
        return mapper.exists(wrapper);
    }
}
