# Contributing to FrontendRAFT

Thank you for your interest in contributing to FrontendRAFT! This document provides guidelines and instructions for contributing.

---

## 📋 Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Contribution Guidelines](#contribution-guidelines)
5. [Pull Request Process](#pull-request-process)
6. [Coding Standards](#coding-standards)
7. [Testing](#testing)
8. [Documentation](#documentation)

---

## 🤝 Code of Conduct

### Our Pledge

We pledge to make participation in FrontendRAFT a harassment-free experience for everyone, regardless of:
- Age
- Body size
- Disability
- Ethnicity
- Gender identity and expression
- Level of experience
- Nationality
- Personal appearance
- Race
- Religion
- Sexual identity and orientation

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes:**
- Trolling, insulting/derogatory comments, and personal attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate

### Enforcement

Violations may be reported to nexusstudio100@gmail.com. All complaints will be reviewed and investigated promptly and fairly.

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn
- Git
- GitHub account

### Areas to Contribute

- 🐛 **Bug fixes**
- ✨ **New features**
- 📚 **Documentation**
- 🧪 **Tests**
- 🎨 **Examples**
- 🌐 **Translations**
- 🔧 **Tooling**

---

## 💻 Development Setup

### 1. Fork the Repository

Click the "Fork" button on https://github.com/Nexus-Studio-CEO/FrontendRAFT

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/FrontendRAFT.git
cd FrontendRAFT
```

### 3. Add Upstream Remote

```bash
git remote add upstream https://github.com/Nexus-Studio-CEO/FrontendRAFT.git
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

### 6. Make Your Changes

Edit files in `src/` directory.

### 7. Build

```bash
npm run build
```

### 8. Test

```bash
npm test
```

### 9. Run Example

```bash
# Open examples/basic-example.html in browser
```

---

## 📝 Contribution Guidelines

### Bug Reports

When filing a bug report, include:

1. **Clear title** describing the issue
2. **Description** of what happened vs. what you expected
3. **Reproduction steps**
   ```
   1. Initialize RAFT with { ... }
   2. Call raft.method()
   3. See error
   ```
4. **Environment**
   - FrontendRAFT version
   - Browser/Node.js version
   - Operating system
5. **Code sample** (minimal reproducible example)
6. **Error messages** (full stack trace)
7. **Screenshots** (if applicable)

### Feature Requests

When suggesting a feature, include:

1. **Clear title** describing the feature
2. **Problem** you're trying to solve
3. **Proposed solution** with code examples
4. **Alternatives considered**
5. **Use cases** (when would this be used?)
6. **Breaking changes** (if any)

### Security Issues

**DO NOT** file public issues for security vulnerabilities.

Instead, email nexusstudio100@gmail.com with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

---

## 🔄 Pull Request Process

### Before Submitting

- ✅ Code follows [coding standards](#coding-standards)
- ✅ Tests pass (`npm test`)
- ✅ Build succeeds (`npm run build`)
- ✅ Documentation updated (if needed)
- ✅ CHANGELOG.md updated
- ✅ Commit messages are clear

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How did you test this?

## Checklist
- [ ] Tests pass
- [ ] Build succeeds
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
```

### Review Process

1. **Automated checks** run (tests, linting)
2. **Maintainer review** (1-3 days)
3. **Feedback** (if needed)
4. **Approval** and merge

### After Merge

1. Delete your branch
2. Sync your fork
   ```bash
   git checkout main
   git pull upstream main
   git push origin main
   ```

---

## 📐 Coding Standards

### File Structure

```
src/
├── core/           # Core components
├── plugins/        # Framework integrations
├── utils/          # Utility functions
├── types/          # Type definitions
└── index.js        # Main export
```

### Naming Conventions

**Files:**
- PascalCase for classes: `CacheLayer.js`
- camelCase for utilities: `validation.js`

**Variables:**
- camelCase: `userToken`, `apiResponse`
- UPPER_CASE for constants: `MAX_SIZE`, `DEFAULT_TTL`

**Functions:**
- camelCase: `getUserData()`, `validateToken()`
- Descriptive names: `parseQueryString()` not `parse()`

**Classes:**
- PascalCase: `FrontendRAFT`, `StorageLayer`

### Code Style

**JavaScript:**
```javascript
// ✅ Good
async function fetchUser(userId) {
  if (!userId) {
    throw new Error('User ID required');
  }
  
  const user = await storage.get(`user:${userId}`);
  return user;
}

// ❌ Bad
async function fetchUser(id) {
  if(!id) throw new Error('User ID required')
  let user=await storage.get('user:'+id)
  return user
}
```

**Comments:**
```javascript
// ✅ Good: Explain WHY, not WHAT
// Cache result to avoid redundant API calls
const cached = await cache.get(key);

// ❌ Bad: Obvious comment
// Get value from cache
const cached = await cache.get(key);
```

**Async/Await:**
```javascript
// ✅ Prefer async/await
async function doWork() {
  const result = await asyncOperation();
  return result;
}

// ⚠️ Use promises only when necessary
function doWork() {
  return asyncOperation().then(result => result);
}
```

**Error Handling:**
```javascript
// ✅ Always use try/catch
try {
  const data = await fetchData();
  return data;
} catch (error) {
  throw new Error(`Failed to fetch data: ${error.message}`);
}

// ❌ Don't swallow errors
try {
  const data = await fetchData();
} catch (error) {
  // Nothing
}
```

---

## 🧪 Testing

### Running Tests

```bash
# All tests
npm test

# Specific test
npm test -- --grep "CacheLayer"

# With coverage
npm test -- --coverage
```

### Writing Tests

```javascript
describe('CacheLayer', () => {
  let cache;
  
  beforeEach(() => {
    cache = new CacheLayer({ strategy: 'lru', maxSize: 3 });
  });
  
  it('should store and retrieve values', () => {
    cache.set('key1', 'value1');
    const result = cache.get('key1');
    expect(result).toBe('value1');
  });
  
  it('should evict LRU item when full', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');
    cache.set('key4', 'value4'); // Evicts key1
    
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key4')).toBe('value4');
  });
});
```

### Test Coverage

- Aim for **80%+ coverage**
- 100% coverage for critical paths
- Include edge cases and error scenarios

---

## 📚 Documentation

### Code Documentation

**JSDoc for public APIs:**
```javascript
/**
 * Executes a task with caching
 * 
 * @param {string} key - Cache key
 * @param {Function} fetcher - Async function to fetch data
 * @param {number} [ttl] - Time to live in milliseconds
 * @returns {Promise<*>} Cached or fetched result
 * 
 * @example
 * const data = await raft.executeWithCache(
 *   'users',
 *   async () => fetch('/api/users'),
 *   60000
 * );
 */
async executeWithCache(key, fetcher, ttl) {
  // Implementation
}
```

### README Updates

When adding features, update:
- docs/README.md
- docs/RAFT_PROTOCOL.md (if protocol changes)
- examples/ (add example if applicable)

### CHANGELOG

Follow [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
## [0.2.0] - 2026-03-15

### Added
- Predictive prefetching feature
- Row-level security

### Changed
- Improved cache performance by 30%

### Fixed
- Bug in optimistic update rollback

### Deprecated
- Old auth method (use JWT instead)
```

---

## 🏆 Recognition

Contributors will be:
- Listed in README.md
- Mentioned in release notes
- Added to CONTRIBUTORS.md

Top contributors may be invited to become maintainers.

---

## 📞 Questions?

- **GitHub Discussions:** Ask questions
- **Email:** nexusstudio100@gmail.com
- **Documentation:** Read docs/ folder

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to FrontendRAFT!** 🚀

Created by DAOUDA Abdoul Anzize (Nexus Studio)  
Inspired by CSOP