import { validateSessionAuth, getSessionID } from "/modules/Security.js";
import { HOST, EXAMS_URL } from "/modules/Config.js";

validateSessionAuth();

const EXAMS_API_URL = EXAMS_URL;

// DOM Elements
const examsContainer = document.getElementById("examsContainer");
const subjectSelect = document.getElementById("subjectSelect");
const dueDateInput = document.getElementById("dueDateInput");
const examNotesInput = document.getElementById("examNotes");
const submitButton = document.getElementById("submitExam");
const responseLabelElement = document.getElementById("responseLabel");

// API Calls
async function fetchAPI(url, options = {}) {
    const defaultHeaders = {
        "Content-Type": "application/json",
        "SessionID": getSessionID()
    };

    const response = await fetch(url, {
        ...options,
        headers: { ...defaultHeaders, ...options.headers }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    return text.trim() ? JSON.parse(text) : null;
}

async function getExams() {
    const data = await fetchAPI(EXAMS_API_URL);
    return data || [];
}

async function createExam(examData) {
    return await fetchAPI(EXAMS_API_URL, {
        method: "POST",
        body: JSON.stringify(examData)
    });
}

async function updateExam(examID, examData) {
    return await fetchAPI(`${EXAMS_API_URL}/${examID}`, {
        method: "PUT",
        body: JSON.stringify(examData)
    });
}

async function deleteExam(examID) {
    return await fetchAPI(`${EXAMS_API_URL}/${examID}`, {
        method: "DELETE"
    });
}

async function getSubjects() {
    return await fetchAPI(`${HOST}/subjects`);
}

// UI Helper Functions
function showResponseLabel(message, duration = 2) {
    responseLabelElement.textContent = message;
    setTimeout(() => {
        responseLabelElement.textContent = "";
    }, duration * 1000);
}

function clearForm() {
    dueDateInput.value = "";
    examNotesInput.value = "";
    subjectSelect.selectedIndex = 0;
}

function closeAllMenus() {
    document.querySelectorAll(".examMenu").forEach(menu => menu.remove());
}

// Create Exam Card
function createExamCard(exam) {
    const examDiv = document.createElement("div");
    examDiv.className = "examCard";
    examDiv.dataset.examId = exam.id;

    examDiv.innerHTML = `
        <h3>${exam.subject}</h3>
        <p>Due Date: ${exam.dueDate}</p>
        <p>Notes: ${exam.notes}</p>
    `;

    const menuButton = createMenuButton(exam, examDiv);
    examDiv.appendChild(menuButton);

    return examDiv;
}

// Create Menu Button
function createMenuButton(exam, examDiv) {
    const menuButton = document.createElement("button");
    menuButton.className = "examMenuButton";
    menuButton.textContent = "⋮";

    menuButton.addEventListener("click", (e) => {
        e.stopPropagation();
        
        const existingMenu = examDiv.querySelector(".examMenu");
        if (existingMenu) {
            existingMenu.remove();
            return;
        }

        closeAllMenus();
        const menu = createMenu(exam, examDiv);
        examDiv.appendChild(menu);
    });

    return menuButton;
}

// Create Menu
function createMenu(exam, examDiv) {
    const menu = document.createElement("div");
    menu.className = "examMenu";

    const editOption = createEditOption(exam, examDiv);
    const deleteOption = createDeleteOption(exam);

    menu.appendChild(editOption);
    menu.appendChild(deleteOption);

    return menu;
}

// Create Edit Option
function createEditOption(exam, examDiv) {
    const editOption = document.createElement("Button");
    editOption.className = "examMenuOption";
    editOption.textContent = "Edit Exam";

    editOption.addEventListener("click", () => {
        closeAllMenus();
        showEditForm(exam, examDiv);
    });

    return editOption;
}

// Show Edit Form
function showEditForm(exam, examDiv) {
    examDiv.innerHTML = `
        <h3>Edit Exam: ${exam.subject}</h3>
        <label for="editDueDate-${exam.id}">Due Date:</label>
        <input type="date" class="editInput" id="editDueDate-${exam.id}" value="${exam.dueDate}">
        <label for="editNotes-${exam.id}">Notes:</label>
        <input type="text" class="editInput" id="editNotes-${exam.id}" value="${exam.notes}">
        <div class="editButtons">
            <button class="saveButton" id="saveEdit-${exam.id}">Save</button>
            <button class="cancelButton" id="cancelEdit-${exam.id}">Cancel</button>
        </div>
    `;

    // Save Button Handler
    document.getElementById(`saveEdit-${exam.id}`).addEventListener("click", async () => {
        const newDueDate = document.getElementById(`editDueDate-${exam.id}`).value;
        const newNotes = document.getElementById(`editNotes-${exam.id}`).value;

        if (!newDueDate || !newNotes.trim()) {
            showResponseLabel("Please fill in all fields");
            return;
        }

        try {
            await updateExam(exam.id, {
                subject: exam.subject,
                dueDate: newDueDate,
                notes: newNotes
            });

            await loadExams();
        } catch (error) {
            showResponseLabel("Error updating exam");
            console.error("Update error:", error);
        }
    });

    // Cancel Button Handler
    document.getElementById(`cancelEdit-${exam.id}`).addEventListener("click", async () => {
        await loadExams();
    });
}

// Create Delete Option
function createDeleteOption(exam) {
    const deleteOption = document.createElement("button");
    deleteOption.className = "examMenuOption examMenuOption--delete";
    deleteOption.textContent = "Delete Exam";

    deleteOption.addEventListener("click", async () => {
        try {
            await deleteExam(exam.id);
            await loadExams();
        } catch (error) {
            showResponseLabel("Error deleting exam");
            console.error("Delete error:", error);
        }
    });

    return deleteOption;
}

// Load Exams
async function loadExams() {
    try {
        examsContainer.innerHTML = "";
        const exams = await getExams();

        if (exams.length === 0) {
            examsContainer.innerHTML = '<p class="noExams">No exams yet.<br> Create one to the left!</p>';
            return;
        }

        exams.forEach(exam => {
            const examCard = createExamCard(exam);
            examsContainer.appendChild(examCard);
        });
    } catch (error) {
        showResponseLabel("Error loading exams");
        console.error("Load exams error:", error);
    }
}

// Load Subjects
async function loadSubjects() {
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
        showResponseLabel("Error loading subjects");
        console.error("Load subjects error:", error);
    }
}

// Submit Button Handler
submitButton.addEventListener("click", async () => {
  // Button während der Anfrage deaktivieren
  if (submitButton.disabled) return;
  submitButton.disabled = true;
  
  const selectedSubject = subjectSelect.value;
  const dueDate = dueDateInput.value;
  const notes = examNotesInput.value;

  if (!selectedSubject || !dueDate || !notes.trim()) {
    showResponseLabel("Please fill in all fields");
    submitButton.disabled = false;
    return;
  }

  const examData = {
    subject: selectedSubject,
    dueDate: dueDate,
    notes: notes
  };

  try {
    await createExam(examData);
    clearForm();
    await loadExams();
  } catch (error) {
    showResponseLabel("Error creating exam");
    console.error("Create exam error:", error);
  } finally {
    submitButton.disabled = false; // Button wieder aktivieren
  }
});

// Close menus when clicking outside
document.addEventListener("click", (e) => {
    if (!e.target.closest(".examMenuButton") && !e.target.closest(".examMenu")) {
        closeAllMenus();
    }
});

// Initialize
window.addEventListener("DOMContentLoaded", () => {
    loadExams();
    loadSubjects();
});