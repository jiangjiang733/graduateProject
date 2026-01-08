package com.example.project.service.course.impl;

import com.example.project.entity.course.CourseChapter;
import com.example.project.mapper.course.CourseChapterMapper;
import com.example.project.service.course.CourseChapterService;
import com.example.project.util.FileValidationUtil;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class CourseChapterServiceImpl implements CourseChapterService {

    @Autowired
    private CourseChapterMapper courseChapterMapper;

    @Autowired
    private com.example.project.service.course.CourseCommentService courseCommentService;

    @Value("${file.course.video-dir:./uploads/course/video}")
    private String videoDir;

    @Value("${file.course.pdf-dir:./uploads/course/pdf}")
    private String pdfDir;

    @Override
    @Transactional
    public CourseChapter createChapter(CourseChapter chapter) {
        chapter.setCreateTime(LocalDateTime.now());
        chapter.setUpdateTime(LocalDateTime.now());
        chapter.setStatus(1);
        courseChapterMapper.insert(chapter);
        return chapter;
    }

    @Override
    @Transactional
    public CourseChapter createFolderChapter(String courseId, Long parentId, String title, Integer order) {
        CourseChapter chapter = new CourseChapter();
        chapter.setCourseId(courseId);
        chapter.setParentId(parentId);
        chapter.setChapterTitle(title);
        chapter.setChapterOrder(order);
        chapter.setChapterType("FOLDER");

        return createChapter(chapter);
    }

    @Override
    @Transactional
    public CourseChapter createVideoChapter(String courseId, Long parentId, String title, Integer order,
            MultipartFile videoFile) {
        // 验证视频文件
        FileValidationUtil.validateVideoFile(videoFile);

        // 保存视频文件
        String videoUrl = saveVideoFile(videoFile);

        CourseChapter chapter = new CourseChapter();
        chapter.setCourseId(courseId);
        chapter.setParentId(parentId);
        chapter.setChapterTitle(title);
        chapter.setChapterOrder(order);
        chapter.setChapterType("VIDEO");
        chapter.setVideoUrl(videoUrl);

        return createChapter(chapter);
    }

    @Override
    @Transactional
    public CourseChapter createPdfChapter(String courseId, Long parentId, String title, Integer order,
            MultipartFile pdfFile) {
        // 验证PDF文件
        FileValidationUtil.validatePdfFile(pdfFile);

        // 保存PDF文件
        String pdfUrl = savePdfFile(pdfFile);

        // 提取PDF文本内容
        String pdfContent = extractPdfContent(pdfFile);

        CourseChapter chapter = new CourseChapter();
        chapter.setCourseId(courseId);
        chapter.setParentId(parentId);
        chapter.setChapterTitle(title);
        chapter.setChapterOrder(order);
        chapter.setChapterType("PDF");
        chapter.setPdfUrl(pdfUrl);
        chapter.setPdfContent(pdfContent);

        return createChapter(chapter);
    }

    @Override
    @Transactional
    public CourseChapter createTextChapter(String courseId, Long parentId, String title, Integer order,
            String textContent) {
        CourseChapter chapter = new CourseChapter();
        chapter.setCourseId(courseId);
        chapter.setParentId(parentId);
        chapter.setChapterTitle(title);
        chapter.setChapterOrder(order);
        chapter.setChapterType("TEXT");
        chapter.setTextContent(textContent);

        return createChapter(chapter);
    }

    @Override
    @Transactional
    public CourseChapter createMixedChapter(String courseId, Long parentId, String title, Integer order,
            MultipartFile videoFile, MultipartFile pdfFile, String textContent) {
        CourseChapter chapter = new CourseChapter();
        chapter.setCourseId(courseId);
        chapter.setParentId(parentId);
        chapter.setChapterTitle(title);
        chapter.setChapterOrder(order);
        chapter.setChapterType("MIXED");

        // 处理视频
        if (videoFile != null && !videoFile.isEmpty()) {
            FileValidationUtil.validateVideoFile(videoFile);
            String videoUrl = saveVideoFile(videoFile);
            chapter.setVideoUrl(videoUrl);
        }

        // 处理PDF
        if (pdfFile != null && !pdfFile.isEmpty()) {
            FileValidationUtil.validatePdfFile(pdfFile);
            String pdfUrl = savePdfFile(pdfFile);
            chapter.setPdfUrl(pdfUrl);

            // 提取PDF内容
            String pdfContent = extractPdfContent(pdfFile);
            chapter.setPdfContent(pdfContent);
        }

        // 处理文本
        if (textContent != null && !textContent.isEmpty()) {
            chapter.setTextContent(textContent);
        }

        return createChapter(chapter);
    }

    @Override
    public List<CourseChapter> getCourseChapters(String courseId) {
        return courseChapterMapper.selectByCourseId(courseId);
    }

    @Override
    public List<CourseChapter> getRootChapters(String courseId) {
        return courseChapterMapper.selectRootChapters(courseId);
    }

    @Override
    public List<CourseChapter> getChildChapters(Long parentId) {
        return courseChapterMapper.selectByParentId(parentId);
    }

    @Override
    public CourseChapter getChapterDetail(Long chapterId) {
        return courseChapterMapper.selectById(chapterId);
    }

    @Override
    @Transactional
    public void updateChapter(CourseChapter chapter) {
        chapter.setUpdateTime(LocalDateTime.now());
        courseChapterMapper.updateById(chapter);
    }

    @Override
    @Transactional
    public void deleteChapter(Long chapterId) {
        courseChapterMapper.logicDeleteById(chapterId);
    }

    @Override
    @Transactional
    public void updateChapterOrder(Long chapterId, Integer newOrder) {
        CourseChapter chapter = courseChapterMapper.selectById(chapterId);
        if (chapter != null) {
            chapter.setChapterOrder(newOrder);
            updateChapter(chapter);
        }
    }

    @Override
    @Transactional
    public void moveChapter(Long chapterId, Long newParentId, Integer newOrder) {
        CourseChapter chapter = courseChapterMapper.selectById(chapterId);
        if (chapter == null) {
            throw new RuntimeException("章节不存在");
        }

        // 检查是否会造成循环引用
        if (newParentId != null && isDescendant(chapterId, newParentId)) {
            throw new RuntimeException("不能将章节移动到其子章节下");
        }

        chapter.setParentId(newParentId);
        if (newOrder != null) {
            chapter.setChapterOrder(newOrder);
        }
        updateChapter(chapter);
    }

    @Override
    @Transactional
    public void batchUpdateChapterOrder(List<Long> chapterIds, List<Integer> orders) {
        if (chapterIds == null || orders == null || chapterIds.size() != orders.size()) {
            throw new RuntimeException("参数错误");
        }

        for (int i = 0; i < chapterIds.size(); i++) {
            updateChapterOrder(chapterIds.get(i), orders.get(i));
        }
    }

    @Override
    @Transactional
    public void deleteChapterRecursively(Long chapterId) {
        System.out.println("  → 处理章节ID: " + chapterId);

        // 获取所有子章节
        List<CourseChapter> children = courseChapterMapper.selectByParentId(chapterId);

        if (children != null && !children.isEmpty()) {
            System.out.println("    发现 " + children.size() + " 个子章节,递归删除...");
            // 递归删除子章节
            for (CourseChapter child : children) {
                deleteChapterRecursively(child.getChapterId());
            }
        }

        // 删除当前章节及其关联文件
        CourseChapter chapter = courseChapterMapper.selectById(chapterId);
        if (chapter != null) {
            System.out.println("    章节: " + chapter.getChapterTitle() + " (类型: " + chapter.getChapterType() + ")");

            // 删除章节的所有评论（级联删除）
            deleteChapterComments(chapter.getChapterId());

            // 删除关联文件
            deleteChapterFiles(chapter);

            // 物理删除数据库记录
            courseChapterMapper.deleteById(chapterId);
            System.out.println("    ✅ 章节已从数据库删除");
        }
    }

    /**
     * 删除章节的所有评论（级联删除）
     */
    private void deleteChapterComments(Long chapterId) {
        try {
            courseCommentService.deleteChapterComments(chapterId);
            System.out.println("      ✅ 章节评论已删除");
        } catch (Exception e) {
            System.err.println("      ⚠️ 删除章节评论失败: " + e.getMessage());
        }
    }

    @Override
    public List<CourseChapter> getChapterTree(String courseId) {
        List<CourseChapter> rootChapters = courseChapterMapper.selectRootChapters(courseId);
        for (CourseChapter chapter : rootChapters) {
            buildChapterTree(chapter);
        }
        return rootChapters;
    }

    /**
     * 递归构建章节树
     */
    private void buildChapterTree(CourseChapter chapter) {
        List<CourseChapter> children = courseChapterMapper.selectByParentId(chapter.getChapterId());
        if (children != null && !children.isEmpty()) {
            for (CourseChapter child : children) {
                buildChapterTree(child);
            }
            // 注意：这里需要在CourseChapter实体中添加children字段
            // 由于当前实体没有children字段，这个方法主要用于演示逻辑
        }
    }

    /**
     * 检查targetId是否是chapterId的后代节点
     */
    private boolean isDescendant(Long chapterId, Long targetId) {
        if (chapterId.equals(targetId)) {
            return true;
        }

        CourseChapter target = courseChapterMapper.selectById(targetId);
        if (target == null || target.getParentId() == null) {
            return false;
        }

        return isDescendant(chapterId, target.getParentId());
    }

    /**
     * 删除章节关联的文件
     */
    private void deleteChapterFiles(CourseChapter chapter) {
        try {
            // 删除视频文件
            if (chapter.getVideoUrl() != null && !chapter.getVideoUrl().isEmpty()) {
                deleteFileFromUrl(chapter.getVideoUrl(), videoDir);
            }

            // 删除PDF文件
            if (chapter.getPdfUrl() != null && !chapter.getPdfUrl().isEmpty()) {
                deleteFileFromUrl(chapter.getPdfUrl(), pdfDir);
            }

            // 删除封面图片
            if (chapter.getCoverImage() != null && !chapter.getCoverImage().isEmpty()) {
                deleteFileFromUrl(chapter.getCoverImage(), "./uploads/course/cover");
            }
        } catch (Exception e) {
            System.err.println("删除文件失败: " + e.getMessage());
        }
    }

    /**
     * 从URL中提取文件名并删除文件
     */
    private void deleteFileFromUrl(String fileUrl, String directory) {
        try {
            // 处理./uploads和/uploads两种URL格式
            String cleanUrl = fileUrl;
            if (cleanUrl.startsWith("./")) {
                cleanUrl = cleanUrl.substring(1); // 去掉./
            }

            // 从URL中提取文件名
            String filename = cleanUrl.substring(cleanUrl.lastIndexOf("/") + 1);

            // 使用绝对路径
            Path dirPath = Paths.get(directory).toAbsolutePath().normalize();
            Path filePath = dirPath.resolve(filename);

            System.out.println("      尝试删除文件: " + filePath.toAbsolutePath());

            if (Files.exists(filePath)) {
                Files.delete(filePath);
                System.out.println("      ✅ 文件已删除: " + filename);
            } else {
                System.out.println("      ⚠️ 文件不存在,跳过: " + filePath);
            }
        } catch (Exception e) {
            System.err.println("      ❌ 删除文件失败: " + fileUrl);
            e.printStackTrace();
        }
    }

    /**
     * 保存视频文件
     */
    private String saveVideoFile(MultipartFile file) {
        return saveFile(file, videoDir, "video");
    }

    /**
     * 保存PDF文件
     */
    private String savePdfFile(MultipartFile file) {
        return saveFile(file, pdfDir, "pdf");
    }

    /**
     * 保存文件的通用方法
     */
    private String saveFile(MultipartFile file, String directory, String prefix) {
        try {
            // 创建目录
            Path dirPath = Paths.get(directory).toAbsolutePath().normalize();
            Files.createDirectories(dirPath);

            // 获取原始文件名并验证安全性
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || !FileValidationUtil.isSafeFilename(originalFilename)) {
                throw new RuntimeException("文件名不安全");
            }

            // 生成唯一文件名
            String extension = getFileExtension(originalFilename);
            String filename = prefix + "_" + System.currentTimeMillis() + "_" +
                    UUID.randomUUID().toString().substring(0, 8) + extension;

            // 保存文件(使用REPLACE_EXISTING避免文件名冲突)
            Path filePath = dirPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // 打印调试信息
            System.out.println("=== 文件保存成功 ===");
            System.out.println("配置目录: " + directory);
            System.out.println("绝对路径: " + dirPath.toAbsolutePath());
            System.out.println("文件名: " + filename);
            System.out.println("完整路径: " + filePath.toAbsolutePath());
            System.out.println("文件大小: " + Files.size(filePath) + " bytes");

            // 返回相对URL(以/开头,不是./开头)
            String relativeUrl = "/uploads/course/" + prefix + "/" + filename;
            System.out.println("返回URL: " + relativeUrl);

            return relativeUrl;
        } catch (Exception e) {
            throw new RuntimeException("文件保存失败: " + e.getMessage(), e);
        }
    }

    /**
     * 获取文件扩展名
     */
    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf(".");
        if (lastDotIndex == -1) {
            return "";
        }
        return filename.substring(lastDotIndex);
    }

    /**
     * 提取PDF文本内容
     */
    private String extractPdfContent(MultipartFile pdfFile) {
        try {
            PDDocument document = PDDocument.load(pdfFile.getInputStream());
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);
            document.close();
            return text;
        } catch (Exception e) {
            System.err.println("PDF内容提取失败: " + e.getMessage());
            return "";
        }
    }
}
