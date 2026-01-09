CREATE TABLE IF NOT EXISTS `sensitive_word` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `word` varchar(255) NOT NULL COMMENT 'Word',
  `category` varchar(255) DEFAULT NULL COMMENT 'Category',
  `level` int(11) DEFAULT '1' COMMENT 'Level (1: Low, 2: Medium, 3: High)',
  `action` varchar(255) DEFAULT 'REPLACE' COMMENT 'Action (REPLACE, BLOCK, REVIEW)',
  `replacement` varchar(255) DEFAULT NULL COMMENT 'Replacement',
  `status` int(11) DEFAULT '1' COMMENT 'Status (1: Active, 0: Disabled)',
  `create_by` varchar(255) DEFAULT NULL COMMENT 'Created By',
  `create_time` datetime DEFAULT NULL COMMENT 'Create Time',
  `update_time` datetime DEFAULT NULL COMMENT 'Update Time',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Sensitive Word';
