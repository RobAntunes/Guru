use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::process::Command;
use std::sync::Mutex;
use tauri::{Manager, Emitter};

// mod phi4_integration;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[derive(Debug, Serialize, Deserialize)]
struct GuruCommandResult {
    success: bool,
    data: Option<Value>,
    error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct FileItem {
    name: String,
    path: String,
    is_file: bool,
    size: Option<u64>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ModelStatus {
    exists: bool,
    path: Option<String>,
    size: Option<u64>,
}

#[derive(Debug, Serialize, Deserialize)]
struct DownloadResult {
    success: bool,
    error: Option<String>,
}

struct AppState {
    backend_process: Mutex<Option<std::process::Child>>,
}

// Execute Guru backend commands via Node.js
#[tauri::command]
async fn execute_guru_command(command: String, args: Vec<Value>) -> Result<Value, String> {
    use std::io::Write;
    use std::process::{Command, Stdio};
    
    let args_json = serde_json::to_string(&args)
        .map_err(|e| format!("Failed to serialize args: {}", e))?;
    
    // Log the command being executed
    eprintln!("Executing guru command: {}", command);
    
    // Check if the args are too large for command line (> 100KB)
    let args_size = args_json.len();
    let use_stdin = args_size > 100_000;
    
    eprintln!("Args size: {} bytes, using stdin: {}", args_size, use_stdin);
    
    let mut cmd = Command::new("node");
    cmd.arg("../scripts/guru-backend-runner.cjs")
       .arg(&command);
    
    if use_stdin {
        // Pass large data through stdin
        cmd.arg("--stdin");
        cmd.stdin(Stdio::piped());
    } else {
        // Pass small data as command line args
        cmd.args(&args.iter().map(|v| v.to_string()).collect::<Vec<_>>());
    }
    
    cmd.stdout(Stdio::piped())
       .stderr(Stdio::piped());
    
    if use_stdin {
        // Spawn the command and write to stdin
        let mut child = cmd.spawn()
            .map_err(|e| format!("Failed to spawn command: {}", e))?;
        
        // Write args to stdin
        if let Some(mut stdin) = child.stdin.take() {
            stdin.write_all(args_json.as_bytes())
                .map_err(|e| format!("Failed to write to stdin: {}", e))?;
        }
        
        // Wait for completion
        let output = child.wait_with_output()
            .map_err(|e| format!("Failed to wait for command: {}", e))?;
        
        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);
        
        eprintln!("Command stderr: {}", stderr);
        
        if output.status.success() {
            serde_json::from_str(&stdout)
                .map_err(|e| format!("Failed to parse output: {} - Raw output: {}", e, stdout))
        } else {
            Err(format!("Command failed: {}", stderr))
        }
    } else {
        // Execute normally for small data
        let output = cmd.output()
            .map_err(|e| format!("Failed to execute command: {}", e))?;
        
        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);
        
        eprintln!("Command stderr: {}", stderr);
        
        if output.status.success() {
            serde_json::from_str(&stdout)
                .map_err(|e| format!("Failed to parse output: {} - Raw output: {}", e, stdout))
        } else {
            Err(format!("Command failed: {}", stderr))
        }
    }
}

// File system commands
#[tauri::command]
async fn analyze_filesystem(options: Value) -> Result<Value, String> {
    execute_guru_command("analyzeFilesystem".to_string(), vec![options]).await
}

#[tauri::command]
async fn analyze_files_manual(file_paths: Vec<String>, analysis_mode: String) -> Result<Value, String> {
    execute_guru_command(
        "analyzeFilesManual".to_string(),
        vec![serde_json::json!(file_paths), serde_json::json!(analysis_mode)]
    ).await
}

// Document commands
#[tauri::command]
async fn upload_documents(documents: Vec<Value>, options: Option<Value>) -> Result<Value, String> {
    let args = match options {
        Some(opts) => vec![serde_json::json!(documents), opts],
        None => vec![serde_json::json!(documents)],
    };
    execute_guru_command("uploadDocuments".to_string(), args).await
}

// Knowledge base commands
#[tauri::command]
async fn create_knowledge_base(
    name: String,
    description: String,
    cognitive_systems_enabled: Option<Vec<String>>
) -> Result<Value, String> {
    let args = match cognitive_systems_enabled {
        Some(systems) => vec![
            serde_json::json!(name),
            serde_json::json!(description),
            serde_json::json!(systems)
        ],
        None => vec![serde_json::json!(name), serde_json::json!(description)],
    };
    execute_guru_command("createKnowledgeBase".to_string(), args).await
}

