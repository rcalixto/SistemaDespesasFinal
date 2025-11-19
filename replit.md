# Sistema de Gestão de Despesas ABERT

## Overview

Corporate expense management system for ABERT (Associação Brasileira de Emissoras de Rádio e Televisão) that handles advance payments, reimbursements, flight tickets, accommodations, and travel/lodging execution records. The system implements multi-level approval workflows (directorate and finance) with comprehensive tracking, file attachments, and role-based access control.

The application is built as a full-stack TypeScript monorepo with a React frontend and Express backend, using PostgreSQL for data persistence and Replit Auth for authentication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite as the build tool and development server.

**UI Component Library**: Shadcn UI (built on Radix UI primitives) - chosen for corporate application requirements emphasizing information clarity, workflow efficiency, and professional appearance. The "New York" style variant is configured for a more refined, density-focused design suitable for data-heavy interfaces.

**Design System (ABERT Brand)**: 
- Typography: Inter font family (Google Fonts) with systematic hierarchy - titles (2.5rem/40px) to body text (1rem/16px)
- Color Palette: Custom ABERT brand colors
  - Primary: --abert-blue (#004650) with variants (blue80, blue60, blue40, blue20)
  - Accent: --abert-yellow (#FFC828) for highlights and CTAs
  - Neutrals: Gray scale (gray80 #4A5458 to gray20 #ECEFF0)
  - Background: --abert-bg (#F5F8FC) light blue-gray
  - Surface: --abert-surface (#FFFFFF) pure white
- Components: Custom ABERT classes (.abert-card, .abert-input, .btn-abert) with 16px border radius for cards, 10px for inputs
- Status Badges: Color-coded (aprovado/green, rejeitado/red, emanalise/yellow, pendente/blue) with 20px border radius
- Dialogs: Clean white dialogs with 20px border radius, subtle shadows, and ABERT blue labels

**State Management**: TanStack Query (React Query) for server state with configured query client that:
- Disables automatic refetching to reduce server load
- Sets infinite stale time for predictable caching
- Handles 401 responses gracefully for auth flows
- Centralizes API request logic with credential inclusion

**Routing**: Wouter - lightweight client-side routing library chosen over React Router for simplicity in this single-page application context.

**Form Handling**: React Hook Form with Zod validation schemas, providing type-safe form validation integrated with the database schema validation layer.

**File Structure**:
- `/client/src/pages/*` - Page components mapped to routes
- `/client/src/components/*` - Reusable components including filters, file upload, status badges
- `/client/src/components/ui/*` - Shadcn UI component primitives
- `/client/src/hooks/*` - Custom React hooks (auth, toast, mobile detection)
- `/client/src/lib/*` - Utility functions and query client configuration

### Backend Architecture

**Runtime**: Node.js with Express.js framework running on TypeScript with ESM modules.

**API Design**: RESTful API with route grouping by entity type:
- `/api/auth/*` - Authentication endpoints (login, logout, user info)
- `/api/adiantamentos` - Advance payment CRUD and approval workflows
- `/api/reembolsos` - Reimbursement CRUD and approval workflows
- `/api/passagens` - Flight ticket requests
- `/api/hospedagens` - Accommodation requests
- `/api/viagens-executadas` - Executed travel records
- `/api/hospedagens-executadas` - Executed lodging records
- `/api/prestacao-adiantamento` - Advance payment accountability

**Business Logic**:
- **Approval Workflows**: Two-stage approval (Directorate → Finance) with automatic status transitions
- **Role-Based Authorization**: Middleware functions (`requireDiretoria`, `requireFinanceiro`, `requireDiretoriaOrFinanceiro`) enforce access control
- **Auto-Provisioning**: Colaborador (employee) records auto-created on first login using Replit Auth user claims
- **Status Automation**: Status fields update based on approval actions (Solicitado → AprovadoDiretoria → AprovadoFinanceiro → Pago → Concluído)

**Data Access Layer**: Storage abstraction (`storage.ts`) providing interface methods for all database operations, isolating Drizzle ORM queries from route handlers.

**Middleware Stack**:
- Session management (connect-pg-simple with PostgreSQL session store)
- JSON body parsing with raw body preservation for webhook verification
- Request logging with timing and response capture
- Authentication middleware (`isAuthenticated`)
- Role-based authorization middleware

**Email Notification System** (November 2025):
- **Provider**: SMTP server using Nodemailer configured with ABERT's corporate email (sistema@abert.org.br)
- **Environment Variables**: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD stored as Replit Secrets
- **Email Templates**: Professional HTML emails with ABERT branding (blue #004650, yellow #FFC828)
- **Notification Triggers**:
  - **Adiantamentos**: Created → Diretoria | Approved by Diretoria → Financeiro + Solicitante | Approved by Financeiro → Solicitante | Rejected → Solicitante
  - **Reembolsos**: Created → Diretoria | Approved by Financeiro → Solicitante | Rejected → Solicitante
- **Features**: Direct links to system, status badges, value formatting, Brazilian Portuguese localization
- **Error Handling**: Email failures logged but don't block request completion (fire-and-forget pattern)
- **Role Lookup**: `getColaboradoresByRole()` retrieves all users with specific role for multi-recipient notifications

**Reports and Analytics** (November 2025):
- **Endpoint**: `/api/relatorios` - GET endpoint with optional filters (dataInicio, dataFim, diretoria, status)
- **Data Aggregations**: 
  - Adiantamentos por Status - quantity and total value grouped by status
  - Reembolsos por Status - quantity and total value grouped by status
  - Reembolsos por Categoria - breakdown of expenses by category
  - Evolução Mensal - monthly trend of adiantamentos and reembolsos (chronologically sorted)
  - Top 10 Colaboradores - employees with highest total expense requests
- **Filter Validation**: Backend validates all filter parameters are non-empty strings before applying WHERE clauses, prevents SQL injection with ::date type casting
- **Frontend Implementation**: 
  - React Query with explicit queryFn to build filtered URLs using URLSearchParams
  - Recharts library for data visualization (BarChart, PieChart, LineChart)
  - Summary cards displaying aggregate totals
  - Filter inputs for date range (dataInicio, dataFim) and diretoria
  - Automatic refetch when filter state changes via queryKey dependencies

**File Structure**:
- `/server/routes.ts` - Route registration and handler definitions with email notification hooks
- `/server/storage.ts` - Data access interface and implementations
- `/server/emailService.ts` - Email templates and sending logic for all notification types
- `/server/replitAuth.ts` - OpenID Connect authentication setup
- `/server/middleware/roles.ts` - Authorization middleware
- `/server/db.ts` - Database connection and Drizzle ORM initialization

### Data Storage

**Database**: PostgreSQL via Neon serverless driver with WebSocket support for connection pooling.

**ORM**: Drizzle ORM configured with:
- Schema-first approach (`/shared/schema.ts`)
- Type-safe query builder
- Migration support (`drizzle-kit`)
- Zod schema integration for validation

**Schema Design**:

Core entities include:
- `colaboradores` - Employee records with department, directorate, cost center
- `colaboradorRoles` - Many-to-many role assignments (Diretoria, Financeiro, Administrador)
- `adiantamentos` - Advance payment requests with approval workflow status
- `prestacaoAdiantamento` - Accountability records for advances with expense items
- `prestacaoAdiantamentoItens` - Individual expense items with category, value, and receipt attachment (comprovante)
- `reembolsos` - Reimbursement requests with categorized items captured at creation (single-step flow) including valorTotalSolicitado
- `reembolsoItens` - Individual reimbursement expense items with category, description, value, expense date (data_despesa), receipt attachment (comprovante), and optional notes (observacoes)
- `passagensAereas` - Flight ticket requests with optional link to hospedagem (hospedagemId)
- `hospedagens` - Accommodation requests with optional link to passagem aérea (passagemAereaId)
- `viagensExecutadas` - Executed travel records with cost breakdown
- `hospedagensExecutadas` - Executed lodging records with cost breakdown

**Key Relationships**:
- **Passagens ↔ Hospedagens**: Bidirectional optional relationship allowing a flight ticket to reference an accommodation and vice-versa. This enables tracking overnight trips where flight tickets require lodging.
- **Prestação Items**: Each prestação de adiantamento can have multiple expense items (`prestacaoAdiantamentoItens`), each categorized under one of 10 predefined categories with receipt attachments stored in Replit Object Storage.
- **Reembolso Items**: Each reembolso has multiple expense items (`reembolsoItens`) provided at creation with:
  - Category (categoria) - one of 10 predefined expense categories
  - Description (descricao) - text field describing the expense
  - Value (valor) - decimal amount
  - Expense date (data_despesa) - timestamp when expense occurred
  - Receipt attachment (comprovante) - file stored in Replit Object Storage via ObjectUploader component
  - Optional notes (observacoes) - additional text field for clarifications

**Critical Security Features** (November 2025):
- **Server-Side Total Calculation**: valorTotalSolicitado calculated exclusively from items server-side, never trusted from client input
- **Transactional Integrity**: All multi-record operations (reembolso + items) wrapped in database transactions
- **Non-Empty Validation**: API enforces at least one item required for reembolsos
- **Client Input Sanitization**: API strips client-provided totals before validation to prevent tampering

**Session Storage**: Sessions table required by Replit Auth with TTL-based expiration.

**Relationships**: Drizzle relations define foreign keys between colaboradores and all request types, enabling efficient joins and referential integrity.

### Authentication and Authorization

**Provider**: Replit Auth (OpenID Connect) integrated via Passport.js strategy.

**Domain Restriction**: 
- **Only @abert.org.br emails allowed** - enforced server-side in verify callback
- Email normalized to lowercase before validation
- Missing email or userId claims rejected
- Non-domain emails redirected to `/auth-error` page
- Custom callback handler prevents server crashes on auth failures

**Session Management**: 
- 7-day session TTL
- PostgreSQL-backed session store (secure, persistent)
- HTTP-only, secure cookies
- Auto-refresh of access tokens
- user.id persisted from OIDC `sub` claim for downstream API lookups

**User Model**: 
- Replit Auth provides base user identity (id, email, names, profile image)
- Local `colaboradores` table extends with business attributes
- Auto-provisioning creates colaborador on first login
- Normalized email stored in lowercase format

**Authorization Model**:
- Role-based access control (RBAC)
- Roles: Diretoria, Financeiro, Administrador
- Middleware enforces role requirements per endpoint
- Administrators have universal access

**Security Considerations**:
- Domain validation bypass prevented (email required and validated)
- Credentials included in all API requests
- 401 responses handled gracefully in query client
- Session secret required in environment
- HTTPS-only cookies in production
- Auth failures logged and gracefully redirected

**File Upload System** (November 2025):
- **ObjectUploader Component**: Reusable upload component for expense receipts (comprovantes)
- **Upload Flow**: Client requests signed URL → uploads to Object Storage → backend sets ACL
- **Form Integration**: Uses `form.setValue()` to preserve all field values when attaching files
- **Date Handling**: HTML5 `input type="date"` always returns ISO format (YYYY-MM-DD) regardless of browser locale, backend converts to Date object using `new Date(isoString)`
- **Storage**: All receipt files stored in Replit Object Storage with public read access after ACL set

### External Dependencies

**UI Component Library**: 
- Radix UI primitives (@radix-ui/*) - 20+ components for accessible, unstyled primitives
- Shadcn UI configuration for styled variants
- CVA (class-variance-authority) for component variant management

**Styling**:
- Tailwind CSS with custom configuration
- PostCSS with autoprefixer
- Custom HSL color system
- Google Fonts (Inter) for typography

**Database**:
- Neon serverless PostgreSQL (@neondatabase/serverless)
- Drizzle ORM (drizzle-orm)
- Drizzle Kit for migrations (drizzle-kit)
- WebSocket support (ws) for Neon connections

**Authentication**:
- OpenID Client (openid-client) for OIDC flows
- Passport.js for authentication strategy
- Express Session for session management
- connect-pg-simple for PostgreSQL session storage

**Form & Validation**:
- React Hook Form for form state
- Zod for schema validation
- @hookform/resolvers for RHF/Zod integration

**Development Tools**:
- Vite plugins for Replit integration (@replit/vite-plugin-*)
- TSX for TypeScript execution
- ESBuild for production bundling

**Key Dependencies**:
- `@tanstack/react-query` - Server state management
- `wouter` - Client-side routing
- `date-fns` - Date manipulation
- `cmdk` - Command palette component
- `lucide-react` - Icon library
- `memoizee` - Function memoization