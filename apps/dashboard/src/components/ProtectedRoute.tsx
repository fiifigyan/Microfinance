import { useAuth } from "@clerk/clerk-react";
import { Navigate, Outlet } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";

export default function ProtectedRoute() {
  const { isSignedIn, isLoaded } = useAuth();
  const profile = useCurrentUser();

  if (!isLoaded || profile === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) return <Navigate to="/login" replace />;

  if (profile === null || (profile.role !== "ADMIN" && profile.role !== "AGENT")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚫</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 text-sm">
            This dashboard is only accessible to administrators and agents.
            Contact your administrator to request access.
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
