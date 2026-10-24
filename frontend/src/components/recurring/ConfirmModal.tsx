import { useState } from "react";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "flowbite-react";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export default function ConfirmModal({
  open, title, message, confirmLabel = "Delete", onClose, onConfirm,
}: Props) {
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal show={open} onClose={onClose} size="md">
      <ModalHeader>{title}</ModalHeader>
      <ModalBody>
        <p className="text-gray-600 dark:text-gray-300">{message}</p>
      </ModalBody>
      <ModalFooter>
        <Button color="gray" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button color="failure" onClick={handle} disabled={busy}>{confirmLabel}</Button>
      </ModalFooter>
    </Modal>
  );
}