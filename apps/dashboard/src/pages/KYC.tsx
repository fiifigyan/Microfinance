import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { CheckCircle, XCircle, Clock, ChevronDown } from "lucide-react";
import { useState } from "react";

type StatusFilter = "PENDING" | "APPROVED" | "REJECTED" | "ALL";

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
};

const DOC_LABEL: Record<string, string> = {
  NATIONAL_ID: "National ID",
  PASSPORT: "Passport",
  DRIVERS_LICENSE: "Driver's License",
  VOTERS_CARD: "Voter's Card",
};

export default function KYC() {
  const [filter, setFilter] = useState<StatusFilter>("PENDING");
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const docs = useQuery(
    api.queries.kyc.getAllKyc,
    filter === "ALL" ? {} : { status: filter as "PENDING" | "APPROVED" | "REJECTED" },
  );

  const reviewKyc = useMutation(api.mutations.kyc.reviewKyc);

  async function handleReview() {
    if (!reviewId) return;
    setLoading(true);
    setError(null);
    try {
      await reviewKyc({
        kycId: reviewId as Id<"kycDocuments">,
        decision,
        note: note.trim() || undefined,
      });
      setReviewId(null);
      setNote("");
    } catch (e: any) {
      setError(e.message ?? "Failed to submit review");
    } finally {
      setLoading(false);
    }
  }

  const reviewDoc = docs?.find((d) => d._id === reviewId);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KYC Verification</h1>
          <p className="text-sm text-gray-500 mt-1">Review and approve customer identity documents</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(["PENDING", "APPROVED", "REJECTED", "ALL"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === s ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {docs === undefined ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Clock size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No {filter === "ALL" ? "" : filter.toLowerCase()} submissions</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Document</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name on Doc</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Submitted</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {docs.map((doc) => (
                <tr key={doc._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-gray-900">{doc.userName}</p>
                    <p className="text-xs text-gray-400">{doc.userEmail}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-gray-800">{DOC_LABEL[doc.documentType] ?? doc.documentType}</p>
                    <p className="text-xs text-gray-400 font-mono">{doc.documentNumber}</p>
                  </td>
                  <td className="px-5 py-3.5 text-gray-700">{doc.fullName}</td>
                  <td className="px-5 py-3.5 text-gray-500">
                    {new Date(doc.submittedAt).toLocaleDateString("en-GH", { dateStyle: "medium" })}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[doc.status]}`}>
                      {doc.status}
                    </span>
                    {doc.reviewNote && (
                      <p className="text-xs text-gray-400 mt-1 max-w-xs truncate" title={doc.reviewNote}>
                        {doc.reviewNote}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {doc.status === "PENDING" && (
                      <button
                        onClick={() => { setReviewId(doc._id); setDecision("APPROVED"); setNote(""); setError(null); }}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Review
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      {reviewId && reviewDoc && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Review KYC Submission</h3>
            <p className="text-sm text-gray-500 mb-4">
              {reviewDoc.userName} · {DOC_LABEL[reviewDoc.documentType]}
            </p>

            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Document Number</span>
                <span className="font-mono font-medium text-gray-800">{reviewDoc.documentNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Full Name</span>
                <span className="font-medium text-gray-800">{reviewDoc.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date of Birth</span>
                <span className="font-medium text-gray-800">{reviewDoc.dateOfBirth}</span>
              </div>
            </div>

            {error && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setDecision("APPROVED")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                  decision === "APPROVED"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <CheckCircle size={15} /> Approve
              </button>
              <button
                onClick={() => setDecision("REJECTED")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                  decision === "REJECTED"
                    ? "border-red-400 bg-red-50 text-red-600"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <XCircle size={15} /> Reject
              </button>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note {decision === "REJECTED" ? "(required)" : "(optional)"}
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={decision === "REJECTED" ? "Reason for rejection..." : "Any notes for the customer..."}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setReviewId(null); setError(null); }}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={loading || (decision === "REJECTED" && !note.trim())}
                onClick={handleReview}
                className={`flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-colors ${
                  decision === "APPROVED"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {loading ? "Saving..." : decision === "APPROVED" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
