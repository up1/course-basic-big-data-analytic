{{ config(materialized='incremental', unique_key='order_id') }}

with base as (
  select * from {{ ref('stg_orders') }}
),
dedup as (
  select * from (
    select *,
      row_number() over (partition by order_id order by ingested_at desc) as rn
    from base
  ) x where rn = 1
)
select * from dedup

{% if is_incremental() %}
-- dbt-postgres will upsert by unique_key
{% endif %}
