package com.example.project.entity.exam;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;

@Data
@TableName("exam_question")
public class ExamQuestion implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    @TableId(type = IdType.AUTO)
    private Long questionId;
    
    private Long examId;
    
    private String questionType;
    
    private String questionContent;
    
    private String questionOptions;
    
    private String correctAnswer;
    
    private Integer score;
    
    private Integer questionOrder;
    
    private String analysis;
}
