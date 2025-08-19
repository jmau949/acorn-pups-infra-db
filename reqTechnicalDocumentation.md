# Acorn Pups Project - Complete Technical Documentation

## Product Overview

**Acorn Pups** is an IoT dog communication system consisting of three main components:

- **RF Button**: Simple RF transmitter device that dogs can press
- **Smart Receiver**: ESP32-based receiver that plugs into wall outlet and rings when button is pressed
- **React Native App**: Tamagui-based mobile application for notifications and device management

**Core Use Case**: Dogs press the RF button to let their owners know when they want to go outside. The system triggers both an immediate physical ringer and sends push notifications to all connected family members through the mobile app.

---

## System Architecture

### Hardware Components

- **ESP32 Development Boards** with WiFi capability
- **Bluetooth Low Energy (BLE)** for initial device setup
- **RF Button**: Simple RF transmitter (315MHz/433MHz) with battery power and LED status indicators
- **Smart Receiver**: ESP32 with RF receiver chip, WiFi capability, speaker, volume up/down buttons that plugs into wall outlet
- **MQTT over TLS** for cloud communication from receiver only

### Core AWS Services

#### 1. AWS IoT Core (Device Communication)

- MQTT communication between ESP32 receivers and cloud
- Real-time, low-latency messaging
- Device certificate management and authentication
- Message routing to Lambda functions

#### 2. AWS Lambda (Business Logic)

**Key Functions:**

- `cognitoPostConfirmation`: Creates Users table entry after email verification
- `registerDevice`: Handle receiver setup, device association, and reset-based ownership transfer
- `registerPushToken`: Register or update push notification tokens with minimal proactive management
- `handleButtonPress`: Process button events and trigger push notifications to all user devices
- `handleVolumeControl`: Process volume control events and update device settings in DynamoDB
- `handleDeviceLifecycle`: Process IoT lifecycle events (connect/disconnect) and update device status
- `updateDeviceSettings`: Handle app configuration changes
- `inviteUser`: Create invitation and send email
- `acceptInvitation`: Process invitation acceptance and create DeviceUsers entries
- `declineInvitation`: Process invitation decline
- `removeUserAccess`: Remove user permissions
- `processDeviceLogs`: Process device logs from MQTT, route ERROR/FATAL to CloudWatch Alarms, store critical logs in DynamoDB

#### 3. Amazon DynamoDB (Data Storage)

**Primary Tables:**

- `Users`: User profiles and notification preferences (created by Cognito post-confirmation)
- `Devices`: Receiver information, settings, status, and device instance tracking
- `DeviceUsers`: Junction table managing user-device relationships
- `DeviceInvitations`: Pending invitation management
- `DeviceStatus`: Device health and connectivity monitoring
- `UserEndpoints`: Push notification tokens for multi-device support
- `DeviceLogs`: Critical device logs and error tracking for troubleshooting

#### 4. Amazon API Gateway (Mobile App Interface)

**REST Endpoints:**

- `POST /devices/register` - Device registration with reset-based ownership transfer
- `GET /users/{userId}/devices` - Retrieve user's devices
- `PUT /devices/{deviceId}/settings` - Update device configuration
- `POST /devices/{deviceId}/invite` - Send invitation to user
- `POST /invitations/{invitationId}/accept` - Accept device invitation
- `POST /invitations/{invitationId}/decline` - Decline device invitation
- `GET /users/{userId}/invitations` - Get pending invitations for user
- `DELETE /devices/{deviceId}/users/{userId}` - Remove user access
- `POST /users/{userId}/push-tokens` - Register or update push notification token

#### 5. Amazon Cognito (User Authentication)

- User Pools for secure sign-up and sign-in
- JWT token generation for API authorization
- Password reset and email verification
- **Post-confirmation trigger**: Automatically creates Users table entries

#### 6. Expo Push Service (Push Notifications)

- Cross-platform push notifications (iOS/Android) via Expo
- Multi-device support per user with automatic token management
- Reactive token cleanup based on delivery failures
- Minimal proactive token updates on app launch
- Device fingerprint-based stable identification

#### 7. Amazon CloudWatch (Logging & Monitoring)

- **CloudWatch Logs**: Centralized logging for ESP32 device logs and Lambda functions
- **Log Groups**: Structured log organization with `/acorn-pups/device-logs` for ESP32 firmware logs
- **Log Retention**: Cost-optimized 30-day retention policy for production logs
- **CloudWatch Alarms**: Automated alerting for error rates exceeding 5% threshold
- **Cost Monitoring**: Daily cost tracking and anomaly detection for logging infrastructure
- **Performance Metrics**: Device health monitoring and log ingestion rate tracking

---

## MQTT Certificate Management and TLS Security

### Overview

The ESP32 device implements enterprise-grade secure communication with AWS IoT Core using X.509 certificate-based mutual TLS authentication. This ensures that all data transmitted between the device and cloud infrastructure is encrypted and authenticated at the highest security standards.

### Certificate Management

**Secure Storage**: Device certificates are stored in ESP32's encrypted NVS (Non-Volatile Storage) flash memory, ensuring persistence across power cycles and protection against unauthorized access.

**Certificate Components**:

- **Device Certificate**: Unique X.509 certificate identifying the specific ESP32 device
- **Private Key**: RSA private key for device authentication and message signing
- **Root Certificate**: Amazon Root CA 1 for validating AWS IoT Core server certificates

**Lifecycle Management**: Certificates are provisioned during device registration, validated before use, and support rotation for long-term security maintenance.

### TLS Mutual Authentication

**Bidirectional Security**: Both the ESP32 device and AWS IoT Core validate each other's certificates, preventing man-in-the-middle attacks and ensuring communication with legitimate endpoints only.

