# Server Backup Bot

Daily backup tool for game server world files. Copies listed files to timestamped backup directories, maintains manifests, and logs all operations.

## Files

- **server_backup.sh** - Main backup script. Copies files, creates manifests, and logs operations.
- **prune_backups.sh** - Weekly archive/prune script. Archives old backup directories and optionally deletes originals.
- **.env** - Configuration. Set `BACKUP_ROOT`, `ARCHIVE_DIR`, `LOG_DIR`, `ERROR_DIR`, `PRUNE_WINDOW_DAYS`, and `PRUNE_WINDOW_END_DAYS_AGO`.
- **server_backup.files** - List of absolute file paths to back up (one per line). Lines starting with `#` are ignored.

## Configuration

Edit `.env`:
```
BACKUP_ROOT=/path/to/backups          # Where to save timestamped backup directories
ARCHIVE_DIR=/path/to/backups/archived # Where prune archives (.tar.gz) are written
LOG_DIR=/path/to/logs                 # Where to save run logs
ERROR_DIR=/path/to/errors             # Where to save error files for failed copies
PRUNE_WINDOW_DAYS=7                   # Width of the archive window in days
PRUNE_WINDOW_END_DAYS_AGO=7          # Newer edge of the archive window (0 = now)
```

Edit `server_backup.files`:
```
# Comment lines are ignored

/path/to/file1.db
/path/to/file2.fwl
```

## Usage

Run manually:
```bash
./server_backup.sh
```

Skip backup phase (dry run):
```bash
./server_backup.sh --skip-backup
```

Skip pruning (not yet implemented):
```bash
./server_backup.sh --skip-pruning
```

Run prune/archive manually:
```bash
./prune_backups.sh
```

Test prune without deleting originals:
```bash
./prune_backups.sh --no-delete
```

## Cron

Run daily at 4am Mountain Time (11:00 UTC):
```bash
0 11 * * * /home/acobb/friends_gaming/friendly-neighborhood-valheim-server/server_monitor/backup_bot/server_backup.sh > /dev/null 2>&1
```

Run weekly prune/archive on Mondays at 12:00 UTC:
```bash
0 12 * * 1 /home/acobb/friends_gaming/friendly-neighborhood-valheim-server/server_monitor/backup_bot/prune_backups.sh > /dev/null 2>&1
```

All output is captured in `LOG_DIR`. Silence cron noise by redirecting to `/dev/null` as shown above.

## Output

**Backup directories** (`$BACKUP_ROOT/game_servers_backup_YYYY_MM_DD_HH/`):
- `manifest.yaml` - YAML file listing all files backed up, their status, and overall run status
- Copied files (same names as originals)

**Log files** (`$LOG_DIR/server_backup_YYYY_MM_DD_HH.log`):
- Timestamped log of all backup operations

**Log files** (`$LOG_DIR/prune_backups_YYYY_MM_DD_HH.log`):
- Timestamped log of all prune/archive operations, including window bounds, selected backup, and deletions

**Archive files** (`$ARCHIVE_DIR/game_servers_backup_YYYY_MM_DD_HH.tar.gz`):
- Compressed archive of the newest backup in the prune window
- Created by `prune_backups.sh` before raw directories are deleted

**Error files** (`$ERROR_DIR/YYYY_MM_DD_HH_filename.json`):
- JSON files created only on failures (missing files, copy errors)
- Include timestamp, source, message, and `cleared` flag for tracking

## Restoring an Archive

List contents without extracting:
```bash
tar -tzf /path/to/archived/game_servers_backup_YYYY_MM_DD_HH.tar.gz
```

Extract to a directory:
```bash
tar -xzf /path/to/archived/game_servers_backup_YYYY_MM_DD_HH.tar.gz -C /path/to/restore/
```

This restores the full backup directory including `manifest.yaml` and all copied files.

## How It Works

1. Creates temp directory
2. Copies each file from `server_backup.files` into temp directory
3. Writes `manifest.yaml` with file-by-file status
4. Moves temp directory to final timestamped location
5. Logs all operations
6. Writes error files for any failures (script continues on partial failures)

## Notes

- Script uses UTC timestamps in `YYYY_MM_DD_HH` format
- Overwrites backups from the same hour (one backup per hour maximum)
- Continues processing if individual files fail (doesn't choke)
- Backup script keeps prune as a placeholder; pruning is handled by `prune_backups.sh`
- Prune script only targets directories named `game_servers_backup_YYYY_MM_DD_HH`
- Prune overwrites existing archive files of the same name
- Prune verifies each `.tar.gz` with `tar -tzf` before deleting originals
