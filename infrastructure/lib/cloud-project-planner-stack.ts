import * as fs from 'fs';
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';

export class CloudProjectPlannerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const modelId: string = this.node.tryGetContext('modelId') ?? 'us.amazon.nova-lite-v1:0';

    const frontendDist = path.join(__dirname, '../../frontend/dist');
    if (!fs.existsSync(path.join(frontendDist, 'index.html'))) {
      throw new Error(
        'frontend/dist not found. Run "pnpm build" inside /frontend first (or use ./deploy.sh).',
      );
    }

    // ---------- Backend: Lambda (Python) + Amazon Bedrock ----------
    const plannerFn = new lambda.Function(this, 'PlannerFunction', {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend'), {
        exclude: ['tests', '__pycache__', '*.pyc', 'requirements.txt'],
      }),
      timeout: cdk.Duration.seconds(28), // API Gateway REST cuts off at 29 s
      memorySize: 512,
      environment: { MODEL_ID: modelId },
      logGroup: new logs.LogGroup(this, 'PlannerLogs', {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    // Inference profiles route to models across regions, hence the region wildcard.
    plannerFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['bedrock:InvokeModel'],
        resources: [
          'arn:aws:bedrock:*::foundation-model/*',
          `arn:aws:bedrock:${this.region}:${this.account}:inference-profile/*`,
        ],
      }),
    );

    // ---------- API Gateway ----------
    const api = new apigw.RestApi(this, 'PlannerApi', {
      restApiName: 'cloud-project-planner-api',
      deployOptions: {
        stageName: 'prod',
        // Cost brake: an unthrottled public agent is a bill waiting to happen.
        throttlingRateLimit: 5,
        throttlingBurstLimit: 10,
      },
    });
    api.root
      .addResource('api')
      .addResource('plan')
      .addMethod('POST', new apigw.LambdaIntegration(plannerFn));

    // ---------- Hosting: S3 privado + CloudFront ----------
    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // demo: "cdk destroy" cleans everything up
      autoDeleteObjects: true,
    });

    const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        compress: true,
      },
      additionalBehaviors: {
        // Same domain for web and API: no CORS and no URLs to configure in the frontend.
        '/api/*': {
          origin: new origins.RestApiOrigin(api),
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
        },
      },
    });

    new s3deploy.BucketDeployment(this, 'DeploySite', {
      sources: [s3deploy.Source.asset(frontendDist)],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    new cdk.CfnOutput(this, 'SiteUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'Open this URL to talk to Nimbo',
    });
    new cdk.CfnOutput(this, 'ModelId', { value: modelId });
  }
}
