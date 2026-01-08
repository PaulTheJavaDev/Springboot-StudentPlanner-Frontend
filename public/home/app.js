// API Endpoints
const API_URL = `${window.location.protocol}//${window.location.hostname}:8080`;
const API_BASE_URL = `${API_URL}/schedule/me`;
const sessionID = sessionStorage.getItem('SessionID');

// Redirect to login if no sessionID
if (!sessionID) {
    window.location.href = '/public/login/index.html';
}

// GET request to fetch schedule data
async function apiGet() {
    const res = await fetch(API_BASE_URL, {
        method: 'GET',
        headers: { 'SessionID': sessionID }
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
}

// PUT request to save day data
async function apiPut(url, body) {
    const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'SessionID': sessionID },
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
}

// Context menu creation
function createMenu(options, button) {
    const menu = document.createElement('div');
    menu.className = 'contextMenu';

    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.textContent = opt.label;
        btn.onclick = () => {
            opt.action();
            menu.style.display = 'none';
        };
        menu.appendChild(btn);
    });

    document.body.appendChild(menu);

    // Show menu
    button.onclick = () => {
        const rect = button.getBoundingClientRect();
        menu.style.top = `${rect.bottom + window.scrollY + 5}px`;
        menu.style.left = `${rect.left + window.scrollX}px`;
        menu.style.display = 'block';

        const handleClickOutside = (event) => {
            if (!menu.contains(event.target) && event.target !== button) {
                menu.style.display = 'none';
                document.removeEventListener('click', handleClickOutside);
            }
        };
        document.addEventListener('click', handleClickOutside);
    };

    return menu;
}

// Create Timestamp Element
function createTimeStampElement(dayOfWeek, data) {

    const div = document.createElement('div');
    div.className = data.type;
    div.dataset.type = data.type;
    div.style.position = 'relative';
    div.style.backgroundColor = data.type === 'lesson' ? '#e0f7fa' : '#fff3e0';

    const span = document.createElement('span');
    span.textContent = data.text;
    div.appendChild(span);

    const editButton = document.createElement('button');
    editButton.className = 'editButton';
    editButton.textContent = '⋮'; // three-dot menu
    div.appendChild(editButton);

    // Context Menu Options
    const options = [];
    if (data.type === 'lesson') {
    options.push({
        label: 'Edit',
        action: async () => {
            // Get available Subjects
            const lessonOptions = await getSubjects();

            // Create select element
            const select = document.createElement('select');
            lessonOptions.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                
                // Set selected option
                if (name === span.textContent) {
                    option.selected = true;
                }
            
                select.appendChild(option);
            });

            // Replace span with select
            span.replaceWith(select);
            select.focus();

            // Save selection
            const saveSelection = async () => {
                span.textContent = select.value;
                select.replaceWith(span);
                await saveDay(dayOfWeek);
            };

            select.addEventListener('change', saveSelection);
            select.addEventListener('blur', saveSelection);
        }
    });
}

    // Delete option
    options.push({
        label: 'Delete',
        action: async () => {
            div.remove();
            await saveDay(dayOfWeek);
        }
    });

    createMenu(options, editButton);

    return div;
}

// Load Schedule
async function loadSchedule() {
    try {
        const days = await apiGet();
        days.forEach(day => {
            const container = document.getElementById(day.dayOfWeek);
            if (!container) return;

            // Clear old elements
            container.querySelectorAll('.lesson, .break').forEach(e => e.remove());

            day.timeStamps.forEach(timestamp => {
                container.appendChild(createTimeStampElement(day.dayOfWeek, timestamp));
            });
        });
    } catch (err) {
        console.error('Error loading schedule:', err);
    }
}

// Get Subjects
async function getSubjects() {

    const result = await fetch(`${API_URL}/subjects`, {
        method: 'GET',
        headers: {
            'SessionID': sessionID
        }
    });

    if (!result.ok) {
        throw new Error(`HTTP error! status: ${result.status}`);
    }

    return await result.json();
}

// Save Day
async function saveDay(dayOfWeek) {
    const container = document.getElementById(dayOfWeek);
    const timeStamps = Array.from(container.querySelectorAll('.lesson, .break')).map(el => {
        const span = el.querySelector('span');
        return {
            type: el.dataset.type,
            text: span ? span.textContent : ''
        };
    });
    await apiPut(`${API_BASE_URL}/${dayOfWeek}`, { timeStamps });
}

// Add Timestamp
async function addItem(dayOfWeek, type) {
    const container = document.getElementById(dayOfWeek);
    const newTimeStamp = createTimeStampElement(dayOfWeek, {
        type,
        text: type === 'lesson' ? 'Lesson' : 'Break'
    });

    container.appendChild(newTimeStamp);
    await saveDay(dayOfWeek);
}

// Bindings
document.querySelectorAll('.addLesson').forEach(button => {
    button.onclick = e => addItem(e.target.closest('.hoursContainer').id, 'lesson');
});

document.querySelectorAll('.addBreak').forEach(button => {
    button.onclick = e => addItem(e.target.closest('.hoursContainer').id, 'break');
});

// Initialisation
window.addEventListener('DOMContentLoaded', loadSchedule);
