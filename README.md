# Full Step-by-Step Guide to Deploying on Render

This guide will walk you through deploying your proxy directory as a "Web Service" on Render's free tier.

## Prerequisites

*   **A Render Account:** Sign up for free at render.com.
*   **A GitHub Account:** Your project code must be in a GitHub repository for Render to access it.

## Step 1: Get Your Code on GitHub

If your project isn't already in a GitHub repository, you need to put it there. This guide assumes you have already created all the necessary files in your GitHub repository.

## Step 2: Deploy the Proxy to Render

Log in to your Render Dashboard.
1.  Click **New +** and select **Web Service**.
2.  Connect your GitHub account and select the repository you just created.
3.  Configure the Web Service with these exact settings:
    *   **Name:** `fyers-proxy` (or any name you like).
    *   **Root Directory:** `proxy` (This is **extremely important**. It tells Render to only look inside your proxy folder).
    *   **Environment:** `Node`.
    *   **Build Command:** `npm install`.
    *   **Start Command:** `node proxy.js`.
    *   **Instance Type:** Select the **Free** tier.
4.  Scroll down and click **Advanced**. This is where you will securely store your secret keys.
5.  Click **Add Environment Variable**.
6.  Create two "secret" variables:
    *   **Key:** `FYERS_APP_ID`
    *   **Value:** `PASTE_YOUR_ACTUAL_FYERS_APP_ID_HERE`
    *   **Key:** `FYERS_SECRET_KEY`
    *   **Value:** `PASTE_YOUR_ACTUAL_FYERS_SECRET_KEY_HERE`
7.  Click **Create Web Service**. Render will now build and deploy your proxy. This may take a few minutes.
8.  Once it's live, Render will give you a public URL at the top of the page, like `https://fyers-proxy.onrender.com`. **Copy this full URL.**

## Step 3: Connect Your Frontend to the Deployed Proxy

Now you need to tell your frontend application to talk to your new live proxy on Render instead of localhost.
1.  In your project's root directory on GitHub, create a new file named `.env`.
2.  Inside this `.env` file, add the following line, pasting the URL you copied from Render:
    ```
    PROXY_BASE_URL=https://fyers-proxy.onrender.com
    ```
3.  This application is already configured to use this environment variable, so no further code changes are needed. When developing locally, your build tool (like Vite) will automatically pick up this `.env` file. For a live deployment, you will need to set this environment variable in your frontend hosting provider's settings.
