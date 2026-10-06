# My Blog

A static blog hosted on GitHub Pages, built with Bun (`build.ts`).

## Publish

1. Create an empty repo on GitHub (no README, no .gitignore).
2. Push this folder to it on the `main` branch.
3. In the repo: Settings > Pages > Source: **GitHub Actions**.
4. Every push to `main` runs `.github/workflows/pages.yml`, which builds with Bun (`bun build.ts`) and deploys.
5. Your site appears at `https://<username>.github.io/<repo>/` after a minute or two.

## Write an article

Each article is its own folder under `articles/`, holding the text, its images,
and any scripts that generate them:

```
articles/
  my-article/
    index.html      # the article: a full HTML page, style it however you like
    style.css
    diagram.png     # assets, referenced relatively
    make_diagram.py # optional: script that generates the assets
```

`index.html` needs this front matter (the home page sorts by `date`). `layout: null`
means you write the whole page yourself:

```
---
layout: null
title: "Your title"
date: YYYY-MM-DD
---
```

Reference assets relatively: `<img src="diagram.png">`. The article is served at
`/articles/my-article/`.

## Preview locally (optional)

```
bun dev.ts
```

Then open http://localhost:4000/. The site is built with `bun build.ts` (output in `_site/`).
