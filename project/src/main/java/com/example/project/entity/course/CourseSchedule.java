package com.example.project.entity.course;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;
import org.springframework.format.annotation.DateTimeFormat;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 课程时间表实体类
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Accessors(chain = true)
@TableName("course_schedule")
public class CourseSchedule implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 时间表ID
     */
    @TableId(value = "schedule_id", type = IdType.AUTO)
    private Long scheduleId;

    /**
     * 课程ID
     */
    @TableField("course_id")
    private String courseId;

    /**
     * 星期几 (1-7, 1表示周一)
     */
    @TableField("day_of_week")
    private Integer dayOfWeek;

    /**
     * 开始节次 (1-12)
     */
    @TableField("start_section")
    private Integer startSection;

    /**
     * 结束节次 (1-12)
     */
    @TableField("end_section")
    private Integer endSection;

    /**
     * 开始周数
     */
    @TableField("start_week")
    private Integer startWeek;

    /**
     * 结束周数
     */
    @TableField("end_week")
    private Integer endWeek;

    /**
     * 上课地点
     */
    @TableField("location")
    private String location;

    /**
     * 状态 (1-正常, 0-已删除)
     */
    @TableField("status")
    private Integer status;

    /**
     * 创建时间
     */
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField(value = "update_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
