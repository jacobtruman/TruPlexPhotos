# Git Hooks

## Overview

This project uses [Husky](https://typicode.github.io/husky/) to manage Git hooks for automated version management.

## Pre-Commit Hook

### What It Does

The pre-commit hook automatically checks if the version has been updated in your commit. If not, it:

1. Auto-increments the **patch version** (e.g., 1.0.0 → 1.0.1)
2. Syncs the version to `app.json`
3. Increments build numbers (iOS and Android)
4. Stages the updated `package.json` and `app.json` files

### How It Works

**When you commit:**

```bash
git add src/components/MyComponent.tsx
git commit -m "feat: add new component"
```

**The hook will:**

```
📦 Auto-incrementing patch version...
✅ Version bumped: 1.0.0 → 1.0.1
📱 iOS build number: 3
🤖 Android version code: 3
📝 Staged version files
```

**If you already bumped the version:**

```bash
npm run version:minor
git add .
git commit -m "feat: add new feature"
```

**The hook will:**

```
✅ Version already updated in this commit
```

## Manual Version Control

If you want to control the version type (patch/minor/major), bump it **before** committing:

```bash
# For bug fixes
npm run version:patch

# For new features
npm run version:minor

# For breaking changes
npm run version:major

# Then commit
git add .
git commit -m "chore: release v1.1.0"
```

## Bypassing the Hook

If you need to commit without version changes (e.g., documentation only):

```bash
git commit -m "docs: update README" --no-verify
```

**⚠️ Use sparingly!** Most code changes should increment the version.

## When to Use `--no-verify`

✅ **Good reasons:**
- Documentation-only changes
- README updates
- Comment changes
- Configuration tweaks (non-functional)
- Fixing typos

❌ **Bad reasons:**
- Code changes
- Bug fixes
- New features
- Dependency updates

## Disabling Auto-Versioning

If you want to disable auto-versioning entirely:

### Option 1: Remove the hook (temporary)

```bash
rm .husky/pre-commit
```

### Option 2: Modify the hook

Edit `.husky/pre-commit` and comment out the version check:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Auto-increment version if not already updated
# node scripts/check-version.js
```

### Option 3: Uninstall Husky (permanent)

```bash
npm uninstall husky
rm -rf .husky
```

## Troubleshooting

### Hook Not Running

If the hook isn't running:

```bash
# Reinstall Husky
npm install
npx husky install
```

### Permission Denied

If you get permission errors:

```bash
chmod +x .husky/pre-commit
chmod +x scripts/check-version.js
```

### Version Not Incrementing

Check if `package.json` is already staged:

```bash
git status
```

If `package.json` is staged, the hook assumes you've already updated the version.

### Hook Fails

If the hook fails and blocks your commit:

1. Check the error message
2. Fix the issue
3. Try committing again
4. Or use `--no-verify` to bypass (not recommended)

## Best Practices

1. **Let the hook handle patch versions** - Don't manually bump for small changes
2. **Manually bump for features** - Use `npm run version:minor` for new features
3. **Manually bump for breaking changes** - Use `npm run version:major`
4. **Update CHANGELOG.md** - Document your changes before committing
5. **Use meaningful commit messages** - Follow [Conventional Commits](https://www.conventionalcommits.org/)

## Commit Message Convention

Consider using conventional commits for better changelog generation:

```bash
# Features
git commit -m "feat: add photo editing"

# Bug fixes
git commit -m "fix: resolve crash on Android"

# Documentation
git commit -m "docs: update README"

# Chores (no version bump needed)
git commit -m "chore: update dependencies" --no-verify
```

## How It Integrates with Workflow

### Typical Development Flow

```bash
# 1. Make changes
vim src/components/MyComponent.tsx

# 2. Stage changes
git add src/components/MyComponent.tsx

# 3. Commit (hook auto-bumps version)
git commit -m "feat: add new component"
# → Version automatically bumped to 1.0.1

# 4. Push
git push origin main
```

### Feature Release Flow

```bash
# 1. Make changes
vim src/screens/NewScreen.tsx

# 2. Manually bump minor version
npm run version:minor
# → Version bumped to 1.1.0

# 3. Update CHANGELOG.md
vim CHANGELOG.md

# 4. Commit (hook sees version already updated)
git add .
git commit -m "feat: add new screen"
# → ✅ Version already updated in this commit

# 5. Tag and push
git tag v1.1.0
git push origin main --tags
```

## Files Managed by Hooks

The pre-commit hook modifies these files:

- `package.json` - Semantic version
- `app.json` - App version, iOS buildNumber, Android versionCode

These files are automatically staged if modified by the hook.

## References

- [Husky Documentation](https://typicode.github.io/husky/)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)

