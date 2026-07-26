# Automotivator

A motivational poster generator in the spirit of Wigflip's Automotivator. Drop in
an image, add a big serif title and a pithy caption, and get the classic
black-bordered "inspirational office poster" look — ready to download as a PNG.

Everything runs client-side on an HTML5 canvas. No server, no build step, and
your images never leave the browser.

## Usage

Open `index.html` in a browser, or serve the folder with any static file server:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Features

- **Image input three ways** — click to browse, drag & drop, or paste straight
  from the clipboard.
- **Live preview** — the poster re-renders on every keystroke.
- **Classic styling** — black background, thin white frame offset from the
  image, large letter-spaced serif title, smaller gray caption with word wrap.
- **Options** — title color, three font styles, three poster sizes, UPPERCASE
  toggle, and an optional frame.
- **Sample image** — a procedurally drawn mountain sunset, so you can try it
  without hunting for a photo.
- **PNG download** — filename derived from your title.

## Deploying to GitHub Pages

The repo includes a workflow (`.github/workflows/pages.yml`) that publishes the
site files to the `gh-pages` branch on every push to `main` (or manually via
*Run workflow*). GitHub Pages serves that branch, so the site is live at
`https://<owner>.github.io/automotivator/`.

If Pages ever gets disabled, re-enable it under **Settings → Pages** with
**Source: Deploy from a branch**, branch `gh-pages`, folder `/ (root)`.

## Files

| File         | Purpose                                  |
| ------------ | ---------------------------------------- |
| `index.html` | Page structure and controls              |
| `style.css`  | App styling (dark UI around the canvas)  |
| `app.js`     | Canvas rendering, layout, and input glue |
