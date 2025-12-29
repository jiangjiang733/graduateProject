package com.example.project.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.project.dto.DashboardStatisticsDTO;
import com.example.project.dto.TodoItemDTO;
import com.example.project.entity.course.Course;
import com.example.project.entity.enrollment.CourseEnrollment;
import com.example.project.mapper.course.CourseMapper;
import com.example.project.mapper.course.CourseScheduleMapper;
import com.example.project.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 服务实现
 */
@Service
public class DashboardServiceImpl implements DashboardService {

    @Autowired
    private CourseMapper courseMapper;

    @Autowired
    private com.example.project.mapper.course.StudentCourseMapper studentCourseMapper;

    @Autowired
    private com.example.project.mapper.exam.ExamMapper examMapper;

    @Autowired(required = false)
    private CourseScheduleMapper courseScheduleMapper;

    @Autowired
    private com.example.project.mapper.course.CourseChapterMapper courseChapterMapper;

    @Autowired
    private com.example.project.mapper.homework.LabReportMapper labReportMapper;

    @Override
    public DashboardStatisticsDTO getStatistics(String teacherId) {
        DashboardStatisticsDTO statistics = new DashboardStatisticsDTO();

        try {
            // 获取课程总数
            QueryWrapper<Course> courseWrapper = new QueryWrapper<>();
            courseWrapper.eq("teacher_id", teacherId);
            courseWrapper.eq("state", 1);
            Long courseCount = courseMapper.selectCount(courseWrapper);
            statistics.setCourseCount(courseCount.intValue());

            // 获取课程ID列表
            List<Course> courses = courseMapper.selectList(courseWrapper);
            List<String> courseIds = courses.stream().map(Course::getId).collect(Collectors.toList());

            if (!courseIds.isEmpty()) {
                // 1. 学生总数
                QueryWrapper<com.example.project.entity.course.StudentCourse> scWrapper = new QueryWrapper<>();
                scWrapper.in("course_id", courseIds);
                scWrapper.eq("status", 1);
                Long studentCount = studentCourseMapper.selectCount(scWrapper);
                statistics.setStudentCount(studentCount.intValue());

                // 2. 待批改作业数
                QueryWrapper<com.example.project.entity.homework.LabReport> reportWrapper = new QueryWrapper<>();
                reportWrapper.in("course_id", courseIds);
                Long reportCount = labReportMapper.selectCount(reportWrapper);
                statistics.setPendingHomeworkCount(reportCount.intValue());

                // 3. 进行中的考试数
                QueryWrapper<com.example.project.entity.exam.Exam> examWrapper = new QueryWrapper<>();
                examWrapper.in("course_id", courseIds);
                examWrapper.eq("status", 1);
                examWrapper.le("start_time", new Date());
                examWrapper.ge("end_time", new Date());
                Long ongoingExams = examMapper.selectCount(examWrapper);
                statistics.setOngoingExamCount(ongoingExams.intValue());

            } else {
                statistics.setStudentCount(0);
                statistics.setPendingHomeworkCount(0);
                statistics.setOngoingExamCount(0);
            }

            statistics.setUnreadMessageCount(0);
            statistics.setTodayNewStudentCount(0);

        } catch (Exception e) {
            e.printStackTrace();
        }

        return statistics;
    }

