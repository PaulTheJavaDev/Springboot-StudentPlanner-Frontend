// API Endpoints
const API_URL = `${window.location.protocol}//${window.location.hostname}:8080`;
const API_BASE_URL = `${API_URL}/schedule/me`;
const sessionID = sessionStorage.getItem('SessionID');

// Redirect to login if no SessionID
if (!sessionID) {
    window.location.href = '/public/login/index.html';
}

// GET request to fetch schedule data
async function apiGet() {
    const result = await fetch(API_BASE_URL, {
        method: 'GET',
        headers: {
            'SessionID': sessionID
        }
    });
    if (!result.ok) throw new Error(`HTTP error! status: ${result.status}`);
    return result.json();
}

async function apiDeleteTimeStamp(dayOfWeek, timestampID) {
    const result = await fetch(`${API_BASE_URL}/${dayOfWeek}/${timestampID}`, {
        method: 'DELETE',
        headers: {
            'SessionID': sessionID
        }
    });
    if (!result.ok) throw new Error(`HTTP error! status: ${result.status}`);
    console.log("Successfully deleted timestamp");
}

// Data Creation
async function apiCreateTimeStamp(dayOfWeek, type, text) {
    const res = await fetch(`${API_BASE_URL}/${dayOfWeek}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'SessionID': sessionID
        },
        body: JSON.stringify({ type, text })
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
}

async function apiUpdateTimeStamp(dayOfWeek, timestampID, data) {
    const res = await fetch(`${API_BASE_URL}/${dayOfWeek}/${timestampID}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'SessionID': sessionID
        },
        body: JSON.stringify(data)
    });
    console.log(data);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
}

async function getSubjects() {
    const res = await fetch(`${API_URL}/subjects`, {
        method: 'GET',
        headers: {
            'SessionID': sessionID
        }
    });
    if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
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
    menu.style.position = 'absolute';
    menu.style.top = '0';
    menu.style.left = '100%';
    menu.style.display = 'none';

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

// Create Timestamp Element | Data -> Element
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
    editButton.textContent = '⋮';
    div.appendChild(editButton);

    const options = [];

    if (data.type === 'lesson') {
        options.push({
            label: 'Edit',
            action: async () => {
                const lessonOptions = await getSubjects();
                const select = document.createElement('select');

                lessonOptions.forEach(name => {
                    const option = document.createElement('option');
                    option.value = name;
                    option.textContent = name;
                    if (name === span.textContent) option.selected = true;
                    select.appendChild(option);
                });

                span.replaceWith(select);
                select.focus();

                const restoreSpan = async () => {
                    span.textContent = select.value;
                    await apiUpdateTimeStamp(dayOfWeek, data.id, { text: select.value });
                    data.text = select.value;
                    select.replaceWith(span);
                };

                select.addEventListener('change', restoreSpan);
                select.addEventListener('blur', restoreSpan);
            }
        });
    }

    const menu = createMenu(options, editButton);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = async () => {
        div.remove();
        menu.remove();
        await apiDeleteTimeStamp(dayOfWeek, data.id);
    };
    menu.appendChild(deleteBtn);

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

            // Sort timestamps by ID before rendering
            const sortedTimestamps = [...day.timeStamps].sort((a, b) => a.id - b.id);
            
            sortedTimestamps.forEach(timestamp => {
                container.appendChild(createTimeStampElement(day.dayOfWeek, timestamp));
            });
        });
    } catch (err) {
        console.error('Error loading schedule: ', err);
    }
}

async function addItem(dayOfWeek, type) {
    const container = document.getElementById(dayOfWeek);
    const timestamp = await apiCreateTimeStamp(dayOfWeek, type, type === 'lesson' ? 'Lesson' : 'Break');
    container.appendChild(createTimeStampElement(dayOfWeek, timestamp));
}

// Bindings //
document.querySelectorAll('.addLesson').forEach(button => {
    button.onclick = e => addItem(e.target.closest('.hoursContainer').id, 'lesson');
});

document.querySelectorAll('.addBreak').forEach(button => {
    button.onclick = e => addItem(e.target.closest('.hoursContainer').id, 'break');
});

document.querySelectorAll('.assignmentsButton').forEach(button => {
    button.onclick = () => {
        window.location.href = '/public/assignments/index.html';
    };
});

document.getElementById('logoutButton').onclick = () => {
    sessionStorage.removeItem('SessionID');
    window.location.href = '/public/login/index.html';
}

window.addEventListener('DOMContentLoaded', loadSchedule);