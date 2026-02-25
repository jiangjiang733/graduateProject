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
import com.example.project.service.notification.MessageService;
import com.example.project.entity.course.Course;
import com.example.project.mapper.course.CourseMapper;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class LabReportServiceImpl implements LabReportService {

    @Autowired
    private LabReportMapper labReportMapper;

    @Autowired
    private StudentLabReportMapper studentLabReportMapper;

    @Value("${file.upload.path:uploads/}")
    private String uploadPath;

    @Autowired
    private com.example.project.mapper.course.StudentCourseMapper studentCourseMapper;

    @Autowired
    private CourseMapper courseMapper;

    @Autowired
    private MessageService messageService;

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
        return convertToDTOList(reports);
    }

    @Override
    public List<LabReportDTO> getLabReportsByTeacher(String teacherId) {
        // 首先获取该教师的所有课程ID
        QueryWrapper<Course> courseWrapper = new QueryWrapper<>();
        courseWrapper.eq("teacher_id", teacherId);
        courseWrapper.eq("state", 1);
        List<String> courseIds = courseMapper.selectList(courseWrapper)
                .stream().map(Course::getId).collect(Collectors.toList());

        if (courseIds.isEmpty()) {
            // 如果没有课程，仅查询该教师创建的报告
            QueryWrapper<LabReport> wrapper = new QueryWrapper<>();
            wrapper.eq("teacher_id", teacherId);
            wrapper.orderByDesc("create_time");
            List<LabReport> reports = labReportMapper.selectList(wrapper);
            return convertToDTOList(reports);
        }

        QueryWrapper<LabReport> wrapper = new QueryWrapper<>();
        // 允许通过教师ID匹配 或 通过属于该教师课程的所有作业匹配
        wrapper.and(w -> w.eq("teacher_id", teacherId).or().in("course_id", courseIds));
        wrapper.orderByDesc("create_time");

        List<LabReport> reports = labReportMapper.selectList(wrapper);
        return convertToDTOList(reports);
    }

    private List<LabReportDTO> convertToDTOList(List<LabReport> reports) {
        List<LabReportDTO> dtoList = new ArrayList<>();

        for (LabReport report : reports) {
            LabReportDTO dto = new LabReportDTO();
            BeanUtils.copyProperties(report, dto);

            // 统计提交情况
            try {
                QueryWrapper<StudentLabReport> submitWrapper = new QueryWrapper<>();
                submitWrapper.eq("report_id", report.getReportId());
                submitWrapper.ge("status", 1); // 1-已提交待批改, 2-已批改
                Integer submittedCount = Math.toIntExact(studentLabReportMapper.selectCount(submitWrapper));
                dto.setSubmittedCount(submittedCount);

                QueryWrapper<StudentLabReport> gradedWrapper = new QueryWrapper<>();
                gradedWrapper.eq("report_id", report.getReportId());
                gradedWrapper.eq("status", 2); // 2-已批改
                Integer gradedCount = Math.toIntExact(studentLabReportMapper.selectCount(gradedWrapper));
                dto.setGradedCount(gradedCount);

                QueryWrapper<StudentLabReport> returnedWrapper = new QueryWrapper<>();
                returnedWrapper.eq("report_id", report.getReportId());
                returnedWrapper.eq("status", 3); // 3-被退回
                Integer returnedCount = Math.toIntExact(studentLabReportMapper.selectCount(returnedWrapper));
                dto.setReturnedCount(returnedCount);
            } catch (Exception e) {
                // 表可能不存在，暂时忽略
                System.err.println("统计提交人数失败: " + e.getMessage());
                dto.setSubmittedCount(0);
                dto.setGradedCount(0);
            }

            // 获取参与人数和课程名称
            if (report.getCourseId() != null) {
                // 1. 统计选课人数 (从 student_course 表统计)
                QueryWrapper<com.example.project.entity.course.StudentCourse> enrollWrapper = new QueryWrapper<>();
                enrollWrapper.eq("course_id", report.getCourseId());
                enrollWrapper.eq("status", 1); // 1-已通过
                Long studentCount = studentCourseMapper.selectCount(enrollWrapper);
                dto.setTotalStudents(studentCount.intValue());

                // 2. 获取课程名称
                Course course = courseMapper.selectById(report.getCourseId());
                if (course != null) {
                    dto.setCourseName(course.getCourseName());
                }
            } else {
                dto.setTotalStudents(0);
                dto.setCourseName("未知课程");
            }

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
    public void updateLabReport(Long reportId, LabReport labReport, MultipartFile attachment) {
        LabReport existingReport = labReportMapper.selectById(reportId);
        if (existingReport == null) {
            throw new ResourceNotFoundException("实验报告不存在");
        }

        // 仅在字段不为 null 时更新，防止误删原有属性
        if (labReport.getCourseId() != null)
            existingReport.setCourseId(labReport.getCourseId());
        if (labReport.getReportTitle() != null)
            existingReport.setReportTitle(labReport.getReportTitle());
        if (labReport.getReportDescription() != null)
            existingReport.setReportDescription(labReport.getReportDescription());
        if (labReport.getDeadline() != null)
            existingReport.setDeadline(labReport.getDeadline());
        if (labReport.getTotalScore() != null)
            existingReport.setTotalScore(labReport.getTotalScore());
        if (labReport.getQuestionList() != null)
            existingReport.setQuestionList(labReport.getQuestionList());

        // 如果需要更新状态（例如从草稿发布或提前截止）
        if (labReport.getStatus() != null) {
            existingReport.setStatus(labReport.getStatus());
        }

        // 处理附件更新
        if (attachment != null && !attachment.isEmpty()) {
            // 删除旧附件
            if (existingReport.getAttachmentUrl() != null && !existingReport.getAttachmentUrl().isEmpty()) {
                deleteFile(existingReport.getAttachmentUrl());
            }
            // 保存新附件
            String attachmentUrl = saveAttachment(attachment);
            existingReport.setAttachmentUrl(attachmentUrl);
        }

        labReportMapper.updateById(existingReport);
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
        if (gradingDTO.getStatus() != null && gradingDTO.getStatus() == 3) {
            studentReport.setStatus(3); // 3-退回重写
        } else {
            studentReport.setStatus(2); // 2-已批改
        }

        studentLabReportMapper.updateById(studentReport);

        // 发送系统通知给学生
        try {
            LabReport report = labReportMapper.selectById(studentReport.getReportId());
            String title;
            String content;
            
            if (gradingDTO.getStatus() != null && gradingDTO.getStatus() == 3) {
                title = "作业/实验报告被打回";
                content = String.format("你的作业/实验报告《%s》已被打回，请重新修改后再提交。",
                        report != null ? report.getReportTitle() : "未知报告");
            } else {
                title = "作业/实验报告已批改";
                content = String.format("你的作业/实验报告《%s》已被教师批改。得分：%s。",
                        report != null ? report.getReportTitle() : "未知报告",
                        studentReport.getScore());
            }

            messageService.sendMessage(
                    gradingDTO.getTeacherId(),
                    "TEACHER",
                    studentReport.getStudentId(),
                    "STUDENT",
                    "SYSTEM",
                    title,
                    content,
                    studentReportId.toString());
        } catch (Exception e) {
            // 通知发送失败不应影响批改流程
            System.err.println("发送批改通知失败: " + e.getMessage());
        }
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

        // 删除作业
        labReportMapper.deleteById(reportId);
    }

    @Override
    public LabReportDTO getLabReportDTOById(Long reportId) {
        LabReport report = getLabReportById(reportId);
        List<LabReportDTO> dtoList = convertToDTOList(Collections.singletonList(report));
        return dtoList.isEmpty() ? null : dtoList.get(0);
    }

    @Override
    public LabReport getLabReportById(Long reportId) {
        LabReport report = labReportMapper.selectById(reportId);
        if (report == null) {
            throw new ResourceNotFoundException("不存在");
        }
        return report;
    }

    /**
     * 保存附件文件 → 统一存储到 uploads/homework/ 目录
     */
    private String saveAttachment(MultipartFile file) {
        try {
            // 使用配置文件中的绝对路径
            String baseDir = "D:/Graduation project/uploads";
            String homeworkDir = baseDir + "/homework/";

            File dir = new File(homeworkDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            // 生成唯一文件名（保留原始扩展名）
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8)
                    + extension;

            // 保存文件
            File destFile = new File(homeworkDir + filename);
            file.transferTo(destFile.getAbsoluteFile());

            // 返回相对于 uploads 根目录的路径
            return "homework/" + filename;
        } catch (IOException e) {
            e.printStackTrace();
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

        // 检查截止时间
        Date now = new Date();
        if (labReport.getDeadline() != null && labReport.getDeadline().before(now)) {
            throw new RuntimeException("已过截止日期，无法提交或修改作业");
        }

        // 检查是否已经提交过
        QueryWrapper<StudentLabReport> wrapper = new QueryWrapper<>();
        wrapper.eq("report_id", studentReport.getReportId());
        wrapper.eq("student_id", studentReport.getStudentId());
        StudentLabReport existingReport = studentLabReportMapper.selectOne(wrapper);

        if (existingReport != null) {
            // 如果已批改，不允许修改
            if (existingReport.getStatus() == 2) {
                throw new RuntimeException("作业已被批改，无法修改");
            }

            // 更新现有提交
            existingReport.setContent(studentReport.getContent());
            existingReport.setStructuredAnswers(studentReport.getStructuredAnswers());
            existingReport.setSubmitTime(now);

            // 处理附件更新
            if (attachment != null && !attachment.isEmpty()) {
                // 删除旧附件
                if (existingReport.getAttachmentUrl() != null && !existingReport.getAttachmentUrl().isEmpty()) {
                    deleteFile(existingReport.getAttachmentUrl());
                }
                // 保存新附件
                String attachmentUrl = saveAttachment(attachment);
                existingReport.setAttachmentUrl(attachmentUrl);
            }

            // 设置新引用（由于我们要对其进一步判定客观题批改，不再直接 update 返回）
            studentReport.setStudentReportId(existingReport.getStudentReportId());
            studentReport.setAttachmentUrl(existingReport.getAttachmentUrl());
        } else {
            // 处理附件上传
            if (attachment != null && !attachment.isEmpty()) {
                String attachmentUrl = saveAttachment(attachment);
                studentReport.setAttachmentUrl(attachmentUrl);
            }
        }

        // 设置提交时间，默认状态1（待批改）
        studentReport.setSubmitTime(now != null ? now : new Date());
        studentReport.setStatus(1);

        applyAutoGrading(labReport, studentReport);

        // 如果是修改操作
        if (existingReport != null) {
            studentLabReportMapper.updateById(studentReport);
            sendSubmissionNotification(studentReport, labReport, true);
            return studentReport.getStudentReportId();
        } else {
            studentLabReportMapper.insert(studentReport);
            sendSubmissionNotification(studentReport, labReport, false);
            return studentReport.getStudentReportId();
        }
    }

    private void applyAutoGrading(LabReport labReport, StudentLabReport studentReport) {
        try {
            if (labReport.getQuestionList() != null && !labReport.getQuestionList().trim().isEmpty()
                    && studentReport.getStructuredAnswers() != null
                    && !studentReport.getStructuredAnswers().trim().isEmpty()) {

                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                java.util.List<java.util.Map<String, Object>> qList = mapper.readValue(labReport.getQuestionList(),
                        new com.fasterxml.jackson.core.type.TypeReference<java.util.List<java.util.Map<String, Object>>>() {
                        });
                java.util.List<java.util.Map<String, Object>> aList = mapper.readValue(
                        studentReport.getStructuredAnswers(),
                        new com.fasterxml.jackson.core.type.TypeReference<java.util.List<java.util.Map<String, Object>>>() {
                        });

                boolean isOnlyObjective = true;
                java.math.BigDecimal totalScore = java.math.BigDecimal.ZERO;

                if (!qList.isEmpty()) {
                    for (int i = 0; i < qList.size(); i++) {
                        java.util.Map<String, Object> q = qList.get(i);
                        String qType = (String) q.getOrDefault("questionType", q.get("type"));
                        if (qType != null) {
                            qType = qType.toUpperCase();
                            if (!java.util.Arrays.asList("SINGLE", "MULTIPLE", "JUDGE", "FILL", "SINGLE_CHOICE",
                                    "MULTIPLE_CHOICE", "TRUE_FALSE", "1", "2", "3", "4").contains(qType)
                                    && !qType.contains("CHOICE") && !qType.contains("SINGLE")
                                    && !qType.contains("MULTIPLE") && !qType.equals("单选") && !qType.equals("多选")
                                    && !qType.equals("判断") && !qType.equals("填空")) {
                                isOnlyObjective = false;
                                break;
                            }

                            if (i < aList.size()) {
                                String correctAns = (String) q.getOrDefault("correctAnswer", q.get("answer"));
                                String studentAns = (String) aList.get(i).get("answer");

                                if (correctAns != null && studentAns != null && !correctAns.trim().isEmpty()) {
                                    String normCorrect = correctAns.trim().toUpperCase().replaceAll("[\\s,]+", "");
                                    String normStudent = studentAns.trim().toUpperCase().replaceAll("[\\s,]+", "");

                                    boolean correct = false;
                                    if (normCorrect.equals(normStudent)) {
                                        correct = true;
                                    } else if ("JUDGE".equals(qType) || "TRUE_FALSE".equals(qType)
                                            || qType.contains("判断")) {
                                        if (("A".equals(normCorrect) || "正确".equals(normCorrect)
                                                || "对".equals(normCorrect) || "TRUE".equals(normCorrect))
                                                && ("A".equals(normStudent) || "正确".equals(normStudent)
                                                        || "对".equals(normStudent) || "TRUE".equals(normStudent))) {
                                            correct = true;
                                        } else if (("B".equals(normCorrect) || "错误".equals(normCorrect)
                                                || "错".equals(normCorrect) || "FALSE".equals(normCorrect))
                                                && ("B".equals(normStudent) || "错误".equals(normStudent)
                                                        || "错".equals(normStudent) || "FALSE".equals(normStudent))) {
                                            correct = true;
                                        }
                                    }

                                    if (correct) {
                                        Object scoreObj = q.get("score");
                                        if (scoreObj != null) {
                                            totalScore = totalScore.add(new java.math.BigDecimal(scoreObj.toString()));
                                        } else {
                                            totalScore = totalScore.add(new java.math.BigDecimal("5"));
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (isOnlyObjective) {
                        studentReport.setStatus(2);
                        studentReport.setScore(totalScore);
                        studentReport.setGradedTime(new java.util.Date());
                        studentReport.setGradedBy("SYSTEM");
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public List<Map<String, Object>> getStudentLabReports(String studentId) {
        List<Map<String, Object>> result = new ArrayList<>();

        // 1. 获取所有课程的所有实验报告 (学生选课 -> 课程 -> 实验报告)
        // 获取学生选修的通过的课程及其加入时间
        QueryWrapper<com.example.project.entity.course.StudentCourse> courseWrapper = new QueryWrapper<>();
        try {
            courseWrapper.eq("student_id", Integer.parseInt(studentId));
        } catch (Exception e) {
            courseWrapper.eq("student_id", studentId);
        }
        courseWrapper.eq("status", 1); // 1-已通过
        List<com.example.project.entity.course.StudentCourse> enrolledCourses = studentCourseMapper
                .selectList(courseWrapper);
        if (enrolledCourses.isEmpty()) {
            return result;
        }

        List<String> enrolledCourseIds = enrolledCourses.stream()
                .map(sc -> sc.getCourseId())
                .collect(Collectors.toList());

        Map<String, Date> courseJoinTimeMap = enrolledCourses.stream()
                .collect(Collectors.toMap(
                        com.example.project.entity.course.StudentCourse::getCourseId,
                        sc -> sc.getJoinTime() != null ? sc.getJoinTime()
                                : (sc.getCreateTime() != null ? sc.getCreateTime() : new Date(0)),
                        (existing, replacement) -> existing));

        // 查询这些课程的所有作业
        QueryWrapper<LabReport> reportWrapper = new QueryWrapper<>();
        reportWrapper.in("course_id", enrolledCourseIds);
        reportWrapper.ne("status", 0); // 只要不是草稿(0)，已发布(1)和归档/结束(2)的作业都显示
        reportWrapper.orderByDesc("create_time");
        List<LabReport> courseReports = labReportMapper.selectList(reportWrapper);

        // 2. 获取学生已有的提交记录
        QueryWrapper<StudentLabReport> submitWrapper = new QueryWrapper<>();
        submitWrapper.eq("student_id", studentId);
        List<StudentLabReport> submittedReports = studentLabReportMapper.selectList(submitWrapper);
        Map<Long, StudentLabReport> submissionMap = submittedReports.stream()
                .collect(Collectors.toMap(StudentLabReport::getReportId, s -> s));

        // 3. 合并结果
        for (LabReport report : courseReports) {
            // 不再进行复杂的过滤（如入班时间判断），让学生能看到所选课程的所有历史作业
            // 这样学生可以查看到入班前的未交作业（即使已截止）以及查看已批改的作业成绩

            Map<String, Object> map = new HashMap<>();
            map.put("reportId", report.getReportId());
            map.put("reportTitle", report.getReportTitle());
            map.put("reportDescription", report.getReportDescription());
            map.put("courseId", report.getCourseId());
            map.put("deadline", report.getDeadline());
            map.put("totalScore", report.getTotalScore());
            map.put("attachmentUrl", report.getAttachmentUrl());
            map.put("createTime", report.getCreateTime());

            // 获取课程名称
            try {
                Course course = courseMapper.selectById(report.getCourseId());
                if (course != null)
                    map.put("courseName", course.getCourseName());
            } catch (Exception e) {
            }

            StudentLabReport submission = submissionMap.get(report.getReportId());
            if (submission != null) {
                // 已提交
                map.put("studentReportId", submission.getStudentReportId());
                map.put("submitTime", submission.getSubmitTime());
                map.put("score", submission.getScore());
                map.put("teacherComment", submission.getTeacherComment());
                map.put("status", submission.getStatus()); // 1, 2
                map.put("studentAttachmentUrl", submission.getAttachmentUrl());
            } else {
                // 未提交
                map.put("studentReportId", null);
                map.put("status", 0); // 0-未提交
                map.put("submitTime", null);
                map.put("score", null);
            }
            result.add(map);
        }

        // 排序：未提交在前 (status 0), 然后按截止时间
        result.sort((a, b) -> {
            Integer s1 = (Integer) a.get("status");
            Integer s2 = (Integer) b.get("status");
            if (!s1.equals(s2))
                return s1 - s2;

            Date d1 = (Date) a.get("deadline");
            Date d2 = (Date) b.get("deadline");
            if (d1 == null)
                return 1;
            if (d2 == null)
                return -1;
            return d1.compareTo(d2);
        });

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
    public void updateSubmission(Long studentReportId, String content, String structuredAnswers,
            MultipartFile attachment) {
        // 查询学生报告
        StudentLabReport studentReport = studentLabReportMapper.selectById(studentReportId);
        if (studentReport == null) {
            throw new ResourceNotFoundException("提交记录不存在");
        }

        // 检查是否已经批改
        if (studentReport.getStatus() == 2) {
            throw new RuntimeException("报告已批改，无法修改");
        }

        // 检查截止时间
        LabReport labReport = labReportMapper.selectById(studentReport.getReportId());
        if (labReport != null && labReport.getDeadline() != null && labReport.getDeadline().before(new Date())) {
            throw new RuntimeException("已过截止日期，无法修改作业");
        }

        // 更新内容
        studentReport.setContent(content);
        studentReport.setStructuredAnswers(structuredAnswers);

        // 由于是学生主动修改，重新将其设为待批改状态，尝试进行自动批改
        studentReport.setStatus(1);
        applyAutoGrading(labReport, studentReport);

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
        sendSubmissionNotification(studentReport, labReport, true);
    }

    /**
     * 发送提交通知给教师
     */
    private void sendSubmissionNotification(StudentLabReport studentReport, LabReport labReport, boolean isUpdate) {
        try {
            String title = isUpdate ? "作业/实验报告已更新" : "有新的作业/实验报告提交";
            String action = isUpdate ? "更新" : "提交";
            String content = String.format("学生 %s %s了作业/实验报告《%s》。请前往批改。",
                    studentReport.getStudentName(),
                    action,
                    labReport != null ? labReport.getReportTitle() : "未知作业/报告");

            messageService.sendMessage(
                    studentReport.getStudentId(),
                    "STUDENT",
                    labReport.getTeacherId(),
                    "TEACHER",
                    "SYSTEM",
                    title,
                    content,
                    labReport.getReportId().toString());
        } catch (Exception e) {
            System.err.println("发送提交通知失败: " + e.getMessage());
        }
    }
}
