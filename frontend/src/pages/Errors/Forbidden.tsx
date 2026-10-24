import { Link } from "react-router";
import { Button } from "flowbite-react";
import { HiOutlineLockClosed } from "react-icons/hi2";
import PageMeta from "../../common/PageMeta";

export default function Forbidden() {
  return (
    <>
      <PageMeta title="Access denied | Money Manager" description="You don't have permission to view this page" />
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-error-50 text-error-600 dark:bg-error-500/10">
          <HiOutlineLockClosed className="size-7" />
        </div>
        <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">Access denied</h1>
        <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">
          You don't have permission to view this page.
        </p>
        <Link to="/">
          <Button size="sm">Back to dashboard</Button>
        </Link>
      </div>
    </>
  );
}