# 🌮 TacosManager

**TacosManager** is a real-time mobile application built with React Native and Firebase that enables taquerias (and small restaurants) to seamlessly manage their orders. It optimizes the workflow by separating the responsibilities between Waiters and Cooks into a mini point-of-sale (POS) and operational management system. 

Built with a scalable architecture and clean code practices, it serves as a robust functional MVP with the potential to evolve into a full-fledged Multi-Tenant SaaS platform.

---

## 🚀 Key Features

*   **⚡ Real-Time Operations**: Uses Firestore listeners to instantly sync orders between the front-of-house (waiters) and the back-of-house (kitchen). No manual refreshing needed.
*   **🧩 Multi-Tenant Architecture**: Engineered to support multiple businesses. Each taqueria has its own isolated users, customized product catalog, and order history.
*   **🧍 Waiter Workflow**: Waiters can create orders, seamlessly browse the product catalog, adjust item quantities, and dispatch orders directly to the kitchen.
*   **👨‍🍳 Kitchen Workflow**: Cooks receive orders in real-time, view specific details by table, and update the order status (`pending` ➔ `preparing` ➔ `done`).
*   **⚙️ Product Management (Menu)**: Complete CRUD system for the restaurant's menu. Users can add or edit products, set prices, and optionally upload product images safely to Firebase Storage.
*   **📱 Optimized UX**: Clean, large-button design focused on speed and efficiency in fast-paced, real-world kitchen environments. Optimized for tablet use with seamless mobile phone fallback.

---

## 🏗️ Architecture & Tech Stack

### Frontend
*   **React Native CLI** + **TypeScript**: Strongly typed mobile app for iOS and Android.
*   **Redux Toolkit**: Efficient and predictable global state management.
*   **Feature-Based Architecture**: Highly decoupled, modular approach dividing the app into clear domains (`auth`, `kitchen`, `products`, `settings`).

### Backend (BaaS)
*   **Firebase Authentication**: Secure user login/registration via email and password.
*   **Cloud Firestore**: Real-time NoSQL database.
*   **Firebase Cloud Storage**: Secure storage bucket for product images (designed to gracefully fallback if no image is provided).

---

## 🗄️ Database Structure Overview

### 👤 Users & Roles
Users register with a `name`, `email`, `password`, and a designated `role` (`waiter` | `cook`), and are strictly bound to a single `taqueriaId`.
> `users/{userId}` ➔ `taqueriaId`

### 🌮 Multi-Tenant Mapping
The core entity holding everything together for a single business entity.
> `taquerias/{taqueriaId}`

### 🍽️ Menu / Products
Menu items isolated per business branch.
> `taquerias/{taqueriaId}/products/{productId}`
*   `name`
*   `price`
*   `imageUrl` (optional)

### 🧾 Orders
Tickets created by waiters and processed by the kitchen.
> `taquerias/{taqueriaId}/orders/{orderId}`
*   `table` / `clientName`
*   `items` (List of products + selected quantity)
*   `status` (`pending` | `preparing` | `done`)

---

## 💻 Getting Started Locally

### Prerequisites
Make sure you have your React Native environment set up and Firebase credentials configured.

1. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

2. **Firebase Setup:**
   Ensure you add your Firebase configuration files:
   * **Android:** Swap `android/app/google-services.json` with your project's credentials.
   * **iOS:** Swap `ios/GoogleService-Info.plist` with your project's credentials.

3. **Start the Metro Bundler:**
   ```bash
   npm start
   ```

4. **Run the application:**
   ```bash
   npm run android
   # or
   npm run ios
   ```

---

*This project is built as a highly scalable solution designed to elevate daily operations for fast-paced food restaurants.*
