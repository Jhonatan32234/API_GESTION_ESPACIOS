const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

class PDFService {
    constructor() {
        this.templatesCache = new Map();
        this.browser = null;
        this.registerDefaultHelpers();
    }

    /**
     * Inicializa el navegador (singleton)
     */
    async initBrowser() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        }
        return this.browser;
    }

    /**
     * Genera PDF desde plantilla HTML/CSS
     */
  async generatePDF(templateName, data = {}, options = {}) {
    let browser;
    try {
        console.log('🖨️  Generando PDF con plantilla:', templateName);
        
        browser = await this.initBrowser();
        const page = await browser.newPage();

        const templateContent = await this.loadTemplate(templateName);
        const compiledTemplate = Handlebars.compile(templateContent);
        const htmlContent = compiledTemplate(data);
        
        await page.setContent(htmlContent, {
            waitUntil: 'load',
            timeout: 30000
        });

        const pdfOptions = {
            format: options.format || 'A4',
            margin: options.margin || {
                top: '20mm',
                right: '15mm',
                bottom: '20mm',
                left: '15mm'
            },
            printBackground: true,
            timeout: 30000,
            ...options
        };

        const pdfBuffer = await page.pdf(pdfOptions);
        
        console.log('✅ PDF generado. Tamaño:', pdfBuffer.length, 'bytes');
        
        if (!pdfBuffer || pdfBuffer.length === 0) {
            throw new Error('Buffer del PDF vacío');
        }

        return pdfBuffer;

    } catch (error) {
        console.error('❌ Error generando PDF:', error.message);
        throw new Error(`Error generando PDF: ${error.message}`);
    }
}

    /**
     * Carga plantilla HTML
     */
    // Verifica que la plantilla existe
async loadTemplate(templateName) {
    const templatesPath = path.join(__dirname, '../utils/templates');
    const templatePath = path.join(templatesPath, `${templateName}.html`);
    
    console.log('📁 Buscando plantilla en:', templatePath);
    
    try {
        const templateContent = await fs.promises.readFile(templatePath, 'utf8');
        console.log('✅ Plantilla encontrada y cargada');
        return templateContent;
    } catch (error) {
        console.error('❌ Error cargando plantilla:', error.message);
        throw new Error(`Plantilla no encontrada: ${templateName}. Ruta: ${templatePath}`);
    }
}

    /**
     * Registra helpers de Handlebars
     */
    registerDefaultHelpers() {
        Handlebars.registerHelper('formatDate', (date) => {
            if (!date) return 'N/A';
            return new Date(date).toLocaleDateString('es-ES');
        });

        Handlebars.registerHelper('upperCase', (str) => {
            return str?.toUpperCase() || '';
        });

        Handlebars.registerHelper('lowerCase', (str) => {
            return str?.toLowerCase() || '';
        });

        Handlebars.registerHelper('ifEqual', function(a, b, options) {
            return a === b ? options.fn(this) : options.inverse(this);
        });

        Handlebars.registerHelper('times', function(n, block) {
            let accum = '';
            for(let i = 0; i < n; ++i) {
                accum += block.fn(i);
            }
            return accum;
        });

        Handlebars.registerHelper('json', function(context) {
            return JSON.stringify(context);
        });
    }

    /**
     * Registra helpers personalizados
     */
    registerHelper(name, fn) {
        Handlebars.registerHelper(name, fn);
    }

    /**
     * Guarda PDF en archivo
     */
    async savePDFToFile(pdfBuffer, filePath) {
        const dir = path.dirname(filePath);
        await fs.promises.mkdir(dir, { recursive: true });
        await fs.promises.writeFile(filePath, pdfBuffer);
        return filePath;
    }

    /**
     * Cierra el navegador (llamar al apagar la aplicación)
     */
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}

module.exports = new PDFService();