#[tauri::command]
async fn add_documents_to_knowledge_base(
    kb_name: String,
    documents: Vec<Value>,
    options: Option<Value>
) -> Result<Value, String> {
    let args = match options {
        Some(opts) => vec![serde_json::json!(kb_name), serde_json::json!(documents), opts],
        None => vec![serde_json::json!(kb_name), serde_json::json!(documents)],
    };
    execute_guru_command("addDocumentsToKnowledgeBase".to_string(), args).await
}

#[tauri::command]
async fn query_knowledge_base(
    kb_name: String,
    query: String,
    options: Option<Value>
) -> Result<Value, String> {
    let args = match options {
        Some(opts) => vec![serde_json::json!(kb_name), serde_json::json!(query), opts],
        None => vec![serde_json::json!(kb_name), serde_json::json!(query)],
    };
    execute_guru_command("queryKnowledgeBase".to_string(), args).await
}

#[tauri::command]
async fn list_knowledge_bases() -> Result<Value, String> {
    execute_guru_command("listKnowledgeBases".to_string(), vec![]).await
}

#[tauri::command]
async fn get_knowledge_base_info(kb_name: String) -> Result<Value, String> {
    execute_guru_command("getKnowledgeBaseInfo".to_string(), vec![serde_json::json!(kb_name)]).await
}

#[tauri::command]
async fn delete_knowledge_base(kb_name: String, confirm: bool) -> Result<Value, String> {
    execute_guru_command(
        "deleteKnowledgeBase".to_string(),
        vec![serde_json::json!(kb_name), serde_json::json!(confirm)]
    ).await
}

#[tauri::command]
async fn list_documents_in_kb(kb_name: String) -> Result<Value, String> {
    execute_guru_command("listDocumentsInKnowledgeBase".to_string(), vec![serde_json::json!(kb_name)]).await
}

#[tauri::command]
async fn delete_document_from_kb(kb_name: String, document_id: String) -> Result<Value, String> {
    execute_guru_command(
        "deleteDocumentFromKnowledgeBase".to_string(),
        vec![serde_json::json!(kb_name), serde_json::json!(document_id)]
    ).await
}

// File dialog commands
#[tauri::command]
async fn open_file_dialog(
    app: tauri::AppHandle,
    multiple: bool,
    filters: Option<Vec<(String, Vec<String>)>>
) -> Result<Option<Vec<String>>, String> {
    use tauri_plugin_dialog::DialogExt;
    
    let mut dialog = app.dialog().file();
    
    if let Some(filter_list) = filters {
        for (name, extensions) in filter_list {
            let ext_refs: Vec<&str> = extensions.iter().map(|s| s.as_str()).collect();
            dialog = dialog.add_filter(&name, &ext_refs);
        }
    }
    
    let paths = if multiple {
        dialog.blocking_pick_files()
    } else {
        dialog.blocking_pick_file().map(|p| vec![p])
    };
    
    match paths {
        Some(paths) => Ok(Some(paths.into_iter().map(|p| p.to_string()).collect())),
        None => Ok(None)
    }
}

#[tauri::command]
async fn open_folder_dialog(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    
    let path = app.dialog().file().blocking_pick_folder();
    
    match path {
        Some(path) => Ok(Some(path.to_string())),
        None => Ok(None)
    }
}

// File utilities
#[tauri::command]
async fn read_file_as_base64(file_path: String) -> Result<String, String> {
    use std::fs;
    use base64::{Engine as _, engine::general_purpose};
    
    match fs::read(&file_path) {
        Ok(contents) => Ok(general_purpose::STANDARD.encode(contents)),
        Err(e) => Err(format!("Failed to read file: {}", e))
    }
}

// File browser support
#[tauri::command]
async fn scan_directory(dir_path: String) -> Result<Value, String> {
    execute_guru_command("scanDirectory".to_string(), vec![serde_json::json!(dir_path)]).await
}

// Model management commands
#[tauri::command]
async fn check_model_status() -> Result<ModelStatus, String> {
    let app_data = dirs::data_dir()
        .ok_or("Could not find app data directory")?;
    
    let model_path = app_data
        .join("guru")
        .join("models")
        .join("phi4-mini")
        .join("model.onnx");
    
    if model_path.exists() {
        let metadata = std::fs::metadata(&model_path)
            .map_err(|e| e.to_string())?;
        
        Ok(ModelStatus {
            exists: true,
            path: Some(model_path.to_string_lossy().to_string()),
            size: Some(metadata.len()),
        })
    } else {
        Ok(ModelStatus {
            exists: false,
            path: None,
            size: None,
        })
    }
}

