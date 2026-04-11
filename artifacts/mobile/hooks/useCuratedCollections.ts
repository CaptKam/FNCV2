/**
 * React hook wrapper around the module-level curated collections store.
 *
 * Subscribes to the store's listener set so components re-render when
 * a successful network refresh lands. Returns an empty array until
 * loaded, never null/undefined — callers can safely map without
 * guard clauses.
 */
import { useEffect, useState } from "react";
import {
  getCuratedCollections,
  subscribeCuratedCollections,
  type CuratedCollection,
} from "@/utils/curatedCollections";

export function useCuratedCollections(): readonly CuratedCollection[] {
  const [collections, setCollections] = useState<readonly CuratedCollection[]>(
    () => getCuratedCollections(),
  );
  useEffect(() => {
    setCollections(getCuratedCollections());
    return subscribeCuratedCollections(setCollections);
  }, []);
  return collections;
}
