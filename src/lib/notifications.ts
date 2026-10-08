import type { ReactNode } from 'react';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';
export type NotificationOptions = {
  variant?: AlertVariant;
  title?: string;
  description?: ReactNode;
  dismissible?: boolean;
  autoCloseMs?: number;
  exitDurationMs?: number;
  className?: string;
  onClose?: () => void;
};
export type Notification = NotificationOptions & { id: number };

let sequence = 0;
let notifications: Notification[] = [];
const listeners = new Set<() => void>();
const publish = () => listeners.forEach(listener => listener());

export const notificationStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
  getSnapshot: () => notifications,
  show(options: NotificationOptions) {
    // Strict Mode and concurrent loads can report the same failure twice.
    const existing = notifications.find(item => item.variant === options.variant && item.title === options.title && item.description === options.description);
    if (existing) return existing.id;
    const id = ++sequence;
    notifications = [...notifications, { ...options, id }];
    publish();
    return id;
  },
  dismiss(id: number) {
    const item = notifications.find(notification => notification.id === id);
    if (!item) return;
    notifications = notifications.filter(notification => notification.id !== id);
    publish();
    item.onClose?.();
  },
};

export const notify = {
  success: (description: string) => notificationStore.show({ variant: 'success', title: 'Success', description }),
  error: (description: string) => notificationStore.show({ variant: 'error', title: 'Unable to complete request', description }),
  warning: (description: string) => notificationStore.show({ variant: 'warning', title: 'Please check', description }),
  info: (description: string) => notificationStore.show({ variant: 'info', title: 'Information', description }),
};

export function notifyValidation(errors: object) {
  const messages = Object.values(errors).filter((value): value is string => typeof value === 'string' && !!value);
  if (messages.length) notify.error(messages.join(' '));
}
