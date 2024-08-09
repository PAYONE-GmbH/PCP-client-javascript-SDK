# Contributing to the PAYONE Commerce Platform Client JavaScript SDK

Thank you for considering contributing to the PAYONE Commerce Platform Client JavaScript SDK! We appreciate your efforts to help improve this project. Below are guidelines for contributing.

## How to Contribute

### Pull Requests

We welcome pull requests! Please follow these steps to submit one:

1. **Fork** the repository and create your branch from `master`.
2. **Install** any dependencies and ensure the project builds and passes tests.

   ```bash
   npm install
   ```

3. **Develop** your changes in Typescript.
4. **Test** your changes thoroughly.
   ```bash
   npm run test
   ```
5. **Write** clear, concise, and self-explanatory commit messages.
6. **Open** a pull request with a clear title and description of what your change does.
7. **Ensure** your pull request follows the [style guides](#style-guides).

### Reporting Bugs

If you encounter any bugs, please report them using one of the following methods:

1. **Issue Tracker**: Submit an issue through our [issues tracker](https://github.com/PAYONE-GmbH/PCP-client-javascript-SDK/issues/new).
2. **Security Issues**: For security-related issues, please contact our IT support via email at tech.support@payone.com with a clear subject line indicating that it is a security issue. This ensures that the issue will be visible to and handled by the PAYONE tech support team.

## Style Guides

### Git Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/) for our commit messages. See the whole specification [here](https://www.conventionalcommits.org/en/v1.0.0/#specification).

### TypeScript

- Follow the [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) for best practices.
- Ensure type definitions are clear and comprehensive.
- We are using `strict` mode in `tsconfig.json` to enforce type safety:
  ```json
  {
    "compilerOptions": {
      "strict": true,
      ...
    }
  }
  ```

### Code Style

- Follow the project's existing code style.
- Use tools like [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/) to maintain code quality and consistency.
- Ensure your editor/IDE is configured to follow the project's coding standards.

### Testing

- Write unit tests using [Vitest](https://vitest.dev/).
- Ensure new features and bug fixes are covered by tests.
- Run the test suite to confirm all tests pass before submitting your pull request.

Thank you for your contributions!
