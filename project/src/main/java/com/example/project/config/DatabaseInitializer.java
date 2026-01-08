package com.example.project.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseInitializer implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("Starting database schema updates...");
        try {
            jdbcTemplate.execute(
                    "ALTER TABLE student_user ADD COLUMN students_major VARCHAR(100) DEFAULT NULL COMMENT 'Student Major'");
            System.out.println("Successfully added column: students_major");
        } catch (Exception e) {
            System.out.println("Skipped students_major (info: " + e.getMessage() + ")");
        }

        try {
            jdbcTemplate.execute(
                    "ALTER TABLE student_user ADD COLUMN students_grade VARCHAR(50) DEFAULT NULL COMMENT 'Student Grade'");
            System.out.println("Successfully added column: students_grade");
        } catch (Exception e) {
            System.out.println("Skipped students_grade (info: " + e.getMessage() + ")");
        }

        try {
            String createTableSql = "CREATE TABLE IF NOT EXISTS `sensitive_word` (" +
                    "`id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'Primary Key'," +
                    "`word` varchar(255) NOT NULL COMMENT 'Sensitive Word'," +
                    "`category` varchar(255) DEFAULT NULL COMMENT 'Category'," +
                    "`level` int(11) DEFAULT '1' COMMENT 'Level: 1=Low, 2=Medium, 3=High'," +
                    "`action` varchar(255) DEFAULT 'REPLACE' COMMENT 'Action: REPLACE, BLOCK, REVIEW'," +
                    "`replacement` varchar(255) DEFAULT NULL COMMENT 'Replacement Text'," +
                    "`status` int(11) DEFAULT '1' COMMENT 'Status: 1=Active, 0=Disabled'," +
                    "`create_by` varchar(255) DEFAULT NULL COMMENT 'Creator'," +
                    "`create_time` datetime DEFAULT NULL COMMENT 'Create Time'," +
                    "`update_time` datetime DEFAULT NULL COMMENT 'Update Time'," +
                    "PRIMARY KEY (`id`)" +
                    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Sensitive Word Management'";
            jdbcTemplate.execute(createTableSql);
            System.out.println("Successfully check/create table: sensitive_word");
        } catch (Exception e) {
            System.err.println("Failed to create sensitive_word table: " + e.getMessage());
        }

        System.out.println("Database schema updates completed.");
    }
}
