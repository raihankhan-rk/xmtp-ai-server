import 'dotenv/config';
import express from 'express';
import xmtpService from './services/XMTPService.js';
import { setupAIAgent } from './agent.js';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        // Initialize AI agent
        const aiAgent = await setupAIAgent();

        // Initialize XMTP service
        const { address } = await xmtpService.initialize(process.env.LOCAL_KEY);
        console.log('🤖 AI Agent initialized with address:', address);

        // Set up message handler
        xmtpService.setMessageHandler(async (message) => {
            try {
                console.log('\n📩 Received:', message.decoded);
                
                const response = await aiAgent.processMessage(message.content);
                console.log('🤖 AI Response:', response);
                
                await xmtpService.sendMessage(response, message.from);
                console.log('✈️ Response sent');
            } catch (error) {
                console.error('Error handling message:', error);
            }
        });

        // Basic health check endpoint
        app.get('/health', (req, res) => {
            res.json({ 
                status: 'healthy',
                address: xmtpService.client?.address
            });
        });

        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down server...');
    process.exit(0);
});

startServer(); 