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
        QueryWrapper<CourseComment> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("chapter_id", chapterId)
                   .orderByAsc("create_time");
        List<CourseComment> allComments = courseCommentMapper.selectList(queryWrapper);
        
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
    public List<CourseComment> getTeacherComments(String teacherId, int pageNumber, int pageSize, String courseId, String keyword) {
        int offset = (pageNumber - 1) * pageSize;
        return courseCommentMapper.selectTeacherComments(teacherId, pageNumber, pageSize, courseId, keyword, offset);
    }
    
    @Override
    @Transactional
    public CourseComment replyComment(CourseComment comment) {
        // 回复评论本质上也是添加评论，只是设置了parentId
        comment.setCreateTime(new Date());
        courseCommentMapper.insert(comment);
        return comment;
    }
    
    @Override
    @Transactional
    public void deleteComment(Long commentId) {
        // 软删除：删除评论及其所有子评论
        CourseComment comment = courseCommentMapper.selectById(commentId);
        if (comment != null) {
            // 删除当前评论
            courseCommentMapper.deleteById(commentId);
            
            // 递归删除所有子评论
            deleteChildComments(commentId);
        }
    }
    
    /**
     * 递归删除子评论
     */
    private void deleteChildComments(Long parentId) {
        QueryWrapper<CourseComment> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("parent_id", parentId);
        List<CourseComment> childComments = courseCommentMapper.selectList(queryWrapper);
        
        for (CourseComment child : childComments) {
            courseCommentMapper.deleteById(child.getCommentId());
            deleteChildComments(child.getCommentId());
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
