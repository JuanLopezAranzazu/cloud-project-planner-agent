#!/usr/bin/env bash
# Builds the frontend and deploys the entire stack with AWS CDK.
set -euo pipefail

cd "$(dirname "$0")"

echo "1/3 Building the frontend..."
(
  cd frontend
  pnpm install --frozen-lockfile
  pnpm build
)

echo "2/3 Preparing CDK..."
(
  cd infrastructure
  npm ci
  npm run build
)

echo "3/3 Deploying to AWS..."
(
  cd infrastructure
  npx cdk deploy --require-approval never "$@"
)

echo "Deployment completed. Check the SiteUrl output above."
