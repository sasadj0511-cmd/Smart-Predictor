# Security deployment checklist

Do not merge or deploy this branch until every item below is complete.

## Render secrets

Set these values in Render and never prefix them with `VITE_`:

- `GEMINI_API_KEY`
- `PERPLEXITY_API_KEY`
- `SPORTMONKS_API_TOKEN`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `FIREBASE_PROJECT_ID=gen-lang-client-0309639121`
- `FIREBASE_SERVICE_ACCOUNT_JSON` (the complete service-account JSON as one secret)
- `ADMIN_FIREBASE_UID` (the Firebase UID allowed to operate Telegram routes)
- `TELEGRAM_WEBHOOK_SECRET` (a new random value with at least 32 characters)

Rotate the Gemini, Perplexity, Sportmonks and Telegram credentials before the first protected deployment.

## Firebase

Deploy the rules and index from an authenticated Firebase CLI:

```sh
firebase deploy --only firestore:rules,firestore:indexes
```

Existing prediction documents do not contain `ownerUid`. They intentionally become inaccessible after these rules are deployed. Migrate them by assigning the correct Firebase UID before relying on old history; do not temporarily weaken the rules.

## Verification

- `/api/health` returns 200 without authentication.
- Every other `/api/*` endpoint returns 401 without a Firebase ID token.
- Telegram administration returns 403 for a signed-in non-admin user.
- `/webhook` returns 403 without Telegram's secret header.
- Two test users cannot read, update, or delete each other's predictions.
- The production JavaScript bundle contains no Gemini, Perplexity, Sportmonks, Telegram or service-account secrets.
