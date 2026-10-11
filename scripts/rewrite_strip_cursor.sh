#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export FILTER_BRANCH_SQUELCH_WARNING=1
rm -rf .git/refs/original .git/filter-branch || true
git update-ref -d refs/original/refs/heads/main 2>/dev/null || true

git filter-branch -f --msg-filter '
sed "/cursoragent@cursor.com/Id; /^[Mm]ade-with: [Cc]ursor/Id"
' main

echo "==== commits after rewrite ===="
git log --format="%h%n%B----"
echo "==== remaining cursor trailers ===="
git log --grep="cursoragent" -i --oneline || true
