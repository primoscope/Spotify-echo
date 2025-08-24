#!/usr/bin/env node

/**
 * Roadmap Index Generator
 * 
 * Parses roadmap markdown documents to generate a structured JSON index
 * suitable for dashboards, automation, and reporting.
 * 
 * Supports:
 * - Markdown tables with ID, Title, Category, Priority, Status columns
 * - Bullet lists with ID: patterns and metadata in parentheses
 * - Phase detection from H2/H3 headings
 * - Comprehensive metadata extraction
 * 
 * Usage:
 *   node scripts/roadmap/build_index.js [options]
 *   
 * Options:
 *   --pretty          Pretty print JSON output
 *   --out <path>      Output file path (default: generated/roadmap_index.json)
 *   --allow-empty     Don't exit with error if no items found
 * 
 * @author EchoTune AI Team
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

class RoadmapIndexBuilder {
    constructor() {
        this.items = [];
        this.currentPhase = null;
        this.stats = {
            total: 0,
            by_phase: {},
            by_status: {},
            by_priority: {}
        };
        this.options = {
            pretty: false,
            output: 'generated/roadmap_index.json',
            allowEmpty: false
        };
    }

    /**
     * Parse command line arguments
     */
    parseArgs() {
        const args = process.argv.slice(2);
        
        for (let i = 0; i < args.length; i++) {
            switch (args[i]) {
                case '--pretty':
                    this.options.pretty = true;
                    break;
                case '--out':
                    if (i + 1 < args.length) {
                        this.options.output = args[++i];
                    }
                    break;
                case '--allow-empty':
                    this.options.allowEmpty = true;
                    break;
                case '--help':
                case '-h':
                    this.showHelp();
                    process.exit(0);
                default:
                    if (args[i].startsWith('--')) {
                        console.error(`Unknown option: ${args[i]}`);
                        process.exit(1);
                    }
            }
        }
    }

    /**
     * Show help information
     */
    showHelp() {
        console.log(`
Roadmap Index Generator

Usage: node scripts/roadmap/build_index.js [options]

Options:
  --pretty          Pretty print JSON output
  --out <path>      Output file path (default: generated/roadmap_index.json)
  --allow-empty     Don't exit with error if no items found
  --help, -h        Show this help message

Examples:
  node scripts/roadmap/build_index.js --pretty
  node scripts/roadmap/build_index.js --out custom/output.json
  node scripts/roadmap/build_index.js --pretty --allow-empty
        `);
    }

    /**
     * Find and validate roadmap files
     */
    findRoadmapFiles() {
        const basePath = process.cwd();
        const roadmapDir = path.join(basePath, 'docs/roadmap');
        
        const files = [];
        
        // Primary roadmap file
        const primaryRoadmap = path.join(roadmapDir, 'ROADMAP.md');
        if (fs.existsSync(primaryRoadmap)) {
            files.push(primaryRoadmap);
        }
        
        // Additional roadmap files
        const patterns = [
            '*_initiatives.md',
            'frontend_ui.md',
            'testing_quality.md'
        ];
        
        try {
            const dirFiles = fs.readdirSync(roadmapDir);
            
            patterns.forEach(pattern => {
                const regex = new RegExp(pattern.replace('*', '.*'));
                dirFiles.forEach(file => {
                    if (regex.test(file)) {
                        files.push(path.join(roadmapDir, file));
                    }
                });
            });
        } catch (error) {
            // Directory doesn't exist or can't be read
            console.warn(`Warning: Could not read roadmap directory: ${roadmapDir}`);
        }
        
        return files;
    }

    /**
     * Parse a single roadmap file
     */
    parseFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            const relativeFilePath = path.relative(process.cwd(), filePath);
            
            console.log(`Parsing ${relativeFilePath}...`);
            
            let inTable = false;
            let tableHeaders = [];
            let tableHeaderIndices = {};
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                const lineNumber = i + 1;
                
                // Detect phase headings
                this.detectPhase(line);
                
                // Handle markdown tables
                if (line.includes('|') && (line.toLowerCase().includes('id') || line.toLowerCase().includes('title'))) {
                    const headers = line.split('|').map(h => h.trim()).filter(h => h);
                    if (this.hasRequiredTableColumns(headers)) {
                        inTable = true;
                        tableHeaders = headers;
                        tableHeaderIndices = this.mapTableHeaders(headers);
                        continue; // Skip the header row
                    }
                }
                
                // Table separator line (skip)
                if (inTable && line.match(/^\|[\s\-\|]*\|$/)) {
                    continue;
                }
                
                // Table data row
                if (inTable && line.includes('|')) {
                    if (line.trim() === '' || !line.includes('|')) {
                        inTable = false;
                        continue;
                    }
                    
                    const item = this.parseTableRow(line, tableHeaderIndices, relativeFilePath, lineNumber);
                    if (item) {
                        this.items.push(item);
                    }
                    continue;
                }
                
                // End of table
                if (inTable && line.trim() === '') {
                    inTable = false;
                    continue;
                }
                
                // Handle bullet list items
                if (this.isBulletItem(line)) {
                    const item = this.parseBulletItem(line, relativeFilePath, lineNumber);
                    if (item) {
                        this.items.push(item);
                    }
                }
            }
            
        } catch (error) {
            console.error(`Error parsing file ${filePath}:`, error.message);
        }
    }

    /**
     * Detect phase from heading lines
     */
    detectPhase(line) {
        const phaseMatch = line.match(/^#+\s*(.*)(?:phase|Phase)\s*(\d+|stretch|future)/i);
        if (phaseMatch) {
            const phaseNum = phaseMatch[2].toLowerCase();
            if (phaseNum === 'stretch') {
                this.currentPhase = 'Stretch';
            } else if (phaseNum === 'future') {
                this.currentPhase = 'Future';
            } else {
                this.currentPhase = `Phase ${phaseNum}`;
            }
        }
        
        // Also check for section headers that indicate phases
        if (line.match(/^#+.*Stretch.*Enhancement/i)) {
            this.currentPhase = 'Stretch';
        }
    }

    /**
     * Check if table headers contain required columns
     */
    hasRequiredTableColumns(headers) {
        const headerText = headers.join(' ').toLowerCase();
        return headerText.includes('id') && headerText.includes('title') && 
               (headerText.includes('status') || headerText.includes('priority'));
    }

    /**
     * Map table headers to indices
     */
    mapTableHeaders(headers) {
        const indices = {};
        headers.forEach((header, index) => {
            const key = header.toLowerCase().trim();
            if (key.includes('id')) indices.id = index;
            else if (key.includes('title')) indices.title = index;
            else if (key.includes('category')) indices.category = index;
            else if (key.includes('priority')) indices.priority = index;
            else if (key.includes('status')) indices.status = index;
            else indices[key.replace(/\s+/g, '_')] = index;
        });
        return indices;
    }

    /**
     * Parse a table row into an item
     */
    parseTableRow(line, indices, sourceFile, lineNumber) {
        const cells = line.split('|').map(c => c.trim()).filter(c => c !== '');
        
        if (cells.length === 0) return null;
        
        const item = {
            id: this.extractValue(cells, indices.id) || `ITEM-${this.items.length + 1}`,
            title: this.extractValue(cells, indices.title) || 'Untitled',
            category: this.normalizeCategory(this.extractValue(cells, indices.category)),
            priority: this.normalizePriority(this.extractValue(cells, indices.priority)),
            status: this.normalizeStatus(this.extractValue(cells, indices.status)),
            phase: this.currentPhase,
            source_file: sourceFile,
            line: lineNumber,
            raw: line.trim(),
            extras: {}
        };

        // Add extra columns
        Object.keys(indices).forEach(key => {
            if (!['id', 'title', 'category', 'priority', 'status'].includes(key)) {
                const value = this.extractValue(cells, indices[key]);
                if (value) {
                    item.extras[key] = value;
                }
            }
        });

        return item;
    }

    /**
     * Extract value from table cell
     */
    extractValue(cells, index) {
        return (index !== undefined && cells[index]) ? cells[index].trim() : null;
    }

    /**
     * Check if line is a bullet item with ID
     */
    isBulletItem(line) {
        // Match bullet items that start with:
        // - [x] ID-001: Title or - [ ] ID-001: Title or - ID-001: Title
        // Also match: - [x] **ID-001**: Title (bold IDs)
        const patterns = [
            /^\s*-\s*\[[\sx]\]\s*\*?\*?([A-Z][A-Z\-\d]+)\*?\*?[:\-]\s*(.+)$/i,  // Checkbox format
            /^\s*-\s*\*?\*?([A-Z][A-Z\-\d]+)\*?\*?[:\-]\s*(.+)$/i,              // Plain format
            /^\s*-\s*\[[\sx]\]\s*([A-Z]+[-\w]*)[:\-]\s*(.+)$/i,                 // Simple ID format
        ];
        
        return patterns.some(pattern => pattern.test(line));
    }

    /**
     * Parse bullet list item
     */
    parseBulletItem(line, sourceFile, lineNumber) {
        // Match patterns like:
        // - [x] ID-001: Title (Priority: High, Status: Done)
        // - [ ] TAG-002 - Description (Category: Feature, Status: Planned)
        // - **ID-003**: Some description (metadata...)
        
        const patterns = [
            /^\s*-\s*\[[\sx]\]\s*\*?\*?([A-Z][A-Z\-\d]+)\*?\*?[:\-]\s*(.+)$/i,  // Checkbox format
            /^\s*-\s*\*?\*?([A-Z][A-Z\-\d]+)\*?\*?[:\-]\s*(.+)$/i,              // Plain format
            /^\s*-\s*\[[\sx]\]\s*([A-Z]+[-\w]*)[:\-]\s*(.+)$/i,                 // Simple ID format
        ];
        
        let bulletMatch = null;
        for (const pattern of patterns) {
            bulletMatch = line.match(pattern);
            if (bulletMatch) break;
        }
        
        if (!bulletMatch) return null;
        
        const id = bulletMatch[1];
        const content = bulletMatch[2];
        
        // Extract title and metadata
        const metadataMatch = content.match(/^([^(]+)\s*(?:\(([^)]+)\))?$/);
        if (!metadataMatch) return null;
        
        const title = metadataMatch[1].trim();
        const metadataStr = metadataMatch[2] || '';
        
        const item = {
            id: id,
            title: title,
            category: null,
            priority: null,
            status: this.detectBulletStatus(line),
            phase: this.currentPhase,
            source_file: sourceFile,
            line: lineNumber,
            raw: line.trim(),
            extras: {}
        };

        // Parse metadata
        if (metadataStr) {
            const metadata = this.parseMetadata(metadataStr);
            item.category = this.normalizeCategory(metadata.category);
            item.priority = this.normalizePriority(metadata.priority);
            if (metadata.status) {
                item.status = this.normalizeStatus(metadata.status);
            }
            
            // Add other metadata to extras
            Object.keys(metadata).forEach(key => {
                if (!['category', 'priority', 'status'].includes(key.toLowerCase())) {
                    item.extras[key] = metadata[key];
                }
            });
        }

        return item;
    }

    /**
     * Detect status from bullet checkbox
     */
    detectBulletStatus(line) {
        if (line.includes('[x]')) return 'Done';
        if (line.includes('[ ]')) return 'Planned';
        return 'Planned';
    }

    /**
     * Parse metadata from parentheses content
     */
    parseMetadata(metadataStr) {
        const metadata = {};
        
        // Split by comma and parse key-value pairs
        const pairs = metadataStr.split(',');
        pairs.forEach(pair => {
            const colonMatch = pair.match(/([^:]+):\s*(.+)/);
            const equalsMatch = pair.match(/([^=]+)=\s*(.+)/);
            
            if (colonMatch) {
                const key = colonMatch[1].trim().toLowerCase().replace(/\s+/g, '_');
                metadata[key] = colonMatch[2].trim();
            } else if (equalsMatch) {
                const key = equalsMatch[1].trim().toLowerCase().replace(/\s+/g, '_');
                metadata[key] = equalsMatch[2].trim();
            }
        });
        
        return metadata;
    }

    /**
     * Normalize category values
     */
    normalizeCategory(category) {
        if (!category) return null;
        
        const normalized = category.trim();
        return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
    }

    /**
     * Normalize priority values
     */
    normalizePriority(priority) {
        if (!priority) return null;
        
        const p = priority.toLowerCase().trim();
        if (p.includes('high')) return 'High';
        if (p.includes('medium') || p.includes('med')) return 'Medium';
        if (p.includes('low')) return 'Low';
        
        return priority.trim();
    }

    /**
     * Normalize status values
     */
    normalizeStatus(status) {
        if (!status) return null;
        
        const s = status.toLowerCase().trim();
        if (s.includes('plan')) return 'Planned';
        if (s.includes('progress') || s.includes('doing')) return 'In Progress';
        if (s.includes('block')) return 'Blocked';
        if (s.includes('done') || s.includes('complete')) return 'Done';
        if (s.includes('future')) return 'Future';
        
        return status.trim();
    }

    /**
     * Calculate statistics
     */
    calculateStats() {
        this.stats.total = this.items.length;
        
        // Count by phase
        this.items.forEach(item => {
            const phase = item.phase || 'Unknown';
            this.stats.by_phase[phase] = (this.stats.by_phase[phase] || 0) + 1;
        });
        
        // Count by status
        this.items.forEach(item => {
            const status = item.status || 'Unknown';
            this.stats.by_status[status] = (this.stats.by_status[status] || 0) + 1;
        });
        
        // Count by priority
        this.items.forEach(item => {
            const priority = item.priority || 'Unknown';
            this.stats.by_priority[priority] = (this.stats.by_priority[priority] || 0) + 1;
        });
    }

    /**
     * Generate output JSON
     */
    generateOutput() {
        this.calculateStats();
        
        const output = {
            generated_at_iso: new Date().toISOString(),
            version: 1,
            items: this.items,
            stats: this.stats
        };
        
        return this.options.pretty ? 
            JSON.stringify(output, null, 2) : 
            JSON.stringify(output);
    }

    /**
     * Write output to file
     */
    writeOutput(jsonContent) {
        const outputPath = this.options.output;
        const outputDir = path.dirname(outputPath);
        
        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        fs.writeFileSync(outputPath, jsonContent, 'utf8');
        console.log(`📊 Roadmap index written to: ${outputPath}`);
    }

    /**
     * Run the index generation
     */
    run() {
        try {
            this.parseArgs();
            
            console.log('🗺️ Building roadmap index...');
            
            const files = this.findRoadmapFiles();
            
            if (files.length === 0) {
                console.warn('⚠️ No roadmap files found');
                if (!this.options.allowEmpty) {
                    console.error('❌ No roadmap files to parse. Use --allow-empty to suppress this error.');
                    process.exit(1);
                }
            }
            
            // Parse all files
            files.forEach(file => this.parseFile(file));
            
            if (this.items.length === 0) {
                console.warn('⚠️ No roadmap items found');
                if (!this.options.allowEmpty) {
                    console.error('❌ No roadmap items parsed. Use --allow-empty to suppress this error.');
                    process.exit(1);
                }
            }
            
            // Generate and write output
            const jsonContent = this.generateOutput();
            this.writeOutput(jsonContent);
            
            // Summary
            console.log(`\n✅ Roadmap index generation complete!`);
            console.log(`📈 Summary:`);
            console.log(`   - Files processed: ${files.length}`);
            console.log(`   - Items extracted: ${this.stats.total}`);
            console.log(`   - Phases: ${Object.keys(this.stats.by_phase).join(', ') || 'None'}`);
            console.log(`   - Status distribution: ${JSON.stringify(this.stats.by_status)}`);
            
        } catch (error) {
            console.error('❌ Error building roadmap index:', error.message);
            if (process.env.DEBUG) {
                console.error(error.stack);
            }
            process.exit(1);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const builder = new RoadmapIndexBuilder();
    builder.run();
}

module.exports = RoadmapIndexBuilder;