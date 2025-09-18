FROM python:3.11-slim

# system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
build-essential gcc curl \
&& rm -rf /var/lib/apt/lists/*

# python deps
COPY docker/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# dbt will run inside /workspace
WORKDIR /workspace
ENTRYPOINT ["bash", "-lc"]