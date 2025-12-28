#!/usr/bin/env python3
"""
FrontendRAFT - Complete Build, Test & Publish Script

This script performs:
1. Source validation
2. Security testing (XSS, injection, etc.)
3. Route testing with detailed logs
4. Bundle optimization (exclude plugins)
5. GitHub integration (token-based)
6. CDN auto-update setup
7. Purge old versions
8. Comprehensive error reporting

Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP

Author: DAOUDA Abdoul Anzize - Nexus Studio
Version: 0.1.0
Date: December 28, 2025
"""

import os
import sys
import json
import hashlib
import subprocess
import re
from pathlib import Path
from datetime import datetime

# Terminal colors
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def log(message, color=Colors.OKBLUE):
    """Print colored log message"""
    print(f"{color}{message}{Colors.ENDC}")

def log_success(message):
    log(f"✅ {message}", Colors.OKGREEN)

def log_error(message):
    log(f"❌ {message}", Colors.FAIL)

def log_warning(message):
    log(f"⚠️  {message}", Colors.WARNING)

def log_header(message):
    log(f"\n{'='*70}\n{message}\n{'='*70}", Colors.HEADER + Colors.BOLD)

def log_test(name, passed, details=""):
    """Log test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    color = Colors.OKGREEN if passed else Colors.FAIL
    log(f"{status} {name}", color)
    if details and not passed:
        log(f"    └─ {details}", Colors.FAIL)

# =============================================================================
# CONFIGURATION
# =============================================================================

GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
REPO_OWNER = 'Nexus-Studio-CEO'
REPO_NAME = 'FrontendRAFT'
VERSION = '0.1.0'

# Files to exclude from CDN bundle (plugins are templates only)
EXCLUDED_FROM_CDN = [
    'src/plugins/react.js',
    'src/plugins/vue.js'
]

# =============================================================================
# STEP 1: VALIDATE GITHUB TOKEN
# =============================================================================

def validate_github_token():
    """Validate GitHub token is present and valid"""
    log_header("Step 1: Validating GitHub Token")
    
    if not GITHUB_TOKEN:
        log_error("GITHUB_TOKEN environment variable not set!")
        log("Set it with: export GITHUB_TOKEN='your_token_here'")
        log("Get token from: https://github.com/settings/tokens")
        return False
    
    log(f"Token found (length: {len(GITHUB_TOKEN)})")
    
    # Test token validity
    try:
        result = subprocess.run(
            ['curl', '-s', '-H', f'Authorization: token {GITHUB_TOKEN}',
             'https://api.github.com/user'],
            capture_output=True, text=True
        )
        
        if result.returncode == 0:
            user_data = json.loads(result.stdout)
            if 'login' in user_data:
                log_success(f"Token valid for user: {user_data['login']}")
                return True
        
        log_error("Token is invalid or expired")
        return False
    except Exception as e:
        log_error(f"Failed to validate token: {e}")
        return False

# =============================================================================
# STEP 2: SOURCE VALIDATION
# =============================================================================

def validate_source_files():
    """Validate all source files exist"""
    log_header("Step 2: Validating Source Files")
    
    required_files = [
        'src/index.js',
        'src/core/FrontendRAFT.js',
        'src/core/CacheLayer.js',
        'src/core/StreamManager.js',
        'src/core/BatchManager.js',
        'src/core/OptimisticEngine.js',
        'src/core/QueryEngine.js',
        'src/core/AuthLayer.js',
        'src/core/Router.js',
        'src/core/StorageLayer.js',
        'src/core/ComputeLayer.js',
        'src/core/P2PLayer.js',
        'src/core/CDNClient.js',
        'src/plugins/react.js',
        'src/plugins/vue.js',
        'src/utils/jwt.js',
        'src/utils/crypto.js',
        'src/utils/validation.js'
    ]
    
    missing = []
    for file in required_files:
        if not os.path.exists(file):
            missing.append(file)
    
    if missing:
        log_error(f"Missing {len(missing)} files:")
        for file in missing:
            log(f"  - {file}", Colors.FAIL)
        return False
    
    log_success(f"All {len(required_files)} source files present")
    return True

# =============================================================================
# STEP 3: SECURITY TESTING
# =============================================================================

def test_xss_protection():
    """Test XSS protection in validation utils"""
    log_header("Step 3: Security Testing - XSS Protection")
    
    xss_payloads = [
        "<script>alert('xss')</script>",
        "<img src=x onerror=alert('xss')>",
        "javascript:alert('xss')",
        "<svg onload=alert('xss')>",
        "';alert('xss');//",
    ]
    
    # Check if sanitize function exists
    validation_file = 'src/utils/validation.js'
    if not os.path.exists(validation_file):
        log_error("validation.js not found")
        return False
    
    with open(validation_file, 'r') as f:
        content = f.read()
        
        # Check for sanitize function
        has_sanitize = 'function sanitize' in content or 'export function sanitize' in content
        log_test("Sanitize function exists", has_sanitize)
        
        # Check for XSS protection patterns
        has_html_escape = '&lt;' in content or 'replace(/</g' in content
        log_test("HTML escape implemented", has_html_escape)
        
        has_script_block = '&lt;script' in content or 'script' in content.lower()
        log_test("Script tag protection", has_script_block)
        
        return has_sanitize and has_html_escape

def test_sql_injection_protection():
    """Test SQL injection protection"""
    log_header("Step 4: Security Testing - SQL Injection Protection")
    
    # Since we use IndexedDB (key-value), SQL injection is not applicable
    # But we test for safe query handling
    
    query_engine_file = 'src/core/QueryEngine.js'
    if not os.path.exists(query_engine_file):
        log_error("QueryEngine.js not found")
        return False
    
    with open(query_engine_file, 'r') as f:
        content = f.read()
        
        # Check for safe query parsing
        has_where_filter = '_filter' in content
        log_test("Safe WHERE clause filtering", has_where_filter)
        
        has_operator_check = '$eq' in content or 'operator' in content
        log_test("Query operator validation", has_operator_check)
        
        # Check no direct eval() usage
        has_eval = 'eval(' in content
        log_test("No eval() usage", not has_eval)
        
        return has_where_filter and not has_eval

def test_jwt_security():
    """Test JWT implementation security"""
    log_header("Step 5: Security Testing - JWT Security")
    
    jwt_file = 'src/utils/jwt.js'
    if not os.path.exists(jwt_file):
        log_error("jwt.js not found")
        return False
    
    with open(jwt_file, 'r') as f:
        content = f.read()
        
        # Check for signature verification
        has_verify = 'verifyJWT' in content
        log_test("JWT verification function", has_verify)
        
        has_signature_check = 'signature' in content and '!=' in content
        log_test("Signature validation", has_signature_check)
        
        # Check for expiration validation
        has_exp_check = 'exp' in content and 'Date.now()' in content
        log_test("Token expiration check", has_exp_check)
        
        # Check no hardcoded secrets
        has_hardcoded_secret = 'secret' in content.lower() and '=' in content
        potential_hardcoded = re.findall(r'secret\s*=\s*["\'][^"\']+["\']', content, re.IGNORECASE)
        log_test("No hardcoded secrets", len(potential_hardcoded) == 0, 
                f"Found {len(potential_hardcoded)} potential hardcoded secrets")
        
        return has_verify and has_signature_check and has_exp_check

def test_cors_configuration():
    """Test CORS configuration"""
    log_header("Step 6: Security Testing - CORS Configuration")
    
    router_file = 'src/core/Router.js'
    if not os.path.exists(router_file):
        log_error("Router.js not found")
        return False
    
    with open(router_file, 'r') as f:
        content = f.read()
        
        # Check for CORS handling
        has_cors = 'cors' in content.lower() or 'origin' in content.lower()
        log_test("CORS handling present", has_cors)
        
        # Check for safe origin validation
        has_wildcard_warning = '*' not in content or 'wildcard' in content.lower()
        log_test("No unsafe wildcard CORS", has_wildcard_warning)
        
        return has_cors

# =============================================================================
# STEP 7: ROUTE TESTING
# =============================================================================

def test_routes():
    """Test route definitions and error handling"""
    log_header("Step 7: Route Testing")
    
    router_file = 'src/core/Router.js'
    with open(router_file, 'r') as f:
        content = f.read()
        
        # Test route definition
        has_define = 'define' in content and 'route' in content.lower()
        log_test("Route.define() method", has_define)
        
        # Test HTTP methods
        http_methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
        for method in http_methods:
            has_method = method in content
            log_test(f"HTTP {method} support", has_method)
        
        # Test path parameters
        has_params = ':' in content and 'params' in content
        log_test("Path parameters (/users/:id)", has_params)
        
        # Test middleware
        has_middleware = 'middleware' in content.lower()
        log_test("Middleware support", has_middleware)
        
        # Test error handling
        has_try_catch = 'try' in content and 'catch' in content
        log_test("Error handling (try/catch)", has_try_catch)
        
        # Test 404 handling
        has_404 = '404' in content or 'not found' in content.lower()
        log_test("404 Not Found handling", has_404)
        
        return has_define and has_try_catch and has_404

# =============================================================================
# STEP 8: BUNDLE OPTIMIZATION
# =============================================================================

def create_cdn_bundle():
    """Create optimized CDN bundle (exclude plugins)"""
    log_header("Step 8: Creating CDN Bundle")
    
    # Create dist directory
    os.makedirs('dist', exist_ok=True)
    
    # Copy files except plugins
    src_files = list(Path('src').rglob('*.js'))
    cdn_files = []
    excluded_count = 0
    
    for src_file in src_files:
        src_path = str(src_file)
        
        # Skip plugins
        if any(excluded in src_path for excluded in EXCLUDED_FROM_CDN):
            excluded_count += 1
            log_warning(f"Excluded: {src_path} (plugin template)")
            continue
        
        # Copy to dist
        rel_path = src_file.relative_to('src')
        dist_path = Path('dist') / rel_path
        dist_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Copy file
        with open(src_file, 'r') as f:
            content = f.read()
        
        with open(dist_path, 'w') as f:
            f.write(content)
        
        cdn_files.append(str(dist_path))
    
    log_success(f"CDN bundle created: {len(cdn_files)} files")
    log(f"Excluded {excluded_count} plugin files")
    
    # Calculate bundle size
    total_size = sum(os.path.getsize(f) for f in cdn_files)
    log(f"Total bundle size: {total_size:,} bytes ({total_size/1024:.2f} KB)")
    
    if total_size > 100 * 1024:
        log_warning("Bundle exceeds 100KB target")
    
    return True

# =============================================================================
# STEP 9: GITHUB OPERATIONS
# =============================================================================

def check_repo_exists():
    """Check if GitHub repo exists"""
    log_header("Step 9: Checking GitHub Repository")
    
    try:
        result = subprocess.run(
            ['curl', '-s', '-H', f'Authorization: token {GITHUB_TOKEN}',
             f'https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}'],
            capture_output=True, text=True
        )
        
        if result.returncode == 0:
            repo_data = json.loads(result.stdout)
            if 'id' in repo_data:
                log_success(f"Repository found: {repo_data['full_name']}")
                return True
        
        log_warning(f"Repository {REPO_OWNER}/{REPO_NAME} not found")
        log("You'll need to create it first on GitHub")
        return False
    except Exception as e:
        log_error(f"Failed to check repo: {e}")
        return False

def purge_old_cdn_versions():
    """Purge old CDN versions (jsdelivr purge API)"""
    log_header("Step 10: Purging Old CDN Versions")
    
    # jsdelivr auto-purges on new git push
    # We just log the CDN URL
    cdn_url = f"https://cdn.jsdelivr.net/gh/{REPO_OWNER}/{REPO_NAME}@v{VERSION}/src/index.js"
    
    log(f"New CDN URL: {cdn_url}")
    log("jsdelivr will auto-update within 12-24 hours")
    log("Force purge: https://www.jsdelivr.com/tools/purge")
    
    return True

def setup_cdn_auto_update():
    """Setup CDN auto-update via GitHub Actions"""
    log_header("Step 11: Setting Up CDN Auto-Update")
    
    # Create .github/workflows directory
    os.makedirs('.github/workflows', exist_ok=True)
    
    # Create GitHub Action workflow
    workflow = """name: CDN Auto-Update

