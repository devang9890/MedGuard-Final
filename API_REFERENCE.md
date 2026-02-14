API REFERENCE: MEDICINE-NAME-FIRST VERIFICATION
=================================================

## NEW ENDPOINT

### POST /public/verify/medicine

**Purpose:** Medicine-name-first verification (primary workflow)

**Request Parameters:**
```
Query Parameters:
  - medicine_name (string, required): Medicine brand name
    Example: "Aspirin", "Crocin", "Amoxycillin", "Himalaya", "SBL"
    
  - batch_number (string, optional): Batch number for enhanced accuracy
    Example: "BD-0111", "CRN500-K23-119"
    
  - device_id (string, optional): Device identifier for analytics
    Example: "mobile_app_v2"

Example Request:
  POST /public/verify/medicine?medicine_name=Aspirin&batch_number=BD-0111
```

**Authentication:** None (public endpoint)

**Rate Limit:** 100 requests/minute per IP

---

## RESPONSE FORMAT

### Success (200 OK)

```json
{
  "verdict": "SAFE",
  "confidence": 90.0,
  "sources": [
    "BRAND_MAPPING",
    "CDSCO_VERIFIED",
    "BATCH_VERIFIED",
    "TRUSTED_SUPPLIER"
  ],
  "warnings": [],
  "risk_flags": [],
  
  "medicine_details": {
    "name": "Aspirin",
    "brand_name": "Aspirin",
    "inferred_manufacturer": "Bayer",
    "all_manufacturers": ["Bayer", "Sun Pharma", "Cipla", "Lupin"],
    "category": "Analgesic",
    "batch_number": "BD-0111",
    "database_match": true,
    "brand_found": true
  },
  
  "cdsco": {
    "cdsco_match": true,
    "manufacturer_verified": true,
    "details": {
      "manufacturer_name": "Bayer",
      "country": "India",
      "status": "Approved",
      "category": "Allopathic",
      "state": "Maharashtra"
    },
    "confidence_modifier": 35,
    "status": "Approved"
  },
  
  "analysis_metadata": {
    "input_method": "medicine_name",
    "batch_provided": true,
    "brand_confidence": 100.0,
    "cdsco_verified": true
  },
  
  "reasoning": [
    "✓ Medicine 'Aspirin' recognized in database",
    "✓ Manufacturer 'Bayer' verified in CDSCO registry (Approved)",
    "✓ Batch number verified in database",
    "✓ Normal pattern (no counterfeits)"
  ],
  
  "recommendation": "✅ This medicine appears to be authentic and safe. You may proceed with confidence."
}
```

### Error (400 Bad Request)

```json
{
  "detail": "Please enter a medicine name"
}
```

### Server Error (500)

```json
{
  "detail": "System error during verification. Please try again."
}
```

---

## VERDICT VALUES

| Verdict | Score | Meaning |
|---------|-------|---------|
| `SAFE` | 80-100 | Verified authentic, all signals positive |
| `LIKELY_AUTHENTIC` | 60-79 | Probably authentic, minor uncertainties |
| `UNKNOWN` | 40-59 | Cannot conclusively verify |
| `SUSPICIOUS` | 20-39 | Multiple warning signals present |
| `HIGH_RISK_FAKE` | 0-19 | Strong indicators of counterfeit |

---

## CONFIDENCE SCORE CALCULATION

### Example 1: Medicine Name Only

```
Input: medicine_name="Crocin"

Processing:
  1. Brand lookup: "Crocin" found (100% match) → +40
  2. Infer manufacturer: "GlaxoSmithKline"
  3. CDSCO check: GlaxoSmithKline → Approved → +35
  4. No batch provided: 0
  5. No batch expiry check: 0
  
Final: 40 + 35 = 75 → LIKELY_AUTHENTIC
```

### Example 2: Medicine Name + Batch

```
Input: medicine_name="Cipla", batch_number="BD-0111"

Processing:
  1. Brand lookup: "Cipla" found (100%) → +40
  2. Manufacturer: "Cipla"
  3. CDSCO check: Cipla → Approved → +35
  4. Batch lookup: Found in DB → +15
  5. Batch valid (not expired): 0
  
Final: 40 + 35 + 15 = 90 → SAFE
```

### Example 3: Unknown Medicine

```
Input: medicine_name="XyzUnknownBrand"

Processing:
  1. Brand lookup: NOT FOUND → 0
  2. No manufacturer inferred: 0
  3. CDSCO check: SKIPPED (no manufacturer) → 0
  4. No batch or DB match: 0
  5. Default minimum: 15
  
Final: 15 → UNKNOWN
```

---

## CDSCO CONFIDENCE MODIFIERS

| Condition | Modifier | Notes |
|-----------|----------|-------|
| Manufacturer Approved | +35 | Verified in CDSCO registry |
| Manufacturer Provisional | +10 | Under CDSCO review process |
| Manufacturer Not Found | -30 | Critical - not in registry |

---

## SOURCES LIST (audit trail)

