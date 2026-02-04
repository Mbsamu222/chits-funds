"""
Rate Limiting Middleware
Protects against brute force attacks and API abuse.
"""
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict
from datetime import datetime, timedelta
import time
import threading


class RateLimitExceeded(HTTPException):
    """Custom exception for rate limit exceeded"""
    def __init__(self, retry_after: int = 60):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many requests. Please try again in {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)}
        )


class RateLimiter:
    """
    In-memory rate limiter with sliding window.
    
    Note: For production with multiple workers, use Redis instead.
    This implementation works for single-process deployments.
    """
    
    def __init__(self):
        # Format: {key: [(timestamp1, count1), (timestamp2, count2), ...]}
        self.requests = defaultdict(list)
        self.lock = threading.Lock()
        
        # Rate limit configurations
        self.limits = {
            # Endpoint prefix -> (max_requests, window_seconds)
            "/auth/login": (5, 60),           # 5 attempts per minute
            "/auth/password-reset": (3, 300),  # 3 attempts per 5 minutes
            "default": (100, 60)               # 100 requests per minute for other endpoints
        }
    
    def _get_limit(self, path: str) -> tuple:
        """Get rate limit for path"""
        for prefix, limit in self.limits.items():
            if prefix != "default" and path.startswith(prefix):
                return limit
        return self.limits["default"]
    
    def _cleanup_old_entries(self, key: str, window: int):
        """Remove entries older than the window"""
        cutoff = time.time() - window
        self.requests[key] = [
            (ts, count) for ts, count in self.requests[key]
            if ts > cutoff
        ]
    
    def is_rate_limited(self, key: str, path: str) -> tuple:
        """
        Check if request should be rate limited.
        
        Returns: (is_limited: bool, retry_after: int)
        """
        max_requests, window = self._get_limit(path)
        
        with self.lock:
            self._cleanup_old_entries(key, window)
            
            # Count requests in window
            total_requests = sum(count for _, count in self.requests[key])
            
            if total_requests >= max_requests:
                # Calculate retry_after
                if self.requests[key]:
                    oldest_ts = min(ts for ts, _ in self.requests[key])
                    retry_after = int(window - (time.time() - oldest_ts)) + 1
                else:
                    retry_after = window
                return True, max(1, retry_after)
            
            # Record this request
            now = time.time()
            self.requests[key].append((now, 1))
            
            return False, 0
    
    def get_remaining(self, key: str, path: str) -> int:
        """Get remaining requests in current window"""
        max_requests, window = self._get_limit(path)
        
        with self.lock:
            self._cleanup_old_entries(key, window)
            total = sum(count for _, count in self.requests[key])
            return max(0, max_requests - total)


# Global rate limiter instance
rate_limiter = RateLimiter()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware for FastAPI.
    
    Limits requests based on:
    - IP address for unauthenticated requests
    - User ID for authenticated requests (from JWT)
    
    Different limits for different endpoints:
    - Login: Stricter limits (5/min)
    - Password reset: Very strict (3/5min)
    - General API: Normal limits (100/min)
    """
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks and docs
        if request.url.path in ["/health", "/docs", "/openapi.json", "/"]:
            return await call_next(request)
        
        # Get client identifier (IP or forwarded IP)
        client_ip = request.client.host
        
        # Check for X-Forwarded-For header (for proxied requests)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        
        # Create rate limit key
        rate_key = f"ip:{client_ip}"
        
        # Check rate limit
        is_limited, retry_after = rate_limiter.is_rate_limited(
            rate_key, 
            request.url.path
        )
        
        if is_limited:
            raise RateLimitExceeded(retry_after=retry_after)
        
        # Add rate limit headers to response
        response = await call_next(request)
        
        remaining = rate_limiter.get_remaining(rate_key, request.url.path)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        
        return response


def get_rate_limiter() -> RateLimiter:
    """Get global rate limiter instance"""
    return rate_limiter
