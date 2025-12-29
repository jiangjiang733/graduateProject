package com.example.project.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.project.entity.question.QuestionBank;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface QuestionBankMapper extends BaseMapper<QuestionBank> {

    /**
     * 查询题目详情（包含教师名和课程名）
     */
    @Select("SELECT q.*, t.teacher_username as teacherName, c.name as courseName " +
            "FROM question_bank q " +
            "LEFT JOIN teacher_user t ON q.teacher_id = t.teacher_id " +
            "LEFT JOIN course c ON q.course_id = c.id " +
            "WHERE q.id = #{id}")
    QuestionBank selectQuestionWithDetails(@Param("id") Long id);
}
