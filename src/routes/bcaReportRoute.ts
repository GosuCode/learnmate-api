import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { bcaReportService } from "@/services/bcaReportService";
import { docxService } from "@/services/docxService";
import { authPreHandler } from "@/middleware/auth";

const BCAReportRequestSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    reportType: z.enum(['project_proposal', 'main_report', 'minor_project']).default('main_report'),
    additionalInstructions: z.string().optional(),
    requirements: z.object({
        lineHeight: z.number(),
        fontSize: z.number(),
        headerSize: z.number(),
        paragraphSize: z.number(),
        fontFamily: z.string(),
        marginTop: z.number(),
        marginBottom: z.number(),
        marginLeft: z.number(),
        marginRight: z.number(),
    }).optional(),
});

type BCAReportRequest = z.infer<typeof BCAReportRequestSchema>;

export default async function bcaReportRoutes(app: FastifyInstance) {
    // Generate BCA report
    app.post("/", {
        preHandler: [authPreHandler],
        handler: async (request: FastifyRequest<{ Body: BCAReportRequest }>, reply: FastifyReply) => {
            try {
                // Validate request body
                const validationResult = BCAReportRequestSchema.safeParse(request.body);
                if (!validationResult.success) {
                    return reply.status(400).send({
                        success: false,
                        error: 'Validation error',
                        message: validationResult.error.errors.map(e => e.message).join(', ')
                    });
                }

                const user = (request as any).user;
                const reportData = {
                    ...validationResult.data,
                    userId: user.userId
                };

                // Set response headers for streaming if needed
                reply.header('Content-Type', 'application/json');
                reply.header('Cache-Control', 'no-cache');
                reply.header('Connection', 'keep-alive');

                const report = await bcaReportService.generateReport(reportData);

                return reply.status(201).send({
                    success: true,
                    data: report,
                    message: "BCA report generated successfully"
                });
            } catch (error) {
                app.log.error('Error generating BCA report:', error);
                return reply.status(500).send({
                    success: false,
                    error: 'Failed to generate BCA report',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    });

    // Generate BCA report with streaming
    app.post("/stream", {
        preHandler: [authPreHandler],
        handler: async (request: FastifyRequest<{ Body: BCAReportRequest }>, reply: FastifyReply) => {
            try {
                // Validate request body
                const validationResult = BCAReportRequestSchema.safeParse(request.body);
                if (!validationResult.success) {
                    return reply.status(400).send({
                        success: false,
                        error: 'Validation error',
                        message: validationResult.error.errors.map(e => e.message).join(', ')
                    });
                }

                const user = (request as any).user;
                const reportData = {
                    ...validationResult.data,
                    userId: user.userId
                };

                // Set response headers for streaming
                reply.header('Content-Type', 'text/event-stream');
                reply.header('Cache-Control', 'no-cache');
                reply.header('Connection', 'keep-alive');
                reply.header('Access-Control-Allow-Origin', '*');
                reply.header('Access-Control-Allow-Headers', 'Cache-Control');

                // Start streaming
                reply.raw.writeHead(200);

                let finalContent = '';
                for await (const chunk of bcaReportService.generateReportStream(reportData)) {
                    const data = JSON.stringify({
                        section: chunk.section,
                        content: chunk.content,
                        progress: chunk.progress
                    });
                    reply.raw.write(`data: ${data}\n\n`);

                    if (chunk.content) {
                        finalContent += chunk.content + '\n\n';
                    }
                }

                // Save the final report to database with transaction
                try {
                    const requirements = reportData.requirements || {
                        lineHeight: 1.5,
                        fontSize: 12,
                        headerSize: 16,
                        paragraphSize: 12,
                        fontFamily: 'Times New Roman',
                        marginTop: 25.4,
                        marginBottom: 25.4,
                        marginLeft: 31.75,
                        marginRight: 25.4,
                    };

                    const report = await bcaReportService.saveReportWithTransaction(
                        reportData,
                        finalContent,
                        requirements
                    );

                    reply.raw.write(`data: ${JSON.stringify({
                        section: 'Complete',
                        content: '',
                        progress: 100,
                        reportId: report.id
                    })}\n\n`);
                } catch (dbError) {
                    console.error('Error saving report to database:', dbError);
                    reply.raw.write(`data: ${JSON.stringify({
                        error: 'Failed to save report',
                        message: dbError instanceof Error ? dbError.message : 'Database error'
                    })}\n\n`);
                }

                reply.raw.write('data: [DONE]\n\n');
                reply.raw.end();

            } catch (error) {
                app.log.error('Error generating BCA report stream:', error);
                reply.raw.write(`data: ${JSON.stringify({
                    error: 'Failed to generate BCA report',
                    message: error instanceof Error ? error.message : 'Unknown error'
                })}\n\n`);
                reply.raw.end();
            }
        }
    });

    // Get user's BCA reports
    app.get("/", {
        preHandler: [authPreHandler],
        handler: async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                const user = (request as any).user;
                const page = parseInt((request.query as any).page) || 1;
                const limit = parseInt((request.query as any).limit) || 10;

                const result = await bcaReportService.getUserReports(user.userId, page, limit);

                return reply.send({
                    success: true,
                    data: result,
                    message: "BCA reports retrieved successfully"
                });
            } catch (error) {
                app.log.error('Error fetching BCA reports:', error);
                return reply.status(500).send({
                    success: false,
                    error: 'Failed to fetch BCA reports',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    });

    // Get specific BCA report
    app.get("/:id", {
        preHandler: [authPreHandler],
        handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            try {
                const user = (request as any).user;
                const { id } = request.params;

                const report = await bcaReportService.getReportById(id, user.userId);

                if (!report) {
                    return reply.status(404).send({
                        success: false,
                        error: 'Report not found',
                        message: 'BCA report not found or you do not have permission to view it'
                    });
                }

                return reply.send({
                    success: true,
                    data: report,
                    message: "BCA report retrieved successfully"
                });
            } catch (error) {
                app.log.error('Error fetching BCA report:', error);
                return reply.status(500).send({
                    success: false,
                    error: 'Failed to fetch BCA report',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    });

    // Delete BCA report
    app.delete("/:id", {
        preHandler: [authPreHandler],
        handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            try {
                const user = (request as any).user;
                const { id } = request.params;

                const result = await bcaReportService.deleteReport(id, user.userId);

                if (result.count === 0) {
                    return reply.status(404).send({
                        success: false,
                        error: 'Report not found',
                        message: 'BCA report not found or you do not have permission to delete it'
                    });
                }

                return reply.send({
                    success: true,
                    message: "BCA report deleted successfully"
                });
            } catch (error) {
                app.log.error('Error deleting BCA report:', error);
                return reply.status(500).send({
                    success: false,
                    error: 'Failed to delete BCA report',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    });

    // Download BCA report as DOCX
    app.get("/:id/download", {
        preHandler: [authPreHandler],
        handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            try {
                const user = (request as any).user;
                const { id } = request.params;

                const report = await bcaReportService.getReportById(id, user.userId);

                if (!report) {
                    return reply.status(404).send({
                        success: false,
                        error: 'Report not found',
                        message: 'BCA report not found or you do not have permission to download it'
                    });
                }

                // Generate DOCX buffer
                const docxBuffer = await docxService.generateDocx(report);

                // Set response headers for file download
                reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
                reply.header('Content-Disposition', `attachment; filename="${report.title.replace(/[^a-zA-Z0-9]/g, '_')}.docx"`);
                reply.header('Content-Length', docxBuffer.length.toString());

                return reply.send(docxBuffer);
            } catch (error) {
                app.log.error('Error downloading BCA report:', error);
                return reply.status(500).send({
                    success: false,
                    error: 'Failed to download BCA report',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    });

    // Download partial BCA report as DOCX (for streaming generation)
    app.get("/:id/download-partial", {
        preHandler: [authPreHandler],
        handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            try {
                const user = (request as any).user;
                const { id } = request.params;

                const report = await bcaReportService.getReportById(id, user.userId);

                if (!report) {
                    return reply.status(404).send({
                        success: false,
                        error: 'Report not found',
                        message: 'BCA report not found or you do not have permission to download it'
                    });
                }

                // Generate partial DOCX buffer (only completed sections)
                const docxBuffer = await docxService.generatePartialDocx(report);

                // Set response headers for file download
                reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
                reply.header('Content-Disposition', `attachment; filename="${report.title.replace(/[^a-zA-Z0-9]/g, '_')}_partial.docx"`);
                reply.header('Content-Length', docxBuffer.length.toString());

                return reply.send(docxBuffer);
            } catch (error) {
                app.log.error('Error downloading partial BCA report:', error);
                return reply.status(500).send({
                    success: false,
                    error: 'Failed to download partial BCA report',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    });

    // Debug endpoint to check content parsing
    app.get("/:id/debug", {
        preHandler: [authPreHandler],
        handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            try {
                const user = (request as any).user;
                const { id } = request.params;

                const report = await bcaReportService.getReportById(id, user.userId);

                if (!report) {
                    return reply.status(404).send({
                        success: false,
                        error: 'Report not found'
                    });
                }

                // Test content parsing
                const sections = await docxService.parseContentToSections(report.content, report.reportType);

                return reply.send({
                    success: true,
                    data: {
                        reportId: report.id,
                        title: report.title,
                        reportType: report.reportType,
                        contentLength: report.content.length,
                        contentPreview: report.content.substring(0, 500),
                        parsedSections: Object.keys(sections),
                        sectionsContent: sections
                    }
                });
            } catch (error) {
                app.log.error('Error debugging BCA report:', error);
                return reply.status(500).send({
                    success: false,
                    error: 'Failed to debug BCA report',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    });

    app.log.info('BCA Report routes registered');
    return app;
}
