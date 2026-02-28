const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
  });

  // ডেভেলপমেন্টের সময় localhost:3000 লোড করুন (যদি Vite চালু থাকে)
  // প্রোডাকশনে গেলে আবার loadFile ব্যবহার করবেন
  win.loadURL('http://localhost:3000'); 
  
  // কনসোলে এরর দেখার জন্য DevTools ওপেন করুন
  win.webContents.openDevTools(); 
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});