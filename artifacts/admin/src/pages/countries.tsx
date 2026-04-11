/**
 * Countries admin page.
 *
 * Two sections on one page:
 *
 *   1. Countries — every country from the mobile TS catalog shown
 *      with a "Featured" checkbox (eligible for the default
 *      Country-of-the-Day rotation) and a Region dropdown.
 *
 *   2. Regions — CRUD list of region names with sort order. Edits
 *      propagate to the country section's dropdown.
 *
 * The page is the answer to "let admins manage the country list
 * without losing the existing date-by-date Country-of-the-Day
 * scheduler" — the scheduler stays at /featured-country, this page
 * covers day-to-day curation.
 */
import { useEffect, useMemo, useState } from "react";
import { useGetCountries } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Flag, Plus, Pencil, Trash2, Save } from "lucide-react";
import {
  listRegions,
  createRegion as apiCreateRegion,
  updateRegion as apiUpdateRegion,
  deleteRegion as apiDeleteRegion,
  listCountryMetadata,
  updateCountryMetadata,
  CountriesApiError,
  type Region,
  type CountryMetadata,
} from "@/lib/countriesApi";

const NO_REGION_VALUE = "__none__";

interface RegionDraft {
  id: number | null;
  name: string;
  sortOrder: number;
}

export default function CountriesPage() {
  const { toast } = useToast();
  const { data: countryList, isLoading: loadingCountryList } = useGetCountries();
  const [regions, setRegions] = useState<Region[] | null>(null);
  const [metaByCountry, setMetaByCountry] = useState<Record<string, CountryMetadata>>({});
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingCountry, setPendingCountry] = useState<string | null>(null);

  // Region edit state
  const [regionDraft, setRegionDraft] = useState<RegionDraft | null>(null);
  const [savingRegion, setSavingRegion] = useState(false);
  const [deletingRegion, setDeletingRegion] = useState<Region | null>(null);

  async function refresh(): Promise<void> {
    setError(null);
    setLoadingMeta(true);
    try {
      const [regionRows, metaRows] = await Promise.all([
        listRegions(),
        listCountryMetadata(),
      ]);
      setRegions(regionRows);
      const byCountry: Record<string, CountryMetadata> = {};
      for (const m of metaRows) byCountry[m.countryId] = m;
      setMetaByCountry(byCountry);
    } catch (err) {
      const msg = err instanceof CountriesApiError ? err.message : "Failed to load countries";
      setError(msg);
    } finally {
      setLoadingMeta(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleToggleFeatured(countryId: string, next: boolean): Promise<void> {
    if (pendingCountry) return;
    setPendingCountry(countryId);
    const prev = metaByCountry[countryId];
    setMetaByCountry((p) => ({
      ...p,
      [countryId]: {
        countryId,
        regionId: prev?.regionId ?? null,
        isFeatured: next,
        createdAt: prev?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: prev?.updatedBy ?? null,
      },
    }));
    try {
      const updated = await updateCountryMetadata(countryId, { isFeatured: next });
      setMetaByCountry((p) => ({ ...p, [countryId]: updated }));
      toast({ title: `${countryId} ${next ? "featured" : "hidden from rotation"}` });
    } catch (err) {
      const msg = err instanceof CountriesApiError ? err.message : "Update failed";
      if (prev) setMetaByCountry((p) => ({ ...p, [countryId]: prev }));
      toast({ title: "Update failed", description: msg, variant: "destructive" });
    } finally {
      setPendingCountry(null);
    }
  }

  async function handleChangeRegion(countryId: string, regionId: number | null): Promise<void> {
    if (pendingCountry) return;
    setPendingCountry(countryId);
    try {
      const updated = await updateCountryMetadata(countryId, { regionId });
      setMetaByCountry((p) => ({ ...p, [countryId]: updated }));
      toast({ title: `${countryId} region updated` });
    } catch (err) {
      const msg = err instanceof CountriesApiError ? err.message : "Update failed";
      toast({ title: "Update failed", description: msg, variant: "destructive" });
    } finally {
      setPendingCountry(null);
    }
  }

  function openCreateRegion(): void {
    const maxSort = regions?.reduce((m, r) => Math.max(m, r.sortOrder), 0) ?? 0;
    setRegionDraft({ id: null, name: "", sortOrder: maxSort + 10 });
  }

  function openEditRegion(region: Region): void {
    setRegionDraft({ id: region.id, name: region.name, sortOrder: region.sortOrder });
  }

  async function handleSaveRegion(): Promise<void> {
    if (!regionDraft) return;
    const name = regionDraft.name.trim();
    if (!name) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    setSavingRegion(true);
    try {
      if (regionDraft.id === null) {
        const created = await apiCreateRegion(name, regionDraft.sortOrder);
        setRegions((p) => (p ? [...p, created] : [created]));
        toast({ title: `Created "${created.name}"` });
      } else {
        const updated = await apiUpdateRegion(regionDraft.id, {
          name,
          sortOrder: regionDraft.sortOrder,
        });
        setRegions((p) => (p ? p.map((r) => (r.id === updated.id ? updated : r)) : p));
        toast({ title: `Saved "${updated.name}"` });
      }
      setRegionDraft(null);
    } catch (err) {
      const msg = err instanceof CountriesApiError ? err.message : "Save failed";
      toast({ title: "Save failed", description: msg, variant: "destructive" });
    } finally {
      setSavingRegion(false);
    }
  }

  async function handleDeleteRegion(): Promise<void> {
    if (!deletingRegion) return;
    const target = deletingRegion;
    setDeletingRegion(null);
    try {
      await apiDeleteRegion(target.id);
      setRegions((p) => (p ? p.filter((r) => r.id !== target.id) : p));
      // Countries that were linked to this region get their regionId
      // set to null by the FK cascade. Refresh so the dropdowns match.
      const metaRows = await listCountryMetadata();
      const byCountry: Record<string, CountryMetadata> = {};
      for (const m of metaRows) byCountry[m.countryId] = m;
      setMetaByCountry(byCountry);
      toast({ title: `Deleted "${target.name}"` });
    } catch (err) {
      const msg = err instanceof CountriesApiError ? err.message : "Delete failed";
      toast({ title: "Delete failed", description: msg, variant: "destructive" });
    }
  }

  const sortedCountries = useMemo(() => {
    if (!countryList) return [];
    return countryList.slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [countryList]);

  const sortedRegions = useMemo(() => {
    if (!regions) return null;
    return regions.slice().sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.name.localeCompare(b.name);
    });
  }, [regions]);

  const regionNameById = useMemo(() => {
    const m = new Map<number, string>();
    for (const r of regions ?? []) m.set(r.id, r.name);
    return m;
  }, [regions]);

  const featuredCount = Object.values(metaByCountry).filter((m) => m.isFeatured).length;
  const totalCountries = sortedCountries.length;

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-serif flex items-center gap-3">
            <Flag className="w-8 h-8 text-primary" />
            Countries
          </h1>
          <p className="text-muted-foreground mt-1">
            Day-to-day country management. For date-specific pinning
            (e.g. "Italy on Valentine's Day") use the{" "}
            <strong>Country of the Day</strong> page instead.
          </p>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        {/* ─── Countries section ─── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Country List</span>
              {!loadingMeta && !loadingCountryList && (
                <span className="text-sm font-normal text-muted-foreground">
                  {featuredCount} of {totalCountries} featured in rotation
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingCountryList || loadingMeta ? (
              <>
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </>
            ) : sortedCountries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No countries found. Check that the api-server is running and
                that <code className="text-xs">/api/countries</code> returns
                the mobile country list.
              </p>
            ) : (
              sortedCountries.map((country) => {
                const meta = metaByCountry[country.id];
                const isFeatured = meta?.isFeatured ?? true;
                const currentRegionId = meta?.regionId ?? null;
                return (
                  <div
                    key={country.id}
                    className="flex items-center gap-4 py-2 border-b border-border last:border-0"
                    data-testid={`country-row-${country.id}`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-3xl shrink-0" aria-hidden="true">
                        {country.flag}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold">{country.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {country.id}
                        </div>
                      </div>
                    </div>
                    <div className="w-48 shrink-0">
                      <Select
                        value={
                          currentRegionId === null
                            ? NO_REGION_VALUE
                            : String(currentRegionId)
                        }
                        onValueChange={(v) =>
                          handleChangeRegion(
                            country.id,
                            v === NO_REGION_VALUE ? null : Number(v),
                          )
                        }
                        disabled={pendingCountry === country.id}
                      >
                        <SelectTrigger
                          className="h-9"
                          data-testid={`select-region-${country.id}`}
                        >
                          <SelectValue placeholder="No region" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NO_REGION_VALUE}>
                            <span className="text-muted-foreground italic">No region</span>
                          </SelectItem>
                          {(sortedRegions ?? []).map((r) => (
                            <SelectItem key={r.id} value={String(r.id)}>
                              {r.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Checkbox
                        id={`featured-${country.id}`}
                        checked={isFeatured}
                        disabled={pendingCountry === country.id}
                        onCheckedChange={(v) =>
                          handleToggleFeatured(country.id, v === true)
                        }
                        data-testid={`checkbox-featured-${country.id}`}
                      />
                      <Label
                        htmlFor={`featured-${country.id}`}
                        className="text-sm cursor-pointer"
                      >
                        Featured
                      </Label>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* ─── Regions section ─── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Regions</span>
              <Button size="sm" onClick={openCreateRegion} data-testid="button-new-region">
                <Plus className="w-4 h-4 mr-1" />
                Add Region
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sortedRegions === null ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : sortedRegions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No regions yet. Click <strong>Add Region</strong> to create
                one, or run{" "}
                <code className="text-xs">pnpm --filter @workspace/db seed:regions</code>{" "}
                to load the starter set.
              </p>
            ) : (
              <div className="space-y-1">
                {sortedRegions.map((region) => {
                  const countryCount = Object.values(metaByCountry).filter(
                    (m) => m.regionId === region.id,
                  ).length;
                  return (
                    <div
                      key={region.id}
                      className="flex items-center gap-4 py-2 border-b border-border last:border-0"
                      data-testid={`region-row-${region.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold">{region.name}</div>
                        <div className="text-xs text-muted-foreground">
                          sort order {region.sortOrder} · {countryCount} countr
                          {countryCount === 1 ? "y" : "ies"}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditRegion(region)}
                          aria-label="Edit region"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingRegion(region)}
                          aria-label="Delete region"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Region create/edit inline form */}
        {regionDraft && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle>
                {regionDraft.id === null ? "New Region" : "Edit Region"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="region-name">Name</Label>
                <Input
                  id="region-name"
                  value={regionDraft.name}
                  onChange={(e) =>
                    setRegionDraft((p) => (p ? { ...p, name: e.target.value } : p))
                  }
                  placeholder="Southern Europe"
                  data-testid="input-region-name"
                />
              </div>
              <div>
                <Label htmlFor="region-sort">Sort Order</Label>
                <Input
                  id="region-sort"
                  type="number"
                  value={regionDraft.sortOrder}
                  onChange={(e) =>
                    setRegionDraft((p) =>
                      p ? { ...p, sortOrder: Number(e.target.value) || 0 } : p,
                    )
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Lower values appear first. Use increments of 10.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" onClick={() => setRegionDraft(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveRegion}
                  disabled={savingRegion}
                  data-testid="button-save-region"
                >
                  <Save className="w-4 h-4 mr-1" />
                  {savingRegion ? "Saving…" : "Save"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete region confirm */}
      <AlertDialog
        open={deletingRegion !== null}
        onOpenChange={(open) => !open && setDeletingRegion(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deletingRegion?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Countries currently assigned to this region will fall back to
              their hardcoded default region until you reassign them. This
              does not delete any countries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRegion}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
