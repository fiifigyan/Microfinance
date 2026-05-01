import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Link } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";
import LoanStatusBadge from "../components/LoanStatusBadge";
import { ChevronRight, CheckCircle, XCircle, Banknote } from "lucide-react";
import { Id } from "@convex/_generated/dataModel";

type LoanStatus = "PENDING" | "APPROVED" | "ACTIVE" | "COMPLETED" | "DEFAULTED" | "REJECTED";

const TABS: { key: LoanStatus; label: string; danger?: boolean }[] = [
  { key: "PENDING",   label: "Pending" },
  { key: "APPROVED",  label: "Approved" },
  { key: "ACTIVE",    label: "Active" },
  { key: "COMPLETED", label: "Completed" },
  { key: "DEFAULTED", label: "Defaulted", danger: true },
  { key: "REJECTED",  label: "Rejected" },
];

const PRODUCT_LABEL: Record<string, string> = {
  SMALL_LOAN: "Small Loan",
  INDIVIDUAL_LOAN: "Individual Loan",
  SME_LOAN: "SME Loan",
  EDUCATION_LOAN: "Education Loan",
  ASSET_FINANCING: "Asset Financing",
};

export default function Loans() {
  const [activeTab, setActiveTab] = useState<LoanStatus>("PENDING");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const profile = useCurrentUser();
  const loans = useQuery(api.queries.admin.getLoansByStatus, { status: activeTab });
  const approveLoan = useMutation(api.mutations.admin.approveLoan);
  const rejectLoan = useMutation(api.mutations.admin.rejectLoan);
  const disburseLoan = useMutation(api.mutations.admin.disburseLoan);

  const isAdmin = profile?.role === "ADMIN";

  async function handleAction(
    action: () => Promise<unknown>,
    loanId: string,
  ) {
    setLoading(loanId);
    setError(null);
    try {
      await action();
    } catch (e: any) {
      setError(e.message ?? "Action failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Loans</h2>
        <p className="text-gray-500 text-sm mt-1">Review and manage loan applications.</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? tab.danger
                  ? "bg-red-600 text-white shadow-sm"
                  : "bg-white text-gray-900 shadow-sm"
                : tab.danger
                ? "text-red-400 hover:text-red-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loans list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {!loans ? (
          <div className="p-10 flex justify-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : loans.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-12">
            No {activeTab.toLowerCase()} loans
          </p>
        ) : (
          <div className="divide-y divide-gray-50">
            {loans.map((loan) => (
              <div key={loan._id} className="px-5 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900">{loan.userName}</p>
                    <LoanStatusBadge status={loan.status} />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {loan.loanNumber} · {PRODUCT_LABEL[loan.product] ?? loan.product} · {loan.term} months
                  </p>
                  <p className="text-xs text-gray-400">{loan.userEmail}</p>
                </div>
                <div className="text-right mr-2 flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">
                    GHS {loan.principal.toLocaleString("en-GH")}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(loan.applicationDate).toLocaleDateString("en-GH")}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {loan.status === "PENDING" && (
                    <>
                      <button
                        disabled={!!loading}
                        onClick={() =>
                          handleAction(
                            () => approveLoan({ loanId: loan._id as Id<"loans"> }),
                            loan._id,
                          )
                        }
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 disabled:opacity-50 transition-colors"
                      >
                        <CheckCircle size={13} />
                        {loading === loan._id ? "..." : "Approve"}
                      </button>
                      {isAdmin && (
                        <button
                          disabled={!!loading}
                          onClick={() =>
                            handleAction(
                              () => rejectLoan({ loanId: loan._id as Id<"loans"> }),
                              loan._id,
                            )
                          }
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
                        >
                          <XCircle size={13} />
                          {loading === loan._id ? "..." : "Reject"}
                        </button>
                      )}
                    </>
                  )}
                  {loan.status === "APPROVED" && (
                    <button
                      disabled={!!loading}
                      onClick={() =>
                        handleAction(
                          () => disburseLoan({ loanId: loan._id as Id<"loans"> }),
                          loan._id,
                        )
                      }
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 disabled:opacity-50 transition-colors"
                    >
                      <Banknote size={13} />
                      {loading === loan._id ? "..." : "Disburse"}
                    </button>
                  )}
                  <Link
                    to={`/loans/${loan._id}`}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
