# ⚡ Auto-Start Railway Proxy

**The proxy now auto-starts when you open this workspace in VS Code!**

---

## ✅ What Was Set Up

1. **VS Code Task** (`.vscode/tasks.json`)
   - Runs on folder open (`runOn: folderOpen`)
   - Runs in background silently
   - Dedicated terminal panel

2. **Workspace Settings** (`.vscode/settings.json`)
   - `task.autoDetect: on`
   - `task.allowAutomaticTasks: on`

3. **Improved Proxy** (`.vscode/railway-sse-proxy.js`)
   - Better logging
   - Connection tracking
   - Graceful shutdown
   - Error handling

---

## 🚀 How It Works

### **When you open this folder in VS Code:**

1. ✅ VS Code detects the auto-start task
2. ✅ Asks permission (first time only)
3. ✅ Starts the proxy in background
4. ✅ Proxy runs on `http://localhost:3000/sse`
5. ✅ Copilot can use `#mendix-expert` immediately!

### **First Time Setup:**

When you open the folder, VS Code will show:

```
This folder has tasks that run automatically.
[Allow] [Disallow] [Manage]
```

**Click "Allow"** ✅

That's it! The proxy will auto-start every time from now on.

---

## 📋 Manual Control

### **Check if proxy is running:**
```
View → Terminal → "Start Railway SSE Proxy"
```

Or visit: http://localhost:3000/health

### **Manually start:**
```powershell
.\start-proxy.ps1
```

### **Stop the proxy:**
- Close the terminal tab, OR
- `Ctrl+C` in the terminal

### **Restart the proxy:**
```
Ctrl+Shift+P → "Tasks: Restart Running Task" → "Start Railway SSE Proxy"
```

---

## 🧪 Verify It's Working

### **1. Check the Terminal**
Look for the panel labeled "Start Railway SSE Proxy"

Should show:
```
╔═══════════════════════════════════════════════╗
║   🔌 Railway SSE Proxy - AUTO-START MODE     ║
║   Status:  Ready for Copilot connections!    ║
╚═══════════════════════════════════════════════╝
```

### **2. Test in Copilot**
```
#mendix-expert What tools do you have?
```

### **3. Check Health**
Open browser: http://localhost:3000/health

Should show:
```json
{
  "status": "healthy",
  "proxy": "running",
  "activeConnections": 0,
  "railway": { ... },
  "uptime": 123.45
}
```

---

## 🔧 Troubleshooting

### **"Allow automatic tasks" prompt doesn't appear**

1. Open Command Palette (`Ctrl+Shift+P`)
2. Type: "Tasks: Manage Automatic Tasks in Folder"
3. Select "Allow Automatic Tasks in Folder"
4. Reload VS Code

### **"Port 3000 already in use"**

Another instance is running!

```powershell
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill it
taskkill /PID [PID] /F

# Or change PORT in railway-sse-proxy.js
```

### **Proxy isn't auto-starting**

Check workspace settings:
```json
{
  "task.autoDetect": "on",
  "task.allowAutomaticTasks": "on"
}
```

Manually run the task:
```
Ctrl+Shift+P → "Tasks: Run Task" → "Start Railway SSE Proxy"
```

### **Want to disable auto-start?**

Edit `.vscode/tasks.json` and remove:
```json
"runOptions": {
  "runOn": "folderOpen"
}
```

---

## 📊 What You'll See

### **Terminal Output:**
```
🚀 Starting Railway SSE Proxy (Auto-Start Mode)...
📡 Railway URL: https://mendix-mcp-server-production...

╔═══════════════════════════════════════════════╗
║   🔌 Railway SSE Proxy - AUTO-START MODE     ║
║   Local:   http://localhost:3000/sse         ║
║   Health:  http://localhost:3000/health      ║
║   Status:  Ready for Copilot connections!    ║
╚═══════════════════════════════════════════════╝

🔌 New connection (#1)
✅ Connected (1 active)
🔧 search_knowledge query
```

### **VS Code Status Bar:**
Look for a small icon indicating background tasks are running.

---

## 🎯 Daily Workflow (Simplified!)

### **Before:**
1. Open VS Code
2. Start proxy manually: `.\start-proxy.ps1`
3. Keep terminal open
4. Use Copilot

### **Now:**
1. Open VS Code ✅
2. ~~Start proxy~~ (automatic!)
3. Use Copilot immediately! 🎉

---

## ⚙️ Configuration Files

| File | Purpose |
|------|---------|
| `.vscode/tasks.json` | Auto-start configuration |
| `.vscode/settings.json` | Enable automatic tasks |
| `.vscode/railway-sse-proxy.js` | The proxy server |
| `%APPDATA%\Code\User\settings.json` | Points Copilot to localhost:3000 |

---

## 🎉 Benefits

- ✅ **No manual start** - Opens with VS Code
- ✅ **Always available** - Ready for `#mendix-expert`
- ✅ **Background process** - Doesn't clutter UI
- ✅ **Auto-reconnect** - Survives VS Code reloads
- ✅ **Clean shutdown** - Stops when you close VS Code

---

**Just open VS Code and start using `#mendix-expert`!** 🚀🍺

No manual steps needed!
