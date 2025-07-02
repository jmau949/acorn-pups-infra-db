import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { DynamoDbStack } from '../../lib/dynamodb-stack';
import { MonitoringStack } from '../../lib/monitoring-stack';

describe('Database Infrastructure Integration Tests', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  test('can deploy both stacks together', () => {
    const dynamoDbStack = new DynamoDbStack(app, 'TestDynamoDbStack', {
      environment: 'test',
      dynamoDbBillingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
      enablePointInTimeRecovery: false,
      deletionProtection: false,
      backupRetentionDays: 7,
    });

    const monitoringStack = new MonitoringStack(app, 'TestMonitoringStack', {
      environment: 'test',
      dynamoDbTables: dynamoDbStack.tables,
      backupRetentionDays: 7,
    });

    monitoringStack.addDependency(dynamoDbStack);

    const dynamoDbTemplate = Template.fromStack(dynamoDbStack);
    const monitoringTemplate = Template.fromStack(monitoringStack);

    // Verify DynamoDB stack has tables and Parameter Store parameters
    dynamoDbTemplate.resourceCountIs('AWS::DynamoDB::Table', 5);
    dynamoDbTemplate.resourceCountIs('AWS::SSM::Parameter', 10);

    // Verify monitoring stack has dashboard
    monitoringTemplate.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
  });

  test('environment configuration works correctly', () => {
    const prodStack = new DynamoDbStack(app, 'ProdDynamoDbStack', {
      environment: 'prod',
      dynamoDbBillingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
      enablePointInTimeRecovery: true,
      deletionProtection: true,
      backupRetentionDays: 30,
    });

    const template = Template.fromStack(prodStack);

    // Verify production configuration
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'acorn-pups-users-prod',
      PointInTimeRecoverySpecification: {
        PointInTimeRecoveryEnabled: true
      }
    });
  });
}); 