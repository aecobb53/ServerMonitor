FROM python:3.13-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1

COPY pyproject.toml .
COPY src ./src
COPY content ./content
RUN pip install --no-cache-dir .

CMD ["uvicorn", "main:app", "--app-dir", "/app/src", "--host", "0.0.0.0", "--port", "8000"]