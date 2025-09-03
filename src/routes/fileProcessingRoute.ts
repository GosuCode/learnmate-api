import { FastifyInstance } from "fastify";
import axios from "axios";
import { summaryService } from "@/services/summaryService";
import { titleService } from "@/services/titleService";
import { authenticate } from '@/middleware/auth';

export default async function fileProcessingRoutes(app: FastifyInstance) {
    await app.register(require("@fastify/multipart"), {
        limits: {
            fileSize: 50 * 1024 * 1024,
        },
    });

    app.post("/upload-and-summarize", { preHandler: authenticate }, async (request: any, reply: any) => {
        try {
            const data = await request.file();

            if (!data) {
                return reply.code(400).send({ error: "No file provided" });
            }

            const file = data.file;
            const fields = data.fields;

            if (!file) {
                return reply.code(400).send({ error: "No file provided" });
            }

            const filename = data.filename;
            const mimetype = data.mimetype;

            const wordCount = fields.word_count ? parseInt(fields.word_count as string) : 100;
            const chunkSize = fields.chunk_size ? parseInt(fields.chunk_size as string) : 1000;
            const title = fields.title ? fields.title as string : undefined;

            const chunks: Buffer[] = [];
            for await (const chunk of file) {
                chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);

            const formData = new FormData();
            const blob = new Blob([buffer], { type: mimetype || 'application/octet-stream' });
            formData.append("file", blob, filename || "uploaded_file");
            formData.append("word_count", wordCount.toString());
            formData.append("chunk_size", chunkSize.toString());

            const response = await axios.post(
                "http://localhost:8000/api/v1/files/upload-and-summarize",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                    timeout: 300000,
                }
            );

            const summaryData = response.data;

            // Always save file summaries if user is authenticated
            if (request.user?.userId) {
                try {
                    let finalTitle = title;
                    if (!finalTitle) {
                        const textForTitle = summaryData.cleaned_text || summaryData.original_text || '';
                        finalTitle = await titleService.generateTitle(textForTitle);
                    }

                    const savedSummary = await summaryService.createSummary({
                        title: finalTitle,
                        originalText: summaryData.cleaned_text || summaryData.original_text || '',
                        summary: summaryData.summary,
                        wordCount: summaryData.word_count || wordCount,
                        processingMethod: summaryData.processing_method || 'file_processing',
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
                    console.error('Error saving file summary:', saveError);
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

            if (err.code === "FST_FILES_LIMIT") {
                return reply.code(413).send({ error: "File too large. Maximum size is 50MB." });
            }

            if (err.response?.status === 413) {
                return reply.code(413).send({ error: "File too large for processing." });
            }

            return reply.code(500).send({ error: "Failed to process file" });
        }
    });

    app.post("/extract-text", async (request: any, reply: any) => {
        try {
            const data = await request.file();

            if (!data) {
                return reply.code(400).send({ error: "No file provided" });
            }

            const file = data.file;

            if (!file) {
                return reply.code(400).send({ error: "No file provided" });
            }

            const filename = data.filename;
            const mimetype = data.mimetype;

            const chunks: Buffer[] = [];
            for await (const chunk of file) {
                chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);

            const formData = new FormData();
            const blob = new Blob([buffer], { type: mimetype || 'application/octet-stream' });
            formData.append("file", blob, filename || "uploaded_file");

            const response = await axios.post(
                "http://localhost:8000/api/v1/files/extract-text",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                    timeout: 120000,
                }
            );

            return reply.send(response.data);
        } catch (err: any) {
            if (err.code === "FST_FILES_LIMIT") {
                return reply.code(413).send({ error: "File too large. Maximum size is 50MB." });
            }

            return reply.code(500).send({ error: "Failed to extract text from file" });
        }
    });

    app.get("/supported-formats", async (_, reply) => {
        try {
            const response = await axios.get(
                "http://localhost:8000/api/v1/files/supported-formats",
                { timeout: 10000 }
            );

            return reply.send(response.data);
        } catch (err: any) {
            return reply.code(500).send({ error: "Failed to get supported formats" });
        }
    });
}

