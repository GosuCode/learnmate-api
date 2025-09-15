import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak, Bookmark, InternalHyperlink } from 'docx';
import { BCAReport, BCAReportRequirements } from './bcaReportService';
import { MarkdownParser } from './markdownParser';

export class DocxService {
    private getStyles(requirements: BCAReportRequirements) {
        // Graceful fallback for missing requirements
        const safeRequirements = {
            fontFamily: requirements.fontFamily || 'Times New Roman',
            fontSize: requirements.fontSize || 12,
            headerSize: requirements.headerSize || 16,
            lineHeight: requirements.lineHeight || 1.5,
            marginTop: requirements.marginTop || 25.4,
            marginBottom: requirements.marginBottom || 25.4,
            marginLeft: requirements.marginLeft || 31.75,
            marginRight: requirements.marginRight || 25.4,
        };

        return {
            title: {
                fontSize: safeRequirements.headerSize * 2, // Convert to half-points
                font: safeRequirements.fontFamily,
                bold: true
            },
            heading1: {
                fontSize: 16 * 2, // 16pt
                font: safeRequirements.fontFamily,
                bold: true
            },
            heading2: {
                fontSize: 14 * 2, // 14pt
                font: safeRequirements.fontFamily,
                bold: true
            },
            heading3: {
                fontSize: 12 * 2, // 12pt
                font: safeRequirements.fontFamily,
                bold: true
            },
            paragraph: {
                fontSize: safeRequirements.fontSize * 2,
                font: safeRequirements.fontFamily,
                bold: false
            },
            toc: {
                fontSize: safeRequirements.fontSize * 2,
                font: safeRequirements.fontFamily,
                bold: false
            }
        };
    }

    private createTextRun(text: string, requirements: BCAReportRequirements, isBold: boolean = false, isItalic: boolean = false, fontSize?: number): TextRun {
        return new TextRun({
            text,
            bold: isBold,
            italics: isItalic,
            size: (fontSize || requirements.fontSize) * 2, // DOCX uses half-points
            font: requirements.fontFamily,
        });
    }

    private createParagraph(text: string, requirements: BCAReportRequirements, headingLevel?: any, alignment?: any, fontSize?: number): Paragraph {
        const runs = text.split('\n').map(line => this.createTextRun(line, requirements, false, false, fontSize));

        return new Paragraph({
            children: runs,
            heading: headingLevel,
            alignment: alignment || AlignmentType.JUSTIFIED, // All paragraphs must be justified
            spacing: {
                line: requirements.lineHeight * 240, // Convert to twips (1/20th of a point)
            },
        });
    }

    private createTitlePage(title: string, requirements: BCAReportRequirements): Paragraph[] {
        return [
            new Paragraph({
                children: [this.createTextRun(title, requirements, true)],
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
                spacing: {
                    after: 400,
                },
            }),
            new Paragraph({
                children: [this.createTextRun('', requirements)],
                spacing: {
                    after: 200,
                },
            }),
            new Paragraph({
                children: [this.createTextRun('Bachelor of Computer Applications', requirements, true)],
                alignment: AlignmentType.CENTER,
                spacing: {
                    after: 200,
                },
            }),
            new Paragraph({
                children: [this.createTextRun('Report', requirements, true)],
                alignment: AlignmentType.CENTER,
                spacing: {
                    after: 400,
                },
            }),
            new Paragraph({
                children: [this.createTextRun(`Generated on: ${new Date().toLocaleDateString()}`, requirements)],
                alignment: AlignmentType.CENTER,
                spacing: {
                    after: 600,
                },
            }),
        ];
    }

    private createTableOfContents(reportType: string, requirements: BCAReportRequirements): Paragraph[] {
        const tocItems = this.getTableOfContentsItems(reportType);
        const styles = this.getStyles(requirements);

        const paragraphs = [
            new Paragraph({
                children: [this.createTextRun('TABLE OF CONTENTS', requirements, true, false, 16)],
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
            })
        ];

        tocItems.forEach((item, index) => {
            const bookmarkId = `section_${index + 1}`;
            const hyperlink = new InternalHyperlink({
                children: [
                    new TextRun({
                        text: item,
                        size: styles.toc.fontSize,
                        font: styles.toc.font,
                        bold: styles.toc.bold,
                    })
                ],
                anchor: bookmarkId,
            });

            paragraphs.push(
                new Paragraph({
                    children: [hyperlink],
                    spacing: { after: 100 },
                })
            );
        });

        return paragraphs;
    }

