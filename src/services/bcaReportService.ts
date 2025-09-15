import { prisma } from '@/lib/prisma';
import { geminiService } from './geminiService';
import { MarkdownParser } from './markdownParser';
import reportSectionsConfig from '../config/reportSections.json';

export interface BCAReportRequirements {
    lineHeight: number;
    fontSize: number;
    headerSize: number;
    paragraphSize: number;
    fontFamily: string;
    marginTop: number;
    marginBottom: number;
    marginLeft: number;
    marginRight: number;
}

export interface CreateBCAReportData {
    title: string;
    reportType: 'project_proposal' | 'main_report' | 'minor_project';
    requirements?: BCAReportRequirements;
    additionalInstructions?: string;
    userId: string;
}

export interface BCAReport {
    id: string;
    title: string;
    content: string;
    reportType: string;
    requirements: BCAReportRequirements;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

export class BCAReportService {
    private getDefaultRequirements(): BCAReportRequirements {
        return {
            lineHeight: 1.5,
            fontSize: 12,
            headerSize: 16,
            paragraphSize: 12,
            fontFamily: 'Times New Roman',
            marginTop: 25.4, // 1 inch = 25.4mm
            marginBottom: 25.4,
            marginLeft: 31.75, // 1.25 inch = 31.75mm
            marginRight: 25.4,
        };
    }



    async generateReport(data: CreateBCAReportData): Promise<BCAReport> {
        const requirements = data.requirements || this.getDefaultRequirements();

        // Try enhanced chunked approach first, fallback to single prompt if it fails
        let generatedContent: string;
        try {
            generatedContent = await this.generateEnhancedChunkedReport(
                data.title,
                data.reportType,
                requirements,
                data.additionalInstructions
            );
        } catch (error) {
            console.error('Enhanced chunked generation failed, falling back to single prompt:', error);
            generatedContent = await this.generateSinglePromptReport(
                data.title,
                data.reportType,
                requirements,
                data.additionalInstructions
            );
        }

        // Create the report in database with transaction
        return await this.saveReportWithTransaction(data, generatedContent, requirements);
    }

    async saveReportWithTransaction(
        data: CreateBCAReportData,
        content: string,
        requirements: BCAReportRequirements
    ): Promise<BCAReport> {
        return await prisma.$transaction(async (tx) => {
            const report = await tx.bCAReport.create({
                data: {
                    title: data.title,
                    content: content,
                    reportType: data.reportType,
                    requirements: requirements as any,
                    userId: data.userId,
                },
            });

            return {
                id: report.id,
                title: report.title,
                content: report.content,
                reportType: report.reportType,
                requirements: report.requirements as unknown as BCAReportRequirements,
                userId: report.userId,
                createdAt: report.createdAt,
                updatedAt: report.updatedAt,
            };
        });
    }

    async savePartialReport(
        data: CreateBCAReportData,
        sections: { [key: string]: string },
        requirements: BCAReportRequirements
    ): Promise<BCAReport> {
        const content = this.combineSections(sections, data.reportType);
        return await this.saveReportWithTransaction(data, content, requirements);
    }

