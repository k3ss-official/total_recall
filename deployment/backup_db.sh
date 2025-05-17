#!/bin/bash
# backup_db.sh

# Configuration
BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

# Ensure backup directory exists
mkdir -p $BACKUP_DIR

# Perform backup
echo "Starting database backup..."
docker-compose exec -T db pg_dump -U postgres totalrecall > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -name "db_backup_*.sql.gz" -type f -mtime +7 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
