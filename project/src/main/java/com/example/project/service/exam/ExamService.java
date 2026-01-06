package com.example.project.service.exam;

import com.example.project.dto.exam.ExamCreateDTO;
import com.example.project.dto.exam.ExamQuestionDTO;
import com.example.project.dto.exam.ExamStatisticsDTO;
import com.example.project.entity.exam.Exam;
import com.example.project.entity.exam.ExamQuestion;

import java.util.List;
import java.util.Map;

public interface ExamService {

    /**
     * 创建考试
     */
    Long createExam(ExamCreateDTO examDTO);

    /**
     * 获取课程考试列表
     */
    List<Exam> getExamsByCourseId(String courseId);

    /**
     * 获取教师考试列表
     */
    List<Exam> getExamsByTeacherId(String teacherId);

    /**
     * 获取考试详情
     */
    Exam getExamById(Long examId);

    /**
     * 获取考试详情（包含试题）
     */
    Map<String, Object> getExamWithQuestions(Long examId);

    /**
     * 获取考试试题列表
     */
    List<ExamQuestion> getExamQuestions(Long examId);

    /**
     * 更新考试
     */
    void updateExam(Long examId, Exam exam);

    /**
     * 保存考试试题（覆盖更新）
     */
    void saveExamQuestions(Long examId, List<ExamQuestionDTO> questions);

    /**
     * 发布考试
     */
    void publishExam(Long examId);

    /**
     * 删除考试
     */
    void deleteExam(Long examId);

    /**
     * 获取考试统计
     */
    ExamStatisticsDTO getExamStatistics(Long examId);

    /**
     * 验证学生是否有资格参加考试
     */
    boolean validateStudentEligibility(Long examId, String studentId);

    /**
     * 获取考试的所有学生答题记录
     */
    List<Map<String, Object>> getStudentExamStatus(Long examId);

    /**
     * 取消发布考试
     */
    void unpublishExam(Long examId);

    /**
     * 退回学生考试（让学生重新考）
     */
    void returnStudentExam(Long studentExamId);

    /**
     * 搜索考试
     */
    List<Exam> searchExams(String teacherId, String courseId, String status, String keyword);
}
