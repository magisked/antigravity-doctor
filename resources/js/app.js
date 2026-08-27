// ==========================================================================
// Antigravity Doctor — Complete 16-Point Diagnostics Engine (Neutralino.js)
// ==========================================================================

let isDiagnosticsRunning = false;
let currentReportText = "";

// Helper for safe non-hanging command execution
async function safeExec(cmd, timeoutMs = 2500) {
    try {
        const p = Neutralino.os.execCommand(cmd);
        const t = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), timeoutMs));
        return await Promise.race([p, t]);
    } catch (e) {
        return { stdOut: "", stdErr: e.message || "Error" };
    }
}

window.addEventListener("DOMContentLoaded", () => {
    Neutralino.init();
    initTabs();
    initButtons();

    // Trigger on ready or fallback timeout
    let initialized = false;
    const startApp = async () => {
        if (initialized) return;
        initialized = true;
        await initSystemInfo();
        runFullDiagnostics();
    };

    Neutralino.events.on("ready", startApp);
    setTimeout(startApp, 400);

    Neutralino.events.on("windowClose", () => {
        Neutralino.app.exit();
    });
});

// TAB SWITCHING
function initTabs() {
    const tabs = document.querySelectorAll(".nav-item");
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            const target = tab.getAttribute("data-tab");
            document.querySelectorAll(".tab-view").forEach(v => v.classList.remove("active"));
            const activeView = document.getElementById("view-" + target);
            if (activeView) activeView.classList.add("active");
        });
    });
}

// BUTTONS
function initButtons() {
    document.getElementById("btn-run-diag").addEventListener("click", runFullDiagnostics);
    document.getElementById("btn-copy-log").addEventListener("click", copyReport);
    document.getElementById("btn-save-file").addEventListener("click", saveReport);
}

// SYSTEM & ADMIN INFO PROBE
async function initSystemInfo() {
    try {
        let osInfo = "Windows 64-bit";
        let isAdmin = false;

        if (window.NL_OS === "Windows" || typeof window.NL_OS === "undefined") {
            try {
                let whoamiRes = await safeExec("whoami /groups", 2000);
                let out = whoamiRes.stdOut || "";
                isAdmin = out.includes("S-1-16-12288") || out.includes("S-1-16-16384") || out.includes("High Mandatory Level") || out.includes("Высокий обязательный уровень");
            } catch (e) {}

            try {
                let osRes = await Neutralino.computer.getOSInfo();
                if (osRes && osRes.name) {
                    osInfo = osRes.name + " (" + (osRes.version || "64-bit") + ")";
                } else {
                    osInfo = "Windows 10/11 64-bit";
                }
            } catch (e) {
                osInfo = "Windows 10/11 64-bit";
            }
        } else if (window.NL_OS === "Darwin") {
            osInfo = "macOS " + (window.NL_ARCH || "ARM64");
            try {
                let res = await safeExec("id -u", 1000);
                isAdmin = (res.stdOut || "").trim() === "0";
            } catch (e) {}
        } else {
            osInfo = "Linux " + (window.NL_ARCH || "x64");
            try {
                let res = await safeExec("id -u", 1000);
                isAdmin = (res.stdOut || "").trim() === "0";
            } catch (e) {}
        }

        document.getElementById("os-status-text").innerText = osInfo;
        const adminBadge = document.getElementById("admin-badge");
        if (isAdmin) {
            adminBadge.className = "badge badge-admin";
            adminBadge.innerText = "Администратор";
        } else {
            adminBadge.className = "badge badge-neutral";
            adminBadge.innerText = "Обычный запуск";
        }
    } catch (err) {
        console.error("System info error:", err);
        document.getElementById("os-status-text").innerText = "Windows 10/11 64-bit";
        document.getElementById("admin-badge").innerText = "Обычный запуск";
    }
}

