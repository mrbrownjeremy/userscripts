#!/bin/zsh

# Save Reddit HTML (from clipboard) to DEVONthink
# Called by Keyboard Maestro after the Reddit Sidebar Toggle script copies HTML to clipboard

pbpaste > /tmp/reddit_content.txt

# Extract title from the HTML <title> tag
TITLE=$(python3 -c "
import re
content = open('/tmp/reddit_content.txt').read()
m = re.search(r'<title>([^<]+)</title>', content, re.IGNORECASE)
print(m.group(1).strip() if m else 'Reddit Post')
")

[ -z "$TITLE" ] && TITLE="Reddit Post"

# Strip any leading "r/" prefix (defensive — JS should already omit it)
TITLE="${TITLE#r/}"

osascript - "$TITLE" <<'EOF'
on run argv
    set theTitle to item 1 of argv
    set contentFile to POSIX file "/tmp/reddit_content.txt"
    set theContent to read contentFile as «class utf8»

    tell application "DEVONthink"
        try
            set theInbox to incoming group
            set newRecord to create record with {name:theTitle, type:html, content:theContent} in theInbox
            set tags of newRecord to {"reddit", "imported"}
            display notification "Saved to DEVONthink" with title theTitle
        on error errMsg number errNum
            display notification "Error " & errNum & ": " & errMsg with title "Import Failed"
        end try
    end tell
end run
EOF

rm -f /tmp/reddit_content.txt
