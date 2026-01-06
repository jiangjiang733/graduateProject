package com.example.project.controller.exam;

import com.example.project.common.Result;
import com.example.project.dto.exam.AiExamCreateRequest;
import com.example.project.dto.exam.ExamCreateDTO;
import com.example.project.dto.exam.ExamQuestionDTO;
import com.example.project.dto.exam.ExamStatisticsDTO;
import com.example.project.entity.exam.Exam;
import com.example.project.service.ai.AiQuestionGeneratorService;
import com.example.project.service.exam.ExamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/exam")
public class ExamController {

    @Autowired
    private ExamService examService;
    @Autowired
    private AiQuestionGeneratorService aiQuestionService;

    /**
     * 手动创建考试
     */
    @PostMapping
    public Result<Long> createExam(@RequestBody ExamCreateDTO examDTO) {
        try {
            Long examId = examService.createExam(examDTO);
            return Result.success("考试创建成功", examId);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 获取课程考试列表
     */
    @GetMapping("/course/{courseId}")
    public Result<List<Exam>> getExamsByCourseId(@PathVariable String courseId) {
        try {
            List<Exam> exams = examService.getExamsByCourseId(courseId);
            return Result.success(exams);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 获取教师所有考试列表
     */
    @GetMapping("/teacher/{teacherId}")
    public Result<List<Exam>> getExamsByTeacherId(@PathVariable String teacherId) {
        try {
            List<Exam> exams = examService.getExamsByTeacherId(teacherId);
            return Result.success(exams);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 搜索考试
     */
    @GetMapping("/search")
    public Result<List<Exam>> searchExams(
            @RequestParam(required = false) String teacherId,
            @RequestParam(required = false) String courseId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {
        try {
            List<Exam> exams = examService.searchExams(teacherId, courseId, status, keyword);
            return Result.success(exams);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 获取考试详情（包含试题）
     */
    @GetMapping("/{examId}")
    public Result<Map<String, Object>> getExamById(@PathVariable Long examId) {
        try {
            Map<String, Object> examWithQuestions = examService.getExamWithQuestions(examId);
            if (examWithQuestions.get("exam") == null) {
                return Result.error("考试不存在");
            }
            return Result.success(examWithQuestions);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 更新考试
     */
    @PutMapping("/{examId}")
    public Result<String> updateExam(@PathVariable Long examId, @RequestBody Exam exam) {
        try {
            examService.updateExam(examId, exam);
            return Result.success("考试更新成功");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 发布考试
     */
    @PutMapping("/{examId}/publish")
    public Result<String> publishExam(@PathVariable Long examId) {
        try {
            examService.publishExam(examId);
            return Result.success("考试发布成功");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 取消发布考试
     */
    @PutMapping("/{examId}/unpublish")
    public Result<String> unpublishExam(@PathVariable Long examId) {
        try {
            examService.unpublishExam(examId);
            return Result.success("考试已取消发布");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 退回学生考试
     */
    @DeleteMapping("/student-exam/{studentExamId}/return")
    public Result<String> returnStudentExam(@PathVariable Long studentExamId) {
        try {
            examService.returnStudentExam(studentExamId);
            return Result.success("考试已退回");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 删除考试
     */
    @DeleteMapping("/{examId}")
    public Result<String> deleteExam(@PathVariable Long examId) {
        try {
            examService.deleteExam(examId);
            return Result.success("考试删除成功");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 获取考试统计
     */
    @GetMapping("/{examId}/statistics")
    public Result<ExamStatisticsDTO> getExamStatistics(@PathVariable Long examId) {
        try {
            ExamStatisticsDTO statistics = examService.getExamStatistics(examId);
            return Result.success(statistics);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 获取考试的所有学生答题记录
     */
    @GetMapping("/{examId}/students")
    public Result<List<Map<String, Object>>> getStudentExams(@PathVariable Long examId) {
        try {
            List<Map<String, Object>> studentExams = examService.getStudentExamStatus(examId);
            return Result.success(studentExams);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 保存考试试题
     */
    @PostMapping("/{examId}/questions")
    public Result<String> saveExamQuestions(@PathVariable Long examId, @RequestBody List<ExamQuestionDTO> questions) {
        try {
            examService.saveExamQuestions(examId, questions);
            return Result.success("试题保存成功");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * AI生成题目（仅生成，不保存）
     * 返回题目列表供前端预览和编辑
     */
    @PostMapping("/ai/generate")
    public Result<List<ExamQuestionDTO>> generateQuestionsWithAi(@RequestBody AiExamCreateRequest request) {
        System.out.println("\n=== AI生成题目请求（仅生成）===");
        System.out.println("课程名称: " + request.getCourseName());
        System.out.println("题目数量: " + request.getQuestionCount());
        System.out.println("题型: " + request.getQuestionTypes());

        try {
            // 参数校验
            if (request.getCourseName() == null || request.getCourseName().trim().isEmpty()) {
                return Result.error("课程名称不能为空");
            }

            if (request.getQuestionCount() == null || request.getQuestionCount() <= 0) {
                return Result.error("题目数量必须大于0");
            }

            if (request.getQuestionTypes() == null || request.getQuestionTypes().trim().isEmpty()) {
                return Result.error("请选择题型");
            }

            // 调用 AI 生成题目
            List<ExamQuestionDTO> aiQuestions = aiQuestionService.generateQuestions(
                    request.getCourseName(),
                    request.getQuestionCount(),
                    request.getQuestionTypes());

            if (aiQuestions.isEmpty()) {
                return Result.error("AI 未生成有效题目，请重试");
            }

            System.out.println("AI成功生成 " + aiQuestions.size() + " 道题目");
            System.out.println("=== AI生成题目完成 ===\n");

            return Result.success("AI 题目生成成功", aiQuestions);
        } catch (Exception e) {
            System.err.println("AI生成题目失败: " + e.getMessage());
            e.printStackTrace();
            return Result.error("AI 生成题目失败: " + e.getMessage());
        }
    }

    /**
     * AI智能创建考试
     * 根据课程名称自动生成题目并创建考试
     */
    @PostMapping("/ai")
    public Result<Long> createExamWithAi(@RequestBody AiExamCreateRequest request) {
        System.out.println("\n=== AI创建考试请求 ===");
        System.out.println("课程ID: " + request.getCourseId());
        System.out.println("教师ID: " + request.getTeacherId());
        System.out.println("考试标题: " + request.getExamTitle());
        System.out.println("课程名称: " + request.getCourseName());
        System.out.println("题目数量: " + request.getQuestionCount());
        System.out.println("题型: " + request.getQuestionTypes());

        try {
            // 参数校验
            if (request.getCourseId() == null || request.getTeacherId() == null ||
                    request.getExamTitle() == null || request.getCourseName() == null) {
                System.err.println("参数校验失败：缺少必要参数");
                return Result.error("缺少必要参数");
            }

            if (request.getStartTime() == null || request.getEndTime() == null) {
                System.err.println("参数校验失败：缺少考试时间");
                return Result.error("请设置考试开始和结束时间");
            }

            System.out.println("开始调用AI生成题目...");

            // 调用 AI 生成题目
            List<ExamQuestionDTO> aiQuestions = aiQuestionService.generateQuestions(
                    request.getCourseName(),
                    request.getQuestionCount(),
                    request.getQuestionTypes());

            System.out.println("AI生成题目数量: " + aiQuestions.size());

            if (aiQuestions.isEmpty()) {
                System.err.println("AI未生成有效题目");
                return Result.error("AI 未生成有效题目，请重试");
            }

            // 组装成标准 ExamCreateDTO
            ExamCreateDTO examDTO = new ExamCreateDTO();
            examDTO.setCourseId(request.getCourseId());
            examDTO.setTeacherId(request.getTeacherId());
            examDTO.setExamTitle(request.getExamTitle());
            examDTO.setExamDescription("AI 自动生成试卷 - " + request.getCourseName());
            examDTO.setStartTime(request.getStartTime());
            examDTO.setEndTime(request.getEndTime());
            examDTO.setDuration((int) ((request.getEndTime().getTime() - request.getStartTime().getTime()) / 60000)); // 分钟
            examDTO.setTotalScore(aiQuestions.stream().mapToInt(ExamQuestionDTO::getScore).sum());
            examDTO.setPassScore(examDTO.getTotalScore() / 2); // 默认及格线 50%
            examDTO.setQuestions(aiQuestions);

            System.out.println("考试总分: " + examDTO.getTotalScore());
            System.out.println("及格分: " + examDTO.getPassScore());
            System.out.println("考试时长: " + examDTO.getDuration() + " 分钟");

            System.out.println("开始创建考试...");

            // 调用原有创建逻辑
            Long examId = examService.createExam(examDTO);

            System.out.println("考试创建成功！考试ID: " + examId);
            System.out.println("=== AI创建考试完成 ===\n");

            return Result.success("AI 考试创建成功", examId);
        } catch (Exception e) {
            System.err.println("AI创建考试失败: " + e.getMessage());
            e.printStackTrace();
            return Result.error("AI 创建考试失败: " + e.getMessage());
        }
    }

}