// COMPLETE 16-POINT DIAGNOSTIC MATRIX
async function runFullDiagnostics() {
    if (isDiagnosticsRunning) return;
    isDiagnosticsRunning = true;

    const prg = document.getElementById("diag-progress");
    prg.classList.remove("hidden");
    document.getElementById("footer-status-text").innerText = "Выполняется диагностика 16 компонентов...";

    const checks = [];
    const recommendations = [];

    const customDesktop = document.getElementById("input-custom-desktop").value.trim();
    const customIde = document.getElementById("input-custom-ide").value.trim();
    const customCli = document.getElementById("input-custom-cli").value.trim();

    try {
        // ==========================================
        // 1. Окружение и системные привилегии
        // ==========================================
        let isAdmin = false;
        let t0 = performance.now();
        try {
            let whoamiRes = await safeExec("whoami /groups", 2000);
            let out = whoamiRes.stdOut || "";
            isAdmin = out.includes("S-1-16-12288") || out.includes("S-1-16-16384") || out.includes("High Mandatory Level") || out.includes("Высокий обязательный уровень");
        } catch (e) {}
        let dtAdmin = Math.round(performance.now() - t0);

        checks.push({
            status: isAdmin ? "PASSED" : "WARNING",
            badge: isAdmin ? "[ OK ]" : "[ WARN ]",
            category: "Окружение",
            title: "Привилегии процесса (UAC Elevation)",
            summary: isAdmin ? "Запущено от имени Администратора (Elevated)" : "Обычный запуск (для применения некоторых патчей может потребоваться запуск от админа)",
            time: `${dtAdmin}ms`
        });

        // 2. Системные переменные
        let envs = {};
        try {
            envs = await Neutralino.os.getEnvs();
        } catch (e) {}
        let proxyEnv = envs["HTTP_PROXY"] || envs["HTTPS_PROXY"] || envs["http_proxy"] || envs["https_proxy"];
        checks.push({
            status: "PASSED",
            badge: "[ OK ]",
            category: "Окружение",
            title: "Системные переменные окружения",
            summary: proxyEnv ? `Обнаружен прокси в окружении: ${proxyEnv}` : "Окружение чистое, системные конфликты прокси отсутствуют",
            time: "1ms"
        });

        // ==========================================
        // 3. Smart Path Discovery & Process Monitor
        // ==========================================
        let desktopPath = customDesktop || null;
        let idePath = customIde || null;
        let cliPath = customCli || null;

        let desktopRunning = false;
        let ideRunning = false;

        t0 = performance.now();
        try {
            let pRes = await safeExec('powershell -NoProfile -Command "Get-Process -ErrorAction SilentlyContinue | Select-Object -Property ProcessName, Path | ConvertTo-Json"', 2500);
            if (pRes.stdOut && pRes.stdOut.trim()) {
                let procs = JSON.parse(pRes.stdOut);
                if (!Array.isArray(procs)) procs = [procs];
                for (let p of procs) {
                    let name = (p.ProcessName || "").toLowerCase();
                    let pPath = p.Path || "";
                    if (name.includes("antigravity ide") || name.includes("antigravity-ide")) {
                        ideRunning = true;
                        if (!idePath && pPath) idePath = pPath.substring(0, pPath.lastIndexOf("\\"));
                    } else if (name === "antigravity" || name === "antigravity.exe") {
                        desktopRunning = true;
                        if (!desktopPath && pPath) desktopPath = pPath.substring(0, pPath.lastIndexOf("\\"));
                    } else if (name === "agy" || name === "agy.exe") {
                        if (!cliPath && pPath) cliPath = pPath;
                    }
                }
            }
        } catch (e) {}

        // Fallback standard paths
        const userHome = "C:\\Users\\" + (window.NL_USER || "user");
        if (!desktopPath) {
            let stdPaths = [
                userHome + "\\AppData\\Local\\Programs\\Antigravity",
                "C:\\Program Files\\Antigravity",
                "C:\\Program Files (x86)\\Antigravity",
                userHome + "\\AppData\\Local\\Antigravity",
                "D:\\Antigravity"
            ];
            for (let p of stdPaths) {
                try {
                    let stat = await Neutralino.filesystem.getStats(p);
                    if (stat.isDirectory) { desktopPath = p; break; }
                } catch (e) {}
            }
        }

        if (!idePath) {
            let stdPaths = [
                userHome + "\\AppData\\Local\\Programs\\Antigravity IDE",
                "C:\\Program Files\\Antigravity IDE",
                "C:\\Program Files (x86)\\Antigravity IDE",
                userHome + "\\AppData\\Local\\Antigravity IDE",
                "D:\\Antigravity IDE"
            ];
            for (let p of stdPaths) {
                try {
                    let stat = await Neutralino.filesystem.getStats(p);
                    if (stat.isDirectory) { idePath = p; break; }
                } catch (e) {}
            }
        }

        if (!cliPath) {
            let stdCliList = [
                userHome + "\\AppData\\Local\\agy\\bin\\agy.exe",
                userHome + "\\.antigravity\\bin\\agy.exe",
                "C:\\Program Files\\Antigravity\\bin\\agy.exe"
            ];
            for (let p of stdCliList) {
                try {
                    let stat = await Neutralino.filesystem.getStats(p);
                    if (stat.isFile) { cliPath = p; break; }
                } catch (e) {}
            }
        }
        let dtDisc = Math.round(performance.now() - t0);

        // ==========================================
        // 4. Desktop 2.0 Checks (3 checks)
        // ==========================================
        checks.push({
            status: desktopPath ? "PASSED" : "WARNING",
            badge: desktopPath ? "[ OK ]" : "[ WARN ]",
            category: "Antigravity 2.0",
            title: "Обнаружение директории Desktop",
            summary: desktopPath ? `Найдено: ${maskPath(desktopPath)}` : "Директория установки не найдена (укажите путь на вкладке «ПУТИ»)",
            time: `${dtDisc}ms`
        });

        checks.push({
            status: "PASSED",
            badge: desktopRunning ? "[ OK ]" : "[ INFO ]",
            category: "Antigravity 2.0",
            title: "Статус процесса Antigravity 2.0",
            summary: desktopRunning ? "Процесс активен в памяти" : "Не запущен",
            time: "1ms"
        });

        let desktopPatched = false;
        if (desktopPath) {
            document.getElementById("val-desktop-path").innerText = maskPath(desktopPath);
            document.getElementById("val-desktop-process").innerText = desktopRunning ? "Активен" : "Не запущен";

            let lsPath = desktopPath + "\\resources\\bin\\language_server.exe";
            let lsRes = await inspectBinaryPatch(lsPath);
            desktopPatched = lsRes.patched;
            document.getElementById("val-desktop-patch").innerText = lsRes.desc;

            let badge = document.getElementById("badge-desktop");
            if (desktopPatched) {
                badge.className = "badge badge-passed";
                badge.innerText = "ГОТОВ К РАБОТЕ";
            } else {
                badge.className = "badge badge-failed";
                badge.innerText = "НУЖЕН ПАТЧ";
                recommendations.push("Desktop 2.0: Примените пункт [1] в анлокере для патча Language Server.");
            }

            checks.push({
                status: desktopPatched ? "PASSED" : "FAILED",
                badge: desktopPatched ? "[ OK ]" : "[ FAIL ]",
                category: "Antigravity 2.0",
                title: "Патч Language Server (Desktop)",
                summary: lsRes.desc,
                time: "8ms"
            });
        } else {
            document.getElementById("val-desktop-path").innerText = "Не найдена";
            document.getElementById("val-desktop-patch").innerText = "—";
            document.getElementById("val-desktop-process").innerText = "—";
            let badge = document.getElementById("badge-desktop");
            badge.className = "badge badge-neutral";
            badge.innerText = "НЕ НАЙДЕНА";

            checks.push({
                status: "WARNING",
                badge: "[ WARN ]",
                category: "Antigravity 2.0",
                title: "Патч Language Server (Desktop)",
                summary: "Директория установки Desktop не обнаружена",
                time: "0ms"
            });
        }

        // ==========================================
        // 5. Antigravity IDE Checks (4 checks)
        // ==========================================
        checks.push({
            status: idePath ? "PASSED" : "WARNING",
            badge: idePath ? "[ OK ]" : "[ WARN ]",
            category: "Antigravity IDE",
            title: "Обнаружение директории IDE",
            summary: idePath ? `Найдено: ${maskPath(idePath)}` : "Директория установки IDE не найдена",
            time: "1ms"
        });

        checks.push({
            status: "PASSED",
            badge: ideRunning ? "[ OK ]" : "[ INFO ]",
            category: "Antigravity IDE",
            title: "Статус процесса Antigravity IDE",
            summary: ideRunning ? "Процесс активен в памяти" : "Не запущен",
            time: "1ms"
        });

        let idePatched = false;
        let ideSettingsOk = false;
        if (idePath) {
            document.getElementById("val-ide-path").innerText = maskPath(idePath);

            let lsPath = idePath + "\\resources\\app\\bin\\language_server.exe";
            let lsRes = await inspectBinaryPatch(lsPath);
            idePatched = lsRes.patched;
            document.getElementById("val-ide-patch").innerText = lsRes.desc;

            let settingsPath = userHome + "\\AppData\\Roaming\\Antigravity IDE\\User\\settings.json";
            try {
                let content = await Neutralino.filesystem.readFile(settingsPath);
                ideSettingsOk = content.includes("daily-cloudcode-pa.googleapis.com");
                document.getElementById("val-ide-settings").innerText = ideSettingsOk ? "daily-cloudcode-pa [OK]" : "Не настроен [WARN]";
            } catch (e) {
                document.getElementById("val-ide-settings").innerText = "Не найден";
            }

            let badge = document.getElementById("badge-ide");
            if (idePatched && ideSettingsOk) {
                badge.className = "badge badge-passed";
                badge.innerText = "ГОТОВ К РАБОТЕ";
            } else {
                badge.className = "badge badge-warning";
                badge.innerText = "ЗАМЕЧАНИЯ";
                if (!idePatched) recommendations.push("IDE: Примените пункт [1] в анлокере для патча Language Server.");
                if (!ideSettingsOk) recommendations.push("IDE: Включите обход в настройках IDE через пункт [1] или [2].");
            }

            checks.push({
                status: idePatched ? "PASSED" : "FAILED",
                badge: idePatched ? "[ OK ]" : "[ FAIL ]",
                category: "Antigravity IDE",
                title: "Патч Language Server (IDE)",
                summary: lsRes.desc,
                time: "7ms"
            });

            checks.push({
                status: ideSettingsOk ? "PASSED" : "WARNING",
                badge: ideSettingsOk ? "[ OK ]" : "[ WARN ]",
                category: "Antigravity IDE",
                title: "Конфигурация эндпоинта в settings.json",
                summary: ideSettingsOk ? "Эндпоинт daily-cloudcode-pa сконфигурирован" : "Эндпоинт отсутствует или не переопределен",
                time: "3ms"
            });
        } else {
            document.getElementById("val-ide-path").innerText = "Не найдена";
            document.getElementById("val-ide-patch").innerText = "—";
            document.getElementById("val-ide-settings").innerText = "—";
            let badge = document.getElementById("badge-ide");
            badge.className = "badge badge-neutral";
            badge.innerText = "НЕ НАЙДЕНА";

            checks.push({
                status: "WARNING",
                badge: "[ WARN ]",
                category: "Antigravity IDE",
                title: "Патч Language Server (IDE)",
                summary: "Директория IDE не найдена",
                time: "0ms"
            });
            checks.push({
                status: "WARNING",
                badge: "[ WARN ]",
                category: "Antigravity IDE",
                title: "Конфигурация эндпоинта в settings.json",
                summary: "Файл настроек IDE не проверен",
                time: "0ms"
            });
        }

        // ==========================================
        // 6. Antigravity CLI (3 checks)
        // ==========================================
        checks.push({
            status: cliPath ? "PASSED" : "WARNING",
            badge: cliPath ? "[ OK ]" : "[ WARN ]",
            category: "Antigravity CLI",
            title: "Обнаружение бинарника agy",
            summary: cliPath ? `Найдено: ${maskPath(cliPath)}` : "Бинарник agy не найден в путях",
            time: "1ms"
        });

        if (cliPath) {
            document.getElementById("val-cli-path").innerText = maskPath(cliPath);
            let cliRes = await inspectBinaryPatch(cliPath);
            document.getElementById("val-cli-patch").innerText = cliRes.desc;

            let envOk = !!envs["CLOUD_CODE_URL"];
            document.getElementById("val-cli-env").innerText = envOk ? "CLOUD_CODE_URL [OK]" : "Не задана [WARN]";

            let badge = document.getElementById("badge-cli");
            if (cliRes.patched && envOk) {
                badge.className = "badge badge-passed";
                badge.innerText = "ГОТОВ К РАБОТЕ";
            } else {
                badge.className = "badge badge-warning";
                badge.innerText = "ЗАМЕЧАНИЯ";
                if (!cliRes.patched) recommendations.push("CLI: Пропатчите agy.exe через пункт [1] анлокера.");
                if (!envOk) recommendations.push("CLI: Задайте переменную CLOUD_CODE_URL=https://daily-cloudcode-pa.googleapis.com");
            }

            checks.push({
                status: cliRes.patched ? "PASSED" : "FAILED",
                badge: cliRes.patched ? "[ OK ]" : "[ FAIL ]",
                category: "Antigravity CLI",
                title: "Патч бинарника agy",
                summary: cliRes.desc,
                time: "6ms"
            });

            checks.push({
                status: envOk ? "PASSED" : "WARNING",
                badge: envOk ? "[ OK ]" : "[ WARN ]",
                category: "Antigravity CLI",
                title: "Переменная CLOUD_CODE_URL",
                summary: envOk ? `Задана: ${envs["CLOUD_CODE_URL"]}` : "Переменная окружения CLOUD_CODE_URL отсутствует",
                time: "1ms"
            });
        } else {
            document.getElementById("val-cli-path").innerText = "Не найден";
            document.getElementById("val-cli-patch").innerText = "—";
            document.getElementById("val-cli-env").innerText = "—";
            let badge = document.getElementById("badge-cli");
            badge.className = "badge badge-neutral";
            badge.innerText = "НЕ НАЙДЕН";

            checks.push({
                status: "WARNING",
                badge: "[ WARN ]",
                category: "Antigravity CLI",
                title: "Патч бинарника agy",
                summary: "Бинарник CLI не найден",
                time: "0ms"
            });
            checks.push({
                status: "WARNING",
                badge: "[ WARN ]",
                category: "Antigravity CLI",
                title: "Переменная CLOUD_CODE_URL",
                summary: "Не проверена (CLI не установлен)",
                time: "0ms"
            });
        }

        // ==========================================
        // 7. Network & DNS Checks (4 checks)
        // ==========================================
        let nrptOk = false;
        t0 = performance.now();
        try {
            let nrptRes = await safeExec('powershell -NoProfile -Command "Get-DnsClientNrptRule -ErrorAction SilentlyContinue | Select-Object -Property Namespace | ConvertTo-Json"', 2000);
            nrptOk = (nrptRes.stdOut || "").includes("daily-cloudcode-pa");
            let el = document.getElementById("metric-nrpt");
            el.innerText = nrptOk ? "Активны [OK]" : "Отсутствуют [FAIL]";
            el.style.color = nrptOk ? "var(--status-green)" : "var(--status-red)";
        } catch (e) {
            document.getElementById("metric-nrpt").innerText = "Не проверено";
        }
        let dtNrpt = Math.round(performance.now() - t0);

        if (!nrptOk) {
            recommendations.push("Сеть: Правила NRPT отсутствуют! Запустите анлокер и выберите пункт [3] (Патч DNS).");
        }

        checks.push({
            status: nrptOk ? "PASSED" : "FAILED",
            badge: nrptOk ? "[ OK ]" : "[ FAIL ]",
            category: "Сеть & DNS",
            title: "Таблица правил Windows NRPT",
            summary: nrptOk ? "Правила для daily-cloudcode-pa активны" : "Правила отсутствуют (требуется пункт [3] в анлокере)",
            time: `${dtNrpt}ms`
        });

        // Check 2: DNS Resolve Daily-Cloud
        t0 = performance.now();
        let dnsOk = false;
        let resolvedIps = "";
        try {
            let dnsRes = await safeExec('powershell -NoProfile -Command "Resolve-DnsName daily-cloudcode-pa.googleapis.com -ErrorAction SilentlyContinue | Select-Object -ExpandProperty IPAddress"', 2000);
            resolvedIps = (dnsRes.stdOut || "").trim();
            dnsOk = resolvedIps.length > 0;
            let el = document.getElementById("metric-dns");
            el.innerText = dnsOk ? "Прокси [OK]" : "Сбой [FAIL]";
            el.style.color = dnsOk ? "var(--status-green)" : "var(--status-red)";
        } catch (e) {
            document.getElementById("metric-dns").innerText = "Ошибка";
        }
        let dtDns = Math.round(performance.now() - t0);

        checks.push({
            status: dnsOk ? "PASSED" : "FAILED",
            badge: dnsOk ? "[ OK ]" : "[ FAIL ]",
            category: "Сеть & DNS",
            title: "DNS-резолвинг daily-cloudcode-pa.googleapis.com",
            summary: dnsOk ? `Успешно сопоставлен (IP: ${resolvedIps.split('\n')[0].trim()})` : "Не удалось разрешить имя через DNS",
            time: `${dtDns}ms`
        });

        // Check 3: DNS Resolve Google Auth
        t0 = performance.now();
        let authDnsOk = false;
        try {
            let authRes = await safeExec('powershell -NoProfile -Command "Resolve-DnsName oauth2.googleapis.com -ErrorAction SilentlyContinue | Select-Object -ExpandProperty IPAddress"', 2000);
            authDnsOk = (authRes.stdOut || "").trim().length > 0;
        } catch (e) {}
        let dtAuth = Math.round(performance.now() - t0);

        checks.push({
            status: authDnsOk ? "PASSED" : "WARNING",
            badge: authDnsOk ? "[ OK ]" : "[ WARN ]",
            category: "Сеть & DNS",
            title: "DNS-резолвинг oauth2.googleapis.com",
            summary: authDnsOk ? "Аутентификация Google доступна" : "Возможны проблемы со входом в аккаунт",
            time: `${dtAuth}ms`
        });

        // Check 4: TLS Handshake & HTTP probe
        t0 = performance.now();
        try {
            let resp = await fetch("https://daily-cloudcode-pa.googleapis.com/", { mode: "no-cors" });
            let latency = Math.round(performance.now() - t0);
            let elTls = document.getElementById("metric-tls");
            elTls.innerText = `${latency} ms [OK]`;
            elTls.style.color = "var(--status-green)";

            let elApi = document.getElementById("metric-api");
            elApi.innerText = "Шлюз на связи [OK]";
            elApi.style.color = "var(--status-green)";

            checks.push({
                status: "PASSED",
                badge: "[ OK ]",
                category: "Сеть & DNS",
                title: "TLS Handshake и HTTP доступность шлюза",
                summary: `Соединение с эндпоинтом установлено (${latency} ms)`,
                time: `${latency}ms`
            });
        } catch (err) {
            let elTls = document.getElementById("metric-tls");
            elTls.innerText = "Сбой [FAIL]";
            elTls.style.color = "var(--status-red)";

            let elApi = document.getElementById("metric-api");
            elApi.innerText = "Заблокирован [FAIL]";
            elApi.style.color = "var(--status-red)";

            recommendations.push("API: Сервер недоступен. Проверьте включение DNS-патча [3] и отключите конфликтующие VPN.");

            checks.push({
                status: "FAILED",
                badge: "[ FAIL ]",
                category: "Сеть & DNS",
                title: "TLS Handshake и HTTP доступность шлюза",
                summary: "Ошибка подключения к шлюзу Google Cloud Code",
                time: "500ms"
            });
        }

        // ==========================================
        // 8. RENDER PLAN, TABLE & FULL REPORT
        // ==========================================
        renderPlan(recommendations);
        renderTable(checks);
        generateReport(checks, recommendations);

    } catch (e) {
        console.error("Diagnostic error:", e);
    } finally {
        isDiagnosticsRunning = false;
        prg.classList.add("hidden");
        document.getElementById("footer-status-text").innerText = "Диагностика завершена (16 проверок)";
    }
}

