package eu.factorx.citizens.controllers;

import com.fasterxml.jackson.databind.JsonNode;
import eu.factorx.citizens.controllers.technical.AbstractController;
import eu.factorx.citizens.dto.*;
import eu.factorx.citizens.model.type.ReductionDay;
import eu.factorx.citizens.service.CalculationEnterpriseService;
import eu.factorx.citizens.service.CalculationService;
import eu.factorx.citizens.service.impl.CalculationEnterpriseServiceImpl;
import eu.factorx.citizens.service.impl.CalculationServiceImpl;
import play.mvc.Result;

import java.util.ArrayList;
import java.util.List;

public class CalculationController extends AbstractController {


	//service
	CalculationService calculationService = new CalculationServiceImpl();
	CalculationEnterpriseService calculationEnterpriseService = new CalculationEnterpriseServiceImpl();

	//@BodyParser.Of(BodyParser.Json.class)
	public Result calculatePotentialReduction() {

		JsonNode json = request().body().asJson();
		if (json == null) {
			return badRequest("empty json");
		}
		//play.Logger.debug(json.asText());


		SurveyDTO survey = extractDTOFromRequest(SurveyDTO.class);

		// Validate incoming DTO - TODO
		try {
			calculationService.validateProfile(survey.getAnswers());
		} catch (Exception e) {
			//throw new MyRuntimeException("This answerValue is not savable : " + answerValueDTO + " (from answer " + answerDTO + ")");
		}

		// calculate potential reduction
		ReductionDTO result = calculationService.calculatePotentialReduction(survey.getAnswers());

		play.Logger.debug("Potential Reduction FIRST:" + result.getFirstPeriodPowerReduction());
		play.Logger.debug("Potential Reduction SECOND:" + result.getSecondPeriodPowerReduction());
		play.Logger.debug("Potential Reduction THIRD:" + result.getThirdPeriodPowerReduction());

		play.Logger.debug("Potential Reduction Average:" + result.getAveragePowerReduction());
		play.Logger.debug("Potential Reduction Energy ratio:" + result.getEnergyReduction());

		return ok(result);

	} // end of action calculate potential reduction


	// TODO - to be implemented
	//@BodyParser.Of(BodyParser.Json.class)
	public Result calculateEffectiveReduction() {

		JsonNode json = request().body().asJson();
		if (json == null) {
			return badRequest("empty json");
		}
		//play.Logger.debug(json.asText());

		SurveyDTO survey = extractDTOFromRequest(SurveyDTO.class);
		EffectiveReductionDTO effectiveReductionResult = getEffectiveReductionDTO(survey);

		return ok(effectiveReductionResult);

	} // end of action calculate effective reduction


	public Result calculateEnterpriseEffectiveReduction() {

		JsonNode json = request().body().asJson();
		if (json == null) {
			return badRequest("empty json");
		}

		SurveyDTO survey = extractDTOFromRequest(SurveyDTO.class);
		EnterpriseEffectiveReductionDTO enterpriseEffectiveReductionDTO = getEnterpriseEffectiveReductionDTO(survey);

		return ok(enterpriseEffectiveReductionDTO);

	}


	public EffectiveReductionDTO getEffectiveReductionDTO(SurveyDTO survey) {
		// Validate incoming DTO - TODO
		List<AnswerDTO> missingActions = new ArrayList<AnswerDTO>();
		try {
			missingActions = calculationService.validateActions(survey.getAnswers());
		} catch (Exception e) {
			//throw new MyRuntimeException("This answerValue is not savable : " + answerValueDTO + " (from answer " + answerDTO + ")");
		}

		survey.getAnswers().addAll(missingActions);

		EffectiveReductionDTO effectiveReductionResult = calculationService.calculateEffectiveReduction(survey.getAnswers());

		List<ReductionDTO> result = effectiveReductionResult.getReductions();

		for (ReductionDay day : ReductionDay.values()) {

			play.Logger.debug("Effective DAYS:" + day.ordinal());
			play.Logger.debug("Effective Reduction FIRST:" + result.get(day.ordinal()).getFirstPeriodPowerReduction());
			play.Logger.debug("Effective Reduction SECOND:" + result.get(day.ordinal()).getSecondPeriodPowerReduction());
			play.Logger.debug("Effective Reduction THIRD:" + result.get(day.ordinal()).getThirdPeriodPowerReduction());

			play.Logger.debug("Effective Reduction Average:" + result.get(day.ordinal()).getAveragePowerReduction());
			play.Logger.debug("Effective Reduction Energy ratio:" + result.get(day.ordinal()).getEnergyReduction());

//			System.out.println("Effective Reduction FIRST:" + result.get(day.ordinal()).getFirstPeriodPowerReduction());
//			System.out.println("Effective Reduction SECOND:" + result.get(day.ordinal()).getSecondPeriodPowerReduction());
//			System.out.println("Effective Reduction THIRD:" + result.get(day.ordinal()).getThirdPeriodPowerReduction());
//
//			System.out.println("Effective Reduction Average:" + result.get(day.ordinal()).getAveragePowerReduction());
//			System.out.println("Effective Reduction Energy ratio:" + result.get(day.ordinal()).getEnergyReduction());
		}
		return effectiveReductionResult;
	}

	public EnterpriseEffectiveReductionDTO getEnterpriseEffectiveReductionDTO(SurveyDTO survey) {
		return calculationEnterpriseService.calculateEffectiveReduction(survey.getActionAnswers());
	}

}  // end of controller
