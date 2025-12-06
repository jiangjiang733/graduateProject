package com.example.project.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "file")
public class FileUploadConfig {
    private VideoConfig video = new VideoConfig();
    private MaterialConfig material = new MaterialConfig();
    private AccessConfig access = new AccessConfig();
/*      初始化*/
    @PostConstruct
    public void init() {
        createDirectory(video.getUploadDir());
        createDirectory(material.getUploadDir());
    }
    
    private void createDirectory(String directory) {
        try {
            Path path = Paths.get(directory).toAbsolutePath().normalize();
            Files.createDirectories(path);
            System.out.println("创建上传目录: " + path);
        } catch (Exception e) {
            throw new RuntimeException("无法创建上传目录: " + directory + " - " + e.getMessage());
        }
    }
    
    @Getter
    @Setter
    public static class VideoConfig {
        private String uploadDir = "./uploads/video";
        private long maxSize = 524288000L; // 500MB
        private String allowedExtensions = "mp4,avi,mov,wmv";
        
        public List<String> getAllowedExtensionsList() {
            return Arrays.asList(allowedExtensions.toLowerCase().split(","));
        }
    }
    
    @Getter
    @Setter
    public static class MaterialConfig {
        private String uploadDir = "./uploads/material";
        private long maxSize = 52428800L; // 50MB
        private String allowedExtensions = "pdf,doc,docx,ppt,pptx,txt";
        
        public List<String> getAllowedExtensionsList() {
            return Arrays.asList(allowedExtensions.toLowerCase().split(","));
        }
    }
    
    @Getter
    @Setter
    public static class AccessConfig {
        private String baseUrl = "http://localhost:8088/uploads";
    }
}
