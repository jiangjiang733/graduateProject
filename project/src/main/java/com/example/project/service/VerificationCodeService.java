package com.example.project.service;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * 验证码服务类
 */
@Service
public class VerificationCodeService {

    // 存储验证码的Map <邮箱#类型, 验证码信息>
    private final Map<String, CodeInfo> codeStore = new ConcurrentHashMap<>();

    // 定时清理任务
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

    /**
     * 验证码信息类
     */
    private static class CodeInfo {
        String code;
        long expireTime;

        CodeInfo(String code, long expireTime) {
            this.code = code;
            this.expireTime = expireTime;
        }

        boolean isExpired() {
            return System.currentTimeMillis() > expireTime;
        }
    }

    public VerificationCodeService() {
        // 每分钟清理一次过期验证码
        scheduler.scheduleAtFixedRate(this::cleanExpiredCodes, 1, 1, TimeUnit.MINUTES);
    }

    /**
     * 生成6位随机验证码
     */
    private String generateCode() {
        Random random = new Random();
        int code = 100000 + random.nextInt(900000);
        return String.valueOf(code);
    }

    /**
     * 生成并保存验证码
     * 
     * @param email 邮箱
     * @param type  类型（register 或 reset）
     * @return 验证码
     */
    public String generateAndStore(String email, String type) {
        String code = generateCode();
        String key = email + "#" + type;
        // 验证码有效期5分钟
        long expireTime = System.currentTimeMillis() + 5 * 60 * 1000;
        codeStore.put(key, new CodeInfo(code, expireTime));
        return code;
    }

    /**
     * 验证验证码
     * 
     * @param email 邮箱
     * @param type  类型（register 或 reset）
     * @param code  用户输入的验证码
     * @return 是否验证成功
     */
    public boolean verify(String email, String type, String code) {
        String key = email + "#" + type;
        CodeInfo codeInfo = codeStore.get(key);

        if (codeInfo == null) {
            return false;
        }

        if (codeInfo.isExpired()) {
            codeStore.remove(key);
            return false;
        }

        if (codeInfo.code.equals(code)) {
            // 验证成功后删除验证码
            codeStore.remove(key);
            return true;
        }

        return false;
    }

    /**
     * 清理过期验证码
     */
    private void cleanExpiredCodes() {
        codeStore.entrySet().removeIf(entry -> entry.getValue().isExpired());
    }

    /**
     * 检查验证码是否存在且未过期
     * 
     * @param email 邮箱
     * @param type  类型
     * @return 是否存在有效验证码
     */
    public boolean hasValidCode(String email, String type) {
        String key = email + "#" + type;
        CodeInfo codeInfo = codeStore.get(key);
        return codeInfo != null && !codeInfo.isExpired();
    }
}
