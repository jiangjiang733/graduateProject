package com.example.project.util;

import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;

/**
 * 文件验证工具类
 */
public class FileValidationUtil {
    
    // 视频文件允许的扩展名
    private static final List<String> VIDEO_EXTENSIONS = Arrays.asList(
        ".mp4", ".avi", ".mov", ".wmv", ".flv", ".mkv", ".webm"
    );
    
    // PDF文件允许的扩展名
    private static final List<String> PDF_EXTENSIONS = Arrays.asList(".pdf");
    
    // 图片文件允许的扩展名
    private static final List<String> IMAGE_EXTENSIONS = Arrays.asList(
        ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"
    );
    
    // 文件大小限制（字节）
    private static final long MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
    private static final long MAX_PDF_SIZE = 50 * 1024 * 1024;    // 50MB
    private static final long MAX_IMAGE_SIZE = 10 * 1024 * 1024;  // 10MB
    
    /**
     * 验证视频文件
     */
    public static void validateVideoFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("文件不能为空");
        }
        
        String filename = file.getOriginalFilename();
        if (filename == null) {
            throw new RuntimeException("文件名不能为空");
        }
        
        // 检查文件扩展名
        String extension = getFileExtension(filename).toLowerCase();
        if (!VIDEO_EXTENSIONS.contains(extension)) {
            throw new RuntimeException("不支持的视频格式，仅支持: " + String.join(", ", VIDEO_EXTENSIONS));
        }
        
        // 检查文件大小
        if (file.getSize() > MAX_VIDEO_SIZE) {
            throw new RuntimeException("视频文件大小不能超过 " + (MAX_VIDEO_SIZE / 1024 / 1024) + "MB");
        }
        
        // 检查MIME类型
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("video/")) {
            throw new RuntimeException("文件类型错误，必须是视频文件");
        }
    }
    
    /**
     * 验证PDF文件
     */
    public static void validatePdfFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("文件不能为空");
        }
        
        String filename = file.getOriginalFilename();
        if (filename == null) {
            throw new RuntimeException("文件名不能为空");
        }
        
        // 检查文件扩展名
        String extension = getFileExtension(filename).toLowerCase();
        if (!PDF_EXTENSIONS.contains(extension)) {
            throw new RuntimeException("不支持的文件格式，仅支持PDF文件");
        }
        
        // 检查文件大小
        if (file.getSize() > MAX_PDF_SIZE) {
            throw new RuntimeException("PDF文件大小不能超过 " + (MAX_PDF_SIZE / 1024 / 1024) + "MB");
        }
        
        // 检查MIME类型
        String contentType = file.getContentType();
        if (contentType == null || !contentType.equals("application/pdf")) {
            throw new RuntimeException("文件类型错误，必须是PDF文件");
        }
    }
    
    /**
     * 验证图片文件
     */
    public static void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("文件不能为空");
        }
        
        String filename = file.getOriginalFilename();
        if (filename == null) {
            throw new RuntimeException("文件名不能为空");
        }
        
        // 检查文件扩展名
        String extension = getFileExtension(filename).toLowerCase();
        if (!IMAGE_EXTENSIONS.contains(extension)) {
            throw new RuntimeException("不支持的图片格式，仅支持: " + String.join(", ", IMAGE_EXTENSIONS));
        }
        
        // 检查文件大小
        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new RuntimeException("图片文件大小不能超过 " + (MAX_IMAGE_SIZE / 1024 / 1024) + "MB");
        }
        
        // 检查MIME类型
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("文件类型错误，必须是图片文件");
        }
    }
    
    /**
     * 获取文件扩展名
     */
    private static String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf(".");
        if (lastDotIndex == -1) {
            return "";
        }
        return filename.substring(lastDotIndex);
    }
    
    /**
     * 检查文件名是否安全（防止路径遍历攻击）
     */
    public static boolean isSafeFilename(String filename) {
        if (filename == null || filename.isEmpty()) {
            return false;
        }
        
        // 检查是否包含路径分隔符
        if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            return false;
        }
        
        return true;
    }
}
