FROM python:3.13

WORKDIR /app

ENV PYTHONUNBUFFERED=1

COPY . .
RUN pip install --no-cache-dir .

CMD ["python", "src/main.py"]