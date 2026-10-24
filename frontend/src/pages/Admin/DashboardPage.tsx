import { useEffect, useState } from "react";
import { Card, Badge } from "flowbite-react";
import { HiOutlineUsers, HiOutlineCheckBadge, HiOutlineExclamationCircle } from "react-icons/hi2";
import PageMeta from "../../common/PageMeta";
import { adminUsersService, type AdminStats } from "../../services/adminService";
import UserAvatar from "../../common/UserAvatar";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminUsersService.getStats().then(({ data }) => setStats(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>;
  if (!stats) return <p className="text-sm text-gray-500">Could not load stats.</p>;

  const maxRoleCount = Math.max(...stats.usersByRole.map((r) => r.count), 1);

  return (
    <>
      <PageMeta title="Admin Dashboard | Money Manager" description="Administration overview" />
      <div className="flex flex-col gap-6">
        <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">Admin Dashboard</h1>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<HiOutlineUsers className="size-5" />} label="Total users" value={stats.totalUsers} />
          <StatCard icon={<HiOutlineCheckBadge className="size-5" />} label="Verified" value={stats.verifiedUsers} tone="success" />
          <StatCard icon={<HiOutlineExclamationCircle className="size-5" />} label="Unverified" value={stats.unverifiedUsers} tone="warning" />
          <StatCard icon={<HiOutlineUsers className="size-5" />} label="Google sign-in" value={stats.googleUsers} tone="indigo" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="mb-4 font-semibold text-gray-800 dark:text-white/90">Users by role</h2>
            <div className="flex flex-col gap-3">
              {stats.usersByRole.map((r) => (
                <div key={r.role}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{r.role}</span>
                    <span className="text-gray-500 dark:text-gray-400">{r.count}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-white/10">
                    <div
                      className="h-2 rounded-full bg-brand-500"
                      style={{ width: `${(r.count / maxRoleCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 font-semibold text-gray-800 dark:text-white/90">Recent signups</h2>
            <div className="flex flex-col gap-3">
              {stats.recentUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3">
                  <UserAvatar src={u.profileAvatar} firstName={u.firstName} lastName={u.lastName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                  </div>
                  <Badge color="indigo">{u.role}</Badge>
                </div>
              ))}
              {stats.recentUsers.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">No users yet.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function StatCard({
  icon, label, value, tone = "gray",
}: { icon: React.ReactNode; label: string; value: number; tone?: "gray" | "success" | "warning" | "indigo" }) {
  const toneClasses: Record<string, string> = {
    gray: "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300",
    success: "bg-success-50 text-success-600 dark:bg-success-500/10",
    warning: "bg-warning-50 text-warning-600 dark:bg-warning-500/10",
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10",
  };
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className={`flex size-10 items-center justify-center rounded-full ${toneClasses[tone]}`}>{icon}</div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-lg font-semibold text-gray-800 dark:text-white/90">{value}</p>
        </div>
      </div>
    </Card>
  );
}