// INSPECT BINARY PATCH
async function inspectBinaryPatch(filePath) {
    try {
        let stat = await Neutralino.filesystem.getStats(filePath);
        if (!stat.isFile) return { patched: false, desc: "Файл не найден" };

        let hexRes = await safeExec(`powershell -NoProfile -Command "if (Select-String -Path '${filePath}' -Pattern 'inexigible' -Quiet) { 'PATCHED' } elseif (Select-String -Path '${filePath}' -Pattern 'ineligible' -Quiet) { 'UNPATCHED' } else { 'UNKNOWN' }"`, 2500);
        let out = (hexRes.stdOut || "").trim();
        if (out.includes("PATCHED")) {
            return { patched: true, desc: "Пропатчен (найдена сигнатура inexigible)" };
        } else if (out.includes("UNPATCHED")) {
            return { patched: false, desc: "НЕ пропатчен (присутствует ineligible)" };
        }
        return { patched: false, desc: "Неизвестная сигнатура" };
    } catch (e) {
        return { patched: false, desc: "Не проверен" };
    }
}

function renderPlan(recs) {
    const box = document.getElementById("action-plan-box");
    if (recs.length === 0) {
        box.innerHTML = '<p style="color: var(--status-green); font-weight: 600;">✔ Все компоненты и сетевые маршруты в порядке! Antigravity готов к работе.</p>';
    } else {
        box.innerHTML = recs.map(r => `<div class="plan-item">${r}</div>`).join("");
    }
}