    @Override
    public List<Course> getRecentCourses(String teacherId, Integer limit) {
        try {
            QueryWrapper<Course> wrapper = new QueryWrapper<>();
            wrapper.eq("teacher_id", teacherId);
            wrapper.eq("state", 1);
            wrapper.orderByDesc("update_time");
            wrapper.last("LIMIT " + limit);

            List<Course> courses = courseMapper.selectList(wrapper);

            // 为每个课程获取学生人数和章节数
            for (Course course : courses) {
                // 1. 获取学生人数
                QueryWrapper<com.example.project.entity.course.StudentCourse> scWrapper = new QueryWrapper<>();
                scWrapper.eq("course_id", course.getId());
                scWrapper.eq("status", 1); // 已通过审核
                Long scount = studentCourseMapper.selectCount(scWrapper);
                course.setStudentCount(scount.intValue());

                // 2. 获取章节数
                QueryWrapper<com.example.project.entity.course.CourseChapter> chapterWrapper = new QueryWrapper<>();
                chapterWrapper.eq("course_id", course.getId());
                Long ccount = courseChapterMapper.selectCount(chapterWrapper);
                course.setChapterCount(ccount.intValue());
            }

            return courses;
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    @Autowired
    private com.example.project.mapper.enrollment.CourseEnrollmentMapper courseEnrollmentMapper;

    @Override
    public List<TodoItemDTO> getTodoList(String teacherId) {
        List<TodoItemDTO> todoList = new ArrayList<>();

        try {
            // 获取教师课程ID
            QueryWrapper<Course> courseWrapper = new QueryWrapper<>();
            courseWrapper.eq("teacher_id", teacherId);
            courseWrapper.eq("state", 1);
            List<Course> courses = courseMapper.selectList(courseWrapper);
            List<String> courseIds = courses.stream().map(Course::getId).collect(Collectors.toList());

            if (courseIds.isEmpty())
                return todoList;

            // 1. 待批改作业 (暂无)

            // 2. 待审核报名 (查CourseEnrollment表)
            QueryWrapper<CourseEnrollment> enrollWrapper = new QueryWrapper<>();
            enrollWrapper.in("course_id", courseIds);
            enrollWrapper.eq("status", "pending");
            Long pendingAudit = courseEnrollmentMapper.selectCount(enrollWrapper);

            if (pendingAudit > 0) {
                TodoItemDTO item = new TodoItemDTO();
                item.setRelatedId(2L);
                item.setTitle("待审核选课");
                item.setDescription("您有 " + pendingAudit + " 位学生申请加入课程");
                item.setType("course_approval");
                item.setCount(pendingAudit.intValue());
                todoList.add(item);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return todoList;
    }

    @Override
    public List<Map<String, Object>> getRecentMessages(String teacherId, Integer limit) {
        List<Map<String, Object>> messages = new ArrayList<>();

        try {
            // 获取教师课程ID
            QueryWrapper<Course> courseWrapper = new QueryWrapper<>();
            courseWrapper.eq("teacher_id", teacherId);
            courseWrapper.eq("state", 1);
            List<Course> courses = courseMapper.selectList(courseWrapper);
            // 以此建立课程ID映射方便获取课程名
            Map<String, String> courseNameMap = courses.stream()
                    .collect(Collectors.toMap(Course::getId, Course::getCourseName));
            List<String> courseIds = new ArrayList<>(courseNameMap.keySet());

            if (courseIds.isEmpty())
                return messages;

            // 1. 获取最近提交的作业 (暂无)

        } catch (Exception e) {
            e.printStackTrace();
        }

        return messages;
    }

    @Override
    public List<Map<String, Object>> getWeekSchedule(String teacherId) {
        List<Map<String, Object>> schedule = new ArrayList<>();

        try {
            if (courseScheduleMapper == null) {
                return schedule;
            }

            // 获取教师的所有课程
            QueryWrapper<Course> courseWrapper = new QueryWrapper<>();
            courseWrapper.eq("teacher_id", teacherId);
            courseWrapper.eq("state", 1);
            List<Course> courses = courseMapper.selectList(courseWrapper);

            if (courses.isEmpty()) {
                return schedule;
            }

            // 获取相关周数和课程安排 logic pending implementation
            // int currentWeek = getCurrentWeek();
            // List<String> courseIds = courses.stream()...

            // 从course_schedule表查询（后续实现）
            // 暂时返回空列表

        } catch (Exception e) {
            e.printStackTrace();
        }

        return schedule;
    }

    // Week schedule logic placeholder
}
