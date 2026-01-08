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
        System.out.println("Database schema updates completed.");
    }
}
