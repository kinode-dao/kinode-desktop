const { app, BrowserView, BrowserWindow, dialog, Menu, ipcMain, WebContentsView } = require('electron');
const fs = require('fs');
const path = require('path');
const { rootPath } = require('electron-root-path');
const { spawn } = require('child_process');

const isPackaged = app.isPackaged;

const width = 1200;
const height = 800;

let kinode;
let homePort;
homePort = '8080'; // default
//let noTurningBack;
//noTurningBack = false;

let win;
let splashScreenView;
let nodeView;

let platform;
switch (process.platform) {
    case 'aix':
    case 'freebsd':
    case 'linux':
    case 'openbsd':
    case 'android':
        platform = 'linux';
        break;
    case 'darwin':
    case 'sunos':
        platform = 'mac';
        break;
    case 'win32':
        platform = 'win';
        break;
    default:
        platform = 'unknown';
}

const homeFoldersPath =
    isPackaged
        ? path.join(process.resourcesPath, 'nodes')
        : path.join(rootPath, './nodes');

const binariesPath =
    isPackaged
        ? path.join(process.resourcesPath, 'bin', platform)
        : path.join(rootPath, './bin', platform);

const binaryName =
    platform == 'win'
        ? 'kinode.exe'
        : 'kinode';

const execPath = path.resolve(path.join(binariesPath, binaryName));

const isMac = process.platform === 'darwin';

const template = [
    // { role: 'appMenu' }
    ...(isMac
        ? [{
              label: app.name,
              submenu: [
                  { role: 'about' },
                  { type: 'separator' },
                  { role: 'services' },
                  { type: 'separator' },
                  { role: 'hide' },
                  { role: 'hideOthers' },
                  { role: 'unhide' },
                  { type: 'separator' },
                  { role: 'quit' }
              ]
          }]
        : []),
    // { role: 'fileMenu' }
    {
        label: 'File',
        submenu: [
            // TODO: disable until user has selected node?
            {
                label: 'Home',
                accelerator: 'CommandOrControl+H',
                click: () => {
                    //nodeView.webContents.loadURL(`http://localhost:${homePort}`);
                    BrowserWindow.getAllWindows().forEach(win => {
                        win.loadURL(`http://localhost:${homePort}`);
                    });
                }
            },
            isMac ? { role: 'close' } : { role: 'quit' }
        ]
    },
    // { role: 'editMenu' }
    {
        label: 'Edit',
        submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            ...(isMac
                ? [
                      { role: 'pasteAndMatchStyle' },
                      { role: 'delete' },
                      { role: 'selectAll' },
                      { type: 'separator' },
                      {
                          label: 'Speech',
                          submenu: [
                              { role: 'startSpeaking' },
                              { role: 'stopSpeaking' }
                          ]
                      }
                  ]
                : [
                      { role: 'delete' },
                      { type: 'separator' },
                      { role: 'selectAll' }
                  ])
        ]
    },
    // { role: 'viewMenu' }
    {
        label: 'View',
        submenu: [
            { role: 'reload' },
            { role: 'forceReload' },
            //{ role: 'toggleDevTools' },
            {
                label: 'Toggle Developer Tools',
                accelerator: 'CommandOrControl+Shift+I',
                click: () => win.webContents.openDevTools({ mode: 'detach' }),
            },
            { type: 'separator' },
            { role: 'resetZoom' },
            { role: 'zoomIn' },
            { role: 'zoomOut' },
            { type: 'separator' },
            { role: 'togglefullscreen' }
        ]
    },
    // { role: 'windowMenu' }
    {
        label: 'Window',
        submenu: [
            { role: 'minimize' },
            { role: 'zoom' },
            ...(isMac
                ? [
                      { type: 'separator' },
                      { role: 'front' },
                      { type: 'separator' },
                      { role: 'window' }
                  ]
                : [
                      { role: 'close' }
                  ])
        ]
    },
    {
        role: 'help',
        submenu: [
            {
                label: 'Learn More',
                click: async () => {
                    const { shell } = require('electron');
                    await shell.openExternal('https://book.kinode.org');
                }
            }
        ]
    }
]

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

