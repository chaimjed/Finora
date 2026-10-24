import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";
import {
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
  CalenderIcon,
} from "../icons";
import { cn } from "../utils";
import { useSidebar } from "../context/SidebarContext";
import { BellIcon } from "../icons/BellIcon";
import { WalletIcon } from "../icons/WalletIcon";
import { UsersGroupIcon } from "../icons/UsersGroupIcon";
import { ShieldCheckIcon } from "../icons/ShieldCheckIcon";
import { ClipboardListIcon } from "../icons/ClipboardListIcon";
import { usePermission } from "../hooks/usePermission";
import { useHasAdminAccess } from "../hooks/useHasAdminAccess";
import { HiOutlineTag } from "react-icons/hi2";
import { TagIcon } from "../icons/TagIcon";
type MenuType = "main" | "others" | "admin";

type NavItem = {
  name: string;
  key?: string;
  icon: React.ReactNode;
  path?: string;
  new?: boolean;
  subItems?: { name: string; key?: string; path: string; new?: boolean }[];
};

const navItems: NavItem[] = [
  { icon: <GridIcon />, name: "Dashboard", key: "dashboard", path: "/" },
    {
    icon: <HiOutlineTag className="size-4" />,
    name: "Categories",
    key: "categories",
    path: "/categories",
  },
  {
    icon: <ListIcon />,
    name: "Transactions",
    key: "transactions",
    path: "/transactions",
  },
  { icon: <PieChartIcon />, name: "Budgets", key: "budgets", path: "/budgets" },
  {
    icon: <WalletIcon />,
    name: "Accounts",
    key: "accounts",
    path: "/accounts",
  },
  {
    icon: <CalenderIcon />,
    name: "Recurring Payments",
    key: "recurringPayments",
    path: "/recurring-payments",
  },
  { icon: <TableIcon />, name: "Reports", key: "reports", path: "/reports" },
  {
    icon: <BellIcon />,
    name: "Notifications",
    key: "notifications",
    path: "/notifications",
  },
];

const othersItems: NavItem[] = [
  {
    icon: <UserCircleIcon />,
    name: "User Profile",
    key: "userProfile",
    path: "/profile",
  },
  {
    icon: <PlugInIcon />,
    name: "Settings",
    key: "settings",
    path: "/settings",
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, setIsMobileOpen } =
    useSidebar();
  const { t } = useTranslation();
  const location = useLocation();

  const hasAdminAccess = useHasAdminAccess();
  const canReadUsers = usePermission("users:read");
  const canManageRoles = usePermission("roles:manage");
  const canReadAuditLogs = usePermission("audit:read");

  const adminItems: NavItem[] = hasAdminAccess
    ? [
        {
          icon: <GridIcon />,
          name: "Admin Dashboard",
          key: "adminDashboard",
          path: "/admin",
        },
        ...(canReadUsers
          ? [
              {
                icon: <UsersGroupIcon />,
                name: "Users",
                key: "users",
                path: "/admin/users",
              },
            ]
          : []),
        ...(canManageRoles
          ? [
              {
                icon: <ShieldCheckIcon />,
                name: "Roles",
                key: "roles",
                path: "/admin/roles",
              },
            ]
          : []),
        ...(canReadAuditLogs
          ? [
              {
                icon: <ClipboardListIcon />,
                name: "Audit Logs",
                key: "auditLogs",
                path: "/admin/audit-logs",
              },
            ]
          : []),
      ]
    : [];

  const primaryItems = hasAdminAccess ? adminItems : navItems;
  const homePath = hasAdminAccess ? "/admin" : "/";

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: MenuType;
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {},
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (isMobileOpen) setIsMobileOpen(false);
  }, [location.pathname]);

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname],
  );

  useEffect(() => {
    let submenuMatched = false;
    (["main", "others", "admin"] as const).forEach((menuType) => {
      const items =
        menuType === "main"
          ? primaryItems
          : menuType === "others"
            ? othersItems
            : adminItems;
      items.forEach((nav, index) => {
        nav.subItems?.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({ type: menuType, index });
            submenuMatched = true;
          }
        });
      });
    });
    if (!submenuMatched) setOpenSubmenu(null);
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: MenuType) => {
    setOpenSubmenu((prev) =>
      prev && prev.type === menuType && prev.index === index
        ? null
        : { type: menuType, index },
    );
  };

  const renderMenuItems = (items: NavItem[], menuType: MenuType) => (
    <ul className="flex flex-col gap-1">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`group menu-item ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${!isExpanded && !isHovered ? "xl:justify-center" : "xl:justify-start"}`}
            >
              <span
                className={`menu-item-icon-size ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">
                  {nav.key ? t(`sidebar.items.${nav.key}`) : nav.name}
                </span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ms-auto h-5 w-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`group menu-item ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"}`}
              >
                <span
                  className={`menu-item-icon-size ${isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">
                    {nav.key ? t(`sidebar.items.${nav.key}`) : nav.name}
                  </span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="ms-9 mt-2 space-y-1">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item ${isActive(subItem.path) ? "menu-dropdown-item-active" : "menu-dropdown-item-inactive"}`}
                    >
                      {subItem.key
                        ? t(`sidebar.items.${subItem.key}`)
                        : subItem.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={cn(
        "fixed inset-s-0 top-0 z-50 flex h-screen flex-col border-e border-gray-200 bg-white px-5 text-gray-900 transition-all duration-300 ease-in-out xl:translate-x-0 xl:rtl:translate-x-0 dark:border-gray-800 dark:bg-gray-900",
        isExpanded || isMobileOpen ? "w-72.5" : isHovered ? "w-72.5" : "w-22.5",
        isMobileOpen
          ? "translate-x-0"
          : "-translate-x-full rtl:translate-x-full",
      )}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          "flex py-6",
          !isExpanded && !isHovered && !isMobileOpen
            ? "xl:justify-center"
            : "justify-start",
        )}
      >
        <Link to={homePath} className="flex items-center gap-3">
          <img
            src="/images/logo/logo.png"
            alt="Finora logo"
            className="size-10 shrink-0 object-contain"
          />
          {(isExpanded || isHovered || isMobileOpen) && (
            <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Fin<span className="text-brand-500">ora</span>
            </span>
          )}
        </Link>
      </div>

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 flex text-xs leading-5 text-gray-400 uppercase ${
                  !isExpanded && !isHovered
                    ? "xl:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  t(
                    hasAdminAccess
                      ? "sidebar.groups.admin"
                      : "sidebar.groups.menu",
                  )
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(primaryItems, hasAdminAccess ? "admin" : "main")}
            </div>

            <div>
              <h2
                className={`mb-4 flex text-xs leading-5 text-gray-400 uppercase ${
                  !isExpanded && !isHovered
                    ? "xl:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  t("sidebar.groups.others")
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
