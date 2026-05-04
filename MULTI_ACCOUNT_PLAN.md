# Multi-Account Aggregation Hub Architecture Plan

This document outlines the roadmap for transforming the IoT Archival Dashboard from a single-account viewer into a multi-account aggregation hub. This will allow the pooling of resources from multiple free-tier Adafruit IO accounts, effectively bypassing the 10-feed limit per account and enabling cross-account edge automations.

## Implementation Steps

### Phase 1: Data Modeling & Migration
- [ ] **Update Database Schema**: Create an `AioAccount` model in `schema.prisma` and add an `accountId` relation to the `FeedConfig` model.
- [ ] **Data Migration Script**: Create a startup/instrumentation script to gracefully migrate existing single-account credentials from `SystemConfig` to the new `AioAccount` table, ensuring no disruption for current users.

### Phase 2: Core Library & Backend Refactoring
- [ ] **Refactor Adafruit Library (`lib/adafruit.ts`)**: Update all API calls to accept and utilize specific account credentials (username/key) instead of relying on a global configuration.
- [ ] **Implement AioAccount Management API**: Create CRUD routes (`/api/accounts`) for adding, editing, and deleting Adafruit IO accounts securely.
- [ ] **Update Feed Sync Logic (`/api/feeds`)**: Modify the synchronization endpoint to iterate through all configured accounts, fetch their respective feeds, and aggregate them into a single unified archival list.

### Phase 3: The Multi-Broker MQTT Engine
- [ ] **Implement Multi-Broker MQTT Manager (`lib/mqtt.ts`)**: Refactor the single MQTT client into a connection manager. On boot (and dynamically when accounts are added/removed), spin up concurrent, isolated MQTT clients for each registered account. Route all incoming data from all brokers into the unified Redis stream.

### Phase 4: Automation & Execution Validation
- [ ] **Ensure Automation Matrix Compatibility**: Verify that the action execution engine (publishing data via REST or MQTT) correctly identifies the account ownership of the target feed and uses the corresponding credentials before sending the payload.

### Phase 5: UI/UX Adaptations
- [ ] **Update Settings UI**: Replace the single credential input block in the System Configuration page with a comprehensive multi-account management interface (list view, add modal, remove confirmation).
- [ ] **Enhance Feed Dropdowns**: Format all feed selection lists (in widgets and automations) to clearly display the origin account (e.g., `[Account A] living-room-temp`).
- [ ] **Update Widget Creation UI**: Add an account selection dropdown when a user chooses to provision a *new* manual feed, ensuring it gets created in the correct Adafruit IO account.

---
*Generated: May 4, 2026*