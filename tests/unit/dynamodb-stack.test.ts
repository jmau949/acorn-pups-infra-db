import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { DynamoDbStack } from '../../lib/dynamodb-stack';

describe('DynamoDbStack', () => {
  let app: cdk.App;
  let stack: DynamoDbStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new DynamoDbStack(app, 'TestDynamoDbStack', {
      environment: 'test',
      dynamoDbBillingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
      enablePointInTimeRecovery: false,
      deletionProtection: false,
      backupRetentionDays: 7,
    });
    template = Template.fromStack(stack);
  });

  test('creates all required DynamoDB tables', () => {
    // Verify all 5 tables are created
    template.resourceCountIs('AWS::DynamoDB::Table', 5);

    // Check for Users table
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'acorn-pups-users-test',
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' }
      ]
    });

    // Check for Devices table
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'acorn-pups-devices-test',
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' }
      ]
    });

    // Check for DeviceUsers table
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'acorn-pups-device-users-test',
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' }
      ]
    });

    // Check for Invitations table
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'acorn-pups-invitations-test',
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' }
      ]
    });

    // Check for DeviceStatus table
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'acorn-pups-device-status-test',
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' }
      ]
    });
  });

  test('creates Global Secondary Indexes correctly', () => {
    // Users table should have 1 GSI
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'acorn-pups-users-test',
      GlobalSecondaryIndexes: [
        {
          IndexName: 'GSI1',
          KeySchema: [
            { AttributeName: 'email', KeyType: 'HASH' },
            { AttributeName: 'user_id', KeyType: 'RANGE' }
          ]
        }
      ]
    });

    // Devices table should have 2 GSIs
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'acorn-pups-devices-test',
      GlobalSecondaryIndexes: [
        {
          IndexName: 'GSI1',
          KeySchema: [
            { AttributeName: 'owner_user_id', KeyType: 'HASH' },
            { AttributeName: 'device_id', KeyType: 'RANGE' }
          ]
        },
        {
          IndexName: 'GSI2',
          KeySchema: [
            { AttributeName: 'serial_number', KeyType: 'HASH' },
            { AttributeName: 'device_id', KeyType: 'RANGE' }
          ]
        }
      ]
    });
  });

  test('configures billing mode correctly', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      BillingMode: 'PAY_PER_REQUEST'
    });
  });

  test('creates CloudFormation outputs', () => {
    // Check that all table names and ARNs are exported
    template.hasOutput('UsersTableName', {});
    template.hasOutput('UsersTableArn', {});
    template.hasOutput('DevicesTableName', {});
    template.hasOutput('DevicesTableArn', {});
    template.hasOutput('DeviceUsersTableName', {});
    template.hasOutput('DeviceUsersTableArn', {});
    template.hasOutput('InvitationsTableName', {});
    template.hasOutput('InvitationsTableArn', {});
    template.hasOutput('DeviceStatusTableName', {});
    template.hasOutput('DeviceStatusTableArn', {});
  });

  test('creates Parameter Store parameters for all table outputs', () => {
    // Check that all table names and ARNs are stored in Parameter Store
    template.resourceCountIs('AWS::SSM::Parameter', 10);
    
    // Check some specific parameter configurations
    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/acorn-pups/test/dynamodb-tables/users/name',
      Type: 'String',
      Description: '[TestDynamoDbStack] Name of the Users DynamoDB table'
    });

    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/acorn-pups/test/dynamodb-tables/users/arn',
      Type: 'String',
      Description: '[TestDynamoDbStack] ARN of the Users DynamoDB table'
    });

    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/acorn-pups/test/dynamodb-tables/devices/name',
      Type: 'String',
      Description: '[TestDynamoDbStack] Name of the Devices DynamoDB table'
    });

    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/acorn-pups/test/dynamodb-tables/device-users/name',
      Type: 'String',
      Description: '[TestDynamoDbStack] Name of the Device Users DynamoDB table'
    });
  });

  test('has proper table access through class properties', () => {
    expect(stack.tables.usersTable).toBeDefined();
    expect(stack.tables.devicesTable).toBeDefined();
    expect(stack.tables.deviceUsersTable).toBeDefined();
    expect(stack.tables.invitationsTable).toBeDefined();
    expect(stack.tables.deviceStatusTable).toBeDefined();
  });
}); 