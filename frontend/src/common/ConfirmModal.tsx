import { Modal, ModalBody, ModalHeader, Button } from "flowbite-react";
import { HiOutlineExclamationTriangle, HiOutlineQuestionMarkCircle } from "react-icons/hi2";

interface ConfirmModalProps {
  show: boolean;
  title: string;
  message: React.ReactNode;
  details?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  show,
  title,
  message,
  details,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const Icon = danger ? HiOutlineExclamationTriangle : HiOutlineQuestionMarkCircle;

  return (
    <Modal show={show} onClose={loading ? undefined : onCancel} size="md" popup>
      <ModalHeader />
      <ModalBody>
        <div className="flex flex-col items-center text-center">
          <div
            className={
              danger
                ? "mb-4 flex size-14 items-center justify-center rounded-full bg-error-50 ring-8 ring-error-50/50 dark:bg-error-500/10 dark:ring-error-500/5"
                : "mb-4 flex size-14 items-center justify-center rounded-full bg-brand-50 ring-8 ring-brand-50/50 dark:bg-brand-500/10 dark:ring-brand-500/5"
            }
          >
            <Icon
              className={danger ? "size-7 text-error-600 dark:text-error-400" : "size-7 text-brand-600 dark:text-brand-400"}
            />
          </div>

          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{title}</h3>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">{message}</div>

          {details && (
            <div className="mt-5 w-full rounded-xl border border-gray-200 bg-gray-50 p-4 text-left dark:border-gray-800 dark:bg-white/5">
              {details}
            </div>
          )}

          <div className="mt-6 grid w-full grid-cols-2 gap-3">
            <Button color="light" onClick={onCancel} disabled={loading}>
              {cancelLabel}
            </Button>
            <Button
              color={danger ? "failure" : "blue"}
              className={
                danger
                  ? "bg-error-600! text-white! enabled:hover:bg-error-700! focus:ring-error-300! dark:bg-error-600! dark:enabled:hover:bg-error-700!"
                  : undefined
              }
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? "Please wait..." : confirmLabel}
            </Button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}