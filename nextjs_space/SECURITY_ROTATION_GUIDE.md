
# 🔐 SECURITY ROTATION GUIDE

**Last Updated:** 2025-10-22  
**Next Rotation Due:** 2026-01-22 (90 days)  
**Responsible:** System Administrator / DevOps Team  
**Estimated Time:** 30-45 minutes per rotation

---

## 📋 OVERVIEW

This guide provides step-by-step instructions for rotating all sensitive credentials in the Klinik Flow Control application. Regular rotation is critical for:

- ✅ **Security compliance** (GDPR, ISO 27001)
- ✅ **Breach mitigation** (limit exposure if credentials leak)
- ✅ **Best practices** (90-day rotation is industry standard)

---

## 🗓️ ROTATION SCHEDULE

### 90-Day Rotation (Critical)
- **Meta Access Token** (if User Access Token, not System User)
- **Database Password**
- **NextAuth Secret**
- **Cron Secret**
- **Meta Webhook Verify Token**

### 180-Day Rotation (High Priority)
- **Bokadirekt API Key**
- **46elks Username/Password**
- **GHL API Key**
- **Plaid Secret**

### Yearly Rotation (Medium Priority)
- **Google OAuth Client Secret**
- **Resend API Key**
- **Abacus AI API Key**

### Never Expires (But Monitor)
- **Meta System User Token** (if configured correctly)
- **AWS IAM Role** (profile-based auth)

---

## 🔄 ROTATION PROCEDURES

### 1. META ACCESS TOKEN (CRITICAL)

**Why:** Compromised token = full access to your ad account  
**Frequency:** 90 days (or use System User Token - never expires)  
**Time:** 10 minutes

#### Step-by-Step:

**Option A: Create System User Token (Recommended - NEVER EXPIRES)**

