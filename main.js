const { app, BrowserWindow, shell } = require('electron')
const path = require('path')

function createWindow () {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      webviewTag: true,
      contextIsolation: true
    }
  })

  win.loadFile('index.html')

  // Open external links in default browser if needed, but the webview 
  // embedded inside the app should just load normally.
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
