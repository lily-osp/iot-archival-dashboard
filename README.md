# IoT Archival Dashboard

![Feed Dashboard](images/feed_dashboard.png)

A Swiss Archival-styled IoT dashboard designed as an elegant, robust, and highly functional interface for Adafruit IO. It features real-time updates, historical data tracking, and a powerful local automation engine.

![Automation Logic Matrix](images/automation.png)

## Overview

The IoT Archival Dashboard treats raw hardware data as curated museum artifacts. Every sensor reading, toggle state, and text log is referred to as a **Specimen**. By adopting a strict visual hierarchy—separating narrative content (Plus Jakarta Sans) from technical metadata (JetBrains Mono)—the system ensures that data is both beautiful to observe and rigorous to manage.

## Features

- **Swiss Archival Design**: Warm cream palette, blueprint grids, tactile noise grain, and minimalist glassmorphism elements.
- **Auto-Discovery**: Automatically fetches all active feeds from your Adafruit IO account.
- **Data Point Retention**: Automatically archives incoming specimen data locally in SQLite, retaining up to 7 days (configurable). Guarantees chart continuity and historical tracking natively for both Adafruit feeds and Virtual (Open) Data Feeds.
- **Zero-Touch Provisioning**: Create new feeds directly from the dashboard without needing to access the Adafruit IO console.
- **Real-time Streaming**: Utilizes MQTT and Redis Pub/Sub to push instant updates via Server-Sent Events (SSE).
- **Advanced Logic Matrix (Automations)**:
  - Supports 1-to-1, 1-to-many, and many-to-many logic pipelines.
  - Multi-condition trigger support (`MATCH ALL` / `MATCH ANY`).
  - Mathematical and string evaluations (`>`, `<`, `==`, `!=`, `>=`, `<=`) running locally for ultra-low latency.
  - **IF/ELSE IF Logic Branches**: Consolidate complex logic into a single rule. Run primary actions when conditions are met, and "Else Actions" when alternate conditions are met (e.g. Turn lights ON if lux < 100, ELSE IF time is > 8 PM turn them OFF). Each block supports independent `MATCH ALL` / `MATCH ANY` evaluation.
  - Sequential action execution with configurable delays between steps.
    - **Manual Override (Force Run)**: Instantly execute any automation rule's action chain directly from the dashboard UI for rapid testing.
    - **Webhook Dispatch**: Trigger external APIs via POST with payload interpolation using `{{feedKey}}`.
    - **Inter-Automation Wiring**: Chain automations together by allowing one automation to trigger another, creating complex multi-stage logic pipelines.
  - **Cross-Account Automations**: Trigger rules on an event from one Adafruit IO account, evaluate conditions against feeds from another, and publish actions to a third.
- **Virtual Feeds (Open Data Integration)**:
  - Poll unauthenticated, external APIs (e.g. weather, crypto, transit) natively via BullMQ workers.
  - Extracted values (via JSONPath) are cached in Redis and treated identically to Adafruit IO hardware feeds.
  - Create dashboards and trigger automations solely from Open Data without needing cloud storage, or optionally route them to an Adafruit IO feed.
  - **Bundled Examples Included via Seed:**
    - `Lamongan Temperature`: Localized weather data via Open-Meteo.
    - `Current Time (Jakarta)`: Real-time timezone synchronization via timeapi.io.
    - `Bitcoin USD Price`: Live cryptocurrency ticker via CoinGecko.
    - `Ethereum USD Price`: Live cryptocurrency ticker via CoinGecko.
    - `ISS Current Latitude`: Space station tracking via Open-Notify.
    - `Latest Earthquake Magnitude`: Tracking recent global earthquake magnitudes via USGS.
    - `Random Programming Joke`: Random tech jokes fetched hourly via JokeAPI.
- **Multi-Account Aggregation Hub**:
  - Connect and manage multiple Adafruit IO accounts simultaneously.
  - Bypass free-tier feed limits by aggregating feeds from several accounts into one unified dashboard.
  - The Multi-Broker MQTT engine seamlessly maintains concurrent real-time connections to all provisioned accounts.
