# Panduan Deploy - Sistem HR & Sistem Manajemen Gudang

Panduan deployment untuk Ubuntu Server dengan Nginx, PostgreSQL, Node.js, dan SSL Certificate (Certbot).

## Prerequisites

- Ubuntu Server 20.04/22.04 LTS
- Domain yang sudah mengarah ke IP server
- Akses root atau sudo

## 1. Update System & Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git build-essential

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node -v
npm -v
```

## 2. Install & Setup PostgreSQL

### Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start & enable service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Create Database & Users

```bash
# Login sebagai postgres user
sudo -u postgres psql
```

Jalankan SQL berikut di PostgreSQL shell:

```sql
-- Create user untuk Sistem HR
CREATE USER sistem_hr_user WITH PASSWORD 'your_secure_password_hr';

-- Create database untuk Sistem HR
CREATE DATABASE sistem_hr_db OWNER sistem_hr_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE sistem_hr_db TO sistem_hr_user;

-- Create user untuk Sistem Manajemen Gudang
CREATE USER sistem_gudang_user WITH PASSWORD 'your_secure_password_gudang';

-- Create database untuk Sistem Manajemen Gudang
CREATE DATABASE sistem_manajemen_gudang_db OWNER sistem_gudang_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE sistem_manajemen_gudang_db TO sistem_gudang_user;

-- Verify databases
\l

-- Exit
\q
```

### Configure PostgreSQL Authentication (Optional)

```bash
# Edit pg_hba.conf untuk allow password authentication
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Tambahkan atau edit line:
# local   all   all   md5
# host    all   all   127.0.0.1/32   md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

## 3. Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start & enable
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

## 4. Setup Project Directory

```bash
# Create directory structure
sudo mkdir -p /var/www/citraborneo-test/sistem-hr/frontend
sudo mkdir -p /var/www/citraborneo-test/sistem-hr/backend
sudo mkdir -p /var/www/citraborneo-test/sistem-manajemen-gudang/frontend
sudo mkdir -p /var/www/citraborneo-test/sistem-manajemen-gudang/backend

# Set ownership
sudo chown -R $USER:$USER /var/www/citraborneo-test

# Set permissions
sudo chmod -R 755 /var/www/citraborneo-test
```

## 5. Deploy Backend

### Clone atau Upload Project

```bash
# Option 1: Clone dari Git
cd /var/www/citraborneo-test
git clone <your-repo-url> .

# Option 2: Upload via SCP dari local
scp -r ./sistem-hr user@your-server:/var/www/citraborneo-test/
scp -r ./sistem-manajemen-gudang user@your-server:/var/www/citraborneo-test/
```

### Setup Sistem HR Backend

```bash
cd /var/www/citraborneo-test/sistem-hr/backend

# Install dependencies
npm install --production

# Create .env file
cat > .env << 'EOF'
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sistem_hr_db
DB_USER=sistem_hr_user
DB_PASSWORD=your_secure_password_hr
PORT=3001
JWT_SECRET=your_very_long_and_secure_jwt_secret_key_here
NODE_ENV=production
EOF

# Run migration
npm run migrate

# Run seeder (optional, untuk data awal)
npm run seed
```

### Setup Sistem Manajemen Gudang Backend

```bash
cd /var/www/citraborneo-test/sistem-manajemen-gudang/backend

# Install dependencies
npm install --production

# Create .env file
cat > .env << 'EOF'
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sistem_manajemen_gudang_db
DB_USER=sistem_gudang_user
DB_PASSWORD=your_secure_password_gudang
PORT=3000
NODE_ENV=production
EOF

# Run migration
npm run migrate

# Run seeder (optional)
npm run seed
```

## 6. Build Frontend

### Build Sistem HR Frontend

```bash
cd /var/www/citraborneo-test/sistem-hr/frontend

# Install dependencies
npm install

# Create .env for production
cat > .env.production << 'EOF'
VITE_API_URL=https://hr.yourdomain.com/api
EOF

# Build
npm run build

# Copy dist to nginx serve directory
cp -r dist/* /var/www/citraborneo-test/sistem-hr/frontend/
```

### Build Sistem Manajemen Gudang Frontend

```bash
cd /var/www/citraborneo-test/sistem-manajemen-gudang/frontend

# Install dependencies
npm install

# Create .env for production
cat > .env.production << 'EOF'
VITE_API_URL=https://gudang.yourdomain.com/api
EOF

# Build
npm run build

# Copy dist to nginx serve directory
cp -r dist/* /var/www/citraborneo-test/sistem-manajemen-gudang/frontend/
```

## 7. Create Systemd Services

### Sistem HR Backend Service

```bash
sudo cat > /etc/systemd/system/sistem-hr-backend.service << 'EOF'
[Unit]
Description=Sistem HR Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/citraborneo-test/sistem-hr/backend
ExecStart=/usr/bin/node index.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=sistem-hr-backend
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
```

### Sistem Manajemen Gudang Backend Service

```bash
sudo cat > /etc/systemd/system/sistem-gudang-backend.service << 'EOF'
[Unit]
Description=Sistem Manajemen Gudang Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/citraborneo-test/sistem-manajemen-gudang/backend
ExecStart=/usr/bin/node index.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=sistem-gudang-backend
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
```

### Enable & Start Services

