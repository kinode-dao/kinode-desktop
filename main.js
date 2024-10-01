const { ipcRenderer } = require('electron');

function sendToBackend(formData) {
    ipcRenderer.send("node-form", formData);
}

getDirs();

const form = document.querySelector('#node-form');
const nodeName = document.querySelector('#node-name');
const nodePort = document.querySelector('#node-port');
const nodeRpc = document.querySelector('#node-rpc');

form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!nodeName.value) {
        alert('Node name is required');
        return;
    }

    const formData = {
        nodeName: nodeName.value,
        nodePort: nodePort.value || null,
        nodeRpc: nodeRpc.value || null
    };

    sendToBackend(formData);

    checkAndRedirect((nodePort.value) ? nodePort.value : "8080");
});

function checkAndRedirect(port) {
    fetch(`http://localhost:${port}`, { mode: 'no-cors' })
        .then(() => {
            window.location.href = `http://localhost:${port}`;
        })
        .catch(() => {
            setTimeout(() => checkAndRedirect(port), 1000);
        });
}

function getDirs() {
    // window.__TAURI__.invoke('get_dirs')
    //     .then(dirs => {
    //         const nodeDirsList = document.querySelector('#node-dirs-list');
    //         nodeDirsList.innerHTML = '';
    //         dirs.forEach(dir => {
    //             const li = document.createElement('li');
    //             li.textContent = dir;
    //             nodeDirsList.appendChild(li);
    //             li.addEventListener('click', () => {
    //                 nodeName.value = dir;
    //             });
    //         });
    //     })
    //     .then(() => {
    //         setTimeout(getDirs, 1000);
    //     })
    //     .catch(console.error);
}