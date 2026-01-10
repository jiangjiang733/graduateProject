package com.example.project.service.course.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.project.dto.CourseCommentDTO;
import com.example.project.entity.course.Course;
import com.example.project.entity.course.CourseComment;
import com.example.project.entity.notification.Message;
import com.example.project.entity.Student;
import com.example.project.entity.Teacher;
import com.example.project.mapper.course.CourseCommentMapper;
import com.example.project.mapper.course.CourseMapper;
import com.example.project.mapper.StudentUserMapper;
import com.example.project.mapper.TeacherUserMapper;
import com.example.project.mapper.course.CourseChapterMapper;
import com.example.project.entity.course.CourseChapter;
import com.example.project.service.course.CourseCommentService;
import com.example.project.service.notification.MessageService;
import com.example.project.mapper.notification.MessageMapper;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CourseCommentServiceImpl implements CourseCommentService {

    @Autowired
    private CourseCommentMapper courseCommentMapper;

    @Autowired
    private CourseMapper courseMapper;

    @Autowired
    private TeacherUserMapper teacherUserMapper;

    @Autowired
    private StudentUserMapper studentUserMapper;

    @Autowired
    private MessageService messageService;

    @Autowired
    private CourseChapterMapper courseChapterMapper;

    @Autowired
    private MessageMapper messageMapper;

    @Override
    @Transactional
    public CourseComment addComment(CourseComment comment) {
        comment.setCreateTime(new Date());
        courseCommentMapper.insert(comment);

        // 新话题通知（通知课程负责教师）
        if (comment.getParentId() == null || comment.getParentId() == 0) {
            try {
                String courseId = comment.getCourseId();
                // 如果没有直接关联课程，则通过章节查找课程
                if (courseId == null && comment.getChapterId() != null) {
                    CourseChapter chapter = courseChapterMapper.selectById(comment.getChapterId());
                    if (chapter != null) {
                        courseId = chapter.getCourseId();
                        comment.setCourseId(courseId); // 顺便回填
                    }
                }

                if (courseId != null) {
                    Course course = courseMapper.selectById(courseId);
                    // 只有当发言人不是老师自己时，才发通知
                    if (course != null && course.getTeacherId() != null
                            && !course.getTeacherId().equals(comment.getUserId())) {
                        // 获取评论者的用户名
                        String userName = getUserName(comment.getUserId(), comment.getUserType());
                        sendMessageToUser(
                                course.getTeacherId(),
                                "TEACHER",
                                comment.getUserId(),
                                comment.getUserType(),
                                "INTERACTION",
                                "新课程讨论",
                                "学生 " + userName + " 在课程《" + course.getCourseName() + "》中发布了新讨论："
                                        + comment.getContent(),
                                comment.getCommentId().toString());
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return comment;
    }

    @Override
    @Transactional
    public CourseComment replyComment(CourseComment comment) {
        // 逻辑：parent_id 的 course_id 就是新回复消息的 course_id
        if (comment.getParentId() != null && comment.getParentId() != 0) {
            CourseComment parentComment = courseCommentMapper.selectById(comment.getParentId());
            if (parentComment != null) {
                // 强制同步，防止前端传参错误（如存成了数字ID）
                comment.setCourseId(parentComment.getCourseId());
                comment.setChapterId(parentComment.getChapterId());

                if (comment.getTargetUserId() == null || comment.getTargetUserId().isEmpty()) {
                    comment.setTargetUserId(parentComment.getUserId());
                    comment.setTargetUserType(parentComment.getUserType());
                }
            }
        }

        comment.setCreateTime(new Date());
        courseCommentMapper.insert(comment);

        // 场景2：收到新回复通知
        if (comment.getTargetUserId() != null && !comment.getTargetUserId().isEmpty()
                && !comment.getTargetUserId().equals(comment.getUserId())) {
            try {
                // 1. 获取回复者的用户名
                String userName = getUserName(comment.getUserId(), comment.getUserType());

                // 2. 获取正确的课程名称（基于强制继承后的真实 courseId）
                String courseName = "讨论区";
                if (comment.getCourseId() != null) {
                    Course course = courseMapper.selectById(comment.getCourseId());
                    if (course != null)
                        courseName = "课程《" + course.getCourseName() + "》";
                }

                // 3. 判定接收人身份
                String receiverType = comment.getTargetUserType();
                if (receiverType == null || receiverType.isEmpty()) {
                    receiverType = "STUDENT";
                    Teacher teacher = teacherUserMapper.selectById(comment.getTargetUserId());
                    if (teacher != null)
                        receiverType = "TEACHER";
                }

                String relatedId = comment.getParentId().toString();

                // 5. 发送消息
                sendMessageToUser(
                        comment.getTargetUserId(),
                        receiverType,
                        comment.getUserId(),
                        comment.getUserType(),
                        "INTERACTION",
                        "收到新回复",
                        userName + " 在" + courseName + "中回复了你：" + comment.getContent(),
                        relatedId);

            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return comment;
    }

    private void sendMessageToUser(String receiverId, String receiverType, String senderId, String senderType,
            String msgType, String title, String content, String relatedId) {
        Message message = new Message();
        message.setReceiverId(receiverId);
        message.setReceiverType(receiverType);
        message.setSenderId(senderId);
        message.setSenderType(senderType);
        message.setMessageType(msgType);
        message.setTitle(title);
        message.setContent(content);
        message.setRelatedId(relatedId); // 关联 comment_id
        message.setIsRead(0);
        message.setCreateTime(new Date());
        messageService.saveMessage(message);
    }

    // 根据用户ID和类型获取用户名
    private String getUserName(String userId, String userType) {
        if ("TEACHER".equals(userType)) {
            Teacher teacher = teacherUserMapper.selectById(userId);
            return teacher != null ? teacher.getTeacherUsername() : "未知用户";
        } else {
            Student student = studentUserMapper.selectById(userId);
            return student != null ? student.getStudentsUsername() : "未知用户";
        }
    }

    @Override
    public List<CourseComment> getCourseComments(String courseId) {
        return courseCommentMapper.selectByCourseId(courseId);
    }

    @Override
    public List<CourseComment> getChapterComments(Long chapterId) {
        return courseCommentMapper.selectByChapterId(chapterId);
    }

    @Override
    public List<CourseCommentDTO> getChapterCommentsTree(Long chapterId) {
        List<CourseComment> allComments = courseCommentMapper.selectByChapterId(chapterId);
        List<CourseCommentDTO> commentDTOs = allComments.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return buildCommentTree(commentDTOs);
    }

    @Override
    public List<CourseComment> getRecentComments(String courseId, int limit) {
        return courseCommentMapper.selectRecentComments(courseId, limit);
    }

    @Override
    public List<CourseComment> getTeacherComments(String teacherId, int pageNumber, int pageSize, String courseId,
            String keyword) {
        int offset = (pageNumber - 1) * pageSize;
        return courseCommentMapper.selectTeacherComments(teacherId, pageNumber, pageSize, courseId, keyword, offset);
    }

    @Override
    @Transactional
    public void deleteComment(Long commentId) {
        CourseComment comment = courseCommentMapper.selectById(commentId);
        if (comment != null) {
            // 1. 查询所有子评论
            QueryWrapper<CourseComment> queryWrapper = new QueryWrapper<>();
            queryWrapper.eq("parent_id", commentId);
            List<CourseComment> childComments = courseCommentMapper.selectList(queryWrapper);

            // 2. 收集所有需要删除的评论ID（包括本身和子评论）
            List<String> relatedIds = new ArrayList<>();
            relatedIds.add(commentId.toString());
            if (childComments != null && !childComments.isEmpty()) {
                for (CourseComment child : childComments) {
                    relatedIds.add(child.getCommentId().toString());
                }
            }

            // 3. 批量删除关联的消息通知
            if (!relatedIds.isEmpty()) {
                messageMapper.deleteByRelatedIds(relatedIds);
            }

            // 4. 删除子评论
            courseCommentMapper.delete(queryWrapper);

            // 5. 删除主评论
            courseCommentMapper.deleteById(commentId);
        }
    }

    @Override
    @Transactional
    public void deleteChapterComments(Long chapterId) {
        List<CourseComment> comments = getChapterComments(chapterId);
        if (comments != null) {
            for (CourseComment c : comments)
                deleteCommentRecursively(c.getCommentId());
        }
    }

    private void deleteCommentRecursively(Long commentId) {
        QueryWrapper<CourseComment> replyWrapper = new QueryWrapper<>();
        replyWrapper.eq("parent_id", commentId);
        List<CourseComment> replies = courseCommentMapper.selectList(replyWrapper);
        if (replies != null) {
            for (CourseComment reply : replies)
                deleteCommentRecursively(reply.getCommentId());
        }
        // 删除关联的消息通知
        messageMapper.deleteByRelatedId(commentId.toString());
        // 删除评论本身
        courseCommentMapper.deleteById(commentId);
    }

    private CourseCommentDTO convertToDTO(CourseComment comment) {
        CourseCommentDTO dto = new CourseCommentDTO();
        BeanUtils.copyProperties(comment, dto);
        return dto;
    }

    private List<CourseCommentDTO> buildCommentTree(List<CourseCommentDTO> allComments) {
        Map<Long, CourseCommentDTO> commentMap = allComments.stream()
                .collect(Collectors.toMap(CourseCommentDTO::getCommentId, dto -> dto));
        List<CourseCommentDTO> rootComments = new ArrayList<>();
        for (CourseCommentDTO comment : allComments) {
            if (comment.getParentId() == null || comment.getParentId() == 0) {
                rootComments.add(comment);
            } else {
                CourseCommentDTO parent = commentMap.get(comment.getParentId());
                if (parent != null)
                    parent.getReplies().add(comment);
            }
        }
        return rootComments;
    }
}
