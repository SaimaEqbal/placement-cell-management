import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";

import type { ApiError } from "./api/apiError";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";

/**Purpose: one shared TanStack Query client for the whole app - every useQuery()/useMutation() in src/hooks reads/writes through this same cache, which is what lets e.g. StudentDashboard and ProfilePage reuse one ["students","me"] entry instead of each firing its own request. */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Do not refetch data if tabs switched
      staleTime: 30_000, // Data considered fresh for 30s after fetching
      // Never retry a client error (4xx) - e.g. a 404 from a bad :id in the URL
      // would otherwise be re-fetched 3 more times. Only transient 5xx/network
      // failures are worth retrying.
      retry: (failureCount, error) => {
        const status = (error as unknown as ApiError)?.status;
        if (status != null && status >= 400 && status < 500) return false;
        return failureCount < 3;
      },
    },
  },
});

/**Purpose: root component - wires the three app-wide providers (QueryClientProvider for server state, BrowserRouter for routing, AuthProvider for auth state) around <AppRoutes/>, the single source of truth for every route/page in the app (src/routes/AppRoutes.tsx). Structural change from the original prototype: this file used to hold its own useState("login")-driven page switcher and render LoginPage/RegistrationPage/StudentDashboard/SpcDashboard/VerificationPage directly. That has been replaced by react-router-dom + ProtectedRoute - those four pages now live under src/pages/{auth,student,spc,tpc,admin}/ instead.*/
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
