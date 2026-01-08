package com.example.project.mapper.notification;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.project.entity.notification.ChatMessage;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

@Mapper
public interface ChatMessageMapper extends BaseMapper<ChatMessage> {

        /**
         * 获取聊天联系人列表
         * 
         * @param userId   当前用户ID
         * @param userType 当前用户类型
         */
        @Select("<script>" +
                        "SELECT " +
                        "    u.other_id as contactId, " +
                        "    u.other_type as contactType, " +
                        "    m.content as lastMessage, " +
                        "    m.create_time as lastTime, " +
                        "    (SELECT COUNT(*) FROM chat_message WHERE receiver_id = #{userId} AND receiver_role = #{userType} AND sender_id = u.other_id AND is_read = 0) as unreadCount "
                        +
                        "FROM (" +
                        "    SELECT sender_id as other_id, sender_role as other_type FROM chat_message WHERE receiver_id = #{userId} AND receiver_role = #{userType} "
                        +
                        "    UNION " +
                        "    SELECT receiver_id as other_id, receiver_role as other_type FROM chat_message WHERE sender_id = #{userId} AND sender_role = #{userType} "
                        +
                        ") u " +
                        "LEFT JOIN chat_message m ON m.id = (" +
                        "    SELECT id FROM chat_message " +
                        "    WHERE (sender_id = #{userId} AND receiver_id = u.other_id) OR (sender_id = u.other_id AND receiver_id = #{userId}) "
                        +
                        "    ORDER BY create_time DESC LIMIT 1" +
                        ") " +
                        "</script>")
        List<Map<String, Object>> getContactList(@Param("userId") String userId, @Param("userType") String userType);

        /**
         * 教师获取有活跃课程关联的学生列表作为联系人
         */
        @Select("SELECT s.students_id as contactId, 'STUDENT' as contactType, s.students_username as contactName, s.students_head as contactAvatar, GROUP_CONCAT(c.name SEPARATOR ' / ') as courseName "
                        +
                        "FROM student_course sc " +
                        "JOIN student_user s ON sc.student_id = s.students_id " +
                        "JOIN course c ON sc.course_id = c.id " +
                        "WHERE sc.teacher_id = #{teacherId} AND sc.status = 1 " +
                        "GROUP BY s.students_id")
        List<Map<String, Object>> getTeacherActiveContacts(@Param("teacherId") String teacherId);

        /**
         * 学生获取所选课程的教师列表作为联系人
         */
        @Select("SELECT t.teacher_id as contactId, 'TEACHER' as contactType, t.teacher_username as contactName, t.teacher_head as contactAvatar, GROUP_CONCAT(c.name SEPARATOR ' / ') as courseName "
                        +
                        "FROM student_course sc " +
                        "JOIN teacher_user t ON sc.teacher_id = t.teacher_id " +
                        "JOIN course c ON sc.course_id = c.id " +
                        "WHERE sc.student_id = #{studentId} AND sc.status = 1 " +
                        "GROUP BY t.teacher_id")
        List<Map<String, Object>> getStudentActiveContacts(@Param("studentId") String studentId);
}
