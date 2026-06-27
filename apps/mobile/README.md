# Henkanki Mobile

> Mobile application for Henkanki - Local-first file converter for iOS and Android.

## 📱 Features

- Convert files locally on your mobile device
- No internet connection required
- Support for all Henkanki formats
- File picker integration
- Share converted files with other apps
- Camera integration for document scanning

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Capacitor CLI: `npm install -g @capacitor/cli`
- Android Studio (for Android development)
- Xcode (for iOS development)

### Installation

1. Navigate to the mobile app directory:

```bash
cd apps/mobile
```

2. Install dependencies:

```bash
npm install
```

3. Add platforms:

```bash
# For Android
npm run add:android

# For iOS
npm run add:ios
```

4. Sync the project:

```bash
npm run sync
```

5. Open in IDE:

```bash
# For Android Studio
npm run open:android

# For Xcode
npm run open:ios
```

## 📦 Building

### Android

```bash
npm run build
npm run sync
npx cap run android
```

### iOS

```bash
npm run build
npm run sync
npx cap run ios
```

## 📱 App Structure

```
apps/mobile/
├── capacitor.config.json    # Capacitor configuration
├── package.json            # Mobile app dependencies
├── src/
│   └── index.html          # Main HTML file
├── assets/
│   └── icons/              # App icons
└── README.md
```

## 🔧 Configuration

Edit `capacitor.config.json` to customize:

- App ID and name
- Web directory (points to ../web)
- Permissions
- Plugin configuration

## 📲 Mobile-Specific Features

### File System Access

Uses `@capacitor/filesystem` for file operations:

```javascript
import { Filesystem, Directory } from '@capacitor/filesystem';

// Read a file
const contents = await Filesystem.readFile({
  path: 'path/to/file.txt',
  directory: Directory.Documents
});

// Write a file
await Filesystem.writeFile({
  path: 'path/to/output.txt',
  data: 'Hello World',
  directory: Directory.Documents
});
```

### File Picker

Uses `@capacitor-community/file-picker` (install separately):

```javascript
import { FilePicker } from '@capacitor-community/file-picker';

const result = await FilePicker.pickFiles({
  types: ['image/*', 'text/*'],
  multiple: false
});
```

### Sharing Files

Uses `@capacitor/share`:

```javascript
import { Share } from '@capacitor/share';

await Share.share({
  title: 'Converted File',
  text: 'Check out this converted file',
  url: 'file:///path/to/file.txt',
  dialogTitle: 'Share converted file'
});
```

### Camera Integration

Uses `@capacitor/camera` for document scanning:

```javascript
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

const image = await Camera.getPhoto({
  quality: 90,
  allowEditing: false,
  resultType: CameraResultType.Uri,
  source: CameraSource.Camera
});
```

## 📋 Supported Formats

All formats supported by Henkanki core:

- **Text**: JSON, YAML, CSV, Markdown, HTML, XML, TOML, INI, JSON5, HJSON, TXT, Base64, URL, Hex
- **Binary**: PDF, PNG, JPEG, WebP, GIF

## 🎨 UI Adaptations for Mobile

The web app is adapted for mobile with:

- Touch-friendly buttons
- Larger tap targets
- Responsive layout
- Mobile-specific file picker
- Camera integration for document scanning

## 🔌 Plugins

The mobile app supports all Henkanki plugins. To add a plugin:

1. Add the plugin to `packages/converters/plugins/`
2. Update the format registry in `packages/formats/src/formats.json`
3. Rebuild the web app
4. Sync the mobile app

## 📦 Publishing

### Android

1. Build the app:

```bash
npm run build
npm run sync
```

2. Generate signed APK:

```bash
cd android
./gradlew assembleRelease
```

3. The APK will be in `android/app/build/outputs/apk/release/`

### iOS

1. Build the app:

```bash
npm run build
npm run sync
```

2. Open in Xcode:

```bash
npm run open:ios
```

3. Archive and distribute through App Store Connect

## 🤝 Contributing

- Report mobile-specific issues
- Test on different devices
- Improve mobile UI/UX
- Add mobile-specific features

## 📜 License

MIT License - see LICENSE file for details.
