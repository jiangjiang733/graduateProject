package com.example.project.service.homework.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.project.dto.homework.LabReportDTO;
import com.example.project.dto.homework.LabReportGradingDTO;
import com.example.project.entity.homework.LabReport;
import com.example.project.entity.homework.StudentLabReport;
import com.example.project.exception.ResourceNotFoundException;
import com.example.project.mapper.homework.LabReportMapper;
import com.example.project.mapper.homework.StudentLabReportMapper;
import com.example.project.service.homework.LabReportService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.*;

@Service
public class LabReportServiceImpl implements LabReportService {
    
    @Autowired
    private LabReportMapper labReportMapper;
    
    @Autowired
    private StudentLabReportMapper studentLabReportMapper;
    
    @Value("${file.upload.path:uploads/}")
    private String uploadPath;
    
    @Override
    @Transactional
    public Long publishLabReport(LabReport labReport, MultipartFile attachment) {
        // 处理附件上传
        if (attachment != null && !attachment.isEmpty()) {
            String attachmentUrl = saveAttachment(attachment);
            labReport.setAttachmentUrl(attachmentUrl);
        }
        
        // 设置创建时间和状态
        labReport.setCreateTime(new Date());
        labReport.setStatus(1); // 1-进行中
        
        // 保存实验报告
        labReportMapper.insert(labReport);
        
        return labReport.getReportId();
    }
    
    @Override
    public List<LabReportDTO> getLabReportsByCourse(String courseId) {
        QueryWrapper<LabReport> wrapper = new QueryWrapper<>();
        wrapper.eq("course_id", courseId);
        wrapper.orderByDesc("create_time");
        
        List<LabReport> reports = labReportMapper.selectList(wrapper);
        List<LabReportDTO> dtoList = new ArrayList<>();
        
        for (LabReport report : reports) {
            LabReportDTO dto = new LabReportDTO();
            BeanUtils.copyProperties(report, dto);
            
            // 统计提交情况
            QueryWrapper<StudentLabReport> submitWrapper = new QueryWrapper<>();
            submitWrapper.eq("report_id", report.getReportId());
            submitWrapper.ne("status", 0); // 不包括未提交状态
            Integer submittedCount = Math.toIntExact(studentLabReportMapper.selectCount(submitWrapper));
            dto.setSubmittedCount(submittedCount);
            
            // 获取总学生数（这里简化处理，实际应该从班级表获取）
            QueryWrapper<StudentLabReport> totalWrapper = new QueryWrapper<>();
            totalWrapper.eq("report_id", report.getReportId());
            Integer totalStudents = Math.toIntExact(studentLabReportMapper.selectCount(totalWrapper));
            dto.setTotalStudents(totalStudents);
            
            dtoList.add(dto);
        }
        
        return dtoList;
    }
    
    @Override
    public List<StudentLabReport> getSubmissionsByReport(Long reportId) {
        QueryWrapper<StudentLabReport> wrapper = new QueryWrapper<>();
        wrapper.eq("report_id", reportId);
        wrapper.orderByDesc("submit_time");
        
        return studentLabReportMapper.selectList(wrapper);
    }
    
    @Override
    @Transactional
    public void gradeLabReport(Long studentReportId, LabReportGradingDTO gradingDTO) {
        // 查询学生报告
        StudentLabReport studentReport = studentLabReportMapper.selectById(studentReportId);
        if (studentReport == null) {
            throw new ResourceNotFoundException("学生报告不存在");
        }
        
        // 更新批改信息
        studentReport.setScore(gradingDTO.getScore());
        studentReport.setTeacherComment(gradingDTO.getTeacherComment());
        studentReport.setGradedBy(gradingDTO.getTeacherId());
        studentReport.setGradedTime(new Date());
        studentReport.setStatus(2); // 2-已批改
        
        studentLabReportMapper.updateById(studentReport);
    }
    
    @Override
    @Transactional
    public void deleteLabReport(Long reportId) {
        // 查询实验报告
        LabReport report = labReportMapper.selectById(reportId);
        if (report == null) {
            throw new ResourceNotFoundException("实验报告不存在");
        }
        
        // 删除附件文件
        if (report.getAttachmentUrl() != null && !report.getAttachmentUrl().isEmpty()) {
            deleteFile(report.getAttachmentUrl());
        }
        
        // 删除学生提交的报告
        QueryWrapper<StudentLabReport> wrapper = new QueryWrapper<>();
        wrapper.eq("report_id", reportId);
        List<StudentLabReport> studentReports = studentLabReportMapper.selectList(wrapper);
        
        for (StudentLabReport studentReport : studentReports) {
            if (studentReport.getAttachmentUrl() != null && !studentReport.getAttachmentUrl().isEmpty()) {
                deleteFile(studentReport.getAttachmentUrl());
            }
        }
        
        studentLabReportMapper.delete(wrapper);
        
        // 删除实验报告
        labReportMapper.deleteById(reportId);
    }
    
    @Override
    public LabReport getLabReportById(Long reportId) {
        LabReport report = labReportMapper.selectById(reportId);
        if (report == null) {
            throw new ResourceNotFoundException("实验报告不存在");
        }
        return report;
    }
    
