const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { rootPath } = require('electron-root-path');
const { spawn } = require('child_process');

const root = rootPath;
const isPackaged = app.isPackaged;

let kinode;

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
        : path.join(root, './nodes');

const binariesPath =
    isPackaged
        ? path.join(process.resourcesPath, 'bin', platform)
        : path.join(root, './bin', platform);

const binaryName =
    platform == 'win'
        ? 'kinode.exe'
        : 'kinode';

const execPath = path.resolve(path.join(binariesPath, binaryName));

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            nativeWindowOpen: true,
            enableRemoteModule: true,
            sandbox: false,
            nodeIntegrationInSubFrames: true, //for subContent nodeIntegration Enable
            webviewTag: true //for webView
        }
    })

    win.loadFile('index.html')

    // read nodes from homeFoldersPath and pass to frontend
    const nodes = fs.readdirSync(homeFoldersPath);
    win.webContents.send('nodes', nodes);
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
    // send SIGTERM to kinode
    if (kinode) {
        kinode.kill('SIGTERM');
    }

    if (process.platform !== 'darwin') {
        app.quit()
    }
})

ipcMain.on("node-form", (event, formData) => {
    let args = [path.join(homeFoldersPath, formData.nodeName), '--detached'];

    args.push('--port', formData.nodePort || '8080');

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
