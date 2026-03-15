# Techno Signs

A static browser game that teaches Dutch street signs with a kid-friendly rhythm game loop.

## Run locally

Because the app is plain HTML, CSS, and JavaScript, any static server works:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploy on Netlify

1. Push this repository to GitHub.
2. Create a new Netlify site from the repo.
3. Leave the build command empty.
4. Set the publish directory to `.` if Netlify does not pick it up automatically.

The included [`netlify.toml`](/Users/timhulshof/Code/Techno-signs/netlify.toml) already sets the publish directory.
