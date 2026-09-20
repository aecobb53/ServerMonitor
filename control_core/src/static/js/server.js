const pageRoot = document.getElementById("server-page");
const serverName = pageRoot.dataset.serverName;

const notFoundBanner = document.getElementById("server-not-found");
const serverContent = document.getElementById("server-content");

const serverTitle = document.getElementById("server-title");
const serverDescription = document.getElementById("server-description");
const serverGame = document.getElementById("server-game");
const containerStatus = document.getElementById("container-status");
const serverUpdated = document.getElementById("server-updated");
const serverStatusBadge = document.getElementById("server-status-badge");
const statusHistory = document.getElementById("status-history");

function formatLocalTime(timestamp) {
    if (!timestamp) {
        return "";
    }

    let normalized = String(timestamp).trim();
    if (normalized.includes(" ") && !normalized.includes("T")) {
        normalized = normalized.replace(" ", "T");
    }
    if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(normalized)) {
        normalized = `${normalized}Z`;
    }

    const dt = new Date(normalized);
    if (Number.isNaN(dt.getTime())) {
        return timestamp;
    }

    return dt.toLocaleString();
}

function showNotFound(message) {
    notFoundBanner.textContent = message;
    notFoundBanner.classList.remove("hidden");
    serverContent.classList.add("hidden");
    document.title = "Server Monitor - Not Found";
}

function renderHistory(serverStatusList) {
    statusHistory.innerHTML = "";

    for (const item of serverStatusList) {
        const row = document.createElement("div");
        row.className = "history-row";

        const statusClass = String(item.status || "UNKNOWN").toLowerCase();

        row.innerHTML = `
            <div class="history-top">
                <span class="status ${statusClass}">${item.status ?? "UNKNOWN"}</span>
                <span class="history-time">${formatLocalTime(item.timestamp ?? "")}</span>
            </div>
            <div class="history-message">${item.message ?? ""}</div>
        `;

        statusHistory.appendChild(row);
    }
}

async function refresh() {
    const response = await fetch(`/api/server-info/${encodeURIComponent(serverName)}`);

    if (response.status === 404) {
        showNotFound(`404 - Server '${serverName}' was not found.`);
        return;
    }

    if (!response.ok) {
        showNotFound("Unable to load server details right now.");
        return;
    }

    const data = await response.json();

    if (data.Error) {
        showNotFound(`404 - ${data.Error}`);
        return;
    }

    notFoundBanner.classList.add("hidden");
    serverContent.classList.remove("hidden");

    const displayName = data.display_name ?? data.server_name ?? serverName;
    document.title = `Server Monitor - ${displayName}`;

    serverTitle.textContent = displayName;
    serverDescription.textContent = data.description ?? "";
    serverGame.textContent = data.game ?? "Unknown";
    containerStatus.textContent = data.container_status ?? "UNKNOWN";
    serverUpdated.textContent = formatLocalTime(data.timestamp ?? "");

    const statusText = data.display_status ?? "UNKNOWN";
    serverStatusBadge.textContent = statusText;
    serverStatusBadge.className = `status ${String(statusText).toLowerCase()}`;

    renderHistory(data.server_status_list ?? []);
}

refresh();
setInterval(refresh, 2000);
