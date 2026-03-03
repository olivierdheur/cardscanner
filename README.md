# 📇 CardScanner — QR Contact Card

> Share your contact instantly. No app required on the other end.

**CardScanner** is a cross-platform mobile app built with **React Native + Expo** that lets you generate a personal QR code containing your full contact information in **vCard 3.0** format. Anyone can scan it with their native phone camera to import your contact — no third-party app needed.

---

## ✨ Features

- **Contact Editor** — Fill in your full profile: name, job title, company, phones, email, website, address, and a personal photo
- **QR Code Generator** — Instantly generates a scannable vCard QR code from your profile
- **Contact Preview Card** — See exactly how your card looks before sharing
- **Share QR Image** — Share the QR code as a PNG via the native share sheet
- **Share .vcf File** — Send your contact as a standard `.vcf` file (works with all mail/messaging apps)
- **Save QR to Gallery** — Save the QR code image to your photo library
- **Copy vCard Text** — Copy the raw vCard string to clipboard
- **Max Brightness Mode** — Boost screen brightness for easy scanning in bright environments (great for events)
- **Dark Mode** — Full light/dark theme support following system preferences
- **Offline First** — Everything works 100% offline; profile is persisted locally

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.83 + Expo SDK 55 |
| Language | TypeScript |
| Navigation | React Navigation (Bottom Tabs) |
| QR Generation | `react-native-qrcode-svg` |
| Storage | `@react-native-async-storage/async-storage` |
| File Export | `expo-file-system` + `expo-sharing` |
| Camera/Gallery | `expo-media-library` |
| Clipboard | `expo-clipboard` |
| Brightness | `expo-brightness` |
| Image Picker | `react-native-image-picker` |

---

## 📁 Project Structure

```
src/
├── navigation/
│   └── AppNavigator.tsx      # Bottom tab navigator (Editor + QR Code tabs)
├── screens/
│   ├── EditorScreen.tsx      # Contact form with validation
│   └── QRScreen.tsx          # QR display + actions
├── theme/
│   └── colors.ts             # Light/dark color tokens
├── types/
│   └── Contact.ts            # Contact type definition
└── utils/
    ├── vcard.ts              # vCard 3.0 builder
    ├── storage.ts            # AsyncStorage save/load
    └── fileExport.ts         # .vcf file creation & sharing
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Expo Go](https://expo.dev/client) app on your phone, **or** an iOS/Android simulator

### Installation

```bash
git clone https://github.com/olivierdheur/cardscanner.git
cd cardscanner
npm install
```

### Run

```bash
# Start the dev server
npm start

# iOS simulator
npm run ios

# Android simulator
npm run android
```

Scan the QR code in the terminal with the **Expo Go** app to open on your device.

---

## 📲 How It Works

1. **Fill in your card** on the *My Card* tab — name, phone, email, etc.
2. Tap **Generate QR Code** — your profile is saved locally and you're taken to the QR screen.
3. **Show the QR code** to someone — they scan it with their native camera app.
4. Their phone prompts them to **add the contact** with all fields pre-filled (vCard 3.0 standard).
5. Alternatively, use the action buttons to **share the QR image** or **send a .vcf file** via any messaging or mail app.

---

## 📋 vCard Format

The app generates a standard **vCard 3.0** string, compatible with iOS, Android, and all major contact management systems. Fields encoded include:

- Full name (FN / N)
- Organization & job title
- Mobile & work phone numbers
- Email address
- Website URL
- Full address (street, city, postal code, country)
- Notes
- Profile photo (Base64 encoded JPEG, if provided)

---

## 📄 License

MIT — feel free to use, fork, and build on this.
