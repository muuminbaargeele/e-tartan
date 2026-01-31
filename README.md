# e-tartan

**e-tartan** is a modern, AI-powered platform for managing Somali eFootball tournaments and leagues.

## Features

- 🏆 **League & Cup Management:** Players join leagues or knockout cups, view fixtures, and report match results.
- 🤖 **AI Result Extraction:** Supports both OCR (Tesseract.js) and OpenAI (ChatGPT) for processing and validating match results from screenshots or text. The system can be configured to use either method via system configuration.
- 🛡️ **Secure eFootball Profiles:** Each user has a profile linked to their eFootball account.
- 💸 **Subscription System:** Supports weekly/monthly subscriptions.
- 🎟️ **Promo Codes:** Users can redeem promo codes for free or discounted subscriptions.
- 📈 **Leaderboards & Rankings:** Compete and track progress across tournaments.
- ⚙️ **System Configuration:** Centralized configuration management for tournament rules, match settings, bot config, OCR settings, OTP settings, and app settings.

## Tech Stack

- **Backend:** Node.js, Express, TypeORM, MySQL
- **AI Integration:** 
  - **OCR:** Tesseract.js for optical character recognition from match screenshots
  - **OpenAI:** ChatGPT/OpenAI API for intelligent match result extraction and validation
  - **Configuration:** System can be configured to use either OCR or OpenAI via `ocr_config` settings

**Note:** Player and Admin frontends are not implemented. The project currently provides a RESTful API backend only. Use Postman or any API client to interact with the endpoints.

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