import time
import requests

from core.security import validate_public_http_url
from .models import Monitor

USER_AGENT = "DevPulse-Monitor/1.0 (+https://example.com/monitoring)"
MAX_BODY_BYTES = 512 * 1024


def perform_http_check(monitor: Monitor) -> dict:
    """Execute one bounded HTTP GET health check for a saved monitor."""
    started = time.perf_counter()
    status_code = None
    error_message = ""

    try:
        validate_public_http_url(monitor.url)
        response = requests.get(
            monitor.url,
            headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/json,*/*"},
            timeout=(min(5, monitor.timeout), monitor.timeout),
            allow_redirects=False,
            stream=True,
        )
        status_code = response.status_code
        body_parts = []
        bytes_read = 0
        try:
            for chunk in response.iter_content(chunk_size=8192):
                if not chunk:
                    continue
                remaining = MAX_BODY_BYTES - bytes_read
                body_parts.append(chunk[:remaining])
                bytes_read += min(len(chunk), remaining)
                if bytes_read >= MAX_BODY_BYTES:
                    break
        finally:
            response.close()

        body_sample = b"".join(body_parts).decode("utf-8", errors="replace")
        ok = status_code == monitor.expected_status_code
        if ok and monitor.expected_keyword:
            ok = monitor.expected_keyword.casefold() in body_sample.casefold()
            if not ok:
                error_message = "Expected keyword was not found in the first 512 KB of the response."
        elif not ok:
            error_message = f"Expected HTTP {monitor.expected_status_code}, received HTTP {status_code}."

        response_time_ms = (time.perf_counter() - started) * 1000
        return {
            "status": "UP" if ok else "DOWN",
            "status_code": status_code,
            "response_time_ms": round(response_time_ms, 2),
            "error_message": error_message,
        }
    except (requests.RequestException, ValueError, OSError) as exc:
        response_time_ms = (time.perf_counter() - started) * 1000
        # Keep the stored error concise; do not store request headers or secrets.
        return {
            "status": "DOWN",
            "status_code": status_code,
            "response_time_ms": round(response_time_ms, 2),
            "error_message": str(exc)[:500] or "Connection failed.",
        }
