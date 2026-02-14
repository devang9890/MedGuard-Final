import requests, json

# Test Himalaya
r = requests.post('http://localhost:8000/public/verify/medicine', params={'medicine_name': 'Himalaya'})
d = r.json()
print(f"Verdict: {d['verdict']}")
print(f"Confidence: {d['confidence']}%")

# Test Himalaya with batch
r2 = requests.post('http://localhost:8000/public/verify/medicine', params={'medicine_name': 'Himalaya', 'batch_number': 'TEST-BATCH'})
d2 = r2.json()
print(f"\nWith batch:")
print(f"Verdict: {d2['verdict']}")
print(f"Confidence: {d2['confidence']}%")
