# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Install system dependencies including libmagic
RUN apt-get update && apt-get install -y \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your backend code
COPY . .

# Expose the port FastAPI will run on
EXPOSE 8000

# Command to run the backend
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"] 