#[tauri::command]
async fn download_model(window: tauri::Window) -> Result<DownloadResult, String> {
    use std::io::{BufRead, BufReader};
    use std::thread;
    
    // Use the existing model-downloader.cjs script
    let mut cmd = Command::new("node");
    cmd.arg("../scripts/model-downloader.cjs");
    cmd.stdout(std::process::Stdio::piped());
    cmd.stderr(std::process::Stdio::piped());
    
    let mut child = cmd.spawn()
        .map_err(|e| format!("Failed to start download: {}", e))?;
    
    let window_clone = window.clone();
    
    // Handle stdout in a separate thread
    let stdout_handle = if let Some(stdout) = child.stdout.take() {
        Some(thread::spawn(move || {
            let reader = BufReader::new(stdout);
            for line in reader.lines() {
                if let Ok(line) = line {
                    eprintln!("Download output: {}", line);
                    if let Ok(progress) = serde_json::from_str::<Value>(&line) {
                        // Emit progress to frontend
                        if let Err(e) = window_clone.emit("download-progress", progress) {
                            eprintln!("Failed to emit progress: {}", e);
                        }
                    }
                }
            }
        }))
    } else {
        None
    };
    
    // Handle stderr in a separate thread
    let stderr_handle = if let Some(stderr) = child.stderr.take() {
        Some(thread::spawn(move || {
            let reader = BufReader::new(stderr);
            for line in reader.lines() {
                if let Ok(line) = line {
                    eprintln!("Download error: {}", line);
                }
            }
        }))
    } else {
        None
    };
    
    // Wait for the process to complete
    let status = child.wait()
        .map_err(|e| format!("Failed to wait for download: {}", e))?;
    
    // Wait for threads to finish
    if let Some(handle) = stdout_handle {
        let _ = handle.join();
    }
    if let Some(handle) = stderr_handle {
        let _ = handle.join();
    }
    
    if status.success() {
        Ok(DownloadResult {
            success: true,
            error: None,
        })
    } else {
        Ok(DownloadResult {
            success: false,
            error: Some("Download failed".to_string()),
        })
    }
}

// Backend management
#[tauri::command]
async fn start_guru_service(state: tauri::State<'_, AppState>) -> Result<(), String> {
    let mut backend = state.backend_process.lock().unwrap();
    
    if backend.is_some() {
        return Ok(()); // Already running
    }
    
    let mut cmd = Command::new("node");
    cmd.arg("scripts/guru-backend-runner.cjs");
    cmd.current_dir("../"); // Run from the desktop package directory
    
    match cmd.spawn() {
        Ok(child) => {
            *backend = Some(child);
            Ok(())
        }
        Err(e) => Err(format!("Failed to start backend: {}", e)),
    }
}

#[tauri::command]
async fn stop_guru_service(state: tauri::State<'_, AppState>) -> Result<(), String> {
    let mut backend = state.backend_process.lock().unwrap();
    
    if let Some(mut child) = backend.take() {
        match child.kill() {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Failed to stop backend: {}", e)),
        }
    } else {
        Ok(()) // Not running
    }
}

// Direct file analysis
#[tauri::command]
async fn analyze_files(files: Vec<String>, batch_mode: bool) -> Result<String, String> {
    use std::io::Write;
    use std::net::TcpStream;
    
    // Connect to the backend service
    let mut stream = TcpStream::connect("127.0.0.1:3456")
        .map_err(|e| format!("Failed to connect to backend: {}. Make sure the Guru service is running.", e))?;
    
    // Send analysis request
    let request = serde_json::json!({
        "type": "analyze",
        "files": files,
        "batchMode": batch_mode,
    });
    
    let request_str = serde_json::to_string(&request)
        .map_err(|e| format!("Failed to serialize request: {}", e))?;
    
    stream.write_all(request_str.as_bytes())
        .map_err(|e| format!("Failed to send request: {}", e))?;
    
    stream.write_all(b"\n")
        .map_err(|e| format!("Failed to send newline: {}", e))?;
    
    // Read response
    use std::io::BufRead;
    let reader = std::io::BufReader::new(stream);
    let mut response = String::new();
    
    for line in reader.lines() {
        match line {
            Ok(line) => {
                response = line;
                break;
            }
            Err(e) => return Err(format!("Failed to read response: {}", e)),
        }
    }
    
    Ok(response)
}

// Select folder dialog
#[tauri::command]
async fn select_folder(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    
    let path = app.dialog().file().blocking_pick_folder();
    
    match path {
        Some(path) => Ok(Some(path.to_string())),
        None => Ok(None)
    }
}

