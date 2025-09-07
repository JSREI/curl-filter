# Development Guide

This document provides detailed information for developers who want to contribute to or understand the cURL Filter project.

## 🏗️ Architecture

### Project Structure

```
src/
├── components/           # React components
│   ├── CurlFilter.tsx   # Main application component
│   ├── LanguageSwitcher.tsx
│   ├── GitHubIcon.tsx
│   ├── HistoryManager/  # History management components
│   └── RuleManager/     # Rule management components
├── utils/               # Utility functions
│   ├── curlParser.ts    # cURL command parsing
│   ├── filterEngine.ts  # Rule filtering engine
│   ├── ruleValidation.ts # Rule validation
│   ├── ruleStorage.ts   # Rule persistence
│   ├── ruleTemplates.ts # Pre-built rule templates
│   └── indexedDBStorage.ts # Browser storage
├── types/               # TypeScript type definitions
│   └── filterRules.ts   # Filter rule types
├── i18n/               # Internationalization
│   ├── index.ts        # i18n configuration
│   └── locales/        # Translation files
└── test/               # Test setup and utilities
```

### Key Components

#### CurlFilter (Main Component)
- Manages application state
- Handles user interactions
- Coordinates between different modules
- Implements keyboard shortcuts

#### FilterEngine
- Core filtering logic
- Rule application and prioritization
- Pattern matching (exact, regex, contains, etc.)
- Context-aware filtering

#### RuleManager
- Rule CRUD operations
- Rule validation
- Template management
- Import/export functionality

#### HistoryManager
- Persistent storage of filtering history
- Search and filtering capabilities
- Favorites and tagging system

## 🔧 Development Setup

### Prerequisites

- Node.js 18+ (recommended: 20+)
- npm or yarn
- Modern browser with ES2020+ support

### Installation

```bash
# Clone the repository
git clone https://github.com/JSREI/curl-filter.git
cd curl-filter

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

```bash
# Development
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:ui      # Run tests with UI

# Code Quality
npm run lint         # Run ESLint
```

## 🧪 Testing

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

### Testing Guidelines

1. **Unit Tests**: Test individual functions and components
2. **Integration Tests**: Test component interactions
3. **User Flow Tests**: Test complete user scenarios

### Running Tests

```bash
# Run all tests
npm run test:run

# Run tests with coverage
npm run test:run -- --coverage

# Run specific test file
npm run test:run src/utils/__tests__/curlParser.test.ts
```

## 🎨 Code Style

### TypeScript Guidelines

- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use proper generic constraints
- Avoid `any` type (use `unknown` instead)

### React Guidelines

- Use functional components with hooks
- Implement proper error boundaries
- Use `useCallback` and `useMemo` for performance
- Follow React best practices for state management

### Code Organization

- Group related functionality in modules
- Use barrel exports for clean imports
- Implement proper separation of concerns
- Follow single responsibility principle

## 🌐 Internationalization

### Adding New Languages

1. Create translation file in `src/i18n/locales/`
2. Add language to resources in `src/i18n/index.ts`
3. Update language switcher in `src/components/LanguageSwitcher.tsx`

### Translation Keys

Follow the nested structure:
```json
{
  "app": {
    "title": "Application Title"
  },
  "buttons": {
    "save": "Save",
    "cancel": "Cancel"
  }
}
```

## 🚀 Deployment

### GitHub Pages Deployment

The project is automatically deployed to GitHub Pages using GitHub Actions:

1. Push to `main` branch triggers deployment
2. Build process runs tests and creates production build
3. Artifacts are deployed to `gh-pages` branch
4. Site is available at `https://jsrei.github.io/curl-filter/`

### Manual Deployment

```bash
# Build for production
npm run build

# Deploy to your hosting service
# Upload contents of `dist/` directory
```

### Environment Configuration

- **Development**: `http://localhost:25519`
- **Production**: `https://jsrei.github.io/curl-filter/`

## 🔍 Debugging

### Browser DevTools

1. Enable source maps in production builds
2. Use React Developer Tools extension
3. Monitor network requests and storage

### Common Issues

1. **Build Errors**: Check TypeScript configuration
2. **Runtime Errors**: Check browser console
3. **Performance Issues**: Use React Profiler

## 📦 Dependencies

### Core Dependencies

- **React 19**: UI framework
- **TypeScript**: Type safety
- **Material-UI**: Component library
- **i18next**: Internationalization
- **Vite**: Build tool

### Development Dependencies

- **Vitest**: Testing framework
- **ESLint**: Code linting
- **@testing-library**: Testing utilities

## 🤝 Contributing

### Pull Request Process

1. Fork the repository
2. Create feature branch from `main`
3. Make changes with proper tests
4. Update documentation if needed
5. Submit pull request with clear description

### Code Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No breaking changes (or properly documented)
- [ ] Performance impact is considered

## 📈 Performance Considerations

### Optimization Strategies

1. **Code Splitting**: Use dynamic imports for large components
2. **Memoization**: Use React.memo, useMemo, useCallback appropriately
3. **Bundle Analysis**: Monitor bundle size and dependencies
4. **Lazy Loading**: Load components and data on demand

### Monitoring

- Bundle size analysis with Vite
- Runtime performance with React Profiler
- Memory usage monitoring in DevTools

## 🔒 Security

### Best Practices

1. **Input Validation**: Sanitize all user inputs
2. **XSS Prevention**: Use proper escaping
3. **Storage Security**: Don't store sensitive data in localStorage
4. **Dependency Updates**: Keep dependencies up to date

### Security Considerations

- All data processing happens client-side
- No server-side data transmission
- Local storage for user preferences only
- No external API calls with user data
