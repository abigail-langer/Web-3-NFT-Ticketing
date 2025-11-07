# Project Update & Setup Guide (README_2.md)

This document outlines the recent updates to the project, including the new marketplace features, and provides a comprehensive guide on how to set up and run the development environment.

## 1. Overview of Updates

The application has been significantly updated to transform it from a simple NFT minting platform into a functional, off-chain marketplace for secondary ticket sales. The core new features include:

- **Peer-to-Peer Marketplace**: Users can now act as both buyers and sellers.
- **Order Book System**: An auction-like system where sellers can list tickets for sale ("Asks") and buyers can place bids ("Bids").
- **Instant Buy**: Users can immediately purchase a ticket that is listed for sale.
- **Automated Onboarding**: Every new user who logs in for the first time automatically receives a free ticket for the "ETH Global Conference" to immediately test the selling functionality.

---

## 2. Setup and Running the Project

### Prerequisites

- **Docker**: You must have Docker and Docker Compose installed and running on your machine. This is required to run the PostgreSQL database.
- **Node.js**: Version 18 or higher is recommended.
- **npm**: Comes with Node.js.

### Step 1: Start the Database

The project uses a PostgreSQL database running in a Docker container.

1.  Open a terminal in the **root directory** of the project.
2.  Run the following command to start the database in the background:
    ```bash
    docker-compose up -d
    ```

### Step 2: Setup and Run the Backend

The backend server handles authentication, user data, and the entire off-chain marketplace logic.

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  **Create the environment file**. Create a file named `.env` inside the `backend` directory and paste the following content into it. This file contains the database connection string and a secret for signing authentication tokens.
    ```
    # PostgreSQL Database connection string
    DATABASE_URL=postgresql://Ticket:secret@localhost:5433/Ticket

    # Secret key for signing JWT tokens
    JWT_SECRET=a-very-super-secret-key-that-is-long-and-random
    ```
4.  Start the backend server:
    ```bash
    npm start
    ```
    The server will run on `http://localhost:3001`.

### Step 3: Setup and Run the Frontend

The frontend is a Next.js application that provides the user interface.

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  **Create the environment file**. Create a file named `.env.local` inside the `frontend` directory and paste the following content into it.
    ```
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
    ```
    You need to replace `your_project_id_here` with a real Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/).
4.  Start the frontend development server:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

---

## 3. New API Endpoints

The following new API endpoints have been added to the backend under the `/api/market` route to support the marketplace functionality:

-   `GET /api/market/my-tickets`: Fetches all tickets owned by the currently authenticated user.
-   `GET /api/market/orders/:eventId`: Retrieves the complete order book (all active sell and buy orders) for a specific event.
-   `POST /api/market/sell`: Creates a new sell order for a ticket owned by the user.
-   `POST /api/market/buy`: Creates a new buy order (a bid) for tickets of a specific event.
-   `POST /api/market/execute_sell_order`: Allows a user to "instant buy" a ticket by taking an existing sell order.

---

## 4. Important Notes

### Database Reset on Start
**Please be aware**: The backend is currently configured to **completely wipe and reset the database every time it starts** (`npm start`). This is done to facilitate development and testing. All users, tickets, and orders will be erased and re-seeded.

### Off-Chain Implementation
This is a **frontend and backend-only implementation**. The entire marketplace logic (creating orders, matching trades, transferring ownership) happens within our backend database. **There is no interaction with a smart contract on a blockchain yet**. This was done to rapidly prototype and test the user experience.

### Known Issue: WalletConnect Error
There is a persistent runtime error that appears in the browser console when trying to connect a wallet via QR code:
```
Connection interrupted while trying to subscribe
```
This issue has been extensively debugged and is believed to be an **environmental problem** related to local network configurations (firewalls, proxies) or WalletConnect service issues, not a bug in the application code itself. It is recommended that another teammate investigate this issue.

**For all testing, please use the MetaMask browser extension**, as its connection flow has been fixed and is working correctly.