// Read directory contents
#[tauri::command]
async fn read_directory(path: String) -> Result<Vec<FileItem>, String> {
    use std::fs;
    
    let entries = fs::read_dir(&path)
        .map_err(|e| format!("Failed to read directory: {}", e))?;
    
    let mut items = Vec::new();
    
    for entry in entries {
        if let Ok(entry) = entry {
            let metadata = entry.metadata()
                .map_err(|e| format!("Failed to read metadata: {}", e))?;
            
            let name = entry.file_name().to_string_lossy().to_string();
            let full_path = entry.path().to_string_lossy().to_string();
            
            items.push(FileItem {
                name,
                path: full_path,
                is_file: metadata.is_file(),
                size: if metadata.is_file() { Some(metadata.len()) } else { None },
            });
        }
    }
    
    // Sort: directories first, then files
    items.sort_by(|a, b| {
        match (a.is_file, b.is_file) {
            (false, true) => std::cmp::Ordering::Less,
            (true, false) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });
    
    Ok(items)
}

// Guru core features
#[tauri::command]
async fn get_evolving_tasks() -> Result<Value, String> {
    execute_guru_command("getEvolvingTasks".to_string(), vec![]).await
}

#[tauri::command]
async fn get_quantum_memories() -> Result<Value, String> {
    execute_guru_command("getQuantumMemories".to_string(), vec![]).await
}

#[tauri::command]
async fn get_suggestions() -> Result<Value, String> {
    execute_guru_command("getSuggestions".to_string(), vec![]).await
}

#[tauri::command]
async fn execute_mcp_tool(tool: String, args: Value) -> Result<Value, String> {
    use std::io::{Write, Read};
    use std::net::TcpStream;
    
    // Connect to the MCP server
    let mut stream = TcpStream::connect("127.0.0.1:3457")
        .map_err(|e| format!("Failed to connect to MCP server: {}. Make sure the Guru MCP service is running.", e))?;
    
    // Send MCP tool request
    let request = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {
            "name": tool,
            "arguments": args
        },
        "id": 1
    });
    
    let request_str = serde_json::to_string(&request)
        .map_err(|e| format!("Failed to serialize request: {}", e))?;
    
    stream.write_all(request_str.as_bytes())
        .map_err(|e| format!("Failed to send request: {}", e))?;
    
    stream.write_all(b"\n")
        .map_err(|e| format!("Failed to send newline: {}", e))?;
    
    // Read the response
    let mut response = String::new();
    let mut buffer = [0; 1024];
    
    loop {
        match stream.read(&mut buffer) {
            Ok(0) => break, // Connection closed
            Ok(n) => {
                response.push_str(&String::from_utf8_lossy(&buffer[..n]));
                if response.contains('\n') {
                    break;
                }
            }
            Err(e) => return Err(format!("Failed to read response: {}", e)),
        }
    }
    
    // Parse the response
    let result: Value = serde_json::from_str(&response)
        .map_err(|e| format!("Failed to parse response: {}", e))?;
    
    // Extract the result from JSON-RPC response
    if let Some(error) = result.get("error") {
        return Err(format!("MCP error: {}", error));
    }
    
    if let Some(result_value) = result.get("result") {
        Ok(result_value.clone())
    } else {
        Err("Invalid MCP response format".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            backend_process: Mutex::new(None),
        })
        .setup(|app| {
            // Start the backend service when the app starts
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = start_guru_service(app_handle.state::<AppState>()).await {
                    eprintln!("Failed to start Guru service: {}", e);
                }
            });
            Ok(())
        })
        .on_window_event(|_window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                // Stop the backend service when the app closes
                if let Some(state) = _window.app_handle().try_state::<AppState>() {
                    let mut backend = state.backend_process.lock().unwrap();
                    if let Some(mut child) = backend.take() {
                        let _ = child.kill();
                    }
                }
            }
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            analyze_filesystem,
            analyze_files_manual,
            upload_documents,
            create_knowledge_base,
            add_documents_to_knowledge_base,
            query_knowledge_base,
            list_knowledge_bases,
            get_knowledge_base_info,
            delete_knowledge_base,
            list_documents_in_kb,
            delete_document_from_kb,
            read_file_as_base64,
            get_evolving_tasks,
            get_quantum_memories,
            get_suggestions,
            execute_mcp_tool,
            open_file_dialog,
            open_folder_dialog,
            scan_directory,
            check_model_status,
            download_model,
            start_guru_service,
            stop_guru_service,
            analyze_files,
            select_folder,
            read_directory
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
