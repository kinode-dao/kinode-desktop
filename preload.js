const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
    'localApi', {
        sendAction: (action) => {
            ipcRenderer.send('action', action);
        },
        sendNodeForm: (formData) => {
            ipcRenderer.send('node-form', formData);
        },
        sendGoHome: (port) => {
            ipcRenderer.send('go-home', port);
        },
        onSelectedDirectory: (callback) => {
            ipcRenderer.on('selected-directory', (e, ...args) => callback(args));
        }
    }
);
