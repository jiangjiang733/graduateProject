package com.example.project.service.exam.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.project.dto.exam.ExamCreateDTO;
import com.example.project.dto.exam.ExamQuestionDTO;
import com.example.project.dto.exam.ExamStatisticsDTO;
import com.example.project.entity.Student;
import com.example.project.entity.exam.Exam;
import com.example.project.entity.exam.ExamQuestion;
import com.example.project.entity.exam.StudentExam;
import com.example.project.entity.course.StudentCourse;
import com.example.project.entity.exam.StudentAnswer;
import com.example.project.mapper.exam.ExamMapper;
import com.example.project.mapper.exam.ExamQuestionMapper;
import com.example.project.mapper.exam.StudentExamMapper;
import com.example.project.mapper.exam.StudentAnswerMapper;
import com.example.project.mapper.course.StudentCourseMapper;
import com.example.project.service.exam.ExamService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
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

    @Autowired
    private StudentAnswerMapper studentAnswerMapper;

    @Autowired
    private com.example.project.mapper.StudentUserMapper studentUserMapper;

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

    @Override
    public List<Exam> getExamsByTeacherId(String teacherId) {
        QueryWrapper<Exam> wrapper = new QueryWrapper<>();
        wrapper.eq("teacher_id", teacherId);
        wrapper.orderByDesc("create_time");
        List<Exam> exams = examMapper.selectList(wrapper);

        for (Exam exam : exams) {
            enrichExamInfo(exam);
        }

        return exams;
    }

    @Autowired
    private com.example.project.mapper.enrollment.CourseEnrollmentMapper courseEnrollmentMapper;

    /**
     * 丰富考试信息（添加课程名称、参考人数等）
     */
    private void enrichExamInfo(Exam exam) {
        // 获取课程名称
        if (exam.getCourseId() != null) {
            com.example.project.entity.course.Course course = examMapper.selectCourseById(exam.getCourseId());
            if (course != null) {
                exam.setCourseName(course.getCourseName());
            }

            // 获取参与人数（本次课程的参与人数）
            QueryWrapper<com.example.project.entity.enrollment.CourseEnrollment> enrollmentWrapper = new QueryWrapper<>();
            enrollmentWrapper.eq("course_id", exam.getCourseId());
            enrollmentWrapper.eq("status", "approved");
            Long enrollmentCount = courseEnrollmentMapper.selectCount(enrollmentWrapper);
            exam.setTotalStudents(enrollmentCount.intValue());
        }

        // 获取提交人数统计
        QueryWrapper<StudentExam> wrapper = new QueryWrapper<>();
        wrapper.eq("exam_id", exam.getExamId());
        wrapper.ge("status", 2); // 2-已提交, 3-已批改
        Long submittedCount = studentExamMapper.selectCount(wrapper);
        exam.setSubmittedCount(submittedCount.intValue());

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
        if (exam != null) {
            enrichExamInfo(exam);
        }
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
    public void saveExamQuestions(Long examId, List<ExamQuestionDTO> questions) {
        // 1. 删除现有试题
        QueryWrapper<ExamQuestion> qWrapper = new QueryWrapper<>();
        qWrapper.eq("exam_id", examId);
        examQuestionMapper.delete(qWrapper);

        // 2. 插入新试题并计算总分
        int totalScore = 0;
        if (questions != null && !questions.isEmpty()) {
            for (int i = 0; i < questions.size(); i++) {
                ExamQuestionDTO dto = questions.get(i);
                ExamQuestion question = new ExamQuestion();
                BeanUtils.copyProperties(dto, question);
                question.setExamId(examId);
                if (question.getQuestionOrder() == null) {
                    question.setQuestionOrder(i + 1);
                }
                examQuestionMapper.insert(question);
                totalScore += (dto.getScore() != null ? dto.getScore() : 0);
            }
        }

        // 3. 更新考试记录的总分
        Exam exam = examMapper.selectById(examId);
        if (exam != null) {
            exam.setTotalScore(totalScore);
            examMapper.updateById(exam);
        }
    }

    @Override
    @Transactional
    public void deleteExam(Long examId) {
        // 1. 获取所有相关的 student_exam_id
        QueryWrapper<StudentExam> seWrapper = new QueryWrapper<>();
        seWrapper.eq("exam_id", examId);
        List<StudentExam> studentExams = studentExamMapper.selectList(seWrapper);
        List<Long> seIds = studentExams.stream().map(StudentExam::getStudentExamId).collect(Collectors.toList());

        // 2. 删除相关的学生作答记录
        if (!seIds.isEmpty()) {
            QueryWrapper<StudentAnswer> saWrapper = new QueryWrapper<>();
            saWrapper.in("student_exam_id", seIds);
            studentAnswerMapper.delete(saWrapper);
        }

        // 3. 删除相关的学生考试记录
        studentExamMapper.delete(seWrapper);

        // 4. 删除试卷试题
        QueryWrapper<ExamQuestion> qWrapper = new QueryWrapper<>();
        qWrapper.eq("exam_id", examId);
        examQuestionMapper.delete(qWrapper);

        // 5. 最后删除考试本身
        examMapper.deleteById(examId);
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
            statistics.setPassRate(new BigDecimal(passCount)
                    .divide(new BigDecimal(gradedCount), 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100")));
        }

        statistics.setScoreDistribution(scoreDistribution);

        return statistics;
    }

    @Override
    public List<Map<String, Object>> getStudentExamStatus(Long examId) {
        Exam exam = examMapper.selectById(examId);
        if (exam == null) {
            return new ArrayList<>();
        }

        // 1. 获取所有已选该课程并审核通过的学生
        QueryWrapper<com.example.project.entity.enrollment.CourseEnrollment> enrollmentWrapper = new QueryWrapper<>();
        enrollmentWrapper.eq("course_id", exam.getCourseId());
        enrollmentWrapper.eq("status", "approved");
        List<com.example.project.entity.enrollment.CourseEnrollment> enrollments = courseEnrollmentMapper
                .selectList(enrollmentWrapper);

        // 2. 获取现有的考试记录
        QueryWrapper<StudentExam> wrapper = new QueryWrapper<>();
        wrapper.eq("exam_id", examId);
        List<StudentExam> studentExams = studentExamMapper.selectList(wrapper);
        Map<String, StudentExam> examMap = studentExams.stream()
                .collect(Collectors.toMap(StudentExam::getStudentId, se -> se, (v1, v2) -> v1));

        // 3. 合并信息
        return enrollments.stream().map(enrollment -> {
            String studentId = enrollment.getStudentId();
            Map<String, Object> map = new HashMap<>();
            map.put("studentId", studentId);

            // 获取学生姓名
            try {
                com.example.project.entity.Student student = studentUserMapper.selectById(Integer.parseInt(studentId));
                map.put("studentName", student != null ? student.getStudentsUsername() : "未知学生");
            } catch (Exception e) {
                map.put("studentName", "学生" + studentId);
            }

            StudentExam se = examMap.get(studentId);
            if (se != null) {
                map.put("studentExamId", se.getStudentExamId());
                map.put("status", se.getStatus()); // 1-进行中, 2-已提交, 3-已批改
                map.put("obtainedScore", se.getObtainedScore());
                map.put("submitTime", se.getSubmitTime());
            } else {
                map.put("studentExamId", null);
                map.put("status", 0); // 0-未参加
                map.put("obtainedScore", null);
                map.put("submitTime", null);
            }

            return map;
        }).collect(Collectors.toList());
    }

    @Override
    public List<Exam> searchExams(String teacherId, String courseId, String status, String keyword) {
        QueryWrapper<Exam> wrapper = new QueryWrapper<>();
        if (teacherId != null && !teacherId.isEmpty()) {
            wrapper.eq("teacher_id", teacherId);
        }
        if (courseId != null && !courseId.isEmpty()) {
            wrapper.eq("course_id", courseId);
        }
        if (status != null && !status.isEmpty()) {
            // 目前 status 在数据库是数字 0-草稿, 1-已发布
            if ("DRAFT".equals(status))
                wrapper.eq("status", 0);
            else if ("PUBLISHED".equals(status) || "ONGOING".equals(status) || "ENDED".equals(status)) {
                wrapper.eq("status", 1);
                // 这里的细分（进行中/已结束）通常在内存中根据时间判断，或者在这里加时间过滤
                Date now = new Date();
                if ("PUBLISHED".equals(status))
                    wrapper.gt("start_time", now);
                else if ("ONGOING".equals(status))
                    wrapper.le("start_time", now).ge("end_time", now);
                else if ("ENDED".equals(status))
                    wrapper.lt("end_time", now);
            }
        }
        if (keyword != null && !keyword.isEmpty()) {
            wrapper.and(i -> i.like("exam_title", keyword).or().like("exam_description", keyword));
        }
        wrapper.orderByDesc("create_time");

        List<Exam> exams = examMapper.selectList(wrapper);
        for (Exam exam : exams) {
            enrichExamInfo(exam);
        }
        return exams;
    }

    @Transactional
    public void unpublishExam(Long examId) {
        Exam exam = new Exam();
        exam.setExamId(examId);
        exam.setStatus(0); // 设置回草稿状态
        examMapper.updateById(exam);
    }

    @Override
    @Transactional
    public void returnStudentExam(Long studentExamId) {
        // 删除该学生的答题记录
        QueryWrapper<StudentAnswer> answerWrapper = new QueryWrapper<>();
        answerWrapper.eq("student_exam_id", studentExamId);
        studentAnswerMapper.delete(answerWrapper);

        // 删除该学生的考试记录（或者将其状态重置，这里选择直接删除记录让学生重考）
        studentExamMapper.deleteById(studentExamId);
    }
}
