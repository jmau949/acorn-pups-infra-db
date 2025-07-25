# Acorn Pups Infrastructure - Database Stack

AWS CDK Infrastructure for Acorn Pups DynamoDB tables and database resources. This repository provides the foundational database infrastructure for the Acorn Pups IoT dog communication system.

## Project Overview

The Acorn Pups system consists of RF buttons that dogs can press to communicate with their owners through smart receivers that send push notifications via a mobile app.

## Database Schema

This infrastructure creates the following DynamoDB tables with their respective Global Secondary Indexes (GSI):

### Core Tables

#### Users Table
- **Purpose**: User profiles and notification preferences
- **Key Structure**: PK = `USER#{user_id}`, SK = `PROFILE`
- **GSI1**: Email lookup (`email` → `user_id`)
- **GSI2**: Cognito sub lookup (`cognito_sub` → `user_id`) - *enables device registration*

#### Devices Table (Smart Receivers)
- **Purpose**: ESP32 receiver metadata and settings
- **Key Structure**: PK = `DEVICE#{device_id}`, SK = `METADATA|SETTINGS`
- **GSI1**: Owner lookup (`owner_user_id` → `device_id`)
- **GSI2**: Serial number lookup (`serial_number` → `device_id`)
- **New Security Feature**: `device_instance_id` field for Echo/Nest-style reset security

#### DeviceUsers Table (Junction)
- **Purpose**: User-device access permissions and settings
- **Key Structure**: PK = `DEVICE#{device_id}`, SK = `USER#{user_id}`
- **GSI1**: User device lookup (`user_id` → `device_id`)

#### Invitations Table
- **Purpose**: Pending device sharing invitations
- **Key Structure**: PK = `INVITATION#{invitation_id}`, SK = `METADATA`
- **GSI1**: Device invitations (`device_id` → `created_at`)
- **GSI2**: Email invitations (`invited_email` → `created_at`)

#### DeviceStatus Table
- **Purpose**: Device health and connectivity monitoring
- **Key Structure**: PK = `DEVICE#{device_id}`, SK = `STATUS#{status_type}`

## Security Features

### Echo/Nest-Style Reset Security
The schema implements industry-standard device reset security patterns:

- **Device Instance ID**: Each device has a unique `device_instance_id` UUID that changes on every factory reset
- **Ownership Transfer**: Only devices with valid reset proof can transfer ownership
- **Physical Access Required**: Remote takeover attacks are prevented by requiring physical reset
- **Reset Timestamp**: `last_reset_at` field tracks when factory resets occur

### Key Security Benefits
- Prevents unauthorized device registration without physical access
- Enables legitimate ownership transfer after factory reset
- Follows the same security model as Amazon Echo and Google Nest devices
- Automatic cleanup of old certificates and user permissions during ownership transfer

## Prerequisites

- Node.js 22+ and npm 10+
- AWS CLI configured with appropriate permissions
- AWS CDK CLI installed (`npm install -g aws-cdk`)

## Installation

```bash
# Clone the repository
git clone https://github.com/your-org/acorn-pups-infra-db.git
cd acorn-pups-infra-db

# Install dependencies
npm install
```

## Development

### Building
```bash
npm run build
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Type Checking
```bash
# Build TypeScript
npm run build

# Watch for changes
npm run watch
```

## Deployment

### Development Environment
```bash
npm run deploy:dev
```

### Production Environment
```bash
npm run deploy:prod
```

### Configuration

The stack accepts the following configuration through CDK context:

- `environment`: Target environment (`dev` or `prod`)
- DynamoDB billing mode (Pay-per-request for development, Provisioned for production)
- Point-in-time recovery settings
- Deletion protection settings

### Environment-Specific Behaviors

**Development (`dev`)**:
- Pay-per-request billing
- No point-in-time recovery
- No deletion protection
- 7-day backup retention
- Resources destroyed on stack deletion

**Production (`prod`)**:
- Provisioned billing with auto-scaling
- Point-in-time recovery enabled
- Deletion protection enabled
- 30-day backup retention
- Resources retained on stack deletion

## Parameter Store Integration

All table names and ARNs are automatically exported to AWS Systems Manager Parameter Store for easy consumption by other stacks:

```
/acorn-pups/{environment}/dynamodb-tables/{table-name}/name
/acorn-pups/{environment}/dynamodb-tables/{table-name}/arn
```

Example parameters:
- `/acorn-pups/dev/dynamodb-tables/users/name`
- `/acorn-pups/dev/dynamodb-tables/devices/arn`

## Access Patterns

The schema is optimized for the following access patterns:

1. **User Operations**:
   - Get user profile by user ID
   - Find user by email address
   - Find user by Cognito sub (for device registration)

2. **Device Operations**:
   - Get device metadata and settings
   - Find devices by owner
   - Find device by serial number (for reset validation)

3. **Device Sharing**:
   - Get device users and permissions
   - Get user's device access
   - Manage pending invitations

4. **Device Monitoring**:
   - Get current device status
   - Query device health history

## Technology Stack

- **AWS CDK**: Infrastructure as Code
- **TypeScript**: Type-safe infrastructure definitions
- **DynamoDB**: NoSQL database for high performance and scalability
- **Parameter Store**: Configuration management
- **Jest**: Testing framework

## Contributing

1. Make changes to the infrastructure code
2. Run tests: `npm test`
3. Build: `npm run build`
4. Test deployment to dev: `npm run deploy:dev`
5. Create pull request

## Architecture Integration

This database stack is part of the larger Acorn Pups system:

- **API Layer**: Lambda functions for business logic
- **IoT Core**: MQTT communication with ESP32 devices
- **Mobile App**: React Native with Tamaguchi UI
- **Notifications**: SNS for push notifications
- **Authentication**: Cognito User Pools

## License

MIT License - see LICENSE file for details. 