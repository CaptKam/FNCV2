import { useState } from "react";
import { Link } from "wouter";
import { 
  useGetAdminRecipes, 
  useUpdateRecipeStatus, 
  useBulkUpdateRecipes, 
  useBulkDeleteRecipes,
  useDeleteAdminRecipe,
  useDuplicateRecipe,
  useToggleRecipeFeature,
  getGetAdminRecipesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  MoreHorizontal, 
  Plus, 
  Filter,
  Trash,
  Copy,
  Eye,
  EyeOff,
  Edit,
  Star
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

export default function RecipesList() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryParams = {
    page,
    limit: 20,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(statusFilter !== "all" ? { status: statusFilter } : {})
  };

  const { data, isLoading } = useGetAdminRecipes(queryParams);
  const recipes = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  const updateStatus = useUpdateRecipeStatus();
  const bulkUpdate = useBulkUpdateRecipes();
  const bulkDelete = useBulkDeleteRecipes();
  const deleteRecipe = useDeleteAdminRecipe();
  const duplicateRecipe = useDuplicateRecipe();
  const toggleFeature = useToggleRecipeFeature();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    const timer = setTimeout(() => {
      setDebouncedSearch(e.target.value);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === recipes.length && recipes.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(recipes.map(r => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkStatusUpdate = (status: "live" | "hidden" | "draft") => {
    if (selectedIds.size === 0) return;
    
    bulkUpdate.mutate(
      { data: { ids: Array.from(selectedIds), status } },
      {
        onSuccess: (res) => {
          toast({ title: `Updated ${res.count} recipes to ${status}` });
          queryClient.invalidateQueries({ queryKey: getGetAdminRecipesQueryKey(queryParams) });
          setSelectedIds(new Set());
        }
      }
    );
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} recipes?`)) return;
    
    bulkDelete.mutate(
      { data: { ids: Array.from(selectedIds) } },
      {
        onSuccess: (res) => {
          toast({ title: `Deleted ${res.count} recipes` });
          queryClient.invalidateQueries({ queryKey: getGetAdminRecipesQueryKey(queryParams) });
          setSelectedIds(new Set());
        }
      }
    );
  };

  const handleStatusUpdate = (id: string, status: "live" | "hidden" | "draft") => {
    updateStatus.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          toast({ title: "Status updated" });
          queryClient.invalidateQueries({ queryKey: getGetAdminRecipesQueryKey(queryParams) });
        }
      }
    );
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this recipe?")) return;
    deleteRecipe.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Recipe deleted" });
          queryClient.invalidateQueries({ queryKey: getGetAdminRecipesQueryKey(queryParams) });
        }
      }
    );
  };

  const handleDuplicate = (id: string) => {
    duplicateRecipe.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Recipe duplicated" });
          queryClient.invalidateQueries({ queryKey: getGetAdminRecipesQueryKey(queryParams) });
        }
      }
    );
  };

  const handleToggleFeature = (id: string) => {
    toggleFeature.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Feature status toggled" });
          queryClient.invalidateQueries({ queryKey: getGetAdminRecipesQueryKey(queryParams) });
        }
      }
    );
  };

  const getTierCount = (recipe: any) => {
    if (!recipe.steps) return 0;
    return recipe.steps.reduce((acc: number, step: any) => {
      let count = 0;
      if (step.instruction) count++;
      if (step.instructionFirstSteps) count++;
      if (step.instructionChefsTable) count++;
      return acc + count;
    }, 0);
  };

  const maxTiers = recipes.length > 0 ? Math.max(...recipes.map(r => r.steps ? r.steps.length * 3 : 0), 1) : 1;

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif tracking-tight text-foreground">Recipes</h1>
          <p className="text-muted-foreground mt-1">Manage the culinary library.</p>
        </div>
        <Button asChild>
          <Link href="/recipes/new">
            <Plus className="mr-2 h-4 w-4" />
            New Recipe
          </Link>
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/20">
          <div className="flex items-center flex-1 gap-2 w-full">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search recipes..."
                className="pl-9 bg-background"
                value={search}
                onChange={handleSearch}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[180px] bg-background">
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
              <span className="text-sm font-medium mr-2">{selectedIds.size} selected</span>
              <Button variant="outline" size="sm" onClick={() => handleBulkStatusUpdate("live")}>
                Set Live
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkStatusUpdate("draft")}>
                Set Draft
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 text-center">
                  <Checkbox 
                    checked={selectedIds.size > 0 && selectedIds.size === recipes.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tiers</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[60px] rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : recipes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No recipes found.
                  </TableCell>
                </TableRow>
              ) : (
                recipes.map((recipe) => (
                  <TableRow key={recipe.id} className={selectedIds.has(recipe.id) ? "bg-primary/5 hover:bg-primary/10" : ""}>
                    <TableCell className="text-center">
                      <Checkbox 
                        checked={selectedIds.has(recipe.id)}
                        onCheckedChange={() => toggleSelect(recipe.id)}
                        aria-label={`Select ${recipe.title}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{recipe.title}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                          {recipe.countryName || 'No Country'} • {recipe.difficulty}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{recipe.category}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={recipe.status === 'live' ? 'default' : recipe.status === 'draft' ? 'secondary' : 'outline'}
                        className={recipe.status === 'live' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                      >
                        {recipe.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary" 
                            style={{ width: `${(getTierCount(recipe) / (recipe.steps?.length ? recipe.steps.length * 3 : 1)) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {getTierCount(recipe)}/{recipe.steps?.length ? recipe.steps.length * 3 : 0}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {recipe.createdAt ? format(new Date(recipe.createdAt), 'MMM d, yyyy') : 'Unknown'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/recipes/${recipe.id}`} className="cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(recipe.id)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleFeature(recipe.id)}>
                            <Star className="mr-2 h-4 w-4" />
                            {recipe.featured ? "Unfeature" : "Feature"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {recipe.status === 'live' ? (
                            <DropdownMenuItem onClick={() => handleStatusUpdate(recipe.id, 'hidden')}>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Hide
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleStatusUpdate(recipe.id, 'live')}>
                              <Eye className="mr-2 h-4 w-4" />
                              Set Live
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(recipe.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {(page - 1) * 20 + 1} to Math.min(page * 20, total) of {total} entries
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <div className="text-sm font-medium">
                Page {page} of {totalPages}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}