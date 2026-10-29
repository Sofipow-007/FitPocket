#!/bin/bash
if [ -z "$1" ]; then
    echo "Uso: ./restore.sh backups/backup_FECHA"
    exit 1
fi

mongorestore --uri="$MONGODB_URI" --drop "$1"

echo "Restore completado desde $1"