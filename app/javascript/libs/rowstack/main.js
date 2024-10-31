import "./main.css";
import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import * as React from "react";
import React__default, { createContext, useRef, createElement, useCallback, useContext, useReducer, useEffect, useDebugValue, useState, useLayoutEffect, Children, useMemo, forwardRef } from "react";
import * as ReactDOM from "react-dom";
import { createPortal } from "react-dom";
var define_import_meta_env_default$1 = { BASE_URL: "/", MODE: "production", DEV: false, PROD: true, SSR: false };
let keyCount = 0;
function atom(read, write) {
  const key = `atom${++keyCount}`;
  const config = {
    toString: () => key
  };
  if (typeof read === "function") {
    config.read = read;
  } else {
    config.init = read;
    config.read = function(get) {
      return get(this);
    };
    config.write = function(get, set, arg) {
      return set(
        this,
        typeof arg === "function" ? arg(get(this)) : arg
      );
    };
  }
  if (write) {
    config.write = write;
  }
  return config;
}
const hasInitialValue = (atom2) => "init" in atom2;
const isActuallyWritableAtom = (atom2) => !!atom2.write;
const cancelPromiseMap = /* @__PURE__ */ new WeakMap();
const registerCancelPromise = (promise, cancel) => {
  cancelPromiseMap.set(promise, cancel);
  promise.catch(() => {
  }).finally(() => cancelPromiseMap.delete(promise));
};
const cancelPromise = (promise, next) => {
  const cancel = cancelPromiseMap.get(promise);
  if (cancel) {
    cancelPromiseMap.delete(promise);
    cancel(next);
  }
};
const resolvePromise = (promise, value) => {
  promise.status = "fulfilled";
  promise.value = value;
};
const rejectPromise = (promise, e) => {
  promise.status = "rejected";
  promise.reason = e;
};
const isPromiseLike$1 = (x) => typeof (x == null ? void 0 : x.then) === "function";
const isEqualAtomValue = (a, b) => !!a && "v" in a && "v" in b && Object.is(a.v, b.v);
const isEqualAtomError = (a, b) => !!a && "e" in a && "e" in b && Object.is(a.e, b.e);
const hasPromiseAtomValue = (a) => !!a && "v" in a && a.v instanceof Promise;
const isEqualPromiseAtomValue = (a, b) => "v" in a && "v" in b && a.v.orig && a.v.orig === b.v.orig;
const returnAtomValue = (atomState) => {
  if ("e" in atomState) {
    throw atomState.e;
  }
  return atomState.v;
};
const createStore = () => {
  const atomStateMap = /* @__PURE__ */ new WeakMap();
  const mountedMap = /* @__PURE__ */ new WeakMap();
  const pendingMap = /* @__PURE__ */ new Map();
  let storeListenersRev2;
  let mountedAtoms;
  if ((define_import_meta_env_default$1 ? "production" : void 0) !== "production") {
    storeListenersRev2 = /* @__PURE__ */ new Set();
    mountedAtoms = /* @__PURE__ */ new Set();
  }
  const getAtomState = (atom2) => atomStateMap.get(atom2);
  const setAtomState = (atom2, atomState) => {
    if ((define_import_meta_env_default$1 ? "production" : void 0) !== "production") {
      Object.freeze(atomState);
    }
    const prevAtomState = atomStateMap.get(atom2);
    atomStateMap.set(atom2, atomState);
    if (!pendingMap.has(atom2)) {
      pendingMap.set(atom2, prevAtomState);
    }
    if (hasPromiseAtomValue(prevAtomState)) {
      const next = "v" in atomState ? atomState.v instanceof Promise ? atomState.v : Promise.resolve(atomState.v) : Promise.reject(atomState.e);
      if (prevAtomState.v !== next) {
        cancelPromise(prevAtomState.v, next);
      }
    }
  };
  const updateDependencies = (atom2, nextAtomState, nextDependencies) => {
    const dependencies = /* @__PURE__ */ new Map();
    let changed = false;
    nextDependencies.forEach((aState, a) => {
      if (!aState && a === atom2) {
        aState = nextAtomState;
      }
      if (aState) {
        dependencies.set(a, aState);
        if (nextAtomState.d.get(a) !== aState) {
          changed = true;
        }
      } else if ((define_import_meta_env_default$1 ? "production" : void 0) !== "production") {
        console.warn("[Bug] atom state not found");
      }
    });
    if (changed || nextAtomState.d.size !== dependencies.size) {
      nextAtomState.d = dependencies;
    }
  };
  const setAtomValue = (atom2, value, nextDependencies) => {
    const prevAtomState = getAtomState(atom2);
    const nextAtomState = {
      d: (prevAtomState == null ? void 0 : prevAtomState.d) || /* @__PURE__ */ new Map(),
      v: value
    };
    if (nextDependencies) {
      updateDependencies(atom2, nextAtomState, nextDependencies);
    }
    if (isEqualAtomValue(prevAtomState, nextAtomState) && prevAtomState.d === nextAtomState.d) {
      return prevAtomState;
    }
    if (hasPromiseAtomValue(prevAtomState) && hasPromiseAtomValue(nextAtomState) && isEqualPromiseAtomValue(prevAtomState, nextAtomState)) {
      if (prevAtomState.d === nextAtomState.d) {
        return prevAtomState;
      } else {
        nextAtomState.v = prevAtomState.v;
      }
    }
    setAtomState(atom2, nextAtomState);
    return nextAtomState;
  };
  const setAtomValueOrPromise = (atom2, valueOrPromise, nextDependencies, abortPromise) => {
    if (isPromiseLike$1(valueOrPromise)) {
      let continuePromise;
      const updatePromiseDependencies = () => {
        const prevAtomState = getAtomState(atom2);
        if (!hasPromiseAtomValue(prevAtomState) || prevAtomState.v !== promise) {
          return;
        }
        const nextAtomState = setAtomValue(
          atom2,
          promise,
          nextDependencies
        );
        if (mountedMap.has(atom2) && prevAtomState.d !== nextAtomState.d) {
          mountDependencies(atom2, nextAtomState, prevAtomState.d);
        }
      };
      const promise = new Promise((resolve, reject) => {
        let settled = false;
        valueOrPromise.then(
          (v) => {
            if (!settled) {
              settled = true;
              resolvePromise(promise, v);
              resolve(v);
              updatePromiseDependencies();
            }
          },
          (e) => {
            if (!settled) {
              settled = true;
              rejectPromise(promise, e);
              reject(e);
              updatePromiseDependencies();
            }
          }
        );
        continuePromise = (next) => {
          if (!settled) {
            settled = true;
            next.then(
              (v) => resolvePromise(promise, v),
              (e) => rejectPromise(promise, e)
            );
            resolve(next);
          }
        };
      });
      promise.orig = valueOrPromise;
      promise.status = "pending";
      registerCancelPromise(promise, (next) => {
        if (next) {
          continuePromise(next);
        }
        abortPromise == null ? void 0 : abortPromise();
      });
      return setAtomValue(atom2, promise, nextDependencies);
    }
    return setAtomValue(atom2, valueOrPromise, nextDependencies);
  };
  const setAtomError = (atom2, error, nextDependencies) => {
    const prevAtomState = getAtomState(atom2);
    const nextAtomState = {
      d: (prevAtomState == null ? void 0 : prevAtomState.d) || /* @__PURE__ */ new Map(),
      e: error
    };
    if (nextDependencies) {
      updateDependencies(atom2, nextAtomState, nextDependencies);
    }
    if (isEqualAtomError(prevAtomState, nextAtomState) && prevAtomState.d === nextAtomState.d) {
      return prevAtomState;
    }
    setAtomState(atom2, nextAtomState);
    return nextAtomState;
  };
  const readAtomState = (atom2, force) => {
    const atomState = getAtomState(atom2);
    if (!force && atomState) {
      if (mountedMap.has(atom2)) {
        return atomState;
      }
      if (Array.from(atomState.d).every(([a, s]) => {
        if (a === atom2) {
          return true;
        }
        const aState = readAtomState(a);
        return aState === s || isEqualAtomValue(aState, s);
      })) {
        return atomState;
      }
    }
    const nextDependencies = /* @__PURE__ */ new Map();
    let isSync = true;
    const getter = (a) => {
      if (a === atom2) {
        const aState2 = getAtomState(a);
        if (aState2) {
          nextDependencies.set(a, aState2);
          return returnAtomValue(aState2);
        }
        if (hasInitialValue(a)) {
          nextDependencies.set(a, void 0);
          return a.init;
        }
        throw new Error("no atom init");
      }
      const aState = readAtomState(a);
      nextDependencies.set(a, aState);
      return returnAtomValue(aState);
    };
    let controller;
    let setSelf;
    const options = {
      get signal() {
        if (!controller) {
          controller = new AbortController();
        }
        return controller.signal;
      },
      get setSelf() {
        if ((define_import_meta_env_default$1 ? "production" : void 0) !== "production" && !isActuallyWritableAtom(atom2)) {
          console.warn("setSelf function cannot be used with read-only atom");
        }
        if (!setSelf && isActuallyWritableAtom(atom2)) {
          setSelf = (...args) => {
            if ((define_import_meta_env_default$1 ? "production" : void 0) !== "production" && isSync) {
              console.warn("setSelf function cannot be called in sync");
            }
            if (!isSync) {
              return writeAtom(atom2, ...args);
            }
          };
        }
        return setSelf;
      }
    };
    try {
      const valueOrPromise = atom2.read(getter, options);
      return setAtomValueOrPromise(
        atom2,
        valueOrPromise,
        nextDependencies,
        () => controller == null ? void 0 : controller.abort()
      );
    } catch (error) {
      return setAtomError(atom2, error, nextDependencies);
    } finally {
      isSync = false;
    }
  };
  const readAtom = (atom2) => returnAtomValue(readAtomState(atom2));
  const addAtom = (atom2) => {
    let mounted = mountedMap.get(atom2);
    if (!mounted) {
      mounted = mountAtom(atom2);
    }
    return mounted;
  };
  const canUnmountAtom = (atom2, mounted) => !mounted.l.size && (!mounted.t.size || mounted.t.size === 1 && mounted.t.has(atom2));
  const delAtom = (atom2) => {
    const mounted = mountedMap.get(atom2);
    if (mounted && canUnmountAtom(atom2, mounted)) {
      unmountAtom(atom2);
    }
  };
  const recomputeDependents = (atom2) => {
    const dependencyMap = /* @__PURE__ */ new Map();
    const dirtyMap = /* @__PURE__ */ new WeakMap();
    const getDependents = (a) => {
      var _a;
      const dependents = new Set((_a = mountedMap.get(a)) == null ? void 0 : _a.t);
      pendingMap.forEach((_, pendingAtom) => {
        var _a2;
        if ((_a2 = getAtomState(pendingAtom)) == null ? void 0 : _a2.d.has(a)) {
          dependents.add(pendingAtom);
        }
      });
      return dependents;
    };
    const loop1 = (a) => {
      getDependents(a).forEach((dependent) => {
        if (dependent !== a) {
          dependencyMap.set(
            dependent,
            (dependencyMap.get(dependent) || /* @__PURE__ */ new Set()).add(a)
          );
          dirtyMap.set(dependent, (dirtyMap.get(dependent) || 0) + 1);
          loop1(dependent);
        }
      });
    };
    loop1(atom2);
    const loop2 = (a) => {
      getDependents(a).forEach((dependent) => {
        var _a;
        if (dependent !== a) {
          let dirtyCount = dirtyMap.get(dependent);
          if (dirtyCount) {
            dirtyMap.set(dependent, --dirtyCount);
          }
          if (!dirtyCount) {
            let isChanged = !!((_a = dependencyMap.get(dependent)) == null ? void 0 : _a.size);
            if (isChanged) {
              const prevAtomState = getAtomState(dependent);
              const nextAtomState = readAtomState(dependent, true);
              isChanged = !isEqualAtomValue(prevAtomState, nextAtomState);
            }
            if (!isChanged) {
              dependencyMap.forEach((s) => s.delete(dependent));
            }
          }
          loop2(dependent);
        }
      });
    };
    loop2(atom2);
  };
  const writeAtomState = (atom2, ...args) => {
    let isSync = true;
    const getter = (a) => returnAtomValue(readAtomState(a));
    const setter = (a, ...args2) => {
      let r;
      if (a === atom2) {
        if (!hasInitialValue(a)) {
          throw new Error("atom not writable");
        }
        const prevAtomState = getAtomState(a);
        const nextAtomState = setAtomValueOrPromise(a, args2[0]);
        if (!isEqualAtomValue(prevAtomState, nextAtomState)) {
          recomputeDependents(a);
        }
      } else {
        r = writeAtomState(a, ...args2);
      }
      if (!isSync) {
        const flushed = flushPending();
        if ((define_import_meta_env_default$1 ? "production" : void 0) !== "production") {
          storeListenersRev2.forEach(
            (l) => l({ type: "async-write", flushed })
          );
        }
      }
      return r;
    };
    const result = atom2.write(getter, setter, ...args);
    isSync = false;
    return result;
  };
  const writeAtom = (atom2, ...args) => {
    const result = writeAtomState(atom2, ...args);
    const flushed = flushPending();
    if ((define_import_meta_env_default$1 ? "production" : void 0) !== "production") {
      storeListenersRev2.forEach(
        (l) => l({ type: "write", flushed })
      );
    }
    return result;
  };
  const mountAtom = (atom2, initialDependent, onMountQueue) => {
    var _a;
    const queue = onMountQueue || [];
    (_a = getAtomState(atom2)) == null ? void 0 : _a.d.forEach((_, a) => {
      const aMounted = mountedMap.get(a);
      if (aMounted) {
        aMounted.t.add(atom2);
      } else {
        if (a !== atom2) {
          mountAtom(a, atom2, queue);
        }
      }
    });
    readAtomState(atom2);
    const mounted = {
      t: new Set(initialDependent && [initialDependent]),
      l: /* @__PURE__ */ new Set()
    };
    mountedMap.set(atom2, mounted);
    if ((define_import_meta_env_default$1 ? "production" : void 0) !== "production") {
      mountedAtoms.add(atom2);
    }
    if (isActuallyWritableAtom(atom2) && atom2.onMount) {
      const { onMount } = atom2;
      queue.push(() => {
        const onUnmount = onMount((...args) => writeAtom(atom2, ...args));
        if (onUnmount) {
          mounted.u = onUnmount;
        }
      });
    }
    if (!onMountQueue) {
      queue.forEach((f) => f());
    }
    return mounted;
  };
  const unmountAtom = (atom2) => {
    var _a;
    const onUnmount = (_a = mountedMap.get(atom2)) == null ? void 0 : _a.u;
    if (onUnmount) {
      onUnmount();
    }
    mountedMap.delete(atom2);
    if ((define_import_meta_env_default$1 ? "production" : void 0) !== "production") {
      mountedAtoms.delete(atom2);
    }
    const atomState = getAtomState(atom2);
    if (atomState) {
      if (hasPromiseAtomValue(atomState)) {
        cancelPromise(atomState.v);
      }
      atomState.d.forEach((_, a) => {
        if (a !== atom2) {
          const mounted = mountedMap.get(a);
          if (mounted) {
            mounted.t.delete(atom2);
            if (canUnmountAtom(a, mounted)) {
              unmountAtom(a);
            }
          }
        }
      });
    } else if ((define_import_meta_env_default$1 ? "production" : void 0) !== "production") {
      console.warn("[Bug] could not find atom state to unmount", atom2);
    }
  };
  const mountDependencies = (atom2, atomState, prevDependencies) => {
    const depSet = new Set(atomState.d.keys());
    prevDependencies == null ? void 0 : prevDependencies.forEach((_, a) => {
      if (depSet.has(a)) {
        depSet.delete(a);
        return;
      }
      const mounted = mountedMap.get(a);
      if (mounted) {
        mounted.t.delete(atom2);
        if (canUnmountAtom(a, mounted)) {
          unmountAtom(a);
        }
      }
    });
    depSet.forEach((a) => {
      const mounted = mountedMap.get(a);
      if (mounted) {
        mounted.t.add(atom2);
      } else if (mountedMap.has(atom2)) {
        mountAtom(a, atom2);
      }
    });
  };
  const flushPending = () => {
    let flushed;
    if ((define_import_meta_env_default$1 ? "production" : void 0) !== "production") {
      flushed = /* @__PURE__ */ new Set();
    }
    while (pendingMap.size) {
      const pending = Array.from(pendingMap);
      pendingMap.clear();
      pending.forEach(([atom2, prevAtomState]) => {
        const atomState = getAtomState(atom2);
        if (atomState) {
          const mounted = mountedMap.get(atom2);
          if (mounted && atomState.d !== (prevAtomState == null ? void 0 : prevAtomState.d)) {
            mountDependencies(atom2, atomState, prevAtomState == null ? void 0 : prevAtomState.d);
          }
          if (mounted && !// TODO This seems pretty hacky. Hope to fix it.
          // Maybe we could `mountDependencies` in `setAtomState`?
          (!hasPromiseAtomValue(prevAtomState) && (isEqualAtomValue(prevAtomState, atomState) || isEqualAtomError(prevAtomState, atomState)))) {
            mounted.l.forEach((listener) => listener());
            if ((define_import_meta_env_default$1 ? "production" : void 0) !== "production") {
              flushed.add(atom2);
            }
          }
        } else if ((define_import_meta_env_default$1 ? "production" : void 0) !== "production") {
          console.warn("[Bug] no atom state to flush");
        }
      });
    }
    if ((define_import_meta_env_default$1 ? "production" : void 0) !== "production") {
      return flushed;
    }
  };
  const subscribeAtom = (atom2, listener) => {
    const mounted = addAtom(atom2);
    const flushed = flushPending();
    const listeners = mounted.l;
    listeners.add(listener);
    if ((define_import_meta_env_default$1 ? "production" : void 0) !== "production") {
      storeListenersRev2.forEach(
        (l) => l({ type: "sub", flushed })
      );
    }
    return () => {
      listeners.delete(listener);
      delAtom(atom2);
      if ((define_import_meta_env_default$1 ? "production" : void 0) !== "production") {
        storeListenersRev2.forEach((l) => l({ type: "unsub" }));
      }
    };
  };
  if ((define_import_meta_env_default$1 ? "production" : void 0) !== "production") {
    return {
      get: readAtom,
      set: writeAtom,
      sub: subscribeAtom,
      // store dev methods (these are tentative and subject to change without notice)
      dev_subscribe_store: (l, rev) => {
        if (rev !== 2) {
          throw new Error("The current StoreListener revision is 2.");
        }
        storeListenersRev2.add(l);
        return () => {
          storeListenersRev2.delete(l);
        };
      },
      dev_get_mounted_atoms: () => mountedAtoms.values(),
      dev_get_atom_state: (a) => atomStateMap.get(a),
      dev_get_mounted: (a) => mountedMap.get(a),
      dev_restore_atoms: (values) => {
        for (const [atom2, valueOrPromise] of values) {
          if (hasInitialValue(atom2)) {
            setAtomValueOrPromise(atom2, valueOrPromise);
            recomputeDependents(atom2);
          }
        }
        const flushed = flushPending();
        storeListenersRev2.forEach(
          (l) => l({ type: "restore", flushed })
        );
      }
    };
  }
  return {
    get: readAtom,
    set: writeAtom,
    sub: subscribeAtom
  };
};
let defaultStore;
if ((define_import_meta_env_default$1 ? "production" : void 0) !== "production") {
  if (typeof globalThis.__NUMBER_OF_JOTAI_INSTANCES__ === "number") {
    ++globalThis.__NUMBER_OF_JOTAI_INSTANCES__;
  } else {
    globalThis.__NUMBER_OF_JOTAI_INSTANCES__ = 1;
  }
}
const getDefaultStore = () => {
  if (!defaultStore) {
    if ((define_import_meta_env_default$1 ? "production" : void 0) !== "production" && globalThis.__NUMBER_OF_JOTAI_INSTANCES__ !== 1) {
      console.warn(
        "Detected multiple Jotai instances. It may cause unexpected behavior with the default store. https://github.com/pmndrs/jotai/discussions/2044"
      );
    }
    defaultStore = createStore();
  }
  return defaultStore;
};
var define_import_meta_env_default = { BASE_URL: "/", MODE: "production", DEV: false, PROD: true, SSR: false };
const StoreContext = createContext(void 0);
const useStore = (options) => {
  const store = useContext(StoreContext);
  return (options == null ? void 0 : options.store) || store || getDefaultStore();
};
const Provider = ({
  children,
  store
}) => {
  const storeRef = useRef();
  if (!store && !storeRef.current) {
    storeRef.current = createStore();
  }
  return createElement(
    StoreContext.Provider,
    {
      value: store || storeRef.current
    },
    children
  );
};
const isPromiseLike = (x) => typeof (x == null ? void 0 : x.then) === "function";
const use = React__default.use || ((promise) => {
  if (promise.status === "pending") {
    throw promise;
  } else if (promise.status === "fulfilled") {
    return promise.value;
  } else if (promise.status === "rejected") {
    throw promise.reason;
  } else {
    promise.status = "pending";
    promise.then(
      (v) => {
        promise.status = "fulfilled";
        promise.value = v;
      },
      (e) => {
        promise.status = "rejected";
        promise.reason = e;
      }
    );
    throw promise;
  }
});
function useAtomValue(atom2, options) {
  const store = useStore(options);
  const [[valueFromReducer, storeFromReducer, atomFromReducer], rerender] = useReducer(
    (prev) => {
      const nextValue = store.get(atom2);
      if (Object.is(prev[0], nextValue) && prev[1] === store && prev[2] === atom2) {
        return prev;
      }
      return [nextValue, store, atom2];
    },
    void 0,
    () => [store.get(atom2), store, atom2]
  );
  let value = valueFromReducer;
  if (storeFromReducer !== store || atomFromReducer !== atom2) {
    rerender();
    value = store.get(atom2);
  }
  const delay = options == null ? void 0 : options.delay;
  useEffect(() => {
    const unsub = store.sub(atom2, () => {
      if (typeof delay === "number") {
        setTimeout(rerender, delay);
        return;
      }
      rerender();
    });
    rerender();
    return unsub;
  }, [store, atom2, delay]);
  useDebugValue(value);
  return isPromiseLike(value) ? use(value) : value;
}
function useSetAtom(atom2, options) {
  const store = useStore(options);
  const setAtom = useCallback(
    (...args) => {
      if ((define_import_meta_env_default ? "production" : void 0) !== "production" && !("write" in atom2)) {
        throw new Error("not writable atom");
      }
      return store.set(atom2, ...args);
    },
    [store, atom2]
  );
  return setAtom;
}
function useAtom(atom2, options) {
  return [
    useAtomValue(atom2, options),
    // We do wrong type assertion here, which results in throwing an error.
    useSetAtom(atom2, options)
  ];
}
const hydratedMap = /* @__PURE__ */ new WeakMap();
function useHydrateAtoms(values, options) {
  const store = useStore(options);
  const hydratedSet = getHydratedSet(store);
  for (const [atom2, value] of values) {
    if (!hydratedSet.has(atom2) || (options == null ? void 0 : options.dangerouslyForceHydrate)) {
      hydratedSet.add(atom2);
      store.set(atom2, value);
    }
  }
}
const getHydratedSet = (store) => {
  let hydratedSet = hydratedMap.get(store);
  if (!hydratedSet) {
    hydratedSet = /* @__PURE__ */ new WeakSet();
    hydratedMap.set(store, hydratedSet);
  }
  return hydratedSet;
};
let random = (bytes) => crypto.getRandomValues(new Uint8Array(bytes));
let customRandom = (alphabet, defaultSize, getRandom) => {
  let mask = (2 << Math.log(alphabet.length - 1) / Math.LN2) - 1;
  let step = -~(1.6 * mask * defaultSize / alphabet.length);
  return (size = defaultSize) => {
    let id = "";
    while (true) {
      let bytes = getRandom(step);
      let j = step;
      while (j--) {
        id += alphabet[bytes[j] & mask] || "";
        if (id.length === size)
          return id;
      }
    }
  };
};
let customAlphabet = (alphabet, size = 21) => customRandom(alphabet, size, random);
let nanoid = (size = 21) => crypto.getRandomValues(new Uint8Array(size)).reduce((id, byte) => {
  byte &= 63;
  if (byte < 36) {
    id += byte.toString(36);
  } else if (byte < 62) {
    id += (byte - 26).toString(36).toUpperCase();
  } else if (byte > 62) {
    id += "-";
  } else {
    id += "_";
  }
  return id;
}, "");
customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  8
);
const shortNanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  4
);
function generateShortRandomId() {
  return shortNanoid();
}
function checkIfEmpty(x) {
  return checkIfUndefined(x) || x === "";
}
function checkIfUndefined(value) {
  if (value === null) {
    return true;
  }
  if (value === void 0) {
    return true;
  }
  return false;
}
function clsx(...args) {
  return args.filter(Boolean).join(" ");
}
function randomColor() {
  return `hsl(${Math.floor(Math.random() * 360)}, 100%, 92%)`;
}
function parseIntegerOrNull(str) {
  const parsed = parseInt(str);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return parsed.toString();
}
function tableDataSorter(a, b, sortBy) {
  if (sortBy.length === 0) {
    return 1;
  }
  for (const sort of sortBy) {
    if (checkIfEmpty(a[sort.columnId])) {
      return 1;
    }
    if (checkIfEmpty(b[sort.columnId])) {
      return -1;
    }
    const aVal = a[sort.columnId].toString().toLowerCase();
    const bVal = b[sort.columnId].toString().toLowerCase();
    if (aVal < bVal) {
      return sort.order === "asc" ? -1 : 1;
    }
    if (aVal > bVal) {
      return sort.order === "asc" ? 1 : -1;
    }
  }
  return 0;
}
function tableDataFilter(a, filterBy) {
  if (filterBy.length === 0) {
    return true;
  }
  for (const filter of filterBy) {
    let val = a[filter.columnId];
    if (checkIfUndefined(val)) {
      val = "";
    }
    if (typeof val === "number") {
      val = val.toString();
    }
    val = val.toLowerCase();
    switch (filter.type) {
      case "contains":
        if (!val.includes(filter.value.toLowerCase()))
          return false;
        break;
      case "does-not-contain":
        if (val.includes(filter.value.toLowerCase()))
          return false;
        break;
      case "is":
        if (val !== filter.value.toLowerCase())
          return false;
        break;
      case "is-not":
        if (val === filter.value.toLowerCase())
          return false;
        break;
      case "less-than":
        if (filter.value !== "" && Number(val) >= Number(filter.value))
          return false;
        break;
      case "greater-than":
        if (filter.value !== "" && Number(val) <= Number(filter.value))
          return false;
        break;
      case "equals":
        if (filter.value !== "" && Number(val) !== Number(filter.value))
          return false;
        break;
    }
  }
  return true;
}
const OP_UPDATE_COLUMN = "update_column";
const OP_DELETE_COLUMN = "delete_column";
const OP_ADD_ROW = "add_row";
const OP_DELETE_ROWS = "delete_rows";
const OP_UPDATE_ROW = "update_row";
const OP_UPDATE_ROWS = "update_rows";
const OP_ADD_COLUMN = "add_column";
const sumReducer = (a, v) => a + v;
const merge = (target, source) => {
  if (target === void 0) {
    return source;
  }
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object)
      Object.assign(source[key], merge(target[key], source[key]));
  }
  Object.assign(target || {}, source);
  return target;
};
const defaultConfig = {
  theme: {
    color: "light"
  },
  toolbar: {
    enabled: true
  },
  addColumn: {
    enabled: true
  },
  addRow: {
    enabled: true,
    toolbar: true,
    body: true
  },
  grouping: {
    enabled: true
  },
  sorting: {
    enabled: true
  },
  filtering: {
    enabled: true
  },
  footer: {
    enabled: true
  },
  rowHeight: {
    enabled: true
  },
  hideFields: {
    enabled: true
  },
  deleteColumns: {
    enabled: true
  },
  editColumns: {
    enabled: true
  },
  selectRow: {
    enabled: true
  },
  readOnly: {
    enabled: false
  },
  rowSelectionButtons: [],
  extraColumnTypes: [],
  extraColumnHeaderPopupActions: [],
  formatDisplayDate: void 0,
  formatStorageDate: void 0
};
const configAtom = atom(defaultConfig);
const configView = atom((get) => get(configAtom));
const setConfigAction = atom(null, (get, set, update) => {
  defaultConfig.rowSelectionButtons = [];
  set(configAtom, merge(defaultConfig, update));
});
const tableIdAtom = atom("");
const callbacksAtom = atom({ onChange: () => null });
const setCallbacksAction = atom(
  null,
  (get, set, update) => set(callbacksAtom, update)
);
atom(null, (get, set, update) => {
  set(callbacksAtom, { onChange: update });
});
const rowsAtom = atom({});
const uniqueSummaryAtomViewFactory = (colId) => atom((get) => {
  return new Set(Object.entries(get(rowsAtom)).map(([k, v]) => v[colId])).size;
});
const rowAtomFactory = (id) => atom(
  (get) => get(rowsAtom)[id],
  (get, set, update) => {
    if (typeof update === "function") {
      update = update(get(rowAtomFactory(id)));
    }
    set(rowsAtom, (prev) => ({ ...prev, [id]: { ...prev[id], ...update } }));
    get(callbacksAtom).onChange({ type: OP_UPDATE_ROW, rowId: id, update });
  }
);
const colAtomFactory = (id) => atom(
  (get) => get(colsAtom)[id],
  (get, set, update) => {
    if (typeof update === "function") {
      update = update(get(colsAtom)[id]);
    }
    set(colsAtom, (prev) => ({
      ...prev,
      [id]: { ...prev[id], ...update }
    }));
    get(callbacksAtom).onChange({
      type: OP_UPDATE_COLUMN,
      colId: id,
      update
    });
  }
);
const deleteSelectedRowsAction = atom(null, (get, set, update) => {
  const deletionRowIds = Object.entries(get(rowsAtom)).filter(([, v]) => v.isSelected === true).map(([k, v]) => k);
  set(
    rowsAtom,
    Object.fromEntries(
      Object.entries(get(rowsAtom)).filter(([, v]) => v.isSelected !== true)
    )
  );
  set(selectAllRowsAtom, false);
  get(callbacksAtom).onChange({
    type: OP_DELETE_ROWS,
    rows: [deletionRowIds]
  });
});
const editSelectedRowsAction = atom(
  null,
  (get, set, update = { handler: () => null }) => {
    set(
      rowsAtom,
      Object.fromEntries(
        update.handler(Object.entries(get(rowsAtom)).map(([k, v]) => v)).map((r) => [r.id, r])
      )
    );
    get(callbacksAtom).onChange({
      type: OP_UPDATE_ROWS,
      rows: update.handler(Object.entries(get(rowsAtom)).map(([k, v]) => v)).map((r) => ({ rowId: r.id, update: r }))
    });
    set(
      rowsAtom,
      Object.fromEntries(
        Object.entries(get(rowsAtom)).map(([k, v]) => [
          k,
          { ...v, isSelected: false }
        ])
      )
    );
    set(selectAllRowsAtom, false);
  }
);
const setRowsAction = atom(null, (get, set, update) => {
  set(rowsAtom, Object.fromEntries(update.map((x) => [x.id, x])));
});
const addRowAction = atom(null, (get, set, update) => {
  set(rowsAtom, (prev) => ({
    ...prev,
    [update.id]: update
  }));
  set(cellFocusAtomFactory(update.id, get(visibleColumnIdsView)[0]), "editing");
  get(callbacksAtom).onChange({ type: OP_ADD_ROW, rowId: update.id, update });
});
const numRowsView = atom((get) => Object.keys(get(rowsAtom)).length);
const numSelectedRowsView = atom(
  (get) => get(selectAllRowsAtom) ? Object.keys(get(rowsAtom)).length : Object.entries(get(rowsAtom)).map(([, v]) => v.isSelected === true).reduce(sumReducer, 0)
);
const groupInfoAtom = atom({});
const groupedSortedAndFilteredRowIds = atom((get) => {
  return Object.entries(get(rowsAtom)).filter(([, v]) => tableDataFilter(v, get(filteringAtom))).sort(
    ([, va], [, vb]) => tableDataSorter(va, vb, [...get(groupingAtom), ...get(sortingAtom)])
  ).map(([k, v]) => ({
    id: k,
    groupVal: get(groupingAtom).length === 0 ? "" : v[get(groupingAtom)[0].columnId]
  })).map((x, i, a) => ({
    id: x.id,
    first: i === 0 || x.groupVal !== a[i - 1].groupVal,
    last: i === a.length - 1 || x.groupVal !== a[i + 1].groupVal,
    groupVal: x.groupVal
  }));
});
const colPopups = atom({});
const colPopupAtomFactory = (colId) => atom(
  (get) => get(colPopups)[colId],
  (get, set, update) => set(colPopups, (prev) => ({ ...prev, [colId]: update }))
);
const colsAtom = atom({});
const visibleColumnIdsView = atom(
  (get) => Object.entries(get(colsAtom)).filter(([k, v]) => v.isVisible === true).map(([k]) => k)
);
const allColumnsView = atom(
  (get) => Object.entries(get(colsAtom)).map(([k, v]) => v)
);
const nonCustomColumnsView = atom(
  (get) => Object.entries(get(colsAtom)).map(([k, v]) => v).filter((v) => v.type !== "custom")
);
const allColumnIdsView = atom((get) => Object.keys(get(colsAtom)));
const hiddenColumnsCountView = atom(
  (get) => Object.entries(get(colsAtom)).map(([, v]) => v.isVisible).reduce((a, v) => a + (v === false), 0)
);
const defaultColumnKeys = {
  isVisible: true,
  width: 192,
  type: "text",
  options: [],
  showOptionSearch: true,
  isEditable: true,
  isViewOnly: false
};
const setColumnsAction = atom(null, (get, set, update) => {
  set(
    colsAtom,
    Object.fromEntries(
      update.map((c) => ({ ...defaultColumnKeys, ...c })).map((c) => [c.id, c])
    )
  );
});
const addColumnAction = atom(null, (get, set, update) => {
  set(colsAtom, (prev) => ({ ...prev, [update.id]: update }));
  set(colPopupAtomFactory(update.id), true);
  get(callbacksAtom).onChange({
    type: OP_ADD_COLUMN,
    colId: update.id,
    update
  });
});
const deleteColumnsAction = atom(null, (get, set, update) => {
  set(
    colsAtom,
    (prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => k !== update.id))
  );
  get(callbacksAtom).onChange({ type: OP_DELETE_COLUMN, colId: update.id });
});
const tableWidthView = atom((get) => {
  return Object.entries(get(colsAtom)).filter(([k, v]) => v.isVisible === true).map(([k, v]) => v.width).reduce(sumReducer, get(configAtom).selectRow.enabled ? 64 : 0);
});
const groupingAtom = atom([]);
const groupingView = atom((get) => get(groupingAtom));
const setGroupingAction = atom(null, (get, set, update) => {
  set(groupingAtom, update.grouping);
  set(groupInfoAtom, {});
});
const sortingPopupAtom = atom(false);
const filteringPopupAtom = atom(false);
const sortingAtom = atom([]);
const sortingView = atom((get) => get(sortingAtom));
const setSortingAction = atom(null, (get, set, update) => {
  set(sortingAtom, update.sorting);
});
const filteringAtom = atom([]);
const filteringView = atom((get) => get(filteringAtom));
const setFilteringAction = atom(null, (get, set, update) => {
  set(filteringAtom, update.filtering);
});
const rowHeightAtom = atom(32);
const rowHeightView = atom((get) => get(rowHeightAtom));
const setRowHeightAction = atom(null, (get, set, update) => {
  set(rowHeightAtom, update.rowHeight);
});
const selectAllRowsAtom = atom(false);
const selectAllRowsView = atom((get) => get(selectAllRowsAtom));
const toggleSelectAllRowsAction = atom(null, (get, set, update) => {
  const oldVal = get(selectAllRowsAtom);
  set(selectAllRowsAtom, !oldVal);
  set(
    rowsAtom,
    Object.fromEntries(
      Object.entries(get(rowsAtom)).map(([k, v]) => [
        k,
        { ...v, isSelected: !oldVal }
      ])
    )
  );
});
const cancelSelectAllRowsAction = atom(null, (get, set, update) => {
  set(selectAllRowsAtom, false);
  set(
    rowsAtom,
    Object.fromEntries(
      Object.entries(get(rowsAtom)).map(([k, v]) => [
        k,
        { ...v, isSelected: false }
      ])
    )
  );
});
atom(null, (get, set, update) => {
  set(selectAllRowsAtom, update.value);
  set(
    rowsAtom,
    Object.fromEntries(
      Object.entries(get(rowsAtom)).map(([k, v]) => [
        k,
        { ...v, isSelected: update.value }
      ])
    )
  );
});
const draggingAtom = atom(false);
atom((get) => get(draggingAtom));
atom(null, (get, set, update) => {
  set(draggingAtom, update.dragging);
});
const focusAtom = atom({});
const cellFocusAtomFactory = (rowId, colId) => atom(
  (get) => {
    var _a;
    return ((_a = get(focusAtom)[rowId]) == null ? void 0 : _a[colId]) || "none";
  },
  (get, set, update) => {
    set(focusAtom, { [rowId]: { [colId]: update } });
  }
);
const setFocusAction = atom(null, (get, set, update) => {
  set(cellFocusAtomFactory(update.rowId, update.colId), update.value);
});
const updateColumnTypeAction = atom(null, (get, set, update) => {
  const { colId, type } = update;
  let { options, configuration } = get(colsAtom)[colId];
  const config = get(configAtom);
  let dataTransform = (x) => x;
  switch (type) {
    case "select": {
      const uniqueValues = [
        ...new Set(Object.entries(get(rowsAtom)).map(([k, v]) => v[colId]))
      ];
      options = uniqueValues.filter((d) => !checkIfUndefined(d) && d !== "").map((d) => ({
        value: d,
        name: d,
        color: randomColor()
      }));
      break;
    }
    case "multiSelect": {
      const uniqueValues = [
        ...new Set(
          Object.entries(get(rowsAtom)).flatMap(
            ([k, v]) => checkIfEmpty(v[colId]) ? [] : v[colId].split(",")
          )
        )
      ];
      options = uniqueValues.filter((d) => !checkIfUndefined(d) && d !== "").map((d) => ({
        value: d,
        name: d,
        color: randomColor()
      }));
      break;
    }
    case "number": {
      dataTransform = (x) => parseIntegerOrNull(x);
      break;
    }
    case "date": {
      dataTransform = (x) => config.parseDate !== void 0 ? x : !Number.isNaN(Date.parse(x)) ? new Date(Date.parse(x)).toISOString() : "";
      break;
    }
    case "checkbox": {
      dataTransform = (x) => {
        var _a, _b, _c;
        return ((_c = (_b = (_a = x == null ? void 0 : x.toLowerCase) == null ? void 0 : _a.call(x)) == null ? void 0 : _b.trim) == null ? void 0 : _c.call(_b)) === "true" ? true : false;
      };
    }
  }
  set(colAtomFactory(colId), (prev) => ({ ...prev[colId], type, options }));
  set(
    rowsAtom,
    Object.fromEntries(
      Object.entries(get(rowsAtom)).map(([k, v]) => [
        k,
        { ...v, [colId]: dataTransform(v[colId]) }
      ])
    )
  );
  get(callbacksAtom).onChange({
    type: OP_UPDATE_COLUMN,
    colId,
    update: { type, options }
  });
  get(callbacksAtom).onChange({
    type: OP_UPDATE_ROWS,
    rows: Object.entries(get(rowsAtom)).map(([k, v]) => ({
      rowId: k,
      update: { [colId]: dataTransform(v[colId]) }
    }))
  });
});
const moveFocusActionFactory = (rowId, colId) => atom(null, (get, set, update) => {
  const colIndex = get(visibleColumnIdsView).findIndex((x) => x === colId);
  const rowIndex = get(groupedSortedAndFilteredRowIds).findIndex(
    (x) => x.id === rowId
  );
  let nextRowId = rowId;
  let nextColId = colId;
  switch (update) {
    case "left": {
      nextColId = get(visibleColumnIdsView)[Math.max(0, colIndex - 1)];
      break;
    }
    case "right": {
      nextColId = get(visibleColumnIdsView)[Math.min(get(visibleColumnIdsView).length - 1, colIndex + 1)];
      break;
    }
    case "up": {
      nextRowId = get(groupedSortedAndFilteredRowIds).map((x) => x.id)[Math.max(0, rowIndex - 1)];
      break;
    }
    case "down": {
      nextRowId = get(groupedSortedAndFilteredRowIds).map((x) => x.id)[Math.min(
        get(groupedSortedAndFilteredRowIds).flatMap((x) => x.rowIds).length - 1,
        rowIndex + 1
      )];
      break;
    }
  }
  if (colId === nextColId && rowId === nextRowId) {
    return;
  }
  set(cellFocusAtomFactory(nextRowId, nextColId), "focused");
});
const summaryAtomFactory = (colId, check) => atom(
  (get) => Object.entries(get(rowsAtom)).map(([k, v]) => v[colId]).map(check).reduce(sumReducer, 0)
);
const EVALUATION_LICENSE = "100000000000000000000001";
function CheckCircleIcon({
  title,
  titleId,
  ...props
}, svgRef) {
  return /* @__PURE__ */ React.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: svgRef,
    "aria-labelledby": titleId
  }, props), title ? /* @__PURE__ */ React.createElement("title", {
    id: titleId
  }, title) : null, /* @__PURE__ */ React.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
  }));
}
const ForwardRef$k = React.forwardRef(CheckCircleIcon);
const CheckCircleIcon$1 = ForwardRef$k;
function ChevronDownIcon$2({
  title,
  titleId,
  ...props
}, svgRef) {
  return /* @__PURE__ */ React.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: svgRef,
    "aria-labelledby": titleId
  }, props), title ? /* @__PURE__ */ React.createElement("title", {
    id: titleId
  }, title) : null, /* @__PURE__ */ React.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "m19.5 8.25-7.5 7.5-7.5-7.5"
  }));
}
const ForwardRef$j = React.forwardRef(ChevronDownIcon$2);
const ChevronDownIcon$3 = ForwardRef$j;
function EyeSlashIcon({
  title,
  titleId,
  ...props
}, svgRef) {
  return /* @__PURE__ */ React.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: svgRef,
    "aria-labelledby": titleId
  }, props), title ? /* @__PURE__ */ React.createElement("title", {
    id: titleId
  }, title) : null, /* @__PURE__ */ React.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
  }));
}
const ForwardRef$i = React.forwardRef(EyeSlashIcon);
const EyeSlashIcon$1 = ForwardRef$i;
function HashtagIcon({
  title,
  titleId,
  ...props
}, svgRef) {
  return /* @__PURE__ */ React.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: svgRef,
    "aria-labelledby": titleId
  }, props), title ? /* @__PURE__ */ React.createElement("title", {
    id: titleId
  }, title) : null, /* @__PURE__ */ React.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5"
  }));
}
const ForwardRef$h = React.forwardRef(HashtagIcon);
const HashtagIcon$1 = ForwardRef$h;
function LinkIcon({
  title,
  titleId,
  ...props
}, svgRef) {
  return /* @__PURE__ */ React.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: svgRef,
    "aria-labelledby": titleId
  }, props), title ? /* @__PURE__ */ React.createElement("title", {
    id: titleId
  }, title) : null, /* @__PURE__ */ React.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
  }));
}
const ForwardRef$g = React.forwardRef(LinkIcon);
const LinkIcon$1 = ForwardRef$g;
function ListBulletIcon({
  title,
  titleId,
  ...props
}, svgRef) {
  return /* @__PURE__ */ React.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: svgRef,
    "aria-labelledby": titleId
  }, props), title ? /* @__PURE__ */ React.createElement("title", {
    id: titleId
  }, title) : null, /* @__PURE__ */ React.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
  }));
}
const ForwardRef$f = React.forwardRef(ListBulletIcon);
const ListBulletIcon$1 = ForwardRef$f;
function PlusIcon$2({
  title,
  titleId,
  ...props
}, svgRef) {
  return /* @__PURE__ */ React.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: svgRef,
    "aria-labelledby": titleId
  }, props), title ? /* @__PURE__ */ React.createElement("title", {
    id: titleId
  }, title) : null, /* @__PURE__ */ React.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M12 4.5v15m7.5-7.5h-15"
  }));
}
const ForwardRef$e = React.forwardRef(PlusIcon$2);
const PlusIcon$3 = ForwardRef$e;
function Square2StackIcon({
  title,
  titleId,
  ...props
}, svgRef) {
  return /* @__PURE__ */ React.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: svgRef,
    "aria-labelledby": titleId
  }, props), title ? /* @__PURE__ */ React.createElement("title", {
    id: titleId
  }, title) : null, /* @__PURE__ */ React.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M16.5 8.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v8.25A2.25 2.25 0 0 0 6 16.5h2.25m8.25-8.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-7.5A2.25 2.25 0 0 1 8.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 0 0-2.25 2.25v6"
  }));
}
const ForwardRef$d = React.forwardRef(Square2StackIcon);
const Square2StackIcon$1 = ForwardRef$d;
function TrashIcon$2({
  title,
  titleId,
  ...props
}, svgRef) {
  return /* @__PURE__ */ React.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: svgRef,
    "aria-labelledby": titleId
  }, props), title ? /* @__PURE__ */ React.createElement("title", {
    id: titleId
  }, title) : null, /* @__PURE__ */ React.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
  }));
}
const ForwardRef$c = React.forwardRef(TrashIcon$2);
const TrashIcon$3 = ForwardRef$c;
function getStringFromDate(date) {
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const year = date.getUTCFullYear();
  return `${month.toString().padStart(2, "0")}/${day.toString().padStart(2, "0")}/${year.toString().padStart(4, "0")}`;
}
function CheckIcon({
  title,
  titleId,
  ...props
}, svgRef) {
  return /* @__PURE__ */ React.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: svgRef,
    "aria-labelledby": titleId
  }, props), title ? /* @__PURE__ */ React.createElement("title", {
    id: titleId
  }, title) : null, /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    d: "M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z",
    clipRule: "evenodd"
  }));
}
const ForwardRef$b = React.forwardRef(CheckIcon);
const CheckIcon$1 = ForwardRef$b;
function ChevronDownIcon({
  title,
  titleId,
  ...props
}, svgRef) {
  return /* @__PURE__ */ React.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: svgRef,
    "aria-labelledby": titleId
  }, props), title ? /* @__PURE__ */ React.createElement("title", {
    id: titleId
  }, title) : null, /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    d: "M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z",
    clipRule: "evenodd"
  }));
}
const ForwardRef$a = React.forwardRef(ChevronDownIcon);
const ChevronDownIcon$1 = ForwardRef$a;
function ChevronLeftIcon({
  title,
  titleId,
  ...props
}, svgRef) {
  return /* @__PURE__ */ React.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: svgRef,
    "aria-labelledby": titleId
  }, props), title ? /* @__PURE__ */ React.createElement("title", {
    id: titleId
  }, title) : null, /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    d: "M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z",
    clipRule: "evenodd"
  }));
}
const ForwardRef$9 = React.forwardRef(ChevronLeftIcon);
const ChevronLeftIcon$1 = ForwardRef$9;
function ChevronRightIcon({
  title,
  titleId,
  ...props
}, svgRef) {
  return /* @__PURE__ */ React.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: svgRef,
    "aria-labelledby": titleId
  }, props), title ? /* @__PURE__ */ React.createElement("title", {
    id: titleId
  }, title) : null, /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    d: "M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z",
    clipRule: "evenodd"
  }));
}
const ForwardRef$8 = React.forwardRef(ChevronRightIcon);
const ChevronRightIcon$1 = ForwardRef$8;
function ChevronUpDownIcon({
  title,
  titleId,
  ...props
}, svgRef) {
  return /* @__PURE__ */ React.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: svgRef,
    "aria-labelledby": titleId
  }, props), title ? /* @__PURE__ */ React.createElement("title", {
    id: titleId
  }, title) : null, /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    d: "M10.53 3.47a.75.75 0 0 0-1.06 0L6.22 6.72a.75.75 0 0 0 1.06 1.06L10 5.06l2.72 2.72a.75.75 0 1 0 1.06-1.06l-3.25-3.25Zm-4.31 9.81 3.25 3.25a.75.75 0 0 0 1.06 0l3.25-3.25a.75.75 0 1 0-1.06-1.06L10 14.94l-2.72-2.72a.75.75 0 0 0-1.06 1.06Z",
    clipRule: "evenodd"
  }));
}
const ForwardRef$7 = React.forwardRef(ChevronUpDownIcon);
const ChevronUpDownIcon$1 = ForwardRef$7;
function XMarkIcon$2({
  title,
  titleId,
  ...props
}, svgRef) {
  return /* @__PURE__ */ React.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: svgRef,
    "aria-labelledby": titleId
  }, props), title ? /* @__PURE__ */ React.createElement("title", {
    id: titleId
  }, title) : null, /* @__PURE__ */ React.createElement("path", {
    d: "M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"
  }));
}
const ForwardRef$6 = React.forwardRef(XMarkIcon$2);
const XMarkIcon$3 = ForwardRef$6;
function Pill({ name, color, onCancel }) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "rounded px-1.5 p-[1px] truncate whitespace-nowrap text-dark items-center flex cursor-default",
      style: { backgroundColor: color },
      children: [
        name,
        onCancel && /* @__PURE__ */ jsx(XMarkIcon$3, { className: "w-4 h-4", onClick: onCancel })
      ]
    }
  );
}
function useDidUpdateEffect(fn, inputs) {
  const oldInputs = useRef(inputs);
  useEffect(() => {
    let shouldExecute = false;
    for (const i in inputs) {
      let a = inputs[i];
      let b = oldInputs.current[i];
      if (a instanceof Date) {
        a = a.getTime();
      }
      if (b instanceof Date) {
        b = b.getTime();
      }
      if (a !== b) {
        shouldExecute = true;
        break;
      }
    }
    oldInputs.current = inputs;
    if (shouldExecute) {
      return fn();
    }
  }, inputs);
}
function PopupMenu({ children, background }) {
  return /* @__PURE__ */ jsx("div", { className: "shadow-md border rounded rounded-2 text-sm bg-header", children });
}
function PopupMenuSection({ children }) {
  return /* @__PURE__ */ jsx("div", { className: "border-b last:border-none", children: /* @__PURE__ */ jsx("div", { className: "py-3", children }) });
}
PopupMenu.Section = PopupMenuSection;
function PopupMenuItem({ children, ...rest }) {
  return /* @__PURE__ */ jsx("div", { className: "px-3 py-1 flex items-center cursor-default", ...rest, children });
}
function PopupMenuButton({ children, disabled, ...rest }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: clsx(
        "rs-btn w-full hover:bg-hover-light px-3 py-1 flex items-center cursor-default",
        disabled === true && "text-secondary"
      ),
      disabled,
      ...rest,
      children
    }
  );
}
PopupMenuSection.Item = PopupMenuItem;
PopupMenuSection.Button = PopupMenuButton;
const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];
const leftSpacingClasses = [
  "first:col-start-1",
  "first:col-start-2",
  "first:col-start-3",
  "first:col-start-4",
  "first:col-start-5",
  "first:col-start-6",
  "first:col-start-7"
];
function Calendar({
  value: initValue,
  onSelect: onSelectCallback
}) {
  const [selectedDate, setSelectedDate] = useState(initValue || null);
  const currDate = /* @__PURE__ */ new Date();
  const [month, setMonth] = useState(
    selectedDate ? selectedDate.getUTCMonth() : currDate.getUTCMonth()
  );
  const [year, setYear] = useState(
    selectedDate ? selectedDate.getUTCFullYear() : currDate.getUTCFullYear()
  );
  useEffect(() => {
    if (!initValue) {
      setSelectedDate(null);
      return;
    }
    setSelectedDate(initValue);
    setMonth(initValue.getUTCMonth());
    setYear(initValue.getUTCFullYear());
  }, [initValue]);
  const days = [...Array(daysInMonth(year, month)).keys()];
  const emptyDays = new Date(year, month, 1).getDay();
  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  function handleLeft() {
    if (month === 0) {
      setYear((old) => old - 1);
      setMonth(11);
    } else {
      setMonth((old) => old - 1);
    }
  }
  function handleRight() {
    if (month === 11) {
      setYear((old) => old + 1);
      setMonth(0);
    } else {
      setMonth((old) => old + 1);
    }
  }
  function handleDateSelect(e, day) {
    e.preventDefault();
    const date = /* @__PURE__ */ new Date();
    date.setUTCFullYear(year, month, day);
    setSelectedDate(date);
    onSelectCallback == null ? void 0 : onSelectCallback(date);
  }
  function isSelected(day) {
    return selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
  }
  return /* @__PURE__ */ jsx("div", { className: "w-56", children: /* @__PURE__ */ jsxs(PopupMenu, { children: [
    /* @__PURE__ */ jsx(PopupMenu.Section, { children: /* @__PURE__ */ jsxs("div", { className: "flex px-2 items-center", children: [
      /* @__PURE__ */ jsxs("div", { className: "grow text-left px-1", children: [
        monthNames[month],
        " ",
        year
      ] }),
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "rs-btn hover:bg-hover-light rounded p-1",
          onClick: handleLeft,
          "aria-label": "move-calendar-left",
          children: /* @__PURE__ */ jsx(ChevronLeftIcon$1, { className: "w-4 h-4" })
        }
      ),
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "rs-btn hover:bg-hover-light rounded p-1",
          onClick: handleRight,
          "aria-label": "move-calendar-right",
          children: /* @__PURE__ */ jsx(ChevronRightIcon$1, { className: "w-4 h-4" })
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxs(PopupMenu.Section, { children: [
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-7 text-sm px-2 gap-px mb-2", children: daysOfWeek.map((day) => /* @__PURE__ */ jsx("div", { className: "text-secondary font-medium flex items-center justify-center", children: day })) }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-7 text-sm px-2 gap-px", children: days.map((day) => /* @__PURE__ */ jsx(
        "div",
        {
          className: clsx(
            "rs-btn p-0.5 rounded flex items-center justify-center col-span-1",
            leftSpacingClasses[emptyDays],
            !isSelected(day + 1) && "hover:bg-hover-light",
            isSelected(day + 1) && "bg-blue-500 text-inverted hover:bg-blue-500"
          ),
          onClick: (e) => {
            handleDateSelect(e, day + 1);
          },
          children: day + 1
        },
        `day-${day}`
      )) })
    ] })
  ] }) });
}
function getNodeName(node) {
  if (isNode(node)) {
    return (node.nodeName || "").toLowerCase();
  }
  return "#document";
}
function getWindow(node) {
  var _node$ownerDocument;
  return (node == null ? void 0 : (_node$ownerDocument = node.ownerDocument) == null ? void 0 : _node$ownerDocument.defaultView) || window;
}
function getDocumentElement(node) {
  var _ref;
  return (_ref = (isNode(node) ? node.ownerDocument : node.document) || window.document) == null ? void 0 : _ref.documentElement;
}
function isNode(value) {
  return value instanceof Node || value instanceof getWindow(value).Node;
}
function isElement(value) {
  return value instanceof Element || value instanceof getWindow(value).Element;
}
function isHTMLElement(value) {
  return value instanceof HTMLElement || value instanceof getWindow(value).HTMLElement;
}
function isShadowRoot(value) {
  if (typeof ShadowRoot === "undefined") {
    return false;
  }
  return value instanceof ShadowRoot || value instanceof getWindow(value).ShadowRoot;
}
function isOverflowElement(element) {
  const {
    overflow,
    overflowX,
    overflowY,
    display
  } = getComputedStyle$1(element);
  return /auto|scroll|overlay|hidden|clip/.test(overflow + overflowY + overflowX) && !["inline", "contents"].includes(display);
}
function isTableElement(element) {
  return ["table", "td", "th"].includes(getNodeName(element));
}
function isContainingBlock(element) {
  const webkit = isWebKit();
  const css = getComputedStyle$1(element);
  return css.transform !== "none" || css.perspective !== "none" || (css.containerType ? css.containerType !== "normal" : false) || !webkit && (css.backdropFilter ? css.backdropFilter !== "none" : false) || !webkit && (css.filter ? css.filter !== "none" : false) || ["transform", "perspective", "filter"].some((value) => (css.willChange || "").includes(value)) || ["paint", "layout", "strict", "content"].some((value) => (css.contain || "").includes(value));
}
function getContainingBlock(element) {
  let currentNode = getParentNode(element);
  while (isHTMLElement(currentNode) && !isLastTraversableNode(currentNode)) {
    if (isContainingBlock(currentNode)) {
      return currentNode;
    } else {
      currentNode = getParentNode(currentNode);
    }
  }
  return null;
}
function isWebKit() {
  if (typeof CSS === "undefined" || !CSS.supports)
    return false;
  return CSS.supports("-webkit-backdrop-filter", "none");
}
function isLastTraversableNode(node) {
  return ["html", "body", "#document"].includes(getNodeName(node));
}
function getComputedStyle$1(element) {
  return getWindow(element).getComputedStyle(element);
}
function getNodeScroll(element) {
  if (isElement(element)) {
    return {
      scrollLeft: element.scrollLeft,
      scrollTop: element.scrollTop
    };
  }
  return {
    scrollLeft: element.pageXOffset,
    scrollTop: element.pageYOffset
  };
}
function getParentNode(node) {
  if (getNodeName(node) === "html") {
    return node;
  }
  const result = (
    // Step into the shadow DOM of the parent of a slotted node.
    node.assignedSlot || // DOM Element detected.
    node.parentNode || // ShadowRoot detected.
    isShadowRoot(node) && node.host || // Fallback.
    getDocumentElement(node)
  );
  return isShadowRoot(result) ? result.host : result;
}
function getNearestOverflowAncestor(node) {
  const parentNode = getParentNode(node);
  if (isLastTraversableNode(parentNode)) {
    return node.ownerDocument ? node.ownerDocument.body : node.body;
  }
  if (isHTMLElement(parentNode) && isOverflowElement(parentNode)) {
    return parentNode;
  }
  return getNearestOverflowAncestor(parentNode);
}
function getOverflowAncestors(node, list, traverseIframes) {
  var _node$ownerDocument2;
  if (list === void 0) {
    list = [];
  }
  if (traverseIframes === void 0) {
    traverseIframes = true;
  }
  const scrollableAncestor = getNearestOverflowAncestor(node);
  const isBody = scrollableAncestor === ((_node$ownerDocument2 = node.ownerDocument) == null ? void 0 : _node$ownerDocument2.body);
  const win = getWindow(scrollableAncestor);
  if (isBody) {
    return list.concat(win, win.visualViewport || [], isOverflowElement(scrollableAncestor) ? scrollableAncestor : [], win.frameElement && traverseIframes ? getOverflowAncestors(win.frameElement) : []);
  }
  return list.concat(scrollableAncestor, getOverflowAncestors(scrollableAncestor, [], traverseIframes));
}
function activeElement(doc) {
  let activeElement2 = doc.activeElement;
  while (((_activeElement = activeElement2) == null || (_activeElement = _activeElement.shadowRoot) == null ? void 0 : _activeElement.activeElement) != null) {
    var _activeElement;
    activeElement2 = activeElement2.shadowRoot.activeElement;
  }
  return activeElement2;
}
function contains(parent, child) {
  if (!parent || !child) {
    return false;
  }
  const rootNode = child.getRootNode && child.getRootNode();
  if (parent.contains(child)) {
    return true;
  }
  if (rootNode && isShadowRoot(rootNode)) {
    let next = child;
    while (next) {
      if (parent === next) {
        return true;
      }
      next = next.parentNode || next.host;
    }
  }
  return false;
}
function isSafari() {
  return /apple/i.test(navigator.vendor);
}
function isMouseLikePointerType(pointerType, strict) {
  const values = ["mouse", "pen"];
  if (!strict) {
    values.push("", void 0);
  }
  return values.includes(pointerType);
}
function isReactEvent(event) {
  return "nativeEvent" in event;
}
function isRootElement(element) {
  return element.matches("html,body");
}
function getDocument(node) {
  return (node == null ? void 0 : node.ownerDocument) || document;
}
function isEventTargetWithin(event, node) {
  if (node == null) {
    return false;
  }
  if ("composedPath" in event) {
    return event.composedPath().includes(node);
  }
  const e = event;
  return e.target != null && node.contains(e.target);
}
function getTarget(event) {
  if ("composedPath" in event) {
    return event.composedPath()[0];
  }
  return event.target;
}
const TYPEABLE_SELECTOR = "input:not([type='hidden']):not([disabled]),[contenteditable]:not([contenteditable='false']),textarea:not([disabled])";
function isTypeableElement(element) {
  return isHTMLElement(element) && element.matches(TYPEABLE_SELECTOR);
}
const min = Math.min;
const max = Math.max;
const round = Math.round;
const floor = Math.floor;
const createCoords = (v) => ({
  x: v,
  y: v
});
const oppositeSideMap = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom"
};
const oppositeAlignmentMap = {
  start: "end",
  end: "start"
};
function clamp(start, value, end) {
  return max(start, min(value, end));
}
function evaluate(value, param) {
  return typeof value === "function" ? value(param) : value;
}
function getSide(placement) {
  return placement.split("-")[0];
}
function getAlignment(placement) {
  return placement.split("-")[1];
}
function getOppositeAxis(axis) {
  return axis === "x" ? "y" : "x";
}
function getAxisLength(axis) {
  return axis === "y" ? "height" : "width";
}
function getSideAxis(placement) {
  return ["top", "bottom"].includes(getSide(placement)) ? "y" : "x";
}
function getAlignmentAxis(placement) {
  return getOppositeAxis(getSideAxis(placement));
}
function getAlignmentSides(placement, rects, rtl) {
  if (rtl === void 0) {
    rtl = false;
  }
  const alignment = getAlignment(placement);
  const alignmentAxis = getAlignmentAxis(placement);
  const length = getAxisLength(alignmentAxis);
  let mainAlignmentSide = alignmentAxis === "x" ? alignment === (rtl ? "end" : "start") ? "right" : "left" : alignment === "start" ? "bottom" : "top";
  if (rects.reference[length] > rects.floating[length]) {
    mainAlignmentSide = getOppositePlacement(mainAlignmentSide);
  }
  return [mainAlignmentSide, getOppositePlacement(mainAlignmentSide)];
}
function getExpandedPlacements(placement) {
  const oppositePlacement = getOppositePlacement(placement);
  return [getOppositeAlignmentPlacement(placement), oppositePlacement, getOppositeAlignmentPlacement(oppositePlacement)];
}
function getOppositeAlignmentPlacement(placement) {
  return placement.replace(/start|end/g, (alignment) => oppositeAlignmentMap[alignment]);
}
function getSideList(side, isStart, rtl) {
  const lr = ["left", "right"];
  const rl = ["right", "left"];
  const tb = ["top", "bottom"];
  const bt = ["bottom", "top"];
  switch (side) {
    case "top":
    case "bottom":
      if (rtl)
        return isStart ? rl : lr;
      return isStart ? lr : rl;
    case "left":
    case "right":
      return isStart ? tb : bt;
    default:
      return [];
  }
}
function getOppositeAxisPlacements(placement, flipAlignment, direction, rtl) {
  const alignment = getAlignment(placement);
  let list = getSideList(getSide(placement), direction === "start", rtl);
  if (alignment) {
    list = list.map((side) => side + "-" + alignment);
    if (flipAlignment) {
      list = list.concat(list.map(getOppositeAlignmentPlacement));
    }
  }
  return list;
}
function getOppositePlacement(placement) {
  return placement.replace(/left|right|bottom|top/g, (side) => oppositeSideMap[side]);
}
function expandPaddingObject(padding) {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...padding
  };
}
function getPaddingObject(padding) {
  return typeof padding !== "number" ? expandPaddingObject(padding) : {
    top: padding,
    right: padding,
    bottom: padding,
    left: padding
  };
}
function rectToClientRect(rect) {
  return {
    ...rect,
    top: rect.y,
    left: rect.x,
    right: rect.x + rect.width,
    bottom: rect.y + rect.height
  };
}
function computeCoordsFromPlacement(_ref, placement, rtl) {
  let {
    reference,
    floating
  } = _ref;
  const sideAxis = getSideAxis(placement);
  const alignmentAxis = getAlignmentAxis(placement);
  const alignLength = getAxisLength(alignmentAxis);
  const side = getSide(placement);
  const isVertical = sideAxis === "y";
  const commonX = reference.x + reference.width / 2 - floating.width / 2;
  const commonY = reference.y + reference.height / 2 - floating.height / 2;
  const commonAlign = reference[alignLength] / 2 - floating[alignLength] / 2;
  let coords;
  switch (side) {
    case "top":
      coords = {
        x: commonX,
        y: reference.y - floating.height
      };
      break;
    case "bottom":
      coords = {
        x: commonX,
        y: reference.y + reference.height
      };
      break;
    case "right":
      coords = {
        x: reference.x + reference.width,
        y: commonY
      };
      break;
    case "left":
      coords = {
        x: reference.x - floating.width,
        y: commonY
      };
      break;
    default:
      coords = {
        x: reference.x,
        y: reference.y
      };
  }
  switch (getAlignment(placement)) {
    case "start":
      coords[alignmentAxis] -= commonAlign * (rtl && isVertical ? -1 : 1);
      break;
    case "end":
      coords[alignmentAxis] += commonAlign * (rtl && isVertical ? -1 : 1);
      break;
  }
  return coords;
}
const computePosition$1 = async (reference, floating, config) => {
  const {
    placement = "bottom",
    strategy = "absolute",
    middleware = [],
    platform: platform2
  } = config;
  const validMiddleware = middleware.filter(Boolean);
  const rtl = await (platform2.isRTL == null ? void 0 : platform2.isRTL(floating));
  let rects = await platform2.getElementRects({
    reference,
    floating,
    strategy
  });
  let {
    x,
    y
  } = computeCoordsFromPlacement(rects, placement, rtl);
  let statefulPlacement = placement;
  let middlewareData = {};
  let resetCount = 0;
  for (let i = 0; i < validMiddleware.length; i++) {
    const {
      name,
      fn
    } = validMiddleware[i];
    const {
      x: nextX,
      y: nextY,
      data,
      reset
    } = await fn({
      x,
      y,
      initialPlacement: placement,
      placement: statefulPlacement,
      strategy,
      middlewareData,
      rects,
      platform: platform2,
      elements: {
        reference,
        floating
      }
    });
    x = nextX != null ? nextX : x;
    y = nextY != null ? nextY : y;
    middlewareData = {
      ...middlewareData,
      [name]: {
        ...middlewareData[name],
        ...data
      }
    };
    if (reset && resetCount <= 50) {
      resetCount++;
      if (typeof reset === "object") {
        if (reset.placement) {
          statefulPlacement = reset.placement;
        }
        if (reset.rects) {
          rects = reset.rects === true ? await platform2.getElementRects({
            reference,
            floating,
            strategy
          }) : reset.rects;
        }
        ({
          x,
          y
        } = computeCoordsFromPlacement(rects, statefulPlacement, rtl));
      }
      i = -1;
      continue;
    }
  }
  return {
    x,
    y,
    placement: statefulPlacement,
    strategy,
    middlewareData
  };
};
async function detectOverflow(state, options) {
  var _await$platform$isEle;
  if (options === void 0) {
    options = {};
  }
  const {
    x,
    y,
    platform: platform2,
    rects,
    elements,
    strategy
  } = state;
  const {
    boundary = "clippingAncestors",
    rootBoundary = "viewport",
    elementContext = "floating",
    altBoundary = false,
    padding = 0
  } = evaluate(options, state);
  const paddingObject = getPaddingObject(padding);
  const altContext = elementContext === "floating" ? "reference" : "floating";
  const element = elements[altBoundary ? altContext : elementContext];
  const clippingClientRect = rectToClientRect(await platform2.getClippingRect({
    element: ((_await$platform$isEle = await (platform2.isElement == null ? void 0 : platform2.isElement(element))) != null ? _await$platform$isEle : true) ? element : element.contextElement || await (platform2.getDocumentElement == null ? void 0 : platform2.getDocumentElement(elements.floating)),
    boundary,
    rootBoundary,
    strategy
  }));
  const rect = elementContext === "floating" ? {
    ...rects.floating,
    x,
    y
  } : rects.reference;
  const offsetParent = await (platform2.getOffsetParent == null ? void 0 : platform2.getOffsetParent(elements.floating));
  const offsetScale = await (platform2.isElement == null ? void 0 : platform2.isElement(offsetParent)) ? await (platform2.getScale == null ? void 0 : platform2.getScale(offsetParent)) || {
    x: 1,
    y: 1
  } : {
    x: 1,
    y: 1
  };
  const elementClientRect = rectToClientRect(platform2.convertOffsetParentRelativeRectToViewportRelativeRect ? await platform2.convertOffsetParentRelativeRectToViewportRelativeRect({
    rect,
    offsetParent,
    strategy
  }) : rect);
  return {
    top: (clippingClientRect.top - elementClientRect.top + paddingObject.top) / offsetScale.y,
    bottom: (elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom) / offsetScale.y,
    left: (clippingClientRect.left - elementClientRect.left + paddingObject.left) / offsetScale.x,
    right: (elementClientRect.right - clippingClientRect.right + paddingObject.right) / offsetScale.x
  };
}
const flip = function(options) {
  if (options === void 0) {
    options = {};
  }
  return {
    name: "flip",
    options,
    async fn(state) {
      var _middlewareData$arrow, _middlewareData$flip;
      const {
        placement,
        middlewareData,
        rects,
        initialPlacement,
        platform: platform2,
        elements
      } = state;
      const {
        mainAxis: checkMainAxis = true,
        crossAxis: checkCrossAxis = true,
        fallbackPlacements: specifiedFallbackPlacements,
        fallbackStrategy = "bestFit",
        fallbackAxisSideDirection = "none",
        flipAlignment = true,
        ...detectOverflowOptions
      } = evaluate(options, state);
      if ((_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) {
        return {};
      }
      const side = getSide(placement);
      const isBasePlacement = getSide(initialPlacement) === initialPlacement;
      const rtl = await (platform2.isRTL == null ? void 0 : platform2.isRTL(elements.floating));
      const fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipAlignment ? [getOppositePlacement(initialPlacement)] : getExpandedPlacements(initialPlacement));
      if (!specifiedFallbackPlacements && fallbackAxisSideDirection !== "none") {
        fallbackPlacements.push(...getOppositeAxisPlacements(initialPlacement, flipAlignment, fallbackAxisSideDirection, rtl));
      }
      const placements = [initialPlacement, ...fallbackPlacements];
      const overflow = await detectOverflow(state, detectOverflowOptions);
      const overflows = [];
      let overflowsData = ((_middlewareData$flip = middlewareData.flip) == null ? void 0 : _middlewareData$flip.overflows) || [];
      if (checkMainAxis) {
        overflows.push(overflow[side]);
      }
      if (checkCrossAxis) {
        const sides = getAlignmentSides(placement, rects, rtl);
        overflows.push(overflow[sides[0]], overflow[sides[1]]);
      }
      overflowsData = [...overflowsData, {
        placement,
        overflows
      }];
      if (!overflows.every((side2) => side2 <= 0)) {
        var _middlewareData$flip2, _overflowsData$filter;
        const nextIndex = (((_middlewareData$flip2 = middlewareData.flip) == null ? void 0 : _middlewareData$flip2.index) || 0) + 1;
        const nextPlacement = placements[nextIndex];
        if (nextPlacement) {
          return {
            data: {
              index: nextIndex,
              overflows: overflowsData
            },
            reset: {
              placement: nextPlacement
            }
          };
        }
        let resetPlacement = (_overflowsData$filter = overflowsData.filter((d) => d.overflows[0] <= 0).sort((a, b) => a.overflows[1] - b.overflows[1])[0]) == null ? void 0 : _overflowsData$filter.placement;
        if (!resetPlacement) {
          switch (fallbackStrategy) {
            case "bestFit": {
              var _overflowsData$map$so;
              const placement2 = (_overflowsData$map$so = overflowsData.map((d) => [d.placement, d.overflows.filter((overflow2) => overflow2 > 0).reduce((acc, overflow2) => acc + overflow2, 0)]).sort((a, b) => a[1] - b[1])[0]) == null ? void 0 : _overflowsData$map$so[0];
              if (placement2) {
                resetPlacement = placement2;
              }
              break;
            }
            case "initialPlacement":
              resetPlacement = initialPlacement;
              break;
          }
        }
        if (placement !== resetPlacement) {
          return {
            reset: {
              placement: resetPlacement
            }
          };
        }
      }
      return {};
    }
  };
};
async function convertValueToCoords(state, options) {
  const {
    placement,
    platform: platform2,
    elements
  } = state;
  const rtl = await (platform2.isRTL == null ? void 0 : platform2.isRTL(elements.floating));
  const side = getSide(placement);
  const alignment = getAlignment(placement);
  const isVertical = getSideAxis(placement) === "y";
  const mainAxisMulti = ["left", "top"].includes(side) ? -1 : 1;
  const crossAxisMulti = rtl && isVertical ? -1 : 1;
  const rawValue = evaluate(options, state);
  let {
    mainAxis,
    crossAxis,
    alignmentAxis
  } = typeof rawValue === "number" ? {
    mainAxis: rawValue,
    crossAxis: 0,
    alignmentAxis: null
  } : {
    mainAxis: 0,
    crossAxis: 0,
    alignmentAxis: null,
    ...rawValue
  };
  if (alignment && typeof alignmentAxis === "number") {
    crossAxis = alignment === "end" ? alignmentAxis * -1 : alignmentAxis;
  }
  return isVertical ? {
    x: crossAxis * crossAxisMulti,
    y: mainAxis * mainAxisMulti
  } : {
    x: mainAxis * mainAxisMulti,
    y: crossAxis * crossAxisMulti
  };
}
const offset = function(options) {
  if (options === void 0) {
    options = 0;
  }
  return {
    name: "offset",
    options,
    async fn(state) {
      var _middlewareData$offse, _middlewareData$arrow;
      const {
        x,
        y,
        placement,
        middlewareData
      } = state;
      const diffCoords = await convertValueToCoords(state, options);
      if (placement === ((_middlewareData$offse = middlewareData.offset) == null ? void 0 : _middlewareData$offse.placement) && (_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) {
        return {};
      }
      return {
        x: x + diffCoords.x,
        y: y + diffCoords.y,
        data: {
          ...diffCoords,
          placement
        }
      };
    }
  };
};
const shift = function(options) {
  if (options === void 0) {
    options = {};
  }
  return {
    name: "shift",
    options,
    async fn(state) {
      const {
        x,
        y,
        placement
      } = state;
      const {
        mainAxis: checkMainAxis = true,
        crossAxis: checkCrossAxis = false,
        limiter = {
          fn: (_ref) => {
            let {
              x: x2,
              y: y2
            } = _ref;
            return {
              x: x2,
              y: y2
            };
          }
        },
        ...detectOverflowOptions
      } = evaluate(options, state);
      const coords = {
        x,
        y
      };
      const overflow = await detectOverflow(state, detectOverflowOptions);
      const crossAxis = getSideAxis(getSide(placement));
      const mainAxis = getOppositeAxis(crossAxis);
      let mainAxisCoord = coords[mainAxis];
      let crossAxisCoord = coords[crossAxis];
      if (checkMainAxis) {
        const minSide = mainAxis === "y" ? "top" : "left";
        const maxSide = mainAxis === "y" ? "bottom" : "right";
        const min2 = mainAxisCoord + overflow[minSide];
        const max2 = mainAxisCoord - overflow[maxSide];
        mainAxisCoord = clamp(min2, mainAxisCoord, max2);
      }
      if (checkCrossAxis) {
        const minSide = crossAxis === "y" ? "top" : "left";
        const maxSide = crossAxis === "y" ? "bottom" : "right";
        const min2 = crossAxisCoord + overflow[minSide];
        const max2 = crossAxisCoord - overflow[maxSide];
        crossAxisCoord = clamp(min2, crossAxisCoord, max2);
      }
      const limitedCoords = limiter.fn({
        ...state,
        [mainAxis]: mainAxisCoord,
        [crossAxis]: crossAxisCoord
      });
      return {
        ...limitedCoords,
        data: {
          x: limitedCoords.x - x,
          y: limitedCoords.y - y
        }
      };
    }
  };
};
function getCssDimensions(element) {
  const css = getComputedStyle$1(element);
  let width = parseFloat(css.width) || 0;
  let height = parseFloat(css.height) || 0;
  const hasOffset = isHTMLElement(element);
  const offsetWidth = hasOffset ? element.offsetWidth : width;
  const offsetHeight = hasOffset ? element.offsetHeight : height;
  const shouldFallback = round(width) !== offsetWidth || round(height) !== offsetHeight;
  if (shouldFallback) {
    width = offsetWidth;
    height = offsetHeight;
  }
  return {
    width,
    height,
    $: shouldFallback
  };
}
function unwrapElement(element) {
  return !isElement(element) ? element.contextElement : element;
}
function getScale(element) {
  const domElement = unwrapElement(element);
  if (!isHTMLElement(domElement)) {
    return createCoords(1);
  }
  const rect = domElement.getBoundingClientRect();
  const {
    width,
    height,
    $
  } = getCssDimensions(domElement);
  let x = ($ ? round(rect.width) : rect.width) / width;
  let y = ($ ? round(rect.height) : rect.height) / height;
  if (!x || !Number.isFinite(x)) {
    x = 1;
  }
  if (!y || !Number.isFinite(y)) {
    y = 1;
  }
  return {
    x,
    y
  };
}
const noOffsets = /* @__PURE__ */ createCoords(0);
function getVisualOffsets(element) {
  const win = getWindow(element);
  if (!isWebKit() || !win.visualViewport) {
    return noOffsets;
  }
  return {
    x: win.visualViewport.offsetLeft,
    y: win.visualViewport.offsetTop
  };
}
function shouldAddVisualOffsets(element, isFixed, floatingOffsetParent) {
  if (isFixed === void 0) {
    isFixed = false;
  }
  if (!floatingOffsetParent || isFixed && floatingOffsetParent !== getWindow(element)) {
    return false;
  }
  return isFixed;
}
function getBoundingClientRect(element, includeScale, isFixedStrategy, offsetParent) {
  if (includeScale === void 0) {
    includeScale = false;
  }
  if (isFixedStrategy === void 0) {
    isFixedStrategy = false;
  }
  const clientRect = element.getBoundingClientRect();
  const domElement = unwrapElement(element);
  let scale = createCoords(1);
  if (includeScale) {
    if (offsetParent) {
      if (isElement(offsetParent)) {
        scale = getScale(offsetParent);
      }
    } else {
      scale = getScale(element);
    }
  }
  const visualOffsets = shouldAddVisualOffsets(domElement, isFixedStrategy, offsetParent) ? getVisualOffsets(domElement) : createCoords(0);
  let x = (clientRect.left + visualOffsets.x) / scale.x;
  let y = (clientRect.top + visualOffsets.y) / scale.y;
  let width = clientRect.width / scale.x;
  let height = clientRect.height / scale.y;
  if (domElement) {
    const win = getWindow(domElement);
    const offsetWin = offsetParent && isElement(offsetParent) ? getWindow(offsetParent) : offsetParent;
    let currentIFrame = win.frameElement;
    while (currentIFrame && offsetParent && offsetWin !== win) {
      const iframeScale = getScale(currentIFrame);
      const iframeRect = currentIFrame.getBoundingClientRect();
      const css = getComputedStyle$1(currentIFrame);
      const left = iframeRect.left + (currentIFrame.clientLeft + parseFloat(css.paddingLeft)) * iframeScale.x;
      const top = iframeRect.top + (currentIFrame.clientTop + parseFloat(css.paddingTop)) * iframeScale.y;
      x *= iframeScale.x;
      y *= iframeScale.y;
      width *= iframeScale.x;
      height *= iframeScale.y;
      x += left;
      y += top;
      currentIFrame = getWindow(currentIFrame).frameElement;
    }
  }
  return rectToClientRect({
    width,
    height,
    x,
    y
  });
}
function convertOffsetParentRelativeRectToViewportRelativeRect(_ref) {
  let {
    rect,
    offsetParent,
    strategy
  } = _ref;
  const isOffsetParentAnElement = isHTMLElement(offsetParent);
  const documentElement = getDocumentElement(offsetParent);
  if (offsetParent === documentElement) {
    return rect;
  }
  let scroll = {
    scrollLeft: 0,
    scrollTop: 0
  };
  let scale = createCoords(1);
  const offsets = createCoords(0);
  if (isOffsetParentAnElement || !isOffsetParentAnElement && strategy !== "fixed") {
    if (getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) {
      scroll = getNodeScroll(offsetParent);
    }
    if (isHTMLElement(offsetParent)) {
      const offsetRect = getBoundingClientRect(offsetParent);
      scale = getScale(offsetParent);
      offsets.x = offsetRect.x + offsetParent.clientLeft;
      offsets.y = offsetRect.y + offsetParent.clientTop;
    }
  }
  return {
    width: rect.width * scale.x,
    height: rect.height * scale.y,
    x: rect.x * scale.x - scroll.scrollLeft * scale.x + offsets.x,
    y: rect.y * scale.y - scroll.scrollTop * scale.y + offsets.y
  };
}
function getClientRects(element) {
  return Array.from(element.getClientRects());
}
function getWindowScrollBarX(element) {
  return getBoundingClientRect(getDocumentElement(element)).left + getNodeScroll(element).scrollLeft;
}
function getDocumentRect(element) {
  const html = getDocumentElement(element);
  const scroll = getNodeScroll(element);
  const body = element.ownerDocument.body;
  const width = max(html.scrollWidth, html.clientWidth, body.scrollWidth, body.clientWidth);
  const height = max(html.scrollHeight, html.clientHeight, body.scrollHeight, body.clientHeight);
  let x = -scroll.scrollLeft + getWindowScrollBarX(element);
  const y = -scroll.scrollTop;
  if (getComputedStyle$1(body).direction === "rtl") {
    x += max(html.clientWidth, body.clientWidth) - width;
  }
  return {
    width,
    height,
    x,
    y
  };
}
function getViewportRect(element, strategy) {
  const win = getWindow(element);
  const html = getDocumentElement(element);
  const visualViewport = win.visualViewport;
  let width = html.clientWidth;
  let height = html.clientHeight;
  let x = 0;
  let y = 0;
  if (visualViewport) {
    width = visualViewport.width;
    height = visualViewport.height;
    const visualViewportBased = isWebKit();
    if (!visualViewportBased || visualViewportBased && strategy === "fixed") {
      x = visualViewport.offsetLeft;
      y = visualViewport.offsetTop;
    }
  }
  return {
    width,
    height,
    x,
    y
  };
}
function getInnerBoundingClientRect(element, strategy) {
  const clientRect = getBoundingClientRect(element, true, strategy === "fixed");
  const top = clientRect.top + element.clientTop;
  const left = clientRect.left + element.clientLeft;
  const scale = isHTMLElement(element) ? getScale(element) : createCoords(1);
  const width = element.clientWidth * scale.x;
  const height = element.clientHeight * scale.y;
  const x = left * scale.x;
  const y = top * scale.y;
  return {
    width,
    height,
    x,
    y
  };
}
function getClientRectFromClippingAncestor(element, clippingAncestor, strategy) {
  let rect;
  if (clippingAncestor === "viewport") {
    rect = getViewportRect(element, strategy);
  } else if (clippingAncestor === "document") {
    rect = getDocumentRect(getDocumentElement(element));
  } else if (isElement(clippingAncestor)) {
    rect = getInnerBoundingClientRect(clippingAncestor, strategy);
  } else {
    const visualOffsets = getVisualOffsets(element);
    rect = {
      ...clippingAncestor,
      x: clippingAncestor.x - visualOffsets.x,
      y: clippingAncestor.y - visualOffsets.y
    };
  }
  return rectToClientRect(rect);
}
function hasFixedPositionAncestor(element, stopNode) {
  const parentNode = getParentNode(element);
  if (parentNode === stopNode || !isElement(parentNode) || isLastTraversableNode(parentNode)) {
    return false;
  }
  return getComputedStyle$1(parentNode).position === "fixed" || hasFixedPositionAncestor(parentNode, stopNode);
}
function getClippingElementAncestors(element, cache) {
  const cachedResult = cache.get(element);
  if (cachedResult) {
    return cachedResult;
  }
  let result = getOverflowAncestors(element, [], false).filter((el) => isElement(el) && getNodeName(el) !== "body");
  let currentContainingBlockComputedStyle = null;
  const elementIsFixed = getComputedStyle$1(element).position === "fixed";
  let currentNode = elementIsFixed ? getParentNode(element) : element;
  while (isElement(currentNode) && !isLastTraversableNode(currentNode)) {
    const computedStyle = getComputedStyle$1(currentNode);
    const currentNodeIsContaining = isContainingBlock(currentNode);
    if (!currentNodeIsContaining && computedStyle.position === "fixed") {
      currentContainingBlockComputedStyle = null;
    }
    const shouldDropCurrentNode = elementIsFixed ? !currentNodeIsContaining && !currentContainingBlockComputedStyle : !currentNodeIsContaining && computedStyle.position === "static" && !!currentContainingBlockComputedStyle && ["absolute", "fixed"].includes(currentContainingBlockComputedStyle.position) || isOverflowElement(currentNode) && !currentNodeIsContaining && hasFixedPositionAncestor(element, currentNode);
    if (shouldDropCurrentNode) {
      result = result.filter((ancestor) => ancestor !== currentNode);
    } else {
      currentContainingBlockComputedStyle = computedStyle;
    }
    currentNode = getParentNode(currentNode);
  }
  cache.set(element, result);
  return result;
}
function getClippingRect(_ref) {
  let {
    element,
    boundary,
    rootBoundary,
    strategy
  } = _ref;
  const elementClippingAncestors = boundary === "clippingAncestors" ? getClippingElementAncestors(element, this._c) : [].concat(boundary);
  const clippingAncestors = [...elementClippingAncestors, rootBoundary];
  const firstClippingAncestor = clippingAncestors[0];
  const clippingRect = clippingAncestors.reduce((accRect, clippingAncestor) => {
    const rect = getClientRectFromClippingAncestor(element, clippingAncestor, strategy);
    accRect.top = max(rect.top, accRect.top);
    accRect.right = min(rect.right, accRect.right);
    accRect.bottom = min(rect.bottom, accRect.bottom);
    accRect.left = max(rect.left, accRect.left);
    return accRect;
  }, getClientRectFromClippingAncestor(element, firstClippingAncestor, strategy));
  return {
    width: clippingRect.right - clippingRect.left,
    height: clippingRect.bottom - clippingRect.top,
    x: clippingRect.left,
    y: clippingRect.top
  };
}
function getDimensions(element) {
  return getCssDimensions(element);
}
function getRectRelativeToOffsetParent(element, offsetParent, strategy) {
  const isOffsetParentAnElement = isHTMLElement(offsetParent);
  const documentElement = getDocumentElement(offsetParent);
  const isFixed = strategy === "fixed";
  const rect = getBoundingClientRect(element, true, isFixed, offsetParent);
  let scroll = {
    scrollLeft: 0,
    scrollTop: 0
  };
  const offsets = createCoords(0);
  if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
    if (getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) {
      scroll = getNodeScroll(offsetParent);
    }
    if (isOffsetParentAnElement) {
      const offsetRect = getBoundingClientRect(offsetParent, true, isFixed, offsetParent);
      offsets.x = offsetRect.x + offsetParent.clientLeft;
      offsets.y = offsetRect.y + offsetParent.clientTop;
    } else if (documentElement) {
      offsets.x = getWindowScrollBarX(documentElement);
    }
  }
  return {
    x: rect.left + scroll.scrollLeft - offsets.x,
    y: rect.top + scroll.scrollTop - offsets.y,
    width: rect.width,
    height: rect.height
  };
}
function getTrueOffsetParent(element, polyfill) {
  if (!isHTMLElement(element) || getComputedStyle$1(element).position === "fixed") {
    return null;
  }
  if (polyfill) {
    return polyfill(element);
  }
  return element.offsetParent;
}
function getOffsetParent(element, polyfill) {
  const window2 = getWindow(element);
  if (!isHTMLElement(element)) {
    return window2;
  }
  let offsetParent = getTrueOffsetParent(element, polyfill);
  while (offsetParent && isTableElement(offsetParent) && getComputedStyle$1(offsetParent).position === "static") {
    offsetParent = getTrueOffsetParent(offsetParent, polyfill);
  }
  if (offsetParent && (getNodeName(offsetParent) === "html" || getNodeName(offsetParent) === "body" && getComputedStyle$1(offsetParent).position === "static" && !isContainingBlock(offsetParent))) {
    return window2;
  }
  return offsetParent || getContainingBlock(element) || window2;
}
const getElementRects = async function(_ref) {
  let {
    reference,
    floating,
    strategy
  } = _ref;
  const getOffsetParentFn = this.getOffsetParent || getOffsetParent;
  const getDimensionsFn = this.getDimensions;
  return {
    reference: getRectRelativeToOffsetParent(reference, await getOffsetParentFn(floating), strategy),
    floating: {
      x: 0,
      y: 0,
      ...await getDimensionsFn(floating)
    }
  };
};
function isRTL(element) {
  return getComputedStyle$1(element).direction === "rtl";
}
const platform = {
  convertOffsetParentRelativeRectToViewportRelativeRect,
  getDocumentElement,
  getClippingRect,
  getOffsetParent,
  getElementRects,
  getClientRects,
  getDimensions,
  getScale,
  isElement,
  isRTL
};
function observeMove(element, onMove) {
  let io = null;
  let timeoutId2;
  const root = getDocumentElement(element);
  function cleanup() {
    clearTimeout(timeoutId2);
    io && io.disconnect();
    io = null;
  }
  function refresh(skip, threshold) {
    if (skip === void 0) {
      skip = false;
    }
    if (threshold === void 0) {
      threshold = 1;
    }
    cleanup();
    const {
      left,
      top,
      width,
      height
    } = element.getBoundingClientRect();
    if (!skip) {
      onMove();
    }
    if (!width || !height) {
      return;
    }
    const insetTop = floor(top);
    const insetRight = floor(root.clientWidth - (left + width));
    const insetBottom = floor(root.clientHeight - (top + height));
    const insetLeft = floor(left);
    const rootMargin = -insetTop + "px " + -insetRight + "px " + -insetBottom + "px " + -insetLeft + "px";
    const options = {
      rootMargin,
      threshold: max(0, min(1, threshold)) || 1
    };
    let isFirstUpdate = true;
    function handleObserve(entries) {
      const ratio = entries[0].intersectionRatio;
      if (ratio !== threshold) {
        if (!isFirstUpdate) {
          return refresh();
        }
        if (!ratio) {
          timeoutId2 = setTimeout(() => {
            refresh(false, 1e-7);
          }, 100);
        } else {
          refresh(false, ratio);
        }
      }
      isFirstUpdate = false;
    }
    try {
      io = new IntersectionObserver(handleObserve, {
        ...options,
        // Handle <iframe>s
        root: root.ownerDocument
      });
    } catch (e) {
      io = new IntersectionObserver(handleObserve, options);
    }
    io.observe(element);
  }
  refresh(true);
  return cleanup;
}
function autoUpdate(reference, floating, update, options) {
  if (options === void 0) {
    options = {};
  }
  const {
    ancestorScroll = true,
    ancestorResize = true,
    elementResize = typeof ResizeObserver === "function",
    layoutShift = typeof IntersectionObserver === "function",
    animationFrame = false
  } = options;
  const referenceEl = unwrapElement(reference);
  const ancestors = ancestorScroll || ancestorResize ? [...referenceEl ? getOverflowAncestors(referenceEl) : [], ...getOverflowAncestors(floating)] : [];
  ancestors.forEach((ancestor) => {
    ancestorScroll && ancestor.addEventListener("scroll", update, {
      passive: true
    });
    ancestorResize && ancestor.addEventListener("resize", update);
  });
  const cleanupIo = referenceEl && layoutShift ? observeMove(referenceEl, update) : null;
  let reobserveFrame = -1;
  let resizeObserver = null;
  if (elementResize) {
    resizeObserver = new ResizeObserver((_ref) => {
      let [firstEntry] = _ref;
      if (firstEntry && firstEntry.target === referenceEl && resizeObserver) {
        resizeObserver.unobserve(floating);
        cancelAnimationFrame(reobserveFrame);
        reobserveFrame = requestAnimationFrame(() => {
          resizeObserver && resizeObserver.observe(floating);
        });
      }
      update();
    });
    if (referenceEl && !animationFrame) {
      resizeObserver.observe(referenceEl);
    }
    resizeObserver.observe(floating);
  }
  let frameId;
  let prevRefRect = animationFrame ? getBoundingClientRect(reference) : null;
  if (animationFrame) {
    frameLoop();
  }
  function frameLoop() {
    const nextRefRect = getBoundingClientRect(reference);
    if (prevRefRect && (nextRefRect.x !== prevRefRect.x || nextRefRect.y !== prevRefRect.y || nextRefRect.width !== prevRefRect.width || nextRefRect.height !== prevRefRect.height)) {
      update();
    }
    prevRefRect = nextRefRect;
    frameId = requestAnimationFrame(frameLoop);
  }
  update();
  return () => {
    ancestors.forEach((ancestor) => {
      ancestorScroll && ancestor.removeEventListener("scroll", update);
      ancestorResize && ancestor.removeEventListener("resize", update);
    });
    cleanupIo && cleanupIo();
    resizeObserver && resizeObserver.disconnect();
    resizeObserver = null;
    if (animationFrame) {
      cancelAnimationFrame(frameId);
    }
  };
}
const computePosition = (reference, floating, options) => {
  const cache = /* @__PURE__ */ new Map();
  const mergedOptions = {
    platform,
    ...options
  };
  const platformWithCache = {
    ...mergedOptions.platform,
    _c: cache
  };
  return computePosition$1(reference, floating, {
    ...mergedOptions,
    platform: platformWithCache
  });
};
var index$1 = typeof document !== "undefined" ? useLayoutEffect : useEffect;
function deepEqual(a, b) {
  if (a === b) {
    return true;
  }
  if (typeof a !== typeof b) {
    return false;
  }
  if (typeof a === "function" && a.toString() === b.toString()) {
    return true;
  }
  let length, i, keys;
  if (a && b && typeof a == "object") {
    if (Array.isArray(a)) {
      length = a.length;
      if (length != b.length)
        return false;
      for (i = length; i-- !== 0; ) {
        if (!deepEqual(a[i], b[i])) {
          return false;
        }
      }
      return true;
    }
    keys = Object.keys(a);
    length = keys.length;
    if (length !== Object.keys(b).length) {
      return false;
    }
    for (i = length; i-- !== 0; ) {
      if (!{}.hasOwnProperty.call(b, keys[i])) {
        return false;
      }
    }
    for (i = length; i-- !== 0; ) {
      const key = keys[i];
      if (key === "_owner" && a.$$typeof) {
        continue;
      }
      if (!deepEqual(a[key], b[key])) {
        return false;
      }
    }
    return true;
  }
  return a !== a && b !== b;
}
function getDPR(element) {
  if (typeof window === "undefined") {
    return 1;
  }
  const win = element.ownerDocument.defaultView || window;
  return win.devicePixelRatio || 1;
}
function roundByDPR(element, value) {
  const dpr = getDPR(element);
  return Math.round(value * dpr) / dpr;
}
function useLatestRef(value) {
  const ref = React.useRef(value);
  index$1(() => {
    ref.current = value;
  });
  return ref;
}
function useFloating$1(options) {
  if (options === void 0) {
    options = {};
  }
  const {
    placement = "bottom",
    strategy = "absolute",
    middleware = [],
    platform: platform2,
    elements: {
      reference: externalReference,
      floating: externalFloating
    } = {},
    transform = true,
    whileElementsMounted,
    open
  } = options;
  const [data, setData] = React.useState({
    x: 0,
    y: 0,
    strategy,
    placement,
    middlewareData: {},
    isPositioned: false
  });
  const [latestMiddleware, setLatestMiddleware] = React.useState(middleware);
  if (!deepEqual(latestMiddleware, middleware)) {
    setLatestMiddleware(middleware);
  }
  const [_reference, _setReference] = React.useState(null);
  const [_floating, _setFloating] = React.useState(null);
  const setReference = React.useCallback((node) => {
    if (node != referenceRef.current) {
      referenceRef.current = node;
      _setReference(node);
    }
  }, [_setReference]);
  const setFloating = React.useCallback((node) => {
    if (node !== floatingRef.current) {
      floatingRef.current = node;
      _setFloating(node);
    }
  }, [_setFloating]);
  const referenceEl = externalReference || _reference;
  const floatingEl = externalFloating || _floating;
  const referenceRef = React.useRef(null);
  const floatingRef = React.useRef(null);
  const dataRef = React.useRef(data);
  const whileElementsMountedRef = useLatestRef(whileElementsMounted);
  const platformRef = useLatestRef(platform2);
  const update = React.useCallback(() => {
    if (!referenceRef.current || !floatingRef.current) {
      return;
    }
    const config = {
      placement,
      strategy,
      middleware: latestMiddleware
    };
    if (platformRef.current) {
      config.platform = platformRef.current;
    }
    computePosition(referenceRef.current, floatingRef.current, config).then((data2) => {
      const fullData = {
        ...data2,
        isPositioned: true
      };
      if (isMountedRef.current && !deepEqual(dataRef.current, fullData)) {
        dataRef.current = fullData;
        ReactDOM.flushSync(() => {
          setData(fullData);
        });
      }
    });
  }, [latestMiddleware, placement, strategy, platformRef]);
  index$1(() => {
    if (open === false && dataRef.current.isPositioned) {
      dataRef.current.isPositioned = false;
      setData((data2) => ({
        ...data2,
        isPositioned: false
      }));
    }
  }, [open]);
  const isMountedRef = React.useRef(false);
  index$1(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  index$1(() => {
    if (referenceEl)
      referenceRef.current = referenceEl;
    if (floatingEl)
      floatingRef.current = floatingEl;
    if (referenceEl && floatingEl) {
      if (whileElementsMountedRef.current) {
        return whileElementsMountedRef.current(referenceEl, floatingEl, update);
      } else {
        update();
      }
    }
  }, [referenceEl, floatingEl, update, whileElementsMountedRef]);
  const refs = React.useMemo(() => ({
    reference: referenceRef,
    floating: floatingRef,
    setReference,
    setFloating
  }), [setReference, setFloating]);
  const elements = React.useMemo(() => ({
    reference: referenceEl,
    floating: floatingEl
  }), [referenceEl, floatingEl]);
  const floatingStyles = React.useMemo(() => {
    const initialStyles = {
      position: strategy,
      left: 0,
      top: 0
    };
    if (!elements.floating) {
      return initialStyles;
    }
    const x = roundByDPR(elements.floating, data.x);
    const y = roundByDPR(elements.floating, data.y);
    if (transform) {
      return {
        ...initialStyles,
        transform: "translate(" + x + "px, " + y + "px)",
        ...getDPR(elements.floating) >= 1.5 && {
          willChange: "transform"
        }
      };
    }
    return {
      position: strategy,
      left: x,
      top: y
    };
  }, [strategy, transform, elements.floating, data.x, data.y]);
  return React.useMemo(() => ({
    ...data,
    update,
    refs,
    elements,
    floatingStyles
  }), [data, update, refs, elements, floatingStyles]);
}
/*!
* tabbable 6.2.0
* @license MIT, https://github.com/focus-trap/tabbable/blob/master/LICENSE
*/
var candidateSelectors = ["input:not([inert])", "select:not([inert])", "textarea:not([inert])", "a[href]:not([inert])", "button:not([inert])", "[tabindex]:not(slot):not([inert])", "audio[controls]:not([inert])", "video[controls]:not([inert])", '[contenteditable]:not([contenteditable="false"]):not([inert])', "details>summary:first-of-type:not([inert])", "details:not([inert])"];
var candidateSelector = /* @__PURE__ */ candidateSelectors.join(",");
var NoElement = typeof Element === "undefined";
var matches = NoElement ? function() {
} : Element.prototype.matches || Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
var getRootNode = !NoElement && Element.prototype.getRootNode ? function(element) {
  var _element$getRootNode;
  return element === null || element === void 0 ? void 0 : (_element$getRootNode = element.getRootNode) === null || _element$getRootNode === void 0 ? void 0 : _element$getRootNode.call(element);
} : function(element) {
  return element === null || element === void 0 ? void 0 : element.ownerDocument;
};
var isInert = function isInert2(node, lookUp) {
  var _node$getAttribute;
  if (lookUp === void 0) {
    lookUp = true;
  }
  var inertAtt = node === null || node === void 0 ? void 0 : (_node$getAttribute = node.getAttribute) === null || _node$getAttribute === void 0 ? void 0 : _node$getAttribute.call(node, "inert");
  var inert = inertAtt === "" || inertAtt === "true";
  var result = inert || lookUp && node && isInert2(node.parentNode);
  return result;
};
var isContentEditable = function isContentEditable2(node) {
  var _node$getAttribute2;
  var attValue = node === null || node === void 0 ? void 0 : (_node$getAttribute2 = node.getAttribute) === null || _node$getAttribute2 === void 0 ? void 0 : _node$getAttribute2.call(node, "contenteditable");
  return attValue === "" || attValue === "true";
};
var getCandidates = function getCandidates2(el, includeContainer, filter) {
  if (isInert(el)) {
    return [];
  }
  var candidates = Array.prototype.slice.apply(el.querySelectorAll(candidateSelector));
  if (includeContainer && matches.call(el, candidateSelector)) {
    candidates.unshift(el);
  }
  candidates = candidates.filter(filter);
  return candidates;
};
var getCandidatesIteratively = function getCandidatesIteratively2(elements, includeContainer, options) {
  var candidates = [];
  var elementsToCheck = Array.from(elements);
  while (elementsToCheck.length) {
    var element = elementsToCheck.shift();
    if (isInert(element, false)) {
      continue;
    }
    if (element.tagName === "SLOT") {
      var assigned = element.assignedElements();
      var content = assigned.length ? assigned : element.children;
      var nestedCandidates = getCandidatesIteratively2(content, true, options);
      if (options.flatten) {
        candidates.push.apply(candidates, nestedCandidates);
      } else {
        candidates.push({
          scopeParent: element,
          candidates: nestedCandidates
        });
      }
    } else {
      var validCandidate = matches.call(element, candidateSelector);
      if (validCandidate && options.filter(element) && (includeContainer || !elements.includes(element))) {
        candidates.push(element);
      }
      var shadowRoot = element.shadowRoot || // check for an undisclosed shadow
      typeof options.getShadowRoot === "function" && options.getShadowRoot(element);
      var validShadowRoot = !isInert(shadowRoot, false) && (!options.shadowRootFilter || options.shadowRootFilter(element));
      if (shadowRoot && validShadowRoot) {
        var _nestedCandidates = getCandidatesIteratively2(shadowRoot === true ? element.children : shadowRoot.children, true, options);
        if (options.flatten) {
          candidates.push.apply(candidates, _nestedCandidates);
        } else {
          candidates.push({
            scopeParent: element,
            candidates: _nestedCandidates
          });
        }
      } else {
        elementsToCheck.unshift.apply(elementsToCheck, element.children);
      }
    }
  }
  return candidates;
};
var hasTabIndex = function hasTabIndex2(node) {
  return !isNaN(parseInt(node.getAttribute("tabindex"), 10));
};
var getTabIndex = function getTabIndex2(node) {
  if (!node) {
    throw new Error("No node provided");
  }
  if (node.tabIndex < 0) {
    if ((/^(AUDIO|VIDEO|DETAILS)$/.test(node.tagName) || isContentEditable(node)) && !hasTabIndex(node)) {
      return 0;
    }
  }
  return node.tabIndex;
};
var getSortOrderTabIndex = function getSortOrderTabIndex2(node, isScope) {
  var tabIndex = getTabIndex(node);
  if (tabIndex < 0 && isScope && !hasTabIndex(node)) {
    return 0;
  }
  return tabIndex;
};
var sortOrderedTabbables = function sortOrderedTabbables2(a, b) {
  return a.tabIndex === b.tabIndex ? a.documentOrder - b.documentOrder : a.tabIndex - b.tabIndex;
};
var isInput = function isInput2(node) {
  return node.tagName === "INPUT";
};
var isHiddenInput = function isHiddenInput2(node) {
  return isInput(node) && node.type === "hidden";
};
var isDetailsWithSummary = function isDetailsWithSummary2(node) {
  var r = node.tagName === "DETAILS" && Array.prototype.slice.apply(node.children).some(function(child) {
    return child.tagName === "SUMMARY";
  });
  return r;
};
var getCheckedRadio = function getCheckedRadio2(nodes, form) {
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].checked && nodes[i].form === form) {
      return nodes[i];
    }
  }
};
var isTabbableRadio = function isTabbableRadio2(node) {
  if (!node.name) {
    return true;
  }
  var radioScope = node.form || getRootNode(node);
  var queryRadios = function queryRadios2(name) {
    return radioScope.querySelectorAll('input[type="radio"][name="' + name + '"]');
  };
  var radioSet;
  if (typeof window !== "undefined" && typeof window.CSS !== "undefined" && typeof window.CSS.escape === "function") {
    radioSet = queryRadios(window.CSS.escape(node.name));
  } else {
    try {
      radioSet = queryRadios(node.name);
    } catch (err) {
      console.error("Looks like you have a radio button with a name attribute containing invalid CSS selector characters and need the CSS.escape polyfill: %s", err.message);
      return false;
    }
  }
  var checked = getCheckedRadio(radioSet, node.form);
  return !checked || checked === node;
};
var isRadio = function isRadio2(node) {
  return isInput(node) && node.type === "radio";
};
var isNonTabbableRadio = function isNonTabbableRadio2(node) {
  return isRadio(node) && !isTabbableRadio(node);
};
var isNodeAttached = function isNodeAttached2(node) {
  var _nodeRoot;
  var nodeRoot = node && getRootNode(node);
  var nodeRootHost = (_nodeRoot = nodeRoot) === null || _nodeRoot === void 0 ? void 0 : _nodeRoot.host;
  var attached = false;
  if (nodeRoot && nodeRoot !== node) {
    var _nodeRootHost, _nodeRootHost$ownerDo, _node$ownerDocument;
    attached = !!((_nodeRootHost = nodeRootHost) !== null && _nodeRootHost !== void 0 && (_nodeRootHost$ownerDo = _nodeRootHost.ownerDocument) !== null && _nodeRootHost$ownerDo !== void 0 && _nodeRootHost$ownerDo.contains(nodeRootHost) || node !== null && node !== void 0 && (_node$ownerDocument = node.ownerDocument) !== null && _node$ownerDocument !== void 0 && _node$ownerDocument.contains(node));
    while (!attached && nodeRootHost) {
      var _nodeRoot2, _nodeRootHost2, _nodeRootHost2$ownerD;
      nodeRoot = getRootNode(nodeRootHost);
      nodeRootHost = (_nodeRoot2 = nodeRoot) === null || _nodeRoot2 === void 0 ? void 0 : _nodeRoot2.host;
      attached = !!((_nodeRootHost2 = nodeRootHost) !== null && _nodeRootHost2 !== void 0 && (_nodeRootHost2$ownerD = _nodeRootHost2.ownerDocument) !== null && _nodeRootHost2$ownerD !== void 0 && _nodeRootHost2$ownerD.contains(nodeRootHost));
    }
  }
  return attached;
};
var isZeroArea = function isZeroArea2(node) {
  var _node$getBoundingClie = node.getBoundingClientRect(), width = _node$getBoundingClie.width, height = _node$getBoundingClie.height;
  return width === 0 && height === 0;
};
var isHidden = function isHidden2(node, _ref) {
  var displayCheck = _ref.displayCheck, getShadowRoot = _ref.getShadowRoot;
  if (getComputedStyle(node).visibility === "hidden") {
    return true;
  }
  var isDirectSummary = matches.call(node, "details>summary:first-of-type");
  var nodeUnderDetails = isDirectSummary ? node.parentElement : node;
  if (matches.call(nodeUnderDetails, "details:not([open]) *")) {
    return true;
  }
  if (!displayCheck || displayCheck === "full" || displayCheck === "legacy-full") {
    if (typeof getShadowRoot === "function") {
      var originalNode = node;
      while (node) {
        var parentElement = node.parentElement;
        var rootNode = getRootNode(node);
        if (parentElement && !parentElement.shadowRoot && getShadowRoot(parentElement) === true) {
          return isZeroArea(node);
        } else if (node.assignedSlot) {
          node = node.assignedSlot;
        } else if (!parentElement && rootNode !== node.ownerDocument) {
          node = rootNode.host;
        } else {
          node = parentElement;
        }
      }
      node = originalNode;
    }
    if (isNodeAttached(node)) {
      return !node.getClientRects().length;
    }
    if (displayCheck !== "legacy-full") {
      return true;
    }
  } else if (displayCheck === "non-zero-area") {
    return isZeroArea(node);
  }
  return false;
};
var isDisabledFromFieldset = function isDisabledFromFieldset2(node) {
  if (/^(INPUT|BUTTON|SELECT|TEXTAREA)$/.test(node.tagName)) {
    var parentNode = node.parentElement;
    while (parentNode) {
      if (parentNode.tagName === "FIELDSET" && parentNode.disabled) {
        for (var i = 0; i < parentNode.children.length; i++) {
          var child = parentNode.children.item(i);
          if (child.tagName === "LEGEND") {
            return matches.call(parentNode, "fieldset[disabled] *") ? true : !child.contains(node);
          }
        }
        return true;
      }
      parentNode = parentNode.parentElement;
    }
  }
  return false;
};
var isNodeMatchingSelectorFocusable = function isNodeMatchingSelectorFocusable2(options, node) {
  if (node.disabled || // we must do an inert look up to filter out any elements inside an inert ancestor
  //  because we're limited in the type of selectors we can use in JSDom (see related
  //  note related to `candidateSelectors`)
  isInert(node) || isHiddenInput(node) || isHidden(node, options) || // For a details element with a summary, the summary element gets the focus
  isDetailsWithSummary(node) || isDisabledFromFieldset(node)) {
    return false;
  }
  return true;
};
var isNodeMatchingSelectorTabbable = function isNodeMatchingSelectorTabbable2(options, node) {
  if (isNonTabbableRadio(node) || getTabIndex(node) < 0 || !isNodeMatchingSelectorFocusable(options, node)) {
    return false;
  }
  return true;
};
var isValidShadowRootTabbable = function isValidShadowRootTabbable2(shadowHostNode) {
  var tabIndex = parseInt(shadowHostNode.getAttribute("tabindex"), 10);
  if (isNaN(tabIndex) || tabIndex >= 0) {
    return true;
  }
  return false;
};
var sortByOrder = function sortByOrder2(candidates) {
  var regularTabbables = [];
  var orderedTabbables = [];
  candidates.forEach(function(item, i) {
    var isScope = !!item.scopeParent;
    var element = isScope ? item.scopeParent : item;
    var candidateTabindex = getSortOrderTabIndex(element, isScope);
    var elements = isScope ? sortByOrder2(item.candidates) : element;
    if (candidateTabindex === 0) {
      isScope ? regularTabbables.push.apply(regularTabbables, elements) : regularTabbables.push(element);
    } else {
      orderedTabbables.push({
        documentOrder: i,
        tabIndex: candidateTabindex,
        item,
        isScope,
        content: elements
      });
    }
  });
  return orderedTabbables.sort(sortOrderedTabbables).reduce(function(acc, sortable) {
    sortable.isScope ? acc.push.apply(acc, sortable.content) : acc.push(sortable.content);
    return acc;
  }, []).concat(regularTabbables);
};
var tabbable = function tabbable2(container, options) {
  options = options || {};
  var candidates;
  if (options.getShadowRoot) {
    candidates = getCandidatesIteratively([container], options.includeContainer, {
      filter: isNodeMatchingSelectorTabbable.bind(null, options),
      flatten: false,
      getShadowRoot: options.getShadowRoot,
      shadowRootFilter: isValidShadowRootTabbable
    });
  } else {
    candidates = getCandidates(container, options.includeContainer, isNodeMatchingSelectorTabbable.bind(null, options));
  }
  return sortByOrder(candidates);
};
const useInsertionEffect = React[/* @__PURE__ */ "useInsertionEffect".toString()];
const useSafeInsertionEffect = useInsertionEffect || ((fn) => fn());
function useEffectEvent(callback) {
  const ref = React.useRef(() => {
    if (process.env.NODE_ENV !== "production") {
      throw new Error("Cannot call an event handler while rendering.");
    }
  });
  useSafeInsertionEffect(() => {
    ref.current = callback;
  });
  return React.useCallback(function() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    return ref.current == null ? void 0 : ref.current(...args);
  }, []);
}
var index = typeof document !== "undefined" ? useLayoutEffect : useEffect;
function _extends() {
  _extends = Object.assign ? Object.assign.bind() : function(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return _extends.apply(this, arguments);
}
let serverHandoffComplete = false;
let count = 0;
const genId = () => "floating-ui-" + count++;
function useFloatingId() {
  const [id, setId] = React.useState(() => serverHandoffComplete ? genId() : void 0);
  index(() => {
    if (id == null) {
      setId(genId());
    }
  }, []);
  React.useEffect(() => {
    if (!serverHandoffComplete) {
      serverHandoffComplete = true;
    }
  }, []);
  return id;
}
const useReactId = React[/* @__PURE__ */ "useId".toString()];
const useId = useReactId || useFloatingId;
function createPubSub() {
  const map = /* @__PURE__ */ new Map();
  return {
    emit(event, data) {
      var _map$get;
      (_map$get = map.get(event)) == null || _map$get.forEach((handler) => handler(data));
    },
    on(event, listener) {
      map.set(event, [...map.get(event) || [], listener]);
    },
    off(event, listener) {
      var _map$get2;
      map.set(event, ((_map$get2 = map.get(event)) == null ? void 0 : _map$get2.filter((l) => l !== listener)) || []);
    }
  };
}
const FloatingNodeContext = /* @__PURE__ */ React.createContext(null);
const FloatingTreeContext = /* @__PURE__ */ React.createContext(null);
const useFloatingParentNodeId = () => {
  var _React$useContext;
  return ((_React$useContext = React.useContext(FloatingNodeContext)) == null ? void 0 : _React$useContext.id) || null;
};
const useFloatingTree = () => React.useContext(FloatingTreeContext);
function createAttribute(name) {
  return "data-floating-ui-" + name;
}
function getChildren(nodes, id) {
  let allChildren = nodes.filter((node) => {
    var _node$context;
    return node.parentId === id && ((_node$context = node.context) == null ? void 0 : _node$context.open);
  });
  let currentChildren = allChildren;
  while (currentChildren.length) {
    currentChildren = nodes.filter((node) => {
      var _currentChildren;
      return (_currentChildren = currentChildren) == null ? void 0 : _currentChildren.some((n) => {
        var _node$context2;
        return node.parentId === n.id && ((_node$context2 = node.context) == null ? void 0 : _node$context2.open);
      });
    });
    allChildren = allChildren.concat(currentChildren);
  }
  return allChildren;
}
const getTabbableOptions = () => ({
  getShadowRoot: true,
  displayCheck: (
    // JSDOM does not support the `tabbable` library. To solve this we can
    // check if `ResizeObserver` is a real function (not polyfilled), which
    // determines if the current environment is JSDOM-like.
    typeof ResizeObserver === "function" && ResizeObserver.toString().includes("[native code]") ? "full" : "none"
  )
});
function getTabbableIn(container, direction) {
  const allTabbable = tabbable(container, getTabbableOptions());
  if (direction === "prev") {
    allTabbable.reverse();
  }
  const activeIndex = allTabbable.indexOf(activeElement(getDocument(container)));
  const nextTabbableElements = allTabbable.slice(activeIndex + 1);
  return nextTabbableElements[0];
}
function getNextTabbable() {
  return getTabbableIn(document.body, "next");
}
function getPreviousTabbable() {
  return getTabbableIn(document.body, "prev");
}
function isOutsideEvent(event, container) {
  const containerElement = container || event.currentTarget;
  const relatedTarget = event.relatedTarget;
  return !relatedTarget || !contains(containerElement, relatedTarget);
}
function disableFocusInside(container) {
  const tabbableElements = tabbable(container, getTabbableOptions());
  tabbableElements.forEach((element) => {
    element.dataset.tabindex = element.getAttribute("tabindex") || "";
    element.setAttribute("tabindex", "-1");
  });
}
function enableFocusInside(container) {
  const elements = container.querySelectorAll("[data-tabindex]");
  elements.forEach((element) => {
    const tabindex = element.dataset.tabindex;
    delete element.dataset.tabindex;
    if (tabindex) {
      element.setAttribute("tabindex", tabindex);
    } else {
      element.removeAttribute("tabindex");
    }
  });
}
const HIDDEN_STYLES = {
  border: 0,
  clip: "rect(0 0 0 0)",
  height: "1px",
  margin: "-1px",
  overflow: "hidden",
  padding: 0,
  position: "fixed",
  whiteSpace: "nowrap",
  width: "1px",
  top: 0,
  left: 0
};
let timeoutId;
function setActiveElementOnTab(event) {
  if (event.key === "Tab") {
    event.target;
    clearTimeout(timeoutId);
  }
}
const FocusGuard = /* @__PURE__ */ React.forwardRef(function FocusGuard2(props, ref) {
  const [role, setRole] = React.useState();
  index(() => {
    if (isSafari()) {
      setRole("button");
    }
    document.addEventListener("keydown", setActiveElementOnTab);
    return () => {
      document.removeEventListener("keydown", setActiveElementOnTab);
    };
  }, []);
  const restProps = {
    ref,
    tabIndex: 0,
    // Role is only for VoiceOver
    role,
    "aria-hidden": role ? void 0 : true,
    [createAttribute("focus-guard")]: "",
    style: HIDDEN_STYLES
  };
  return /* @__PURE__ */ React.createElement("span", _extends({}, props, restProps));
});
const PortalContext = /* @__PURE__ */ React.createContext(null);
function useFloatingPortalNode(_temp) {
  let {
    id,
    root
  } = _temp === void 0 ? {} : _temp;
  const [portalNode, setPortalNode] = React.useState(null);
  const uniqueId = useId();
  const portalContext = usePortalContext();
  const data = React.useMemo(() => ({
    id,
    root,
    portalContext,
    uniqueId
  }), [id, root, portalContext, uniqueId]);
  const dataRef = React.useRef();
  index(() => {
    return () => {
      portalNode == null || portalNode.remove();
    };
  }, [portalNode, data]);
  index(() => {
    if (dataRef.current === data)
      return;
    dataRef.current = data;
    const {
      id: id2,
      root: root2,
      portalContext: portalContext2,
      uniqueId: uniqueId2
    } = data;
    const existingIdRoot = id2 ? document.getElementById(id2) : null;
    const attr = createAttribute("portal");
    if (existingIdRoot) {
      const subRoot = document.createElement("div");
      subRoot.id = uniqueId2;
      subRoot.setAttribute(attr, "");
      existingIdRoot.appendChild(subRoot);
      setPortalNode(subRoot);
    } else {
      let container = root2 || (portalContext2 == null ? void 0 : portalContext2.portalNode);
      if (container && !isElement(container))
        container = container.current;
      container = container || document.body;
      let idWrapper = null;
      if (id2) {
        idWrapper = document.createElement("div");
        idWrapper.id = id2;
        container.appendChild(idWrapper);
      }
      const subRoot = document.createElement("div");
      subRoot.id = uniqueId2;
      subRoot.setAttribute(attr, "");
      container = idWrapper || container;
      container.appendChild(subRoot);
      setPortalNode(subRoot);
    }
  }, [data]);
  return portalNode;
}
function FloatingPortal(_ref) {
  let {
    children,
    id,
    root = null,
    preserveTabOrder = true
  } = _ref;
  const portalNode = useFloatingPortalNode({
    id,
    root
  });
  const [focusManagerState, setFocusManagerState] = React.useState(null);
  const beforeOutsideRef = React.useRef(null);
  const afterOutsideRef = React.useRef(null);
  const beforeInsideRef = React.useRef(null);
  const afterInsideRef = React.useRef(null);
  const shouldRenderGuards = (
    // The FocusManager and therefore floating element are currently open/
    // rendered.
    !!focusManagerState && // Guards are only for non-modal focus management.
    !focusManagerState.modal && // Don't render if unmount is transitioning.
    focusManagerState.open && preserveTabOrder && !!(root || portalNode)
  );
  React.useEffect(() => {
    if (!portalNode || !preserveTabOrder || focusManagerState != null && focusManagerState.modal) {
      return;
    }
    function onFocus(event) {
      if (portalNode && isOutsideEvent(event)) {
        const focusing = event.type === "focusin";
        const manageFocus = focusing ? enableFocusInside : disableFocusInside;
        manageFocus(portalNode);
      }
    }
    portalNode.addEventListener("focusin", onFocus, true);
    portalNode.addEventListener("focusout", onFocus, true);
    return () => {
      portalNode.removeEventListener("focusin", onFocus, true);
      portalNode.removeEventListener("focusout", onFocus, true);
    };
  }, [portalNode, preserveTabOrder, focusManagerState == null ? void 0 : focusManagerState.modal]);
  return /* @__PURE__ */ React.createElement(PortalContext.Provider, {
    value: React.useMemo(() => ({
      preserveTabOrder,
      beforeOutsideRef,
      afterOutsideRef,
      beforeInsideRef,
      afterInsideRef,
      portalNode,
      setFocusManagerState
    }), [preserveTabOrder, portalNode])
  }, shouldRenderGuards && portalNode && /* @__PURE__ */ React.createElement(FocusGuard, {
    "data-type": "outside",
    ref: beforeOutsideRef,
    onFocus: (event) => {
      if (isOutsideEvent(event, portalNode)) {
        var _beforeInsideRef$curr;
        (_beforeInsideRef$curr = beforeInsideRef.current) == null || _beforeInsideRef$curr.focus();
      } else {
        const prevTabbable = getPreviousTabbable() || (focusManagerState == null ? void 0 : focusManagerState.refs.domReference.current);
        prevTabbable == null || prevTabbable.focus();
      }
    }
  }), shouldRenderGuards && portalNode && /* @__PURE__ */ React.createElement("span", {
    "aria-owns": portalNode.id,
    style: HIDDEN_STYLES
  }), portalNode && /* @__PURE__ */ createPortal(children, portalNode), shouldRenderGuards && portalNode && /* @__PURE__ */ React.createElement(FocusGuard, {
    "data-type": "outside",
    ref: afterOutsideRef,
    onFocus: (event) => {
      if (isOutsideEvent(event, portalNode)) {
        var _afterInsideRef$curre;
        (_afterInsideRef$curre = afterInsideRef.current) == null || _afterInsideRef$curre.focus();
      } else {
        const nextTabbable = getNextTabbable() || (focusManagerState == null ? void 0 : focusManagerState.refs.domReference.current);
        nextTabbable == null || nextTabbable.focus();
        (focusManagerState == null ? void 0 : focusManagerState.closeOnFocusOut) && (focusManagerState == null ? void 0 : focusManagerState.onOpenChange(false, event.nativeEvent));
      }
    }
  }));
}
const usePortalContext = () => React.useContext(PortalContext);
function isButtonTarget(event) {
  return isHTMLElement(event.target) && event.target.tagName === "BUTTON";
}
function isSpaceIgnored(element) {
  return isTypeableElement(element);
}
function useClick(context, props) {
  if (props === void 0) {
    props = {};
  }
  const {
    open,
    onOpenChange,
    dataRef,
    elements: {
      domReference
    }
  } = context;
  const {
    enabled = true,
    event: eventOption = "click",
    toggle = true,
    ignoreMouse = false,
    keyboardHandlers = true
  } = props;
  const pointerTypeRef = React.useRef();
  const didKeyDownRef = React.useRef(false);
  return React.useMemo(() => {
    if (!enabled)
      return {};
    return {
      reference: {
        onPointerDown(event) {
          pointerTypeRef.current = event.pointerType;
        },
        onMouseDown(event) {
          if (event.button !== 0) {
            return;
          }
          if (isMouseLikePointerType(pointerTypeRef.current, true) && ignoreMouse) {
            return;
          }
          if (eventOption === "click") {
            return;
          }
          if (open && toggle && (dataRef.current.openEvent ? dataRef.current.openEvent.type === "mousedown" : true)) {
            onOpenChange(false, event.nativeEvent, "click");
          } else {
            event.preventDefault();
            onOpenChange(true, event.nativeEvent, "click");
          }
        },
        onClick(event) {
          if (eventOption === "mousedown" && pointerTypeRef.current) {
            pointerTypeRef.current = void 0;
            return;
          }
          if (isMouseLikePointerType(pointerTypeRef.current, true) && ignoreMouse) {
            return;
          }
          if (open && toggle && (dataRef.current.openEvent ? dataRef.current.openEvent.type === "click" : true)) {
            onOpenChange(false, event.nativeEvent, "click");
          } else {
            onOpenChange(true, event.nativeEvent, "click");
          }
        },
        onKeyDown(event) {
          pointerTypeRef.current = void 0;
          if (event.defaultPrevented || !keyboardHandlers || isButtonTarget(event)) {
            return;
          }
          if (event.key === " " && !isSpaceIgnored(domReference)) {
            event.preventDefault();
            didKeyDownRef.current = true;
          }
          if (event.key === "Enter") {
            if (open && toggle) {
              onOpenChange(false, event.nativeEvent, "click");
            } else {
              onOpenChange(true, event.nativeEvent, "click");
            }
          }
        },
        onKeyUp(event) {
          if (event.defaultPrevented || !keyboardHandlers || isButtonTarget(event) || isSpaceIgnored(domReference)) {
            return;
          }
          if (event.key === " " && didKeyDownRef.current) {
            didKeyDownRef.current = false;
            if (open && toggle) {
              onOpenChange(false, event.nativeEvent, "click");
            } else {
              onOpenChange(true, event.nativeEvent, "click");
            }
          }
        }
      }
    };
  }, [enabled, dataRef, eventOption, ignoreMouse, keyboardHandlers, domReference, toggle, open, onOpenChange]);
}
const bubbleHandlerKeys = {
  pointerdown: "onPointerDown",
  mousedown: "onMouseDown",
  click: "onClick"
};
const captureHandlerKeys = {
  pointerdown: "onPointerDownCapture",
  mousedown: "onMouseDownCapture",
  click: "onClickCapture"
};
const normalizeProp = (normalizable) => {
  var _normalizable$escapeK, _normalizable$outside;
  return {
    escapeKey: typeof normalizable === "boolean" ? normalizable : (_normalizable$escapeK = normalizable == null ? void 0 : normalizable.escapeKey) != null ? _normalizable$escapeK : false,
    outsidePress: typeof normalizable === "boolean" ? normalizable : (_normalizable$outside = normalizable == null ? void 0 : normalizable.outsidePress) != null ? _normalizable$outside : true
  };
};
function useDismiss(context, props) {
  if (props === void 0) {
    props = {};
  }
  const {
    open,
    onOpenChange,
    nodeId,
    elements: {
      reference,
      domReference,
      floating
    },
    dataRef
  } = context;
  const {
    enabled = true,
    escapeKey = true,
    outsidePress: unstable_outsidePress = true,
    outsidePressEvent = "pointerdown",
    referencePress = false,
    referencePressEvent = "pointerdown",
    ancestorScroll = false,
    bubbles,
    capture
  } = props;
  const tree = useFloatingTree();
  const outsidePressFn = useEffectEvent(typeof unstable_outsidePress === "function" ? unstable_outsidePress : () => false);
  const outsidePress = typeof unstable_outsidePress === "function" ? outsidePressFn : unstable_outsidePress;
  const insideReactTreeRef = React.useRef(false);
  const endedOrStartedInsideRef = React.useRef(false);
  const {
    escapeKey: escapeKeyBubbles,
    outsidePress: outsidePressBubbles
  } = normalizeProp(bubbles);
  const {
    escapeKey: escapeKeyCapture,
    outsidePress: outsidePressCapture
  } = normalizeProp(capture);
  const closeOnEscapeKeyDown = useEffectEvent((event) => {
    if (!open || !enabled || !escapeKey || event.key !== "Escape") {
      return;
    }
    const children = tree ? getChildren(tree.nodesRef.current, nodeId) : [];
    if (!escapeKeyBubbles) {
      event.stopPropagation();
      if (children.length > 0) {
        let shouldDismiss = true;
        children.forEach((child) => {
          var _child$context;
          if ((_child$context = child.context) != null && _child$context.open && !child.context.dataRef.current.__escapeKeyBubbles) {
            shouldDismiss = false;
            return;
          }
        });
        if (!shouldDismiss) {
          return;
        }
      }
    }
    onOpenChange(false, isReactEvent(event) ? event.nativeEvent : event, "escape-key");
  });
  const closeOnEscapeKeyDownCapture = useEffectEvent((event) => {
    var _getTarget2;
    const callback = () => {
      var _getTarget;
      closeOnEscapeKeyDown(event);
      (_getTarget = getTarget(event)) == null || _getTarget.removeEventListener("keydown", callback);
    };
    (_getTarget2 = getTarget(event)) == null || _getTarget2.addEventListener("keydown", callback);
  });
  const closeOnPressOutside = useEffectEvent((event) => {
    const insideReactTree = insideReactTreeRef.current;
    insideReactTreeRef.current = false;
    const endedOrStartedInside = endedOrStartedInsideRef.current;
    endedOrStartedInsideRef.current = false;
    if (outsidePressEvent === "click" && endedOrStartedInside) {
      return;
    }
    if (insideReactTree) {
      return;
    }
    if (typeof outsidePress === "function" && !outsidePress(event)) {
      return;
    }
    const target = getTarget(event);
    const inertSelector = "[" + createAttribute("inert") + "]";
    const markers = getDocument(floating).querySelectorAll(inertSelector);
    let targetRootAncestor = isElement(target) ? target : null;
    while (targetRootAncestor && !isLastTraversableNode(targetRootAncestor)) {
      const nextParent = getParentNode(targetRootAncestor);
      if (isLastTraversableNode(nextParent) || !isElement(nextParent)) {
        break;
      } else {
        targetRootAncestor = nextParent;
      }
    }
    if (markers.length && isElement(target) && !isRootElement(target) && // Clicked on a direct ancestor (e.g. FloatingOverlay).
    !contains(target, floating) && // If the target root element contains none of the markers, then the
    // element was injected after the floating element rendered.
    Array.from(markers).every((marker) => !contains(targetRootAncestor, marker))) {
      return;
    }
    if (isHTMLElement(target) && floating) {
      const canScrollX = target.clientWidth > 0 && target.scrollWidth > target.clientWidth;
      const canScrollY = target.clientHeight > 0 && target.scrollHeight > target.clientHeight;
      let xCond = canScrollY && event.offsetX > target.clientWidth;
      if (canScrollY) {
        const isRTL2 = getComputedStyle$1(target).direction === "rtl";
        if (isRTL2) {
          xCond = event.offsetX <= target.offsetWidth - target.clientWidth;
        }
      }
      if (xCond || canScrollX && event.offsetY > target.clientHeight) {
        return;
      }
    }
    const targetIsInsideChildren = tree && getChildren(tree.nodesRef.current, nodeId).some((node) => {
      var _node$context;
      return isEventTargetWithin(event, (_node$context = node.context) == null ? void 0 : _node$context.elements.floating);
    });
    if (isEventTargetWithin(event, floating) || isEventTargetWithin(event, domReference) || targetIsInsideChildren) {
      return;
    }
    const children = tree ? getChildren(tree.nodesRef.current, nodeId) : [];
    if (children.length > 0) {
      let shouldDismiss = true;
      children.forEach((child) => {
        var _child$context2;
        if ((_child$context2 = child.context) != null && _child$context2.open && !child.context.dataRef.current.__outsidePressBubbles) {
          shouldDismiss = false;
          return;
        }
      });
      if (!shouldDismiss) {
        return;
      }
    }
    onOpenChange(false, event, "outside-press");
  });
  const closeOnPressOutsideCapture = useEffectEvent((event) => {
    var _getTarget4;
    const callback = () => {
      var _getTarget3;
      closeOnPressOutside(event);
      (_getTarget3 = getTarget(event)) == null || _getTarget3.removeEventListener(outsidePressEvent, callback);
    };
    (_getTarget4 = getTarget(event)) == null || _getTarget4.addEventListener(outsidePressEvent, callback);
  });
  React.useEffect(() => {
    if (!open || !enabled) {
      return;
    }
    dataRef.current.__escapeKeyBubbles = escapeKeyBubbles;
    dataRef.current.__outsidePressBubbles = outsidePressBubbles;
    function onScroll(event) {
      onOpenChange(false, event, "ancestor-scroll");
    }
    const doc = getDocument(floating);
    escapeKey && doc.addEventListener("keydown", escapeKeyCapture ? closeOnEscapeKeyDownCapture : closeOnEscapeKeyDown, escapeKeyCapture);
    outsidePress && doc.addEventListener(outsidePressEvent, outsidePressCapture ? closeOnPressOutsideCapture : closeOnPressOutside, outsidePressCapture);
    let ancestors = [];
    if (ancestorScroll) {
      if (isElement(domReference)) {
        ancestors = getOverflowAncestors(domReference);
      }
      if (isElement(floating)) {
        ancestors = ancestors.concat(getOverflowAncestors(floating));
      }
      if (!isElement(reference) && reference && reference.contextElement) {
        ancestors = ancestors.concat(getOverflowAncestors(reference.contextElement));
      }
    }
    ancestors = ancestors.filter((ancestor) => {
      var _doc$defaultView;
      return ancestor !== ((_doc$defaultView = doc.defaultView) == null ? void 0 : _doc$defaultView.visualViewport);
    });
    ancestors.forEach((ancestor) => {
      ancestor.addEventListener("scroll", onScroll, {
        passive: true
      });
    });
    return () => {
      escapeKey && doc.removeEventListener("keydown", escapeKeyCapture ? closeOnEscapeKeyDownCapture : closeOnEscapeKeyDown, escapeKeyCapture);
      outsidePress && doc.removeEventListener(outsidePressEvent, outsidePressCapture ? closeOnPressOutsideCapture : closeOnPressOutside, outsidePressCapture);
      ancestors.forEach((ancestor) => {
        ancestor.removeEventListener("scroll", onScroll);
      });
    };
  }, [dataRef, floating, domReference, reference, escapeKey, outsidePress, outsidePressEvent, open, onOpenChange, ancestorScroll, enabled, escapeKeyBubbles, outsidePressBubbles, closeOnEscapeKeyDown, escapeKeyCapture, closeOnEscapeKeyDownCapture, closeOnPressOutside, outsidePressCapture, closeOnPressOutsideCapture]);
  React.useEffect(() => {
    insideReactTreeRef.current = false;
  }, [outsidePress, outsidePressEvent]);
  return React.useMemo(() => {
    if (!enabled) {
      return {};
    }
    return {
      reference: {
        onKeyDown: closeOnEscapeKeyDown,
        [bubbleHandlerKeys[referencePressEvent]]: (event) => {
          if (referencePress) {
            onOpenChange(false, event.nativeEvent, "reference-press");
          }
        }
      },
      floating: {
        onKeyDown: closeOnEscapeKeyDown,
        onMouseDown() {
          endedOrStartedInsideRef.current = true;
        },
        onMouseUp() {
          endedOrStartedInsideRef.current = true;
        },
        [captureHandlerKeys[outsidePressEvent]]: () => {
          insideReactTreeRef.current = true;
        }
      }
    };
  }, [enabled, referencePress, outsidePressEvent, referencePressEvent, onOpenChange, closeOnEscapeKeyDown]);
}
let devMessageSet;
if (process.env.NODE_ENV !== "production") {
  devMessageSet = /* @__PURE__ */ new Set();
}
function useFloating(options) {
  var _options$elements2;
  if (options === void 0) {
    options = {};
  }
  const {
    open = false,
    onOpenChange: unstable_onOpenChange,
    nodeId
  } = options;
  if (process.env.NODE_ENV !== "production") {
    var _options$elements;
    const err = "Floating UI: Cannot pass a virtual element to the `elements.reference` option, as it must be a real DOM element. Use `refs.setPositionReference` instead.";
    if ((_options$elements = options.elements) != null && _options$elements.reference && !isElement(options.elements.reference)) {
      var _devMessageSet;
      if (!((_devMessageSet = devMessageSet) != null && _devMessageSet.has(err))) {
        var _devMessageSet2;
        (_devMessageSet2 = devMessageSet) == null || _devMessageSet2.add(err);
        console.error(err);
      }
    }
  }
  const [_domReference, setDomReference] = React.useState(null);
  const domReference = ((_options$elements2 = options.elements) == null ? void 0 : _options$elements2.reference) || _domReference;
  const position = useFloating$1(options);
  const tree = useFloatingTree();
  const nested = useFloatingParentNodeId() != null;
  const onOpenChange = useEffectEvent((open2, event, reason) => {
    if (open2) {
      dataRef.current.openEvent = event;
    }
    events.emit("openchange", {
      open: open2,
      event,
      reason,
      nested
    });
    unstable_onOpenChange == null || unstable_onOpenChange(open2, event, reason);
  });
  const domReferenceRef = React.useRef(null);
  const dataRef = React.useRef({});
  const events = React.useState(() => createPubSub())[0];
  const floatingId = useId();
  const setPositionReference = React.useCallback((node) => {
    const positionReference = isElement(node) ? {
      getBoundingClientRect: () => node.getBoundingClientRect(),
      contextElement: node
    } : node;
    position.refs.setReference(positionReference);
  }, [position.refs]);
  const setReference = React.useCallback((node) => {
    if (isElement(node) || node === null) {
      domReferenceRef.current = node;
      setDomReference(node);
    }
    if (isElement(position.refs.reference.current) || position.refs.reference.current === null || // Don't allow setting virtual elements using the old technique back to
    // `null` to support `positionReference` + an unstable `reference`
    // callback ref.
    node !== null && !isElement(node)) {
      position.refs.setReference(node);
    }
  }, [position.refs]);
  const refs = React.useMemo(() => ({
    ...position.refs,
    setReference,
    setPositionReference,
    domReference: domReferenceRef
  }), [position.refs, setReference, setPositionReference]);
  const elements = React.useMemo(() => ({
    ...position.elements,
    domReference
  }), [position.elements, domReference]);
  const context = React.useMemo(() => ({
    ...position,
    refs,
    elements,
    dataRef,
    nodeId,
    floatingId,
    events,
    open,
    onOpenChange
  }), [position, nodeId, floatingId, events, open, onOpenChange, refs, elements]);
  index(() => {
    const node = tree == null ? void 0 : tree.nodesRef.current.find((node2) => node2.id === nodeId);
    if (node) {
      node.context = context;
    }
  });
  return React.useMemo(() => ({
    ...position,
    context,
    refs,
    elements
  }), [position, refs, elements, context]);
}
const ACTIVE_KEY = "active";
const SELECTED_KEY = "selected";
function mergeProps(userProps, propsList, elementKey) {
  const map = /* @__PURE__ */ new Map();
  const isItem = elementKey === "item";
  let domUserProps = userProps;
  if (isItem && userProps) {
    const {
      [ACTIVE_KEY]: _,
      [SELECTED_KEY]: __,
      ...validProps
    } = userProps;
    domUserProps = validProps;
  }
  return {
    ...elementKey === "floating" && {
      tabIndex: -1
    },
    ...domUserProps,
    ...propsList.map((value) => {
      const propsOrGetProps = value ? value[elementKey] : null;
      if (typeof propsOrGetProps === "function") {
        return userProps ? propsOrGetProps(userProps) : null;
      }
      return propsOrGetProps;
    }).concat(userProps).reduce((acc, props) => {
      if (!props) {
        return acc;
      }
      Object.entries(props).forEach((_ref) => {
        let [key, value] = _ref;
        if (isItem && [ACTIVE_KEY, SELECTED_KEY].includes(key)) {
          return;
        }
        if (key.indexOf("on") === 0) {
          if (!map.has(key)) {
            map.set(key, []);
          }
          if (typeof value === "function") {
            var _map$get;
            (_map$get = map.get(key)) == null || _map$get.push(value);
            acc[key] = function() {
              var _map$get2;
              for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
              }
              return (_map$get2 = map.get(key)) == null ? void 0 : _map$get2.map((fn) => fn(...args)).find((val) => val !== void 0);
            };
          }
        } else {
          acc[key] = value;
        }
      });
      return acc;
    }, {})
  };
}
function useInteractions(propsList) {
  if (propsList === void 0) {
    propsList = [];
  }
  const deps = propsList;
  const getReferenceProps = React.useCallback(
    (userProps) => mergeProps(userProps, propsList, "reference"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  );
  const getFloatingProps = React.useCallback(
    (userProps) => mergeProps(userProps, propsList, "floating"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  );
  const getItemProps = React.useCallback(
    (userProps) => mergeProps(userProps, propsList, "item"),
    // Granularly check for `item` changes, because the `getItemProps` getter
    // should be as referentially stable as possible since it may be passed as
    // a prop to many components. All `item` key values must therefore be
    // memoized.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    propsList.map((key) => key == null ? void 0 : key.item)
  );
  return React.useMemo(() => ({
    getReferenceProps,
    getFloatingProps,
    getItemProps
  }), [getReferenceProps, getFloatingProps, getItemProps]);
}
function usePopup({
  isOpen,
  setIsOpen,
  offset: offset$1 = 0,
  placement = "bottom-start",
  click = true
}) {
  const { x, y, strategy, refs, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [shift(), offset(offset$1), flip()],
    whileElementsMounted: autoUpdate,
    placement
  });
  const appearOnClick = useClick(context, {
    enabled: click
  });
  const dismiss = useDismiss(context, {});
  const { getReferenceProps, getFloatingProps } = useInteractions([
    appearOnClick,
    dismiss
  ]);
  return {
    x,
    y,
    strategy,
    refs,
    getReferenceProps,
    getFloatingProps
  };
}
function ContextMenu({
  isOpen,
  setIsOpen,
  offset: offset2 = 0,
  placement = "bottom-start",
  hover = false,
  click = true,
  onReferenceClick,
  children,
  portal
}) {
  const { x, y, strategy, refs, getReferenceProps, getFloatingProps } = usePopup({
    isOpen,
    setIsOpen,
    offset: offset2,
    placement,
    hover,
    click
  });
  const [reference, floating] = Children.toArray(children);
  const [tableId] = useAtom(tableIdAtom);
  function floatingWithPortal() {
    return isOpen && /* @__PURE__ */ jsx(FloatingPortal, { id: tableId, children: /* @__PURE__ */ jsx(
      "div",
      {
        ref: refs.setFloating,
        style: {
          position: strategy,
          top: y ?? 0,
          left: x ?? 0
        },
        ...getFloatingProps(),
        children: floating
      }
    ) });
  }
  function floatingWithoutPortal() {
    return isOpen && /* @__PURE__ */ jsx(
      "div",
      {
        ref: refs.setFloating,
        style: {
          position: strategy,
          top: y ?? 0,
          left: x ?? 0
        },
        ...getFloatingProps(),
        children: floating
      }
    );
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        ref: refs.setReference,
        ...getReferenceProps({ onClick: onReferenceClick }),
        children: reference
      }
    ),
    portal ? floatingWithPortal() : floatingWithoutPortal()
  ] });
}
function DateCell({
  rowId,
  colId,
  data,
  setData,
  focus,
  isViewOnly,
  configuration
}) {
  const [config] = useAtom(configView);
  const parsedData = useMemo(
    () => config.parseDate !== void 0 ? config.parseDate(data, configuration) : data ? new Date(Date.parse(data)) : null,
    [data, configuration]
  );
  const [value, setValue] = useState(
    parsedData && parsedData._isValid !== false ? getStringFromDate(parsedData) : ""
  );
  const monthSchema = /^([1-9]|1[012]|0[1-9])[/.-]?$/g;
  const monthDaySchema = /^([1-9]|1[012]|0[1-9])[/.-]([1-9]||0[1-9]|1[0-9]|2[0-9]|3[01])[/.-]?$/g;
  const fullDateSchema = /^([1-9]|1[012]|0[1-9])[/.-]([1-9]||0[1-9]|1[0-9]|2[0-9]|3[01])[/.-](\d?\d?\d?\d)$/g;
  const [inputRef, setInputRef] = useState(null);
  const currDate = /* @__PURE__ */ new Date();
  const [, setFocus] = useAtom(setFocusAction);
  const isOpen = focus === "editing";
  const setIsOpen = useCallback(
    (v) => {
      setFocus({ rowId, colId, value: v ? "editing" : "focused" });
    },
    [rowId, colId, setFocus]
  );
  function getDateFromParts(month, day, year) {
    const yearNum = Number(year);
    const monthNum = Number(month) - 1;
    const dayNum = Number(day);
    const date = /* @__PURE__ */ new Date();
    date.setUTCFullYear(yearNum, monthNum, dayNum);
    date.setUTCHours(0, 0, 0, 0);
    return date;
  }
  const onSelect = useCallback(
    (selectedDate) => {
      if (config.formatStorageDate !== void 0) {
        setData(config.formatStorageDate(selectedDate, configuration) || "");
      } else {
        setData((selectedDate == null ? void 0 : selectedDate.toISOString()) || "");
      }
      if (config.formatStorageDate !== void 0) {
        setValue(config.formatStorageDate(parsedData, configuration) || "");
      } else {
        setValue(getStringFromDate(selectedDate));
      }
      setFocus({ rowId, colId, value: "focused" });
    },
    [rowId, colId, setFocus, setData]
  );
  useEffect(() => {
    if (inputRef) {
      inputRef.focus();
    }
  }, [inputRef]);
  useEffect(() => {
    if (config.formatStorageDate !== void 0) {
      setValue(config.formatStorageDate(parsedData, configuration) || "");
    } else {
      setValue(parsedData && parsedData._isValid !== false ? getStringFromDate(parsedData) : "");
    }
  }, [focus]);
  function handleChange(e) {
    setValue(e.target.value);
  }
  useDidUpdateEffect(() => {
    if (!value) {
      return;
    }
    if (config.formatStorageDate !== void 0) {
      return;
    }
    let date = null;
    if (fullDateSchema.test(value)) {
      value.match(fullDateSchema);
      const [matches2] = value.matchAll(fullDateSchema);
      date = getDateFromParts(matches2[1], matches2[2], matches2[3]);
    } else if (monthSchema.test(value)) {
      value.match(monthSchema);
      const [matches2] = value.matchAll(monthSchema);
      date = getDateFromParts(matches2[1], 1, currDate.getUTCFullYear());
    } else if (monthDaySchema.test(value)) {
      value.match(monthDaySchema);
      const [matches2] = value.matchAll(monthDaySchema);
      date = getDateFromParts(
        matches2[1],
        matches2[2],
        currDate.getUTCFullYear()
      );
    }
    setData((date == null ? void 0 : date.toISOString()) || "");
  }, [value]);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    (focus === "none" || focus === "focused") && /* @__PURE__ */ jsx("div", { className: "p-1 flex items-center cursor-default w-full", children: parsedData ? config.formatDisplayDate !== void 0 ? config.formatDisplayDate(parsedData, configuration) : getStringFromDate(parsedData) : "" }),
    focus === "editing" && !isViewOnly && /* @__PURE__ */ jsxs(ContextMenu, { isOpen, setIsOpen, offset: 4, children: [
      /* @__PURE__ */ jsxs("div", { className: "h-full", children: [
        /* @__PURE__ */ jsx("input", { type: "data", className: "hidden", value, readOnly: true }),
        /* @__PURE__ */ jsx(
          "input",
          {
            placeholder: "mm/dd/yyyy",
            className: "rs-input focus:outline-none rounded p-1 w-full",
            onChange: handleChange,
            value,
            ref: setInputRef
          }
        )
      ] }),
      /* @__PURE__ */ jsx(Calendar, { onSelect, value: (parsedData == null ? void 0 : parsedData._isValid) !== false ? parsedData : null })
    ] })
  ] });
}
const numLinesLookup = {
  32: "truncate",
  64: "line-clamp-2",
  96: "line-clamp-4",
  128: "line-clamp-5"
};
function LongTextCell({ data, setData, focusState, isViewOnly }) {
  const [inputRef, setInputRef] = useState(null);
  const parsedData = useMemo(() => data || "", [data]);
  const [height] = useAtom(rowHeightView);
  function handleChange(e) {
    e.preventDefault();
    setData(e.target.value);
  }
  useEffect(() => {
    if (inputRef) {
      inputRef.focus();
      inputRef.setSelectionRange(
        parsedData.length + 1,
        parsedData.length || 0 + 1
      );
      inputRef.scrollTop = inputRef.scrollHeight;
    }
  }, [inputRef]);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    (focusState === "none" || focusState === "focused") && /* @__PURE__ */ jsx(
      "div",
      {
        className: clsx(
          "p-1 cursor-default w-full h-full",
          numLinesLookup[height]
        ),
        children: data
      }
    ),
    focusState === "editing" && !isViewOnly && /* @__PURE__ */ jsx(
      "textarea",
      {
        ref: setInputRef,
        name: "text",
        value: parsedData,
        onChange: handleChange,
        tabIndex: -1,
        className: "rs-textarea p-1 focus:outline-none border-none text-sm w-full max-w-full h-32 rounded-sm resize-none break-words"
      }
    )
  ] });
}
const dummyOptions$1 = [
  {
    name: "Option 1",
    value: "option1"
  },
  {
    name: "Option 2",
    value: "option2"
  },
  {
    name: "Option 3",
    value: "option3"
  }
];
function FlatSelect({
  options: initOptions = dummyOptions$1,
  allOptions,
  onSelect: onSelectCallback,
  placeholder = "Search",
  inputRef,
  OptionRenderer,
  value: initValue = {},
  onNewOption,
  enableSearch = true
}) {
  const [options, setOptions] = useState(initOptions);
  const initOption = options.find((option) => option.value === initValue.value);
  const [currOption, setCurrOption] = useState(initOption || options[0]);
  const [perfectMatch, setPerfectMatch] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const optionColor = useMemo(() => randomColor(), []);
  const [newOption, setNewOption] = useState({});
  const userInput = useRef(false);
  useEffect(() => {
    let perfect = false;
    if (allOptions) {
      for (const i in allOptions) {
        if (allOptions[i].name.toLowerCase() === searchValue.toLowerCase()) {
          perfect = true;
        }
      }
    }
    const filteredOptions = initOptions.filter((option) => {
      if (option.name.toLowerCase() === searchValue.toLowerCase()) {
        perfect = true;
      }
      return option.name.toLowerCase().includes(searchValue.toLowerCase());
    });
    setOptions(filteredOptions);
    if (userInput.current) {
      if (filteredOptions.length > 0) {
        setCurrOption(filteredOptions[0]);
      } else {
        setCurrOption({
          value: searchValue,
          name: searchValue,
          color: optionColor
        });
      }
    } else {
      setCurrOption(initOption || filteredOptions[0]);
    }
    if (perfect) {
      setNewOption({});
    } else {
      setNewOption({
        value: searchValue,
        name: searchValue,
        color: optionColor
      });
    }
    setPerfectMatch(perfect);
  }, [searchValue]);
  function onSelect(option) {
    onSelectCallback == null ? void 0 : onSelectCallback(option);
  }
  function onChange(e) {
    setPerfectMatch(false);
    setSearchValue(e.target.value);
    userInput.current = true;
  }
  const handleKeyDown = useCallback((e) => {
    if (e.code === "Enter") {
      e.preventDefault();
      if (options.length === 0 && perfectMatch) {
        return;
      }
      if (!currOption.value) {
        return;
      }
      if (onNewOption && !perfectMatch) {
        onNewOption(newOption);
      }
      onSelect(currOption);
    } else if (e.code === "ArrowDown") {
      if (!currOption)
        setCurrOption(options[0]);
      const currOptionIndex = options.findIndex(
        (o) => o.value === currOption.value
      );
      setCurrOption(options[(currOptionIndex + 1) % options.length]);
    } else if (e.code === "ArrowUp") {
      if (!currOption)
        setCurrOption(options[0]);
      const currOptionIndex = options.findIndex(
        (o) => o.value === currOption.value
      );
      setCurrOption(
        options[(currOptionIndex + options.length - 1) % options.length]
      );
    }
  });
  function handleMouseEnter(e) {
    e.preventDefault();
    setCurrOption(options[0]);
  }
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "w-full relative pt-2",
      onKeyDown: handleKeyDown,
      onMouseEnter: handleMouseEnter,
      role: "searchbox",
      tabIndex: 0,
      children: [
        enableSearch && /* @__PURE__ */ jsx("div", { className: "px-2 mb-2", children: /* @__PURE__ */ jsx(
          "input",
          {
            className: "rs-input border focus:ring rounded-2 rounded focus:outline-none px-2 p-1 w-full truncate",
            placeholder,
            onChange,
            ref: inputRef,
            value: searchValue
          }
        ) }),
        /* @__PURE__ */ jsxs("ul", { className: "rs-list max-h-48 overflow-auto pb-2", children: [
          options.map((option) => /* @__PURE__ */ jsxs(
            "li",
            {
              className: clsx(
                "hover:bg-hover-light px-2 p-1 cursor-default flex flex-row whitespace-nowrap",
                currOption && currOption.value === option.value && "bg-hover"
              ),
              onClick: (e) => {
                e.preventDefault();
                onSelect(option);
              },
              onMouseEnter: () => {
                setCurrOption(option);
              },
              "aria-selected": currOption.value === option.value,
              onKeyDown: (e) => {
                if (e.code === "Enter") {
                  onSelect(option);
                }
              },
              children: [
                OptionRenderer ? /* @__PURE__ */ jsx(OptionRenderer, { ...option }) : option.name,
                initOption && initOption.value === option.value && /* @__PURE__ */ jsx(CheckIcon$1, { className: "w-4 h-4 ml-auto self-center" })
              ]
            },
            option.value
          )),
          onNewOption && searchValue && !perfectMatch && /* @__PURE__ */ jsxs(
            "li",
            {
              className: clsx(
                "hover:bg-hover-light px-2 p-1 cursor-pointer flex flex-row whitespace-nowrap",
                currOption && currOption.value === newOption.value && "bg-hover"
              ),
              onClick: () => onNewOption(newOption),
              onMouseEnter: () => {
                setCurrOption(newOption);
              },
              "aria-selected": false,
              onKeyDown: (e) => {
                if (e.code === "Enter") {
                  onNewOption(newOption);
                }
              },
              children: [
                /* @__PURE__ */ jsx("span", { className: "mr-2", children: "Add option:" }),
                OptionRenderer ? /* @__PURE__ */ jsx(OptionRenderer, { ...newOption }) : newOption.name
              ]
            }
          )
        ] })
      ]
    }
  );
}
function MultipleSelectCell({
  rowId,
  colId,
  data,
  setData,
  options,
  updateColumn,
  focusState,
  showOptionSearch,
  isViewOnly
}) {
  const parsedData = useMemo(
    () => checkIfEmpty(data) ? [] : data.split(",").map((d) => options.find((o) => o.value === d)),
    [data, options]
  );
  const [searchRef, setSearchRef] = useState(null);
  const isOpen = focusState === "editing";
  const [, setFocus] = useAtom(setFocusAction);
  const setIsOpen = useCallback(
    (value) => {
      setFocus({ rowId, colId, value: value ? "editing" : "focused" });
    },
    [colId, rowId, setFocus]
  );
  const availableOptions = options.filter(
    (o) => parsedData.findIndex((d) => d.value === o.value) === -1
  );
  useEffect(() => {
    if (searchRef) {
      searchRef.focus();
    }
  }, [searchRef]);
  const handleAddOption = useCallback(
    (newOption) => {
      updateColumn({ id: colId, options: [...options, newOption] });
      setData([...parsedData.map((d) => d.value), newOption.value].join(","));
      setFocus({ rowId, colId, value: "focused" });
    },
    [colId, rowId, parsedData, options, updateColumn, setData, setFocus]
  );
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    focusState === "none" && /* @__PURE__ */ jsx("div", { className: "p-1 flex items-center h-full overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "flex gap-1", children: parsedData.map((d) => {
      if (!d)
        return null;
      return /* @__PURE__ */ jsx(Pill, { color: d.color, name: d.name }, d.name);
    }) }) }),
    (focusState === "focused" || focusState === "editing") && /* @__PURE__ */ jsxs(
      ContextMenu,
      {
        isOpen: isOpen && !isViewOnly,
        setIsOpen,
        referenceClass: "w-full max-h-8",
        children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "flex items-center p-1 w-full h-full bg-content",
              tabIndex: focusState === "editing" ? 0 : -1,
              children: /* @__PURE__ */ jsxs("div", { className: "flex gap-1 flex-wrap", children: [
                parsedData.map((d) => {
                  if (!d)
                    return null;
                  return /* @__PURE__ */ jsx(
                    Pill,
                    {
                      color: d.color,
                      name: d.name,
                      onCancel: (e) => {
                        e.stopPropagation();
                        setData(
                          data.split(",").filter((x) => x !== d.value).join(",")
                        );
                      }
                    },
                    d.name
                  );
                }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    className: "p-[3px] bg-zinc-100 rounded flex items-center h-full",
                    type: "button",
                    children: /* @__PURE__ */ jsx(PlusIcon$3, { className: "w-4 text-dark" })
                  }
                )
              ] })
            }
          ),
          /* @__PURE__ */ jsxs(PopupMenu, { children: [
            /* @__PURE__ */ jsx("div", { className: "w-48" }),
            /* @__PURE__ */ jsx(
              FlatSelect,
              {
                allOptions: options,
                options: availableOptions,
                onSelect: (option) => {
                  setData(
                    checkIfEmpty(data) ? option.value : `${data},${option.value}`
                  );
                },
                inputRef: setSearchRef,
                OptionRenderer: Pill,
                placeholder: "Search for an option...",
                onNewOption: handleAddOption,
                enableSearch: showOptionSearch
              }
            )
          ] })
        ]
      }
    )
  ] });
}
function NumberCell({ data, setData, setError, focus, isViewOnly }) {
  const [inputRef, setInputRef] = useState(null);
  const cellSchema = /^[+-]?(\d*(\.\d*)?)$/;
  const parsedData = useMemo(() => data || "", [data]);
  function handleChange(e) {
    e.preventDefault();
    if (cellSchema.test(e.target.value)) {
      setData(e.target.value);
      setError("");
    } else {
      setError("Please enter a number.");
    }
  }
  useEffect(() => {
    setError("");
    if (inputRef) {
      inputRef.focus();
    }
  }, [setError, inputRef]);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    (focus === "none" || focus === "focused") && /* @__PURE__ */ jsx("div", { className: "p-1 flex items-center justify-end truncate cursor-default w-full", children: data }),
    focus === "editing" && !isViewOnly && /* @__PURE__ */ jsx(
      "input",
      {
        type: "text",
        value: parsedData,
        onChange: handleChange,
        ref: setInputRef,
        className: "rs-input p-1 focus:outline-none w-full border-none text-sm rounded-sm truncate text-right"
      }
    )
  ] });
}
function SelectCell({
  rowId,
  colId,
  data,
  setData,
  options,
  updateColumn,
  focusState,
  showOptionSearch,
  isViewOnly
}) {
  const parsedData = useMemo(
    () => checkIfUndefined(data) ? {} : options.find((o) => o.value === data)
  );
  const [searchRef, setSearchRef] = useState(null);
  const isOpen = focusState === "editing";
  const [, setFocus] = useAtom(setFocusAction);
  const setIsOpen = useCallback(
    (value) => {
      setFocus({ rowId, colId, value: value ? "editing" : "focused" });
    },
    [colId, rowId, setFocus]
  );
  useEffect(() => {
    if (searchRef) {
      searchRef.focus();
    }
  }, [searchRef]);
  const handleAddOption = useCallback(
    (newOption) => {
      updateColumn({ id: colId, options: [...options, newOption] });
      setData(newOption.value);
      setFocus({ rowId, colId, value: "focused" });
    },
    [colId, rowId, options, updateColumn]
  );
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    focusState === "none" && /* @__PURE__ */ jsx("div", { className: "p-1 flex items-center h-full", children: parsedData && /* @__PURE__ */ jsx(Pill, { color: parsedData.color, name: parsedData.name }) }),
    isViewOnly && (focusState === "focused" || focusState === "editing") && /* @__PURE__ */ jsx("div", { className: "flex items-center p-1 w-full h-full", children: parsedData && /* @__PURE__ */ jsx(Pill, { color: parsedData.color, name: parsedData.name }) }),
    !isViewOnly && (focusState === "focused" || focusState === "editing") && /* @__PURE__ */ jsxs(
      ContextMenu,
      {
        isOpen,
        setIsOpen,
        referenceClass: "w-full max-h-8",
        children: [
          /* @__PURE__ */ jsxs(
            "div",
            {
              className: "flex items-center p-1 w-full h-full",
              tabIndex: focusState === "editing" ? 0 : -1,
              children: [
                parsedData && /* @__PURE__ */ jsx(Pill, { color: parsedData.color, name: parsedData.name }),
                /* @__PURE__ */ jsx(
                  ChevronDownIcon$1,
                  {
                    className: "w-4 h-4 ml-auto",
                    style: { alignSelf: "center" }
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ jsxs(PopupMenu, { children: [
            /* @__PURE__ */ jsx("div", { className: "w-48" }),
            /* @__PURE__ */ jsx(
              FlatSelect,
              {
                options,
                onSelect: (option) => {
                  setData(option.value);
                  setIsOpen(false);
                },
                inputRef: setSearchRef,
                OptionRenderer: Pill,
                placeholder: "Search for an option...",
                value: parsedData,
                onNewOption: handleAddOption,
                enableSearch: showOptionSearch
              }
            )
          ] })
        ]
      }
    )
  ] });
}
function TextCell({ data, setData, focusState, isViewOnly }) {
  const [inputRef, setInputRef] = useState(null);
  const parsedData = useMemo(() => data || "", [data]);
  function handleChange(e) {
    e.preventDefault();
    setData(e.target.value);
  }
  useEffect(() => {
    if (inputRef) {
      inputRef.focus();
      inputRef.setSelectionRange(parsedData.length + 1, parsedData.length + 1);
      inputRef.scrollLeft = inputRef.scrollWidth;
    }
  }, [inputRef]);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    (focusState === "none" || focusState === "focused") && /* @__PURE__ */ jsx("div", { className: "p-1 flex items-center cursor-default w-full", children: /* @__PURE__ */ jsx("div", { className: "truncate", children: data }) }),
    focusState === "editing" && !isViewOnly && /* @__PURE__ */ jsx(
      "input",
      {
        ref: setInputRef,
        type: "text",
        value: parsedData,
        onChange: handleChange,
        tabIndex: -1,
        rows: 1,
        className: "focus:outline-none rs-input p-1 w-full border-none text-sm rounded-sm truncate resize-none max-h-8"
      }
    )
  ] });
}
function ABarsIcon({ ...rest }) {
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...rest,
      children: [
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M4 20H20M15 11H20M13 6.5H20M4 15.5H20",
            strokeLinecap: "round",
            strokeLinejoin: "round"
          }
        ),
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M4 12L5.5 9M12 12L10.5 9M5.5 9L8 4L10.5 9M5.5 9H10.5",
            strokeLinecap: "round",
            strokeLinejoin: "round"
          }
        )
      ]
    }
  );
}
function AIcon({ ...rest }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...rest,
      children: /* @__PURE__ */ jsx(
        "path",
        {
          d: "M3 20L6.375 14M21 20L17.625 14M6.375 14L12 4L17.625 14M6.375 14H17.625",
          strokeLinecap: "round",
          strokeLinejoin: "round"
        }
      )
    }
  );
}
function CalendarDaysIcon({ ...rest }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...rest,
      children: /* @__PURE__ */ jsx(
        "path",
        {
          d: "M6.75 3V5.25M17.25 3V5.25M3 18.75V7.5C3 6.25736 4.00736 5.25 5.25 5.25H18.75C19.9926 5.25 21 6.25736 21 7.5V18.75M3 18.75C3 19.9926 4.00736 21 5.25 21H18.75C19.9926 21 21 19.9926 21 18.75M3 18.75V11.25C3 10.0074 4.00736 9 5.25 9H18.75C19.9926 9 21 10.0074 21 11.25V18.75M14.25 17.2575V17.25H7.5M16.5075 12.75H16.5V12.7575H16.5075V12.75ZM16.5075 12.75L12.0075 12.7575M16.5075 15.0075V15H16.5V15.0075H16.5075ZM16.5075 15.0075L7.5 15",
          strokeLinecap: "round",
          strokeLinejoin: "round"
        }
      )
    }
  );
}
function LinkCell({ data, setData, focusState, isViewOnly }) {
  const [inputRef, setInputRef] = useState(null);
  const parsedData = useMemo(() => data || "", [data]);
  function handleChange(e) {
    e.preventDefault();
    setData(e.target.value);
  }
  useEffect(() => {
    if (inputRef) {
      inputRef.focus();
      inputRef.setSelectionRange(parsedData.length + 1, parsedData.length + 1);
      inputRef.scrollLeft = inputRef.scrollWidth;
    }
  }, [inputRef]);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    (focusState === "none" || focusState === "focused") && /* @__PURE__ */ jsx("div", { className: "p-1 flex items-center cursor-default w-full", children: /* @__PURE__ */ jsx("div", { className: "truncate", children: /* @__PURE__ */ jsx(
      "a",
      {
        href: `//${data}`,
        rel: "noopener noreferrer",
        target: "_blank",
        className: "text-primary",
        children: data
      }
    ) }) }),
    focusState === "editing" && !isViewOnly && /* @__PURE__ */ jsx(
      "input",
      {
        ref: setInputRef,
        type: "text",
        value: parsedData,
        onChange: handleChange,
        tabIndex: -1,
        rows: 1,
        className: "focus:outline-none rs-input p-1 w-full border-none text-sm rounded-sm truncate resize-none max-h-8"
      }
    )
  ] });
}
function Checkbox({ checked, toggle, isViewOnly }) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(
      "input",
      {
        className: "hidden sr-only",
        type: "checkbox",
        checked,
        value: checked,
        readOnly: true
      }
    ),
    /* @__PURE__ */ jsx(
      "div",
      {
        className: clsx(
          "rounded border w-4 h-4 relative",
          checked ? "bg-blue-500 after:content-['✓'] after:absolute after:left-1/2 after:top-1/2 after:text-inverted after:-translate-x-1/2 after:-translate-y-1/2 after:text-xs" : "bg-background"
        ),
        onClick: () => !isViewOnly && toggle()
      }
    )
  ] });
}
function CheckboxCell({ data, setData, focusState, isViewOnly }) {
  const parsedData = useMemo(() => data || false, [data]);
  return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx("span", { className: "flex items-center justify-center p-1.5", children: /* @__PURE__ */ jsx(Checkbox, { checked: parsedData, toggle: () => setData(!parsedData), isViewOnly: true }) }) });
}
function FormulaCell({ rowData, formula }) {
  return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx("div", { className: "p-1 flex items-center cursor-default w-full", children: /* @__PURE__ */ jsx("div", { className: "truncate", children: formula && typeof formula === "function" && formula(rowData) }) }) });
}
function SigmaIcon({ ...rest }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...rest,
      children: /* @__PURE__ */ jsx(
        "path",
        {
          d: "M19.5 4H5.36998C4.90362 4 4.69119 4.58205 5.04792 4.88246L13.0458 11.6175C13.2831 11.8173 13.2831 12.1827 13.0458 12.3825L5.04792 19.1175C4.69119 19.4179 4.90362 20 5.36998 20H19.5",
          strokeLinecap: "round",
          strokeLinejoin: "round"
        }
      )
    }
  );
}
const types$1 = [
  {
    type: "text",
    cell: TextCell,
    icon: AIcon,
    name: "Single-Line Text"
  },
  {
    type: "longText",
    cell: LongTextCell,
    icon: ABarsIcon,
    name: "Long Text"
  },
  {
    type: "number",
    cell: NumberCell,
    icon: HashtagIcon$1,
    name: "Number"
  },
  {
    type: "select",
    cell: SelectCell,
    icon: Square2StackIcon$1,
    name: "Select"
  },
  {
    type: "date",
    cell: DateCell,
    icon: CalendarDaysIcon,
    name: "Date"
  },
  {
    type: "multiSelect",
    cell: MultipleSelectCell,
    icon: ListBulletIcon$1,
    name: "Multiple Select"
  },
  {
    type: "url",
    cell: LinkCell,
    icon: LinkIcon$1,
    name: "URL"
  },
  {
    type: "checkbox",
    cell: CheckboxCell,
    icon: CheckCircleIcon$1,
    name: "Checkbox"
  },
  {
    type: "formula",
    cell: FormulaCell,
    icon: SigmaIcon,
    name: "Formula"
  }
];
function getColumnType(type) {
  const [config] = useAtom(configView);
  return [...types$1, ...config.extraColumnTypes].find((t) => t.type === type);
}
function defaultSupportedTypes() {
  return types$1;
}
const TableCell = React__default.memo(TableCellInternal);
const TableCell$1 = TableCell;
function TableCellInternal({ rowId, colId, data, rowData, setData }) {
  const [error, setError] = useState("");
  const ref = useRef(null);
  const focusAtom2 = useMemo(
    () => cellFocusAtomFactory(rowId, colId),
    [rowId, colId]
  );
  const [focus, setFocus] = useAtom(focusAtom2);
  const colAtom = useMemo(() => colAtomFactory(colId), [colId]);
  const [col, setCol] = useAtom(colAtom);
  const CurrCell = col.type === "custom" ? col.renderer : getColumnType(col.type).cell;
  const moveFocusAction = useMemo(
    () => moveFocusActionFactory(rowId, colId),
    [rowId, colId]
  );
  const [, moveFocus] = useAtom(moveFocusAction);
  function handleClickOutside(e) {
    if (ref.current && !ref.current.contains(e.target)) {
      setFocus("none");
    }
  }
  function handleKeyDown(e) {
    if (!ref.current || e.target !== ref.current) {
      if (e.code === "Escape") {
        setFocus("focused");
      }
      return;
    }
    if (e.code === "ArrowUp") {
      e.stopPropagation();
      e.preventDefault();
      moveFocus("up");
    } else if (e.code === "ArrowDown") {
      e.stopPropagation();
      e.preventDefault();
      moveFocus("down");
    } else if (e.code === "ArrowLeft") {
      e.stopPropagation();
      e.preventDefault();
      moveFocus("left");
    } else if (e.code === "ArrowRight") {
      e.stopPropagation();
      e.preventDefault();
      moveFocus("right");
    } else if (e.code === "Enter") {
      setFocus("editing");
      e.stopPropagation();
      e.preventDefault();
    } else if (e.code === "Escape") {
      setFocus("none");
    }
  }
  function handleFocus(e) {
    if (ref.current && e.target === ref.current) {
      setFocus("focused");
    }
  }
  function handleDoubleClick(e) {
    e.stopPropagation();
    if (col.isViewOnly)
      return;
    setFocus("editing");
  }
  useEffect(() => {
    if (focus === "focused") {
      document == null ? void 0 : document.addEventListener("mousedown", handleClickOutside);
      if (ref.current) {
        ref.current.focus();
      }
      return () => {
        document == null ? void 0 : document.removeEventListener("mousedown", handleClickOutside);
      };
    }
    if (focus === "editing") {
      document == null ? void 0 : document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document == null ? void 0 : document.removeEventListener("mousedown", handleClickOutside);
      };
    }
    if (focus === "none") {
      if (ref.current) {
        ref.current.blur();
      }
      return () => {
      };
    }
    return () => {
    };
  }, [focus]);
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "relative p-0 border-r bg-content focus:outline-none",
      style: { width: col.width },
      ref,
      onClick: handleFocus,
      onFocus: handleFocus,
      onDoubleClick: handleDoubleClick,
      tabIndex: 0,
      onKeyDown: handleKeyDown,
      role: "gridcell",
      children: /* @__PURE__ */ jsxs(
        "div",
        {
          className: clsx(
            "w-full rounded-sm min-h-full focus:outline-none",
            (focus === "focused" || focus === "editing") && "ring-2 ring-blue-500 absolute top-0 z-10"
          ),
          children: [
            /* @__PURE__ */ jsx(
              CurrCell,
              {
                rowId,
                colId,
                initData: data,
                data,
                options: col.options,
                updateColumn: setCol,
                setError,
                focus,
                focusState: focus,
                setFocus,
                setData,
                showOptionSearch: col.showOptionSearch,
                isViewOnly: col.isViewOnly,
                rowData,
                formula: col.formula,
                configuration: col.configuration
              }
            ),
            focus === "editing" && error && /* @__PURE__ */ jsx("div", { className: "text-xs p-1.5 py-2", children: error })
          ]
        }
      )
    }
  );
}
function renderValue(value, column) {
  if (value === null || value === void 0 || value === "") {
    return "(empty)";
  }
  switch (column.type) {
    case "select": {
      const option = column.options.find((o) => o.value === value);
      return /* @__PURE__ */ jsx(Pill, { color: option.color, name: option.name });
    }
    case "date": {
      return getStringFromDate(new Date(Date.parse(value)));
    }
    default:
      return value;
  }
}
function GroupHeader({ groupVal }) {
  const [grouping] = useAtom(groupingView);
  const groupedColumnAtom = useMemo(
    () => {
      var _a;
      return colAtomFactory(((_a = grouping[0]) == null ? void 0 : _a.columnId) || "");
    },
    [grouping]
  );
  const [groupedByColumn] = useAtom(groupedColumnAtom);
  const [groupInfo, setGroupInfo] = useAtom(groupInfoAtom);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: clsx(
        "w-full h-16 bg-header rounded-t-md border flex",
        groupInfo[groupVal] && "rounded-b-md"
      ),
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "h-full flex items-center justify-center w-16",
            onClick: () => setGroupInfo((old) => ({ ...old, [groupVal]: !old[groupVal] })),
            children: /* @__PURE__ */ jsx(ChevronDownIcon$3, { className: "w-4 h-4" })
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "h-full p-1.5", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs tracking-wider uppercase font-medium text-secondary", children: groupedByColumn.name }),
          /* @__PURE__ */ jsx("div", { className: "flex mt-1", children: renderValue(groupVal, groupedByColumn) })
        ] })
      ]
    }
  );
}
function AddRow({ groupVal }) {
  const [grouping] = useAtom(groupingView);
  const [, addRow] = useAtom(addRowAction);
  function handleAddRow(e) {
    e.preventDefault();
    const newRowData = { data: {} };
    if (grouping.length > 0) {
      newRowData[grouping[0].columnId] = groupVal;
    }
    addRow({ id: nanoid(), ...newRowData });
  }
  return /* @__PURE__ */ jsx(
    "div",
    {
      onClick: handleAddRow,
      className: clsx(
        "rs-btn h-8 border-b border-r font-normal text-sm cursor-pointer flex items-center hover:bg-hover bg-content",
        grouping.length > 0 && "border-l rounded-b-md"
      ),
      tabIndex: 0,
      children: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center", style: { width: 63 }, children: /* @__PURE__ */ jsx(PlusIcon$3, { className: "w-4 h-4" }) })
    }
  );
}
function TableRowStyleWrapper({ rowId, first, last, groupVal }) {
  const [grouping] = useAtom(groupingView);
  const [groupInfo] = useAtom(groupInfoAtom);
  const [tableWidth] = useAtom(tableWidthView);
  const [config] = useAtom(configView);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: clsx(
        first && grouping.length > 0 && "mt-8",
        grouping.length > 0 && "ml-4"
      ),
      style: { width: tableWidth },
      children: [
        grouping.length > 0 && first && /* @__PURE__ */ jsx(GroupHeader, { groupVal }),
        !groupInfo[groupVal] && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("div", { className: clsx(grouping.length > 0 && "border-l"), children: /* @__PURE__ */ jsx(TableRow, { rowId }) }),
          config.addRow.enabled && config.addRow.body && last && /* @__PURE__ */ jsx(AddRow, { groupVal }),
          " "
        ] })
      ]
    }
  );
}
const TableRow = React__default.memo(TableRowInternal);
function TableRowInternal({ rowId }) {
  const rowAtom = useMemo(() => rowAtomFactory(rowId), [rowId]);
  const [row, setRow] = useAtom(rowAtom);
  const [colIds] = useAtom(visibleColumnIdsView);
  const [height] = useAtom(rowHeightView);
  const [config] = useAtom(configView);
  const setData = useMemo(
    () => (colId) => {
      return (val) => {
        setRow({ [colId]: val });
      };
    },
    [setRow]
  );
  return /* @__PURE__ */ jsxs("div", { className: clsx("flex relative border-b"), style: { height }, children: [
    config.selectRow.enabled && /* @__PURE__ */ jsx(
      "div",
      {
        className: clsx(
          "border-r bg-content flex items-center justify-center"
        ),
        style: { width: 64 },
        children: /* @__PURE__ */ jsx(
          Checkbox,
          {
            checked: row.isSelected || false,
            toggle: () => setRow((old) => ({ isSelected: !old.isSelected }))
          }
        )
      }
    ),
    colIds.map((colId) => /* @__PURE__ */ jsx(
      TableCell$1,
      {
        rowId,
        colId,
        data: row[colId],
        rowData: row,
        setData: setData(colId)
      },
      `${rowId}-${colId}`
    ))
  ] });
}
const TableBody = forwardRef(({ handleScroll }, ref) => {
  const [rows] = useAtom(groupedSortedAndFilteredRowIds);
  const [config] = useAtom(configView);
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "h-[calc(100%-65px)] overflow-auto border-b bg-background",
      onScroll: handleScroll,
      ref,
      children: /* @__PURE__ */ jsxs("div", { className: "flex flex-row", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
          rows.map((row, i) => /* @__PURE__ */ jsx(
            TableRowStyleWrapper,
            {
              rowId: row.id,
              first: row.first,
              last: row.last,
              groupVal: row.groupVal
            },
            row.id
          )),
          config.addRow.enabled && /* @__PURE__ */ jsx("div", { className: "h-48 shrink-0 grow" })
        ] }),
        config.addColumn.enabled && /* @__PURE__ */ jsx("div", { className: "w-48 shrink-0 grow" })
      ] })
    }
  );
});
const TableBody$1 = TableBody;
const types = [
  {
    type: "empty",
    name: "Empty",
    atomFactory: (colId) => summaryAtomFactory(colId, (x) => checkIfEmpty(x))
  },
  {
    type: "filled",
    name: "Filled",
    atomFactory: (colId) => summaryAtomFactory(colId, (x) => !checkIfEmpty(x))
  },
  {
    type: "unique",
    name: "Unique",
    atomFactory: uniqueSummaryAtomViewFactory
  }
];
function useSummaryType(type) {
  return types.find((t) => t.type === type);
}
function useSupportedSummaryTypes() {
  return types.map((t) => t.type);
}
const TableFooter = forwardRef(({}, ref) => {
  const [colIds] = useAtom(visibleColumnIdsView);
  const [grouping] = useAtom(groupingView);
  return /* @__PURE__ */ jsx("div", { className: "bg-header h-8", children: /* @__PURE__ */ jsxs("div", { className: "h-8 flex relative", ref, children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        style: { width: 64 },
        className: clsx(grouping.length > 0 && "ml-4", "shrink-0 border-r")
      }
    ),
    colIds.map((colId) => /* @__PURE__ */ jsx(TableFooterCell, { colId }, colId)),
    /* @__PURE__ */ jsx("div", { className: "w-48 grow shrink-0" })
  ] }) });
});
const TableFooter$1 = TableFooter;
function TableFooterCell({ colId }) {
  const colAtom = useMemo(() => colAtomFactory(colId), [colId]);
  const [col, setCol] = useAtom(colAtom);
  const summary = useSummaryType(col.summary);
  const summaryAtom = useMemo(
    () => summary ? summary.atomFactory(col.id) : atom(""),
    [summary, col.id]
  );
  const [summaryValue] = useAtom(summaryAtom);
  const supportedSummaries = useSupportedSummaryTypes();
  const [isOpen, setIsOpen] = useState(false);
  function setColumnSummary(value) {
    setCol({ summary: value });
    setIsOpen(false);
  }
  return /* @__PURE__ */ jsxs(
    ContextMenu,
    {
      isOpen,
      setIsOpen,
      click: true,
      placement: "top-end",
      portal: true,
      portalId: "table-footer",
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            style: { width: col.width },
            className: clsx(
              "hover:bg-hover-light -mr-[1px] h-full flex items-center justify-end text-sm relative group px-2 cursor-default",
              isOpen && "bg-hover"
            ),
            children: summary ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs text-secondary", children: summary.name }),
              /* @__PURE__ */ jsx("span", { className: "ml-1", children: summaryValue })
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(ChevronDownIcon$1, { className: "w-4 h-4 hidden group-hover:block" }),
              /* @__PURE__ */ jsx("span", { className: "hidden group-hover:block text-xs ml-1", children: "Summary" })
            ] })
          }
        ),
        /* @__PURE__ */ jsxs(PopupMenu, { children: [
          /* @__PURE__ */ jsx("div", { className: "w-32" }),
          /* @__PURE__ */ jsxs(PopupMenu.Section, { children: [
            /* @__PURE__ */ jsx(
              PopupMenu.Section.Button,
              {
                onClick: () => {
                  setColumnSummary("");
                },
                children: /* @__PURE__ */ jsx("span", { className: "text-secondary", children: "None" })
              }
            ),
            supportedSummaries.map((type) => {
              const s = useSummaryType(type);
              return /* @__PURE__ */ jsx(
                PopupMenu.Section.Button,
                {
                  onClick: () => {
                    setColumnSummary(s.type);
                  },
                  children: s.name
                },
                s.type
              );
            })
          ] })
        ] })
      ]
    }
  );
}
function ArrowDownIcon({
  title,
  titleId,
  ...props
}, svgRef) {
  return /* @__PURE__ */ React.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: svgRef,
    "aria-labelledby": titleId
  }, props), title ? /* @__PURE__ */ React.createElement("title", {
    id: titleId
  }, title) : null, /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    d: "M12 2.25a.75.75 0 0 1 .75.75v16.19l6.22-6.22a.75.75 0 1 1 1.06 1.06l-7.5 7.5a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 1 1 1.06-1.06l6.22 6.22V3a.75.75 0 0 1 .75-.75Z",
    clipRule: "evenodd"
  }));
}
const ForwardRef$5 = React.forwardRef(ArrowDownIcon);
const ArrowDownIcon$1 = ForwardRef$5;
function ArrowUpIcon({
  title,
  titleId,
  ...props
}, svgRef) {
  return /* @__PURE__ */ React.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: svgRef,
    "aria-labelledby": titleId
  }, props), title ? /* @__PURE__ */ React.createElement("title", {
    id: titleId
  }, title) : null, /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    d: "M11.47 2.47a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 1 1-1.06 1.06l-6.22-6.22V21a.75.75 0 0 1-1.5 0V4.81l-6.22 6.22a.75.75 0 1 1-1.06-1.06l7.5-7.5Z",
    clipRule: "evenodd"
  }));
}
const ForwardRef$4 = React.forwardRef(ArrowUpIcon);
const ArrowUpIcon$1 = ForwardRef$4;
function ArrowsUpDownIcon({
  title,
  titleId,
  ...props
}, svgRef) {
  return /* @__PURE__ */ React.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: svgRef,
    "aria-labelledby": titleId
  }, props), title ? /* @__PURE__ */ React.createElement("title", {
    id: titleId
  }, title) : null, /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    d: "M6.97 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1-1.06 1.06L8.25 4.81V16.5a.75.75 0 0 1-1.5 0V4.81L3.53 8.03a.75.75 0 0 1-1.06-1.06l4.5-4.5Zm9.53 4.28a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V7.5a.75.75 0 0 1 .75-.75Z",
    clipRule: "evenodd"
  }));
}
const ForwardRef$3 = React.forwardRef(ArrowsUpDownIcon);
const ArrowsUpDownIcon$1 = ForwardRef$3;
function PlusIcon({
  title,
  titleId,
  ...props
}, svgRef) {
  return /* @__PURE__ */ React.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: svgRef,
    "aria-labelledby": titleId
  }, props), title ? /* @__PURE__ */ React.createElement("title", {
    id: titleId
  }, title) : null, /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    d: "M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z",
    clipRule: "evenodd"
  }));
}
const ForwardRef$2 = React.forwardRef(PlusIcon);
const PlusIcon$1 = ForwardRef$2;
function TrashIcon({
  title,
  titleId,
  ...props
}, svgRef) {
  return /* @__PURE__ */ React.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: svgRef,
    "aria-labelledby": titleId
  }, props), title ? /* @__PURE__ */ React.createElement("title", {
    id: titleId
  }, title) : null, /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    d: "M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z",
    clipRule: "evenodd"
  }));
}
const ForwardRef$1 = React.forwardRef(TrashIcon);
const TrashIcon$1 = ForwardRef$1;
function XMarkIcon({
  title,
  titleId,
  ...props
}, svgRef) {
  return /* @__PURE__ */ React.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: svgRef,
    "aria-labelledby": titleId
  }, props), title ? /* @__PURE__ */ React.createElement("title", {
    id: titleId
  }, title) : null, /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    d: "M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z",
    clipRule: "evenodd"
  }));
}
const ForwardRef = React.forwardRef(XMarkIcon);
const XMarkIcon$1 = ForwardRef;
function ColumnTypePopup({ colId, supportedTypes }) {
  const [col] = useAtom(useMemo(() => colAtomFactory(colId), [colId]));
  const [, updateColumnType] = useAtom(updateColumnTypeAction);
  const colPopupAtom = useMemo(() => colPopupAtomFactory(colId), [colId]);
  const [, setColPopup] = useAtom(colPopupAtom);
  function handleTypeChange(e, type) {
    e.preventDefault();
    updateColumnType({ colId: col.id, type });
    setColPopup(false);
  }
  return /* @__PURE__ */ jsx(PopupMenu, { children: /* @__PURE__ */ jsxs(PopupMenu.Section, { children: [
    /* @__PURE__ */ jsx("div", { className: "w-56" }),
    /* @__PURE__ */ jsx(PopupMenu.Section.Item, { children: /* @__PURE__ */ jsx("span", { className: "uppercase font-medium text-secondary text-xs", children: "Property Type" }) }),
    supportedTypes.map((type) => {
      return /* @__PURE__ */ jsxs(
        PopupMenu.Section.Button,
        {
          onClick: (e) => {
            handleTypeChange(e, type.type);
          },
          children: [
            /* @__PURE__ */ jsx(type.icon, { className: "w-4 h-4 mr-2" }),
            /* @__PURE__ */ jsx("span", { children: type.name })
          ]
        },
        type.name
      );
    })
  ] }) });
}
function BarsDecreasingIcon({ ...rest }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...rest,
      children: /* @__PURE__ */ jsx(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          d: "M 3 6.75 h 18 M 5 12 h 14 M 7 17.25 h 10"
        }
      )
    }
  );
}
function HeaderPopup({
  colId,
  sortCallback,
  filterCallback,
  deleteCallback
}) {
  const [col, setCol] = useAtom(useMemo(() => colAtomFactory(colId), [colId]));
  const inputRef = useRef();
  const CurrIcon = col.type === "custom" ? col.icon : getColumnType(col.type).icon;
  const typeName = col.type === "custom" ? "Custom" : getColumnType(col.type).name;
  const [, setSortingPopup] = useAtom(sortingPopupAtom);
  const [, setFilteringPopup] = useAtom(filteringPopupAtom);
  const colPopupAtom = useMemo(() => colPopupAtomFactory(colId), [colId]);
  const [, setColPopup] = useAtom(colPopupAtom);
  const [config] = useAtom(configView);
  const supportedColumnTypes = useMemo(() => [...defaultSupportedTypes(), ...config.extraColumnTypes], []);
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.select();
    }
  }, [inputRef]);
  function handleNameChange(e) {
    e.preventDefault();
    setCol({ name: e.target.value });
  }
  function handleKeydown(e) {
    if (e.code === "Enter")
      ;
  }
  function handleColumnDelete(e) {
    e.preventDefault();
    deleteCallback(col);
    setColPopup(false);
  }
  function handleColumnSortAscending(e) {
    e.preventDefault();
    e.stopPropagation();
    sortCallback([{ columnId: col.id, order: "asc" }]);
    setSortingPopup(true);
    setColPopup(false);
  }
  function handleColumnSortDescending(e) {
    e.preventDefault();
    e.stopPropagation();
    sortCallback([{ columnId: col.id, order: "desc" }]);
    setSortingPopup(true);
    setColPopup(false);
  }
  function handleColumnFilter(e) {
    e.preventDefault();
    e.stopPropagation();
    filterCallback([{ columnId: col.id, type: "contains", value: "" }]);
    setFilteringPopup(true);
    setColPopup(false);
  }
  const actions = [
    [
      {
        name: "Sort Ascending",
        icon: ArrowUpIcon$1,
        action: handleColumnSortAscending,
        enabled: config.sorting.enabled
      },
      {
        name: "Sort Descending",
        icon: ArrowDownIcon$1,
        action: handleColumnSortDescending,
        enabled: config.sorting.enabled
      },
      {
        name: "Filter",
        icon: BarsDecreasingIcon,
        action: handleColumnFilter,
        enabled: config.filtering.enabled
      }
    ],
    [
      {
        name: "Delete",
        icon: TrashIcon$1,
        action: handleColumnDelete,
        disabled: col.is_primary === "true" || col.is_primary === true,
        enabled: config.deleteColumns.enabled
      }
    ]
  ];
  const [showType, setShowType] = useState(false);
  const [showExtraActionPopupIndex, setShowExtraActionPopupIndex] = useState(null);
  if (showType) {
    return /* @__PURE__ */ jsx(ColumnTypePopup, { colId, supportedTypes: supportedColumnTypes });
  }
  if (showExtraActionPopupIndex !== null) {
    const action = config.extraColumnHeaderPopupActions[showExtraActionPopupIndex];
    return /* @__PURE__ */ jsx(action.popup, { column: col, setColumn: setCol, close: () => setColPopup(false) });
  }
  return /* @__PURE__ */ jsxs(PopupMenu, { children: [
    /* @__PURE__ */ jsx("div", { className: "w-56" }),
    /* @__PURE__ */ jsxs(PopupMenu.Section, { children: [
      /* @__PURE__ */ jsx(PopupMenu.Section.Item, { children: /* @__PURE__ */ jsx(
        "input",
        {
          value: col.name,
          onChange: handleNameChange,
          ref: inputRef,
          onKeyDown: handleKeydown,
          className: "rs-input focus:outline-none focus:ring rounded rounded-2 p-1 border w-full mb-2"
        }
      ) }),
      /* @__PURE__ */ jsx(PopupMenu.Section.Item, { children: /* @__PURE__ */ jsx("span", { className: "uppercase font-medium text-secondary text-xs", children: "Property Type" }) }),
      /* @__PURE__ */ jsxs(PopupMenu.Section.Button, { onClick: () => setShowType(true), children: [
        CurrIcon && /* @__PURE__ */ jsx(CurrIcon, { className: "w-4 h-4 mr-2" }),
        typeName
      ] }),
      config.extraColumnHeaderPopupActions.filter((popupAction) => popupAction.section === "main").map((popupAction, index2) => {
        return /* @__PURE__ */ jsx(popupAction.menuItem, { column: col, showPopup: () => {
          setShowExtraActionPopupIndex(index2);
        } }, index2);
      })
    ] }),
    actions.map(
      (section, sectionIndex) => section.findIndex((a) => a.enabled === true) !== -1 && /* @__PURE__ */ jsxs(PopupMenu.Section, { children: [
        section.map(
          (action) => action.enabled && /* @__PURE__ */ jsxs(
            PopupMenu.Section.Button,
            {
              onClick: action.action,
              disabled: action.disabled,
              children: [
                /* @__PURE__ */ jsx(action.icon, { className: "w-4 h-4 mr-2" }),
                /* @__PURE__ */ jsx("span", { children: action.name })
              ]
            },
            action.name
          )
        ),
        config.extraColumnHeaderPopupActions.filter((popupAction) => popupAction.section === "actions" + (sectionIndex + 1)).map((popupAction, index2) => {
          return /* @__PURE__ */ jsx(popupAction.menuItem, { column: col, showPopup: () => {
            setShowExtraActionPopupIndex(index2);
          } }, index2);
        })
      ] }, section[0].name)
    )
  ] });
}
function TableHeader({
  colId,
  deleteCallback,
  sortCallback,
  filterCallback
}) {
  const [col, setCol] = useAtom(useMemo(() => colAtomFactory(colId), [colId]));
  const TypeIcon = col.type === "custom" ? col.icon : getColumnType(col.type).icon;
  const [columnWidth, setColumnWidth] = useState(col.width);
  const [isResizing, setIsResizing] = useState(false);
  const colPopupAtom = useMemo(() => colPopupAtomFactory(colId), [colId]);
  const [colPopup, setColPopup] = useAtom(colPopupAtom);
  const [config] = useAtom(configView);
  function handleMouseDown(e) {
    e.preventDefault();
    const originalPositionX = e.pageX;
    const originalWidth = columnWidth;
    setIsResizing(true);
    function resize(re) {
      const newWidth = Math.max(
        128,
        originalWidth + re.pageX - originalPositionX
      );
      setColumnWidth(newWidth);
      setCol({ width: newWidth });
    }
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", () => {
      window.removeEventListener("mousemove", resize);
      setIsResizing(false);
    });
  }
  return /* @__PURE__ */ jsxs("div", { className: "relative", children: [
    /* @__PURE__ */ jsxs(
      ContextMenu,
      {
        isOpen: config.editColumns.enabled && col.isEditable && colPopup && col.type !== "custom",
        setIsOpen: setColPopup,
        portal: true,
        children: [
          /* @__PURE__ */ jsxs(
            "div",
            {
              className: "p-1 px-2 font-normal flex items-center border-r hover:bg-hover-light h-8",
              style: { width: columnWidth },
              children: [
                TypeIcon && /* @__PURE__ */ jsx(TypeIcon, { className: "w-4 h-4 mr-2 shrink-0" }),
                /* @__PURE__ */ jsx("span", { className: "whitespace-nowrap truncate", children: col.name })
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            HeaderPopup,
            {
              colId,
              deleteCallback,
              sortCallback,
              filterCallback
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsx(
      "div",
      {
        className: clsx(
          "h-full w-[5px] hover:bg-blue-500/30 absolute -right-[3px] top-0 cursor-ew-resize z-10",
          isResizing && "bg-blue-500/30"
        ),
        onMouseDown: handleMouseDown,
        role: "none"
      }
    )
  ] });
}
const TableHeaderRow = React__default.forwardRef((_, ref) => {
  const [colIds] = useAtom(visibleColumnIdsView);
  const [isSelected] = useAtom(selectAllRowsView);
  const toggleSelectAllRows = useSetAtom(toggleSelectAllRowsAction);
  const [sorting] = useAtom(sortingView);
  const [grouping] = useAtom(groupingView);
  const [, addColumn] = useAtom(addColumnAction);
  const [, setSorting] = useAtom(setSortingAction);
  const [, setFiltering] = useAtom(setFilteringAction);
  const onFilterChange = useCallback(
    (newFilter) => {
      setFiltering({ filtering: newFilter });
    },
    [setFiltering]
  );
  const onSortChange = useCallback(
    (newSort) => {
      setSorting({ sorting: newSort });
    },
    [setSorting]
  );
  const [, deleteColumn] = useAtom(deleteColumnsAction);
  const handleDeleteColumn = useCallback((column) => {
    if (sorting.find((s) => s.columnId === column.id)) {
      const newSort = sorting.filter((s) => s.columnId !== column.id);
      onSortChange(newSort);
    }
    deleteColumn({ id: column.id });
  });
  function handleAddColumn(e) {
    e.preventDefault();
    addColumn({
      id: nanoid(),
      name: `Column-${generateShortRandomId()}`,
      type: "text",
      width: 192,
      position: colIds.length,
      isVisible: true,
      isEditable: true
    });
  }
  const [config] = useAtom(configView);
  return /* @__PURE__ */ jsx("div", { className: "flex bg-header border-b z-10", children: /* @__PURE__ */ jsxs("div", { className: "flex relative h-8", ref, children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: clsx(
          "h-8 text-sm inline-flex flex-row",
          grouping.length > 0 && "ml-[17px]"
        ),
        children: [
          config.selectRow.enabled && /* @__PURE__ */ jsx(
            "div",
            {
              className: "border-r px-4 flex items-center justify-center h-8",
              style: { width: 64 },
              children: /* @__PURE__ */ jsx(Checkbox, { checked: isSelected, toggle: toggleSelectAllRows })
            }
          ),
          colIds.map((c) => /* @__PURE__ */ jsx(
            TableHeader,
            {
              colId: c,
              sortCallback: onSortChange,
              filterCallback: onFilterChange,
              deleteCallback: handleDeleteColumn
            },
            c
          )),
          config.addColumn.enabled && /* @__PURE__ */ jsx(
            "div",
            {
              onClick: handleAddColumn,
              className: "rs-btn h-8 p-1 cursor-pointer border-r hover:bg-hover-light font-normal w-16 flex items-center justify-center",
              "aria-label": "add-column",
              onKeyDown: (e) => {
                if (e.code === "Enter") {
                  handleAddColumn(e);
                }
              },
              children: /* @__PURE__ */ jsx(PlusIcon$1, { className: "w-4 h-4" })
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "w-32 shrink-0 grow" })
  ] }) });
});
const TableHeaderRow$1 = TableHeaderRow;
function debounce(callback, wait) {
  let timeoutId2 = null;
  return (...args) => {
    window.clearTimeout(timeoutId2);
    timeoutId2 = window.setTimeout(() => {
      callback.apply(null, args);
    }, wait);
  };
}
const dummyOptions = [
  {
    name: "Option 1",
    value: "option1"
  },
  {
    name: "Option 2",
    value: "option2"
  },
  {
    name: "Option 3",
    value: "option3"
  }
];
function Select({
  options = dummyOptions,
  value: initValue = {},
  onSelect: onSelectCallback
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState(initValue);
  const currOption = options.find((option) => option.value === value.value);
  function onSelect(option) {
    setValue(option);
    setIsOpen(false);
    onSelectCallback == null ? void 0 : onSelectCallback(option);
  }
  return /* @__PURE__ */ jsx("div", { className: "w-full relative", children: /* @__PURE__ */ jsxs(
    ContextMenu,
    {
      isOpen,
      setIsOpen,
      offset: 4,
      portal: true,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "rs-btn flex flex-row relative w-full border rounded p-1 pl-2 items-center hover:bg-hover focus:outline-none cursor-default", children: [
          /* @__PURE__ */ jsx("div", { className: "text-ellipsis flex-grow text-left whitespace-nowrap overflow-hidden", children: value.name ? /* @__PURE__ */ jsx("span", { children: value.name }) : /* @__PURE__ */ jsx("span", { className: "text-secondary", children: "Select" }) }),
          /* @__PURE__ */ jsx(ChevronUpDownIcon$1, { className: "w-4 h-4 duration-100 ml-auto" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "min-w-full w-max focus:outline-none", children: /* @__PURE__ */ jsxs(PopupMenu, { children: [
          /* @__PURE__ */ jsx("div", { className: "w-48" }),
          /* @__PURE__ */ jsx(PopupMenu.Section, { children: options.map((option) => /* @__PURE__ */ jsxs(
            PopupMenu.Section.Button,
            {
              onClick: () => {
                onSelect(option);
              },
              children: [
                /* @__PURE__ */ jsx("span", { children: option.name }),
                /* @__PURE__ */ jsx("span", { className: "ml-auto", children: currOption.value === option.value && /* @__PURE__ */ jsx(CheckIcon$1, { className: "w-4 h-4" }) })
              ]
            },
            option.value
          )) })
        ] }) })
      ]
    }
  ) });
}
function FilterPopup({ columns, filter, setFilter }) {
  const [inputRef, setInputRef] = useState(null);
  const filterOptions = [
    {
      value: "contains",
      name: "contains"
    },
    {
      value: "does-not-contain",
      name: "does not contain"
    },
    {
      value: "is",
      name: "is"
    },
    {
      value: "is-not",
      name: "is not"
    }
  ];
  const numericalFilterOptions = [
    {
      value: "equals",
      name: "="
    },
    {
      value: "less-than",
      name: "<"
    },
    {
      value: "greater-than",
      name: ">"
    }
  ];
  useEffect(() => {
    if (inputRef) {
      inputRef.focus();
    }
  }, [inputRef]);
  const handleFilterChange = useMemo(
    () => debounce((f, v) => {
      setFilter((old) => {
        const currIndex = old.findIndex((x) => x.id === f.id);
        return [
          ...old.slice(0, currIndex),
          {
            ...old[currIndex],
            value: v
          },
          ...old.slice(currIndex + 1, old.length)
        ];
      });
    }, 150),
    []
  );
  function getColumnType2(columnId) {
    var _a;
    return (_a = columns.find((c) => c.id === columnId)) == null ? void 0 : _a.type;
  }
  return /* @__PURE__ */ jsxs(PopupMenu, { children: [
    /* @__PURE__ */ jsx("div", { className: "w-56" }),
    filter.length > 0 ? /* @__PURE__ */ jsxs(PopupMenu.Section, { children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm mb-3 px-3 font-medium", children: "Filter By" }),
      /* @__PURE__ */ jsx("div", { className: "px-3 flex flex-col space-y-3", children: filter.map((fi) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "flex flex-row space-x-2",
          children: [
            /* @__PURE__ */ jsx("div", { className: "w-36", children: /* @__PURE__ */ jsx(
              Select,
              {
                options: columns.map((column) => ({
                  value: column.id,
                  name: column.name
                })),
                value: {
                  value: fi.columnId,
                  name: columns.find((c) => c.id === fi.columnId).name
                },
                onSelect: (option) => setFilter((old) => {
                  const currIndex = old.findIndex((x) => x.id === fi.id);
                  return [
                    ...old.slice(0, currIndex),
                    {
                      ...old[currIndex],
                      type: getColumnType2(option.value) === "number" ? "equals" : "contains",
                      columnId: option.value
                    },
                    ...old.slice(currIndex + 1, old.length)
                  ];
                })
              }
            ) }),
            /* @__PURE__ */ jsx("div", { className: "w-28", children: /* @__PURE__ */ jsx(
              Select,
              {
                options: getColumnType2(fi.columnId) === "number" ? numericalFilterOptions : filterOptions,
                value: getColumnType2(fi.columnId) === "number" ? numericalFilterOptions.find(
                  (op) => op.value === fi.type
                ) : filterOptions.find((op) => op.value === fi.type),
                onSelect: (option) => setFilter((old) => {
                  const currIndex = old.findIndex((x) => x.id === fi.id);
                  return [
                    ...old.slice(0, currIndex),
                    {
                      ...old[currIndex],
                      type: option.value
                    },
                    ...old.slice(currIndex + 1, old.length)
                  ];
                })
              }
            ) }),
            /* @__PURE__ */ jsx("div", { className: "w-36", children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                className: "rs-input border h-full rounded w-full focus:outline-none focus:ring px-2 p-1",
                defaultValue: fi.value,
                placeholder: "Type a value...",
                onChange: (e) => handleFilterChange(fi, e.target.value)
              }
            ) }),
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "rs-btn flex items-center justify-center hover:bg-hover-light px-2 rounded hover:cursor-pointer",
                onClick: () => setFilter((old) => old.filter((x) => x.id !== fi.id)),
                "aria-label": "cancel-filter",
                children: /* @__PURE__ */ jsx(XMarkIcon$1, { className: "h-4 w-4" })
              }
            )
          ]
        },
        `filter-${fi.columnId}`
      )) }),
      /* @__PURE__ */ jsx("div", { className: "py-2 px-3", children: /* @__PURE__ */ jsxs(
        "button",
        {
          className: "rs-btn flex items-center justify-center bg-transparent rounded gap-x-1 h-6 font-thin hover:cursor-pointer text-sm p-0",
          onClick: () => setFilter((old) => [
            ...old,
            {
              id: generateShortRandomId(),
              columnId: columns[0].id,
              type: "contains",
              value: ""
            }
          ]),
          "aria-label": "add-condition",
          type: "button",
          children: [
            /* @__PURE__ */ jsx(PlusIcon$1, { className: "h-3 w-3" }),
            /* @__PURE__ */ jsx("span", { children: "Add condition" })
          ]
        }
      ) })
    ] }) : /* @__PURE__ */ jsx(
      FlatSelect,
      {
        options: columns.map((column) => ({
          value: column.id,
          name: column.name
        })),
        onSelect: (option) => setFilter([
          {
            id: generateShortRandomId(),
            columnId: option.value,
            type: getColumnType2(option.value) === "number" ? "equals" : "contains",
            value: ""
          }
        ]),
        inputRef: setInputRef,
        placeholder: "Filter by..."
      }
    )
  ] });
}
function FilterButton({ setFilter }) {
  const [filtering] = useAtom(filteringView);
  const [columns] = useAtom(nonCustomColumnsView);
  const [isOpen, setIsOpen] = useAtom(filteringPopupAtom);
  return /* @__PURE__ */ jsxs(
    ContextMenu,
    {
      isOpen,
      setIsOpen,
      offset: 4,
      portal: true,
      portalId: "table",
      children: [
        Object.keys(filtering).length > 0 ? /* @__PURE__ */ jsxs("div", { className: "rs-btn h-8 hover:ring-2 hover:ring-black/10 hover:ring-inset bg-indigo-200 px-3 rounded text-sm flex row items-center cursor-default text-dark", children: [
          /* @__PURE__ */ jsx(BarsDecreasingIcon, { className: "w-4 h-4 mr-1" }),
          /* @__PURE__ */ jsx("span", { children: `Filtered by ${Object.keys(filtering).length} field` })
        ] }) : /* @__PURE__ */ jsxs(
          "div",
          {
            className: clsx(
              "rs-btn h-8 hover:bg-hover px-3 rounded text-sm flex flex-row items-center cursor-default",
              isOpen && "bg-hover"
            ),
            children: [
              /* @__PURE__ */ jsx(BarsDecreasingIcon, { className: "w-4 h-4 mr-1" }),
              /* @__PURE__ */ jsx("span", { children: "Filter data" })
            ]
          }
        ),
        /* @__PURE__ */ jsx(FilterPopup, { columns, filter: filtering, setFilter })
      ]
    }
  );
}
function GroupsIcon({ ...rest }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...rest,
      children: /* @__PURE__ */ jsx(
        "path",
        {
          d: "M3 17.5V7.50001C3 6.25737 4.00736 5.31584 5.25 5.31584L18.75 5.31583C19.9926 5.31583 21 6.75737 21 8.00001V17.5M3 17.5C3 18.7426 4.00736 19.75 5.25 19.75H18.75C19.9926 19.75 21 18.7426 21 17.5M3 17.5V10M21 17.5V10M18 10H9.5M18 15H9.5M6 10H7M6 15H7",
          strokeLinecap: "round",
          strokeLinejoin: "round"
        }
      )
    }
  );
}
function GroupPopup({ columns, grouping, setGroup }) {
  const [inputRef, setInputRef] = useState(null);
  const groupOptions = [
    {
      value: "asc",
      name: "Ascending"
    },
    {
      value: "desc",
      name: "Descending"
    }
  ];
  useEffect(() => {
    if (inputRef) {
      inputRef.focus();
    }
  }, [inputRef]);
  return /* @__PURE__ */ jsxs(PopupMenu, { children: [
    /* @__PURE__ */ jsx("div", { className: "w-56" }),
    grouping.length > 0 ? /* @__PURE__ */ jsxs(PopupMenu.Section, { children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm mb-3 px-3 font-medium", children: "Group By" }),
      /* @__PURE__ */ jsx("div", { className: "px-3", children: grouping.map((si) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "flex flex-row space-x-2",
          children: [
            /* @__PURE__ */ jsx("div", { className: "w-36", children: /* @__PURE__ */ jsx(
              Select,
              {
                options: columns.map((column) => ({
                  value: column.id,
                  name: column.name
                })),
                value: {
                  value: si.columnId,
                  name: columns.find((c) => c.id === si.columnId).name
                },
                onSelect: (option) => setGroup([{ columnId: option.value, order: "asc" }])
              }
            ) }),
            /* @__PURE__ */ jsx("div", { className: "w-28", children: /* @__PURE__ */ jsx(
              Select,
              {
                options: groupOptions,
                value: groupOptions.find((op) => op.value === si.order),
                onSelect: (option) => setGroup([
                  {
                    columnId: si.columnId,
                    order: option.value
                  }
                ])
              }
            ) }),
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "rs-btn flex items-center justify-center hover:bg-hover-light px-2 rounded",
                onClick: () => setGroup([]),
                "aria-label": "cancel-grouping",
                children: /* @__PURE__ */ jsx(XMarkIcon$1, { className: "h-4 w-4" })
              }
            )
          ]
        },
        `grouping-${si.columnId}`
      )) })
    ] }) : /* @__PURE__ */ jsx(
      FlatSelect,
      {
        options: columns.filter((x) => x.type !== "custom").map((column) => ({
          value: column.id,
          name: column.name
        })),
        onSelect: (option) => setGroup([{ columnId: option.value, order: "asc" }]),
        inputRef: setInputRef,
        placeholder: "Group by..."
      }
    )
  ] });
}
function GroupButton({ grouping = [], setGroup }) {
  const [isOpen, setIsOpen] = useState(false);
  const [columns] = useAtom(allColumnsView);
  return /* @__PURE__ */ jsxs(
    ContextMenu,
    {
      isOpen,
      setIsOpen,
      offset: 4,
      portal: true,
      portalId: "table",
      children: [
        grouping.length > 0 ? /* @__PURE__ */ jsxs("div", { className: "rs-btn h-8 hover:ring-2 hover:ring-black/10 hover:ring-inset bg-purple-200 px-3 rounded text-sm flex row items-center cursor-default text-dark", children: [
          /* @__PURE__ */ jsx(GroupsIcon, { className: "w-4 h-4 mr-1" }),
          /* @__PURE__ */ jsx("span", { children: "Grouped by 1 field" })
        ] }) : /* @__PURE__ */ jsxs(
          "div",
          {
            className: clsx(
              "rs-btn hover:bg-hover px-3 rounded flex flex-row items-center h-8 cursor-default",
              isOpen && "bg-hover"
            ),
            children: [
              /* @__PURE__ */ jsx(GroupsIcon, { className: "w-4 h-4 mr-1" }),
              /* @__PURE__ */ jsx("span", { children: "Group" })
            ]
          }
        ),
        /* @__PURE__ */ jsx(GroupPopup, { columns, grouping, setGroup })
      ]
    }
  );
}
function Toggle({ value, setValue }) {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("input", { type: "checkbox", checked: value, className: "hidden", readOnly: true }),
    /* @__PURE__ */ jsx(
      "div",
      {
        className: clsx(
          "rs-btn rounded-full w-7 h-4 flex items-center cursor-pointer border transition duration-200 ease-in-out",
          value ? "bg-green-500 border-black/10" : "bg-background"
        ),
        onClick: () => setValue(!value),
        "aria-label": "toggle",
        children: /* @__PURE__ */ jsx(
          "div",
          {
            className: clsx(
              "rounded-full h-2.5 w-2.5 bg-white outline outline-1 transition duration-200 ease-in-out ml-0.5",
              value ? "translate-x-3 outline-black/10" : "outline-slate-300"
            )
          }
        )
      }
    )
  ] });
}
function ColumnToggle({ colId }) {
  const [col, setCol] = useAtom(useMemo(() => colAtomFactory(colId), [colId]));
  return /* @__PURE__ */ jsxs(PopupMenu.Section.Item, { children: [
    /* @__PURE__ */ jsx(
      Toggle,
      {
        value: col.isVisible,
        setValue: (val) => setCol({ isVisible: val })
      }
    ),
    /* @__PURE__ */ jsx("span", { className: "ml-2", children: col.name })
  ] }, col.id);
}
function HiddenColumnsPopup({ setColumnVisibility }) {
  const [colIds] = useAtom(allColumnIdsView);
  return /* @__PURE__ */ jsxs(PopupMenu, { children: [
    /* @__PURE__ */ jsx("div", { className: "w-48" }),
    /* @__PURE__ */ jsx(PopupMenu.Section, { children: colIds.map((colId) => /* @__PURE__ */ jsx(ColumnToggle, { colId })) })
  ] });
}
function HiddenColumnsButton({ setColumnVisibility }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hiddenCount] = useAtom(hiddenColumnsCountView);
  return /* @__PURE__ */ jsxs(ContextMenu, { isOpen, setIsOpen, offset: 4, portal: true, children: [
    hiddenCount > 0 ? /* @__PURE__ */ jsxs("div", { className: "rs-btn h-8 hover:ring-2 hover:ring-black/10 hover:ring-inset bg-green-200 px-3 rounded text-sm flex row items-center focus:outline-none cursor-default text-dark", children: [
      /* @__PURE__ */ jsx(EyeSlashIcon$1, { className: "w-4 h-4 mr-1" }),
      /* @__PURE__ */ jsx("span", { children: `${hiddenCount} hidden fields` })
    ] }) : /* @__PURE__ */ jsxs(
      "div",
      {
        className: clsx(
          "rs-btn hover:bg-hover px-3 rounded flex flex-row items-center h-8 focus:outline-none cursor-default",
          isOpen && "bg-hover"
        ),
        children: [
          /* @__PURE__ */ jsx(EyeSlashIcon$1, { className: "w-4 h-4 mr-1" }),
          /* @__PURE__ */ jsx("span", { children: "Hide fields" })
        ]
      }
    ),
    /* @__PURE__ */ jsx(HiddenColumnsPopup, { setColumnVisibility })
  ] });
}
function Height1Icon({ ...rest }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...rest,
      children: /* @__PURE__ */ jsx(
        "path",
        {
          d: "M2 9H14M2 20H14M20 4V20M20 4L18 6M20 4L22 6M20 20L18 18M20 20L22 18M14 4H2M14 14.5H2",
          strokeLinecap: "round",
          strokeLinejoin: "round"
        }
      )
    }
  );
}
function Height2Icon({ ...rest }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...rest,
      children: /* @__PURE__ */ jsx(
        "path",
        {
          d: "M2 20H14M20 4V20M20 4L18 6M20 4L22 6M20 20L18 18M20 20L22 18M14 14.5H2M2 9H14V4H2V9Z",
          strokeLinecap: "round",
          strokeLinejoin: "round"
        }
      )
    }
  );
}
function Height3Icon({ ...rest }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...rest,
      children: /* @__PURE__ */ jsx(
        "path",
        {
          d: "M2 20H14M20 4V20M20 4L18 6M20 4L22 6M20 20L18 18M20 20L22 18M14 4H2V14.5H14V4Z",
          strokeLinecap: "round",
          strokeLinejoin: "round"
        }
      )
    }
  );
}
function Height4Icon({ ...rest }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...rest,
      children: /* @__PURE__ */ jsx(
        "path",
        {
          d: "M20 4V20M20 4L18 6M20 4L22 6M20 20L18 18M20 20L22 18M2 4V20H14V4H2Z",
          strokeLinecap: "round",
          strokeLinejoin: "round"
        }
      )
    }
  );
}
const heights = [
  {
    value: 32,
    name: "Short",
    icon: Height1Icon
  },
  {
    value: 64,
    name: "Medium",
    icon: Height2Icon
  },
  {
    value: 96,
    name: "Tall",
    icon: Height3Icon
  },
  {
    value: 128,
    name: "Extra Tall",
    icon: Height4Icon
  }
];
function useRowHeight(height) {
  return heights.find((h) => h.value === height);
}
function useSupportedRowHeights() {
  return heights.map((h) => h.value);
}
function RowHeightPopup({ height, setHeight }) {
  const supportedHeights = useSupportedRowHeights();
  return /* @__PURE__ */ jsxs(PopupMenu, { children: [
    /* @__PURE__ */ jsx("div", { className: "w-48" }),
    /* @__PURE__ */ jsx(PopupMenu.Section, { children: supportedHeights.map((h) => {
      const heightData = useRowHeight(h);
      return /* @__PURE__ */ jsxs(
        PopupMenu.Section.Button,
        {
          onClick: () => setHeight(heightData.value),
          children: [
            /* @__PURE__ */ jsx(heightData.icon, { className: "w-4 h-4 mr-2" }),
            heightData.name,
            heightData.value === height && /* @__PURE__ */ jsx(CheckIcon$1, { className: "w-4 h-4 ml-auto" })
          ]
        },
        heightData.value
      );
    }) })
  ] });
}
function RowHeightButton({ height, setHeight }) {
  const [isOpen, setIsOpen] = useState(false);
  const heightData = useRowHeight(height);
  return /* @__PURE__ */ jsxs(
    ContextMenu,
    {
      isOpen,
      setIsOpen,
      offset: 4,
      portal: true,
      portalId: "table",
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: clsx(
              "rs-btn hover:bg-hover px-3 rounded flex flex-row items-center h-8 focus:outline-none cursor-default",
              isOpen && "bg-hover"
            ),
            "aria-label": "height-selector",
            children: /* @__PURE__ */ jsx(heightData.icon, { className: "w-4 h-4 mr-1" })
          }
        ),
        /* @__PURE__ */ jsx(RowHeightPopup, { height, setHeight })
      ]
    }
  );
}
function ToolbarButton({ active, Icon, text, bgColor }) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: clsx(
        "rs-btn h-8 hover:ring-2 hover:ring-black/10 hover:ring-inset bg-orange-200 px-3 rounded flex items-center gap-x-1 cursor-default text-dark",
        bgColor && bgColor
      ),
      children: [
        Icon && /* @__PURE__ */ jsx(Icon, { className: "w-4 h-4" }),
        /* @__PURE__ */ jsx("span", { children: text })
      ]
    }
  );
}
function SortPopup({ sort, setSort }) {
  const [inputRef, setInputRef] = useState(null);
  const [columns] = useAtom(allColumnsView);
  const sortOptions = [
    {
      value: "asc",
      name: "Ascending"
    },
    {
      value: "desc",
      name: "Descending"
    }
  ];
  useEffect(() => {
    if (inputRef) {
      inputRef.focus();
    }
  }, [inputRef]);
  return /* @__PURE__ */ jsxs(PopupMenu, { children: [
    /* @__PURE__ */ jsx("div", { className: "w-56" }),
    sort.length > 0 ? /* @__PURE__ */ jsxs(PopupMenu.Section, { children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm mb-3 px-3 font-medium", children: "Sort By" }),
      /* @__PURE__ */ jsx("div", { className: "px-3", children: sort.map((si) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "flex flex-row space-x-2",
          children: [
            /* @__PURE__ */ jsx("div", { className: "w-36", children: /* @__PURE__ */ jsx(
              Select,
              {
                options: columns.map((column) => ({
                  value: column.id,
                  name: column.name
                })),
                value: {
                  value: si.columnId,
                  name: columns.find((c) => c.id === si.columnId).name
                },
                onSelect: (option) => setSort([{ columnId: option.value, order: "asc" }])
              }
            ) }),
            /* @__PURE__ */ jsx("div", { className: "w-28", children: /* @__PURE__ */ jsx(
              Select,
              {
                options: sortOptions,
                value: sortOptions.find((op) => op.value === si.order),
                onSelect: (option) => setSort([
                  {
                    columnId: si.columnId,
                    order: option.value
                  }
                ])
              }
            ) }),
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "rs-btn flex items-center justify-center hover:bg-hover-light px-2 rounded",
                onClick: () => setSort([]),
                "aria-label": "cancel-sort",
                children: /* @__PURE__ */ jsx(XMarkIcon$1, { className: "h-4 w-4" })
              }
            )
          ]
        },
        `sort-${si.columnId}`
      )) })
    ] }) : /* @__PURE__ */ jsx(
      FlatSelect,
      {
        options: columns.filter((x) => x.type !== "custom").map((column) => ({
          value: column.id,
          name: column.name
        })),
        onSelect: (option) => setSort([{ columnId: option.value, order: "asc" }]),
        inputRef: setInputRef,
        placeholder: "Sort by..."
      }
    )
  ] });
}
function SortButton({ setSort }) {
  const [sorting] = useAtom(sortingView);
  const [isOpen, setIsOpen] = useAtom(sortingPopupAtom);
  return /* @__PURE__ */ jsxs(
    ContextMenu,
    {
      isOpen,
      setIsOpen,
      offset: 4,
      portal: true,
      portalId: "table",
      children: [
        sorting.length > 0 ? /* @__PURE__ */ jsx(
          ToolbarButton,
          {
            Icon: ArrowsUpDownIcon$1,
            text: `Sorted by ${Object.keys(sorting).length} field`,
            customColor: "bg-orange-200"
          }
        ) : /* @__PURE__ */ jsxs(
          "div",
          {
            className: clsx(
              "rs-btn hover:bg-hover px-3 rounded flex flex-row items-center h-8 cursor-default",
              isOpen && "bg-hover"
            ),
            children: [
              /* @__PURE__ */ jsx(ArrowsUpDownIcon$1, { className: "w-4 h-4 mr-1" }),
              /* @__PURE__ */ jsx("span", { children: "Sort data" })
            ]
          }
        ),
        /* @__PURE__ */ jsx(SortPopup, { sort: sorting, setSort })
      ]
    }
  );
}
function Toolbar() {
  const [numSelectedRows] = useAtom(numSelectedRowsView);
  const [filtering] = useAtom(filteringView);
  const [sorting] = useAtom(sortingView);
  const [grouping] = useAtom(groupingView);
  const [rowHeight] = useAtom(rowHeightView);
  const [numRows] = useAtom(numRowsView);
  const [, setFiltering] = useAtom(setFilteringAction);
  const cancelSelectedRows = useSetAtom(cancelSelectAllRowsAction);
  const [, deleteSelectedRows] = useAtom(deleteSelectedRowsAction);
  const [, addRow] = useAtom(addRowAction);
  const [, editSelectedRows] = useAtom(editSelectedRowsAction);
  const [config] = useAtom(configView);
  const onFilterChange = useCallback((newFilter) => {
    setFiltering({ filtering: newFilter });
  }, []);
  const handleDeleteSelectedRows = useCallback((e) => {
    e.preventDefault();
    deleteSelectedRows();
  }, []);
  function handleAddRow(e) {
    addRow({ id: nanoid() });
  }
  const [, setSorting] = useAtom(setSortingAction);
  const onSortChange = useCallback((newSort) => {
    setSorting({ sorting: newSort });
  }, []);
  const [, setRowHeight] = useAtom(setRowHeightAction);
  const onRowHeightChange = useCallback((newHeight) => {
    setRowHeight({ rowHeight: newHeight });
  }, []);
  const [, setGrouping] = useAtom(setGroupingAction);
  const onGroupChange = useCallback((newGroup) => {
    setGrouping({ grouping: newGroup });
  }, []);
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "w-full bg-content py-2 text-sm overflow-y-hidden h-12 relative border-b",
      id: "toolbar",
      children: /* @__PURE__ */ jsxs("div", { className: "flex flex-row space-x-2 px-3 items-center whitespace-nowrap h-full", children: [
        /* @__PURE__ */ jsxs("div", { className: "items-center flex w-20 justify-center", children: [
          numRows > 0 ? numRows : "No",
          " row",
          numRows !== 1 && "s"
        ] }),
        numSelectedRows > 0 && /* @__PURE__ */ jsxs("div", { className: "bg-header flex flex-row rounded items-center h-8 cursor-default", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-sm px-2 rounded-l", children: [
            numSelectedRows,
            " row",
            numSelectedRows !== 1 && "s",
            " selected"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "bg-content h-4 w-px last:hidden" }),
          /* @__PURE__ */ jsxs(
            "div",
            {
              className: "rs-btn self-stretch hover:bg-hover-light px-2 text-sm flex flex-row items-center",
              onClick: () => cancelSelectedRows(),
              children: [
                /* @__PURE__ */ jsx(XMarkIcon$1, { className: "w-4 h-4 mr-1" }),
                /* @__PURE__ */ jsx("span", { children: "Cancel" })
              ]
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "bg-content h-4 w-px last:hidden" }),
          /* @__PURE__ */ jsxs(
            "div",
            {
              className: "rs-btn self-stretch hover:bg-hover-light px-2 rounded-r text-sm flex flex-row items-center",
              onClick: handleDeleteSelectedRows,
              children: [
                /* @__PURE__ */ jsx(TrashIcon$3, { className: "w-4 h-4 mr-1" }),
                /* @__PURE__ */ jsx("span", { children: "Delete" })
              ]
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "bg-content h-4 w-px last:hidden" }),
          config.rowSelectionButtons.map((b) => /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "rs-btn self-stretch hover:bg-hover-light px-2 rounded-r text-sm flex flex-row items-center",
                onClick: () => editSelectedRows({
                  handler: b.handler
                }),
                children: b.body
              }
            ),
            /* @__PURE__ */ jsx("div", { className: "bg-content h-4 w-px last:hidden" })
          ] }))
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-4 border" }),
        config.addRow.enabled && config.addRow.toolbar && /* @__PURE__ */ jsxs(
          "div",
          {
            className: "rs-btn hover:bg-hover px-3 rounded flex flex-row items-center h-8 focus:outline-none",
            onClick: handleAddRow,
            children: [
              /* @__PURE__ */ jsx(PlusIcon$1, { className: "w-4 h-4 mr-1" }),
              /* @__PURE__ */ jsx("span", { children: "New row" })
            ]
          }
        ),
        config.hideFields.enabled && /* @__PURE__ */ jsx(HiddenColumnsButton, {}),
        config.filtering.enabled && /* @__PURE__ */ jsx(FilterButton, { filter: filtering, setFilter: onFilterChange }),
        config.grouping.enabled && /* @__PURE__ */ jsx(GroupButton, { grouping, setGroup: onGroupChange }),
        config.sorting.enabled && /* @__PURE__ */ jsx(SortButton, { sort: sorting, setSort: onSortChange }),
        config.rowHeight.enabled && /* @__PURE__ */ jsx(RowHeightButton, { height: rowHeight, setHeight: onRowHeightChange })
      ] })
    }
  );
}
const themeClasses = {
  light: "",
  dark: "dark"
};
function TableInternal() {
  const tableHeader = useRef(null);
  const tableFooter = useRef(null);
  const tableBody = useRef(null);
  const [config] = useAtom(configView);
  useEffect(() => {
    if (!tableBody.current) {
      return () => null;
    }
    function handleScroll(e) {
      tableHeader.current.scrollLeft = tableBody.current.scrollLeft;
      tableHeader.current.style.transform = `translate3d(-${tableBody.current.scrollLeft}px, 0, 0)`;
      if (tableFooter.current)
        tableFooter.current.style.transform = `translate3d(-${tableBody.current.scrollLeft}px, 0, 0)`;
    }
    tableBody.current.addEventListener("scroll", handleScroll);
  }, []);
  useEffect(() => {
    if (!tableHeader.current) {
      return () => null;
    }
    function handleHeaderScroll(e) {
      e.preventDefault();
      tableBody.current.scrollLeft += e.deltaX;
    }
    tableHeader.current.addEventListener("mousewheel", handleHeaderScroll, {
      passive: false
    });
  }, []);
  useEffect(() => {
    if (!tableFooter.current) {
      return () => null;
    }
    function handleFooterScroll(e) {
      e.preventDefault();
      tableBody.current.scrollLeft += e.deltaX;
    }
    tableFooter.current.addEventListener("mousewheel", handleFooterScroll, {
      passive: false
    });
  }, []);
  const [tableId, setTableId] = useAtom(tableIdAtom);
  useEffect(() => {
    setTableId(nanoid());
  }, []);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: clsx(
        "h-full w-full relative rs-table text-sm text-primary overflow-hidden",
        themeClasses[config.theme.color]
      ),
      id: tableId,
      children: [
        config.toolbar.enabled && /* @__PURE__ */ jsx(Toolbar, {}),
        /* @__PURE__ */ jsxs("div", { className: "h-[calc(100%-48px)] overflow-hidden", children: [
          /* @__PURE__ */ jsx(TableHeaderRow$1, { ref: tableHeader }),
          /* @__PURE__ */ jsx(TableBody$1, { ref: tableBody }),
          config.footer.enabled && /* @__PURE__ */ jsx(TableFooter$1, { ref: tableFooter })
        ] })
      ]
    }
  );
}
function HydrateData({ data, columns, onChange, config, children }) {
  useHydrateAtoms([
    [setColumnsAction, columns],
    [setRowsAction, data],
    [setCallbacksAction, { onChange }],
    [setConfigAction, config]
  ]);
  return children;
}
function Table({
  data,
  columns,
  onChange = () => null,
  config = {},
  licenseKey
}) {
  return /* @__PURE__ */ jsx(Provider, { children: /* @__PURE__ */ jsx(
    HydrateData,
    {
      data,
      columns,
      onChange,
      config,
      children: /* @__PURE__ */ jsx(TableInternal, {})
    }
  ) });
}
export {
  EVALUATION_LICENSE,
  Table as default
};