**Encryption Standards**: All MQTT communication uses TLS 1.2+ encryption with industry-standard cipher suites, providing perfect forward secrecy and protection against eavesdropping.

**Connection Process**:

1. Device initiates secure connection to AWS IoT Core (port 8883)
2. Server presents its certificate for client validation
3. Client validates server certificate against trusted root CA
4. Server requests client certificate for mutual authentication
5. Client presents device certificate and proves private key ownership
6. Encrypted tunnel established for all MQTT communication

### MQTT Protocol Implementation

**Topic Architecture**: Structured topic hierarchy following AWS IoT Core conventions:

- Device-specific topics for button events, status updates, and heartbeat messages
- Bidirectional communication for device commands and configuration updates
- JSON message format with consistent field naming and ISO 8601 timestamps

**Quality of Service**: At Least Once (QoS 1) delivery ensures reliable message transmission with automatic retries and acknowledgments.

**Connection Resilience**: Exponential backoff retry mechanism with automatic reconnection handling network interruptions and maintaining persistent connectivity.

### Security Features

**Attack Prevention**:

- **Man-in-the-Middle**: Prevented by mutual certificate validation
- **Replay Attacks**: Mitigated by TLS session encryption and nonces
- **Data Tampering**: TLS encryption prevents message modification
- **Unauthorized Access**: Device-specific AWS IoT policies enforce permissions

**Best Practices**:

- Each device has unique certificates for isolation
- Private keys never leave the device
- Certificate fingerprinting for integrity validation
- Comprehensive audit logging for security monitoring

### Performance Optimization

**Memory Efficiency**: Dynamic buffer allocation optimizes ESP32 memory usage, reducing certificate loading overhead by 20%+ compared to fixed buffer approaches.

**Connection Management**: Intelligent connection health monitoring with periodic heartbeats and automatic recovery from network failures.

**Resource Usage**: Minimal stack usage through efficient reference passing and heap-based certificate storage to preserve limited ESP32 memory resources.

### Compliance and Standards

The implementation follows industry security standards including:

- **X.509 PKI**: Public Key Infrastructure for certificate management
- **TLS 1.2+**: Transport Layer Security for encrypted communication
- **AWS IoT Core**: Integration with AWS security and device management services
- **MQTT 3.1.1**: Standardized IoT messaging protocol

This architecture ensures that the ESP32 device meets enterprise security requirements while maintaining efficient operation within the constraints of embedded IoT environments.

---

## Database Schema

### Users Table

```
Primary Key: PK = "USER#{user_id}"
Sort Key: SK = "PROFILE"
Attributes:
- user_id: string (Cognito Sub UUID used directly as user identifier)
- email: string (unique, User email address)
- full_name: string (User full name)
- phone: string (User phone number)
- timezone: string (User timezone, default: "UTC")
- created_at: string (Account creation timestamp, ISO format)
- updated_at: string (Last profile update timestamp)
- last_login: string (Last login timestamp)
- is_active: boolean (Whether user account is active)
- push_notifications: boolean (Global push notification preference)
- preferred_language: string (User preferred app language)
- sound_alerts: boolean (Global sound alert preference)
- vibration_alerts: boolean (Global vibration alert preference)

GSI1 (Find user by email):
- GSI1PK = email attribute
- GSI1SK = user_id attribute
```

### Devices Table (Smart Receivers)

```
Primary Key: PK = "DEVICE#{device_id}"
Sort Key: SK = "METADATA" | "SETTINGS"
Note: SK = "SETTINGS" is used for volume control updates and other device configuration changes
Attributes:
- device_id: string (Unique UUID for the device)
- device_instance_id: string (Unique UUID generated each factory reset cycle)
- serial_number: string (unique, Hardware serial number)
- mac_address: string (Device MAC address)
- device_name: string (User-friendly name like "Living Room Receiver")
- owner_user_id: string (Cognito Sub UUID of device owner)
- firmware_version: string (Current firmware version)
- hardware_version: string (Hardware revision)
- is_online: boolean (Current connectivity status)
- last_seen: string (Last communication timestamp)
- wifi_ssid: string (Connected WiFi network name)
- signal_strength: number (WiFi signal strength in dBm)
- created_at: string (Device registration timestamp)
- updated_at: string (Last metadata update timestamp)
- last_reset_at: string (Last factory reset timestamp)
- is_active: boolean (Whether device is active/enabled)
- sound_enabled: boolean (Whether device makes sounds)
- sound_volume: number (Device sound volume, 1-10 scale)
- led_brightness: number (LED brightness level, 1-10 scale)
- notification_cooldown: number (Seconds between notifications)
- quiet_hours_enabled: boolean (Whether quiet hours are active)
- quiet_hours_start: string (Time to stop ringing locally, e.g. "22:00")
- quiet_hours_end: string (Time to resume ringing locally, e.g. "07:00")

GSI1 (Find devices by owner):
- GSI1PK = owner_user_id attribute
- GSI1SK = device_id attribute

GSI2 (Find device by serial):
- GSI2PK = serial_number attribute
- GSI2SK = device_id attribute

```

### DeviceUsers Table (Junction Table)

