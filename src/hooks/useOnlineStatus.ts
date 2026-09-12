import { useEffect, useState } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [reconnected, setReconnected] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const handleOnline = () => {
      setIsOnline(true);
      setReconnected(true);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setReconnected(false);
      }, 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (timer) clearTimeout(timer);
    };
  }, []);

  return { isOnline, reconnected };
}
