package com.example.project.mapper.notification;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.project.entity.notification.Message;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface MessageMapper extends BaseMapper<Message> {

    /**
     * 查询消息列表（包含发送者动态关联信息）
     * 逻辑：
     * 1. 优先从 message 表关联 sender_id
     * 2. 如果是互动消息(INTERACTION)，则从 course_comment 表穿透关联评论作者
     */
    @Select("SELECT m.*, " +
            "COALESCE(s1.students_username, t1.teacher_username, s2.students_username, t2.teacher_username, '系统') as senderName, "
            +
            "COALESCE(s1.students_head, t1.teacher_head, s2.students_head, t2.teacher_head, '/uploads/avatar/default.png') as senderAvatar, "
            +
            "cc.course_id as courseId " +
            "FROM message m " +
            "LEFT JOIN student_user s1 ON m.sender_type = 'STUDENT' AND m.sender_id = s1.students_id " +
            "LEFT JOIN teacher_user t1 ON m.sender_type = 'TEACHER' AND m.sender_id = t1.teacher_id " +
            "LEFT JOIN course_comment cc ON m.message_type = 'INTERACTION' AND m.related_id = CAST(cc.comment_id AS CHAR) "
            +
            "LEFT JOIN student_user s2 ON cc.user_type = 'STUDENT' AND cc.user_id = s2.students_id " +
            "LEFT JOIN teacher_user t2 ON cc.user_type = 'TEACHER' AND cc.user_id = t2.teacher_id " +
            "WHERE m.receiver_id = #{receiverId} AND m.receiver_type = #{receiverType} " +
            "ORDER BY m.create_time DESC")
    List<Message> selectMessagesWithSenderInfo(@Param("receiverId") String receiverId,
            @Param("receiverType") String receiverType);

    /**
     * 根据 related_id 删除消息（用于删除评论时同步删除通知）
     */
    @Delete("DELETE FROM message WHERE related_id = #{relatedId}")
    int deleteByRelatedId(@Param("relatedId") String relatedId);

    /**
     * 根据多个 related_id 批量删除消息
     */
    @Delete("<script>" +
            "DELETE FROM message WHERE related_id IN " +
            "<foreach collection='relatedIds' item='id' open='(' separator=',' close=')'>" +
            "#{id}" +
            "</foreach>" +
            "</script>")
    int deleteByRelatedIds(@Param("relatedIds") List<String> relatedIds);
}