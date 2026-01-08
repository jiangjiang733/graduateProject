package com.example.project.service.course;

import com.example.project.dto.CourseCommentDTO;
import com.example.project.entity.course.CourseComment;

import java.util.List;

public interface CourseCommentService {

    /**
     * 添加评论（发布讨论）
     */
    CourseComment addComment(CourseComment comment);

    /**
     * 获取课程评论
     */
    List<CourseComment> getCourseComments(String courseId);

    /**
     * 获取章节评论（平铺列表）
     */
    List<CourseComment> getChapterComments(Long chapterId);

    /**
     * 获取章节评论（树形结构）
     */
    List<CourseCommentDTO> getChapterCommentsTree(Long chapterId);

    /**
     * 获取最新评论
     */
    List<CourseComment> getRecentComments(String courseId, int limit);

    /**
     * 获取教师所有课程的评论
     */
    List<CourseComment> getTeacherComments(String teacherId, int pageNumber, int pageSize, String courseId,
            String keyword);

    /**
     * 回复评论
     */
    CourseComment replyComment(CourseComment comment);

    /**
     * 删除评论（软删除）
     */
    void deleteComment(Long commentId);

    /**
     * 删除章节的所有评论（级联删除，包括所有回复）
     */
    void deleteChapterComments(Long chapterId);
}
