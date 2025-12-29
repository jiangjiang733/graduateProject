package com.example.project.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.project.common.Result;
import com.example.project.entity.question.QuestionBank;
import com.example.project.mapper.QuestionBankMapper;
import com.example.project.service.QuestionBankService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;

@Service
public class QuestionBankServiceImpl extends ServiceImpl<QuestionBankMapper, QuestionBank>
        implements QuestionBankService {

    @Autowired
    private QuestionBankMapper questionBankMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<?> createQuestion(QuestionBank question) {
        if (question.getCourseId() == null) {
            return Result.error(-1, "必须选择所属课程");
        }
        question.setCreateTime(new Date());
        question.setUpdateTime(new Date());
        question.setUsageCount(0);

        save(question);
        return Result.success(question);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<?> updateQuestion(QuestionBank question) {
        question.setUpdateTime(new Date());
        updateById(question);
        return Result.success(question);
    }

    @Override
    public QuestionBank getQuestionDetail(Long id) {
        return questionBankMapper.selectQuestionWithDetails(id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<?> importQuestions(List<QuestionBank> questionList) {
        if (questionList == null || questionList.isEmpty()) {
            return Result.error(-1, "导入数据为空");
        }
        // 批量保存
        saveBatch(questionList);
        return Result.success("成功导入 " + questionList.size() + " 道题目");
    }
}
