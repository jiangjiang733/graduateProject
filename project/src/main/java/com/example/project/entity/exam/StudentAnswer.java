package com.example.project.entity.exam;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;

@Data
@TableName("student_answer")
public class StudentAnswer implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    @TableId(type = IdType.AUTO)
    private Long answerId;
    
    private Long studentExamId;
    
    private Long questionId;
    
    private String studentAnswer;
    
    private Integer isCorrect;
    
    private BigDecimal score;
    
    private String teacherComment;
}
