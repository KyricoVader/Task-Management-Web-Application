import { Task } from "./Task.js";

const STORAGE_KEY_TASKS = "tasks.app.tasks";
const STORAGE_KEY_CATEGORIES = "tasks.app.categories";
const DEFAULT_CATEGORIES = ["Personal", "Work", "Urgent"];
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

export class TaskManager {
  constructor() {
    this.tasks = [];
    this.customCategories = [];
    this.load();
  }

  add(taskData) {
    const task = new Task(taskData);
    this.tasks.push(task);
    this.save();
    return task;
  }

  remove(id) {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;
    const [removed] = this.tasks.splice(index, 1);
    this.save();
    return removed;
  }

  update(id, fields) {
    const task = this.getById(id);
    if (!task) return null;
    task.update(fields);
    this.save();
    return task;
  }

  toggleComplete(id) {
    const task = this.getById(id);
    if (!task) return null;
    task.toggleComplete();
    this.save();
    return task;
  }

  getById(id) {
    return this.tasks.find((t) => t.id === id) || null;
  }

  getAll() {
    return [...this.tasks];
  }

  filter({ category = "all", keyword = "" } = {}) {
    return this.tasks.filter((task) => {
      const matchCategory = category === "all" || task.category === category;
      const matchKeyword = task.matchesKeyword(keyword);
      return matchCategory && matchKeyword;
    });
  }

  sort(tasks, sortBy = "created") {
    const list = [...tasks];
    if (sortBy === "priority") {
      list.sort((a, b) => {
        const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.createdAt - a.createdAt;
      });
    } else {
      list.sort((a, b) => b.createdAt - a.createdAt);
    }
    return list;
  }

  query({ category, keyword, sortBy }) {
    return this.sort(this.filter({ category, keyword }), sortBy);
  }

  getCategories() {
    return [...DEFAULT_CATEGORIES, ...this.customCategories];
  }

  getCustomCategories() {
    return [...this.customCategories];
  }

  isDefaultCategory(name) {
    return DEFAULT_CATEGORIES.includes(name);
  }

  addCategory(name) {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, error: "Category name cannot be empty." };
    if (trimmed.length > 30) return { ok: false, error: "Category name is too long." };
    const existing = this.getCategories().map((c) => c.toLowerCase());
    if (existing.includes(trimmed.toLowerCase())) {
      return { ok: false, error: "This category already exists." };
    }
    this.customCategories.push(trimmed);
    this.saveCategories();
    return { ok: true, category: trimmed };
  }

  removeCategory(name) {
    if (this.isDefaultCategory(name)) return false;
    const index = this.customCategories.indexOf(name);
    if (index === -1) return false;
    this.customCategories.splice(index, 1);
    this.tasks.forEach((task) => {
      if (task.category === name) task.category = "Personal";
    });
    this.save();
    this.saveCategories();
    return true;
  }

  save() {
    try {
      const data = this.tasks.map((t) => t.toJSON());
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save tasks", e);
    }
  }

  saveCategories() {
    try {
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(this.customCategories));
    } catch (e) {
      console.error("Failed to save categories", e);
    }
  }

  load() {
    try {
      const rawTasks = localStorage.getItem(STORAGE_KEY_TASKS);
      if (rawTasks) {
        const parsed = JSON.parse(rawTasks);
        this.tasks = Array.isArray(parsed) ? parsed.map((data) => new Task(data)) : [];
      }
      const rawCategories = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      if (rawCategories) {
        const parsed = JSON.parse(rawCategories);
        this.customCategories = Array.isArray(parsed) ? parsed.filter((c) => typeof c === "string") : [];
      }
    } catch (e) {
      console.error("Failed to load data", e);
      this.tasks = [];
      this.customCategories = [];
    }
  }
}
