# Acorn Pups Database Infrastructure

AWS CDK Infrastructure for Acorn Pups DynamoDB tables and database resources.

## Overview

This repository contains the AWS CDK code to deploy and manage all DynamoDB tables and related database infrastructure for the Acorn Pups application. It includes:

- **5 DynamoDB Tables** with proper indexing and access patterns
- **CloudWatch Monitoring** with dashboards and alarms
- **Parameter Store Integration** for cross-stack resource sharing
- **Environment-specific configurations** for dev and prod
- **Comprehensive testing** with unit and integration tests

## Database Schema

The infrastructure implements the following DynamoDB tables based on the Acorn Pups schema:

### Tables

1. **Users** (`acorn-pups-users-{env}`)
   - User profiles and preferences
   - PK: `USER#{user_id}`, SK: `PROFILE|PREFERENCES`
   - GSI1: Find user by email

2. **Devices** (`acorn-pups-devices-{env}`)
   - Device metadata and settings
   - PK: `DEVICE#{device_id}`, SK: `METADATA|SETTINGS`
   - GSI1: Find devices by owner
   - GSI2: Find device by serial number

3. **DeviceUsers** (`acorn-pups-device-users-{env}`)
   - Device sharing and permissions
   - PK: `DEVICE#{device_id}`, SK: `USER#{user_id}`
   - GSI1: Find user's device access

4. **Invitations** (`acorn-pups-invitations-{env}`)
   - Device sharing invitations
   - PK: `INVITATION#{invitation_token}`, SK: `METADATA`
   - GSI1: Find invitations by device
   - GSI2: Find invitations by email

5. **DeviceStatus** (`acorn-pups-device-status-{env}`)
   - Device health and status reports
   - PK: `DEVICE#{device_id}`, SK: `STATUS#{status_type}`

## Prerequisites

- Node.js >= 22.0.0
- npm >= 10.0.0
- AWS CLI configured with appropriate credentials
- AWS CDK CLI installed (`npm install -g aws-cdk`)

## Installation

```powershell
# Clone the repository (if not already done)
# cd acorn-pups-infra-db

# Install dependencies
npm install

# Verify CDK installation
npx cdk --version
```

## Usage

### Build

```powershell
npm run build
```

### Testing

```powershell
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Deployment

#### Development Environment

```powershell
# Deploy to development environment
npm run deploy:dev

# View what will be deployed (dry run)
npm run diff:dev
```

#### Production Environment

```powershell
# Deploy to production environment
npm run deploy:prod

# View what will be deployed (dry run)
npm run diff:prod
```

### CDK Commands

```powershell
# Synthesize CloudFormation templates
npm run synth

# Deploy specific stack
npx cdk deploy acorn-pups-db-dev-dynamodb --context environment=dev

