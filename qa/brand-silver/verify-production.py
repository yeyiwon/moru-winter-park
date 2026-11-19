#!/usr/bin/env python3
"""Read-only release verification. Credentials enter through hidden stdin only."""
import concurrent.futures
import datetime
import hashlib
import json
import os
from pathlib import Path
import struct
import sys
from html.parser import HTMLParser
import urllib.error
import urllib.parse
import urllib.request

SOURCE = Path('/workspace/scratch/4bce338b713b/winter-brand-simple/web-dist')
PUBLIC_ORIGIN = 'https://moru-winter-park.vercel.app'
SITES_ORIGIN = 'https://bits-yeiwon-knowledge.expert-bass-1722.chatgpt.site'
ALLOWED_ORIGINS = {PUBLIC_ORIGIN, SITES_ORIGIN}
REVISION = 'silver-blue-v1'
TIMEOUT_SECONDS = 15
MAX_RESPONSE_BYTES = 5 * 1024 * 1024
ASSETS = (
    ('/brand/og-image.png', 'brand/og-image.png', (1200, 630)),
    ('/brand/logo-compact.svg', 'brand/logo-compact.svg', None),
    ('/brand/favicon.svg', 'brand/favicon.svg', None),
    ('/site.webmanifest', 'site.webmanifest', None),
    ('/brand.css', 'brand.css', None),
    ('/luminous-loading.js', 'luminous-loading.js', None),
    ('/brand/preview.html', 'brand/preview.html', None),
    ('/sw.js', 'sw.js', None),
)


def read_config():
    original = None
    if sys.stdin.isatty():
        import termios
        original = termios.tcgetattr(sys.stdin.fileno())
        quiet = original[:]
        quiet[3] &= ~(termios.ECHO | termios.ECHONL)
        termios.tcsetattr(sys.stdin.fileno(), termios.TCSANOW, quiet)
    try:
        print('Ready for production verification JSON on stdin (input hidden).', flush=True)
        line = sys.stdin.readline(65537)
    finally:
        if original is not None:
            termios.tcsetattr(sys.stdin.fileno(), termios.TCSANOW, original)
    if not line or len(line) > 65536:
        raise ValueError('Expected one bounded JSON object on stdin.')
    try:
        config = json.loads(line)
    except (ValueError, TypeError):
        raise ValueError('Expected one JSON object on stdin.') from None
    if not isinstance(config, dict):
        raise ValueError('Expected a JSON object.')
    origin = config.get('origin')
    if not isinstance(origin, str):
        raise ValueError('origin must be one of the two approved HTTPS origins.')
    origin = origin.rstrip('/')
    if origin not in ALLOWED_ORIGINS:
        raise ValueError('origin must be one of the two approved HTTPS origins.')
    token = config.get('token') or ''
    if not isinstance(token, str) or any(c in token for c in '\r\n'):
        raise ValueError('Invalid token input.')
    if token and origin != SITES_ORIGIN:
        raise ValueError('A Sites token may only be sent to the approved Sites origin.')
    output = config.get('output')
    if output is not None and (not isinstance(output, str) or not Path(output).is_absolute()):
        raise ValueError('output must be an absolute file path when provided.')
    return origin, token, output


class SameOriginRedirect(urllib.request.HTTPRedirectHandler):
    max_redirections = 3
    max_repeats = 2

    def __init__(self, origin):
        self.origin = origin

    def redirect_request(self, request, response, code, message, headers, new_url):
        target = urllib.parse.urlsplit(urllib.parse.urljoin(request.full_url, new_url))
        if f'{target.scheme}://{target.netloc}' != self.origin:
            raise urllib.error.HTTPError(request.full_url, code, 'Cross-origin redirect refused', headers, response)
        return super().redirect_request(request, response, code, message, headers, new_url)


class TitleParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.in_title = False
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag == 'title':
            self.in_title = True

    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.parts.append(data)


def png_dimensions(body):
    if len(body) < 24 or body[:8] != b'\x89PNG\r\n\x1a\n' or body[12:16] != b'IHDR':
        return None
    return list(struct.unpack('>II', body[16:24]))


