import { validateSessionAuth, getSessionID } from "/modules/Security.js";

validateSessionAuth();

// URLs
const HOST_URL = "http://localhost:8080";
const API_URL = `${HOST_URL}/assignments/my`;

// Elements
const assignmentContainer = document.getElementsByClassName("assignmentsContainer")[0];

// API Calls //

/* returns an String Array */
async function getSubjects() {

    const request = await fetch(`${HOST_URL}/subjects`, {

        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }

    });

    if (!request.ok) {
        throw new Error(`HTTP error! status: ${request.status}`);
    }

    return await request.json();

}

// returns an Assignment Array
async function getAssignments() {

    const request = await fetch(API_URL, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "SessionID": getSessionID()
        }
    });

    if (!request.ok) {
        throw new Error(`HTTP error! status: ${request.status}`);
    }

    return await request.json();

}

// returns the created Assignment
async function createAssignmentMetaData(body) {

    const request = await fetch(`${API_URL}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "SessionID": getSessionID()
        },
        body: JSON.stringify(body)
    });

    if (!request.ok) {
        if (request.status === 400 || request.status === 422) {
            const errorData = await request.json().catch(() => ({}));
            const message = errorData.message || "Please enter a valid future date!";
            responseLabelHandler(message, 2);
            return null;
        } else {
            throw new Error(`HTTP error! status: ${request.status}`);
        }
    }

    return await request.json();
}

// returns the updated Assignment
async function updateAssignment(assignmentId, body) {

    const request = await fetch(`${API_URL}/${assignmentId}`, {

        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "SessionID": getSessionID()
        },
        body: JSON.stringify(body)

    });

    if (!request.ok) {
        throw new Error(`HTTP error! status: ${request.status}`);
    }

    return await request.json();

}

// deletes the assignment
async function deleteAssignment(assignmentId) {

    const request = await fetch(`${API_URL}/${assignmentId}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "SessionID": getSessionID()
        }
    });

}

// Utils - Helpers //

function createLabeledParagraph(label, value, className) {
    const element = document.createElement("p");
    if (className) element.classList.add(className);

    element.innerHTML = `<strong>${label}:</strong> ${value}`;
    return element;
}

function responseLabelHandler(responseText, durationInSeconds) {

    durationInSeconds = durationInSeconds || 2;
    durationInSeconds = durationInSeconds * 1000;
    const responseLabel = document.getElementById("responseLabel");
    responseLabel.textContent = responseText;
    setTimeout(() => {
        responseLabel.textContent = "";
    }, durationInSeconds);
}

// Assignment Element Creation
function createAssignmentElement(data) {

    const wrapper = document.createElement("div");
    wrapper.classList.add("assignment");

    const subject = document.createElement("h3");
    subject.classList.add("assignment-subject");
    subject.textContent = data.subject;

    const dueDate = createLabeledParagraph("Due date", new Date(data.dueDate).toLocaleDateString(), "assignment-due-date");
    const notes = createLabeledParagraph("Notes", data.notes, "assignment-notes");
    const completed = createLabeledParagraph("Completed", data.completed, "assignment-completed");

    // Menu (Delete and Toggle Completed)
    const menu = document.createElement("button");
    menu.className = "assignment-menu-button";
    menu.textContent = "⋮";
    wrapper.style.position = "relative";

    menu.onclick = async () => {
        // Popup with 2 options: Toggle Completed and Delete

        let existingPopup = document.querySelector(".assignment-popup");
        if (existingPopup) {
            existingPopup.remove();
            return;
        }

        const popup = document.createElement("div");
        popup.classList.add("assignment-popup");

        const toggleCompletedButton = document.createElement("button");
        toggleCompletedButton.textContent = data.completed ? "Mark Incomplete" : "Mark Complete";

        toggleCompletedButton.onclick = async () => {
            data.completed = !data.completed;
            await updateAssignment(data.id, { subject: data.subject, dueDate: data.dueDate, notes: data.notes, completed: data.completed });
            completed.innerHTML = `<strong>Completed:</strong> ${data.completed}`;
            document.body.removeChild(popup);
        };


        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete Assignment";

        deleteButton.onclick = async () => {
            await deleteAssignment(data.id);
            assignmentContainer.removeChild(wrapper);
            document.body.removeChild(popup);
        };

        popup.appendChild(toggleCompletedButton);
        popup.appendChild(deleteButton);
        wrapper.appendChild(popup);

    };
    // Append all elements to wrapper
    wrapper.append(subject, dueDate, notes, completed);
    wrapper.appendChild(menu);

    return wrapper;
}

// Loading //

async function loadAssignmentElements() {

    try {
        const assignments = await getAssignments();
        assignments.forEach(assignment => {
            assignmentContainer.appendChild(
                createAssignmentElement(assignment)
            );
        });
    } catch (error) {
        console.error("Error loading assignments:", error);
    }
}

async function loadSubjects() {

    const subjectSelect = document.getElementById("subjectSelect");
    try {
        const subjects = await getSubjects();

        subjects.forEach(subject => {
            const option = document.createElement("option");
            option.className = "subjectOption";
            option.value = subject;
            option.textContent = subject;
            subjectSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error loading subjects:", error);
    }
}

// Handling //

// Form Submission
async function handleAssignmentFormSubmit(body) {
    
    try {
        const newAssignment = await createAssignmentMetaData(body);
        assignmentContainer.appendChild(
            createAssignmentElement(newAssignment)
        );
    } catch (error) {
        console.error("Error creating assignment:", error);
        return;
    }

    console.log("Form successfully submitted with data:", body);

}
// Submit Button Click
document.getElementById("submitAssignment").onclick = () => {
    const subject = document.getElementById('subjectSelect').value.toUpperCase();
    const dueDate = document.getElementById('dueDateInput').value;
    const notes = document.getElementById('assignmentNotes').value;

    if (!subject || !dueDate || !notes) {
        responseLabelHandler("Please fill in all fields.", 1.5);
        return;
    }

    handleAssignmentFormSubmit({
        subject,
        dueDate,
        notes
    });
}

// Initial Load //

// On DOM Content Loaded
window.addEventListener("DOMContentLoaded", () => {
    loadAssignmentElements();
    loadSubjects();
});