    async *generateReportStream(data: CreateBCAReportData): AsyncGenerator<{ section: string; content: string; progress: number; partialContent?: string }, void, unknown> {
        const requirements = data.requirements || this.getDefaultRequirements();
        const sections = this.getReportSections(data.reportType);
        const generatedSections: { [key: string]: string } = {};

        // Identify independent and dependent sections
        const independentSections = this.getIndependentSections(data.reportType);
        const dependentSections = sections.filter(s => !independentSections.includes(s.key));

        // Generate independent sections in parallel
        if (independentSections.length > 0) {
            yield { section: 'Starting parallel generation...', content: '', progress: 0 };

            const independentPromises = independentSections.map(async (sectionKey) => {
                const section = sections.find(s => s.key === sectionKey);
                if (!section) return null;

                const content = await this.generateSectionWithRefinement(
                    data.title,
                    data.reportType,
                    section,
                    requirements,
                    data.additionalInstructions
                );
                return { key: sectionKey, content, name: section.name };
            });

            const independentResults = await Promise.all(independentPromises);
            for (const result of independentResults) {
                if (result) {
                    generatedSections[result.key] = result.content;
                    yield { section: result.name, content: result.content, progress: (Object.keys(generatedSections).length / sections.length) * 100 };
                }
            }
        }

        // Generate dependent sections with streaming for real-time content
        for (let i = 0; i < dependentSections.length; i++) {
            const section = dependentSections[i];
            const progress = ((independentSections.length + i) / sections.length) * 100;

            yield { section: `Generating ${section.name}...`, content: '', progress };

            // Stream the section generation for real-time feedback
            let sectionContent = '';
            for await (const chunk of this.generateSectionStream(
                data.title,
                data.reportType,
                section,
                requirements,
                data.additionalInstructions,
                generatedSections
            )) {
                sectionContent += chunk;
                const currentProgress = ((independentSections.length + i) / sections.length) * 100;
                yield {
                    section: section.name,
                    content: sectionContent,
                    progress: currentProgress,
                    partialContent: chunk
                };
            }

            generatedSections[section.key] = sectionContent;
            yield { section: section.name, content: sectionContent, progress: ((independentSections.length + i + 1) / sections.length) * 100 };
        }

        // Final combination
        const finalContent = this.combineSections(generatedSections, data.reportType);
        yield { section: 'Finalizing report...', content: finalContent, progress: 100 };
    }

    private async generateEnhancedChunkedReport(
        title: string,
        reportType: string,
        requirements: BCAReportRequirements,
        additionalInstructions?: string
    ): Promise<string> {
        const sections = this.getReportSections(reportType);
        const generatedSections: { [key: string]: string } = {};

        // Identify independent and dependent sections
        const independentSections = this.getIndependentSections(reportType);
        const dependentSections = sections.filter(s => !independentSections.includes(s.key));

        // Generate independent sections in parallel
        if (independentSections.length > 0) {
            const independentPromises = independentSections.map(async (sectionKey) => {
                const section = sections.find(s => s.key === sectionKey);
                if (!section) return null;

                const content = await this.generateSectionWithRefinement(
                    title, reportType, section, requirements, additionalInstructions
                );
                return { key: sectionKey, content };
            });

            const independentResults = await Promise.all(independentPromises);
            independentResults.forEach(result => {
                if (result) {
                    generatedSections[result.key] = result.content;
                }
            });
        }

        // Generate dependent sections sequentially with context
        for (const section of dependentSections) {
            try {
                const sectionContent = await this.generateSectionWithRefinement(
                    title,
                    reportType,
                    section,
                    requirements,
                    additionalInstructions,
                    generatedSections
                );
                generatedSections[section.key] = sectionContent;
            } catch (error) {
                console.error(`Error generating section ${section.key}:`, error);
                generatedSections[section.key] = `[Error generating ${section.name} section]`;
            }
        }

        // Combine all sections into final report
        return this.combineSections(generatedSections, reportType);
    }


    private getReportSections(reportType: string): Array<{ key: string; name: string; order: number; independent: boolean }> {
        const config = reportSectionsConfig[reportType as keyof typeof reportSectionsConfig];
        if (!config) {
            throw new Error(`Unknown report type: ${reportType}`);
        }
        return config.sections;
    }

    private async generateSection(
        title: string,
        reportType: string,
        section: { key: string; name: string; order: number },
        requirements: BCAReportRequirements,
        additionalInstructions?: string,
        context?: { [key: string]: string }
    ): Promise<string> {
        const prompt = await this.generateSectionPrompt(
            title,
            reportType,
            section,
            requirements,
            additionalInstructions,
            context
        );

        return await geminiService.generateContent(prompt);
    }

