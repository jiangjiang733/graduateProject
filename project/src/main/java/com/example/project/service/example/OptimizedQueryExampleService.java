package com.example.project.service.example;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.project.entity.course.Course;
import com.example.project.entity.exam.Exam;
import com.example.project.entity.notification.Message;
import com.example.project.mapper.course.CourseMapper;
import com.example.project.mapper.exam.ExamMapper;
import com.example.project.mapper.notification.MessageMapper;
import com.example.project.util.QueryOptimizationUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

/**
 * 查询优化示例服务
 * 展示如何使用 QueryOptimizationUtil 进行查询优化
 * 
 * 注意：这是一个示例类，展示最佳实践，不是实际业务代码
 */
@Service
public class OptimizedQueryExampleService {
    
    @Autowired
    private CourseMapper courseMapper;
    
    @Autowired
    private ExamMapper examMapper;
    
    @Autowired
    private MessageMapper messageMapper;
    
    /**
     * 示例1：基本分页查询
     * 使用工具类创建分页对象，自动处理边界值
     */
    public IPage<Course> getCourseListExample(Integer pageNumber, Integer pageSize, String teacherId) {
        // 使用工具类创建分页对象（自动处理null和边界值）
        Page<Course> page = QueryOptimizationUtil.createPage(pageNumber, pageSize);
        
        QueryWrapper<Course> wrapper = new QueryWrapper<>();
        wrapper.eq(teacherId != null, "teacher_id", teacherId)
               .orderByDesc("create_time");
        
        return courseMapper.selectPage(page, wrapper);
    }
    
    /**
     * 示例2：只查询需要的字段
     * 避免 SELECT *，提高查询效率
     */
    public IPage<Course> getCourseListWithSelectedColumns(Integer pageNumber, Integer pageSize) {
        Page<Course> page = QueryOptimizationUtil.createPage(pageNumber, pageSize);
        
        QueryWrapper<Course> wrapper = new QueryWrapper<>();
        // 只查询需要的字段
        QueryOptimizationUtil.selectColumns(wrapper, 
            "id", "name", "teacher_id", "teacher_name", "image", "state", "create_time"
        );
        wrapper.orderByDesc("create_time");
        
        return courseMapper.selectPage(page, wrapper);
    }
    
    /**
     * 示例3：优化的模糊查询
     * 使用右模糊查询可以利用索引
     */
    public IPage<Course> searchCourseOptimized(Integer pageNumber, Integer pageSize, String keyword) {
        Page<Course> page = QueryOptimizationUtil.createPage(pageNumber, pageSize);
        
        QueryWrapper<Course> wrapper = new QueryWrapper<>();
        // 使用右模糊查询（可以使用索引）
        QueryOptimizationUtil.likeOptimized(wrapper, "name", keyword, true);
        wrapper.orderByDesc("create_time");
        
        return courseMapper.selectPage(page, wrapper);
    }
    
    /**
     * 示例4：时间范围查询优化
     * 使用范围查询而不是函数，可以使用索引
     */
    public IPage<Exam> getExamsByTimeRange(Integer pageNumber, Integer pageSize, 
                                           Date startTime, Date endTime) {
        Page<Exam> page = QueryOptimizationUtil.createPage(pageNumber, pageSize);
        
        QueryWrapper<Exam> wrapper = new QueryWrapper<>();
        // 使用工具类处理时间范围查询（自动处理null值）
        QueryOptimizationUtil.betweenTime(wrapper, "create_time", startTime, endTime);
        wrapper.orderByDesc("create_time");
        
        return examMapper.selectPage(page, wrapper);
    }
    
    /**
     * 示例5：批量IN查询优化
     * 自动处理空集合和大集合警告
     */
    public List<Course> getCoursesByIds(List<String> courseIds) {
        QueryWrapper<Course> wrapper = new QueryWrapper<>();
        // 使用工具类处理IN查询（自动处理空集合和大集合）
        QueryOptimizationUtil.inOptimized(wrapper, "id", courseIds);
        
        return courseMapper.selectList(wrapper);
    }
    
