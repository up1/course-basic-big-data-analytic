# Workshop with IoT and messaging
* IoT Data Pipeline 
  * CSV → MQTT → Fluent Bit → PostgreSQL
* Data pipeline
  * Data source :: event from sensor
  * [MQTT](https://mqtt.org/)
  * [Fluent Bit](https://fluentbit.io/)
    * Input = MQTT
    * Output = HTTP SERVER (REST API)
  * HTTP Server with database
  * Dashboard with [grafana](https://grafana.com/)

## 0. Architecture
```
CSV ──► Python Publisher ──► MQTT (Mosquitto)
                                │
                                ▼
                                Fluent Bit (transform/validate)
                                │ HTTP (JSON)
                                ▼
                                FastAPI Sink ► PostgreSQL
```

## 1. Start Fluent-bit
```
$docker compose up -d fluent-bit
$docker compose ps
```

## 2. Start REST API to receive data from Fluent-bit
* `POST /ingest`
* Store data in postgresql database
```
$docker compose build api
$docker compose up -d api
$docker compose ps
```

Check status
* http://localhost:8000

## 3. Publish data from CSV
```
$docker  compose up data-publisher --build
```

## 4. Check data in database
```
$docker exec -it postgres psql -U admin -d iot -c "SELECT device_id, ts, temperature, humidity, status FROM measurements ORDER BY ts LIMIT 10;"
```

