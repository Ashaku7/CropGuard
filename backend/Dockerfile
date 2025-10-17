ARG TF_VERSION=2.20.0
FROM tensorflow/tensorflow:${TF_VERSION}

WORKDIR /app

# Create isolated venv to avoid conflicts with system/distutils packages
RUN python -m venv /opt/venv --system-site-packages
ENV PATH="/opt/venv/bin:$PATH"

# Upgrade pip and install deps in venv
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
      flask==3.0.0 \
      flask-cors==4.0.0 \
      pillow==11.0.0 \
      numpy==1.26.4 \
      python-dotenv==1.0.0 \
      requests==2.31.0

COPY . .

ENV PYTHONUNBUFFERED=1 \
    PORT=5000

EXPOSE 5000

CMD ["python", "app.py"]
