import { useEffect, useState } from "react";
import { Modal, Button, Alert, ModalBody, ModalHeader } from "flowbite-react";
import { HiOutlineExclamationCircle } from "react-icons/hi";
import type { Account } from "../../types/account";
import { useDeleteAccount } from "../../hooks/useAccounts";

interface Props {
  account: Account | null;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteAccountModal({ account, onClose, onDeleted }: Props) {
  const deleteAccount = useDeleteAccount();
  const loading = deleteAccount.isPending;

  const [error, setError] = useState<string | null>(null);

  // efface l'erreur précédente quand on ouvre la modal pour un autre compte
  useEffect(() => {
    setError(null);
  }, [account]);

  async function handleConfirm() {
    if (!account) return;
    setError(null);
    try {
      await deleteAccount.mutateAsync(account.id);
      onDeleted();
    } catch (err: any) {
      setError(
        err?.response?.status === 409
          ? "This account has transactions linked to it. Archive it instead of deleting it."
          : "Could not delete this account.",
      );
    }
  }

  return (
    <Modal show={!!account} onClose={onClose} size="md" popup>
      <ModalHeader />
      <ModalBody>
        <div className="text-center">
          <HiOutlineExclamationCircle className="mx-auto mb-4 size-14 text-gray-400 dark:text-gray-200" />
          <h3 className="mb-1 text-lg font-normal text-gray-500 dark:text-gray-400">
            Delete this account?
          </h3>
          {account && <p className="mb-2 text-sm text-gray-400">{account.name}</p>}
          <p className="mb-5 text-xs text-gray-400">
            This can only be done if the account has no transaction history. This cannot be undone.
          </p>

          {error && (
            <Alert color="failure" className="mb-4 text-left">
              {error}
            </Alert>
          )}

          <div className="flex justify-center gap-4">
            <Button color="failure" onClick={handleConfirm} disabled={loading}>
              {loading ? "Deleting..." : "Yes, delete"}
            </Button>
            <Button color="gray" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}