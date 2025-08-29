SwiftUI Port Map Template

This document helps track the migration from the existing web/Expo screens to their SwiftUI counterparts.  Fill in each row as you port screens, noting any special design or API considerations.  If a component does not have a direct analogue, describe how its functionality will be reproduced in SwiftUI.


Web screen/component
Expo (React Native) file
Future SwiftUI view
Notes (navigation, state management, API calls, etc.)
src/screens/Mobile/HomeScreen.tsx
apps/mobile/screens/HomeScreen.tsx
HomeView.swift
src/screens/Mobile/ActivityScreen.tsx
apps/mobile/screens/ActivityScreen.tsx
ActivityView.swift
src/screens/Mobile/CardScreen.tsx
apps/mobile/screens/CardScreen.tsx
CardView.swift
src/screens/Mobile/RulesScreen.tsx
apps/mobile/screens/RulesScreen.tsx
RulesView.swift
src/screens/Mobile/SettingsScreen.tsx
apps/mobile/screens/SettingsScreen.tsx
SettingsView.swift
src/screens/Mobile/TransactionDetailsScreen.tsx
apps/mobile/screens/TransactionDetailsScreen.tsx
TransactionDetailsView.swift
…
…
…
…


How to use this file
	•	Web screen/component: The file path of the original React/Vite page or component.
	•	Expo (React Native) file: The path of the migrated React Native screen or component.
	•	Future SwiftUI view: The name of the SwiftUI file (e.g. HomeView.swift) you plan to create.
	•	Notes: Document important state or API calls that must be replicated, differences in navigation patterns, or any design variations (e.g. “Uses @StateObject for data”, “Needs custom modal presentation”).
	•	Continue adding rows as you migrate additional screens (e.g. auth and onboarding flows).
	•	Use this document as your single source of truth when you begin the SwiftUI rewrite.