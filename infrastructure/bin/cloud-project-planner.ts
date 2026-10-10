#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CloudProjectPlannerStack } from '../lib/cloud-project-planner-stack';

const app = new cdk.App();

new CloudProjectPlannerStack(app, 'CloudProjectPlannerStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
  },
  description: 'cloud-project-planner-agent: S3 + CloudFront + API Gateway + Lambda (Python) + Amazon Bedrock',
});