1. Go to [Meta Business Manager](https://business.facebook.com)
2. Navigate to: **Business Settings** → **Users** → **System Users**
3. Click **"Add"** or select existing system user
4. Click **"Generate New Token"**
5. Select your app from the dropdown
6. Check permissions:
   - ✅ `ads_management`
   - ✅ `ads_read`
   - ✅ `ads_creative_read`
7. Select **"Never Expire"**
8. Click **"Generate Token"**
9. Copy the token (you won't see it again!)

**Update in app:**
```bash
# Update .env file:
META_ACCESS_TOKEN=NEW_TOKEN_HERE

# Update auth_secrets.json:
nano /home/ubuntu/.config/abacusai_auth_secrets.json
# Find "meta marketing api" → "access_token" → "value" → Replace

# Restart application:
pm2 restart flow  # or your deployment method
```

**Verify:**
```bash
curl "https://graph.facebook.com/v18.0/act_YOUR_AD_ACCOUNT_ID?fields=name,account_status&access_token=NEW_TOKEN" | jq
```

---

### 2. DATABASE PASSWORD

**Why:** Database contains all customer data (PII, booking info)  
**Frequency:** 90 days  
**Time:** 15 minutes

#### Step-by-Step:

1. **Generate new password:**
```bash
openssl rand -base64 32
```

2. **Update database user password** (via Supabase/Postgres provider):
   - Go to your database provider dashboard
   - Navigate to: Database → Users
   - Select your database user
   - Click "Reset Password"
   - Enter new password (from step 1)
   - Save

3. **Update DATABASE_URL in .env:**
```bash
# Old format:
postgresql://user:OLD_PASSWORD@host:5432/database

# New format:
postgresql://user:NEW_PASSWORD@host:5432/database
```

4. **Test connection:**
```bash
cd /home/ubuntu/flow/nextjs_space
npx prisma db execute --stdin <<< "SELECT 1"
```

5. **Restart application:**
```bash
pm2 restart flow
```

6. **Verify logs:**
```bash
pm2 logs flow --lines 50
# Look for successful database connection
```

---

### 3. NEXTAUTH_SECRET

**Why:** Used for session encryption (JWT signing)  
**Frequency:** 90 days  
**Time:** 5 minutes

#### Step-by-Step:

1. **Generate new secret:**
```bash
openssl rand -base64 32
```

2. **Update .env:**
```bash
NEXTAUTH_SECRET=NEW_SECRET_HERE
```

3. **⚠️ IMPORTANT:** This will invalidate ALL existing sessions!
   - All users will be logged out
   - Schedule rotation during low-traffic hours
   - Notify users in advance

4. **Restart application:**
```bash
pm2 restart flow
```

5. **Test login:**
   - Go to https://goto.klinikflow.app/auth/login
   - Login with test account
   - Verify session works

---

### 4. CRON_SECRET

**Why:** Prevents unauthorized execution of cron jobs  
**Frequency:** 90 days  
**Time:** 5 minutes

#### Step-by-Step:

1. **Generate new secret:**
```bash
openssl rand -hex 32
```

2. **Update .env:**
```bash
CRON_SECRET=NEW_SECRET_HERE
```

3. **Update cron job configuration** (if using external cron service):
   - Example: Vercel Cron, GitHub Actions, etc.
   - Update the `Authorization: Bearer ${CRON_SECRET}` header

4. **Test cron endpoint:**
```bash
curl -X POST https://goto.klinikflow.app/api/cron/bokadirekt-sync \
  -H "Authorization: Bearer NEW_SECRET_HERE"
```

5. **Restart application:**
```bash
pm2 restart flow
```

---

### 5. META_WEBHOOK_VERIFY_TOKEN

**Why:** Validates incoming webhook requests from Meta  
**Frequency:** 90 days  
**Time:** 10 minutes

#### Step-by-Step:

1. **Generate new token:**
```bash
openssl rand -hex 32
```

2. **Update .env:**
```bash
META_WEBHOOK_VERIFY_TOKEN=NEW_TOKEN_HERE
```

3. **Update Meta Webhook Configuration:**
   - Go to [Meta Developers Console](https://developers.facebook.com/apps/)
   - Select your app (ID: 1565440758216750)
   - Navigate to: **Webhooks** → **Edit Subscription**
   - Enter new Verify Token
   - Click **"Verify and Save"**

4. **Test webhook:**
```bash
curl "https://goto.klinikflow.app/api/webhooks/meta?hub.mode=subscribe&hub.verify_token=NEW_TOKEN_HERE&hub.challenge=TEST123"
# Should return: TEST123
```

5. **Restart application:**
```bash
pm2 restart flow
```

---

### 6. BOKADIREKT API KEY

**Why:** Access to all booking data  
**Frequency:** 180 days  
**Time:** 10 minutes

#### Step-by-Step:

1. **Generate new API key:**
   - Go to [Bokadirekt API Portal](https://external.api.portal.bokadirekt.se)
   - Navigate to: **API Keys** → **Create New Key**
   - Copy the new key

2. **Update .env:**
```bash
BOKADIREKT_API_KEY=NEW_KEY_HERE
```

3. **Update auth_secrets.json:**
```bash
nano /home/ubuntu/.config/abacusai_auth_secrets.json
# Find "bokadirekt" → "api_key" → "value" → Replace
```

4. **Test API connection:**
```bash
curl -X GET "https://external.api.portal.bokadirekt.se/api/v1/bookings" \
  -H "api-key: NEW_KEY_HERE" | jq
```

5. **Restart application:**
```bash
pm2 restart flow
```

6. **Verify sync:**
   - Go to https://goto.klinikflow.app/dashboard
   - Check that bookings are syncing

---

### 7. 46ELKS USERNAME/PASSWORD

**Why:** SMS sending credentials  
**Frequency:** 180 days  
**Time:** 10 minutes

#### Step-by-Step:

1. **Generate new password in 46elks dashboard:**
   - Go to [46elks Dashboard](https://46elks.com/dashboard)
   - Navigate to: **Settings** → **API Credentials**
   - Click **"Generate New Credentials"**
   - Copy username and password

2. **Update .env:**
```bash
FORTYSEVEN_ELKS_API_USERNAME=NEW_USERNAME
FORTYSEVEN_ELKS_API_PASSWORD=NEW_PASSWORD
```

3. **Update auth_secrets.json:**
```bash
nano /home/ubuntu/.config/abacusai_auth_secrets.json
# Find "46elks" → "api_username" / "api_password" → Replace
```

4. **Test SMS sending:**
```bash
curl -X POST https://api.46elks.com/a1/sms \
  -u NEW_USERNAME:NEW_PASSWORD \
  -d from=Flow \
  -d to=+46YOUR_PHONE \
  -d message="Test message from Flow"
```

5. **Restart application:**
```bash
pm2 restart flow
```

---

### 8. GHL API KEY

**Why:** Access to GHL CRM data  
**Frequency:** 180 days  
**Time:** 10 minutes

#### Step-by-Step:

1. **Generate new API key:**
   - Go to [GHL Dashboard](https://app.gohighlevel.com)
   - Navigate to: **Settings** → **API**
   - Click **"Generate New Key"**
   - Copy the JWT token

2. **Update .env:**
```bash
GHL_API_KEY=NEW_JWT_TOKEN_HERE
```

3. **Update auth_secrets.json:**
```bash
nano /home/ubuntu/.config/abacusai_auth_secrets.json
# Find "gohighlevel" → "api_key" → Replace
```

4. **Test API:**
```bash
curl -X GET "https://rest.gohighlevel.com/v1/contacts/" \
  -H "Authorization: Bearer NEW_JWT_TOKEN" | jq
```

5. **Restart application:**
```bash
pm2 restart flow
```

---

## 🧪 TESTING AFTER ROTATION

After rotating ANY credential, run this checklist:

### Application Health Check
```bash
# 1. Check application is running
pm2 status flow

# 2. Check logs for errors
pm2 logs flow --lines 100 --err

# 3. Test main endpoints
curl https://goto.klinikflow.app/api/health
curl https://goto.klinikflow.app/api/auth/session
```

### Integration Tests
```bash
# Test Bokadirekt sync
curl -X POST https://goto.klinikflow.app/api/cron/bokadirekt-sync \
  -H "Authorization: Bearer ${CRON_SECRET}"

# Test Meta API
curl "https://graph.facebook.com/v18.0/act_${META_AD_ACCOUNT_ID}?fields=name&access_token=${META_ACCESS_TOKEN}"

# Test 46elks SMS
curl -X POST https://goto.klinikflow.app/api/sms/test \
  -H "Content-Type: application/json" \
  -d '{"to": "+46YOUR_PHONE", "message": "Test after rotation"}'
```

### User Acceptance Test
- [ ] Login as admin user
- [ ] Navigate to dashboard
- [ ] Check that all metrics load
- [ ] Verify bookings are displaying
- [ ] Test SMS sending (if applicable)
- [ ] Check Meta integration status

---

## 📝 ROTATION LOG

Keep a log of all rotations for audit purposes:

```
| Date       | Credential           | Rotated By | Reason           | Issues? |
|------------|----------------------|------------|------------------|---------|
| 2025-10-22 | Meta Access Token    | DevOps     | Scheduled (90d)  | None    |
| 2025-10-22 | Database Password    | DevOps     | Scheduled (90d)  | None    |
| 2025-10-22 | NextAuth Secret      | DevOps     | Scheduled (90d)  | None    |
| ...        | ...                  | ...        | ...              | ...     |
```

**Store this log in:** `/home/ubuntu/flow/nextjs_space/docs/rotation_log.md`

---

## 🚨 EMERGENCY ROTATION

If credentials are compromised (leaked in git, exposed in logs, etc.), follow this procedure:

### Immediate Actions (< 5 minutes)
1. **Revoke compromised credentials immediately**
   - Database: Change password via provider
   - API Keys: Revoke in respective dashboards
   - Tokens: Invalidate in Meta/GHL/etc.

2. **Enable IP restrictions** (if available)
   - Meta: Business Settings → Security → IP Whitelist
   - Database: Firewall rules → Restrict to app server IPs

3. **Monitor for suspicious activity**
   - Database: Check query logs for unusual patterns
   - Meta: Check ad account activity for unauthorized changes
   - SMS: Check 46elks logs for unexpected sends

### Follow-up Actions (< 1 hour)
4. **Rotate ALL potentially affected credentials**
   - Even if only one was compromised, rotate related ones
   - Example: If .env was leaked, rotate EVERYTHING

5. **Investigate breach source**
   - Check git history: `git log --all --full-history --source -- .env`
   - Check server logs for unauthorized access
   - Review recent deployments for misconfigurations

6. **Document incident**
   - What was compromised?
   - How did it happen?
   - What was the impact?
   - How was it resolved?

---

## 🔗 HELPFUL COMMANDS

### Generate Strong Passwords
```bash
# 32-character alphanumeric
openssl rand -base64 32

# 64-character hex
openssl rand -hex 32

# Password with special characters (requires pwgen)
pwgen -s 32 1
```

### Check Environment Variables
```bash
# List all env vars in .env
cat /home/ubuntu/flow/nextjs_space/.env | grep -v '^#' | grep '='

# Check specific variable
echo $META_ACCESS_TOKEN

# Verify .env is loaded by app
pm2 env 0 | grep META_ACCESS_TOKEN
```

### Backup Before Rotation
```bash
# Backup .env file
cp /home/ubuntu/flow/nextjs_space/.env /home/ubuntu/flow/nextjs_space/.env.backup.$(date +%Y%m%d)

# Backup auth_secrets.json
cp /home/ubuntu/.config/abacusai_auth_secrets.json /home/ubuntu/.config/abacusai_auth_secrets.json.backup.$(date +%Y%m%d)
```

---

## 📚 RESOURCES

**Official Documentation:**
- [NextAuth.js Secret Rotation](https://next-auth.js.org/configuration/options#secret)
- [Meta System User Tokens](https://developers.facebook.com/docs/marketing-api/system-users)
- [PostgreSQL Password Management](https://www.postgresql.org/docs/current/auth-password.html)
- [OWASP Credential Management](https://cheatsheetseries.owasp.org/cheatsheets/Credential_Storage_Cheat_Sheet.html)

**Internal Docs:**
- `.env.example` - Template for all environment variables
- `docs/RLS_POLICIES_TODO.md` - Database security policies
- `META_INTEGRATION_GUIDE.md` - Meta API setup

---

## ✅ CHECKLIST: FULL ROTATION (90 days)

Use this checklist for complete credential rotation:

- [ ] **Preparation** (5 min)
  - [ ] Schedule downtime window (low-traffic hours)
  - [ ] Notify team of planned rotation
  - [ ] Backup current .env and auth_secrets.json

- [ ] **Critical Credentials** (30 min)
  - [ ] Meta Access Token → System User Token
  - [ ] Database Password
  - [ ] NextAuth Secret
  - [ ] Cron Secret
  - [ ] Meta Webhook Verify Token

- [ ] **Testing** (10 min)
  - [ ] Application starts without errors
  - [ ] Login works
  - [ ] Dashboard loads
  - [ ] Integrations respond (Bokadirekt, Meta, SMS)

- [ ] **Documentation** (5 min)
  - [ ] Update rotation log
  - [ ] Document any issues encountered
  - [ ] Set reminder for next rotation (90 days)

---

**Next Rotation Due:** _[Add calendar reminder]_  
**Responsible:** _[Assign person/team]_

---

**Questions?** Contact: support@klinikflow.se
