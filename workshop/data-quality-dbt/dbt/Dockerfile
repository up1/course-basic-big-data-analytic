FROM python:3.11-slim
WORKDIR /dbt
RUN pip install --no-cache-dir dbt-core dbt-postgres elementary-data
COPY packages.yml dbt_project.yml profiles.yml ./
RUN dbt deps
COPY models ./models
ENV DBT_PROFILES_DIR=/dbt

CMD ["bash", "-lc", "while true; do dbt build --select staging marts && dbt test --select staging marts &&  sleep 120; done"]
