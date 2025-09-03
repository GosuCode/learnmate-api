import axios from 'axios';

export class TitleService {
    private readonly BART_API_URL = 'http://localhost:8000/api/v1';

    async generateTitle(text: string): Promise<string> {
        try {
            const truncatedText = text.substring(0, 1000);

            const response = await axios.post(`${this.BART_API_URL}/generate-title`, {
                text: truncatedText
            }, {
                timeout: 10000
            });

            return response.data.title || this.generateFallbackTitle(text);
        } catch (error) {
            console.error('Title generation failed:', error);
            return this.generateFallbackTitle(text);
        }
    }

    private generateFallbackTitle(text: string): string {
        const words = text.trim().split(/\s+/).slice(0, 6);
        let title = words.join(' ');

        title = title.replace(/[.,;:!?]+$/, '');

        if (title.length > 0) {
            title = title[0].toUpperCase() + title.slice(1);
        }

        if (words.length >= 6) {
            title += '...';
        }

        return title || 'Generated Content';
    }
}

export const titleService = new TitleService();
