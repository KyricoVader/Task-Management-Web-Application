import { NotificationCenter } from "./Notification.js";

const PRIORITY_LABELS = { low: "low", medium: "medium", high: "high" };
const THEME_KEY = "tasks.app.theme";

export class UI {
  constructor(taskManager) {
    this.taskManager = taskManager;
    this.state = {
      category: "all",
      keyword: "",
      sortBy: "created",
      editingId: null,
      formOpen: false,
    };
    this.elements = this.queryElements();
    this.notifications = new NotificationCenter(this.elements.notificationStack);
    this.init();
  }

  queryElements() {
    const $ = (id) => document.getElementById(id);
    return {
      themeToggle: $("themeToggle"),
      searchInput: $("searchInput"),
      categoryFilters: $("categoryFilters"),
      addCategoryBtn: $("addCategoryBtn"),
      sortButtons: document.querySelectorAll(".sort-btn"),
      formToggle: $("formToggle"),
      taskForm: $("taskForm"),
      titleInput: $("titleInput"),
      descInput: $("descInput"),
      prioritySelect: $("prioritySelect"),
      categorySelect: $("categorySelect"),
      titleError: $("titleError"),
      descError: $("descError"),
      submitBtn: $("submitBtn"),
      cancelBtn: $("cancelBtn"),
      taskList: $("taskList"),
      emptyState: $("emptyState"),
      notificationStack: $("notificationStack"),
      categoryModal: $("categoryModal"),
      newCategoryInput: $("newCategoryInput"),
      categoryError: $("categoryError"),
      saveCategoryBtn: $("saveCategoryBtn"),
      cancelCategoryBtn: $("cancelCategoryBtn"),
      customCategoriesList: $("customCategoriesList"),
    };
  }

  init() {
    this.loadTheme();
    this.bindEvents();
    this.renderCategoryFilters();
    this.renderCategoryOptions();
    this.render();
  }

