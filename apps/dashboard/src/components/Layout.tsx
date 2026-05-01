import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  LayoutDashboard,
  FileText,
  Users,
  ArrowLeftRight,
  LogOut,
  ShieldCheck,
} from "lucide-react";

export default function Layout() {
  const { signOut } = useAuth();
  const profile = useCurrentUser();
  const isAdmin = profile?.role === "ADMIN";
  const stats = useQuery(api.queries.admin.getAdminStats);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? "bg-blue-700 text-white"
        : "text-blue-100 hover:bg-blue-700/50 hover:text-white"
    }`;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-blue-900 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-blue-800">
          <h1 className="text-white font-bold text-lg">Microfinance</h1>
          <p className="text-blue-300 text-xs mt-0.5">Admin Dashboard</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <NavLink to="/" end className={navLinkClass}>
            <LayoutDashboard size={18} />
            Overview
          </NavLink>
          <NavLink to="/loans" className={navLinkClass}>
            <FileText size={18} />
            Loans
          </NavLink>
          <NavLink to="/kyc" className={navLinkClass}>
            <ShieldCheck size={18} />
            KYC
            {!!stats?.kycPendingCount && stats.kycPendingCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {stats.kycPendingCount}
              </span>
            )}
          </NavLink>
          {isAdmin && (
            <>
              <NavLink to="/users" className={navLinkClass}>
                <Users size={18} />
                Users
              </NavLink>
              <NavLink to="/transactions" className={navLinkClass}>
                <ArrowLeftRight size={18} />
                Transactions
              </NavLink>
            </>
          )}
        </nav>

        {/* User info */}
        <div className="px-3 py-4 border-t border-blue-800">
          <div className="flex items-center gap-2 px-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {profile
                ? `${profile.firstName[0]}${profile.lastName[0]}`
                : "?"}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {profile ? `${profile.firstName} ${profile.lastName}` : "..."}
              </p>
              <p className="text-blue-300 text-xs truncate">
                {profile?.role ?? ""}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-blue-100 hover:bg-blue-700/50 hover:text-white transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