    private getTableOfContentsItems(reportType: string): string[] {
        if (reportType === 'project_proposal') {
            return [
                '1. Introduction',
                '2. Problem Statement',
                '3. Objectives',
                '4. Methodology',
                '   4.1 Requirement Identification',
                '   4.2 Feasibility Study',
                '   4.3 High Level Design of System',
                '5. Gantt Chart',
                '6. Expected Outcome',
                '7. References'
            ];
        } else if (reportType === 'main_report') {
            return [
                'PRELIMINARY PAGES',
                'Cover & Title Page',
                'Certificate Page',
                'Abstract Page',
                'Acknowledgement',
                'Table of Contents',
                'List of Abbreviations',
                'List of Figures',
                'List of Tables',
                '',
                'MAIN REPORT',
                'Chapter 1: Introduction',
                '   1.1 Introduction',
                '   1.2 Problem Statement',
                '   1.3 Objectives',
                '   1.4 Scope and Limitation',
                '   1.5 Report Organization',
                'Chapter 2: Background Study and Literature Review',
                '   2.1 Background Study',
                '   2.2 Literature Review',
                'Chapter 3: System Analysis and Design',
                '   3.1 System Analysis',
                '   3.2 System Design',
                'Chapter 4: Implementation and Testing',
                '   4.1 Implementation',
                '   4.2 Testing',
                'Chapter 5: Conclusion and Future Recommendations',
                '   5.1 Lesson Learnt / Outcome',
                '   5.2 Conclusion',
                '   5.3 Future Recommendations',
                'Appendices',
                'References',
                'Bibliography'
            ];
        } else {
            return [
                '1. Introduction',
                '2. Literature Review',
                '3. System Analysis',
                '4. Implementation',
                '5. Testing and Results',
                '6. Conclusion',
                '7. References'
            ];
        }
    }

    async parseContentToSections(content: string, reportType: string): Promise<{ [key: string]: string }> {
        // First, convert markdown to plain text
        const plainTextContent = MarkdownParser.parseToPlainText(content);

        // Split content into manageable chunks before normalization
        const chunks = this.splitContentIntoChunks(plainTextContent, 2500); // ~2-3k tokens per chunk
        console.log(`Split content into ${chunks.length} chunks for processing`);

        // Normalize section headings using AI for each chunk
        const normalizedContent = await this.normalizeSectionHeadingsChunked(chunks);

        // Use the markdown parser's structured section parsing
        const sections = MarkdownParser.parseToStructuredSections(normalizedContent);

        // If no sections were found, fall back to the original parsing method
        if (Object.keys(sections).length === 0) {
            console.log('No sections found with structured parsing, using fallback');
            return this.fallbackParseContentToSections(normalizedContent, reportType);
        }

        console.log(`Successfully parsed ${Object.keys(sections).length} sections`);
        return sections;
    }

    private fallbackParseContentToSections(content: string, reportType: string): { [key: string]: string } {
        const sections: { [key: string]: string } = {};
        const lines = content.split('\n');
        let currentSection = 'introduction';
        let currentContent: string[] = [];

        // Define section patterns based on report type
        let sectionPatterns: RegExp[] = [];

        if (reportType === 'project_proposal') {
            sectionPatterns = [
                /^(introduction|problem statement|objectives|methodology|gantt chart|expected outcome|references)/i
            ];
        } else if (reportType === 'main_report') {
            sectionPatterns = [
                /^(abstract|acknowledgement|table of contents|list of abbreviations|list of figures|list of tables)/i,
                /^(chapter \d+|introduction|background study|literature review|system analysis|system design|implementation|testing|conclusion|future recommendations|appendices|references|bibliography)/i,
                /^(\d+\.\d+|\d+\.\d+\.\d+)/ // Sub-sections like 1.1, 1.2, etc.
            ];
        } else {
            sectionPatterns = [
                /^(introduction|literature review|system analysis|implementation|testing|results|conclusion|references)/i
            ];
        }

        for (const line of lines) {
            const trimmedLine = line.trim();
            let isNewSection = false;

            // Check if line matches any section pattern
            for (const pattern of sectionPatterns) {
                if (pattern.test(trimmedLine)) {
                    isNewSection = true;
                    break;
                }
            }

            if (isNewSection) {
                if (currentContent.length > 0) {
                    sections[currentSection] = currentContent.join('\n').trim();
                }
                currentSection = trimmedLine.toLowerCase()
                    .replace(/[^\w\s]/g, '') // Remove special characters
                    .replace(/\s+/g, '_')
                    .replace(/^chapter_\d+_/, '') // Remove chapter prefix
                    .replace(/^\d+_/, '') // Remove number prefix
                    .replace(/^_+/, ''); // Remove leading underscores
                currentContent = [];
            } else if (trimmedLine.length > 0) {
                currentContent.push(line);
            }
        }

        // Add the last section
        if (currentContent.length > 0) {
            sections[currentSection] = currentContent.join('\n').trim();
        }

        // If still no sections found, create a single section with all content
        if (Object.keys(sections).length === 0) {
            console.log('No sections found in fallback parsing, creating single section');
            sections['content'] = content;
        }

        return sections;
    }

