"use client";

import { useState } from "react";
import { Link } from "react-router";
import { Dropdown, DropdownItem, DropdownHeader, DropdownDivider, Badge } from "flowbite-react";
import { HiOutlineBanknotes, HiOutlineCreditCard, HiOutlineExclamationTriangle } from "react-icons/hi2";
import { BellIcon } from "../../icons/BellIcon";

type NotificationType = "budget" | "bill" | "balance";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const initialNotifications: Notification[] = [
  {
    id: "1",
    type: "budget",
    title: "Budget exceeded",
    message: "Entertainment budget went over by $12.99",
    time: "2h ago",
    read: false,
  },
  {
    id: "2",
    type: "bill",
    title: "Bill due tomorrow",
    message: "Netflix ($12.99) is due tomorrow",
    time: "5h ago",
    read: false,
  },
  {
    id: "3",
    type: "balance",
    title: "Low balance alert",
    message: "Main Checking dropped below $500",
    time: "1d ago",
    read: true,
  },
];

const typeStyles: Record<NotificationType, { icon: React.ElementType; bg: string; text: string }> = {
  budget: {
    icon: HiOutlineExclamationTriangle,
    bg: "bg-warning-50 dark:bg-warning-500/15",
    text: "text-warning-600 dark:text-warning-500",
  },
  bill: {
    icon: HiOutlineCreditCard,
    bg: "bg-brand-50 dark:bg-brand-500/15",
    text: "text-brand-500 dark:text-brand-400",
  },
  balance: {
    icon: HiOutlineBanknotes,
    bg: "bg-error-50 dark:bg-error-500/15",
    text: "text-error-600 dark:text-error-500",
  },
};

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  return (
    <Dropdown
      label=""
      arrowIcon={false}
      inline
      renderTrigger={() => (
        <button
          className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          aria-label="Notifications"
        >
          {unreadCount > 0 && (
            <span className="absolute inset-e-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
            </span>
          )}
          <BellIcon className="size-5" />
        </button>
      )}
      className="w-80 sm:w-96"
    >
      <DropdownHeader>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Notifications
          </span>
          {unreadCount > 0 && (
            <Badge color="failure" size="sm">
              {unreadCount} new
            </Badge>
          )}
        </div>
      </DropdownHeader>

      <div className="max-h-90 overflow-y-auto custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            No notifications yet.
          </div>
        ) : (
          notifications.map((n) => {
            const style = typeStyles[n.type];
            const Icon = style.icon;

            return (
              <DropdownItem
                key={n.id}
                onClick={() => markAsRead(n.id)}
                className="items-start gap-3 py-3"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.bg} ${style.text}`}
                >
                  <Icon className="size-5" />
                </span>

                <div className="flex-1 text-start">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800 dark:text-white/90">
                      {n.title}
                    </span>
                    {!n.read && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {n.message}
                  </p>
                  <span className="mt-1 block text-xs text-gray-400 dark:text-gray-500">
                    {n.time}
                  </span>
                </div>
              </DropdownItem>
            );
          })
        )}
      </div>

      <DropdownDivider />

      <div className="flex items-center justify-between px-4 py-2">
        <button
          onClick={markAllAsRead}
          className="text-xs font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
        >
          Mark all as read
        </button>
        <Link
          to="/notifications"
          className="text-xs font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
        >
          View all
        </Link>
      </div>
    </Dropdown>
  );
}