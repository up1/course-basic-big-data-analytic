with o as (
    select customer_id, count(*) as order_count, sum(amount) as total_amount
    from {{ ref('stg_orders') }}
    where status = 'paid'
    group by 1
)
select c.customer_id, c.first_name, c.last_name, c.created_at,
    coalesce(o.order_count, 0) as order_count,
    coalesce(o.total_amount, 0) as total_amount
from {{ ref('stg_customers') }} c
left join o on o.customer_id = c.customer_id