from sklearn.ensemble import IsolationForest
import numpy as np

# Simple model initialization
model = IsolationForest(contamination=0.05, random_state=42)


def train_anomaly_model(data):
    """Train the Isolation Forest model on supply data."""
    if len(data) > 0:
        model.fit(data)


def detect_anomaly(sample):
    """Detect if a sample is an anomaly.
    
    Args:
        sample: List of features [temperature, quantity]
        
    Returns:
        "ANOMALY" if anomaly detected, "NORMAL" otherwise
    """
    prediction = model.predict([sample])
    return "ANOMALY" if prediction[0] == -1 else "NORMAL"
