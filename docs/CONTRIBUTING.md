# Contributing to Disaster Response Assistant

Thank you for your interest in contributing to the Disaster Response Assistant! This document provides guidelines and instructions for contributing to the project.

## 🤝 Code of Conduct

By participating in this project, you agree to:
- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on what is best for the community
- Show empathy towards other community members

## 🚀 Getting Started

### Prerequisites

1. **Development Environment**
   - Node.js 18+ and npm/yarn
   - Git
   - For iOS: macOS with Xcode 14+
   - For Android: Android Studio
   - Recommended: VS Code with React Native extensions

2. **Fork and Clone**
   ```bash
   # Fork the repository on GitHub
   # Then clone your fork
   git clone https://github.com/YOUR_USERNAME/gemma-3n.git
   cd gemma-3n
   
   # Add upstream remote
   git remote add upstream https://github.com/ORIGINAL_OWNER/gemma-3n.git
   ```

3. **Install Dependencies**
   ```bash
   npm install
   
   # iOS only
   cd ios && pod install && cd ..
   ```

4. **Set Up Development Build**
   Follow the [RUNNING_GUIDE.md](RUNNING_GUIDE.md) to set up your development environment.

## 📝 Development Workflow

### 1. Create a Feature Branch

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create a new branch
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

#### Code Style Guidelines

- **TypeScript**: Use TypeScript for all new code
- **Formatting**: Run `npm run format` before committing
- **Linting**: Ensure `npm run lint` passes
- **Comments**: Write clear comments for complex logic
- **File Names**: Use camelCase for files, PascalCase for components

#### Component Guidelines

```typescript
// Good component example
interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  isUser, 
  timestamp 
}) => {
  // Component implementation
};
```

### 3. Test Your Changes

#### Running Tests
```bash
# Unit tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

#### Manual Testing
- Test on iOS simulator/device
- Test on Android emulator/device
- Test offline functionality
- Verify voice features work

### 4. Commit Your Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format: <type>(<scope>): <subject>

git commit -m "feat(chat): add voice input indicator"
git commit -m "fix(android): resolve model loading crash"
git commit -m "docs: update API reference"
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions or modifications
- `chore`: Build process or auxiliary tool changes

### 5. Push and Create Pull Request

```bash
# Push your branch
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:
- Clear title following commit convention
- Description of changes
- Screenshots/videos if UI changes
- Testing steps
- Related issue numbers

## 🏗️ Project Structure

```
gemma-3n/
├── app/                    # Application source code
│   ├── components/        # Reusable components
│   ├── screens/          # Screen components
│   ├── services/         # Business logic services
│   ├── hooks/           # Custom React hooks
│   └── data/            # Static data and types
├── assets/               # Images and models
├── scripts/             # Build and deployment scripts
└── docs/                # Documentation
```

## 🧪 Testing Guidelines

### Unit Tests
- Test services and utilities
- Mock external dependencies
- Aim for >80% coverage

### Integration Tests
- Test complete user flows
- Verify AI model integration
- Test offline scenarios

### Performance Tests
- Model loading time < 5s
- Response time < 2s
- Memory usage monitoring

## 📚 Areas for Contribution

### High Priority
- [ ] Text-to-speech implementation
- [ ] Multi-language support
- [ ] Performance optimizations
- [ ] Additional disaster scenarios

### Good First Issues
- [ ] Improve error messages
- [ ] Add loading animations
- [ ] Enhance UI accessibility
- [ ] Documentation improvements

### Advanced
- [ ] Model quantization research
- [ ] Peer-to-peer communication
- [ ] Offline maps integration
- [ ] Custom model training

## 🔧 Development Tips

### Working with AI Models

1. **Model Files**
   - Don't commit model files (use .gitignore)
   - Document model sources
   - Test with smaller models first

2. **Memory Management**
   - Monitor memory usage
   - Implement proper cleanup
   - Test on low-end devices

### Platform-Specific Development

#### iOS
- Use Xcode for debugging
- Test on various iPhone models
- Verify permissions handling

#### Android
- Use Android Studio for debugging
- Test on different API levels
- Check ProGuard rules

## 📖 Documentation

When adding new features:
1. Update relevant .md files
2. Add inline code comments
3. Update API_REFERENCE.md if adding new components
4. Include examples in documentation

## 🐛 Reporting Issues

### Before Creating an Issue
- Search existing issues
- Try latest version
- Check documentation

### Issue Template
```markdown
**Description**
Clear description of the issue

**Steps to Reproduce**
1. Step one
2. Step two
3. ...

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- Platform: iOS/Android
- Device: iPhone 14/Pixel 5
- OS Version: iOS 16/Android 13
- App Version: 1.0.0
```

## 💬 Getting Help

- **Discord**: [Join our server](https://discord.gg/example)
- **Discussions**: Use GitHub Discussions
- **Email**: contributors@example.com

## 🎉 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Given credit in the app

Thank you for helping make disaster response technology accessible to everyone! 🙏