// Funktion zum Hinzufügen von Lesson/Break
function addItem(dayId, type) {
    const container = document.getElementById(dayId);
    
    const div = document.createElement('div');
    div.className = type;
    div.textContent = type === 'lesson' ? 'New Lesson' : 'New Break';
    
    // Delete Button
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '❌';
    deleteBtn.style.marginLeft = '10px';
    deleteBtn.onclick = () => {
        div.remove();
        saveSchedule(); // sofort speichern
    };
    
    div.appendChild(deleteBtn);
    container.appendChild(div);
    
    saveSchedule(); // speichern
}

// Event Listener für Buttons
document.querySelectorAll('.addLesson').forEach(btn => {
    btn.addEventListener('click', e => {
        const dayId = e.target.parentElement.id;
        addItem(dayId, 'lesson');
    });
});

document.querySelectorAll('.addBreak').forEach(btn => {
    btn.addEventListener('click', e => {
        const dayId = e.target.parentElement.id;
        addItem(dayId, 'break');
    });
});


function saveSchedule() {
    const schedule = {};
    document.querySelectorAll('.hoursContainer').forEach(container => {
        const dayId = container.id;
        schedule[dayId] = [];
        container.querySelectorAll('.lesson, .break').forEach(item => {
            schedule[dayId].push({
                type: item.className,
                text: item.firstChild.textContent // der Text ohne Delete Button
            });
        });
    });
    localStorage.setItem('schedule', JSON.stringify(schedule));
}

function loadSchedule() {
    const schedule = JSON.parse(localStorage.getItem('schedule') || '{}');
    for (let dayId in schedule) {
        const container = document.getElementById(dayId);
        schedule[dayId].forEach(item => {
            const div = document.createElement('div');
            div.className = item.type;
            div.textContent = item.text;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '❌';
            deleteBtn.style.marginLeft = '10px';
            deleteBtn.onclick = () => {
                div.remove();
                saveSchedule();
            };
            
            div.appendChild(deleteBtn);
            container.appendChild(div);
        });
    }
}

window.addEventListener('DOMContentLoaded', loadSchedule);