import React, { useState, useEffect, useMemo, useCallback, createContext, useContext, useRef } from 'react';


const createStore = (reducer, initialState) => {
  let state = initialState;
  const listeners = new Set();

  state = reducer(undefined, { type: '@@INIT' });

  return {
    getState: () => state,
    dispatch: (action) => {
      state = reducer(state, action);
      listeners.forEach(listener => listener());
      return action;
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
};

const configureStore = ({ reducer }) => {
  return createStore(reducer, undefined);
};

const createSlice = ({ name, initialState, reducers }) => {
  const actions = {};

  Object.keys(reducers).forEach(key => {
    const type = `${name}/${key}`;
    actions[key] = (payload) => ({ type, payload });
  });

  const reducer = (state = initialState, action) => {
    if (action.type && action.type.startsWith(`${name}/`)) {
      const key = action.type.split('/')[1];
      if (reducers[key]) {
        return reducers[key](state, action);
      }
    }
    return state;
  };

  return { actions, reducer };
};

const ReduxContext = createContext(null);

const Provider = ({ store, children }) => {
  return <ReduxContext.Provider value={store}>{children}</ReduxContext.Provider>;
};

const useDispatch = () => {
  const store = useContext(ReduxContext);
  return store ? store.dispatch : () => { };
};

const useSelector = (selector) => {
  const store = useContext(ReduxContext);
  const [state, setState] = useState(() => selector(store.getState()));
  const selectorRef = useRef(selector);
  const stateRef = useRef(state);

  selectorRef.current = selector;

  useEffect(() => {
    const checkForUpdates = () => {
      const newState = selectorRef.current(store.getState());
      if (newState !== stateRef.current) {
        stateRef.current = newState;
        setState(newState);
      }
    };
    const unsubscribe = store.subscribe(checkForUpdates);
    checkForUpdates();
    return unsubscribe;
  }, [store]);

  return state;
};

const resolveIndex = (array, selector) => {
  if (!Array.isArray(array)) return -1;
  // Caso 1: Índice numérico directo "0", "1", etc.
  if (/^\d+$/.test(selector)) {
    return parseInt(selector, 10);
  }
  // Caso 2: Query "key=value"
  if (selector.includes('=')) {
    const [key, val] = selector.split('=');
    return array.findIndex(item => item && String(item[key]) === String(val));
  }
  return -1;
};
const getter = (object, path, defaultValue = undefined) => {
  if (object == null) return defaultValue;
  if (!path || typeof path !== 'string') return object;

  const keys = path.split('.');
  let result = object;

  for (const key of keys) {
    if (result == null) return defaultValue;

    if (key.includes('[') && key.includes(']')) {
      const match = key.match(/^([^\[]+)\[([^\]]+)\]$/);
      if (!match) {
        result = result[key];
        continue;
      }

      const arrayName = match[1];
      const selector = match[2];

      result = result[arrayName];
      if (!Array.isArray(result)) return defaultValue;

      const index = resolveIndex(result, selector);
      if (index === -1) return defaultValue;
      result = result[index];
    } else {
      result = result[key];
    }
    if (result === undefined) return defaultValue;
  }
  return result !== undefined ? result : defaultValue;
};

const setter = (state, { payload: { key, value, noMerge } }) => {
  if (!key) return state;

  const setValueImmutable = (obj, pathSegments, newValue) => {
    if (pathSegments.length === 0) return newValue;

    const [current, ...rest] = pathSegments;
    let currentObj;
    if (Array.isArray(obj)) {
      currentObj = [...obj];
    } else if (obj && typeof obj === 'object') {
      currentObj = { ...obj };
    } else {
      const nextIsArrayLike = !isNaN(rest[0]) || (rest[0] && rest[0].includes('='));
      currentObj = nextIsArrayLike ? [] : {};
    }

    if (Array.isArray(currentObj)) {
      const index = resolveIndex(currentObj, current);

      if (rest.length === 0) {
        if (index >= 0) {
          currentObj[index] = newValue;
        } else if (/^\d+$/.test(current)) {
          const newIdx = parseInt(current, 10);
          currentObj[newIdx] = newValue;
        }
        return currentObj;
      }

      if (index >= 0) {
        currentObj[index] = setValueImmutable(currentObj[index], rest, newValue);
      }
      return currentObj;
    }

    if (rest.length === 0) {
      const existing = currentObj[current];
      if (
        !noMerge && 
        existing &&
        typeof existing === 'object' &&
        !Array.isArray(existing) &&
        newValue &&
        typeof newValue === 'object' &&
        !Array.isArray(newValue)
      ) {
        currentObj[current] = { ...existing, ...newValue };
      } else {
        currentObj[current] = newValue;
      }
    } else {
      const nextSegment = rest[0];
      const nextIsArrayLike = !isNaN(nextSegment) || (typeof nextSegment === 'string' && nextSegment.includes('='));
      const nextBase = currentObj[current] !== undefined ? currentObj[current] : (nextIsArrayLike ? [] : {});

      currentObj[current] = setValueImmutable(nextBase, rest, newValue);
    }
    return currentObj;
  };

  const pathSegments = [];
  const parts = key.split('.');
  for (const part of parts) {
    if (part.includes('[') && part.includes(']')) {
      const match = part.match(/^([^\[]+)\[([^\]]+)\]$/);
      if (match) {
        pathSegments.push(match[1], match[2]);
      } else {
        pathSegments.push(part);
      }
    } else {
      pathSegments.push(part);
    }
  }

  return setValueImmutable(state, pathSegments, value);
};

const remover = (state, { payload: { key } }) => {
  if (!key) return state;

  const removeValueImmutable = (obj, pathSegments) => {
    if (pathSegments.length === 0) return obj;

    const [current, ...rest] = pathSegments;
    let currentObj;

    if (Array.isArray(obj)) {
      currentObj = [...obj];
    } else if (obj && typeof obj === 'object') {
      currentObj = { ...obj };
    } else {
      return obj;
    }

    if (Array.isArray(currentObj)) {
      const index = resolveIndex(currentObj, current);
      if (rest.length === 0) {
        if (index >= 0) {
          currentObj.splice(index, 1);
        }
      } else {
        if (index >= 0 && currentObj[index] !== undefined) {
          currentObj[index] = removeValueImmutable(currentObj[index], rest);
        }
      }
      return currentObj;
    }

    if (rest.length === 0) {
      delete currentObj[current];
    } else {
      if (currentObj[current] !== undefined) {
        currentObj[current] = removeValueImmutable(currentObj[current], rest);
      }
    }
    return currentObj;
  };

  const pathSegments = [];
  const parts = key.split('.');
  for (const part of parts) {
    if (part.includes('[') && part.includes(']')) {
      const match = part.match(/^([^\[]+)\[([^\]]+)\]$/);
      if (match) {
        pathSegments.push(match[1], match[2]);
      } else {
        pathSegments.push(part);
      }
    } else {
      pathSegments.push(part);
    }
  }

  return removeValueImmutable(state, pathSegments);
};



export const StateContext = createContext(null);
export const ActionsContext = createContext(null);

const createStateOperations = (store, slice) => {
  const get = (path, defaultValue) => {
    if (path === undefined || path === null) return store.getState();
    return getter(store.getState(), path, defaultValue);
  };

  const set = (path, value, options = {}) => {
    const dispatchResult = store.dispatch(slice.actions.setter({ key: path, value, ...options }));
    return {
      ...dispatchResult,
      update: (callback) => {
        if (typeof callback === 'function') {
          callback(get(path));
        }
        return { state: get(path) };
      }
    };
  };
  const use = (path) => {
    const dispatch = useDispatch();
    const value = useSelector(state => {
      const currentValue = getter(state, path);
      if (path.endsWith('[]') && currentValue === undefined) return [];
      return currentValue;
    });

    const setValue = useCallback((newValue) => {
      if (path.endsWith('[]')) {
        const cleanPath = path.slice(0, -2);
        const currentArray = getter(store.getState(), cleanPath) || [];
        if (Array.isArray(currentArray)) {
          const updatedArray = Array.isArray(newValue)
            ? [...currentArray, ...newValue]
            : [...currentArray, newValue];
          dispatch(slice.actions.setter({ key: cleanPath, value: updatedArray }));
        }
      } else {
        dispatch(slice.actions.setter({ key: path, value: newValue }));
      }
    }, [path, dispatch, store]);

    return [value, setValue];
  };
  const remove = (path) => {
    const dispatchResult = store.dispatch(slice.actions.remover({ key: path }));
    return {
      ...dispatchResult,
      update: (callback) => {
        if (typeof callback === 'function') {
          callback(store.getState());
        }
        return { state: store.getState() };
      }
    };
  };

  const push = (path, value) => {
    const cleanPath = path.endsWith('[]') ? path.slice(0, -2) : path;
    const currentArray = get(cleanPath);

    if (Array.isArray(currentArray)) {
      const newArray = Array.isArray(value) ? [...currentArray, ...value] : [...currentArray, value];
      return set(cleanPath, newArray);
    } else if (currentArray === undefined) {
      return set(cleanPath, Array.isArray(value) ? value : [value]);
    }
    return set(path, value);
  };

  const clear = (path) => {
    const val = get(path);
    const emptyValue = Array.isArray(val) ? [] : {};
    // FIX: Usamos noMerge: true para forzar el reemplazo del objeto y evitar el merge
    return set(path, emptyValue, { noMerge: true });
  };

  return { set, get, remove, push, clear, use };
};

export function PathduxProvider({ initialState = {}, initialActions = {}, children }) {
  const slice = useMemo(() => createSlice({
    name: "state",
    initialState,
    reducers: { setter, remover }
  }), [initialState]);

  const store = useMemo(() => configureStore({ reducer: slice.reducer }), [slice]);
  const State = useMemo(() => createStateOperations(store, slice), [store, slice]);

  const Action = useMemo(() =>
    typeof initialActions === "function"
      ? initialActions({ State, getState: store.getState })
      : initialActions,
    [State, store, initialActions]);

  return (
    <Provider store={store}>
      <StateContext.Provider value={State}>
        <ActionsContext.Provider value={Action}>
          <ChildWrapper State={State} Action={Action}>{children}</ChildWrapper>
        </ActionsContext.Provider>
      </StateContext.Provider>
    </Provider>
  );
}

const ChildWrapper = ({ State, Action, children }) => {
  return React.Children.map(children, (child) =>
    React.isValidElement(child) ? React.cloneElement(child, { State, Action }) : child
  );
};