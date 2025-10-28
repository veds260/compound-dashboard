# Custom Domain Setup for Railway

Complete guide to connect your custom domain (or subdomain) to your Railway deployment.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Railway Setup](#railway-setup)
3. [DNS Configuration - Namecheap](#dns-configuration---namecheap)
4. [DNS Configuration - Other Providers](#dns-configuration---other-providers)
5. [SSL/TLS Certificates](#ssltls-certificates)
6. [Verification & Testing](#verification--testing)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

### What You'll Need

- ✅ A domain name (e.g., `yourdomain.com`)
- ✅ Access to your domain registrar account (Namecheap, GoDaddy, etc.)
- ✅ Your Railway project deployed and running
- ✅ 10-15 minutes for DNS propagation

### Domain Options

You can use either:

**Option 1: Root Domain**
- Example: `yourdomain.com`
- Access: `https://yourdomain.com`
- Best for: Main production site

**Option 2: Subdomain**
- Example: `app.yourdomain.com` or `dashboard.yourdomain.com`
- Access: `https://app.yourdomain.com`
- Best for: Keeping main domain separate, multiple services

**Option 3: Both**
- Root domain + www subdomain
- Example: Both `yourdomain.com` and `www.yourdomain.com` work
- Best for: Professional setup with www redirect

---

## 🚂 Railway Setup

### Step 1: Access Your Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your project (Compound Dashboard)
3. Click on your service (the one running your Next.js app)

### Step 2: Navigate to Settings

1. In your service, click on the **Settings** tab
2. Scroll down to find **Networking** or **Domains** section

### Step 3: Add Custom Domain

1. Click **+ Add Domain** or **Generate Domain**
2. You'll see a field to enter your custom domain
3. Enter your domain:
   - For root domain: `yourdomain.com`
   - For subdomain: `app.yourdomain.com` or `dashboard.yourdomain.com`
4. Click **Add** or **Save**

### Step 4: Get DNS Records

After adding the domain, Railway will provide DNS configuration details:

**For Root Domain (`yourdomain.com`):**
```
Type: A Record
Name: @ (or leave blank)
Value: [Railway's IP Address - will be provided]

Type: AAAA Record (IPv6 - optional)
Name: @ (or leave blank)
Value: [Railway's IPv6 Address - if provided]
```

**OR** (Railway might use CNAME):
```
Type: CNAME
Name: @ (or www)
Value: [something].railway.app
```

**For Subdomain (`app.yourdomain.com`):**
```
Type: CNAME
Name: app (or your subdomain name)
Value: [your-project].up.railway.app
```

**Important**: Copy these values! You'll need them in the next step.

---

## 🔧 DNS Configuration - Namecheap

### Option A: Subdomain Setup (Recommended for Starting)

**Example**: Setting up `app.yourdomain.com`

1. **Log into Namecheap**
   - Go to [Namecheap Dashboard](https://www.namecheap.com/myaccount/login/)
   - Navigate to **Domain List**

2. **Manage Domain**
   - Find your domain (e.g., `yourdomain.com`)
   - Click **Manage** button

3. **Advanced DNS Settings**
   - Click on **Advanced DNS** tab
   - You'll see a list of DNS records

4. **Add CNAME Record**
   - Click **+ Add New Record**
   - Fill in the details:
     ```
     Type: CNAME Record
     Host: app (or your subdomain name)
     Value: [your-project].up.railway.app (from Railway)
     TTL: Automatic (or 5 min for testing)
     ```
   - Click the **✓** checkmark to save

5. **Wait for Propagation**
   - DNS changes take 5-30 minutes
   - Sometimes up to 24-48 hours (rarely)

**Visual Example:**
```
┌──────────────┬──────────┬─────────────────────────────────┬──────────┐
│ Type         │ Host     │ Value                           │ TTL      │
├──────────────┼──────────┼─────────────────────────────────┼──────────┤
│ CNAME Record │ app      │ your-project.up.railway.app     │ Automatic│
└──────────────┴──────────┴─────────────────────────────────┴──────────┘
```

### Option B: Root Domain Setup

**Example**: Setting up `yourdomain.com`

**Method 1: CNAME Flattening (if Railway provides CNAME)**

1. **Log into Namecheap**
2. **Manage Domain** → **Advanced DNS**
3. **Add CNAME Record for @ (root)**
   ```
   Type: CNAME Record
   Host: @ (represents root domain)
   Value: [your-project].up.railway.app
   TTL: Automatic
   ```

**Note**: Namecheap supports CNAME flattening, so this works for root domains.

**Method 2: A Record (if Railway provides IP address)**

1. **Log into Namecheap**
2. **Manage Domain** → **Advanced DNS**
3. **Add A Record**
   ```
   Type: A Record
   Host: @ (represents root domain)
   Value: [IP address from Railway]
   TTL: Automatic
   ```

4. **Optional: Add www subdomain**
   ```
   Type: CNAME Record
   Host: www
   Value: yourdomain.com
   TTL: Automatic
   ```
   This makes `www.yourdomain.com` redirect to `yourdomain.com`

### Option C: Both Root + Subdomain

**Setup**: Both `yourdomain.com` and `app.yourdomain.com`

1. **Add Root Domain** (as in Option B)
2. **Add Subdomain** (as in Option A)

**Result**:
- `https://yourdomain.com` → Your main app
- `https://app.yourdomain.com` → Your dashboard app
- (You can point them to the same Railway service or different services)

### Important Namecheap Settings

**Nameservers**:
- Make sure you're using **Namecheap BasicDNS** or **Namecheap PremiumDNS**
- If you see "Custom DNS", you might be using external nameservers
- To check: **Domain List** → **Manage** → **Nameservers** section
- Should show: `dns1.registrar-servers.com` and `dns2.registrar-servers.com`

**Remove Conflicting Records**:
- Delete any existing A records for `@` or your subdomain
- Delete any existing CNAME records that conflict
- Common conflict: Namecheap parking page (remove it)

---

## 🌐 DNS Configuration - Other Providers

### GoDaddy

1. **Login** → **My Products** → **Domains** → **Manage**
2. **DNS Management** → **Records**
3. **Add Record**:
   - For subdomain:
     ```
     Type: CNAME
     Name: app (or subdomain)
     Value: your-project.up.railway.app
     TTL: 1 Hour (or 600 seconds)
     ```
   - For root domain:
     ```
     Type: A
     Name: @ (or leave blank)
     Value: [Railway IP]
     TTL: 1 Hour
     ```

### Cloudflare

1. **Login** → Select your domain
2. **DNS** → **Records** → **Add record**
3. **Add Record**:
   - For subdomain:
     ```
     Type: CNAME
     Name: app
     Content: your-project.up.railway.app
     Proxy status: DNS only (turn off orange cloud initially)
     TTL: Auto
     ```
   - For root domain:
     ```
     Type: CNAME
     Name: @ (root)
     Content: your-project.up.railway.app
     Proxy status: DNS only
     TTL: Auto
     ```

**Note**: Cloudflare supports CNAME flattening, so you can use CNAME for root domain.

**After it works, you can enable Cloudflare proxy (orange cloud) for additional security.**

### Google Domains

1. **Login** → **My domains** → Select domain → **DNS**
2. **Custom records** → **Manage custom records**
3. **Create new record**:
   - For subdomain:
     ```
     Host name: app
     Type: CNAME
     TTL: 1H
     Data: your-project.up.railway.app
     ```
   - For root domain:
     ```
     Host name: @ (or leave blank)
     Type: A
     TTL: 1H
     Data: [Railway IP]
     ```

### Squarespace Domains

1. **Settings** → **Domains** → Select domain → **DNS Settings**
2. **Custom Records** → **Add**
3. **Add Record**:
   - For subdomain:
     ```
     Record Type: CNAME
     Host: app
     Data: your-project.up.railway.app
     ```

---

## 🔒 SSL/TLS Certificates

### Automatic SSL with Railway

**Good News**: Railway automatically provisions SSL/TLS certificates using Let's Encrypt!

**What This Means**:
- ✅ Your site will automatically use `https://`
- ✅ No manual certificate setup needed
- ✅ Auto-renewal every 90 days
- ✅ Browsers show secure padlock icon

### SSL Provisioning Process

1. **After DNS is configured**, Railway detects the domain
2. **Automatic SSL request** sent to Let's Encrypt
3. **Certificate issued** (usually within 5-10 minutes)
4. **HTTPS enabled** automatically

### Checking SSL Status

**In Railway Dashboard**:
1. Go to your service
2. Click **Settings** → **Domains**
3. Look for your domain
4. Status should show: **✓ SSL Certificate Active** (green checkmark)

**In Browser**:
1. Visit `https://yourdomain.com` or `https://app.yourdomain.com`
2. Click the **padlock icon** in address bar
3. Should show "Connection is secure"
4. Certificate issued by "R3" (Let's Encrypt)

### Force HTTPS Redirect

To ensure all HTTP traffic redirects to HTTPS, add this to your Next.js config:

**File**: `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http',
          },
        ],
        destination: 'https://:path*',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
```

**Or** use Railway's automatic HTTPS enforcement (usually enabled by default).

---

## ✅ Verification & Testing

### Step 1: Check DNS Propagation

**Online Tools**:
- [DNS Checker](https://dnschecker.org/) - Check globally
- [What's My DNS](https://www.whatsmydns.net/) - Multiple locations
- [MX Toolbox](https://mxtoolbox.com/SuperTool.aspx) - DNS lookup

**How to Use**:
1. Go to DNS Checker
2. Enter your domain: `app.yourdomain.com`
3. Select record type: `CNAME`
4. Click "Search"
5. Check results: Should show `your-project.up.railway.app`
6. Green checkmarks = propagated globally
7. Red X = still propagating (wait 10-15 minutes)

**Command Line** (for tech users):

**Windows (PowerShell)**:
```powershell
nslookup app.yourdomain.com
```

**Mac/Linux**:
```bash
dig app.yourdomain.com
```

**Expected Output**:
```
app.yourdomain.com.    300    IN    CNAME    your-project.up.railway.app.
```

### Step 2: Test HTTP Access

1. Open browser (incognito/private mode recommended)
2. Visit `http://app.yourdomain.com` (HTTP, not HTTPS yet)
3. Should either:
   - Load your app, OR
   - Redirect to HTTPS automatically

### Step 3: Test HTTPS Access

1. Visit `https://app.yourdomain.com` (HTTPS)
2. Should load your app with secure connection
3. Check for padlock icon in address bar
4. No certificate warnings = success!

### Step 4: Test All Variations

If you set up both root + www:
- ✅ `http://yourdomain.com` → redirects to `https://yourdomain.com`
- ✅ `https://yourdomain.com` → loads app
- ✅ `http://www.yourdomain.com` → redirects to `https://www.yourdomain.com`
- ✅ `https://www.yourdomain.com` → loads app or redirects to root

### Step 5: Verify in Railway

1. Go to Railway Dashboard → Your service → Settings → Domains
2. Your custom domain should show:
   - ✓ Green checkmark
   - "SSL Certificate Active"
   - "Domain is live"

---

## 🔧 Troubleshooting

### Issue 1: "DNS_PROBE_FINISHED_NXDOMAIN"

**Meaning**: Domain not found / DNS not configured

**Solutions**:
1. Double-check DNS records in Namecheap
2. Ensure no typos in subdomain name or CNAME value
3. Wait longer (up to 24 hours in rare cases)
4. Clear browser cache: `Ctrl+Shift+Del` → Clear cache
5. Flush DNS cache:
   - **Windows**: `ipconfig /flushdns` in Command Prompt
   - **Mac**: `sudo dscacheutil -flushcache` in Terminal
   - **Linux**: `sudo systemd-resolve --flush-caches`

### Issue 2: "Certificate Not Valid" or "NET::ERR_CERT_COMMON_NAME_INVALID"

**Meaning**: SSL certificate not issued yet or domain mismatch

**Solutions**:
1. Wait 10-15 minutes after DNS propagates
2. Check Railway domain list shows your custom domain
3. In Railway, try removing and re-adding the domain
4. Ensure you're accessing exactly the domain you configured:
   - If you added `app.yourdomain.com`, don't visit `www.app.yourdomain.com`
5. Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### Issue 3: Domain Shows Namecheap Parking Page

**Meaning**: DNS still pointing to Namecheap default page

**Solutions**:
1. Check if you have a conflicting A record or URL redirect in Namecheap
2. Delete any parking page records:
   - Go to Namecheap → Advanced DNS
   - Delete A record for `@` pointing to Namecheap's parking IP
   - Delete any URL Redirect records
3. Add your CNAME record (as above)
4. Wait for propagation

### Issue 4: "Too Many Redirects" (Redirect Loop)

**Meaning**: Conflicting redirect rules

**Solutions**:
1. In Namecheap, remove any URL Redirect records
2. Check your Next.js app doesn't have conflicting redirects
3. If using Cloudflare:
   - Set SSL/TLS encryption to "Full" (not "Flexible")
   - Or disable Cloudflare proxy temporarily
4. Check Railway logs for redirect issues

### Issue 5: Subdomain Works, But Root Domain Doesn't (or vice versa)

**Meaning**: Separate DNS records needed for each

**Solutions**:
1. Root domain and subdomains are configured separately
2. Add both records in DNS:
   - One for `@` (root)
   - One for `www` or `app` (subdomain)
3. In Railway, add both domains as separate custom domains

### Issue 6: Works on Some Devices, Not Others

**Meaning**: DNS propagation in progress or local cache

**Solutions**:
1. This is normal during propagation
2. Wait 1-2 hours for global propagation
3. Flush DNS on devices where it doesn't work
4. Use different networks (mobile data vs WiFi) to test

### Issue 7: "Railway Couldn't Verify Domain"

**Meaning**: DNS records not pointing correctly

**Solutions**:
1. Verify CNAME value exactly matches Railway's provided value
2. Check for extra spaces or typos
3. Remove `http://` or `https://` from CNAME value (should be just the domain)
4. Ensure TTL isn't too long (use Automatic or 5 minutes for testing)
5. Wait 15-30 minutes after DNS changes

### Issue 8: Custom Domain Works, but Railway Domain Still Shows

**Meaning**: Both domains active (normal behavior)

**Solutions**:
- This is **expected behavior**
- Your Railway domain (`your-project.up.railway.app`) will continue to work
- You can use either domain to access your app
- To force custom domain only, add redirect logic in your app

---

## 📊 DNS Record Summary Cheat Sheet

### For Subdomain (e.g., `app.yourdomain.com`)

**Namecheap**:
```
Type: CNAME
Host: app
Value: your-project.up.railway.app
TTL: Automatic
```

**GoDaddy**:
```
Type: CNAME
Name: app
Value: your-project.up.railway.app
TTL: 1 Hour
```

**Cloudflare**:
```
Type: CNAME
Name: app
Content: your-project.up.railway.app
Proxy: DNS only (gray cloud)
```

### For Root Domain (e.g., `yourdomain.com`)

**Namecheap (CNAME Flattening)**:
```
Type: CNAME
Host: @
Value: your-project.up.railway.app
TTL: Automatic
```

**OR A Record** (if Railway provides IP):
```
Type: A
Host: @
Value: [Railway IP from dashboard]
TTL: Automatic
```

### For www Subdomain

**Add this in addition to root**:
```
Type: CNAME
Host: www
Value: yourdomain.com (or your-project.up.railway.app)
TTL: Automatic
```

---

## 🎯 Recommended Setup

### For Production

**Setup**: Root domain + www subdomain + app subdomain

**Configuration**:
1. **Root domain** (`yourdomain.com`):
   - CNAME to Railway project
   - Main marketing site or redirect to app

2. **www subdomain** (`www.yourdomain.com`):
   - CNAME to root domain
   - Redirects to root

3. **app subdomain** (`app.yourdomain.com`):
   - CNAME to Railway project
   - Your dashboard application

**DNS Records** (Namecheap):
```
┌──────────────┬──────────┬─────────────────────────────────┬──────────┐
│ Type         │ Host     │ Value                           │ TTL      │
├──────────────┼──────────┼─────────────────────────────────┼──────────┤
│ CNAME        │ @        │ your-project.up.railway.app     │ Automatic│
│ CNAME        │ www      │ yourdomain.com                  │ Automatic│
│ CNAME        │ app      │ your-project.up.railway.app     │ Automatic│
└──────────────┴──────────┴─────────────────────────────────┴──────────┘
```

**Railway Domains**:
- Add: `yourdomain.com`
- Add: `www.yourdomain.com`
- Add: `app.yourdomain.com`

All three will point to your app, with automatic HTTPS.

---

## ⏱️ Expected Timeline

| Step | Time |
|------|------|
| Add domain in Railway | 1 minute |
| Configure DNS in Namecheap | 5 minutes |
| DNS propagation (initial) | 5-30 minutes |
| DNS propagation (global) | 1-24 hours |
| SSL certificate issuance | 5-10 minutes (after DNS) |
| Total minimum time | ~30 minutes |
| Total maximum time | ~24 hours |

**Pro Tip**: Use low TTL (5 minutes) during setup for faster changes, then increase to 1 hour or automatic after it's working.

---

## 🚀 Quick Start Checklist

- [ ] Choose domain option (root, subdomain, or both)
- [ ] Log into Railway Dashboard
- [ ] Add custom domain to your service
- [ ] Copy Railway's DNS instructions (CNAME value)
- [ ] Log into Namecheap (or your domain provider)
- [ ] Navigate to Advanced DNS
- [ ] Add CNAME record with Railway's value
- [ ] Save DNS changes
- [ ] Wait 15-30 minutes
- [ ] Check DNS propagation at dnschecker.org
- [ ] Visit your custom domain in browser
- [ ] Verify HTTPS works (padlock icon)
- [ ] Check Railway dashboard shows SSL active
- [ ] Test on multiple devices/browsers
- [ ] Celebrate! 🎉

---

## 📞 Additional Resources

**Railway Docs**:
- [Custom Domains Guide](https://docs.railway.app/deploy/exposing-your-app#custom-domains)
- [SSL Certificates](https://docs.railway.app/deploy/exposing-your-app#ssl-certificates)

**DNS Tools**:
- [DNS Checker](https://dnschecker.org/)
- [What's My DNS](https://www.whatsmydns.net/)
- [MX Toolbox](https://mxtoolbox.com/SuperTool.aspx)

**SSL Test**:
- [SSL Labs Test](https://www.ssllabs.com/ssltest/)

**Namecheap Support**:
- [How to set up CNAME records](https://www.namecheap.com/support/knowledgebase/article.aspx/9646/2237/how-to-create-a-cname-record-for-your-domain/)

---

**Good luck with your domain setup!** 🚀

If you encounter any issues not covered here, check Railway's logs in the Dashboard for detailed error messages.