    /**
     * 示例6：复合查询条件优化
     * 结合多个优化方法
     */
    public IPage<Message> getMessagesOptimized(Integer pageNumber, Integer pageSize,
                                               String receiverId, Boolean isRead,
                                               Date startTime, Date endTime) {
        Page<Message> page = QueryOptimizationUtil.createPage(pageNumber, pageSize);
        
        QueryWrapper<Message> wrapper = new QueryWrapper<>();
        
        // 精确匹配
        wrapper.eq(receiverId != null, "receiver_id", receiverId)
               .eq(isRead != null, "is_read", isRead);
        
        // 时间范围查询
        QueryOptimizationUtil.betweenTime(wrapper, "create_time", startTime, endTime);
        
        // 排序优化（确保排序字段有索引）
        QueryOptimizationUtil.orderByOptimized(wrapper, "create_time", false);
        
        return messageMapper.selectPage(page, wrapper);
    }
    
    /**
     * 示例7：避免N+1查询问题
     * 使用批量查询代替循环查询
     */
    public List<Course> getCoursesWithExamsOptimized(String teacherId) {
        // 第一步：查询课程列表
        QueryWrapper<Course> courseWrapper = new QueryWrapper<>();
        courseWrapper.eq("teacher_id", teacherId);
        List<Course> courses = courseMapper.selectList(courseWrapper);
        
        if (courses.isEmpty()) {
            return courses;
        }
        
        // 第二步：批量查询所有课程的考试（避免N+1查询）
        List<String> courseIds = courses.stream()
            .map(Course::getId)
            .collect(java.util.stream.Collectors.toList());
        
        QueryWrapper<Exam> examWrapper = new QueryWrapper<>();
        QueryOptimizationUtil.inOptimized(examWrapper, "course_id", courseIds);
        List<Exam> exams = examMapper.selectList(examWrapper);
        
        // 第三步：在内存中组装数据
        java.util.Map<String, List<Exam>> examMap = exams.stream()
            .collect(java.util.stream.Collectors.groupingBy(Exam::getCourseId));
        
        // 注意：这里假设Course实体有setExams方法，实际使用时需要根据实体结构调整
        // courses.forEach(course -> 
        //     course.setExams(examMap.getOrDefault(course.getId(), new ArrayList<>()))
        // );
        
        return courses;
    }
    
    /**
     * 示例8：使用默认分页
     * 当不需要自定义分页参数时
     */
    public IPage<Course> getRecentCourses() {
        // 使用默认分页（第1页，每页20条）
        Page<Course> page = QueryOptimizationUtil.createDefaultPage();
        
        QueryWrapper<Course> wrapper = new QueryWrapper<>();
        wrapper.eq("state", 1) // 只查询公开课程
               .orderByDesc("create_time");
        
        return courseMapper.selectPage(page, wrapper);
    }
    
    /**
     * 示例9：检查分页结果
     * 使用工具类方法检查结果
     */
    public void processCourseList(Integer pageNumber, Integer pageSize) {
        Page<Course> page = QueryOptimizationUtil.createPage(pageNumber, pageSize);
        QueryWrapper<Course> wrapper = new QueryWrapper<>();
        IPage<Course> result = courseMapper.selectPage(page, wrapper);
        
        // 检查结果是否为空
        if (QueryOptimizationUtil.isEmpty(result)) {
            System.out.println("没有找到课程");
            return;
        }
        
        // 处理结果
        result.getRecords().forEach(course -> {
            System.out.println("课程: " + course.getCourseName());
        });
    }
    
    /**
     * 示例10：复杂查询优化
     * 结合多个条件和优化技巧
     */
    public IPage<Exam> searchExamsAdvanced(Integer pageNumber, Integer pageSize,
                                           String courseId, Integer status,
                                           String keyword, Date startTime, Date endTime) {
        Page<Exam> page = QueryOptimizationUtil.createPage(pageNumber, pageSize);
        
        QueryWrapper<Exam> wrapper = new QueryWrapper<>();
        
        // 只查询需要的字段（避免SELECT *）
        QueryOptimizationUtil.selectColumns(wrapper,
            "exam_id", "course_id", "exam_title", "start_time", "end_time", 
            "total_score", "status", "create_time"
        );
        
        // 精确匹配条件
        wrapper.eq(courseId != null, "course_id", courseId)
               .eq(status != null, "status", status);
        
        // 模糊查询（使用右模糊，可以利用索引）
        QueryOptimizationUtil.likeOptimized(wrapper, "exam_title", keyword, true);
        
        // 时间范围查询
        QueryOptimizationUtil.betweenTime(wrapper, "start_time", startTime, endTime);
        
        // 排序（确保排序字段有索引）
        QueryOptimizationUtil.orderByOptimized(wrapper, "create_time", false);
        
        return examMapper.selectPage(page, wrapper);
    }
}
