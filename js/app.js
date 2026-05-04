import { TaskManager } from "./TaskManager.js";
import { UI } from "./UI.js";

const taskManager = new TaskManager();
const ui = new UI(taskManager);