def source_specs():
    specs = [{'path': '/', 'kind': 'title'}]
    for url_path, relative, dimensions in ASSETS:
        body = (SOURCE / relative).read_bytes()
        if dimensions and png_dimensions(body) != list(dimensions):
            raise ValueError('The expected local PNG dimensions do not match this release.')
        query = '' if url_path == '/sw.js' else '?v=' + REVISION
        specs.append({'path': url_path + query, 'kind': 'asset', 'source': relative,
                      'expected_sha256': hashlib.sha256(body).hexdigest(),
                      'expected_bytes': len(body), 'expected_dimensions': list(dimensions) if dimensions else None})
    specs.extend([{'path': '/api/health', 'kind': 'health'},
                  {'path': '/api/access', 'kind': 'access'}])
    return specs


def check(spec, origin, token):
    result = {'path': spec['path'], 'ok': False}
    headers = {'User-Agent': 'Silver-blue-release-verification/1.0', 'Cache-Control': 'no-cache'}
    if token:
        headers['OAI-Sites-Authorization'] = 'Bearer ' + token
    try:
        # A separate opener per worker avoids shared redirect state and cookies.
        opener = urllib.request.build_opener(SameOriginRedirect(origin))
        request = urllib.request.Request(origin + spec['path'], headers=headers, method='GET')
        with opener.open(request, timeout=TIMEOUT_SECONDS) as response:
            body = response.read(MAX_RESPONSE_BYTES + 1)
            result.update(status=response.status, content_type=response.headers.get('Content-Type', '').split(';', 1)[0], bytes=len(body))
        if len(body) > MAX_RESPONSE_BYTES:
            raise ValueError('Response exceeded the verification size limit.')
        ok = result['status'] == 200
        if spec['kind'] == 'asset':
            actual = hashlib.sha256(body).hexdigest()
            result.update(sha256=actual, expected_sha256=spec['expected_sha256'], expected_bytes=spec['expected_bytes'])
            ok = ok and actual == spec['expected_sha256'] and len(body) == spec['expected_bytes']
            if spec['expected_dimensions']:
                result.update(dimensions=png_dimensions(body), expected_dimensions=spec['expected_dimensions'])
                ok = ok and result['dimensions'] == spec['expected_dimensions']
        elif spec['kind'] == 'title':
            parser = TitleParser()
            parser.feed(body.decode('utf-8'))
            result['title'] = ''.join(parser.parts).strip()
            ok = ok and result['title'] == 'WINTERLIGHT'
        elif spec['kind'] == 'health':
            data = json.loads(body)
            result['health'] = {'ok': data.get('ok') is True, 'multiplayer': data.get('multiplayer') is True}
            ok = ok and all(result['health'].values())
        elif spec['kind'] == 'access':
            data = json.loads(body)
            # Do not retain a session value, user data, cookies, or invite tokens.
            result['access'] = {'worldId': 'winter-plaza' if data.get('worldId') == 'winter-plaza' else '[unexpected or missing]',
                                'inviteRequired': data.get('inviteRequired') is True,
                                'sessionIsNull': 'session' in data and data['session'] is None}
            ok = ok and result['access']['worldId'] == 'winter-plaza' and result['access']['inviteRequired'] and result['access']['sessionIsNull']
        result['ok'] = bool(ok)
    except urllib.error.HTTPError as error:
        result.update(status=error.code, error='HTTP request or same-origin redirect check failed.')
    except Exception as error:
        # Never serialize request/config objects or remote response bodies.
        result['error'] = f'{type(error).__name__}: verification request or response validation failed.'
    return result


def main():
    origin, token, output = read_config()
    specs = source_specs()
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(lambda spec: check(spec, origin, token), specs))
    report = {'origin': origin,
              'checked_at_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'authentication': 'Sites owner verification' if token else 'anonymous public HTTP',
              'expected_source_directory': str(SOURCE),
              'revision': REVISION,
              'passed': all(result['ok'] for result in results),
              'check_count': len(results),
              'checks': results}
    serialized = json.dumps(report, ensure_ascii=False, indent=2) + '\n'
    # Defense in depth: the credential must never appear in files or output,
    # even if a server unexpectedly includes it in a reported title/header.
    if token:
        serialized = serialized.replace(token, '[REDACTED]')
    if output:
        destination = Path(output)
        destination.parent.mkdir(parents=True, exist_ok=True)
        temporary = destination.with_name(destination.name + f'.tmp-{os.getpid()}')
        temporary.write_text(serialized, encoding='utf-8')
        temporary.replace(destination)
    print(serialized, end='', flush=True)
    return 0 if report['passed'] else 1


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as error:
        # Startup/output failures are intentionally reported without input data.
        print(json.dumps({'passed': False, 'error': f'{type(error).__name__}: verification setup or result saving failed.'}), flush=True)
        sys.exit(2)
