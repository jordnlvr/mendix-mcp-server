# 🤖 Complete CI/CD Automation Setup

**Last Updated:** December 29, 2025

This document explains how the complete automated deployment pipeline works.

---

## 🎯 THE MAGIC: One Push → Two Deployments

```
You: git push origin main
   ↓
GitHub Actions triggers
   ↓
   ├─→ Fly.io deploys (MCP server)
   └─→ Railway deploys (REST API)
   
Both servers updated automatically! 🎉
```

---

## ✅ WHAT'S ALREADY CONFIGURED

### **1. Fly.io GitHub Action** ⭐
**File:** `.github/workflows/fly-deploy.yml`

**Triggers:** Every push to `main` branch

**What it does:**
1. Checks out your code
2. Sets up Fly.io CLI
3. Runs `flyctl deploy --remote-only`
4. Deploys to: `https://mendix-mcp-server.fly.dev`

**Needs:** `FLY_API_TOKEN` secret in GitHub repository settings

### **2. Railway Auto-Deploy** 🚂
**File:** `railway.toml`

**Triggers:** Every push to connected branch (usually `main`)

**What it does:**
1. Railway detects push
2. Builds using Nixpacks
3. Runs health check on `/health` endpoint
4. Deploys to: `https://mendix-mcp-server-production.up.railway.app`

**Needs:** Repository connected in Railway dashboard

---

## 🔧 SETUP STEPS

### **STEP 1: Create/Connect GitHub Repository**

**If you DON'T have a repo yet:**

1. Go to: https://github.com/new
2. Repository name: `mendix-mcp-server`
3. Description: "Self-learning MCP server for Mendix development"
4. Visibility: **Private** (recommended - contains secrets)
5. Don't initialize with README
6. Click "Create repository"
7. Copy the HTTPS URL (e.g., `https://github.com/yourusername/mendix-mcp-server.git`)

**If you ALREADY have a repo:**

Just get the URL from GitHub.

### **STEP 2: Configure Git Locally**

```powershell
cd D:\Users\kelly.seale\VSCode-Dream-Workspace\mendix-mcp-server

# Set your git identity (if not set)
git config user.name "Neo"
git config user.email "kelly.seale@siemens.com"

# Add the GitHub remote
git remote add origin https://github.com/yourusername/mendix-mcp-server.git

# Verify
git remote -v
```

### **STEP 3: Add Fly.io API Token to GitHub**

**Get your Fly.io token:**
```powershell
flyctl auth token
```

**Add to GitHub:**
1. Go to your GitHub repo
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `FLY_API_TOKEN`
5. Value: [paste the token from flyctl]
6. Click "Add secret"

### **STEP 4: Connect Railway to GitHub**

**In Railway Dashboard:**
1. Open your project: https://railway.app/dashboard
2. Click on the service
3. Settings → Service
4. Under "Source" click "Connect"
5. Connect to your GitHub repository
6. Select branch: `main`
7. Railway will now auto-deploy on every push!

### **STEP 5: Initial Push**

```powershell
cd D:\Users\kelly.seale\VSCode-Dream-Workspace\mendix-mcp-server

# Check what's changed
git status

# Add all files
git add .

# Commit
git commit -m "feat: Add source attribution and complete deployment automation"

# Push to GitHub
git push -u origin main
```

**What happens:**
1. Code pushes to GitHub ✅
2. GitHub Actions triggers Fly.io deployment ✅
3. Railway detects push and deploys ✅
4. Both servers update automatically! 🎉

---

## 🚀 DAILY WORKFLOW

After initial setup, your workflow is simple:

```powershell
# Make changes to code
code src/sse-server.js

# Stage changes
git add .

# Commit
git commit -m "feat: Add new feature"

# Push (triggers both deployments!)
git push
```

**That's it!** Both Fly.io and Railway deploy automatically.

---

## 📊 MONITORING DEPLOYMENTS

### **Watch Fly.io Deploy:**

**In GitHub:**
1. Go to your repo
2. Click "Actions" tab
3. See the "Fly Deploy" workflow running

**In Terminal:**
```powershell
# Watch deployment logs
flyctl logs --tail

# Check status
flyctl status
```

### **Watch Railway Deploy:**

**In Railway Dashboard:**
1. Go to: https://railway.app/dashboard
2. Click your project
3. See deployment progress in realtime

**In Terminal:**
```powershell
# Install Railway CLI (if not installed)
npm install -g @railway/cli

# Login
railway login

# Watch logs
railway logs
```

---

## 🧪 TESTING THE AUTOMATION

### **Test 1: Make a Small Change**

```powershell
cd D:\Users\kelly.seale\VSCode-Dream-Workspace\mendix-mcp-server

# Add a comment to test
echo "// Automation test" >> src/sse-server.js

# Commit and push
git add .
git commit -m "test: Verify CI/CD automation"
git push
```

### **Test 2: Watch Deployments**

