package com.example.project.controller.classmanage;

import com.example.project.common.Result;
import com.example.project.dto.classmanage.ClassCreateDTO;
import com.example.project.dto.classmanage.StudentProgressDTO;
import com.example.project.service.classmanage.ClassManagementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/class")
public class ClassManagementController {
    
    @Autowired
    private ClassManagementService classManagementService;
    
    /**
     * 创建班级
     * POST /api/class
     */
    @PostMapping
    public Result<Map<String, Object>> createClass(@RequestBody ClassCreateDTO classCreateDTO) {
        try {
            Map<String, Object> result = classManagementService.createClass(classCreateDTO);
            return Result.success("班级创建成功", result);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 获取课程班级列表
     * GET /api/class/course/{courseId}
     */
    @GetMapping("/course/{courseId}")
    public Result<List<Map<String, Object>>> getClassesByCourseId(@PathVariable String courseId) {
        try {
            List<Map<String, Object>> classes = classManagementService.getClassesByCourseId(courseId);
            return Result.success(classes);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 获取班级学生列表
     * GET /api/class/{classId}/students
     */
    @GetMapping("/{classId}/students")
    public Result<List<Map<String, Object>>> getClassStudents(@PathVariable Long classId) {
        try {
            List<Map<String, Object>> students = classManagementService.getClassStudents(classId);
            return Result.success(students);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 移除学生
     * DELETE /api/class/{classId}/student/{studentId}
     */
    @DeleteMapping("/{classId}/student/{studentId}")
    public Result<String> removeStudent(@PathVariable Long classId, @PathVariable String studentId) {
        try {
            classManagementService.removeStudent(classId, studentId);
            return Result.success("学生移除成功");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 获取学生学习进度
     * GET /api/class/student/{studentId}/progress?courseId={courseId}
     */
    @GetMapping("/student/{studentId}/progress")
    public Result<StudentProgressDTO> getStudentProgress(
            @PathVariable String studentId,
            @RequestParam String courseId) {
        try {
            StudentProgressDTO progress = classManagementService.getStudentProgress(studentId, courseId);
            return Result.success(progress);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 删除班级
     * DELETE /api/class/{classId}
     */
    @DeleteMapping("/{classId}")
    public Result<String> deleteClass(@PathVariable Long classId) {
        try {
            classManagementService.deleteClass(classId);
            return Result.success("班级删除成功");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 更新班级信息
     * PUT /api/class/{classId}
     */
    @PutMapping("/{classId}")
    public Result<String> updateClass(
            @PathVariable Long classId,
            @RequestBody ClassCreateDTO classCreateDTO) {
        try {
            classManagementService.updateClass(classId, classCreateDTO);
            return Result.success("班级更新成功");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 获取班级详情
     * GET /api/class/{classId}
     */
    @GetMapping("/{classId}")
    public Result<Map<String, Object>> getClassDetail(@PathVariable Long classId) {
        try {
            Map<String, Object> classDetail = classManagementService.getClassDetail(classId);
            return Result.success(classDetail);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 添加学生到班级
     * POST /api/class/{classId}/student/{studentId}
     */
    @PostMapping("/{classId}/student/{studentId}")
    public Result<String> addStudent(@PathVariable Long classId, @PathVariable String studentId) {
        try {
            classManagementService.addStudent(classId, studentId);
            return Result.success("学生添加成功");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 批量添加学生
     * POST /api/class/{classId}/students/batch
     */
    @PostMapping("/{classId}/students/batch")
    public Result<Map<String, Object>> batchAddStudents(
            @PathVariable Long classId,
            @RequestBody Map<String, List<String>> request) {
        try {
            List<String> studentIds = request.get("studentIds");
            Map<String, Object> result = classManagementService.batchAddStudents(classId, studentIds);
            return Result.success("批量添加完成", result);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
}
