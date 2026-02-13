"""
Batch Intelligence Engine
AI-powered batch number analysis without relying solely on database
Analyzes format, patterns, anomalies, and similarity to known fakes
"""
import re
from datetime import datetime
from typing import Dict, List, Tuple
import hashlib

# Known pharmaceutical manufacturer prefixes/patterns (expandable)
PHARMA_PATTERNS = {
    "BD": {"name": "Beximco", "country": "Bangladesh", "trust": 85},
    "SQ": {"name": "Square", "country": "Bangladesh", "trust": 90},
    "INC": {"name": "Incepta", "country": "Bangladesh", "trust": 85},
    "ACI": {"name": "ACI", "country": "Bangladesh", "trust": 88},
    "AMX": {"name": "Amoxil", "country": "Various", "trust": 70},
    "PCM": {"name": "Paracetamol Generic", "country": "Various", "trust": 65},
    "CPL": {"name": "Cipla", "country": "India", "trust": 92},
    "SUN": {"name": "Sun Pharma", "country": "India", "trust": 90},
    "TOR": {"name": "Torrent", "country": "India", "trust": 85},
    "LUP": {"name": "Lupin", "country": "India", "trust": 87},
}

# Known fake batch patterns (machine learning dataset)
KNOWN_FAKE_PATTERNS = [
    r"^(FAKE|TEST|DEMO|XXX|000|999)",  # Obvious test/fake
    r"^[A-Z]{1,2}-0{4,}",  # Too many zeros
    r"^[0-9]{10,}$",  # Just numbers (too long)
    r"^[A-Z]{10,}$",  # Just letters (too long)
    r"^.{1,2}$",  # Too short
    r"^(ABC|XYZ|QWE|AAA|BBB|CCC)",  # Common test patterns
]

# Suspicious indicators
SUSPICIOUS_INDICATORS = [
    r"[^A-Za-z0-9\-_]",  # Special characters
    r"(\d)\1{4,}",  # Repeated digits (11111, 22222)
    r"([A-Z])\1{3,}",  # Repeated letters (AAAA, BBBB)
    r"^[a-z]+$",  # All lowercase (unusual)
]

# Valid pharmaceutical batch format patterns
VALID_FORMATS = [
    r"^[A-Z]{2,4}-\d{4,6}$",  # BD-0111, CPL-123456
    r"^[A-Z]{2,4}\d{6,10}$",  # BD123456, CPL20260101
    r"^[A-Z]{3}-[A-Z]{2,3}-\d{4}$",  # AMX-IND-9923
    r"^[A-Z]{2,3}-[0-9]{2}[A-Z]{1}[0-9]{4}$",  # BD-24A7781
    r"^BATCH\d{3,6}$",  # BATCH001, BATCH123456
]


