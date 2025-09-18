select
id as customer_id,
first_name,
last_name,
created_at
from {{ ref('customers') }}