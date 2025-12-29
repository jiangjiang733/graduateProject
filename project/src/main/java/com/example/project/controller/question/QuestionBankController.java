package com.example.project.controller.question;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.project.common.Result;
import com.example.project.entity.question.QuestionBank;
import com.example.project.service.QuestionBankService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/question")
public class QuestionBankController {

    @Autowired
    private QuestionBankService questionBankService;

    /**
     * 分页查询题库列表
     */
    @GetMapping("/list")
    public Result<?> getQuestionList(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String courseId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Integer difficulty,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer teacherId) {
        Page<QuestionBank> page = new Page<>(pageNum, pageSize);
        QueryWrapper<QuestionBank> queryWrapper = new QueryWrapper<>();

        // 筛选条件
        if (StringUtils.hasText(courseId)) {
            queryWrapper.eq("course_id", courseId);
        }
        if (StringUtils.hasText(type)) {
            queryWrapper.eq("type", type);
        }
        if (difficulty != null) {
            queryWrapper.eq("difficulty", difficulty);
        }
        if (teacherId != null) {
            queryWrapper.eq("teacher_id", teacherId);
        }
        if (StringUtils.hasText(keyword)) {
            queryWrapper.like("content", keyword);
        }

        queryWrapper.orderByDesc("create_time");

        Page<QuestionBank> resultPage = questionBankService.page(page, queryWrapper);
        return Result.success(resultPage);
    }

    /**
     * 获取题目详情
     */
    @GetMapping("/{id}")
    public Result getQuestionDetail(@PathVariable Long id) {
        QuestionBank question = questionBankService.getQuestionDetail(id);
        if (question == null) {
            return Result.error(-1, "题目不存在");
        }
        return Result.success(question);
    }

    /**
     * 创建题目
     */
    @PostMapping("/create")
    public Result<?> createQuestion(@RequestBody QuestionBank question) {
        return questionBankService.createQuestion(question);
    }

    /**
     * 更新题目
     */
    @PutMapping("/update")
    public Result<?> updateQuestion(@RequestBody QuestionBank question) {
        return questionBankService.updateQuestion(question);
    }

    /**
     * 删除题目
     */
    @DeleteMapping("/{id}")
    public Result<?> deleteQuestion(@PathVariable Long id) {
        boolean success = questionBankService.removeById(id);
        if (success) {
            return Result.success();
        } else {
            return Result.error(-1, "删除失败");
        }
    }

    /**
     * 按课程ID获取所有题目（用于组卷筛选）
     */
    @GetMapping("/by-course/{courseId}")
    public Result<?> getQuestionsByCourse(@PathVariable String courseId, @RequestParam(required = false) String type) {
        QueryWrapper<QuestionBank> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("course_id", courseId);
        if (StringUtils.hasText(type)) {
            queryWrapper.eq("type", type);
        }
        List<QuestionBank> list = questionBankService.list(queryWrapper);
        return Result.success(list);
    }
}