    private async *generateSectionStream(
        title: string,
        reportType: string,
        section: { key: string; name: string; order: number },
        requirements: BCAReportRequirements,
        additionalInstructions?: string,
        context?: { [key: string]: string }
    ): AsyncGenerator<string, void, unknown> {
        const prompt = await this.generateSectionPrompt(
            title,
            reportType,
            section,
            requirements,
            additionalInstructions,
            context
        );

        for await (const chunk of geminiService.generateContentStream(prompt)) {
            yield chunk;
        }
    }

    private async generateSectionPrompt(
        title: string,
        reportType: string,
        section: { key: string; name: string; order: number },
        _requirements: BCAReportRequirements,
        additionalInstructions?: string,
        context?: { [key: string]: string }
    ): Promise<string> {
        const contextInfo = context ? await this.buildContextString(context) : '';

        return `You are writing a specific section for a BCA ${reportType} report about the project: "${title}".

PROJECT FOCUS:
- This report is specifically about: ${title}
- Do NOT write generic content about BCA or NetworkError
- Make ALL content relevant to the actual project: ${title}
- Focus on the specific project's features, implementation, and outcomes
- If the title suggests an e-learning platform, write about e-learning features, user management, content delivery, etc.
- If the title suggests a web application, write about web technologies, databases, user interfaces, etc.
- Make the content specific to the project domain and functionality

REPORT CONTEXT:
${contextInfo}

SECTION REQUIREMENTS:
- Write the "${section.name}" section specifically for the project: ${title}
- This is section ${section.order} of the report
- Make content directly relevant to ${title}
- Use proper academic language and tone
- Ensure content flows logically

CONTENT GUIDELINES:
- Write about the actual project: ${title}
- Include specific technical details relevant to ${title}
- Use practical examples from ${title}
- Make it specific to the project's domain and functionality
- Avoid generic BCA content - focus on the project

FORMATTING REQUIREMENTS:
- Write in PLAIN TEXT format only
- Do NOT use markdown formatting (no #, **, *, etc.)
- Use proper academic paragraph structure
- Use numbered lists where appropriate (1. 2. 3.)
- Use bullet points where appropriate (- or •)
- Keep headings simple and clear
- Ensure proper spacing between paragraphs

${additionalInstructions ? `ADDITIONAL INSTRUCTIONS: ${additionalInstructions}` : ''}

Generate a well-structured ${section.name} section specifically about the project "${title}" in plain text format. Make it relevant, specific, and focused on the actual project.`;
    }

    private async buildContextString(context: { [key: string]: string }): Promise<string> {
        if (Object.keys(context).length === 0) return '';

        let contextStr = 'PREVIOUSLY GENERATED SECTIONS (for context and continuity):\n';

        // Summarize large sections to reduce token usage
        for (const [key, content] of Object.entries(context)) {
            if (content.length > 500) {
                try {
                    const summary = await this.summarizeContent(content, key);
                    contextStr += `\n${key.toUpperCase()}:\n${summary}\n`;
                } catch (error) {
                    console.error(`Failed to summarize ${key}, using truncated content:`, error);
                    contextStr += `\n${key.toUpperCase()}:\n${content.substring(0, 300)}...\n`;
                }
            } else {
                contextStr += `\n${key.toUpperCase()}:\n${content}\n`;
            }
        }

        contextStr += '\nIMPORTANT: Build upon the above context but focus on the current section requirements.';
        return contextStr;
    }

    private async summarizeContent(content: string, sectionName: string): Promise<string> {
        const prompt = `Summarize the following ${sectionName} section content in 2-3 sentences, focusing on key points and main ideas. Keep it concise but informative:

${content}

Summary:`;

        try {
            return await geminiService.generateContent(prompt);
        } catch (error) {
            console.error(`Summarization failed for ${sectionName}:`, error);
            return content.substring(0, 300) + '...';
        }
    }