**Fly.io:**
- GitHub Actions: https://github.com/yourusername/mendix-mcp-server/actions
- Should see "Fly Deploy" running
- Takes ~2-3 minutes

**Railway:**
- Dashboard: https://railway.app/dashboard
- Should see deployment in progress
- Takes ~2-3 minutes

### **Test 3: Verify Deployments**

```powershell
# Test Fly.io
curl https://mendix-mcp-server.fly.dev/health

# Test Railway
curl https://mendix-mcp-server-production.up.railway.app/health

# Both should return healthy status!
```

---

## 🔐 SECRETS MANAGEMENT

### **GitHub Secrets (for Fly.io)**
Location: Repo → Settings → Secrets and variables → Actions

**Required:**
- `FLY_API_TOKEN` - Get from `flyctl auth token`

### **Railway Secrets (for REST API)**
Location: Railway Dashboard → Service → Variables

**Already Set:**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `PINECONE_API_KEY`
- `PINECONE_INDEX`
- `AZURE_OPENAI_API_KEY`
- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_EMBEDDING_DEPLOYMENT`
- `OPENAI_API_KEY`

**Note:** Railway automatically uses these when deploying.

---

## 🔄 ROLLBACK PROCEDURE

**If a deployment breaks something:**

### **Fly.io Rollback:**
```powershell
# List releases
flyctl releases

# Rollback to previous version
flyctl releases rollback
```

### **Railway Rollback:**
1. Go to Railway dashboard
2. Click on deployment
3. Click "Redeploy" on a previous successful deployment

### **Git Rollback:**
```powershell
# See recent commits
git log --oneline -5

# Revert to previous commit
git revert HEAD

# Or reset to specific commit
git reset --hard <commit-hash>
git push --force
```

---

## 📋 TROUBLESHOOTING

### **"GitHub Action fails with Fly.io error"**

**Check:**
1. Is `FLY_API_TOKEN` set in GitHub secrets?
2. Run `flyctl auth token` to get a fresh token
3. Update the secret in GitHub

**Fix:**
```powershell
# Get new token
flyctl auth token

# Add to GitHub: Settings → Secrets → FLY_API_TOKEN
```

### **"Railway doesn't auto-deploy"**

**Check:**
1. Is repository connected in Railway dashboard?
2. Is the correct branch selected?
3. Did the push actually succeed?

**Fix:**
- Railway Dashboard → Service → Settings → Connect repository
- Select branch: `main`
- Trigger manual deploy to test

### **"Deploy succeeds but app doesn't work"**

**Check:**
1. Environment variables set correctly?
2. Health check passing?
3. Check logs!

**Fly.io:**
```powershell
flyctl logs --tail
```

**Railway:**
```powershell
railway logs
```

---

## 🎯 BEST PRACTICES

### **1. Always Test Locally First**
```powershell
# Test the SSE server locally
npm run sse

# Verify it works at http://localhost:8080/health
```

### **2. Use Meaningful Commit Messages**
```powershell
# Good commits
git commit -m "feat: Add source attribution to responses"
git commit -m "fix: Correct Supabase connection timeout"
git commit -m "docs: Update deployment guide"

# Bad commits
git commit -m "stuff"
git commit -m "changes"
git commit -m "wip"
```

### **3. Use Feature Branches for Big Changes**
```powershell
# Create feature branch
git checkout -b feature/new-tool

# Make changes
# ...

# Commit
git add .
git commit -m "feat: Add new MCP tool"

# Push feature branch
git push origin feature/new-tool

# Merge to main when ready
git checkout main
git merge feature/new-tool
git push
```

### **4. Monitor Deployments**
- Check GitHub Actions after every push
- Verify health endpoints after deployment
- Test actual functionality (don't just trust health checks!)

---

## 📞 QUICK REFERENCE

```powershell
# Daily workflow
git add .
git commit -m "feat: Description of changes"
git push

# Check deployment status
flyctl status          # Fly.io
railway status         # Railway

# View logs
flyctl logs --tail     # Fly.io
railway logs           # Railway

# Test endpoints
curl https://mendix-mcp-server.fly.dev/health
curl https://mendix-mcp-server-production.up.railway.app/health

# Rollback if needed
flyctl releases rollback
```

---

## 🎉 SUMMARY

**One Push → Two Deployments:**
```
Local Changes
    ↓
git push origin main
    ↓
    ├─→ GitHub Actions → Fly.io (MCP Server)
    └─→ Railway Auto-Deploy → Railway (REST API)
    
Both servers updated! 🚀
```

**Setup Required:**
1. ✅ GitHub repository
2. ✅ FLY_API_TOKEN in GitHub secrets
3. ✅ Railway connected to GitHub
4. ✅ Git remote configured locally

**After Setup:**
- Just `git push` and everything deploys!
- Monitor in GitHub Actions + Railway dashboard
- Rollback if needed

---

**Created:** December 29, 2025  
**Status:** Ready to implement  
**Next Step:** Configure Git remote and push!
