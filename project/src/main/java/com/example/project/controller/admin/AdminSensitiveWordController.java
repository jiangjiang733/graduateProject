package com.example.project.controller.admin;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.project.common.Result;
import com.example.project.entity.SensitiveWord;
import com.example.project.service.SensitiveWordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * 管理员敏感词管理控制器
 */
@RestController
@RequestMapping("/api/admin/sensitive-words")
@CrossOrigin(origins = "*")
public class AdminSensitiveWordController {

    @Autowired
    private SensitiveWordService sensitiveWordService;

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

        Page<SensitiveWord> page = sensitiveWordService.getSensitiveWordList(pageNumber, pageSize, keyword, category,
                level);

        Map<String, Object> data = new HashMap<>();
        data.put("list", page.getRecords());
        data.put("total", page.getTotal());
        data.put("pageNumber", pageNumber);
        data.put("pageSize", pageSize);

        return Result.success(data);
    }

    /**
     * 获取敏感词详情
     */
    @GetMapping("/{id}")
    public Result<SensitiveWord> getSensitiveWordDetail(@PathVariable Long id) {
        SensitiveWord word = sensitiveWordService.getById(id);
        if (word == null) {
            return Result.error("敏感词不存在");
        }
        return Result.success(word);
    }

    /**
     * 创建敏感词
     */
    @PostMapping
    public Result<Long> createSensitiveWord(@RequestBody SensitiveWord word) {
        if (word.getCreateTime() == null) {
            word.setCreateTime(new Date());
        }
        word.setUpdateTime(new Date());
        sensitiveWordService.save(word);
        return Result.success(word.getId());
    }

    /**
     * 更新敏感词
     */
    @PutMapping("/{id}")
    public Result<Void> updateSensitiveWord(@PathVariable Long id, @RequestBody SensitiveWord word) {
        word.setId(id);
        word.setUpdateTime(new Date());
        sensitiveWordService.updateById(word);
        return Result.success();
    }

    /**
     * 删除敏感词
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteSensitiveWord(@PathVariable Long id) {
        sensitiveWordService.removeById(id);
        return Result.success();
    }

    /**
     * 批量删除敏感词
     */
    @PostMapping("/batch-delete")
    public Result<Void> batchDeleteSensitiveWords(@RequestBody Map<String, List<Long>> data) {
        List<Long> ids = data.get("ids");
        if (ids != null && !ids.isEmpty()) {
            sensitiveWordService.removeBatchByIds(ids);
        }
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
        String createBy = "admin"; // Should get from token

        sensitiveWordService.importWords(words, category, level, createBy);
        return Result.success();
    }

    /**
     * 启用/禁用敏感词
     */
    @PutMapping("/{id}/status")
    public Result<Void> toggleSensitiveWordStatus(@PathVariable Long id, @RequestBody Map<String, Integer> data) {
        Integer status = data.get("status");
        SensitiveWord word = new SensitiveWord();
        word.setId(id);
        word.setStatus(status);
        word.setUpdateTime(new Date());
        sensitiveWordService.updateById(word);
        return Result.success();
    }

    /**
     * 测试文本是否包含敏感词
     */
    @PostMapping("/test")
    public Result<Map<String, Object>> testSensitiveWords(@RequestBody Map<String, String> data) {
        String text = data.get("text");
        boolean hasWords = sensitiveWordService.hasSensitiveWords(text);
        String filtered = sensitiveWordService.filterText(text);

        Map<String, Object> result = new HashMap<>();
        result.put("hasSensitiveWords", hasWords);
        result.put("filteredText", filtered);

        return Result.success(result);
    }
}
