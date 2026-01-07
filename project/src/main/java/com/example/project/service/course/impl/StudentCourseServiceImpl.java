package com.example.project.service.course.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.project.entity.course.Course;
import com.example.project.entity.course.StudentCourse;
import com.example.project.entity.Student;
import com.example.project.mapper.course.CourseMapper;
import com.example.project.mapper.course.StudentCourseMapper;
import com.example.project.mapper.StudentUserMapper;
import com.example.project.service.course.StudentCourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.Map;

@Service
public class StudentCourseServiceImpl implements StudentCourseService {

    @Autowired
    private StudentCourseMapper studentCourseMapper;

    @Autowired
    private CourseMapper courseMapper;

    @Autowired
    private StudentUserMapper studentUserMapper;

    @Override
    public Map<String, Object> getTeacherStudentStats(String teacherId) {
        return studentCourseMapper.getTeacherStudentStats(teacherId);
    }

    @Override
    public Map<String, Object> getCourseStudentStats(String courseId) {
        return studentCourseMapper.getCourseStudentStats(courseId);
    }

    @Override
    public List<StudentCourse> getCourseStudents(String courseId, int pageNumber, int pageSize) {
        int offset = (pageNumber - 1) * pageSize;
        return studentCourseMapper.getCourseStudents(courseId, pageSize, offset);
    }

    @Override
    public List<StudentCourse> getTeacherStudents(String teacherId, String courseId, String keyword, int pageNumber,
            int pageSize) {
        int offset = (pageNumber - 1) * pageSize;
        return studentCourseMapper.getTeacherStudents(teacherId, courseId, keyword, pageSize, offset);
    }

    @Override
    public List<Map<String, Object>> getCourseActivityData(String courseId, int days) {
        return studentCourseMapper.getCourseActivityData(courseId, days);
    }

    @Override
    @Transactional
    public boolean joinCourse(String studentId, String courseId) {
        try {
            Integer studentIdInt = Integer.valueOf(studentId);

            // 检查是否已经加入
            QueryWrapper<StudentCourse> wrapper = new QueryWrapper<>();
            wrapper.eq("student_id", studentIdInt).eq("course_id", courseId);
            StudentCourse existing = studentCourseMapper.selectOne(wrapper);

            if (existing != null) {
                return false; // 已经加入
            }

            // 获取课程和学生信息
            Course course = courseMapper.selectById(courseId);
            Student student = studentUserMapper.selectById(studentIdInt);

            if (course == null || student == null) {
                return false;
            }

            // 创建关联记录
            StudentCourse studentCourse = new StudentCourse();
            studentCourse.setStudentId(studentIdInt);
            studentCourse.setCourseId(courseId);
            studentCourse.setStudentName(student.getStudentsUsername());
            studentCourse.setCourseName(course.getCourseName());
            studentCourse.setTeacherId(course.getTeacherId());
            studentCourse.setStatus(1); // 学习中
            studentCourse.setProgress(0);
            studentCourse.setTotalStudyTime(0);
            studentCourse.setJoinTime(new Date());
            studentCourse.setLastActiveTime(new Date());
            studentCourse.setCreateTime(new Date());
            studentCourse.setUpdateTime(new Date());

            studentCourseMapper.insert(studentCourse);
            return true;

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    @Override
    @Transactional
    public boolean updateStudentProgress(String studentId, String courseId, int progress, int studyTime) {
        try {
            Integer studentIdInt = Integer.valueOf(studentId);

            QueryWrapper<StudentCourse> wrapper = new QueryWrapper<>();
            wrapper.eq("student_id", studentIdInt).eq("course_id", courseId);
            StudentCourse studentCourse = studentCourseMapper.selectOne(wrapper);

            if (studentCourse == null) {
                return false;
            }

            studentCourse.setProgress(progress);
            studentCourse.setTotalStudyTime(studentCourse.getTotalStudyTime() + studyTime);
            studentCourse.setLastActiveTime(new Date());
            studentCourse.setUpdateTime(new Date());

            // 如果进度达到100%，标记为已完成
            if (progress >= 100) {
                studentCourse.setStatus(2);
            }

            studentCourseMapper.updateById(studentCourse);
            return true;

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    @Override
    public List<Map<String, Object>> getStudentJoinedCourses(String studentId) {
        return studentCourseMapper.getStudentJoinedCourses(studentId);
    }
}