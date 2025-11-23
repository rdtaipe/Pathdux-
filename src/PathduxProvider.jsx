import React from 'react';
import { Provider } from 'react-redux';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { get } from "lodash";
import { setter } from './core.js';




export const ActionsContext = React.createContext(null);

export function PathduxProvider({ initialState = {}, initialActions, children }) {
  const slice = createSlice({
    name: "state",
    initialState,
    reducers: { setter }
  });

  const store = configureStore({
    reducer: slice.reducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false })
  });

  const useState = (path) => {
    const [value, setValue] = React.useState(getState(path));
    const set = (newValue) => setState(path, newValue).update(setValue);
    return [value, set];
  };
  const setState = (path, value) => {
    const dispatchResult = store.dispatch(slice.actions.setter({ key: path, value }));

    return {
      ...dispatchResult,
      update: (callback) => {
        if (typeof callback === 'function') {
          const newValue = get(store.getState(), path);
          callback(newValue);
          return { state: newValue };
        }
        return { state: get(store.getState(), path) };
      }
    };
  };
  const getState = (path) => path ? get(store.getState(), path) : store.getState();

  ///
  const baseActions = {
    setState,
    getState,
    useState
  };

  const enhancedActions =
    typeof initialActions === "function"
      ? initialActions({ action: baseActions, getState: store.getState })
      : {};

  const actions = {
    ...baseActions,
    ...enhancedActions
  };

  return (
    <Provider store={store}>
      <ActionsContext.Provider value={actions}>
        {React.Children.map(children, (child) =>
          React.isValidElement(child)
            ? React.cloneElement(child, { action: actions })
            : child
        )}
      </ActionsContext.Provider>
    </Provider>
  );
}