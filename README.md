# 🧭 SCM + BIAS Map Survey (React + Tailwind v4)

An interactive, full-screen **Stereotype Content Model (SCM)** and **BIAS Map** survey and visualization tool.

Managers can rate different groups or teams on **Warmth** and **Competence**, visualize the results on an animated quadrant chart, infer emotions and behavioral tendencies, and export the chart as a PNG.

---

## ✨ Features

- 10-item **Warmth** & **Competence** survey (Likert 1–7 scale)  
- Real-time averages and **animated BIAS Map visualization**  
- Quadrant overlays (Admired, Paternalized, Envied, Dehumanized)  
- Per-group **Emotion** and **Behavior** summaries  
- **Responsive full-screen layout** (mobile → widescreen)  
- **Export chart to PNG**, with Tailwind v4 OKLCH color compatibility fix  
- Neutral, professional dark UI — no bright accent colors  
- Built using **Vite**, **React**, **Tailwind v4**, **Framer Motion**, **Recharts**, **html2canvas**

---

## 🧱 Tech Stack

| Category | Library |
|-----------|----------|
| Framework | [React](https://react.dev/) (via [Vite](https://vitejs.dev/)) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4-alpha) + `@tailwindcss/cli` |
| Animations | [Framer Motion](https://www.framer.com/motion/) |
| Charts | [Recharts](https://recharts.org/en-US/) |
| Image Export | [html2canvas](https://html2canvas.hertzen.com/) |
| Optional Alternative | [html-to-image](https://github.com/bubkoo/html-to-image) |

---

## 🪜 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
```

### 2. Install Dependencies

```bash
npm install
```

If you’re setting this up from scratch:

```bash
npm install -D tailwindcss @tailwindcss/cli
npm install framer-motion recharts html2canvas
```

### 3. Build Tailwind CSS (v4)

Create a `src/tw.css` file:

```css
@import "tailwindcss";
```

Then add these scripts in your `package.json` if not already there:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "dev:css": "tailwindcss -i ./src/tw.css -o ./src/tailwind.css -w",
    "build:css": "tailwindcss -i ./src/tw.css -o ./dist/tailwind.css -m"
  }
}
```

Run both during development (in separate terminals):

```bash
npm run dev:css
npm run dev
```

Visit:

```
http://localhost:5173/
```

---

## 📂 Project Structure

```
.
├─ index.html
├─ package.json
├─ vite.config.js
├─ tailwind.config.js         # optional, not required for Tailwind v4
├─ src/
│  ├─ main.jsx                # imports tailwind.css
│  ├─ App.jsx                 # main application (survey + chart)
│  ├─ tw.css                  # Tailwind source
│  └─ tailwind.css            # compiled CSS output
```

---

## 🧾 PNG Export Behavior (Tailwind v4 Compatibility)

Since **Tailwind v4** uses modern `oklch()` color tokens, `html2canvas` can’t parse them.  
We’ve implemented a **safe export helper** that injects a custom stylesheet overriding OKLCH with **hex-safe colors** (`#0b1220`, `#334155`, etc.).

This ensures PNG downloads work without breaking due to unsupported color parsing.

If you prefer, you can install the `html-to-image` package instead:

```bash
npm install html-to-image
```

and replace the `downloadNodeAsPng()` function with:

```js
import { toPng } from "html-to-image";

async function downloadNodeAsPng(node, filename = "bias-map.png") {
  const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
```

---

## 🧩 Design Notes

### Layout
- **Full viewport width** and responsive grid layout
- On large screens, chart and insights are side-by-side
- On small screens, stacked layout for readability

### Buttons
- Neutral design with dark text for clarity and professionalism  
  (e.g., “Export Chart”, “Back”, “Next”, “Start Over” all use `text-slate-200`)

```jsx
className="rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2 text-slate-200 hover:bg-slate-700 transition"
```

---

## 🧠 Conceptual Overview

The **Stereotype Content Model (SCM)** explains how perceptions of *Warmth* and *Competence* shape emotions and behaviors toward social groups.

| Quadrant | Warmth | Competence | Emotion | Behavioral Tendency |
|-----------|---------|-------------|----------|----------------------|
| **Admired** | High | High | Admiration | Active & Passive Help |
| **Paternalized** | High | Low | Pity | Active Help, Passive Neglect |
| **Envied** | Low | High | Envy | Passive Help, Active Harm |
| **Dehumanized** | Low | Low | Contempt | Active & Passive Harm |

This app visualizes those relationships dynamically for modern teams and organizations.

---

## 🧪 Troubleshooting

| Issue | Cause | Fix |
|--------|--------|-----|
| **Tailwind CSS not applying** | Missing CSS import | Ensure `import './tailwind.css'` exists in `main.jsx` |
| **npx tailwindcss init -p fails** | Tailwind v4 removed `init` | Use `@tailwindcss/cli` and build manually |
| **PNG export fails (oklch)** | `html2canvas` limitation | Use the patched `downloadNodeAsPng()` (included) |
| **Chart clipped or small** | Default height too small | Edit `style={{ height: "60vh" }}` to 70–75vh |

---

## 📤 Deploy / Publish

```bash
git init
git add .
git commit -m "feat: SCM + BIAS Map Survey app"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

To serve statically:
```bash
npm run build:css && npm run build
```
Then deploy the `dist/` folder (e.g., GitHub Pages, Vercel, or Netlify).

---

## 🧾 License

MIT License  
Copyright © 2025  
Developed by **Srivatssan Srinivasan**

---

## 🙌 References

- **Fiske, Cuddy, Glick, Xu (2002)** — *A model of (often mixed) stereotype content: competence and warmth respectively follow from perceived status and competition.* *Journal of Personality and Social Psychology, 82(6), 878–902.*
- **Cuddy, Fiske & Glick (2007)** — *The BIAS Map: Behaviors from intergroup affect and stereotypes.* *Journal of Personality and Social Psychology, 92(4), 631–648.*

---

## 🧠 Author’s Note

This project merges **psychological theory** with **modern front-end engineering**.  
It’s intended for managers, researchers, and architects exploring perception dynamics inside organizations — powered by **React**, **Tailwind**, and **Generative Visualization Principles**.
