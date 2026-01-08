package com.example.project.controller.admin;

import com.example.project.common.Result;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * 管理员敏感词管理控制器
 */
@RestController
@RequestMapping("/api/admin/sensitive-words")
@CrossOrigin(origins = "*")
public class AdminSensitiveWordController {

    /**
     * 获取敏感词列表
     */
    @GetMapping
    public Result<Map<String, Object>> getSensitiveWordList(
            @RequestParam(defaultValue = "1") Integer pageNumber,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer level) {
        Map<String, Object> data = new HashMap<>();
        data.put("list", new ArrayList<>());
        data.put("total", 0);
        data.put("pageNumber", pageNumber);
        data.put("pageSize", pageSize);

        return Result.success(data);
    }

    /**
     * 获取敏感词详情
     */
    @GetMapping("/{id}")
    public Result<Map<String, Object>> getSensitiveWordDetail(@PathVariable Long id) {
        // TODO: 实现实际的数据库查询
        Map<String, Object> word = new HashMap<>();
        word.put("id", id);
        word.put("word", "示例敏感词");
        word.put("category", "OTHER");
        word.put("level", 1);
        word.put("action", "REPLACE");
        word.put("replacement", "***");
        word.put("status", 1);

        return Result.success(word);
    }

    /**
     * 创建敏感词
     */
    @PostMapping
    public Result<Long> createSensitiveWord(@RequestBody Map<String, Object> word) {
        // TODO: 实现实际的数据库插入
        return Result.success(1L);
    }

    /**
     * 更新敏感词
     */
    @PutMapping("/{id}")
    public Result<Void> updateSensitiveWord(@PathVariable Long id, @RequestBody Map<String, Object> word) {
        // TODO: 实现实际的数据库更新
        return Result.success();
    }

    /**
     * 删除敏感词
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteSensitiveWord(@PathVariable Long id) {
        // TODO: 实现实际的数据库删除
        return Result.success();
    }

    /**
     * 批量删除敏感词
     */
    @PostMapping("/batch-delete")
    public Result<Void> batchDeleteSensitiveWords(@RequestBody Map<String, List<Long>> data) {
        List<Long> ids = data.get("ids");
        System.out.println("Batch delete ids: " + ids);
        // TODO: 实现实际的批量删除
        return Result.success();
    }

    /**
     * 批量导入敏感词
     */
    @PostMapping("/import")
    public Result<Void> importSensitiveWords(@RequestBody Map<String, Object> data) {
        @SuppressWarnings("unchecked")
        List<String> words = (List<String>) data.get("words");
        String category = (String) data.get("category");
        Integer level = (Integer) data.get("level");
        System.out.println("Importing words: " + words + ", category: " + category + ", level: " + level);

        // TODO: 实现实际的批量导入
        return Result.success();
    }

    /**
     * 启用/禁用敏感词
     */
    @PutMapping("/{id}/status")
    public Result<Void> toggleSensitiveWordStatus(@PathVariable Long id, @RequestBody Map<String, Integer> data) {
        Integer status = data.get("status");
        System.out.println("Toggle status to: " + status);
        // TODO: 实现实际的状态更新
        return Result.success();
    }

    /**
     * 测试文本是否包含敏感词
     */
    @PostMapping("/test")
    public Result<Map<String, Object>> testSensitiveWords(@RequestBody Map<String, String> data) {
        String text = data.get("text");
        System.out.println("Testing text: " + text);

        // TODO: 实现实际的敏感词检测
        Map<String, Object> result = new HashMap<>();
        result.put("hasSensitiveWords", false);
        result.put("words", new ArrayList<>());

        return Result.success(result);
    }
}
