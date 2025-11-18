import { Switch, Route } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Adiantamentos from "@/pages/adiantamentos";
import Reembolsos from "@/pages/reembolsos";
import Passagens from "@/pages/passagens";
import Hospedagens from "@/pages/hospedagens";
import type { User } from "@shared/schema";

// Placeholder pages for routes not yet implemented
const ViagensExecutadas = () => <div className="p-8"><h1 className="text-2xl font-bold" style={{ color: "#004650" }}>Viagens Executadas - Em breve</h1></div>;
const HospedagensExecutadas = () => <div className="p-8"><h1 className="text-2xl font-bold" style={{ color: "#004650" }}>Hospedagens Executadas - Em breve</h1></div>;
const PrestacaoAdiantamentos = () => <div className="p-8"><h1 className="text-2xl font-bold" style={{ color: "#004650" }}>Prestação de Adiantamentos - Em breve</h1></div>;
const PrestacaoReembolsos = () => <div className="p-8"><h1 className="text-2xl font-bold" style={{ color: "#004650" }}>Prestação de Reembolsos - Em breve</h1></div>;

function AuthenticatedRouter() {
  return (
    <Switch>
      <Route path="/dashboard" component={Home} />
      <Route path="/" component={Home} />
      <Route path="/adiantamentos" component={Adiantamentos} />
      <Route path="/reembolsos" component={Reembolsos} />
      <Route path="/passagens" component={Passagens} />
      <Route path="/hospedagens" component={Hospedagens} />
      <Route path="/viagens-executadas" component={ViagensExecutadas} />
      <Route path="/hospedagens-executadas" component={HospedagensExecutadas} />
      <Route path="/prestacao-adiantamentos" component={PrestacaoAdiantamentos} />
      <Route path="/prestacao-reembolsos" component={PrestacaoReembolsos} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthChecker() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Landing />;
  }

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                {user.firstName} {user.lastName}
              </span>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-8 bg-background">
            <AuthenticatedRouter />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthChecker />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
