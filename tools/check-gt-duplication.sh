#!/usr/bin/env bash
# CI guard: ensure limited definitions for .gt-row/.gt-title/.gt-subtitle/.gt-check/.gt-star in CSS (prevent re-introduction of duplicate style blocks)
set -euo pipefail

FILES=$(git ls-files | grep -E '\.(css|scss)$')
# Count top-level selector definitions (simplistic but effective heuristic)
COUNT=$(grep -nE '^\s*\.gt-(row|title|subtitle|check|star)\b' $FILES | wc -l || echo 0)
LIMIT=40

if [ "$COUNT" -gt "$LIMIT" ]; then
  echo "❌ יותר מדי הגדרות ל- gt-row/title/subtitle/check/star (נמצאו $COUNT, סף $LIMIT). נקה כפילויות." >&2
  grep -nE '^\s*\.gt-(row|title|subtitle|check|star)\b' $FILES | head -n 120 >&2
  exit 1
fi

echo "✅ בדיקת כפילויות gt-row/title/subtitle/check/star עבר בהצלחה (נמצאו $COUNT <= $LIMIT)."