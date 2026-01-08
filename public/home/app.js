const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:8080/schedule/me`;
const sessionID = sessionStorage.getItem('SessionID');

if (!sessionID) {
    window.location.href = '/public/login/index.html';
}

async function apiGet(url) {
    const result = await fetch(url, {
        method: 'GET',
        headers: {
            'SessionID': sessionID
        }
    });

    if (!result.ok) throw new Error(`HTTP error! status: ${result.status}`);
    return result.json();
}

async function apiPut(url, body) {
    const result = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'SessionID': sessionID
        },
        body: JSON.stringify(body)
    });

    if (!result.ok) throw new Error(`HTTP error! status: ${result.status}`);
    return result.json();
}

// --- Create TimeStamp DOM element ---
function createTimeStampElement(dayOfWeek, data) {
    const div = document.createElement('div');
    div.className = data.type;
    div.dataset.type = data.type;

    const span = document.createElement('span');
    span.textContent = data.text;

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '❌';
    deleteBtn.onclick = async () => {
        div.remove();
        await saveDay(dayOfWeek);
    };

    div.appendChild(span);
    div.appendChild(deleteBtn);
    return div;
}

// --- Load Schedule ---
async function loadSchedule() {
    try {
        const days = await apiGet(API_BASE_URL);

        days.forEach(day => {
            const container = document.getElementById(day.dayOfWeek);
            if (!container) return;

            // Lösche nur alte TimeStamps, nicht Header/Buttons
            container.querySelectorAll('.lesson, .break').forEach(e => e.remove());

            day.timeStamps.forEach(ts => {
                container.appendChild(createTimeStampElement(day.dayOfWeek, ts));
            });
        });
    } catch (err) {
        console.error('Error loading schedule:', err);
    }
}

// --- Save Day ---
async function saveDay(dayOfWeek) {
    const container = document.getElementById(dayOfWeek);
    const timeStamps = [];

    container.querySelectorAll('.lesson, .break').forEach(el => {
        const span = el.querySelector('span');
        timeStamps.push({
            type: el.dataset.type,
            text: span ? span.textContent : ''
        });
    });

    await apiPut(`${API_BASE_URL}/${dayOfWeek}`, { timeStamps });
}

// --- Add Lesson/Break ---
async function addItem(dayOfWeek, type) {
    const container = document.getElementById(dayOfWeek);
    const newEl = createTimeStampElement(dayOfWeek, {
        type,
        text: type === 'lesson' ? 'New Lesson' : 'New Break'
    });
    container.appendChild(newEl);
    await saveDay(dayOfWeek);
}

// --- Button Bindings ---
document.querySelectorAll('.addLesson').forEach(btn => {
    btn.onclick = e => {
        const day = e.target.closest('.hoursContainer').id;
        addItem(day, 'lesson');
    };
});

document.querySelectorAll('.addBreak').forEach(btn => {
    btn.onclick = e => {
        const day = e.target.closest('.hoursContainer').id;
        addItem(day, 'break');
    };
});

// --- Initial Load ---
window.addEventListener('DOMContentLoaded', loadSchedule);
