# Henkanki Plugins

> Plugin system for adding custom file format converters to Henkanki.

## 📦 Plugin Structure

Each plugin is a directory inside `packages/converters/plugins/` with the following structure:

```
my-plugin/
├── manifest.json          # Plugin metadata
├── package.json           # Node.js dependencies (optional)
├── src/
│   └── index.mjs          # Main plugin entry point
└── README.md              # Plugin documentation
```

## 📝 Plugin Manifest

The `manifest.json` file defines plugin metadata:

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "Adds support for MyFormat files",
  "author": "Your Name",
  "license": "MIT",
  "formats": [
    {
      "id": "myformat",
      "extension": "myfmt",
      "mime": "application/x-myformat",
      "category": "text",
      "outputs": ["json", "yaml", "txt"]
    }
  ],
  "converters": [
    {
      "from": "myformat",
      "to": "json",
      "function": "myformatToJson"
    },
    {
      "from": "json",
      "to": "myformat",
      "function": "jsonToMyformat"
    }
  ]
}
```

## 🛠 Plugin Development

### Step 1: Create Plugin Directory

```bash
mkdir -p packages/converters/plugins/my-plugin/src
```

### Step 2: Create manifest.json

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "Example plugin for MyFormat",
  "formats": [
    {
      "id": "myformat",
      "extension": "myfmt",
      "mime": "application/x-myformat",
      "category": "text",
      "outputs": ["json", "yaml"]
    }
  ],
  "converters": [
    {"from": "myformat", "to": "json", "function": "myformatToJson"},
    {"from": "json", "to": "myformat", "function": "jsonToMyformat"}
  ]
}
```

### Step 3: Implement Converters

Create `src/index.mjs`:

```javascript
// MyFormat to JSON converter
export function myformatToJson(text) {
  // Parse MyFormat and return JSON
  const data = parseMyFormat(text);
  return JSON.stringify(data, null, 2) + '\n';
}

// JSON to MyFormat converter
export function jsonToMyformat(text) {
  const data = JSON.parse(text);
  return generateMyFormat(data);
}

// Helper functions
function parseMyFormat(text) {
  // Your parsing logic here
  return {};
}

function generateMyFormat(data) {
  // Your generation logic here
  return '';
}
```

### Step 4: Register Plugin

Add your plugin to `packages/converters/src/index.mjs`:

```javascript
// Load plugins dynamically
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

async function loadPlugins() {
  const pluginsDir = join(dirname(fileURLToPath(import.meta.url)), 'plugins');
  const pluginDirs = await readdir(pluginsDir).catch(() => []);
  
  for (const pluginDir of pluginDirs) {
    try {
      const manifestPath = join(pluginsDir, pluginDir, 'manifest.json');
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
      
      // Register formats
      for (const format of manifest.formats) {
        // Add to formats registry
      }
      
      // Load plugin module
      const pluginPath = join(pluginsDir, pluginDir, 'src', 'index.mjs');
      const plugin = await import(pluginPath);
      
      // Register converters
      for (const converter of manifest.converters) {
        textConverters[`${converter.from}->${converter.to}`] = plugin[converter.function];
      }
    } catch (e) {
      console.warn(`Failed to load plugin ${pluginDir}:`, e.message);
    }
  }
}

// Call this during initialization
await loadPlugins();
```

## 📚 Example Plugins

### 1. XML Enhancement Plugin

Adds advanced XML processing capabilities.

### 2. Binary Format Plugin

Adds support for custom binary formats.

### 3. Document Format Plugin

Adds support for DOCX, XLSX, PPTX formats.

## 🚀 Publishing Plugins

1. Create a GitHub repository for your plugin
2. Add a `henkanki-plugin` keyword to package.json
3. Submit a PR to the main Henkanki repository to add your plugin to the registry

## 🔧 Plugin API

### Available Functions

- `registerFormat(format)` - Register a new format
- `registerConverter(from, to, fn)` - Register a converter function
- `getFormat(id)` - Get format information
- `canConvert(from, to)` - Check if conversion is possible

### Example

```javascript
import { registerFormat, registerConverter } from '../../../core/src/index.mjs';

// Register a new format
registerFormat({
  id: 'myformat',
  extension: 'myfmt',
  mime: 'application/x-myformat',
  category: 'text',
  outputs: ['json', 'yaml']
});

// Register a converter
registerConverter('myformat', 'json', (text) => {
  return JSON.stringify(parseMyFormat(text), null, 2);
});
```

## 📝 Guidelines

1. **Keep plugins focused** - Each plugin should handle one or a few related formats
2. **Handle errors gracefully** - Don't crash the main application
3. **Document your plugin** - Include a README.md with usage examples
4. **Test your plugin** - Include tests for your converters
5. **Respect privacy** - Don't send data to external services without user consent

## 🤝 Community

- Share your plugins on GitHub
- Submit plugins to the official registry
- Help improve existing plugins
- Report issues and suggest features
