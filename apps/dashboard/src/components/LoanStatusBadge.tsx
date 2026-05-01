const CONFIG: Record<string, { label: string; classes: string }> = {
  PENDING:   { label: "Pending",   classes: "bg-amber-100 text-amber-700" },
  APPROVED:  { label: "Approved",  classes: "bg-blue-100 text-blue-700" },
  DISBURSED: { label: "Disbursed", classes: "bg-indigo-100 text-indigo-700" },
  ACTIVE:    { label: "Active",    classes: "bg-green-100 text-green-700" },
  COMPLETED: { label: "Completed", classes: "bg-gray-100 text-gray-600" },
  DEFAULTED: { label: "Defaulted", classes: "bg-red-100 text-red-700" },
  REJECTED:  { label: "Rejected",  classes: "bg-red-100 text-red-600" },
};

export default function LoanStatusBadge({ status }: { status: string }) {
  const { label, classes } = CONFIG[status] ?? { label: status, classes: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${classes}`}>
      {label}
    </span>
  );
}
