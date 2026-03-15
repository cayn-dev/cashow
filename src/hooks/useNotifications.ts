import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface NotificationSettings {
  notificationsEnabled: boolean;
  dailyReminder: boolean;
  spendingAlerts: boolean;
  goalAlerts: boolean;
  spendingLimit?: number;
}

const DAILY_REMINDER_KEY = 'last_daily_reminder';

export function useNotifications(settings: NotificationSettings) {
  const { isAuthenticated, isGuest } = useAuth();

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  // Send browser notification (works when tab is open)
  const sendBrowserNotification = useCallback((title: string, body: string, icon?: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico',
      });
    }
  }, []);

  // Send push notification via edge function (works even when app is closed)
  const sendPushNotification = useCallback(async (title: string, body: string, type?: string) => {
    if (!isAuthenticated || isGuest) return;
    try {
      await supabase.functions.invoke('send-push', {
        body: { title, body, type: type || 'info' },
      });
    } catch (err) {
      console.error('Push notification error:', err);
    }
  }, [isAuthenticated, isGuest]);

  // Send toast notification
  const sendToast = useCallback((title: string, description?: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    switch (type) {
      case 'success': toast.success(title, { description }); break;
      case 'warning': toast.warning(title, { description }); break;
      case 'error': toast.error(title, { description }); break;
      default: toast.info(title, { description });
    }
  }, []);

  // Notify for spending alerts - both in-app and push
  const notifySpendingAlert = useCallback((amount: number, limit: number) => {
    if (!settings.notificationsEnabled || !settings.spendingAlerts) return;
    
    const percentage = (amount / limit) * 100;
    
    if (percentage >= 100) {
      const title = '⚠️ Limite spese superato!';
      const body = `Hai speso ${amount.toLocaleString()}€ superando il limite di ${limit.toLocaleString()}€`;
      sendToast(title, body, 'error');
      sendBrowserNotification(title, body);
      sendPushNotification(title, body, 'spending_alert');
    } else if (percentage >= 80) {
      const title = '🔔 Attenzione alle spese';
      const body = `Hai raggiunto l'80% del tuo limite mensile`;
      sendToast(title, body, 'warning');
      sendBrowserNotification(title, body);
      sendPushNotification(title, body, 'spending_warning');
    }
  }, [settings.notificationsEnabled, settings.spendingAlerts, sendToast, sendBrowserNotification, sendPushNotification]);

  // Notify for goal reached
  const notifyGoalReached = useCallback((goalName: string, emoji: string) => {
    if (!settings.notificationsEnabled || !settings.goalAlerts) return;
    
    const title = `${emoji} Obiettivo raggiunto!`;
    const body = `Hai completato "${goalName}"`;
    sendToast(title, body, 'success');
    sendBrowserNotification('Obiettivo raggiunto!', `${emoji} ${body}`);
    sendPushNotification(title, body, 'goal_reached');
  }, [settings.notificationsEnabled, settings.goalAlerts, sendToast, sendBrowserNotification, sendPushNotification]);

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

  // Daily reminder check - sends both in-app and push
  useEffect(() => {
    if (!settings.notificationsEnabled || !settings.dailyReminder) return;

    const checkDailyReminder = () => {
      const lastReminder = localStorage.getItem(DAILY_REMINDER_KEY);
      const today = new Date().toDateString();
      
      if (lastReminder !== today) {
        const now = new Date();
        if (now.getHours() >= 20) {
          localStorage.setItem(DAILY_REMINDER_KEY, today);
          const title = '📝 Promemoria';
          const body = 'Hai registrato tutte le spese di oggi?';
          sendToast(title, body, 'info');
          sendBrowserNotification(title, body);
          sendPushNotification(title, body, 'daily_reminder');
        }
      }
    };

    checkDailyReminder();
    const interval = setInterval(checkDailyReminder, 3600000);
    return () => clearInterval(interval);
  }, [settings.notificationsEnabled, settings.dailyReminder, sendToast, sendBrowserNotification, sendPushNotification]);

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
    sendPushNotification,
    notifySpendingAlert,
    notifyGoalReached,
    notifyGoalProgress,
    notifyTransactionAdded,
  };
}
