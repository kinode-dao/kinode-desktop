function sendToBackend(formData) {
    window.localApi.sendNodeForm(formData);
}

const nodeName = document.querySelector('#node-name');
const nodePort = document.querySelector('#node-port');
const nodeRpc = document.querySelector('#node-rpc');
const selectDir = document.querySelector('#select-dir');
const submit = document.querySelector('#submit');

selectDir.addEventListener('click', () => {
    window.localApi.sendAction('open-directory-dialog');
    //ipcRenderer.send('action', 'open-directory-dialog');
});

window.localApi.onSelectedDirectory(path => {
    document.getElementById('node-name').value = path;
});

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
