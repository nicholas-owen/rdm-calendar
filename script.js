document.addEventListener('DOMContentLoaded', () => {
    const settingsTrigger = document.getElementById('settings-trigger');
    const settingsDialog = document.getElementById('settings-dialog');
    const closeSettings = document.getElementById('close-settings');
    const themeBtns = document.querySelectorAll('.theme-btn');
    const body = document.body;

    // Filter Logic
    const filterBtns = document.querySelectorAll('.filter-btn');
    const conferenceCards = document.querySelectorAll('.conference-card');
    let activeFilters = new Set();

    // Initialize active filters
    filterBtns.forEach(btn => {
        const profession = btn.getAttribute('data-profession');
        if (btn.classList.contains('active')) {
            activeFilters.add(profession);
        }
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const profession = btn.getAttribute('data-profession');

            if (activeFilters.has(profession)) {
                // Deactivate
                activeFilters.delete(profession);
                btn.classList.remove('active');
            } else {
                // Activate
                activeFilters.add(profession);
                btn.classList.add('active');
            }

            applyFilters();
        });
    });

    function applyFilters() {
        conferenceCards.forEach(card => {
            const cardProfessionsStr = card.getAttribute('data-professions') || '';
            const cardProfessions = cardProfessionsStr.split(',').filter(p => p);

            // Logic: Show if ANY of the card's professions are in the active set
            // If activeFilters is empty, strictly nothing should show (as per user request: "filtered off... entries removed")

            let isVisible = false;

            if (activeFilters.size > 0) {
                // Check intersection
                // If card has NO professions, should it be shown? 
                // Assuming cards usually have professions. If not, they might only show if we have a "No Profession" filter or special logic.
                // For now, if activeFilters > 0, we only show matches.

                for (const p of cardProfessions) {
                    if (activeFilters.has(p)) {
                        isVisible = true;
                        break;
                    }
                }
            } else {
                // All filters off -> All entries removed
                isVisible = false;
            }

            if (isVisible) {
                card.style.display = ''; // Reset to default (flex/block)
            } else {
                card.style.display = 'none';
            }
        });
    }

    // iCal Generation Logic
    const icalBtn = document.getElementById('download-ical');
    if (icalBtn) {
        icalBtn.addEventListener('click', () => {
            generateICAL();
        });
    }

    function formatDateToICAL(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }

    // Helper to add days to a date
    function addDays(dateStr, days) {
        const date = new Date(dateStr);
        date.setDate(date.getDate() + days);
        return date;
    }

    function formatDateToICALDateOnly(dateWithOffset) {
        // Format as YYYYMMDD for pure date (ignoring time) or YYYYMMDDTHHmmSSZ
        // For full day events, standard is YYYYMMDD
        const y = dateWithOffset.getUTCFullYear();
        const m = String(dateWithOffset.getUTCMonth() + 1).padStart(2, '0');
        const d = String(dateWithOffset.getUTCDate()).padStart(2, '0');
        return `${y}${m}${d}`;
    }

    function generateICAL() {
        if (!window.CONFERENCE_DATA) return;

        // Filter events based on current activeFilters
        // Re-using logic: An event is included if it matches the active filters.
        const filteredEvents = window.CONFERENCE_DATA.filter(conf => {
            // Same visibility logic as applyFilters
            if (activeFilters.size === 0) return false;

            const confProfessions = conf.professions || [];
            // If activeFilters > 0, we only show matches.
            return confProfessions.some(p => activeFilters.has(p));
        });

        if (filteredEvents.length === 0) {
            alert('No events match the current filter.');
            return;
        }

        let icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//RDM Calendar//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH'
        ];

        filteredEvents.forEach(conf => {
            const next = conf.next;
            if (!next) return;

            // UID Generation
            // Simple hash
            let hash = 0;
            const uidStr = conf.name + next['date-from'];
            for (let i = 0; i < uidStr.length; i++) {
                hash = ((hash << 5) - hash) + uidStr.charCodeAt(i);
                hash |= 0;
            }
            const uid = 'rdm-conf-' + Math.abs(hash);

            // Date Handling
            // DTSTART
            const startDate = new Date(next['date-from']);
            const dtStart = formatDateToICALDateOnly(startDate);

            // DTEND: Needs +1 day for inclusive full-day events
            const endDateRaw = next['date-to'] || next['date-from'];
            const endDateInclusive = addDays(endDateRaw, 1);
            const dtEnd = formatDateToICALDateOnly(endDateInclusive);

            const summary = conf.name;
            const description = `${next.info || ''}\n\nLink: ${next.link || conf.link}`.replace(/\n/g, '\\n');
            const location = next.location || '';
            const categories = (conf.professions || []).join(',');

            icsContent.push('BEGIN:VEVENT');
            icsContent.push(`UID:${uid}`);
            icsContent.push(`DTSTAMP:${formatDateToICAL(new Date().toISOString())}`);
            icsContent.push(`DTSTART;VALUE=DATE:${dtStart}`);
            icsContent.push(`DTEND;VALUE=DATE:${dtEnd}`);
            icsContent.push(`SUMMARY:${summary}`);
            icsContent.push(`DESCRIPTION:${description}`);
            if (location) icsContent.push(`LOCATION:${location}`);
            if (categories) icsContent.push(`CATEGORIES:${categories}`);
            icsContent.push('END:VEVENT');
        });

        icsContent.push('END:VCALENDAR');

        const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'rdm-calendar.ics';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    setTheme(savedTheme);

    // Dialog handling
    settingsTrigger.addEventListener('click', () => {
        settingsDialog.showModal();
    });

    closeSettings.addEventListener('click', () => {
        settingsDialog.close();
    });

    // Close on click outside
    settingsDialog.addEventListener('click', (e) => {
        const rect = settingsDialog.getBoundingClientRect();
        const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
            rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
        if (!isInDialog) {
            settingsDialog.close();
        }
    });

    // Theme switching
    themeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-theme');
            setTheme(theme);
        });
    });

    function setTheme(themeName) {
        body.className = ''; // remove all
        body.classList.add(themeName);
        localStorage.setItem('theme', themeName);
    }

    // Info Toggle Logic (Event Delegation)
    document.querySelector('.conference-list').addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('.info-toggle');
        if (toggleBtn) {
            const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
            toggleBtn.setAttribute('aria-expanded', !isExpanded);

            const content = toggleBtn.nextElementSibling;
            if (content) {
                content.hidden = isExpanded;
            }
        }
    });
});