    private combineSections(sections: { [key: string]: string }, reportType: string): string {
        const sectionOrder = this.getReportSections(reportType);
        let combinedReport = '';

        sectionOrder.forEach(section => {
            if (sections[section.key]) {
                // Use uppercase section names for better parsing
                combinedReport += `\n\n${section.name.toUpperCase()}\n\n${sections[section.key]}\n\n`;
            }
        });

        const finalContent = combinedReport.trim();
        console.log('Combined report content length:', finalContent.length);
        console.log('Combined report preview:', finalContent.substring(0, 500));

        return finalContent;
    }

    private async generateSinglePromptReport(
        title: string,
        reportType: string,
        requirements: BCAReportRequirements,
        additionalInstructions?: string
    ): Promise<string> {
        const prompt = `Generate a comprehensive BCA ${reportType} report with the title "${title}".

IMPORTANT: This report is specifically about the project "${title}". Do NOT write generic content about BCA or NetworkError. Make ALL content relevant to the actual project.

REPORT STRUCTURE:
${this.getReportStructureForType(reportType)}

FORMATTING SPECIFICATIONS:
- Font Family: ${requirements.fontFamily}
- Font Size: ${requirements.fontSize}pt for paragraphs
- Chapter Title Font Size: 16pt (Bold)
- Section Heading Font Size: 14pt (Bold)
- Sub-section Heading Font Size: 12pt (Bold)
- Line Height: ${requirements.lineHeight}
- All paragraphs must be justified

CONTENT REQUIREMENTS:
- Write specifically about the project: ${title}
- If it's an e-learning platform, focus on learning management features, user experience, content delivery
- If it's a web application, focus on web technologies, databases, user interfaces
- Include relevant technical details for the specific project
- Use proper academic language and tone
- Make content specific to the project's domain and functionality

FORMATTING REQUIREMENTS:
- Write in PLAIN TEXT format only
- Do NOT use markdown formatting (no #, **, *, etc.)
- Use proper academic paragraph structure
- Use numbered lists where appropriate (1. 2. 3.)
- Use bullet points where appropriate (- or •)
- Keep headings simple and clear
- Ensure proper spacing between paragraphs

${additionalInstructions ? `ADDITIONAL INSTRUCTIONS: ${additionalInstructions}` : ''}

Generate a complete, well-structured BCA ${reportType} report specifically about the project "${title}" in plain text format.`;

        const markdownContent = await geminiService.generateContent(prompt);
        return MarkdownParser.parseToPlainText(markdownContent);
    }

    private getReportStructureForType(reportType: string): string {
        if (reportType === 'project_proposal') {
            return `
1. INTRODUCTION
2. PROBLEM STATEMENT  
3. OBJECTIVES
4. METHODOLOGY
5. GANTT CHART
6. EXPECTED OUTCOME
7. REFERENCES`;
        } else if (reportType === 'main_report') {
            return `
PRELIMINARY PAGES:
- Abstract
- Acknowledgement
- Table of Contents

MAIN REPORT:
- Chapter 1: Introduction
- Chapter 2: Background Study and Literature Review
- Chapter 3: System Analysis and Design
- Chapter 4: Implementation and Testing
- Chapter 5: Conclusion and Future Recommendations
- References`;
        } else {
            return `
1. INTRODUCTION
2. LITERATURE REVIEW
3. SYSTEM ANALYSIS
4. IMPLEMENTATION
5. TESTING AND RESULTS
6. CONCLUSION
7. REFERENCES`;
        }
    }


    async getReportById(id: string, userId: string): Promise<BCAReport | null> {
        const report = await prisma.bCAReport.findFirst({
            where: {
                id,
                userId,
            },
        });

        if (!report) return null;

        return {
            id: report.id,
            title: report.title,
            content: report.content,
            reportType: report.reportType,
            requirements: report.requirements as unknown as BCAReportRequirements,
            userId: report.userId,
            createdAt: report.createdAt,
            updatedAt: report.updatedAt,
        };
    }