    private splitContentIntoChunks(content: string, maxTokens: number): string[] {
        // Split by double newlines first to respect section boundaries
        const sections = content.split(/\n\s*\n/);
        const chunks: string[] = [];
        let currentChunk = '';
        let currentTokenCount = 0;

        for (const section of sections) {
            const sectionTokens = this.estimateTokens(section);

            // If adding this section would exceed the limit, start a new chunk
            if (currentTokenCount + sectionTokens > maxTokens && currentChunk.length > 0) {
                chunks.push(currentChunk.trim());
                currentChunk = section;
                currentTokenCount = sectionTokens;
            } else {
                currentChunk += (currentChunk ? '\n\n' : '') + section;
                currentTokenCount += sectionTokens;
            }
        }

        if (currentChunk.trim().length > 0) {
            chunks.push(currentChunk.trim());
        }

        // If we still have chunks that are too large, split them further by sentences
        const finalChunks: string[] = [];
        for (const chunk of chunks) {
            if (this.estimateTokens(chunk) <= maxTokens) {
                finalChunks.push(chunk);
            } else {
                // Split by sentences for very large chunks
                const sentences = chunk.split(/[.!?]+\s+/);
                let currentSentenceChunk = '';
                let currentSentenceTokenCount = 0;

                for (const sentence of sentences) {
                    const sentenceTokens = this.estimateTokens(sentence);

                    if (currentSentenceTokenCount + sentenceTokens > maxTokens && currentSentenceChunk.length > 0) {
                        finalChunks.push(currentSentenceChunk.trim());
                        currentSentenceChunk = sentence;
                        currentSentenceTokenCount = sentenceTokens;
                    } else {
                        currentSentenceChunk += (currentSentenceChunk ? '. ' : '') + sentence;
                        currentSentenceTokenCount += sentenceTokens;
                    }
                }

                if (currentSentenceChunk.trim().length > 0) {
                    finalChunks.push(currentSentenceChunk.trim());
                }
            }
        }

        return finalChunks.filter(chunk => chunk.trim().length > 0);
    }

    private estimateTokens(text: string): number {
        // More accurate token estimation: ~4 characters per token
        return Math.ceil(text.length / 4);
    }

    private async normalizeSectionHeadingsChunked(chunks: string[]): Promise<string> {
        console.log(`Processing ${chunks.length} chunks for section heading normalization`);

        // For small number of chunks, process sequentially to avoid rate limits
        if (chunks.length <= 3) {
            return await this.normalizeSectionHeadingsSequential(chunks);
        }

        // For larger numbers, process in parallel batches
        return await this.normalizeSectionHeadingsParallel(chunks);
    }

    private async normalizeSectionHeadingsSequential(chunks: string[]): Promise<string> {
        const normalizedChunks: string[] = [];

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            console.log(`Processing chunk ${i + 1}/${chunks.length} (${chunk.length} characters)`);

            try {
                const normalizedChunk = await this.normalizeSectionHeadings(chunk);
                normalizedChunks.push(normalizedChunk);

                // Add a small delay to avoid rate limiting
                if (i < chunks.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            } catch (error) {
                console.error(`Failed to normalize chunk ${i + 1}:`, error);
                normalizedChunks.push(chunk); // Use original chunk if normalization fails
            }
        }

        return normalizedChunks.join('\n\n');
    }

