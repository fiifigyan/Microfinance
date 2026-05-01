import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Link } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";
import LoanStatusBadge from "../components/LoanStatusBadge";
import { Clock, CheckCircle, TrendingUp, Award, DollarSign, ChevronRight, AlertTriangle, ShieldCheck, Banknote } from "lucide-react";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

export default function Overview() {
  const stats = useQuery(api.queries.admin.getAdminStats);
  const pendingLoans = useQuery(api.queries.admin.getLoansByStatus, { status: "PENDING" });
  const profile = useCurrentUser();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Good day, {profile?.firstName ?? "..."}
        </h2>
        <p className="text-gray-500 text-sm mt-1">Here's what needs your attention today.</p>
      </div>

      {/* Stats row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Pending Loans"  value={stats?.pendingCount ?? "—"}   icon={Clock}          color="bg-amber-100 text-amber-600" />
        <StatCard label="Approved"       value={stats?.approvedCount ?? "—"}  icon={CheckCircle}    color="bg-blue-100 text-blue-600" />
        <StatCard label="Active Loans"   value={stats?.activeCount ?? "—"}    icon={TrendingUp}     color="bg-green-100 text-green-600" />
        <StatCard label="Completed"      value={stats?.completedCount ?? "—"} icon={Award}          color="bg-gray-100 text-gray-600" />
      </div>

      {/* Stats row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Defaulted Loans"
          value={stats?.defaultedCount ?? "—"}
          icon={AlertTriangle}
          color="bg-red-100 text-red-500"
        />
        <StatCard
          label="KYC Pending"
          value={stats?.kycPendingCount ?? "—"}
          icon={ShieldCheck}
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          label="Total Collected"
          value={stats ? `GHS ${stats.totalCollected.toLocaleString("en-GH", { minimumFractionDigits: 2 })}` : "—"}
          icon={Banknote}
          color="bg-emerald-100 text-emerald-600"
        />
      </div>

      {/* Total disbursed */}
      {stats && (
        <div className="bg-blue-900 rounded-xl p-5 mb-8 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-700 rounded-xl flex items-center justify-center">
            <DollarSign size={22} className="text-white" />
          </div>
          <div>
            <p className="text-blue-200 text-sm">Total Disbursed Principal</p>
            <p className="text-white text-2xl font-bold">
              GHS {stats.totalDisbursedPrincipal.toLocaleString("en-GH", { minimumFractionDigits: 2 })}
            </p>
          </div>
          {stats.totalCollected > 0 && (
            <div className="ml-auto text-right">
              <p className="text-blue-200 text-sm">Recovery Rate</p>
              <p className="text-white text-xl font-bold">
                {Math.min(100, Math.round((stats.totalCollected / stats.totalDisbursedPrincipal) * 100))}%
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pending loans queue */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Pending Loan Applications</h3>
          <Link to="/loans" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
            View all <ChevronRight size={14} />
          </Link>
        </div>
        {!pendingLoans ? (
          <div className="p-8 flex justify-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pendingLoans.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-10">No pending applications</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {pendingLoans.slice(0, 8).map((loan) => (
              <Link
                key={loan._id}
                to={`/loans/${loan._id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{loan.userName}</p>
                  <p className="text-xs text-gray-400 truncate">{loan.loanNumber} · {loan.product.replace(/_/g, " ")}</p>
                </div>
                <div className="text-right mr-3">
                  <p className="text-sm font-semibold text-gray-900">
                    GHS {loan.principal.toLocaleString("en-GH")}
                  </p>
                  <p className="text-xs text-gray-400">{loan.term}m</p>
                </div>
                <LoanStatusBadge status={loan.status} />
                <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
