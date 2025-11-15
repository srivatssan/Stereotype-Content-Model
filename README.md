SCM + BIAS Map Survey (React)

Interactive survey and visualization tool for the Stereotype Content Model (SCM) and the BIAS Map.
Managers can rate groups on Warmth and Competence, then see animated quadrant placement, emotion/behavior inferences, and export the chart.

https://user-images…
 (add a short screen recording or GIF here)

✨ Features

10-item Warmth/Competence questionnaire (Likert 1–7)

Live averages per group and animated BIAS Map (Recharts + Framer Motion)

Quadrant overlays (Admired, Paternalized, Envied, Dehumanized)

Per-group emotion & behavior summaries

Export chart to PNG (html2canvas)

Vite dev server (fast HMR), Tailwind v4 styling

🧱 Tech Stack

React (Vite)

Tailwind CSS v4 (with @tailwindcss/cli)

Framer Motion (animations)

Recharts (scatter plot)

html2canvas (PNG export)

Packages used
react, react-dom
vite
tailwindcss (v4)
@tailwindcss/cli
framer-motion
recharts
html2canvas


If you prefer the classic Tailwind v3 flow later, pin tailwindcss@3 and use npx tailwindcss init -p. This project is set up for Tailwind v4.

🚀 Quick Start
1) Clone
git clone https://github.com/<you>/<repo-name>.git
cd <repo-name>

2) Install
npm install


If you are setting this up from scratch, also install the Tailwind v4 CLI:

npm install -D tailwindcss @tailwindcss/cli

3) Build Tailwind CSS (v4)

Tailwind v4 uses a single @import "tailwindcss"; entry file and the CLI to build CSS.

Ensure you have an input file (this repo uses src/tw.css):

/* src/tw.css */
@import "tailwindcss";


Development (watch mode, terminal 1):

npm run dev:css


Start the app (terminal 2):

npm run dev


Production build:

npm run build:css && npm run build

4) Open

Vite will print a URL such as:

http://localhost:5173/

📂 Project Structure
.
├─ index.html
├─ package.json
├─ vite.config.js
├─ tailwind.config.js         # optional (not required for v4, but you can add one)
├─ postcss.config.js          # optional (for plugins; not required for v4 base)
└─ src/
   ├─ main.jsx
   ├─ App.jsx                 # survey + chart (this repo’s main component)
   ├─ tw.css                  # tailwind v4 input CSS (build source)
   └─ tailwind.css            # generated CSS (built by CLI)


In src/main.jsx ensure you import the built CSS:

import './tailwind.css'

🧪 Scripts

Add these to package.json (already included in this repo):

{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",

    "dev:css": "tailwindcss -i ./src/tw.css -o ./src/tailwind.css -w",
    "build:css": "tailwindcss -i ./src/tw.css -o ./dist/tailwind.css -m"
  }
}

🛠 Configuration (Tailwind v4)

Tailwind v4 does not require a config to start.
If you want to customize theme, plugins, or content scanning, create tailwind.config.js:

// tailwind.config.js (optional)
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {} },
  plugins: []
}

📈 How It Works (BIAS Map)

Warmth and Competence are averaged from 5 Likert items each.

Points are plotted on a 1–7 grid (X: Competence, Y: Warmth).

Threshold lines at 4 divide quadrants:

Admired (High W, High C) → Admiration → Active & Passive Help

Paternalized (High W, Low C) → Pity → Active Help, Passive Neglect

Envied (Low W, High C) → Envy → Passive Help, Active Harm

Dehumanized (Low W, Low C) → Contempt → Active & Passive Harm

🧾 Troubleshooting

Tailwind CSS doesn’t apply

Confirm you’re importing ./tailwind.css in main.jsx.

Ensure npm run dev:css is running during development.

If you use a config, check content globs.

“Failed to resolve import 'framer-motion' / 'recharts'”

Install peer libs:

npm install framer-motion recharts html2canvas


Tailwind v4 CLI says “Invalid command: init”

v4 removed init. Use the CLI build commands shown above.

Or pin to v3 if you prefer the old flow: npm i -D tailwindcss@3 postcss autoprefixer.

PNG export looks dark/blurry

We call html2canvas with { backgroundColor: "#0b1220", scale: 2 } for crisp output.

Run in Chromium/Chrome for best results.

📤 Publish to GitHub
git init
git add .
git commit -m "feat: SCM + BIAS Map survey app"
git branch -M main
git remote add origin https://github.com/<you>/<repo-name>.git
git push -u origin main

📜 License

MIT (or your preferred license)

🙌 Credits

SCM & BIAS Map research: Fiske, Cuddy, Glick and collaborators.

Visualization: Recharts + Framer Motion.

Styling: Tailwind CSS v4.
