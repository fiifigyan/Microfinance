import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useCurrentUser } from "../hooks/useCurrentUser";
import LoanStatusBadge from "../components/LoanStatusBadge";
import { Id } from "@convex/_generated/dataModel";
import { ArrowLeft, CheckCircle, XCircle, Banknote, CalendarClock } from "lucide-react";
import { useState } from "react";

const PRODUCT_LABEL: Record<string, string> = {
  SMALL_LOAN: "Small Loan",
  INDIVIDUAL_LOAN: "Individual Loan",
  SME_LOAN: "SME Loan",
  EDUCATION_LOAN: "Education Loan",
  ASSET_FINANCING: "Asset Financing",
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start py-3 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right max-w-xs">{value}</span>
    </div>
  );
}

export default function LoanDetail() {
  const { loanId } = useParams<{ loanId: string }>();
  const navigate = useNavigate();
  const profile = useCurrentUser();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loan = useQuery(
    api.queries.admin.getLoanById,
    loanId ? { loanId: loanId as Id<"loans"> } : "skip",
  );

  const approveLoan = useMutation(api.mutations.admin.approveLoan);
  const rejectLoan = useMutation(api.mutations.admin.rejectLoan);
  const disburseLoan = useMutation(api.mutations.admin.disburseLoan);
  const extendLoan = useMutation(api.mutations.admin.extendLoan);

  const isAdmin = profile?.role === "ADMIN";
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendTerm, setExtendTerm] = useState("");
  const [extendDate, setExtendDate] = useState("");

  async function handleAction(action: () => Promise<unknown>, key: string) {
    setLoading(key);
    setError(null);
    try {
      await action();
    } catch (e: any) {
      setError(e.message ?? "Action failed");
    } finally {
      setLoading(null);
    }
  }

  async function handleExtend() {
    const term = parseInt(extendTerm, 10);
    if (!term || term < 1 || term > 120) {
      setError("Term must be between 1 and 120 months");
      return;
    }
    const newDate = extendDate ? new Date(extendDate).getTime() : undefined;
    await handleAction(
      () => extendLoan({
        loanId: loanId as Id<"loans">,
        newTerm: term,
        newFirstRepaymentDate: newDate,
      }),
      "extend",
    );
    setShowExtendModal(false);
    setExtendTerm("");
    setExtendDate("");
  }

  if (!loan) {
    return (
      <div className="p-6 flex justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalPaid = loan.repayments
    .filter((r) => r.status === "PAID")
    .reduce((s, r) => s + r.amount, 0);
  const progress = loan.totalAmount > 0 ? (totalPaid / loan.totalAmount) * 100 : 0;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Loans
      </button>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="bg-blue-900 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-blue-300 text-xs font-mono">{loan.loanNumber}</p>
            <h2 className="text-2xl font-bold mt-1">
              GHS {loan.principal.toLocaleString("en-GH")}
            </h2>
            <p className="text-blue-200 text-sm mt-1">{PRODUCT_LABEL[loan.product] ?? loan.product}</p>
          </div>
          <LoanStatusBadge status={loan.status} />
        </div>
        {loan.status === "ACTIVE" && (
          <div>
            <div className="flex justify-between text-xs text-blue-300 mb-1">
              <span>Repaid: GHS {totalPaid.toFixed(2)}</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-blue-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-400 rounded-full transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Borrower */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-5">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Borrower</h3>
        </div>
        <div className="px-5">
          <DetailRow label="Name" value={loan.userName} />
          <DetailRow label="Email" value={loan.userEmail} />
          {loan.userPhone && <DetailRow label="Phone" value={`+233 ${loan.userPhone}`} />}
        </div>
      </div>

      {/* Loan details */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-5">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Loan Details</h3>
        </div>
        <div className="px-5">
          <DetailRow label="Principal" value={`GHS ${loan.principal.toLocaleString("en-GH")}`} />
          <DetailRow label="Interest Rate" value={`${(loan.interestRate * 100).toFixed(0)}% / month`} />
          <DetailRow label="Total Interest" value={`GHS ${loan.totalInterest.toFixed(2)}`} />
          <DetailRow label="Total Amount" value={`GHS ${loan.totalAmount.toFixed(2)}`} />
          <DetailRow label="Term" value={`${loan.term} months`} />
          <DetailRow label="Monthly Payment" value={`GHS ${(loan.totalAmount / loan.term).toFixed(2)}`} />
          <DetailRow label="Purpose" value={loan.purpose} />
          <DetailRow label="Applied" value={new Date(loan.applicationDate).toLocaleDateString("en-GH", { dateStyle: "medium" })} />
          {loan.approvalDate && (
            <DetailRow label="Approved" value={new Date(loan.approvalDate).toLocaleDateString("en-GH", { dateStyle: "medium" })} />
          )}
          {loan.disbursementDate && (
            <DetailRow label="Disbursed" value={new Date(loan.disbursementDate).toLocaleDateString("en-GH", { dateStyle: "medium" })} />
          )}
          {loan.firstRepaymentDate && (
            <DetailRow label="First Repayment" value={new Date(loan.firstRepaymentDate).toLocaleDateString("en-GH", { dateStyle: "medium" })} />
          )}
        </div>
      </div>

      {/* Repayment history */}
      {loan.repayments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-5">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Repayment History ({loan.repayments.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {loan.repayments.map((r) => (
              <div key={r._id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">GHS {r.amount.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">{r.method.replace(/_/g, " ")} · {r.reference}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      r.status === "PAID"
                        ? "bg-green-100 text-green-700"
                        : r.status === "PENDING"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-600"
                    }`}
                  >
                    {r.status}
                  </span>
                  {r.paidDate && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(r.paidDate).toLocaleDateString("en-GH")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {loanId && (
        <div className="flex gap-3 flex-wrap">
          {loan.status === "PENDING" && (
            <>
              <button
                disabled={!!loading}
                onClick={() =>
                  handleAction(
                    () => approveLoan({ loanId: loanId as Id<"loans"> }),
                    "approve",
                  )
                }
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <CheckCircle size={16} />
                {loading === "approve" ? "Processing..." : "Approve Loan"}
              </button>
              {isAdmin && (
                <button
                  disabled={!!loading}
                  onClick={() =>
                    handleAction(
                      () => rejectLoan({ loanId: loanId as Id<"loans"> }),
                      "reject",
                    )
                  }
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100 disabled:opacity-50 transition-colors"
                >
                  <XCircle size={16} />
                  {loading === "reject" ? "Processing..." : "Reject Loan"}
                </button>
              )}
            </>
          )}
          {loan.status === "APPROVED" && (
            <button
              disabled={!!loading}
              onClick={() =>
                handleAction(
                  () => disburseLoan({ loanId: loanId as Id<"loans"> }),
                  "disburse",
                )
              }
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Banknote size={16} />
              {loading === "disburse" ? "Processing..." : "Disburse Funds"}
            </button>
          )}
          {(loan.status === "ACTIVE" || loan.status === "DEFAULTED") && (
            <button
              disabled={!!loading}
              onClick={() => setShowExtendModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-semibold hover:bg-amber-100 disabled:opacity-50 transition-colors"
            >
              <CalendarClock size={16} />
              Extend / Reschedule
            </button>
          )}
        </div>
      )}

      {/* Extend Loan Modal */}
      {showExtendModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Extend / Reschedule Loan</h3>
            <p className="text-sm text-gray-500 mb-4">
              Recalculates interest on remaining balance for the new term.
            </p>
            {error && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">New Term (months) *</label>
              <input
                type="number"
                min={1}
                max={120}
                value={extendTerm}
                onChange={(e) => setExtendTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 12"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">New First Repayment Date (optional)</label>
              <input
                type="date"
                value={extendDate}
                onChange={(e) => setExtendDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowExtendModal(false); setError(null); }}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={loading === "extend"}
                onClick={handleExtend}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 disabled:opacity-50"
              >
                {loading === "extend" ? "Extending..." : "Confirm Extension"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
