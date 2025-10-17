# GitHub Pages Deployment Script

## Overview

The `deploy-to-pages.sh` script provides safe, automated deployment of the CyberNetSec.io static site to GitHub Pages. This script handles the complete deployment workflow while preserving critical GitHub Pages configuration files.

## Usage

```bash
./scripts/deploy-to-pages.sh
```

The script runs interactively and will:
1. Check all prerequisites
2. Show a preview of what will be deployed
3. Ask for confirmation before making any changes
4. Deploy safely with automatic cleanup

## What It Does

### Prerequisites Check
- Verifies GitHub CLI is installed and authenticated
- Confirms you have write access to the target repository
- Ensures the static build exists in `.output/public`

### Safe Deployment Process
1. **Clone Target Repository**: Creates a temporary clone of `jaybodecode/netsecops.github.io`
2. **Preserve Critical Files**: Automatically backs up:
   - `CNAME` (custom domain configuration)
   - `.nojekyll` (bypasses Jekyll processing)
   - `README.md` (repository documentation)
3. **Clear and Copy**: Removes old content and copies fresh build
4. **Restore Files**: Puts back the preserved critical files
5. **Preview Changes**: Shows git diff of what will be committed
6. **Interactive Confirmation**: Asks for final approval before pushing
7. **Deploy**: Commits and pushes changes to GitHub
8. **Cleanup**: Removes temporary files

### Safety Features

- **Non-destructive**: Never modifies your local workspace
- **Preserves critical files**: CNAME, .nojekyll, and README.md are always preserved
- **Interactive confirmation**: Won't deploy without explicit approval
- **Full preview**: Shows exactly what changes will be made
- **Automatic cleanup**: Removes temporary files even if deployment fails
- **Clear status reporting**: Detailed feedback at every step

## Requirements

### Local Environment
- GitHub CLI (`gh`) installed and authenticated
- Write access to `jaybodecode/netsecops.github.io` repository
- A successful static build in `.output/public` directory

### Build the Site
Before deploying, ensure you have a fresh build:

```bash
# Generate static site
npm run generate

# Or build for production
npm run build
```

## Target Repository Structure

The script deploys to `jaybodecode/netsecops.github.io` which serves the site at `https://cyber.netsecops.io`.

### Preserved Files
These files in the target repository are never overwritten:
- **CNAME**: Contains `cyber.netsecops.io` for custom domain
- **.nojekyll**: Tells GitHub Pages to serve files directly without Jekyll processing
- **README.md**: Repository documentation

## Deployment Workflow

1. **Pre-deployment**:
   ```bash
   # Ensure clean build
   npm run generate
   
   # Review build output
   ls -la .output/public
   ```

2. **Execute deployment**:
   ```bash
   ./scripts/deploy-to-pages.sh
   ```

3. **Follow prompts**:
   - Review the deployment summary
   - Type `y` to confirm deployment
   - Monitor the push progress

4. **Verify deployment**:
   - Visit `https://cyber.netsecops.io`
   - Check GitHub Pages settings in repository
   - Verify all functionality works correctly

## Troubleshooting

### Common Issues

**GitHub CLI not authenticated**:
```bash
gh auth login
```

**No write access to repository**:
- Ensure you're authenticated as a user with push access
- Check repository permissions

**Build directory missing**:
```bash
npm run generate
```

**Deployment fails mid-process**:
- The script includes automatic cleanup
- Safe to re-run after fixing the underlying issue

### Manual Recovery

If something goes wrong, you can manually fix the target repository:

1. Clone the repository:
   ```bash
   git clone https://github.com/jaybodecode/netsecops.github.io.git
   ```

2. Restore critical files if missing:
   ```bash
   echo "cyber.netsecops.io" > CNAME
   touch .nojekyll
   ```

3. Add your content and push

## GitHub Pages Configuration

The target repository should have these settings:
- **Source**: Deploy from branch `main` / `/ (root)`
- **Custom domain**: `cyber.netsecops.io`
- **Enforce HTTPS**: Enabled

## Script Internals

### Key Functions
- `check_prerequisites()`: Validates environment and permissions
- `preserve_files()`: Backs up critical GitHub Pages files  
- `restore_files()`: Restores preserved files after content copy
- `cleanup()`: Removes temporary files and directories

### Exit Codes
- `0`: Successful deployment
- `1`: Missing prerequisites or permissions
- `2`: User cancelled deployment
- `3`: Git operation failed

## Security Considerations

- The script only modifies the target repository, never your local workspace
- All operations are performed in temporary directories
- Preserved files ensure GitHub Pages configuration isn't lost
- Interactive confirmation prevents accidental deployments

## Performance

- Typical deployment time: 30-60 seconds
- Network dependent (clone + push operations)
- Minimal local disk usage (temporary files cleaned up)

---

**Last Updated**: October 11, 2025  
**Compatible with**: Nuxt 4.1.3, GitHub CLI 2.x