const createWindow = () => {
    win = new BrowserWindow({
        //width: 1200,
        //height: 800,
        width: width,
        height: height,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            nativeWindowOpen: true,
            enableRemoteModule: true,
            sandbox: false,
            nodeIntegrationInSubFrames: true, //for subContent nodeIntegration Enable
            webviewTag: true //for webView
        }
    });

    console.log(`${path.join(rootPath, 'preload.js')}`);

    //splashScreenView = new WebContentsView();
    //win.contentView.addChildView(splashScreenView);
    //splashScreenView.webContents.loadFile('index.html');
    //splashScreenView.setBounds({ x: 0, y: 0, width: width, height: height });
    //
    splashScreenView = new BrowserView({
        //width: width,
        //height: height,
        webPreferences: {
            preload: path.join(rootPath, 'preload.js')
        }
    });
    win.setBrowserView(splashScreenView);
    splashScreenView.setBounds({ x: 0, y: 0, width: width, height: height });
    splashScreenView.setAutoResize({ width: true, height: true });
    splashScreenView.webContents.loadFile('index.html');
    win.setTopBrowserView(splashScreenView);

    //win.loadFile('index.html');

    //// disable back/forward
    //win.addEventListener('mouseup', (event) => {
    //    if (event.button === 3 || event.button === 4) {
    //        event.preventDefault();
    //        event.stopPropagation();
    //    }
    //});

    //const disableMouseNavigation = () => {
    //    const disableNavigationScript = `
    //      document.addEventListener('mouseup', (event) => {
    //        if (event.button === 3 || event.button === 4) {
    //          event.preventDefault();
    //          event.stopPropagation();
    //        }
    //      });
    //    `;
    //   win.webContents.executeJavaScript(disableNavigationScript);
    //};
    //win.webContents.on('dom-ready', () => {
    //  disableMouseNavigation();
    //});

    //win.webContents.on('did-start-navigation', (event) => {
    //    console.log(`main did-start-navigation ${event.url}`);
    //    //console.log(`main did-start-navigation ${event.url} ${event.isSameDocument} ${event.isMainFrame} ${event.frame} ${event.initiator}`);
    //    //if (event.url.startsWith('file')) {
    //    //    if (noTurningBack) {
    //    //        win.webContents.stop();
    //    //        //win.webContents.loadURL(`http://localhost:${homePort}`);
    //    //    } else {
    //    //        noTurningBack = true;
    //    //    }
    //    //}
    //});

    // read nodes from homeFoldersPath and pass to frontend
    const nodes = fs.readdirSync(homeFoldersPath);
    win.webContents.send('nodes', nodes);
};

app.whenReady().then(createWindow);

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

const handleShutdown = (haveQuitted) => {
    // send SIGTERM to kinode
    if (kinode) {
        kinode.kill('SIGTERM');
    }

    if (process.platform !== 'darwin' && !haveQuitted) {
        app.quit();
    }
};

app.on('window-all-closed', () => { handleShutdown(false) });
app.on('before-quit', () => { handleShutdown(true) });

ipcMain.on('node-form', (event, formData) => {
    let args = [formData.nodeName, '--detached'];

    homePort = formData.nodePort || '8080';
    args.push('--port', homePort);

    if (formData.nodeRpc) {
        args.push('--rpc', formData.nodeRpc);
    }
    console.log(args);

    kinode = spawn(execPath, args, {});

    kinode.stdout.on('data', (data) => {
        console.log(`kinode stdout: ${data}`);
    });

    kinode.stderr.on('data', (data) => {
        console.error(`kinode stderr: ${data}`);
    });

    kinode.on('close', (code) => {
        console.log(`kinode process exited with code ${code}`);
        kinode = null;
    });
});

ipcMain.on('go-home', (event, port) => {
    homePort = port;
    console.log('main: go-home');

    //nodeView = new WebContentsView();
    //win.contentView.addChildView(nodeView);
    //nodeView.webContents.loadURL(`http://localhost:${port}`);
    //win.contentView.removeChildView(splashScreenView);
    //nodeView.setBounds({ x: 0, y: 0, width: width, height: height });
    //
    //nodeView = new BrowserView();
    //win.setBrowserView(nodeView);
    //nodeView.setBounds({ x: 0, y: 0, width: width, height: height });
    //nodeView.webContents.loadURL(`http://localhost:${port}`);
    //nodeView.setAutoResize({ width: true, height: true });
    //
    win.removeBrowserView(splashScreenView);
    win.loadURL(`http://localhost:${port}`);
});

ipcMain.on('action', (event, action) => {
    console.log(`main: ${action}`);

    if (action === 'open-directory-dialog') {
        dialog.showOpenDialog({
            properties: ['openDirectory']
        }).then(result => {
            if (!result.canceled && result.filePaths.length > 0) {
                event.sender.send('selected-directory', result.filePaths[0]);
            }
        }).catch(err => {
            console.log(err);
        });
    }
});
