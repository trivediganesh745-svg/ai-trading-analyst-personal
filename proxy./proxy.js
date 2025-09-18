const express = require('express');
const cors = require('cors');
const { FyersApi } = require('fyers-api-v3');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const port = process.env.PORT || 3000;
const wsPort = 3001; // This is only for local testing, Render uses one port.

const FYERS_APP_ID = process.env.FYERS_APP_ID;
const FYERS_SECRET_KEY = process.env.FYERS_SECRET_KEY;

if (!FYERS_APP_ID || !FYERS_SECRET_KEY) {
    console.error("FATAL: FYERS_APP_ID and FYERS_SECRET_KEY must be set.");
    process.exit(1);
}

const fyers = new FyersApi();
fyers.setAppId(FYERS_APP_ID);
fyers.setSecretId(FYERS_SECRET_KEY);

app.use(cors());
app.use(express.json());

app.post('/get-login-url', (req, res) => {
    const { redirectUri } = req.body;
    if (!redirectUri) return res.status(400).json({ error: 'redirectUri is required' });
    fyers.setRedirectUrl(redirectUri);
    const loginUrl = fyers.generateAuthCode();
    res.json({ loginUrl });
});

app.post('/get-access-token', async (req, res) => {
    const { authCode, redirectUri } = req.body;
    if (!authCode) return res.status(400).json({ error: 'authCode is required' });
    fyers.setRedirectUrl(redirectUri);
    try {
        const response = await fyers.generate_access_token({
            "secret_key": FYERS_SECRET_KEY,
            "auth_code": authCode
        });
        res.json(response);
    } catch (error) {
        console.error('Error getting access token:', error);
        res.status(500).json({ error: error.message || 'Failed to get access token' });
    }
});

// Create an HTTP server from the Express app
const server = http.createServer(app);

// --- WEBSOCKET SERVER FOR MARKET DATA ---
const wsServer = new WebSocket.Server({ server }); // Attach WebSocket server to the HTTP server

wsServer.on('connection', (ws) => {
    console.log('Client connected to WebSocket proxy');
    let fyersSocket = null;

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.type === 'subscribe' && data.instrument && data.accessToken) {
            if (fyersSocket) fyersSocket.close();
            
            fyersSocket = new FyersApi();
            fyersSocket.setAccessToken(data.accessToken);

            fyersSocket.on('connect', () => {
                fyersSocket.subscribe([data.instrument]);
                fyersSocket.get_market_depth([data.instrument]);
            });

            fyersSocket.on('message', (msg) => {
                if(msg.ltp) {
                    ws.send(JSON.stringify({ type: 'tick', data: { timestamp: msg.timestamp * 1000, price: msg.ltp, volume: msg.vol_traded_today } }));
                }
            });

            fyersSocket.on('depth', (depth) => {
                const snapshot = {
                    bids: depth.bids.map(d => ({ price: d.price, quantity: d.volume, orders: d.orders })),
                    asks: depth.asks.map(d => ({ price: d.price, quantity: d.volume, orders: d.orders })),
                    ohlcv: { open: depth.o, high: depth.h, low: depth.l, close: depth.c, volume: depth.v }
                };
                ws.send(JSON.stringify({ type: 'snapshot', data: snapshot }));
            });

            fyersSocket.on('error', (err) => console.error('Fyers WebSocket Error:', err));
            fyersSocket.connect();
        }
    });

    ws.on('close', () => {
        if (fyersSocket) fyersSocket.close();
    });
});

server.listen(port, () => {
    console.log(`Proxy server running on port ${port}`);
});
