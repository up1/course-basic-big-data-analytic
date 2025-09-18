import os
import sys
import time
import json
import pandas as pd
from paho.mqtt import client as mqtt
from dotenv import load_dotenv


load_dotenv()


MQTT_HOST = os.getenv("MQTT_HOST", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
BASE_TOPIC = os.getenv("MQTT_BASE_TOPIC", "iot/sensors")

def on_connect(client, userdata, flags, reason_code, properties):
    print(f"Connected to MQTT broker at {MQTT_HOST}:{MQTT_PORT} with reason code {reason_code}")    
    csv_path = sys.argv[1] if len(sys.argv) > 1 else "data/sensors.csv"
    df = pd.read_csv(csv_path)


    # Expected CSV columns: device_id, ts (ISO 8601), temperature, humidity, status
    # Example:
    # device01,2025-09-18T10:00:00Z,25.7,72.1,OK


    for _, row in df.iterrows():
        print(f"Publishing row: {row.to_dict()}")
        device_id = str(row.get("device_id", "unknown"))
        topic = f"{BASE_TOPIC}/{device_id}/telemetry"
        payload = {
            "device_id": device_id,
            "ts": str(row.get("ts")),
            "temperature": float(row.get("temperature")) if not pd.isna(row.get("temperature")) else None,
            "humidity": float(row.get("humidity")) if not pd.isna(row.get("humidity")) else None,
            "status": row.get("status") if not pd.isna(row.get("status")) else None,
        }
        client.publish(topic, json.dumps(payload), qos=0)
        time.sleep(0.05) # gentle pacing
        
    client.disconnect()
    print("Done publishing CSV rows.")


client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
client.on_connect = on_connect
client.connect(MQTT_HOST, MQTT_PORT, keepalive=60)
client.loop_forever()
