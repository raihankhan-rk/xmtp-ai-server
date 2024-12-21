import xmtpService from '../services/XMTPService.js';
import { setupAIAgent } from '../agent.js';

export class XMTPChatController {
    constructor() {
        this.aiAgent = null;
        this.initialized = false;
        this.messageHistory = [];
        this._initialize().catch(console.error);
    }

    async _initialize() {
        try {
            // Initialize AI agent
            this.aiAgent = await setupAIAgent();

            // Initialize XMTP service
            const { address } = await xmtpService.initialize(process.env.LOCAL_KEY);
            console.log('🤖 AI Bot initialized with address:', address);

            // Set up message handler for incoming messages
            xmtpService.setMessageHandler(async (message) => {
                try {
                    const response = await this.aiAgent.processMessage(message.content);
                    
                    // Store in history
                    this.messageHistory.push({
                        role: 'user',
                        content: message.content,
                        timestamp: new Date(),
                        from: message.from
                    });
                    
                    this.messageHistory.push({
                        role: 'assistant',
                        content: response,
                        timestamp: new Date(),
                        from: address
                    });

                    // Send response
                    await xmtpService.sendMessage(response, message.from);
                } catch (error) {
                    console.error('Error handling message:', error);
                }
            });

            this.initialized = true;
        } catch (error) {
            console.error('Initialization error:', error);
            throw new Error('Failed to initialize chat service');
        }
    }

    async chat(message) {
        try {
            if (!this.initialized) {
                await new Promise(resolve => {
                    const checkInit = () => {
                        if (this.initialized) resolve();
                        else setTimeout(checkInit, 100);
                    };
                    checkInit();
                });
            }

            // Process with AI
            const response = await this.aiAgent.processMessage(message);

            // Store in history
            this.messageHistory.push({
                role: 'user',
                content: message,
                timestamp: new Date()
            });
            
            this.messageHistory.push({
                role: 'assistant',
                content: response,
                timestamp: new Date()
            });

            return response;
        } catch (error) {
            console.error('Chat error:', error);
            throw new Error('Failed to process message');
        }
    }

    async getHistory() {
        return this.messageHistory;
    }

    getAddress() {
        return xmtpService.client?.address;
    }
} 