package com.example.project.service.ai;
import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import com.example.project.dto.exam.ExamQuestionDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.ArrayList;
import java.util.List;
@Service
public class AiQuestionGeneratorService {

    @Value("${aliyun.bailian.apiKey}")
    private String apiKey;

    @Value("${aliyun.bailian.url}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public List<ExamQuestionDTO> generateQuestions(String courseName, int questionCount, String questionTypes) {
        System.out.println("\n=== AI生成题目开始 ===");
        System.out.println("课程名称: " + courseName);
        System.out.println("题目数量: " + questionCount);
        System.out.println("题型: " + questionTypes);
        
        // 构造提示词
        String prompt = String.format(
                "请为《%s》课程生成 %d 道题目，题型包括：%s。\n" +
                        "要求：\n" +
                        "- 每题必须包含：题干、选项、正确答案、分值（5 或 10）\n" +
                        "- 以严格 JSON 数组格式返回，字段名：questionType, questionContent, questionOptions, correctAnswer, score\n" +
                        "- questionType 只能是：SINGLE（单选）、MULTIPLE（多选）、JUDGE（判断）\n" +
                        "- questionOptions 必须是 JSON 数组格式，例如：[\"A.选项1\", \"B.选项2\", \"C.选项3\", \"D.选项4\"] 或判断题用 [\"对\", \"错\"]\n" +
                        "- correctAnswer 格式：单选用 \"A\"，多选用 \"AB\"，判断用 \"对\" 或 \"错\"\n" +
                        "- 不要任何解释，只返回 JSON 数组",
                courseName, questionCount, questionTypes
        );

        System.out.println("提示词: " + prompt);

        // 构建请求体
        JSONObject requestBody = new JSONObject();
        requestBody.put("model", "qwen-max");
        JSONObject input = new JSONObject();
        JSONArray messages = new JSONArray();
        messages.add(new JSONObject().fluentPut("role", "user").fluentPut("content", prompt));
        input.put("messages", messages);
        requestBody.put("input", input);

        System.out.println("请求体: " + requestBody.toJSONString());

        // 设置 Header
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> entity = new HttpEntity<>(requestBody.toJSONString(), headers);

        try {
            System.out.println("开始调用阿里云API...");
            System.out.println("API URL: " + apiUrl);
            
            ResponseEntity<String> response = restTemplate.postForEntity(apiUrl, entity, String.class);
            
            System.out.println("API响应状态码: " + response.getStatusCode());
            System.out.println("API响应内容: " + response.getBody());
            
            if (response.getStatusCode() != HttpStatus.OK) {
                throw new RuntimeException("AI 调用失败，状态码: " + response.getStatusCode() + ", 响应: " + response.getBody());
            }

            // 解析响应
            String responseBody = response.getBody();
            if (responseBody == null || responseBody.isEmpty()) {
                throw new RuntimeException("AI 返回空响应");
            }
            
            JSONObject jsonResponse = JSON.parseObject(responseBody);
            System.out.println("解析后的JSON: " + jsonResponse.toJSONString());
            
            // 检查是否有错误
            if (jsonResponse.containsKey("code") && !jsonResponse.getString("code").equals("200")) {
                String errorMsg = jsonResponse.getString("message");
                throw new RuntimeException("AI API返回错误: " + errorMsg);
            }
            
            // 安全地获取output
            JSONObject output = jsonResponse.getJSONObject("output");
            if (output == null) {
                throw new RuntimeException("AI 响应中没有output字段，完整响应: " + responseBody);
            }
            
            // 尝试获取AI生成的内容（支持两种格式）
            String aiResponse = null;
            
            // 格式1: output.text (阿里云百炼新版API)
            if (output.containsKey("text")) {
                aiResponse = output.getString("text");
                System.out.println("使用text字段获取AI内容");
            }
            // 格式2: output.choices[0].message.content (旧版API)
            else if (output.containsKey("choices")) {
                JSONArray choices = output.getJSONArray("choices");
                if (choices != null && !choices.isEmpty()) {
                    aiResponse = choices.getJSONObject(0).getJSONObject("message").getString("content");
                    System.out.println("使用choices字段获取AI内容");
                }
            }
            
            if (aiResponse == null || aiResponse.isEmpty()) {
                throw new RuntimeException("AI 未返回有效内容，output内容: " + output.toJSONString());
            }
            
            System.out.println("AI生成的内容: " + aiResponse);

            // 尝试解析 AI 返回的 JSON
            String jsonContent = extractJson(aiResponse);
            System.out.println("提取的JSON: " + jsonContent);
            
            JSONArray questionArray = JSON.parseArray(jsonContent);
            List<ExamQuestionDTO> questions = new ArrayList<>();

            for (int i = 0; i < questionArray.size(); i++) {
                JSONObject q = questionArray.getJSONObject(i);
                ExamQuestionDTO dto = new ExamQuestionDTO();
                dto.setQuestionType(q.getString("questionType"));
                dto.setQuestionContent(q.getString("questionContent"));
                
                // 处理 questionOptions，确保是有效的 JSON 格式
                String questionOptions = normalizeQuestionOptions(q.get("questionOptions"));
                dto.setQuestionOptions(questionOptions);
                
                dto.setCorrectAnswer(q.getString("correctAnswer"));
                dto.setScore(q.getInteger("score"));
                dto.setQuestionOrder(i + 1);
                questions.add(dto);
                
                System.out.println("题目" + (i+1) + ": " + dto.getQuestionContent());
                System.out.println("选项格式: " + questionOptions);
            }

            System.out.println("成功生成 " + questions.size() + " 道题目");
            System.out.println("=== AI生成题目完成 ===\n");
            
            return questions;
        } catch (Exception e) {
            System.err.println("AI生成失败: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("AI 题目生成失败: " + e.getMessage(), e);
        }
    }

    // 辅助方法：从 AI 响应中提取纯 JSON（去除 ```json 等）
    private String extractJson(String content) {
        if (content.trim().startsWith("[")) {
            return content;
        }
        int start = content.indexOf('[');
        int end = content.lastIndexOf(']') + 1;
        if (start != -1 && end > start) {
            return content.substring(start, end);
        }
        throw new RuntimeException("无法解析 AI 返回的 JSON: " + content);
    }
    
    /**
     * 规范化题目选项格式，确保是有效的 JSON 格式
     * 支持多种输入格式：
     * 1. JSON 数组：["A.选项1", "B.选项2"] 
     * 2. JSON 对象：{"A":"选项1", "B":"选项2"}
     * 3. 普通字符串：需要转换为 JSON 数组
     */
    private String normalizeQuestionOptions(Object optionsObj) {
        if (optionsObj == null) {
            return "[]";
        }
        
        // 如果已经是 JSONArray，直接转为字符串
        if (optionsObj instanceof JSONArray) {
            return ((JSONArray) optionsObj).toJSONString();
        }
        
        // 如果是 JSONObject，直接转为字符串
        if (optionsObj instanceof JSONObject) {
            return ((JSONObject) optionsObj).toJSONString();
        }
        
        // 如果是字符串，尝试解析
        String optionsStr = optionsObj.toString().trim();
        
        // 检查是否已经是 JSON 格式
        if (optionsStr.startsWith("[") || optionsStr.startsWith("{")) {
            try {
                // 验证是否是有效的 JSON
                if (optionsStr.startsWith("[")) {
                    JSON.parseArray(optionsStr);
                } else {
                    JSON.parseObject(optionsStr);
                }
                return optionsStr;
            } catch (Exception e) {
                System.err.println("选项不是有效的 JSON，尝试转换: " + optionsStr);
            }
        }
        
        // 如果不是 JSON 格式，尝试转换为 JSON 数组
        // 支持格式：
        // "A.选项1 B.选项2 C.选项3"
        // "对/错"
        // "对,错"
        JSONArray optionsArray = new JSONArray();
        
        // 判断题特殊处理
        if (optionsStr.contains("对") && optionsStr.contains("错")) {
            optionsArray.add("对");
            optionsArray.add("错");
            return optionsArray.toJSONString();
        }
        
        // 尝试按空格分割
        String[] parts = optionsStr.split("\\s+");
        if (parts.length > 1) {
            for (String part : parts) {
                if (!part.trim().isEmpty()) {
                    optionsArray.add(part.trim());
                }
            }
            return optionsArray.toJSONString();
        }
        
        // 尝试按逗号分割
        parts = optionsStr.split(",");
        if (parts.length > 1) {
            for (String part : parts) {
                if (!part.trim().isEmpty()) {
                    optionsArray.add(part.trim());
                }
            }
            return optionsArray.toJSONString();
        }
        
        // 如果无法分割，直接作为单个选项
        optionsArray.add(optionsStr);
        return optionsArray.toJSONString();
    }
}