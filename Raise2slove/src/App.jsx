import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/routes/ProtectedRoute";

import Index from "./pages/Index";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import VendorRegisterPage from "./pages/auth/VendorRegisterPage";
import CustomerDashboard from "./pages/dashboard/CustomerDashboard";
import VendorDashboard from "./pages/dashboard/VendorDashboard";
import CategoriesPage from "./pages/CategoriesPage";
import SearchPage from "./pages/SearchPage";
import CategoryPage from "./pages/CategoryPage";
import ServicePage from "./pages/ServicePage";
import VendorProfilePage from "./pages/VendorProfilePage";
import ServiceRequestPage from "./pages/ServiceRequestPage";
import OpenServiceRequestPage from "./pages/OpenServiceRequestPage";
import ReportVendorPage from "./pages/ReportVendorPage";
import ServiceRequestDetailsPage from "./pages/ServiceRequestDetailsPage";
import NotFound from "./pages/NotFound";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminVendorsPage from "./pages/admin/AdminVendorsPage";
import AdminCategoriesPage from "./pages/admin/AdminCategoriesPage";
import AdminReportsPage from "./pages/admin/AdminReportsPage";
import AdminProtectedRoute from "./routes/AdminProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/auth/vendor-register" element={<VendorRegisterPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/category/:categoryId" element={<CategoryPage />} />
        <Route path="/service/:serviceSlug" element={<ServicePage />} />
        <Route path="/vendor/:vendorId" element={<VendorProfilePage />} />
        <Route path="/request/vendor/:vendorId" element={<ServiceRequestPage />} />
        <Route path="/request/:requestId" element={<ServiceRequestDetailsPage />} />
        <Route element={<ProtectedRoute role="user" />}>
          <Route
            path="/customer/dashboard"
            element={<CustomerDashboard />}
          />
          <Route path="/open-request" element={<OpenServiceRequestPage />} />
          <Route path="/report-vendor/:vendorId" element={<ReportVendorPage />} />
        </Route>
        <Route element={<ProtectedRoute role="vendor" />}>
          <Route
            path="/vendor/dashboard"
            element={<VendorDashboard />}
          />
        </Route>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route element={<AdminProtectedRoute />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/vendors" element={<AdminVendorsPage />} />
          <Route path="/admin/categories" element={<AdminCategoriesPage />} />
          <Route path="/admin/reports" element={<AdminReportsPage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