  bindEvents() {
    this.elements.themeToggle.addEventListener("click", () => this.toggleTheme());

    this.elements.searchInput.addEventListener("input", (e) => {
      this.state.keyword = e.target.value;
      this.render();
    });

    this.elements.addCategoryBtn.addEventListener("click", () => this.openCategoryModal());
    this.elements.saveCategoryBtn.addEventListener("click", () => this.handleAddCategory());
    this.elements.cancelCategoryBtn.addEventListener("click", () => this.closeCategoryModal());
    this.elements.categoryModal.addEventListener("click", (e) => {
      if (e.target === this.elements.categoryModal) this.closeCategoryModal();
    });
    this.elements.newCategoryInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.handleAddCategory();
    });

    this.elements.sortButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        this.state.sortBy = btn.dataset.sort;
        this.elements.sortButtons.forEach((b) => b.classList.toggle("is-active", b === btn));
        this.render();
      });
    });

    this.elements.formToggle.addEventListener("click", () => this.openForm());
    this.elements.cancelBtn.addEventListener("click", () => this.closeForm());
    this.elements.taskForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleFormSubmit();
    });

    this.elements.taskList.addEventListener("click", (e) => this.handleTaskListClick(e));

    this.elements.customCategoriesList.addEventListener("click", (e) => {
      const removeBtn = e.target.closest(".custom-category-remove");
      if (!removeBtn) return;
      const name = removeBtn.dataset.category;
      this.taskManager.removeCategory(name);
      this.renderCategoryFilters();
      this.renderCategoryOptions();
      this.renderCustomCategoriesList();
      if (this.state.category === name) this.state.category = "all";
      this.render();
    });
  }

  loadTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const theme = saved === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
  }

  toggleTheme() {
    const current = document.documentElement.dataset.theme;
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem(THEME_KEY, next);
  }

  renderCategoryFilters() {
    const categories = ["all", ...this.taskManager.getCategories()];
    this.elements.categoryFilters.innerHTML = "";
    categories.forEach((cat) => {
      const btn = document.createElement("button");
      btn.className = "category-btn";
      if (cat === this.state.category) btn.classList.add("is-active");
      btn.textContent = cat === "all" ? "All" : cat;
      btn.addEventListener("click", () => {
        this.state.category = cat;
        this.renderCategoryFilters();
        this.render();
      });
      this.elements.categoryFilters.appendChild(btn);
    });
  }

  renderCategoryOptions() {
    const categories = this.taskManager.getCategories();
    this.elements.categorySelect.innerHTML = "";
    categories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      this.elements.categorySelect.appendChild(option);
    });
  }

  openForm(taskId = null) {
    this.state.editingId = taskId;
    this.state.formOpen = true;
    this.clearFormErrors();

    if (taskId) {
      const task = this.taskManager.getById(taskId);
      if (!task) return;
      this.elements.titleInput.value = task.title;
      this.elements.descInput.value = task.description;
      this.elements.prioritySelect.value = task.priority;
      this.elements.categorySelect.value = task.category;
      this.elements.submitBtn.textContent = "Update";
    } else {
      this.elements.taskForm.reset();
      this.elements.prioritySelect.value = "medium";
      this.elements.categorySelect.value = this.taskManager.getCategories()[0] || "Personal";
      this.elements.submitBtn.textContent = "Save";
    }

    this.elements.formToggle.classList.add("is-hidden");
    this.elements.taskForm.classList.remove("is-hidden");
    this.elements.titleInput.focus();
  }

  closeForm() {
    this.state.editingId = null;
    this.state.formOpen = false;
    this.elements.taskForm.reset();
    this.clearFormErrors();
    this.elements.taskForm.classList.add("is-hidden");
    this.elements.formToggle.classList.remove("is-hidden");
  }

  clearFormErrors() {
    this.elements.titleError.textContent = "";
    this.elements.descError.textContent = "";
  }

  validateForm() {
    this.clearFormErrors();
    const title = this.elements.titleInput.value.trim();
    const description = this.elements.descInput.value.trim();
    let valid = true;

    if (!title) {
      this.elements.titleError.textContent = "Title is required.";
      valid = false;
    } else if (title.length > 100) {
      this.elements.titleError.textContent = "Title must be under 100 characters.";
      valid = false;
    }

    if (description.length > 500) {
      this.elements.descError.textContent = "Description must be under 500 characters.";
      valid = false;
    }

    return valid;
  }

  handleFormSubmit() {
    if (!this.validateForm()) return;

    const data = {
      title: this.elements.titleInput.value.trim(),
      description: this.elements.descInput.value.trim(),
      priority: this.elements.prioritySelect.value,
      category: this.elements.categorySelect.value,
    };

    if (this.state.editingId) {
      const updated = this.taskManager.update(this.state.editingId, data);
      if (updated && updated.isHighPriority()) {
        this.notifications.show(`High-priority task updated: ${updated.title}`);
      }
    } else {
      const created = this.taskManager.add(data);
      if (created.isHighPriority()) {
        this.notifications.show(`High-priority task added: ${created.title}`);
      }
    }

    this.closeForm();
    this.render();
  }

  handleTaskListClick(e) {
    const item = e.target.closest("[data-task-id]");
    if (!item) return;
    const id = item.dataset.taskId;

    if (e.target.closest(".task-checkbox")) {
      const task = this.taskManager.toggleComplete(id);
      if (task && task.completed && task.isHighPriority()) {
        this.notifications.show(`High-priority task completed: ${task.title}`);
      }
      this.render();
      return;
    }

    const action = e.target.closest("[data-action]");
    if (!action) return;

    if (action.dataset.action === "edit") {
      this.openForm(id);
    } else if (action.dataset.action === "delete") {
      this.taskManager.remove(id);
      if (this.state.editingId === id) this.closeForm();
      this.render();
    }
  }

  openCategoryModal() {
    this.elements.categoryModal.classList.remove("is-hidden");
    this.elements.newCategoryInput.value = "";
    this.elements.categoryError.textContent = "";
    this.renderCustomCategoriesList();
    this.elements.newCategoryInput.focus();
  }

  closeCategoryModal() {
    this.elements.categoryModal.classList.add("is-hidden");
  }

  handleAddCategory() {
    const name = this.elements.newCategoryInput.value;
    const result = this.taskManager.addCategory(name);
    if (!result.ok) {
      this.elements.categoryError.textContent = result.error;
      return;
    }
    this.elements.newCategoryInput.value = "";
    this.elements.categoryError.textContent = "";
    this.renderCategoryFilters();
    this.renderCategoryOptions();
    this.renderCustomCategoriesList();
  }

  renderCustomCategoriesList() {
    const list = this.taskManager.getCustomCategories();
    this.elements.customCategoriesList.innerHTML = "";
    if (list.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-text";
      empty.style.fontSize = "12px";
      empty.style.textAlign = "left";
      empty.style.padding = "0";
      empty.textContent = "No custom categories yet.";
      this.elements.customCategoriesList.appendChild(empty);
      return;
    }
    list.forEach((cat) => {
      const item = document.createElement("div");
      item.className = "custom-category-item";
      item.innerHTML = `
        <span></span>
        <button class="custom-category-remove" data-category="">Remove</button>
      `;
      item.querySelector("span").textContent = cat;
      item.querySelector("button").dataset.category = cat;
      this.elements.customCategoriesList.appendChild(item);
    });
  }

  render() {
    const tasks = this.taskManager.query({
      category: this.state.category,
      keyword: this.state.keyword,
      sortBy: this.state.sortBy,
    });

    this.elements.taskList.innerHTML = "";

    if (tasks.length === 0) {
      this.elements.emptyState.classList.remove("is-hidden");
      const total = this.taskManager.getAll().length;
      const message = total === 0
        ? "No tasks yet."
        : "No tasks match your filters.";
      this.elements.emptyState.querySelector(".empty-text").textContent = message;
      return;
    }

    this.elements.emptyState.classList.add("is-hidden");

    tasks.forEach((task) => {
      this.elements.taskList.appendChild(this.createTaskNode(task));
    });
  }

  createTaskNode(task) {
    const node = document.createElement("article");
    node.className = "task-item";
    if (task.completed) node.classList.add("is-completed");
    node.dataset.taskId = task.id;

    node.innerHTML = `
      <button class="task-checkbox ${task.completed ? "is-checked" : ""}" aria-label="Toggle complete"></button>
      <div class="task-body">
        <h3 class="task-title"></h3>
        <p class="task-description"></p>
        <div class="task-meta">
          <span class="priority-tag priority-${task.priority}"></span>
          <span class="category-tag"></span>
          <span class="task-date"></span>
        </div>
      </div>
      <div class="task-actions">
        <button class="task-action" data-action="edit">Edit</button>
        <button class="task-action task-action--delete" data-action="delete">Delete</button>
      </div>
    `;

    node.querySelector(".task-title").textContent = task.title;
    const descEl = node.querySelector(".task-description");
    if (task.description) {
      descEl.textContent = task.description;
    } else {
      descEl.remove();
    }
    node.querySelector(".priority-tag").textContent = PRIORITY_LABELS[task.priority];
    node.querySelector(".category-tag").textContent = task.category;
    node.querySelector(".task-date").textContent = this.formatDate(task.createdAt);

    return node;
  }

  formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const sameDay = date.toDateString() === now.toDateString();
    if (sameDay) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }
}