    /**
     * 保存附件文件
     */
    private String saveAttachment(MultipartFile file) {
        try {
            // 创建上传目录
            String materialDir = uploadPath + "material/";
            File dir = new File(materialDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }
            
            // 生成唯一文件名
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".") 
                ? originalFilename.substring(originalFilename.lastIndexOf(".")) 
                : "";
            String filename = System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8) + extension;
            
            // 保存文件
            File destFile = new File(materialDir + filename);
            file.transferTo(destFile);
            
            return "material/" + filename;
        } catch (IOException e) {
            throw new RuntimeException("文件上传失败: " + e.getMessage());
        }
    }
    
    /**
     * 删除文件
     */
    private void deleteFile(String fileUrl) {
        try {
            File file = new File(uploadPath + fileUrl);
            if (file.exists()) {
                file.delete();
            }
        } catch (Exception e) {
            // 记录日志但不抛出异常
            System.err.println("删除文件失败: " + e.getMessage());
        }
    }
    
    // ==================== 学生端服务实现 ====================
    
    @Override
    @Transactional
    public Long submitLabReport(StudentLabReport studentReport, MultipartFile attachment) {
        // 检查实验报告是否存在
        LabReport labReport = labReportMapper.selectById(studentReport.getReportId());
        if (labReport == null) {
            throw new ResourceNotFoundException("实验报告不存在");
        }
        
        // 检查是否已经提交过
        QueryWrapper<StudentLabReport> wrapper = new QueryWrapper<>();
        wrapper.eq("report_id", studentReport.getReportId());
        wrapper.eq("student_id", studentReport.getStudentId());
        StudentLabReport existingReport = studentLabReportMapper.selectOne(wrapper);
        
        if (existingReport != null) {
            throw new RuntimeException("您已经提交过该实验报告，请使用更新功能");
        }
        
        // 处理附件上传
        if (attachment != null && !attachment.isEmpty()) {
            String attachmentUrl = saveAttachment(attachment);
            studentReport.setAttachmentUrl(attachmentUrl);
        }
        
        // 设置提交时间和状态
        studentReport.setSubmitTime(new Date());
        studentReport.setStatus(1); // 1-已提交待批改
        
        // 保存学生报告
        studentLabReportMapper.insert(studentReport);
        
        return studentReport.getStudentReportId();
    }
    
    @Override
    public List<Map<String, Object>> getStudentLabReports(String studentId) {
        // 获取学生所有的实验报告（包括未提交的）
        List<Map<String, Object>> result = new ArrayList<>();
        
        // 查询学生已提交的报告
        QueryWrapper<StudentLabReport> submitWrapper = new QueryWrapper<>();
        submitWrapper.eq("student_id", studentId);
        submitWrapper.orderByDesc("submit_time");
        List<StudentLabReport> submittedReports = studentLabReportMapper.selectList(submitWrapper);
        
        // 为每个提交的报告获取实验报告详情
        for (StudentLabReport studentReport : submittedReports) {
            LabReport labReport = labReportMapper.selectById(studentReport.getReportId());
            if (labReport != null) {
                Map<String, Object> reportMap = new HashMap<>();
                reportMap.put("reportId", labReport.getReportId());
                reportMap.put("reportTitle", labReport.getReportTitle());
                reportMap.put("reportDescription", labReport.getReportDescription());
                reportMap.put("courseId", labReport.getCourseId());
                reportMap.put("deadline", labReport.getDeadline());
                reportMap.put("totalScore", labReport.getTotalScore());
                reportMap.put("attachmentUrl", labReport.getAttachmentUrl());
                reportMap.put("createTime", labReport.getCreateTime());
                
                // 学生提交信息
                reportMap.put("studentReportId", studentReport.getStudentReportId());
                reportMap.put("submitTime", studentReport.getSubmitTime());
                reportMap.put("score", studentReport.getScore());
                reportMap.put("teacherComment", studentReport.getTeacherComment());
                reportMap.put("status", studentReport.getStatus());
                reportMap.put("studentAttachmentUrl", studentReport.getAttachmentUrl());
                
                result.add(reportMap);
            }
        }
        
        return result;
    }
    
    @Override
    public StudentLabReport getStudentSubmission(Long studentReportId) {
        StudentLabReport submission = studentLabReportMapper.selectById(studentReportId);
        if (submission == null) {
            throw new ResourceNotFoundException("提交记录不存在");
        }
        return submission;
    }
    
    @Override
    @Transactional
    public void updateSubmission(Long studentReportId, String content, MultipartFile attachment) {
        // 查询学生报告
        StudentLabReport studentReport = studentLabReportMapper.selectById(studentReportId);
        if (studentReport == null) {
            throw new ResourceNotFoundException("提交记录不存在");
        }
        
        // 检查是否已经批改
        if (studentReport.getStatus() == 2) {
            throw new RuntimeException("报告已批改，无法修改");
        }
        
        // 更新内容
        studentReport.setContent(content);
        
        // 处理附件上传
        if (attachment != null && !attachment.isEmpty()) {
            // 删除旧附件
            if (studentReport.getAttachmentUrl() != null && !studentReport.getAttachmentUrl().isEmpty()) {
                deleteFile(studentReport.getAttachmentUrl());
            }
            
            // 上传新附件
            String attachmentUrl = saveAttachment(attachment);
            studentReport.setAttachmentUrl(attachmentUrl);
        }
        
        // 更新提交时间
        studentReport.setSubmitTime(new Date());
        
        studentLabReportMapper.updateById(studentReport);
    }
}
