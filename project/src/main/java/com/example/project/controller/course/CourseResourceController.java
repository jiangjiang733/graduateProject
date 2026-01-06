package com.example.project.controller.course;

import com.example.project.common.Result;
import com.example.project.entity.course.CourseResource;
import com.example.project.service.course.CourseResourceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/course/resource")
@CrossOrigin(origins = "*")
public class CourseResourceController {

    @Autowired
    private CourseResourceService courseResourceService;

    /**
     * 获取课程资源列表
     */
    @GetMapping("/list/{courseId}")
    public Result<List<CourseResource>> getResources(@PathVariable String courseId) {
        try {
            List<CourseResource> resources = courseResourceService.getResourcesByCourseId(courseId);
            return Result.success(resources);
        } catch (Exception e) {
            return Result.error("获取资源列表失败: " + e.getMessage());
        }
    }

    /**
     * 上传资源 (通常仅教师)
     */
    @PostMapping("/upload")
    public Result<CourseResource> uploadResource(
            @RequestParam("courseId") String courseId,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam("uploaderId") String uploaderId,
            @RequestParam("uploaderName") String uploaderName,
            @RequestParam("file") MultipartFile file) {
        try {
            CourseResource resource = courseResourceService.uploadResource(courseId, title, uploaderId, uploaderName,
                    file);
            return Result.success(resource);
        } catch (Exception e) {
            return Result.error("上传失败: " + e.getMessage());
        }
    }

    /**
     * 删除资源
     */
    @DeleteMapping("/{id}")
    public Result<String> deleteResource(@PathVariable Long id) {
        try {
            courseResourceService.deleteResource(id);
            return Result.success("删除成功");
        } catch (Exception e) {
            return Result.error("删除失败: " + e.getMessage());
        }
    }

    /**
     * 记录下载量
     */
    @PostMapping("/download/{id}")
    public Result<String> recordDownload(@PathVariable Long id) {
        try {
            courseResourceService.incrementDownloadCount(id);
            return Result.success("记录成功");
        } catch (Exception e) {
            return Result.error("记录失败: " + e.getMessage());
        }
    }
}
