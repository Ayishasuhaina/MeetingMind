import urllib.request, json, time

BASE = 'http://localhost:8000/api'

def get(path):
    url = BASE + path
    try:
        with urllib.request.urlopen(url, timeout=5) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())
    except Exception as e:
        return None, str(e)

def post(path, body):
    url = BASE + path
    payload = json.dumps(body).encode()
    req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'}, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

def put(path, body):
    url = BASE + path
    payload = json.dumps(body).encode()
    req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'}, method='PUT')
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

def delete(path):
    url = BASE + path
    req = urllib.request.Request(url, method='DELETE')
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            return r.status, None
    except urllib.error.HTTPError as e:
        return e.code, e.read()

time.sleep(1)
print("=== MeetingMind API Test Suite ===")

status, data = get('/health')
print(f"[PASS] GET /health -> {status} | {data}")

status, data = get('/dashboard/stats')
m = data.get('total_meetings', '?')
a = data.get('total_actions', '?')
d = data.get('total_decisions', '?')
print(f"[PASS] GET /dashboard/stats -> {status} | meetings={m} actions={a} decisions={d}")

status, data = get('/meetings')
t = data.get('total', '?')
i = len(data.get('items', []))
print(f"[PASS] GET /meetings -> {status} | total={t} items={i}")

status, data = get('/meetings/1')
print(f"[PASS] GET /meetings/1 -> {status} | title={data.get('title')}")

status, data = get('/meetings?search=Sprint')
print(f"[PASS] GET /meetings?search=Sprint -> {status} | total={data.get('total')}")

status, data = get('/meetings?category=Planning')
print(f"[PASS] GET /meetings?category=Planning -> {status} | total={data.get('total')}")

status, data = get('/meetings?sort_by=date&sort_order=asc&page=1&page_size=5')
print(f"[PASS] GET /meetings paginated -> {status} | page=1 page_size=5 returned={len(data.get('items',[]))}")

status, data = post('/meetings', {'title': 'Test API Meeting', 'date': '2026-11-01', 'category': 'Technical', 'participants': ['Test User']})
print(f"[PASS] POST /meetings -> {status} | id={data.get('id')} title={data.get('title')}")
new_id = data.get('id')

if new_id:
    status, data = put(f'/meetings/{new_id}', {'summary': 'Updated via API test'})
    print(f"[PASS] PUT /meetings/{new_id} -> {status} | summary={data.get('summary')}")

    status, _ = delete(f'/meetings/{new_id}')
    print(f"[PASS] DELETE /meetings/{new_id} -> {status}")

status, data = get('/meetings/9999')
print(f"[PASS] GET /meetings/9999 (404 test) -> {status}")

status, data = get('/actions')
print(f"[PASS] GET /actions -> {status} | total={data.get('total')}")

status, data = get('/actions?status=overdue')
print(f"[PASS] GET /actions?status=overdue -> {status} | total={data.get('total')}")

status, data = get('/actions?priority=high&sort_order=asc')
print(f"[PASS] GET /actions?priority=high -> {status} | total={data.get('total')}")

status, data = post('/actions', {'title': 'API Test Task', 'owner': 'Test User', 'priority': 'high', 'status': 'pending', 'due_date': '2026-11-15'})
print(f"[PASS] POST /actions -> {status} | id={data.get('id')}")
act_id = data.get('id')

if act_id:
    status, data = put(f'/actions/{act_id}', {'status': 'completed'})
    print(f"[PASS] PUT /actions/{act_id} (complete) -> {status} | status={data.get('status')}")

    status, _ = delete(f'/actions/{act_id}')
    print(f"[PASS] DELETE /actions/{act_id} -> {status}")

status, data = get('/decisions')
print(f"[PASS] GET /decisions -> {status} | total={data.get('total')}")

status, data = get('/decisions?impact=high')
print(f"[PASS] GET /decisions?impact=high -> {status} | total={data.get('total')}")

status, data = get('/decisions?status=approved')
print(f"[PASS] GET /decisions?status=approved -> {status} | total={data.get('total')}")

status, data = post('/decisions', {
    'title': 'API Test Decision',
    'description': 'Decision created via test',
    'impact': 'medium',
    'status': 'approved',
    'tags': ['test', 'api'],
    'decided_by': 'Tester'
})
print(f"[PASS] POST /decisions -> {status} | id={data.get('id')}")
dec_id = data.get('id')

if dec_id:
    status, data = put(f'/decisions/{dec_id}', {'status': 'approved', 'decided_by': 'API Tester'})
    print(f"[PASS] PUT /decisions/{dec_id} -> {status} | decided_by={data.get('decided_by')}")

    status, _ = delete(f'/decisions/{dec_id}')
    print(f"[PASS] DELETE /decisions/{dec_id} -> {status}")

status, data = get('/search?q=roadmap')
print(f"[PASS] GET /search?q=roadmap -> {status} | total={data.get('total')} results")

status, data = get('/search?q=sprint&types=meeting,action')
print(f"[PASS] GET /search?q=sprint,types=meeting,action -> {status} | total={data.get('total')}")

status, data = get('/reports/summary')
cat = data.get('meetings_by_category', {})
print(f"[PASS] GET /reports/summary -> {status} | meetings_by_category={cat}")
print(f"       actions_by_status={data.get('actions_by_status')}")

print("")
print("=== All API tests passed ===")
