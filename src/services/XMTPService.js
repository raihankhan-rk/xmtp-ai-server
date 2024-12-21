import { Client } from '@xmtp/xmtp-js';
import { Wallet } from 'ethers';
import { randomBytes } from 'crypto';

class XMTPService {
    constructor() {
        this.client = null;
        this.conversations = new Map();
    }

    /**
     * Initialize XMTP service with an optional existing key
     * @param {string} [savedPrivateKey] - Optional existing private key
     * @returns {Promise<Object>} Connection details
     */
    async initialize(savedPrivateKey = null) {
        try {
            // Create or load wallet
            const privateKey = savedPrivateKey || this.generatePrivateKey();
            const wallet = new Wallet(privateKey);
            
            // Create XMTP client
            this.client = await Client.create(wallet, { env: 'production' });
            
            // Start listening for new messages
            this.startMessageListener();
            
            return {
                address: this.client.address,
                privateKey: wallet.privateKey
            };
        } catch (error) {
            throw new Error(`Failed to initialize XMTP: ${error.message}`);
        }
    }

    /**
     * Generate a random private key
     * @private
     */
    generatePrivateKey() {
        return '0x' + randomBytes(32).toString('hex');
    }

    /**
     * Send a message to a recipient
     * @param {string} message - The message to send
     * @param {string} recipientAddress - The recipient's address
     */
    async sendMessage(message, recipientAddress) {
        try {
            if (!this.client) {
                throw new Error('XMTP client not initialized');
            }

            let conversation = this.conversations.get(recipientAddress);
            if (!conversation) {
                conversation = await this.client.conversations.newConversation(recipientAddress);
                this.conversations.set(recipientAddress, conversation);
            }

            await conversation.send(message);
        } catch (error) {
            throw new Error(`Failed to send message: ${error.message}`);
        }
    }

    /**
     * Register a callback for incoming messages
     * @param {Function} callback 
     */
    setMessageHandler(callback) {
        this.messageCallback = callback;
    }

    async startMessageListener() {
        if (!this.client) {
            throw new Error('XMTP client not initialized');
        }

        const streamMessages = async () => {
            try {
                // Get all conversations
                const conversations = await this.client.conversations.list();
                
                // Listen to existing conversations
                for (const conversation of conversations) {
                    this.conversations.set(conversation.peerAddress, conversation);
                    this.streamConversationMessages(conversation);
                }

                // Stream new conversations
                for await (const conversation of await this.client.conversations.stream()) {
                    this.conversations.set(conversation.peerAddress, conversation);
                    this.streamConversationMessages(conversation);
                }
            } catch (error) {
                console.error('Error in message streaming:', error);
                // Retry after a delay
                setTimeout(streamMessages, 5000);
            }
        };

        streamMessages();
    }

    async streamConversationMessages(conversation) {
        try {
            // Load existing messages
            const messages = await conversation.messages();
            for (const message of messages) {
                if (this.messageCallback && message.senderAddress !== this.client.address) {
                    this.messageCallback({
                        from: message.senderAddress,
                        content: message.content,
                        decoded: `Decoded message: ${message.content} by ${message.senderAddress}`
                    });
                }
            }

            // Stream new messages
            for await (const message of await conversation.streamMessages()) {
                if (this.messageCallback && message.senderAddress !== this.client.address) {
                    this.messageCallback({
                        from: message.senderAddress,
                        content: message.content,
                        decoded: `Decoded message: ${message.content} by ${message.senderAddress}`
                    });
                }
            }
        } catch (error) {
            console.error('Error streaming conversation messages:', error);
        }
    }

    async getConversationMessages(address) {
        try {
            if (!this.client) {
                throw new Error('XMTP client not initialized');
            }

            let conversation = this.conversations.get(address);
            if (!conversation) {
                conversation = await this.client.conversations.newConversation(address);
                this.conversations.set(address, conversation);
            }

            const messages = await conversation.messages();
            return messages.map(message => ({
                from: message.senderAddress,
                content: message.content,
                timestamp: message.sent
            }));
        } catch (error) {
            throw new Error(`Failed to get messages: ${error.message}`);
        }
    }
}

export default new XMTPService(); 