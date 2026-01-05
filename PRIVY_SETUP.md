# Privy Twitter Integration Setup Guide

## 🎯 Overview
This guide will help you integrate Privy for Twitter authentication in Spacely, allowing users to auto-fill their Twitter handle and profile picture during registration.

## 📦 Installation Status
Currently installing: `@privy-io/react-auth`

Once complete, proceed with the steps below.

## 🔑 Step 1: Get Your Privy App ID

1. Go to [dashboard.privy.io](https://dashboard.privy.io)
2. Sign up or log in
3. Click "Create New App"
4. Give it a name (e.g., "Spacely")
5. Copy your **App ID** (you'll need this)

## 🔧 Step 2: Configure Privy in App.tsx

Update `src/App.tsx` to wrap your app with `PrivyProvider`:

```typescript
import { PrivyProvider } from '@privy-io/react-auth';

// Add this before the App function
const PRIVY_APP_ID = 'your-privy-app-id-here'; // Replace with your actual App ID

function App() {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['twitter'],
        appearance: {
          theme: 'dark',
          accentColor: '#ffd700',
          logo: 'https://your-logo-url.com/logo.png', // Optional
        },
        embeddedWallets: {
          createOnLogin: 'off', // We're using Aptos wallets, not embedded ones
        },
      }}
    >
      <AptosWalletAdapterProvider plugins={wallets} autoConnect={false}>
        <Router>
          <AppContent />
        </Router>
      </AptosWalletAdapterProvider>
    </PrivyProvider>
  );
}
```

## ✨ Step 3: How It Works

The ProfileRegistrationModal is already set up! When users click "Connect Twitter":

1. **Privy popup appears** with Twitter OAuth
2. **User authorizes** Spacely to access their Twitter
3. **Auto-fill happens**:
   - Twitter handle: `@username`
   - Profile picture: User's Twitter avatar URL
4. **Preview shows** the profile picture
5. **User completes** registration with pre-filled data

## 🎨 Features Already Implemented

✅ Twitter Connect Button (blue, matches Twitter branding)
✅ Auto-fill Twitter handle
✅ Auto-fill profile picture URL
✅ Profile picture preview (80x80 circle with yellow border)
✅ Connected state indicator (shows checkmark when connected)
✅ Mobile responsive (button stacks vertically on small screens)
✅ Error handling for failed connections

## 🔐 Environment Variables (Optional)

For production, you can use environment variables:

Create `.env` file:
```
VITE_PRIVY_APP_ID=your-privy-app-id-here
```

Then in `App.tsx`:
```typescript
const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID;
```

## 📝 Testing

1. Start your dev server: `npm run dev`
2. Connect your wallet
3. Registration modal appears
4. Click "Connect Twitter"
5. Authorize in Privy popup
6. See auto-filled data!

## 🎯 What's Already Done

The code is ready in:
- ✅ `ProfileRegistrationModal.tsx` - Has Privy hooks and Twitter connect logic
- ✅ `ProfileRegistrationModal.css` - Styled Twitter button and preview
- ✅ Form auto-fill logic implemented
- ✅ Error handling in place

## 🚀 After Installation Completes

Just add your Privy App ID to `App.tsx` and you're done!

## 💡 Troubleshooting

**If Twitter data doesn't auto-fill:**
- Check that `user?.twitter` exists in console
- Verify Privy dashboard shows Twitter as enabled login method
- Make sure you're using `loginMethods: ['twitter']` in config

**If Privy popup doesn't appear:**
- Check browser console for errors
- Verify App ID is correct
- Check that PrivyProvider wraps your app

## 🎉 You're All Set!

Once the npm install completes and you add your App ID, the Twitter integration will work seamlessly!
