# Backup and Recovery Documentation

This document provides detailed information about the backup and recovery procedures for the Total Recall project.

## Backup Procedures

The Total Recall project includes scripts for backing up both the database and volumes.

### Database Backup

The database backup script is located at the root of the project in `backup_db.sh`.

#### Usage

```bash
./backup_db.sh
```

#### What the Script Does

1. Creates a backup directory if it doesn't exist
2. Generates a timestamp for the backup file
3. Performs a PostgreSQL dump of the database
4. Compresses the backup file
5. Cleans up old backups (keeps the last 7 days)

#### Example Output

```
Starting database backup...
Backup completed: /backups/db_backup_20250427_120000.sql.gz
```

#### Customization

You can customize the backup script by modifying the following variables at the top of the script:

```bash
BACKUP_DIR="/backups"  # Directory where backups are stored
```

### Volume Backup

The volume backup script is located at the root of the project in `backup_volumes.sh`.

#### Usage

```bash
./backup_volumes.sh
```

#### What the Script Does

1. Creates a backup directory if it doesn't exist
2. Generates a timestamp for the backup file
3. Stops the containers
4. Backs up all Docker volumes used by the project
5. Restarts the containers
6. Cleans up old backups (keeps the last 7 days)

#### Example Output

```
Stopping containers...
Backing up volumes...
Restarting containers...
Volume backup completed: /backups/volumes/volumes_backup_20250427_120000.tar.gz
```

#### Customization

You can customize the backup script by modifying the following variables at the top of the script:

```bash
BACKUP_DIR="/backups/volumes"  # Directory where backups are stored
```

### Automated Backups

To automate backups, you can set up a cron job to run the backup scripts regularly.

#### Example Cron Configuration

```
# Run database backup daily at 2 AM
0 2 * * * /path/to/total_recall/backup_db.sh

# Run volume backup weekly on Sunday at 3 AM
0 3 * * 0 /path/to/total_recall/backup_volumes.sh
```

To add these cron jobs:

1. Open the crontab editor:
   ```bash
   crontab -e
   ```

2. Add the above lines to the file and save

## Recovery Procedures

The Total Recall project includes a script for restoring the database from a backup.

### Database Restore

The database restore script is located at the root of the project in `restore_db.sh`.

#### Usage

```bash
./restore_db.sh /path/to/backup/file.sql.gz
```

#### What the Script Does

1. Checks if the backup file exists
2. Extracts the backup file if it's compressed
3. Restores the database from the backup file

#### Example Output

```
Extracting backup file...
Restoring database from /backups/db_backup_20250427_120000.sql
Database restore completed.
```

### Volume Restore

To restore volumes from a backup, follow these steps:

1. Stop the containers:
   ```bash
   docker-compose down
   ```

2. Remove the existing volumes (optional, if you want to completely replace them):
   ```bash
   docker volume rm $(docker volume ls -q | grep total_recall)
   ```

3. Create new volumes:
   ```bash
   docker volume create total_recall_data
   docker volume create postgres_data
   ```

4. Extract the backup to the volumes:
   ```bash
   docker run --rm \
     -v total_recall_data:/volumes/total_recall_data \
     -v postgres_data:/volumes/postgres_data \
     -v /path/to/backup/file.tar.gz:/backup.tar.gz \
     alpine sh -c "tar xzf /backup.tar.gz -C /"
   ```

5. Start the containers:
   ```bash
   docker-compose up -d
   ```

## Disaster Recovery

In case of a complete system failure, follow these steps to recover:

1. Set up a new environment with Docker and Docker Compose
2. Clone the Total Recall repository
3. Restore the database from the latest backup
4. Restore the volumes from the latest backup
5. Start the containers

### Example Disaster Recovery Procedure

```bash
# 1. Set up a new environment (install Docker and Docker Compose)

# 2. Clone the repository
git clone https://github.com/username/totalrecall.git
cd totalrecall

# 3. Copy the latest backups to the new environment
# (This step depends on how you store and transfer backups)

# 4. Restore the database
./restore_db.sh /path/to/latest/db_backup.sql.gz

# 5. Restore the volumes
# (Follow the volume restore steps above)

# 6. Start the containers
./deploy_local.sh
```

## Data Migration

If you need to migrate data to a different environment or version of the application, follow these steps:

1. Back up the database and volumes from the source environment
2. Set up the target environment with the new version of the application
3. Restore the database and volumes to the target environment
4. Verify the data migration

### Example Data Migration Procedure

```bash
# On the source environment
./backup_db.sh
./backup_volumes.sh

# Transfer the backups to the target environment

# On the target environment
./restore_db.sh /path/to/db_backup.sql.gz
# (Follow the volume restore steps above)
./deploy_local.sh
```

## Best Practices

1. **Regularly back up your data** using the provided scripts
2. **Store backups in a secure location** separate from the production environment
3. **Test your recovery procedures** regularly to ensure they work
4. **Keep multiple backup generations** to protect against corruption
5. **Document any custom backup or recovery procedures** specific to your deployment
6. **Automate backups** using cron jobs or other scheduling tools
7. **Monitor backup success and failure** to ensure backups are working

## Troubleshooting

### Common Issues

1. **Backup script fails**:
   - Check that the database container is running
   - Ensure the backup directory exists and is writable
   - Verify that there is enough disk space

2. **Restore script fails**:
   - Check that the backup file exists and is readable
   - Ensure the database container is running
   - Verify that the database credentials are correct

3. **Volume restore issues**:
   - Ensure the containers are stopped before restoring volumes
   - Verify that the backup file is not corrupted
   - Check that the volume paths are correct
