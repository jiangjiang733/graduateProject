package com.example.project.service.course.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.project.entity.course.*;
import com.example.project.entity.exam.Exam;
import com.example.project.entity.exam.ExamQuestion;
import com.example.project.entity.exam.StudentExam;
import com.example.project.entity.exam.StudentAnswer;
import com.example.project.entity.classmanage.ClassInfo;
import com.example.project.entity.classmanage.ClassStudent;
import com.example.project.mapper.course.*;
import com.example.project.mapper.exam.ExamMapper;
import com.example.project.mapper.exam.ExamQuestionMapper;
import com.example.project.mapper.exam.StudentExamMapper;
import com.example.project.mapper.exam.StudentAnswerMapper;
import com.example.project.mapper.classmanage.ClassInfoMapper;
import com.example.project.mapper.classmanage.ClassStudentMapper;
import com.example.project.service.course.CoursePermissionService;
import com.example.project.service.course.CourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Date;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Service
public class CourseServiceImpl implements CourseService {
    
    @Autowired
    private CourseMapper courseMapper;
    
    @Autowired
    private CoursePermissionService permissionService;
    
    @Autowired
    private CourseChapterMapper chapterMapper;
    
    @Autowired
    private CourseCommentMapper commentMapper;
    
    @Autowired
    private CourseProgressMapper progressMapper;
    
    @Autowired
    private CourseScheduleMapper scheduleMapper;
    
    @Autowired
    private StudentCourseMapper studentCourseMapper;
    
    @Autowired
    private ExamMapper examMapper;
    
    @Autowired
    private ExamQuestionMapper examQuestionMapper;
    
    @Autowired
    private StudentExamMapper studentExamMapper;
    
    @Autowired
    private StudentAnswerMapper studentAnswerMapper;
    
    @Autowired(required = false)
    private ClassInfoMapper classInfoMapper;
    
    @Autowired(required = false)
    private ClassStudentMapper classStudentMapper;
    
    @Value("${file.upload-dir:./upload}")
    private String uploadDir;
    
    @Override
    @Transactional
    public Course createCourse(String courseName, String teacherId, String teacherName,
                              String courseDescription, String major, String classification,
                              Date startTime, Date endTime, String creatorUsername,
                              MultipartFile image) {
        // 验证时间范围
        if (startTime != null && endTime != null && endTime.before(startTime)) {
            throw new RuntimeException("课程结束时间不能早于开始时间");
        }
        
        Course course = new Course();
        course.setId(UUID.randomUUID().toString().replace("-", ""));
        course.setCourseName(courseName);
        course.setTeacherId(teacherId);
        course.setTeacherName(teacherName);
        course.setCourseDescription(courseDescription);
        course.setMajor(major);
        course.setClassification(classification);
        course.setStartTime(startTime);
        course.setEndTime(endTime);
        course.setCreatorUsername(creatorUsername != null ? creatorUsername : teacherName);
        course.setState(1);
        course.setNum(0);
        course.setCreateBy(teacherId);
        course.setCreateTime(new Date());
        course.setUpdateBy(teacherId);
        course.setUpdateTime(new Date());
        
        // 生成唯一的课程码
        course.setCourseCode(generateUniqueCourseCode());
        
        // 处理封面图片
        if (image != null && !image.isEmpty()) {
            String imageUrl = saveImage(image);
            course.setImage(imageUrl);
        }
        
        courseMapper.insert(course);
        return course;
    }
    
    /**
     * 生成唯一的课程码（4位字母+数字）
     */
    private String generateUniqueCourseCode() {
        String characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        Random random = new Random();
        String courseCode;
        
        // 循环直到生成唯一的课程码
        do {
            StringBuilder code = new StringBuilder();
            for (int i = 0; i < 4; i++) {
                code.append(characters.charAt(random.nextInt(characters.length())));
            }
            courseCode = code.toString();
        } while (courseMapper.selectOne(new QueryWrapper<Course>().eq("course_code", courseCode)) != null);
        
        return courseCode;
    }
    
    @Override
    public IPage<Course> getCourseList(Integer pageNumber, Integer pageSize,
                                      String teacherId, String keyword) {
        Page<Course> page = new Page<>(pageNumber, pageSize);
        QueryWrapper<Course> queryWrapper = new QueryWrapper<>();
        
        // 按教师ID过滤
        if (teacherId != null && !teacherId.isEmpty()) {
            queryWrapper.eq("teacher_id", teacherId);
        }
        
        // 关键词搜索（使用数据库实际列名）
        if (keyword != null && !keyword.isEmpty()) {
            queryWrapper.and(wrapper -> wrapper
                .like("name", keyword)
                .or()
                .like("task_describe", keyword)
            );
        }
        
        // 按创建时间倒序
        queryWrapper.orderByDesc("create_time");
        
        return courseMapper.selectPage(page, queryWrapper);
    }
    
    @Override
    public Course getCourseDetail(String courseId) {
        return courseMapper.selectById(courseId);
    }
    
