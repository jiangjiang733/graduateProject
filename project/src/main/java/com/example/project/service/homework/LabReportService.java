package com.example.project.service.homework;

import com.example.project.dto.homework.LabReportDTO;
import com.example.project.dto.homework.LabReportGradingDTO;
import com.example.project.entity.homework.LabReport;
import com.example.project.entity.homework.StudentLabReport;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * 实验报告服务接口
 */
public interface LabReportService {
    
    /**
     * 发布实验报告
     * @param labReport 实验报告信息
     * @param attachment 附件文件
     * @return 实验报告ID
     */
    Long publishLabReport(LabReport labReport, MultipartFile attachment);
    
    /**
     * 获取课程实验报告列表
     * @param courseId 课程ID
     * @return 实验报告列表
     */
    List<LabReportDTO> getLabReportsByCourse(String courseId);
    
    /**
     * 获取实验报告提交列表
     * @param reportId 实验报告ID
     * @return 学生提交列表
     */
    List<StudentLabReport> getSubmissionsByReport(Long reportId);
    
    /**
     * 批改实验报告
     * @param studentReportId 学生报告ID
     * @param gradingDTO 批改信息
     */
    void gradeLabReport(Long studentReportId, LabReportGradingDTO gradingDTO);
    
    /**
     * 删除实验报告
     * @param reportId 实验报告ID
     */
    void deleteLabReport(Long reportId);
    
    /**
     * 获取实验报告详情
     * @param reportId 实验报告ID
     * @return 实验报告
     */
    LabReport getLabReportById(Long reportId);
    
    /**
     * 学生提交实验报告
     * @param studentReport 学生报告信息
     * @param attachment 附件文件
     * @return 学生报告ID
     */
    Long submitLabReport(StudentLabReport studentReport, MultipartFile attachment);
    
    /**
     * 获取学生的实验报告列表
     * @param studentId 学生ID
     * @return 实验报告列表（包含提交状态）
     */
    List<Map<String, Object>> getStudentLabReports(String studentId);
    
    /**
     * 获取学生提交详情
     * @param studentReportId 学生报告ID
     * @return 学生提交详情
     */
    StudentLabReport getStudentSubmission(Long studentReportId);
    
    /**
     * 更新学生提交
     * @param studentReportId 学生报告ID
     * @param content 内容
     * @param attachment 附件文件
     */
    void updateSubmission(Long studentReportId, String content, MultipartFile attachment);
}
