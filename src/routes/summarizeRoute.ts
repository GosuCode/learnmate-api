import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import axios from "axios";
import { z } from "zod";
import { summaryService } from "@/services/summaryService";
import { titleService } from "@/services/titleService";
import { authenticate } from '@/middleware/auth';

const SummarizeRequestSchema = z.object({
    text: z.string().min(1000, 'Text must be at least 1000 characters long'),
    word_count: z.number().int().min(50).max(500).default(100),
    num_beams: z.number().int().min(1).max(10).default(4),
    title: z.string().optional(),
});

type SummarizeRequest = z.infer<typeof SummarizeRequestSchema>;

export default async function summarizeRoutes(app: FastifyInstance) {
    app.post<{ Body: SummarizeRequest }>("/", { preHandler: authenticate }, async (request, reply) => {
        try {
            const { text, word_count, num_beams, title } = request.body;

            if (!text || text.trim().length < 1000) {
                return reply.status(400).send({
                    error: "Text must be at least 1000 characters long"
                });
            }

            const response = await axios.post("http://localhost:8000/api/v1/summarize", {
                text,
                word_count,
                num_beams,
            });

            const summaryData = response.data;

            if (request.user?.userId) {
                try {
                    let finalTitle = title;
                    if (!finalTitle) {
                        finalTitle = await titleService.generateTitle(text);
                    }

                    const savedSummary = await summaryService.createSummary({
                        title: finalTitle,
                        originalText: text,
                        summary: summaryData.summary,
                        wordCount: summaryData.actual_word_count || summaryData.requested_word_count,
                        processingMethod: summaryData.processing_method || 'bart_generation',
                        userId: request.user.userId,
                    });

                    return reply.send({
                        ...summaryData,
                        saved: true,
                        savedSummary: {
                            id: savedSummary.id,
                            title: savedSummary.title,
                            createdAt: savedSummary.createdAt,
                        },
                    });
                } catch (saveError) {
                    app.log.error('Failed to save summary:', saveError);
                    return reply.send({
                        ...summaryData,
                        saved: false,
                        saveError: 'Failed to save summary',
                    });
                }
            }

            return reply.send({
                ...summaryData,
                saved: false,
            });

        } catch (err: any) {
            app.log.error('Summarization error:', err.response?.data || err.message);
            return reply.status(500).send({
                error: "Failed to summarize text",
                details: err.response?.data || err.message
            });
        }
    });

    app.get("/", { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = (request as any).user?.userId;
            if (!userId) {
                return reply.status(401).send({ error: "Authentication required" });
            }

            const page = parseInt((request.query as any).page || '1');
            const limit = parseInt((request.query as any).limit || '10');
            const search = (request.query as any).search;

            let result;
            if (search) {
                result = await summaryService.searchSummaries(userId, search, page, limit);
            } else {
                result = await summaryService.getUserSummaries(userId, page, limit);
            }

            return reply.send(result);

        } catch (error) {
            app.log.error('Get summaries error:', error);
            return reply.status(500).send({
                error: "Failed to retrieve summaries",
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    app.get("/:id", { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = (request as any).user?.userId;
            if (!userId) {
                return reply.status(401).send({ error: "Authentication required" });
            }

            const summary = await summaryService.getSummaryById((request.params as any).id, userId);

            if (!summary) {
                return reply.status(404).send({ error: "Summary not found" });
            }

            return reply.send(summary);

        } catch (error) {
            app.log.error('Get summary error:', error);
            return reply.status(500).send({
                error: "Failed to retrieve summary",
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    app.delete("/:id", { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = (request as any).user?.userId;
            if (!userId) {
                return reply.status(401).send({ error: "Authentication required" });
            }

            const result = await summaryService.deleteSummary((request.params as any).id, userId);

            if (result.count === 0) {
                return reply.status(404).send({ error: "Summary not found" });
            }

            return reply.send({ success: true, message: "Summary deleted successfully" });

        } catch (error) {
            app.log.error('Delete summary error:', error);
            return reply.status(500).send({
                error: "Failed to delete summary",
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
}
