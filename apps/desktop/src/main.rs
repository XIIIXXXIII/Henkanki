//! Kanso Industrial desktop shell: the UI plans conversions, while the local CLI executes them.
use serde::Serialize;
use std::process::Command;

#[derive(Serialize)]
struct DesktopCapabilities {
    local_only: bool,
    cli_command: String,
    safe_commands: Vec<&'static str>,
}

#[tauri::command]
fn desktop_capabilities() -> DesktopCapabilities {
    DesktopCapabilities { local_only: true, cli_command: "henkanki".into(), safe_commands: vec!["doctor", "formats", "plan", "convert", "batch"] }
}

#[tauri::command]
fn run_henkanki(args: Vec<String>) -> Result<String, String> {
    let command = args.first().ok_or("A Henkanki command is required.")?;
    if !["doctor", "formats", "plan", "convert", "batch"].contains(&command.as_str()) {
        return Err("This desktop shell accepts only verified Henkanki CLI commands.".into());
    }
    let output = Command::new("henkanki").args(&args).output().map_err(|error| format!("Could not launch local henkanki CLI: {error}"))?;
    if !output.status.success() { return Err(String::from_utf8_lossy(&output.stderr).trim().to_owned()); }
    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![desktop_capabilities, run_henkanki])
        .run(tauri::generate_context!())
        .expect("Henkanki desktop shell failed to start");
}