```bash
# Set correct ownership for www-data
sudo chown -R www-data:www-data /var/www/citraborneo-test

# Reload systemd
sudo systemctl daemon-reload

# Enable services
sudo systemctl enable sistem-hr-backend
sudo systemctl enable sistem-gudang-backend

# Start services
sudo systemctl start sistem-hr-backend
sudo systemctl start sistem-gudang-backend

# Check status
sudo systemctl status sistem-hr-backend
sudo systemctl status sistem-gudang-backend
```

### Service Management Commands

```bash
# Start service
sudo systemctl start sistem-hr-backend
sudo systemctl start sistem-gudang-backend

# Stop service
sudo systemctl stop sistem-hr-backend
sudo systemctl stop sistem-gudang-backend

# Restart service
sudo systemctl restart sistem-hr-backend
sudo systemctl restart sistem-gudang-backend

# View logs
sudo journalctl -u sistem-hr-backend -f
sudo journalctl -u sistem-gudang-backend -f
```

## 8. Configure Nginx

### Sistem HR Nginx Config

```bash
sudo cat > /etc/nginx/sites-available/sistem-hr << 'EOF'
server {
    listen 80;
    server_name hr.yourdomain.com;

    # Frontend
    root /var/www/citraborneo-test/sistem-hr/frontend;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Frontend routing (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
```

### Sistem Manajemen Gudang Nginx Config

```bash
sudo cat > /etc/nginx/sites-available/sistem-gudang << 'EOF'
server {
    listen 80;
    server_name gudang.yourdomain.com;

    # Frontend
    root /var/www/citraborneo-test/sistem-manajemen-gudang/frontend;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Frontend routing (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
```

### Enable Sites

```bash
# Create symlinks
sudo ln -s /etc/nginx/sites-available/sistem-hr /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/sistem-gudang /etc/nginx/sites-enabled/

# Test Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## 9. Install SSL Certificate (Certbot)

### Install Certbot

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx
```

### Generate SSL Certificates

```bash
# Generate certificate untuk Sistem HR
sudo certbot --nginx -d hr.yourdomain.com

# Generate certificate untuk Sistem Gudang
sudo certbot --nginx -d gudang.yourdomain.com

# Atau generate sekaligus
sudo certbot --nginx -d hr.yourdomain.com -d gudang.yourdomain.com
```

### Auto-Renewal

```bash
# Test auto-renewal
sudo certbot renew --dry-run

# Certbot sudah otomatis setup cron/timer untuk renewal
sudo systemctl status certbot.timer
```

## 10. Firewall Configuration

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## 11. Final Directory Structure

```
/var/www/citraborneo-test/
├── sistem-hr/
│   ├── frontend/
│   │   ├── index.html
│   │   └── assets/
│   └── backend/
│       ├── node_modules/
│       ├── routes/
│       ├── middleware/
│       ├── db/
│       ├── .env
│       ├── index.js
│       └── package.json
└── sistem-manajemen-gudang/
    ├── frontend/
    │   ├── index.html
    │   └── assets/
    └── backend/
        ├── node_modules/
        ├── routes/
        ├── db/
        ├── .env
        ├── index.js
        └── package.json
```

## 12. Troubleshooting

### Check Service Logs

```bash
# Backend logs
sudo journalctl -u sistem-hr-backend -n 50 --no-pager
sudo journalctl -u sistem-gudang-backend -n 50 --no-pager

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Check Port Usage

```bash
# Check if ports are in use
sudo netstat -tlnp | grep -E '3000|3001'
sudo ss -tlnp | grep -E '3000|3001'
```

### Database Connection Test

```bash
# Test PostgreSQL connection
psql -h localhost -U sistem_hr_user -d sistem_hr_db -c "SELECT 1"
psql -h localhost -U sistem_gudang_user -d sistem_manajemen_gudang_db -c "SELECT 1"
```

### Restart All Services

```bash
# Restart script
sudo systemctl restart postgresql
sudo systemctl restart sistem-hr-backend
sudo systemctl restart sistem-gudang-backend
sudo systemctl restart nginx
```

## 13. Backup Database

### Create Backup Script

```bash
sudo cat > /usr/local/bin/backup-databases.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup Sistem HR
pg_dump -h localhost -U sistem_hr_user sistem_hr_db > $BACKUP_DIR/sistem_hr_db_$DATE.sql

# Backup Sistem Gudang
pg_dump -h localhost -U sistem_gudang_user sistem_manajemen_gudang_db > $BACKUP_DIR/sistem_gudang_db_$DATE.sql

# Delete backups older than 7 days
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

sudo chmod +x /usr/local/bin/backup-databases.sh
```

### Setup Cron for Daily Backup

```bash
# Edit crontab
sudo crontab -e

# Add line (backup daily at 2 AM)
0 2 * * * /usr/local/bin/backup-databases.sh >> /var/log/db-backup.log 2>&1
```

## Quick Reference

| Service | Port | Domain |
|---------|------|--------|
| Sistem HR Frontend | 80/443 | hr.yourdomain.com |
| Sistem HR Backend | 3001 | hr.yourdomain.com/api |
| Sistem Gudang Frontend | 80/443 | gudang.yourdomain.com |
| Sistem Gudang Backend | 3000 | gudang.yourdomain.com/api |
| PostgreSQL | 5432 | localhost |

| Database | User | Database Name |
|----------|------|---------------|
| Sistem HR | sistem_hr_user | sistem_hr_db |
| Sistem Gudang | sistem_gudang_user | sistem_manajemen_gudang_db |
