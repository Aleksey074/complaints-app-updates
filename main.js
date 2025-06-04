const { app, BrowserWindow, screen, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const ffmpegPath = require('ffmpeg-static');

console.log('FFmpeg path:', ffmpegPath);

if (!ffmpegPath) {
  throw new Error('FFmpeg not found!');
}

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const windowHeight = 200;

  const win = new BrowserWindow({
    width: primaryDisplay.workArea.width,
    height: windowHeight,
    x: 0,
    y: primaryDisplay.workArea.height - windowHeight,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      webSecurity: true,
      enableRemoteModule: true,
      plugins: true
    }
  });

  win.loadFile(path.join(__dirname, 'ComplaintsApp.html'));

  if (process.platform === 'darwin') {
    win.setVisibleOnAllWorkspaces(true);
  }

  // Настройка autoUpdater
  autoUpdater.logger = log;
  autoUpdater.logger.transports.file.level = 'info';
  autoUpdater.autoDownload = false;
  
  // Явно указываем репозиторий для обновлений
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'Aleksey074',
    repo: 'complaints-app-updates',
    vPrefixedTagName: true // если теги версий начинаются с 'v'
  });

  // Проверка обновлений
  autoUpdater.checkForUpdates();

  // Обработка событий обновления
  autoUpdater.on('update-available', () => {
    dialog.showMessageBox(win, {
      type: 'info',
      title: 'Доступно обновление',
      message: 'Доступна новая версия приложения. Хотите обновить сейчас?',
      buttons: ['Да', 'Нет']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();
      }
    });
  });

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox(win, {
      type: 'info',
      title: 'Обновление загружено',
      message: 'Обновление загружено и будет установлено при следующем запуске приложения.'
    });
    // Автоматическая установка через 5 секунд
    setTimeout(() => autoUpdater.quitAndInstall(), 5000);
  });

  autoUpdater.on('error', (error) => {
    log.error('Ошибка обновления', error);
    dialog.showErrorBox('Ошибка обновления', error ? error.toString() : "неизвестная ошибка");
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Обработка ошибок FFmpeg
process.on('uncaughtException', (error) => {
  console.error('FFmpeg error:', error);
});