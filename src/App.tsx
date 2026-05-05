import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TimezoneProvider } from "@/contexts/TimezoneContext";
import { ProtectedRoute } from "@/components/app/ProtectedRoute";
import { AppShell } from "@/components/app/AppShell";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Tasks from "./pages/app/Tasks";
import GroupDetail from "./pages/app/GroupDetail";
import Profile from "./pages/app/Profile";
import Prayer from "./pages/app/Prayer";
import Finance from "./pages/app/Finance";
import Habits from "./pages/app/Habits";
import Contacts from "./pages/app/Contacts";
import { Placeholder } from "./pages/app/Placeholder";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound.tsx";
import Index from "./pages/Index.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <TimezoneProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner position="top-center" />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/signup" element={<Signup />} />
              <Route path="/auth/forgot" element={<ForgotPassword />} />
              <Route path="/auth/reset-password" element={<ResetPassword />} />
              <Route path="/install" element={<Install />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<AppShell />}>
                  <Route path="/app" element={<Navigate to="/app/tasks" replace />} />
                  <Route path="/app/tasks" element={<Tasks />} />
                  <Route path="/app/tasks/:id" element={<GroupDetail />} />
                  <Route path="/app/prayer" element={<Prayer />} />
                  <Route path="/app/finance" element={<Finance />} />
                  <Route path="/app/habits" element={<Habits />} />
                  <Route path="/app/contacts" element={<Contacts />} />
                  <Route path="/app/profile" element={<Profile />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
          </TimezoneProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
