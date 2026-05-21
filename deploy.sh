#!/usr/bin/env bash
# StayMatch AI — Cloud Run deployment
# Run from the repo root: bash deploy.sh
set -euo pipefail

PROJECT_ID="${GCP_PROJECT:-$(gcloud config get-value project 2>/dev/null)}"
REGION="europe-west1"
SERVICE="staymatch"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE}"
API_KEY="$(grep GOOGLE_API_KEY .env.local | cut -d= -f2)"

echo "▶ Project : $PROJECT_ID"
echo "▶ Region  : $REGION"
echo "▶ Image   : $IMAGE"
echo ""

# Enable required APIs (idempotent)
echo "Enabling Cloud APIs..."
gcloud services enable \
  run.googleapis.com \
  containerregistry.googleapis.com \
  --project "$PROJECT_ID" --quiet

# Build image locally and push to GCR
echo "Building Docker image (linux/amd64 for Cloud Run)..."
docker build --platform linux/amd64 -t "$IMAGE" .

echo "Pushing image to GCR..."
gcloud auth configure-docker --quiet
docker push "$IMAGE"

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy "$SERVICE" \
  --image "$IMAGE" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --set-env-vars "GOOGLE_API_KEY=${API_KEY}" \
  --project "$PROJECT_ID" \
  --quiet

echo ""
echo "✅ Deployed! Service URL:"
gcloud run services describe "$SERVICE" \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --format "value(status.url)"
