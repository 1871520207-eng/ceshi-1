const STORAGE_KEY = "lightTodoItems";

const form = document.querySelector("#todoForm");
const input = document.querySelector("#todoInput");
const list = document.querySelector("#todoList");
const template = document.querySelector("#todoTemplate");
const emptyState = document.querySelector("#emptyState");
const taskCount = document.querySelector("#taskCount");
const leftCount = document.querySelector("#leftCount");
const clearDoneButton = document.querySelector("#clearDone");
const filterButtons = [...document.querySelectorAll(".filter")];

let todos = [];
let currentFilter = "all";

function getStorage() {
  if (globalThis.chrome?.storage?.local) {
    return {
      async read() {
        const result = await chrome.storage.local.get(STORAGE_KEY);
        return result[STORAGE_KEY] || [];
      },
      async write(items) {
        await chrome.storage.local.set({ [STORAGE_KEY]: items });
      }
    };
  }

  return {
    async read() {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    },
    async write(items) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  };
}

const storage = getStorage();

function createTodo(text) {
  return {
    id: crypto.randomUUID(),
    text,
    done: false,
    createdAt: Date.now()
  };
}

function visibleTodos() {
  if (currentFilter === "active") {
    return todos.filter((todo) => !todo.done);
  }

  if (currentFilter === "done") {
    return todos.filter((todo) => todo.done);
  }

  return todos;
}

async function saveAndRender() {
  await storage.write(todos);
  render();
}

function render() {
  const items = visibleTodos();
  list.replaceChildren();

  for (const todo of items) {
    const node = template.content.firstElementChild.cloneNode(true);
    const checkbox = node.querySelector("input");
    const text = node.querySelector(".todoText");
    const deleteButton = node.querySelector(".delete");

    node.classList.toggle("done", todo.done);
    checkbox.checked = todo.done;
    text.textContent = todo.text;

    checkbox.addEventListener("change", async () => {
      todos = todos.map((item) =>
        item.id === todo.id ? { ...item, done: checkbox.checked } : item
      );
      await saveAndRender();
    });

    deleteButton.addEventListener("click", async () => {
      todos = todos.filter((item) => item.id !== todo.id);
      await saveAndRender();
    });

    list.append(node);
  }

  const activeCount = todos.filter((todo) => !todo.done).length;
  taskCount.textContent = todos.length;
  leftCount.textContent = `${activeCount} 项未完成`;
  emptyState.hidden = items.length > 0;
  clearDoneButton.disabled = todos.every((todo) => !todo.done);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = input.value.trim();

  if (!text) {
    return;
  }

  todos = [createTodo(text), ...todos];
  input.value = "";
  await saveAndRender();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    filterButtons.forEach((item) => {
      const isActive = item === button;
      item.classList.toggle("active", isActive);
      item.setAttribute("aria-selected", String(isActive));
    });
    render();
  });
});

clearDoneButton.addEventListener("click", async () => {
  todos = todos.filter((todo) => !todo.done);
  await saveAndRender();
});

async function init() {
  todos = await storage.read();
  render();
  input.focus();
}

init();
