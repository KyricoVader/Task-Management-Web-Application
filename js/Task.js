export class Task {
  constructor({ id, title, description, priority, category, completed, createdAt }) {
    this.id = id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2, 8));
    this.title = title;
    this.description = description || "";
    this.priority = priority || "medium";
    this.category = category || "Personal";
    this.completed = Boolean(completed);
    this.createdAt = createdAt || Date.now();
  }

  toggleComplete() {
    this.completed = !this.completed;
    return this.completed;
  }

  update(fields) {
    if (fields.title !== undefined) this.title = fields.title;
    if (fields.description !== undefined) this.description = fields.description;
    if (fields.priority !== undefined) this.priority = fields.priority;
    if (fields.category !== undefined) this.category = fields.category;
  }

  isHighPriority() {
    return this.priority === "high";
  }

  matchesKeyword(keyword) {
    if (!keyword) return true;
    const k = keyword.toLowerCase().trim();
    return (
      this.title.toLowerCase().includes(k) ||
      this.description.toLowerCase().includes(k)
    );
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      priority: this.priority,
      category: this.category,
      completed: this.completed,
      createdAt: this.createdAt,
    };
  }
}
