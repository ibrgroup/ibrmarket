# Authentication Architecture - Production Guidelines

## 🎯 Core Principle: Single Source of Truth

**Backend is the ONLY authoritative source for authentication decisions.**

- ✅ Backend validates JWT signatures
- ✅ Backend reads httpOnly cookies
- ✅ Backend manages sessions
- ❌ Frontend NEVER verifies JWT signatures
- ❌ Frontend NEVER reads httpOnly cookies via `document.cookie`

---

## 📋 Sources of Truth by Context

| Context | Source of Truth | How to Access |
|---------|----------------|---------------|
| **Backend** | JWT + Session DB | Backend middleware validates tokens |
| **Middleware/SSR** | `accessToken` httpOnly cookie | `verifySession(request)` - optimistic decode |
| **Client UI** | `user` from Zustand store | `useUserStore((state) => state.user)` |
| **Rehydration** | API call to `/profile` | `userService.getProfile()` - backend reads cookie |
| **API Requests** | `accessToken` httpOnly cookie | Automatic via `credentials: 'include'` |

---

## ✅ CORRECT Patterns

### Client-Side: React Components/Hooks

```typescript
import { useUserStore } from '@/entities/user';

function MyComponent() {
  const user = useUserStore((state) => state.user);
  const userId = user?._id || user?.id;

  if (!user) {
    return <div>Not authenticated</div>;
  }

  return <div>Hello {user.name}</div>;
}
```

### Client-Side: Stores/Services (Outside React)

```typescript
import { useUserStore } from '@/entities/user';

// In Zustand stores, API services, etc.
const user = useUserStore.getState().user;
const userId = user?._id || user?.id || user?.userId;

if (!userId) {
  // User not authenticated
  return;
}
```

### Server-Side: API Routes / Server Components

```typescript
import { verifySession } from '@/shared/lib/auth-server';

// In API routes
export async function GET(request: NextRequest) {
  const { user } = verifySession(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use user._id or user.id
  return NextResponse.json({ userId: user._id || user.id });
}
```

### Rehydration: Page Reload

```typescript
// In user.store.ts onRehydrateStorage
userService.getProfile()
  .then((profile) => {
    // Backend read token from httpOnly cookie automatically
    // If API succeeds → user is authenticated
    useUserStore.setState({ user: profile, isAuthenticated: true });
  })
  .catch(() => {
    // If API fails → user is not authenticated
    useUserStore.setState({ user: null, isAuthenticated: false });
  });
```

---

## ❌ WRONG Patterns (Anti-Patterns)

### ❌ DON'T: Decode JWT in Business Logic

```typescript
// ❌ WRONG - Creates dual source of truth
import { getUserFromToken } from '@/shared/lib/auth';
const user = getUserFromToken(); // Decodes JWT - WRONG!
```

**Why wrong:**
- Creates dual source of truth (Zustand vs JWT decode)
- JWT decoding in business logic is architectural smell
- httpOnly cookies can't be read via `document.cookie`
- Breaks SSR/Edge expectations

### ❌ DON'T: Read httpOnly Cookies in JS

```typescript
// ❌ WRONG - httpOnly cookies are not accessible
const token = document.cookie.match(/accessToken=([^;]+)/)?.[1];
```

**Why wrong:**
- httpOnly cookies are intentionally inaccessible to JavaScript
- This is a security feature (XSS protection)
- Use API calls instead

### ❌ DON'T: Store refreshToken in Client

```typescript
// ❌ WRONG - refreshToken must NEVER be in JS memory
localStorage.setItem('refreshToken', token);
// or
useUserStore.setState({ refreshToken: token });
```

**Why wrong:**
- refreshToken is long-lived credential
- XSS attack = full account takeover
- Must be httpOnly cookie ONLY

---

## 🔐 Token Storage Rules

### accessToken

| Location | Purpose | Security |
|----------|---------|----------|
| **Backend httpOnly cookie** | Primary storage, automatic API auth | ✅ Secure (XSS protected) |
| **Zustand store** | Client-side access for Authorization header | ⚠️ Acceptable (short-lived) |
| **localStorage** | ❌ NEVER | ❌ Security risk |
| **document.cookie read** | ❌ NEVER (httpOnly) | ❌ Impossible |

