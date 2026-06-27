// Main Rust file for Tauri application
// This is a placeholder - Tauri 2.0 uses Rust for the backend

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // Initialize the app
            let window = app.get_window("main").unwrap();
            
            // Set window title
            window.set_title("Henkanki - Local File Converter").unwrap();
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
