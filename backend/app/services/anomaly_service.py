from app.db.mongodb import db
from app.ai.anomaly_detection import train_anomaly_model, detect_anomaly
import numpy as np


async def run_anomaly_detection(supplies_list=None):
    """Run anomaly detection on all supplies.
    
    Returns:
        Dictionary with list of anomalous supply IDs
    """
    if supplies_list is None:
        supplies_list = await db.supplies.find().to_list(length=None)

    data = []
    for s in supplies_list:
        data.append([
            s.get("temperature", 0),
            s.get("quantity", 0)
        ])

    if len(data) < 10:
        return {"message": "Not enough data for training", "anomalies": []}

    # Train the model
    train_anomaly_model(np.array(data))

    # Detect anomalies
    anomalies = []
    for s in supplies_list:
        result = detect_anomaly([
            s.get("temperature", 0),
            s.get("quantity", 0)
        ])

        if result == "ANOMALY":
            anomalies.append(str(s["_id"]))

    return {
        "total_supplies": len(data),
        "anomalies_detected": len(anomalies),
        "anomalies": anomalies
    }
