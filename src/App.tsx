import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { LanguageProvider } from "@/hooks/useLanguage";
import Index from "./pages/Index";
 import Auth from "./pages/Auth";
 import Privacy from "./pages/Privacy";
 import Landing from "./pages/Landing";
 import NotFound from "./pages/NotFound";
import { Analytics } from "./components/Analytics";
import { Loader2 } from "lucide-react";

// Capture invite token immediately so it survives the auth/landing redirect
if (typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search);
  const inviteToken = params.get('invite');
  if (inviteToken) {
    sessionStorage.setItem('pendingInvite', inviteToken);
  }
}

const queryClient = new QueryClient();

 // Protected route wrapper - allows authenticated users AND guests
 function ProtectedRoute({ children }: { children: React.ReactNode }) {
   const { isAuthenticated, loading, isGuest } = useAuth();
   
   if (loading) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center">
         <Loader2 className="w-8 h-8 animate-spin text-primary" />
       </div>
     );
   }
   
   if (!isAuthenticated && !isGuest) {
     return <Navigate to="/welcome" replace />;
   }
   
   return <>{children}</>;
 }
 
const App = () => (
  <QueryClientProvider client={queryClient}>
     <AuthProvider>
       <LanguageProvider>
         <TooltipProvider>
           <Toaster />
           <Sonner />
           <BrowserRouter>
              <Routes>
                <Route path="/welcome" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
           </BrowserRouter>
         </TooltipProvider>
       </LanguageProvider>
     </AuthProvider>
  </QueryClientProvider>
);

export default App;
