console.log("Script is running!");

class UserAPI {
    constructor() {
        this.baseUrl = "http://localhost:8080/auth";
        this.sessionID = null;
    }

    async login(username, password) {

        const loginURL = `${this.baseUrl}/login`;

        const result = await fetch(loginURL, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({username, password})
            });

            if (!result.ok) throw new Error("Login failed: " + result.statusText);

            const data = await result.json();

            this.sessionID = data.sessionID;
            sessionStorage.setItem("SessionID", data.sessionID);

            return data;
    }

    async register(username, password) {

        console.log("=== Sending Register Request ===");


        const registerURL = `${this.baseUrl}/register`;
        try {
            const result = await fetch(registerURL, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({username, password})
            });

            console.log("Response Status:", result.status, result.statusText);

            const data = await result.text().catch(() => {
                console.log("Response could not be parsed.");
                return null;
            });

            console.log("Data received:", data);

            if (!result.ok) {
                throw new Error(`Registration failed: ${data}`);
            }

            return { message: data };

        } catch (error) {
            console.error("Fetch Error:", error);
            throw error;
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
        const registerBtn = document.getElementById("registerBtn");

        if (!loginBtn || !registerBtn) {
            console.error("Buttons not found!");
            return;
        }

        loginBtn.addEventListener("click", () => this.handleLogin());
        registerBtn.addEventListener("click", () => this.handleRegister());
    }

    async handleLogin() {

        const usernameElement = document.getElementById("authUsername");
        const passwordElement = document.getElementById("authPassword");
        const feedbackElement = document.getElementById("authFeedback");

        if (!usernameElement || !passwordElement || !feedbackElement) {
            console.error("Required elements not found!");
            return;
        }

        const username = usernameElement.value.trim();
        const password = passwordElement.value.trim();

        if (!username || !password) {
            feedbackElement.textContent = "Please enter both username and password";
            return;
        }

        try {
            const result = await this.api.login(username, password);
            console.log("Login successful:", result);
            window.location.href = "/public/home/index.html";

        } catch (err) {
            console.log("Login error:", err);
            feedbackElement.textContent = `Login error: ${err.message}`;
        }
    }

    async handleRegister() {

        const usernameElement = document.getElementById("authUsername");
        const passwordElement = document.getElementById("authPassword");
        const feedbackElement = document.getElementById("authFeedback");

        if (!usernameElement || !passwordElement || !feedbackElement) {
            console.error("Required elements not found!");
            return;
        }

        const username = usernameElement.value.trim();
        const password = passwordElement.value.trim();

        if (!username || !password) {
            feedbackElement.textContent = "Please enter both username and password";
            return;
        }

        try {
            const result = await this.api.register(username, password);
            console.log("Registration successful:", result);
            feedbackElement.textContent = result.message;
        } catch (err) {
            console.log("Registration error:", err);
            feedbackElement.textContent = `Registration error: ${err.message}`;
        }
    }
}

// Initialize immediately - no DOMContentLoaded needed since script is at the end of body
console.log("Initializing app...");
new App();