```
Primary Key: PK = "DEVICE#{device_id}"
Sort Key: SK = "USER#{user_id}"
Attributes:
- device_id: string (UUID of the device)
- user_id: string (Cognito Sub UUID of user with access)
- notifications_permission: boolean (Can receive notifications)
- settings_permission: boolean (Can modify device settings)
- notifications_enabled: boolean (User wants notifications from this device)
- notification_sound: string ("default", "silent", "custom")
- notification_vibration: boolean (Enable vibration for notifications)
- quiet_hours_enabled: boolean (User has quiet hours set)
- quiet_hours_start: string (User's quiet hours start time "HH:MM")
- quiet_hours_end: string (User's quiet hours end time "HH:MM")
- custom_notification_sound: string (URL to custom sound file)
- device_nickname: string (User's custom name for device)
- invited_by: string (UUID of user who sent invitation)
- invited_at: string (Invitation sent timestamp)
- accepted_at: string (Invitation accepted timestamp)
- is_active: boolean (Whether access permission is active)

GSI1 (Find user's device access):
- GSI1PK = user_id attribute
- GSI1SK = device_id attribute
```

### Invitations Table

```
Primary Key: PK = "INVITATION#{invitation_id}"
Sort Key: SK = "METADATA"
Attributes:
- invitation_id: string (Unique UUID for invitation)
- device_id: string (UUID of device being shared)
- invited_email: string (Email address of invited user)
- invited_by: string (UUID of user sending invitation)
- invitation_token: string (Unique token for accepting invitation)
- expires_at: string (Invitation expiration timestamp)
- created_at: string (Invitation creation timestamp)
- accepted_at: string (Invitation acceptance timestamp)
- is_accepted: boolean (Whether invitation has been accepted)
- is_expired: boolean (Whether invitation has expired)

GSI1 (Find invitations by device):
- GSI1PK = device_id attribute
- GSI1SK = created_at attribute

GSI2 (Find invitations by email):
- GSI2PK = invited_email attribute
- GSI2SK = created_at attribute
```

### DeviceStatus Table

```
Primary Key: PK = "DEVICE#{device_id}"
Sort Key: SK = "STATUS#{status_type}"
Attributes:
- device_id: string (UUID of the device)
- status_type: string (Type: "CURRENT", "HEALTH", "CONNECTIVITY")
- timestamp: string (Status report timestamp)
- signal_strength: number (WiFi signal strength at report time)
- is_online: boolean (Whether device was online)
- memory_usage: number (Device memory usage percentage)
- cpu_temperature: number (Device CPU temperature in Celsius)
- uptime: number (Device uptime in seconds)
- error_count: number (Number of errors since last report)
- last_error_message: string (Most recent error message)
- firmware_version: string (Firmware version at report time)
```

### UserEndpoints Table (Push Notification Tokens)

```
Primary Key: PK = "USER#{user_id}"
Sort Key: SK = "ENDPOINT#{device_fingerprint}"
Attributes:
- user_id: string (Cognito Sub UUID of the user)
- device_fingerprint: string (Stable device identifier, e.g., "ios-iPhone15Pro-12345678")
- expo_push_token: string (Expo push notification token)
- platform: string (Device platform: "ios" or "android")
- device_info: string (Human-readable device information)
- is_active: boolean (Whether the endpoint is active)
- created_at: string (Endpoint creation timestamp, ISO format)
- last_used: string (Last successful notification delivery timestamp)
- updated_at: string (Last token update timestamp)

Access Patterns:
- Query all endpoints for a user: PK = "USER#{user_id}" AND SK begins_with "ENDPOINT#"
- Get specific endpoint: PK = "USER#{user_id}" AND SK = "ENDPOINT#{device_fingerprint}"
```

### DeviceLogs Table (Critical Device Logs)

```
Primary Key: PK = "DEVICE#{device_id}"
Sort Key: SK = "LOG#{timestamp}#{log_level}"
Attributes:
- device_id: string (UUID of the device)
- timestamp: string (Log entry timestamp, ISO format)
- log_level: string (Log level: "ERROR", "FATAL", "WARN", "INFO")
- component: string (Component that generated log: "RF", "MQTT", "WIFI", "BUTTON")
- message: string (Log message content, max 256 bytes)
- error_code: string (Optional error code for structured errors)
- context: string (Optional additional context data as JSON)
- created_at: string (When log was stored in DynamoDB)

TTL: 2592000 (30 days retention for cost optimization)

GSI1 (Query logs by level):
- GSI1PK = log_level attribute
- GSI1SK = timestamp attribute

Access Patterns:
- Get device logs: PK = "DEVICE#{device_id}" AND SK begins_with "LOG#"
- Get error logs: GSI1PK = "ERROR" or "FATAL"
- Get logs by time range: PK = "DEVICE#{device_id}" AND SK between timestamps
```

---

## Core System Flows

### 1. User Registration Flow

#### Cognito Post-Confirmation Trigger

The user registration process is now handled automatically by AWS Cognito using post-confirmation triggers, completely separated from device registration.

**User Registration Process:**

1. **Mobile App Sign-Up**: User creates account through mobile app
2. **Cognito User Pool**: AWS Cognito handles user creation, email verification
3. **Email Verification**: User receives and clicks verification email
4. **Post-Confirmation Trigger**: AWS Cognito automatically triggers `cognitoPostConfirmation` Lambda
5. **Lambda Processing** (`cognitoPostConfirmation`):
   - Receives Cognito event with user details (email, cognito_sub, etc.)
   - Uses Cognito Sub directly as user_id (no custom UUID generation)
   - Creates Users table entry with default preferences
   - Sets up user profile with timezone and notification defaults
   - No device association at this stage
6. **User Profile Complete**: User can now access app and register devices

**Benefits of Cognito Post-Confirmation with Direct Sub Usage:**

- **Automatic User Creation**: No manual user creation steps required
- **Email Verification**: Users table only contains verified email addresses
- **Simplified Device Registration**: Device registration focuses only on device concerns
- **Reliable Timing**: User profile guaranteed to exist before device registration
- **Error Handling**: Cognito handles retry logic for failed user creation
- **Eliminated Database Lookups**: API Lambdas extract user_id directly from JWT sub claim
- **Reduced Latency**: No additional database queries needed for user identification
- **Lower Costs**: Fewer DynamoDB read operations reduce operational costs
- **Simplified Mobile App**: Mobile app uses JWT sub directly, no extra API calls needed

