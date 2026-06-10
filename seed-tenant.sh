#!/bin/bash
# Seed script to migrate existing user to tenant-based system
# Run this after Docker build to set up the existing user as tenant admin

set -e

DB="${1:-/home/ubuntu/projects/iot-archival-dashboard/data/dev.db}"

echo "Seeding database at $DB..."

# Create Tenant table
sqlite3 "$DB" "CREATE TABLE IF NOT EXISTS Tenant (id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP);"

# Create EmailVerificationToken table
sqlite3 "$DB" "CREATE TABLE IF NOT EXISTS EmailVerificationToken (id TEXT PRIMARY KEY, token TEXT NOT NULL UNIQUE, type TEXT NOT NULL, expiresAt DATETIME NOT NULL, used INTEGER DEFAULT 0, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, userId TEXT NOT NULL, FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE);"

# Add new columns to User table (ignore errors if already exist)
sqlite3 "$DB" "ALTER TABLE User ADD COLUMN email TEXT;" 2>/dev/null || true
sqlite3 "$DB" "ALTER TABLE User ADD COLUMN emailVerified INTEGER DEFAULT 0;" 2>/dev/null || true
sqlite3 "$DB" "ALTER TABLE User ADD COLUMN tenantId TEXT;" 2>/dev/null || true

# Create default tenant
TENANT_ID=$(sqlite3 "$DB" "SELECT 'c' || hex(randomblob(12));")
sqlite3 "$DB" "INSERT OR IGNORE INTO Tenant (id, name, slug, createdAt) VALUES ('$TENANT_ID', 'Default Organization', 'default-org', datetime('now'));"

# Update existing user to be admin of the tenant with verified email
sqlite3 "$DB" "UPDATE User SET role = 'admin', email = 'azzar.mr.zs@gmail.com', emailVerified = 1, tenantId = (SELECT id FROM Tenant WHERE slug = 'default-org') WHERE username = 'azzar';"

# Create index
sqlite3 "$DB" "CREATE INDEX IF NOT EXISTS idx_verification_token ON EmailVerificationToken(token);"

echo "Seed completed successfully!"
echo ""
echo "User credentials:"
echo "  Username: azzar"
echo "  Password: admin123"
echo "  Email:    azzar.mr.zs@gmail.com"
echo "  Role:     admin"
echo "  Tenant:   Default Organization"
echo ""
sqlite3 "$DB" "SELECT u.username, u.email, u.role, u.emailVerified, t.name as tenant FROM User u LEFT JOIN Tenant t ON u.tenantId = t.id;"
