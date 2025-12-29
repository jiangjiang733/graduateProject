package com.example.project.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.example.project.entity.question.QuestionBank;
import com.example.project.common.Result;

import java.util.List;

public interface QuestionBankService extends IService<QuestionBank> {

    /**
     * 创建题目
     */
    Result<?> createQuestion(QuestionBank question);

    /**
     * 更新题目
     */
    Result<?> updateQuestion(QuestionBank question);

    /**
     * 获取题目详情
     */
    QuestionBank getQuestionDetail(Long id);

    /**
     * 批量导入
     */
    Result<?> importQuestions(List<QuestionBank> questionList);
}