- **Security-First Approach**:
  - JWT-based authentication layer.
  - Local isolation ensures your Adafruit IO key never leaves the secure server environment.
  - SQLite with Prisma ORM for persistent local storage.

## Widget Types (Specimens)

- **MONITOR (READ)**: High-visibility numerical readouts for sensors.
- **CHART (HISTORY)**: Historical visualizations of numeric data streams.
- **TEXT_LOG (READ)**: Universal string data display for logs and statuses.
- **INDICATOR (STATUS)**: Boolean state visualizer.
- **SWITCH (TOGGLE)**: Boolean control gate (ON/OFF).
- **BUTTON (TRIGGER)**: Momentary pulse trigger (sends '1', auto-resets to '0').
- **SLIDER (RANGE)**: Analog control surface with custom low/high thresholds.
- **COLOR_PICKER (COLOR)**: Hexadecimal color selection gate (e.g. `#FF0000`).
- **DATA_DUMP (WRITE)**: Unlimited capacity buffer for manual configuration payload transmission.

## Quick Start with Docker

### Prerequisites
- Docker & Docker Compose
- Adafruit IO Account

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/iot-archival-dashboard.git
   cd iot-archival-dashboard
   ```

2. **Configure Environment Variables**:
   Copy the example environment file and fill in your Cloudflare Tunnel Token (if using the tunnel):
   ```bash
   cp .env.example .env
   ```

3. **Run with Docker Compose**:
   ```bash
   docker compose up -d --build
   ```

4. **Access the dashboard**: Open [http://localhost:3010](http://localhost:3010) in your browser. Register an initial admin account on the login screen to access the archive.

5. **Configure Credentials**: Navigate to **System Configuration** within the dashboard to set your Adafruit IO Username and Key securely.

## How-To Guide (Quick Procedures)

### Adding a New Dashboard
1. Navigate to the root page (Home).
2. Click `NEW_ARCHIVE_SECTOR`.
3. Provide a name for your dashboard and commit the record.
4. Click on the newly created dashboard block to enter it.

### Placing a Widget (Specimen)
1. Open your desired Dashboard.
2. Click `NEW_SPECIMEN` in the header.
3. Select the Widget Type (e.g. `MONITOR` or `SWITCH`).
4. Choose an existing feed from the dropdown, or select `CREATE_NEW_FEED` to Auto-Provision a new one.
5. Click `COMMIT_RECORD` to place the widget on your dashboard grid.

### Creating an Automation Rule
1. Navigate to `SYSTEM_LOGIC_MATRIX` (Automations) from the sidebar.
2. Click `NEW_AUTOMATION`.
3. Under CONDITIONS, select a trigger feed (e.g. `temperature`), an operator (`>`), and a value (`30`).
4. Under ACTIONS, choose `PUBLISH TO FEED`, select your target feed (e.g. `fan_relay`), and set the payload to `1`.
5. Optionally add `ELSE CONDITIONS` and `ELSE ACTIONS` (e.g. Set `fan_relay` to `0` if temperature drops below 30) to automate both states natively.
6. Click `COMMIT_RULE_TO_MATRIX`.

### Adding a Virtual Open Data Feed
1. Navigate to `EXTERNAL_DATA_SOURCES` (Open Data) from the sidebar.
2. Click `ADD_DATA_SOURCE`.
3. Input the API endpoint (e.g. `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd`).
4. Input the JSON Path to extract the value (e.g. `bitcoin.usd`).
5. Set the CRON schedule (e.g. `*/5 * * * *` for every 5 minutes).
6. Save the source. The feed will now appear in your widget binding dropdowns prefixed with `open_`.

## Tech Stack

- **Frontend**: Next.js 15, Tailwind CSS v4, Lucide React
- **Backend**: Next.js API Routes, MQTT.js, ioredis
- **Database**: SQLite with Prisma ORM
- **Cache**: Redis (Alpine)
- **Deployment**: Docker, Cloudflared Tunnel

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 Azzar Budiyanto
