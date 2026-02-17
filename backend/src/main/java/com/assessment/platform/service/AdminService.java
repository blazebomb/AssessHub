package com.assessment.platform.service;

import com.assessment.platform.dto.request.ChangeRoleRequest;
import com.assessment.platform.dto.request.CreateTestRequest;
import com.assessment.platform.dto.request.OptionRequest;
import com.assessment.platform.dto.request.QuestionRequest;
import com.assessment.platform.dto.response.*;
import com.assessment.platform.entity.*;
import com.assessment.platform.exception.BadRequestException;
import com.assessment.platform.exception.ResourceNotFoundException;
import com.assessment.platform.repository.*;
import com.assessment.platform.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final TestRepository testRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final SubmissionRepository submissionRepository;
    private final AnswerRepository answerRepository;
    private final QuestionRepository questionRepository;
    private final TestService testService;
    private final EmailService emailService;

    @Transactional
    public TestResponse createTest(CreateTestRequest request) {
        CustomUserDetails userDetails = getCurrentUser();
        User admin = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        Team team = teamRepository.findById(request.getAssignedTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Team not found"));

        Role assignedRole;
        try {
            assignedRole = Role.valueOf(request.getAssignedRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid role: " + request.getAssignedRole());
        }

        Test test = Test.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .timeLimitMinutes(request.getTimeLimitMinutes())
                .assignedRole(assignedRole)
                .assignedTeam(team)
                .createdBy(admin)
                .resultsReleased(false)
                .questions(new ArrayList<>())
                .build();

        for (QuestionRequest qr : request.getQuestions()) {
            Question question = Question.builder()
                    .test(test)
                    .questionText(qr.getQuestionText())
                    .options(new ArrayList<>())
                    .build();

            for (OptionRequest or : qr.getOptions()) {
                Option option = Option.builder()
                        .question(question)
                        .optionText(or.getOptionText())
                        .isCorrect(or.isCorrect())
                        .build();
                question.getOptions().add(option);
            }

            test.getQuestions().add(question);
        }

        test = testRepository.save(test);

        return mapToTestResponseAdmin(test);
    }

    public List<TestResponse> getAllTests() {
        List<Test> tests = testRepository.findAll();
        return tests.stream()
                .map(this::mapToTestResponseAdmin)
                .collect(Collectors.toList());
    }

    public List<SubmissionResponse> getTestSubmissions(Long testId) {
        testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found"));

        List<Submission> submissions = submissionRepository.findByTestId(testId);
        return submissions.stream()
                .map(s -> testService.mapToSubmissionResponse(s, true))
                .collect(Collectors.toList());
    }

    @Transactional
    public void releaseResults(Long testId) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found"));

        if (test.isResultsReleased()) {
            throw new BadRequestException("Results already released for this test");
        }

        test.setResultsReleased(true);
        testRepository.save(test);

        List<Submission> submissions = submissionRepository.findByTestId(testId);
        for (Submission submission : submissions) {
            StringBuilder answerKey = new StringBuilder();
            List<Answer> answers = answerRepository.findBySubmissionId(submission.getId());

            for (Answer answer : answers) {
                // Fetch question with options loaded
                Question q = questionRepository.findByIdWithOptions(answer.getQuestion().getId())
                        .orElse(answer.getQuestion());
                
                // Get all correct options (supporting multi-correct)
                List<Option> correctOptions = q.getOptions().stream()
                        .filter(Option::isCorrect)
                        .collect(Collectors.toList());
                
                String correctAnswerText = correctOptions.isEmpty() 
                        ? "N/A" 
                        : correctOptions.stream()
                                .map(Option::getOptionText)
                                .collect(Collectors.joining(", "));

                answerKey.append("Q: ").append(q.getQuestionText()).append("\n");
                answerKey.append("Your Answer: ")
                        .append(answer.getSelectedOption() != null ? answer.getSelectedOption().getOptionText() : "Not Answered")
                        .append("\n");
                answerKey.append("Correct Answer: ")
                        .append(correctAnswerText)
                        .append("\n\n");
            }

            emailService.sendResultEmail(
                    submission.getUser().getEmail(),
                    submission.getUser().getName(),
                    test.getTitle(),
                    submission.getScore(),
                    submission.getTotalMarks(),
                    answerKey.toString()
            );
        }
    }

    @Transactional
    public UserResponse changeUserRole(Long userId, ChangeRoleRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Role newRole;
        try {
            newRole = Role.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid role: " + request.getRole());
        }

        user.setRole(newRole);
        user = userRepository.save(user);

        return mapToUserResponse(user);
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    public List<TeamResponse> getAllTeams() {
        return teamRepository.findAll().stream()
                .map(t -> TeamResponse.builder()
                        .id(t.getId())
                        .name(t.getName())
                        .type(t.getType().name())
                        .build())
                .collect(Collectors.toList());
    }

    private TestResponse mapToTestResponseAdmin(Test test) {
        List<QuestionResponse> questionResponses = test.getQuestions().stream()
                .map(q -> QuestionResponse.builder()
                        .id(q.getId())
                        .questionText(q.getQuestionText())
                        .options(q.getOptions().stream()
                                .map(o -> OptionResponse.builder()
                                        .id(o.getId())
                                        .optionText(o.getOptionText())
                                        .isCorrect(o.isCorrect())
                                        .build())
                                .collect(Collectors.toList()))
                        .build())
                .collect(Collectors.toList());

        return TestResponse.builder()
                .id(test.getId())
                .title(test.getTitle())
                .description(test.getDescription())
                .timeLimitMinutes(test.getTimeLimitMinutes())
                .assignedRole(test.getAssignedRole().name())
                .assignedTeamId(test.getAssignedTeam().getId())
                .assignedTeamName(test.getAssignedTeam().getName())
                .createdByName(test.getCreatedBy().getName())
                .resultsReleased(test.isResultsReleased())
                .questions(questionResponses)
                .createdAt(test.getCreatedAt())
                .build();
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .teamId(user.getTeam() != null ? user.getTeam().getId() : null)
                .teamName(user.getTeam() != null ? user.getTeam().getName() : null)
                .teamLeadName(user.getTeamLeadName())
                .description(user.getDescription())
                .using2FA(user.isUsing2FA())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private CustomUserDetails getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (CustomUserDetails) auth.getPrincipal();
    }
}
