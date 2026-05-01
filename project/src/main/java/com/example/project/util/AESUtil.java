package com.example.project.util;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

public class AESUtil {
//定义加密算法
    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/ECB/PKCS5Padding";
//    固定密钥
    private static final String KEY = "graduation_proj_";
    public static String encrypt(String content) {
        try {
            if (content == null) {
                return null;
            }
            // 把密钥转成 AES 能用的格式
            SecretKeySpec keySpec = new SecretKeySpec(KEY.getBytes(StandardCharsets.UTF_8), ALGORITHM);
            // 获取 AES 加密器
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec);
            // 执行加密
            byte[] encrypted = cipher.doFinal(content.getBytes(StandardCharsets.UTF_8));
            // 把二进制加密结果转成 Base64 字符串，为了方便存储
            return Base64.getEncoder().encodeToString(encrypted);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
//    解密方法
    public static String decrypt(String encryptedContent) {
        try {
            if (encryptedContent == null || encryptedContent.trim().isEmpty()) {
                return null;
            }
            // 如果是BCrypt格式，直接不解密
            if (encryptedContent.startsWith("$2a$") ||
                    encryptedContent.startsWith("$2b$") ||
                    encryptedContent.startsWith("$2y$")) {
                return null;
            }
//            初始化解密器
            SecretKeySpec keySpec = new SecretKeySpec(KEY.getBytes(StandardCharsets.UTF_8), ALGORITHM);
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, keySpec);
            // Base64 解码 → 解密 → 转回字符串
            byte[] decoded = Base64.getDecoder().decode(encryptedContent);
            byte[] original = cipher.doFinal(decoded);
            return new String(original, StandardCharsets.UTF_8);
        } catch (Exception e) {
            // 解密失败返回null
            return null;
        }
    }
}
