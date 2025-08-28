#!/usr/bin/env bash
# Fails if deprecated task text container classes OR legacy button selector are present
set -euo pipefail

LEGACY_TEXT_CONTAINER_PATTERN='gt-title-wrap|gt-lines|task-text-container'
LEGACY_BUTTON_PATTERN='button\.gt-title'

failed=false

if git grep -nE "$LEGACY_TEXT_CONTAINER_PATTERN" -- 'frontend/src' > /dev/null 2>&1; then
  echo '❌ Deprecated task text container class detected (use .gt-text).' >&2
  git grep -nE "$LEGACY_TEXT_CONTAINER_PATTERN" -- 'frontend/src'
  failed=true
else
  echo '✅ No deprecated task text container classes found.'
fi

if git grep -nE "$LEGACY_BUTTON_PATTERN" -- 'frontend/src' > /dev/null 2>&1; then
  echo '❌ Deprecated button selector detected: button.gt-title (use button.gt-textButton).' >&2
  git grep -nE "$LEGACY_BUTTON_PATTERN" -- 'frontend/src'
  failed=true
else
  echo '✅ No deprecated button.gt-title selectors found.'
fi

if [ "$failed" = true ]; then
  exit 1
fi

echo '🎯 Deprecated class/selector check passed.'
