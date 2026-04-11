import { useGetAdminStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  UtensilsCrossed, 
  Users, 
  Globe2, 
  MapPin,
  ArrowRight,
  TrendingUp,
  Plus,
  Star,
  Settings,
  ChevronRight
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetAdminStats();

  if (isLoading) {
    return (
      <div className="p-8 space-y-8 animate-in fade-in duration-500">
        <h1 className="text-3xl font-serif tracking-tight text-foreground">Overview</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </div>
    );
  }

  const statCards = [
    { title: "Total Recipes", value: stats?.totalRecipes || 0, icon: UtensilsCrossed, color: "text-primary" },
    { title: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "text-blue-600" },
    { title: "Countries", value: stats?.totalCountries || 0, icon: Globe2, color: "text-emerald-600" },
    { title: "Regions", value: stats?.totalRegions || 0, icon: MapPin, color: "text-amber-600" },
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif tracking-tight text-foreground">Overview</h1>
          <p className="text-muted-foreground mt-1">Metrics and recent activity across the platform.</p>
        </div>
        <Button asChild>
          <Link href="/recipes/new">
            <Plus className="mr-2 h-4 w-4" />
            New Recipe
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, idx) => (
          <Card key={idx} className="border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color} opacity-80`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-serif font-bold">{stat.value.toLocaleString()}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <TrendingUp className="mr-1 h-3 w-3 text-emerald-500" />
                <span className="text-emerald-600 font-medium mr-1">+2%</span> from last month
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1 shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-serif">Recent Recipes</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">The latest additions to our culinary library.</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
              <Link href="/recipes">
                View all <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {stats?.recentRecipes?.map((recipe) => (
                <Link key={recipe.id} href={`/recipes/${recipe.id}`}>
                  <a className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 transition-colors group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <UtensilsCrossed className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{recipe.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{format(new Date(recipe.createdAt), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" />
                  </a>
                </Link>
              ))}
              {!stats?.recentRecipes?.length && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No recipes added yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 shadow-sm border-border bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2 bg-card hover:bg-primary hover:text-primary-foreground border-border hover:border-primary transition-all group" asChild>
              <Link href="/featured">
                <Star className="w-6 h-6 text-primary group-hover:text-primary-foreground mb-1" />
                <span className="font-medium">Manage Featured</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2 bg-card hover:bg-primary hover:text-primary-foreground border-border hover:border-primary transition-all group" asChild>
              <Link href="/recipes/new">
                <UtensilsCrossed className="w-6 h-6 text-primary group-hover:text-primary-foreground mb-1" />
                <span className="font-medium">Create Recipe</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2 bg-card hover:bg-primary hover:text-primary-foreground border-border hover:border-primary transition-all group" asChild>
              <Link href="/users">
                <Users className="w-6 h-6 text-primary group-hover:text-primary-foreground mb-1" />
                <span className="font-medium">View Users</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2 bg-card hover:bg-primary hover:text-primary-foreground border-border hover:border-primary transition-all group" asChild>
              <Link href="/settings">
                <Settings className="w-6 h-6 text-primary group-hover:text-primary-foreground mb-1" />
                <span className="font-medium">System Settings</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
