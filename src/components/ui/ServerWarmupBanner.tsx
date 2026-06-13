import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { API_URL } from '../../services/api';

/**
 * On app load, pings the backend health endpoint. The free-tier host
 * suspends the API after inactivity, so the first request can take up to a
 * minute to "wake" it. This banner:
 *   - pre-warms the backend immediately (so login itself is fast), and
 *   - if the wake-up is slow, tells the user what's happening instead of
 *     letting a button appear frozen.
 * It only appears when the ping is slow, and disappears once the API responds.
 */
export const ServerWarmupBanner: React.FC = () => {
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    let settled = false;

    // Only show the banner if the health check is still pending after a beat,
    // so a warm backend never causes a flash.
    const showTimer = setTimeout(() => {
      if (!settled) setWaking(true);
    }, 2500);

    const ping = async (attempt = 0): Promise<void> => {
      try {
        const res = await fetch(`${API_URL}/api/health`, { cache: 'no-store' });
        if (res.ok) {
          settled = true;
          setWaking(false);
          return;
        }
        throw new Error('not ok');
      } catch {
        // Cold start can take ~60s; retry for up to ~90s before giving up.
        if (attempt < 30) {
          await new Promise((r) => setTimeout(r, 3000));
          return ping(attempt + 1);
        }
        settled = true;
        setWaking(false);
      }
    };

    ping();

    return () => {
      settled = true;
      clearTimeout(showTimer);
    };
  }, []);

  if (!waking) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-primary-600 text-white text-sm">
      <div className="max-w-3xl mx-auto px-4 py-2 flex items-center justify-center gap-2 text-center">
        <Loader2 size={16} className="animate-spin flex-shrink-0" />
        <span>
          Waking up the server — the free-tier backend sleeps when idle and can
          take up to a minute on first load. Thanks for your patience.
        </span>
      </div>
    </div>
  );
};
