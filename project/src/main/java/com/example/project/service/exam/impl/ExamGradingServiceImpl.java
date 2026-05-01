package com.example.project.service.exam.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.project.dto.exam.ExamGradingDTO;
import com.example.project.dto.exam.StudentAnswerDTO;
import com.example.project.dto.exam.StudentExamDetailDTO;
import com.example.project.entity.Student;
import com.example.project.entity.exam.ExamQuestion;
import com.example.project.entity.exam.StudentAnswer;
import com.example.project.entity.exam.StudentExam;
import com.example.project.mapper.StudentUserMapper;
import com.example.project.mapper.exam.ExamQuestionMapper;
import com.example.project.mapper.exam.StudentAnswerMapper;
import com.example.project.mapper.exam.StudentExamMapper;
import com.example.project.service.exam.ExamGradingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
public class ExamGradingServiceImpl implements ExamGradingService {

    @Autowired
    private StudentExamMapper studentExamMapper;

    @Autowired
    private StudentAnswerMapper studentAnswerMapper;

    @Autowired
    private ExamQuestionMapper examQuestionMapper;

    @Autowired
    private StudentUserMapper studentUserMapper;

    @Override
    public List<StudentExam> getPendingExams(Long examId) {
        QueryWrapper<StudentExam> wrapper = new QueryWrapper<>();
        wrapper.eq("exam_id", examId);
        wrapper.in("status", 2, 3); // 2-已提交, 3-已批改
        wrapper.orderByAsc("submit_time");
        return studentExamMapper.selectList(wrapper);
    }

    @Override
    public StudentExamDetailDTO getStudentExamDetail(Long studentExamId) {
        // 获取学生考试记录
        StudentExam studentExam = studentExamMapper.selectById(studentExamId);
        if (studentExam == null) {
            throw new RuntimeException("学生考试记录不存在");
        }

        // 获取学生信息
        Student student = studentUserMapper.selectById(Integer.parseInt(studentExam.getStudentId()));

        // 构建DTO
        StudentExamDetailDTO detailDTO = new StudentExamDetailDTO();
        detailDTO.setStudentExamId(studentExam.getStudentExamId());
        detailDTO.setExamId(studentExam.getExamId());
        detailDTO.setStudentId(studentExam.getStudentId());
        detailDTO.setStudentName(student != null ? student.getStudentsUsername() : "未知");
        detailDTO.setStudentAvatar(student != null ? student.getStudentsHead() : null);
        detailDTO.setStartTime(studentExam.getStartTime());
        detailDTO.setSubmitTime(studentExam.getSubmitTime());
        detailDTO.setTotalScore(studentExam.getTotalScore());
        detailDTO.setObtainedScore(studentExam.getObtainedScore());
        detailDTO.setStatus(studentExam.getStatus());

        // 获取学生答题记录
        QueryWrapper<StudentAnswer> answerWrapper = new QueryWrapper<>();
        answerWrapper.eq("student_exam_id", studentExamId);
        List<StudentAnswer> studentAnswers = studentAnswerMapper.selectList(answerWrapper);

        // 构建答题详情列表
        List<StudentAnswerDTO> answerDTOs = new ArrayList<>();
        for (StudentAnswer answer : studentAnswers) {
            // 获取试题信息
            ExamQuestion question = examQuestionMapper.selectById(answer.getQuestionId());

            StudentAnswerDTO answerDTO = new StudentAnswerDTO();
            answerDTO.setAnswerId(answer.getAnswerId());
            answerDTO.setQuestionId(answer.getQuestionId());
            answerDTO.setStudentAnswer(answer.getStudentAnswer());
            answerDTO.setIsCorrect(answer.getIsCorrect());
            answerDTO.setScore(answer.getScore());
            answerDTO.setTeacherComment(answer.getTeacherComment());

            if (question != null) {
                answerDTO.setQuestionType(question.getQuestionType());
                answerDTO.setQuestionContent(question.getQuestionContent());
                answerDTO.setQuestionOptions(question.getQuestionOptions());
                answerDTO.setAnswer(question.getAnswer());
                answerDTO.setCorrectAnswer(question.getAnswer()); // 兼容字段
                answerDTO.setQuestionScore(question.getScore());
                answerDTO.setAnalysis(question.getAnalysis());
            }

            answerDTOs.add(answerDTO);
        }

        detailDTO.setAnswers(answerDTOs);

        return detailDTO;
    }