### 2. App-First Setup Process

#### Initial Setup Approach

**Physical Product Packaging:**

- QR code printed on receiver box/instructions
- QR code links directly to App Store/Google Play
- Clear step-by-step setup instructions included
- RF buttons included in package (no separate setup required)

**User Experience Benefits:**

- Guided setup process through mobile app
- Account creation in controlled environment
- Visual feedback and comprehensive error handling
- Step-by-step instructions with illustrations

#### Recommended Setup Flow

1. **Product Unboxing**

   - User receives receiver with QR code and RF buttons
   - Instructions: "Download Acorn Pups app to get started"
   - QR code scan → App Store/Google Play

2. **App Installation & Account Creation**

   - User downloads mobile application
   - Creates account via Cognito authentication (triggers user creation)
   - Welcome screen: "Let's set up your receiver"

3. **Device Discovery**

   - App initiates "Add New Device" flow
   - Camera mode for QR code scanning on receiver
   - QR code contains: `{deviceName: "acornpup-receiver-1234"}`

4. **WiFi Connection**

   - App connects to receiver via Bluetooth Low Energy
   - WiFi credentials transmitted securely to receiver
   - Receiver connects to WiFi and disables Bluetooth

5. **Button Testing**
   - App instructs: "Press any RF button to test"
   - Receiver automatically recognizes button RF signals
   - App confirms: "Button detected! System ready to use"

### 3. Device Registration Flow (Echo/Nest Pattern)

1. **Setup Mode**: ESP32 receiver enters configuration mode, advertises via BLE
2. **Mobile Connection**: User connects through Bluetooth in mobile app
3. **WiFi Configuration**: App securely transmits WiFi credentials to ESP32
4. **Bluetooth Cleanup**: ESP32 disables Bluetooth (no longer needed)
5. **Device Registration**: ESP32 calls registration API with device information and instance ID
6. **Lambda Processing** (`registerDevice`):
   - **User Lookup**: Extracts user_id directly from JWT sub claim (no database lookup needed)
   - **Existing Device Check**: Queries Devices table by serial_number
   - **Reset Validation**:
     - If device exists AND has different device_instance_id AND device_state = "factory_reset" → Allow ownership transfer
     - If device exists AND same device_instance_id → Return 409 (no reset occurred)
     - If device doesn't exist → Normal new device registration
   - **Ownership Transfer** (if reset detected):
     - Revoke old AWS IoT certificates
     - Remove all existing DeviceUsers entries
     - Generate new AWS IoT certificates
     - Update device with new owner and instance ID
   - **IoT Core Setup**: Creates IoT Thing, generates AWS IoT Core managed X.509 certificate
   - **Certificate Management**: Attaches device policy and links certificate to IoT Thing
   - **Device Creation/Update**: Creates/updates entry in Devices table with metadata and settings
   - **Owner Association**: Creates entry in DeviceUsers table linking authenticated user as owner
   - **Response**: Returns certificate, private key, and IoT endpoint to device
7. **Credential Storage**: ESP32 stores credentials securely and connects to MQTT
8. **Normal Operation**: Device enters normal mode, Bluetooth permanently disabled
9. **RF Button Auto-Recognition**: Any RF button press is automatically recognized and processed

#### AWS IoT Core Certificate Generation

The registration process uses AWS IoT Core's built-in certificate generation:

**Certificate Files Required by Receiver:**

- Device Certificate (X.509 PEM format)
- Private Key (RSA PEM format)
- Amazon Root CA 1 (downloaded from Amazon Trust Repository)

**Benefits of AWS-Managed Certificates:**

- No custom Certificate Authority management overhead
- Automatic integration with AWS IoT Core
- Simplified certificate lifecycle management
- Built-in security best practices

### 4. Factory Reset Process (Echo/Nest Pattern)

#### Physical Reset Process

1. **Physical Trigger**: User presses pinhole reset button on ESP32
2. **Generate New Instance ID**: Device creates fresh UUID for this reset cycle
3. **Store Reset State**:
   - Save new device_instance_id to persistent storage
   - Set device_state = "factory_reset"
   - Record reset_timestamp
4. **Local Reset**:
   - **Complete NVS Namespace Erasure** (`acorn_device` namespace):
     - WiFi credentials
     - Device certificates
     - Device identity (device_id, owner_user_id, iot_endpoint)
     - Device settings
   - **Preserve Reset Metadata**: New instance ID and reset state survive the wipe
5. **Hardware Reset**: Reboot into BLE provisioning mode with LED indicator
6. **Setup Mode**: Device ready for BLE-based setup via mobile app
7. **Re-registration**: During next registration, device provides new instance ID proving reset occurred
8. **Backend Cleanup**: registerDevice Lambda detects reset and handles all cleanup automatically

#### Benefits of This Approach

- **Single Cleanup Path**: HTTP registration handles all cleanup (no MQTT complexity)
- **Offline Reset Support**: Works regardless of WiFi availability during reset
- **Security**: Requires physical access to generate new instance ID
- **Reliability**: No dependency on network connectivity during reset
- **Simplicity**: One consistent flow for all reset scenarios

### 5. Push Token Management Flow

#### Token Registration/Update Process

1. **App Launch Detection**: Mobile app checks Expo push token on every launch
2. **Token Comparison**: Compare current token with locally stored token
3. **API Call (if changed)**: Call `POST /users/{userId}/push-tokens` if token differs
4. **Lambda Processing** (`registerPushToken`):
   - Extract device fingerprint from request
   - Query UserEndpoints table for existing endpoint
   - Compare tokens if endpoint exists
   - Create new endpoint or update existing if token changed
   - Set is_active = true and update timestamps
   - Return action taken (created/updated/unchanged)
