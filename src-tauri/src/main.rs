// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{CustomMenuItem, Menu, Submenu, Manager};
use std::fs;
use serde_json;

fn main() {
    // 定义菜单项
    let open_file = CustomMenuItem::new("open_file".to_string(), "Open");
    let new_file = CustomMenuItem::new("new_file".to_string(), "New");

    let submenu = Submenu::new("File", Menu::new().add_item(open_file).add_item(new_file));
    let menu = Menu::new().add_submenu(submenu);

    tauri::Builder::default()
        .menu(menu) // 将菜单添加到应用中
        .on_menu_event(|event| {
            match event.menu_item_id() {
                "open_file" => {
                    // 当点击 "Open" 菜单项时，发送事件到前端
                    event.window().emit("menu-open-file", "").unwrap();
                }
                "new_file" => {
                    event.window().emit("menu-new-file", "").unwrap();
                }
                _ => {}
            }
        })
        .setup(|app| {
            let window = app.get_window("main").unwrap();

            // 克隆 window 以在不同的闭包中使用
            let window_clone = window.clone();

            // 处理文件拖放事件
            app.listen_global("tauri://file-drop", move |event| {
                let window = window_clone.clone(); // 克隆到新的闭包内
                if let Some(payload) = event.payload() {
                    if let Ok(paths) = serde_json::from_str::<Vec<String>>(payload) {
                        if let Some(path) = paths.get(0) {
                            if let Ok(content) = fs::read_to_string(path) {
                                window
                                    .emit(
                                        "file-opened",
                                        serde_json::json!({
                                            "content": content,
                                            "path": path
                                        }),
                                    )
                                    .unwrap();
                            }
                        }
                    }
                }
            });

            // Windows/Linux上处理启动时传递的文件路径
            #[cfg(not(target_os = "macos"))]
            {
                let window_clone = window.clone();
                let args: Vec<String> = std::env::args().collect();
                if args.len() > 1 {
                    let file_path = &args[1];
                    if let Ok(content) = fs::read_to_string(file_path) {
                        window_clone.emit("file-opened", serde_json::json!({
                            "content": content,
                            "path": file_path
                        })).unwrap();
                    }
                }
            }

            // macOS上监听文件打开事件
            #[cfg(target_os = "macos")]
            {
                let window_clone = window.clone();
                app.listen_global("tauri://open", move |event| {
                    let window = window_clone.clone(); // 克隆到闭包内
                    if let Some(path) = event.payload() {
                        if let Ok(content) = fs::read_to_string(path) {
                            window.emit("file-opened", serde_json::json!({
                                "content": content,
                                "path": path
                            })).unwrap();
                        }
                    }
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
