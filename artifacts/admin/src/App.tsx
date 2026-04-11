import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { setAuthTokenGetter, ApiError } from "@workspace/api-client-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminLayout } from "@/components/layout/admin-layout";
import { getAdminToken, clearAdminToken } from "@/lib/auth";

// Pages
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import RecipesList from "@/pages/recipes-list";
import RecipeEditor from "@/pages/recipe-editor";
import UsersList from "@/pages/users-list";
import UserDetail from "@/pages/user-detail";
import FeaturedManager from "@/pages/featured-manager";
import FeaturedCountryPage from "@/pages/featured-country";
import IngredientsPage from "@/pages/ingredients";
import CuratedCollectionsPage from "@/pages/curated-collections";
import CountriesPage from "@/pages/countries";
import FeatureFlagsPage from "@/pages/feature-flags";
import AppSettingsPage from "@/pages/app-settings";
import Settings from "@/pages/settings";

// Register the auth token getter so every API request carries
// `Authorization: Bearer <token>` when a token is stored.
setAuthTokenGetter(() => getAdminToken());

// On any 401 from the API, clear the stale token so the next route
// render will redirect to /login. We can't call setLocation here
// because this runs outside React, but clearing localStorage is
// enough — the ProtectedRoute will handle the redirect on next render
// (and the QueryClient retries/re-renders will re-check).
function handleApiError(error: unknown): void {
  if (error instanceof ApiError && error.status === 401) {
    clearAdminToken();
    // Force a full reload so the ProtectedRoute below redirects to /login.
    if (typeof window !== "undefined" && !window.location.pathname.endsWith("/login")) {
      window.location.assign(
        (import.meta.env.BASE_URL.replace(/\/$/, "") || "") + "/login",
      );
    }
  }
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleApiError }),
  mutationCache: new MutationCache({ onError: handleApiError }),
});

/**
 * Gate component: if no valid token exists, redirect to /login
 * instead of rendering the children.
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const authed = getAdminToken() !== null;

  useEffect(() => {
    // Re-check on location change in case the token was cleared
    // (e.g. by a 401 handler) while a protected page was mounted.
    if (!authed) {
      // no-op; Redirect below handles it
    }
  }, [location, authed]);

  if (!authed) {
    return <Redirect to="/login" />;
  }
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />

      {/* Protected Routes wrapped in Layout */}
      <Route>
        <ProtectedRoute>
          <AdminLayout>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/recipes" component={RecipesList} />
              <Route path="/recipes/:id" component={RecipeEditor} />
              <Route path="/featured" component={FeaturedManager} />
              <Route path="/featured-country" component={FeaturedCountryPage} />
              <Route path="/countries" component={CountriesPage} />
              <Route path="/ingredients" component={IngredientsPage} />
              <Route path="/users" component={UsersList} />
              <Route path="/users/:id" component={UserDetail} />
              <Route path="/curated-collections" component={CuratedCollectionsPage} />
              <Route path="/feature-flags" component={FeatureFlagsPage} />
              <Route path="/app-settings" component={AppSettingsPage} />
              <Route path="/settings" component={Settings} />
              <Route component={NotFound} />
            </Switch>
          </AdminLayout>
        </ProtectedRoute>
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