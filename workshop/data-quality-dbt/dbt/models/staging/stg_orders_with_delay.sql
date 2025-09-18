select
  *,
  extract(epoch from (ingested_at - event_time)) / 60.0 as event_delay_minutes
from {{ ref('stg_orders') }}
