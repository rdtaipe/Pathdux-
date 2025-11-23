# Pathdux ⚡  
**Path-based state management for React with smart merging**

Pathdux adds a lightweight layer on top of Redux Toolkit and React Context, letting you update nested state using simple path strings.

## 🚀 Why Pathdux?
✅ **Path-based updates** – Read and write state with simple string paths  
✅ **Smart merging** – Keeps existing properties, only updates what's needed  
✅ **Minimal API** – `getState()`, `setState()`, and `useState()`  
✅ **Zero boilerplate** – No reducers, actions, or dispatch in your UI code  
✅ **Auto sync** – Global ↔ local state synchronization  
✅ **Auto injection** – `action` prop available in all child components  

## 📦 Installation
```bash
npm install pathdux
```

## ⚡ Quick Start

### 1. Wrap your app
```jsx
import { PathduxProvider } from "pathdux";

const initialState = {
  user: { name: "John", age: 30 },
  text: "Hello, Pathdux!"
};


<PathduxProvider initialState={initialState}>
  <App />
</PathduxProvider>
```

### 2. Use it in components
The `action` prop is automatically injected into child components.

```jsx
function App({ action }) {
  // Option 1: Pathdux useState (recommended)
  const [text, setText] = action.useState("text");

  // Option 2: Direct access
  const user = action.getState("user");

  return (
    <div>
      <input
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <p>Hello, {user.name}</p>
    </div>
  );
}
```

## 🧠 Path Syntax
| Example | Description |
|---------|-------------|
| `"user.name"` | Nested property |
| `"todos[0]"` | Array index |
| `"todos[id=42]"` | Match by property |
| `"todos[]"` | Push into array |
| `"items[id=1].price"` | Deep nested update |

## 🔥 Smart Merging
Pathdux never replaces entire objects. It only updates what's necessary.

```javascript
// Initial state
const state = {
  user: {
    name: "John",
    email: "john@example.com",
    profile: { avatar: "img.jpg", theme: "dark" }
  }
};

// Smart update
action.setState("user.profile.theme", "light");

// Result: only 'theme' changes, 'avatar' is preserved
{
  user: {
    name: "John",
    email: "john@example.com",
    profile: { avatar: "img.jpg", theme: "light" }
  }
}
```

## 🔄 Global ↔ Local Sync

**Method 1: `action.useState` (recommended)**
```jsx
const [value, setValue] = action.useState("path.to.state");
// Changes automatically sync with global state
```

**Method 2: Manual sync**
```jsx
const [local, setLocal] = React.useState(action.getState("path"));

const update = (nextValue) => {
  action.setState("path", nextValue).update(setLocal);
};
```

## 🧩 Custom Actions
Add your own business logic:

```javascript
// initialActions.js
export const initialActions = ({ action, getState }) => ({
  addTodo: (text) => {
    action.setState("todos[]", {
      id: Date.now(),
      text,
      completed: false
    });
  },

  toggleTodo: (id) => {
    const completed = action.getState(`todos[id=${id}].completed`);
    action.setState(`todos[id=${id}].completed`, !completed);
  }
});
```

## 📐 API Summary

**`action.getState(path?)`**  
Returns the whole global state or the value at the given path.

**`action.setState(path, value)`**  
Updates the state at path with smart deep merge.  
Returns object with `.update(localSetter)` to sync local React state:

```javascript
action.setState("text", "Hello").update(setText);
```

**`action.useState(path)`**  
Hook that returns `[value, setValue]`, similar to `React.useState`, but wired to global state.

## 🎯 When to Use Pathdux

**Great for:**
- Complex, nested state
- Dynamic or multi-step forms  
- Configuration panels
- Tree-like data and dashboards

**Less ideal for:**
- Very simple state → just use `useState`
- Extremely performance-critical, ultra-granular updates


**License: MIT**