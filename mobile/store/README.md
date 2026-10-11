# Store screenshots

`ios/raw-*.png` (iPhone 17 Pro simulator, 1206×2622) and `android/raw-*.png`
(emulator at `wm size 1080x1920`, so Play's ≤ 2:1 rule holds) are captured
from the app with fictional local data and a clean status bar
(`xcrun simctl status_bar … override`, Android System UI demo mode).

`src/render.sh <ios|android> <w> <h>` puts each raw screen in the brand
frame (`src/frame.html`: headline over the phone) with headless Chrome and
writes JPEGs without alpha to `<platform>/final/`. The headlines live in
the script. `src/feature.html` is the Play feature graphic (1024×500).

Re-capture the raws after any visible UI change, then re-render.
