# 🔐 Secret Management Guide

**Last Updated:** December 29, 2025

---

## ⚠️ IMPORTANT: Never Commit Secrets!

This project uses `.gitignore` to prevent API keys from being committed. Follow this guide to manage secrets properly.

---

## 🎯 Quick Setup

### **1. Copy Template Files**
```powershell
# PowerShell
Copy-Item flyio-secrets.ps1.template flyio-secrets.ps1
Copy-Item railway-secrets.ps1.template railway-secrets.ps1  # if exists
```

```bash
# Bash
cp flyio-secrets.sh.template flyio-secrets.sh
cp railway-secrets.sh.template railway-secrets.sh  # if exists
```

### **2. Fill in Your API Keys**
Edit the copied files (without `.template`) and replace placeholders with real keys.

### **3. Run to Deploy Secrets**
```powershell
# PowerShell
.\flyio-secrets.ps1
```

```bash
# Bash
chmod +x flyio-secrets.sh
./flyio-secrets.sh
```

---

## 📋 Files Explained

| File | Purpose | Committed? |
|------|---------|------------|
| `.env` | Local development secrets | ❌ NO (.gitignore) |
| `flyio-secrets.ps1` | Set Fly.io secrets | ❌ NO (.gitignore) |
| `flyio-secrets.sh` | Set Fly.io secrets (bash) | ❌ NO (.gitignore) |
| `flyio-secrets.ps1.template` | Template with placeholders | ✅ YES (safe) |
| `flyio-secrets.sh.template` | Template with placeholders | ✅ YES (safe) |

---

## 🔑 Required Secrets

### **For Fly.io Deployment:**
```
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_ANON_KEY=eyJ...your-key
PINECONE_API_KEY=pc-...your-key
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX=mendix-knowledge
AZURE_OPENAI_API_KEY=...your-key
AZURE_OPENAI_ENDPOINT=https://YOUR-RESOURCE.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=text-embedding-ada-002
```

### **For Railway Deployment:**
Same as above - set via Railway dashboard or CLI

### **For Local Development:**
Create `.env` file in project root (also gitignored):
```env
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_ANON_KEY=eyJ...your-key
PINECONE_API_KEY=pc-...your-key
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX=mendix-knowledge
AZURE_OPENAI_API_KEY=...your-key
AZURE_OPENAI_ENDPOINT=https://YOUR-RESOURCE.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=text-embedding-ada-002
```

---

## 🛡️ How .gitignore Protects You

The `.gitignore` file contains:
```gitignore
# Environment
.env
.env.local

# SECRET FILES - Never commit these!
flyio-secrets.ps1
flyio-secrets.sh
railway-secrets.ps1
railway-secrets.sh
*secrets*.ps1
*secrets*.sh
*.secret
secrets/
```

This means:
- ✅ Template files (.template) CAN be committed
- ❌ Actual secret files CANNOT be committed
- ✅ Git will never track them

---

## 🚨 If You Accidentally Committed Secrets

### **Option 1: Remove from Git History (Recommended)**
```powershell
# Remove file from git but keep local copy
git rm --cached flyio-secrets.ps1

# Commit the removal
git commit -m "chore: Remove secrets file from tracking"

# Push (GitHub will still block if secrets in history)
git push origin main
```

### **Option 2: Allow the Secret (GitHub)**
If GitHub blocks the push, you'll get a link like:
```
https://github.com/jordnlvr/mendix-mcp-server/security/secret-scanning/unblock-secret/...
```

Click it and choose:
- **"Allow this secret"** (if you're okay with it being public)
- **Better:** Remove it from history instead

### **Option 3: Rewrite History (Nuclear Option)**
```powershell
# Use BFG Repo Cleaner or git filter-branch
# WARNING: This rewrites history!

# Install BFG
# https://rtyley.github.io/bfg-repo-cleaner/

# Remove secrets
bfg --replace-text secrets.txt repo.git

# Force push (CAREFUL!)
git push origin main --force
```

---

## ✅ Best Practices

### **DO:**
- ✅ Use `.env` for local development
- ✅ Use `fly secrets` or Railway dashboard for cloud
- ✅ Keep template files updated
- ✅ Use different keys for dev/prod
- ✅ Rotate keys periodically

### **DON'T:**
- ❌ Commit `.env` files
- ❌ Hardcode secrets in code
- ❌ Share secrets in Slack/email
- ❌ Use production keys locally
- ❌ Commit files with "secret" in the name

---

## 📝 Quick Reference

### **Set Fly.io Secrets:**
```powershell
fly secrets set KEY="value"
fly secrets list
fly secrets unset KEY
```

### **Set Railway Secrets:**
```bash
# Via dashboard: https://railway.app/project/[id]/settings
# Or via CLI:
railway variables set KEY=value
railway variables list
```

### **Check What's in Git:**
```powershell
# See what git is tracking
git ls-files | Select-String "secret"

# See what's ignored
git status --ignored
```

---

## 🆘 Troubleshooting

### **"Secret scanning blocked my push"**
1. Check which file has secrets: Look at the GitHub error message
2. Remove from git: `git rm --cached [filename]`
3. Add to .gitignore: Edit `.gitignore`
4. Commit: `git commit -m "Remove secrets"`
5. Push: `git push origin main`

### **"Secrets not working on Fly.io"**
```powershell
# Check if secrets are set
fly secrets list

# Re-set them
.\flyio-secrets.ps1

# Redeploy
fly deploy
```

### **"Local dev can't find secrets"**
1. Check `.env` file exists in project root
2. Check `.env` has all required keys
3. Restart your dev server
4. Check logs for "environment variable not found"

---

**Remember:** Secrets in templates = OK ✅  
**Secrets in actual files = NOT OK** ❌

Keep your keys safe! 🔐
