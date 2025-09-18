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

## 5. Start Grafana dashboard
* Data source = PostgreSQL

```
$docker compose up -d grafana
$docker compose ps
```

Open grafana dashboard
* http://localhost:3000
  * user=admin
  * password=admin123

## 6. Config IoT dashboard
* In Grafana → Dashboards → New → Add visualization → Postgres (IoT)

### Temperature by device
* Panel type: Bar chart
```
SELECT
device_id,
avg(temperature) AS value
FROM measurements
WHERE $__timeFilter(ts) AND temperature IS NOT NULL
GROUP BY 1
ORDER BY 1;
```

### Latest status per device (table)
* Panel type: Table
```
SELECT DISTINCT ON (device_id)
device_id,
ts,
status,
temperature,
humidity
FROM measurements
WHERE ts >= now() - interval '30 days'
ORDER BY device_id, ts DESC;
```

### Alerts per hour
```
SELECT
$__timeGroup(ts, '1h') AS time,
count(*) AS alerts
FROM measurements
WHERE $__timeFilter(ts) AND status = 'ALERT'
GROUP BY 1
ORDER BY 1;
```

### Humidity percentile (p90) over time
```
SELECT
$__timeGroup(ts, $__interval) AS time,
PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY humidity) AS p90_humidity
FROM measurements
WHERE $__timeFilter(ts) AND humidity IS NOT NULL
GROUP BY 1
ORDER BY 1;
```

