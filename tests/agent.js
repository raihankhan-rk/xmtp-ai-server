import 'dotenv/config';
import xmtpService from '../src/services/XMTPService.js';
import { setupAIAgent } from '../src/agent.js';

async function startAgent() {
    try {
        // Initialize AI agent
        const aiAgent = await setupAIAgent();

        // Initialize XMTP service for the AI agent
        const { address } = await xmtpService.initialize(process.env.LOCAL_KEY);
        console.log('🤖 AI Agent listening on address:', address);
        
        // Set up message handler
        xmtpService.setMessageHandler(async (message) => {
            try {
                console.log('\n📩 Received:', message.decoded);
                
                // Process message with AI
                const response = await aiAgent.processMessage(message.content);
                console.log('🤖 AI Response:', response);
                
                // Send response back
                await xmtpService.sendMessage(response, message.from);
                console.log('✈️ Response sent');
            } catch (error) {
                console.error('Error processing message:', error);
            }
        });

        // Keep the process running
        process.stdin.resume();

    } catch (error) {
        console.error('Failed to start agent:', error);
        process.exit(1);
    }
}

// Handle cleanup
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down AI agent...');
    process.exit(0);
});

startAgent(); 