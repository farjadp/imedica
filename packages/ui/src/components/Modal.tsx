// ============================================================================
// File: packages/ui/src/components/Modal.tsx
// Version: 1.0.0 — 2026-04-22
// Why: Accessible modal/dialog primitive with focus trapping and animation.
// Env / Identity: Shared UI package
// ============================================================================

import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../lib/cn.js';

import { Button } from './Button.js';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZE_STYLES = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
} as const;

/**
 * Dialog wrapper with a locked focus scope and portal-backed overlay.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: ModalProps): JSX.Element | null {
  const initialFocusRef = useRef<HTMLButtonElement | null>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement | null;
      return;
    }

    previousActiveElement.current?.focus?.();
    previousActiveElement.current = null;
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      <Dialog
        static
        open={isOpen}
        as="div"
        className="fixed inset-0 z-modal"
        onClose={onClose}
        initialFocus={initialFocusRef}
      >
        <motion.div
          aria-hidden="true"
          className="fixed inset-0 bg-overlay/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        />

        <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6">
          <div className="flex min-h-full items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={cn('w-full', SIZE_STYLES[size])}
            >
              <DialogPanel className="rounded-2xl border border-border bg-surface-elevated p-6 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    {title ? (
                      <DialogTitle className="text-xl font-semibold text-text">{title}</DialogTitle>
                    ) : null}
                  </div>

                  <Button ref={initialFocusRef} variant="ghost" size="sm" onClick={onClose} aria-label="Close dialog">
                    Close
                  </Button>
                </div>

                <div className={cn('mt-4 text-text-muted', footer ? 'pb-6' : '')}>{children}</div>

                {footer ? <div className="mt-6 border-t border-border pt-4">{footer}</div> : null}
              </DialogPanel>
            </motion.div>
          </div>
        </div>
      </Dialog>
    </AnimatePresence>,
    document.body,
  );
}
