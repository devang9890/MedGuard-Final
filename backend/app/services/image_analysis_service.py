"""
Image Analysis Service
Validates medicine images and performs basic packaging analysis
Placeholder for future CNN model integration
"""
import cv2
import numpy as np
from PIL import Image
import io
from typing import Dict, List


async def validate_image_quality(image_bytes: bytes) -> dict:
    """
    Validate image quality for analysis
    
    Checks resolution, clarity, format
    """
    try:
        # Load image
        image = Image.open(io.BytesIO(image_bytes))
        width, height = image.size
        
        signals = []
        quality_score = 100
        
        # Check resolution
        if width < 200 or height < 200:
            signals.append("low_resolution")
            quality_score -= 30
        elif width < 400 or height < 400:
            signals.append("medium_resolution")
            quality_score -= 10
        else:
            signals.append("good_resolution")
        
        # Check aspect ratio
        aspect_ratio = width / height
        if aspect_ratio < 0.5 or aspect_ratio > 2.0:
            signals.append("unusual_aspect_ratio")
            quality_score -= 10
        
        # Check file size
        file_size = len(image_bytes)
        if file_size < 10000:  # Less than 10KB
            signals.append("very_small_file")
            quality_score -= 20
        elif file_size > 10000000:  # More than 10MB
            signals.append("very_large_file")
            quality_score -= 10
        
        # Check format
        image_format = image.format
        if image_format not in ['JPEG', 'PNG', 'JPG']:
            signals.append("unsupported_format")
            quality_score -= 15
        
        return {
            "valid": quality_score >= 50,
            "quality_score": max(quality_score, 0),
            "signals": signals,
            "dimensions": {"width": width, "height": height},
            "format": image_format,
            "file_size": file_size
        }
        
    except Exception as e:
        return {
            "valid": False,
            "quality_score": 0,
            "signals": ["image_load_error"],
            "error": str(e)
        }


async def analyze_image_blur(image_bytes: bytes) -> dict:
    """
    Detect if image is too blurry for analysis
    
    Uses Laplacian variance method
    """
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return {
                "blurry": True,
                "blur_score": 0,
                "signals": ["image_decode_failed"]
            }
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Calculate Laplacian variance
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        # Thresholds
        signals = []
        blurry = False
        
        if laplacian_var < 50:
            signals.append("very_blurry")
            blurry = True
        elif laplacian_var < 100:
            signals.append("moderately_blurry")
            blurry = True
        elif laplacian_var < 200:
            signals.append("slightly_blurry")
        else:
            signals.append("sharp_image")
        
        return {
            "blurry": blurry,
            "blur_score": float(laplacian_var),
            "signals": signals
        }
        
    except Exception as e:
        return {
            "blurry": True,
            "blur_score": 0,
            "signals": ["blur_analysis_error"],
            "error": str(e)
        }


async def detect_tampering_indicators(image_bytes: bytes) -> dict:
    """
    Basic tampering detection
    
    Looks for signs of image manipulation
    Placeholder for advanced forensics
    """
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return {
                "tampering_detected": False,
                "signals": [],
                "confidence": 0
            }
        
        signals = []
        tampering_score = 0
        
        # Check for extreme contrast (possible filter/edit)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        hist = cv2.calcHist([gray], [0], None, [256], [0, 256])
        
        # Check histogram distribution
        hist_std = np.std(hist)
        if hist_std > 1000:
            signals.append("unusual_histogram_distribution")
            tampering_score += 20
        
        # Check for color anomalies
        mean_colors = cv2.mean(img)[:3]
        if max(mean_colors) > 240 or min(mean_colors) < 15:
            signals.append("extreme_color_values")
            tampering_score += 15
        
        # Check for edge artifacts (common in edited images)
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / (edges.shape[0] * edges.shape[1])
        if edge_density > 0.3:
            signals.append("high_edge_density")
            tampering_score += 10
        
        return {
            "tampering_detected": tampering_score > 30,
            "signals": signals,
            "confidence": min(tampering_score, 100)
        }
        
    except Exception as e:
        return {
            "tampering_detected": False,
            "signals": ["tampering_analysis_error"],
            "confidence": 0,
            "error": str(e)
        }


async def extract_image_features(image_bytes: bytes) -> dict:
    """
    Extract basic features from medicine image
    
    Placeholder for future CNN feature extraction
    """
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return {"success": False, "features": {}}
        
        # Extract basic features
        height, width = img.shape[:2]
        
        # Color distribution
        mean_colors = cv2.mean(img)
        
        # Brightness
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        brightness = np.mean(gray)
        
        # Dominant colors (simplified)
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        mean_hue = np.mean(hsv[:, :, 0])
        mean_saturation = np.mean(hsv[:, :, 1])
        
        features = {
            "dimensions": {"width": width, "height": height},
            "brightness": float(brightness),
            "mean_hue": float(mean_hue),
            "mean_saturation": float(mean_saturation),
            "dominant_colors": {
                "blue": float(mean_colors[0]),
                "green": float(mean_colors[1]),
                "red": float(mean_colors[2])
            }
        }
        
        return {
            "success": True,
            "features": features
        }
        
    except Exception as e:
        return {
            "success": False,
            "features": {},
            "error": str(e)
        }


async def analyze_medicine_image(image_bytes: bytes) -> dict:
    """
    Complete image analysis pipeline
    
    Combines all image analysis techniques
    """
    # Run all analyses
    quality_check = await validate_image_quality(image_bytes)
    blur_check = await analyze_image_blur(image_bytes)
    tampering_check = await detect_tampering_indicators(image_bytes)
    features = await extract_image_features(image_bytes)
    
    # Compile signals
    all_signals = []
    all_signals.extend(quality_check.get("signals", []))
    all_signals.extend(blur_check.get("signals", []))
    all_signals.extend(tampering_check.get("signals", []))
    
    # Calculate confidence modifier
    confidence_modifier = 0
    
    if not quality_check["valid"]:
        confidence_modifier -= 20
    
    if blur_check["blurry"]:
        confidence_modifier -= 15
    
    if tampering_check["tampering_detected"]:
        confidence_modifier -= 30
    
    # Image is good
    if quality_check["quality_score"] > 80 and not blur_check["blurry"]:
        confidence_modifier += 10
    
    return {
        "quality_analysis": quality_check,
        "blur_analysis": blur_check,
        "tampering_analysis": tampering_check,
        "features": features,
        "signals": all_signals,
        "confidence_modifier": confidence_modifier,
        "ready_for_cnn": quality_check["valid"] and not blur_check["blurry"]
    }
