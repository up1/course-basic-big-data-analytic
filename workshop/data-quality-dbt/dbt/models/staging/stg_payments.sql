with src as (
  select * from payments_raw
)
select
  payment_id,
  order_id,
  cast(amount as double precision) as amount,
  method,
  event_time::timestamp as event_time,
  ingested_at::timestamp as ingested_at
from src
