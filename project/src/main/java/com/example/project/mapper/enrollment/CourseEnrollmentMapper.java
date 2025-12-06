package com.example.project.mapper.enrollment;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.project.entity.enrollment.CourseEnrollment;
import org.apache.ibatis.annotations.Mapper;

/**
 * 课程报名Mapper
 */
@Mapper
public interface CourseEnrollmentMapper extends BaseMapper<CourseEnrollment> {
}
