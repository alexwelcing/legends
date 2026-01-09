# Requirements Matrix

## Connectivity: Real-time Telemetry Stream
- Status: pending
- Spec: Use WebSockets (tokio-tungstenite) to provide a full-duplex JSON stream between the Rust backend and React frontend, ensuring compatibility with GitHub Codespaces port forwarding without gRPC-web proxy overhead.

## Data: Configuration and Layout Storage
- Status: pending
- Spec: Implement a local SQLite database using rusqlite for persistent agent logs and telemetry, while utilizing a localized config.toml for environment-specific settings like API keys and terminal themes.

## UX: Isometric Viewport Rendering
- Status: pending
- Spec: Utilize the HTML5 Canvas API via a custom React hook to render the Mega Man Legends-inspired isometric grid, ensuring high performance for 50+ concurrent agent nodes without the overhead of heavy 3D engines.

## Security: Secret Management
- Status: pending
- Spec: Store AI provider keys exclusively in server-side environment variables loaded into a secure memory-mapped vault in Rust; secrets are never transmitted to the frontend or stored in the database.

## Integration: Container Runtime Interaction
- Status: pending
- Spec: Directly interface with the host container runtime via Unix Sockets (Docker/Podman) using the bollard Rust crate to provide real-time lifecycle control and log streaming from the dashboard.

## DevOps: Environment Awareness
- Status: pending
- Spec: Detect GitHub Codespaces via the CODESPACES environment variable to automatically adjust host bindings to 0.0.0.0 and configure WebSocket CORS policies to match the dynamically assigned workspace URL.

## Performance: Inference Gateway Concurrency
- Status: pending
- Spec: Implement a trait-based provider routing system in Rust using tokio mpsc channels to support non-blocking hot-swapping of LLM backends without restarting the monitoring service.