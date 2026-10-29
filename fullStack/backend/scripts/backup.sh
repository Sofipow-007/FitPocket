#!/bin/bash
FECHA=$(date +%Y-%m-%d_%H-%M-%S)
CARPETA="backups/backup_$FECHA"
mkdir -p "$CARPETA"

mongodump --uri="$MONGODB_URI" --out="$CARPETA"

echo "Backup guardado en $CARPETA"