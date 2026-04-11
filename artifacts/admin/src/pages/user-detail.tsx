import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  useGetAdminUser,
  getGetAdminUserQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ChevronLeft, User, Mail, Calendar, Settings2, Globe2, ChefHat, Star } from "lucide-react";

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: user, isLoading } = useGetAdminUser(id || "", {
    query: {
      queryKey: getGetAdminUserQueryKey(id || ""),
      enabled: !!id,
    },
  });

  if (isLoading || !user) {
    return (
      <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Skeleton className="h-[400px] w-full rounded-xl" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[300px] w-full rounded-xl" />
            <Skeleton className="h-[300px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const getPlanBadgeColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'premium': return 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500';
      case 'pro': return 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground mb-4">
        <Link href="/users">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Link>
      </Button>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 border-2 border-primary/20">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-serif tracking-tight text-foreground flex items-center gap-3">
              {user.name}
              <Badge className={getPlanBadgeColor(user.subscriptionPlan)}>
                {user.subscriptionPlan}
              </Badge>
            </h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Mail className="h-4 w-4" />
              {user.email}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile & Preferences */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-serif">Cooking Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground flex items-center gap-2"><ChefHat className="h-4 w-4"/> Level</span>
                <span className="font-medium capitalize">{user.cookingLevel}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground flex items-center gap-2"><UtensilsCrossed className="h-4 w-4"/> Recipes Cooked</span>
                <span className="font-mono font-medium">{user.recipesCooked}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground flex items-center gap-2"><Globe2 className="h-4 w-4"/> Cuisines Explored</span>
                <span className="font-mono font-medium">{user.cuisinesExplored}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4"/> Joined</span>
                <span className="font-medium">{format(new Date(user.joinedAt), 'MMM yyyy')}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4"/> Last Active</span>
                <span className="font-medium">{format(new Date(user.lastActiveAt), 'MMM d, yyyy')}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-serif flex items-center gap-2">
                <Settings2 className="h-5 w-5" /> Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground">Measurement</span>
                <Badge variant="outline">{user.measurementSystem || 'Metric'}</Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground">Temperature</span>
                <Badge variant="outline">{user.temperatureUnit || 'Celsius'}</Badge>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Grocery Partner</span>
                <span className="font-medium">{user.groceryPartner || 'None'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: History & Feedback */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border shadow-sm h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg font-serif">Cooking History</CardTitle>
              <CardDescription>Recent recipes completed by this user</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {user.history && user.history.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipe</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-right">Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user.history.map((entry, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">
                          <Link href={`/recipes/${entry.recipeId}`} className="hover:text-primary hover:underline">
                            {entry.recipeTitle}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(entry.completedAt), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {entry.cookTimeMinutes}m
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 text-amber-500">
                            {entry.rating} <Star className="h-3 w-3 fill-current" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="h-32 flex items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
                  No cooking history yet
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-serif">Feedback & Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              {user.feedback && user.feedback.length > 0 ? (
                <div className="space-y-4">
                  {user.feedback.map((fb, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-muted/30 border border-border">
                      <div className="flex justify-between items-start mb-2">
                        <Link href={`/recipes/${fb.recipeId}`} className="font-medium hover:text-primary hover:underline">
                          {fb.recipeTitle}
                        </Link>
                        <div className="flex items-center gap-1 text-amber-500 text-sm font-medium">
                          {fb.rating} <Star className="h-3 w-3 fill-current" />
                        </div>
                      </div>
                      <p className="text-sm text-foreground/80 italic">"{fb.comment}"</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(fb.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
                  No feedback provided yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Quick component for the icon since I forgot to import it at top
function UtensilsCrossed(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8" />
      <path d="M15 15 3.3 2.8a2 2 0 0 0-2.8 0 2 2 0 0 0 0 2.8L12 17" />
      <path d="m3 21 9-9" />
      <path d="m21 21-9-9" />
    </svg>
  );
}