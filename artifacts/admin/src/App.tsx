import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminLayout } from "@/components/layout/admin-layout";

// Pages
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import RecipesList from "@/pages/recipes-list";
import RecipeEditor from "@/pages/recipe-editor";
import UsersList from "@/pages/users-list";
import UserDetail from "@/pages/user-detail";
import FeaturedManager from "@/pages/featured-manager";
import Settings from "@/pages/settings";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      {/* Protected Routes wrapped in Layout */}
      <Route>
        <AdminLayout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/recipes" component={RecipesList} />
            <Route path="/recipes/:id" component={RecipeEditor} />
            <Route path="/featured" component={FeaturedManager} />
            <Route path="/users" component={UsersList} />
            <Route path="/users/:id" component={UserDetail} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </AdminLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;