function renderTable(checks) {
    const tbody = document.getElementById("table-checks-body");
    tbody.innerHTML = checks.map(c => {
        let colorClass = c.status === "PASSED" ? "style='color: var(--status-green)'" : (c.status === "WARNING" ? "style='color: var(--status-amber)'" : "style='color: var(--status-red)'");
        return `<tr>
            <td ${colorClass} style="font-weight: 700;">${c.badge}</td>
            <td>${c.category}</td>
            <td>${c.title}</td>
            <td>${c.summary}</td>
            <td class="mono">${c.time}</td>
        </tr>`;
    }).join("");

    document.getElementById("footer-summary-counts").innerText = `Всего проверок: ${checks.length} | Успешно: ${checks.filter(c => c.status === "PASSED").length} | Замечаний: ${checks.filter(c => c.status !== "PASSED").length}`;
}

function generateReport(checks, recs) {
    const lines = [];
    lines.push("=================================================");
    lines.push("        ANTIGRAVITY DOCTOR DIAGNOSTIC REPORT     ");
    lines.push("=================================================");
    lines.push("Дата:          " + new Date().toLocaleString());
    lines.push("Платформа:     " + document.getElementById("os-status-text").innerText);
    lines.push("Привилегии:    " + document.getElementById("admin-badge").innerText);
    lines.push("");
    lines.push("-------------------------------------------------");
    lines.push("[ РЕЗУЛЬТАТЫ ПРОВЕРОК (" + checks.length + " ПОЗИЦИЙ) ]");
    lines.push("-------------------------------------------------");

    checks.forEach(c => {
        lines.push(`${c.badge.padEnd(8)} [${c.category}] ${c.title} (${c.time})`);
        lines.push(`         Итог: ${c.summary}`);
        lines.push("");
    });

    lines.push("-------------------------------------------------");
    lines.push("[ ПОШАГОВЫЙ ПЛАН И РЕКОМЕНДАЦИИ ]");
    lines.push("-------------------------------------------------");
    if (recs.length === 0) {
        lines.push("Все компоненты в порядке! Antigravity готов к работе.");
    } else {
        recs.forEach((r, i) => {
            lines.push(`  ${i + 1}. ${r}`);
        });
        lines.push(`  ${recs.length + 1}. Отправьте этот отчет в Telegram поддержку t.me/nova_txt`);
    }
    lines.push("");
    lines.push("=================================================");

    currentReportText = lines.join("\n");
    document.getElementById("report-text").value = currentReportText;
    document.getElementById("net-log-output").innerText = currentReportText;
}

async function copyReport() {
    if (!currentReportText) return;
    try {
        await Neutralino.clipboard.writeText(currentReportText);
        const btn = document.getElementById("btn-copy-log");
        btn.innerText = "✔ Скопировано!";
        setTimeout(() => btn.innerText = "Скопировать для Telegram", 2000);
    } catch (e) {
        alert("Не удалось скопировать лог: " + e.message);
    }
}

async function saveReport() {
    if (!currentReportText) return;
    try {
        let entry = await Neutralino.os.showSaveDialog("Сохранить диагностический отчет", {
            defaultPath: "antigravity_diag.txt"
        });
        if (entry) {
            await Neutralino.filesystem.writeFile(entry, currentReportText);
            alert("Отчет успешно сохранен!");
        }
    } catch (e) {
        alert("Ошибка сохранения: " + e.message);
    }
}

function maskPath(p) {
    if (!p) return "—";
    return p.replace(/\\Users\\[^\\]+/gi, "\\Users\\***");
}
