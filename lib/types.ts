import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

/**
 * Common configuration interface for all stacks
 */
export interface BaseStackProps extends cdk.StackProps {
  environment: string;
}

/**
 * Configuration for DynamoDB stack
 */
export interface DynamoDbStackProps extends BaseStackProps {
  dynamoDbBillingMode: dynamodb.BillingMode;
  enablePointInTimeRecovery: boolean;
  deletionProtection: boolean;
  backupRetentionDays: number;
}

/**
 * Configuration for monitoring stack
 */
export interface MonitoringStackProps extends BaseStackProps {
  dynamoDbTables: DynamoDbTables;
  backupRetentionDays: number;
}

/**
 * Interface for all DynamoDB tables in the system
 */
export interface DynamoDbTables {
  usersTable: dynamodb.Table;
  devicesTable: dynamodb.Table;
  deviceUsersTable: dynamodb.Table;
  invitationsTable: dynamodb.Table;
  deviceStatusTable: dynamodb.Table;
}

/**
 * DynamoDB table configuration interface
 */
export interface TableConfig {
  tableName: string;
  partitionKey: {
    name: string;
    type: dynamodb.AttributeType;
  };
  sortKey?: {
    name: string;
    type: dynamodb.AttributeType;
  };
  globalSecondaryIndexes?: GSIConfig[];
  streamSpecification?: dynamodb.StreamViewType;
}

/**
 * Global Secondary Index configuration
 */
export interface GSIConfig {
  indexName: string;
  partitionKey: {
    name: string;
    type: dynamodb.AttributeType;
  };
  sortKey?: {
    name: string;
    type: dynamodb.AttributeType;
  };
  projectionType?: dynamodb.ProjectionType;
  nonKeyAttributes?: string[];
} 