    async getUserReports(userId: string, page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;

        const [reports, total] = await Promise.all([
            prisma.bCAReport.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.bCAReport.count({
                where: { userId },
            }),
        ]);

        return {
            reports: reports.map((report: any) => ({
                id: report.id,
                title: report.title,
                content: report.content,
                reportType: report.reportType,
                requirements: report.requirements as unknown as BCAReportRequirements,
                userId: report.userId,
                createdAt: report.createdAt,
                updatedAt: report.updatedAt,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async deleteReport(id: string, userId: string) {
        return await prisma.bCAReport.deleteMany({
            where: {
                id,
                userId,
            },
        });
    }

    private getIndependentSections(reportType: string): string[] {
        const sections = this.getReportSections(reportType);
        return sections.filter(section => section.independent).map(section => section.key);
    }

    private async generateSectionWithRefinement(
        title: string,
        reportType: string,
        section: { key: string; name: string; order: number },
        requirements: BCAReportRequirements,
        additionalInstructions?: string,
        context?: { [key: string]: string }
    ): Promise<string> {
        try {
            // Generate initial content
            const initialContent = await this.generateSection(
                title, reportType, section, requirements, additionalInstructions, context
            );

            // Convert markdown to plain text
            const plainTextContent = MarkdownParser.parseToPlainText(initialContent);

            // Validate content quality
            if (!plainTextContent || plainTextContent.trim().length < 50) {
                throw new Error(`Generated content for ${section.name} is too short or empty`);
            }

            // Apply iterative refinement
            const refinedContent = await this.refineContent(
                plainTextContent, title, reportType, section, requirements
            );

            // Convert refined content from markdown to plain text
            const finalContent = MarkdownParser.parseToPlainText(refinedContent);

            // Validate refined content
            if (!finalContent || finalContent.trim().length < 50) {
                console.warn(`Refinement failed for ${section.name}, using initial content`);
                return plainTextContent;
            }

            return finalContent;
        } catch (error) {
            console.error(`Error generating section ${section.key}:`, error);

            // Distinguish between different error types
            if (error instanceof Error) {
                if (error.message.includes('API') || error.message.includes('Gemini')) {
                    throw new Error(`AI service error for ${section.name}: ${error.message}`);
                } else if (error.message.includes('too short') || error.message.includes('empty')) {
                    throw new Error(`Content generation failed for ${section.name}: ${error.message}`);
                }
            }

            throw new Error(`Failed to generate ${section.name} section: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async refineContent(
        content: string,
        title: string,
        reportType: string,
        section: { key: string; name: string; order: number },
        _requirements: BCAReportRequirements
    ): Promise<string> {
        const refinementPrompt = `You are a professional editor refining academic content. Please polish and improve the following ${section.name} section for a BCA ${reportType} report about "${title}".

ORIGINAL CONTENT:
${content}

REFINEMENT REQUIREMENTS:
- Improve clarity and flow
- Ensure proper academic tone
- Fix any grammatical errors
- Enhance coherence and structure
- Make content more specific to the project: ${title}
- Ensure proper formatting for academic standards
- Maintain the original length and scope

FORMATTING REQUIREMENTS:
- Write in PLAIN TEXT format only
- Do NOT use markdown formatting (no #, **, *, etc.)
- Use proper academic paragraph structure
- Use numbered lists where appropriate (1. 2. 3.)
- Use bullet points where appropriate (- or •)
- Keep headings simple and clear
- Ensure proper spacing between paragraphs

Return only the refined content in plain text format without any explanations or markdown formatting.`;

        try {
            return await geminiService.generateContent(refinementPrompt);
        } catch (error) {
            console.error(`Refinement failed for section ${section.key}:`, error);
            return content; // Return original content if refinement fails
        }
    }

}

export const bcaReportService = new BCAReportService();