Possible sources that contributed to verdict:

```
"BRAND_MAPPING"           - Medicine found in brand mapping DB
"CDSCO_VERIFIED"          - Manufacturer verified in CDSCO
"BATCH_VERIFIED"          - Batch found in MedGuard DB
"TRUSTED_SUPPLIER"        - Supplier has high trust score
"CDSCO_TRUSTED_MFG"       - Manufacturer is CDSCO-approved
"IMAGE_ANALYSIS"          - Package image analyzed
```

---

## RISK FLAGS (warnings)

Possible risk signals:

```
"MANUFACTURER_NOT_IN_CDSCO"     - Not registered with CDSCO
"BATCH_NOT_IN_DATABASE"         - Batch not in MedGuard DB
"BATCH_EXPIRED"                 - Past expiry date
"TEMPERATURE_ALERT"             - Storage temperature anomaly
"ANOMALIES_DETECTED_n"          - n anomalies found
"MATCHES_FAKE_PATTERN"          - Matches known counterfeits
"LOW_TRUST_SUPPLIER"            - Supplier has low score
```

---

## CURL EXAMPLES

### Test 1: Simple Verification

```bash
curl -X POST "http://localhost:8000/public/verify/medicine?medicine_name=Aspirin"
```

### Test 2: With Batch

```bash
curl -X POST "http://localhost:8000/public/verify/medicine?medicine_name=Cipla&batch_number=BD-0111"
```

### Test 3: With Device ID (analytics)

```bash
curl -X POST "http://localhost:8000/public/verify/medicine?medicine_name=Crocin&device_id=mobile_app_v2"
```

### Test 4: Pretty-print Response

```bash
curl -s -X POST "http://localhost:8000/public/verify/medicine?medicine_name=Aspirin" | json_pp
```

---

## JAVASCRIPT/AXIOS EXAMPLE

```javascript
// Basic usage
const response = await axios.post(
  'http://localhost:8000/public/verify/medicine',
  null,  // no body
  {
    params: {
      medicine_name: 'Aspirin',
      batch_number: 'BD-0111'  // optional
    },
    timeout: 15000
  }
);

console.log(response.data.verdict);        // "SAFE"
console.log(response.data.confidence);     // 90.0
console.log(response.data.cdsco.cdsco_match);  // true

// Handle errors
try {
  const result = await axios.post(
    `${API_URL}/public/verify/medicine?medicine_name=${name}`,
    null
  );
  displayVerdict(result.data);
} catch (error) {
  console.error('Verification failed:', error.response?.data?.detail);
}
```

---

## PERFORMANCE METRICS

| Operation | Time | Notes |
|-----------|------|-------|
| Brand lookup | <1ms | In-memory JSON search |
| CDSCO verification | <5ms | String comparison |
| Batch DB lookup | 10-50ms | Depends on DB size |
| Full pipeline (avg) | 50-100ms | Typical response time |
| Full pipeline (95th %ile) | <500ms | Worst case scenario |

---

## BACKWARD COMPATIBILITY

**All existing endpoints remain unchanged:**

```
POST /public/verify/batch?batch_number=BD-0111
POST /public/verify/barcode (file upload)
POST /public/verify/image (file upload)
GET /public/verify/test
```

New medicine-name endpoint is **additive, not replacement**.

---

## MIGRATION GUIDE

### For Frontend Developers

**Old Code:**
```javascript
// Batch-focused
const result = await axios.post(
  '/verify/batch?batch_number=BD-0111&manufacturer=Cipla'
);
```

**New Code:**
```javascript
// Medicine-name-focused (simpler)
const result = await axios.post(
  '/verify/medicine?medicine_name=Aspirin&batch_number=BD-0111'
);
```

### For Backend Developers

**Old Implementation:**
```python
# Batch search → DB lookup → Result
def verify(batch_number: str):
    batch = db.find_batch(batch_number)
    ...
```

**New Implementation:**
```python
# Medicine name → Brand mapping → CDSCO → Batch (optional)
async def verify_by_medicine_name(medicine_name: str, batch_number: Optional[str]):
    brand_result = await find_manufacturer_by_brand(medicine_name)
    cdsco_result = await verify_manufacturer(brand_result.primary_manufacturer)
    batch_result = await db.find_batch(batch_number) if batch_number else None
    ...
```

---

## SUPPORTED MEDICINE BRANDS (Sample)

### Allopathic
- Aspirin, Crocin, Dolo, Paracetamol
- Combiflam, Ibugesic, Brufen
- Amoxycillin, Augmentin, Zifi, Azithral
- Omeprazole, Pantoprazole, Ranitidine
- Atorvastatin, Amlodipine, Metformin

### Ayurvedic
- Himalaya, Baidyanath, Patanjali
- Arjun, Organic India

### Homeopathic
- SBL, Reckeweg, Boiron, Heel

**View all 50+ brands:** `GET /api/brands` (planned endpoint)

---

**API Version:** 2.0.0
**Last Updated:** February 14, 2026
**Status:** Production Ready
