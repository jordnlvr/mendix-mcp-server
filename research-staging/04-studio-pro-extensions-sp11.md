# Studio Pro Extensions - SP11+ Reference

## Deep Beast Mode Research Harvest - January 2025

> **Status**: RESEARCH STAGING - Needs validation before adding to knowledge base
> **Source**: Official Mendix Docs
> **Target**: Studio Pro 11+ (11.2.0+)
> **API Status**: BETA

---

## Overview

Studio Pro 11 introduced an Extensibility API that allows you to create custom extensions. The API is available in two flavors:

| API Type                  | Language              | Use Case                                       |
| ------------------------- | --------------------- | ---------------------------------------------- |
| **C# Extensibility API**  | C# (.NET 8.0)         | Full access to model, rich desktop integration |
| **Web Extensibility API** | TypeScript/JavaScript | Modern web UI, React support, easier debugging |

**Note**: Extension development requires the `--enable-extension-development` flag when starting Studio Pro.

---

## Part 1: C# Extensibility API

### 1.1 Project Setup

#### Prerequisites

- Visual Studio 2022
- .NET 8.0 SDK
- Studio Pro 11.x installed
- `Mendix.StudioPro.ExtensionsAPI` NuGet package

#### Create New Extension Project

```powershell
# Create new C# Class Library project
dotnet new classlib -n MyCompany.MyProject.MendixExtension -f net8.0
cd MyCompany.MyProject.MendixExtension

# Add Mendix Extensions API NuGet package
dotnet add package Mendix.StudioPro.ExtensionsAPI --version 11.5.0
```

#### Project Structure

```
MyCompany.MyProject.MendixExtension/
├── manifest.json                    # Extension manifest (required)
├── MyMenuExtension.cs               # Menu extension
├── MyDockablePaneExtension.cs       # Dockable pane extension
├── Views/                           # Web views (optional)
│   └── wwwroot/
│       └── index.html
└── MyCompany.MyProject.MendixExtension.csproj
```

#### manifest.json (Required)

```json
{
  "mx_extensions": ["MyCompany.MyProject.MendixExtension.dll"]
}
```

Set "Copy to Output Directory" to "Copy always" in file properties.

#### .csproj Configuration

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <CopyLocalLockFileAssemblies>true</CopyLocalLockFileAssemblies>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Mendix.StudioPro.ExtensionsAPI" Version="11.5.0" />
  </ItemGroup>
</Project>
```

### 1.2 Installing Extension in App

1. Open your Mendix app in Studio Pro
2. Go to **App > Show App Directory in Explorer**
3. Create folder: `<app-folder>/extensions/<your-extension-name>/`
4. Copy your compiled DLL, manifest.json, and dependencies there
5. Press **F4** (Synchronize App Directory) in Studio Pro

#### Visual Studio Post-Build Event

```
xcopy /y /s /i "$(TargetDir)" "D:\path\to\your\app\extensions\MyExtension"
```

### 1.3 Creating a Menu Extension

```csharp
using System.ComponentModel.Composition;
using Mendix.StudioPro.ExtensionsAPI.UI.Menu;
using Mendix.StudioPro.ExtensionsAPI.UI.Services;

namespace MyCompany.MyProject.MendixExtension;

[method: ImportingConstructor]
[Export(typeof(MenuExtension))]
public class MyMenuExtension(IMessageBoxService messageBoxService) : MenuExtension
{
    public override IEnumerable<MenuViewModel> GetMenus()
    {
        yield return new MenuViewModel(
            "Say Hello",
            () => messageBoxService.ShowInformation("Hello World!")
        );
    }
}
```

**Result**: Adds "Say Hello" menu item under **Extensions > MyCompany**

### 1.4 Creating a Dockable Pane Extension

```csharp
using System.ComponentModel.Composition;
using Mendix.StudioPro.ExtensionsAPI.UI.DockablePane;

namespace MyCompany.MyProject.MendixExtension;

[Export(typeof(DockablePaneExtension))]
public class MyDockablePaneExtension : DockablePaneExtension
{
    public const string ID = "my-dockable-pane";
    public override string Id => ID;

