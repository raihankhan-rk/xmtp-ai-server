import 'dotenv/config';
import xmtpService from '../src/services/XMTPService.js';
import readline from 'readline';

// Create interface for reading console input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function startClient() {
    try {
        // Initialize XMTP service for the test client
        const { address } = await xmtpService.initialize();
        console.log('📱 Client connected with address:', address);
        
        // Set up message handler
        xmtpService.setMessageHandler((message) => {
            console.log('\n📩 Received:', message.decoded);
        });

        // Ask for the AI agent's address
        rl.question('Enter the AI agent address from the other terminal: ', async (agentAddress) => {
            console.log('\n🤝 Connected to AI agent. Type your messages (Ctrl+C to exit):\n');
            
            // Set up continuous message input
            rl.on('line', async (input) => {
                try {
                    await xmtpService.sendMessage(input, agentAddress);
                    console.log('✈️ Message sent');
                } catch (error) {
                    console.error('Error sending message:', error);
                }
            });
        });

    } catch (error) {
        console.error('Failed to start client:', error);
        process.exit(1);
    }
}

startClient();

// Handle cleanup
rl.on('close', () => {
    console.log('\n👋 Goodbye!');
    process.exit(0);
}); 