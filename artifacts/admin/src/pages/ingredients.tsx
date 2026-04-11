import { useEffect, useState, useMemo, type ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import {
  listIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  type Ingredient,
  type IngredientAisle,
} from "@/lib/ingredientsApi";

const AISLES: { value: IngredientAisle; label: string; tint: string }[] = [
  { value: "produce", label: "Produce", tint: "bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900" },
  { value: "protein", label: "Protein", tint: "bg-rose-100 text-rose-900 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-900" },
  { value: "dairy", label: "Dairy", tint: "bg-sky-100 text-sky-900 border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-900" },
  { value: "pantry", label: "Pantry", tint: "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900" },
  { value: "spice", label: "Spice", tint: "bg-violet-100 text-violet-900 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-900" },
];

function aisleBadge(aisle: IngredientAisle): ReactNode {
  const meta = AISLES.find((a) => a.value === aisle);
  return (
    <Badge variant="outline" className={meta?.tint ?? ""}>
      {meta?.label ?? aisle}
    </Badge>
  );
}

interface EditorState {
  id: string;
  canonicalName: string;
  aisle: IngredientAisle;
  synonymsText: string; // comma-separated, edited live
}

function parseSynonyms(text: string): string[] {
  return text
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export default function IngredientsPage() {
  const { toast } = useToast();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [aisleFilter, setAisleFilter] = useState<IngredientAisle | "all">("all");

  // Editor state: null = closed, object = open (create or edit)
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function refresh() {
    setIsLoading(true);
    try {
      const rows = await listIngredients();
      setIngredients(rows);
    } catch (err) {
      toast({
        title: "Failed to load ingredients",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ingredients.filter((ing) => {
      if (aisleFilter !== "all" && ing.aisle !== aisleFilter) return false;
      if (!q) return true;
      if (ing.canonicalName.toLowerCase().includes(q)) return true;
      if (ing.id.toLowerCase().includes(q)) return true;
      return ing.synonyms.some((s) => s.toLowerCase().includes(q));
    });
  }, [ingredients, search, aisleFilter]);

  const aisleCounts = useMemo(() => {
    const counts: Record<IngredientAisle | "total", number> = {
      produce: 0,
      protein: 0,
      dairy: 0,
      pantry: 0,
      spice: 0,
      total: ingredients.length,
    };
    for (const ing of ingredients) counts[ing.aisle]++;
    return counts;
  }, [ingredients]);

  function openCreate() {
    setEditor({
      id: "",
      canonicalName: "",
      aisle: "produce",
      synonymsText: "",
    });
    setEditorMode("create");
  }

  function openEdit(ing: Ingredient) {
    setEditor({
      id: ing.id,
      canonicalName: ing.canonicalName,
      aisle: ing.aisle,
      synonymsText: ing.synonyms.join(", "),
    });
    setEditorMode("edit");
  }

  async function handleSave() {
    if (!editor) return;
    const synonyms = parseSynonyms(editor.synonymsText);

    if (editorMode === "create") {
      if (!editor.id.match(/^[a-z0-9_]+$/)) {
        toast({
          title: "Invalid ID",
          description: "IDs must be lowercase letters, digits, or underscores only (e.g. red_onion).",
          variant: "destructive",
        });
        return;
      }
      if (!editor.canonicalName.trim()) {
        toast({
          title: "Missing canonical name",
          description: "Every ingredient needs a display name.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSaving(true);
    try {
      if (editorMode === "create") {
        const created = await createIngredient({
          id: editor.id,
          canonicalName: editor.canonicalName.trim(),
          aisle: editor.aisle,
          synonyms,
        });
        setIngredients((prev) => [...prev, created].sort((a, b) => {
          if (a.aisle !== b.aisle) return a.aisle.localeCompare(b.aisle);
          return a.canonicalName.localeCompare(b.canonicalName);
        }));
        toast({ title: "Ingredient created", description: created.canonicalName });
      } else {
        const updated = await updateIngredient(editor.id, {
          canonicalName: editor.canonicalName.trim(),
          aisle: editor.aisle,
          synonyms,
        });
        setIngredients((prev) => prev.map((ing) => (ing.id === updated.id ? updated : ing)));
        toast({ title: "Ingredient updated", description: updated.canonicalName });
      }
      setEditor(null);
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteIngredient(deleteTarget.id);
      setIngredients((prev) => prev.filter((ing) => ing.id !== deleteTarget.id));
      toast({ title: "Ingredient deleted", description: deleteTarget.canonicalName });
      setDeleteTarget(null);
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif tracking-tight text-foreground">Ingredient Taxonomy</h1>
          <p className="text-muted-foreground mt-1">
            Global canonical ingredients, aisles, and synonyms. Mobile grocery lists dedupe against this table.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Ingredient
        </Button>
      </div>

      {/* Stat row: counts per aisle */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">{aisleCounts.total}</div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mt-1">Total</div>
        </div>
        {AISLES.map((a) => (
          <div key={a.value} className="bg-card border border-border rounded-lg p-4">
            <div className="text-2xl font-bold text-foreground">{aisleCounts[a.value]}</div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mt-1">{a.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center gap-4 bg-muted/20">
          <div className="relative w-full sm:w-96 shrink-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search name, id, or synonym..."
              className="pl-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={aisleFilter} onValueChange={(v) => setAisleFilter(v as IngredientAisle | "all")}>
            <SelectTrigger className="w-full sm:w-48 bg-background">
              <SelectValue placeholder="All aisles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All aisles</SelectItem>
              {AISLES.map((a) => (
                <SelectItem key={a.value} value={a.value}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="ml-auto text-sm text-muted-foreground">
            {isLoading ? "…" : `${filtered.length} of ${ingredients.length}`}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">ID</TableHead>
                <TableHead>Canonical Name</TableHead>
                <TableHead className="w-[140px]">Aisle</TableHead>
                <TableHead>Synonyms</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    {search || aisleFilter !== "all"
                      ? "No ingredients match your filters."
                      : "No ingredients yet. Click \"New Ingredient\" to add the first one, or run the seed script."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((ing) => (
                  <TableRow key={ing.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{ing.id}</TableCell>
                    <TableCell className="font-medium">{ing.canonicalName}</TableCell>
                    <TableCell>{aisleBadge(ing.aisle)}</TableCell>
                    <TableCell className="max-w-[400px]">
                      {ing.synonyms.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">none</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {ing.synonyms.join(", ")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(ing)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteTarget(ing)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create / edit dialog */}
      <Dialog open={editor !== null} onOpenChange={(open) => !open && setEditor(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editorMode === "create" ? "New ingredient" : `Edit ${editor?.canonicalName ?? ""}`}
            </DialogTitle>
            <DialogDescription>
              {editorMode === "create"
                ? "Create a new canonical entry. Use lowercase snake_case for the ID."
                : "Update the canonical name, aisle, or synonyms. The ID is immutable."}
            </DialogDescription>
          </DialogHeader>

          {editor && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="ing-id">ID (slug)</Label>
                <Input
                  id="ing-id"
                  value={editor.id}
                  onChange={(e) => setEditor({ ...editor, id: e.target.value })}
                  disabled={editorMode === "edit"}
                  placeholder="red_onion"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Lowercase letters, digits, underscores. Immutable after creation.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ing-name">Canonical name</Label>
                <Input
                  id="ing-name"
                  value={editor.canonicalName}
                  onChange={(e) => setEditor({ ...editor, canonicalName: e.target.value })}
                  placeholder="Red Onion"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ing-aisle">Aisle</Label>
                <Select
                  value={editor.aisle}
                  onValueChange={(v) => setEditor({ ...editor, aisle: v as IngredientAisle })}
                >
                  <SelectTrigger id="ing-aisle">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AISLES.map((a) => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ing-synonyms">Synonyms (comma-separated)</Label>
                <Textarea
                  id="ing-synonyms"
                  value={editor.synonymsText}
                  onChange={(e) => setEditor({ ...editor, synonymsText: e.target.value })}
                  placeholder="red onion, onion red, purple onion"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Every alternate name that should fold into this canonical entry on mobile grocery lists.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditor(null)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving…" : editorMode === "create" ? "Create" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this ingredient?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes <strong>{deleteTarget?.canonicalName}</strong> from the taxonomy. Existing grocery items on
              user devices aren't affected, but future lookups for any of its synonyms will fall through to the regex
              fallback in the mobile app.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
