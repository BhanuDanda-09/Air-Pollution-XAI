"""Thread-safe in-memory TTL LRU cache for live API responses."""

import threading
import time
from collections import OrderedDict
from typing import Any, Optional


class ThreadSafeTTLCache:
    """Thread-safe In-Memory LRU Cache with Time-To-Live (TTL).

    Guarantees thread safety across multi-threaded WSGI workers (e.g. Gunicorn threads).
    Enforces a strict upper bound on memory consumption (maxsize=256 entries).
    """

    def __init__(self, maxsize: int = 256, ttl: int = 600):
        self.maxsize = maxsize
        self.ttl = ttl
        self._cache: OrderedDict = OrderedDict()
        self._lock = threading.Lock()

    def get(self, key: str) -> Optional[Any]:
        """Retrieve unexpired value from cache, or return None."""
        with self._lock:
            if key not in self._cache:
                return None
            data, timestamp = self._cache[key]
            if time.time() - timestamp > self.ttl:
                del self._cache[key]
                return None
            # Move to end to track LRU order
            self._cache.move_to_end(key)
            return data

    def set(self, key: str, value: Any) -> None:
        """Store value with current timestamp and enforce capacity."""
        with self._lock:
            if key in self._cache:
                del self._cache[key]
            elif len(self._cache) >= self.maxsize:
                # Discard oldest (least recently used)
                self._cache.popitem(last=False)
            self._cache[key] = (value, time.time())

    def clear(self) -> None:
        """Clear all cached entries."""
        with self._lock:
            self._cache.clear()

    def size(self) -> int:
        """Return count of currently held entries."""
        with self._lock:
            return len(self._cache)

    def __len__(self) -> int:
        """Support len(cache)."""
        return self.size()
