import { validateSessionAuth, getSessionID } from "/modules/Security.js";
import { HOST, ASSIGNMENTS_URL } from "/modules/Config.js";

validateSessionAuth();

const elements = {
  container: document.querySelector(".assignmentsContainer"),
  response: document.getElementById("responseLabel"),
  responder: document.getElementById("assignmentsResponder"),
  subject: document.getElementById("subjectSelect"),
  dueDate: document.getElementById("dueDateInput"),
  notes: document.getElementById("assignmentNotes"),
  submit: document.getElementById("submitAssignment")
};

// API CRUD Operations
const fetchAllAssignments = async () => {
  const response = await fetch(ASSIGNMENTS_URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "SessionID": getSessionID()
    }
  });
  return response.json();
};

const createAssignment = async (assignmentData) => {
  const response = await fetch(ASSIGNMENTS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "SessionID": getSessionID()
    },
    body: JSON.stringify(assignmentData)
  });

  if (!response.ok && (response.status === 400 || response.status === 422)) {
    showMessage("Please enter a valid future date!", 2);
    return;
  }

  return response.json();
};

const updateAssignment = async (assignmentId, assignmentData) => {
  const response = await fetch(`${ASSIGNMENTS_URL}/${assignmentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "SessionID": getSessionID()
    },
    body: JSON.stringify(assignmentData)
  });
  return response.json();
};

const deleteAssignment = async (assignmentId) => {
  const response = await fetch(`${ASSIGNMENTS_URL}/${assignmentId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "SessionID": getSessionID()
    }
  });
  return response.ok;
};

const fetchSubjects = async () => {
  const response = await fetch(`${HOST}/subjects`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "SessionID": getSessionID()
    }
  });
  return response.json();
};

const showMessage = (message, seconds = 2) => {
  elements.response.textContent = message;
  setTimeout(() => {
    elements.response.textContent = "";
  }, seconds * 1000);
};

const formatDate = (date) => new Date(date).toLocaleDateString();
const getDate = (date) => date.split("T")[0];

const createElement = (tag, className, html, attributes = {}) => {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (html) {
    element.innerHTML = html;
  }

  Object.entries(attributes).forEach(
    ([key, value]) => element[key] = value
  );

  return element;
};

const createField = (label, value, inputType, key) => {
  const wrapper = createElement("p", `assignment-${key}`);
  wrapper.innerHTML = `<strong>${label}:</strong> `;
  
  const text = createElement("span");
  text.textContent = inputType === "date" ? formatDate(value) : value;
  
  const input = createElement(inputType === "date" ? "input" : "textarea");

  if (inputType === "date") {
    input.type = "date";
    input.value = getDate(value);
  } else {
    input.value = value;
  }

  input.style.cssText = "width:100%;min-height:60px;border:1px solid #ccc;padding:5px;border-radius:6px";
  input.style.display = "none";
  
  wrapper.append(text, input);
  return { wrap: wrapper, text, input };
};

const toggleEdit = (state, fieldElements) => {
  state.isEdit = !state.isEdit;
  
  fieldElements.subject.contentEditable = state.isEdit;
  fieldElements.subject.style.cssText = state.isEdit ? "cursor:text;border:1px solid #ccc;padding:5px;border-radius:6px" : "";
  
  [fieldElements.dueDate, fieldElements.notes].forEach(
    ({ text, input }) => {
      text.style.display = state.isEdit ? "none" : "inline";
      input.style.display = state.isEdit ? (input.tagName === "TEXTAREA" ? "block" : "inline") : "none";
    }
  );
  
  fieldElements.completedCheckbox.style.display = state.isEdit ? "flex" : "none";
  fieldElements.completedText.style.display = state.isEdit ? "none" : "block";
  state.saveButton.style.display = state.isEdit ? "block" : "none";
};

const saveEdit = async (assignment, fieldElements) => {
  const subject = fieldElements.subject.textContent.trim();
  const dueDate = fieldElements.dueDate.input.value;
  const notes = fieldElements.notes.input.value.trim();
  const completed = fieldElements.completedCheckbox.checked;
  
  if (!subject || !dueDate || !notes) {
    showMessage("Please fill in all fields.", 1.5);
    return false;
  }
  
  Object.assign(assignment, { subject, dueDate, notes, completed });
  await updateAssignment(assignment.id, assignment);
  
  fieldElements.dueDate.text.textContent = formatDate(assignment.dueDate);
  fieldElements.notes.text.textContent = assignment.notes;
  fieldElements.completedText.innerHTML = `<strong>Completed:</strong> ${assignment.completed}`;

  return true;
};

