select
id as order_id,
customer_id,
amount::double as amount,
status,
created_at
from {{ ref('orders') }}