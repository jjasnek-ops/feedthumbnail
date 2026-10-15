# Feed Thumbnail

Static source for [Feed Thumbnail](https://feedthumbnail.com/), a browser-based set of YouTube thumbnail, banner, profile-picture, downloader, and end-screen tools.

## Source layout

- `outputs/` — deployable static site bundle.
- `outputs/guides/` — answer-first editorial guides.
- `outputs/assets/` — local SVG and image assets.
- `outputs/sitemap.xml` and `outputs/robots.txt` — crawl metadata.

The tools process user-selected images in the browser. No server-side image upload is required by the site source.

## Deploy

```powershell
wrangler pages deploy outputs --project-name feedthumbnail
```
