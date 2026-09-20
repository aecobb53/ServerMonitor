const gamesDiv = document.getElementById("games");

function parseUtcTimestamp(timestamp) {
    if (!timestamp) {
        return null;
    }

    if (typeof timestamp !== "string") {
        const dt = new Date(timestamp);
        return Number.isNaN(dt.getTime()) ? null : dt;
    }

    let normalized = timestamp.trim();

    if (normalized.includes(" ") && !normalized.includes("T")) {
        normalized = normalized.replace(" ", "T");
    }

    if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(normalized)) {
        normalized = `${normalized}Z`;
    }

    const dt = new Date(normalized);
    return Number.isNaN(dt.getTime()) ? null : dt;
}

function formatLocalTime(timestamp) {
    const dt = parseUtcTimestamp(timestamp);
    if (!dt) {
        return timestamp ?? "";
    }
    return dt.toLocaleString();
}

async function refresh() {
    const response = await fetch("/api/server-status");
    const data = await response.json();

    gamesDiv.innerHTML = "";

    for (const game of data.games) {

        const section = document.createElement("section");
        section.className = "game-section";

        section.innerHTML = `
            <h2 class="game-title">${game.name}</h2>
            <div class="server-grid"></div>
        `;

        const grid = section.querySelector(".server-grid");

        for (const server of game.servers) {

            const image = String(server.game ?? "unknown");

            const card = document.createElement("div");
            card.className = "server-card";
            card.addEventListener("click", () => {
                window.location.href = `/server/${encodeURIComponent(server.name)}`;
            });

            card.innerHTML = `
                <div class="server-header">

                    <div class="server-info">
                        <img src="/static/images/${image}.png">

                        <div>
                            <div class="server-name">${server.name}</div>
                        </div>
                    </div>

                    <div class="status ${server.server_status.toLowerCase()}">
                        ${server.server_status}
                    </div>

                </div>

                <div class="server-message">
                    ${server.last_message}
                </div>

                <div class="server-updated">
                    ${formatLocalTime(server.updated)}
                </div>
            `;

            const cardImage = card.querySelector("img");
            cardImage.addEventListener("error", () => {
                cardImage.src = "/static/images/unknown.png";
            }, { once: true });

            grid.appendChild(card);
        }

        gamesDiv.appendChild(section);
    }
}

refresh();
setInterval(refresh, 2000);