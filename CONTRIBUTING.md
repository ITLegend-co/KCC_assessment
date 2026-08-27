# Contributing to Bouldering Competition Website

First off, thank you for considering contributing to this project! 🎉

## Code of Conduct

By participating in this project, you are expected to uphold our code of conduct: be respectful, inclusive, and constructive.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (screenshots, code snippets, etc.)
- **Describe the behavior you observed and what you expected**
- **Include details about your environment** (OS, browser, Node version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the proposed feature**
- **Explain why this enhancement would be useful**
- **Include mockups or examples if applicable**

### Pull Requests

1. **Fork the repository** and create your branch from `main`
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes**
   - Write clear, commented code
   - Follow the existing code style
   - Add tests if applicable

3. **Test your changes thoroughly**
   - Run the development server
   - Test on mobile and desktop
   - Check all existing features still work

4. **Commit your changes**
   ```bash
   git commit -m "Add some amazing feature"
   ```
   
   Use clear commit messages:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `style:` for formatting changes
   - `refactor:` for code refactoring
   - `test:` for adding tests
   - `chore:` for maintenance tasks

5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   - Provide a clear description of the changes
   - Reference any related issues
   - Include screenshots for UI changes

## Development Setup

1. Clone your fork:
   ```bash
   git clone https://github.com/your-username/bouldering-competition.git
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create `.env` file with your Firebase credentials

4. Start development server:
   ```bash
   pnpm dev
   ```

## Coding Standards

- **TypeScript**: Use TypeScript for type safety
- **Components**: Keep components focused and reusable
- **Naming**: Use clear, descriptive names (camelCase for variables, PascalCase for components)
- **Comments**: Add comments for complex logic
- **Formatting**: Code will be formatted automatically

## Project Structure Guidelines

- **Components**: Reusable UI components go in `/src/app/components`
- **Pages**: Main page components go in `/src/app/pages`
- **Utilities**: Helper functions go in `/src/app/lib`
- **Styles**: Global styles in `/src/styles`

## Testing Guidelines

When adding new features:
- Test on both mobile and desktop viewports
- Test with empty data states
- Test with large amounts of data
- Verify Firebase sync works correctly
- Check localStorage fallback

## Questions?

Feel free to open an issue with the `question` label if you have any questions about contributing!

---

Thank you for contributing! 🧗‍♂️
