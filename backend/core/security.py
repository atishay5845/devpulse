import ipaddress
import re
import socket
from urllib.parse import urlparse


def validate_public_http_url(value: str) -> str:
    """Reject non-HTTP URLs and targets that resolve to non-public IP addresses.

    This is a useful application-level SSRF guard, not a substitute for outbound
    network firewall rules. DNS can change between validation and connection.
    """
    if not value or len(value) > 2048:
        raise ValueError("Enter a valid URL (maximum 2048 characters).")

    parsed = urlparse(value.strip())
    if parsed.scheme not in {"http", "https"}:
        raise ValueError("Only HTTP and HTTPS URLs are allowed.")
    if not parsed.hostname or parsed.username or parsed.password:
        raise ValueError("The URL must contain a hostname and cannot include credentials.")
    if parsed.fragment:
        raise ValueError("URL fragments are not supported.")

    try:
        port = parsed.port
    except ValueError as exc:
        raise ValueError("The URL contains an invalid port.") from exc

    expected_port = 443 if parsed.scheme == "https" else 80
    if port not in (None, expected_port):
        raise ValueError("Only standard HTTP (80) and HTTPS (443) ports are allowed.")

    host = parsed.hostname.rstrip(".").lower()
    blocked_suffixes = (".localhost", ".local", ".internal", ".test", ".invalid")
    if host == "localhost" or host.endswith(blocked_suffixes):
        raise ValueError("Local or internal hostnames cannot be monitored.")

    addresses = []
    try:
        # Literal IPs do not need DNS resolution.
        try:
            addresses = [ipaddress.ip_address(host)]
        except ValueError:
            records = socket.getaddrinfo(host, port or expected_port, type=socket.SOCK_STREAM)
            addresses = [ipaddress.ip_address(record[4][0].split("%")[0]) for record in records]
    except (socket.gaierror, OSError, ValueError) as exc:
        raise ValueError("The hostname could not be resolved to a public IP address.") from exc

    if not addresses or any(not address.is_global for address in addresses):
        raise ValueError("Monitoring targets must resolve only to public IP addresses.")

    return value.strip()


def validate_discord_webhook(value: str) -> str:
    parsed = urlparse(value.strip())
    allowed_hosts = {"discord.com", "discordapp.com"}
    if (
        parsed.scheme != "https"
        or parsed.hostname not in allowed_hosts
        or not re.fullmatch(r"/api/webhooks/\d+/[A-Za-z0-9._-]+/?", parsed.path)
        or parsed.username
        or parsed.password
    ):
        raise ValueError("Enter a valid HTTPS Discord webhook URL.")
    return value.strip()
