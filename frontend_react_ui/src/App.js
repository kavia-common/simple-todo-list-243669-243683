import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

const STORAGE_KEY = "simple_todo_list.todos.v1";

/**
 * @typedef {"all" | "active" | "completed"} Filter
 */

/** @typedef {{ id: string, text: string, completed: boolean, createdAt: number }} Todo */

// PUBLIC_INTERFACE
function App() {
  /** @type {[Todo[], Function]} */
  const [todos, setTodos] = useState(() => loadTodos());
  /** @type {[Filter, Function]} */
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  const visibleTodos = useMemo(() => applyFilter(todos, filter), [todos, filter]);
  const activeCount = useMemo(
    () => todos.reduce((acc, t) => acc + (t.completed ? 0 : 1), 0),
    [todos]
  );
  const completedCount = todos.length - activeCount;

  // PUBLIC_INTERFACE
  const addTodo = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const todo = {
      id: createId(),
      text: trimmed,
      completed: false,
      createdAt: Date.now(),
    };

    setTodos((prev) => [todo, ...prev]);
  };

  // PUBLIC_INTERFACE
  const toggleTodo = (id) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  // PUBLIC_INTERFACE
  const deleteTodo = (id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  // PUBLIC_INTERFACE
  const clearCompleted = () => {
    setTodos((prev) => prev.filter((t) => !t.completed));
  };

  return (
    <div className="App">
      <main className="app-shell">
        <Header activeCount={activeCount} totalCount={todos.length} />
        <TodoComposer onAdd={addTodo} />
        <Controls
          filter={filter}
          onChangeFilter={setFilter}
          completedCount={completedCount}
          onClearCompleted={clearCompleted}
          disabledClear={completedCount === 0}
        />
        <TodoList todos={visibleTodos} onToggle={toggleTodo} onDelete={deleteTodo} />
        <Footer />
      </main>
    </div>
  );
}

function Header({ activeCount, totalCount }) {
  return (
    <header className="header">
      <div className="brand">
        <div className="brand-badge" aria-hidden="true">
          TL
        </div>
        <div>
          <h1 className="title">Retro Todo List</h1>
          <p className="subtitle">
            {activeCount} active · {totalCount} total
          </p>
        </div>
      </div>
      <div className="scanline" aria-hidden="true" />
    </header>
  );
}

function TodoComposer({ onAdd }) {
  const [text, setText] = useState("");

  // PUBLIC_INTERFACE
  const submit = (e) => {
    e.preventDefault();
    onAdd(text);
    setText("");
  };

  const canAdd = text.trim().length > 0;

  return (
    <form className="composer" onSubmit={submit}>
      <label className="sr-only" htmlFor="new-todo">
        Add a todo
      </label>
      <input
        id="new-todo"
        className="input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a todo…"
        autoComplete="off"
        autoFocus
        aria-label="Todo text"
      />
      <button className="btn btn-primary" type="submit" disabled={!canAdd}>
        Add
      </button>
    </form>
  );
}

function Controls({ filter, onChangeFilter, completedCount, onClearCompleted, disabledClear }) {
  return (
    <section className="controls" aria-label="Todo filters">
      <Segmented
        value={filter}
        onChange={onChangeFilter}
        options={[
          { value: "all", label: "All" },
          { value: "active", label: "Active" },
          { value: "completed", label: "Completed" },
        ]}
      />
      <button className="btn btn-ghost" onClick={onClearCompleted} disabled={disabledClear}>
        Clear done ({completedCount})
      </button>
    </section>
  );
}

function Segmented({ value, onChange, options }) {
  return (
    <div className="segmented" role="tablist" aria-label="Filter">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            className={`segmented-item ${active ? "is-active" : ""}`}
            onClick={() => onChange(opt.value)}
            role="tab"
            aria-selected={active}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function TodoList({ todos, onToggle, onDelete }) {
  return (
    <section className="list" aria-label="Todo list">
      {todos.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="items" role="list">
          {todos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} onToggle={onToggle} onDelete={onDelete} />
          ))}
        </ul>
      )}
    </section>
  );
}

function TodoItem({ todo, onToggle, onDelete }) {
  const checkboxId = `todo-${todo.id}`;

  return (
    <li className={`item ${todo.completed ? "is-completed" : ""}`}>
      <div className="item-left">
        <input
          id={checkboxId}
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
        />
        <label className="item-text" htmlFor={checkboxId}>
          {todo.text}
        </label>
      </div>
      <button className="btn btn-danger" type="button" onClick={() => onDelete(todo.id)}>
        Delete
      </button>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="empty">
      <p className="empty-title">No todos here.</p>
      <p className="empty-subtitle">Add one above to start your quest.</p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <span className="footer-hint">Tip: Your todos are saved locally in this browser.</span>
    </footer>
  );
}

/** @returns {Todo[]} */
function loadTodos() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((t) => t && typeof t.id === "string" && typeof t.text === "string")
      .map((t) => ({
        id: t.id,
        text: t.text,
        completed: Boolean(t.completed),
        createdAt: typeof t.createdAt === "number" ? t.createdAt : Date.now(),
      }));
  } catch {
    return [];
  }
}

/** @param {Todo[]} todos */
function saveTodos(todos) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // Ignore storage failures (private mode, quota, etc.)
  }
}

/** @param {Todo[]} todos @param {Filter} filter */
function applyFilter(todos, filter) {
  if (filter === "active") return todos.filter((t) => !t.completed);
  if (filter === "completed") return todos.filter((t) => t.completed);
  return todos;
}

/** @returns {string} */
function createId() {
  // Small, dependency-free ID. Stable enough for a local todo list.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default App;
