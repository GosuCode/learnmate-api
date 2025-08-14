import { FastifyInstance } from "fastify";
import axios from "axios";

export default async function fileProcessingRoutes(app: FastifyInstance) {
    // Register multipart support
    await app.register(require("@fastify/multipart"), {
        limits: {
            fileSize: 50 * 1024 * 1024, // 50MB limit
        },
    });

    app.post("/upload-and-summarize", async (request: any, reply: any) => {
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

            const maxLength = fields.max_length ? parseInt(fields.max_length as string) : 150;
            const chunkSize = fields.chunk_size ? parseInt(fields.chunk_size as string) : 1000;

            // Read file buffer
            const chunks: Buffer[] = [];
            for await (const chunk of file) {
                chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);

            const formData = new FormData();
            const blob = new Blob([buffer], { type: mimetype || 'application/octet-stream' });
            formData.append("file", blob, filename || "uploaded_file");
            formData.append("max_length", maxLength.toString());
            formData.append("chunk_size", chunkSize.toString());

            const response = await axios.post(
                "http://localhost:8000/api/v1/files/upload-and-summarize",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                    timeout: 300000, // 5 minutes timeout for large files
                }
            );

            return reply.send(response.data);
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

            // Read file buffer
            const chunks: Buffer[] = [];
            for await (const chunk of file) {
                chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);

            const formData = new FormData();
            const blob = new Blob([buffer], { type: mimetype || 'application/octet-stream' });
            formData.append("file", blob, filename || "uploaded_file");

            // Call FastAPI service
            const response = await axios.post(
                "http://localhost:8000/api/v1/files/extract-text",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                    timeout: 120000, // 2 minutes timeout
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

