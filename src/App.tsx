
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import NotFound from "./pages/NotFound";

// Citizen Pages
import CitizenDashboard from "./pages/citizen/Dashboard";
import RequestPickup from "./pages/citizen/RequestPickup";
import RecyclingCenters from "./pages/citizen/RecyclingCenters";
import WasteGuide from "./pages/citizen/WasteGuide";
import Rewards from "./pages/citizen/Rewards";
import Profile from "./pages/citizen/Profile";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import PickupRequests from "./pages/admin/PickupRequests";
import BinStatus from "./pages/admin/BinStatus";
import Schedules from "./pages/admin/Schedules";
import UserManagement from "./pages/admin/UserManagement";
import Analytics from "./pages/admin/Analytics";
import Settings from "./pages/admin/Settings";

// Add dependencies
import 'leaflet/dist/leaflet.css';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ThemeProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes (requires authentication) */}
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  {/* Citizen Routes */}
                  <Route path="/dashboard" element={<CitizenDashboard />} />
                  <Route path="/request-pickup" element={<RequestPickup />} />
                  <Route path="/recycling-centers" element={<RecyclingCenters />} />
                  <Route path="/waste-guide" element={<WasteGuide />} />
                  <Route path="/rewards" element={<Rewards />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>
              </Route>
              
              {/* Admin Protected Routes */}
              <Route element={<ProtectedRoute requireAdmin />}>
                <Route element={<Layout />}>
                  {/* Admin Routes */}
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/requests" element={<PickupRequests />} />
                  <Route path="/admin/bin-status" element={<BinStatus />} />
                  <Route path="/admin/schedules" element={<Schedules />} />
                  <Route path="/admin/users" element={<UserManagement />} />
                  <Route path="/admin/analytics" element={<Analytics />} />
                  <Route path="/admin/settings" element={<Settings />} />
                </Route>
              </Route>
              
              {/* Redirect root to login or dashboard based on auth status */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              
              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
