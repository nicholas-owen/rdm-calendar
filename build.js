const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const dataDir = path.join(__dirname, 'data');
const outputDir = __dirname;
const templatePath = path.join(__dirname, 'index.html'); // We will use index.html as a template for simplicity in this script, or better, separating template.

// Actually, let's keep index.html as the "template" but we'll inject data into a specific container.
// Or simpler: generate a data.js file that the frontend consumes?
// The user asked for "renders files... web page will list...". Static generation is safer for SEO and "github pages" usually implies static.
// Let's generate a full index.html from a template.

// Wait, if I overwrite index.html, I need a source template. Let's call it `template.html`.
const templateSrcPath = path.join(__dirname, 'template.html');
const outputPath = path.join(__dirname, 'index.html');

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

try {
    const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));
    let conferences = [];

    files.forEach(file => {
        const filePath = path.join(dataDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        try {
            const doc = yaml.load(fileContent);
            if (doc && doc.next) {
                conferences.push(doc);
            }
        } catch (e) {
            console.error(`Error parsing ${file}:`, e);
        }
    });

    // Sort by date-from
    conferences.sort((a, b) => {
        const dateA = new Date(a.next['date-from']);
        const dateB = new Date(b.next['date-from']);
        return dateA - dateB;
    });

    // Generate HTML Item List
    const listHtml = conferences.map(conf => {
        const dateFrom = formatDate(conf.next['date-from']);
        const dateTo = formatDate(conf.next['date-to']);
        const dateDisplay = dateFrom === dateTo ? dateFrom : `${dateFrom} - ${dateTo}`;

        const infoHtml = conf.next.info ? `
        <div class="conference-details">
            <button class="info-toggle" aria-expanded="false">
                <svg class="chevron-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                <span>More Info</span>
            </button>
            <div class="info-content" hidden>
                <p>${conf.next.info}</p>
            </div>
        </div>` : '';

        return `
        <div class="conference-card">
            <div class="conference-main">
                <div class="conference-header">
                    <h3><a href="${conf.link}" target="_blank">${conf.name}</a></h3>
                    <span class="conference-date">${dateDisplay}</span>
                </div>
                <div class="conference-actions">
                    <a href="${conf.next.link}" target="_blank" class="btn-visit">Visit Meeting Page</a>
                </div>
            </div>
            ${infoHtml}
        </div>
        `;
    }).join('\n');

    // Read template
    let template = fs.readFileSync(templateSrcPath, 'utf8');

    // Inject list
    const finalHtml = template.replace('<!-- CONFERENCE_LIST_PLACEHOLDER -->', listHtml);

    fs.writeFileSync(outputPath, finalHtml);
    console.log('Build complete: index.html generated.');

} catch (e) {
    console.error('Build failed:', e);
    process.exit(1);
}