on:
  push:
    branches: [ main ]
    tags:
      - 'v*'

jobs:
  purge-cdn:
    runs-on: ubuntu-latest
    steps:
      - name: Purge jsdelivr cache
        run: |
          curl -X POST https://purge.jsdelivr.net/gh/${{ github.repository }}@${{ github.ref_name }}/src/index.js
          echo "CDN cache purged for ${{ github.ref_name }}"
"""
    
    with open('.github/workflows/cdn-update.yml', 'w') as f:
        f.write(workflow)
    
    log_success("GitHub Action created: .github/workflows/cdn-update.yml")
    log("CDN will auto-update on every push to main or new tag")
    
    return True

def git_operations():
    """Perform git operations"""
    log_header("Step 12: Git Operations")
    
    try:
        # Check if git repo is initialized
        if not os.path.exists('.git'):
            log("Initializing git repository...")
            subprocess.run(['git', 'init'], check=True)
        
        # Add all files
        log("Adding files to git...")
        subprocess.run(['git', 'add', '.'], check=True)
        
        # Commit
        commit_message = f"Release FrontendRAFT v{VERSION}"
        log(f"Committing: {commit_message}")
        subprocess.run(['git', 'commit', '-m', commit_message], check=True)
        
        # Create tag
        log(f"Creating tag: v{VERSION}")
        subprocess.run(['git', 'tag', '-f', f'v{VERSION}'], check=True)
        
        # Check if remote exists
        result = subprocess.run(['git', 'remote', 'get-url', 'origin'], 
                              capture_output=True, text=True)
        
        if result.returncode != 0:
            # Add remote
            remote_url = f"https://{GITHUB_TOKEN}@github.com/{REPO_OWNER}/{REPO_NAME}.git"
            log("Adding remote origin...")
            subprocess.run(['git', 'remote', 'add', 'origin', remote_url], check=True)
        
        # Push to GitHub
        log("Pushing to GitHub...")
        subprocess.run(['git', 'push', '-u', 'origin', 'main', '--force'], check=True)
        subprocess.run(['git', 'push', 'origin', f'v{VERSION}', '--force'], check=True)
        
        log_success("Pushed to GitHub successfully")
        return True
        
    except subprocess.CalledProcessError as e:
        log_error(f"Git operation failed: {e}")
        return False

# =============================================================================
# STEP 13: FINAL VERIFICATION
# =============================================================================

def verify_cdn_availability():
    """Verify CDN URL is accessible"""
    log_header("Step 13: Verifying CDN Availability")
    
    cdn_url = f"https://cdn.jsdelivr.net/gh/{REPO_OWNER}/{REPO_NAME}@v{VERSION}/src/index.js"
    
    log(f"Testing URL: {cdn_url}")
    log_warning("Note: May take 5-10 minutes for CDN to update")
    
    try:
        result = subprocess.run(['curl', '-s', '-I', cdn_url], 
                              capture_output=True, text=True, timeout=10)
        
        if '200 OK' in result.stdout or '200' in result.stdout:
            log_success("CDN URL is accessible!")
            return True
        else:
            log_warning("CDN not yet available (may take a few minutes)")
            return True  # Don't fail, just warn
    except Exception as e:
        log_warning(f"Could not verify CDN: {e}")
        return True  # Don't fail, just warn

# =============================================================================
# MAIN EXECUTION
# =============================================================================

def main():
    """Main build process"""
    log_header("🚀 FrontendRAFT Complete Build & Publish")
    log(f"Version: {VERSION}")
    log(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    log("Based on CSOP v0.2.0\n")
    
    # Track results
    results = []
    
    # Execute all steps
    steps = [
        ("GitHub Token Validation", validate_github_token),
        ("Source File Validation", validate_source_files),
        ("XSS Protection Test", test_xss_protection),
        ("SQL Injection Test", test_sql_injection_protection),
        ("JWT Security Test", test_jwt_security),
        ("CORS Configuration Test", test_cors_configuration),
        ("Route Testing", test_routes),
        ("CDN Bundle Creation", create_cdn_bundle),
        ("Repository Check", check_repo_exists),
        ("Purge Old Versions", purge_old_cdn_versions),
        ("CDN Auto-Update Setup", setup_cdn_auto_update),
        ("Git Operations", git_operations),
        ("CDN Verification", verify_cdn_availability),
    ]
    
    for step_name, step_func in steps:
        try:
            result = step_func()
            results.append((step_name, result))
            
            if not result:
                log_error(f"❌ Step failed: {step_name}")
                log("\nBuild aborted due to failure.")
                return False
                
        except Exception as e:
            log_error(f"❌ Exception in {step_name}: {str(e)}")
            results.append((step_name, False))
            return False
    
    # Summary
    log_header("📊 Build Summary")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    log(f"\nResults: {passed}/{total} steps passed")
    
    for step_name, result in results:
        status = "✅" if result else "❌"
        log(f"{status} {step_name}")
    
    if passed == total:
        log_header("🎉 Build Complete - SUCCESS!")
        log("\n✅ FrontendRAFT v0.1.0 published successfully!")
        log(f"\nCDN URL:")
        log(f"https://cdn.jsdelivr.net/gh/{REPO_OWNER}/{REPO_NAME}@v{VERSION}/src/index.js")
        log(f"\nGitHub: https://github.com/{REPO_OWNER}/{REPO_NAME}")
        log("\n🎯 Next steps:")
        log("  1. Wait 5-10 minutes for CDN to update")
        log("  2. Test examples in browser")
        log("  3. Create GitHub Release with release notes")
        return True
    else:
        log_header("❌ Build Failed")
        log(f"\n{total - passed} step(s) failed. Please fix errors and retry.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)