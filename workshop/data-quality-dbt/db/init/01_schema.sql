create table if not exists orders_raw (
  order_id uuid primary key,
  customer_email text,
  product_code text,
  amount numeric,
  status text,
  event_time timestamptz default now(),
  ingested_at timestamptz default now()
);

create table if not exists payments_raw (
  payment_id uuid primary key,
  order_id uuid references orders_raw(order_id),
  amount numeric,
  method text,
  event_time timestamptz default now(),
  ingested_at timestamptz default now()
);
