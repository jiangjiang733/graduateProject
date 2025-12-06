package com.example.project.controller.course;

import com.example.project.dto.ChapterUpdateDTO;
import com.example.project.entity.course.Course;
import com.example.project.entity.course.CourseChapter;
import com.example.project.mapper.course.CourseChapterMapper;
import com.example.project.mapper.course.CourseMapper;
import com.example.project.service.course.CourseChapterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 课程章节管理控制器
 * 负责章节的增删改查、文件上传等操作
 */
@RestController
@RequestMapping("/api/course/chapter")
@CrossOrigin(origins = "*")
public class CourseChapterController {
    
    @Autowired
    private CourseChapterService courseChapterService;
    
    @Autowired
    private CourseChapterMapper chapterMapper;
    
    @Autowired
    private CourseMapper courseMapper;

    @Value("${file.access.base-url}")
    private String fileAccessBaseUrl;

    @Value("${file.course.cover-dir}")
    private String coverUploadDir;
    
    /**
     * 创建文件夹章节
     */
    @PostMapping("/folder")
    public ResponseEntity<Map<String, Object>> createFolderChapter(
            @RequestParam("courseId") String courseId,
            @RequestParam(value = "parentId", required = false) Long parentId,
            @RequestParam("title") String title,
            @RequestParam("order") Integer order) {
        
        Map<String, Object> response = new HashMap<>();
        try {
            CourseChapter chapter = courseChapterService.createFolderChapter(courseId, parentId, title, order);
            response.put("success", true);
            response.put("message", "文件夹创建成功");
            response.put("data", chapter);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "创建失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * 创建视频章节,获取前端视频上传的接口
     */
    @PostMapping("/video")
    public ResponseEntity<Map<String, Object>> createVideoChapter(
            @RequestParam("courseId") String courseId,
            @RequestParam(value = "parentId", required = false) Long parentId,
            @RequestParam("title") String title,
            @RequestParam("order") Integer order,
            @RequestParam(value = "video", required = true) MultipartFile video) {
            Map<String, Object> response = new HashMap<>();
            try {
                CourseChapter chapter = courseChapterService.createVideoChapter(courseId, parentId, title, order, video);
                response.put("success", true);
                response.put("message", "视频章节创建成功");
                response.put("data", chapter);
                return ResponseEntity.ok(response);
            } catch (Exception e) {
                response.put("success", false);
                response.put("message",  e.getMessage());
                return ResponseEntity.internalServerError().body(response);
            }
        }
    /**
     * 创建PDF章节
     */
    @PostMapping("/pdf")
    public ResponseEntity<Map<String, Object>> createPdfChapter(
            @RequestParam("courseId") String courseId,
            @RequestParam(value = "parentId", required = false) Long parentId,
            @RequestParam("title") String title,
            @RequestParam("order") Integer order,
            @RequestParam(value = "pdf", required = false) MultipartFile pdf) {
        
        Map<String, Object> response = new HashMap<>();
        try {
            CourseChapter chapter;
            if (pdf != null && !pdf.isEmpty()) {
                // 文件验证在service层进行
                chapter = courseChapterService.createPdfChapter(courseId, parentId, title, order, pdf);
            } else {
                // 创建PDF章节但不上传文件
                chapter = new CourseChapter();
                chapter.setCourseId(courseId);
                chapter.setParentId(parentId);
                chapter.setChapterTitle(title);
                chapter.setChapterOrder(order);
                chapter.setChapterType("PDF");
                chapter = courseChapterService.createChapter(chapter);
            }
            response.put("success", true);
            response.put("message", "PDF章节创建成功");
            response.put("data", chapter);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "创建失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 创建混合章节（支持同时上传视频和PDF）
     */
    @PostMapping("/mixed")
    public ResponseEntity<Map<String, Object>> createMixedChapter(
//            获取参数请求头
            @RequestParam("courseId") String courseId,
            @RequestParam(value = "parentId", required = false) Long parentId,
            @RequestParam("title") String title,
            @RequestParam("order") Integer order,
            @RequestParam(value = "video", required = false) MultipartFile video,
            @RequestParam(value = "pdf", required = false) MultipartFile pdf,
            @RequestParam(value = "content", required = false) String content) {
        
        // ========== 详细日志 ==========
        System.out.println("\n=== 混合章节创建请求 ===");
        System.out.println("课程ID: " + courseId);
        System.out.println("章节标题: " + title);
        System.out.println("视频文件: " + (video != null && !video.isEmpty() ? video.getOriginalFilename() + " (" + video.getSize() + " bytes)" : "无"));
        System.out.println("PDF文件: " + (pdf != null && !pdf.isEmpty() ? pdf.getOriginalFilename() + " (" + pdf.getSize() + " bytes)" : "无"));
        System.out.println("文本内容: " + (content != null && !content.isEmpty() ? "是 (" + content.length() + " 字符)" : "无"));
        
        Map<String, Object> response = new HashMap<>();
        try {
            CourseChapter chapter = courseChapterService.createMixedChapter(
                courseId, parentId, title, order, video, pdf, content);
            System.out.println("  - videoUrl: " + chapter.getVideoUrl());
            System.out.println("  - pdfUrl: " + chapter.getPdfUrl());
            System.out.println("  - textContent: " + (chapter.getTextContent() != null ? "有" : "无"));
            System.out.println("=== 请求处理完成 ===\n");
            
            response.put("success", true);
            response.put("message", "章节创建成功");
            response.put("data", chapter);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("创建失败: " + e.getMessage());
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "创建失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 创建文本章节
     */
    @PostMapping("/text")
    public ResponseEntity<Map<String, Object>> createTextChapter(
            @RequestParam("courseId") String courseId,
            @RequestParam(value = "parentId", required = false) Long parentId,
            @RequestParam("title") String title,
            @RequestParam("order") Integer order,
            @RequestParam(value = "content", required = false) String content) {
        
        Map<String, Object> response = new HashMap<>();
        try {
            CourseChapter chapter = courseChapterService.createTextChapter(courseId, parentId, title, order, content);
            response.put("success", true);
            response.put("message", "文本章节创建成功");
            response.put("data", chapter);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "创建失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 获取课程章节列表
     */
    @GetMapping("/list/{courseId}")
    public ResponseEntity<Map<String, Object>> getCourseChapters(@PathVariable String courseId) {
        Map<String, Object> response = new HashMap<>();
        try {
            List<CourseChapter> chapters = courseChapterService.getCourseChapters(courseId);
            response.put("success", true);
            response.put("data", chapters);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "获取失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 获取章节详情
     */
    @GetMapping("/{chapterId}")
    public ResponseEntity<Map<String, Object>> getChapterDetail(@PathVariable Long chapterId) {
        Map<String, Object> response = new HashMap<>();
        try {
            CourseChapter chapter = courseChapterService.getChapterDetail(chapterId);
            response.put("success", true);
            response.put("data", chapter);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "获取失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 删除章节
     */
    @DeleteMapping("/{chapterId}")
    public ResponseEntity<Map<String, Object>> deleteChapter(@PathVariable Long chapterId) {
        Map<String, Object> response = new HashMap<>();
        try {
            System.out.println("\n=== 删除章节请求 ===");
            System.out.println("章节ID: " + chapterId);
            
            // 调用递归删除方法,删除子章节和关联文件
            courseChapterService.deleteChapterRecursively(chapterId);
            
            response.put("success", true);
            response.put("message", "删除成功");
            System.out.println("=== 删除成功 ===\n");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("删除失败: " + e.getMessage());
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "删除失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 更新章节信息
     */
    @PutMapping("/{chapterId}")
    public ResponseEntity<Map<String, Object>> updateChapter(
            @PathVariable Long chapterId,
            @RequestParam String userId,
            @RequestBody ChapterUpdateDTO dto) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            CourseChapter chapter = chapterMapper.selectById(chapterId);
            if (chapter == null) {
                response.put("success", false);
                response.put("message", "章节不存在");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
            
            // 验证权限
            Course course = courseMapper.selectById(chapter.getCourseId());
            if (course == null || !course.getTeacherId().equals(userId)) {
                response.put("success", false);
                response.put("message", "无权限编辑此章节");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }
            
            // 更新字段
            if (dto.getChapterTitle() != null && !dto.getChapterTitle().isEmpty()) {
                chapter.setChapterTitle(dto.getChapterTitle());
            }
            if (dto.getChapterOrder() != null) {
                chapter.setChapterOrder(dto.getChapterOrder());
            }
            if (dto.getTextContent() != null) {
                chapter.setTextContent(dto.getTextContent());
            }
            if (dto.getCoverImage() != null && !dto.getCoverImage().isEmpty()) {
                chapter.setCoverImage(dto.getCoverImage());
            }
            if (dto.getParentId() != null) {
                chapter.setParentId(dto.getParentId());
            }
            
            chapter.setUpdateTime(LocalDateTime.now());
            chapterMapper.updateById(chapter);
            
            response.put("success", true);
            response.put("message", "章节更新成功");
            response.put("data", chapter);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "更新失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 更新章节封面
     */
    @PostMapping("/{chapterId}/cover")
    public ResponseEntity<Map<String, Object>> updateChapterCover(
            @PathVariable Long chapterId,
            @RequestParam String userId,
            @RequestParam("cover") MultipartFile coverImage) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            CourseChapter chapter = chapterMapper.selectById(chapterId);
            if (chapter == null) {
                response.put("success", false);
                response.put("message", "章节不存在");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
            
            // 验证权限
            Course course = courseMapper.selectById(chapter.getCourseId());
            if (course == null || !course.getTeacherId().equals(userId)) {
                response.put("success", false);
                response.put("message", "无权限编辑此章节");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }
            
            // 验证图片文件
            com.example.project.util.FileValidationUtil.validateImageFile(coverImage);
            
            // 删除旧封面
            if (chapter.getCoverImage() != null && !chapter.getCoverImage().isEmpty()) {
                deleteOldCoverFile(chapter.getCoverImage());
            }
            
            // 保存新图片
            String coverUrl = saveFile(coverImage, coverUploadDir, "cover");
            
            chapter.setCoverImage(coverUrl);
            chapter.setUpdateTime(LocalDateTime.now());
            chapterMapper.updateById(chapter);
            
            response.put("success", true);
            response.put("message", "封面更新成功");
            response.put("coverUrl", coverUrl);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "更新失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 删除旧封面文件
     */
    private void deleteOldCoverFile(String coverUrl) {
        try {
            String filename = coverUrl.substring(coverUrl.lastIndexOf("/") + 1);
            Path filePath = Paths.get(coverUploadDir).resolve(filename);
            if (Files.exists(filePath)) {
                Files.delete(filePath);
            }
        } catch (Exception e) {
            System.err.println("删除旧封面失败: " + e.getMessage());
        }
    }
    
    /**
     * 移动章节到新的父节点
     */
    @PostMapping("/{chapterId}/move")
    public ResponseEntity<Map<String, Object>> moveChapter(
            @PathVariable Long chapterId,
            @RequestParam String userId,
            @RequestParam(required = false) Long newParentId,
            @RequestParam(required = false) Integer newOrder) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            CourseChapter chapter = chapterMapper.selectById(chapterId);
            if (chapter == null) {
                response.put("success", false);
                response.put("message", "章节不存在");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
            
            // 验证权限
            Course course = courseMapper.selectById(chapter.getCourseId());
            if (course == null || !course.getTeacherId().equals(userId)) {
                response.put("success", false);
                response.put("message", "无权限编辑此章节");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }
            
            // 更新父节点和顺序
            if (newParentId != null) {
                chapter.setParentId(newParentId);
            }
            if (newOrder != null) {
                chapter.setChapterOrder(newOrder);
            }
            
            chapter.setUpdateTime(LocalDateTime.now());
            chapterMapper.updateById(chapter);
            
            response.put("success", true);
            response.put("message", "章节移动成功");
            response.put("data", chapter);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "移动失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 批量更新章节顺序
     */
    @PostMapping("/batch-order")
    public ResponseEntity<Map<String, Object>> batchUpdateOrder(
            @RequestBody Map<String, Object> requestData) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> updates = (List<Map<String, Object>>) requestData.get("updates");
            String userId = (String) requestData.get("userId");
            
            if (updates == null || updates.isEmpty()) {
                response.put("success", false);
                response.put("message", "更新数据不能为空");
                return ResponseEntity.badRequest().body(response);
            }
            
            // 验证权限（检查第一个章节的课程权限）
            Long firstChapterId = Long.valueOf(updates.get(0).get("chapterId").toString());
            CourseChapter firstChapter = chapterMapper.selectById(firstChapterId);
            if (firstChapter != null) {
                Course course = courseMapper.selectById(firstChapter.getCourseId());
                if (course == null || !course.getTeacherId().equals(userId)) {
                    response.put("success", false);
                    response.put("message", "无权限编辑此课程的章节");
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
                }
            }
            
            // 批量更新
            for (Map<String, Object> update : updates) {
                Long chapterId = Long.valueOf(update.get("chapterId").toString());
                Integer newOrder = Integer.valueOf(update.get("order").toString());
                
                CourseChapter chapter = chapterMapper.selectById(chapterId);
                if (chapter != null) {
                    chapter.setChapterOrder(newOrder);
                    chapter.setUpdateTime(LocalDateTime.now());
                    chapterMapper.updateById(chapter);
                }
            }
            
            response.put("success", true);
            response.put("message", "批量更新成功");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "批量更新失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 保存文件的辅助方法
     */
    private String saveFile(MultipartFile file, String directory, String prefix) {
        try {
            Path dirPath = Paths.get(directory).toAbsolutePath().normalize();
            Files.createDirectories(dirPath);
            
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            String filename = prefix + "_" + System.currentTimeMillis() + "_" + 
                            UUID.randomUUID().toString().substring(0, 8) + extension;
            
            Path filePath = dirPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath);
            
            return fileAccessBaseUrl + "/course/cover/" + filename;
        } catch (Exception e) {
            throw new RuntimeException("文件保存失败: " + e.getMessage(), e);
        }
    }
}
