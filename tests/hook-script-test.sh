#!/bin/bash
# Tests that the hook script applies the matcher itself.
# Run: bash tests/hook-script-test.sh
cd "$(dirname "$0")/.." || exit 1
export CLAUDE_PLUGIN_ROOT=$PWD
hook=.claude/hooks/rust-skill-eval-hook.sh
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
mkdir -p "$tmp/plain/.git" "$tmp/crate/.git" "$tmp/crate/src"; touch "$tmp/crate/Cargo.toml"
pass=0 fail=0

check() { # expect(fires|quiet) mode prompt cwd
  local out
  out=$(printf '{"prompt":%s,"cwd":"%s"}' "$(printf '%s' "$3" | python3 -c 'import json,sys;print(json.dumps(sys.stdin.read()))')" "$4" \
    | RUST_SKILLS_HOOK=$2 bash "$hook")
  local got=quiet; [ -n "$out" ] && got=fires
  if [ "$got" = "$1" ]; then pass=$((pass+1)); echo "✅ $1: '$3' (mode=${2:-default})"
  else fail=$((fail+1)); echo "❌ expected $1, got $got: '$3' (mode=${2:-default})"; fi
}

# default: only the matcher decides
check fires ""      "E0382 value moved"                       "$tmp/plain"
check fires ""      "支付系统精度问题"                          "$tmp/plain"
check quiet ""      "merge origin/staging into this branch"   "$tmp/plain"
check quiet ""      "明天几点开会"                              "$tmp/plain"
# project mode: matcher plus a Cargo project or a direct Rust mention
check quiet project "how to use tokio"                        "$tmp/plain"
check fires project "how to use tokio"                        "$tmp/crate/src"
check fires project "rust ownership问题"                       "$tmp/plain"
check quiet project "merge origin/staging into this branch"   "$tmp/crate"

echo "Passed: $pass  Failed: $fail"
[ $fail -eq 0 ]
