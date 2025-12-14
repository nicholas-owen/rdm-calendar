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

    // persistence
    const savedTheme = localStorage.getItem('theme') || 'theme-modern';
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