5. **Local Storage Update**: App stores new token for future comparisons

#### Reactive Token Cleanup

1. **Notification Delivery**: Expo Push Service attempts delivery
2. **Delivery Receipt**: Service returns delivery status
3. **Error Processing**: Lambda detects `DeviceNotRegistered` errors
4. **Automatic Cleanup**: Mark invalid tokens as is_active = false
5. **Audit Trail**: Log cleanup actions for monitoring

### 7. Button Press Flow

1. **Physical Interaction**: Dog presses RF button
2. **RF Transmission**: Button transmits RF signal with unique button ID
3. **RF Reception**: ESP32 receiver detects RF signal and extracts button ID
4. **Auto-Recognition**: Receiver automatically recognizes new buttons (MVP behavior)
5. **Local Response**: Receiver immediately activates ringer/speaker
6. **MQTT Publication**: ESP32 publishes to `acorn-pups/button-press/{clientId}`
7. **IoT Rule Activation**: AWS IoT rule triggers `handleButtonPress` Lambda
8. **Lambda Processing**:
   - Queries DeviceUsers GSI to retrieve all authorized users
   - For each user, queries UserEndpoints for all active push tokens
   - Filters users based on notification permissions
   - Sends batch push notifications via Expo Push Service
   - Processes delivery receipts for reactive token cleanup
   - Updates last_used timestamps for successful deliveries
   - **No persistent storage of button events** - real-time processing only
9. **Multi-Device Notification**: All authorized users receive notifications on all their devices

### 8. Volume Control Flow

1. **Physical Interaction**: User presses volume up or volume down button on receiver
2. **Local Processing**: ESP32 immediately adjusts local volume setting in firmware
3. **Settings Update**: ESP32 updates internal settings struct with new volume level
4. **MQTT Publication**: ESP32 publishes volume change to `acorn-pups/volume-control/{clientId}`
5. **IoT Rule Activation**: AWS IoT rule triggers `handleVolumeControl` Lambda
6. **Lambda Processing** (`handleVolumeControl`):
   - Extracts device ID from clientId
   - Updates Devices table with SortKey "SETTINGS"
   - Updates `sound_volume` attribute with new volume level
   - Records timestamp of volume change
   - **No user notifications sent** - settings change only
7. **Database Updated**: Volume setting persisted for device state recovery

### 9. User Invitation System

**Invitation Flow:**

1. **Owner Invitation**: Device owner sends invite through mobile app
2. **API Request**: `POST /devices/{deviceId}/invite` with invited user email
3. **Lambda Processing** (`inviteUser`):
   - Validates requestor has owner/admin permissions
   - Creates pending invitation record in Invitations table
   - Sends email invitation to invited user with app deep link
   - **No DeviceUsers entry created yet**
4. **User Acceptance Process**:
   - Invited user receives email with link to accept invitation
   - User opens app and accepts invitation via `POST /invitations/{invitationId}/accept`
   - **Lambda Processing** (`acceptInvitation`):
     - Validates invitation exists
     - **User Lookup**: Extracts user_id directly from JWT sub claim (no database lookup needed)
     - **Creates DeviceUsers Entry**: Links user to device with specified permissions
     - Marks invitation as accepted in Invitations table
     - Sends confirmation notifications to device owner
5. **Access Granted**: Device immediately appears in user's app with configured permissions

**DeviceUsers Entry Creation Timing:**

- **Device Owner**: Created during device registration (`registerDevice`)
- **Invited Users**: Created only upon invitation acceptance (`acceptInvitation`)

### 10. Settings Management Flow

1. **App Configuration**: User modifies settings in mobile application
2. **Permission Validation**: API confirms user has settings permission
3. **Lambda Processing** (`updateDeviceSettings`):
   - Updates Devices table with new configuration
   - Publishes settings to MQTT topic `acorn-pups/settings/{deviceId}`
4. **Device Update**: ESP32 receives and applies new settings immediately

### 11. Device Status Monitoring Flow

#### Automatic Status Updates (Backend)

1. **Device State Change**: ESP32 connects to or disconnects from AWS IoT Core
2. **AWS IoT Lifecycle Event**: IoT Core automatically publishes to `$aws/events/presence/connected/{clientId}` or `$aws/events/presence/disconnected/{clientId}`
3. **IoT Rule Trigger**: Rule `AcornPupsDeviceLifecycle` matches events for `acorn-receiver-*` clients
4. **Lambda Processing** (`handleDeviceLifecycle`):
   - Extracts device ID from clientId
   - Updates Devices table: `is_online` status and `last_seen` timestamp
   - No push notifications sent (status is for UI display only)
5. **Database Updated**: Device status available for next API query

#### Mobile App Status Display (Frontend)

1. **Screen Load**: User opens device list or device detail screen
2. **Initial API Call**: `GET /users/{userId}/devices` returns devices with current status
3. **UI Display**: Shows online/offline status with last seen timestamp
4. **Periodic Refresh**:
   - While screen is active: API call every 60 seconds
   - Background/other screens: No polling (conserves battery)
5. **Status Update**: UI automatically reflects any status changes from periodic refresh

#### Future Enhancement: On-Demand Status Check

If 60-second refresh proves insufficient, we can add:

1. **User Action**: Tap "Refresh" button in app
2. **MQTT Request**: Publish to `acorn-pups/status-request/{clientId}`
3. **Device Response**: ESP32 responds with detailed status to `acorn-pups/status-response/{clientId}`
4. **Lambda Update**: Process response and update Devices table
5. **Immediate UI Update**: App shows fresh status data

