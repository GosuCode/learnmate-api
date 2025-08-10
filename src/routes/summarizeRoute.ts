import { FastifyInstance } from "fastify";
import axios from "axios";

export default async function summarizeRoutes(app: FastifyInstance) {
    app.post("/", async (request, reply) => {
        const { text, max_length = 128, num_beams = 4 } = request.body as {
            text: string;
            max_length?: number;
            num_beams?: number;
        };

        if (!text || text.trim().length === 0) {
            return reply.code(400).send({ error: "Text is required for summarization" });
        }

        try {
            const response = await axios.post("http://localhost:8000/api/v1/summarize", {
                text,
                max_length,
                num_beams,
            });

            return reply.send(response.data);
        } catch (err: any) {
            console.error(err.response?.data || err.message);
            return reply.code(500).send({ error: "Failed to summarize text" });
        }
    });
}
