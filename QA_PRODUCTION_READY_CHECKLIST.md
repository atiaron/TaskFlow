# 🎯 TaskFlow Production-Ready QA Checklist

## Pre-Flight Status Check ✅

### ✅ Configuration Verified:

- **Frontend ENV**: `REACT_APP_AUTO_LOGIN=0`, `REACT_APP_GUEST_MODE=1`, `REACT_APP_USE_EMULATORS=1`
- **Backend ENV**: `FIREBASE_AUTH_EMULATOR_HOST=localhost:9099`, `NODE_ENV=development`
- **Emulator Ports**: Auth=9099, Firestore=8084, UI=4001
- **Service Ports**: Frontend=3000, Backend=3333

---

## 🧪 Manual QA Tests

### **Test 1: Guest Mode without Auto-Login** 🎯

**URL**: http://localhost:3000

**Steps**:

1. ✅ Open http://localhost:3000 in browser
2. ⏳ Check DevTools → Network tab
3. ⏳ Look for absence of `POST /api/auth/exchange`
4. ⏳ Verify UI shows Guest mode (no logged-in user)
5. ⏳ Create 1-2 tasks to test local storage

**Expected Results**:

- ✅ No automatic authentication calls
- ✅ UI in Guest mode
- ✅ Tasks save locally and persist after refresh

---

### **Test 2: Backend & Auth Bridge** 🎯

**URLs**:

- Backend: http://localhost:3333/health
- Auth: http://localhost:3333/api/auth/exchange

**Manual Check**:

1. ⏳ Visit http://localhost:3333/health
2. ⏳ Should see JSON with status: "OK"
3. ⏳ In DevTools Console, test auth exchange:

```javascript
fetch("/api/auth/exchange", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ idToken: "mock-id-token" }),
})
  .then((r) => r.json())
  .then(console.log);
```

**Expected Results**:

- ✅ Backend health returns 200 OK
- ✅ Auth exchange returns access + refresh tokens
- ✅ Mock token bypass works

---

### **Test 3: Proxy Functionality** 🎯

**URLs**:

- Direct: http://localhost:3333/api/health
- Proxied: http://localhost:3000/api/health

**Steps**:

1. ⏳ Open both URLs in separate tabs
2. ⏳ Compare responses

**Expected Results**:

- ✅ Both return identical JSON responses
- ✅ No 502 Gateway errors
- ✅ Proxy routing works correctly

---

### **Test 4: Emulator Enforcement** 🎯

**URLs**:

- Auth UI: http://localhost:4001/auth
- Firestore UI: http://localhost:4001/firestore
- Main UI: http://localhost:4001

**Steps**:

1. ⏳ Open http://localhost:4001 (Emulator UI)
2. ⏳ Check Auth and Firestore tabs
3. ⏳ In browser console on main app, look for emulator logs

**Expected Results**:

- ✅ Emulator UI loads successfully
- ✅ Auth emulator shows as connected
- ✅ Firestore emulator shows as connected
- ✅ Console logs mention "Emulators enabled"

---

### **Test 5: Login/Logout Flow** 🎯

**Precondition**: UI in Guest mode

**Steps**:

1. ⏳ Click Login button (should exist)
2. ⏳ Use MockAuth (dev@taskflow.com or similar)
3. ⏳ Verify DevTools shows `POST /api/auth/exchange` → 200
4. ⏳ Check sessionStorage for `tf-access-token`
5. ⏳ Click Logout
6. ⏳ Verify return to Guest mode

**Expected Results**:

- ✅ Login triggers auth exchange
- ✅ Tokens stored in sessionStorage
- ✅ UI shows logged-in state
- ✅ Logout clears tokens and returns to Guest

---

### **Test 6: Data Isolation** 🎯

**Precondition**: Have both Guest data and user data

**Steps**:

1. ⏳ In Guest mode: create task "Guest Task 1"
2. ⏳ Login as user
3. ⏳ Verify Guest tasks not visible
4. ⏳ Create task "User Task 1"
5. ⏳ Logout
6. ⏳ Verify only Guest tasks visible

**Expected Results**:

- ✅ Guest data isolated from user data
- ✅ No data leakage between modes
- ✅ Proper context switching

---

## 🏁 Final Validation

### ✅ All Systems Green Checklist:

- [ ] Frontend loads without auto-login
- [ ] Backend responds to health checks
- [ ] Auth exchange works with mock tokens
- [ ] Proxy routes API calls correctly
- [ ] All emulators running and connected
- [ ] Login/logout flow functional
- [ ] Data properly isolated between Guest/User modes

### 🚨 If Any Test Fails:

1. Check specific service logs
2. Verify environment variables
3. Restart affected services
4. Re-run specific test

---

## 🎉 Success Criteria

**Production-Ready Status**: All 6 tests pass ✅

**Ready for**:

- ✅ Feature development
- ✅ Guest Mode implementation
- ✅ Cloud sync development
- ✅ Production deployment preparation

---

_QA Specialist Notes: This checklist validates the core infrastructure is solid before building additional features. Focus on Guest Mode behavior and Auth Bridge stability._
