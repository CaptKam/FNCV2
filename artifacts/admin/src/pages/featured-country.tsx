import { useEffect, useState, type ReactNode } from "react";
import { useGetCountries } from "@workspace/api-client-react";
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
import { CalendarClock, Plus, Pencil, Trash2 } from "lucide-react";
import {
  listFeaturedOverrides,
  upsertFeaturedOverride,
  deleteFeaturedOverride,
  type FeaturedOverride,
} from "@/lib/featuredOverridesApi";

interface EditorState {
  date: string;
  countryId: string;
  reason: string;
  /** True if editing an existing row (date is locked). */
  editingExisting: boolean;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function daysUntil(dateStr: string): number {
  const today = new Date(`${todayIsoDate()}T00:00:00Z`);
  const target = new Date(`${dateStr}T00:00:00Z`);
  return Math.round((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}

function relativeLabel(dateStr: string): string {
  const delta = daysUntil(dateStr);
  if (delta === 0) return "Today";
  if (delta === 1) return "Tomorrow";
  if (delta === -1) return "Yesterday";
  if (delta < 0) return `${Math.abs(delta)} days ago`;
  return `in ${delta} days`;
}

export default function FeaturedCountryPage() {
  const { toast } = useToast();
  const { data: countries, isLoading: loadingCountries } = useGetCountries();
  const [upcoming, setUpcoming] = useState<FeaturedOverride[]>([]);
  const [past, setPast] = useState<FeaturedOverride[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [editor, setEditor] = useState<EditorState | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<FeaturedOverride | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function refresh() {
    setIsLoading(true);
    try {
      const data = await listFeaturedOverrides();
      setUpcoming(data.upcoming);
      setPast(data.past);
    } catch (err) {
      toast({
        title: "Failed to load overrides",
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

  function openCreate() {
    setEditor({
      date: todayIsoDate(),
      countryId: countries?.[0]?.id ?? "",
      reason: "",
      editingExisting: false,
    });
  }

  function openEdit(override: FeaturedOverride) {
    setEditor({
      date: override.date,
      countryId: override.countryId,
      reason: override.reason ?? "",
      editingExisting: true,
    });
  }

  async function handleSave() {
    if (!editor) return;
    if (!editor.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      toast({
        title: "Invalid date",
        description: "Use the date picker to select a valid date.",
        variant: "destructive",
      });
      return;
    }
    if (!editor.countryId) {
      toast({
        title: "Pick a country",
        description: "Select the country to pin for this date.",
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);
    try {
      await upsertFeaturedOverride({
        date: editor.date,
        countryId: editor.countryId,
        reason: editor.reason.trim() === "" ? null : editor.reason.trim(),
      });
      toast({
        title: editor.editingExisting ? "Override updated" : "Override scheduled",
        description: `${formatDate(editor.date)} pinned to ${
          countries?.find((c) => c.id === editor.countryId)?.name ?? editor.countryId
        }`,
      });
      setEditor(null);
      await refresh();
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
      await deleteFeaturedOverride(deleteTarget.date);
      toast({ title: "Override removed", description: formatDate(deleteTarget.date) });
      setDeleteTarget(null);
      await refresh();
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

  function countryName(id: string): string {
    return countries?.find((c) => c.id === id)?.name ?? id;
  }

  function countryFlag(id: string): string {
    return countries?.find((c) => c.id === id)?.flag ?? "";
  }

  function renderRow(override: FeaturedOverride, isPast: boolean): ReactNode {
    return (
      <TableRow key={override.id} className={isPast ? "opacity-60" : ""}>
        <TableCell className="font-medium">
          {formatDate(override.date)}
          <span className="block text-xs text-muted-foreground">
            {relativeLabel(override.date)}
          </span>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <span className="text-lg">{countryFlag(override.countryId)}</span>
            <span>{countryName(override.countryId)}</span>
          </div>
        </TableCell>
        <TableCell className="max-w-[400px] text-sm text-muted-foreground">
          {override.reason ?? <span className="italic">no reason noted</span>}
        </TableCell>
        <TableCell className="text-xs text-muted-foreground">
          {override.createdBy ?? "unknown"}
        </TableCell>
        <TableCell className="text-right">
          {!isPast && (
            <Button variant="ghost" size="sm" onClick={() => openEdit(override)}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setDeleteTarget(override)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500 max-w-[1200px] mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif tracking-tight text-foreground">
            Featured Country
          </h1>
          <p className="text-muted-foreground mt-1">
            Pin a specific country to a specific date — seasonal dishes, holidays,
            partner promos. Overrides the mobile Discover tab's default
            day-of-year rotation.
          </p>
        </div>
        <Button onClick={openCreate} disabled={loadingCountries}>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Override
        </Button>
      </div>

      {/* Upcoming (including today) */}
      <div className="bg-card border border-border rounded-lg shadow-sm">
        <div className="p-4 border-b border-border bg-muted/20">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            Upcoming
            <Badge variant="outline" className="ml-1">
              {upcoming.length}
            </Badge>
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Date</TableHead>
              <TableHead className="w-[200px]">Country</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="w-[180px]">Created by</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={`up-skel-${i}`}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : upcoming.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  No upcoming overrides. The mobile Discover tab is using its default
                  day-of-year rotation.
                </TableCell>
              </TableRow>
            ) : (
              upcoming.map((o) => renderRow(o, false))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Past */}
      {(isLoading || past.length > 0) && (
        <div className="bg-card border border-border rounded-lg shadow-sm">
          <div className="p-4 border-b border-border bg-muted/20">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Past
              <Badge variant="outline" className="ml-2">
                {past.length}
              </Badge>
            </h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Date</TableHead>
                <TableHead className="w-[200px]">Country</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="w-[180px]">Created by</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {past.map((o) => renderRow(o, true))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create / edit dialog */}
      <Dialog open={editor !== null} onOpenChange={(open) => !open && setEditor(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editor?.editingExisting ? `Edit override` : "Schedule override"}
            </DialogTitle>
            <DialogDescription>
              {editor?.editingExisting
                ? "Change the pinned country or reason for this date."
                : "Pin a country to a specific date. Overrides the algorithmic default on the mobile Discover tab."}
            </DialogDescription>
          </DialogHeader>

          {editor && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="fc-date">Date</Label>
                <Input
                  id="fc-date"
                  type="date"
                  value={editor.date}
                  onChange={(e) => setEditor({ ...editor, date: e.target.value })}
                  disabled={editor.editingExisting}
                  min={editor.editingExisting ? undefined : todayIsoDate()}
                />
                {editor.editingExisting && (
                  <p className="text-xs text-muted-foreground">
                    Date is locked. To move an override, delete this one and create a new one.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fc-country">Country</Label>
                <Select
                  value={editor.countryId}
                  onValueChange={(v) => setEditor({ ...editor, countryId: v })}
                >
                  <SelectTrigger id="fc-country">
                    <SelectValue placeholder="Pick a country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="mr-2">{c.flag}</span>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fc-reason">Reason (optional)</Label>
                <Textarea
                  id="fc-reason"
                  value={editor.reason}
                  onChange={(e) => setEditor({ ...editor, reason: e.target.value })}
                  placeholder="Valentine's Day · Italian romance dinners"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  Editorial note for your own records. Not shown in the mobile app.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditor(null)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving…" : editor?.editingExisting ? "Save changes" : "Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this override?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>
                  <strong>{formatDate(deleteTarget.date)}</strong> will fall back to
                  the default day-of-year country rotation in the mobile app.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
