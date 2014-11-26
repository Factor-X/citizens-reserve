package eu.factorx.citizenReserve.dto.technical;

import java.util.HashMap;
import java.util.Map;


public class TranslationsDTO extends DTO {

	public String language;

	public Map<String, String> lines;

    public TranslationsDTO() {
        this.lines = new HashMap<>();
    }

    public TranslationsDTO(String language) {
        this();
        this.language = language;
	}

    public Map<String, String> getLines() {
        return lines;
    }

    public void setLines(Map<String, String> lines) {
        this.lines = lines;
    }

    public void put(String key, String translation){
        this.lines.put(key,translation);
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    @Override
    public String toString() {
        return "TranslationsDTO{" +
                "language='" + language + '\'' +
                ", lines=" + lines +
                '}';
    }
}