const baseUrl = "http://localhost:8080/auth";
let sessionID = null;

async function login(username, password) {
    const loginURL = `${baseUrl}/login`;
    const result = await fetch(loginURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    if (!result.ok) {
        throw new Error("Login failed: " + result.statusText);
    }

    const data = await result.json();
    sessionID = data.sessionID;
    sessionStorage.setItem("SessionID", data.sessionID);
    return;
}

async function register(username, password) {
    const registerURL = `${baseUrl}/register`;

    try {
        const result = await fetch(registerURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
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
        throw error;
    }
}

async function handleLogin() {
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
        await login(username, password);
        window.location.href = "/public/home";
    } catch (err) {
        feedbackElement.textContent = `Login error: ${err.body}`;
    }
}

async function handleRegister() {
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
        await register(username, password);
        login(username, password)
        window.location.href = "/public/home";
    } catch (err) {
        feedbackElement.textContent = `Registration error: ${err.body}`;
        return;
    }
}

function bindUI() {
    const loginBtn = document.getElementById("loginBtn");
    const registerBtn = document.getElementById("registerBtn");

    if (!loginBtn || !registerBtn) {
        console.error("Buttons not found!");
        return;
    }

    loginBtn.addEventListener("click", () => handleLogin());
    registerBtn.addEventListener("click", () => handleRegister());
}

bindUI();