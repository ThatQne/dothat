# Todo List

A beautiful desktop application built with Electron and React to help users organize and plan their exams and tasks.

![Exam Planner Screenshot](./screenshots/app-screenshot.png)

## Features

- Create and manage tasks and subtasks
- Set due dates and times for tasks
- Organize tasks with drag-and-drop reordering
- Mark tasks as important with starring
- Dark and light themes (with additional Nord and Purple Dream themes)
- Task completion tracking
- Receive notifications for upcoming tasks
- Auto-saving capability
- Cross-platform (Windows, macOS, Linux)
- Automatic updates

## Development

### Prerequisites

- Node.js (version 18 or later)
- npm or yarn

### Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/exam-planner.git
cd exam-planner
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

## Packaging the Application

This application uses Electron Forge for packaging and distribution.

### Building for all platforms

```bash
npm run make
```

This will create distributable packages in the `out/make` directory.

### Building for specific platforms

#### Windows

```bash
npm run make -- --platform=win32
```

#### macOS

```bash
npm run make -- --platform=darwin
```

#### Linux

```bash
npm run make -- --platform=linux
```

## Setting Up Auto-Updates

The app includes auto-update capabilities through `electron-updater`, which works with a variety of distribution methods.

### GitHub Releases (Recommended)

1. Create a repository on GitHub for your app
2. Set up your GitHub token:

**Windows (PowerShell):**
```powershell
$env:GH_TOKEN="your_github_token"
```

**Windows (Command Prompt):**
```cmd
set GH_TOKEN=your_github_token
```

**macOS/Linux:**
```bash
export GH_TOKEN=your_github_token
```

3. Update the `repository` field in `package.json` to point to your GitHub repository:

```json
"repository": {
  "type": "git",
  "url": "https://github.com/yourusername/exam-planner.git"
}
```

4. Build and publish:

```bash
npm run publish
```

This will build the app, create a new release on GitHub, and upload the installers.

### Code Signing

For production releases, you should sign your application:

#### Windows

1. Obtain a code signing certificate
2. Set environment variables before publishing:

**Windows (PowerShell):**
```powershell
$env:WIN_CSC_LINK="path/to/certificate.pfx"
$env:WIN_CSC_KEY_PASSWORD="certificate_password"
```

**Windows (Command Prompt):**
```cmd
set WIN_CSC_LINK=path/to/certificate.pfx
set WIN_CSC_KEY_PASSWORD=certificate_password
```

#### macOS

1. Obtain an Apple Developer ID certificate
2. Set environment variables:

**macOS/Linux:**
```bash
export APPLE_ID=your_apple_id@example.com
export APPLE_ID_PASSWORD=your_app_specific_password
export APPLE_TEAM_ID=your_team_id
```

## Setting Up for Each Platform

### Windows

To set environment variables permanently on Windows:

1. Search for "environment variables" in the Start menu
2. Select "Edit the system environment variables"
3. Click "Environment Variables..."
4. Click "New..." under user variables
5. Add the required variables like GH_TOKEN, WIN_CSC_LINK, etc.

### macOS/Linux

To set environment variables permanently on macOS or Linux, add them to your shell profile file:

```bash
echo 'export GH_TOKEN=your_github_token' >> ~/.zshrc  # or ~/.bash_profile
source ~/.zshrc  # or ~/.bash_profile
```

## Release Process

1. Update version in `package.json`
2. Create a changelog entry
3. Commit changes:

```bash
git add .
git commit -m "Release vX.Y.Z"
git tag vX.Y.Z
git push && git push --tags
```

4. Publish the release:

```bash
npm run publish
```

## Troubleshooting

### Auto-Update Issues

- Check logs at:
  - Windows: `%USERPROFILE%\AppData\Roaming\Todo List\logs\main.log`
  - macOS: `~/Library/Logs/Todo List/main.log`
  - Linux: `~/.config/Todo List/logs/main.log`

- Make sure your app is properly signed
- Check GitHub release assets are correctly uploaded
- If you see "export is not recognized", make sure you're using the correct command for your operating system (set for Windows, export for macOS/Linux)

## License

MIT

## Credits

- [Electron](https://www.electronjs.org/)
- [React](https://reactjs.org/)
- [electron-updater](https://www.npmjs.com/package/electron-updater)
- [react-beautiful-dnd](https://github.com/atlassian/react-beautiful-dnd) 