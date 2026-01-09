package com.example.project.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.example.project.entity.SensitiveWord;

import java.util.List;

public interface SensitiveWordService extends IService<SensitiveWord> {

    /**
     * Get sensitive word list with pagination and filters
     */
    Page<SensitiveWord> getSensitiveWordList(Integer pageNumber, Integer pageSize, String keyword, String category,
            Integer level);

    /**
     * Check if text contains sensitive words
     */
    boolean hasSensitiveWords(String text);

    /**
     * Filter text using sensitivity rules
     */
    String filterText(String text);

    /**
     * Import multiple words
     */
    void importWords(List<String> words, String category, Integer level, String createBy);
}
