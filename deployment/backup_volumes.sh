#!/bin/bash
# backup_volumes.sh

# Configuration
BACKUP_DIR="/backups/volumes"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/volumes_backup_$TIMESTAMP.tar.gz"

# Ensure backup directory exists
mkdir -p $BACKUP_DIR

# Stop containers
echo "Stopping containers..."
docker-compose stop

# Backup volumes
echo "Backing up volumes..."
docker run --rm \
  -v $(docker volume ls -q | grep total_recall):/volumes \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/volumes_backup_$TIMESTAMP.tar.gz /volumes

# Restart containers
echo "Restarting containers..."
docker-compose start

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -name "volumes_backup_*.tar.gz" -type f -mtime +7 -delete

echo "Volume backup completed: $BACKUP_FILE"
