import { useMemo } from "react";
import type { AdministrativeState, City, Country } from "../../shared";

export function useGeographyData({
  countries,
  states,
  cities,
}: {
  countries: Country[];
  states: AdministrativeState[];
  cities: City[];
}) {
  const countryById = useMemo(
    () => new Map(countries.map((country) => [country.id, country])),
    [countries],
  );
  const stateById = useMemo(
    () => new Map(states.map((state) => [state.id, state])),
    [states],
  );
  const cityById = useMemo(
    () => new Map(cities.map((city) => [city.id, city])),
    [cities],
  );
  return { countryById, stateById, cityById };
}
