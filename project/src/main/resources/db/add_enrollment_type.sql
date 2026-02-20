-- 添加 enrollment_type 字段到 course_enrollment 表
-- 用于区分学生申请 (APPLY) 和教师邀请 (INVITE)

ALTER TABLE course_enrollment 
ADD COLUMN enrollment_type VARCHAR(20) DEFAULT 'APPLY' COMMENT '报名类型: APPLY(学生申请)/INVITE(教师邀请)';

-- 将现有的所有记录设置为学生申请类型（向后兼容）
UPDATE course_enrollment SET enrollment_type = 'APPLY' WHERE enrollment_type IS NULL;
