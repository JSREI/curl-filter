# Contributing to cURL Filter

Thank you for your interest in contributing to cURL Filter! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues

Before creating an issue, please:

1. **Search existing issues** to avoid duplicates
2. **Use the issue template** if available
3. **Provide clear information**:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser and version information
   - Sample cURL command (if applicable)

### Suggesting Features

We welcome feature suggestions! Please:

1. **Check existing feature requests** first
2. **Describe the use case** clearly
3. **Explain the benefits** to users
4. **Consider implementation complexity**
5. **Be willing to help** with implementation

### Code Contributions

#### Getting Started

1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/curl-filter.git
   cd curl-filter
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Start development server**:
   ```bash
   npm run dev
   ```

#### Development Workflow

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Make your changes**
3. **Write/update tests**
4. **Run tests**:
   ```bash
   npm run test:run
   ```
5. **Run linting**:
   ```bash
   npm run lint
   ```
6. **Commit your changes**:
   ```bash
   git commit -m "feat: add your feature description"
   ```
7. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
8. **Create a Pull Request**

## 📋 Pull Request Guidelines

### Before Submitting

- [ ] Code follows the project's style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated (if needed)
- [ ] No breaking changes (or properly documented)
- [ ] Commit messages follow conventional format

### PR Description

Please include:

1. **Summary** of changes
2. **Motivation** for the changes
3. **Testing** performed
4. **Screenshots** (for UI changes)
5. **Breaking changes** (if any)

### Review Process

1. **Automated checks** must pass (tests, linting, build)
2. **Code review** by maintainers
3. **Address feedback** if requested
4. **Merge** after approval

## 🎨 Code Style Guidelines

### TypeScript

- Use **strict TypeScript** configuration
- Prefer **interfaces** over types for object shapes
- Use **proper generic constraints**
- Avoid `any` type (use `unknown` instead)
- Document complex types with JSDoc

### React

- Use **functional components** with hooks
- Implement **proper error boundaries**
- Use `useCallback` and `useMemo` for performance
- Follow **React best practices** for state management
- Use **proper prop types** and default values

### Code Organization

- **Group related functionality** in modules
- Use **barrel exports** for clean imports
- Implement **proper separation of concerns**
- Follow **single responsibility principle**
- Keep **functions small and focused**

### Naming Conventions

- **camelCase** for variables and functions
- **PascalCase** for components and types
- **UPPER_SNAKE_CASE** for constants
- **kebab-case** for file names
- **Descriptive names** over short names

## 🧪 Testing Guidelines

### Test Structure

```
src/
├── components/
│   └── __tests__/          # Component tests
├── utils/
│   └── __tests__/          # Utility function tests
└── test/
    └── setup.ts            # Test configuration
```

### Writing Tests

1. **Unit Tests**: Test individual functions and components
2. **Integration Tests**: Test component interactions
3. **User Flow Tests**: Test complete user scenarios

### Test Requirements

- **All new features** must have tests
- **Bug fixes** should include regression tests
- **Maintain or improve** test coverage
- **Use descriptive test names**
- **Test edge cases** and error conditions

### Running Tests

```bash
# Run all tests
npm run test:run

# Run tests in watch mode
npm run test

# Run tests with coverage
npm run test:run -- --coverage

# Run specific test file
npm run test:run src/utils/__tests__/curlParser.test.ts
```

## 🌐 Internationalization

### Adding Translations

1. **Add translation keys** to `src/i18n/locales/`
2. **Update all language files** consistently
3. **Use nested structure** for organization
4. **Test with different languages**

### Translation Guidelines

- **Use clear, concise language**
- **Consider cultural differences**
- **Maintain consistent terminology**
- **Test UI layout** with longer translations

## 📚 Documentation

### Code Documentation

- **Document complex functions** with JSDoc
- **Explain non-obvious logic**
- **Include usage examples**
- **Keep comments up to date**

### User Documentation

- **Update README** for new features
- **Add examples** for complex functionality
- **Include screenshots** for UI changes
- **Maintain API documentation**

## 🚀 Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] Git tag created
- [ ] GitHub release created

## 🔒 Security

### Reporting Security Issues

Please **DO NOT** create public issues for security vulnerabilities. Instead:

1. **Email** security concerns to the maintainers
2. **Provide detailed information** about the vulnerability
3. **Allow time** for the issue to be addressed
4. **Coordinate disclosure** timing

### Security Guidelines

- **Validate all inputs** from users
- **Sanitize data** before processing
- **Use secure coding practices**
- **Keep dependencies updated**
- **Follow OWASP guidelines**

## 💬 Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Pull Requests**: Code contributions and reviews

### Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please:

- **Be respectful** and professional
- **Welcome newcomers** and help them learn
- **Focus on constructive feedback**
- **Respect different viewpoints**
- **Report inappropriate behavior**

## 🎯 Development Priorities

### Current Focus Areas

1. **Performance optimization**
2. **Accessibility improvements**
3. **Mobile experience**
4. **Advanced filtering features**
5. **Integration capabilities**

### Future Roadmap

- **Plugin system** for custom filters
- **Cloud sync** for rules and history
- **Team collaboration** features
- **API integration** capabilities
- **Advanced analytics**

## 📞 Getting Help

### Resources

- **Documentation**: README.md, DEVELOPMENT.md, API.md
- **Examples**: Check the test files for usage examples
- **Issues**: Search existing issues for solutions

### Contact

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and ideas
- **Email**: For security issues and private matters

---

Thank you for contributing to cURL Filter! Your contributions help make this tool better for everyone. 🙏
