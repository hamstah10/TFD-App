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
- Real CRM integration for orders (verwaltung.tuningfux.de)

## User Personas
- **Tuning Shop Owner**: Needs to upload files and track orders
- **End Customer**: Wants to see tuning options for their vehicle
- **Admin**: Manages blog posts, users, and content

## Core Requirements
1. Vehicle configurator connected to live API
2. Customer portal with real CRM authentication
3. File upload wizard for tuning orders with CRM sync
4. Vehicle registration certificate scanner
5. Multi-language support (DE/EN)
6. Dynamic logo (green when business is open)

## Tech Stack
- **Frontend**: Expo (React Native) with expo-router
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **External APIs**: 
  - tuningfiles-download.com (chiptuning data)
  - verwaltung.tuningfux.de (CRM API for auth & orders)
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

### Completed Features (as of 2026-03-06)
- [x] Homepage with feature cards and opening hours
- [x] Vehicle configurator connected to live API
- [x] Stages view with detailed comparison table
- [x] ECU options display
- [x] **Real CRM Authentication** (verwaltung.tuningfux.de) ✅
- [x] Customer portal with login
- [x] Customer dashboard with real order overview
- [x] Bottom navigation in customer area
- [x] Logout functionality
- [x] **File upload wizard with CRM sync** ✅
- [x] **Order creation saves to both MongoDB AND CRM** ✅
- [x] Order overview tab (shows real orders)
- [x] Vehicle registration scanner with fallback
- [x] Dynamic logo (color changes based on business hours)
- [x] Dynamic clock icon in header (open/closed status)
- [x] Multi-language support (DE/EN)
- [x] Blog section
- [x] Contact page
- [x] Photos section (user-specific)
- [x] Tickets system (user-specific)
- [x] Scans section (user-specific)

### Bug Fixes (2026-03-06)
- [x] **Fixed iOS token retrieval issue** - Token now stored in React state + SecureStore
- [x] **Fixed CRM /auth/me response parsing** - Now correctly extracts customer from `{"customer": {...}}` wrapper
- [x] **Fixed logout using wrong storage API** - Now uses consistent `storage` helper

## Known Limitations
- Chiptuning API requires IP whitelisting (check with `curl ifconfig.me`)
- iOS login with special characters in password may have issues (encoding)

## Prioritized Backlog

### P0 (Critical) - DONE
- [x] Implement real CRM authentication
- [x] Implement order submission to CRM

### P1 (High)
- [ ] Fix iOS login with special characters in passwords
- [ ] Connect contact form to backend

### P2 (Medium)
- [ ] Address deployment blockers (4 issues from previous session)
- [ ] Refactor files.tsx into smaller components
- [ ] Refactor server.py into smaller routers

### P3 (Low/Future)
- [ ] Admin area improvements
- [ ] Push notifications for order updates
- [ ] File download functionality for completed orders

## API Endpoints
### Auth (CRM Proxy)
- `POST /api/auth/login` - Customer login via CRM
- `POST /api/auth/refresh` - Refresh token via CRM
- `POST /api/auth/logout` - Logout via CRM
- `GET /api/auth/me` - Get current user via CRM

### Orders (User-specific)
- `GET /api/orders` - Get user's orders
- `POST /api/orders` - Create order (saves to DB + forwards to CRM)
- `GET /api/orders/{order_id}` - Get specific order

### Customer Data (User-specific)
- `GET/POST /api/customer/photos` - User photos
- `GET/POST /api/customer/scans` - Vehicle scans
- `GET/POST /api/customer/tickets` - Support tickets

### Chiptuning (Proxy)
- `GET /api/chiptuning/types` - Vehicle types
- `GET /api/chiptuning/manufacturers/{type_id}` - Manufacturers
- `GET /api/chiptuning/models/{manu_id}` - Models
- `GET /api/chiptuning/builts/{model_id}` - Build years
- `GET /api/chiptuning/engines/{built_id}` - Engines
- `GET /api/chiptuning/stages/{engine_id}` - Tuning stages

## Database Schema
- `orders`: { orderNumber, customerId, customerEmail, companyName, fileName, fileData, vehicle, stage, tuningTool, method, slaveOrMaster, status, crmOrderId, crmSynced, createdAt }
- `customer_photos`: { customerId, base64, filename, description, createdAt }
- `customer_scans`: { customerId, vehicleData, selectedStage, imageBase64, createdAt }
- `customer_tickets`: { ticketNumber, customerId, subject, priority, status, messages, createdAt }

## 3rd Party Integrations
- **verwaltung.tuningfux.de API**: Real CRM for customer auth and order management
- **OpenAI GPT-4o**: AI assistant (uses Emergent LLM Key)
- **tuningfiles-download.com API**: Chiptuning database (requires Bearer Token + IP whitelist)
- **fahrzeugschein-scanner.de API**: Vehicle registration scanner (requires access_key)

## Test Credentials
- Customer Login: `andre@tuningfux.de` / `Test1234`
