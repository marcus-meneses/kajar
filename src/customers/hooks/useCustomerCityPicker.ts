import { useMemo } from "react";
import type { AdministrativeState, City, Country } from "../../shared";

export type CustomerCityPickerLevel = "countries" | "states" | "cities";

export function useCustomerCityPickerRows({
  level,
  countries,
  states,
  cities,
  stateById,
}: {
  level: CustomerCityPickerLevel;
  countries: Country[];
  states: AdministrativeState[];
  cities: City[];
  stateById: Map<string, AdministrativeState>;
}) {
  return useMemo(() => {
    if (level === "countries")
      return countries.map((country) => ({
        id: country.id,
        primary:
          country.namePTBR ||
          country.name ||
          country.abbreviation ||
          "Unnamed country",
        secondary: [
          country.abbreviation,
          country.bacenCode ? "BACEN " + country.bacenCode : null,
        ]
          .filter(Boolean)
          .join(" / "),
      }));
    if (level === "states")
      return states.map((state) => ({
        id: state.id,
        primary: [state.name || "Unnamed state", state.abbreviation]
          .filter(Boolean)
          .join(" - "),
        secondary: state.callCodes ?? "",
      }));
    return cities.map((city) => {
      const state = city.stateId ? stateById.get(city.stateId) : null;
      return {
        id: city.id,
        primary: [city.name || "Unnamed city", state?.abbreviation]
          .filter(Boolean)
          .join(" - "),
        secondary: "",
      };
    });
  }, [level, countries, states, cities, stateById]);
}
