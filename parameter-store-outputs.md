# Acorn Pups Infrastructure - Parameter Store Outputs

This document lists all the Parameter Store parameters created by the DynamoDB stack.

## Parameter Store Path Structure

All parameters follow this pattern:
```
/acorn-pups/{environment}/dynamodb-tables/{table-name}/{property}
```

## Development Environment (`dev`)

### Users Table
- `/acorn-pups/dev/dynamodb-tables/users/name` → `acorn-pups-users-dev`
- `/acorn-pups/dev/dynamodb-tables/users/arn` → `arn:aws:dynamodb:region:account:table/acorn-pups-users-dev`

### Devices Table
- `/acorn-pups/dev/dynamodb-tables/devices/name` → `acorn-pups-devices-dev`
- `/acorn-pups/dev/dynamodb-tables/devices/arn` → `arn:aws:dynamodb:region:account:table/acorn-pups-devices-dev`

### Device Users Table
- `/acorn-pups/dev/dynamodb-tables/device-users/name` → `acorn-pups-device-users-dev`
- `/acorn-pups/dev/dynamodb-tables/device-users/arn` → `arn:aws:dynamodb:region:account:table/acorn-pups-device-users-dev`

### Invitations Table
- `/acorn-pups/dev/dynamodb-tables/invitations/name` → `acorn-pups-invitations-dev`
- `/acorn-pups/dev/dynamodb-tables/invitations/arn` → `arn:aws:dynamodb:region:account:table/acorn-pups-invitations-dev`

### Device Status Table
- `/acorn-pups/dev/dynamodb-tables/device-status/name` → `acorn-pups-device-status-dev`
- `/acorn-pups/dev/dynamodb-tables/device-status/arn` → `arn:aws:dynamodb:region:account:table/acorn-pups-device-status-dev`

## Production Environment (`prod`)

### Users Table
- `/acorn-pups/prod/dynamodb-tables/users/name` → `acorn-pups-users-prod`
- `/acorn-pups/prod/dynamodb-tables/users/arn` → `arn:aws:dynamodb:region:account:table/acorn-pups-users-prod`

### Devices Table
- `/acorn-pups/prod/dynamodb-tables/devices/name` → `acorn-pups-devices-prod`
- `/acorn-pups/prod/dynamodb-tables/devices/arn` → `arn:aws:dynamodb:region:account:table/acorn-pups-devices-prod`

### Device Users Table
- `/acorn-pups/prod/dynamodb-tables/device-users/name` → `acorn-pups-device-users-prod`
- `/acorn-pups/prod/dynamodb-tables/device-users/arn` → `arn:aws:dynamodb:region:account:table/acorn-pups-device-users-prod`

### Invitations Table
- `/acorn-pups/prod/dynamodb-tables/invitations/name` → `acorn-pups-invitations-prod`
- `/acorn-pups/prod/dynamodb-tables/invitations/arn` → `arn:aws:dynamodb:region:account:table/acorn-pups-invitations-prod`

### Device Status Table
- `/acorn-pups/prod/dynamodb-tables/device-status/name` → `acorn-pups-device-status-prod`
- `/acorn-pups/prod/dynamodb-tables/device-status/arn` → `arn:aws:dynamodb:region:account:table/acorn-pups-device-status-prod`

## CloudFormation Exports

### Development Environment
- `acorn-pups-users-table-name-dev`
- `acorn-pups-users-table-arn-dev`
- `acorn-pups-devices-table-name-dev`
- `acorn-pups-devices-table-arn-dev`
- `acorn-pups-device-users-table-name-dev`
- `acorn-pups-device-users-table-arn-dev`
- `acorn-pups-invitations-table-name-dev`
- `acorn-pups-invitations-table-arn-dev`
- `acorn-pups-device-status-table-name-dev`
- `acorn-pups-device-status-table-arn-dev`

### Production Environment
- `acorn-pups-users-table-name-prod`
- `acorn-pups-users-table-arn-prod`
- `acorn-pups-devices-table-name-prod`
- `acorn-pups-devices-table-arn-prod`
- `acorn-pups-device-users-table-name-prod`
- `acorn-pups-device-users-table-arn-prod`
- `acorn-pups-invitations-table-name-prod`
- `acorn-pups-invitations-table-arn-prod`
- `acorn-pups-device-status-table-name-prod`
- `acorn-pups-device-status-table-arn-prod`

