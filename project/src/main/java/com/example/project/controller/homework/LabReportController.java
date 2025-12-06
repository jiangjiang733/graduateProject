package com.example.project.controller.homework;

import com.example.project.common.Result;
import com.example.project.dto.homework.LabReportDTO;
import com.example.project.dto.homework.LabReportGradingDTO;
import com.example.project.entity.homework.LabReport;
import com.example.project.entity.homework.StudentLabReport;
import com.example.project.service.homework.LabReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 实验报告管理控制器
 */
@RestController
@RequestMapping("/api/lab-report")
public class LabReportController {
    
    @Autowired
    private LabReportService labReportService;
    
    /**
     * 发布实验报告
     * POST /api/lab-report
     */
    @PostMapping
    public Result<Map<String, Object>> publishLabReport(
            @RequestParam("courseId") String courseId,
            @RequestParam("teacherId") String teacherId,
            @RequestParam("reportTitle") String reportTitle,
            @RequestParam("reportDescription") String reportDescription,
            @RequestParam("deadline") @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") Date deadline,
            @RequestParam("totalScore") Integer totalScore,
            @RequestParam(value = "attachment", required = false) MultipartFile attachment) {
        try {
            // 创建实验报告对象
            LabReport labReport = new LabReport();
            labReport.setCourseId(courseId);
            labReport.setTeacherId(teacherId);
            labReport.setReportTitle(reportTitle);
            labReport.setReportDescription(reportDescription);
            labReport.setDeadline(deadline);
            labReport.setTotalScore(totalScore);
            
            // 发布实验报告
            Long reportId = labReportService.publishLabReport(labReport, attachment);
            
            // 返回结果
            Map<String, Object> data = new HashMap<>();
            data.put("reportId", reportId);
            
            return Result.success("实验报告发布成功", data);
        } catch (Exception e) {
            return Result.error("发布失败: " + e.getMessage());
        }
    }
    
    /**
     * 获取课程实验报告列表
     * GET /api/lab-report/course/{courseId}
     */
    @GetMapping("/course/{courseId}")
    public Result<List<LabReportDTO>> getLabReportsByCourse(@PathVariable String courseId) {
        try {
            List<LabReportDTO> reports = labReportService.getLabReportsByCourse(courseId);
            return Result.success(reports);
        } catch (Exception e) {
            return Result.error("获取实验报告列表失败: " + e.getMessage());
        }
    }
    
    /**
     * 获取实验报告提交列表
     * GET /api/lab-report/{reportId}/submissions
     */
    @GetMapping("/{reportId}/submissions")
    public Result<List<StudentLabReport>> getSubmissionsByReport(@PathVariable Long reportId) {
        try {
            List<StudentLabReport> submissions = labReportService.getSubmissionsByReport(reportId);
            return Result.success(submissions);
        } catch (Exception e) {
            return Result.error("获取提交列表失败: " + e.getMessage());
        }
    }
    
    /**
     * 批改实验报告
     * PUT /api/lab-report/grade/{studentReportId}
     */
    @PutMapping("/grade/{studentReportId}")
    public Result<String> gradeLabReport(
            @PathVariable Long studentReportId,
            @RequestBody LabReportGradingDTO gradingDTO) {
        try {
            labReportService.gradeLabReport(studentReportId, gradingDTO);
            return Result.success("批改成功");
        } catch (Exception e) {
            return Result.error("批改失败: " + e.getMessage());
        }
    }
    
    /**
     * 删除实验报告
     * DELETE /api/lab-report/{reportId}
     */
    @DeleteMapping("/{reportId}")
    public Result<String> deleteLabReport(@PathVariable Long reportId) {
        try {
            labReportService.deleteLabReport(reportId);
            return Result.success("实验报告删除成功");
        } catch (Exception e) {
            return Result.error("删除失败: " + e.getMessage());
        }
    }
    
    /**
     * 获取实验报告详情
     * GET /api/lab-report/{reportId}
     */
    @GetMapping("/{reportId}")
    public Result<LabReport> getLabReportById(@PathVariable Long reportId) {
        try {
            LabReport report = labReportService.getLabReportById(reportId);
            return Result.success(report);
        } catch (Exception e) {
            return Result.error("获取实验报告详情失败: " + e.getMessage());
        }
    }
    
    // ==================== 学生端接口 ====================
    
    /**
     * 学生提交实验报告
     * POST /api/lab-report/submit
     */
    @PostMapping("/submit")
    public Result<Map<String, Object>> submitLabReport(
            @RequestParam("reportId") Long reportId,
            @RequestParam("studentId") String studentId,
            @RequestParam("studentName") String studentName,
            @RequestParam("content") String content,
            @RequestParam(value = "attachment", required = false) MultipartFile attachment) {
        try {
            // 创建学生报告对象
            StudentLabReport studentReport = new StudentLabReport();
            studentReport.setReportId(reportId);
            studentReport.setStudentId(studentId);
            studentReport.setStudentName(studentName);
            studentReport.setContent(content);
            
            // 提交实验报告
            Long studentReportId = labReportService.submitLabReport(studentReport, attachment);
            
            // 返回结果
            Map<String, Object> data = new HashMap<>();
            data.put("studentReportId", studentReportId);
            
            return Result.success("提交成功", data);
        } catch (Exception e) {
            return Result.error("提交失败: " + e.getMessage());
        }
    }
    
    /**
     * 获取学生的实验报告列表
     * GET /api/lab-report/student/{studentId}
     */
    @GetMapping("/student/{studentId}")
    public Result<List<Map<String, Object>>> getStudentLabReports(@PathVariable String studentId) {
        try {
            List<Map<String, Object>> reports = labReportService.getStudentLabReports(studentId);
            return Result.success(reports);
        } catch (Exception e) {
            return Result.error("获取实验报告列表失败: " + e.getMessage());
        }
    }
    
    /**
     * 获取学生提交详情
     * GET /api/lab-report/submission/{studentReportId}
     */
    @GetMapping("/submission/{studentReportId}")
    public Result<StudentLabReport> getStudentSubmission(@PathVariable Long studentReportId) {
        try {
            StudentLabReport submission = labReportService.getStudentSubmission(studentReportId);
            return Result.success(submission);
        } catch (Exception e) {
            return Result.error("获取提交详情失败: " + e.getMessage());
        }
    }
    
    /**
     * 更新学生提交
     * PUT /api/lab-report/submission/{studentReportId}
     */
    @PutMapping("/submission/{studentReportId}")
    public Result<String> updateSubmission(
            @PathVariable Long studentReportId,
            @RequestParam("content") String content,
            @RequestParam(value = "attachment", required = false) MultipartFile attachment) {
        try {
            labReportService.updateSubmission(studentReportId, content, attachment);
            return Result.success("更新成功");
        } catch (Exception e) {
            return Result.error("更新失败: " + e.getMessage());
        }
    }
}
