package com.example.project.controller.course;

import com.example.project.entity.course.CourseSchedule;
import com.example.project.service.course.CourseScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/course/schedule")
@CrossOrigin(origins = "*")
public class CourseScheduleController {

    @Autowired
    private CourseScheduleService scheduleService;

    /**
     * 添加课程时间
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> addSchedule(@RequestBody CourseSchedule schedule) {
        Map<String, Object> response = new HashMap<>();

        try {
            CourseSchedule result = scheduleService.addSchedule(schedule);

            response.put("success", true);
            response.put("message", "课程时间添加成功");
            response.put("data", result);

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "添加课程时间失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * 获取课程的所有时间安排
     */
    @GetMapping("/{courseId}")
    public ResponseEntity<Map<String, Object>> getCourseSchedules(@PathVariable String courseId) {
        Map<String, Object> response = new HashMap<>();

        try {
            System.out.println("获取课程时间表，课程ID: " + courseId);
            
            List<CourseSchedule> schedules = scheduleService.getCourseSchedules(courseId);
            
            System.out.println("查询到 " + schedules.size() + " 条课程时间记录");

            response.put("success", true);
            response.put("data", schedules);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("获取课程时间失败: " + e.getMessage());
            e.printStackTrace();
            
            response.put("success", false);
            response.put("message", "获取课程时间失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * 获取学生的课程表
     */
    @GetMapping("/student/{studentId}")
    public ResponseEntity<Map<String, Object>> getStudentSchedule(
            @PathVariable String studentId,
            @RequestParam(defaultValue = "1") Integer week) {

        Map<String, Object> response = new HashMap<>();

        try {
            System.out.println("=== 获取学生课程表 ===");
            System.out.println("学生ID: " + studentId);
            System.out.println("周数: " + week);
            
            Map<Integer, Map<Integer, Map<String, Object>>> schedule =
                    scheduleService.getStudentSchedule(studentId, week);

            System.out.println("课程表数据: " + schedule);
            System.out.println("星期数量: " + schedule.size());

            response.put("success", true);
            response.put("data", schedule);
            response.put("week", week);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("获取课程表失败: " + e.getMessage());
            e.printStackTrace();
            
            response.put("success", false);
            response.put("message", "获取课程表失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * 更新课程时间
     */
    @PutMapping("/{scheduleId}")
    public ResponseEntity<Map<String, Object>> updateSchedule(
            @PathVariable Long scheduleId,
            @RequestBody CourseSchedule schedule) {

        Map<String, Object> response = new HashMap<>();

        try {
            schedule.setScheduleId(scheduleId);
            CourseSchedule result = scheduleService.updateSchedule(schedule);

            response.put("success", true);
            response.put("message", "课程时间更新成功");
            response.put("data", result);

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "更新课程时间失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * 删除课程时间
     */
    @DeleteMapping("/{scheduleId}")
    public ResponseEntity<Map<String, Object>> deleteSchedule(@PathVariable Long scheduleId) {
        Map<String, Object> response = new HashMap<>();

        try {
            scheduleService.deleteSchedule(scheduleId);

            response.put("success", true);
            response.put("message", "课程时间删除成功");

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "删除课程时间失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * 检查时间冲突
     */
    @PostMapping("/check-conflict")
    public ResponseEntity<Map<String, Object>> checkConflict(@RequestBody CourseSchedule schedule) {
        Map<String, Object> response = new HashMap<>();

        try {
            boolean hasConflict = scheduleService.hasConflict(schedule);

            response.put("success", true);
            response.put("hasConflict", hasConflict);
            response.put("message", hasConflict ? "该时间段存在冲突" : "该时间段可用");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "检查冲突失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
