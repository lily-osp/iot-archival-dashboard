# IoT Archival Dashboard

A Swiss Archival-styled IoT dashboard connected to Adafruit IO, featuring real-time updates and historical data tracking.

## 🚀 Quick Start with Docker

1.  **Clone the repository** (if you haven't already).
2.  **Configure environment variables**:
    Create a `.env` file in the root directory:
    ```env
    ADAFRUIT_IO_USERNAME=your_username
    ADAFRUIT_IO_KEY=your_key
    ```
3.  **Run with Docker Compose**:
    ```bash
    docker-compose up --build
    ```
4.  **Access the dashboard**: Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠 Features

- **Swiss Archival Design**: Warm cream palette, blueprint grids, and tactile noise grain.
- **Auto-Discovery**: Automatically fetches all feeds from your Adafruit IO account.
- **Real-time Streaming**: Uses MQTT and Redis Pub/Sub to push updates via Server-Sent Events (SSE).
- **Persistent Storage**: Saves configurations in a local SQLite database.

## 📦 Tech Stack

- **Frontend**: Next.js 15, Tailwind CSS, Lucide React
- **Backend**: Next.js API Routes, MQTT.js, ioredis
- **Database**: SQLite with Prisma ORM
- **Cache**: Redis
- **Style**: Swiss Archival Design Language