### 12. Device Logging Flow

#### ESP32 Log Generation and Transmission

1. **Log Generation**: ESP32 components (RF, MQTT, WiFi, Button) generate logs using structured logging framework
2. **Local Filtering**: Firmware filters logs by level (INFO+ for production) to optimize bandwidth
3. **Circular Buffer**: Critical logs stored in 8KB circular buffer for offline scenarios
4. **Log Formatting**: Logs formatted as structured JSON with timestamp, level, component, and message
5. **MQTT Publication**: ESP32 publishes logs to `acorn-pups/logs/{clientId}` topic
6. **Batch Transmission**: Non-critical logs batched and compressed before transmission for cost optimization

#### Cloud Log Processing

1. **IoT Rule Activation**: AWS IoT rule triggers `processDeviceLogs` Lambda for log messages
2. **Lambda Processing** (`processDeviceLogs`):
   - Parses structured log JSON from device
   - Routes ERROR/FATAL logs to CloudWatch Alarms for immediate alerting
   - Stores critical logs (ERROR/FATAL) in DynamoDB DeviceLogs table with 30-day TTL
   - Forwards all logs to CloudWatch Logs `/acorn-pups/device-logs` log group
   - Implements log sampling (1 in 10) for high-frequency non-critical events
3. **CloudWatch Integration**: All device logs ingested into CloudWatch for centralized monitoring
4. **Alerting**: CloudWatch Alarms trigger SNS notifications when error rates exceed 5%
5. **Cost Control**: Log retention policies and sampling rules maintain target <$50/month cost

#### Log Monitoring and Analysis

1. **Real-time Monitoring**: CloudWatch dashboard displays device health metrics and error rates
2. **Historical Analysis**: 30-day log retention in CloudWatch and DynamoDB for troubleshooting
3. **Cost Tracking**: Daily cost monitoring with automated alerts for budget overruns
4. **Performance Metrics**: Track log ingestion rates and device error patterns

---

## RF Communication Protocol

### RF Signal Structure

- **Frequency**: 315MHz or 433MHz (ISM band)
- **Modulation**: ASK (Amplitude Shift Keying) or FSK (Frequency Shift Keying)
- **Data Format**: Simple button ID transmission
- **Range**: 100-300 feet (indoor/outdoor)

### Button ID Format

```
RF Signal: {buttonId: "BTN001234", batteryLevel: 85}
```

### RF Receiver Processing

```cpp
void handleRFSignal(String buttonRfId, int batteryLevel) {
    // Auto-recognize button (no registration needed for MVP)
    logButtonPress(buttonRfId, batteryLevel);

    // Trigger local ringer
    activateRinger();

    // Send to cloud for notifications
    publishButtonPress(buttonRfId, batteryLevel);
}
```

---

## MQTT Communication Protocol

### Topic Structure

```
acorn-pups/button-press/{clientId}        # Button press events from receiver
acorn-pups/volume-control/{clientId}      # Volume control events from receiver (device to cloud)
acorn-pups/status-response/{clientId}     # Device status responses (device to cloud)
acorn-pups/status-request/{clientId}      # Status requests (cloud to device)
acorn-pups/settings/{clientId}            # Settings updates to receiver
acorn-pups/commands/{clientId}            # Commands (update, etc.)
acorn-pups/firmware/{clientId}            # Firmware update topic
acorn-pups/logs/{clientId}                # Device logs from receiver (device to cloud)
```

**AWS IoT Lifecycle Events** (automatic system topics):

```
$aws/events/presence/connected/{clientId}     # Device connection event
$aws/events/presence/disconnected/{clientId}  # Device disconnection event
```

**Note**: `{clientId}` format is `acorn-receiver-{deviceId}` where deviceId is the UUID. Reset cleanup topics removed - all reset handling now via HTTP registration API. Status communication now uses pull model where cloud requests status from devices. AWS IoT lifecycle events are automatically published by AWS IoT Core when devices connect/disconnect.

### Message Formats

#### Button Press Event

```json
{
  "clientId": "acorn-receiver-715a45a8-f7a4-42bb-b54e-11abebba353e",
  "deviceId": "715a45a8-f7a4-42bb-b54e-11abebba353e",
  "buttonRfId": "BTN001234",
  "timestamp": "2025-07-02T12:00:00Z",
  "batteryLevel": 85
}
```

#### Volume Control Event

```json
{
  "clientId": "acorn-receiver-715a45a8-f7a4-42bb-b54e-11abebba353e",
  "deviceId": "715a45a8-f7a4-42bb-b54e-11abebba353e",
  "action": "volume_up" | "volume_down",
  "newVolume": 8,
  "previousVolume": 7,
  "timestamp": "2025-07-02T12:00:00Z"
}
```

#### Settings Update

```json
{
  "volume": 75,
  "ringerType": "chime",
  "ringerDuration": 3,
  "cooldownPeriod": 5,
  "ledBrightness": 50
}
```

#### Device Log Event

```json
{
  "clientId": "acorn-receiver-715a45a8-f7a4-42bb-b54e-11abebba353e",
  "deviceId": "715a45a8-f7a4-42bb-b54e-11abebba353e",
  "timestamp": "2025-07-02T12:00:00Z",
  "logLevel": "ERROR",
  "component": "MQTT",
  "message": "Failed to connect to MQTT broker",
  "errorCode": "MQTT_CONN_001",
  "context": {
    "attemptCount": 3,
    "lastError": "Connection timeout",
    "signalStrength": -67
  }
}
```

---

## Security Implementation

### Device Security

