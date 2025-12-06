package com.example.project.service.classmanage.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.project.dto.classmanage.ClassCreateDTO;
import com.example.project.dto.classmanage.StudentProgressDTO;
import com.example.project.entity.Student;
import com.example.project.entity.classmanage.ClassInfo;
import com.example.project.entity.classmanage.ClassStudent;
import com.example.project.entity.course.CourseChapter;
import com.example.project.entity.course.CourseProgress;
import com.example.project.entity.exam.StudentExam;
import com.example.project.entity.homework.StudentLabReport;
import com.example.project.mapper.StudentUserMapper;
import com.example.project.mapper.classmanage.ClassInfoMapper;
import com.example.project.mapper.classmanage.ClassStudentMapper;
import com.example.project.mapper.course.CourseChapterMapper;
import com.example.project.mapper.course.CourseProgressMapper;
import com.example.project.mapper.exam.StudentExamMapper;
import com.example.project.mapper.homework.StudentLabReportMapper;
import com.example.project.service.classmanage.ClassManagementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
public class ClassManagementServiceImpl implements ClassManagementService {
    
    @Autowired
    private ClassInfoMapper classInfoMapper;
    
    @Autowired
    private ClassStudentMapper classStudentMapper;
    
    @Autowired
    private StudentUserMapper studentUserMapper;
    
    @Autowired
    private CourseChapterMapper courseChapterMapper;
    
    @Autowired
    private CourseProgressMapper courseProgressMapper;
    
    @Autowired
    private StudentExamMapper studentExamMapper;
    
    @Autowired
    private StudentLabReportMapper studentLabReportMapper;
    
    @Override
    @Transactional
    public Map<String, Object> createClass(ClassCreateDTO classCreateDTO) {
        // 创建班级
        ClassInfo classInfo = new ClassInfo();
        classInfo.setCourseId(classCreateDTO.getCourseId());
        classInfo.setClassName(classCreateDTO.getClassName());
        classInfo.setDescription(classCreateDTO.getDescription());
        classInfo.setMaxStudents(classCreateDTO.getMaxStudents());
        
        // 生成班级码（6位随机字符串）
        String classCode = generateClassCode();
        classInfo.setClassCode(classCode);
        classInfo.setCreateTime(new Date());
        
        classInfoMapper.insert(classInfo);
        
        // 返回结果
        Map<String, Object> result = new HashMap<>();
        result.put("classId", classInfo.getClassId());
        result.put("classCode", classCode);
        result.put("className", classInfo.getClassName());
        
        return result;
    }
    
    @Override
    public List<Map<String, Object>> getClassesByCourseId(String courseId) {
        QueryWrapper<ClassInfo> wrapper = new QueryWrapper<>();
        wrapper.eq("course_id", courseId);
        wrapper.orderByDesc("create_time");
        List<ClassInfo> classList = classInfoMapper.selectList(wrapper);
        
        List<Map<String, Object>> result = new ArrayList<>();
        for (ClassInfo classInfo : classList) {
            Map<String, Object> classData = new HashMap<>();
            classData.put("classId", classInfo.getClassId());
            classData.put("courseId", classInfo.getCourseId());
            classData.put("className", classInfo.getClassName());
            classData.put("classCode", classInfo.getClassCode());
            classData.put("description", classInfo.getDescription());
            classData.put("maxStudents", classInfo.getMaxStudents());
            classData.put("createTime", classInfo.getCreateTime());
            
            // 统计当前学生数
            QueryWrapper<ClassStudent> studentWrapper = new QueryWrapper<>();
            studentWrapper.eq("class_id", classInfo.getClassId());
            studentWrapper.eq("status", 1);
            Long currentStudents = classStudentMapper.selectCount(studentWrapper);
            classData.put("currentStudents", currentStudents);
            
            result.add(classData);
        }
        
        return result;
    }
    
    @Override
    public List<Map<String, Object>> getClassStudents(Long classId) {
        // 查询班级学生关系
        QueryWrapper<ClassStudent> wrapper = new QueryWrapper<>();
        wrapper.eq("class_id", classId);
        wrapper.eq("status", 1);
        wrapper.orderByAsc("join_time");
        List<ClassStudent> classStudents = classStudentMapper.selectList(wrapper);
        
        List<Map<String, Object>> result = new ArrayList<>();
        for (ClassStudent classStudent : classStudents) {
            // 查询学生信息
            Student student = studentUserMapper.selectById(classStudent.getStudentId());
            if (student != null) {
                Map<String, Object> studentData = new HashMap<>();
                studentData.put("studentId", student.getStudentsId().toString());
                studentData.put("studentsUsername", student.getStudentsUsername());
                studentData.put("studentsEmail", student.getStudentsEmail());
                studentData.put("studentsHead", student.getStudentsHead());
                studentData.put("joinTime", classStudent.getJoinTime());
                studentData.put("status", classStudent.getStatus());
                
                result.add(studentData);
            }
        }
        
        return result;
    }
    
