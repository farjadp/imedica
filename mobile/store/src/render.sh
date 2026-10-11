#!/usr/bin/env bash
# Renders the store screenshots from the raw simulator captures.
# Usage: src/render.sh <ios|android> <width> <height>
set -euo pipefail
cd "$(dirname "$0")/.."
platform="$1"; W="$2"; H="$3"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
out="$platform/final"; mkdir -p "$out"
# file | kicker | headline (HTML: <em> for the mint accent)
while IFS='|' read -r n raw kicker title; do
  [[ -z "$n" ]] && continue
  url="file://$PWD/src/frame.html?w=$W&h=$H&img=$(python3 -c 'import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))' "file://$PWD/$platform/$raw")&k=$(python3 -c 'import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))' "$kicker")&t=$(python3 -c 'import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))' "$title")"
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size="$W,$H" \
    --virtual-time-budget=4000 --allow-file-access-from-files --screenshot="$out/$n.png" "$url" >/dev/null 2>&1
  sips -s format jpeg -s formatOptions 92 "$out/$n.png" --out "$out/$n.jpg" >/dev/null && rm "$out/$n.png"
  echo "$out/$n.jpg"
done <<'LIST'
01-call|raw-03-call.png|THE CALL|A live monitor.<br><em>Real</em> ECGs.
02-verdict|raw-04-verdict.png|EVERY DECISION|Scored the<br>moment you <em>decide.</em>
03-debrief|raw-05-debrief.png|THE DEBRIEF|The physician’s<br><em>reason</em> for every move.
04-library|raw-02-library.png|BETWEEN SHIFTS|Physician-written<br>calls, <em>ready</em> when you are.
05-test|raw-06-test.png|PRE- AND POST-TESTS|Measure what<br>training <em>changed.</em>
06-signin|raw-01-signin.png|PRIVATE BY DESIGN|No ads. No tracking.<br><em>Your</em> runs stay yours.
LIST