    // Optional: Auto-add to View menu
    public override string? ViewMenuCaption => "My Custom Pane";

    public override DockablePaneViewModelBase Open() =>
        new MyDockablePaneWebViewModel("http://example.com");
}
```

#### Pane View Model

```csharp
using Mendix.StudioPro.ExtensionsAPI.UI.DockablePane;
using Mendix.StudioPro.ExtensionsAPI.UI.WebView;

namespace MyCompany.MyProject.MendixExtension;

public class MyDockablePaneWebViewModel(string homePage) : WebViewDockablePaneViewModel
{
    public override void InitWebView(IWebView webView) =>
        webView.Address = new Uri(homePage);
}
```

### 1.5 Opening Pane from Menu

```csharp
using System.ComponentModel.Composition;
using Mendix.StudioPro.ExtensionsAPI.UI.Menu;
using Mendix.StudioPro.ExtensionsAPI.UI.Services;

namespace MyCompany.MyProject.MendixExtension;

[Export(typeof(MenuExtension))]
public class MyMenuExtension(
    IDockingWindowService dockingWindowService,
    IMessageBoxService messageBoxService
) : MenuExtension
{
    public override IEnumerable<MenuViewModel> GetMenus()
    {
        yield return new MenuViewModel(
            "Say Hello",
            () => messageBoxService.ShowInformation("Hello World!")
        );

        yield return new MenuViewModel(
            "Open My Pane",
            () => dockingWindowService.OpenPane(MyDockablePaneExtension.ID)
        );
    }
}
```

### 1.6 Extension Lifecycle Events

```csharp
using Mendix.StudioPro.ExtensionsAPI.UI.Events;

namespace MyCompany.MyProject.MendixExtension;

[method: ImportingConstructor]
[Export(typeof(MenuExtension))]
public class MyMenuExtension() : MenuExtension
{
    public MyMenuExtension()
    {
        Subscribe<ExtensionLoaded>(onEvent: () => {
            // Called when extension loads
        });

        Subscribe<ExtensionUnloading>(onEvent: () => {
            // Called before extension unloads
        });
    }

    public override IEnumerable<MenuViewModel> GetMenus() { ... }
}
```

### 1.7 Available Services (Inject via Constructor)

| Service                 | Purpose                                                |
| ----------------------- | ------------------------------------------------------ |
| `IMessageBoxService`    | Show dialogs (ShowInformation, ShowWarning, ShowError) |
| `IDockingWindowService` | Open/close dockable panes                              |
| `ICurrentAppService`    | Access current app context                             |
| `IModelService`         | Access and modify the Mendix model                     |

### 1.8 Debugging C# Extensions

1. Build your extension
2. Copy to app's extensions folder (or use post-build event)
3. Press F4 in Studio Pro to reload
4. In Visual Studio: **Debug > Attach to Process** (Ctrl+Alt+P)
5. Select `studiopro.exe`
6. Set breakpoints
7. Trigger your extension from Studio Pro menu

---

## Part 2: Web Extensibility API

### 2.1 Project Setup

#### Prerequisites

- Node.js 22.x (LTS)
- VS Code (recommended)
- Studio Pro 11.2.0+

#### Create Extension with Generator

```bash
# Run the Mendix extension generator
npm create @mendix/extension

# Follow prompts:
# - Select TypeScript
# - Enter extension name
# - Choose if using React
# - Enter Studio Pro executable path (optional)
# - Enter test app .mpr path (optional)
# - Select Studio Pro version 11

cd myextension
npm install
npm run build
```

### 2.2 Project Structure

```
myextension/
├── src/
│   ├── main/
│   │   └── index.ts              # Main entry point
│   └── ui/
│       ├── tab.tsx               # Tab UI component
│       └── dockablepane.tsx      # Pane UI component
├── manifest.json                 # Extension manifest
├── build-extension.mjs           # Build script
├── package.json
└── tsconfig.json
```

### 2.3 manifest.json

```json
{
  "mendixComponent": {
    "entryPoints": {
      "main": "main.js",
      "ui": {
        "tab": "tab.js",
        "dockablepane": "dockablepane.js"
      }
    }
  }
}
```

### 2.4 Main Entry Point (src/main/index.ts)

```typescript
import { IComponent, getStudioProApi } from '@anthropic/mendix-extension';