    @Override
    @Transactional
    public void removeStudent(Long classId, String studentId) {
        QueryWrapper<ClassStudent> wrapper = new QueryWrapper<>();
        wrapper.eq("class_id", classId);
        wrapper.eq("student_id", studentId);
        
        ClassStudent classStudent = classStudentMapper.selectOne(wrapper);
        if (classStudent != null) {
            classStudent.setStatus(0); // 设置为已移除
            classStudentMapper.updateById(classStudent);
        }
    }
    
    @Override
    public StudentProgressDTO getStudentProgress(String studentId, String courseId) {
        StudentProgressDTO progressDTO = new StudentProgressDTO();
        progressDTO.setStudentId(studentId);
        progressDTO.setCourseId(courseId);
        
        // 获取学生信息
        Student student = studentUserMapper.selectById(studentId);
        if (student != null) {
            progressDTO.setStudentName(student.getStudentsUsername());
        }
        
        // 统计章节总数（排除文件夹类型）
        QueryWrapper<CourseChapter> chapterWrapper = new QueryWrapper<>();
        chapterWrapper.eq("course_id", courseId);
        chapterWrapper.eq("status", 1);
        chapterWrapper.ne("chapter_type", "FOLDER");
        Long totalChapters = courseChapterMapper.selectCount(chapterWrapper);
        progressDTO.setTotalChapters(totalChapters.intValue());
        
        // 统计已完成章节数
        QueryWrapper<CourseProgress> progressWrapper = new QueryWrapper<>();
        progressWrapper.eq("student_id", studentId);
        progressWrapper.eq("course_id", courseId);
        progressWrapper.eq("is_completed", 1);
        Long completedChapters = courseProgressMapper.selectCount(progressWrapper);
        progressDTO.setCompletedChapters(completedChapters.intValue());
        
        // 计算进度百分比
        if (totalChapters > 0) {
            BigDecimal percentage = new BigDecimal(completedChapters)
                    .divide(new BigDecimal(totalChapters), 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"));
            progressDTO.setProgressPercentage(percentage);
        } else {
            progressDTO.setProgressPercentage(BigDecimal.ZERO);
        }
        
        // 统计考试信息
        QueryWrapper<StudentExam> examWrapper = new QueryWrapper<>();
        examWrapper.eq("student_id", studentId);
        examWrapper.apply("exam_id IN (SELECT exam_id FROM exam WHERE course_id = {0})", courseId);
        List<StudentExam> studentExams = studentExamMapper.selectList(examWrapper);
        
        progressDTO.setTotalExams(studentExams.size());
        
        int completedExams = 0;
        BigDecimal totalExamScore = BigDecimal.ZERO;
        int gradedExams = 0;
        
        for (StudentExam studentExam : studentExams) {
            if (studentExam.getStatus() >= 2) { // 已提交
                completedExams++;
            }
            if (studentExam.getStatus() == 3 && studentExam.getObtainedScore() != null) { // 已批改
                totalExamScore = totalExamScore.add(studentExam.getObtainedScore());
                gradedExams++;
            }
        }
        
        progressDTO.setCompletedExams(completedExams);
        
        if (gradedExams > 0) {
            BigDecimal averageScore = totalExamScore.divide(new BigDecimal(gradedExams), 2, RoundingMode.HALF_UP);
            progressDTO.setAverageExamScore(averageScore);
        } else {
            progressDTO.setAverageExamScore(BigDecimal.ZERO);
        }
        
        // 统计实验报告信息
        QueryWrapper<StudentLabReport> reportWrapper = new QueryWrapper<>();
        reportWrapper.eq("student_id", studentId);
        reportWrapper.apply("report_id IN (SELECT report_id FROM lab_report WHERE course_id = {0})", courseId);
        List<StudentLabReport> studentReports = studentLabReportMapper.selectList(reportWrapper);
        
        progressDTO.setTotalReports(studentReports.size());
        
        int submittedReports = 0;
        for (StudentLabReport report : studentReports) {
            if (report.getStatus() >= 1) { // 已提交
                submittedReports++;
            }
        }
        
        progressDTO.setSubmittedReports(submittedReports);
        
        return progressDTO;
    }
    
    @Override
    @Transactional
    public void deleteClass(Long classId) {
        // 检查班级是否存在
        ClassInfo classInfo = classInfoMapper.selectById(classId);
        if (classInfo == null) {
            throw new RuntimeException("班级不存在");
        }
        
        // 删除班级学生关系
        QueryWrapper<ClassStudent> studentWrapper = new QueryWrapper<>();
        studentWrapper.eq("class_id", classId);
        classStudentMapper.delete(studentWrapper);
        
        // 删除班级
        classInfoMapper.deleteById(classId);
        
        System.out.println("已删除班级: " + classId + " 及其所有学生关系");
    }
    
    @Override
    @Transactional
    public void updateClass(Long classId, ClassCreateDTO classCreateDTO) {
        ClassInfo classInfo = classInfoMapper.selectById(classId);
        if (classInfo == null) {
            throw new RuntimeException("班级不存在");
        }
        
        if (classCreateDTO.getClassName() != null) {
            classInfo.setClassName(classCreateDTO.getClassName());
        }
        if (classCreateDTO.getDescription() != null) {
            classInfo.setDescription(classCreateDTO.getDescription());
        }
        if (classCreateDTO.getMaxStudents() != null) {
            classInfo.setMaxStudents(classCreateDTO.getMaxStudents());
        }
        
        classInfoMapper.updateById(classInfo);
    }
    
    @Override
    public Map<String, Object> getClassDetail(Long classId) {
        ClassInfo classInfo = classInfoMapper.selectById(classId);
        if (classInfo == null) {
            throw new RuntimeException("班级不存在");
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("classId", classInfo.getClassId());
        result.put("courseId", classInfo.getCourseId());
        result.put("className", classInfo.getClassName());
        result.put("classCode", classInfo.getClassCode());
        result.put("description", classInfo.getDescription());
        result.put("maxStudents", classInfo.getMaxStudents());
        result.put("createTime", classInfo.getCreateTime());
        
        // 统计当前学生数
        QueryWrapper<ClassStudent> studentWrapper = new QueryWrapper<>();
        studentWrapper.eq("class_id", classId);
        studentWrapper.eq("status", 1);
        Long currentStudents = classStudentMapper.selectCount(studentWrapper);
        result.put("currentStudents", currentStudents);
        
        return result;
    }
    
    @Override
    @Transactional
    public void addStudent(Long classId, String studentId) {
        // 检查班级是否存在
        ClassInfo classInfo = classInfoMapper.selectById(classId);
        if (classInfo == null) {
            throw new RuntimeException("班级不存在");
        }
        
        // 检查学生是否存在
        Student student = studentUserMapper.selectById(studentId);
        if (student == null) {
            throw new RuntimeException("学生不存在");
        }
        
        // 检查是否已经在班级中
        QueryWrapper<ClassStudent> wrapper = new QueryWrapper<>();
        wrapper.eq("class_id", classId);
        wrapper.eq("student_id", studentId);
        ClassStudent existingRelation = classStudentMapper.selectOne(wrapper);
        
        if (existingRelation != null) {
            if (existingRelation.getStatus() == 1) {
                throw new RuntimeException("学生已在班级中");
            } else {
                // 重新激活
                existingRelation.setStatus(1);
                existingRelation.setJoinTime(new Date());
                classStudentMapper.updateById(existingRelation);
                return;
            }
        }
        
        // 检查班级人数限制
        if (classInfo.getMaxStudents() != null) {
            QueryWrapper<ClassStudent> countWrapper = new QueryWrapper<>();
            countWrapper.eq("class_id", classId);
            countWrapper.eq("status", 1);
            Long currentCount = classStudentMapper.selectCount(countWrapper);
            
            if (currentCount >= classInfo.getMaxStudents()) {
                throw new RuntimeException("班级人数已达上限");
            }
        }
        
        // 添加学生
        ClassStudent classStudent = new ClassStudent();
        classStudent.setClassId(classId);
        classStudent.setStudentId(studentId);
        classStudent.setJoinTime(new Date());
        classStudent.setStatus(1);
        classStudentMapper.insert(classStudent);
    }
    
    @Override
    @Transactional
    public Map<String, Object> batchAddStudents(Long classId, List<String> studentIds) {
        int successCount = 0;
        int failCount = 0;
        List<String> failedStudents = new ArrayList<>();
        
        for (String studentId : studentIds) {
            try {
                addStudent(classId, studentId);
                successCount++;
            } catch (Exception e) {
                failCount++;
                failedStudents.add(studentId + ": " + e.getMessage());
            }
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("successCount", successCount);
        result.put("failCount", failCount);
        result.put("failedStudents", failedStudents);
        
        return result;
    }
    
    /**
     * 生成6位随机班级码
     */
    private String generateClassCode() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        Random random = new Random();
        StringBuilder code = new StringBuilder();
        
        for (int i = 0; i < 6; i++) {
            code.append(chars.charAt(random.nextInt(chars.length())));
        }
        
        // 检查班级码是否已存在
        QueryWrapper<ClassInfo> wrapper = new QueryWrapper<>();
        wrapper.eq("class_code", code.toString());
        Long count = classInfoMapper.selectCount(wrapper);
        
        if (count > 0) {
            // 如果已存在，递归生成新的
            return generateClassCode();
        }
        
        return code.toString();
    }
}
