#!/usr/bin/env bash
# save-tab-to-coda.sh — saves the frontmost browser tab to DB Job Websites in Coda

CODA_API_KEY="eafd77e1-bbbb-43bd-b5b7-b5efa5507081"
DOC_ID="UQg1BuWUWh"
TABLE_ID="grid-JLVlKnG0Xa"

# ---------------------------------------------------------------------------
# clean_title: strip job-listing chaff from a page title, leaving company name
# Uses Python for reliable case-insensitive matching and word boundaries
# (macOS BSD sed does not support the /I flag in ERE mode)
# ---------------------------------------------------------------------------
clean_title() {
  python3 - "$1" <<'PYEOF'
import re, sys

t = sys.argv[1]

# 1. Strip spaced separators — must have whitespace on both sides
#    so compound words ("full-time") and hyphenated names are preserved
t = re.sub(r' [—–|] | - ', ' ', t)

# 2. Strip job-listing and page-navigation chaff (all case-insensitive)
chaff = [
    # Job noise
    r'\bjob\s+openings?\b',
    r'\bclassifieds?\b',
    r'\bjobs?\b',
    r'\bcareers?\b',
    r'\bopportunit(?:y|ies)\b',
    r'\blistings?\b',
    r'\bsearch\s+results?\b',
    r'\bwork\s+with\s+us\b',
    r'\bat\b',               # "Jobs at Company" → "Company"; \b keeps "Atlassian" intact
    r'\broundup\b',
    r'\bnow\s+hiring\b',
    r"\bwe'?re\s+hiring\b",
    r'\bjoin\s+(?:our\s+)?team\b',
    r'\bjoin\s+us\b',
    r'\bapply\s+now\b',
    r'\bopen\s+(?:roles?|positions?)\b',
    r'\bcurrent\s+openings?\b',
    r'\bemployment\b',
    # Page/nav noise
    r'\bview\b',
    r'\bhome\b',
    r'\boverview\b',
    r'\bportal\b',
    r'\bsite\b',
    r'\bofficial\s+(?:web)?site\b',
    r'\bpage\s+\d+\b',
    # Dates — month+day+year, month+year, and standalone 4-digit years
    r'\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?'
    r'|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)'
    r'\s+\d{1,2},?\s+\d{4}\b',
    r'\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?'
    r'|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)'
    r'\s+\d{4}\b',
    r'\b20\d{2}\b',
]
for pattern in chaff:
    t = re.sub(pattern, '', t, flags=re.IGNORECASE)

# 3. Collapse whitespace and trim
t = re.sub(r'\s+', ' ', t).strip()

print(t)
PYEOF
}

# Detect frontmost browser and grab URL + title
FRONTMOST=$(osascript -e 'tell application "System Events" to get name of first application process whose frontmost is true')

case "$FRONTMOST" in
  "Google Chrome"|"Chromium"|"Brave Browser"|"Microsoft Edge"|"Vivaldi")
    URL=$(osascript -e "tell application \"$FRONTMOST\" to return URL of active tab of front window")
    TITLE=$(osascript -e "tell application \"$FRONTMOST\" to return title of active tab of front window")
    ;;
  "Arc")
    URL=$(osascript -e 'tell application "Arc" to return URL of active tab of front window')
    TITLE=$(osascript -e 'tell application "Arc" to return title of active tab of front window')
    ;;
  "Safari"|"Safari Technology Preview")
    URL=$(osascript -e "tell application \"$FRONTMOST\" to return URL of current tab of front window")
    TITLE=$(osascript -e "tell application \"$FRONTMOST\" to return name of current tab of front window")
    ;;
  *)
    echo "Unsupported browser: $FRONTMOST" >&2
    exit 1
    ;;
esac

if [[ -z "$URL" ]]; then
  echo "Could not get URL from $FRONTMOST" >&2
  exit 1
fi

# Strip tracking parameters from URL (utm_*, fbclid, gclid, etc.)
URL=$(python3 - "$URL" <<'PYEOF'
import sys
from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse

TRACKING = {
    'utm_source','utm_medium','utm_campaign','utm_content','utm_term',
    'fbclid','gclid','msclkid','mc_cid','mc_eid',
}

parsed = urlparse(sys.argv[1])
clean = [(k, v) for k, v in parse_qsl(parsed.query, keep_blank_values=True)
         if k.lower() not in TRACKING and not k.lower().startswith('utm_')]
print(urlunparse(parsed._replace(query=urlencode(clean))))
PYEOF
)

# Clean the title and use it as the default prompt value
CLEANED=$(clean_title "$TITLE")

# Prompt — button choice sets Type; text field sets Name.
# Returns "name|button" so both values survive in one osascript call.
RESULT=$(osascript 2>/dev/null <<APPLESCRIPT
set d to display dialog "Name for this entry:" & return & return & "  Co.    — save as a company" & return & "  Board — save as a job board" & return & "  Cancel — abort" default answer "$CLEANED" with title "Save to Coda" buttons {"Cancel", "Board", "Co."} default button "Co." cancel button "Cancel"
return (text returned of d) & "|" & (button returned of d)
APPLESCRIPT
)
if [[ $? -ne 0 ]]; then
  echo "Cancelled by user." >&2
  exit 0
fi

NAME="${RESULT%|*}"
[[ -z "$NAME" ]] && NAME="$CLEANED"

if [[ "${RESULT##*|}" == "Board" ]]; then
  TYPE="Board"
else
  TYPE="Co."
fi

PAYLOAD=$(printf '{"rows":[{"cells":[{"column":"c--bG70Z1Al_","value":%s},{"column":"c-7GGXx-mhh4","value":%s},{"column":"c-vE1jqjMphm","value":%s}]}]}' \
  "$(printf '%s' "$NAME" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')" \
  "$(printf '%s' "$URL"  | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')" \
  "$(printf '%s' "$TYPE" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')")

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "https://coda.io/apis/v1/docs/$DOC_ID/tables/$TABLE_ID/rows" \
  -H "Authorization: Bearer $CODA_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

HTTP_CODE=$(tail -1 <<<"$RESPONSE")

CODA_DOC_URL="https://coda.io/d/Work-Search_dUQg1BuWUWh/"

if [[ "$HTTP_CODE" == "202" ]]; then
  echo "Saved: $NAME → $URL"
  CLICKED=$(osascript -e "button returned of (display dialog \"Saved \\\"$NAME\\\" to Coda.\" buttons {\"Open in Coda\", \"Done\"} default button \"Done\" with title \"Save to Coda\")")
  if [[ "$CLICKED" == "Open in Coda" ]]; then
    osascript -e "tell application \"$FRONTMOST\" to open location \"$CODA_DOC_URL\""
  fi
else
  ERROR_BODY=$(head -1 <<<"$RESPONSE")
  echo "Error ($HTTP_CODE): $ERROR_BODY" >&2
  osascript -e "display dialog \"Save failed (HTTP $HTTP_CODE).\\n\\n$ERROR_BODY\" buttons {\"OK\"} default button \"OK\" with title \"Save to Coda\" with icon stop"
  exit 1
fi