import axios from 'axios';
import { MCQRequest, MCQResponse } from '@/types/mcq';


export class MCQService {
    private fastapiServiceUrl: string;

    constructor() {
        this.fastapiServiceUrl = process.env.FASTAPI_SERVICE_URL || 'http://localhost:8000';
    }

    private async callFastAPIService<T>(endpoint: string, data: any): Promise<T> {
        try {
            const response = await axios.post(`${this.fastapiServiceUrl}/api/v1${endpoint}`, data, {
                timeout: 30000,
                headers: { 'Content-Type': 'application/json' }
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`FastAPI service error: ${error.response?.data?.detail || error.message}`);
            }
            throw new Error(`Failed to call FastAPI service: ${error}`);
        }
    }

    async generateMCQs(request: MCQRequest): Promise<MCQResponse> {
        return await this.callFastAPIService('/mcq/generate', request);
    }

    async checkFastAPIServiceHealth(): Promise<boolean> {
        try {
            const response = await axios.get(`${this.fastapiServiceUrl}/health`, { timeout: 5000 });
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    getServiceInfo() {
        return {
            service: 'Fastify MCQ Service (FastAPI Integration)',
            fastapi_service_url: this.fastapiServiceUrl,
            features: ['mcqs'],
            use_fastapi_service: true
        };
    }
}

export const mcqService = new MCQService();
