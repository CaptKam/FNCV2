import { useState } from "react";
import { useGetAdminSettings, useUpdateAdminSettings } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Copy, ShieldAlert, Key, Database, Download } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Settings() {
  const { data: settings, isLoading } = useGetAdminSettings();
  const updateSettings = useUpdateAdminSettings();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showApiKey, setShowApiKey] = useState(false);
  const DUMMY_API_KEY = "fc_live_892nf834fh983hf283hf9823h";

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-48 mb-8" />
        <Skeleton className="h-[300px] w-full rounded-xl" />
        <Skeleton className="h-[200px] w-full rounded-xl" />
      </div>
    );
  }

  const handleUpdateDefaultMeasurement = (value: string) => {
    updateSettings.mutate(
      { data: { defaultMeasurement: value } },
      {
        onSuccess: () => {
          toast({ title: "Settings updated" });
          queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
        }
      }
    );
  };

  const handleUpdateDefaultTier = (value: string) => {
    updateSettings.mutate(
      { data: { defaultCookingTier: value } },
      {
        onSuccess: () => {
          toast({ title: "Settings updated" });
          queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
        }
      }
    );
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-serif tracking-tight text-foreground">System Settings</h1>
        <p className="text-muted-foreground mt-1">Manage global app configuration and admin access.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* App Configuration */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-serif flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-primary" />
              App Configuration
            </CardTitle>
            <CardDescription>Default settings applied to new users.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Default Measurement System</label>
                <Select value={settings?.defaultMeasurement} onValueChange={handleUpdateDefaultMeasurement}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select system" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">Metric (g, ml, °C)</SelectItem>
                    <SelectItem value="imperial">Imperial (oz, cups, °F)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">New users will start with this system.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Default Cooking Tier</label>
                <Select value={settings?.defaultCookingTier} onValueChange={handleUpdateDefaultTier}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">The default complexity level for recipe instructions.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Accounts */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-serif flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-primary" />
              Admin Accounts
            </CardTitle>
            <CardDescription>Users with access to this editorial control room.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings?.admins.map((admin, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{admin.email}</TableCell>
                      <TableCell>
                        <Badge variant={admin.role === 'superadmin' ? 'default' : 'secondary'}>
                          {admin.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" disabled={admin.role === 'superadmin'}>
                          Revoke
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">Invite Admin</Button>
          </CardFooter>
        </Card>

        {/* Database & API */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-serif flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Database & API
            </CardTitle>
            <CardDescription>System statistics and integration keys.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4 pb-6 border-b border-border/50">
              <div className="text-center p-4 bg-muted/30 rounded-lg border border-border">
                <div className="text-2xl font-serif font-bold text-foreground">{settings?.totalRecipes}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Recipes</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg border border-border">
                <div className="text-2xl font-serif font-bold text-foreground">{settings?.totalUsers}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Users</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg border border-border">
                <div className="text-2xl font-serif font-bold text-foreground">{settings?.totalCountries}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Countries</div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <Key className="w-4 h-4" /> Production API Key
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input 
                    type={showApiKey ? "text" : "password"} 
                    value={DUMMY_API_KEY} 
                    readOnly 
                    className="font-mono bg-muted/30 pr-10"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-0 top-0 h-full text-muted-foreground hover:text-foreground"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <Button variant="secondary" onClick={() => handleCopy(DUMMY_API_KEY)}>
                  <Copy className="w-4 h-4 mr-2" /> Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Keep this key secret. It provides full access to the Fork & Compass content API.</p>
            </div>
            
            <div className="pt-4 flex gap-4">
              <Button variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" /> Export Recipe Backup
              </Button>
              <Button variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" /> Export User Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Settings2(props: any) {
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
      <path d="M20 7h-9" />
      <path d="M14 17H5" />
      <circle cx="17" cy="17" r="3" />
      <circle cx="7" cy="7" r="3" />
    </svg>
  );
}