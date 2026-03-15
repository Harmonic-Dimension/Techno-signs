# Techno Signs

A static browser game that teaches Dutch street signs with a kid-friendly rhythm game loop.

## Run locally

Because the app is plain HTML, CSS, and JavaScript, any static server works:

```bash
UV_CACHE_DIR=/tmp/uv-cache /Users/timhulshof/.local/bin/uv run --python 3.14 python -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploy on Netlify

1. Push this repository to GitHub.
2. Create a new Netlify site from the repo.
3. Leave the build command empty.
4. Set the publish directory to `.` if Netlify does not pick it up automatically.

The included [`netlify.toml`](/Users/timhulshof/Code/Techno-signs/netlify.toml) already sets the publish directory.

## Sign assets

The app uses local SVG files in [`public/signs`](/Users/timhulshof/Code/Techno-signs/public/signs) for a more faithful Dutch road-sign look.

Source approach:

- Legal authority: [`RVV 1990`](https://wetten.overheid.nl/BWBR0004825)
- Download source: Wikimedia Commons SVG files for Dutch road signs

Examples:

- [B6](https://commons.wikimedia.org/wiki/File:Nederlands_verkeersbord_B6.svg)
- [E1](https://commons.wikimedia.org/wiki/File:Nederlands_verkeersbord_E1.svg)
- [C2](https://commons.wikimedia.org/wiki/File:Nederlands_verkeersbord_C2.svg)
- [D1](https://commons.wikimedia.org/wiki/File:Nederlands_verkeersbord_D1.svg)
- [A1-50](https://commons.wikimedia.org/wiki/File:Netherlands_traffic_sign_A1-50.svg)
