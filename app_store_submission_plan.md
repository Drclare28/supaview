# App Store Submission Checklist (Non-EAS)

To get **SupaView** approved on the App Store without using EAS, you will follow
a local build and upload process using Xcode.

## 1. App Store Connect & Developer Account

- [ ] **Active Membership**: Ensure your Apple Developer Program membership
      ($99/year) is active.
- [ ] **Create App Record**: Log in to
      [App Store Connect](https://appstoreconnect.apple.com) and create a new
      App.
  - **Name**: SupaView (must be unique).
  - **Bundle ID**: `com.vertizonticalstudios.supaview` (matches your [app.json](file:///Users/ryanclare/Development/SupabaseClient/app.json)).
  - **SKU**: A unique ID for your internal tracking (e.g., `supaview-prod-001`).

## 2. App Store Metadata & Assets

- [ ] **App Information**:
  - [ ] **Subtitle**: Quick summary of what the app does.
  - [ ] **Category**: Primary and Secondary categories.
  - [ ] **Privacy Policy URL**: Required for all apps.
- [ ] **Version Information**:
  - [ ] **Description**: Detailed explanation of the app for users.
  - [ ] **Keywords**: For search optimization.
  - [ ] **Support URL**: Where users can get help.
  - [ ] **Screenshots**: Required for 6.5" (iPhone Pro Max) and 5.5" (iPhone 8
        Plus) sizes.
- [ ] **App Privacy**: Complete the "Privacy Nutrition Label" questionnaire in
      App Store Connect.

## 3. Native Technical Setup (Local)

- [ ] **Finalize app.json**:
  - Ensure `version` (e.g., `1.0.0`) and `ios.buildNumber` (e.g., `1`) are set.
- [ ] **Production Build Configuration**:
  - Run `npx expo prebuild --platform ios` to sync everything one last time.
  - Open `ios/SupabaseClient.xcworkspace` in Xcode.
- [ ] **Signing & Capabilities**:
  - In Xcode, go to the **Signing & Capabilities** tab.
  - Ensure a **Distribution Provisioning Profile** is linked.
  - Add any necessary "Capabilities" (e.g., Push Notifications, Associated
    Domains) if your app uses them.

## 4. Archive & Upload

- [ ] **Set Scheme to 'Any iOS Device (arm64)'**: In the top bar of Xcode.
- [ ] **Create Archive**: Go to **Product > Archive**. This will compile the
      production IPA.
- [ ] **Validate**: Once the Archive window opens, click **Validate App**.
- [ ] **Distribute**: Click **Distribute App** and choose **App Store Connect**.
      Follow the prompts to upload.

## 5. Submission for Review

- [ ] **Select Build**: In App Store Connect, go to your app version and select
      the build you just uploaded.
- [ ] **Export Compliance**: Answer the encryption questions (usually "No" if
      using standard HTTPS).
- [ ] **Content Rights**: Confirm you have the rights to the content.
- [ ] **Advertising Identifier (IDFA)**: Confirm usage (usually "No" unless
      using tracking ads).
- [ ] **Submit for Review**: Click the button and wait (usually 1-3 days).

## 6. Post-Submission

- [ ] **TestFlight**: You can use the uploaded build to invite external testers
      via TestFlight while waiting for review.
