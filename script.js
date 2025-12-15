document.addEventListener('DOMContentLoaded', () => {
    const settingsTrigger = document.getElementById('settings-trigger');
    const settingsDialog = document.getElementById('settings-dialog');
    const closeSettings = document.getElementById('close-settings');
    const themeBtns = document.querySelectorAll('.theme-btn');
    const body = document.body;
    const savedTheme = localStorage.getItem('theme') || 'theme-modern';

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

    // Info Dialog
    const infoTrigger = document.getElementById('info-trigger');
    const infoDialog = document.getElementById('info-dialog');
    const closeInfo = document.getElementById('close-info');

    if (infoTrigger && infoDialog && closeInfo) {
        infoTrigger.addEventListener('click', () => {
            infoDialog.showModal();
        });

        closeInfo.addEventListener('click', () => {
            infoDialog.close();
        });

        infoDialog.addEventListener('click', (e) => {
            const rect = infoDialog.getBoundingClientRect();
            const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
                rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
            if (!isInDialog) {
                infoDialog.close();
            }
        });
    }

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

    // --- Mini Calendar Logic ---
    const calendarGrid = document.getElementById('calendar-grid');
    const monthYearSpan = document.getElementById('calendar-month-year');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');

    // Global Tooltip (Created dynamically to avoid overflow issues)
    let calendarTooltip = document.getElementById('calendar-tooltip-global');
    if (!calendarTooltip) {
        calendarTooltip = document.createElement('div');
        calendarTooltip.id = 'calendar-tooltip-global';
        calendarTooltip.className = 'calendar-tooltip';
        calendarTooltip.style.display = 'none';
        calendarTooltip.style.position = 'absolute'; // Relative to body
        calendarTooltip.style.zIndex = '9999'; // Very high
        document.body.appendChild(calendarTooltip);

        // Keep open on hover
        calendarTooltip.addEventListener('mouseenter', () => {
            clearTimeout(hideTimeout);
        });
        calendarTooltip.addEventListener('mouseleave', () => {
            hideTimeout = setTimeout(() => {
                calendarTooltip.style.display = 'none';
            }, 200);
        });
    }

    let currentCalendarDate = new Date();
    // Map: 'YYYY-MM-DD' -> Set of profession strings
    let eventDatesMap = new Map();

    function getProfessionHue(profession) {
        let hash = 0;
        for (let i = 0; i < profession.length; i++) {
            hash = profession.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash % 360);
    }

    function parseEventDates() {
        if (!window.CONFERENCE_DATA) return;
        eventDatesMap.clear();

        window.CONFERENCE_DATA.forEach(conf => {
            if (conf.next && conf.next['date-from']) {
                const startDate = new Date(conf.next['date-from']);
                const endDate = conf.next['date-to'] ? new Date(conf.next['date-to']) : startDate;
                const professions = conf.professions || [];

                // Iterate from start to end date
                let d = new Date(startDate);
                while (d <= endDate) {
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    const dateKey = `${y}-${m}-${day}`;

                    if (!eventDatesMap.has(dateKey)) {
                        eventDatesMap.set(dateKey, new Set());
                    }
                    professions.forEach(p => eventDatesMap.get(dateKey).add(p));

                    // Next day
                    d.setDate(d.getDate() + 1);
                }
            }
        });
    }

    function renderCalendar(date) {
        if (!calendarGrid || !monthYearSpan) return;

        const year = date.getFullYear();
        const month = date.getMonth();

        // Update Header
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        monthYearSpan.textContent = `${monthNames[month]} ${year}`;

        // Clear Grid
        calendarGrid.innerHTML = '';

        // First day of month
        const firstDay = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Padding for previous month
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('calendar-day', 'empty');
            calendarGrid.appendChild(emptyCell);
        }

        // Days
        for (let d = 1; d <= daysInMonth; d++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('calendar-day');

            const dayNum = document.createElement('span');
            dayNum.textContent = d;
            dayCell.appendChild(dayNum);

            // Check events
            const mStr = String(month + 1).padStart(2, '0');
            const dStr = String(d).padStart(2, '0');
            const dateKey = `${year}-${mStr}-${dStr}`;

            if (eventDatesMap.has(dateKey)) {
                const dotsContainer = document.createElement('div');
                dotsContainer.classList.add('calendar-dots');

                const professions = Array.from(eventDatesMap.get(dateKey));
                professions.forEach(p => {
                    const dot = document.createElement('div');
                    dot.classList.add('event-dot');
                    const hue = getProfessionHue(p);
                    dot.style.backgroundColor = `hsl(${hue}, 70%, 50%)`;
                    dot.title = p; // Tooltip
                    dotsContainer.appendChild(dot);
                });
                dayCell.appendChild(dotsContainer);

                // Tooltip Interaction (Day Cell)
                dayCell.addEventListener('mouseenter', () => {
                    if (!calendarTooltip) return;
                    clearTimeout(hideTimeout);

                    // Build Tooltip Content
                    let html = '';
                    events.forEach(event => {
                        const tagsHtml = event.professions.map(p => {
                            const hue = getProfessionHue(p);
                            return `<span class="tooltip-tag" style="background-color: hsl(${hue}, 70%, 50%);">${p}</span>`;
                        }).join('');

                        html += `
                            <div class="tooltip-event">
                                <h4 class="tooltip-title"><a href="${event.link}" target="_blank">${event.name}</a></h4>
                                <div class="tooltip-meta">
                                    ${event.location ? `<span class="tooltip-location">📍 ${event.location}</span>` : ''}
                                </div>
                                <p class="tooltip-info">${event.info || ''}</p>
                                <div class="tooltip-tags">${tagsHtml}</div>
                            </div>
                        `;
                    });

                    calendarTooltip.innerHTML = html;
                    calendarTooltip.style.display = 'block';

                    // Position Logic (Absolute to Body)
                    const dayRect = dayCell.getBoundingClientRect();
                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

                    // Initial Position
                    // Position ABOVE the day cell: top - height - 10px
                    let top = dayRect.top + scrollTop - calendarTooltip.offsetHeight - 10;
                    // Center horizontally: left + half width - half tooltip width
                    let left = dayRect.left + scrollLeft + (dayRect.width / 2) - (calendarTooltip.offsetWidth / 2);

                    // Prevent going off screen (Simple Check)
                    if (left < 10) left = 10;
                    if (left + calendarTooltip.offsetWidth > document.body.clientWidth) {
                        left = document.body.clientWidth - calendarTooltip.offsetWidth - 10;
                    }

                    calendarTooltip.style.top = `${top}px`;
                    calendarTooltip.style.left = `${left}px`;
                });

                dayCell.addEventListener('mouseleave', () => {
                    if (calendarTooltip) {
                        hideTimeout = setTimeout(() => {
                            calendarTooltip.style.display = 'none';
                        }, 200);
                    }
                });

            }

            // Highlight Today
            const today = new Date();
            if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayCell.classList.add('today');
            }

            calendarGrid.appendChild(dayCell);
        }
    }

    if (calendarGrid) {
        parseEventDates();
        renderCalendar(currentCalendarDate);

        prevMonthBtn.addEventListener('click', () => {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
            renderCalendar(currentCalendarDate);
        });

        nextMonthBtn.addEventListener('click', () => {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
            renderCalendar(currentCalendarDate);
        });
    }
});
