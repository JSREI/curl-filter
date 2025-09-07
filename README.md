# cURL Filter

[中文文档](README.zh-CN.md) | English

A powerful web-based tool for filtering and editing cURL commands with configurable rules. Perfect for cleaning up cURL commands copied from browser developer tools before importing them into external systems.

## 🚀 Live Demo

Visit: [https://jsrei.github.io/curl-filter/](https://jsrei.github.io/curl-filter/)

## 🎯 Problem Solved

When you copy a request as cURL from Chrome DevTools (or other browsers), it includes many default headers and parameters that you might not need:

- Unnecessary headers like `User-Agent`, `Accept-Language`, `Accept-Encoding`, etc.
- Browser-specific headers like `sec-ch-ua`, `sec-fetch-*` headers
- Authentication cookies that shouldn't be shared
- Redundant query parameters

This tool helps you clean up these cURL commands by applying configurable filtering rules.

## 🔧 Use Cases

- **API Testing Tools**: Clean cURL commands before importing into Postman, Apifox, Insomnia
- **Coze Plugin Development**: Prepare clean API requests for plugin configuration
- **Documentation**: Generate clean cURL examples for API documentation
- **Security**: Remove sensitive headers and cookies from shared cURL commands
- **Automation**: Standardize cURL commands for scripts and CI/CD pipelines

## ✨ Features

- **Smart Filtering**: Remove unwanted headers, query parameters, and form data
- **Configurable Rules**: Create custom filtering rules with regex patterns
- **Real-time Preview**: See filtering results as you type
- **History Management**: Keep track of your filtering history
- **Export/Import**: Save and share your filtering rules
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Installation

### Prerequisites

- Node.js 18+
- npm or yarn

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/JSREI/curl-filter.git
cd curl-filter
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
# or use the provided script
./start.sh
```

4. Open your browser and visit `http://localhost:25519`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 📖 Usage

1. **Paste cURL Command**: Copy a cURL command from your browser's developer tools and paste it into the input field.

2. **Configure Rules**: Click "Rule Management" to set up filtering rules:
   - Remove specific headers (e.g., `User-Agent`, `Accept-Language`)
   - Filter query parameters
   - Clean form data
   - Remove JSON body fields

3. **Apply Filters**: Click "Apply Filter Rules" to process your cURL command.

4. **Copy Result**: Use the copy button to copy the cleaned cURL command.

### Example

**Before filtering:**
```bash
curl 'https://api.example.com/users?page=1' \
  -H 'accept: application/json' \
  -H 'accept-language: en-US,en;q=0.9,zh-CN;q=0.8' \
  -H 'cache-control: no-cache' \
  -H 'sec-ch-ua: "Chrome";v="120"' \
  -H 'sec-fetch-dest: empty' \
  -H 'user-agent: Mozilla/5.0...'
```

**After filtering:**
```bash
curl 'https://api.example.com/users?page=1' \
  -H 'accept: application/json' \
  -H 'cache-control: no-cache'
```

## 🔧 Configuration

The tool supports various filtering rules:

- **Header Filters**: Remove or modify HTTP headers
- **Query Parameter Filters**: Clean URL parameters
- **Form Data Filters**: Filter form fields
- **JSON Body Filters**: Remove JSON properties
- **Custom Patterns**: Use regex for advanced filtering

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with React, TypeScript, and Vite
- UI components from Material-UI
- Deployed on GitHub Pages

## 📞 Support

If you have any questions or need help, please:

1. Check the [Issues](https://github.com/JSREI/curl-filter/issues) page
2. Create a new issue if your problem isn't already reported
3. Provide detailed information about your use case
