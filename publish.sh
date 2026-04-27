#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-}"

if [ -z "$VERSION" ]; then
  echo "Usage: ./publish.sh <version>"
  echo "  e.g. ./publish.sh 1.0.1"
  exit 1
fi

# Validate semver format
if ! echo "$VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$'; then
  echo "Error: invalid semver '$VERSION'"
  exit 1
fi

# Ensure working tree is clean before bumping version
if [ -n "$(git status --porcelain)" ]; then
  echo "Error: uncommitted changes exist — commit or stash before publishing"
  exit 1
fi

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

echo "→ Running tests..."
bun test

echo "→ Building..."
bun run build

echo "→ Bumping version to $VERSION..."
npm version "$VERSION" --no-git-tag-version

echo "→ Staging and committing..."
git add package.json
git commit -m "chore: release v$VERSION"
git tag "v$VERSION"

echo "→ Publishing to npm..."
npm publish --access public

echo "→ Pushing to git..."
git push origin "$CURRENT_BRANCH"
git push origin "v$VERSION"

echo "✓ Published owlpay-sdk@$VERSION"
