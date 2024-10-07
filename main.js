const { ipcRenderer } = require('electron');

function sendToBackend(formData) {
    ipcRenderer.send("node-form", formData);
}

const form = document.querySelector('#node-form');
const nodeName = document.querySelector('#node-name');
const nodePort = document.querySelector('#node-port');
const nodeRpc = document.querySelector('#node-rpc');

// populate node dirs list with nodes from backend
ipcRenderer.on('nodes', (event, nodes) => {
    const nodeDirsList = document.querySelector('#node-dirs-list');
    nodeDirsList.innerHTML = '';
    nodes.forEach(node => {
        const li = document.createElement('li');
        li.textContent = node;
        nodeDirsList.appendChild(li);
        li.addEventListener('click', () => {
            nodeName.value = node;
        });
    });
});

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