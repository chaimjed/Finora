import { HiOutlineClock } from "react-icons/hi2";
import PageMeta from "../../common/PageMeta";

export default function AuditLogsPage() {
  return (
    <>
      <PageMeta title="Audit Logs | Admin | Money Manager" description="Activity log" />
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/5">
          <HiOutlineClock className="size-7" />
        </div>
        <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">Audit Logs</h1>
        <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">
          Activity tracking is coming soon. You'll be able to see who did what and when.
        </p>
      </div>
    </>
  );
}