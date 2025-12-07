# POS System

A comprehensive Point of Sale (POS) system built with Next.js, featuring role-based access control with Superadmin, Admin, and Agent roles.

## Features

### Role-Based Access Control
- **Superadmin**: Full system access including user management, products, sales, customers, inventory, and reports
  - Role: `superadmin`
  - Token: `superToken`
- **Admin**: Access to products, sales, customers, and inventory management
  - Role: `admin`
  - Token: `adminToken`
- **Agent**: Access to POS interface and personal sales history
  - Role: `agent`
  - Token: `agentToken`

### Core Features
- User authentication (Login/Register) with JWT tokens
- Product management with MongoDB models
- Sales processing
- Customer management
- Inventory management
- Sales reports and analytics
- Point of Sale (POS) interface

## Project Structure

```
possystem/
├── app/
│   ├── api/                    # API routes (JavaScript)
│   │   ├── auth/              # Authentication endpoints
│   │   ├── users/             # User management
│   │   ├── products/          # Product management
│   │   ├── sales/             # Sales management
│   │   ├── customers/         # Customer management
│   │   └── inventory/         # Inventory management
│   ├── superadmin/            # Superadmin pages (JSX)
│   ├── admin/                 # Admin pages (JSX)
│   ├── user/                  # Agent pages (JSX)
│   ├── login/                 # Login page
│   └── register/              # Register page
├── components/                # Reusable components
├── lib/                      # Utility libraries
│   ├── db.js                 # Database connection
│   ├── database.js           # Database operations
│   └── auth.js               # Authentication utilities
├── models/                   # Mongoose models
│   ├── userModel.js
│   ├── productModel.js
│   ├── saleModel.js
│   ├── customerModel.js
│   └── inventoryModel.js
├── scripts/                  # Utility scripts
│   └── initSuperAdmin.js     # Initialize superadmin
└── middleware.js             # Route protection
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment variables:**
   - Create `.env.local` file (see `.env.example`)
   - Set `MONGODB_URI` to your MongoDB connection string
   - Set `JWT_SECRET` to a secure random string

3. **Initialize superadmin:**
   ```bash
   npm run init:superadmin
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000) in your browser**

### Default Credentials

**Superadmin:**
- Email: `superadmin@pos.com`
- Password: `superadmin123`
- Token: `superToken`

## Database Models

Each module has its own Mongoose model:
- **User Model** (`models/userModel.js`) - Manages users with roles and tokens
- **Product Model** (`models/productModel.js`) - Manages products and inventory
- **Sale Model** (`models/saleModel.js`) - Manages sales transactions
- **Customer Model** (`models/customerModel.js`) - Manages customer information
- **Inventory Model** (`models/inventoryModel.js`) - Manages inventory changes

## Token System

Each role has a specific token:
- **Superadmin**: `superToken`
- **Admin**: `adminToken`
- **Agent**: `agentToken`

Tokens are automatically assigned based on the user's role and are included in the session.

## Technology Stack

- **Framework**: Next.js 16
- **UI**: React 19, Tailwind CSS
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT tokens, bcrypt for password hashing
- **Language**: JavaScript (API), JSX (UI)

## API Routes

All API routes are in JavaScript:
- `/api/auth/*` - Authentication (login, register, logout, me)
- `/api/users/*` - User management (CRUD operations)
- `/api/products/*` - Product management
- `/api/sales/*` - Sales processing
- `/api/customers/*` - Customer management
- `/api/inventory/*` - Inventory management

## Environment Variables

Create a `.env.local` file with:
```env
MONGODB_URI=mongodb://localhost:27017/possystem
JWT_SECRET=your-secret-key-change-this-in-production
PORT=3000
NODE_ENV=development
```

## Development

The project follows Next.js App Router conventions:
- API routes are in `app/api/` (JavaScript)
- UI pages are in `app/` directories (JSX)
- Models are in `models/` directory (Mongoose schemas)
- Middleware handles route protection

## License

This project is for educational purposes.