    @Override
    @Transactional
    public void gradeExam(Long studentExamId, ExamGradingDTO gradingDTO) {
        // 获取学生考试记录
        StudentExam studentExam = studentExamMapper.selectById(studentExamId);
        if (studentExam == null) {
            throw new RuntimeException("学生考试记录不存在");
        }

        // 先自动批改客观题
        autoGradeObjectiveQuestions(studentExamId);

        // 批改主观题
        BigDecimal totalObtainedScore = BigDecimal.ZERO;

        if (gradingDTO.getAnswers() != null) {
            for (ExamGradingDTO.AnswerGradeDTO answerGrade : gradingDTO.getAnswers()) {
                StudentAnswer answer = studentAnswerMapper.selectById(answerGrade.getAnswerId());
                if (answer != null) {
                    answer.setScore(answerGrade.getScore());
                    answer.setTeacherComment(answerGrade.getTeacherComment());
                    studentAnswerMapper.updateById(answer);
                }
            }
        }

        // 计算总分
        QueryWrapper<StudentAnswer> wrapper = new QueryWrapper<>();
        wrapper.eq("student_exam_id", studentExamId);
        List<StudentAnswer> allAnswers = studentAnswerMapper.selectList(wrapper);

        for (StudentAnswer answer : allAnswers) {
            if (answer.getScore() != null) {
                totalObtainedScore = totalObtainedScore.add(answer.getScore());
            }
        }

        // 更新学生考试记录
        studentExam.setObtainedScore(totalObtainedScore);
        studentExam.setStatus(3); // 已批改
        studentExam.setGradedBy(gradingDTO.getTeacherId());
        studentExam.setGradedTime(new Date());
        studentExamMapper.updateById(studentExam);
    }

    @Override
    @Transactional
    public void autoGradeObjectiveQuestions(Long studentExamId) {
        // 获取所有答题记录
        QueryWrapper<StudentAnswer> wrapper = new QueryWrapper<>();
        wrapper.eq("student_exam_id", studentExamId);
        List<StudentAnswer> studentAnswers = studentAnswerMapper.selectList(wrapper);

        for (StudentAnswer answer : studentAnswers) {
            // 获取试题信息
            ExamQuestion question = examQuestionMapper.selectById(answer.getQuestionId());
            if (question == null) {
                continue;
            }

            // 只批改客观题：单选(SINGLE)、多选(MULTIPLE)、判断(JUDGE)
            String questionType = question.getQuestionType();
            if ("SINGLE".equals(questionType) || "MULTIPLE".equals(questionType) || "JUDGE".equals(questionType)) {
                String correctAnswer = question.getAnswer();
                String studentAnswer = answer.getStudentAnswer();

                // 判断答案是否正确
                boolean isCorrect = false;
                BigDecimal score = BigDecimal.ZERO;
                String comment = null;

                if (studentAnswer != null && correctAnswer != null) {
                    String normStudent = normalizeAnswer(studentAnswer);
                    String normCorrect = normalizeAnswer(correctAnswer);

                    if ("MULTIPLE".equals(questionType) || "MULTIPLE_CHOICE".equals(questionType)) {
                        if (normStudent.equals(normCorrect)) {
                            isCorrect = true;
                            score = new BigDecimal(question.getScore());
                        } else if (!normStudent.isEmpty()) {
                            boolean isSubset = true;
                            for (char c : normStudent.toCharArray()) {
                                if (normCorrect.indexOf(c) == -1) {
                                    isSubset = false;
                                    break;
                                }
                            }
                            if (isSubset) {
                                isCorrect = true; // 部分正确也标记为1以便前端不显示大红叉
                                score = new BigDecimal(question.getScore()).multiply(new BigDecimal("0.5"));
                                comment = "[系统自动判分] 漏选得一半分数";
                            }
                        }
                    } else {
                        if (studentAnswer.trim().equalsIgnoreCase(correctAnswer.trim())) {
                            isCorrect = true;
                            score = new BigDecimal(question.getScore());
                        }
                    }
                }

                // 更新答题记录
                answer.setIsCorrect(isCorrect ? 1 : 0);
                answer.setScore(score);
                if (comment != null) {
                    answer.setTeacherComment(comment);
                } else if (answer.getTeacherComment() != null && answer.getTeacherComment().contains("漏选得一半分数")) {
                    answer.setTeacherComment(null); // 清除旧的漏选注释
                }

                studentAnswerMapper.updateById(answer);
            }
        }
    }

    @Autowired
    private com.example.project.service.ai.AiQuestionGeneratorService aiQuestionGeneratorService;

