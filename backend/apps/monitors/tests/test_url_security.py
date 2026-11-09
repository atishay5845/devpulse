from django.test import SimpleTestCase
from core.security import validate_public_http_url, validate_discord_webhook

class URLSecurityTests(SimpleTestCase):
    def test_rejects_localhost(self):
        with self.assertRaises(ValueError):
            validate_public_http_url("http://localhost/health")

    def test_rejects_private_ip(self):
        with self.assertRaises(ValueError):
            validate_public_http_url("http://127.0.0.1/health")

    def test_rejects_non_http_scheme(self):
        with self.assertRaises(ValueError):
            validate_public_http_url("file:///etc/passwd")

    def test_rejects_nonstandard_port(self):
        with self.assertRaises(ValueError):
            validate_public_http_url("https://example.com:8443/health")

    def test_rejects_non_discord_webhook_host(self):
        with self.assertRaises(ValueError):
            validate_discord_webhook("https://example.com/api/webhooks/123/token")