- **AWS IoT Core Managed X.509 Certificates**: Individual AWS-managed certificate per receiver
- **Amazon Root CA**: Devices use Amazon Root CA 1 for certificate validation
- **Minimal IAM Permissions**: Receivers can only publish to own topics
- **Encrypted Communication**: MQTT over TLS 1.2
- **Certificate Management**: Simplified certificate lifecycle via AWS IoT Core

### Reset Security (Echo/Nest Pattern)

- **Physical Access Required**: Only physical reset button can generate new instance ID
- **Instance ID Validation**: Backend verifies device was physically reset
- **Remote Takeover Prevention**: Registration fails without valid reset proof
- **Certificate Revocation**: Old certificates automatically revoked during ownership transfer

### User Registration Security

- **Cognito Post-Confirmation Trigger**: Automatic user creation after email verification
- **Email Verification Required**: Users table only contains verified email addresses
- **IAM Role Security**: Post-confirmation Lambda has minimal DynamoDB write permissions
- **Idempotent Operations**: Duplicate user creation requests handled gracefully
- **Error Handling**: Failed user creation retried automatically by Cognito

### RF Security

- **Unique Button IDs**: Each button has factory-programmed unique identifier
- **Signal Validation**: Receiver validates RF signal integrity
- **Auto-Recognition**: Simplifies security model (any valid button works)
- **Local Processing**: RF signals processed locally, not transmitted to cloud

### API Security

- **JWT Token Validation**: Cognito-based authentication
- **API Gateway Throttling**: Rate limiting and usage plans
- **CORS Configuration**: Restricted to mobile app domains
- **Resource-Level Permissions**: Users access only authorized devices

