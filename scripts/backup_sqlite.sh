#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$(realpath "${BASH_SOURCE[0]}")")/.." && pwd)"
DB="$ROOT_DIR/data/mio.sqlite"
OUT_DIR="$ROOT_DIR/data/backup"
TS="$(date +%F_%H%M%S)"
OUT="$OUT_DIR/mio_$TS.sqlite"

mkdir -p "$OUT_DIR"
sqlite3 "$DB" ".backup '$OUT'"
gzip -9 "$OUT"
# 保存两周左右的数据
ls -1t "$OUT_DIR"/mio_*.sqlite.gz 2>/dev/null | tail -n +15 | xargs -r rm -f
echo "OK: $OUT.gz"
