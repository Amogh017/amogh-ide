Amogh IDE — Online Code Runner

🖥️ Amogh IDE — Online Code Runner

A simple multi-language IDE built with **Express.js** + **Judge0 API**, with a lightweight frontend inspired by the GeeksforGeeks IDE.  
Supports choosing languages, writing code, providing custom input, and running programs.

---

🚀 Features
- Write and run code in **50+ languages** via Judge0
- Custom input support (stdin)
- Execution result with stdout, stderr, memory, and time
- Backend caching to avoid hitting Judge0 rate limits
- Clean separation of **frontend (client)** and **backend (server)**

---

📂 Project Structure
```
amogh-ide/
 ├── client/            # Frontend UI
 │   ├── index.html
 │   ├── style.css
 │   └── script.js
 │
 ├── server/            # Backend (Express proxy for Judge0)
 │   ├── index.js
 │   ├── test.js
 │   ├── test-run.js
 │   ├── package.json
 │   └── .env.example   # Sample env config (copy to .env)
 │
 ├── serve-client.js    # Lightweight static file server for client
 └── .gitignore
```

---

⚙️ Setup Instructions

1. Clone the repository
```bash
git clone https://github.com/Amogh017/amogh-ide.git
cd amogh-ide
```

2. Install backend dependencies
```bash
cd server
npm install
```

3. Configure environment variables
Copy `.env.example` → `.env` and fill in your **RapidAPI key**:
```env
PORT=3001
JUDGE0_URL=https://judge0-ce.p.rapidapi.com
RAPIDAPI_KEY=YOUR_KEY_HERE
RAPIDAPI_HOST=judge0-ce.p.rapidapi.com
CACHE_TTL_SECONDS=3600
```

⚠️ Never commit `.env` with your real API key!

4. Run backend server
```bash
node index.js
```
This runs the API proxy on [http://localhost:3001](http://localhost:3001).

5. Run frontend
Option A: Use Node’s static server
```bash
node serve-client.js
```
Visit → [http://localhost:5173](http://localhost:5173)

Option B: Use Python (if installed)
```bash
cd client
python -m http.server 5173
```

---

🧪 Testing
You can quickly test Judge0 connection via:
```bash
cd server
node test.js
node test-run.js
```

---

🙌 Contributing
1. Fork the repo
2. Create a feature branch
3. Commit your changes
4. Push and open a PR

---

📜 License
MIT License — free to use and modify.

---

⚠️ Notes
- Free Judge0 API (RapidAPI) has strict rate limits. Cache is enabled by default.
- Always use `.env.example` to share config, never push real `.env`.
