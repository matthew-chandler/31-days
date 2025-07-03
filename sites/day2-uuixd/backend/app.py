from flask import Flask, request, abort, jsonify, Response
from flask_cors import CORS, cross_origin
from threading import Lock
import datetime
from collections import defaultdict, Counter
import os
import requests as pyrequests
from werkzeug.middleware.proxy_fix import ProxyFix  # <-- Add this import

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1)  # <-- Add this line
CORS(app, origins=["https://uuixd.machandler.com"])  # Restrict CORS to your frontend domain

COUNTER_FILE = 'recent_uuid.tmp'
COUNTRY_FILE = 'country_counts.tmp'

def load_counter():
    if os.path.exists(COUNTER_FILE):
        try:
            with open(COUNTER_FILE, 'r') as f:
                return int(f.read().strip())
        except Exception:
            return 0
    return 0

def save_counter(value):
    try:
        with open(COUNTER_FILE, 'w') as f:
            f.write(str(value))
    except Exception:
        pass

def load_country_counts():
    if os.path.exists(COUNTRY_FILE):
        try:
            with open(COUNTRY_FILE, 'r') as f:
                lines = f.readlines()
                return Counter({line.split(',')[0]: int(line.split(',')[1]) for line in lines if ',' in line})
        except Exception:
            return Counter()
    return Counter()

def save_country_counts(counter):
    try:
        with open(COUNTRY_FILE, 'w') as f:
            for country, count in counter.items():
                f.write(f"{country},{count}\n")
    except Exception:
        pass

# IP to country cache
ip_country_cache = {}

def get_country(ip):
    # Check cache first
    if ip in ip_country_cache:
        return ip_country_cache[ip]
    if ip == '127.0.0.1' or ip.startswith('192.168.') or ip.startswith('10.') or ip.startswith('172.'):
        ip_country_cache[ip] = 'Local'
        return 'Local'
    try:
        resp = pyrequests.get(f'https://ipapi.co/{ip}/country_name/', timeout=2)
        if resp.status_code == 200:
            country = resp.text.strip() or 'Unknown'
            ip_country_cache[ip] = country
            return country
    except Exception:
        pass
    ip_country_cache[ip] = 'Unknown'
    return 'Unknown'

uuid_int = load_counter()
uuid_lock = Lock()

country_counts = load_country_counts()
country_lock = Lock()

LOG_FILE = 'requests.log'

# Track requests per IP per day
ip_requests = defaultdict(lambda: {'date': datetime.date.today(), 'count': 0})
RATE_LIMIT = 10000

def log_request(req):
    with open(LOG_FILE, 'a') as f:
        f.write(f"{datetime.datetime.now().isoformat()} {req.remote_addr} {req.method} {req.path}\n")

def check_rate_limit(ip):
    today = datetime.date.today()
    record = ip_requests[ip]
    # Ensure 'date' is a date and 'count' is an int
    if not isinstance(record.get('date'), datetime.date) or record['date'] != today:
        record['date'] = today
        record['count'] = 0
    if not isinstance(record['count'], int):
        record['count'] = 0
    record['count'] += 1
    if record['count'] > RATE_LIMIT:
        return False
    return True

@app.route('/uuixd', methods=['GET'])
def increment_uuid():
    global uuid_int
    xff = request.headers.get('X-Forwarded-For')
    if xff:
        ip = xff.split(',')[0].strip()
    else:
        ip = request.remote_addr
    if not check_rate_limit(ip):
        abort(429, description=f"Rate limit exceeded: {RATE_LIMIT} requests per IP per day.")
    log_request(request)
    country = get_country(ip)
    with country_lock:
        country_counts[country] += 1
        save_country_counts(country_counts)
    with uuid_lock:
        value = uuid_int
        uuid_int += 1
        save_counter(uuid_int)
    hex_str = f'{value:032x}'
    uuid_str = f'{hex_str[0:8]}-{hex_str[8:12]}-{hex_str[12:16]}-{hex_str[16:20]}-{hex_str[20:32]}'
    return jsonify({"uuid": uuid_str})

@app.route('/leaderboard', methods=['GET'])
def leaderboard():
    with country_lock:
        top = country_counts.most_common(3)
    return jsonify([{ 'country': c, 'count': n } for c, n in top])

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002)