### refreshToken

| Location | Purpose | Security |
|----------|---------|----------|
| **Backend httpOnly cookie ONLY** | Token rotation, session management | ✅ Secure (XSS protected) |
| **Zustand store** | ❌ NEVER | ❌ Critical security risk |
| **localStorage** | ❌ NEVER | ❌ Critical security risk |
| **Response body** | ❌ NEVER | ❌ Critical security risk |

---

## 🔄 Authentication Flow

### Login Flow

```
1. User submits OTP → Frontend calls POST /verify-otp
2. Backend validates OTP → Generates accessToken + refreshToken
3. Backend sets httpOnly cookies (accessToken, refreshToken)
4. Backend returns accessToken in response body
5. Frontend saves accessToken to Zustand store
6. Frontend calls GET /profile → Gets user data
7. Frontend saves user to Zustand store
```

### Rehydration Flow (Page Reload)

```
1. Page loads → Zustand rehydrates from localStorage (user only, no tokens)
2. onRehydrateStorage triggers → Calls GET /profile
3. Backend reads accessToken from httpOnly cookie automatically
4. If token valid → Returns user profile
5. Frontend saves user to Zustand store
6. If token invalid → Frontend clears store
```

### Refresh Flow

```
1. accessToken expires → API returns 401
2. Frontend calls POST /refresh-token with credentials: 'include'
3. Backend reads refreshToken from httpOnly cookie (NOT from request body)
4. Backend validates refreshToken → Rotates tokens
5. Backend sets new httpOnly cookies
6. Backend returns new accessToken in response body
7. Frontend updates accessToken in Zustand store
```

---

## 🚫 Removed Functions

### `getUserFromToken()` - DEPRECATED & REMOVED

**Why removed:**
- Created dual source of truth
- JWT decoding in business logic is architectural smell
- httpOnly cookies can't be read anyway

**Replacement:**
- Client: `useUserStore((state) => state.user)`
- Server: `verifySession(request)`
- Rehydration: `userService.getProfile()`

---

## 📝 Rules Summary

1. **httpOnly cookies NEVER read in JS** → Use API calls
2. **JWT NEVER decoded in business logic** → Use Zustand user object
3. **Zustand stores USER, not TOKEN logic** → Stores user data, not JWT payload
4. **Backend is source of truth** → All auth decisions come from backend
5. **UI state is optimistic** → Decoded tokens in Server Components are optimistic only
6. **refreshToken NEVER in client** → httpOnly cookie ONLY
7. **Single source of truth** → No dual sources (Zustand vs JWT decode)

---

## 🔍 Multi-Tab Synchronization

### Current Implementation

- ✅ BroadcastChannel for logout/refresh events
- ✅ React Query invalidation on auth events
- ⚠️ Zustand is transient (not authoritative)

### Future Enhancement (Optional)

- Add storage event listener for cross-tab sync
- Add React Query invalidation on storage events
- Consider session management UI (see/revoke sessions)

---

## ✅ Migration Checklist

- [x] Removed `getUserFromToken()` from all business logic
- [x] Replaced with `useUserStore().user` in client code
- [x] Replaced with `verifySession()` in server code
- [x] Updated rehydration to use API check
- [x] Removed refreshToken from Zustand store
- [x] Updated all stores (cart, wishlist) to use Zustand user
- [x] Created clear architecture documentation

---

## 📚 Related Files

- `src/shared/lib/auth.ts` - Client-side auth utilities (token management)
- `src/shared/lib/auth-server.ts` - Server-side session verification
- `src/entities/user/model/user.store.ts` - User state management
- `src/middleware.ts` - Next.js middleware (Edge Runtime)
- `server/middlewares/auth.js` - Backend auth middleware
- `server/utils/cookie-config.js` - Cookie configuration

---

**Last Updated:** 2025-01-XX
**Status:** Production-Ready ✅
