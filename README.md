# Antigravity Doctor

A lightweight, cross-platform diagnostic utility designed to inspect, validate, and troubleshoot local Antigravity environments, including Antigravity 2.0 (Desktop), Antigravity IDE (VS Code fork), the `agy` CLI agent, and associated network routing/DNS infrastructure.

Built on Neutralino.js (native C++ core and OS-native webview) to deliver near-zero idle GPU load, negligible RAM overhead (~20 MB), and instantaneous start times.

---

## Key Capabilities

- **Automated 16-Point Verification Matrix:** Executes deep structural, memory, binary, and network checks across all core toolchain layers.
- **5-Level Smart Path Discovery:** Automatically resolves installation roots via running process memory inspection, Windows Registry query, desktop/Start menu shortcut analysis, drive root scanning, or user override.
- **Binary Signature Inspection:** Verifies Language Server binaries (`language_server.exe`) and CLI executables (`agy.exe`) for active patch signatures (`inexigible` vs `ineligible`).
- **Network & DNS Gateway Diagnostics:** Validates Windows Name Resolution Policy Table (NRPT) rules, Cloud Code gateway DNS resolution, Google OAuth endpoints, and TLS handshake latency.
- **One-Click Support Log Generation:** Compiles structured, anonymized diagnostic reports formatted for direct submission to community support channels (`t.me/nova_txt`).
- **Zero GPU Overhead:** Pure DOM rendering without heavy animation loops or WebGL contexts.

---

## Diagnostic Matrix Breakdown

| Component | Check | Description |
| :--- | :--- | :--- |
| **Environment** | Process Elevation | Validates administrative execution via High Mandatory Level SID (`S-1-16-12288`). |
| | System Variables | Checks for conflicting `HTTP_PROXY` / `HTTPS_PROXY` configurations. |
| **Antigravity 2.0** | Install Path Resolution | Discovers installation root via 5-tier resolution engine. |
| | Process Status | Determines whether `antigravity.exe` is actively running. |
| | Language Server Patch | Inspects binary for the `inexigible` signature. |
| **Antigravity IDE** | Install Path Resolution | Locates `Antigravity IDE` installation directory. |
| | Process Status | Inspects running IDE processes. |
| | Language Server Patch | Checks `resources/app/bin/language_server.exe` binary patch state. |
| | Endpoint Settings | Inspects `settings.json` for `daily-cloudcode-pa.googleapis.com` configuration. |
| **Antigravity CLI** | Binary Resolution | Resolves `agy.exe` executable from `PATH` and default user directories. |
| | Binary Patch | Analyzes `agy.exe` signature integrity. |
| | Environment Variable | Validates presence and accuracy of `CLOUD_CODE_URL`. |
| **Network & DNS** | NRPT Policy Table | Queries active Windows NRPT rules for `daily-cloudcode-pa` routing. |
| | DNS Resolution (Gateway) | Resolves `daily-cloudcode-pa.googleapis.com` against active DNS servers. |
| | DNS Resolution (OAuth) | Confirms domain resolution for `oauth2.googleapis.com`. |
| | TLS Handshake & Latency | Measures end-to-end handshake time and HTTP accessibility. |

---

## System Requirements

- **Windows:** Windows 10 or Windows 11 (64-bit). Uses Microsoft Edge WebView2 runtime (preinstalled on modern Windows).
- **macOS:** macOS 11.0 (Big Sur) or newer (Apple Silicon & Intel supported natively).
- **Linux:** Any modern x86_64 or ARM64 distribution with WebKitGTK (`webkit2gtk-4.0` / `webkit2gtk-4.1`).

---

## Quick Start

### Running Pre-Built Executables

1. Download the latest release archive for your platform from the Releases tab.
2. Extract the archive contents ensuring `resources.neu` remains in the same directory as the executable.
3. Launch the binary:
   - **Windows:** `antigravity-doctor-win_x64.exe` (Run as Administrator for full NRPT and binary inspection access).
   - **macOS:** `antigravity-doctor-mac_universal`
   - **Linux:** `./antigravity-doctor-linux_x64`

---

## Building From Source

### Prerequisites

- Node.js (v18.0 or newer)
- npm or npx

### Build Instructions

```bash
# 1. Clone the repository
git clone https://github.com/your-username/antigravity-doctor.git
cd antigravity-doctor

# 2. Run in development mode
npx @neutralinojs/neu run

# 3. Build standalone multi-platform distribution packages
npx @neutralinojs/neu build
```

Compiled distribution packages are generated inside the `dist/antigravity-doctor/` directory containing standalone binaries for Windows, macOS (Universal, ARM64, Intel), and Linux (x64, ARM64, ARMhf).

---

## Project Structure

```
antigravity-doctor/
├── .github/
│   └── workflows/
│       └── release.yml        # Multi-platform GitHub Actions release workflow
├── bin/                       # Neutralino pre-built native runtime binaries
├── resources/
│   ├── index.html             # High-density dashboard markup
│   ├── styles.css             # Matte graphite styling (Montserrat + Roboto)
│   ├── js/
│   │   ├── app.js             # Diagnostic engine, path resolution, and reporting
│   │   └── neutralino.js      # Neutralino.js client library
│   └── icons/                 # Application icons
├── neutralino.config.json     # Application configuration and native API permissions
├── package.json               # Project metadata and build scripts
├── LICENSE                    # MIT License
└── README.md
```

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
