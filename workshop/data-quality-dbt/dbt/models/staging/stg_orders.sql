with src as (
  select * from orders_raw
)
select
  order_id,
  lower(customer_email) as customer_email,
  product_code,
  cast(amount as double precision) as amount,
  status,
  event_time::timestamp as event_time,
  ingested_at::timestamp as ingested_at
from src