    @Override
    @org.springframework.scheduling.annotation.Async
    @Transactional
    public void autoAiGradeExamPaper(Long studentExamId) {
        // 获取所有答题记录
        QueryWrapper<StudentAnswer> wrapper = new QueryWrapper<>();
        wrapper.eq("student_exam_id", studentExamId);
        List<StudentAnswer> studentAnswers = studentAnswerMapper.selectList(wrapper);

        for (StudentAnswer answer : studentAnswers) {
            // 获取试题信息
            ExamQuestion question = examQuestionMapper.selectById(answer.getQuestionId());
            if (question == null) {
                continue;
            }

            // 只处理主观题
            String questionType = question.getQuestionType();
            boolean isObjective = "SINGLE".equals(questionType) || "SINGLE_CHOICE".equals(questionType) ||
                    "MULTIPLE".equals(questionType) || "MULTIPLE_CHOICE".equals(questionType) ||
                    "JUDGE".equals(questionType) || "TRUE_FALSE".equals(questionType);

            if (!isObjective) {
                String studentAns = answer.getStudentAnswer();
                if (studentAns != null && !studentAns.trim().isEmpty()) {
                    try {
                        java.util.Map<String, Object> aiGrade = aiQuestionGeneratorService.gradeShortAnswer(
                                question.getQuestionContent(),
                                question.getAnswer(),
                                studentAns,
                                question.getScore());

                        if (aiGrade != null && aiGrade.get("score") != null) {
                            BigDecimal aiScore = new BigDecimal(aiGrade.get("score").toString());
                            String aiComment = (String) aiGrade.get("comment");

                            answer.setScore(aiScore);
                            answer.setTeacherComment(aiComment);
                        } else {
                            answer.setScore(BigDecimal.ZERO);
                            answer.setTeacherComment("[AI批改失败] 无法获取评分结果");
                        }
                    } catch (Exception e) {
                        System.err.println("试卷整卷AI批改异常: " + e.getMessage());
                        answer.setScore(BigDecimal.ZERO);
                        answer.setTeacherComment("[AI服务出错] 请继续人工批改");
                    }
                } else {
                    answer.setScore(BigDecimal.ZERO);
                    answer.setTeacherComment("未作答");
                }
                studentAnswerMapper.updateById(answer);
            }
        }

        // AI批改完成后，重新计算总分，并将状态设置为已批改
        BigDecimal totalObtainedScore = BigDecimal.ZERO;
        List<StudentAnswer> allAnswers = studentAnswerMapper
                .selectList(new QueryWrapper<StudentAnswer>().eq("student_exam_id", studentExamId));
        for (StudentAnswer ans : allAnswers) {
            if (ans.getScore() != null) {
                totalObtainedScore = totalObtainedScore.add(ans.getScore());
            }
        }

        StudentExam studentExam = studentExamMapper.selectById(studentExamId);
        if (studentExam != null) {
            studentExam.setObtainedScore(totalObtainedScore);
            // 保持为状态2（待批改/待发布），等待教师确认后发布
            studentExam.setGradedBy("AI系统初步批改");
            studentExam.setGradedTime(new Date());
            studentExamMapper.updateById(studentExam);
        }
    }

    /**
     * 标准化答案（用于多选题比较）
     * 将答案字符串按字母排序
     */
    private String normalizeAnswer(String answer) {
        if (answer == null) {
            return "";
        }
        char[] chars = answer.trim().toUpperCase().toCharArray();
        java.util.Arrays.sort(chars);
        return new String(chars);
    }

    @Override
    @Transactional
    public void publishExamGrades(Long examId) {
        // 将某考试下所有状态为2的(待批改的)更新为3(已发布)
        QueryWrapper<StudentExam> wrapper = new QueryWrapper<>();
        wrapper.eq("exam_id", examId);
        wrapper.eq("status", 2);

        List<StudentExam> unpubExams = studentExamMapper.selectList(wrapper);
        for (StudentExam se : unpubExams) {
            se.setStatus(3);
            se.setGradedTime(new Date());
            se.setGradedBy("教师一键发布");
            studentExamMapper.updateById(se);
        }
    }

    @Override
    @Transactional
    public void publishSelectedExamGrades(List<Long> studentExamIds) {
        if (studentExamIds == null || studentExamIds.isEmpty())
            return;

        for (Long seId : studentExamIds) {
            StudentExam se = studentExamMapper.selectById(seId);
            if (se != null && se.getStatus() == 2) {
                se.setStatus(3);
                se.setGradedTime(new Date());
                se.setGradedBy("教师批量发布");
                studentExamMapper.updateById(se);
            }
        }
    }
}
