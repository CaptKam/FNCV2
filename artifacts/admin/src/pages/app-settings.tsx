/**
 * App Settings admin page.
 *
 * Every row in the `app_settings` table, grouped by category, with
 * a type-appropriate input: number, string, or JSON array.
 *
 * Each input has a "Save" button that PATCHes the row. We don't
 * save on blur because JSON arrays can be partially edited in
 * unsafe ways and we want the admin to explicitly confirm each
 * change.
 */
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Sliders, Save, RotateCcw } from "lucide-react";
import {
  listAppSettings,
  updateAppSetting,
  RemoteConfigApiError,
  type AppSetting,
} from "@/lib/remoteConfigApi";

const CATEGORY_ORDER = [
  "Gamification",
  "Cooking",
  "Planning",
  "Discovery",
  "Grocery",
  "Content",
  "Branding",
  "General",
];

function formatUpdatedAt(iso: string): string {
  try {
    const d = new Date(iso);
    const now = Date.now();
    const diffSec = Math.round((now - d.getTime()) / 1000);
    if (diffSec < 60) return "just now";
    if (diffSec < 3600) return `${Math.round(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.round(diffSec / 3600)}h ago`;
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
}

/**
 * Per-row edit state. We keep a draft value separate from the
 * committed `setting.value` so the admin can type freely without
 * firing a PATCH on every keystroke.
 */
interface RowState {
  draft: string;
  saving: boolean;
}

export default function AppSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AppSetting[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<string, RowState>>({});

  async function refresh(): Promise<void> {
    setError(null);
    try {
      const data = await listAppSettings();
      setSettings(data);
      const nextRows: Record<string, RowState> = {};
      for (const s of data) {
        nextRows[s.key] = { draft: s.value, saving: false };
      }
      setRows(nextRows);
    } catch (err) {
      const msg = err instanceof RemoteConfigApiError ? err.message : "Failed to load app settings";
      setError(msg);
      setSettings([]);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function setDraft(key: string, value: string): void {
    setRows((prev) => ({ ...prev, [key]: { ...(prev[key] ?? { saving: false }), draft: value } }));
  }

  function resetDraft(key: string): void {
    const s = settings?.find((x) => x.key === key);
    if (!s) return;
    setDraft(key, s.value);
  }

  async function saveRow(setting: AppSetting): Promise<void> {
    const row = rows[setting.key];
    if (!row) return;
    if (row.draft === setting.value) return;
    setRows((prev) => ({ ...prev, [setting.key]: { ...row, saving: true } }));
    try {
      const updated = await updateAppSetting(setting.key, row.draft);
      setSettings((prev) =>
        prev ? prev.map((s) => (s.key === setting.key ? updated : s)) : prev,
      );
      setRows((prev) => ({
        ...prev,
        [setting.key]: { draft: updated.value, saving: false },
      }));
      toast({
        title: `Saved "${setting.label}"`,
        description: `New value: ${updated.value.length > 60 ? updated.value.slice(0, 60) + "…" : updated.value}`,
      });
    } catch (err) {
      const msg = err instanceof RemoteConfigApiError ? err.message : "Failed to save setting";
      setRows((prev) => ({ ...prev, [setting.key]: { ...row, saving: false } }));
      toast({ title: "Save failed", description: msg, variant: "destructive" });
    }
  }

  const grouped = useMemo(() => {
    if (!settings) return [] as { category: string; rows: AppSetting[] }[];
    const map = new Map<string, AppSetting[]>();
    for (const s of settings) {
      const cat = s.category ?? "Uncategorized";
      const bucket = map.get(cat);
      if (bucket) bucket.push(s);
      else map.set(cat, [s]);
    }
    const entries = Array.from(map.entries());
    entries.sort(([a], [b]) => {
      const ia = CATEGORY_ORDER.indexOf(a);
      const ib = CATEGORY_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
    return entries.map(([category, rs]) => ({
      category,
      rows: rs.slice().sort((a, b) => a.label.localeCompare(b.label)),
    }));
  }, [settings]);

  function renderInput(setting: AppSetting) {
    const row = rows[setting.key] ?? { draft: setting.value, saving: false };
    const dirty = row.draft !== setting.value;

    // JSON array → big textarea so long arrays are readable.
    if (setting.valueType === "json_array" || setting.valueType === "json_object") {
      return (
        <div className="space-y-2">
          <Textarea
            value={row.draft}
            onChange={(e) => setDraft(setting.key, e.target.value)}
            rows={setting.valueType === "json_array" ? 3 : 5}
            className="font-mono text-xs"
            data-testid={`input-setting-${setting.key}`}
          />
          <div className="flex items-center justify-end gap-2">
            {dirty && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => resetDraft(setting.key)}
                disabled={row.saving}
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => saveRow(setting)}
              disabled={!dirty || row.saving}
              data-testid={`button-save-${setting.key}`}
            >
              <Save className="w-3 h-3 mr-1" />
              {row.saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      );
    }

    // Number or string → single-line input.
    return (
      <div className="flex items-center gap-2">
        <Input
          type={setting.valueType === "number" ? "text" : "text"}
          inputMode={setting.valueType === "number" ? "decimal" : "text"}
          value={row.draft}
          onChange={(e) => setDraft(setting.key, e.target.value)}
          className="flex-1"
          data-testid={`input-setting-${setting.key}`}
        />
        {dirty && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => resetDraft(setting.key)}
            disabled={row.saving}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        )}
        <Button
          size="sm"
          onClick={() => saveRow(setting)}
          disabled={!dirty || row.saving}
          data-testid={`button-save-${setting.key}`}
        >
          {row.saving ? "Saving…" : "Save"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-serif flex items-center gap-3">
            <Sliders className="w-8 h-8 text-primary" />
            App Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Tunable values the mobile app reads at runtime. Changes take
            effect on the next app launch (server-authoritative values
            like XP per recipe apply immediately to all users).
          </p>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        {settings === null ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              No app settings found. Run{" "}
              <code className="text-xs">pnpm --filter @workspace/db seed:remote-config</code>{" "}
              to populate the initial set.
            </CardContent>
          </Card>
        ) : (
          grouped.map(({ category, rows: rs }) => (
            <Card key={category} data-testid={`settings-category-${category}`}>
              <CardHeader>
                <CardTitle className="text-lg uppercase tracking-wide text-muted-foreground">
                  {category}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {rs.map((setting) => (
                  <div key={setting.key} className="space-y-2">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <Label className="font-semibold text-base flex items-center gap-2">
                          {setting.label}
                          <Badge variant="outline" className="font-mono text-xs">
                            {setting.key}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {setting.valueType}
                          </Badge>
                        </Label>
                        {setting.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {setting.description}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        Updated {formatUpdatedAt(setting.updatedAt)}
                      </span>
                    </div>
                    {renderInput(setting)}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
