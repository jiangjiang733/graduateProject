package com.example.project.controller;

import com.example.project.entity.Teacher;
import com.example.project.service.teacherHeadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.HashMap;
import java.util.Map;
@RestController
@RequestMapping("/api/upload")
@CrossOrigin(origins = "*")
public class AvatarController {
    
    @Autowired
    private teacherHeadService teacherHeadService;
    
    @PostMapping("/avatar/{teacherId}")
    public ResponseEntity<Map<String, Object>> uploadAvatar(
            @PathVariable Integer teacherId,
            @RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();
        try {
            // 更新头像
            teacherHeadService.updateAvatar(teacherId, file);
            // 获取更新后的教师信息
            Teacher teacher = teacherHeadService.getTeacherById(teacherId);
            response.put("success", true);
            response.put("message", "头像上传成功");
            response.put("avatarUrl", teacher.getTeacherHead());
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "头像上传失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    @GetMapping("/avatar/{teacherId}")
    public ResponseEntity<Map<String, Object>> getAvatar(@PathVariable Integer teacherId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Teacher teacher = teacherHeadService.getTeacherById(teacherId);
            if (teacher != null && teacher.getTeacherHead() != null) {
                response.put("success", true);
                response.put("avatarUrl", teacher.getTeacherHead());
            } else {
                response.put("success", false);
                response.put("message", "头像不存在");
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "获取头像失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