export const component: IComponent = {
  async loaded(componentContext) {
    const studioPro = getStudioProApi(componentContext);

    // Add menu items
    await studioPro.ui.extensionsMenu.add({
      menuId: 'myextension.MainMenu',
      caption: 'My Extension',
      subMenus: [
        { menuId: 'myextension.ShowTab', caption: 'Show Tab' },
        { menuId: 'myextension.ShowPane', caption: 'Show Pane' },
      ],
    });

    // Register dockable pane
    const paneHandle = await studioPro.ui.panes.register(
      {
        title: 'My Extension Pane',
        initialPosition: 'right', // left, right, bottom
      },
      {
        componentName: 'extension/myextension',
        uiEntrypoint: 'dockablepane',
      }
    );

    // Handle menu clicks
    studioPro.ui.extensionsMenu.addEventListener('menuItemActivated', (args) => {
      if (args.menuId === 'myextension.ShowTab') {
        studioPro.ui.tabs.open(
          { title: 'My Extension Tab' },
          {
            componentName: 'extension/myextension',
            uiEntrypoint: 'tab',
          }
        );
      } else if (args.menuId === 'myextension.ShowPane') {
        studioPro.ui.panes.open(paneHandle);
      }
    });
  },
};
```

### 2.5 Tab UI Component (src/ui/tab.tsx)

```tsx
import React from 'react';

export function Tab() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>My Extension Tab</h1>
      <p>Hello from my extension!</p>
    </div>
  );
}
```

### 2.6 Accessing the Mendix Model (Web API)

```typescript
import { getStudioProApi } from '@anthropic/mendix-extension';

export const component: IComponent = {
  async loaded(componentContext) {
    const studioPro = getStudioProApi(componentContext);

    // Get model components
    const { pages, domainModels, enumerations, snippets, buildingBlocks } = studioPro.app.model;

    // Get all units info
    const allDomainModels = await domainModels.getUnitsInfo();
    console.log(allDomainModels);

    // Load specific domain model
    const [domainModel] = await domainModels.loadAll((info) => info.moduleName === 'MyFirstModule');

    // Read entity
    const entity = domainModel.getEntity('MyEntity');
    console.log(entity.name, entity.attributes);

    // Create new entity
    const newEntity = await domainModel.addEntity({
      name: 'NewEntity',
      attributes: [
        { name: 'Name', type: 'String' },
        { name: 'Count', type: 'Integer' },
      ],
    });

    // Save changes (required!)
    await domainModels.save(domainModel);

    // Load page
    const [page] = await pages.loadAll(
      (info) => info.moduleName === 'MyFirstModule' && info.name === 'Home_Web'
    );
  },
};
```

### 2.7 Build Script (build-extension.mjs)

```javascript
import * as esbuild from 'esbuild';
import { copyToAppPlugin, copyManifestPlugin, commonConfig } from './build.helpers.mjs';
import parseArgs from 'minimist';

const outDir = `dist/myextension`;
const appDir = 'D:\\path\\to\\your\\app';
const extensionDirectoryName = 'extensions';

const entryPoints = [
  { in: 'src/main/index.ts', out: 'main' },
  { in: 'src/ui/tab.tsx', out: 'tab' },
  { in: 'src/ui/dockablepane.tsx', out: 'dockablepane' },
];

const args = parseArgs(process.argv.slice(2));
const buildContext = await esbuild.context({
  ...commonConfig,
  outdir: outDir,
  plugins: [copyManifestPlugin(outDir), copyToAppPlugin(appDir, outDir, extensionDirectoryName)],
  entryPoints,
});

