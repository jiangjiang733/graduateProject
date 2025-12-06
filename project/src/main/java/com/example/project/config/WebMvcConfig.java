package com.example.project.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${file.upload.base-dir:D:/Graduation project/uploads}")
    private String uploadBaseDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 获取项目根目录
        String projectPath = System.getProperty("user.dir");
        // 构建绝对路径
        String absolutePath;
        if (uploadBaseDir.startsWith("./") || uploadBaseDir.startsWith(".\\")) {
            // 相对路径,转换为绝对路径
            absolutePath = projectPath + uploadBaseDir.substring(1);
        } else if (uploadBaseDir.startsWith("/") || uploadBaseDir.matches("^[A-Za-z]:.*")) {
            // 已经是绝对路径
            absolutePath = uploadBaseDir;
        } else {
            // 其他情况,拼接项目路径
            absolutePath = projectPath + "/" + uploadBaseDir;
        }
        
        String resourceLocation = "file:" + absolutePath + "/";
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(resourceLocation);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .maxAge(3600);
    }
}
