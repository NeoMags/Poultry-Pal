# PoultryPal - Farm Management System

A comprehensive poultry farm management application built with Next.js, React, Tailwind CSS, and Genkit.

## How to Push to GitHub

To push your code to GitHub, follow these exact steps:

### 1. Create a New Repository on GitHub
*   Log in to [GitHub.com](https://github.com/).
*   Click the **"+"** icon in the top right and select **"New repository"**.
*   Name your repository (e.g., `poultry-pal`).
*   **Important:** Leave everything else as default. Do **NOT** check "Initialize this repository with a README, .gitignore, or license".
*   Click **"Create repository"**.
*   On the next page, copy the repository URL (it looks like `https://github.com/username/repo.git`).

### 2. Open the Terminal
*   In this IDE, open the **Terminal** tab in the bottom panel. If you don't see it, go to the top menu: **Terminal > New Terminal**.
*   Alternatively, press **`Ctrl + \``** (Control + backtick).

### 3. Run Git Commands
Copy and paste these commands into the terminal, one by one. **Replace the URL in step 5 with the URL you copied from GitHub.**

```bash
# Initialize git in the project root
git init

# Add all files to the staging area
git add .

# Create the first commit
git commit -m "Initial commit of PoultryPal"

# Set the main branch
git branch -M main

# Link to your GitHub repo (PASTE YOUR URL BELOW)
git remote add origin <PASTE_YOUR_COPIED_URL_HERE>

# Push the code to GitHub
git push -u origin main
```

### 4. Authenticate
*   When you run the last command (`git push`), the terminal will ask for your GitHub username and password.
*   **Note:** GitHub requires a **Personal Access Token (PAT)** instead of your account password for terminal authentication.
*   If you don't have a token: Go to GitHub **Settings > Developer Settings > Personal access tokens (classic)** and generate one with the `repo` scope selected. Use this token as your password.

---

## Getting Started

1. **Setup:** On first run, you will be redirected to `/setup`. Use the master key provided in the code (`DMTAudi0slav3`) to initialize the admin account.
2. **Dashboard:** Access the real-time overview of your farm, including egg stock, hen count, and financial status.

## Tech Stack

- **Framework:** Next.js 15.5
- **UI:** ShadCN UI & Tailwind CSS
- **State Management:** React Context API (FarmContext)
- **AI:** Google Genkit for production forecasts and health anomaly detection.

---
Created by Nesar Magavi.
