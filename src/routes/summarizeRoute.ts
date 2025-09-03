import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import axios from "axios";
import { z } from "zod";
import { summaryService } from "@/services/summaryService";
import { titleService } from "@/services/titleService";
import { authenticate } from '@/middleware/auth';

// Request schemas
const SummarizeRequestSchema = z.object({
    text: z.string().min(1000, 'Text must be at least 1000 characters long'),
    word_count: z.number().int().min(50).max(500).default(100),
    num_beams: z.number().int().min(1).max(10).default(4),
    save: z.boolean().default(false),
    title: z.string().optional(),
});

const SaveSummaryRequestSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    originalText: z.string().min(1, 'Original text is required'),
    summary: z.string().min(1, 'Summary is required'),
    wordCount: z.number().int().min(1),
    processingMethod: z.string().default('bart_generation'),
});

type SummarizeRequest = z.infer<typeof SummarizeRequestSchema>;
type SaveSummaryRequest = z.infer<typeof SaveSummaryRequestSchema>;

export default async function summarizeRoutes(app: FastifyInstance) {
    // Generate summary
    app.post<{ Body: SummarizeRequest }>("/", { preHandler: authenticate }, async (request, reply) => {
        try {
            const { text, word_count, num_beams, save, title } = request.body;

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

            if (save && request.user?.userId) {
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
                    // Return the summary even if saving failed
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

    // Save summary manually
    app.post("/save", async (request: FastifyRequest<{ Body: SaveSummaryRequest }>, reply: FastifyReply) => {
        try {
            if (!request.user?.userId) {
                return reply.status(401).send({ error: "Authentication required" });
            }

            const { title, originalText, summary, wordCount, processingMethod } = request.body;

            const savedSummary = await summaryService.createSummary({
                title,
                originalText,
                summary,
                wordCount,
                processingMethod,
                userId: request.user.userId,
            });

            return reply.send({
                success: true,
                summary: savedSummary,
            });

        } catch (error) {
            app.log.error('Save summary error:', error);
            return reply.status(500).send({
                error: "Failed to save summary",
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    // Get user's summaries
    app.get("/", async (request: FastifyRequest<{
        Querystring: { page?: string; limit?: string; search?: string }
    }>, reply: FastifyReply) => {
        try {
            if (!request.user?.userId) {
                return reply.status(401).send({ error: "Authentication required" });
            }

            const page = parseInt(request.query.page || '1');
            const limit = parseInt(request.query.limit || '10');
            const search = request.query.search;

            let result;
            if (search) {
                result = await summaryService.searchSummaries(request.user.userId, search, page, limit);
            } else {
                result = await summaryService.getUserSummaries(request.user.userId, page, limit);
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

    // Get specific summary
    app.get("/:id", async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            if (!request.user?.userId) {
                return reply.status(401).send({ error: "Authentication required" });
            }

            const summary = await summaryService.getSummaryById(request.params.id, request.user.userId);

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

    // Delete summary
    app.delete("/:id", async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            if (!request.user?.userId) {
                return reply.status(401).send({ error: "Authentication required" });
            }

            const result = await summaryService.deleteSummary(request.params.id, request.user.userId);

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
