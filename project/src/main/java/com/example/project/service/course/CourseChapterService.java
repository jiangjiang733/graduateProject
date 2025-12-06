package com.example.project.service.course;

import com.example.project.entity.course.CourseChapter;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface CourseChapterService {
    
    /**
     * 创建章节
     */
    CourseChapter createChapter(CourseChapter chapter);
    
    /**
     * 创建文件夹章节
     */
    CourseChapter createFolderChapter(String courseId, Long parentId, String title, Integer order);
    
    /**
     * 创建视频章节
     */
    CourseChapter createVideoChapter(String courseId, Long parentId, String title, Integer order, MultipartFile videoFile);
    
    /**
     * 创建PDF章节（自动提取内容）
     */
    CourseChapter createPdfChapter(String courseId, Long parentId, String title, Integer order, MultipartFile pdfFile);
    
    /**
     * 创建文本章节
     */
    CourseChapter createTextChapter(String courseId, Long parentId, String title, Integer order, String textContent);
    
    /**
     * 创建混合章节（支持同时上传视频和PDF）
     */
    CourseChapter createMixedChapter(String courseId, Long parentId, String title, Integer order, 
                                    MultipartFile videoFile, MultipartFile pdfFile, String textContent);
    
    /**
     * 获取课程的所有章节（树形结构）
     */
    List<CourseChapter> getCourseChapters(String courseId);
    
    /**
     * 获取根章节列表
     */
    List<CourseChapter> getRootChapters(String courseId);
    
    /**
     * 获取子章节列表
     */
    List<CourseChapter> getChildChapters(Long parentId);
    
    /**
     * 获取章节详情
     */
    CourseChapter getChapterDetail(Long chapterId);
    
    /**
     * 更新章节
     */
    void updateChapter(CourseChapter chapter);
    
    /**
     * 删除章节
     */
    void deleteChapter(Long chapterId);
    
    /**
     * 更新章节顺序
     */
    void updateChapterOrder(Long chapterId, Integer newOrder);
    
    /**
     * 移动章节到新的父节点
     */
    void moveChapter(Long chapterId, Long newParentId, Integer newOrder);
    
    /**
     * 批量更新章节顺序
     */
    void batchUpdateChapterOrder(List<Long> chapterIds, List<Integer> orders);
    
    /**
     * 递归删除章节及其子章节
     */
    void deleteChapterRecursively(Long chapterId);
    
    /**
     * 获取章节树形结构
     */
    List<CourseChapter> getChapterTree(String courseId);
}
