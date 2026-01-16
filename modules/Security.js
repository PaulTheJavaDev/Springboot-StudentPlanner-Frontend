export function getSessionID() {
    return sessionStorage.getItem("SessionID");
}

export function validateSessionAuth() {

    const SessionID = getSessionID();

    if (!SessionID || SessionID.trim() === "" || SessionID === "null") {
        window.location.href = "/public/login/index.html";
    }
    
}