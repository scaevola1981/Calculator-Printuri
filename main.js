/**
 * NEXUS 3D - Main Process
 */
const { app, BrowserWindow } = require('electron');
const path = require('path');

// Fix for uv_cwd EPERM on macOS standalone bundles
try {
  process.chdir(__dirname);
} catch (err) {
  console.error('Failed to set CWD:', err);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    title: "Nexus 3D | Calculator Cost Printare",
    icon: path.join(__dirname, 'nexus3d_icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#0a0c10',
  });

  // Remove menu bar
  win.setMenuBarVisibility(false);

  win.loadFile('index.html');

  // Open the DevTools (optional)
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
