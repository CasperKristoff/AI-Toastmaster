import React, { useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string; // e.g. 'max-w-lg'
  minHeight?: string; // e.g. 'min-h-[360px]'
  onSave?: () => void; // Function to call when Enter is pressed
  saveDisabled?: boolean; // Whether the save action should be disabled
  showSaveHint?: boolean; // Whether to show the save hint text
  autoFocus?: boolean; // Whether to auto-focus the first input field
  disableEnterSave?: boolean; // Whether to disable Enter key saving
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
  minHeight = "min-h-[360px]",
  onSave,
  saveDisabled = false,
  showSaveHint = false,
  autoFocus = true,
  disableEnterSave = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle Enter key for saving
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Enter" && onSave && !saveDisabled && !disableEnterSave) {
        e.preventDefault();
        onSave();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [isOpen, onSave, saveDisabled, disableEnterSave, onClose]);

  // Auto-focus first input field when modal opens
  useEffect(() => {
    if (isOpen && autoFocus && modalRef.current) {
      // Small delay to ensure modal is fully rendered
      const timer = setTimeout(() => {
        const firstInput = modalRef.current?.querySelector(
          "input, textarea, select",
        ) as HTMLElement;
        if (firstInput) {
          firstInput.focus();
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoFocus]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div
        ref={modalRef}
        className={`bg-white/95 backdrop-blur-xl rounded-3xl p-5 w-full ${maxWidth} max-h-[90vh] ${minHeight} overflow-y-auto border border-dark-royalty/20 shadow-2xl`}
      >
        <div className="flex justify-between items-center mb-6">
          {title && (
            <h2 className="text-2xl font-bold text-dark-royalty">{title}</h2>
          )}
          <button
            onClick={onClose}
            className="text-deep-sea/60 hover:text-dark-royalty transition-colors text-2xl"
          >
            ×
          </button>
        </div>
        {children}

        {/* Save hint */}
        {showSaveHint && onSave && (
          <div className="mt-4 pt-4 border-t border-dark-royalty/10">
            <div className="text-sm text-deep-sea/60 text-center">
              💡 Press Enter to save, Escape to cancel
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
