import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // В режиме разработки подключаемся к Vite
  // В продакшене будем загружать билд: win.loadFile(path.join(__dirname, 'dist/index.html'))
    if (process.env.NODE_ENV === 'development') {
        win.loadURL('http://localhost:5173');
    } else {
        // В собранном виде грузим файл из папки dist
        win.loadFile(path.join(__dirname, 'dist/index.html'));
    }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
