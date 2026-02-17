package com.assessment.platform.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OptionRequest {

    @NotBlank(message = "Option text is required")
    private String optionText;

    private boolean isCorrect = false;
}