### IoT Device Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "iot:Connect",
      "Resource": "arn:aws:iot:region:account:client/acorn-receiver-*",
      "Condition": {
        "StringEquals": {
          "iot:Connection.Thing.IsAttached": "true"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": "iot:Publish",
      "Resource": [
        "arn:aws:iot:region:account:topic/acorn-pups/button-press/${iot:ClientId}",
        "arn:aws:iot:region:account:topic/acorn-pups/volume-control/${iot:ClientId}",
        "arn:aws:iot:region:account:topic/acorn-pups/status-response/${iot:ClientId}",
        "arn:aws:iot:region:account:topic/acorn-pups/logs/${iot:ClientId}"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["iot:Subscribe", "iot:Receive"],
      "Resource": [
        "arn:aws:iot:region:account:topic/acorn-pups/settings/${iot:ClientId}",
        "arn:aws:iot:region:account:topic/acorn-pups/commands/${iot:ClientId}",
        "arn:aws:iot:region:account:topic/acorn-pups/status-request/${iot:ClientId}",
        "arn:aws:iot:region:account:topic/acorn-pups/firmware/${iot:ClientId}"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["iot:UpdateThingShadow", "iot:GetThingShadow"],
      "Resource": "arn:aws:iot:region:account:thing/${iot:ClientId}",
      "Condition": {
        "StringEquals": {
          "iot:Connection.Thing.IsAttached": "true"
        }
      }
    }
  ]
}
```

---

## ESP32 Implementation Details

### Device Operating States

- **Setup Mode**: Bluetooth enabled for initial configuration
- **Normal Operation**: WiFi + MQTT active, Bluetooth disabled, RF listening
- **Reset Mode**: Generate new instance ID, wipe data, enter BLE setup

### RF Reception Features

- **Multi-Button Support**: Automatically recognizes multiple RF buttons
- **Signal Processing**: Validates RF signal integrity and extracts button data
- **Battery Monitoring**: Tracks battery levels reported by RF buttons
- **Signal Strength**: Monitors RF signal quality for diagnostics

### Power Management Features

- **Always-On RF Receiver**: Continuous listening for RF signals
- **MQTT Keep-Alive**: Maintains cloud connection for instant notifications
- **Local Processing**: Immediate ringer activation independent of cloud
- **LED Status Indicators**: Visual feedback for device state

### Volume Control Implementation

- **Physical Buttons**: Hardware volume up/down buttons on receiver
- **Firmware Settings Struct**: Local settings struct maintains current volume level
- **Immediate Response**: Volume changes applied locally before cloud sync
- **Settings Persistence**: Volume level persisted to NVS and synced to DynamoDB
- **Cloud Synchronization**: Volume changes published to MQTT for database updates

### Logging Framework Implementation

- **Logger Class**: Memory-optimized Logger class with component-based logging (RF, MQTT, WIFI, BUTTON)
- **Log Levels**: Compile-time log level control (LOG_LEVEL_INFO for production)
- **Circular Buffer**: 8KB circular buffer for offline log storage and network interruption handling
- **Structured JSON Format**: Logs formatted as structured JSON with timestamp, level, component, message, and optional context
- **Message Size Limits**: 256-byte maximum log message size for memory optimization
- **Local Filtering**: Log level filtering before transmission to reduce bandwidth usage
- **Batch Processing**: Non-critical logs batched and optionally compressed before MQTT transmission
- **Critical Error Storage**: Local flash storage for critical errors only (ERROR/FATAL levels)
- **MQTT Publishing**: Logs published to `acorn-pups/logs/{clientId}` with structured payload
- **Memory Impact Testing**: Continuous monitoring of memory usage impact from logging operations

### Certificate Storage on Device

- **Device Certificate**: AWS IoT Core generated X.509 certificate (PEM format)
- **Private Key**: Device-specific RSA private key (PEM format)
- **Root CA**: Amazon Root CA 1 certificate for TLS validation
- **Secure Storage**: Certificates stored in ESP32 secure flash partition

### NVS Storage Management

#### Current NVS Namespaces

- **WiFi Configuration** (`wifi_config`): Wiped during factory reset

  - WiFi SSID and password
  - Authentication token from BLE provisioning
  - Device name and user timezone
  - Timestamp of configuration

- **MQTT Certificates** (`mqtt_certs`): Wiped during factory reset

  - AWS IoT device certificate (X.509 PEM)
  - Device private key (RSA PEM)
  - AWS IoT endpoint URL
  - Certificate metadata

- **Device Settings** (`device_settings`): Wiped during factory reset

  - Sound enabled/disabled
  - Sound volume level
  - LED brightness
  - Notification cooldown period
  - Quiet hours configuration

- **Registration State** (`reg_state`): Wiped during factory reset

  - Device registration metadata
  - Owner ID and device ID mapping
  - Registration timestamp

- **Factory Calibration** (`factory_cal`): Persistent across resets
  - Hardware calibration data
  - RF sensitivity offset
  - Audio gain multiplier

#### New Reset State Storage

- **Reset Metadata** (`reset_state`): Survives factory reset
  - `device_instance_id`: UUID generated each reset
  - `device_state`: "factory_reset" or "normal"
  - `reset_timestamp`: When reset occurred

## RF Button Implementation Details

### Button Hardware

- **RF Transmitter**: 315MHz or 433MHz transmitter module
- **Microcontroller**: Simple MCU for button detection and RF transmission
- **Battery**: CR2032 or similar coin cell battery
- **Enclosure**: Waterproof, pet-safe design

### Button Features

- **Unique ID**: Factory-programmed unique identifier per button
- **Low Power**: Optimized for long battery life (6-12 months)
- **Instant Response**: Immediate RF transmission on button press
- **Battery Reporting**: Periodic battery level transmission
- **Status LED**: Visual confirmation of button press

### Factory Reset Implementation

```cpp
void factoryReset() {
    // 1. Generate new instance ID
    char newInstanceId[37];
    generateUUID(newInstanceId);

    // 2. Store reset state (survives wipe)
    nvs_handle_t resetHandle;
    nvs_open("reset_state", NVS_READWRITE, &resetHandle);
    nvs_set_str(resetHandle, "device_instance_id", newInstanceId);
    nvs_set_str(resetHandle, "device_state", "factory_reset");
    nvs_set_i64(resetHandle, "reset_timestamp", time(NULL));
    nvs_commit(resetHandle);
    nvs_close(resetHandle);

    // 3. Wipe main device data
    nvs_erase_namespace("wifi_config");
    nvs_erase_namespace("mqtt_certs");
    nvs_erase_namespace("device_settings");
    nvs_erase_namespace("reg_state");

    // 4. Enter BLE setup mode
    startBLEProvisioning();
}
```

### Registration with Reset Proof

```cpp
void registerDevice() {
    // Read reset state
    nvs_handle_t resetHandle;
    nvs_open("reset_state", NVS_READONLY, &resetHandle);

    char instanceId[37];
    char deviceState[20] = "normal";
    int64_t resetTimestamp = 0;

    nvs_get_str(resetHandle, "device_instance_id", instanceId, sizeof(instanceId));
    nvs_get_str(resetHandle, "device_state", deviceState, sizeof(deviceState));
    nvs_get_i64(resetHandle, "reset_timestamp", &resetTimestamp);
    nvs_close(resetHandle);

    // Call registration API with reset proof
    StaticJsonDocument<512> payload;
    payload["serialNumber"] = DEVICE_SERIAL;
    payload["deviceInstanceId"] = instanceId;
    payload["deviceState"] = deviceState;
    payload["resetTimestamp"] = resetTimestamp;
    payload["deviceName"] = received_device_name;

    // Make HTTP call to registerDevice Lambda
    int statusCode = callRegistrationAPI(payload);

    if (statusCode == 200) {
        // Clear reset state after successful registration
        nvs_erase_namespace("reset_state");

        // Set device state back to normal
        nvs_handle_t resetHandle;
        nvs_open("reset_state", NVS_READWRITE, &resetHandle);
        nvs_set_str(resetHandle, "device_state", "normal");
        nvs_commit(resetHandle);
        nvs_close(resetHandle);
    }
}
```

---

## Key Architectural Changes

### Push Notification Implementation

- **Multi-Device Support**: Each user can receive notifications on all their registered devices
- **Minimal Proactive Strategy**: Token updates only on app launch when changes detected
- **Reactive Cleanup**: Invalid tokens automatically cleaned up based on delivery failures
- **Device Fingerprinting**: Stable device identification across token changes
- **Expo Integration**: Leverages Expo Push Service for cross-platform delivery

### Removed MQTT Reset Complexity

- **No More MQTT Reset Topics**: Eliminated `acorn-pups/reset/{deviceId}` topic
- **No More Reset Lambda**: Removed dedicated reset cleanup Lambda function
- **No More Deferred Reset Logic**: No offline reset message queuing
- **Simplified Topic Structure**: Only normal operation topics remain

### Added Instance ID Tracking

- **Device Instance ID**: UUID generated each factory reset cycle
- **Database Schema**: Added `device_instance_id` field to Devices table
- **Reset Timestamp**: Track when last reset occurred

### Enhanced Registration Logic

- **Reset Detection**: Compare device instance IDs to detect resets
- **Ownership Transfer**: Automatic cleanup when reset is proven
- **Security Validation**: Reject registration without valid reset proof
- **Single Cleanup Path**: All reset handling via HTTP registration API

### Benefits of New Architecture

1. **Eliminates Registration Conflicts**: Devices can always re-register after reset
2. **Prevents Remote Takeover**: Requires physical access to reset
3. **Simplifies Operations**: Single HTTP-based cleanup mechanism
4. **Follows Industry Standards**: Same pattern as Echo, Nest, and enterprise IoT

