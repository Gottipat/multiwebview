document.addEventListener('DOMContentLoaded', () => {
    const MAX_SCREENS = 4;
    let screenCount = 0;
    
    const gridContainer = document.getElementById('grid-container');
    const addScreenBtn = document.getElementById('add-screen-btn');
    const themeSelector = document.getElementById('theme-selector');
    const template = document.getElementById('screen-template');

    // Reliable Electron detection: process.versions.electron is set in Electron's renderer
    // when nodeIntegration is enabled (which it is in main.js)
    const isElectron = !!(window.process && window.process.versions && window.process.versions.electron);

    // Theme switching logic
    themeSelector.addEventListener('change', (e) => {
        document.body.setAttribute('data-theme', e.target.value);
    });

    // Add default screen
    addScreen();

    addScreenBtn.addEventListener('click', () => {
        if (screenCount < MAX_SCREENS) {
            addScreen();
        }
    });

    function addScreen() {
        screenCount++;
        updateGridClass();
        
        const clone = template.content.cloneNode(true);
        const panel = clone.querySelector('.screen-panel');
        const urlInput = clone.querySelector('.url-input');
        const goBtn = clone.querySelector('.go-btn');
        const closeBtn = clone.querySelector('.close-btn');
        const contentArea = clone.querySelector('.panel-content');
        
        const backBtn = clone.querySelector('.back-btn');
        const forwardBtn = clone.querySelector('.forward-btn');
        const refreshBtn = clone.querySelector('.refresh-btn');
        
        panel.dataset.id = Date.now().toString();

        // Close logic
        closeBtn.addEventListener('click', () => {
            panel.style.opacity = '0';
            panel.style.transform = 'scale(0.95)';
            panel.style.transition = 'all 0.2s';
            setTimeout(() => {
                panel.remove();
                screenCount--;
                updateGridClass();
                updateAddButtonState();
                if (screenCount === 0) {
                    addScreen();
                }
            }, 200);
        });

        // Build a clean URL or a search query URL from the input
        function resolveUrl(input) {
            input = input.trim();
            if (!input) return null;

            const isUrl = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/.test(input) ||
                          input.startsWith('http://') ||
                          input.startsWith('https://');

            if (isUrl) {
                if (!input.startsWith('http://') && !input.startsWith('https://')) {
                    return 'https://' + input;
                }
                return input;
            } else {
                // Use Bing — it allows embedding unlike Google
                return `https://www.bing.com/search?q=${encodeURIComponent(input)}`;
            }
        }

        const webviewEl = clone.querySelector('.panel-webview');
        const placeholder = clone.querySelector('.placeholder-message');

        if (isElectron && webviewEl) {
            // ---- ELECTRON PATH: use <webview> ----
            placeholder.style.display = 'none';
            webviewEl.style.display = 'block';
            webviewEl.src = 'about:blank';

            // Wire up nav buttons
            backBtn.addEventListener('click', () => { try { webviewEl.goBack(); } catch(e){} });
            forwardBtn.addEventListener('click', () => { try { webviewEl.goForward(); } catch(e){} });
            refreshBtn.addEventListener('click', () => { try { webviewEl.reload(); } catch(e){} });

            // Update URL bar and nav button states on navigation
            function onNavigate(url) {
                if (url && url !== 'about:blank') {
                    urlInput.value = url;
                }
                try {
                    backBtn.disabled = !webviewEl.canGoBack();
                    forwardBtn.disabled = !webviewEl.canGoForward();
                } catch(e) {}
            }

            webviewEl.addEventListener('did-navigate', (e) => onNavigate(e.url));
            webviewEl.addEventListener('did-navigate-in-page', (e) => onNavigate(e.url));
            webviewEl.addEventListener('will-navigate', (e) => onNavigate(e.url));

            const loadUrl = () => {
                const url = resolveUrl(urlInput.value);
                if (!url) return;
                urlInput.value = url;
                webviewEl.src = url;
            };

            goBtn.addEventListener('click', loadUrl);
            urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') loadUrl(); });

        } else {
            // ---- FALLBACK PATH: use <iframe> (browser / no Electron) ----
            let iframe = null;

            const loadUrl = () => {
                const url = resolveUrl(urlInput.value);
                if (!url) return;
                urlInput.value = url;

                if (!iframe) {
                    iframe = document.createElement('iframe');
                    iframe.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;border:none;';
                    // Full permissions needed for navigation, forms and popups
                    iframe.sandbox = 'allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation';
                    placeholder.style.display = 'none';
                    contentArea.appendChild(iframe);
                    refreshBtn.addEventListener('click', () => { iframe.src = iframe.src; });
                }
                iframe.src = url;
            };

            goBtn.addEventListener('click', loadUrl);
            urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') loadUrl(); });
        }

        gridContainer.appendChild(panel);
        updateAddButtonState();
        
        setTimeout(() => { urlInput.focus(); }, 300);
    }

    function updateGridClass() {
        gridContainer.className = 'grid-container';
        if (screenCount > 0) {
            gridContainer.classList.add(`screens-${screenCount}`);
        }
    }

    function updateAddButtonState() {
        if (screenCount >= MAX_SCREENS) {
            addScreenBtn.disabled = true;
            addScreenBtn.textContent = 'Maximum Screens Reached';
        } else {
            addScreenBtn.disabled = false;
            addScreenBtn.textContent = '+ Add Screen';
        }
    }
});
