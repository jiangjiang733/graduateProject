package com.example.project.entity.question;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.io.Serializable;
import java.util.Date;

/**
 * 题库资源表
 */
@Data
@TableName("question_bank")
public class QuestionBank implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 题目ID
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 所属课程ID
     */
    private String courseId;

    /**
     * 创建教师ID
     */
    private Integer teacherId;

    /**
     * 题目类型(SINGLE-单选, MULTIPLE-多选, JUDGE-判断, ESSAY-简答)
     */
    private String type;

    /**
     * 难度等级(1-简单, 2-中等, 3-困难)
     */
    private Integer difficulty;

    /**
     * 题目题干内容
     */
    private String content;

    /**
     * 选项内容(JSON字符串格式)
     */
    private String options;

    /**
     * 参考答案
     */
    private String answer;

    /**
     * 题目解析/答案详解
     */
    private String analysis;

    /**
     * 被引用次数
     */
    private Integer usageCount;

    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date createTime;

    /**
     * 更新时间
     */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date updateTime;

    /**
     * 教师姓名 (非数据库字段)
     */
    @TableField(exist = false)
    private String teacherName;

    /**
     * 课程名称 (非数据库字段)
     */
    @TableField(exist = false)
    private String courseName;
}
