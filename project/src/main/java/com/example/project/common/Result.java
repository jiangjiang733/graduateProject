package com.example.project.common;

import lombok.Data;
import java.io.Serializable;

/**
 * 统一响应结果类
 * @param <T> 数据类型
 */
@Data
public class Result<T> implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 是否成功
     */
    private Boolean success;
    
    /**
     * 响应消息
     */
    private String message;
    
    /**
     * 响应数据
     */
    private T data;
    
    /**
     * 响应代码
     */
    private Integer code;
    
    /**
     * 时间戳
     */
    private Long timestamp;
    
    public Result() {
        this.timestamp = System.currentTimeMillis();
    }
    
    public Result(Boolean success, String message) {
        this();
        this.success = success;
        this.message = message;
    }
    
    public Result(Boolean success, String message, T data) {
        this();
        this.success = success;
        this.message = message;
        this.data = data;
    }
    
    public Result(Boolean success, Integer code, String message, T data) {
        this();
        this.success = success;
        this.code = code;
        this.message = message;
        this.data = data;
    }
    
    /**
     * 成功响应（无数据）
     */
    public static <T> Result<T> success() {
        return new Result<>(true, 200, "操作成功", null);
    }
    
    /**
     * 成功响应（带消息）
     */
    public static <T> Result<T> success(String message) {
        return new Result<>(true, 200, message, null);
    }
    
    /**
     * 成功响应（带数据）
     */
    public static <T> Result<T> success(T data) {
        return new Result<>(true, 200, "操作成功", data);
    }
    
    /**
     * 成功响应（带消息和数据）
     */
    public static <T> Result<T> success(String message, T data) {
        return new Result<>(true, 200, message, data);
    }
    
    /**
     * 失败响应（无数据）
     */
    public static <T> Result<T> error() {
        return new Result<>(false, 500, "操作失败", null);
    }
    
    /**
     * 失败响应（带消息）
     */
    public static <T> Result<T> error(String message) {
        return new Result<>(false, 500, message, null);
    }
    
    /**
     * 失败响应（带代码和消息）
     */
    public static <T> Result<T> error(Integer code, String message) {
        return new Result<>(false, code, message, null);
    }
    
    /**
     * 失败响应（带代码、消息和数据）
     */
    public static <T> Result<T> error(Integer code, String message, T data) {
        return new Result<>(false, code, message, data);
    }
}
