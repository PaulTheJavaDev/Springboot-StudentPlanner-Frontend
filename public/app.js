class UserAPI {
    constructor() {
        this.baseUrl = "http://localhost:8080/auth";
        this.sessionID = null;
    }

    async login(username, password) {
        console.log("=== Sending Login Request ===");
        console.log("Daten, die gesendet werden:", {username, password});

        try {
            const res = await fetch(`${this.baseUrl}/login`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({username, password})
            });

            console.log("Response Status:", res.status, res.statusText);

            const data = await res.json().catch(() => {
                console.log("Response konnte nicht als JSON geparsed werden.");
                return null;
            });

            console.log("Daten, die empfangen wurden:", data);

            if (!res.ok) throw new Error("Login fehlgeschlagen");

            this.sessionID = data.sessionID;
            return data;

        } catch (err) {
            console.error("Fetch Fehler:", err);
            throw err;
        }
    }
}

class App {
    constructor() {
        this.api = new UserAPI();
        this.bindUI();
    }

    bindUI() {
        const loginBtn = document.getElementById("loginBtn");
        loginBtn.addEventListener("click", () => this.handleLogin());
    }

    async handleLogin() {
        console.log("Login Button gedrückt!");
        const username = document.getElementById("loginUsername").value;
        const password = document.getElementById("loginPassword").value;

        try {
            const result = await this.api.login(username, password);
            console.log("Login erfolgreich:", result);
            document.getElementById("loginResult").textContent =
                `Login erfolgreich! SessionID: ${result.sessionID}`;
        } catch (err) {
            console.log("Login Fehler:", err);
            document.getElementById("loginResult").textContent = err.message;
        }
    }
}

window.addEventListener("DOMContentLoaded", () => new App());
