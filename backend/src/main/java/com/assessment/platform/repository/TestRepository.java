package com.assessment.platform.repository;

import com.assessment.platform.entity.Role;
import com.assessment.platform.entity.Test;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestRepository extends JpaRepository<Test, Long> {

    List<Test> findByAssignedTeamIdAndAssignedRole(Long teamId, Role role);
}