    @Override
    @Transactional
    public void updateCourse(String courseId, String teacherId, String courseName,
                            String courseDescription, String major, String classification,
                            Date startTime, Date endTime,
                            MultipartFile image) {
        // 验证权限
        permissionService.validateEditPermission(courseId, teacherId);
        
        Course course = courseMapper.selectById(courseId);
        
        // 验证时间范围
        if (startTime != null && endTime != null && endTime.before(startTime)) {
            throw new RuntimeException("课程结束时间不能早于开始时间");
        }
        
        // 更新字段
        if (courseName != null && !courseName.isEmpty()) {
            course.setCourseName(courseName);
        }
        if (courseDescription != null) {
            course.setCourseDescription(courseDescription);
        }
        if (major != null) {
            course.setMajor(major);
        }
        if (classification != null) {
            course.setClassification(classification);
        }
        if (startTime != null) {
            course.setStartTime(startTime);
        }
        if (endTime != null) {
            course.setEndTime(endTime);
        }
        
        // 更新封面图片
        if (image != null && !image.isEmpty()) {
            String imageUrl = saveImage(image);
            course.setImage(imageUrl);
        }
        
        course.setUpdateBy(teacherId);
        course.setUpdateTime(new Date());
        
        courseMapper.updateById(course);
    }
    
    @Override
    @Transactional
    public void deleteCourse(String courseId, String teacherId) {
        // 验证权限
        permissionService.validateDeletePermission(courseId, teacherId);
        
        // 获取课程信息
        Course course = courseMapper.selectById(courseId);
        if (course == null) {
            throw new RuntimeException("课程不存在");
        }
        
        System.out.println("开始删除课程: " + courseId);
        
        // 1. 删除课程章节及相关文件
        deleteChaptersAndFiles(courseId);
        
        // 2. 删除课程评论
        QueryWrapper<CourseComment> commentWrapper = new QueryWrapper<>();
        commentWrapper.eq("course_id", courseId);
        commentMapper.delete(commentWrapper);
        System.out.println("已删除课程评论");
        
        // 3. 删除学生课程进度
        QueryWrapper<CourseProgress> progressWrapper = new QueryWrapper<>();
        progressWrapper.eq("course_id", courseId);
        progressMapper.delete(progressWrapper);
        System.out.println("已删除学生课程进度");
        
        // 4. 删除课程时间表
        QueryWrapper<CourseSchedule> scheduleWrapper = new QueryWrapper<>();
        scheduleWrapper.eq("course_id", courseId);
        scheduleMapper.delete(scheduleWrapper);
        System.out.println("已删除课程时间表");
        
        // 5. 删除学生选课记录
        QueryWrapper<StudentCourse> studentCourseWrapper = new QueryWrapper<>();
        studentCourseWrapper.eq("course_id", courseId);
        studentCourseMapper.delete(studentCourseWrapper);
        System.out.println("已删除学生选课记录");
        
        // 6. 删除考试相关数据
        deleteExamsAndRelatedData(courseId);
        
        // 7. 删除班级相关数据（如果存在）
        if (classInfoMapper != null && classStudentMapper != null) {
            deleteClassAndRelatedData(courseId);
        }
        
        // 8. 删除课程封面图片文件
        if (course.getImage() != null && !course.getImage().isEmpty()) {
            deleteFile(course.getImage());
        }
        
        // 9. 最后删除课程记录
        courseMapper.deleteById(courseId);
        System.out.println("课程删除完成: " + courseId);
    }
    
    /**
     * 删除课程章节及相关文件
     */
    private void deleteChaptersAndFiles(String courseId) {
        QueryWrapper<CourseChapter> chapterWrapper = new QueryWrapper<>();
        chapterWrapper.eq("course_id", courseId);
        List<CourseChapter> chapters = chapterMapper.selectList(chapterWrapper);
        
        for (CourseChapter chapter : chapters) {
            // 删除视频文件
            if (chapter.getVideoUrl() != null && !chapter.getVideoUrl().isEmpty()) {
                deleteFile(chapter.getVideoUrl());
            }
            // 删除PDF文件
            if (chapter.getPdfUrl() != null && !chapter.getPdfUrl().isEmpty()) {
                deleteFile(chapter.getPdfUrl());
            }
        }
        
        // 删除章节记录
        chapterMapper.delete(chapterWrapper);
        System.out.println("已删除课程章节及文件，共 " + chapters.size() + " 个章节");
    }
    