const showMenu = (wrapper, assignment, fieldElements, state) => {
  const existing = document.querySelector(".assignment-popup");
  if (existing) {
    return existing.remove();
  }
  
  const popup = createElement("div", "assignment-popup");

  const editButton = createElement("button", null, "Edit");
  editButton.onclick = () => {
    toggleEdit(state, fieldElements);
    popup.remove();
  };

  const deleteButton = createElement("button", null, "Delete Assignment");
  deleteButton.onclick = async () => {
    const success = await deleteAssignment(assignment.id);
    if (success) {
      elements.container.removeChild(wrapper);
      popup.remove();
    }
  };
  
  popup.append(editButton, deleteButton);
  wrapper.appendChild(popup);
};



const createCard = (assignment) => {
  const wrapper = createElement("div", "assignment");
  wrapper.style.position = "relative";
  
  const subject = createElement("h3", "assignment-subject", assignment.subject);
  const dueDate = createField("Due date", assignment.dueDate, "date", "due-date");
  const notes = createField("Notes", assignment.notes, "textarea", "notes");
  
  const completedText = createElement("p", "assignment-completed", `<strong>Completed:</strong> ${assignment.completed}`);
  
  const completedCheckbox = createElement("label");
  completedCheckbox.style.cssText = "display:none;align-items:center;gap:0.5rem;font-size:0.9rem";
  const checkbox = createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = assignment.completed;
  completedCheckbox.innerHTML = "<strong>Completed:</strong> ";
  completedCheckbox.appendChild(checkbox);
  
  const state = { isEdit: false };
  
  const saveButton = createElement("button", "assignment-save-button", "Save");
  saveButton.style.cssText = "display:none;margin-top:0.5rem;padding:0.4rem 0.8rem;border-radius:6px;border:1px solid #ccc;background:white;cursor:pointer";
  state.saveButton = saveButton;
  
  const fieldElements = { subject, dueDate, notes, completedCheckbox: checkbox, completedText };

  const ableToSaveAssignment = (fieldElements) => {

  const subject = fieldElements.subject.textContent.trim();
  const dueDate = fieldElements.dueDate.input.value;
  const notes = fieldElements.notes.input.value.trim();

  if (!subject || !dueDate || !notes) {
    showMessage("Please fill in all fields.", 1.5);
    return false;
  }

  return true;
}
  
  saveButton.onclick = async () => {
    if (ableToSaveAssignment(fieldElements)) {
      const success = await saveEdit(assignment, fieldElements);
      if (success) {
        toggleEdit(state, fieldElements);
      } else {
        checkbox.checked = assignment.completed;
      }
    } else {
      checkbox.checked = assignment.completed;
    }
  };
  
  const menuBtn = createElement("button", "assignment-menu-button", "⋮");
  menuBtn.onclick = () => showMenu(wrapper, assignment, fieldElements, state);
  
  wrapper.append(subject, dueDate.wrap, notes.wrap, completedText, completedCheckbox, saveButton, menuBtn);
  return wrapper;
};

const noAssignmentsCheck = (length) => {
  if (length === 0) {
    elements.responder.textContent = "No Assignments yet";
  } else {
    elements.responder.textContent = "";
  }
};

const loadAssignments = async () => {
  const assignments = await fetchAllAssignments();
  noAssignmentsCheck(assignments.length);
  assignments.forEach(assignment => elements.container.appendChild(createCard(assignment)));
};

const loadSubjects = async () => {
  const subjects = await fetchSubjects();
  subjects.forEach(subject => elements.subject.appendChild(createElement("option", "subjectOption", subject, { value: subject })));
};

const handleSubmit = async () => {
  const assignmentData = {
    subject: elements.subject.value.toUpperCase().replace(" ", "_"),
    dueDate: elements.dueDate.value,
    notes: elements.notes.value,
    completed: false
  };
  
  if (!assignmentData.subject || !assignmentData.dueDate || !assignmentData.notes) {
    return showMessage("Please fill in all fields.", 1.5);
  }
  
  const newAssignment = await createAssignment(assignmentData);
  if (newAssignment) {
    elements.responder.textContent = "";
    elements.container.appendChild(createCard(newAssignment));
    [elements.subject, elements.dueDate, elements.notes].forEach(element => element.value = "");
  }

};

elements.submit.onclick = handleSubmit;
window.addEventListener("DOMContentLoaded", () => {
  loadAssignments();
  loadSubjects();
});