    private async normalizeSectionHeadingsParallel(chunks: string[]): Promise<string> {
        const batchSize = 3; // Process 3 chunks at a time
        const normalizedChunks: string[] = [];

        for (let i = 0; i < chunks.length; i += batchSize) {
            const batch = chunks.slice(i, i + batchSize);
            console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)} (${batch.length} chunks)`);

            const batchPromises = batch.map(async (chunk, index) => {
                const globalIndex = i + index;
                console.log(`Processing chunk ${globalIndex + 1}/${chunks.length} (${chunk.length} characters)`);

                try {
                    return await this.normalizeSectionHeadings(chunk);
                } catch (error) {
                    console.error(`Failed to normalize chunk ${globalIndex + 1}:`, error);
                    return chunk; // Use original chunk if normalization fails
                }
            });

            const batchResults = await Promise.all(batchPromises);
            normalizedChunks.push(...batchResults);

            // Add delay between batches to avoid rate limiting
            if (i + batchSize < chunks.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        return normalizedChunks.join('\n\n');
    }

    private async normalizeSectionHeadings(content: string): Promise<string> {
        const prompt = `Normalize the section headings in this BCA report content to follow a consistent format. 

REQUIREMENTS:
- Use numbered format: "1. INTRODUCTION", "2. METHODOLOGY", etc.
- Make headings ALL CAPS
- Ensure consistent spacing and punctuation
- Keep the content exactly the same, only modify the section headings
- If a heading is unclear, make it more descriptive

CONTENT:
${content}

Return the content with normalized section headings:`;

        try {
            const { geminiService } = await import('./geminiService.js');
            return await geminiService.generateContent(prompt);
        } catch (error) {
            console.error('Section heading normalization failed:', error);
            return content; // Return original content if normalization fails
        }
    }

    private renderSections(children: any[], sections: { [key: string]: string }, requirements: BCAReportRequirements, reportType: string): void {
        console.log(`Rendering sections for ${reportType}:`, Object.keys(sections));

        if (reportType === 'project_proposal') {
            this.renderProjectProposalSections(children, sections, requirements);
        } else if (reportType === 'main_report') {
            this.renderMainReportSections(children, sections, requirements);
        } else {
            this.renderMinorProjectSections(children, sections, requirements);
        }

        // Add any remaining sections that weren't in the expected order
        this.renderRemainingSections(children, sections, requirements, reportType);
    }

    private renderProjectProposalSections(children: any[], sections: { [key: string]: string }, requirements: BCAReportRequirements): void {
        const sectionOrder = ['introduction', 'problem_statement', 'objectives', 'methodology', 'gantt_chart', 'expected_outcome', 'references'];

        sectionOrder.forEach((sectionKey, index) => {
            if (sections[sectionKey]) {
                console.log(`Rendering project proposal section: ${sectionKey}`);
                const sectionTitle = this.getSectionTitle(sectionKey, 'project_proposal');
                const bookmarkId = `section_${index + 1}`;
                children.push(this.createSectionHeader(sectionTitle, requirements, 16, bookmarkId));
                children.push(this.createParagraph(sections[sectionKey], requirements));
                if (sectionKey !== 'references') {
                    children.push(new PageBreak());
                }
            } else {
                console.log(`Missing project proposal section: ${sectionKey}`);
            }
        });
    }

    private renderMainReportSections(children: any[], sections: { [key: string]: string }, requirements: BCAReportRequirements): void {
        // Preliminary pages
        const preliminarySections = ['abstract', 'acknowledgement', 'list_of_abbreviations', 'list_of_figures', 'list_of_tables'];
        preliminarySections.forEach((sectionKey, index) => {
            if (sections[sectionKey]) {
                const sectionTitle = this.getSectionTitle(sectionKey, 'main_report');
                const bookmarkId = `section_${index + 1}`;
                children.push(this.createSectionHeader(sectionTitle, requirements, 16, bookmarkId));
                children.push(this.createParagraph(sections[sectionKey], requirements));
                children.push(new PageBreak());
            }
        });

        // Main chapters - match the actual section keys from config
        const chapterOrder = ['introduction', 'background_study', 'system_analysis', 'implementation', 'conclusion', 'references'];

        chapterOrder.forEach((sectionKey, index) => {
            if (sections[sectionKey]) {
                console.log(`Rendering main report section: ${sectionKey}`);
                const sectionTitle = this.getSectionTitle(sectionKey, 'main_report');
                const bookmarkId = `section_${preliminarySections.length + index + 1}`;
                children.push(this.createSectionHeader(sectionTitle, requirements, 16, bookmarkId));
                children.push(this.createParagraph(sections[sectionKey], requirements));
                if (sectionKey !== 'bibliography') {
                    children.push(new PageBreak());
                }
            } else {
                console.log(`Missing main report section: ${sectionKey}`);
            }
        });
    }

    private renderMinorProjectSections(children: any[], sections: { [key: string]: string }, requirements: BCAReportRequirements): void {
        const sectionOrder = ['introduction', 'literature_review', 'system_analysis', 'implementation', 'testing', 'conclusion', 'references'];

        sectionOrder.forEach((sectionKey, index) => {
            if (sections[sectionKey]) {
                console.log(`Rendering minor project section: ${sectionKey}`);
                const sectionTitle = this.getSectionTitle(sectionKey, 'minor_project');
                const bookmarkId = `section_${index + 1}`;
                children.push(this.createSectionHeader(sectionTitle, requirements, 16, bookmarkId));
                children.push(this.createParagraph(sections[sectionKey], requirements));
                if (sectionKey !== 'references') {
                    children.push(new PageBreak());
                }
            } else {
                console.log(`Missing minor project section: ${sectionKey}`);
            }
        });
    }

    private renderRemainingSections(children: any[], sections: { [key: string]: string }, requirements: BCAReportRequirements, reportType: string): void {
        // Get the sections that were already rendered
        const renderedSections = new Set<string>();

        if (reportType === 'project_proposal') {
            ['introduction', 'problem_statement', 'objectives', 'methodology', 'gantt_chart', 'expected_outcome', 'references'].forEach(key => renderedSections.add(key));
        } else if (reportType === 'main_report') {
            ['abstract', 'acknowledgement', 'list_of_abbreviations', 'list_of_figures', 'list_of_tables', 'introduction', 'background_study', 'system_analysis', 'implementation', 'conclusion', 'references'].forEach(key => renderedSections.add(key));
        } else {
            ['introduction', 'literature_review', 'system_analysis', 'implementation', 'testing', 'conclusion', 'references'].forEach(key => renderedSections.add(key));
        }

        // Add any remaining sections
        Object.keys(sections).forEach(sectionKey => {
            if (!renderedSections.has(sectionKey)) {
                console.log(`Adding remaining section: ${sectionKey}`);
                const sectionTitle = this.getSectionTitle(sectionKey, reportType) || sectionKey.toUpperCase();
                children.push(this.createSectionHeader(sectionTitle, requirements, 16));
                children.push(this.createParagraph(sections[sectionKey], requirements));
                children.push(new PageBreak());
            }
        });
    }

    private createSectionHeader(title: string, requirements: BCAReportRequirements, fontSize: number, bookmarkId?: string): Paragraph {
        const children = bookmarkId
            ? [new Bookmark({ children: [this.createTextRun(title, requirements, true, false, fontSize)], id: bookmarkId })]
            : [this.createTextRun(title, requirements, true, false, fontSize)];

        return new Paragraph({
            children,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
        });
    }

    private getSectionTitle(sectionKey: string, reportType: string): string {
        const titles: { [key: string]: { [key: string]: string } } = {
            project_proposal: {
                introduction: '1. INTRODUCTION',
                problem_statement: '2. PROBLEM STATEMENT',
                objectives: '3. OBJECTIVES',
                methodology: '4. METHODOLOGY',
                gantt_chart: '5. GANTT CHART',
                expected_outcome: '6. EXPECTED OUTCOME',
                references: '7. REFERENCES'
            },
            main_report: {
                abstract: 'ABSTRACT',
                acknowledgement: 'ACKNOWLEDGEMENT',
                list_of_abbreviations: 'LIST OF ABBREVIATIONS',
                list_of_figures: 'LIST OF FIGURES',
                list_of_tables: 'LIST OF TABLES',
                introduction: 'CHAPTER 1: INTRODUCTION',
                background_study: 'CHAPTER 2: BACKGROUND STUDY AND LITERATURE REVIEW',
                literature_review: 'CHAPTER 2: BACKGROUND STUDY AND LITERATURE REVIEW',
                system_analysis: 'CHAPTER 3: SYSTEM ANALYSIS AND DESIGN',
                system_design: 'CHAPTER 3: SYSTEM ANALYSIS AND DESIGN',
                implementation: 'CHAPTER 4: IMPLEMENTATION AND TESTING',
                testing: 'CHAPTER 4: IMPLEMENTATION AND TESTING',
                conclusion: 'CHAPTER 5: CONCLUSION AND FUTURE RECOMMENDATIONS',
                future_recommendations: 'CHAPTER 5: CONCLUSION AND FUTURE RECOMMENDATIONS',
                appendices: 'APPENDICES',
                references: 'REFERENCES',
                bibliography: 'BIBLIOGRAPHY'
            },
            minor_project: {
                introduction: '1. INTRODUCTION',
                literature_review: '2. LITERATURE REVIEW',
                system_analysis: '3. SYSTEM ANALYSIS',
                implementation: '4. IMPLEMENTATION',
                testing: '5. TESTING AND RESULTS',
                results: '5. TESTING AND RESULTS',
                conclusion: '6. CONCLUSION',
                references: '7. REFERENCES'
            }
        };

        return titles[reportType]?.[sectionKey] || sectionKey.toUpperCase();
    }

    async generateDocx(report: BCAReport): Promise<Buffer> {
        const requirements = report.requirements;
        const sections = await this.parseContentToSections(report.content, report.reportType);

        // Debug logging
        console.log('Report content length:', report.content.length);
        console.log('Parsed sections:', Object.keys(sections));
        console.log('Sections content:', sections);

        // Use memory-efficient streaming for large reports
        if (Object.keys(sections).length > 10 || report.content.length > 50000) {
            return await this.generateDocxStreaming(report, sections, requirements);
        }

        const children: any[] = [];

        // Title Page
        children.push(...this.createTitlePage(report.title, requirements));
        children.push(new PageBreak());

        // Table of Contents
        children.push(...this.createTableOfContents(report.reportType, requirements));
        children.push(new PageBreak());

        // Render sections based on report type
        this.renderSections(children, sections, requirements, report.reportType);

        // If no sections were parsed, use the full content
        if (Object.keys(sections).length === 0) {
            console.log('No sections parsed, using full content as fallback');
            children.push(this.createSectionHeader('Report Content', requirements, 16));
            children.push(this.createParagraph(report.content, requirements));
        } else {
            console.log(`Rendered ${Object.keys(sections).length} sections`);
        }

        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: requirements.marginTop * 20, // Convert mm to twips
                            right: requirements.marginRight * 20,
                            bottom: requirements.marginBottom * 20,
                            left: requirements.marginLeft * 20,
                        },
                    },
                },
                children,
            }],
        });

        return await Packer.toBuffer(doc);
    }

    private async generateDocxStreaming(report: BCAReport, sections: { [key: string]: string }, requirements: BCAReportRequirements): Promise<Buffer> {
        const children: any[] = [];

        // Title Page
        children.push(...this.createTitlePage(report.title, requirements));
        children.push(new PageBreak());

        // Table of Contents
        children.push(...this.createTableOfContents(report.reportType, requirements));
        children.push(new PageBreak());

        // Process sections in batches to manage memory
        const sectionKeys = Object.keys(sections);
        const batchSize = 5;

        for (let i = 0; i < sectionKeys.length; i += batchSize) {
            const batch = sectionKeys.slice(i, i + batchSize);
            const batchSections: { [key: string]: string } = {};

            batch.forEach(key => {
                batchSections[key] = sections[key];
            });

            this.renderSections(children, batchSections, requirements, report.reportType);
        }

        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: requirements.marginTop * 20,
                            right: requirements.marginRight * 20,
                            bottom: requirements.marginBottom * 20,
                            left: requirements.marginLeft * 20,
                        },
                    },
                },
                children,
            }],
        });

        return await Packer.toBuffer(doc);
    }

    async generatePartialDocx(report: BCAReport): Promise<Buffer> {
        const requirements = report.requirements;
        const sections = await this.parseContentToSections(report.content, report.reportType);

        const children: any[] = [];

        // Title Page
        children.push(...this.createTitlePage(report.title, requirements));
        children.push(new PageBreak());

        // Table of Contents
        children.push(...this.createTableOfContents(report.reportType, requirements));
        children.push(new PageBreak());

        // Add a note about partial content
        children.push(new Paragraph({
            children: [this.createTextRun('NOTE: This is a partial document. Some sections may still be generating.', requirements, true, false, 12)],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
        }));

        // Render only completed sections
        this.renderSections(children, sections, requirements, report.reportType);

        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: requirements.marginTop * 20,
                            right: requirements.marginRight * 20,
                            bottom: requirements.marginBottom * 20,
                            left: requirements.marginLeft * 20,
                        },
                    },
                },
                children,
            }],
        });

        return await Packer.toBuffer(doc);
    }
}

export const docxService = new DocxService();
