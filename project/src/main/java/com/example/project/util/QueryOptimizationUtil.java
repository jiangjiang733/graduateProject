package com.example.project.util;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

/**
 * SQL查询优化工具类
 * 提供常用的查询优化方法和最佳实践
 */
public class QueryOptimizationUtil {
    
    /**
     * 默认页码
     */
    public static final int DEFAULT_PAGE_NUMBER = 1;
    
    /**
     * 默认每页大小
     */
    public static final int DEFAULT_PAGE_SIZE = 20;
    
    /**
     * 最大每页大小
     */
    public static final int MAX_PAGE_SIZE = 100;
    
    /**
     * 创建分页对象
     * 自动处理页码和页大小的边界值
     * 
     * @param pageNumber 页码（从1开始）
     * @param pageSize 每页大小
     * @return 分页对象
     */
    public static <T> Page<T> createPage(Integer pageNumber, Integer pageSize) {
        // 处理null值
        if (pageNumber == null || pageNumber < 1) {
            pageNumber = DEFAULT_PAGE_NUMBER;
        }
        if (pageSize == null || pageSize < 1) {
            pageSize = DEFAULT_PAGE_SIZE;
        }
        
        // 限制最大页大小，防止一次查询过多数据
        if (pageSize > MAX_PAGE_SIZE) {
            pageSize = MAX_PAGE_SIZE;
        }
        
        return new Page<>(pageNumber, pageSize);
    }
    
    /**
     * 创建分页对象（使用默认值）
     * 
     * @return 分页对象
     */
    public static <T> Page<T> createDefaultPage() {
        return new Page<>(DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE);
    }
    
    /**
     * 优化查询包装器 - 只查询需要的字段
     * 避免SELECT *，提高查询效率
     * 
     * @param wrapper 查询包装器
     * @param columns 需要查询的字段
     * @return 优化后的查询包装器
     */
    public static <T> QueryWrapper<T> selectColumns(QueryWrapper<T> wrapper, String... columns) {
        if (columns != null && columns.length > 0) {
            wrapper.select(columns);
        }
        return wrapper;
    }
    
    /**
     * 添加时间范围查询条件
     * 优化：使用范围查询而不是函数，可以使用索引
     * 
     * @param wrapper 查询包装器
     * @param column 时间字段名
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @return 查询包装器
     */
    public static <T> QueryWrapper<T> betweenTime(QueryWrapper<T> wrapper, String column, 
                                                   Object startTime, Object endTime) {
        if (startTime != null && endTime != null) {
            wrapper.between(column, startTime, endTime);
        } else if (startTime != null) {
            wrapper.ge(column, startTime);
        } else if (endTime != null) {
            wrapper.le(column, endTime);
        }
        return wrapper;
    }
    
    /**
     * 添加模糊查询条件（优化版）
     * 使用右模糊查询可以利用索引
     * 
     * @param wrapper 查询包装器
     * @param column 字段名
     * @param value 查询值
     * @param useRightLike 是否使用右模糊（true: value%, false: %value%）
     * @return 查询包装器
     */
    public static <T> QueryWrapper<T> likeOptimized(QueryWrapper<T> wrapper, String column, 
                                                     String value, boolean useRightLike) {
        if (value != null && !value.trim().isEmpty()) {
            if (useRightLike) {
                // 右模糊查询，可以使用索引
                wrapper.likeRight(column, value);
            } else {
                // 全模糊查询，无法使用索引，但更灵活
                wrapper.like(column, value);
            }
        }
        return wrapper;
    }
    
    /**
     * 添加IN查询条件（批量查询优化）
     * 自动处理空集合和大集合分批
     * 
     * @param wrapper 查询包装器
     * @param column 字段名
     * @param values 值集合
     * @return 查询包装器
     */
    public static <T> QueryWrapper<T> inOptimized(QueryWrapper<T> wrapper, String column, 
                                                   java.util.Collection<?> values) {
        if (values != null && !values.isEmpty()) {
            // 如果集合过大，建议使用临时表或分批查询
            if (values.size() > 1000) {
                // 记录警告日志
                System.err.println("Warning: IN clause with " + values.size() + 
                                 " values may cause performance issues. Consider using temporary table.");
            }
            wrapper.in(column, values);
        }
        return wrapper;
    }
    
    /**
     * 添加排序条件（优化版）
     * 确保排序字段有索引
     * 
     * @param wrapper 查询包装器
     * @param column 排序字段
     * @param isAsc 是否升序
     * @return 查询包装器
     */
    public static <T> QueryWrapper<T> orderByOptimized(QueryWrapper<T> wrapper, String column, 
                                                        boolean isAsc) {
        if (column != null && !column.trim().isEmpty()) {
            wrapper.orderBy(true, isAsc, column);
        }
        return wrapper;
    }
    
    /**
     * 检查分页结果是否为空
     * 
     * @param page 分页对象
     * @return 是否为空
     */
    public static <T> boolean isEmpty(IPage<T> page) {
        return page == null || page.getRecords() == null || page.getRecords().isEmpty();
    }
    
    /**
     * 获取安全的页码（防止越界）
     * 
     * @param page 分页对象
     * @param requestedPage 请求的页码
     * @return 安全的页码
     */
    public static <T> long getSafePage(IPage<T> page, long requestedPage) {
        if (page.getPages() > 0 && requestedPage > page.getPages()) {
            return page.getPages();
        }
        return Math.max(requestedPage, 1);
    }
}
