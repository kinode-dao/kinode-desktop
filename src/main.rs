// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;
use std::sync::atomic::AtomicBool;
use std::sync::{Arc, Mutex};
use tauri::api::process::{Command, CommandEvent};

#[derive(Clone)]
struct Boot(Arc<AtomicBool>);

#[derive(Default)]
struct Wrap(Arc<State>);

#[derive(Default)]
struct State {
    node_name: Arc<Mutex<String>>,
    node_port: Arc<Mutex<String>>,
    node_rpc: Arc<Mutex<String>>,
}

#[tauri::command]
fn set_node_name(name: String, state: tauri::State<'_, Wrap>) {
    *state.0.node_name.lock().unwrap() = name;
}

#[tauri::command]
fn set_node_port(port: String, state: tauri::State<'_, Wrap>) {
    *state.0.node_port.lock().unwrap() = port;
}

#[tauri::command]
fn set_node_rpc(rpc: String, state: tauri::State<'_, Wrap>) {
    *state.0.node_rpc.lock().unwrap() = rpc;
}

#[tauri::command]
fn boot(boot: tauri::State<'_, Boot>) {
    boot.0.fetch_or(true, std::sync::atomic::Ordering::SeqCst);
}

fn main() {
    let (dir_tx, dir_rx) = std::sync::mpsc::channel::<PathBuf>();

    let boot_bool: Boot = Boot(Arc::new(AtomicBool::new(false)));
    let boot_bool_clone = boot_bool.clone();

    let wrap = Wrap(Arc::new(State::default()));
    let state_clone = wrap.0.clone();

    tauri::async_runtime::spawn(async move {
        let dir = match dir_rx.recv_timeout(std::time::Duration::from_secs(10)) {
            Ok(dir) => dir,
            Err(e) => {
                println!("Failed to receive directory: {}", e);
                return;
            }
        };

        // Wait for the boot signal
        while !boot_bool_clone.0.load(std::sync::atomic::Ordering::Relaxed) {
            std::thread::sleep(std::time::Duration::from_millis(100));
        }

        let node_name = state_clone.node_name.lock().unwrap().to_string();
        let node_port = state_clone.node_port.lock().unwrap().to_string();
        let node_rpc = state_clone.node_rpc.lock().unwrap().to_string();

        let mut args = vec![&node_name, "--detached"];

        if node_port.parse::<u16>().is_ok() {
            args.push("--port");
            args.push(&node_port);
        } else {
            args.push("--port");
            args.push("8080");
        }

        if let Ok(_) = tauri::Url::parse(&node_rpc) {
            args.push("--rpc");
            args.push(&node_rpc);
        }

        println!("Starting kinode with args: {:?} in dir {:?}", args, dir);

        let (mut rx, _child) = Command::new_sidecar("kinode")
            .expect("failed to setup kinode sidecar")
            .args(args)
            .current_dir(dir)
            .spawn()
            .expect("Failed to spawn kinode");

        // can potentially inject terminal messages into the UI on homepage
        while let Some(event) = rx.recv().await {
            if let CommandEvent::Stdout(line) = event {
                println!("{}", line.trim_end());
            }
        }
    });

    tauri::Builder::default()
        .manage(boot_bool)
        .manage(wrap)
        .setup(move |app| {
            let app_dir = app
                .handle()
                .path_resolver()
                .app_data_dir()
                .expect("Failed to get app data dir");
            std::fs::create_dir_all(&app_dir).expect("Failed to create dir");
            dir_tx.send(app_dir).unwrap();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            set_node_name,
            set_node_port,
            set_node_rpc,
            boot,
        ])
        .run(tauri::generate_context!())
        .expect("error while running app window");
}
