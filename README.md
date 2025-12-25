# Blog

A simple blog site that uses Markdown files for posts and runs fully on GitHub Pages.  
No backend. No build step. Just files and a browser.

---

## Overview

This project is a static blog system made with HTML, CSS, and JavaScript.  
Blog posts are written in Markdown and loaded dynamically from GitHub using raw file links.

Everything is controlled through a single config file.

---

## Live Site

**URL**  
https://bthavanish.github.io/blog/


---

## Features

| Feature | Description |
|------|-----------|
| Markdown posts | Write posts using `.md` files |
| GitHub Pages | Works with free GitHub hosting |
| Client-side routing | Supports clean URLs |
| Config based | No hardcoded posts |
| Comment support | Giscus, Utterances, Disqus |
| No build tools | Runs as-is |

---

## How It Works

1. Blog posts are stored as Markdown files.
2. JavaScript fetches the raw Markdown from GitHub.
3. Markdown is converted to HTML in the browser.
4. Posts are rendered based on the config file.

No server is involved.

---

## Project Structure

```text
/
├── index.html        Main entry file
├── 404.html          Routing support for GitHub Pages
├── config.json       Site configuration and post list
├── style.css         Styling
├── script.js         Logic and rendering
````

---

## Writing a Blog Post

### Step 1

Create a Markdown file.

```md
# My First Post

This is my blog post written in Markdown.
```

### Step 2

Get the raw GitHub URL for the file.

### Step 3

Edit `config.json` and add a new object:

```json
{
  "title": "My First Post",
  "slug": "my-first-post",
  "description": "Short description here",
  "url": "https://raw.githubusercontent.com/username/repo/main/post.md",
  "date": "2025-01-01",
  "tags": ["blog", "markdown"]
}
```

Save the file and refresh the site.

---

## Configuration

All site settings live in `config.json`.

You can control:

* Site title and description
* Home page text
* Blog post list
* Theme colors
* Footer text
* Comment provider

<details>
<summary>Supported Comment Systems</summary>

* Giscus
* Utterances
* Disqus

</details>

---

## Running Locally

You can open `index.html` directly, but some browsers block fetch requests.

Recommended:

```bash
python -m http.server
```

Then open `http://localhost:8000`.

---

## Hosting on GitHub Pages

1. Fork or clone this repository
2. Push it to GitHub
3. Open repository settings
4. Enable GitHub Pages
5. Select the correct branch

The site will be live in a few minutes.

---

## Customization

You are free to modify:

* HTML structure
* CSS styles
* JavaScript behavior

Nothing is hidden or locked.


## License

MIT License

Copyright (c) 2025 bthavanish

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files, to deal in the Software
without restriction, including without limitation the rights to use, copy,
modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.

The Software is provided "as is", without warranty of any kind.

