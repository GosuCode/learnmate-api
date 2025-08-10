import { FastifyInstance } from "fastify";
import axios from "axios";

export default async function mcqRoutes(app: FastifyInstance) {
    app.post("/", async (request, reply) => {
        const { text, num_questions = 5 } = request.body as {
            text: string;
            num_questions?: number;
        };

        if (!text || text.trim().length === 0) {
            return reply.code(400).send({ error: "Text is required for MCQ generation" });
        }

        try {
            const response = await axios.post("http://localhost:8000/api/v1/mcq/generate", {
                text,
                num_questions,
                use_bart: false
            });

            return reply.send(response.data);
        } catch (err: any) {
            console.error(err.response?.data || err.message);
            return reply.code(500).send({ error: "Failed to generate MCQ" });
        }
    });
}
