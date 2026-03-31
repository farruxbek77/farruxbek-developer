import { Client } from '@gradio/client';
import { config } from '../config';
import axios from 'axios';

export class AIService {
    private static client: any;

    static async initialize() {
        try {
            this.client = await Client.connect(config.ai.huggingfaceSpace);
            console.log('✅ AI Model connected:', config.ai.huggingfaceSpace);
        } catch (error) {
            console.warn('⚠️ AI Model connection failed. Bot will work without AI generation.');
            console.warn('You can still test other features.');
            // Don't throw error, let bot continue
        }
    }

    static async generateTalkingVideo(
        imageUrl: string,
        audioUrl?: string,
        text?: string
    ): Promise<string> {
        try {
            if (!this.client) {
                await this.initialize();
            }

            // Download image
            const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const imageBlob = new Blob([imageResponse.data]);

            let audioBlob;
            if (audioUrl) {
                const audioResponse = await axios.get(audioUrl, { responseType: 'arraybuffer' });
                audioBlob = new Blob([audioResponse.data]);
            }

            // Call Gradio API
            const result = await this.client.predict('/predict', {
                source_image: imageBlob,
                driven_audio: audioBlob,
                text: text || '',
            });

            // Result format depends on the model
            return result.data[0]?.url || result.data;
        } catch (error) {
            console.error('AI Generation error:', error);
            throw new Error('Video yaratishda xatolik yuz berdi');
        }
    }

    static async getQueuePosition(): Promise<number> {
        try {
            // Hugging Face Spaces navbat holatini tekshirish
            return Math.floor(Math.random() * 5) + 1; // Mock data
        } catch {
            return 0;
        }
    }
}
