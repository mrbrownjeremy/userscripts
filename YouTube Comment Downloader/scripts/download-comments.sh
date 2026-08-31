#!/usr/bin/env bash
# download-comments.sh
# Usage: download-comments.sh <youtube_url> [sort] [limit] [title] [channel] [ts] [vid]
#   sort:    0 = most popular (default), 1 = most recent
#   limit:   max number of comments (omit for all)
#   title:   video title for filename (optional)
#   channel: channel name for filename (optional)
#   ts:      1 = include date in filename (default), 0 = omit
#   vid:     1 = include video ID in filename (default), 0 = omit

set -euo pipefail

VIDEO_URL="${1:-}"
SORT="${2:-0}"
LIMIT="${3:-}"
VIDEO_TITLE="${4:-}"
CHANNEL="${5:-}"
INCLUDE_TS="${6:-1}"
INCLUDE_VID="${7:-1}"

if [[ -z "$VIDEO_URL" ]]; then
  echo "Usage: $0 <youtube_url> [sort] [limit] [title]" >&2
  exit 1
fi

# Broaden PATH for non-interactive shell (AppleScript context misses these)
export PATH="$HOME/Library/Python/3.10/bin:/Library/Frameworks/Python.framework/Versions/3.10/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:$PATH"

# Find python3
PYTHON3=$(command -v python3 2>/dev/null || true)
if [[ -z "$PYTHON3" ]]; then
  echo "python3 not found in PATH: $PATH" >&2
  exit 1
fi

OUTPUT_DIR="$HOME/Downloads"
TIMESTAMP=$(date +%y%m%d)

VIDEO_ID=$(echo "$VIDEO_URL" | sed -n 's/.*[?&]v=\([^&]*\).*/\1/p')
[[ -z "$VIDEO_ID" ]] && VIDEO_ID="unknown"

sanitize() { echo "$1" | tr -cs 'a-zA-Z0-9 ' '_' | sed 's/_*$//;s/^_*//' | cut -c1-"$2" | sed 's/ /_/g'; }

SAFE_CHANNEL=$([[ -n "$CHANNEL" ]] && sanitize "$CHANNEL" 40 || echo "")
SAFE_TITLE=$([[ -n "$VIDEO_TITLE" ]] && sanitize "$VIDEO_TITLE" 60 || echo "")

# Build base name: channel _-_ title, falling back gracefully
if [[ -n "$SAFE_CHANNEL" && -n "$SAFE_TITLE" ]]; then
  BASE="ytc-${SAFE_CHANNEL}_-_${SAFE_TITLE}"
elif [[ -n "$SAFE_TITLE" ]]; then
  BASE="ytc-${SAFE_TITLE}"
elif [[ -n "$SAFE_CHANNEL" ]]; then
  BASE="ytc-${SAFE_CHANNEL}"
else
  BASE="ytc-${VIDEO_ID}"
fi

[[ "$INCLUDE_VID" == "1" ]] && BASE="${BASE}_${VIDEO_ID}"
[[ "$INCLUDE_TS"  == "1" ]] && BASE="${BASE}_${TIMESTAMP}"

JSONL_FILE="$OUTPUT_DIR/${BASE}.jsonl"
CSV_FILE="$OUTPUT_DIR/${BASE}.csv"

# Always clean up JSONL on exit
trap 'rm -f "$JSONL_FILE"' EXIT

echo "Title arg: '$VIDEO_TITLE'"
echo "Downloading comments for: $VIDEO_URL (sort=$SORT, limit=${LIMIT:-all})"

ARGS=(--url "$VIDEO_URL" --output "$JSONL_FILE" --sort "$SORT")
[[ -n "$LIMIT" ]] && ARGS+=(--limit "$LIMIT")

youtube-comment-downloader "${ARGS[@]}"

echo "Converting to CSV..."

"$PYTHON3" -c "
import json, csv, sys, re
from datetime import datetime

def parse_votes(v):
    if not v:
        return v
    s = str(v).strip().upper().replace(',', '')
    m = re.match(r'^([\d.]+)([KM]?)$', s)
    if not m:
        return v
    num = float(m.group(1))
    suffix = m.group(2)
    if suffix == 'K':
        num *= 1_000
    elif suffix == 'M':
        num *= 1_000_000
    return int(num)

rows = [json.loads(l) for l in open(sys.argv[1]) if l.strip()]
if not rows:
    print('No comments found.')
    sys.exit(0)

for row in rows:
    try:
        dt = datetime.fromtimestamp(float(row['time_parsed']))
        row['time'] = dt.strftime('%Y-%m-%d')
    except Exception:
        pass
    row.pop('time_parsed', None)
    if 'votes' in row:
        row['votes'] = parse_votes(row['votes'])

with open(sys.argv[2], 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=rows[0].keys())
    w.writeheader()
    w.writerows(rows)
print(f'Written {len(rows)} comments to {sys.argv[2]}')
" "$JSONL_FILE" "$CSV_FILE"

echo "Done: $CSV_FILE"
osascript -e "display notification \"Saved to ~/Downloads\" with title \"YouTube Comment Downloader\" sound name \"Glass\"" 2>/dev/null || true