# Destroy resources (be careful!)
npm run destroy:dev
npm run destroy:prod
```

## Environment Configuration

### Development (`dev`)
- Pay-per-request billing
- Point-in-time recovery: Disabled
- Deletion protection: Disabled
- Backup retention: 7 days

### Production (`prod`)
- Pay-per-request billing
- Point-in-time recovery: Enabled
- Deletion protection: Enabled
- Backup retention: 30 days
- CloudWatch alarms for throttling and errors

## Monitoring

The monitoring stack includes:

- **CloudWatch Dashboard** with key metrics
- **Alarms** (production only) for:
  - Read/write throttling
  - System errors
- **Metrics tracking**:
  - Consumed read/write capacity
  - Throttle events
  - Error rates

## Parameter Store Integration

All CloudFormation outputs are automatically stored in AWS Systems Manager Parameter Store for easy cross-stack references. The parameters follow a standardized naming convention:

### Parameter Paths

```
/acorn-pups/{environment}/dynamodb-tables/{table-name}/name
/acorn-pups/{environment}/dynamodb-tables/{table-name}/arn
```

### Available Parameters

For each environment (dev/prod), the following parameters are created:

- `/acorn-pups/{env}/dynamodb-tables/users/name` - Users table name
- `/acorn-pups/{env}/dynamodb-tables/users/arn` - Users table ARN
- `/acorn-pups/{env}/dynamodb-tables/devices/name` - Devices table name
- `/acorn-pups/{env}/dynamodb-tables/devices/arn` - Devices table ARN
- `/acorn-pups/{env}/dynamodb-tables/device-users/name` - Device Users table name
- `/acorn-pups/{env}/dynamodb-tables/device-users/arn` - Device Users table ARN
- `/acorn-pups/{env}/dynamodb-tables/invitations/name` - Invitations table name
- `/acorn-pups/{env}/dynamodb-tables/invitations/arn` - Invitations table ARN
- `/acorn-pups/{env}/dynamodb-tables/device-status/name` - Device Status table name
- `/acorn-pups/{env}/dynamodb-tables/device-status/arn` - Device Status table ARN

### Retrieving Parameters

These parameters can be retrieved in other stacks using CDK:

```typescript
const usersTableName = ssm.StringParameter.valueForStringParameter(
  this, 
  '/acorn-pups/dev/dynamodb-tables/users/name'
);
```

Or via AWS CLI:

```powershell
aws ssm get-parameter --name "/acorn-pups/dev/dynamodb-tables/users/name" --query "Parameter.Value" --output text
```

## Architecture

```
┌─────────────────┐    ┌──────────────────┐
│   DynamoDB      │    │   Monitoring     │
│   Stack         │    │   Stack          │
│                 │    │                  │
│ ┌─────────────┐ │    │ ┌──────────────┐ │
│ │   Users     │ │    │ │  Dashboard   │ │
│ │   Devices   │ │◄───┤ │  Alarms      │ │
│ │   DeviceU.. │ │    │ │  Metrics     │ │
│ │   Invites   │ │    │ └──────────────┘ │
│ │   Status    │ │    │                  │
│ └─────────────┘ │    └──────────────────┘
└─────────────────┘
```

## Access Patterns

The database design supports these key access patterns:

1. **Get user profile**: `PK = USER#{user_id}, SK = PROFILE`
2. **Get user preferences**: `PK = USER#{user_id}, SK = PREFERENCES`
3. **Find user by email**: GSI1 query on `email`
4. **Get user's devices**: GSI1 query on `owner_user_id`
5. **Get device metadata**: `PK = DEVICE#{device_id}, SK = METADATA`
6. **Get device settings**: `PK = DEVICE#{device_id}, SK = SETTINGS`
7. **Get device users**: Query `PK = DEVICE#{device_id}` with SK prefix `USER#`
8. **Get user's device permissions**: GSI1 query on `user_id`
9. **Get device status**: `PK = DEVICE#{device_id}, SK = STATUS#{type}`
10. **Get device invitations**: GSI1 query on `device_id`

## Project Structure

```
acorn-pups-infra-db/
├── bin/                           # CDK app entry point
│   └── app.ts
├── lib/                           # CDK stack definitions
│   ├── dynamodb-stack.ts          # DynamoDB tables
│   ├── monitoring-stack.ts        # CloudWatch monitoring
│   ├── parameter-store-helper.ts  # Parameter Store utilities
│   └── types.ts                  # TypeScript interfaces
├── tests/                         # Test files
│   ├── unit/                     # Unit tests
│   │   ├── dynamodb-stack.test.ts
│   │   └── parameter-store-helper.test.ts
│   ├── integration/              # Integration tests
│   └── setup.ts                  # Jest setup
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── cdk.json                     # CDK configuration
└── README.md                    # This file
```

## Contributing

1. Follow the existing code structure and patterns
2. Add tests for new functionality
3. Update documentation as needed
4. Test in development environment before production deployment

## Security Considerations

- All tables use encryption at rest (default)
- Access is controlled via IAM roles and policies
- Point-in-time recovery enabled in production
- Deletion protection enabled in production
- Regular backups configured

## Troubleshooting

### Common Issues

1. **Deployment fails with permissions error**
   - Ensure AWS credentials have sufficient DynamoDB and CloudWatch permissions

2. **Tests fail with module not found**
   - Run `npm install` to install dependencies

3. **CDK version mismatch**
   - Ensure CDK CLI version matches the version in package.json

### Useful Commands

```powershell
# Check CDK bootstrap status
npx cdk doctor

# View stack events
npx cdk deploy --debug

# Clean build artifacts
Remove-Item -Recurse -Force dist, node_modules
npm install
```

## License

MIT - See LICENSE file for details. 