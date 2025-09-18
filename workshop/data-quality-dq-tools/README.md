# Demo dbt and dq-tool with duckdb

## 1. Build and start dbt and dq-tool
```
$docker compose build dbt
```

Install packages
```
$docker compose run --rm dbt "dbt deps"
```
Initialize dq-tools models (creates dq_issue_log and downstream models)
```
$docker compose run --rm dbt "dbt run -s dq_tools"
```

Load seed data
```
$docker compose run --rm dbt "dbt seed"
```

## 2. Data Quality tests with dq-tools
```
$docker compose run --rm dbt "dbt run -s dq_tools"
$docker compose run --rm dbt "dbt build"

$docker compose run --rm dbt "dbt build --vars '{dq_tools_enable_store_test_results: True}'"
$docker compose run --rm dbt "dbt test --vars '{dq_tools_enable_store_test_results: True}'"
```

## Troubleshooting

**DuckDB users:**  
If you see an error like `Catalog Error: Scalar Function with name date_add does not exist! Did you mean "date_add"?`,  
update your dq-tools macros or custom tests to use `date_add` instead of `date_add`.