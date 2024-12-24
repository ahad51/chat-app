const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);

// Serve static files from the 'public' directory (where your HTML file is located)
app.use(express.static('public'));

// WebSocket server setup
const wss = new WebSocket.Server({ server });

const users = {}; // To store connected users

console.log('Server is running on http://localhost:8080');

// Handle WebSocket connections
wss.on('connection', (ws) => {
    let userId = null;

    console.log('A new client connected!');

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        switch (data.type) {
            case 'setUserId':
                userId = data.userId;
                users[userId] = ws; // Map user ID to WebSocket
                console.log(`User connected: ${userId}`);
                broadcastUserList();
                break;

            case 'message':
                const recipientWs = users[data.toUserId];
                if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
                    recipientWs.send(
                        JSON.stringify({
                            type: 'message',
                            fromUserId: userId,
                            message: data.message,
                        })
                    );
                }
                break;

            default:
                console.log(`Unknown message type: ${data.type}`);
        }
    });

    ws.on('close', () => {
        if (userId && users[userId]) {
            console.log(`User disconnected: ${userId}`);
            delete users[userId];
            broadcastUserList();
        }
    });

    ws.send(JSON.stringify({ type: 'welcome', message: 'Welcome to the WebSocket chat!' }));
});

// Function to broadcast the list of connected users
function broadcastUserList() {
    const userList = Object.keys(users);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'updateUserList', userList }));
        }
    });
}

// Start the server
const PORT = 8080;
server.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
});
