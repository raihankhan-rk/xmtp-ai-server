import 'dotenv/config';
import express from 'express';
import { XMTPChatController } from './controllers/chat.controller.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();
app.use(express.json());

// Initialize controller
const chatController = new XMTPChatController();

// Simple chat endpoint
app.post('/api/chat', async (req, res, next) => {
    try {
        const { message } = req.body;
        if (!message) {
            throw new Error('Message is required');
        }

        const response = await chatController.chat(message);
        res.json({ response });
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