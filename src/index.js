import 'dotenv/config';
import express from 'express';
import { XMTPChatController } from './controllers/chat.controller.js';
import { errorHandler } from './middleware/error.middleware.js';
import { encryptResponse, decryptMessage } from './utils/encryption.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Initialize controller
const chatController = new XMTPChatController();

// Encryption middleware
const encryptionMiddleware = async (req, res, next) => {
    const { encryptedMessage, iv } = req.body;
    if (!encryptedMessage || !iv) {
        return next(new Error('Encrypted message and IV are required'));
    }
    next();
};

// Update chat endpoint
app.post('/api/chat', encryptionMiddleware, async (req, res, next) => {
    try {
        const { encryptedMessage, iv } = req.body;
        
        // Decrypt the incoming message
        const decryptedMessage = await decryptMessage(encryptedMessage, iv);
        
        // Process with AI
        const response = await chatController.chat(decryptedMessage);

        // Encrypt the response using the client's IV
        const encryptedResponse = await encryptResponse(response, iv);
        
        res.json({
            encryptedResponse,
            iv
        });
    } catch (error) {
        next(error);
    }
});

// Get chat history
app.get('/api/chat/history', async (req, res, next) => {
    try {
        const messages = await chatController.getHistory();
        res.json(messages);
    } catch (error) {
        next(error);
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        botAddress: chatController.getAddress()
    });
});

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
}); 