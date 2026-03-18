document.addEventListener('DOMContentLoaded', () => {
    const MAX_SCREENS = 4;
    let screenCount = 0;
    
    const gridContainer = document.getElementById('grid-container');
    const addScreenBtn = document.getElementById('add-screen-btn');
    const themeSelector = document.getElementById('theme-selector');
    const template = document.getElementById('screen-template');
    
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
        
        // Add ID or tracking to the panel if needed
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
                
                // If all screens are closed, maybe add an empty state or auto-add one?
                if (screenCount === 0) {
                    addScreen(); // Just add one back automatically for convenience
                }
            }, 200);
        });

        // URL or Search Load logic
        const isElectron = navigator.userAgent.toLowerCase().indexOf(' electron/') > -1;
        const webviewEl = clone.querySelector('.panel-webview');
        const placeholder = clone.querySelector('.placeholder-message');

        const loadUrl = () => {
            let input = urlInput.value.trim();
            if (!input) return;
            
            let url = '';
            
            // Basic detection for URL vs Search Query
            const isUrl = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/.test(input) || 
                          input.startsWith('http://') || 
                          input.startsWith('https://');
            
            if (isUrl) {
                url = input;
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    url = 'https://' + url;
                }
            } else {
                url = `https://www.google.com/search?q=${encodeURIComponent(input)}`;
            }

            urlInput.value = url;

            if (isElectron && webviewEl) {
                // Use the pre-built webview from the template
                placeholder.style.display = 'none';
                webviewEl.style.display = 'block';
                webviewEl.src = url;

                // Hook up nav buttons on first load only
                if (!webviewEl.dataset.initialized) {
                    webviewEl.dataset.initialized = 'true';
                    backBtn.addEventListener('click', () => { if (webviewEl.canGoBack()) webviewEl.goBack(); });
                    forwardBtn.addEventListener('click', () => { if (webviewEl.canGoForward()) webviewEl.goForward(); });
                    refreshBtn.addEventListener('click', () => webviewEl.reload());
                    webviewEl.addEventListener('did-navigate', () => {
                        backBtn.disabled = !webviewEl.canGoBack();
                        forwardBtn.disabled = !webviewEl.canGoForward();
                        urlInput.value = webviewEl.getURL();
                    });
                    webviewEl.addEventListener('did-navigate-in-page', () => {
                        backBtn.disabled = !webviewEl.canGoBack();
                        forwardBtn.disabled = !webviewEl.canGoForward();
                        urlInput.value = webviewEl.getURL();
                    });
                }
            } else {
                // Fallback: use iframe for non-Electron environments
                let iframe = contentArea.querySelector('iframe');
                if (!iframe) {
                    iframe = document.createElement('iframe');
                    iframe.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;border:none;';
                    iframe.sandbox = "allow-same-origin allow-scripts allow-forms allow-popups";
                    placeholder.style.display = 'none';
                    contentArea.appendChild(iframe);
                    refreshBtn.addEventListener('click', () => { iframe.src = iframe.src; });
                }
                iframe.src = url;
            }
        };

        goBtn.addEventListener('click', loadUrl);
        urlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                loadUrl();
            }
        });

        gridContainer.appendChild(panel);
        updateAddButtonState();
        
        // Focus the newly added input
        setTimeout(() => {
            urlInput.focus();
        }, 300);
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