class BatchIntelligenceEngine:
    """
    AI-powered batch verification that works even without database match
    """
    
    def __init__(self):
        self.pharma_patterns = PHARMA_PATTERNS
        self.fake_patterns = KNOWN_FAKE_PATTERNS
        self.suspicious_indicators = SUSPICIOUS_INDICATORS
        self.valid_formats = VALID_FORMATS
    
    def analyze_batch(self, batch_number: str, manufacturer: str = None) -> Dict:
        """
        Complete intelligent analysis of batch number
        Returns confidence score and reasoning WITHOUT requiring DB match
        """
        batch_number = batch_number.strip()
        
        # Initialize analysis results
        analysis = {
            "batch_number": batch_number,
            "manufacturer_input": manufacturer,
            "format_analysis": {},
            "pattern_recognition": {},
            "fake_similarity": {},
            "anomaly_signals": {},
            "trust_inference": {},
            "confidence_score": 50.0,  # Start neutral
            "reasoning": [],
            "risk_flags": []
        }
        
        # Run all analysis modules
        analysis["format_analysis"] = self._analyze_format(batch_number)
        analysis["pattern_recognition"] = self._recognize_patterns(batch_number)
        analysis["fake_similarity"] = self._check_fake_similarity(batch_number)
        analysis["anomaly_signals"] = self._detect_anomalies(batch_number)
        analysis["trust_inference"] = self._infer_trust(batch_number, manufacturer)
        
        # Calculate final confidence
        analysis["confidence_score"] = self._calculate_confidence(analysis)
        
        # Generate reasoning
        analysis["reasoning"] = self._generate_reasoning(analysis)
        
        return analysis
    
    def _analyze_format(self, batch_number: str) -> Dict:
        """
        Analyze batch number format structure
        """
        result = {
            "length": len(batch_number),
            "has_prefix": False,
            "has_separator": False,
            "has_numbers": False,
            "has_letters": False,
            "format_valid": False,
            "format_confidence": 0.0
        }
        
        # Check components
        result["has_numbers"] = bool(re.search(r"\d", batch_number))
        result["has_letters"] = bool(re.search(r"[A-Za-z]", batch_number))
        result["has_separator"] = bool(re.search(r"[-_]", batch_number))
        
        # Check against valid formats
        for pattern in self.valid_formats:
            if re.match(pattern, batch_number, re.IGNORECASE):
                result["format_valid"] = True
                result["format_confidence"] = 85.0
                break
        
        # Partial validation
        if not result["format_valid"]:
            if result["has_numbers"] and result["has_letters"]:
                result["format_confidence"] = 50.0
            elif len(batch_number) >= 5 and len(batch_number) <= 20:
                result["format_confidence"] = 40.0
            else:
                result["format_confidence"] = 20.0
        
        # Check for known prefix
        prefix = batch_number[:2].upper() if len(batch_number) >= 2 else ""
        if prefix in self.pharma_patterns:
            result["has_prefix"] = True
            result["recognized_manufacturer"] = self.pharma_patterns[prefix]["name"]
            result["format_confidence"] += 10.0
        
        return result
    
    def _recognize_patterns(self, batch_number: str) -> Dict:
        """
        Recognize pharmaceutical patterns and manufacturer signatures
        """
        result = {
            "recognized_manufacturer": None,
            "manufacturer_confidence": 0.0,
            "pattern_type": "unknown",
            "structure_score": 50.0
        }
        
        # Extract prefix
        prefix_match = re.match(r"^([A-Z]{2,4})", batch_number.upper())
        if prefix_match:
            prefix = prefix_match.group(1)
            
            # Check known manufacturers
            if prefix in self.pharma_patterns:
                mfg = self.pharma_patterns[prefix]
                result["recognized_manufacturer"] = mfg["name"]
                result["manufacturer_confidence"] = mfg["trust"]
                result["pattern_type"] = "registered_manufacturer"
                result["structure_score"] = 80.0
            else:
                result["pattern_type"] = "unregistered_prefix"
                result["structure_score"] = 40.0
        
        # Check for batch keyword patterns
        if re.match(r"^BATCH", batch_number.upper()):
            result["pattern_type"] = "generic_batch"
            result["structure_score"] = 60.0
        
        # Check date patterns (some manufacturers include dates)
        date_pattern = r"(20\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])"
        if re.search(date_pattern, batch_number):
            result["has_date_encoding"] = True
            result["structure_score"] += 15.0
        
        return result
    
    def _check_fake_similarity(self, batch_number: str) -> Dict:
        """
        Check similarity to known fake patterns
        """
        result = {
            "matches_fake_pattern": False,
            "fake_similarity_score": 0.0,
            "matched_patterns": [],
            "risk_level": "low"
        }
        
        # Check against known fake patterns
        for pattern in self.fake_patterns:
            if re.search(pattern, batch_number, re.IGNORECASE):
                result["matches_fake_pattern"] = True
                result["matched_patterns"].append(pattern)
                result["fake_similarity_score"] += 20.0
        
        # Check suspicious indicators
        for indicator in self.suspicious_indicators:
            if re.search(indicator, batch_number):
                result["fake_similarity_score"] += 10.0
        
        # Clamp score
        result["fake_similarity_score"] = min(100.0, result["fake_similarity_score"])
        
        # Determine risk level
        if result["fake_similarity_score"] >= 50:
            result["risk_level"] = "high"
        elif result["fake_similarity_score"] >= 30:
            result["risk_level"] = "medium"
        else:
            result["risk_level"] = "low"
        
        return result
    
    def _detect_anomalies(self, batch_number: str) -> Dict:
        """
        Detect anomalous patterns using heuristics
        """
        result = {
            "length_anomaly": False,
            "repetition_anomaly": False,
            "character_anomaly": False,
            "anomaly_score": 0.0
        }
        
        # Length check
        if len(batch_number) < 4 or len(batch_number) > 25:
            result["length_anomaly"] = True
            result["anomaly_score"] += 15.0
        
        # Repetition check
        if re.search(r"(.)\1{3,}", batch_number):
            result["repetition_anomaly"] = True
            result["anomaly_score"] += 20.0
        
        # Character diversity check
        unique_chars = len(set(batch_number.lower()))
        if unique_chars < 4 and len(batch_number) > 6:
            result["character_anomaly"] = True
            result["anomaly_score"] += 15.0
        
        # All numbers or all letters (edge case)
        if batch_number.isdigit() and len(batch_number) > 8:
            result["character_anomaly"] = True
            result["anomaly_score"] += 10.0
        elif batch_number.isalpha() and len(batch_number) > 6:
            result["character_anomaly"] = True
            result["anomaly_score"] += 10.0
        
        return result
    
    def _infer_trust(self, batch_number: str, manufacturer: str = None) -> Dict:
        """
        Infer trustworthiness from batch structure and manufacturer
        """
        result = {
            "inferred_trust_score": 50.0,
            "manufacturer_verified": False,
            "trust_signals": []
        }
        
        # Check manufacturer input against prefix
        prefix = batch_number[:2].upper() if len(batch_number) >= 2 else ""
        
        if prefix in self.pharma_patterns:
            pharma_info = self.pharma_patterns[prefix]
            result["inferred_trust_score"] = pharma_info["trust"]
            
            # If manufacturer provided, check match
            if manufacturer:
                if pharma_info["name"].lower() in manufacturer.lower():
                    result["manufacturer_verified"] = True
                    result["trust_signals"].append("Manufacturer matches batch prefix")
                    result["inferred_trust_score"] += 10.0
                else:
                    result["trust_signals"].append("Manufacturer mismatch with prefix")
                    result["inferred_trust_score"] -= 15.0
        
        # Professional format increases trust
        if re.match(r"^[A-Z]{2,4}-\d{4,6}$", batch_number):
            result["trust_signals"].append("Professional batch format")
            result["inferred_trust_score"] += 5.0
        
        # Clamp
        result["inferred_trust_score"] = max(0.0, min(100.0, result["inferred_trust_score"]))
        
        return result
    
    def _calculate_confidence(self, analysis: Dict) -> float:
        """
        Calculate final confidence score from all signals
        """
        confidence = 50.0  # Neutral baseline
        
        # Format analysis impact (±30)
        format_conf = analysis["format_analysis"].get("format_confidence", 50.0)
        confidence += (format_conf - 50.0) * 0.6
        
        # Pattern recognition impact (±25)
        pattern_score = analysis["pattern_recognition"].get("structure_score", 50.0)
        confidence += (pattern_score - 50.0) * 0.5
        
        # Fake similarity impact (-40)
        fake_score = analysis["fake_similarity"].get("fake_similarity_score", 0.0)
        confidence -= fake_score * 0.8
        
        # Anomaly detection impact (-30)
        anomaly_score = analysis["anomaly_signals"].get("anomaly_score", 0.0)
        confidence -= anomaly_score * 0.6
        
        # Trust inference impact (±20)
        trust_score = analysis["trust_inference"].get("inferred_trust_score", 50.0)
        confidence += (trust_score - 50.0) * 0.4
        
        # Clamp to 0-100
        confidence = max(0.0, min(100.0, confidence))
        
        return round(confidence, 1)
    
    def _generate_reasoning(self, analysis: Dict) -> List[str]:
        """
        Generate human-readable reasoning for the verdict
        """
        reasons = []
        
        # Format analysis
        format_valid = analysis["format_analysis"].get("format_valid", False)
        if format_valid:
            reasons.append("✓ Valid pharmaceutical batch format detected")
        else:
            reasons.append("⚠ Batch format does not match standard pharmaceutical patterns")
        
        # Recognized manufacturer
        recognized = analysis["pattern_recognition"].get("recognized_manufacturer")
        if recognized:
            reasons.append(f"✓ Recognized manufacturer: {recognized}")
        else:
            reasons.append("⚠ Manufacturer prefix not recognized in database")
        
        # Fake similarity
        if analysis["fake_similarity"].get("matches_fake_pattern"):
            reasons.append("🚨 Matches known fake batch patterns")
        
        risk_level = analysis["fake_similarity"].get("risk_level", "low")
        if risk_level == "high":
            reasons.append("🚨 High similarity to counterfeit batches")
        
        # Anomalies
        if analysis["anomaly_signals"].get("repetition_anomaly"):
            reasons.append("⚠ Unusual character repetition detected")
        if analysis["anomaly_signals"].get("length_anomaly"):
            reasons.append("⚠ Batch length outside normal range")
        
        # Trust signals
        if analysis["trust_inference"].get("manufacturer_verified"):
            reasons.append("✓ Manufacturer name matches batch prefix")
        
        trust_score = analysis["trust_inference"].get("inferred_trust_score", 50)
        if trust_score >= 80:
            reasons.append("✓ High-trust manufacturer inferred")
        elif trust_score < 40:
            reasons.append("⚠ Low-trust signals detected")
        
        return reasons


# Singleton instance
intelligence_engine = BatchIntelligenceEngine()
