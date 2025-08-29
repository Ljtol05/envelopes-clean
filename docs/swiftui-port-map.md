# SwiftUI Port Map

This document tracks the migration from the existing Vite web app to Expo, and onward to a native SwiftUI rewrite.

| Web screen/component | Expo (React Native) file | Future SwiftUI view | Notes |
|---|---|---|---|
| `src/screens/Mobile/HomeScreen.tsx` | `apps/mobile/app/home.tsx` | `HomeView.swift` | Route: /home; API: GET /healthz via shared ApiClient |
| `src/screens/Mobile/ActivityScreen.tsx` | `apps/mobile/app/activity.tsx` | `ActivityView.swift` | Route: /activity |
| `src/screens/Mobile/CardScreen.tsx` | `apps/mobile/app/card.tsx` | `CardView.swift` | Route: /card |
| `src/screens/Mobile/RulesScreen.tsx` | `apps/mobile/app/rules.tsx` | `RulesView.swift` | Route: /rules |
| `src/screens/Mobile/SettingsScreen.tsx` | `apps/mobile/app/settings.tsx` | `SettingsView.swift` | Route: /settings |
| `src/screens/Mobile/TransactionDetailsScreen.tsx` | `apps/mobile/app/transaction-details.tsx` | `TransactionDetailsView.swift` | Route: /transaction-details |

As you port more components (e.g., envelope tiles, spend controls), add rows with their Expo paths and intended SwiftUI counterparts. Include state management and API notes where relevant.
