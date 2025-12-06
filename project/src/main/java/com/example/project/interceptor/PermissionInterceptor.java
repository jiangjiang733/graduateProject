package com.example.project.interceptor;

import com.example.project.exception.PermissionDeniedException;
import com.example.project.exception.UnauthorizedException;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * 权限拦截器
 * 用于验证用户是否有权限访问资源
 */
@Component
public class PermissionInterceptor implements HandlerInterceptor {
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 放行OPTIONS预检请求
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        
        // 获取请求路径
        String requestURI = request.getRequestURI();
        
        // 放行登录、注册等公开接口
        if (requestURI.contains("/login") || 
            requestURI.contains("/register") ||
            requestURI.contains("/uploads/") ||
            requestURI.contains("/api/video/stream/") ||
            requestURI.contains("/api/pdf/preview/") ||
            requestURI.contains("/api/course/search") ||
            requestURI.contains("/api/course/chapter/list") ||
            requestURI.contains("/api/dashboard")) {
            return true;
        }
        
        // 从请求头或参数中获取用户ID（实际项目中应该从Token中解析）
        String userId = request.getParameter("teacherId");
        if (userId == null || userId.isEmpty()) {
            userId = request.getParameter("userId");
        }
        if (userId == null || userId.isEmpty()) {
            userId = request.getParameter("studentId");
        }
        if (userId == null || userId.isEmpty()) {
            userId = request.getHeader("X-User-Id");
        }
        
        // 如果没有用户ID，返回未授权（但对于GET请求可以放宽限制）
        if (userId == null || userId.isEmpty()) {
            // 对于GET请求，如果是查询类接口，可以放行
            if ("GET".equalsIgnoreCase(request.getMethod()) && 
                (requestURI.contains("/api/course/") || 
                 requestURI.contains("/api/chapter/"))) {
                return true;
            }
            throw new UnauthorizedException("请先登录");
        }
        
        // 将用户ID存储到request attribute中，供后续使用
        request.setAttribute("currentUserId", userId);
        
        return true;
    }
}
