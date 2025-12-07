# Setup Guide

## Prerequisites
- Node.js 18+ installed
- MongoDB installed and running (or MongoDB Atlas account)

## Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Environment Variables**
   - Copy `.env.example` to `.env.local`
   - Update `MONGODB_URI` with your MongoDB connection string
   - Update `JWT_SECRET` with a secure random string

   Example `.env.local`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/possystem
   JWT_SECRET=your-secret-key-change-this-in-production
   PORT=3000
   NODE_ENV=development
   ```

3. **Initialize Superadmin**
   ```bash
   npm run init:superadmin
   ```
   
   This will create a superadmin user with:
   - Email: `superadmin@pos.com`
   - Password: `superadmin123`
   - Token: `superToken`
   - Role: `superadmin`

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Access the Application**
   - Open [http://localhost:3000](http://localhost:3000)
   - Login with superadmin credentials

## Role System

### Superadmin
- **Role**: `superadmin`
- **Token**: `superToken`
- **Access**: Full system access
- Can create admins and agents
- Can manage all modules

### Admin
- **Role**: `admin`
- **Token**: `adminToken`
- **Access**: Products, Sales, Customers, Inventory
- Can be created by superadmin only

### Agent
- **Role**: `agent`
- **Token**: `agentToken`
- **Access**: POS interface and personal sales
- Can be created by superadmin or admin

## Database Models

Each module has its own model file:
- `models/userModel.js` - User management
- `models/productModel.js` - Product management
- `models/saleModel.js` - Sales management
- `models/customerModel.js` - Customer management
- `models/inventoryModel.js` - Inventory management

## API Routes

All API routes are in `app/api/`:
- `/api/auth/*` - Authentication (login, register, logout)
- `/api/users/*` - User management
- `/api/products/*` - Product management
- `/api/sales/*` - Sales management
- `/api/customers/*` - Customer management
- `/api/inventory/*` - Inventory management

## Notes

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Each role has a specific token (superToken, adminToken, agentToken)
- MongoDB is used as the database
- All models use Mongoose schemas

