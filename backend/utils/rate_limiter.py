"""Thread-safe in-memory sliding window rate limiter for public endpoints."""

import threading
import time
from collections import defaultdict
from typing import Tuple


class InMemoryRateLimiter:
    """Sliding-window rate limiter per client IP address.

    Thread-safe and memory-bounded for 512MB RAM server constraints.

    Architecture Note:
        All rate limiting counters are stored in volatile in-memory data structures.
        Rate limits reset automatically on server/worker restart or cold wake-up.
    """

    def __init__(self, max_requests: int = 30, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests = defaultdict(list)
        self._lock = threading.Lock()
        self._last_cleanup = time.time()

    def is_allowed(self, client_ip: str) -> Tuple[bool, int, int]:
        """Check if request from client_ip is permitted.

        Returns:
            (allowed: bool, remaining_requests: int, retry_after_seconds: int)
        """
        now = time.time()
        window_start = now - self.window_seconds

        with self._lock:
            # Periodic cleanup every 5 minutes to prevent memory leak
            if now - self._last_cleanup > 300:
                self._cleanup_stale_ips(window_start)
                self._last_cleanup = now

            timestamps = self._requests[client_ip]
            # Discard timestamps outside current window
            valid_timestamps = [t for t in timestamps if t > window_start]
            self._requests[client_ip] = valid_timestamps

            if len(valid_timestamps) >= self.max_requests:
                oldest_in_window = valid_timestamps[0]
                retry_after = max(1, int(oldest_in_window + self.window_seconds - now))
                return False, 0, retry_after

            # Record this request
            self._requests[client_ip].append(now)
            remaining = self.max_requests - len(self._requests[client_ip])
            return True, remaining, 0

    def _cleanup_stale_ips(self, window_start: float) -> None:
        """Remove IPs that have had no requests in the current window."""
        stale_ips = [ip for ip, ts in self._requests.items() if not ts or ts[-1] <= window_start]
        for ip in stale_ips:
            del self._requests[ip]

    def reset(self) -> None:
        """Clear all rate limiting records."""
        with self._lock:
            self._requests.clear()
