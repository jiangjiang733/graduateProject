package com.example.project.controller.admin;

import com.example.project.common.Result;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 管理员认证控制器
 */
@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminAuthController {

    /**
     * 管理员登录
     */
    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody Map<String, String> loginData) {
        String username = loginData.get("username");
        String password = loginData.get("password");
        
        // 用户名 admin，密码 123
        if ("admin".equals(username) && "123".equals(password)) {
            Map<String, Object> data = new HashMap<>();
            
            // 生成简单的 token
            String token = "admin_token_" + System.currentTimeMillis();
            data.put("token", token);
            
            // 管理员信息
            Map<String, Object> adminInfo = new HashMap<>();
            adminInfo.put("id", 1);
            adminInfo.put("username", "admin");
            adminInfo.put("email", "admin@example.com");
            adminInfo.put("role", "ADMIN");
            data.put("adminInfo", adminInfo);
            
            return Result.success(data);
        }
        
        return Result.error("用户名或密码错误");
    }

    /**
     * 管理员登出
     */
    @PostMapping("/logout")
    public Result<Void> logout() {
        return Result.success();
    }

    /**
     * 获取管理员信息
     */
    @GetMapping("/info")
    public Result<Map<String, Object>> getInfo() {
        Map<String, Object> adminInfo = new HashMap<>();
        adminInfo.put("id", 1);
        adminInfo.put("username", "admin");
        adminInfo.put("email", "admin@example.com");
        adminInfo.put("role", "ADMIN");
        
        return Result.success(adminInfo);
    }
}
