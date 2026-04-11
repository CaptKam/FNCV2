import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useLocation } from "wouter";
import {
  useGetAdminRecipe,
  useUpdateAdminRecipe,
  useGetCountries,
  getGetAdminRecipeQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { 
  ChevronLeft, 
  Save, 
  Plus, 
  Trash, 
  GripVertical,
  Clock,
  Globe2,
  ChefHat,
  UtensilsCrossed,
  ListOrdered
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function RecipeEditor() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recipe, isLoading } = useGetAdminRecipe(id || "", {
    query: {
      queryKey: getGetAdminRecipeQueryKey(id || ""),
      enabled: !isNew && !!id,
    },
  });
  const { data: countries } = useGetCountries();

  const updateRecipe = useUpdateAdminRecipe();

  // Form shape is a flexible superset of AdminRecipe because this
  // editor mirrors the REST payload rather than the API type. The
  // array fields (tips, ingredients, steps) use open records so the
  // admin can add/remove rows without TypeScript fighting the draft
  // state. On save we stringify back to the API shape.
  interface FormDataState {
    title: string;
    description: string;
    countryId: string;
    region: string;
    category: string;
    difficulty: string;
    prepTime: string | number;
    cookTime: string | number;
    servings: number;
    culturalNote: string;
    image: string;
    status: string;
    countryName?: string;
    tips: string[];
    ingredients: Array<Record<string, unknown>>;
    steps: Array<Record<string, unknown>>;
  }

  // Local state for editing
  const [formData, setFormData] = useState<FormDataState>({
    title: "",
    description: "",
    countryId: "",
    region: "",
    category: "Main",
    difficulty: "Standard",
    prepTime: "",
    cookTime: "",
    servings: 2,
    culturalNote: "",
    image: "",
    status: "draft",
    tips: [""],
    ingredients: [],
    steps: []
  });

  const [isDirty, setIsDirty] = useState(false);
  const initializedForId = useRef<string | null>(null);

  // Initialize form data when recipe loads
  useEffect(() => {
    if (!isNew && recipe && initializedForId.current !== recipe.id) {
      initializedForId.current = recipe.id;
      setFormData({
        title: recipe.title || "",
        description: recipe.description || "",
        countryId: recipe.countryId || "",
        region: recipe.region || "",
        category: recipe.category || "Main",
        difficulty: recipe.difficulty || "Standard",
        prepTime: recipe.prepTime || "",
        cookTime: recipe.cookTime || "",
        servings: recipe.servings || 2,
        culturalNote: recipe.culturalNote || "",
        image: recipe.image || "",
        status: recipe.status || "draft",
        tips: recipe.tips?.length ? [...recipe.tips] : [""],
        ingredients: recipe.ingredients?.length ? JSON.parse(JSON.stringify(recipe.ingredients)) : [],
        steps: recipe.steps?.length ? JSON.parse(JSON.stringify(recipe.steps)) : []
      });
      setIsDirty(false);
    }
  }, [recipe, isNew]);

  // Warn on unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    if (isNew) {
      // Create is not in the API list for this exercise, simulate it
      toast({ title: "Recipe Created", description: "This is a mockup action." });
      setIsDirty(false);
      setLocation("/recipes");
    } else {
      updateRecipe.mutate(
        // FormDataState is a flexible superset of AdminRecipeUpdate —
        // the array-field types (ingredients/steps) intentionally use
        // open records so draft editing doesn't fight the compiler.
        // At save time we coerce to the API type; the server zod
        // schema rejects anything malformed.
        { id: id!, data: formData as unknown as Parameters<typeof updateRecipe.mutate>[0]["data"] },
        {
          onSuccess: (updatedRecipe) => {
            toast({ title: "Recipe saved successfully" });
            setIsDirty(false);
            // Patch cache locally to avoid refetch cascade that overwrites edits
            queryClient.setQueryData([`/api/admin/recipes/${id}`], updatedRecipe);
          }
        }
      );
    }
  };

  const handleDiscard = () => {
    if (isDirty && !confirm("Discard all unsaved changes?")) return;
    setLocation("/recipes");
  };

  // Arrays management
  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: "", amount: "", category: "Produce" }]
    }));
    setIsDirty(true);
  };

  const updateIngredient = (index: number, field: string, value: string) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setFormData(prev => ({ ...prev, ingredients: newIngredients }));
    setIsDirty(true);
  };

  const removeIngredient = (index: number) => {
    const newIngredients = [...formData.ingredients];
    newIngredients.splice(index, 1);
    setFormData(prev => ({ ...prev, ingredients: newIngredients }));
    setIsDirty(true);
  };

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, { 
        id: `temp-${Date.now()}`,
        title: "", 
        instruction: "", 
        instructionFirstSteps: "", 
        instructionChefsTable: "",
        duration: 0 
      }]
    }));
    setIsDirty(true);
  };

  const updateStep = (index: number, field: string, value: any) => {
    const newSteps = [...formData.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setFormData(prev => ({ ...prev, steps: newSteps }));
    setIsDirty(true);
  };

  const removeStep = (index: number) => {
    const newSteps = [...formData.steps];
    newSteps.splice(index, 1);
    setFormData(prev => ({ ...prev, steps: newSteps }));
    setIsDirty(true);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === formData.steps.length - 1) return;
    
    const newSteps = [...formData.steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    const temp = newSteps[index];
    newSteps[index] = newSteps[targetIndex];
    newSteps[targetIndex] = temp;
    
    setFormData(prev => ({ ...prev, steps: newSteps }));
    setIsDirty(true);
  };

  if (isLoading && !isNew) {
    return (
      <div className="p-8 space-y-6 max-w-[1200px] mx-auto">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500 max-w-[1200px] mx-auto pb-24">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 bg-background/95 backdrop-blur z-10 py-4 -mx-8 px-8 border-b border-border/50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleDiscard} className="shrink-0">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-serif tracking-tight text-foreground flex items-center gap-3">
              {isNew ? "New Recipe" : formData.title || "Untitled Recipe"}
              {isDirty && <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">Unsaved</Badge>}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isNew ? "Drafting a new culinary experience." : `Editing ${formData.countryName || 'recipe'}`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select value={formData.status} onValueChange={(v) => handleFieldChange('status', v)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="hidden">Hidden</SelectItem>
              <SelectItem value="live">Live</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleDiscard}>Discard</Button>
          <Button onClick={handleSave} disabled={!isDirty || updateRecipe.isPending} className="min-w-[100px]">
            <Save className="w-4 h-4 mr-2" />
            {updateRecipe.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="w-full justify-start border-b border-border rounded-none h-auto p-0 bg-transparent mb-6">
          <TabsTrigger value="basic" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 px-6">
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="ingredients" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 px-6">
            Ingredients ({formData.ingredients.length})
          </TabsTrigger>
          <TabsTrigger value="steps" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 px-6">
            Steps ({formData.steps.length})
          </TabsTrigger>
          <TabsTrigger value="metadata" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 px-6">
            Metadata & Tips
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-serif">Core Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Recipe Title</Label>
                    <Input 
                      id="title" 
                      value={formData.title} 
                      onChange={(e) => handleFieldChange('title', e.target.value)} 
                      placeholder="e.g., Traditional Carbonara"
                      className="text-lg py-6"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      value={formData.description} 
                      onChange={(e) => handleFieldChange('description', e.target.value)} 
                      placeholder="A short, appetizing description..."
                      className="h-24 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="country">Country of Origin</Label>
                      <Select value={formData.countryId} onValueChange={(v) => handleFieldChange('countryId', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries?.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.flag} {c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="region">Region (Optional)</Label>
                      <Input 
                        id="region" 
                        value={formData.region} 
                        onChange={(e) => handleFieldChange('region', e.target.value)} 
                        placeholder="e.g., Lazio"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-serif">Cultural Context</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="culturalNote">Story & History</Label>
                    <Textarea 
                      id="culturalNote" 
                      value={formData.culturalNote} 
                      onChange={(e) => handleFieldChange('culturalNote', e.target.value)} 
                      placeholder="Explain the cultural significance of this dish..."
                      className="min-h-[120px]"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-serif">Categorization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(v) => handleFieldChange('category', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Breakfast">Breakfast</SelectItem>
                        <SelectItem value="Main">Main Course</SelectItem>
                        <SelectItem value="Appetizer">Appetizer</SelectItem>
                        <SelectItem value="Dessert">Dessert</SelectItem>
                        <SelectItem value="Beverage">Beverage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Difficulty Level</Label>
                    <Select value={formData.difficulty} onValueChange={(v) => handleFieldChange('difficulty', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Standard">Standard</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-serif">Logistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Prep Time</Label>
                      <div className="relative">
                        <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          value={formData.prepTime} 
                          onChange={(e) => handleFieldChange('prepTime', e.target.value)} 
                          className="pl-9"
                          placeholder="e.g., 15m"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Cook Time</Label>
                      <div className="relative">
                        <UtensilsCrossed className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          value={formData.cookTime} 
                          onChange={(e) => handleFieldChange('cookTime', e.target.value)} 
                          className="pl-9"
                          placeholder="e.g., 45m"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Servings</Label>
                    <Input 
                      type="number" 
                      value={formData.servings} 
                      onChange={(e) => handleFieldChange('servings', parseInt(e.target.value) || 1)} 
                      min={1}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ingredients" className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-serif">Ingredients List</CardTitle>
                <CardDescription>Manage the required materials.</CardDescription>
              </div>
              <Button onClick={addIngredient} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" /> Add Ingredient
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {formData.ingredients.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-border rounded-lg text-muted-foreground">
                    No ingredients added yet.
                  </div>
                ) : (
                  formData.ingredients.map((ing: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-muted/20 border border-border rounded-md group">
                      <div className="cursor-move text-muted-foreground opacity-50 hover:opacity-100">
                        <GripVertical className="h-5 w-5" />
                      </div>
                      <div className="flex-1 grid grid-cols-12 gap-3">
                        <div className="col-span-5">
                          <Input 
                            placeholder="Ingredient name (e.g., Guanciale)" 
                            value={ing.name} 
                            onChange={(e) => updateIngredient(i, 'name', e.target.value)}
                            className="bg-background"
                          />
                        </div>
                        <div className="col-span-3">
                          <Input 
                            placeholder="Amount (e.g., 200g)" 
                            value={ing.amount} 
                            onChange={(e) => updateIngredient(i, 'amount', e.target.value)}
                            className="bg-background"
                          />
                        </div>
                        <div className="col-span-4">
                          <Select value={ing.category} onValueChange={(v) => updateIngredient(i, 'category', v)}>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Produce">Produce</SelectItem>
                              <SelectItem value="Meat">Meat & Seafood</SelectItem>
                              <SelectItem value="Dairy">Dairy & Eggs</SelectItem>
                              <SelectItem value="Pantry">Pantry</SelectItem>
                              <SelectItem value="Spices">Spices & Seasonings</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeIngredient(i)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="steps" className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <ListOrdered className="h-5 w-5 text-primary" />
                  Instruction Steps
                </CardTitle>
                <CardDescription>Provide instructions across 3 complexity tiers.</CardDescription>
              </div>
              <Button onClick={addStep}>
                <Plus className="h-4 w-4 mr-2" /> Add Step
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {formData.steps.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-border rounded-lg text-muted-foreground">
                    No steps added yet.
                  </div>
                ) : (
                  formData.steps.map((step: any, i: number) => (
                    <Card key={step.id || i} className="border-border relative overflow-visible">
                      <div className="absolute -left-3 top-6 bottom-6 flex flex-col justify-between">
                        <Button variant="outline" size="icon" className="h-6 w-6 rounded-full bg-background border-border shadow-sm z-10 hover:border-primary" disabled={i === 0} onClick={() => moveStep(i, 'up')}>↑</Button>
                        <Button variant="outline" size="icon" className="h-6 w-6 rounded-full bg-background border-border shadow-sm z-10 hover:border-primary" disabled={i === formData.steps.length - 1} onClick={() => moveStep(i, 'down')}>↓</Button>
                      </div>
                      <CardHeader className="py-3 px-4 bg-muted/30 border-b border-border flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge className="bg-primary/20 text-primary border-0 font-serif">Step {i + 1}</Badge>
                          <Input 
                            placeholder="Step Title (Optional)" 
                            value={step.title || ""} 
                            onChange={(e) => updateStep(i, 'title', e.target.value)}
                            className="h-8 bg-transparent border-transparent focus-visible:ring-0 focus-visible:border-primary px-0 font-medium"
                          />
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeStep(i)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent className="p-4 space-y-6">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 text-blue-600">
                            <span className="w-2 h-2 rounded-full bg-blue-500"/>
                            First Steps (Beginner)
                          </Label>
                          <Textarea 
                            placeholder="Detailed, hand-holding instructions..." 
                            value={step.instructionFirstSteps || ""} 
                            onChange={(e) => updateStep(i, 'instructionFirstSteps', e.target.value)}
                            className="h-20 resize-none bg-blue-50/30 dark:bg-blue-950/10 focus-visible:ring-blue-500/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 text-primary">
                            <span className="w-2 h-2 rounded-full bg-primary"/>
                            Standard (Default)
                          </Label>
                          <Textarea 
                            placeholder="Normal recipe instructions..." 
                            value={step.instruction || ""} 
                            onChange={(e) => updateStep(i, 'instruction', e.target.value)}
                            className="h-20 resize-none focus-visible:ring-primary/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 text-amber-600">
                            <span className="w-2 h-2 rounded-full bg-amber-500"/>
                            Chef's Table (Advanced)
                          </Label>
                          <Textarea 
                            placeholder="Brief, professional shorthand..." 
                            value={step.instructionChefsTable || ""} 
                            onChange={(e) => updateStep(i, 'instructionChefsTable', e.target.value)}
                            className="h-16 resize-none bg-amber-50/30 dark:bg-amber-950/10 focus-visible:ring-amber-500/50"
                          />
                        </div>
                        <div className="flex gap-4 pt-2 border-t border-border">
                          <div className="w-1/3 space-y-1">
                            <Label className="text-xs">Duration (minutes)</Label>
                            <Input 
                              type="number" 
                              placeholder="0" 
                              className="h-8 text-sm"
                              value={step.duration || ""}
                              onChange={(e) => updateStep(i, 'duration', parseInt(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
                <Button onClick={addStep} variant="outline" className="w-full border-dashed py-8">
                  <Plus className="h-5 w-5 mr-2 text-muted-foreground" /> Add Step
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metadata" className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-serif">Pro Tips</CardTitle>
              <CardDescription>Advice and variations for the user.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.tips.map((tip: string, i: number) => (
                <div key={i} className="flex gap-2">
                  <Input 
                    value={tip} 
                    onChange={(e) => {
                      const newTips = [...formData.tips];
                      newTips[i] = e.target.value;
                      handleFieldChange('tips', newTips);
                    }}
                    placeholder={`Tip #${i + 1}`}
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                      const newTips = [...formData.tips];
                      newTips.splice(i, 1);
                      handleFieldChange('tips', newTips);
                    }}
                    className="text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleFieldChange('tips', [...formData.tips, ""])}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Tip
              </Button>
            </CardContent>
          </Card>
          
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-serif">Image Cover</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Cover Image URL</Label>
                <Input 
                  value={formData.image || ""} 
                  onChange={(e) => handleFieldChange('image', e.target.value)} 
                  placeholder="https://..."
                />
                {formData.image && (
                  <div className="mt-4 w-full h-48 bg-muted rounded-md overflow-hidden relative border border-border">
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlZWVlZWUiPjwvc3ZnPg==';
                    }} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}