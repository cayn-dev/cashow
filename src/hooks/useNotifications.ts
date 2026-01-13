import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';

interface NotificationSettings {
  notificationsEnabled: boolean;
  dailyReminder: boolean;
  spendingAlerts: boolean;
  goalAlerts: boolean;
  spendingLimit?: number;
}

const NOTIFICATION_KEY = 'last_notification';
const DAILY_REMINDER_KEY = 'last_daily_reminder';

export function useNotifications(settings: NotificationSettings) {
  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('Browser does not support notifications');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    
    return false;
  }, []);

  // Send browser notification
  const sendBrowserNotification = useCallback((title: string, body: string, icon?: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico',
      });
    }
  }, []);

  // Send toast notification
  const sendToast = useCallback((title: string, description?: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    switch (type) {
      case 'success':
        toast.success(title, { description });
        break;
      case 'warning':
        toast.warning(title, { description });
        break;
      case 'error':
        toast.error(title, { description });
        break;
      default:
        toast.info(title, { description });
    }
  }, []);

  // Notify for spending alerts
  const notifySpendingAlert = useCallback((amount: number, limit: number) => {
    if (!settings.notificationsEnabled || !settings.spendingAlerts) return;
    
    const percentage = (amount / limit) * 100;
    
    if (percentage >= 100) {
      sendToast('⚠️ Limite spese superato!', `Hai speso ${amount.toLocaleString()}€ superando il limite di ${limit.toLocaleString()}€`, 'error');
      sendBrowserNotification('Limite spese superato!', `Hai speso ${amount.toLocaleString()}€ superando il limite di ${limit.toLocaleString()}€`);
    } else if (percentage >= 80) {
      sendToast('🔔 Attenzione alle spese', `Hai raggiunto l'80% del tuo limite mensile`, 'warning');
      sendBrowserNotification('Attenzione alle spese', `Hai raggiunto l'80% del tuo limite mensile`);
    }
  }, [settings.notificationsEnabled, settings.spendingAlerts, sendToast, sendBrowserNotification]);

  // Notify for goal reached
  const notifyGoalReached = useCallback((goalName: string, emoji: string) => {
    if (!settings.notificationsEnabled || !settings.goalAlerts) return;
    
    sendToast(`${emoji} Obiettivo raggiunto!`, `Hai completato "${goalName}"`, 'success');
    sendBrowserNotification('Obiettivo raggiunto!', `${emoji} Hai completato "${goalName}"`);
  }, [settings.notificationsEnabled, settings.goalAlerts, sendToast, sendBrowserNotification]);

  // Notify for goal progress
  const notifyGoalProgress = useCallback((goalName: string, emoji: string, percentage: number) => {
    if (!settings.notificationsEnabled || !settings.goalAlerts) return;
    
    if (percentage >= 50 && percentage < 51) {
      sendToast(`${emoji} Metà strada!`, `Hai raggiunto il 50% di "${goalName}"`, 'info');
    } else if (percentage >= 75 && percentage < 76) {
      sendToast(`${emoji} Quasi fatto!`, `Hai raggiunto il 75% di "${goalName}"`, 'info');
    }
  }, [settings.notificationsEnabled, settings.goalAlerts, sendToast]);

  // Notify for transaction added
  const notifyTransactionAdded = useCallback((type: 'income' | 'expense', amount: number, currencySymbol: string) => {
    if (!settings.notificationsEnabled) return;
    
    if (type === 'income') {
      sendToast('💰 Entrata registrata', `+${currencySymbol}${amount.toLocaleString()}`, 'success');
    } else {
      sendToast('💸 Spesa registrata', `-${currencySymbol}${amount.toLocaleString()}`, 'info');
    }
  }, [settings.notificationsEnabled, sendToast]);

  // Daily reminder check
  useEffect(() => {
    if (!settings.notificationsEnabled || !settings.dailyReminder) return;

    const checkDailyReminder = () => {
      const lastReminder = localStorage.getItem(DAILY_REMINDER_KEY);
      const today = new Date().toDateString();
      
      if (lastReminder !== today) {
        const now = new Date();
        // Send reminder at 20:00 (8 PM)
        if (now.getHours() >= 20) {
          localStorage.setItem(DAILY_REMINDER_KEY, today);
          sendToast('📝 Promemoria', 'Hai registrato tutte le spese di oggi?', 'info');
          sendBrowserNotification('Promemoria', 'Hai registrato tutte le spese di oggi?');
        }
      }
    };

    // Check immediately and then every hour
    checkDailyReminder();
    const interval = setInterval(checkDailyReminder, 3600000); // 1 hour

    return () => clearInterval(interval);
  }, [settings.notificationsEnabled, settings.dailyReminder, sendToast, sendBrowserNotification]);

  // Request permission on mount if notifications are enabled
  useEffect(() => {
    if (settings.notificationsEnabled) {
      requestPermission();
    }
  }, [settings.notificationsEnabled, requestPermission]);

  return {
    requestPermission,
    sendToast,
    sendBrowserNotification,
    notifySpendingAlert,
    notifyGoalReached,
    notifyGoalProgress,
    notifyTransactionAdded,
  };
}
