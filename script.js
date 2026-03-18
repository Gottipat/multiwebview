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
                // If it's just words, treat it as a Google search
                url = `https://www.google.com/search?q=${encodeURIComponent(input)}`;
            }

            urlInput.value = url;

            // Use webview for Electron, fallback to iframe if run in a normal browser
            const isElectron = navigator.userAgent.toLowerCase().indexOf(' electron/') > -1;
            
            let existingElement = contentArea.querySelector(isElectron ? 'webview' : 'iframe');

            if (!existingElement) {
                // If the element doesn't exist yet, clean up generic iframe/webviews from before
                const anyElement = contentArea.querySelector('iframe') || contentArea.querySelector('webview');
                if (anyElement) anyElement.remove();

                existingElement = document.createElement(isElectron ? 'webview' : 'iframe');
                existingElement.style.width = '100%';
                existingElement.style.height = '100%';
                existingElement.style.border = 'none';
                existingElement.style.position = 'absolute';
                existingElement.style.top = '0';
                existingElement.style.left = '0';
                existingElement.style.zIndex = '2';
                
                if (isElectron) {
                    existingElement.setAttribute('allowpopups', '');
                    contentArea.appendChild(existingElement);
                    
                    // Hook up Navigation Events
                    backBtn.addEventListener('click', () => { if (existingElement.canGoBack()) existingElement.goBack(); });
                    forwardBtn.addEventListener('click', () => { if (existingElement.canGoForward()) existingElement.goForward(); });
                    refreshBtn.addEventListener('click', () => { existingElement.reload(); });
                    
                    // Update State dynamically
                    const updateNavState = () => {
                        backBtn.disabled = !existingElement.canGoBack();
                        forwardBtn.disabled = !existingElement.canGoForward();
                        urlInput.value = existingElement.getURL();
                    };
                    
                    existingElement.addEventListener('did-navigate', updateNavState);
                    existingElement.addEventListener('did-navigate-in-page', updateNavState);

                } else {
                    existingElement.sandbox = "allow-same-origin allow-scripts allow-forms allow-popups";
                    contentArea.appendChild(existingElement);
                    
                    // Fallback refresh for iframes
                    refreshBtn.addEventListener('click', () => { existingElement.src = existingElement.src; });
                }
            }
            
            // Set URL
            existingElement.src = url;
            
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
