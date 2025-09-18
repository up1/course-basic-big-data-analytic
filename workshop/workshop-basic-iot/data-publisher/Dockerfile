FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY publish_csv.py ./
CMD ["python", "publish_csv.py", "data/sensors.csv"]