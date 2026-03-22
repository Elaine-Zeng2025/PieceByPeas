# 🫛 PieceByPeas · 豆在碗里

A personal meal tracking and nutrition analysis web app with bilingual (English / Chinese) support. Helps users log daily meals, understand dietary patterns, and receive personalized nutrition suggestions.

**Live Demo → [piecebypeas.onrender.com](https://piecebypeas.onrender.com)**

> ⚠️ Hosted on Render free tier — may take 30–50 seconds to wake up on first visit.

---

## Features

- **Meal Logging** — Record meals with type, time, food group coverage, and custom tags (Diet / Cheat / Balanced / Light)
- **Daily Log** — Browse meals by date; today's view shows meal cards with color-coded food group dots and real-time nutrition suggestions
- **History View** — Past days grouped by date, showing meal count and food group coverage rate
- **Nutrition Report** — Weekly / Monthly / Last 7 Days charts: stacked bar, radar, and donut via Chart.js
- **Edit & Delete** — Edit any logged meal; data pre-fills the add form via `sessionStorage`
- **User System** — Register, log in, edit profile (username, email, password) via sidebar dropdown + modal
- **Bilingual** — One-click English ↔ 中文 toggle; chart labels and date formats switch automatically

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | HTML / CSS / JavaScript (no framework) |
| Charts | Chart.js |
| Backend | Python + Flask |
| Auth | Flask session + SHA-256 password hashing |
| Database | SQLite (local) · PostgreSQL / Supabase (production) |
| Hosting | GitHub Pages (frontend) · Render (backend) |

---

## Project Structure

```
PieceByPeas/
├── index.html          # Home
├── login.html          # Login
├── register.html       # Sign up
├── add.html            # Add / edit meal
├── log.html            # Daily log + history
├── report.html         # Nutrition report
├── navbar.js           # Sidebar component (IIFE, auto-injected)
├── i18n.js             # Bilingual translation module
├── script.js           # Page logic
├── style.css           # Global styles
├── Bea.png             # Mascot
└── backend/
    ├── app.py
    ├── database.py
    ├── requirements.txt
    └── routes/
        ├── auth.py     # Register / login / logout / profile
        └── meals.py    # CRUD for meal records
```

---

## Local Development

```bash
git clone https://github.com/Elaine-Zeng2025/PieceByPeas.git
cd PieceByPeas/backend
pip install -r requirements.txt
python app.py
```

Visit **http://localhost:5000/login.html**

Uses SQLite locally — no database setup needed. A `meals.db` file is created automatically on first run.

---

## Design

Warm green + cream palette with orange accents. Fonts: **IM Fell DW Pica SC** (logo) + **Nunito** (body). Mascot **Bea** — a hand-drawn green pea with a chef's hat — sits on the top edge of each page's content card. Sidebar on desktop, bottom navigation bar on mobile.

---

## License

MIT
