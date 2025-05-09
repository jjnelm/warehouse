import { Fragment } from 'react';
import { X } from 'lucide-react';
import Button from './Button';
import { useTheme } from '../../contexts/ThemeContext'; // Import the theme context

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
}

const Modal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary'
}: ModalProps) => {
  const { currentTheme } = useTheme(); // Get the current theme

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <div
          className={`fixed inset-0 ${
            currentTheme === 'dark' ? 'bg-gray-800 bg-opacity-75' : 'bg-gray-500 bg-opacity-75'
          } transition-opacity`}
          onClick={onClose}
        />

        <div
          className={`relative transform overflow-hidden rounded-lg ${
            currentTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
          } px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6`}
        >
          <div className="absolute right-0 top-0 pr-4 pt-4">
            <button
              type="button"
              className={`rounded-md ${
                currentTheme === 'dark' ? 'bg-gray-900 text-gray-400 hover:text-gray-300' : 'bg-white text-gray-400 hover:text-gray-500'
              } focus:outline-none`}
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:text-left">
              <h3 className="text-lg font-semibold leading-6">
                {title}
              </h3>
              <div className="mt-2">
                <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {description}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <Button
              variant={variant}
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="w-full sm:ml-3 sm:w-auto"
            >
              {confirmText}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="mt-3 w-full sm:mt-0 sm:w-auto"
            >
              {cancelText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;