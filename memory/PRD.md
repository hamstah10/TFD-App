# TuningFiles-Download.com Mobile App - PRD

## Original Problem Statement
Mobile app for a chiptuning database based on tuningfiles-download.com website. Features include:
- Vehicle configurator with cascading selections
- Blog section
- Opening hours display
- Contact information/form
- German and English language support
- Admin area for content management
- Customer portal with login/dashboard

## User Personas
- **Tuning Shop Owner**: Needs to upload files and track orders
- **End Customer**: Wants to see tuning options for their vehicle
- **Admin**: Manages blog posts, users, and content

## Core Requirements
1. Vehicle configurator connected to live API
2. Customer portal with authentication
3. File upload wizard for tuning orders
4. Vehicle registration certificate scanner
5. Multi-language support (DE/EN)
6. Dynamic logo (green when business is open)

## Tech Stack
- **Frontend**: Expo (React Native) with expo-router
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **External APIs**: 
  - tuningfiles-download.com (chiptuning data)
  - fahrzeugschein-scanner.de (vehicle registration scanner)
  - OpenAI GPT-4o (AI assistant)

## Architecture
```
/app
├── backend/
│   ├── server.py       # FastAPI app with API routes and proxies
│   └── .env
└── frontend/
    ├── app/
    │   ├── (tabs)/     # Main app layout
    │   ├── customer/   # Customer portal
    │   ├── admin/      # Admin area
    │   ├── blog/       # Blog section
    │   └── login.tsx   # Login page
    ├── src/
    │   ├── components/ # Reusable components (Logo, LanguageSwitch)
    │   ├── contexts/   # React contexts (Auth, Language)
    │   ├── hooks/      # Custom hooks (useIsOpen)
    │   ├── i18n/       # Translations
    │   └── services/   # API service functions
    └── assets/         # Images and fonts
```

## What's Been Implemented

### Completed Features (as of 2025-03-02)
- [x] Homepage with feature cards and opening hours
- [x] Vehicle configurator connected to live API
- [x] Stages view with detailed comparison table
- [x] ECU options display
- [x] Customer portal with login
- [x] Customer dashboard with order overview
- [x] **Bottom navigation in customer area** ✅
- [x] **Logout functionality** ✅
- [x] File upload wizard (UI only)
- [x] Order overview tab
- [x] Vehicle registration scanner with fallback
- [x] Dynamic logo (color changes based on business hours)
- [x] Multi-language support (DE/EN)
- [x] Blog section
- [x] Contact page

### Known Limitations
- Customer authentication is mocked (any email + "demo" password)
- File upload wizard doesn't send data to backend
- Order overview shows mock data
- Chiptuning API requires IP whitelisting (currently: 104.198.214.223)

## Prioritized Backlog

### P0 (Critical)
- [ ] Implement backend for file upload wizard
- [ ] Implement real order storage and retrieval

### P1 (High)
- [ ] Connect contact form to backend
- [ ] Real customer authentication

### P2 (Medium)
- [ ] Address deployment blockers
- [ ] Refactor files.tsx into smaller components

### P3 (Low/Future)
- [ ] Admin area improvements
- [ ] Push notifications for order updates
- [ ] File download functionality for completed orders

## API Endpoints
- `POST /api/login` - Customer login (mocked)
- `POST /api/chat` - AI assistant
- `POST /api/photos`, `GET /api/photos` - Photo storage
- `POST /api/scan-document` - Vehicle registration scanner proxy
- `GET /api/types` - Vehicle types (proxy)
- `GET /api/manufacturers/{type_id}` - Manufacturers (proxy)
- `GET /api/models/{manu_id}` - Models (proxy)
- `GET /api/builts/{model_id}` - Build years (proxy)
- `GET /api/engines/{built_id}` - Engines (proxy)
- `GET /api/stages/{engine_id}` - Tuning stages (proxy)

## Database Schema
- `users`: { username, password_hash, ... }
- `blog_posts`: { title, content, ... }
- `photos`: { user_id, image_base64, timestamp }

## 3rd Party Integrations
- **OpenAI GPT-4o**: AI assistant (uses Emergent LLM Key)
- **tuningfiles-download.com API**: Chiptuning database (requires Bearer Token + IP whitelist)
- **fahrzeugschein-scanner.de API**: Vehicle registration scanner (requires access_key)

## Test Credentials
- Customer Login: Any email + "demo" as password
