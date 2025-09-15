export class MarkdownParser {
    /**
     * Converts markdown content to plain text with proper formatting
     */
    static parseToPlainText(markdown: string): string {
        if (!markdown) return '';

        let content = markdown;

        content = this.convertHeaders(content);

        content = this.convertBold(content);

        content = this.convertItalic(content);

        content = this.convertLists(content);

        content = this.convertCodeBlocks(content);

        content = this.convertLinks(content);

        // Handle edge cases
        content = this.handleEdgeCases(content);

        content = this.cleanupWhitespace(content);

        return content;
    }

    /**
     * Converts markdown headers to plain text
     */
    private static convertHeaders(content: string): string {
        content = content.replace(/^#{1}\s+(.+)$/gm, '$1');

        content = content.replace(/^#{2}\s+(.+)$/gm, '$1');

        content = content.replace(/^#{3}\s+(.+)$/gm, '$1');

        content = content.replace(/^#{4}\s+(.+)$/gm, '$1');

        content = content.replace(/^#{5}\s+(.+)$/gm, '$1');

        content = content.replace(/^#{6}\s+(.+)$/gm, '$1');

        return content;
    }

    /**
     * Converts markdown bold to plain text
     */
    private static convertBold(content: string): string {
        // Convert **text** to text (non-greedy, avoid matching across newlines)
        content = content.replace(/\*\*([^*\n]+?)\*\*/g, '$1');

        // Convert __text__ to text (non-greedy, avoid matching across newlines)
        content = content.replace(/__([^_\n]+?)__/g, '$1');

        return content;
    }

    /**
     * Converts markdown italic to plain text
     */
    private static convertItalic(content: string): string {
        // Convert *text* to text (non-greedy, word boundary aware)
        content = content.replace(/\*([^*\n]+?)\*/g, '$1');

        // Convert _text_ to text (non-greedy, word boundary aware)
        content = content.replace(/_([^_\n]+?)_/g, '$1');

        return content;
    }

    /**
     * Converts markdown lists to plain text
     */
    private static convertLists(content: string): string {
        // Convert numbered lists
        content = content.replace(/^\d+\.\s+(.+)$/gm, '$1');

        // Convert bullet lists
        content = content.replace(/^[-*+]\s+(.+)$/gm, '$1');

        // Convert nested lists
        content = content.replace(/^\s+[-*+]\s+(.+)$/gm, '    $1');
        content = content.replace(/^\s+\d+\.\s+(.+)$/gm, '    $1');

        return content;
    }

    /**
     * Converts markdown code blocks to plain text
     */
    private static convertCodeBlocks(content: string): string {
        // Convert ```code``` to code (multiline code blocks)
        content = content.replace(/```[\s\S]*?```/g, (match) => {
            return match.replace(/```/g, '').trim();
        });

        // Convert `code` to code (inline code)
        content = content.replace(/`([^`\n]+)`/g, '$1');

        return content;
    }

    /**
     * Converts markdown links to plain text
     */
    private static convertLinks(content: string): string {
        // Convert [text](url) to text
        content = content.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

        return content;
    }

    /**
     * Cleans up extra whitespace
     */
    private static cleanupWhitespace(content: string): string {
        // Remove multiple consecutive empty lines
        content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

        // Remove leading/trailing whitespace from lines
        content = content.split('\n').map(line => line.trim()).join('\n');

        // Remove empty lines at the beginning and end
        content = content.replace(/^\s*\n+/, '').replace(/\n+\s*$/, '');

        return content;
    }

    /**
     * Converts markdown to structured sections for DOCX
     */
    static parseToStructuredSections(markdown: string): { [key: string]: string } {
        const plainText = this.parseToPlainText(markdown);
        const sections: { [key: string]: string } = {};

        const lines = plainText.split('\n');
        let currentSection = '';
        let currentContent: string[] = [];

        for (const line of lines) {
            const trimmedLine = line.trim();

            // Check if this line is a section header
            if (this.isSectionHeader(trimmedLine)) {
                // Save previous section
                if (currentSection && currentContent.length > 0) {
                    sections[currentSection] = currentContent.join('\n').trim();
                }

                // Start new section
                currentSection = this.normalizeSectionKey(trimmedLine);
                currentContent = [];
            } else if (trimmedLine.length > 0) {
                currentContent.push(line);
            }
        }

        // Add the last section
        if (currentContent.length > 0) {
            sections[currentSection] = currentContent.join('\n').trim();
        }

        return sections;
    }

    /**
     * Handles edge cases and fixes common markdown parsing issues
     */
    private static handleEdgeCases(content: string): string {
        // Fix cases where asterisks are used for emphasis but not markdown
        // e.g., "This is *not* italic" should become "This is not italic"
        content = content.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '$1');

        // Fix cases where underscores are used for emphasis but not markdown
        // e.g., "This is _not_ italic" should become "This is not italic"
        content = content.replace(/(?<!_)_([^_\n]+?)_(?!_)/g, '$1');

        // Remove any remaining orphaned markdown characters
        content = content.replace(/\*+/g, '');
        content = content.replace(/_+/g, '');

        return content;
    }

    /**
     * Checks if a line is a section header
     */
    private static isSectionHeader(line: string): boolean {
        // Skip empty lines
        if (!line.trim()) return false;

        // Check for numbered headers (1. INTRODUCTION, 2. METHODOLOGY, etc.)
        if (line.match(/^\d+\.?\s+[A-Z]/)) return true;

        // Check for chapter headers (Chapter 1: Introduction, etc.)
        if (line.match(/^chapter\s+\d+:?\s+[a-z]/i)) return true;

        // Check for all caps headers (INTRODUCTION, METHODOLOGY, etc.)
        if (line.length > 3 && line.length < 100 && line === line.toUpperCase() && line.includes(' ')) return true;

        // Check for specific section patterns (more flexible)
        const sectionPatterns = [
            /^introduction/i,
            /^problem statement/i,
            /^objectives/i,
            /^methodology/i,
            /^gantt chart/i,
            /^expected outcome/i,
            /^references/i,
            /^abstract/i,
            /^acknowledgement/i,
            /^background study/i,
            /^literature review/i,
            /^system analysis/i,
            /^implementation/i,
            /^testing/i,
            /^conclusion/i,
            /^future recommendations/i,
            /^table of contents/i,
            /^list of/i
        ];

        return sectionPatterns.some(pattern => pattern.test(line.trim()));
    }

    /**
     * Normalizes section key for consistent naming
     */
    private static normalizeSectionKey(header: string): string {
        return header
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, '_')
            .replace(/^\d+_/, '') // Remove number prefix
            .replace(/^_+/, ''); // Remove leading underscores
    }
}

export const markdownParser = new MarkdownParser();
