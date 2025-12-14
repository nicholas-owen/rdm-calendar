const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const dataDir = path.join(__dirname, 'data');
const outputDir = __dirname;
const templateSrcPath = path.join(__dirname, 'template.html');
const outputPath = path.join(__dirname, 'index.html');

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getProfessionHue(profession) {
    let hash = 0;
    for (let i = 0; i < profession.length; i++) {
        hash = profession.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % 360);
}

try {
    const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));
    let conferences = [];
    let allProfessions = new Set();

    files.forEach(file => {
        const filePath = path.join(dataDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        try {
            const doc = yaml.load(fileContent);
            if (doc && doc.next) {
                // Normalize professions to array
                if (doc.professions && !Array.isArray(doc.professions)) {
                    doc.professions = [doc.professions];
                }

                if (doc.professions) {
                    doc.professions.forEach(p => allProfessions.add(p));
                }
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

    // Generate Filter Sidebar HTML
    const sortedProfessions = Array.from(allProfessions).sort();
    const filtersHtml = sortedProfessions.map(p => {
        const hue = getProfessionHue(p);
        // Added 'active' class by default as per plan (All On)
        // Added filter-btn class for JS selection
        return `<button class="profession-tag filter-btn active" data-profession="${p}" style="--tag-hue: ${hue}deg">
            <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            ${p}
        </button>`;
    }).join('\n');


    // Generate HTML Item List
    const listHtml = conferences.map(conf => {
        const dateFrom = formatDate(conf.next['date-from']);
        const dateTo = formatDate(conf.next['date-to']);
        const dateDisplay = dateFrom === dateTo ? dateFrom : `${dateFrom} - ${dateTo}`;

        let professionsHtml = '';
        let professionListAttr = '';

        if (conf.professions && Array.isArray(conf.professions) && conf.professions.length > 0) {
            professionListAttr = conf.professions.join(',');
            professionsHtml = `<div class="profession-tags">` +
                conf.professions.map(p => {
                    const hue = getProfessionHue(p);
                    return `<span class="profession-tag" style="--tag-hue: ${hue}deg">
                        <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        ${p}
                    </span>`;
                }).join('') + `</div>`;
        }

        const infoHtml = conf.next.info ? `
        <div class="conference-details">
            <button class="info-toggle" aria-expanded="false">
                <svg class="chevron-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                <span>More Info</span>
            </button>
            <div class="info-content" hidden>
                <p>${conf.next.info.replace(/\n/g, '<br>')}</p>
            </div>
        </div>` : '';

        const locationHtml = conf.next.location ? `
        <div class="conference-location">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="location-icon"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <span>${conf.next.location}</span>
        </div>` : '';

        // Added data-professions attribute
        return `
        <div class="conference-card" data-professions="${professionListAttr}">
            <div class="conference-main">
                <div class="conference-header">
                    ${professionsHtml}
                    <h3><a href="${conf.link}" target="_blank">${conf.name}</a></h3>
                    <div class="conference-meta">
                        <span class="conference-date">${dateDisplay}</span>
                        ${locationHtml}
                    </div>
                    ${infoHtml}
                </div>
                <div class="conference-actions">
                    <a href="${conf.next.link}" target="_blank" class="btn-visit">Visit Meeting Page</a>
                </div>
            </div>
        </div>
        `;
    }).join('\n');

    // Read template
    let template = fs.readFileSync(templateSrcPath, 'utf8');

    // Inject list
    let finalHtml = template.replace('<!-- CONFERENCE_LIST_PLACEHOLDER -->', listHtml);

    // Inject filters and iCal button
    const filtersSectionHtml = `
    <div class="filters-section">
        <h3>Filter by Profession</h3>
        <div class="profession-filters">
            ${filtersHtml}
        </div>
        <div class="ical-section">
            <button id="download-ical" class="btn-ical">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="M12 14v4"></path><path d="M10 16h4"></path></svg>
                Download iCal
            </button>
        </div>
    </div>`;

    finalHtml = finalHtml.replace('<!-- PROFESSION_FILTERS_PLACEHOLDER -->', filtersSectionHtml);

    // Inject Data for Client-Side iCal Generation
    const dataScript = `<script>window.CONFERENCE_DATA = ${JSON.stringify(conferences)};</script>`;
    // Inject before script.js
    finalHtml = finalHtml.replace('<script src="script.js"></script>', `${dataScript}\n    <script src="script.js"></script>`);

    // Inject Info Button & Dialog
    const marked = require('marked');
    const infoPath = path.join(dataDir, 'README.md');
    let infoContentHtml = '<p>No info available.</p>';
    if (fs.existsSync(infoPath)) {
        const infoMd = fs.readFileSync(infoPath, 'utf8');
        infoContentHtml = marked.parse(infoMd);
    }

    // 1. Inject Info Icon in Sidebar (Next to Settings)
    // We look for the settings trigger and append the info trigger
    const settingsIconHtml = `<div class="sidebar-icon" id="settings-trigger" title="Settings">`;
    const infoIconHtml = `
    <div class="sidebar-icon" id="info-trigger" title="Information">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
    </div>`;

    finalHtml = finalHtml.replace(settingsIconHtml, settingsIconHtml + infoIconHtml);

    // 2. Inject Info Dialog (End of body)
    const infoDialogHtml = `
    <dialog id="info-dialog" class="settings-modal info-modal">
        <div class="modal-header">
            <h2>Information</h2>
            <button id="close-info" class="close-btn">&times;</button>
        </div>
        <div class="modal-body markdown-body">
            ${infoContentHtml}
        </div>
    </dialog>`;

    // Insert before Settings Dialog
    finalHtml = finalHtml.replace('<dialog id="settings-dialog"', infoDialogHtml + '\n    <dialog id="settings-dialog"');

    fs.writeFileSync(outputPath, finalHtml);
    console.log('Build complete: index.html generated.');

} catch (e) {
    console.error('Build failed:', e);
    process.exit(1);
}
