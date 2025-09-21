# Contributing

## Commit Message Format

This project uses [Conventional Commits](https://www.conventionalcommits.org/) to standardize commit messages.

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, etc.)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools and libraries
- **ci**: Changes to CI configuration files and scripts
- **perf**: A code change that improves performance
- **build**: Changes that affect the build system or external dependencies
- **revert**: Reverts a previous commit

### Examples

```bash
feat: add prefer-arrow-functions rule
fix: resolve false positives in no-dynamic-tailwind-classes
docs: update README with installation instructions
test: add test cases for vue prefer-to-value rule
chore: update dependencies
```

### Rules

- Use sentence case for the description (first letter capitalized)
- Maximum 72 characters for the description
- Maximum 100 characters per line in body and footer
- Use present tense ("add" not "added")
- Be descriptive but concise

### Testing Commit Messages

You can test your commit messages using:

```bash
npm run commitlint
```

The commit-msg hook will automatically validate your commit messages when you commit.