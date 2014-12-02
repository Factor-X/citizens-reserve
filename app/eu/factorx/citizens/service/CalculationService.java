package eu.factorx.citizens.service;

import eu.factorx.citizens.dto.AnswerDTO;
import eu.factorx.citizens.dto.ReductionDTO;

import java.util.List;

public interface CalculationService {

	ReductionDTO calculatePotentialReduction(List<AnswerDTO> surveyAnswers);

	List<ReductionDTO> calculateEffectiveReduction(List<AnswerDTO> surveyAnswers);

	void validateData (List<AnswerDTO> surveyAnswers);

}
