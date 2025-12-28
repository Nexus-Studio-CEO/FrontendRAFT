# 🤝 Contributing to FrontendRAFT

Thank you for your interest in contributing! This guide will help you get started.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Community](#community)

---

## 📜 Code of Conduct

### Our Pledge

We pledge to make participation in FrontendRAFT a harassment-free experience for everyone, regardless of:
- Age, body size, disability
- Ethnicity, gender identity and expression
- Level of experience, education
- Nationality, personal appearance, race
- Religion, sexual identity and orientation

### Our Standards

**Positive behavior:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other members

**Unacceptable behavior:**
- Trolling, insulting/derogatory comments
- Public or private harassment
- Publishing others' private information
- Other conduct which could reasonably be considered inappropriate

### Enforcement

Violations can be reported to: nexusstudio100@gmail.com

---

## 🎯 How to Contribute

### Ways to Contribute

1. **Report Bugs** - Help us identify issues
2. **Suggest Features** - Share your ideas
3. **Improve Documentation** - Fix typos, add examples
4. **Write Code** - Fix bugs, add features
5. **Create Examples** - Show what RAFT can do
6. **Help Others** - Answer questions in Discussions

---

## 🛠️ Development Setup

### Prerequisites

- Git
- Modern browser (Chrome, Firefox, Safari, Edge)
- Text editor (VS Code recommended)
- Basic JavaScript knowledge

### Setup Steps

1. **Fork the repository**

```bash
# Visit GitHub and click "Fork"
https://github.com/Nexus-Studio-CEO/FrontendRAFT
```

2. **Clone your fork**

```bash
git clone https://github.com/YOUR_USERNAME/FrontendRAFT.git
cd FrontendRAFT
```

3. **Create a branch**

```bash
git checkout -b feature/my-feature
# or
git checkout -b fix/my-bugfix
```

4. **Make changes**

Edit files in `src/` directory

5. **Test locally**

Open `examples/basic-example.html` in browser

6. **Commit changes**

```bash
git add .
git commit -m "Add: my awesome feature"
```

7. **Push to GitHub**

```bash
git push origin feature/my-feature
```

8. **Create Pull Request**

Visit your fork on GitHub and click "New Pull Request"

---

## 📝 Coding Standards

### File Structure

```
src/
├── core/           # Core functionality
├── plugins/        # Framework integrations
├── utils/          # Utility functions
└── index.js        # Main entry point
```

### Naming Conventions

**Files:**
- Use PascalCase for classes: `AuthLayer.js`
- Use camelCase for utilities: `validation.js`

**Code:**
- Classes: `PascalCase` (e.g., `FrontendRAFT`)
- Functions: `camelCase` (e.g., `validateToken`)
- Constants: `UPPER_CASE` (e.g., `VERSION`)
- Private methods: `_camelCase` (e.g., `_loadCSOP`)

### Code Style

**JavaScript:**
```javascript
// ✅ GOOD
export class MyClass {
  constructor(config) {
    this.config = config;
  }

  async myMethod(param) {
    try {
      const result = await this._helper(param);
      return result;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  _helper(param) {
    // Private helper
    return param.toUpperCase();
  }
}

// ❌ BAD
export class myclass {
  constructor(config){
    this.config=config
  }
  mymethod(param){
    return this.helper(param)
  }
  helper(param){return param.toUpperCase()}
}
```

### Documentation

**All public functions must have JSDoc:**

```javascript
/**
 * Validate email format
 * 
 * @param {string} email Email address
 * @returns {boolean} True if valid
 * 
 * @example
 * if (!validateEmail(email)) throw new Error('Invalid email');
 */
export function validateEmail(email) {
  // Implementation
}
```

### File Headers

**Every file must have this header:**

```javascript
/**
 * FrontendRAFT - [Component Name]
 * 
 * [Brief description]
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */
```

---

## 🧪 Testing

### Manual Testing

1. **Test in browser**

```bash
# Open examples
open examples/basic-example.html
open examples/advanced-example.html
```

2. **Check console**

No errors should appear in browser console

3. **Test all features**

- CRUD operations work
- Caching works
- Streaming works
- Optimistic updates work
- Query language works

### Automated Testing (Coming v0.2.0)

```bash
npm test
```

---

## 🔄 Pull Request Process

### Before Submitting

**Checklist:**
- [ ] Code follows style guidelines
- [ ] All functions have JSDoc comments
- [ ] File headers include CSOP credit
- [ ] Tested in modern browsers
- [ ] No console errors
- [ ] Examples work correctly
- [ ] Documentation updated if needed

### PR Title Format

```
Type: Brief description

Examples:
Add: streaming retry logic
Fix: cache invalidation bug
Docs: improve getting started guide
Refactor: simplify router code
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Refactoring

## Testing
How did you test this?

## Screenshots (if applicable)
Add screenshots

## Checklist
- [ ] Code follows guidelines
- [ ] JSDoc comments added
- [ ] CSOP credit included
- [ ] Tested in browsers
- [ ] Documentation updated
```

### Review Process

1. **Automated checks** - Must pass
2. **Code review** - By maintainer
3. **Testing** - Manual verification
4. **Approval** - Merge when ready

---

## 🎯 Priority Areas

### High Priority

- **Bug fixes** - Always welcome
- **Performance improvements** - Critical
- **Documentation** - Always needed
- **Examples** - Show what's possible

### Medium Priority

- **New features** - Must align with roadmap
- **Tests** - Automated testing needed
- **Tooling** - Developer experience

### Low Priority

- **Refactoring** - Only if significantly better
- **Experimental features** - Discuss first

---

## 💬 Community

### Get Help

- **GitHub Discussions** - Ask questions
- **GitHub Issues** - Report bugs
- **Email** - nexusstudio100@gmail.com
- **Twitter** - @NexusStudioCEO

### Stay Updated

- Watch repository for updates
- Follow on Twitter
- Join discussions

### Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Thanked publicly

---

## 📚 Resources

### Documentation

- [RAFT Protocol](docs/RAFT_PROTOCOL.md)
- [Getting Started](docs/GETTING_STARTED.md)
- [Roadmap](docs/ROADMAP.md)

### Examples

- [Basic Example](examples/basic-example.html)
- [Advanced Example](examples/advanced-example.html)
- [React Example](examples/react-example.html)

### Related Projects

- **CSOP** - https://github.com/Nexus-Studio-CEO/CSOP
- Core protocol powering FrontendRAFT

---

## ❓ FAQ

### Q: Can I contribute if I'm a beginner?

**A:** Yes! Start with documentation, examples, or small bug fixes.

### Q: How long for PR review?

**A:** Usually 2-5 days. Be patient.

### Q: Can I add dependencies?

**A:** No external dependencies allowed (except CSOP). Keep it lightweight.

### Q: Can I change core protocol?

**A:** Discuss first in GitHub Issues. Protocol changes require consensus.

### Q: Do I need to sign CLA?

**A:** No CLA required. MIT License applies.

---

## 🙏 Thank You

Every contribution helps make FrontendRAFT better for everyone.

**Special thanks to all contributors!**

---

**Questions?** Email: nexusstudio100@gmail.com

*Last Updated: December 28, 2025*