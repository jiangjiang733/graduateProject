package com.example.project.controller.course;

import com.example.project.entity.course.CourseChapter;
import com.example.project.mapper.course.CourseChapterMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/pdf")
@CrossOrigin(origins = "*")
public class PDFController {

    @Autowired
    private CourseChapterMapper chapterMapper;

    /**
     * 在线预览PDF
     */
    @GetMapping("/preview/{chapterId}")
    public ResponseEntity<Resource> previewPDF(@PathVariable Long chapterId) {
        try {
            // 获取章节信息
            CourseChapter chapter = chapterMapper.selectById(chapterId);
            if (chapter == null || chapter.getPdfUrl() == null) {
                return ResponseEntity.notFound().build();
            }

            // 从URL中提取文件路径
            String pdfUrl = chapter.getPdfUrl();
            String filePath = extractFilePath(pdfUrl);
            File pdfFile = new File(filePath);

            if (!pdfFile.exists()) {
                return ResponseEntity.notFound().build();
            }

            Resource resource = new FileSystemResource(pdfFile);

            // 使用inline让浏览器在线预览
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + 
                            URLEncoder.encode(pdfFile.getName(), StandardCharsets.UTF_8.toString()) + "\"")
                    .body(resource);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 下载PDF
     */
    @GetMapping("/download/{chapterId}")
    public ResponseEntity<Resource> downloadPDF(@PathVariable Long chapterId) {
        try {
            // 获取章节信息
            CourseChapter chapter = chapterMapper.selectById(chapterId);
            if (chapter == null || chapter.getPdfUrl() == null) {
                return ResponseEntity.notFound().build();
            }

            // 从URL中提取文件路径
            String pdfUrl = chapter.getPdfUrl();
            String filePath = extractFilePath(pdfUrl);
            File pdfFile = new File(filePath);

            if (!pdfFile.exists()) {
                return ResponseEntity.notFound().build();
            }

            Resource resource = new FileSystemResource(pdfFile);

            // 使用attachment让浏览器下载
            String filename = chapter.getChapterTitle() + ".pdf";
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + 
                            URLEncoder.encode(filename, StandardCharsets.UTF_8.toString()) + "\"")
                    .body(resource);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 获取PDF文本内容
     */
    @GetMapping("/text/{chapterId}")
    public ResponseEntity<String> getPDFText(@PathVariable Long chapterId) {
        try {
            CourseChapter chapter = chapterMapper.selectById(chapterId);
            if (chapter == null) {
                return ResponseEntity.notFound().build();
            }

            String pdfContent = chapter.getPdfContent();
            if (pdfContent == null || pdfContent.isEmpty()) {
                return ResponseEntity.ok("暂无文本内容");
            }

            return ResponseEntity.ok(pdfContent);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 从URL中提取文件路径
     */
    private String extractFilePath(String pdfUrl) {
        // 如果是完整URL，提取路径部分
        if (pdfUrl.startsWith("http://") || pdfUrl.startsWith("https://")) {
            // 提取 /uploads/... 部分
            int uploadsIndex = pdfUrl.indexOf("/uploads/");
            if (uploadsIndex != -1) {
                pdfUrl = pdfUrl.substring(uploadsIndex);
            }
        }

        // 移除开头的斜杠
        if (pdfUrl.startsWith("/")) {
            pdfUrl = pdfUrl.substring(1);
        }

        // 返回相对于项目根目录的路径
        return "./" + pdfUrl;
    }
}
