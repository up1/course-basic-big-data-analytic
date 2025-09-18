FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY producer.py .
ENV DB_HOST=postgres DB_PORT=5432 DB_NAME=nrt DB_USER=nrt DB_PASSWORD=nrtpwd
ENV BATCH_SIZE=50 BATCH_INTERVAL_SECONDS=60
CMD ["python", "producer.py"]