package eu.factorx.citizens.model.batch;

import eu.factorx.citizens.model.survey.Period;
import eu.factorx.citizens.model.type.ReductionDay;

import javax.persistence.*;

@Entity
@Table(name = "batchresultitem")
public class BatchResultItem {

    @Enumerated(value = EnumType.STRING)
    private ReductionDay day;

    @Enumerated(value = EnumType.STRING)
    private Period period;

    private Double powerReduction;

    @ManyToOne
    private BatchResult batchResult;

    public BatchResultItem() {
    }

    public BatchResultItem(ReductionDay day, Period period, Double powerReduction, BatchResult batchResult) {
        this.day = day;
        this.period = period;
        this.powerReduction = powerReduction;
        this.batchResult = batchResult;
    }

    public ReductionDay getDay() {
        return day;
    }

    public void setDay(ReductionDay day) {
        this.day = day;
    }

    public Period getPeriod() {
        return period;
    }

    public void setPeriod(Period period) {
        this.period = period;
    }

    public Double getPowerReduction() {
        return powerReduction;
    }

    public void setPowerReduction(Double powerReduction) {
        this.powerReduction = powerReduction;
    }

    public BatchResult getBatchResult() {
        return batchResult;
    }

    public void setBatchResult(BatchResult batchResult) {
        this.batchResult = batchResult;
    }
}
