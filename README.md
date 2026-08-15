# QAHWA SUPPLY

QAHWA SUPPLY is a full-stack e-commerce application for browsing and purchasing coffee products. The project is built with a separate Next.js frontend, Express backend, and MongoDB database.

This version focuses on a polished Tier 2 e-commerce experience with customer authentication, shopping cart and checkout, customer order history, product discovery, and administrator tools.

## Features

### Customer Features
- Browse products from MongoDB
- View individual product details
- Search products by name
- Filter products by category
- Sort products by price
- Add products to a shopping cart
- Increase or decrease cart quantities
- Remove products from the cart
- View cart subtotal
- Register an account
- Log in and log out
- Persistent authentication using JWT tokens
- View and update profile information
- Complete a simulated checkout
- View order confirmation
- View personal order history
- View individual order details
- View order status

### Administrator Features
- Protected administrator dashboard
- Customer and administrator role separation
- Create products
- Edit products
- Delete products
- View product inventory
- View customer orders
- Update order status

### Security and Validation
- Passwords are hashed with bcrypt
- JWT authentication protects private routes
- Admin routes require administrator authorization
- Customers can only view orders associated with their own account
- Environment variables are stored outside source control
- Backend validates checkout quantities against current inventory

## Tech Stack

### Frontend
- React
- Next.js
- JavaScript
- CSS
- React Context API for authentication and cart state

### Backend
- Node.js
- Express.js
- REST API
- bcrypt
- jsonwebtoken
- dotenv
- CORS

### Database
- MongoDB Atlas
- Mongoose

## Project Structure

```text
Qahwa-Supply/
├── backend/
│   ├── middleware/
│   │   ├── adminMiddleware.js
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── Order.js
│   │   ├── Product.js
│   │   └── User.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── orderRoutes.js
│   │   └── productRoutes.js
│   ├── seed.js
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── app/
│   │   ├── admin/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── login/
│   │   ├── orders/
│   │   ├── products/
│   │   ├── profile/
│   │   ├── register/
│   │   ├── globals.css
│   │   ├── layout.js
│   │   └── page.js
│   ├── components/
│   ├── context/
│   └── package.json
│
├── .gitignore
└── README.md
```

## Database Models

### User
Stores customer and administrator account data.

Main fields:
- `name`
- `email`
- `password` (hashed)
- `role` (`customer` or `admin`)

### Product
Stores product catalog information.

Main fields:
- `name`
- `description`
- `price`
- `category`
- `imageUrl`
- `inventory`

### Order
Stores completed customer orders.

Main fields:
- `userId`
- `customerName`
- `customerEmail`
- `address`
- `items`
- `totalPrice`
- `status`

Order items are embedded inside the order document and reference the purchased product using `productId`.

## API Routes

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
PUT  /api/auth/me
```

### Products

```text
GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
```

Product create, update, and delete operations require administrator access.

### Orders

```text
POST  /api/orders
GET   /api/orders/my-orders
GET   /api/orders/:id
GET   /api/orders
PATCH /api/orders/:id/status
```

- Checkout requires authentication.
- `/api/orders/my-orders` returns orders for the logged-in customer only.
- `GET /api/orders` and order-status updates require administrator access.

## Environment Variables

Create a file named `.env` inside the `backend` folder.

```env
MONGO_URI=your_mongodb_connection_string
PORT=5001
JWT_SECRET=your_long_random_jwt_secret
```

Do not commit `.env` to GitHub.

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/madihasultan7635/Qahwa-Supply.git
cd Qahwa-Supply
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

Create `backend/.env` using the environment variables shown above.

### 3. Seed the product database

Optional if products have not already been added:

```bash
node seed.js
```

### 4. Start the backend

```bash
node server.js
```

The backend runs on:

```text
http://localhost:5001
```

### 5. Install frontend dependencies

Open another terminal:

```bash
cd frontend
npm install
```

### 6. Start the frontend

```bash
npm run dev
```

The frontend runs on:

```text
http://localhost:3000
```

## Admin Setup

New users are created with the default role:

```text
customer
```

For local development, an administrator account can be created by changing an existing user's `role` field in MongoDB from:

```text
customer
```

to:

```text
admin
```

After changing the role, log out and log back in so a new JWT token is created with the administrator role.

## Application Flow

```text
MongoDB
   ↕
Express REST API
   ↕
Next.js Frontend
```

Example checkout flow:

```text
Product Catalog
→ Product Details
→ Cart
→ Login
→ Checkout
→ POST /api/orders
→ Order saved in MongoDB
→ Product inventory reduced
→ Order Confirmation
→ Customer Order History
```

## Testing

The current project has been manually tested for the following flows:
- Product listing and product detail pages
- Search, category filtering, and price sorting
- Cart quantity changes and removal
- Checkout and order creation
- Inventory reduction after checkout
- Registration, login, logout, and authentication persistence
- Customer profile viewing and updating
- Customer-specific order history
- Individual order details
- Customer protection from administrator pages
- Administrator product create, edit, and delete actions
- Administrator order-status updates

## Future Improvements

Possible future improvements beyond the current Tier 2 scope include:
- Real payment processing
- Product images and richer product media
- Automated tests
- Deployment
- Pagination
- Reviews and ratings
- Wishlists
- Analytics dashboard

## Author

Madiha Sultan
