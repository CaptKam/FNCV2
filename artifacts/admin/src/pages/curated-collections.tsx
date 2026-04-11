/**
 * Curated Collections admin page.
 *
 * Lists all collections with per-row active toggle, edit/delete
 * actions, and up/down buttons for reordering. "New Collection"
 * opens a dialog to pick title, subtitle, hero image, recipe slugs
 * (comma or newline separated), and initial active state.
 *
 * The mobile Search screen renders active collections as horizontal
 * carousels above the search results when the query is empty. Admin
 * edits take effect on next app foreground (5-min cache on the
 * public /api/curated-collections endpoint).
 */
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
} from "lucide-react";
import {
  listCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  reorderCollections,
  CuratedCollectionsApiError,
  type CuratedCollection,
} from "@/lib/curatedCollectionsApi";

const slugRegex = /^[a-z0-9-]+$/;

interface EditorState {
  id: number | null; // null = create
  slug: string;
  title: string;
  subtitle: string;
  heroImage: string;
  recipeIdsText: string; // user-editable comma/newline string
  sortOrder: number;
  isActive: boolean;
}

const EMPTY_EDITOR: EditorState = {
  id: null,
  slug: "",
  title: "",
  subtitle: "",
  heroImage: "",
  recipeIdsText: "",
  sortOrder: 0,
  isActive: true,
};

