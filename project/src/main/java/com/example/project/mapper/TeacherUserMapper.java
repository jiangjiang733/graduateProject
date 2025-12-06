package com.example.project.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.project.entity.Teacher;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface TeacherUserMapper extends BaseMapper<Teacher> {
    @Select("SELECT teacher_password FROM teacher_user WHERE teacher_username = #{teacher_username}")
    String getPasswordByUsername(@Param("teacher_username") String teacher_username);
      @Select("SELECT teacher_id FROM teacher_user WHERE teacher_username = #{teacher_username}")
    String getIdByUsername(@Param("teacher_username") String teacher_username);
      @Update("UPDATE teacher_user set teacher_department=#{teacher_department},teacher_email=#{teacher_email},teacher_level=#{teacher_level} where teacher_id=#{teacher_id}")
    int updateProfile(@Param("teacher_email") String teacher_email,@Param("teacher_level") String teacher_level,@Param("teacher_id") String teacher_id,@Param("teacher_department")String teacher_department);
    //  图片上传的sql语句
    @Update("UPDATE teacher_user set teacher_head=#{teacher_head} WHERE teacher_id=#{teacherId}")
    int updateTeacherHead(@Param("teacher_head") String teacher_head, @Param("teacherId") String teacherId);
    // 根据ID更新密码
    @Update("UPDATE teacher_user SET teacher_password = #{newPassword} WHERE teacher_id = #{teacherId}")
    int updatePasswordById(@Param("teacherId") Integer teacherId, @Param("newPassword") String newPassword);
}
