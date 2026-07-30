'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
        // Prevent body scrolling
        document.body.style.overflow = 'hidden';
      }
    } else {
      if (dialog.open) {
        dialog.close();
        document.body.style.overflow = '';
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => {
      dialog.removeEventListener('cancel', handleCancel);
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      className="bg-card text-card-foreground p-6 rounded-lg shadow-xl border border-border w-full max-w-md backdrop:bg-black/40 backdrop:backdrop-blur-sm focus:outline-none animate-in fade-in zoom-in-95 duration-200"
      onClick={(e) => {
        // Close on clicking backdrop
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-secondary transition-all-custom cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-2">{children}</div>
    </dialog>
  );
}
