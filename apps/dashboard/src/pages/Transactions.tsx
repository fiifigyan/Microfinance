import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { Navigate } from "react-router-dom";
import { useState } from "react";
import { Search, X } from "lucide-react";

const TYPE_BADGE: Record<string, string> = {
  DEPOSIT:    "bg-green-100 text-green-700",
  WITHDRAWAL: "bg-red-100 text-red-700",
  TRANSFER:   "bg-blue-100 text-blue-700",
};

const STATUS_BADGE: Record<string, string> = {
  COMPLETED: "bg-green-100 text-green-700",
  PENDING:   "bg-amber-100 text-amber-700",
  FAILED:    "bg-red-100 text-red-600",
};

const METHOD_LABEL: Record<string, string> = {
  MTN_MOMO:         "MTN MoMo",
  VODAFONE_CASH:    "Vodafone Cash",
  AIRTELTIGO_MONEY: "AirtelTigo",
  BANK_TRANSFER:    "Bank Transfer",
};

export default function Transactions() {
  const profile = useCurrentUser();
  const transactions = useQuery(api.queries.admin.getAllTransactions);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "DEPOSIT" | "WITHDRAWAL" | "TRANSFER">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "COMPLETED" | "PENDING" | "FAILED">("ALL");

  if (profile && profile.role !== "ADMIN") return <Navigate to="/" replace />;

  const filtered = transactions?.filter((tx) => {
    if (typeFilter !== "ALL" && tx.type !== typeFilter) return false;
    if (statusFilter !== "ALL" && tx.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!tx.userName.toLowerCase().includes(q) && !tx.reference.toLowerCase().includes(q) && !tx.accountNumber.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
        <p className="text-gray-500 text-sm mt-1">Most recent 100 transactions across all accounts.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, reference..."
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(["ALL", "DEPOSIT", "WITHDRAWAL", "TRANSFER"] as const).map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${typeFilter === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {t === "ALL" ? "All Types" : t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(["ALL", "COMPLETED", "PENDING", "FAILED"] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${statusFilter === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {s === "ALL" ? "All Status" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        {(search || typeFilter !== "ALL" || statusFilter !== "ALL") && (
          <button onClick={() => { setSearch(""); setTypeFilter("ALL"); setStatusFilter("ALL"); }}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
            <X size={14} /> Clear
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {!filtered ? (
          <div className="p-10 flex justify-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-12">No transactions match the filters</p>
        ) : (
          <>
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              <div className="col-span-3">Customer</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2 text-right">Amount</div>
              <div className="col-span-2">Method</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1 text-right">Date</div>
            </div>
            <div className="divide-y divide-gray-50">
              {filtered.map((tx) => (
                <div key={tx._id} className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center">
                  <div className="col-span-3 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{tx.userName}</p>
                    <p className="text-xs text-gray-400 truncate">{tx.accountNumber}</p>
                  </div>
                  <div className="col-span-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${TYPE_BADGE[tx.type] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {tx.type}
                    </span>
                  </div>
                  <div className="col-span-2 text-right">
                    <p className={`text-sm font-semibold ${tx.type === "DEPOSIT" ? "text-green-600" : "text-red-600"}`}>
                      {tx.type === "DEPOSIT" ? "+" : "−"}GHS {tx.amount.toFixed(2)}
                    </p>
                    {tx.fee > 0 && (
                      <p className="text-xs text-gray-400">Fee: GHS {tx.fee.toFixed(2)}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-600">{METHOD_LABEL[tx.method] ?? tx.method}</p>
                  </div>
                  <div className="col-span-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[tx.status] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {tx.status}
                    </span>
                  </div>
                  <div className="col-span-1 text-right">
                    <p className="text-xs text-gray-400">
                      {new Date(tx.createdAt).toLocaleDateString("en-GH", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
