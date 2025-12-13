document.addEventListener('DOMContentLoaded', () => {
    const settingsTrigger = document.getElementById('settings-trigger');
    const settingsDialog = document.getElementById('settings-dialog');
    const closeSettings = document.getElementById('close-settings');
    const themeBtns = document.querySelectorAll('.theme-btn');
    const body = document.body;

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
