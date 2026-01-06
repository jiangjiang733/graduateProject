package com.example.project.service.course.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.project.dto.CourseCommentDTO;
import com.example.project.entity.course.CourseComment;
import com.example.project.mapper.course.CourseCommentMapper;
import com.example.project.service.course.CourseCommentService;
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
    private com.example.project.service.notification.MessageService messageService;

    @Override
    @Transactional
    public CourseComment addComment(CourseComment comment) {
        comment.setCreateTime(new Date());
        courseCommentMapper.insert(comment);
        return comment;
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
        // 获取该章节的所有评论
        List<CourseComment> allComments = courseCommentMapper.selectByChapterId(chapterId);

        // 转换为DTO
        List<CourseCommentDTO> commentDTOs = allComments.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        // 构建树形结构
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
    public CourseComment replyComment(CourseComment comment) {
        // 回复评论本质上也是添加评论，只是设置了parentId
        comment.setCreateTime(new Date());
        courseCommentMapper.insert(comment);

        // 创建消息通知给目标用户
        if (comment.getTargetUserId() != null && !comment.getTargetUserId().isEmpty()) {
            try {
                com.example.project.entity.notification.Message message = new com.example.project.entity.notification.Message();
                message.setReceiverId(comment.getTargetUserId());
                message.setSenderId(comment.getUserId());
                message.setSenderName(comment.getUserName());
                message.setSenderAvatar(comment.getUserAvatar());
                message.setMessageType("INTERACTION");
                message.setTitle("评论回复通知");
                message.setContent(comment.getContent());
                message.setRelatedId(comment.getCommentId().toString());
                message.setIsRead(0);
                message.setCreateTime(new Date());

                // 如果目标是老师，设置receiverType (这里简化逻辑，通常根据userId前缀或表判断)
                String receiverType = "STUDENT";
                if (comment.getTargetUserId() != null && comment.getTargetUserId().startsWith("T")) {
                    receiverType = "TEACHER";
                }
                message.setReceiverType(receiverType);

                messageService.saveMessage(message);
            } catch (Exception e) {
                // 仅打印错误，允许业务继续
                e.printStackTrace();
            }
        }

        return comment;
    }

    @Override
    @Transactional
    public void deleteComment(Long commentId) {
        System.out.println("DEBUG: 尝试删除评论 ID: " + commentId);

        CourseComment comment = courseCommentMapper.selectById(commentId);
        if (comment != null) {
            // 简单处理：直接删除所有子评论（不必递归，因为目前只有两层结构）
            QueryWrapper<CourseComment> queryWrapper = new QueryWrapper<>();
            queryWrapper.eq("parent_id", commentId);
            int deletedChildren = courseCommentMapper.delete(queryWrapper);
            System.out.println("DEBUG: 已删除子评论数量: " + deletedChildren);

            // 再删除当前评论
            int result = courseCommentMapper.deleteById(commentId);
            System.out.println("DEBUG: 删除主评论结果: " + result);
        } else {
            System.out.println("DEBUG: 未找到 ID 为 " + commentId + " 的评论");
            // 如果没找到，可能是因为 commentId 映射问题
            // 尝试使用 QueryWrapper 兜底删除
            QueryWrapper<CourseComment> qw = new QueryWrapper<>();
            qw.eq("comment_id", commentId);
            int result = courseCommentMapper.delete(qw);
            System.out.println("DEBUG: 兜底删除结果: " + result);
        }
    }

    /**
     * 将实体转换为DTO
     */
    private CourseCommentDTO convertToDTO(CourseComment comment) {
        CourseCommentDTO dto = new CourseCommentDTO();
        BeanUtils.copyProperties(comment, dto);
        return dto;
    }

    /**
     * 构建评论树形结构
     */
    private List<CourseCommentDTO> buildCommentTree(List<CourseCommentDTO> allComments) {
        // 创建一个Map，key为commentId，value为对应的DTO
        Map<Long, CourseCommentDTO> commentMap = allComments.stream()
                .collect(Collectors.toMap(CourseCommentDTO::getCommentId, dto -> dto));

        // 存储顶级评论（parentId为null或0）
        List<CourseCommentDTO> rootComments = new ArrayList<>();

        // 遍历所有评论，构建树形结构
        for (CourseCommentDTO comment : allComments) {
            Long parentId = comment.getParentId();

            if (parentId == null || parentId == 0) {
                // 顶级评论
                rootComments.add(comment);
            } else {
                // 子评论，添加到父评论的replies列表中
                CourseCommentDTO parentComment = commentMap.get(parentId);
                if (parentComment != null) {
                    parentComment.getReplies().add(comment);
                }
            }
        }

        return rootComments;
    }
}
