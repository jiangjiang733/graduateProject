package com.example.project.service.exam.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.project.dto.exam.ExamCreateDTO;
import com.example.project.dto.exam.ExamQuestionDTO;
import com.example.project.dto.exam.ExamStatisticsDTO;
import com.example.project.entity.exam.Exam;
import com.example.project.entity.exam.ExamQuestion;
import com.example.project.entity.exam.StudentExam;
import com.example.project.entity.course.StudentCourse;
import com.example.project.mapper.exam.ExamMapper;
import com.example.project.mapper.exam.ExamQuestionMapper;
import com.example.project.mapper.exam.StudentExamMapper;
import com.example.project.mapper.course.StudentCourseMapper;
import com.example.project.service.exam.ExamService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ExamServiceImpl implements ExamService {
    
    @Autowired
    private ExamMapper examMapper;
    
    @Autowired
    private ExamQuestionMapper examQuestionMapper;
    
    @Autowired
    private StudentExamMapper studentExamMapper;
    
    @Autowired
    private StudentCourseMapper studentCourseMapper;
    
    @Override
    @Transactional
    public Long createExam(ExamCreateDTO examDTO) {
        // 创建考试
        Exam exam = new Exam();
        BeanUtils.copyProperties(examDTO, exam);
        exam.setStatus(0); // 草稿状态
        examMapper.insert(exam);
        
        // 创建试题
        if (examDTO.getQuestions() != null && !examDTO.getQuestions().isEmpty()) {
            for (ExamQuestionDTO questionDTO : examDTO.getQuestions()) {
                ExamQuestion question = new ExamQuestion();
                BeanUtils.copyProperties(questionDTO, question);
                question.setExamId(exam.getExamId());
                examQuestionMapper.insert(question);
            }
        }
        
        return exam.getExamId();
    }
    
    @Override
    public List<Exam> getExamsByCourseId(String courseId) {
        QueryWrapper<Exam> wrapper = new QueryWrapper<>();
        wrapper.eq("course_id", courseId);
        wrapper.orderByDesc("create_time");
        List<Exam> exams = examMapper.selectList(wrapper);
        
        // 为每个考试添加额外信息
        for (Exam exam : exams) {
            enrichExamInfo(exam);
        }
        
        return exams;
    }
    
    /**
     * 丰富考试信息（添加课程名称、参考人数等）
     */
    private void enrichExamInfo(Exam exam) {
        // 获取课程名称
        if (exam.getCourseId() != null) {
            com.example.project.entity.course.Course course = 
                examMapper.selectCourseById(exam.getCourseId());
            if (course != null) {
                exam.setCourseName(course.getCourseName());
            }
        }
        
        // 获取参考人数统计
        QueryWrapper<StudentExam> wrapper = new QueryWrapper<>();
        wrapper.eq("exam_id", exam.getExamId());
        
        List<StudentExam> studentExams = studentExamMapper.selectList(wrapper);
        exam.setTotalStudents(studentExams.size());
        
        long submittedCount = studentExams.stream()
            .filter(se -> se.getStatus() != null && se.getStatus() >= 2)
            .count();
        exam.setSubmittedCount((int) submittedCount);
        
        // 设置考试状态文本
        updateExamStatus(exam);
    }
    
    /**
     * 更新考试状态（根据时间自动判断）
     */
    private void updateExamStatus(Exam exam) {
        Date now = new Date();
        
        if (exam.getStatus() == 0) {
            exam.setStatusText("DRAFT");
        } else if (exam.getStartTime() != null && exam.getEndTime() != null) {
            if (now.before(exam.getStartTime())) {
                exam.setStatusText("PUBLISHED");
            } else if (now.after(exam.getEndTime())) {
                exam.setStatusText("ENDED");
            } else {
                exam.setStatusText("ONGOING");
            }
        } else {
            exam.setStatusText("PUBLISHED");
        }
    }
    
    @Override
    public Exam getExamById(Long examId) {
        return examMapper.selectById(examId);
    }
    
    @Override
    public Map<String, Object> getExamWithQuestions(Long examId) {
        Map<String, Object> result = new HashMap<>();
        
        // 获取考试信息
        Exam exam = examMapper.selectById(examId);
        result.put("exam", exam);
        
        // 获取试题列表
        List<ExamQuestion> questions = getExamQuestions(examId);
        result.put("questions", questions);
        
        // 获取有资格参加考试的学生列表（已选课的学生）
        if (exam != null && exam.getCourseId() != null) {
            List<String> eligibleStudents = getEligibleStudents(exam.getCourseId());
            result.put("eligibleStudents", eligibleStudents);
        }
        
        return result;
    }
    
    /**
     * 获取有资格参加考试的学生列表（已选课的学生）
     */
    private List<String> getEligibleStudents(String courseId) {
        QueryWrapper<StudentCourse> wrapper = new QueryWrapper<>();
        wrapper.eq("course_id", courseId);
        wrapper.eq("status", 1); // 只获取正常状态的选课记录
        
        List<StudentCourse> studentCourses = studentCourseMapper.selectList(wrapper);
        return studentCourses.stream()
                .map(sc -> String.valueOf(sc.getStudentId()))
                .collect(Collectors.toList());
    }
    
    /**
     * 验证学生是否有资格参加考试
     */
    public boolean validateStudentEligibility(Long examId, String studentId) {
        Exam exam = examMapper.selectById(examId);
        if (exam == null) {
            throw new RuntimeException("考试不存在");
        }
        
        // 将String类型的studentId转换为Integer
        Integer studentIdInt;
        try {
            studentIdInt = Integer.parseInt(studentId);
        } catch (NumberFormatException e) {
            return false;
        }
        
        // 检查学生是否选了这门课
        QueryWrapper<StudentCourse> wrapper = new QueryWrapper<>();
        wrapper.eq("course_id", exam.getCourseId());
        wrapper.eq("student_id", studentIdInt);
        wrapper.eq("status", 1);
        
        StudentCourse studentCourse = studentCourseMapper.selectOne(wrapper);
        return studentCourse != null;
    }
    
    @Override
    public List<ExamQuestion> getExamQuestions(Long examId) {
        QueryWrapper<ExamQuestion> wrapper = new QueryWrapper<>();
        wrapper.eq("exam_id", examId);
        wrapper.orderByAsc("question_order");
        return examQuestionMapper.selectList(wrapper);
    }
    
    @Override
    public void updateExam(Long examId, Exam exam) {
        exam.setExamId(examId);
        examMapper.updateById(exam);
    }
    
    @Override
    public void publishExam(Long examId) {
        Exam exam = new Exam();
        exam.setExamId(examId);
        exam.setStatus(1); // 已发布
        examMapper.updateById(exam);
    }
    
    @Override
    @Transactional
    public void deleteExam(Long examId) {
        // 删除考试
        examMapper.deleteById(examId);
        
        // 删除试题
        QueryWrapper<ExamQuestion> wrapper = new QueryWrapper<>();
        wrapper.eq("exam_id", examId);
        examQuestionMapper.delete(wrapper);
    }
    
    @Override
    public ExamStatisticsDTO getExamStatistics(Long examId) {
        ExamStatisticsDTO statistics = new ExamStatisticsDTO();
        statistics.setExamId(examId);
        
        // 查询所有学生考试记录
        QueryWrapper<StudentExam> wrapper = new QueryWrapper<>();
        wrapper.eq("exam_id", examId);
        List<StudentExam> studentExams = studentExamMapper.selectList(wrapper);
        
        statistics.setTotalStudents(studentExams.size());
        
        int submittedCount = 0;
        int gradedCount = 0;
        BigDecimal totalScore = BigDecimal.ZERO;
        BigDecimal maxScore = BigDecimal.ZERO;
        BigDecimal minScore = new BigDecimal("100");
        int passCount = 0;
        
        Map<String, Integer> scoreDistribution = new HashMap<>();
        scoreDistribution.put("0-59", 0);
        scoreDistribution.put("60-69", 0);
        scoreDistribution.put("70-79", 0);
        scoreDistribution.put("80-89", 0);
        scoreDistribution.put("90-100", 0);
        
        for (StudentExam studentExam : studentExams) {
            if (studentExam.getStatus() >= 2) { // 已提交
                submittedCount++;
            }
            if (studentExam.getStatus() == 3) { // 已批改
                gradedCount++;
                BigDecimal score = studentExam.getObtainedScore();
                if (score != null) {
                    totalScore = totalScore.add(score);
                    if (score.compareTo(maxScore) > 0) {
                        maxScore = score;
                    }
                    if (score.compareTo(minScore) < 0) {
                        minScore = score;
                    }
                    
                    // 统计分数分布
                    int scoreInt = score.intValue();
                    if (scoreInt < 60) {
                        scoreDistribution.put("0-59", scoreDistribution.get("0-59") + 1);
                    } else if (scoreInt < 70) {
                        scoreDistribution.put("60-69", scoreDistribution.get("60-69") + 1);
                    } else if (scoreInt < 80) {
                        scoreDistribution.put("70-79", scoreDistribution.get("70-79") + 1);
                    } else if (scoreInt < 90) {
                        scoreDistribution.put("80-89", scoreDistribution.get("80-89") + 1);
                    } else {
                        scoreDistribution.put("90-100", scoreDistribution.get("90-100") + 1);
                    }
                    
                    if (scoreInt >= 60) {
                        passCount++;
                    }
                }
            }
        }
        
        statistics.setSubmittedCount(submittedCount);
        statistics.setGradedCount(gradedCount);
        
        if (gradedCount > 0) {
            statistics.setAverageScore(totalScore.divide(new BigDecimal(gradedCount), 2, RoundingMode.HALF_UP));
            statistics.setMaxScore(maxScore);
            statistics.setMinScore(minScore);
            statistics.setPassRate(new BigDecimal(passCount).divide(new BigDecimal(gradedCount), 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100")));
        }
        
        statistics.setScoreDistribution(scoreDistribution);
        
        return statistics;
    }
}
