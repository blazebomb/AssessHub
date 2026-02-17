package com.assessment.platform.config;

import com.assessment.platform.entity.Role;
import com.assessment.platform.entity.Team;
import com.assessment.platform.entity.TeamType;
import com.assessment.platform.entity.User;
import com.assessment.platform.repository.TeamRepository;
import com.assessment.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedTeams();
        seedAdmin();
    }

    private void seedTeams() {
        if (teamRepository.count() == 0) {
            teamRepository.save(Team.builder().name("Development Team 1").type(TeamType.DEV).build());
            teamRepository.save(Team.builder().name("Development Team 2").type(TeamType.DEV).build());
            teamRepository.save(Team.builder().name("Data Analyst Team 1").type(TeamType.DATA).build());
            teamRepository.save(Team.builder().name("Data Analyst Team 2").type(TeamType.DATA).build());
            teamRepository.save(Team.builder().name("DevOps Team").type(TeamType.DEVOPS).build());
            log.info("Teams seeded successfully");
        }
    }

    private void seedAdmin() {
        if (!userRepository.existsByEmail("admin@assessment.com")) {
            User admin = User.builder()
                    .name("Admin")
                    .email("admin@assessment.com")
                    .password(passwordEncoder.encode("admin123"))
                    .role(Role.ADMIN)
                    .using2FA(false)
                    .build();
            userRepository.save(admin);
            log.info("Default admin user created: admin@assessment.com / admin123");
        }
    }
}
