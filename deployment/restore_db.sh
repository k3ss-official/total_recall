#!/bin/bash
# restore_db.sh

# Check if backup file is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <backup_file>"
  exit 1
fi

BACKUP_FILE=$1

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Extract backup if compressed
if [[ "$BACKUP_FILE" == *.gz ]]; then
  echo "Extracting backup file..."
  gunzip -c "$BACKUP_FILE" > "${BACKUP_FILE%.gz}"
  BACKUP_FILE="${BACKUP_FILE%.gz}"
fi

# Restore database
echo "Restoring database from $BACKUP_FILE..."
docker-compose exec -T db psql -U postgres -d totalrecall < $BACKUP_FILE

echo "Database restore completed."
