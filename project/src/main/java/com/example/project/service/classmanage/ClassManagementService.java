package com.example.project.service.classmanage;

import com.example.project.dto.classmanage.ClassCreateDTO;
import com.example.project.dto.classmanage.StudentProgressDTO;
import com.example.project.entity.Student;
import com.example.project.entity.classmanage.ClassInfo;

import java.util.List;
import java.util.Map;

public interface ClassManagementService {
    
    /**
     * 创建班级（生成班级码）
     * @param classCreateDTO 班级创建信息
     * @return 班级信息（包含班级码）
     */
    Map<String, Object> createClass(ClassCreateDTO classCreateDTO);
    
    /**
     * 获取课程班级列表
     * @param courseId 课程ID
     * @return 班级列表
     */
    List<Map<String, Object>> getClassesByCourseId(String courseId);
    
    /**
     * 获取班级学生列表
     * @param classId 班级ID
     * @return 学生列表
     */
    List<Map<String, Object>> getClassStudents(Long classId);
    
    /**
     * 移除学生
     * @param classId 班级ID
     * @param studentId 学生ID
     */
    void removeStudent(Long classId, String studentId);
    
    /**
     * 获取学生学习进度
     * @param studentId 学生ID
     * @param courseId 课程ID
     * @return 学生学习进度
     */
    StudentProgressDTO getStudentProgress(String studentId, String courseId);
    
    /**
     * 删除班级
     * @param classId 班级ID
     */
    void deleteClass(Long classId);
    
    /**
     * 更新班级信息
     * @param classId 班级ID
     * @param classCreateDTO 班级信息
     */
    void updateClass(Long classId, ClassCreateDTO classCreateDTO);
    
    /**
     * 获取班级详情
     * @param classId 班级ID
     * @return 班级详情
     */
    Map<String, Object> getClassDetail(Long classId);
    
    /**
     * 添加学生到班级
     * @param classId 班级ID
     * @param studentId 学生ID
     */
    void addStudent(Long classId, String studentId);
    
    /**
     * 批量添加学生
     * @param classId 班级ID
     * @param studentIds 学生ID列表
     * @return 添加结果
     */
    Map<String, Object> batchAddStudents(Long classId, List<String> studentIds);
}
