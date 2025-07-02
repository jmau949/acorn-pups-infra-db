#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DynamoDbStack } from '../lib/dynamodb-stack';
import { MonitoringStack } from '../lib/monitoring-stack';

const app = new cdk.App();

// Get environment from context (dev or prod)
const environment = app.node.tryGetContext('environment') || 'dev';
const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION || 'us-east-1';

console.log(`Deploying database infrastructure to environment: ${environment}`);

const env = {
  account,
  region,
};

// Environment-specific configuration
const config = {
  dev: {
    dynamoDbBillingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
    enablePointInTimeRecovery: false,
    deletionProtection: false,
    backupRetentionDays: 7,
  },
  prod: {
    dynamoDbBillingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
    enablePointInTimeRecovery: true,
    deletionProtection: true,
    backupRetentionDays: 30,
  }
};

const envConfig = config[environment as keyof typeof config];
if (!envConfig) {
  throw new Error(`Invalid environment: ${environment}. Must be 'dev' or 'prod'`);
}

// Stack naming convention
const stackPrefix = `acorn-pups-db-${environment}`;

// DynamoDB Stack (contains all DynamoDB tables)
const dynamoDbStack = new DynamoDbStack(app, `${stackPrefix}-dynamodb`, {
  env,
  environment,
  ...envConfig,
});

// Monitoring Stack (CloudWatch, alarms, dashboards for DynamoDB)
const monitoringStack = new MonitoringStack(app, `${stackPrefix}-monitoring`, {
  env,
  environment,
  dynamoDbTables: dynamoDbStack.tables,
  ...envConfig,
});

// Add dependencies
monitoringStack.addDependency(dynamoDbStack);

// Tags for all resources
cdk.Tags.of(app).add('Project', 'acorn-pups');
cdk.Tags.of(app).add('Environment', environment);
cdk.Tags.of(app).add('Service', 'Database');
cdk.Tags.of(app).add('ManagedBy', 'CDK'); 