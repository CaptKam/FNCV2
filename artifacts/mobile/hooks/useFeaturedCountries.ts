/**
 * Hook that returns the subset of the mobile country list where
 * isFeatured=true in the DB-backed country_metadata.
 *
 * Falls back to the full country list if no metadata has loaded
 * yet (so the Discover hero doesn't flash empty on first paint)
 * AND if no country is featured (so an admin misconfigure doesn't
 * kill the whole hero rotation).
 *
 * Re-renders when the module store updates via subscribeCountryMetadata.
 */
import { useEffect, useState } from "react";
import { countries as tsCountries, type Country } from "@/data/countries";
import {
  subscribeCountryMetadata,
  isFeaturedForCountry,
} from "@/utils/countryMetadata";

function computeFeatured(): Country[] {
  const filtered = tsCountries.filter((c) => isFeaturedForCountry(c.id));
  // Fallback: if absolutely nothing is featured, show everything so
  // the Discover hero doesn't go blank. An admin can still fix the
  // config from the Countries page.
  return filtered.length > 0 ? filtered : tsCountries;
}

export function useFeaturedCountries(): Country[] {
  const [list, setList] = useState<Country[]>(() => computeFeatured());
  useEffect(() => {
    // Grab the current value in case metadata landed between
    // first render and the subscribe call.
    setList(computeFeatured());
    return subscribeCountryMetadata(() => setList(computeFeatured()));
  }, []);
  return list;
}
