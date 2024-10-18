//const { ipcRenderer } = require('electron');

function sendToBackend(formData) {
    window.localApi.sendNodeForm(formData);
    //ipcRenderer.send('node-form', formData);
}

const nodeName = document.querySelector('#node-name');
const nodePort = document.querySelector('#node-port');
const nodeRpc = document.querySelector('#node-rpc');
const selectDir = document.querySelector('#select-dir');
const submit = document.querySelector('#submit');

//// disable back/forward
//document.addEventListener('mouseup', (event) => {
//    if (event.button === 3 || event.button === 4) {
//        event.preventDefault();
//        event.stopPropagation();
//    }
//});

selectDir.addEventListener('click', () => {
    window.localApi.sendAction('open-directory-dialog');
    //ipcRenderer.send('action', 'open-directory-dialog');
});

window.localApi.onSelectedDirectory(path => {
    document.getElementById('node-name').value = path;
});
//ipcRenderer.on('selected-directory', (event, path) => {
//    document.getElementById('node-name').value = path;
//});

//// populate node dirs list with nodes from backend
//ipcRenderer.on('nodes', (_event, nodes) => {
//    const nodeDirsList = document.querySelector('#node-dirs-list');
//    nodeDirsList.innerHTML = '';
//    nodes.forEach(node => {
//        const li = document.createElement('li');
//        li.textContent = node;
//        nodeDirsList.appendChild(li);
//        li.addEventListener('click', () => {
//            nodeName.value = node;
//        });
//    });
//});

submit.addEventListener('click', (event) => {
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

    checkAndRedirect((nodePort.value) ? nodePort.value : '8080');
});

function checkAndRedirect(port) {
    console.log(`Redirecting to http://localhost:${port}`);
    fetch(`http://localhost:${port}`, { mode: 'no-cors' })
        .then(() => {
            window.localApi.sendGoHome(port);
            //ipcRenderer.send('go-home', port);
        })
        .catch(() => {
            setTimeout(() => checkAndRedirect(port), 1000);
        });
}
