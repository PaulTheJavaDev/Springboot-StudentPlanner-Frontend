import { validateSessionAuth, getSessionID } from "/modules/Security.js";

validateSessionAuth();

const API = "http://localhost:8080";
const EXAMS_API_URL = API + "/exams/my";

// CRUD Operations //
async function getExams() {
    const response = await fetch(EXAMS_API_URL, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "SessionID": getSessionID()
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();

    if (text.trim() === "") {
        console.warn("Backend returned empty response (no JSON)");
        return [];
    }

    return JSON.parse(text);
}

async function createExam(data) {
    const response = await fetch(EXAMS_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "SessionID": getSessionID()
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}

async function updateExam(examID, data) {
    const response = await fetch(`${EXAMS_API_URL}/${examID}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "SessionID": getSessionID()
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}

// TODO: fix this: app.js:195 SyntaxError: Failed to execute 'json' on 'Response': Unexpected end of JSON input
//   at deleteExam (app.js:79:27)
//   at async HTMLDivElement.<anonymous> (app.js:191:25)
// (anonym)	@	app.js:195
async function deleteExam(examID) {
    const response = await fetch(`${EXAMS_API_URL}/${examID}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "SessionID": getSessionID()
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log("Delete response text:", await response.text());
    console.log(response);

    return await response.json();
}

async function getSubjects() {
    const response = await fetch("http://localhost:8080/subjects", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "SessionID": getSessionID()
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}

async function loadExams() {
    const examsContainer = document.getElementById("examsContainer");
    examsContainer.innerHTML = "";

    const exams = await getExams();

    exams.forEach(exam => {
        const examDiv = document.createElement("div");
        examDiv.className = "examCard";
        
        // Store original content for cancel functionality
        const originalContent = `
            <h3>${exam.subject}</h3>
            <p>Due Date: ${exam.dueDate}</p>
            <p>Notes: ${exam.notes}</p>
        `;
        
        examDiv.innerHTML = originalContent;

        const menuButton = document.createElement("button");
        menuButton.className = "examMenuButton";
        menuButton.textContent = "⋮";
        
        menuButton.addEventListener("click", () => {
            // Remove any existing menus
            const existingMenu = examDiv.querySelector(".examMenu");
            if (existingMenu) {
                existingMenu.remove();
                return;
            }

            const menu = document.createElement("div");
            menu.className = "examMenu";

            // Edit Option
            const editOption = document.createElement("div");
            editOption.className = "examMenuOption";
            editOption.textContent = "Edit Exam";
            editOption.addEventListener("click", () => {
                menu.remove();
                
                // Replace content with edit form
                examDiv.innerHTML = `
                    <h3>Edit Exam: ${exam.subject}</h3>
                    <label for="editDueDate-${exam.id}">Due Date:</label>
                    <input type="date" id="editDueDate-${exam.id}" value="${exam.dueDate}">
                    <label for="editNotes-${exam.id}">Notes:</label>
                    <textarea id="editNotes-${exam.id}">${exam.notes}</textarea>
                    <div class="editButtons">
                        <button id="saveEdit-${exam.id}">Save</button>
                        <button id="cancelEdit-${exam.id}">Cancel</button>
                    </div>
                `;

                // Save Button
                document.getElementById(`saveEdit-${exam.id}`).addEventListener("click", async () => {
                    const newDueDate = document.getElementById(`editDueDate-${exam.id}`).value;
                    const newNotes = document.getElementById(`editNotes-${exam.id}`).value;

                    if (!newDueDate || !newNotes) {
                        responseLabel("Please fill in all fields");
                        return;
                    }

                    try {

                        await updateExam(exam.id, {
                            subject: exam.subject,
                            dueDate: newDueDate,
                            notes: newNotes
                        });

                        responseLabel("Exam updated successfully", 2);
                        loadExams();
                    } catch (error) {
                        responseLabel("Error updating exam", 2);
                        console.error(error);
                    }
                });

                // Cancel Button
                document.getElementById(`cancelEdit-${exam.id}`).addEventListener("click", () => {
                    loadExams(); // Just reload to restore original state
                });
            });

            // Delete Option
            const deleteOption = document.createElement("div");
            deleteOption.className = "examMenuOption";
            deleteOption.textContent = "Delete Exam";
            deleteOption.addEventListener("click", async () => {
                if (confirm(`Are you sure you want to delete the exam for ${exam.subject}?`)) {
                    try {
                        await deleteExam(exam.id);
                        loadExams();
                    } catch (error) {
                        responseLabel("Error deleting exam", 2);
                        console.error(error);
                    }
                }
            });

            menu.appendChild(editOption);
            menu.appendChild(deleteOption);
            examDiv.appendChild(menu);
        });

        examDiv.appendChild(menuButton);
        examsContainer.appendChild(examDiv);
    });
}

const submitButton = document.getElementById("submitExam");
submitButton.addEventListener("click", async () => {

    const dueDate = document.getElementById("dueDateInput").value;
    const examNotes = document.getElementById("examNotes").value;
    const subjectSelect = document.getElementById("subjectSelect");
    const selectedSubject = subjectSelect.value;

    if (!selectedSubject || !dueDate || !examNotes) {
        responseLabel("Please fill in all fields");
        return;
    }

    const examBody = {
        subject: selectedSubject,
        dueDate: dueDate,
        notes: examNotes
    };

    console.log(examBody);

    try {
        await createExam(examBody);
        responseLabel("Exam created successfully", 2);
        
        // Clear form
        document.getElementById("dueDateInput").value = "";
        document.getElementById("examNotes").value = "";
        subjectSelect.selectedIndex = 0;
        
        loadExams();
    } catch (error) {
        responseLabel("Error creating exam", 2);
        console.error(error);
    }
});

async function loadSubjects() {
    const subjectSelect = document.getElementById("subjectSelect");

    try {
        const subjects = await getSubjects();

        subjects.forEach(subject => {
            const option = document.createElement("option");
            option.className = "subjectOption";
            option.value = subject.toUpperCase();
            option.textContent = subject;
            subjectSelect.appendChild(option);
        });
    } catch (error) {
        responseLabel("Error loading subjects");
        console.error(error);
    }
}

// Only Usage for bad responses
function responseLabel(message, amountInSeconds) {
    amountInSeconds = amountInSeconds || 2;

    const responseLabel = document.getElementById("responseLabel");
    responseLabel.textContent = message;

    setTimeout(() => {
        responseLabel.textContent = "";
    }, amountInSeconds * 1000);
}

window.addEventListener("DOMContentLoaded", () => {
    loadExams();
    loadSubjects();
});