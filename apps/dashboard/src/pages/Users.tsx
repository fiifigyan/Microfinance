import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { Navigate } from "react-router-dom";
import { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { UserCog, UserPlus, X } from "lucide-react";

type Role = "CUSTOMER" | "AGENT" | "ADMIN";
type StaffRole = "AGENT" | "ADMIN";

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "CUSTOMER", label: "Customer" },
  { value: "AGENT",    label: "Agent" },
  { value: "ADMIN",    label: "Admin" },
];

const ROLE_BADGE: Record<Role, string> = {
  CUSTOMER: "bg-gray-100 text-gray-600",
  AGENT:    "bg-blue-100 text-blue-700",
  ADMIN:    "bg-purple-100 text-purple-700",
};

function InviteModal({ onClose }: { onClose: () => void }) {
  const inviteStaff = useAction(api.actions.admin.inviteStaff);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", role: "AGENT" as StaffRole });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email) {
      setError("All fields are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await inviteStaff({
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        role: form.role,
        redirectUrl: window.location.origin,
      });
      setSuccess(true);
    } catch (e: any) {
      setError(e.message ?? "Failed to send invitation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">Invite Staff</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="text-center py-6 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <UserPlus size={24} className="text-green-600" />
            </div>
            <p className="font-semibold text-gray-900">Invitation sent!</p>
            <p className="text-sm text-gray-500">
              An invite email has been sent to <span className="font-medium">{form.email}</span>.
              They'll be added as <span className="font-medium">{form.role}</span> when they sign in.
            </p>
            <button
              onClick={onClose}
              className="mt-2 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">First Name</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  placeholder="Kwame"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Last Name</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  placeholder="Asante"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="kwame@example.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as StaffRole }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="AGENT">Agent</option>
                <option value="ADMIN">Admin</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Agents can approve and disburse loans. Admins have full access.
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3 mt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus size={15} />
                    Send Invite
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function Users() {
  const profile = useCurrentUser();
  const users = useQuery(api.queries.admin.getAllUsers);
  const updateRole = useMutation(api.mutations.admin.updateUserRole);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);

  if (profile && profile.role !== "ADMIN") return <Navigate to="/" replace />;

  async function handleRoleChange(userId: string, role: Role) {
    setLoading(userId);
    setError(null);
    try {
      await updateRole({ userId: userId as Id<"users">, role });
    } catch (e: any) {
      setError(e.message ?? "Failed to update role");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Users</h2>
          <p className="text-gray-500 text-sm mt-1">Manage user accounts and role assignments.</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus size={16} />
          Invite Staff
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {!users ? (
          <div className="p-10 flex justify-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-12">No users found</p>
        ) : (
          <>
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              <div className="col-span-4">User</div>
              <div className="col-span-2 text-center">Role</div>
              <div className="col-span-2 text-center">Accounts</div>
              <div className="col-span-2 text-right">Balance</div>
              <div className="col-span-2 text-right">Change Role</div>
            </div>
            <div className="divide-y divide-gray-50">
              {users.map((user) => (
                <div key={user._id} className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center">
                  <div className="col-span-4 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    {!user.clerkId && (
                      <span className="inline-block mt-0.5 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                        invite pending
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_BADGE[user.role as Role]}`}>
                      {user.role}
                    </span>
                  </div>
                  <div className="col-span-2 text-center text-sm text-gray-600">
                    {user.accountCount}
                  </div>
                  <div className="col-span-2 text-right text-sm font-medium text-gray-900">
                    GHS {user.totalBalance.toFixed(2)}
                  </div>
                  <div className="col-span-2 flex justify-end">
                    {profile?._id !== user._id ? (
                      <div className="relative">
                        <select
                          value={user.role}
                          disabled={loading === user._id}
                          onChange={(e) => handleRoleChange(user._id, e.target.value as Role)}
                          className="text-xs border border-gray-200 rounded-lg py-1.5 pl-2 pr-7 text-gray-700 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 appearance-none cursor-pointer"
                        >
                          {ROLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <UserCog size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">You</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </div>
  );
}
