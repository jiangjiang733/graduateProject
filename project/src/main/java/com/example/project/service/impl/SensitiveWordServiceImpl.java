package com.example.project.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.project.entity.SensitiveWord;
import com.example.project.mapper.SensitiveWordMapper;
import com.example.project.service.SensitiveWordService;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Date;
import java.util.List;

@Service
public class SensitiveWordServiceImpl extends ServiceImpl<SensitiveWordMapper, SensitiveWord>
        implements SensitiveWordService {

    @Override
    public Page<SensitiveWord> getSensitiveWordList(Integer pageNumber, Integer pageSize, String keyword,
            String category, Integer level) {
        Page<SensitiveWord> page = new Page<>(pageNumber, pageSize);
        LambdaQueryWrapper<SensitiveWord> queryWrapper = new LambdaQueryWrapper<>();

        if (StringUtils.hasText(keyword)) {
            queryWrapper.like(SensitiveWord::getWord, keyword);
        }
        if (StringUtils.hasText(category)) {
            queryWrapper.eq(SensitiveWord::getCategory, category);
        }
        if (level != null) {
            queryWrapper.eq(SensitiveWord::getLevel, level);
        }

        queryWrapper.orderByDesc(SensitiveWord::getCreateTime);
        return this.page(page, queryWrapper);
    }

    @Override
    public boolean hasSensitiveWords(String text) {
        if (!StringUtils.hasText(text))
            return false;

        // This is a naive implementation. In production, use a Trie or Aho-Corasick
        // algorithm.
        List<SensitiveWord> words = this.list(new LambdaQueryWrapper<SensitiveWord>().eq(SensitiveWord::getStatus, 1));
        for (SensitiveWord sw : words) {
            if (text.contains(sw.getWord())) {
                return true;
            }
        }
        return false;
    }

    @Override
    public String filterText(String text) {
        if (!StringUtils.hasText(text))
            return text;

        List<SensitiveWord> words = this.list(new LambdaQueryWrapper<SensitiveWord>().eq(SensitiveWord::getStatus, 1));
        for (SensitiveWord sw : words) {
            if (text.contains(sw.getWord())) {
                String replacement = StringUtils.hasText(sw.getReplacement()) ? sw.getReplacement() : "***";
                text = text.replace(sw.getWord(), replacement);
            }
        }
        return text;
    }

    @Override
    public void importWords(List<String> words, String category, Integer level, String createBy) {
        if (words == null || words.isEmpty())
            return;

        for (String w : words) {
            if (!StringUtils.hasText(w))
                continue;

            // Check if exists
            if (this.count(new LambdaQueryWrapper<SensitiveWord>().eq(SensitiveWord::getWord, w)) > 0) {
                continue;
            }

            SensitiveWord sw = new SensitiveWord();
            sw.setWord(w);
            sw.setCategory(category);
            sw.setLevel(level != null ? level : 1);
            sw.setAction("REPLACE");
            sw.setReplacement("***");
            sw.setStatus(1);
            sw.setCreateBy(createBy);
            sw.setCreateTime(new Date());
            sw.setUpdateTime(new Date());
            this.save(sw);
        }
    }
}
