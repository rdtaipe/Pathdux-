# Pathdux ⚡

### 🔗 Live Demo

[![Open in CodeSandbox](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/wc8mrh?file=/src/App.js)

**Simple and powerful global state for React with intuitive syntax**

Pathdux is a state management library for React that combines the simplicity of local state with the power of global state, using a path-based syntax to access and modify data.

## 🚀 Key Features

- **✅ Simple syntax** - Access state with paths like `"user.profile.name"`
- **✅ Intuitive operations** - `set`, `get`, `remove`, `push`, and `clear`
- **✅ Immutable updates** - No side effects
- **✅ Flexible typing** - Supports objects, arrays, and primitive values
- **✅ Zero configuration** - Ready to use immediately

## 📦 Installation

```bash
npm install pathdux
```

## ⚡ Quick Start

### 1. Initial Setup

```jsx
import { PathduxProvider } from 'pathdux';

const initialState = {
  user: { name: "Ana", age: 28 },
  todos: [
    { id: 1, text: "Learn Pathdux", completed: false }
  ]
};
//customize your actions
const initialActions = ({ State }) => ({
    user: () => State.get("user")
    //...
});

function App() {
  return (
    <PathduxProvider initialState={initialState} initialActions={initialActions}>
      <TodoApp />
    </PathduxProvider>
  );
}
```

### 2. Usage in Components

```jsx
function TodoApp({ State, Action }) {
  // Get values from state
  const user = State.get("user");
  const todos = State.get("todos");

  const currentUser = Action.user()

  const toggleTheme = () => {
    const currentTheme = State.get("app.theme");
    State.set("app.theme", currentTheme === 'dark' ? 'light' : 'dark');
  };
  
  return (
    <div>
      <h1>Hello, {user.name}!</h1>
      <button onClick={toggleTheme}>
        Toggle theme
      </button>
    </div>
  );
}
```

## 🛠 Complete API

### `State.get(path?, defaultValue?)`
Gets a value from global state.

```jsx
// Complete state
const fullState = State.get();

// Specific value
const userName = State.get("user.name");

// With default value
const theme = State.get("app.theme", "light");
```

### `State.set(path, value, options?)`
Sets a value in the state.

```jsx
// Simple value
State.set("user.age", 29);

// Nested object
State.set("app.settings.theme", "dark");

// With options (noMerge prevents object merging)
State.set("user.profile", { premium: true }, { noMerge: true });
```

### `State.push(path, value)`
Adds elements to an array.

```jsx
// Add single element
State.push("todos", { id: 2, text: "New task" });

// Add multiple elements
State.push("todos", [task1, task2, task3]);
```

### `State.remove(path)`
Removes properties or array elements.

```jsx
// Remove property
State.remove("user.token");

// Remove from array by index
State.remove("todos[0]");

// Remove by condition
State.remove("todos[id=2]");
```

### `State.clear(path)`
Clears arrays or objects.

```jsx
// Empty array
State.clear("todos");

// Empty object
State.clear("user.preferences");
```

## 🎯 Practical Examples

### User Management

```jsx
function UserProfile({ State, Action }) {
  const user = State.get("user");
  
  const updateName = (name) => {
    State.set("user.name", name);
  };
  
  const addPreference = (key, value) => {
    State.push("user.preferences[]", { key, value });
  };
  
  const logout = () => {
    State.remove("user.token");
    State.clear("user.session");
  };
  
  return (
    <div>
      <input 
        value={user.name} 
        onChange={e => updateName(e.target.value)} 
      />
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Todo List

```jsx
function TodoList({ State, Action }) {
  const todos = State.get("todos") || [];
  
  const addTodo = (text) => {
    State.push("todos[]", {
      id: Date.now(),
      text,
      completed: false
    });
  };
  
  const toggleTodo = (id) => {
    const completed = State.get(`todos[id=${id}].completed`);
    State.set(`todos[id=${id}].completed`, !completed);
  };
  
  const clearCompleted = () => {
    const completedIds = todos
      .filter(todo => todo.completed)
      .map(todo => todo.id);
    
    completedIds.forEach(id => {
      State.remove(`todos[id=${id}]`);
    });
  };
  
  return (
    <div>
      {todos.map(todo => (
        <div key={todo.id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => toggleTodo(todo.id)}
          />
          {todo.text}
        </div>
      ))}
      <button onClick={clearCompleted}>Clear completed</button>
    </div>
  );
}
```

## 🔧 Advanced Configuration

### Custom Actions

```jsx
const initialActions = ({ State }) => ({
  // User actions
  login: (userData) => {
    State.set("user", userData);
    State.set("app.isLogged", true);
  },
  
  // Todo actions
  addTodo: (text) => {
    const newTodo = {
      id: Date.now(),
      text,
      completed: false,
      createdAt: new Date().toISOString()
    };
    State.push("todos", newTodo);
  },
  
  // Complex actions
  resetApp: () => {
    State.clear("todos");
    State.set("user.preferences", {});
    State.set("app.theme", "light");
  }
});

// In the Provider
<PathduxProvider 
  initialState={initialState} 
  initialActions={initialActions}
>
  <App />
</PathduxProvider>
```

## 📝 Important Notes

- **Paths with `[]`** are used for arrays: `State.push("todos[]", item)`
- **Queries with `[key=value]`** to find elements: `State.remove("todos[id=5]")`
- **All operations** are immutable and safe

## 🚀 Next Steps

Pathdux is perfect for applications that need global state without Redux complexity. Start with the basic examples and scale as needed.

**Issues or suggestions?** Open an issue on GitHub!

**License: MIT**