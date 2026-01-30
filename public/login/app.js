import { getSessionID } from "/modules/Security.js";
import { LOGIN_URL, REGISTER_URL } from "/modules/Config.js";

let sessionID = getSessionID();

// User is logged in
if (sessionID !== null) {
    window.location.href = "../home/index.html";
}

async function login(username, password) {
    
    try {
        const result = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
        });
    
        if (!result.ok) {
            feedbackElement.textContent = "Login failed: " + result.statusText;
            return;
        }
    
        const data = await result.json();
        sessionID = data.sessionID;
        sessionStorage.setItem("SessionID", data.sessionID);

    } catch (error) {
        feedbackElement.textContent = "Something went wrong.";
    }
    return;
}

async function register(username, password) {

    try {
        const result = await fetch(REGISTER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        console.log("Response Status:", result.status, result.statusText);

        const data = await result.text().catch(() => {
            feedbackElement.textContent = "Response could not be parsed.";
            return;
        });

        console.log("Data received:", data);

        if (!result.ok) {
            feedbackElement.textContent = "Registration failed: ${data}";
            return;
        }

        return { message: data };
    } catch (error) {
        feedbackElement.textContent = "Something went wrong.";
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
    } catch (error) {
        feedbackElement.textContent = "Login error occured.";
    }
}

async function handleRegister() {
    const usernameElement = document.getElementById("authUsername");
    const passwordElement = document.getElementById("authPassword");
    const feedbackElement = document.getElementById("authFeedback");

    const username = usernameElement.value.trim();
    const password = passwordElement.value.trim();

    if (!username || !password) {
        feedbackElement.textContent = "Please enter both username and password.";
        return;
    }

    try {
        await register(username, password);
        await login(username, password)
        window.location.href = "/public/home";
    } catch (err) {
        feedbackElement.textContent = "Registration error";
        return;
    }
}

function bindUI() {
    const loginBtn = document.getElementById("loginBtn");
    const registerBtn = document.getElementById("registerBtn");

    loginBtn.addEventListener("click", () => handleLogin());
    registerBtn.addEventListener("click", () => handleRegister());
}

bindUI();