# e-tartan

**e-tartan** is a modern, AI-powered platform for managing Somali eFootball tournaments and leagues.

## Features

- 🏆 **League & Cup Management:** Players join leagues or knockout cups, view fixtures, and report match results.
- 🤖 **AI Result Extraction:** Use AI (ChatGPT) to process and validate match results from screenshots or text.
- 🛡️ **Secure eFootball Profiles:** Each user has a profile linked to their eFootball account.
- 💸 **Subscription System:** Supports weekly/monthly subscriptions.
- 🎟️ **Promo Codes:** Users can redeem promo codes for free or discounted subscriptions.
- 📈 **Leaderboards & Rankings:** Compete and track progress across tournaments.
- ⚙️ **System Configuration:** Centralized configuration management for tournament rules, match settings, bot config, OCR settings, OTP settings, and app settings.

## Tech Stack

- **Frontend:** Flutter (planned for Android & iOS)
- **Backend:** Node.js, Express, TypeORM, MySQL
- **AI Integration:** ChatGPT/OpenAI API for match result processing

## How It Works

1. Players register with their phone number and eFootball details.
2. Join leagues/cups and pay for a subscription (or use a promo code).
3. Report match results (optionally upload a screenshot for AI extraction).
4. Results are processed, stats updated, and leaderboards maintained.
5. Admins can create/manage promo codes and tournaments.

## Project Status

- [x] Database schema design
- [x] Backend environment setup
- [x] Authentication module (Login, Registration, OTP verification, Password reset)
- [x] User management module (Profile management, Password change, Phone/Username update)
- [x] Player management module (eFootball profile creation and management)
- [x] Configuration management module (System settings, Tournament rules, Match rules)
- [ ] Flutter mobile app (in progress)
- [ ] AI result integration (in progress)
- [ ] Full league/tournament engine

## Getting Started

### Backend Setup

1. **Install Dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment:**
   - Copy `.env.example` to `.env` (if available)
   - Configure database connection, JWT secrets, and API keys

3. **Run Migrations:**
   ```bash
   npm run migration:run
   ```

4. **Start Development Server:**
   ```bash
   npm run start:dev
   ```

5. **API Documentation:**
   - Import `e-tartan-api.postman_collection.json` into Postman
   - Base URL: `http://localhost:9000`
   - All endpoints are documented with examples

### API Modules

- **Authentication:** Login, registration, OTP verification, password reset
- **User Management:** Profile updates, password change, phone/username updates
- **Player Management:** eFootball profile creation and retrieval
- **Configuration Management:** System settings management (Admin only)

## License

This project is currently private and not yet open-source licensed.

---

*Made with ❤️ for the Somali eFootball community.*