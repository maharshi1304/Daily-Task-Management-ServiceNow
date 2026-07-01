import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { ThemeProvider } from '@/components/theme-provider';
import { AppLayout } from '@/components/layout';
import { AuthProvider, useAuth } from '@/contexts/auth';

import LoginPage from '@/pages/login';
import NotFound from '@/pages/not-found';
import Dashboard from '@/pages/dashboard';
import IncidentsPage from '@/pages/incidents';
import IncidentDetail from '@/pages/incident-detail';
import ServiceRequestsPage from '@/pages/service-requests';
import ServiceRequestDetail from '@/pages/request-detail';
import WorkNotesPage from '@/pages/work-notes';
import WorkNoteDetail from '@/pages/work-note-detail';
import ResolutionsPage from '@/pages/resolutions';
import ResolutionDetail from '@/pages/resolution-detail';
import TeamPage from '@/pages/team';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000,
      retry: false,
    },
  },
});

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#81b5a1] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />

        <Route path="/incidents" component={IncidentsPage} />
        <Route path="/incidents/:id" component={IncidentDetail} />

        <Route path="/service-requests" component={ServiceRequestsPage} />
        <Route path="/service-requests/:id" component={ServiceRequestDetail} />

        <Route path="/work-notes" component={WorkNotesPage} />
        <Route path="/work-notes/:id" component={WorkNoteDetail} />

        <Route path="/resolutions" component={ResolutionsPage} />
        <Route path="/resolutions/:id" component={ResolutionDetail} />

        {user.role === 'manager' && (
          <Route path="/team" component={TeamPage} />
        )}

        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="opslog-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
