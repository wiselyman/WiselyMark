// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{CustomMenuItem, Menu, Submenu};

fn main() {
    // 定义菜单项
    let open_file = CustomMenuItem::new("open_file".to_string(), "Open");
    let new_file = CustomMenuItem::new("new_file".to_string(), "New");

    let submenu = Submenu::new("File", Menu::new().add_item(open_file).add_item(new_file));
    let menu = Menu::new()
        .add_submenu(submenu);

    tauri::Builder::default()
        .menu(menu) // 将菜单添加到应用中
        .on_menu_event(|event| {
            match event.menu_item_id() {
                "open_file" => {
                    // 当点击 "Open Markdown File" 菜单项时，发送事件到前端
                    event.window().emit("menu-open-file", "").unwrap();
                }
                "new_file" => {   
                    event.window().emit("menu-new-file", "").unwrap();
                }
                _ => {}
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}