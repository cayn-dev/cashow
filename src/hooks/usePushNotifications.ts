import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const VAPID_PUBLIC_KEY = 'BKY6MdukZyIiOkXs4_nntC7jo2LHLWu3ZT6YuStC_0JmH2EhNGPaMnYENShsfa-3VmKMlygDkhi3bR4O6d2yuMM';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { user, isAuthenticated, isGuest } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        setRegistration(reg);
        // Check existing subscription
        reg.pushManager.getSubscription().then((sub) => {
          setIsSubscribed(!!sub);
        });
      }).catch(console.error);
    }
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!registration || !isAuthenticated || isGuest || !user) return false;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return false;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });

      const json = subscription.toJSON();
      const p256dh = json.keys?.p256dh || '';
      const auth = json.keys?.auth || '';

      // Save to database
      const { error } = await (supabase as any)
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh,
          auth,
        }, { onConflict: 'user_id,endpoint' });

      if (error) {
        console.error('Error saving push subscription:', error);
        return false;
      }

      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error('Push subscription error:', err);
      return false;
    }
  }, [registration, isAuthenticated, isGuest, user]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!registration) return false;

    try {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();

        if (user) {
          await (supabase as any)
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.id)
            .eq('endpoint', subscription.endpoint);
        }
      }

      setIsSubscribed(false);
      return true;
    } catch (err) {
      console.error('Push unsubscribe error:', err);
      return false;
    }
  }, [registration, user]);

  // Send a push notification via edge function
  const sendPush = useCallback(async (title: string, body: string, type?: string) => {
    if (!isAuthenticated || isGuest) return;

    try {
      await supabase.functions.invoke('send-push', {
        body: { title, body, type: type || 'info' },
      });
    } catch (err) {
      console.error('Error sending push:', err);
    }
  }, [isAuthenticated, isGuest]);

  return {
    isSupported,
    isSubscribed,
    subscribe,
    unsubscribe,
    sendPush,
  };
}
