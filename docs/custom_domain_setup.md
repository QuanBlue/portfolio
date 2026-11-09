# Connecting Your Existing Custom Domain to GitHub Pages

This guide outlines how to connect your existing custom domain to your portfolio hosted on **GitHub Pages** ($0/month).

> [!IMPORTANT]
> You do **not** need to buy or register a new domain. Use your existing custom domain.

---

## Architecture Overview

```
User Browser ---> DNS Provider (A / CNAME Records) ---> GitHub Pages Edge (Auto SSL via Let's Encrypt)
```

- **Hosting Platform:** GitHub Pages (Free Plan - $0/month)
- **SSL Certificate:** Free automatic TLS/HTTPS managed by GitHub
- **Source Build:** Astro Static Site Generation (`dist/`) via GitHub Actions

---

## Step 1: Configure DNS at Your Domain Registrar

Open the DNS management panel where you manage your domain (Cloudflare, Namecheap, GoDaddy, Porkbun, etc.):

### Option A: Apex Domain (e.g. `yourdomain.com`)
Add **4 DNS `A` records** pointing to GitHub Pages IP addresses:

| Type | Name / Host | Target IP | TTL |
| :--- | :--- | :--- | :--- |
| **A** | `@` (hoặc để trống) | `185.199.108.153` | Auto / 3600 |
| **A** | `@` (hoặc để trống) | `185.199.109.153` | Auto / 3600 |
| **A** | `@` (hoặc để trống) | `185.199.110.153` | Auto / 3600 |
| **A** | `@` (hoặc để trống) | `185.199.111.153` | Auto / 3600 |

*(Tùy chọn) Thêm CNAME cho `www`:*
| Type | Name / Host | Target Value |
| :--- | :--- | :--- |
| **CNAME** | `www` | `quanblue.github.io` |

### Option B: Subdomain (e.g. `portfolio.yourdomain.com`)
Add a single **`CNAME` record**:

| Type | Name / Host | Target Value | TTL |
| :--- | :--- | :--- | :--- |
| **CNAME** | `portfolio` | `quanblue.github.io` | Auto / 3600 |

---

## Step 2: Configure Custom Domain in GitHub Repository

1. Push your code to your GitHub repository: `https://github.com/QuanBlue/portfolio`.
2. Go to your repo **Settings** tab.
3. In the left sidebar, click **Pages** (under *Code and automation*).
4. Under **Build and deployment**:
   - Source: Choose **GitHub Actions** (the `.github/workflows/deploy.yml` workflow will handle this automatically).
5. Under **Custom domain**:
   - Enter your domain name (e.g. `yourdomain.com` or `portfolio.yourdomain.com`).
   - Click **Save**.
   - GitHub will check DNS records. Once verified, check the box **Enforce HTTPS**.

---

## Step 3: (Optional) Set CNAME in `public/` directory

To ensure your custom domain persists across builds without being overwritten:
Create a file named `public/CNAME` containing just your custom domain:

```text
yourdomain.com
```

When Astro runs `npm run build`, it copies `public/CNAME` directly into `dist/CNAME`.

---

## Verification Checklist

- [ ] Repository Pages Source is set to **GitHub Actions**.
- [ ] Push to `main` triggers `.github/workflows/deploy.yml` successfully.
- [ ] `https://yourdomain.com` loads the DevOps Dashboard.
- [ ] Padlock icon confirms valid HTTPS/TLS.
- [ ] Hosting cost remains **$0/month**.
