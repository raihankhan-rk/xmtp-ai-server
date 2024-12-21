import { ChatOpenAI } from '@langchain/openai';
import { ConversationChain } from 'langchain/chains';
import { BufferMemory } from 'langchain/memory';

class AIAgent {
    constructor() {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is required in environment variables');
        }

        this.model = new ChatOpenAI({
            temperature: 0.7,
            model: 'gpt-4o-mini',
            apiKey: process.env.OPENAI_API_KEY,
        });

        this.memory = new BufferMemory();
        
        this.chain = new ConversationChain({
            llm: this.model,
            memory: this.memory,
        });
    }

    async processMessage(message) {
        try {
            const response = await this.chain.invoke({
                input: message
            });
            return response.response;
        } catch (error) {
            console.error('Error processing message with AI:', error);
            return 'Sorry, I encountered an error processing your message. Please try again.';
        }
    }
}

export async function setupAIAgent() {
    return new AIAgent();
} 