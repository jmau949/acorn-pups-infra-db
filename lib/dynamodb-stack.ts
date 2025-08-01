import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { DynamoDbStackProps, DynamoDbTables } from './types';
import { ParameterStoreHelper } from './parameter-store-helper';

export class DynamoDbStack extends cdk.Stack {
  public readonly tables: DynamoDbTables;
  private readonly environmentName: string;
  private readonly parameterStoreHelper: ParameterStoreHelper;

  constructor(scope: Construct, id: string, props: DynamoDbStackProps) {
    super(scope, id, props);

    this.environmentName = props.environment;

    // Initialize Parameter Store helper
    this.parameterStoreHelper = new ParameterStoreHelper(this, {
      environment: props.environment,
      stackName: this.stackName,
    });

    // Create all DynamoDB tables
    this.tables = {
      usersTable: this.createUsersTable(props),
      devicesTable: this.createDevicesTable(props),
      deviceUsersTable: this.createDeviceUsersTable(props),
      invitationsTable: this.createInvitationsTable(props),
      deviceStatusTable: this.createDeviceStatusTable(props),
      userEndpointsTable: this.createUserEndpointsTable(props),
    };

    // Output table names and ARNs
    this.createOutputs();
  }

  private createUsersTable(props: DynamoDbStackProps): dynamodb.Table {
    const table = new dynamodb.Table(this, 'UsersTable', {
      tableName: `acorn-pups-users-${props.environment}`,
      partitionKey: {
        name: 'PK',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'SK',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: props.dynamoDbBillingMode,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: props.enablePointInTimeRecovery,
      },
      deletionProtection: props.deletionProtection,
      removalPolicy: props.environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // GSI1: Find user by email
    // Note: user_id is now the Cognito Sub UUID directly
    table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: {
        name: 'email',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'user_id',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    return table;
  }

  private createDevicesTable(props: DynamoDbStackProps): dynamodb.Table {
    const table = new dynamodb.Table(this, 'DevicesTable', {
      tableName: `acorn-pups-devices-${props.environment}`,
      partitionKey: {
        name: 'PK',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'SK',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: props.dynamoDbBillingMode,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: props.enablePointInTimeRecovery,
      },
      deletionProtection: props.deletionProtection,
      removalPolicy: props.environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // GSI1: Find devices by owner
    table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: {
        name: 'owner_user_id',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'device_id',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI2: Find device by serial number
    table.addGlobalSecondaryIndex({
      indexName: 'GSI2',
      partitionKey: {
        name: 'serial_number',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'device_id',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    return table;
  }

  private createDeviceUsersTable(props: DynamoDbStackProps): dynamodb.Table {
    const table = new dynamodb.Table(this, 'DeviceUsersTable', {
      tableName: `acorn-pups-device-users-${props.environment}`,
      partitionKey: {
        name: 'PK',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'SK',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: props.dynamoDbBillingMode,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: props.enablePointInTimeRecovery,
      },
      deletionProtection: props.deletionProtection,
      removalPolicy: props.environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // GSI1: Find user's device access
    table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: {
        name: 'user_id',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'device_id',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    return table;
  }

  private createInvitationsTable(props: DynamoDbStackProps): dynamodb.Table {
    const table = new dynamodb.Table(this, 'InvitationsTable', {
      tableName: `acorn-pups-invitations-${props.environment}`,
      partitionKey: {
        name: 'PK',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'SK',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: props.dynamoDbBillingMode,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: props.enablePointInTimeRecovery,
      },
      deletionProtection: props.deletionProtection,
      removalPolicy: props.environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // GSI1: Find invitations by device
    table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: {
        name: 'device_id',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'created_at',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI2: Find invitations by email
    table.addGlobalSecondaryIndex({
      indexName: 'GSI2',
      partitionKey: {
        name: 'invited_email',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'created_at',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    return table;
  }

  private createDeviceStatusTable(props: DynamoDbStackProps): dynamodb.Table {
    const table = new dynamodb.Table(this, 'DeviceStatusTable', {
      tableName: `acorn-pups-device-status-${props.environment}`,
      partitionKey: {
        name: 'PK',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'SK',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: props.dynamoDbBillingMode,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: props.enablePointInTimeRecovery,
      },
      deletionProtection: props.deletionProtection,
      removalPolicy: props.environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    return table;
  }

  private createUserEndpointsTable(props: DynamoDbStackProps): dynamodb.Table {
    const table = new dynamodb.Table(this, 'UserEndpointsTable', {
      tableName: `acorn-pups-user-endpoints-${props.environment}`,
      partitionKey: {
        name: 'PK',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'SK',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: props.dynamoDbBillingMode,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: props.enablePointInTimeRecovery,
      },
      deletionProtection: props.deletionProtection,
      removalPolicy: props.environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    return table;
  }

  private createOutputs(): void {
    // Create all DynamoDB table outputs with Parameter Store parameters
    this.parameterStoreHelper.createMultipleOutputsWithParameters([
      // Users Table
      {
        outputId: 'UsersTableName',
        value: this.tables.usersTable.tableName,
        description: 'Name of the Users DynamoDB table',
        exportName: `acorn-pups-users-table-name-${this.environmentName}`,
        parameterPath: `/acorn-pups/${this.environmentName}/dynamodb-tables/users/name`,
      },
      {
        outputId: 'UsersTableArn',
        value: this.tables.usersTable.tableArn,
        description: 'ARN of the Users DynamoDB table',
        exportName: `acorn-pups-users-table-arn-${this.environmentName}`,
        parameterPath: `/acorn-pups/${this.environmentName}/dynamodb-tables/users/arn`,
      },
      
      // Devices Table
      {
        outputId: 'DevicesTableName',
        value: this.tables.devicesTable.tableName,
        description: 'Name of the Devices DynamoDB table',
        exportName: `acorn-pups-devices-table-name-${this.environmentName}`,
        parameterPath: `/acorn-pups/${this.environmentName}/dynamodb-tables/devices/name`,
      },
      {
        outputId: 'DevicesTableArn',
        value: this.tables.devicesTable.tableArn,
        description: 'ARN of the Devices DynamoDB table',
        exportName: `acorn-pups-devices-table-arn-${this.environmentName}`,
        parameterPath: `/acorn-pups/${this.environmentName}/dynamodb-tables/devices/arn`,
      },
      
      // Device Users Table
      {
        outputId: 'DeviceUsersTableName',
        value: this.tables.deviceUsersTable.tableName,
        description: 'Name of the Device Users DynamoDB table',
        exportName: `acorn-pups-device-users-table-name-${this.environmentName}`,
        parameterPath: `/acorn-pups/${this.environmentName}/dynamodb-tables/device-users/name`,
      },
      {
        outputId: 'DeviceUsersTableArn',
        value: this.tables.deviceUsersTable.tableArn,
        description: 'ARN of the Device Users DynamoDB table',
        exportName: `acorn-pups-device-users-table-arn-${this.environmentName}`,
        parameterPath: `/acorn-pups/${this.environmentName}/dynamodb-tables/device-users/arn`,
      },
      
      // Invitations Table
      {
        outputId: 'InvitationsTableName',
        value: this.tables.invitationsTable.tableName,
        description: 'Name of the Invitations DynamoDB table',
        exportName: `acorn-pups-invitations-table-name-${this.environmentName}`,
        parameterPath: `/acorn-pups/${this.environmentName}/dynamodb-tables/invitations/name`,
      },
      {
        outputId: 'InvitationsTableArn',
        value: this.tables.invitationsTable.tableArn,
        description: 'ARN of the Invitations DynamoDB table',
        exportName: `acorn-pups-invitations-table-arn-${this.environmentName}`,
        parameterPath: `/acorn-pups/${this.environmentName}/dynamodb-tables/invitations/arn`,
      },
      
      // Device Status Table
      {
        outputId: 'DeviceStatusTableName',
        value: this.tables.deviceStatusTable.tableName,
        description: 'Name of the Device Status DynamoDB table',
        exportName: `acorn-pups-device-status-table-name-${this.environmentName}`,
        parameterPath: `/acorn-pups/${this.environmentName}/dynamodb-tables/device-status/name`,
      },
      {
        outputId: 'DeviceStatusTableArn',
        value: this.tables.deviceStatusTable.tableArn,
        description: 'ARN of the Device Status DynamoDB table',
        exportName: `acorn-pups-device-status-table-arn-${this.environmentName}`,
        parameterPath: `/acorn-pups/${this.environmentName}/dynamodb-tables/device-status/arn`,
      },
      
      // User Endpoints Table
      {
        outputId: 'UserEndpointsTableName',
        value: this.tables.userEndpointsTable.tableName,
        description: 'Name of the User Endpoints DynamoDB table',
        exportName: `acorn-pups-user-endpoints-table-name-${this.environmentName}`,
        parameterPath: `/acorn-pups/${this.environmentName}/dynamodb-tables/user-endpoints/name`,
      },
      {
        outputId: 'UserEndpointsTableArn',
        value: this.tables.userEndpointsTable.tableArn,
        description: 'ARN of the User Endpoints DynamoDB table',
        exportName: `acorn-pups-user-endpoints-table-arn-${this.environmentName}`,
        parameterPath: `/acorn-pups/${this.environmentName}/dynamodb-tables/user-endpoints/arn`,
      },
    ]);
  }
} 