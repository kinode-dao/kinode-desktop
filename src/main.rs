// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::api::process::{Command, CommandEvent};

fn main() {
    tauri::Builder::default()
        .setup(|_app| {
            tauri::async_runtime::spawn(async move {
                let (mut rx, _child) = Command::new_sidecar("kinode")
                    .expect("failed to setup `kinode` sidecar")
                    .args([
                        "home",
                        "--rpc",
                        "wss://opt-mainnet.g.alchemy.com/v2/phOnE7X9A3mnzAVjfyR1idu1yYX1mqSL",
                        "--detached",
                        "--port",
                        "8080",
                    ])
                    .current_dir("nodes".into())
                    .spawn()
                    .expect("Failed to spawn kinode");
                // can potentially inject terminal messages into the UI on homepage
                while let Some(event) = rx.recv().await {
                    if let CommandEvent::Stdout(line) = event {
                        println!("{}", line.trim_end());
                    }
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running app window");
}
