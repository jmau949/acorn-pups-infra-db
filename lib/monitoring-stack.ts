import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { MonitoringStackProps } from './types';

export class MonitoringStack extends cdk.Stack {
  public readonly dashboard: cloudwatch.Dashboard;
  private readonly environmentName: string;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    this.environmentName = props.environment;

    // Create CloudWatch Dashboard
    this.dashboard = new cloudwatch.Dashboard(this, 'AcornPupsDatabaseDashboard', {
      dashboardName: `acorn-pups-database-${props.environment}`,
    });

    // Create alarms and widgets for each table
    this.createTableMonitoring(props.dynamoDbTables.usersTable, 'Users');
    this.createTableMonitoring(props.dynamoDbTables.devicesTable, 'Devices');
    this.createTableMonitoring(props.dynamoDbTables.deviceUsersTable, 'DeviceUsers');
    this.createTableMonitoring(props.dynamoDbTables.invitationsTable, 'Invitations');
    this.createTableMonitoring(props.dynamoDbTables.deviceStatusTable, 'DeviceStatus');

    // Add overview widget
    this.addOverviewWidget();
  }

  private createTableMonitoring(table: dynamodb.Table, tableDisplayName: string): void {
    // Read capacity metric
    const readCapacityMetric = new cloudwatch.Metric({
      namespace: 'AWS/DynamoDB',
      metricName: 'ConsumedReadCapacityUnits',
      dimensionsMap: {
        TableName: table.tableName,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    // Write capacity metric
    const writeCapacityMetric = new cloudwatch.Metric({
      namespace: 'AWS/DynamoDB',
      metricName: 'ConsumedWriteCapacityUnits',
      dimensionsMap: {
        TableName: table.tableName,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    // Throttle metrics
    const readThrottleMetric = new cloudwatch.Metric({
      namespace: 'AWS/DynamoDB',
      metricName: 'ReadThrottles',
      dimensionsMap: {
        TableName: table.tableName,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const writeThrottleMetric = new cloudwatch.Metric({
      namespace: 'AWS/DynamoDB',
      metricName: 'WriteThrottles',
      dimensionsMap: {
        TableName: table.tableName,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    // System error metrics
    const systemErrorMetric = new cloudwatch.Metric({
      namespace: 'AWS/DynamoDB',
      metricName: 'SystemErrors',
      dimensionsMap: {
        TableName: table.tableName,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    // Create alarms for throttling (critical for production)
    if (this.environmentName === 'prod') {
      new cloudwatch.Alarm(this, `${tableDisplayName}ReadThrottleAlarm`, {
        alarmName: `acorn-pups-${tableDisplayName.toLowerCase()}-read-throttle`,
        alarmDescription: `Read throttling detected on ${tableDisplayName} table`,
        metric: readThrottleMetric,
        threshold: 1,
        evaluationPeriods: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });

      new cloudwatch.Alarm(this, `${tableDisplayName}WriteThrottleAlarm`, {
        alarmName: `acorn-pups-${tableDisplayName.toLowerCase()}-write-throttle`,
        alarmDescription: `Write throttling detected on ${tableDisplayName} table`,
        metric: writeThrottleMetric,
        threshold: 1,
        evaluationPeriods: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });

      new cloudwatch.Alarm(this, `${tableDisplayName}SystemErrorAlarm`, {
        alarmName: `acorn-pups-${tableDisplayName.toLowerCase()}-system-errors`,
        alarmDescription: `System errors detected on ${tableDisplayName} table`,
        metric: systemErrorMetric,
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
    }

    // Add widgets to dashboard
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: `${tableDisplayName} - Consumed Capacity`,
        left: [readCapacityMetric],
        right: [writeCapacityMetric],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: `${tableDisplayName} - Throttles & Errors`,
        left: [readThrottleMetric, writeThrottleMetric],
        right: [systemErrorMetric],
        width: 12,
        height: 6,
      })
    );
  }

  private addOverviewWidget(): void {
    // Create a text widget with overview information
    this.dashboard.addWidgets(
      new cloudwatch.TextWidget({
        markdown: `
# Acorn Pups Database Monitoring Dashboard

## Tables Overview
- **Users**: User profiles and preferences
- **Devices**: Device metadata and settings  
- **DeviceUsers**: Device sharing and permissions
- **Invitations**: Device sharing invitations
- **DeviceStatus**: Device health and status reports

## Key Metrics
- **Consumed Capacity**: Read/write units consumed
- **Throttles**: Requests that were throttled
- **System Errors**: Service-side errors

## Alarm Thresholds (Production Only)
- **Throttles**: ≥ 1 occurrence in 2 evaluation periods
- **System Errors**: ≥ 1 occurrence in 1 evaluation period
        `,
        width: 24,
        height: 8,
      })
    );
  }
} 