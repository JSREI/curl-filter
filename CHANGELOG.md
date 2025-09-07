# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive test suite with 52+ test cases
- Input validation with real-time feedback
- Quick start example functionality
- Keyboard shortcuts for common actions (Ctrl+Enter, Ctrl+K, Ctrl+M)
- Enhanced tooltips with keyboard shortcut hints
- Better empty state guidance with direct action buttons
- Multi-language support improvements (zh-CN, zh-TW variants)
- Comprehensive documentation (DEVELOPMENT.md, API.md)
- Enhanced GitHub Actions workflow with testing

### Improved
- User experience with better visual feedback
- Error handling and validation messages
- Code quality with ESLint fixes (reduced from 34 to 19 warnings)
- Type safety with proper TypeScript types
- Performance optimizations with proper memoization
- Accessibility with better ARIA labels and keyboard navigation

### Fixed
- MUI language selection warnings
- TypeScript compilation errors
- ESLint warnings and code quality issues
- Input validation edge cases
- Button state management and tooltips

## [1.0.0] - 2024-01-01

### Added
- Initial release of cURL Filter tool
- Core filtering functionality for headers, query parameters, form data, and JSON body
- Rule management system with CRUD operations
- History management with persistent storage
- Export/import functionality for rules
- Multi-language support (English and Chinese)
- Responsive design for desktop and mobile
- Real-time preview functionality
- Rule templates for common use cases

### Features
- **Smart Filtering**: Remove unwanted headers, query parameters, and form data
- **Configurable Rules**: Create custom filtering rules with regex patterns
- **Real-time Preview**: See filtering results as you type
- **History Management**: Keep track of your filtering history
- **Export/Import**: Save and share your filtering rules
- **Responsive Design**: Works on desktop and mobile devices

### Technical
- Built with React 19 and TypeScript
- Material-UI for consistent design
- Vite for fast development and building
- IndexedDB for client-side storage
- i18next for internationalization
- Comprehensive test coverage with Vitest

### Deployment
- GitHub Pages deployment with automated CI/CD
- Progressive Web App capabilities
- Offline functionality support

---

## Release Notes

### Version 1.0.0 - Initial Release

This is the first stable release of the cURL Filter tool. The application provides a comprehensive solution for cleaning and filtering cURL commands copied from browser developer tools.

#### Key Features:
1. **Intelligent Parsing**: Accurately parses complex cURL commands with multiple headers, data, and options
2. **Flexible Filtering**: Support for multiple filter types (delete, keep, delete_all, keep_all)
3. **Pattern Matching**: Various matching modes including exact, contains, starts_with, ends_with, and regex
4. **User-Friendly Interface**: Clean, intuitive interface with real-time feedback
5. **Persistent Storage**: Rules and history are saved locally using IndexedDB
6. **Internationalization**: Full support for English and Chinese languages

#### Technical Highlights:
- **Modern Stack**: React 19, TypeScript, Material-UI, Vite
- **Type Safety**: Comprehensive TypeScript coverage with strict configuration
- **Testing**: Extensive test suite covering core functionality
- **Performance**: Optimized with proper memoization and debouncing
- **Accessibility**: WCAG compliant with proper ARIA labels
- **PWA Ready**: Service worker support for offline functionality

#### Browser Support:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

#### Known Limitations:
- Client-side only (no server-side processing)
- Limited to cURL command format
- No support for binary data filtering

### Upgrade Guide

This is the initial release, so no upgrade is necessary.

### Breaking Changes

None for initial release.

### Migration Guide

Not applicable for initial release.

---

## Development

### Contributing

We welcome contributions! Please see our [Development Guide](DEVELOPMENT.md) for details on:
- Setting up the development environment
- Running tests
- Code style guidelines
- Submitting pull requests

### Reporting Issues

Please report issues on our [GitHub Issues](https://github.com/JSREI/curl-filter/issues) page with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Browser and version information
- Sample cURL command (if applicable)

### Feature Requests

Feature requests are welcome! Please provide:
- Clear description of the feature
- Use case and benefits
- Proposed implementation (if any)
- Willingness to contribute

---

## Acknowledgments

- Thanks to all contributors who helped make this project possible
- Inspired by the need to clean up cURL commands from browser developer tools
- Built with love for the developer community

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
