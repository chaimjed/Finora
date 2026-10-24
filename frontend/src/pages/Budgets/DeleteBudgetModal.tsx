import { Modal, Button, ModalHeader, ModalBody } from "flowbite-react";
import { HiOutlineExclamationCircle } from "react-icons/hi";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  category?: string;
}

export default function DeleteBudgetModal({ open, onClose, onConfirm, category }: Props) {
  return (
    <Modal show={open} onClose={onClose} size="md" popup>
      <ModalHeader />
      <ModalBody>
        <div className="text-center">
          <HiOutlineExclamationCircle className="mx-auto mb-4 size-14 text-gray-400 dark:text-gray-200" />
          <h3 className="mb-1 text-lg font-normal text-gray-500 dark:text-gray-400">
            Delete this budget?
          </h3>
          {category && <p className="mb-5 text-sm text-gray-400">{category}</p>}
          <div className="flex justify-center gap-4">
            <Button color="failure" onClick={onConfirm}>
              Yes, delete
            </Button>
            <Button color="gray" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}