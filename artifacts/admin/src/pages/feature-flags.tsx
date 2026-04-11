/**
 * Feature Flags admin page.
 *
 * Shows every flag in the `feature_flags` table grouped by category
 * with an inline Switch for each. Flipping a switch PATCHes the
 * server, shows a toast, and optimistically updates local state so
 * the UI never flickers.
 *
 * The "New flag" button opens a dialog for creating flags at runtime
 * — useful for features added after the initial seed.
 */
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, ToggleLeft } from "lucide-react";
import {
  listFeatureFlags,
  updateFeatureFlag,
  createFeatureFlag,
  RemoteConfigApiError,
  type FeatureFlag,
} from "@/lib/remoteConfigApi";

// Order categories top-to-bottom. Anything not listed falls to the
// end of the list alphabetically.
const CATEGORY_ORDER = [
  "Gamification",
  "Cooking",
  "Planning",
  "Discovery",
  "Social",
  "Grocery",
  "UX",
  "Education",
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

interface NewFlagFormState {
  key: string;
  label: string;
  description: string;
  category: string;
  enabled: boolean;
}

const EMPTY_NEW_FLAG: NewFlagFormState = {
  key: "",
  label: "",
  description: "",
  category: "",
  enabled: true,
};

export default function FeatureFlagsPage() {
  const { toast } = useToast();
  const [flags, setFlags] = useState<FeatureFlag[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newFlag, setNewFlag] = useState<NewFlagFormState>(EMPTY_NEW_FLAG);
  const [creating, setCreating] = useState(false);

  async function refresh(): Promise<void> {
    setError(null);
    try {
      const rows = await listFeatureFlags();
      setFlags(rows);
    } catch (err) {
      const msg = err instanceof RemoteConfigApiError ? err.message : "Failed to load feature flags";
      setError(msg);
      setFlags([]);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleToggle(flag: FeatureFlag, next: boolean): Promise<void> {
    if (pendingKey) return;
    setPendingKey(flag.key);
    // Optimistic update — revert on error.
    setFlags((prev) =>
      prev ? prev.map((f) => (f.key === flag.key ? { ...f, enabled: next } : f)) : prev,
    );
    try {
      const updated = await updateFeatureFlag(flag.key, next);
      setFlags((prev) =>
        prev ? prev.map((f) => (f.key === flag.key ? updated : f)) : prev,
      );
      toast({
        title: `${flag.label} ${next ? "enabled" : "disabled"}`,
        description: `Flag "${flag.key}" is now ${next ? "on" : "off"}.`,
      });
    } catch (err) {
      const msg = err instanceof RemoteConfigApiError ? err.message : "Failed to update flag";
      setFlags((prev) =>
        prev ? prev.map((f) => (f.key === flag.key ? { ...f, enabled: !next } : f)) : prev,
      );
      toast({ title: "Update failed", description: msg, variant: "destructive" });
    } finally {
      setPendingKey(null);
    }
  }

  async function handleCreate(): Promise<void> {
    if (!newFlag.key.trim() || !newFlag.label.trim()) {
      toast({
        title: "Key and label are required",
        variant: "destructive",
      });
      return;
    }
    if (!/^[a-z0-9_]+$/.test(newFlag.key)) {
      toast({
        title: "Invalid key format",
        description: "Use lowercase letters, digits, and underscores only.",
        variant: "destructive",
      });
      return;
    }
    setCreating(true);
    try {
      const created = await createFeatureFlag({
        key: newFlag.key.trim(),
        label: newFlag.label.trim(),
        description: newFlag.description.trim() || null,
        category: newFlag.category.trim() || null,
        enabled: newFlag.enabled,
      });
      setFlags((prev) => (prev ? [...prev, created] : [created]));
      setCreateOpen(false);
      setNewFlag(EMPTY_NEW_FLAG);
      toast({ title: `Created flag "${created.key}"` });
    } catch (err) {
      const msg = err instanceof RemoteConfigApiError ? err.message : "Failed to create flag";
      toast({ title: "Create failed", description: msg, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }

  const grouped = useMemo(() => {
    if (!flags) return [] as { category: string; flags: FeatureFlag[] }[];
    const map = new Map<string, FeatureFlag[]>();
    for (const f of flags) {
      const cat = f.category ?? "Uncategorized";
      const bucket = map.get(cat);
      if (bucket) bucket.push(f);
      else map.set(cat, [f]);
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
    return entries.map(([category, items]) => ({
      category,
      flags: items.slice().sort((a, b) => a.label.localeCompare(b.label)),
    }));
  }, [flags]);

  const enabledCount = flags?.filter((f) => f.enabled).length ?? 0;
  const totalCount = flags?.length ?? 0;

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-serif flex items-center gap-3">
              <ToggleLeft className="w-8 h-8 text-primary" />
              Feature Flags
            </h1>
            <p className="text-muted-foreground mt-1">
              Toggle features on and off for all users. Changes take effect on
              the next app launch (mobile clients cache config for 5 minutes).
            </p>
            {flags !== null && (
              <p className="text-sm text-muted-foreground mt-2">
                {enabledCount} of {totalCount} flags enabled
              </p>
            )}
          </div>
          <Button onClick={() => setCreateOpen(true)} data-testid="button-new-flag">
            <Plus className="w-4 h-4 mr-2" />
            New Flag
          </Button>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        {flags === null ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              No feature flags found. Run{" "}
              <code className="text-xs">pnpm --filter @workspace/db seed:remote-config</code>{" "}
              to populate the initial set.
            </CardContent>
          </Card>
        ) : (
          grouped.map(({ category, flags: items }) => (
            <Card key={category} data-testid={`flags-category-${category}`}>
              <CardHeader>
                <CardTitle className="text-lg uppercase tracking-wide text-muted-foreground">
                  {category}
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-border">
                {items.map((flag) => (
                  <div
                    key={flag.key}
                    className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{flag.label}</span>
                        <Badge variant="outline" className="font-mono text-xs">
                          {flag.key}
                        </Badge>
                      </div>
                      {flag.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {flag.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Updated {formatUpdatedAt(flag.updatedAt)}
                        {flag.updatedBy ? ` by ${flag.updatedBy}` : ""}
                      </p>
                    </div>
                    <Switch
                      checked={flag.enabled}
                      disabled={pendingKey === flag.key}
                      onCheckedChange={(v) => handleToggle(flag, v)}
                      data-testid={`switch-flag-${flag.key}`}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Feature Flag</DialogTitle>
            <DialogDescription>
              Add a flag for a feature added after the initial seed. The key
              must be lowercase letters, digits, and underscores only.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="flag-key">Key</Label>
              <Input
                id="flag-key"
                value={newFlag.key}
                onChange={(e) => setNewFlag((p) => ({ ...p, key: e.target.value }))}
                placeholder="e.g. new_dessert_mode"
                data-testid="input-flag-key"
              />
            </div>
            <div>
              <Label htmlFor="flag-label">Label</Label>
              <Input
                id="flag-label"
                value={newFlag.label}
                onChange={(e) => setNewFlag((p) => ({ ...p, label: e.target.value }))}
                placeholder="Human-readable name"
                data-testid="input-flag-label"
              />
            </div>
            <div>
              <Label htmlFor="flag-description">Description</Label>
              <Textarea
                id="flag-description"
                value={newFlag.description}
                onChange={(e) => setNewFlag((p) => ({ ...p, description: e.target.value }))}
                placeholder="What does this flag control?"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="flag-category">Category</Label>
              <Input
                id="flag-category"
                value={newFlag.category}
                onChange={(e) => setNewFlag((p) => ({ ...p, category: e.target.value }))}
                placeholder="e.g. Cooking"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="flag-enabled">Enabled on create</Label>
              <Switch
                id="flag-enabled"
                checked={newFlag.enabled}
                onCheckedChange={(v) => setNewFlag((p) => ({ ...p, enabled: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating} data-testid="button-create-flag">
              {creating ? "Creating…" : "Create flag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