function parseRecipeIds(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function formatUpdatedAt(iso: string): string {
  try {
    const d = new Date(iso);
    const diffSec = Math.round((Date.now() - d.getTime()) / 1000);
    if (diffSec < 60) return "just now";
    if (diffSec < 3600) return `${Math.round(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.round(diffSec / 3600)}h ago`;
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
}

export default function CuratedCollectionsPage() {
  const { toast } = useToast();
  const [collections, setCollections] = useState<CuratedCollection[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<CuratedCollection | null>(null);
  const [pendingRowId, setPendingRowId] = useState<number | null>(null);

  async function refresh(): Promise<void> {
    setError(null);
    try {
      const rows = await listCollections();
      setCollections(rows);
    } catch (err) {
      const msg =
        err instanceof CuratedCollectionsApiError ? err.message : "Failed to load collections";
      setError(msg);
      setCollections([]);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function openCreate(): void {
    const maxSortOrder = (collections ?? []).reduce(
      (m, c) => Math.max(m, c.sortOrder),
      0,
    );
    setEditor({
      ...EMPTY_EDITOR,
      sortOrder: maxSortOrder + 10,
    });
  }

  function openEdit(collection: CuratedCollection): void {
    setEditor({
      id: collection.id,
      slug: collection.slug,
      title: collection.title,
      subtitle: collection.subtitle ?? "",
      heroImage: collection.heroImage ?? "",
      recipeIdsText: collection.recipeIds.join("\n"),
      sortOrder: collection.sortOrder,
      isActive: collection.isActive,
    });
  }

  async function handleSave(): Promise<void> {
    if (!editor) return;
    const title = editor.title.trim();
    if (!title) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    const recipeIds = parseRecipeIds(editor.recipeIdsText);
    setSaving(true);
    try {
      if (editor.id === null) {
        // Create path — slug is required and validated.
        const slug = editor.slug.trim();
        if (!slug || !slugRegex.test(slug)) {
          toast({
            title: "Invalid slug",
            description: "Use lowercase letters, digits, and hyphens only.",
            variant: "destructive",
          });
          setSaving(false);
          return;
        }
        const created = await createCollection({
          slug,
          title,
          subtitle: editor.subtitle.trim() || null,
          heroImage: editor.heroImage.trim() || null,
          recipeIds,
          sortOrder: editor.sortOrder,
          isActive: editor.isActive,
        });
        setCollections((prev) => (prev ? [...prev, created] : [created]));
        toast({ title: `Created "${created.title}"` });
      } else {
        const updated = await updateCollection(editor.id, {
          title,
          subtitle: editor.subtitle.trim() || null,
          heroImage: editor.heroImage.trim() || null,
          recipeIds,
          sortOrder: editor.sortOrder,
          isActive: editor.isActive,
        });
        setCollections((prev) =>
          prev ? prev.map((c) => (c.id === updated.id ? updated : c)) : prev,
        );
        toast({ title: `Saved "${updated.title}"` });
      }
      setEditor(null);
    } catch (err) {
      const msg =
        err instanceof CuratedCollectionsApiError ? err.message : "Failed to save collection";
      toast({ title: "Save failed", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!deleting) return;
    const target = deleting;
    setDeleting(null);
    try {
      await deleteCollection(target.id);
      setCollections((prev) => (prev ? prev.filter((c) => c.id !== target.id) : prev));
      toast({ title: `Deleted "${target.title}"` });
    } catch (err) {
      const msg =
        err instanceof CuratedCollectionsApiError ? err.message : "Failed to delete";
      toast({ title: "Delete failed", description: msg, variant: "destructive" });
    }
  }

  async function handleToggleActive(collection: CuratedCollection, next: boolean): Promise<void> {
    if (pendingRowId) return;
    setPendingRowId(collection.id);
    setCollections((prev) =>
      prev
        ? prev.map((c) => (c.id === collection.id ? { ...c, isActive: next } : c))
        : prev,
    );
    try {
      const updated = await updateCollection(collection.id, { isActive: next });
      setCollections((prev) =>
        prev ? prev.map((c) => (c.id === updated.id ? updated : c)) : prev,
      );
      toast({ title: `${collection.title} ${next ? "activated" : "hidden"}` });
    } catch (err) {
      const msg =
        err instanceof CuratedCollectionsApiError ? err.message : "Update failed";
      setCollections((prev) =>
        prev
          ? prev.map((c) => (c.id === collection.id ? { ...c, isActive: !next } : c))
          : prev,
      );
      toast({ title: "Update failed", description: msg, variant: "destructive" });
    } finally {
      setPendingRowId(null);
    }
  }

  async function moveRow(collection: CuratedCollection, dir: -1 | 1): Promise<void> {
    if (!collections) return;
    const sorted = [...collections].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((c) => c.id === collection.id);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx]!;
    const b = sorted[swapIdx]!;
    const nextItems = sorted.slice();
    nextItems[idx] = { ...a, sortOrder: b.sortOrder };
    nextItems[swapIdx] = { ...b, sortOrder: a.sortOrder };
    setCollections(nextItems);
    try {
      await reorderCollections([
        { id: a.id, sortOrder: b.sortOrder },
        { id: b.id, sortOrder: a.sortOrder },
      ]);
    } catch (err) {
      const msg =
        err instanceof CuratedCollectionsApiError ? err.message : "Reorder failed";
      toast({ title: "Reorder failed", description: msg, variant: "destructive" });
      refresh();
    }
  }

  const sortedCollections = useMemo(() => {
    if (!collections) return null;
    return collections.slice().sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.title.localeCompare(b.title);
    });
  }, [collections]);

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-serif flex items-center gap-3">
              <Layers className="w-8 h-8 text-primary" />
              Curated Collections
            </h1>
            <p className="text-muted-foreground mt-1">
              Editorial shelves that appear as horizontal carousels on the
              mobile Search screen when the search query is empty. Think
              Spotify's "Staff Picks" or Netflix's "Because you watched…".
            </p>
          </div>
          <Button onClick={openCreate} data-testid="button-new-collection">
            <Plus className="w-4 h-4 mr-2" />
            New Collection
          </Button>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        {sortedCollections === null ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sortedCollections.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              No collections yet. Click <strong>New Collection</strong> to add one,
              or run{" "}
              <code className="text-xs">pnpm --filter @workspace/db seed:curated-collections</code>{" "}
              to load the starter set.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedCollections.map((collection, idx) => (
              <Card key={collection.id} data-testid={`collection-${collection.slug}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {collection.heroImage ? (
                      <img
                        src={collection.heroImage}
                        alt=""
                        className="w-24 h-24 rounded-md object-cover shrink-0 bg-muted"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-semibold">{collection.title}</h3>
                            <Badge variant="outline" className="font-mono text-xs">
                              {collection.slug}
                            </Badge>
                            {!collection.isActive && (
                              <Badge variant="secondary" className="text-xs">
                                Hidden
                              </Badge>
                            )}
                          </div>
                          {collection.subtitle && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {collection.subtitle}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {collection.recipeIds.length} recipe
                            {collection.recipeIds.length === 1 ? "" : "s"} · order{" "}
                            {collection.sortOrder} · updated {formatUpdatedAt(collection.updatedAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={idx === 0}
                            onClick={() => moveRow(collection, -1)}
                            aria-label="Move up"
                            data-testid={`button-move-up-${collection.slug}`}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={idx === sortedCollections.length - 1}
                            onClick={() => moveRow(collection, 1)}
                            aria-label="Move down"
                            data-testid={`button-move-down-${collection.slug}`}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                          <Switch
                            checked={collection.isActive}
                            disabled={pendingRowId === collection.id}
                            onCheckedChange={(v) => handleToggleActive(collection, v)}
                            aria-label={collection.isActive ? "Hide collection" : "Show collection"}
                            data-testid={`switch-active-${collection.slug}`}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(collection)}
                            aria-label="Edit collection"
                            data-testid={`button-edit-${collection.slug}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleting(collection)}
                            aria-label="Delete collection"
                            data-testid={`button-delete-${collection.slug}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={editor !== null} onOpenChange={(open) => !open && setEditor(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editor?.id === null ? "New Collection" : "Edit Collection"}
            </DialogTitle>
            <DialogDescription>
              Title appears on the carousel header. Subtitle is shown underneath
              in a muted tone. Hero image is an optional card background.
            </DialogDescription>
          </DialogHeader>
          {editor && (
            <div className="space-y-4">
              {editor.id === null && (
                <div>
                  <Label htmlFor="col-slug">Slug</Label>
                  <Input
                    id="col-slug"
                    value={editor.slug}
                    onChange={(e) =>
                      setEditor((p) => (p ? { ...p, slug: e.target.value } : p))
                    }
                    placeholder="quick-weeknight"
                    data-testid="input-collection-slug"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Lowercase letters, digits, hyphens only. Used as a stable
                    identifier — you can't change it after creating.
                  </p>
                </div>
              )}
              <div>
                <Label htmlFor="col-title">Title</Label>
                <Input
                  id="col-title"
                  value={editor.title}
                  onChange={(e) =>
                    setEditor((p) => (p ? { ...p, title: e.target.value } : p))
                  }
                  placeholder="Quick Weeknight Dinners"
                  data-testid="input-collection-title"
                />
              </div>
              <div>
                <Label htmlFor="col-subtitle">Subtitle</Label>
                <Input
                  id="col-subtitle"
                  value={editor.subtitle}
                  onChange={(e) =>
                    setEditor((p) => (p ? { ...p, subtitle: e.target.value } : p))
                  }
                  placeholder="30 minutes or less, start to finish"
                />
              </div>
              <div>
                <Label htmlFor="col-hero">Hero Image URL</Label>
                <Input
                  id="col-hero"
                  value={editor.heroImage}
                  onChange={(e) =>
                    setEditor((p) => (p ? { ...p, heroImage: e.target.value } : p))
                  }
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
              <div>
                <Label htmlFor="col-recipes">Recipe Slugs</Label>
                <Textarea
                  id="col-recipes"
                  value={editor.recipeIdsText}
                  onChange={(e) =>
                    setEditor((p) => (p ? { ...p, recipeIdsText: e.target.value } : p))
                  }
                  placeholder={`it-1\nfr-2\njp-3`}
                  rows={5}
                  className="font-mono text-xs"
                  data-testid="input-collection-recipes"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  One recipe slug per line (e.g. <code className="text-xs">it-1</code>,{" "}
                  <code className="text-xs">fr-3</code>). Order matters — this is
                  the order they'll appear in the carousel. Slugs must match
                  recipe ids in <code className="text-xs">artifacts/mobile/data/recipes.ts</code>.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {parseRecipeIds(editor.recipeIdsText).length} recipe
                  {parseRecipeIds(editor.recipeIdsText).length === 1 ? "" : "s"} parsed
                </p>
              </div>
              <div>
                <Label htmlFor="col-sort">Sort Order</Label>
                <Input
                  id="col-sort"
                  type="number"
                  value={editor.sortOrder}
                  onChange={(e) =>
                    setEditor((p) => (p ? { ...p, sortOrder: Number(e.target.value) || 0 } : p))
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Lower = earlier on the Search screen. Use increments of 10
                  so you can wedge new collections between existing ones
                  without renumbering everything.
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="col-active">Active</Label>
                  <p className="text-xs text-muted-foreground">
                    Hidden collections don't appear on the mobile Search screen.
                  </p>
                </div>
                <Switch
                  id="col-active"
                  checked={editor.isActive}
                  onCheckedChange={(v) =>
                    setEditor((p) => (p ? { ...p, isActive: v } : p))
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditor(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} data-testid="button-save-collection">
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleting?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the collection from the admin panel and
              the mobile Search screen. If you just want to hide it, toggle the
              Active switch instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
