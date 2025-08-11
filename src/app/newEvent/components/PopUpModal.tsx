import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string; // e.g. 'max-w-lg'
  minHeight?: string; // e.g. 'min-h-[360px]'
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
  minHeight = "min-h-[360px]",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div
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
      </div>
    </div>
  );
};

export default Modal;
