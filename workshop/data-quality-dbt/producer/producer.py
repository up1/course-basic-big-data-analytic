import os, uuid, random, time
from datetime import datetime, timezone, timedelta
import psycopg

BATCH_SIZE = int(os.getenv("BATCH_SIZE", "50"))
SLEEP = int(os.getenv("BATCH_INTERVAL_SECONDS", "60"))

dsn = f"host={os.getenv('DB_HOST','postgres')} port={os.getenv('DB_PORT','5432')} dbname={os.getenv('DB_NAME','nrt')} user={os.getenv('DB_USER','nrt')} password={os.getenv('DB_PASSWORD','nrtpwd')}"

STATUSES = ["created","paid","cancelled","refunded"]
PRODUCTS = ["A100","B200","C300","D400"]
PAY_METHODS = ["card","cod","wallet"]

def rand_order(now):
    return {
        "order_id": uuid.uuid4(),
        "customer_email": f"user{random.randint(1,999)}@example.com",
        "product_code": random.choice(PRODUCTS),
        "amount": round(random.uniform(5, 500), 2),
        "status": random.choice(STATUSES),
        "event_time": now - timedelta(seconds=random.randint(0, 600)),
        "ingested_at": now,
    }

def maybe_payment(order):
    if order["status"] not in ("paid","refunded"):
        return None
    return {
        "payment_id": uuid.uuid4(),
        "order_id": order["order_id"],
        "amount": order["amount"],
        "method": random.choice(PAY_METHODS),
        "event_time": order["event_time"],
        "ingested_at": order["ingested_at"],
    }

def inject_quality_issues(o):
    # ~2% negative amounts, ~2% bad emails
    if random.random() < 0.02: o["amount"] = -1
    if random.random() < 0.02: o["customer_email"] = "not-an-email"
    return o

def loop():
    with psycopg.connect(dsn, autocommit=True) as conn:
        while True:
            now = datetime.now(timezone.utc)
            orders, pays = [], []
            for _ in range(BATCH_SIZE):
                o = inject_quality_issues(rand_order(now))
                orders.append(o)
                p = maybe_payment(o)
                if p: pays.append(p)

            with conn.cursor() as cur:
                cur.executemany("""
                    insert into orders_raw(order_id, customer_email, product_code, amount, status, event_time, ingested_at)
                    values (%(order_id)s, %(customer_email)s, %(product_code)s, %(amount)s, %(status)s, %(event_time)s, %(ingested_at)s)
                    on conflict (order_id) do nothing
                """, orders)
                if pays:
                    cur.executemany("""
                        insert into payments_raw(payment_id, order_id, amount, method, event_time, ingested_at)
                        values (%(payment_id)s, %(order_id)s, %(amount)s, %(method)s, %(event_time)s, %(ingested_at)s)
                        on conflict (payment_id) do nothing
                    """, pays)

            print(f"[producer] inserted {len(orders)} orders, {len(pays)} payments")
            time.sleep(SLEEP)

if __name__ == "__main__":
    loop()