    /**
     * 删除考试及相关数据
     */
    private void deleteExamsAndRelatedData(String courseId) {
        // 查询课程的所有考试
        QueryWrapper<Exam> examWrapper = new QueryWrapper<>();
        examWrapper.eq("course_id", courseId);
        List<Exam> exams = examMapper.selectList(examWrapper);
        
        for (Exam exam : exams) {
            try {
                Long examId = exam.getExamId();
                
                // 查询该考试的所有学生考试记录
                QueryWrapper<StudentExam> studentExamQuery = new QueryWrapper<>();
                studentExamQuery.eq("exam_id", examId);
                List<StudentExam> studentExams = studentExamMapper.selectList(studentExamQuery);
                
                // 删除学生答案
                for (StudentExam studentExam : studentExams) {
                    QueryWrapper<StudentAnswer> answerWrapper = new QueryWrapper<>();
                    answerWrapper.eq("student_exam_id", studentExam.getStudentExamId());
                    studentAnswerMapper.delete(answerWrapper);
                }
                
                // 删除学生考试记录
                studentExamMapper.delete(studentExamQuery);
                
                // 删除考试题目
                QueryWrapper<ExamQuestion> questionWrapper = new QueryWrapper<>();
                questionWrapper.eq("exam_id", examId);
                examQuestionMapper.delete(questionWrapper);
            } catch (Exception e) {
                System.err.println("删除考试相关数据失败: " + e.getMessage());
            }
        }
        
        // 删除考试记录
        examMapper.delete(examWrapper);
        System.out.println("已删除考试及相关数据，共 " + exams.size() + " 个考试");
    }
    
    /**
     * 删除班级及相关数据
     */
    private void deleteClassAndRelatedData(String courseId) {
        try {
            // 查询课程的所有班级
            QueryWrapper<ClassInfo> classWrapper = new QueryWrapper<>();
            classWrapper.eq("course_id", courseId);
            List<ClassInfo> classes = classInfoMapper.selectList(classWrapper);
            
            for (ClassInfo classInfo : classes) {
                try {
                    Long classId = classInfo.getClassId();
                    
                    // 删除班级学生关系
                    QueryWrapper<ClassStudent> classStudentWrapper = new QueryWrapper<>();
                    classStudentWrapper.eq("class_id", classId);
                    classStudentMapper.delete(classStudentWrapper);
                } catch (Exception e) {
                    System.err.println("删除班级学生关系失败: " + e.getMessage());
                }
            }
            
            // 删除班级记录
            classInfoMapper.delete(classWrapper);
            System.out.println("已删除班级及相关数据，共 " + classes.size() + " 个班级");
        } catch (Exception e) {
            System.err.println("删除班级数据失败: " + e.getMessage());
        }
    }
    
    /**
     * 删除文件
     * @param fileUrl 文件URL或路径
     */
    private void deleteFile(String fileUrl) {
        try {
            // 从URL中提取文件名
            String filename;
            if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
                // 如果是完整URL，提取文件名
                filename = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
            } else if (fileUrl.startsWith("/uploads/")) {
                // 如果是相对路径，提取文件名
                filename = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
            } else {
                // 直接是文件名
                filename = fileUrl;
            }
            
            // 获取项目根目录
            String projectPath = System.getProperty("user.dir");
            
            // 构建文件路径（尝试多个可能的位置）
            Path[] possiblePaths = {
                Paths.get(projectPath, "uploads", "avatar", filename),
                Paths.get(projectPath, "uploads", "course", "cover", filename),
                Paths.get(uploadDir, "avatar", filename),
                Paths.get(uploadDir, filename)
            };
            
            // 尝试删除文件
            for (Path filePath : possiblePaths) {
                if (Files.exists(filePath)) {
                    Files.delete(filePath);
                    System.out.println("已删除文件: " + filePath.toAbsolutePath());
                    break;
                }
            }
        } catch (Exception e) {
            // 文件删除失败不影响数据库删除
            System.err.println("删除文件失败: " + fileUrl + ", 错误: " + e.getMessage());
        }
    }
    
    @Override
    @Transactional
    public void toggleCourseState(String courseId, String teacherId, Integer state) {
        // 验证权限
        permissionService.validateEditPermission(courseId, teacherId);
        
        // 验证状态值（0-私密, 1-公开）
        if (state != 0 && state != 1) {
            throw new RuntimeException("无效的课程状态");
        }
        
        Course course = courseMapper.selectById(courseId);
        course.setState(state);
        course.setUpdateBy(teacherId);
        course.setUpdateTime(new Date());
        
        courseMapper.updateById(course);
    }
    
    /**
     * 保存图片文件
     */
    private String saveImage(MultipartFile file) {
        try {
            // 获取项目根目录
            String projectPath = System.getProperty("user.dir");
            Path dirPath = Paths.get(projectPath, "uploads", "course", "cover");
            Files.createDirectories(dirPath);
            
            // 生成文件名
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = "course_" + System.currentTimeMillis() + "_" +
                            UUID.randomUUID().toString().substring(0, 8) + extension;
            
            // 保存文件
            Path filePath = dirPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath);
            
            // 打印日志
            System.out.println("课程封面保存路径: " + filePath.toAbsolutePath());
            
            // 返回相对URL路径（用于数据库存储和前端访问）
            return "/uploads/course/cover/" + filename;
        } catch (Exception e) {
            throw new RuntimeException("图片保存失败: " + e.getMessage(), e);
        }
    }
}
