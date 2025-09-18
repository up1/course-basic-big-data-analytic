import os
import json
from typing import List, Any
from fastapi import FastAPI, Request, Response
import psycopg2
from psycopg2.extras import execute_values

app = FastAPI()

DB_PARAMS = dict(
    host=os.getenv("POSTGRES_HOST", "postgres"),
    port=int(os.getenv("POSTGRES_PORT", "5432")),
    user=os.getenv("POSTGRES_USER", "admin"),
    password=os.getenv("POSTGRES_PASSWORD", "admin123"),
    dbname=os.getenv("POSTGRES_DB", "iot"),
)


# Simple connection factory
def get_conn():
    return psycopg2.connect(**DB_PARAMS)

@app.get("/")
async def root():
    return {"message": "IoT Data Sink API is running."}

@app.post("/ingest")
async def ingest(request: Request):
    # Fluent Bit may send a JSON object or a JSON array of records
    payload = await request.body()
    try:
        data = json.loads(payload)
    except json.JSONDecodeError:
        return Response("Invalid JSON", status_code=400)


    # Normalize to list
    rows: List[Any] = data if isinstance(data, list) else [data]


    # Each record from Fluent Bit typically holds fields at the top level.
    # We expect the JSON to contain keys like: device_id, ts, temperature, humidity, status
    to_insert = []
    for r in rows:
        device_id = r.get("device_id") or r.get("device") or "unknown"
        ts = r.get("ts") or r.get("timestamp")
        temperature = r.get("temperature")
        humidity = r.get("humidity")
        status = r.get("status")
        raw = json.dumps(r)
        if not ts:
            # fall back if the publisher forgot ts; use now()
            ts = "now()"
            # handle in SQL by using NOW() when ts is the literal string
            to_insert.append((device_id, None, temperature, humidity, status, raw))
        else:
            to_insert.append((device_id, ts, temperature, humidity, status, raw))


    cols = ("device_id", "ts", "temperature", "humidity", "status", "raw")
    insert_sql = (
    "INSERT INTO measurements (device_id, ts, temperature, humidity, status, raw) "
    "VALUES %s"
    )

    with get_conn() as conn:
        with conn.cursor() as cur:
            # Convert any ts=None into NOW()
            values = []
            for (d, t, temp, hum, st, raw) in to_insert:
                if t is None:
                    values.append((d, psycopg2.sql.SQL("NOW()"), temp, hum, st, raw))
                else:
                    values.append((d, t, temp, hum, st, raw))
            # execute_values doesn't allow raw SQL per-field easily; keep it simple:
            # Replace None ts with NOW() in a second pass
            execute_values(cur, insert_sql, values, template="(%s, %s, %s, %s, %s, %s)")
    return {"inserted": len(to_insert)}