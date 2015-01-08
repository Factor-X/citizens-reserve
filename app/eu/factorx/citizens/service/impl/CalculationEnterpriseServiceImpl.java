package eu.factorx.citizens.service.impl;


import eu.factorx.citizens.dto.ActionAnswerDTO;
import eu.factorx.citizens.dto.EnterpriseEffectiveReductionDTO;
import eu.factorx.citizens.service.CalculationEnterpriseService;
import org.joda.time.LocalTime;

import java.util.List;


public class CalculationEnterpriseServiceImpl implements CalculationEnterpriseService {

	private static final int H17 = 17 * 60 * 60 * 1000;
	private static final int H20 = 20 * 60 * 60 * 1000;
	private static final int H3 = 3 * 60 * 60 * 1000;


	@Override
	public EnterpriseEffectiveReductionDTO calculateEffectiveReduction(List<ActionAnswerDTO> actionAnswers) {

		EnterpriseEffectiveReductionDTO enterpriseEffectiveReductionDTO = new EnterpriseEffectiveReductionDTO();

		double fullEnery = 0.0;
		double enery = 0.0;

		for (ActionAnswerDTO actionAnswer : actionAnswers) {

			String begin = actionAnswer.getBegin();
			String duration = actionAnswer.getDuration();
			double totalSeconds;
			double totalJoules;
			LocalTime delta;

			// start time
			int h = Integer.valueOf(begin.split(":")[0]);
			int m = Integer.valueOf(begin.split(":")[1]);
			long millis = (h * 60L + m) * 60L * 1000L;
			LocalTime startTime = LocalTime.fromMillisOfDay(millis);

			// duration
			h = Integer.valueOf(duration.split(":")[0]);
			m = Integer.valueOf(duration.split(":")[1]);
			int durationMillis = (h * 60 + m) * 60 * 1000;

			// time range
			LocalTime endTime = startTime.plusMillis(durationMillis);

			// use the full range
			delta = endTime.minusHours(startTime.getHourOfDay()).minusMinutes(startTime.getMinuteOfHour());
			totalSeconds = delta.getHourOfDay() * 60 * 60 + delta.getMinuteOfHour() * 60;
			totalJoules = actionAnswer.getPower() * totalSeconds;
			fullEnery += totalJoules;

			// time-boxing to 17h - 20h
			if (startTime.isBefore(LocalTime.fromMillisOfDay(H17))) {
				startTime = LocalTime.fromMillisOfDay(H17);
			}
			if (endTime.isAfter(LocalTime.fromMillisOfDay(H20))) {
				endTime = LocalTime.fromMillisOfDay(H20);
			}

			delta = endTime.minusHours(startTime.getHourOfDay()).minusMinutes(startTime.getMinuteOfHour());
			totalSeconds = delta.getHourOfDay() * 60 * 60 + delta.getMinuteOfHour() * 60;
			totalJoules = actionAnswer.getPower() * totalSeconds;

			enery += totalJoules;
		}

		double meanPower = enery / H3;

		// 1J = 1W * 1s
		// 1kJ = 1kW * 1s
		// 3 600 000 J = 1kWh

		double kwh = fullEnery / 3600000.0;

		enterpriseEffectiveReductionDTO.setMeanPower(meanPower);
		enterpriseEffectiveReductionDTO.setKwh(kwh);

		return enterpriseEffectiveReductionDTO;
	}

}
