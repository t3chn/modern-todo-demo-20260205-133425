(() => {
  const STORAGE_KEY = "modern-todo-demo:v1";
  const FILTER_KEY = "modern-todo-demo:filter:v1";

  const todoInput = document.getElementById("newTodo");
  const addButton = document.getElementById("addTodo");
  const clearDoneButton = document.getElementById("clearDone");
  const stats = document.getElementById("stats");
  const list = document.getElementById("todoList");
  const emptyState = document.getElementById("emptyState");
  const filterButtons = Array.from(document.querySelectorAll(".filter"));

  /** @type {{id: string, text: string, done: boolean, createdAt: number}[]} */
  let todos = [];
  /** @type {"all" | "active" | "done"} */
  let filter = "all";

  function safeJsonParse(raw, fallback) {
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function makeId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function load() {
    const savedTodos = safeJsonParse(localStorage.getItem(STORAGE_KEY) ?? "[]", []);
    if (Array.isArray(savedTodos)) {
      todos = savedTodos
        .filter((t) => t && typeof t === "object")
        .map((t) => ({
          id: typeof t.id === "string" ? t.id : makeId(),
          text: typeof t.text === "string" ? t.text : "",
          done: Boolean(t.done),
          createdAt: typeof t.createdAt === "number" ? t.createdAt : Date.now(),
        }))
        .filter((t) => t.text.trim().length > 0);
    }

    const savedFilter = localStorage.getItem(FILTER_KEY);
    if (savedFilter === "all" || savedFilter === "active" || savedFilter === "done") {
      filter = savedFilter;
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    localStorage.setItem(FILTER_KEY, filter);
  }

  function setFilter(next) {
    filter = next;
    for (const button of filterButtons) {
      button.classList.toggle("is-active", button.dataset.filter === next);
    }
    save();
    render();
  }

  function addTodoFromInput() {
    const rawText = todoInput.value ?? "";
    const text = rawText.trim().replace(/\s+/g, " ");
    if (!text) return;

    todos.unshift({
      id: makeId(),
      text,
      done: false,
      createdAt: Date.now(),
    });
    todoInput.value = "";
    save();
    render();
  }

  function toggleTodo(id, done) {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    todo.done = done;
    save();
    render();
  }

  function deleteTodo(id) {
    todos = todos.filter((t) => t.id !== id);
    save();
    render();
  }

  function clearDone() {
    const before = todos.length;
    todos = todos.filter((t) => !t.done);
    if (todos.length === before) return;
    save();
    render();
  }

  function selectTodos() {
    switch (filter) {
      case "active":
        return todos.filter((t) => !t.done);
      case "done":
        return todos.filter((t) => t.done);
      default:
        return todos;
    }
  }

  function updateStats() {
    const total = todos.length;
    const done = todos.filter((t) => t.done).length;
    const remaining = total - done;

    if (total === 0) {
      stats.textContent = "0 задач";
    } else if (done === 0) {
      stats.textContent = `${total} задач · 0 выполнено`;
    } else {
      stats.textContent = `${remaining} осталось · ${done} выполнено`;
    }

    clearDoneButton.disabled = done === 0;
  }

  function updateEmptyState(visibleCount) {
    const hasAny = todos.length > 0;
    emptyState.hidden = visibleCount !== 0;

    if (visibleCount !== 0) return;

    const title = emptyState.querySelector(".empty__title");
    const subtitle = emptyState.querySelector(".empty__subtitle");
    if (!title || !subtitle) return;

    if (!hasAny) {
      title.textContent = "Пока пусто";
      subtitle.textContent = "Введите задачу и нажмите Enter.";
      return;
    }

    if (filter === "active") {
      title.textContent = "Нет активных";
      subtitle.textContent = "Все задачи выполнены.";
      return;
    }

    if (filter === "done") {
      title.textContent = "Нет выполненных";
      subtitle.textContent = "Отметьте задачу — и она появится тут.";
      return;
    }

    title.textContent = "Пока пусто";
    subtitle.textContent = "Добавьте новую задачу.";
  }

  function render() {
    const visibleTodos = selectTodos();
    list.replaceChildren();

    const fragment = document.createDocumentFragment();
    for (const todo of visibleTodos) {
      const li = document.createElement("li");
      li.className = `todo${todo.done ? " is-done" : ""}`;

      const label = document.createElement("label");
      label.className = "todo__label";

      const checkbox = document.createElement("input");
      checkbox.className = "todo__checkbox";
      checkbox.type = "checkbox";
      checkbox.checked = todo.done;
      checkbox.addEventListener("change", () => toggleTodo(todo.id, checkbox.checked));

      const text = document.createElement("span");
      text.className = "todo__text";
      text.textContent = todo.text;

      label.append(checkbox, text);

      const del = document.createElement("button");
      del.className = "todo__delete";
      del.type = "button";
      del.title = "Удалить";
      del.setAttribute("aria-label", `Удалить: ${todo.text}`);
      del.textContent = "✕";
      del.addEventListener("click", () => deleteTodo(todo.id));

      li.append(label, del);
      fragment.append(li);
    }

    list.append(fragment);

    updateStats();
    updateEmptyState(visibleTodos.length);
  }

  function bind() {
    addButton.addEventListener("click", addTodoFromInput);
    todoInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        addTodoFromInput();
        return;
      }

      const isClear = (event.metaKey || event.ctrlKey) && event.key === "Backspace";
      if (isClear) {
        event.preventDefault();
        clearDone();
      }
    });

    clearDoneButton.addEventListener("click", clearDone);

    for (const button of filterButtons) {
      button.addEventListener("click", () => {
        const next = button.dataset.filter;
        if (next === "all" || next === "active" || next === "done") {
          setFilter(next);
        }
      });
    }
  }

  load();
  bind();
  setFilter(filter);
  render();
})();
