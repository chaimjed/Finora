import { Badge } from "flowbite-react";
import { BellIcon } from "../../icons/BellIcon";

const mockNotifications = [
  { id: "1", title: "Budget exceeded", message: "You've gone over your Entertainment budget by $12.99", time: "2h ago", type: "warning", read: false },
  { id: "2", title: "Bill due tomorrow", message: "Netflix subscription ($12.99) is due tomorrow", time: "5h ago", type: "info", read: false },
  { id: "3", title: "Low balance alert", message: "Main Checking balance dropped below $500", time: "1d ago", type: "danger", read: true },
  { id: "4", title: "Payment received", message: "Freelance project payment of $450 was added", time: "2d ago", type: "success", read: true },
  { id: "5", title: "Recurring payment processed", message: "Apartment Rent ($650) was recorded automatically", time: "3d ago", type: "success", read: true },
];

const TYPE_STYLES: Record<string, { badge: string; icon: string }> = {
  warning: { badge: "warning", icon: "bg-yellow-50 text-yellow-500 dark:bg-yellow-500/10" },
  info: { badge: "info", icon: "bg-blue-50 text-blue-500 dark:bg-blue-500/10" },
  danger: { badge: "failure", icon: "bg-red-50 text-red-500 dark:bg-red-500/10" },
  success: { badge: "success", icon: "bg-green-50 text-green-500 dark:bg-green-500/10" },
};

export default function Notifications() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/3">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Notifications</h3>
        <button className="text-sm text-brand-500 hover:text-brand-600">Mark all as read</button>
      </div>

      <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
        {mockNotifications.map((n) => {
          const style = TYPE_STYLES[n.type];
          return (
            <div
              key={n.id}
              className={`flex items-start gap-4 py-4 ${!n.read ? "bg-brand-50/40 dark:bg-brand-500/5" : ""}`}
            >
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${style.icon}`}>
                <BellIcon className="size-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-gray-800 dark:text-white/90">{n.title}</p>
                  <Badge color={style.badge}>{n.type}</Badge>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{n.message}</p>
                <p className="mt-1 text-xs text-gray-400">{n.time}</p>
              </div>
              {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-brand-500" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}