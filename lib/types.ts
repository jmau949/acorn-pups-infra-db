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
  userEndpointsTable: dynamodb.Table;
  deviceLogsTable: dynamodb.Table;
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

/**
 * Data model interfaces based on the technical documentation schema
 */

/**
 * User profile data structure
 * Note: user_id is now the Cognito Sub UUID directly (no custom usr_ prefixed UUIDs)
 * This eliminates the need for database lookups and simplifies API authentication
 */
export interface UserProfile {
  user_id: string; // Cognito Sub UUID used directly as user identifier
  email: string;
  full_name: string;
  phone?: string;
  timezone: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  is_active: boolean;
  push_notifications: boolean;
  preferred_language: string;
  sound_alerts: boolean;
  vibration_alerts: boolean;
}

/**
 * Device metadata structure
 */
export interface DeviceMetadata {
  device_id: string;
  device_instance_id: string; // UUID generated each factory reset cycle for reset security
  serial_number: string;
  mac_address: string;
  device_name: string;
  owner_user_id: string;
  firmware_version: string;
  hardware_version: string;
  is_online: boolean;
  last_seen: string;
  wifi_ssid: string;
  signal_strength: number;
  created_at: string;
  updated_at: string;
  last_reset_at?: string; // Last factory reset timestamp
  is_active: boolean;
}

/**
 * Device settings structure
 */
export interface DeviceSettings {
  device_id: string;
  sound_enabled: boolean;
  sound_volume: number;
  led_brightness: number;
  notification_cooldown: number;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

/**
 * Device user permissions structure
 */
export interface DeviceUserPermissions {
  device_id: string;
  user_id: string;
  notifications_permission: boolean;
  settings_permission: boolean;
  notifications_enabled: boolean;
  notification_sound: 'default' | 'silent' | 'custom';
  notification_vibration: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  custom_notification_sound?: string;
  device_nickname?: string;
  invited_by: string;
  invited_at: string;
  accepted_at: string;
}

/**
 * Device invitation structure
 */
export interface DeviceInvitation {
  invitation_id: string;
  device_id: string;
  invited_email: string;
  invited_by: string;
  invitation_token: string;
  expires_at: string;
  created_at: string;
  accepted_at?: string;
  declined_at?: string;
  is_accepted: boolean;
  is_expired: boolean;
  ttl: number; // TTL for automatic cleanup after 1 year (Unix timestamp)
}

/**
 * Device status structure
 */
export interface DeviceStatus {
  device_id: string;
  status_type: 'CURRENT' | 'HEALTH' | 'CONNECTIVITY';
  timestamp: string;
  signal_strength: number;
  is_online: boolean;
  memory_usage: number;
  cpu_temperature: number;
  uptime: number;
  error_count: number;
  last_error_message?: string;
  firmware_version: string;
}

/**
 * User endpoint structure for push notifications
 * Supports multi-device push notification delivery
 */
export interface UserEndpoint {
  user_id: string;
  device_fingerprint: string;
  expo_push_token: string;
  platform: 'ios' | 'android';
  device_info: string;
  is_active: boolean;
  created_at: string;
  last_used: string;
  updated_at: string;
}

/**
 * Device log structure for firmware logging and monitoring
 * Only ERROR and FATAL logs are stored for cost optimization
 */
export interface DeviceLog {
  device_id: string;
  log_id: string;
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  component: 'RF' | 'MQTT' | 'WIFI' | 'BUTTON' | 'SYSTEM' | 'GENERAL';
  message: string;
  metadata?: Record<string, any>;
  created_at: string;
  ttl: number; // TTL for automatic cleanup (30 days)
}

/**
 * DynamoDB key patterns used in the schema
 * Note: userId parameter is now the Cognito Sub UUID directly (no custom usr_ prefix)
 */
export const DynamoDbKeyPatterns = {
  // Users table
  UserProfile: {
    PK: (userId: string) => `USER#${userId}`, // userId is Cognito Sub UUID
    SK: () => 'PROFILE',
  },
  
  // Devices table
  DeviceMetadata: {
    PK: (deviceId: string) => `DEVICE#${deviceId}`,
    SK: () => 'METADATA',
  },
  DeviceSettings: {
    PK: (deviceId: string) => `DEVICE#${deviceId}`,
    SK: () => 'SETTINGS',
  },
  
  // DeviceUsers table
  DeviceUser: {
    PK: (deviceId: string) => `DEVICE#${deviceId}`,
    SK: (userId: string) => `USER#${userId}`,
  },
  
  // Invitations table
  Invitation: {
    PK: (invitationId: string) => `INVITATION#${invitationId}`,
    SK: () => 'METADATA',
  },
  
  // DeviceStatus table
  DeviceStatus: {
    PK: (deviceId: string) => `DEVICE#${deviceId}`,
    SK: (statusType: string) => `STATUS#${statusType}`,
  },
  
  // UserEndpoints table
  UserEndpoint: {
    PK: (userId: string) => `USER#${userId}`,
    SK: (deviceFingerprint: string) => `ENDPOINT#${deviceFingerprint}`,
  },
  
  // DeviceLogs table
  DeviceLog: {
    PK: (deviceId: string) => `DEVICE#${deviceId}`,
    SK: (timestamp: string, logId: string) => `LOG#${timestamp}#${logId}`,
  },
} as const;

/**
 * Parameter Store path patterns
 */
export const ParameterStorePatterns = {
  DynamoDbTableName: (environment: string, tableName: string) => 
    `/acorn-pups/${environment}/dynamodb-tables/${tableName}/name`,
  DynamoDbTableArn: (environment: string, tableName: string) => 
    `/acorn-pups/${environment}/dynamodb-tables/${tableName}/arn`,
} as const;

/**
 * Environment-specific configuration
 */
export interface EnvironmentConfig {
  environment: string;
  isDevelopment: boolean;
  isProduction: boolean;
  retentionDays: number;
  enableDetailedMonitoring: boolean;
  enableAlarms: boolean;
}

/**
 * Utility type for creating environment-specific configurations
 */
export const createEnvironmentConfig = (environment: string): EnvironmentConfig => ({
  environment,
  isDevelopment: environment === 'dev',
  isProduction: environment === 'prod',
  retentionDays: environment === 'prod' ? 30 : 7,
  enableDetailedMonitoring: environment === 'prod',
  enableAlarms: environment === 'prod',
});

/**
 * Table name patterns for consistency
 */
export const TableNames = {
  Users: (environment: string) => `acorn-pups-users-${environment}`,
  Devices: (environment: string) => `acorn-pups-devices-${environment}`,
  DeviceUsers: (environment: string) => `acorn-pups-device-users-${environment}`,
  Invitations: (environment: string) => `acorn-pups-invitations-${environment}`,
  DeviceStatus: (environment: string) => `acorn-pups-device-status-${environment}`,
  UserEndpoints: (environment: string) => `acorn-pups-user-endpoints-${environment}`,
  DeviceLogs: (environment: string) => `acorn-pups-device-logs-${environment}`,
} as const; 