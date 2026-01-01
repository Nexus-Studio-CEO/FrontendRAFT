# 🤝 Contributing to FrontendRAFT

Thank you for your interest in contributing to FrontendRAFT! This document provides guidelines and instructions for contributing.

---

## 📋 Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [How to Contribute](#how-to-contribute)
5. [Coding Standards](#coding-standards)
6. [Testing Guidelines](#testing-guidelines)
7. [Documentation](#documentation)
8. [Community](#community)

---

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive experience for everyone, regardless of:
- Gender, gender identity, or expression
- Sexual orientation
- Disability
- Physical appearance
- Race or ethnicity
- Age
- Religion or belief
- Experience level

### Expected Behavior

- **Be respectful** of differing viewpoints and experiences
- **Be collaborative** and helpful to others
- **Be constructive** in feedback and criticism
- **Be patient** with newcomers

### Unacceptable Behavior

- Harassment or discriminatory language
- Personal attacks or trolling
- Publishing others' private information
- Inappropriate sexual attention

**Enforcement:** Violations may result in temporary or permanent ban from the project.

---

## 🚀 Getting Started

### Prerequisites

- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+)
- Basic knowledge of HTML, CSS, JavaScript
- Git for version control

### First Contribution Ideas

- 🐛 **Fix a bug** from [Issues](https://github.com/Nexus-Studio-CEO/FrontendRAFT/issues)
- 📝 **Improve documentation** (typos, clarifications)
- ✨ **Add examples** to showcase features
- 🌍 **Translate** docs to your language
- 🎨 **Enhance UI/UX** in the platform

---

## 💻 Development Setup

### 1. Fork and Clone

```bash
# Fork on GitHub, then:
git clone https://github.com/YOUR_USERNAME/FrontendRAFT.git
cd FrontendRAFT
```

### 2. Open in Browser

```bash
# Simple way
open index.html

# Or use live server
npx live-server
```

### 3. Make Changes

```bash
# Create feature branch
git checkout -b feature/amazing-feature

# Make your changes
# Edit files in assets/, docs/, etc.

# Test thoroughly
open index.html
```

### 4. Commit

```bash
git add .
git commit -m "feat: add amazing feature"

# Follow conventional commits:
# feat: new feature
# fix: bug fix
# docs: documentation
# style: formatting
# refactor: code restructuring
# test: adding tests
# chore: maintenance
```

### 5. Push and PR

```bash
git push origin feature/amazing-feature

# Then open Pull Request on GitHub
```

---

## 🛠️ How to Contribute

### Types of Contributions

#### 1. Bug Reports

**Template:**
```markdown
**Bug Description:**
Clear description of the bug

**Steps to Reproduce:**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Environment:**
- Browser: Chrome 120
- OS: macOS 14
- RAFT Version: 0.1.0

**Screenshots:**
If applicable
```

#### 2. Feature Requests

**Template:**
```markdown
**Feature Name:**
Brief title

**Problem Statement:**
What problem does this solve?

**Proposed Solution:**
How would it work?

**Alternatives Considered:**
Other approaches

**Impact:**
Who benefits? How much?
```

#### 3. Code Contributions

**Checklist before submitting PR:**
- [ ] Code follows project style
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Commits follow conventional format
- [ ] PR description is clear

#### 4. Documentation

**Areas to improve:**
- API references
- Tutorials and guides
- Code examples
- Troubleshooting
- Translations

---

## 📐 Coding Standards

### JavaScript Style

```javascript
// ✅ GOOD
class MyClass {
    constructor() {
        this.value = 0;
    }
    
    async myMethod(param) {
        const result = await someAsyncOp();
        return result;
    }
}

// ❌ BAD
function myFunction(x){
    var y=x+1
    return y
}
```

**Rules:**
- Use `const`/`let`, not `var`
- Prefer arrow functions for callbacks
- Use async/await over promises
- 4 spaces indentation
- Semicolons required
- Single quotes for strings

### File Organization

```
assets/
├── core/           # Core RAFT features
│   ├── streaming.js
│   ├── caching.js
│   └── ...
├── platform/       # UI and platform logic
│   ├── api-builder.js
│   └── ...
└── utils/          # Helper functions
    ├── helpers.js
    └── validation.js
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| **Files** | kebab-case | `api-builder.js` |
| **Classes** | PascalCase | `StreamManager` |
| **Functions** | camelCase | `createStream()` |
| **Constants** | UPPER_SNAKE | `MAX_RETRIES` |
| **Private** | _prefix | `_internalMethod()` |

### Comments

```javascript
/**
 * FrontendRAFT - Component Name
 * 
 * Brief description
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author Your Name
 * @version 0.1.0
 * @date December 28, 2025
 */

/**
 * Public method description
 * @param {string} param - Parameter description
 * @returns {Promise<object>} Return description
 */
async function myMethod(param) {
    // Implementation
}
```

---

## 🧪 Testing Guidelines

### Manual Testing

**Checklist:**
- [ ] Feature works in Chrome
- [ ] Feature works in Firefox
- [ ] Feature works in Safari
- [ ] Mobile responsive (360px width)
- [ ] No console errors
- [ ] IndexedDB data persists
- [ ] Logs display correctly

### Test Scenarios

1. **Create API**
   - Add endpoints
   - Save project
   - Reload page (data persists?)

2. **Deploy API**
   - Click deploy
   - Copy API URL
   - Test endpoints

3. **Logs**
   - Actions logged correctly
   - Filters work
   - Export works

### Performance Testing

```javascript
// Measure performance
const timer = Logger.time('Operation Name');
// ... your code ...
timer.end(); // Logs duration
```

**Targets:**
- Initial load < 1s
- Interaction < 100ms
- Cache hit < 10ms

---

## 📚 Documentation

### Documentation Types

1. **Code Documentation**
   - JSDoc comments in code
   - Inline explanations for complex logic

2. **User Documentation**
   - README.md updates
   - Tutorial additions
   - FAQ entries

3. **Protocol Documentation**
   - RAFT_PROTOCOL.md updates
   - Specification changes

### Writing Style

- **Clear and concise**
- **Examples for complex concepts**
- **Beginner-friendly** (avoid jargon)
- **Step-by-step** when applicable

**Template:**
```markdown
## Feature Name

**What it does:** Brief description

**Why it matters:** Problem it solves

**How to use:**
```javascript
// Code example
```

**Common issues:**
- Issue 1: Solution
- Issue 2: Solution
```

---

## 👥 Community

### Communication Channels

- **GitHub Issues:** Bug reports, feature requests
- **GitHub Discussions:** Questions, ideas
- **Email:** nexusstudio100@gmail.com

### Getting Help

**Before asking:**
1. Check existing issues
2. Read documentation
3. Search discussions

**When asking:**
- Provide context
- Include code samples
- Describe what you tried

### Recognition

**Contributors Hall of Fame:**
All contributors will be listed in:
- README.md acknowledgments
- CHANGELOG.md for releases
- GitHub contributors page

---

## 🎯 Priorities (Current Focus)

### High Priority
- 🐛 Bug fixes
- 📝 Documentation improvements
- ✅ Test coverage

### Medium Priority
- ✨ New features
- 🎨 UI enhancements
- 🌍 Translations

### Low Priority
- 🔮 Future roadmap items
- 🧪 Experimental features

---

## ✅ Pull Request Process

### 1. Before Submitting

- [ ] Code is tested
- [ ] Documentation updated
- [ ] Commits are clean
- [ ] Branch is up to date

### 2. PR Description Template

```markdown
## Description
Brief summary of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation
- [ ] Refactoring

## Testing
How was this tested?

## Screenshots
If applicable

## Checklist
- [ ] Code follows style guide
- [ ] Tests pass
- [ ] Documentation updated
```

### 3. Review Process

1. Maintainer reviews code
2. Feedback provided (if needed)
3. Updates made by contributor
4. Approval and merge

**Timeline:** Usually within 3-5 days

---

## 🏆 Recognition

### Contributor Levels

| Level | Criteria | Benefits |
|-------|----------|----------|
| **Contributor** | 1+ merged PR | Listed in README |
| **Regular** | 5+ merged PRs | Early access to features |
| **Core** | 20+ PRs + consistent | Write access to repo |

---

## 📧 Contact

**Project Maintainer:** DAOUDA Abdoul Anzize  
**Email:** nexusstudio100@gmail.com  
**GitHub:** [@Nexus-Studio-CEO](https://github.com/Nexus-Studio-CEO)

---

**Thank you for contributing to FrontendRAFT!** 🚀

Every contribution, no matter how small, makes a difference.