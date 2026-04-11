import { useEffect, useState } from "react";
import {
  useGetCountries,
  useGetFeaturedRecipes,
  useUpdateFeaturedRecipes,
  useGetAdminRecipes,
  getGetFeaturedRecipesQueryKey,
  getGetAdminRecipesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { GripVertical, Trash, Search, Plus, Star, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function FeaturedManager() {
  const { data: countries, isLoading: loadingCountries } = useGetCountries();
  
  if (loadingCountries) {
    return (
      <div className="p-8 space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-48 mb-8" />
        <Skeleton className="h-16 w-full mb-2" />
        <Skeleton className="h-16 w-full mb-2" />
        <Skeleton className="h-16 w-full mb-2" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-serif tracking-tight text-foreground flex items-center gap-2">
          <Star className="h-8 w-8 text-primary" fill="currentColor" />
          Featured Content
        </h1>
        <p className="text-muted-foreground mt-1">Manage the top 5 featured recipes for each country.</p>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <Accordion type="single" collapsible className="w-full">
          {countries?.map((country) => (
            <CountryFeaturedSection key={country.id} country={country} />
          ))}
        </Accordion>
        {countries?.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No countries found in the database.
          </div>
        )}
      </div>
    </div>
  );
}

function CountryFeaturedSection({ country }: { country: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: featuredRecipes, isLoading } = useGetFeaturedRecipes(country.id, {
    query: {
      queryKey: getGetFeaturedRecipesQueryKey(country.id),
      enabled: isOpen,
    },
  });
  
  // Local state for optimistic UI updates before saving
  const [localRecipes, setLocalRecipes] = useState<any[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const updateFeatured = useUpdateFeaturedRecipes();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search recipes to add
  const adminRecipesParams = {
    countryId: country.id,
    search: searchQuery,
    limit: 5,
    status: "live" as const,
  };
  const { data: searchResults } = useGetAdminRecipes(adminRecipesParams, {
    query: {
      queryKey: getGetAdminRecipesQueryKey(adminRecipesParams),
      enabled: isSearching && searchQuery.length > 2,
    },
  });

  // Sync local state when fetched recipes change (and no local changes exist).
  // Previously used `useState(() => ...)` which only fires on mount, and a
  // render-body state setter which caused warnings and potential infinite
  // loops. Moving to a proper effect fixes both bugs.
  useEffect(() => {
    if (featuredRecipes && !hasChanges) {
      setLocalRecipes([...featuredRecipes]);
    }
  }, [featuredRecipes, hasChanges]);

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newRecipes = [...localRecipes];
    const temp = newRecipes[index];
    newRecipes[index] = newRecipes[index - 1];
    newRecipes[index - 1] = temp;
    setLocalRecipes(newRecipes);
    setHasChanges(true);
  };

  const handleMoveDown = (index: number) => {
    if (index === localRecipes.length - 1) return;
    const newRecipes = [...localRecipes];
    const temp = newRecipes[index];
    newRecipes[index] = newRecipes[index + 1];
    newRecipes[index + 1] = temp;
    setLocalRecipes(newRecipes);
    setHasChanges(true);
  };

  const handleRemove = (id: string) => {
    setLocalRecipes(localRecipes.filter(r => r.id !== id));
    setHasChanges(true);
  };

  const handleAdd = (recipe: any) => {
    if (localRecipes.length >= 5) {
      toast({ title: "Maximum limit reached", description: "You can only feature 5 recipes per country.", variant: "destructive" });
      return;
    }
    if (localRecipes.some(r => r.id === recipe.id)) {
      toast({ title: "Already featured", description: "This recipe is already in the featured list." });
      return;
    }
    
    setLocalRecipes([...localRecipes, { id: recipe.id, title: recipe.title, order: localRecipes.length }]);
    setHasChanges(true);
    setIsSearching(false);
    setSearchQuery("");
  };

  const handleSave = () => {
    const recipeIds = localRecipes.map(r => r.id);
    updateFeatured.mutate(
      { countryId: country.id, data: { recipeIds } },
      {
        onSuccess: () => {
          toast({ title: "Featured recipes updated", description: `Saved for ${country.name}` });
          setHasChanges(false);
          queryClient.invalidateQueries({ queryKey: ["/api/admin/featured", country.id] });
        }
      }
    );
  };

  return (
    <AccordionItem value={country.id} className="border-b border-border last:border-0 px-2">
      <AccordionTrigger 
        className="hover:no-underline py-4 px-4 rounded-md hover:bg-muted/50 transition-colors group data-[state=open]:bg-primary/5 data-[state=open]:text-primary"
        onClick={() => setIsOpen(true)}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">{country.flag}</span>
          <span className="font-serif text-lg">{country.name}</span>
          {featuredRecipes && (
            <Badge variant="secondary" className="ml-2 bg-background/50 group-data-[state=open]:bg-primary/10">
              {featuredRecipes.length}/5 Featured
            </Badge>
          )}
        </div>
      </AccordionTrigger>
      
      <AccordionContent className="pt-2 pb-6 px-4">
        {isLoading ? (
          <div className="space-y-3 pl-12">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : (
          <div className="space-y-4 pl-4 sm:pl-12">
            {/* List of current featured */}
            <div className="space-y-2">
              {localRecipes.length === 0 ? (
                <div className="p-8 text-center bg-muted/20 border border-dashed border-border rounded-lg text-muted-foreground">
                  No recipes featured yet. Search below to add some.
                </div>
              ) : (
                localRecipes.map((recipe, index) => (
                  <Card key={recipe.id} className="border-border shadow-none bg-background hover:border-primary/50 transition-colors">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="flex flex-col items-center gap-1 text-muted-foreground/50">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5 hover:text-primary" 
                          disabled={index === 0}
                          onClick={() => handleMoveUp(index)}
                        >
                          ↑
                        </Button>
                        <GripVertical className="h-4 w-4" />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5 hover:text-primary"
                          disabled={index === localRecipes.length - 1}
                          onClick={() => handleMoveDown(index)}
                        >
                          ↓
                        </Button>
                      </div>
                      
                      <div className="flex-1 font-medium text-foreground">
                        <span className="text-muted-foreground text-xs mr-3 inline-block w-4">#{index + 1}</span>
                        {recipe.title}
                      </div>
                      
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleRemove(recipe.id)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Add new section */}
            {localRecipes.length < 5 && (
              <div className="mt-6 border-t border-border pt-4">
                {!isSearching ? (
                  <Button variant="outline" className="w-full border-dashed" onClick={() => setIsSearching(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Featured Recipe
                  </Button>
                ) : (
                  <div className="space-y-3 bg-muted/20 p-4 rounded-lg border border-border">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        autoFocus
                        placeholder="Search live recipes in this country..." 
                        className="pl-9 bg-background"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    
                    {searchQuery.length > 2 && (
                      <div className="bg-background border border-border rounded-md shadow-sm max-h-60 overflow-y-auto">
                        {searchResults?.items.length === 0 ? (
                          <div className="p-3 text-sm text-center text-muted-foreground">No matches found</div>
                        ) : (
                          searchResults?.items.map(recipe => (
                            <button 
                              key={recipe.id}
                              className="w-full text-left p-3 text-sm hover:bg-muted border-b border-border last:border-0 flex justify-between items-center"
                              onClick={() => handleAdd(recipe)}
                            >
                              <span className="font-medium">{recipe.title}</span>
                              <Plus className="h-4 w-4 text-primary" />
                            </button>
                          ))
                        )}
                      </div>
                    )}
                    
                    <Button variant="ghost" size="sm" onClick={() => { setIsSearching(false); setSearchQuery(""); }} className="w-full text-muted-foreground">
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Save Action */}
            {hasChanges && (
              <div className="flex justify-end pt-4 mt-4 border-t border-border animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-amber-600 font-medium flex items-center">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mr-2 animate-pulse" />
                    Unsaved changes
                  </span>
                  <Button onClick={handleSave} disabled={updateFeatured.isPending}>
                    {updateFeatured.isPending ? "Saving..." : "Save Featured List"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}