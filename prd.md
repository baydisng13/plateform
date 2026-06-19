# Restaurant Management System — Product Spec

> **Stack:** TanStack Start · Better Auth · Neon DB · Vercel · Telegram Bot API

---

## Overview

A full-stack restaurant management system for a small healthy food & juice business serving apartment-based customers. Staff manage orders, kitchen flow, and payments via a web app. The owner and chef receive real-time Telegram notifications and can pull quick analytics from the bot.

---

## Actors

| Actor | Access | Interface |
|---|---|---|
| **Owner** | Full access — all orders, expenses, analytics, menu, staff | Web + Telegram |
| **Waiter** | Create & manage orders, confirm payments | Web only |
| **Chef** | View incoming orders, mark as ready | Web + Telegram |
| **Online Customer** | Place orders via public page, no login required | Web (public) |

---

## Authentication

- **Better Auth** for staff only (Owner, Waiter, Chef)
- Role-based access control: `owner` · `waiter` · `chef`
- Online customers are **not authenticated** — they identify via phone number only

---

## Modules

### 1. Foundation

#### 1.1 Menu Management *(Owner only)*
- Create / edit / delete menu items
- Fields: name, description, category, price (ETB), image, availability toggle
- Categories: e.g. Food, Juice, Snack (owner can create/rename)
- Bulk availability toggle (e.g. "mark all juices unavailable today")

#### 1.2 Staff Management *(Owner only)*
- Invite staff by email
- Assign role: Waiter or Chef
- Deactivate accounts

#### 1.3 Restaurant Settings *(Owner only)*
- Restaurant name, logo
- Operating hours
- Telegram bot token & chat IDs (owner + chef channels)
- Order types enabled: Dine-in · Takeaway · Delivery

---

### 2. Order Management

#### 2.1 Order Creation

**By Waiter (web):**
- Select order type: Dine-in / Takeaway / Delivery
- For dine-in: select table number
- For delivery: enter customer phone + address
- Add items from menu with quantities
- Add order notes (optional)
- Submit → order enters `Pending` status

**By Online Customer (public web page):**
- Browse menu (read-only, no login)
- Add items to cart
- Enter phone number to place order
- No account created — phone number is the identifier
- Order enters `Awaiting Confirmation` status
- Staff must call customer to verify → then manually confirm or reject

#### 2.2 Order Status Lifecycle

```
[Online] Awaiting Confirmation → Confirmed → In Kitchen → Ready → Delivered / Completed
[Dine-in/Takeaway] Pending → In Kitchen → Ready → Completed
```

Status transitions:
- `Awaiting Confirmation` → `Confirmed` : Waiter calls customer and confirms
- `Pending` / `Confirmed` → `In Kitchen` : Waiter sends to kitchen
- `In Kitchen` → `Ready` : Chef marks order as ready
- `Ready` → `Completed` / `Delivered` : Waiter confirms delivery/pickup + payment

#### 2.3 Kitchen View *(Chef)*
- Real-time list of orders with status `In Kitchen`
- Each card shows: items, quantities, order notes, order type, time elapsed
- Chef taps "Mark Ready" → status updates + Telegram notification sent to waiter

#### 2.4 Payment Confirmation

Payment methods:
- **Cash** — waiter selects "Cash", enters amount, clicks Confirm → `payment_method: cash`
- **Telebirr / CBE / Bank transfer** — waiter enters transaction number OR scans QR screenshot → `payment_method: telebirr | cbe | bank`, `transaction_ref: xxx`

Payment is confirmed manually by the waiter. No payment gateway integration.

---

### 3. Telegram Integration

#### 3.1 Notifications (push, no user action needed)
- **New order received** → notifies Owner + Chef
- **Online order needs confirmation** → notifies Owner
- **Order ready** → notifies Waiter (if possible) + Owner
- **Payment confirmed** → notifies Owner

#### 3.2 Bot Commands *(Owner & Chef)*

| Command | Description |
|---|---|
| `/orders` | List today's active orders with status |
| `/summary` | Today's sales summary (total orders, revenue) |
| `/weekly` | Weekly revenue breakdown |
| `/pending` | Orders awaiting action |

Chef-specific:
| Command | Description |
|---|---|
| `/kitchen` | View current `In Kitchen` orders |
| `/ready [order_id]` | Mark an order as ready from Telegram |

---

### 4. Expenses Module *(Owner only)*

- Log an expense: amount (ETB), category, description, date
- Categories: Ingredients, Utilities, Rent, Staff, Equipment, Other
- View expense list filtered by date range / category
- Monthly expense total visible in dashboard

---

### 5. Analytics & Dashboard *(Owner only)*

**Daily snapshot (web dashboard):**
- Total orders today
- Revenue today (ETB)
- Expenses today
- Net profit today
- Orders by status breakdown

**Reports:**
- Revenue by day / week / month (chart)
- Top selling items
- Orders by type (dine-in vs takeaway vs delivery vs online)
- Expense breakdown by category

---

## Database Schema (Neon / PostgreSQL)

```
users           — id, name, email, role, created_at
menu_items      — id, name, description, category_id, price, image_url, available, created_at
menu_categories — id, name
orders          — id, type, status, customer_phone, table_number, notes, created_by, created_at
order_items     — id, order_id, menu_item_id, quantity, unit_price
payments        — id, order_id, method, transaction_ref, amount, confirmed_by, confirmed_at
expenses        — id, amount, category, description, date, created_by
```

---

## Public Web Page (Online Orders)

- Route: `/order` (public, no auth)
- Shows menu grouped by category
- Cart sidebar / bottom sheet
- Checkout: phone number field only
- Confirmation screen: "Your order was placed. We'll call you to confirm."
- No order tracking page for now (out of scope for MVP)

---

## Build Phases

### Phase 0 — Foundation
- [ ] Project setup: TanStack Start + Neon + Better Auth
- [ ] Telegram bot setup & webhook
- [ ] Menu management (CRUD)
- [ ] Staff management + roles

### Phase 1 — Core Order Flow
- [ ] Waiter order creation (dine-in / takeaway)
- [ ] Kitchen view for chef
- [ ] Order status lifecycle
- [ ] Payment confirmation (cash + transaction ref)
- [ ] Telegram notifications (new order, ready, payment)

### Phase 2 — Online Orders
- [ ] Public `/order` page
- [ ] Phone number checkout
- [ ] Awaiting confirmation flow
- [ ] Telegram alert for online orders

### Phase 3 — Expenses + Analytics
- [ ] Expense logging
- [ ] Owner dashboard
- [ ] Telegram analytics commands (`/summary`, `/weekly`)

---

## Out of Scope (MVP)

- Payment gateway integration (Telebirr API, CBE API)
- Customer accounts / order history for online customers
- SMS notifications
- Inventory / stock tracking
- Multi-branch support
- Mobile app

---

## Notes

- All monetary values in **ETB**
- Hosted on **Vercel** (web + serverless functions)
- DB: **Neon** (free tier, PostgreSQL)
- Auth: **Better Auth** (staff only)