if ('watch' in args) {
  await buildContext.watch();
} else {
  await buildContext.rebuild();
  await buildContext.dispose();
}
```

### 2.8 VS Code Debug Configuration (.vscode/launch.json)

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug Extension",
      "runtimeExecutable": "C:\\Program Files\\Mendix\\11.5.0\\modeler\\studiopro.exe",
      "runtimeArgs": [
        "D:\\path\\to\\your\\app\\YourApp.mpr",
        "--enable-extension-development",
        "--enable-web-extensions"
      ],
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

### 2.9 Available Web API Surfaces

```typescript
const studioPro = getStudioProApi(componentContext);

// UI APIs
studioPro.ui.extensionsMenu; // Add menus
studioPro.ui.tabs; // Open tabs
studioPro.ui.panes; // Register/open/close panes
studioPro.ui.messageBox; // Show dialogs
studioPro.ui.notifications; // Show popup notifications
studioPro.ui.dialogs; // Show modal dialogs

// Model APIs
studioPro.app.model.pages; // Access pages
studioPro.app.model.domainModels; // Access domain models
studioPro.app.model.enumerations; // Access enumerations
studioPro.app.model.snippets; // Access snippets
studioPro.app.model.buildingBlocks; // Access building blocks

// File APIs
studioPro.app.files; // Access local app files
```

---

## Part 3: Packaging & Distribution

### 3.1 Package as Add-on Module

1. Ensure `--enable-extension-development` flag is enabled
2. In Studio Pro, create a new module
3. Open module Settings > Export tab
4. Select "Add-on module"
5. In "Extension name" dropdown, select your extension
6. Right-click module in App Explorer > "Export add-on module package"
7. Save the `.mxmodule` file

### 3.2 Distribute to Users

**Option 1**: Share `.mxmodule` file directly

- User imports via: Right-click app > "Import module package"
- User will see trust warning for the extension

**Option 2**: Publish to Mendix Marketplace

- Follow Marketplace submission guidelines
- Extension will be available for all users

### 3.3 Trust Model

When importing an extension, Studio Pro shows a trust warning:

- **Trust**: Extension loads and runs
- **Don't Trust**: Module imports but extension doesn't load

---

## Part 4: API Comparison

| Feature            | C# API      | Web API        |
| ------------------ | ----------- | -------------- |
| Menu Extensions    | ✅          | ✅             |
| Dockable Panes     | ✅          | ✅             |
| Context Menus      | ✅          | ❌             |
| Modal Dialogs      | ✅          | ✅             |
| Model Read Access  | ✅          | ✅             |
| Model Write Access | ✅          | ✅             |
| Custom Web Views   | ✅          | Native         |
| React Support      | Via WebView | Native         |
| Debugging          | VS Attach   | VS Code Native |
| Cross-Platform     | ✅          | ✅             |

---

## Part 5: Best Practices

### General

- Always use `--enable-extension-development` flag
- Test on same SP version as target users
- Keep extensions lightweight (load times matter)
- Use meaningful menu captions and pane titles

### C# Specific

- Use `[ImportingConstructor]` for dependency injection
- Subscribe to lifecycle events for cleanup
- Use post-build events for faster iteration
- Keep web content in `wwwroot` folder for macOS compatibility

### Web Specific

- Use TypeScript for better type safety
- Use React for complex UIs
- Always call `component.save(unit)` after model changes
- Load units lazily (only when needed)

---

## Sources

- https://docs.mendix.com/apidocs-mxsdk/apidocs/extensibility-api-11/
- https://docs.mendix.com/apidocs-mxsdk/apidocs/csharp-extensibility-api-11/
- https://docs.mendix.com/apidocs-mxsdk/apidocs/web-extensibility-api-11/
- https://github.com/mendix/ExtensionAPI-Samples
- http://apidocs.rnd.mendix.com/11/extensions-api/index.html

---

**Next Steps for Validation:**

1. Create test C# extension with SP 11.5.0
2. Create test Web extension with SP 11.5.0
3. Verify model read/write APIs work as documented
4. Test packaging and distribution workflow
5. Validate cross-platform compatibility
