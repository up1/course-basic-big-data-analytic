# Workshop Data Quality with [dbt](https://www.getdbt.com/)

## 1. Setup dbt on [Local machine](https://docs.getdbt.com/docs/cloud/cloud-cli-installation)
```
$python -m pip install --upgrade dbt
```


## 2. Working with Docker

### 2.1 Start database
```
$docker  compose up -d postgres
$docker  compose ps
```

### 2.2 Build and start producer to generate realtime data
* Generate data every x seconds
* order data
* payment data
```
$docker compose build producer
$docker compose up -d producer
$docker  compose ps
```

### 2.3 Build and run test with dbt
* Check data every x seconds
```
$docker compose build dbt
$docker compose up -d dbt
```


