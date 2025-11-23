
export const setter = (state, { payload: { key, value } }) => {


  if (!key) return state;

  const parsePath = (path) => {
    const segments = [];
    let current = path;

    while (current) {
      const propMatch = current.match(/^([^.[\]]+)/);
      if (!propMatch) break;

      const prop = propMatch[1];
      current = current.slice(prop.length);

      const selectors = [];
      while (current.startsWith("[")) {
        const bracketMatch = current.match(/^\[([^[\]]+)\]/);
        if (!bracketMatch) break;

        const expr = bracketMatch[1];
        let selector = null;

        if (/^\d+$/.test(expr)) {
          selector = { type: "index", index: Number(expr) };
        } else if (expr.includes("=")) {
          const [k, v] = expr.split("=");
          selector = { type: "match", key: k, value: v };
        } else {
          selector = { type: "match", key: expr, value: undefined };
        }

        selectors.push(selector);
        current = current.slice(bracketMatch[0].length);
      }

      segments.push({
        prop,
        selectors: selectors.length > 0 ? selectors : null
      });

      if (current.startsWith(".")) {
        current = current.slice(1);
      }
    }

    return segments;
  };

  const createIdItem = (arr, key, value, shouldMerge = true) => {
    let idx = arr.findIndex(
      (item) => item && String(item[key]) === String(value)
    );

    if (idx === -1) {
      const newItem = { [key]: value };
      arr.push(newItem);
      return { item: newItem, index: arr.length - 1 };
    }

    return { item: arr[idx], index: idx };
  };

  const advancedSet = (root, path, value) => {
    const segments = parsePath(path);
    let current = root;

    segments.forEach((seg, index) => {
      const isLast = index === segments.length - 1;
      const { prop, selectors } = seg;

      if (!selectors) {
        if (prop == null) return;

        if (isLast) {
          current[prop] = value;
        } else {
          if (current[prop] == null || typeof current[prop] !== "object") {
            current[prop] = {};
          }
          current = current[prop];
        }
        return;
      }

      let target = current;
      let targetProp = prop;

      for (let i = 0; i < selectors.length; i++) {
        const selector = selectors[i];
        const isLastSelector = isLast && i === selectors.length - 1;

        if (selector.type === "index") {
          const arr = Array.isArray(target[targetProp])
            ? target[targetProp]
            : (target[targetProp] = []);

          if (isLastSelector) {
            if (value && typeof value === "object" && !Array.isArray(value)) {
              arr[selector.index] = { ...arr[selector.index], ...value };
            } else {
              arr[selector.index] = value;
            }
          } else {
            if (
              arr[selector.index] == null ||
              typeof arr[selector.index] !== "object"
            ) {
              arr[selector.index] = {};
            }
            target = arr;
            targetProp = selector.index;
          }
        } else if (selector.type === "match") {
          const arr = Array.isArray(target[targetProp])
            ? target[targetProp]
            : (target[targetProp] = []);

          const { item, index: idx } = createIdItem(
            arr,
            selector.key,
            selector.value
          );

          if (isLastSelector) {
            if (value && typeof value === "object" && !Array.isArray(value)) {
              arr[idx] = { ...item, ...value };
            } else {
              arr[idx] = value;
            }
          } else {
            if (arr[idx] == null || typeof arr[idx] !== "object") {
              arr[idx] = { [selector.key]: selector.value };
            }
            target = arr;
            targetProp = idx;
          }
        }
      }

      if (!isLast) {
        current = target[targetProp];
      }
    });
  };

  advancedSet(state, key, value);
  return state;
};