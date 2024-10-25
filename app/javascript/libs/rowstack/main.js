import "./main.css";
import { jsxs as y, jsx as c, Fragment as X } from "react/jsx-runtime";
import * as f from "react";
import Ge, { createContext as pr, useRef as ce, createElement as gr, useCallback as Y, useContext as vr, useReducer as wr, useEffect as K, useDebugValue as br, useState as H, useLayoutEffect as xn, Children as xr, useMemo as W, forwardRef as yn } from "react";
import * as yr from "react-dom";
import { createPortal as Cr } from "react-dom";
var z = { BASE_URL: "/", MODE: "production", DEV: !1, PROD: !0, SSR: !1 };
let Rr = 0;
function D(e, t) {
  const n = `atom${++Rr}`, r = {
    toString: () => n
  };
  return typeof e == "function" ? r.read = e : (r.init = e, r.read = function(o) {
    return o(this);
  }, r.write = function(o, l, i) {
    return l(
      this,
      typeof i == "function" ? i(o(this)) : i
    );
  }), t && (r.write = t), r;
}
const lt = (e) => "init" in e, st = (e) => !!e.write, $e = /* @__PURE__ */ new WeakMap(), Er = (e, t) => {
  $e.set(e, t), e.catch(() => {
  }).finally(() => $e.delete(e));
}, Ut = (e, t) => {
  const n = $e.get(e);
  n && ($e.delete(e), n(t));
}, Zt = (e, t) => {
  e.status = "fulfilled", e.value = t;
}, Kt = (e, t) => {
  e.status = "rejected", e.reason = t;
}, Sr = (e) => typeof (e == null ? void 0 : e.then) == "function", Oe = (e, t) => !!e && "v" in e && "v" in t && Object.is(e.v, t.v), qt = (e, t) => !!e && "e" in e && "e" in t && Object.is(e.e, t.e), xe = (e) => !!e && "v" in e && e.v instanceof Promise, Nr = (e, t) => "v" in e && "v" in t && e.v.orig && e.v.orig === t.v.orig, _e = (e) => {
  if ("e" in e)
    throw e.e;
  return e.v;
}, Cn = () => {
  const e = /* @__PURE__ */ new WeakMap(), t = /* @__PURE__ */ new WeakMap(), n = /* @__PURE__ */ new Map();
  let r, o;
  (z ? "production" : void 0) !== "production" && (r = /* @__PURE__ */ new Set(), o = /* @__PURE__ */ new Set());
  const l = (m) => e.get(m), i = (m, E) => {
    (z ? "production" : void 0) !== "production" && Object.freeze(E);
    const v = e.get(m);
    if (e.set(m, E), n.has(m) || n.set(m, v), xe(v)) {
      const b = "v" in E ? E.v instanceof Promise ? E.v : Promise.resolve(E.v) : Promise.reject(E.e);
      v.v !== b && Ut(v.v, b);
    }
  }, s = (m, E, v) => {
    const b = /* @__PURE__ */ new Map();
    let k = !1;
    v.forEach((P, A) => {
      !P && A === m && (P = E), P ? (b.set(A, P), E.d.get(A) !== P && (k = !0)) : (z ? "production" : void 0) !== "production" && console.warn("[Bug] atom state not found");
    }), (k || E.d.size !== b.size) && (E.d = b);
  }, u = (m, E, v) => {
    const b = l(m), k = {
      d: (b == null ? void 0 : b.d) || /* @__PURE__ */ new Map(),
      v: E
    };
    if (v && s(m, k, v), Oe(b, k) && b.d === k.d)
      return b;
    if (xe(b) && xe(k) && Nr(b, k)) {
      if (b.d === k.d)
        return b;
      k.v = b.v;
    }
    return i(m, k), k;
  }, a = (m, E, v, b) => {
    if (Sr(E)) {
      let k;
      const P = () => {
        const N = l(m);
        if (!xe(N) || N.v !== A)
          return;
        const I = u(
          m,
          A,
          v
        );
        t.has(m) && N.d !== I.d && S(m, I, N.d);
      }, A = new Promise((N, I) => {
        let T = !1;
        E.then(
          (L) => {
            T || (T = !0, Zt(A, L), N(L), P());
          },
          (L) => {
            T || (T = !0, Kt(A, L), I(L), P());
          }
        ), k = (L) => {
          T || (T = !0, L.then(
            (Z) => Zt(A, Z),
            (Z) => Kt(A, Z)
          ), N(L));
        };
      });
      return A.orig = E, A.status = "pending", Er(A, (N) => {
        N && k(N), b == null || b();
      }), u(m, A, v);
    }
    return u(m, E, v);
  }, p = (m, E, v) => {
    const b = l(m), k = {
      d: (b == null ? void 0 : b.d) || /* @__PURE__ */ new Map(),
      e: E
    };
    return v && s(m, k, v), qt(b, k) && b.d === k.d ? b : (i(m, k), k);
  }, d = (m, E) => {
    const v = l(m);
    if (!E && v && (t.has(m) || Array.from(v.d).every(([T, L]) => {
      if (T === m)
        return !0;
      const Z = d(T);
      return Z === L || Oe(Z, L);
    })))
      return v;
    const b = /* @__PURE__ */ new Map();
    let k = !0;
    const P = (T) => {
      if (T === m) {
        const Z = l(T);
        if (Z)
          return b.set(T, Z), _e(Z);
        if (lt(T))
          return b.set(T, void 0), T.init;
        throw new Error("no atom init");
      }
      const L = d(T);
      return b.set(T, L), _e(L);
    };
    let A, N;
    const I = {
      get signal() {
        return A || (A = new AbortController()), A.signal;
      },
      get setSelf() {
        return (z ? "production" : void 0) !== "production" && !st(m) && console.warn("setSelf function cannot be used with read-only atom"), !N && st(m) && (N = (...T) => {
          if ((z ? "production" : void 0) !== "production" && k && console.warn("setSelf function cannot be called in sync"), !k)
            return M(m, ...T);
        }), N;
      }
    };
    try {
      const T = m.read(P, I);
      return a(
        m,
        T,
        b,
        () => A == null ? void 0 : A.abort()
      );
    } catch (T) {
      return p(m, T, b);
    } finally {
      k = !1;
    }
  }, g = (m) => _e(d(m)), h = (m) => {
    let E = t.get(m);
    return E || (E = F(m)), E;
  }, R = (m, E) => !E.l.size && (!E.t.size || E.t.size === 1 && E.t.has(m)), C = (m) => {
    const E = t.get(m);
    E && R(m, E) && j(m);
  }, w = (m) => {
    const E = /* @__PURE__ */ new Map(), v = /* @__PURE__ */ new WeakMap(), b = (A) => {
      var N;
      const I = new Set((N = t.get(A)) == null ? void 0 : N.t);
      return n.forEach((T, L) => {
        var Z;
        (Z = l(L)) != null && Z.d.has(A) && I.add(L);
      }), I;
    }, k = (A) => {
      b(A).forEach((N) => {
        N !== A && (E.set(
          N,
          (E.get(N) || /* @__PURE__ */ new Set()).add(A)
        ), v.set(N, (v.get(N) || 0) + 1), k(N));
      });
    };
    k(m);
    const P = (A) => {
      b(A).forEach((N) => {
        var I;
        if (N !== A) {
          let T = v.get(N);
          if (T && v.set(N, --T), !T) {
            let L = !!((I = E.get(N)) != null && I.size);
            if (L) {
              const Z = l(N), Ve = d(N, !0);
              L = !Oe(Z, Ve);
            }
            L || E.forEach((Z) => Z.delete(N));
          }
          P(N);
        }
      });
    };
    P(m);
  }, x = (m, ...E) => {
    let v = !0;
    const b = (A) => _e(d(A)), k = (A, ...N) => {
      let I;
      if (A === m) {
        if (!lt(A))
          throw new Error("atom not writable");
        const T = l(A), L = a(A, N[0]);
        Oe(T, L) || w(A);
      } else
        I = x(A, ...N);
      if (!v) {
        const T = _();
        (z ? "production" : void 0) !== "production" && r.forEach(
          (L) => L({ type: "async-write", flushed: T })
        );
      }
      return I;
    }, P = m.write(b, k, ...E);
    return v = !1, P;
  }, M = (m, ...E) => {
    const v = x(m, ...E), b = _();
    return (z ? "production" : void 0) !== "production" && r.forEach(
      (k) => k({ type: "write", flushed: b })
    ), v;
  }, F = (m, E, v) => {
    var b;
    const k = v || [];
    (b = l(m)) == null || b.d.forEach((A, N) => {
      const I = t.get(N);
      I ? I.t.add(m) : N !== m && F(N, m, k);
    }), d(m);
    const P = {
      t: new Set(E && [E]),
      l: /* @__PURE__ */ new Set()
    };
    if (t.set(m, P), (z ? "production" : void 0) !== "production" && o.add(m), st(m) && m.onMount) {
      const { onMount: A } = m;
      k.push(() => {
        const N = A((...I) => M(m, ...I));
        N && (P.u = N);
      });
    }
    return v || k.forEach((A) => A()), P;
  }, j = (m) => {
    var E;
    const v = (E = t.get(m)) == null ? void 0 : E.u;
    v && v(), t.delete(m), (z ? "production" : void 0) !== "production" && o.delete(m);
    const b = l(m);
    b ? (xe(b) && Ut(b.v), b.d.forEach((k, P) => {
      if (P !== m) {
        const A = t.get(P);
        A && (A.t.delete(m), R(P, A) && j(P));
      }
    })) : (z ? "production" : void 0) !== "production" && console.warn("[Bug] could not find atom state to unmount", m);
  }, S = (m, E, v) => {
    const b = new Set(E.d.keys());
    v == null || v.forEach((k, P) => {
      if (b.has(P)) {
        b.delete(P);
        return;
      }
      const A = t.get(P);
      A && (A.t.delete(m), R(P, A) && j(P));
    }), b.forEach((k) => {
      const P = t.get(k);
      P ? P.t.add(m) : t.has(m) && F(k, m);
    });
  }, _ = () => {
    let m;
    for ((z ? "production" : void 0) !== "production" && (m = /* @__PURE__ */ new Set()); n.size; ) {
      const E = Array.from(n);
      n.clear(), E.forEach(([v, b]) => {
        const k = l(v);
        if (k) {
          const P = t.get(v);
          P && k.d !== (b == null ? void 0 : b.d) && S(v, k, b == null ? void 0 : b.d), P && !// TODO This seems pretty hacky. Hope to fix it.
          // Maybe we could `mountDependencies` in `setAtomState`?
          (!xe(b) && (Oe(b, k) || qt(b, k))) && (P.l.forEach((A) => A()), (z ? "production" : void 0) !== "production" && m.add(v));
        } else
          (z ? "production" : void 0) !== "production" && console.warn("[Bug] no atom state to flush");
      });
    }
    if ((z ? "production" : void 0) !== "production")
      return m;
  }, V = (m, E) => {
    const v = h(m), b = _(), k = v.l;
    return k.add(E), (z ? "production" : void 0) !== "production" && r.forEach(
      (P) => P({ type: "sub", flushed: b })
    ), () => {
      k.delete(E), C(m), (z ? "production" : void 0) !== "production" && r.forEach((P) => P({ type: "unsub" }));
    };
  };
  return (z ? "production" : void 0) !== "production" ? {
    get: g,
    set: M,
    sub: V,
    // store dev methods (these are tentative and subject to change without notice)
    dev_subscribe_store: (m, E) => {
      if (E !== 2)
        throw new Error("The current StoreListener revision is 2.");
      return r.add(m), () => {
        r.delete(m);
      };
    },
    dev_get_mounted_atoms: () => o.values(),
    dev_get_atom_state: (m) => e.get(m),
    dev_get_mounted: (m) => t.get(m),
    dev_restore_atoms: (m) => {
      for (const [v, b] of m)
        lt(v) && (a(v, b), w(v));
      const E = _();
      r.forEach(
        (v) => v({ type: "restore", flushed: E })
      );
    }
  } : {
    get: g,
    set: M,
    sub: V
  };
};
let ct;
(z ? "production" : void 0) !== "production" && (typeof globalThis.__NUMBER_OF_JOTAI_INSTANCES__ == "number" ? ++globalThis.__NUMBER_OF_JOTAI_INSTANCES__ : globalThis.__NUMBER_OF_JOTAI_INSTANCES__ = 1);
const kr = () => (ct || ((z ? "production" : void 0) !== "production" && globalThis.__NUMBER_OF_JOTAI_INSTANCES__ !== 1 && console.warn(
  "Detected multiple Jotai instances. It may cause unexpected behavior with the default store. https://github.com/pmndrs/jotai/discussions/2044"
), ct = Cn()), ct);
var Or = { BASE_URL: "/", MODE: "production", DEV: !1, PROD: !0, SSR: !1 };
const Rn = pr(void 0), St = (e) => {
  const t = vr(Rn);
  return (e == null ? void 0 : e.store) || t || kr();
}, Ar = ({
  children: e,
  store: t
}) => {
  const n = ce();
  return !t && !n.current && (n.current = Cn()), gr(
    Rn.Provider,
    {
      value: t || n.current
    },
    e
  );
}, Lr = (e) => typeof (e == null ? void 0 : e.then) == "function", Mr = Ge.use || ((e) => {
  if (e.status === "pending")
    throw e;
  if (e.status === "fulfilled")
    return e.value;
  throw e.status === "rejected" ? e.reason : (e.status = "pending", e.then(
    (t) => {
      e.status = "fulfilled", e.value = t;
    },
    (t) => {
      e.status = "rejected", e.reason = t;
    }
  ), e);
});
function Tr(e, t) {
  const n = St(t), [[r, o, l], i] = wr(
    (a) => {
      const p = n.get(e);
      return Object.is(a[0], p) && a[1] === n && a[2] === e ? a : [p, n, e];
    },
    void 0,
    () => [n.get(e), n, e]
  );
  let s = r;
  (o !== n || l !== e) && (i(), s = n.get(e));
  const u = t == null ? void 0 : t.delay;
  return K(() => {
    const a = n.sub(e, () => {
      if (typeof u == "number") {
        setTimeout(i, u);
        return;
      }
      i();
    });
    return i(), a;
  }, [n, e, u]), br(s), Lr(s) ? Mr(s) : s;
}
function Nt(e, t) {
  const n = St(t);
  return Y(
    (...o) => {
      if ((Or ? "production" : void 0) !== "production" && !("write" in e))
        throw new Error("not writable atom");
      return n.set(e, ...o);
    },
    [n, e]
  );
}
function O(e, t) {
  return [
    Tr(e, t),
    // We do wrong type assertion here, which results in throwing an error.
    Nt(e, t)
  ];
}
const zt = /* @__PURE__ */ new WeakMap();
function Ir(e, t) {
  const n = St(t), r = Dr(n);
  for (const [o, l] of e)
    (!r.has(o) || t != null && t.dangerouslyForceHydrate) && (r.add(o), n.set(o, l));
}
const Dr = (e) => {
  let t = zt.get(e);
  return t || (t = /* @__PURE__ */ new WeakSet(), zt.set(e, t)), t;
};
let Pr = (e) => crypto.getRandomValues(new Uint8Array(e)), Fr = (e, t, n) => {
  let r = (2 << Math.log(e.length - 1) / Math.LN2) - 1, o = -~(1.6 * r * t / e.length);
  return (l = t) => {
    let i = "";
    for (; ; ) {
      let s = n(o), u = o;
      for (; u--; )
        if (i += e[s[u] & r] || "", i.length === l)
          return i;
    }
  };
}, En = (e, t = 21) => Fr(e, t, Pr), Je = (e = 21) => crypto.getRandomValues(new Uint8Array(e)).reduce((t, n) => (n &= 63, n < 36 ? t += n.toString(36) : n < 62 ? t += (n - 26).toString(36).toUpperCase() : n > 62 ? t += "-" : t += "_", t), "");
En(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  8
);
const jr = En(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  4
);
function ht() {
  return jr();
}
function ge(e) {
  return Ie(e) || e === "";
}
function Ie(e) {
  return e === null || e === void 0;
}
function U(...e) {
  return e.filter(Boolean).join(" ");
}
function pt() {
  return `hsl(${Math.floor(Math.random() * 360)}, 100%, 92%)`;
}
function Vr(e) {
  const t = parseInt(e);
  return Number.isNaN(t) ? null : t.toString();
}
function _r(e, t, n) {
  if (n.length === 0)
    return 1;
  for (const r of n) {
    if (ge(e[r.columnId]))
      return 1;
    if (ge(t[r.columnId]))
      return -1;
    const o = e[r.columnId].toString().toLowerCase(), l = t[r.columnId].toString().toLowerCase();
    if (o < l)
      return r.order === "asc" ? -1 : 1;
    if (o > l)
      return r.order === "asc" ? 1 : -1;
  }
  return 0;
}
function Br(e, t) {
  if (t.length === 0)
    return !0;
  for (const n of t) {
    let r = e[n.columnId];
    switch (Ie(r) && (r = ""), typeof r == "number" && (r = r.toString()), r = r.toLowerCase(), n.type) {
      case "contains":
        if (!r.includes(n.value.toLowerCase()))
          return !1;
        break;
      case "does-not-contain":
        if (r.includes(n.value.toLowerCase()))
          return !1;
        break;
      case "is":
        if (r !== n.value.toLowerCase())
          return !1;
        break;
      case "is-not":
        if (r === n.value.toLowerCase())
          return !1;
        break;
      case "less-than":
        if (n.value !== "" && Number(r) >= Number(n.value))
          return !1;
        break;
      case "greater-than":
        if (n.value !== "" && Number(r) <= Number(n.value))
          return !1;
        break;
      case "equals":
        if (n.value !== "" && Number(r) !== Number(n.value))
          return !1;
        break;
    }
  }
  return !0;
}
const Sn = "update_column", Hr = "delete_column", $r = "add_row", Wr = "delete_rows", Ur = "update_row", Nn = "update_rows", Zr = "add_column", kt = (e, t) => e + t, kn = (e, t) => {
  if (e === void 0)
    return t;
  for (const n of Object.keys(t))
    t[n] instanceof Object && Object.assign(t[n], kn(e[n], t[n]));
  return Object.assign(e || {}, t), e;
}, gt = {
  theme: {
    color: "light"
  },
  toolbar: {
    enabled: !0
  },
  addColumn: {
    enabled: !0
  },
  addRow: {
    enabled: !0,
    toolbar: !0,
    body: !0
  },
  grouping: {
    enabled: !0
  },
  sorting: {
    enabled: !0
  },
  filtering: {
    enabled: !0
  },
  footer: {
    enabled: !0
  },
  rowHeight: {
    enabled: !0
  },
  hideFields: {
    enabled: !0
  },
  deleteColumns: {
    enabled: !0
  },
  editColumns: {
    enabled: !0
  },
  selectRow: {
    enabled: !0
  },
  readOnly: {
    enabled: !1
  },
  rowSelectionButtons: [],
  extraColumnTypes: [],
  extraColumnHeaderPopupActions: [],
  formatDate: void 0
}, Ot = D(gt), oe = D((e) => e(Ot)), Kr = D(null, (e, t, n) => {
  gt.rowSelectionButtons = [], t(Ot, kn(gt, n));
}), On = D(""), ne = D({ onChange: () => null }), qr = D(
  null,
  (e, t, n) => t(ne, n)
);
D(null, (e, t, n) => {
  t(ne, { onChange: n });
});
const $ = D({}), zr = (e) => D((t) => new Set(Object.entries(t($)).map(([n, r]) => r[e])).size), An = (e) => D(
  (t) => t($)[e],
  (t, n, r) => {
    typeof r == "function" && (r = r(t(An(e)))), n($, (o) => ({ ...o, [e]: { ...o[e], ...r } })), t(ne).onChange({ type: Ur, rowId: e, update: r });
  }
), me = (e) => D(
  (t) => t(G)[e],
  (t, n, r) => {
    typeof r == "function" && (r = r(t(G)[e])), n(G, (o) => ({
      ...o,
      [e]: { ...o[e], ...r }
    })), t(ne).onChange({
      type: Sn,
      colId: e,
      update: r
    });
  }
), Yr = D(null, (e, t, n) => {
  const r = Object.entries(e($)).filter(([, o]) => o.isSelected === !0).map(([o, l]) => o);
  t(
    $,
    Object.fromEntries(
      Object.entries(e($)).filter(([, o]) => o.isSelected !== !0)
    )
  ), t(ue, !1), e(ne).onChange({
    type: Wr,
    rows: [r]
  });
}), Xr = D(
  null,
  (e, t, n = { handler: () => null }) => {
    t(
      $,
      Object.fromEntries(
        n.handler(Object.entries(e($)).map(([r, o]) => o)).map((r) => [r.id, r])
      )
    ), e(ne).onChange({
      type: Nn,
      rows: n.handler(Object.entries(e($)).map(([r, o]) => o)).map((r) => ({ rowId: r.id, update: r }))
    }), t(
      $,
      Object.fromEntries(
        Object.entries(e($)).map(([r, o]) => [
          r,
          { ...o, isSelected: !1 }
        ])
      )
    ), t(ue, !1);
  }
), Gr = D(null, (e, t, n) => {
  t($, Object.fromEntries(n.map((r) => [r.id, r])));
}), Ln = D(null, (e, t, n) => {
  t($, (r) => ({
    ...r,
    [n.id]: n
  })), t(et(n.id, e(se)[0]), "editing"), e(ne).onChange({ type: $r, rowId: n.id, update: n });
}), Jr = D((e) => Object.keys(e($)).length), Qr = D(
  (e) => e(ue) ? Object.keys(e($)).length : Object.entries(e($)).map(([, t]) => t.isSelected === !0).reduce(kt, 0)
), At = D({}), Le = D((e) => Object.entries(e($)).filter(([, t]) => Br(t, e(Tt))).sort(
  ([, t], [, n]) => _r(t, n, [...e(Te), ...e(Lt)])
).map(([t, n]) => ({
  id: t,
  groupVal: e(Te).length === 0 ? "" : n[e(Te)[0].columnId]
})).map((t, n, r) => ({
  id: t.id,
  first: n === 0 || t.groupVal !== r[n - 1].groupVal,
  last: n === r.length - 1 || t.groupVal !== r[n + 1].groupVal,
  groupVal: t.groupVal
}))), Yt = D({}), Qe = (e) => D(
  (t) => t(Yt)[e],
  (t, n, r) => n(Yt, (o) => ({ ...o, [e]: r }))
), G = D({}), se = D(
  (e) => Object.entries(e(G)).filter(([t, n]) => n.isVisible === !0).map(([t]) => t)
), Mn = D(
  (e) => Object.entries(e(G)).map(([t, n]) => n)
), eo = D(
  (e) => Object.entries(e(G)).map(([t, n]) => n).filter((t) => t.type !== "custom")
), to = D((e) => Object.keys(e(G))), no = D(
  (e) => Object.entries(e(G)).map(([, t]) => t.isVisible).reduce((t, n) => t + (n === !1), 0)
), ro = {
  isVisible: !0,
  width: 192,
  type: "text",
  options: [],
  showOptionSearch: !0,
  isEditable: !0,
  isViewOnly: !1
}, oo = D(null, (e, t, n) => {
  t(
    G,
    Object.fromEntries(
      n.map((r) => ({ ...ro, ...r })).map((r) => [r.id, r])
    )
  );
}), io = D(null, (e, t, n) => {
  t(G, (r) => ({ ...r, [n.id]: n })), t(Qe(n.id), !0), e(ne).onChange({
    type: Zr,
    colId: n.id,
    update: n
  });
}), lo = D(null, (e, t, n) => {
  t(
    G,
    (r) => Object.fromEntries(Object.entries(r).filter(([o]) => o !== n.id))
  ), e(ne).onChange({ type: Hr, colId: n.id });
}), so = D((e) => Object.entries(e(G)).filter(([t, n]) => n.isVisible === !0).map(([t, n]) => n.width).reduce(kt, e(Ot).selectRow.enabled ? 64 : 0)), Te = D([]), Se = D((e) => e(Te)), co = D(null, (e, t, n) => {
  t(Te, n.grouping), t(At, {});
}), Tn = D(!1), In = D(!1), Lt = D([]), Mt = D((e) => e(Lt)), Dn = D(null, (e, t, n) => {
  t(Lt, n.sorting);
}), Tt = D([]), Pn = D((e) => e(Tt)), Fn = D(null, (e, t, n) => {
  t(Tt, n.filtering);
}), jn = D(32), It = D((e) => e(jn)), ao = D(null, (e, t, n) => {
  t(jn, n.rowHeight);
}), ue = D(!1), uo = D((e) => e(ue)), fo = D(null, (e, t, n) => {
  const r = e(ue);
  t(ue, !r), t(
    $,
    Object.fromEntries(
      Object.entries(e($)).map(([o, l]) => [
        o,
        { ...l, isSelected: !r }
      ])
    )
  );
}), mo = D(null, (e, t, n) => {
  t(ue, !1), t(
    $,
    Object.fromEntries(
      Object.entries(e($)).map(([r, o]) => [
        r,
        { ...o, isSelected: !1 }
      ])
    )
  );
});
D(null, (e, t, n) => {
  t(ue, n.value), t(
    $,
    Object.fromEntries(
      Object.entries(e($)).map(([r, o]) => [
        r,
        { ...o, isSelected: n.value }
      ])
    )
  );
});
const Vn = D(!1);
D((e) => e(Vn));
D(null, (e, t, n) => {
  t(Vn, n.dragging);
});
const Xt = D({}), et = (e, t) => D(
  (n) => {
    var r;
    return ((r = n(Xt)[e]) == null ? void 0 : r[t]) || "none";
  },
  (n, r, o) => {
    r(Xt, { [e]: { [t]: o } });
  }
), Dt = D(null, (e, t, n) => {
  t(et(n.rowId, n.colId), n.value);
}), ho = D(null, (e, t, n) => {
  const { colId: r, type: o } = n;
  let l = e(G)[r].options, i = (s) => s;
  switch (o) {
    case "select": {
      l = [
        ...new Set(Object.entries(e($)).map(([u, a]) => a[r]))
      ].filter((u) => !Ie(u) && u !== "").map((u) => ({
        value: u,
        name: u,
        color: pt()
      }));
      break;
    }
    case "multiSelect": {
      l = [
        ...new Set(
          Object.entries(e($)).flatMap(
            ([u, a]) => ge(a[r]) ? [] : a[r].split(",")
          )
        )
      ].filter((u) => !Ie(u) && u !== "").map((u) => ({
        value: u,
        name: u,
        color: pt()
      }));
      break;
    }
    case "number": {
      i = (s) => Vr(s);
      break;
    }
    case "date": {
      i = (s) => Number.isNaN(Date.parse(s)) ? "" : new Date(Date.parse(s)).toISOString();
      break;
    }
    case "checkbox":
      i = (s) => {
        var u, a, p;
        return ((p = (a = (u = s == null ? void 0 : s.toLowerCase) == null ? void 0 : u.call(s)) == null ? void 0 : a.trim) == null ? void 0 : p.call(a)) === "true";
      };
  }
  t(me(r), (s) => ({ ...s[r], type: o, options: l })), t(
    $,
    Object.fromEntries(
      Object.entries(e($)).map(([s, u]) => [
        s,
        { ...u, [r]: i(u[r]) }
      ])
    )
  ), e(ne).onChange({
    type: Sn,
    colId: r,
    update: { type: o, options: l }
  }), e(ne).onChange({
    type: Nn,
    rows: Object.entries(e($)).map(([s, u]) => ({
      rowId: s,
      update: { [r]: i(u[r]) }
    }))
  });
}), po = (e, t) => D(null, (n, r, o) => {
  const l = n(se).findIndex((a) => a === t), i = n(Le).findIndex(
    (a) => a.id === e
  );
  let s = e, u = t;
  switch (o) {
    case "left": {
      u = n(se)[Math.max(0, l - 1)];
      break;
    }
    case "right": {
      u = n(se)[Math.min(n(se).length - 1, l + 1)];
      break;
    }
    case "up": {
      s = n(Le).map((a) => a.id)[Math.max(0, i - 1)];
      break;
    }
    case "down": {
      s = n(Le).map((a) => a.id)[Math.min(
        n(Le).flatMap((a) => a.rowIds).length - 1,
        i + 1
      )];
      break;
    }
  }
  t === u && e === s || r(et(s, u), "focused");
}), Gt = (e, t) => D(
  (n) => Object.entries(n($)).map(([r, o]) => o[e]).map(t).reduce(kt, 0)
), go = "CXA69e9KQ1eLOTkAwOpCqQ==", vo = "100000000000000000000001";
async function wo(e) {
  if (e !== vo)
    try {
      const t = await fetch("https://api.gumroad.com/v2/licenses/verify", {
        body: `product_id=${go}&license_key=${e}`,
        method: "POST"
      });
      if (!t.ok)
        throw new Error(t.status);
    } catch {
      console.error("License key verification failed");
    }
}
function bo({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ f.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ f.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ f.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
  }));
}
const xo = f.forwardRef(bo), yo = xo;
function Co({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ f.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ f.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ f.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "m19.5 8.25-7.5 7.5-7.5-7.5"
  }));
}
const Ro = f.forwardRef(Co), Eo = Ro;
function So({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ f.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ f.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ f.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
  }));
}
const No = f.forwardRef(So), Jt = No;
function ko({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ f.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ f.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ f.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5"
  }));
}
const Oo = f.forwardRef(ko), Ao = Oo;
function Lo({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ f.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ f.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ f.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
  }));
}
const Mo = f.forwardRef(Lo), To = Mo;
function Io({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ f.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ f.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ f.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
  }));
}
const Do = f.forwardRef(Io), Po = Do;
function Fo({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ f.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ f.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ f.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M12 4.5v15m7.5-7.5h-15"
  }));
}
const jo = f.forwardRef(Fo), _n = jo;
function Vo({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ f.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ f.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ f.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M16.5 8.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v8.25A2.25 2.25 0 0 0 6 16.5h2.25m8.25-8.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-7.5A2.25 2.25 0 0 1 8.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 0 0-2.25 2.25v6"
  }));
}
const _o = f.forwardRef(Vo), Bo = _o;
function Ho({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ f.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ f.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ f.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
  }));
}
const $o = f.forwardRef(Ho), Wo = $o;
function Me(e) {
  const t = e.getUTCMonth() + 1, n = e.getUTCDate(), r = e.getUTCFullYear();
  return `${t.toString().padStart(2, "0")}/${n.toString().padStart(2, "0")}/${r.toString().padStart(4, "0")}`;
}
function Uo({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ f.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ f.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ f.createElement("path", {
    fillRule: "evenodd",
    d: "M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z",
    clipRule: "evenodd"
  }));
}
const Zo = f.forwardRef(Uo), Pt = Zo;
function Ko({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ f.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ f.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ f.createElement("path", {
    fillRule: "evenodd",
    d: "M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z",
    clipRule: "evenodd"
  }));
}
const qo = f.forwardRef(Ko), Bn = qo;
function zo({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ f.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ f.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ f.createElement("path", {
    fillRule: "evenodd",
    d: "M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z",
    clipRule: "evenodd"
  }));
}
const Yo = f.forwardRef(zo), Xo = Yo;
function Go({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ f.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ f.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ f.createElement("path", {
    fillRule: "evenodd",
    d: "M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z",
    clipRule: "evenodd"
  }));
}
const Jo = f.forwardRef(Go), Qo = Jo;
function ei({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ f.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ f.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ f.createElement("path", {
    fillRule: "evenodd",
    d: "M10.53 3.47a.75.75 0 0 0-1.06 0L6.22 6.72a.75.75 0 0 0 1.06 1.06L10 5.06l2.72 2.72a.75.75 0 1 0 1.06-1.06l-3.25-3.25Zm-4.31 9.81 3.25 3.25a.75.75 0 0 0 1.06 0l3.25-3.25a.75.75 0 1 0-1.06-1.06L10 14.94l-2.72-2.72a.75.75 0 0 0-1.06 1.06Z",
    clipRule: "evenodd"
  }));
}
const ti = f.forwardRef(ei), ni = ti;
function ri({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ f.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ f.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ f.createElement("path", {
    d: "M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"
  }));
}
const oi = f.forwardRef(ri), ii = oi;
function he({ name: e, color: t, onCancel: n }) {
  return /* @__PURE__ */ y(
    "div",
    {
      className: "rounded px-1.5 p-[1px] truncate whitespace-nowrap text-dark items-center flex cursor-default",
      style: { backgroundColor: t },
      children: [
        e,
        n && /* @__PURE__ */ c(ii, { className: "w-4 h-4", onClick: n })
      ]
    }
  );
}
function li(e, t) {
  const n = ce(t);
  K(() => {
    let r = !1;
    for (const o in t) {
      let l = t[o], i = n.current[o];
      if (l instanceof Date && (l = l.getTime()), i instanceof Date && (i = i.getTime()), l !== i) {
        r = !0;
        break;
      }
    }
    if (n.current = t, r)
      return e();
  }, t);
}
function B({ children: e, background: t }) {
  return /* @__PURE__ */ c("div", { className: "shadow-md border rounded rounded-2 text-sm bg-header", children: e });
}
function Ft({ children: e }) {
  return /* @__PURE__ */ c("div", { className: "border-b last:border-none", children: /* @__PURE__ */ c("div", { className: "py-3", children: e }) });
}
B.Section = Ft;
function si({ children: e, ...t }) {
  return /* @__PURE__ */ c("div", { className: "px-3 py-1 flex items-center cursor-default", ...t, children: e });
}
function ci({ children: e, disabled: t, ...n }) {
  return /* @__PURE__ */ c(
    "div",
    {
      className: U(
        "rs-btn w-full hover:bg-hover-light px-3 py-1 flex items-center cursor-default",
        t === !0 && "text-secondary"
      ),
      disabled: t,
      ...n,
      children: e
    }
  );
}
Ft.Item = si;
Ft.Button = ci;
const ai = (e, t) => new Date(e, t + 1, 0).getDate(), ui = [
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
], di = [
  "first:col-start-1",
  "first:col-start-2",
  "first:col-start-3",
  "first:col-start-4",
  "first:col-start-5",
  "first:col-start-6",
  "first:col-start-7"
];
function fi({
  value: e,
  onSelect: t
}) {
  const [n, r] = H(e || null), o = /* @__PURE__ */ new Date(), [l, i] = H(
    n ? n.getUTCMonth() : o.getUTCMonth()
  ), [s, u] = H(
    n ? n.getUTCFullYear() : o.getUTCFullYear()
  );
  K(() => {
    if (!e) {
      r(null);
      return;
    }
    r(e), i(e.getUTCMonth()), u(e.getUTCFullYear());
  }, [e]);
  const a = [...Array(ai(s, l)).keys()], p = new Date(s, l, 1).getDay(), d = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  function g() {
    l === 0 ? (u((w) => w - 1), i(11)) : i((w) => w - 1);
  }
  function h() {
    l === 11 ? (u((w) => w + 1), i(0)) : i((w) => w + 1);
  }
  function R(w, x) {
    w.preventDefault();
    const M = /* @__PURE__ */ new Date();
    M.setUTCFullYear(s, l, x), r(M), t == null || t(M);
  }
  function C(w) {
    return n && n.getUTCDate() === w && n.getUTCMonth() === l && n.getUTCFullYear() === s;
  }
  return /* @__PURE__ */ c("div", { className: "w-56", children: /* @__PURE__ */ y(B, { children: [
    /* @__PURE__ */ c(B.Section, { children: /* @__PURE__ */ y("div", { className: "flex px-2 items-center", children: [
      /* @__PURE__ */ y("div", { className: "grow text-left px-1", children: [
        ui[l],
        " ",
        s
      ] }),
      /* @__PURE__ */ c(
        "div",
        {
          className: "rs-btn hover:bg-hover-light rounded p-1",
          onClick: g,
          "aria-label": "move-calendar-left",
          children: /* @__PURE__ */ c(Xo, { className: "w-4 h-4" })
        }
      ),
      /* @__PURE__ */ c(
        "div",
        {
          className: "rs-btn hover:bg-hover-light rounded p-1",
          onClick: h,
          "aria-label": "move-calendar-right",
          children: /* @__PURE__ */ c(Qo, { className: "w-4 h-4" })
        }
      )
    ] }) }),
    /* @__PURE__ */ y(B.Section, { children: [
      /* @__PURE__ */ c("div", { className: "grid grid-cols-7 text-sm px-2 gap-px mb-2", children: d.map((w) => /* @__PURE__ */ c("div", { className: "text-secondary font-medium flex items-center justify-center", children: w })) }),
      /* @__PURE__ */ c("div", { className: "grid grid-cols-7 text-sm px-2 gap-px", children: a.map((w) => /* @__PURE__ */ c(
        "div",
        {
          className: U(
            "rs-btn p-0.5 rounded flex items-center justify-center col-span-1",
            di[p],
            !C(w + 1) && "hover:bg-hover-light",
            C(w + 1) && "bg-blue-500 text-inverted hover:bg-blue-500"
          ),
          onClick: (x) => {
            R(x, w + 1);
          },
          children: w + 1
        },
        `day-${w}`
      )) })
    ] })
  ] }) });
}
function de(e) {
  return Hn(e) ? (e.nodeName || "").toLowerCase() : "#document";
}
function J(e) {
  var t;
  return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function ie(e) {
  var t;
  return (t = (Hn(e) ? e.ownerDocument : e.document) || window.document) == null ? void 0 : t.documentElement;
}
function Hn(e) {
  return e instanceof Node || e instanceof J(e).Node;
}
function q(e) {
  return e instanceof Element || e instanceof J(e).Element;
}
function Q(e) {
  return e instanceof HTMLElement || e instanceof J(e).HTMLElement;
}
function vt(e) {
  return typeof ShadowRoot > "u" ? !1 : e instanceof ShadowRoot || e instanceof J(e).ShadowRoot;
}
function Fe(e) {
  const {
    overflow: t,
    overflowX: n,
    overflowY: r,
    display: o
  } = ee(e);
  return /auto|scroll|overlay|hidden|clip/.test(t + r + n) && !["inline", "contents"].includes(o);
}
function mi(e) {
  return ["table", "td", "th"].includes(de(e));
}
function jt(e) {
  const t = Vt(), n = ee(e);
  return n.transform !== "none" || n.perspective !== "none" || (n.containerType ? n.containerType !== "normal" : !1) || !t && (n.backdropFilter ? n.backdropFilter !== "none" : !1) || !t && (n.filter ? n.filter !== "none" : !1) || ["transform", "perspective", "filter"].some((r) => (n.willChange || "").includes(r)) || ["paint", "layout", "strict", "content"].some((r) => (n.contain || "").includes(r));
}
function hi(e) {
  let t = ve(e);
  for (; Q(t) && !Re(t); ) {
    if (jt(t))
      return t;
    t = ve(t);
  }
  return null;
}
function Vt() {
  return typeof CSS > "u" || !CSS.supports ? !1 : CSS.supports("-webkit-backdrop-filter", "none");
}
function Re(e) {
  return ["html", "body", "#document"].includes(de(e));
}
function ee(e) {
  return J(e).getComputedStyle(e);
}
function tt(e) {
  return q(e) ? {
    scrollLeft: e.scrollLeft,
    scrollTop: e.scrollTop
  } : {
    scrollLeft: e.pageXOffset,
    scrollTop: e.pageYOffset
  };
}
function ve(e) {
  if (de(e) === "html")
    return e;
  const t = (
    // Step into the shadow DOM of the parent of a slotted node.
    e.assignedSlot || // DOM Element detected.
    e.parentNode || // ShadowRoot detected.
    vt(e) && e.host || // Fallback.
    ie(e)
  );
  return vt(t) ? t.host : t;
}
function $n(e) {
  const t = ve(e);
  return Re(t) ? e.ownerDocument ? e.ownerDocument.body : e.body : Q(t) && Fe(t) ? t : $n(t);
}
function ae(e, t, n) {
  var r;
  t === void 0 && (t = []), n === void 0 && (n = !0);
  const o = $n(e), l = o === ((r = e.ownerDocument) == null ? void 0 : r.body), i = J(o);
  return l ? t.concat(i, i.visualViewport || [], Fe(o) ? o : [], i.frameElement && n ? ae(i.frameElement) : []) : t.concat(o, ae(o, [], n));
}
function pi(e) {
  let t = e.activeElement;
  for (; ((n = t) == null || (n = n.shadowRoot) == null ? void 0 : n.activeElement) != null; ) {
    var n;
    t = t.shadowRoot.activeElement;
  }
  return t;
}
function wt(e, t) {
  if (!e || !t)
    return !1;
  const n = t.getRootNode && t.getRootNode();
  if (e.contains(t))
    return !0;
  if (n && vt(n)) {
    let r = t;
    for (; r; ) {
      if (e === r)
        return !0;
      r = r.parentNode || r.host;
    }
  }
  return !1;
}
function gi() {
  return /apple/i.test(navigator.vendor);
}
function Qt(e, t) {
  const n = ["mouse", "pen"];
  return t || n.push("", void 0), n.includes(e);
}
function vi(e) {
  return "nativeEvent" in e;
}
function wi(e) {
  return e.matches("html,body");
}
function bt(e) {
  return (e == null ? void 0 : e.ownerDocument) || document;
}
function at(e, t) {
  if (t == null)
    return !1;
  if ("composedPath" in e)
    return e.composedPath().includes(t);
  const n = e;
  return n.target != null && t.contains(n.target);
}
function Ae(e) {
  return "composedPath" in e ? e.composedPath()[0] : e.target;
}
const bi = "input:not([type='hidden']):not([disabled]),[contenteditable]:not([contenteditable='false']),textarea:not([disabled])";
function xi(e) {
  return Q(e) && e.matches(bi);
}
const We = Math.min, pe = Math.max, Ue = Math.round, Be = Math.floor, fe = (e) => ({
  x: e,
  y: e
}), yi = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom"
}, Ci = {
  start: "end",
  end: "start"
};
function en(e, t, n) {
  return pe(e, We(t, n));
}
function nt(e, t) {
  return typeof e == "function" ? e(t) : e;
}
function we(e) {
  return e.split("-")[0];
}
function rt(e) {
  return e.split("-")[1];
}
function Wn(e) {
  return e === "x" ? "y" : "x";
}
function Un(e) {
  return e === "y" ? "height" : "width";
}
function ot(e) {
  return ["top", "bottom"].includes(we(e)) ? "y" : "x";
}
function Zn(e) {
  return Wn(ot(e));
}
function Ri(e, t, n) {
  n === void 0 && (n = !1);
  const r = rt(e), o = Zn(e), l = Un(o);
  let i = o === "x" ? r === (n ? "end" : "start") ? "right" : "left" : r === "start" ? "bottom" : "top";
  return t.reference[l] > t.floating[l] && (i = Ze(i)), [i, Ze(i)];
}
function Ei(e) {
  const t = Ze(e);
  return [xt(e), t, xt(t)];
}
function xt(e) {
  return e.replace(/start|end/g, (t) => Ci[t]);
}
function Si(e, t, n) {
  const r = ["left", "right"], o = ["right", "left"], l = ["top", "bottom"], i = ["bottom", "top"];
  switch (e) {
    case "top":
    case "bottom":
      return n ? t ? o : r : t ? r : o;
    case "left":
    case "right":
      return t ? l : i;
    default:
      return [];
  }
}
function Ni(e, t, n, r) {
  const o = rt(e);
  let l = Si(we(e), n === "start", r);
  return o && (l = l.map((i) => i + "-" + o), t && (l = l.concat(l.map(xt)))), l;
}
function Ze(e) {
  return e.replace(/left|right|bottom|top/g, (t) => yi[t]);
}
function ki(e) {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...e
  };
}
function Oi(e) {
  return typeof e != "number" ? ki(e) : {
    top: e,
    right: e,
    bottom: e,
    left: e
  };
}
function Ke(e) {
  return {
    ...e,
    top: e.y,
    left: e.x,
    right: e.x + e.width,
    bottom: e.y + e.height
  };
}
function tn(e, t, n) {
  let {
    reference: r,
    floating: o
  } = e;
  const l = ot(t), i = Zn(t), s = Un(i), u = we(t), a = l === "y", p = r.x + r.width / 2 - o.width / 2, d = r.y + r.height / 2 - o.height / 2, g = r[s] / 2 - o[s] / 2;
  let h;
  switch (u) {
    case "top":
      h = {
        x: p,
        y: r.y - o.height
      };
      break;
    case "bottom":
      h = {
        x: p,
        y: r.y + r.height
      };
      break;
    case "right":
      h = {
        x: r.x + r.width,
        y: d
      };
      break;
    case "left":
      h = {
        x: r.x - o.width,
        y: d
      };
      break;
    default:
      h = {
        x: r.x,
        y: r.y
      };
  }
  switch (rt(t)) {
    case "start":
      h[i] -= g * (n && a ? -1 : 1);
      break;
    case "end":
      h[i] += g * (n && a ? -1 : 1);
      break;
  }
  return h;
}
const Ai = async (e, t, n) => {
  const {
    placement: r = "bottom",
    strategy: o = "absolute",
    middleware: l = [],
    platform: i
  } = n, s = l.filter(Boolean), u = await (i.isRTL == null ? void 0 : i.isRTL(t));
  let a = await i.getElementRects({
    reference: e,
    floating: t,
    strategy: o
  }), {
    x: p,
    y: d
  } = tn(a, r, u), g = r, h = {}, R = 0;
  for (let C = 0; C < s.length; C++) {
    const {
      name: w,
      fn: x
    } = s[C], {
      x: M,
      y: F,
      data: j,
      reset: S
    } = await x({
      x: p,
      y: d,
      initialPlacement: r,
      placement: g,
      strategy: o,
      middlewareData: h,
      rects: a,
      platform: i,
      elements: {
        reference: e,
        floating: t
      }
    });
    if (p = M ?? p, d = F ?? d, h = {
      ...h,
      [w]: {
        ...h[w],
        ...j
      }
    }, S && R <= 50) {
      R++, typeof S == "object" && (S.placement && (g = S.placement), S.rects && (a = S.rects === !0 ? await i.getElementRects({
        reference: e,
        floating: t,
        strategy: o
      }) : S.rects), {
        x: p,
        y: d
      } = tn(a, g, u)), C = -1;
      continue;
    }
  }
  return {
    x: p,
    y: d,
    placement: g,
    strategy: o,
    middlewareData: h
  };
};
async function Kn(e, t) {
  var n;
  t === void 0 && (t = {});
  const {
    x: r,
    y: o,
    platform: l,
    rects: i,
    elements: s,
    strategy: u
  } = e, {
    boundary: a = "clippingAncestors",
    rootBoundary: p = "viewport",
    elementContext: d = "floating",
    altBoundary: g = !1,
    padding: h = 0
  } = nt(t, e), R = Oi(h), w = s[g ? d === "floating" ? "reference" : "floating" : d], x = Ke(await l.getClippingRect({
    element: (n = await (l.isElement == null ? void 0 : l.isElement(w))) == null || n ? w : w.contextElement || await (l.getDocumentElement == null ? void 0 : l.getDocumentElement(s.floating)),
    boundary: a,
    rootBoundary: p,
    strategy: u
  })), M = d === "floating" ? {
    ...i.floating,
    x: r,
    y: o
  } : i.reference, F = await (l.getOffsetParent == null ? void 0 : l.getOffsetParent(s.floating)), j = await (l.isElement == null ? void 0 : l.isElement(F)) ? await (l.getScale == null ? void 0 : l.getScale(F)) || {
    x: 1,
    y: 1
  } : {
    x: 1,
    y: 1
  }, S = Ke(l.convertOffsetParentRelativeRectToViewportRelativeRect ? await l.convertOffsetParentRelativeRectToViewportRelativeRect({
    rect: M,
    offsetParent: F,
    strategy: u
  }) : M);
  return {
    top: (x.top - S.top + R.top) / j.y,
    bottom: (S.bottom - x.bottom + R.bottom) / j.y,
    left: (x.left - S.left + R.left) / j.x,
    right: (S.right - x.right + R.right) / j.x
  };
}
const Li = function(e) {
  return e === void 0 && (e = {}), {
    name: "flip",
    options: e,
    async fn(t) {
      var n, r;
      const {
        placement: o,
        middlewareData: l,
        rects: i,
        initialPlacement: s,
        platform: u,
        elements: a
      } = t, {
        mainAxis: p = !0,
        crossAxis: d = !0,
        fallbackPlacements: g,
        fallbackStrategy: h = "bestFit",
        fallbackAxisSideDirection: R = "none",
        flipAlignment: C = !0,
        ...w
      } = nt(e, t);
      if ((n = l.arrow) != null && n.alignmentOffset)
        return {};
      const x = we(o), M = we(s) === s, F = await (u.isRTL == null ? void 0 : u.isRTL(a.floating)), j = g || (M || !C ? [Ze(s)] : Ei(s));
      !g && R !== "none" && j.push(...Ni(s, C, R, F));
      const S = [s, ...j], _ = await Kn(t, w), V = [];
      let m = ((r = l.flip) == null ? void 0 : r.overflows) || [];
      if (p && V.push(_[x]), d) {
        const k = Ri(o, i, F);
        V.push(_[k[0]], _[k[1]]);
      }
      if (m = [...m, {
        placement: o,
        overflows: V
      }], !V.every((k) => k <= 0)) {
        var E, v;
        const k = (((E = l.flip) == null ? void 0 : E.index) || 0) + 1, P = S[k];
        if (P)
          return {
            data: {
              index: k,
              overflows: m
            },
            reset: {
              placement: P
            }
          };
        let A = (v = m.filter((N) => N.overflows[0] <= 0).sort((N, I) => N.overflows[1] - I.overflows[1])[0]) == null ? void 0 : v.placement;
        if (!A)
          switch (h) {
            case "bestFit": {
              var b;
              const N = (b = m.map((I) => [I.placement, I.overflows.filter((T) => T > 0).reduce((T, L) => T + L, 0)]).sort((I, T) => I[1] - T[1])[0]) == null ? void 0 : b[0];
              N && (A = N);
              break;
            }
            case "initialPlacement":
              A = s;
              break;
          }
        if (o !== A)
          return {
            reset: {
              placement: A
            }
          };
      }
      return {};
    }
  };
};
async function Mi(e, t) {
  const {
    placement: n,
    platform: r,
    elements: o
  } = e, l = await (r.isRTL == null ? void 0 : r.isRTL(o.floating)), i = we(n), s = rt(n), u = ot(n) === "y", a = ["left", "top"].includes(i) ? -1 : 1, p = l && u ? -1 : 1, d = nt(t, e);
  let {
    mainAxis: g,
    crossAxis: h,
    alignmentAxis: R
  } = typeof d == "number" ? {
    mainAxis: d,
    crossAxis: 0,
    alignmentAxis: null
  } : {
    mainAxis: 0,
    crossAxis: 0,
    alignmentAxis: null,
    ...d
  };
  return s && typeof R == "number" && (h = s === "end" ? R * -1 : R), u ? {
    x: h * p,
    y: g * a
  } : {
    x: g * a,
    y: h * p
  };
}
const Ti = function(e) {
  return e === void 0 && (e = 0), {
    name: "offset",
    options: e,
    async fn(t) {
      var n, r;
      const {
        x: o,
        y: l,
        placement: i,
        middlewareData: s
      } = t, u = await Mi(t, e);
      return i === ((n = s.offset) == null ? void 0 : n.placement) && (r = s.arrow) != null && r.alignmentOffset ? {} : {
        x: o + u.x,
        y: l + u.y,
        data: {
          ...u,
          placement: i
        }
      };
    }
  };
}, Ii = function(e) {
  return e === void 0 && (e = {}), {
    name: "shift",
    options: e,
    async fn(t) {
      const {
        x: n,
        y: r,
        placement: o
      } = t, {
        mainAxis: l = !0,
        crossAxis: i = !1,
        limiter: s = {
          fn: (w) => {
            let {
              x,
              y: M
            } = w;
            return {
              x,
              y: M
            };
          }
        },
        ...u
      } = nt(e, t), a = {
        x: n,
        y: r
      }, p = await Kn(t, u), d = ot(we(o)), g = Wn(d);
      let h = a[g], R = a[d];
      if (l) {
        const w = g === "y" ? "top" : "left", x = g === "y" ? "bottom" : "right", M = h + p[w], F = h - p[x];
        h = en(M, h, F);
      }
      if (i) {
        const w = d === "y" ? "top" : "left", x = d === "y" ? "bottom" : "right", M = R + p[w], F = R - p[x];
        R = en(M, R, F);
      }
      const C = s.fn({
        ...t,
        [g]: h,
        [d]: R
      });
      return {
        ...C,
        data: {
          x: C.x - n,
          y: C.y - r
        }
      };
    }
  };
};
function qn(e) {
  const t = ee(e);
  let n = parseFloat(t.width) || 0, r = parseFloat(t.height) || 0;
  const o = Q(e), l = o ? e.offsetWidth : n, i = o ? e.offsetHeight : r, s = Ue(n) !== l || Ue(r) !== i;
  return s && (n = l, r = i), {
    width: n,
    height: r,
    $: s
  };
}
function _t(e) {
  return q(e) ? e : e.contextElement;
}
function Ce(e) {
  const t = _t(e);
  if (!Q(t))
    return fe(1);
  const n = t.getBoundingClientRect(), {
    width: r,
    height: o,
    $: l
  } = qn(t);
  let i = (l ? Ue(n.width) : n.width) / r, s = (l ? Ue(n.height) : n.height) / o;
  return (!i || !Number.isFinite(i)) && (i = 1), (!s || !Number.isFinite(s)) && (s = 1), {
    x: i,
    y: s
  };
}
const Di = /* @__PURE__ */ fe(0);
function zn(e) {
  const t = J(e);
  return !Vt() || !t.visualViewport ? Di : {
    x: t.visualViewport.offsetLeft,
    y: t.visualViewport.offsetTop
  };
}
function Pi(e, t, n) {
  return t === void 0 && (t = !1), !n || t && n !== J(e) ? !1 : t;
}
function be(e, t, n, r) {
  t === void 0 && (t = !1), n === void 0 && (n = !1);
  const o = e.getBoundingClientRect(), l = _t(e);
  let i = fe(1);
  t && (r ? q(r) && (i = Ce(r)) : i = Ce(e));
  const s = Pi(l, n, r) ? zn(l) : fe(0);
  let u = (o.left + s.x) / i.x, a = (o.top + s.y) / i.y, p = o.width / i.x, d = o.height / i.y;
  if (l) {
    const g = J(l), h = r && q(r) ? J(r) : r;
    let R = g.frameElement;
    for (; R && r && h !== g; ) {
      const C = Ce(R), w = R.getBoundingClientRect(), x = ee(R), M = w.left + (R.clientLeft + parseFloat(x.paddingLeft)) * C.x, F = w.top + (R.clientTop + parseFloat(x.paddingTop)) * C.y;
      u *= C.x, a *= C.y, p *= C.x, d *= C.y, u += M, a += F, R = J(R).frameElement;
    }
  }
  return Ke({
    width: p,
    height: d,
    x: u,
    y: a
  });
}
function Fi(e) {
  let {
    rect: t,
    offsetParent: n,
    strategy: r
  } = e;
  const o = Q(n), l = ie(n);
  if (n === l)
    return t;
  let i = {
    scrollLeft: 0,
    scrollTop: 0
  }, s = fe(1);
  const u = fe(0);
  if ((o || !o && r !== "fixed") && ((de(n) !== "body" || Fe(l)) && (i = tt(n)), Q(n))) {
    const a = be(n);
    s = Ce(n), u.x = a.x + n.clientLeft, u.y = a.y + n.clientTop;
  }
  return {
    width: t.width * s.x,
    height: t.height * s.y,
    x: t.x * s.x - i.scrollLeft * s.x + u.x,
    y: t.y * s.y - i.scrollTop * s.y + u.y
  };
}
function ji(e) {
  return Array.from(e.getClientRects());
}
function Yn(e) {
  return be(ie(e)).left + tt(e).scrollLeft;
}
function Vi(e) {
  const t = ie(e), n = tt(e), r = e.ownerDocument.body, o = pe(t.scrollWidth, t.clientWidth, r.scrollWidth, r.clientWidth), l = pe(t.scrollHeight, t.clientHeight, r.scrollHeight, r.clientHeight);
  let i = -n.scrollLeft + Yn(e);
  const s = -n.scrollTop;
  return ee(r).direction === "rtl" && (i += pe(t.clientWidth, r.clientWidth) - o), {
    width: o,
    height: l,
    x: i,
    y: s
  };
}
function _i(e, t) {
  const n = J(e), r = ie(e), o = n.visualViewport;
  let l = r.clientWidth, i = r.clientHeight, s = 0, u = 0;
  if (o) {
    l = o.width, i = o.height;
    const a = Vt();
    (!a || a && t === "fixed") && (s = o.offsetLeft, u = o.offsetTop);
  }
  return {
    width: l,
    height: i,
    x: s,
    y: u
  };
}
function Bi(e, t) {
  const n = be(e, !0, t === "fixed"), r = n.top + e.clientTop, o = n.left + e.clientLeft, l = Q(e) ? Ce(e) : fe(1), i = e.clientWidth * l.x, s = e.clientHeight * l.y, u = o * l.x, a = r * l.y;
  return {
    width: i,
    height: s,
    x: u,
    y: a
  };
}
function nn(e, t, n) {
  let r;
  if (t === "viewport")
    r = _i(e, n);
  else if (t === "document")
    r = Vi(ie(e));
  else if (q(t))
    r = Bi(t, n);
  else {
    const o = zn(e);
    r = {
      ...t,
      x: t.x - o.x,
      y: t.y - o.y
    };
  }
  return Ke(r);
}
function Xn(e, t) {
  const n = ve(e);
  return n === t || !q(n) || Re(n) ? !1 : ee(n).position === "fixed" || Xn(n, t);
}
function Hi(e, t) {
  const n = t.get(e);
  if (n)
    return n;
  let r = ae(e, [], !1).filter((s) => q(s) && de(s) !== "body"), o = null;
  const l = ee(e).position === "fixed";
  let i = l ? ve(e) : e;
  for (; q(i) && !Re(i); ) {
    const s = ee(i), u = jt(i);
    !u && s.position === "fixed" && (o = null), (l ? !u && !o : !u && s.position === "static" && !!o && ["absolute", "fixed"].includes(o.position) || Fe(i) && !u && Xn(e, i)) ? r = r.filter((p) => p !== i) : o = s, i = ve(i);
  }
  return t.set(e, r), r;
}
function $i(e) {
  let {
    element: t,
    boundary: n,
    rootBoundary: r,
    strategy: o
  } = e;
  const i = [...n === "clippingAncestors" ? Hi(t, this._c) : [].concat(n), r], s = i[0], u = i.reduce((a, p) => {
    const d = nn(t, p, o);
    return a.top = pe(d.top, a.top), a.right = We(d.right, a.right), a.bottom = We(d.bottom, a.bottom), a.left = pe(d.left, a.left), a;
  }, nn(t, s, o));
  return {
    width: u.right - u.left,
    height: u.bottom - u.top,
    x: u.left,
    y: u.top
  };
}
function Wi(e) {
  return qn(e);
}
function Ui(e, t, n) {
  const r = Q(t), o = ie(t), l = n === "fixed", i = be(e, !0, l, t);
  let s = {
    scrollLeft: 0,
    scrollTop: 0
  };
  const u = fe(0);
  if (r || !r && !l)
    if ((de(t) !== "body" || Fe(o)) && (s = tt(t)), r) {
      const a = be(t, !0, l, t);
      u.x = a.x + t.clientLeft, u.y = a.y + t.clientTop;
    } else
      o && (u.x = Yn(o));
  return {
    x: i.left + s.scrollLeft - u.x,
    y: i.top + s.scrollTop - u.y,
    width: i.width,
    height: i.height
  };
}
function rn(e, t) {
  return !Q(e) || ee(e).position === "fixed" ? null : t ? t(e) : e.offsetParent;
}
function Gn(e, t) {
  const n = J(e);
  if (!Q(e))
    return n;
  let r = rn(e, t);
  for (; r && mi(r) && ee(r).position === "static"; )
    r = rn(r, t);
  return r && (de(r) === "html" || de(r) === "body" && ee(r).position === "static" && !jt(r)) ? n : r || hi(e) || n;
}
const Zi = async function(e) {
  let {
    reference: t,
    floating: n,
    strategy: r
  } = e;
  const o = this.getOffsetParent || Gn, l = this.getDimensions;
  return {
    reference: Ui(t, await o(n), r),
    floating: {
      x: 0,
      y: 0,
      ...await l(n)
    }
  };
};
function Ki(e) {
  return ee(e).direction === "rtl";
}
const qi = {
  convertOffsetParentRelativeRectToViewportRelativeRect: Fi,
  getDocumentElement: ie,
  getClippingRect: $i,
  getOffsetParent: Gn,
  getElementRects: Zi,
  getClientRects: ji,
  getDimensions: Wi,
  getScale: Ce,
  isElement: q,
  isRTL: Ki
};
function zi(e, t) {
  let n = null, r;
  const o = ie(e);
  function l() {
    clearTimeout(r), n && n.disconnect(), n = null;
  }
  function i(s, u) {
    s === void 0 && (s = !1), u === void 0 && (u = 1), l();
    const {
      left: a,
      top: p,
      width: d,
      height: g
    } = e.getBoundingClientRect();
    if (s || t(), !d || !g)
      return;
    const h = Be(p), R = Be(o.clientWidth - (a + d)), C = Be(o.clientHeight - (p + g)), w = Be(a), M = {
      rootMargin: -h + "px " + -R + "px " + -C + "px " + -w + "px",
      threshold: pe(0, We(1, u)) || 1
    };
    let F = !0;
    function j(S) {
      const _ = S[0].intersectionRatio;
      if (_ !== u) {
        if (!F)
          return i();
        _ ? i(!1, _) : r = setTimeout(() => {
          i(!1, 1e-7);
        }, 100);
      }
      F = !1;
    }
    try {
      n = new IntersectionObserver(j, {
        ...M,
        // Handle <iframe>s
        root: o.ownerDocument
      });
    } catch {
      n = new IntersectionObserver(j, M);
    }
    n.observe(e);
  }
  return i(!0), l;
}
function Yi(e, t, n, r) {
  r === void 0 && (r = {});
  const {
    ancestorScroll: o = !0,
    ancestorResize: l = !0,
    elementResize: i = typeof ResizeObserver == "function",
    layoutShift: s = typeof IntersectionObserver == "function",
    animationFrame: u = !1
  } = r, a = _t(e), p = o || l ? [...a ? ae(a) : [], ...ae(t)] : [];
  p.forEach((x) => {
    o && x.addEventListener("scroll", n, {
      passive: !0
    }), l && x.addEventListener("resize", n);
  });
  const d = a && s ? zi(a, n) : null;
  let g = -1, h = null;
  i && (h = new ResizeObserver((x) => {
    let [M] = x;
    M && M.target === a && h && (h.unobserve(t), cancelAnimationFrame(g), g = requestAnimationFrame(() => {
      h && h.observe(t);
    })), n();
  }), a && !u && h.observe(a), h.observe(t));
  let R, C = u ? be(e) : null;
  u && w();
  function w() {
    const x = be(e);
    C && (x.x !== C.x || x.y !== C.y || x.width !== C.width || x.height !== C.height) && n(), C = x, R = requestAnimationFrame(w);
  }
  return n(), () => {
    p.forEach((x) => {
      o && x.removeEventListener("scroll", n), l && x.removeEventListener("resize", n);
    }), d && d(), h && h.disconnect(), h = null, u && cancelAnimationFrame(R);
  };
}
const Xi = (e, t, n) => {
  const r = /* @__PURE__ */ new Map(), o = {
    platform: qi,
    ...n
  }, l = {
    ...o.platform,
    _c: r
  };
  return Ai(e, t, {
    ...o,
    platform: l
  });
};
var He = typeof document < "u" ? xn : K;
function qe(e, t) {
  if (e === t)
    return !0;
  if (typeof e != typeof t)
    return !1;
  if (typeof e == "function" && e.toString() === t.toString())
    return !0;
  let n, r, o;
  if (e && t && typeof e == "object") {
    if (Array.isArray(e)) {
      if (n = e.length, n != t.length)
        return !1;
      for (r = n; r-- !== 0; )
        if (!qe(e[r], t[r]))
          return !1;
      return !0;
    }
    if (o = Object.keys(e), n = o.length, n !== Object.keys(t).length)
      return !1;
    for (r = n; r-- !== 0; )
      if (!{}.hasOwnProperty.call(t, o[r]))
        return !1;
    for (r = n; r-- !== 0; ) {
      const l = o[r];
      if (!(l === "_owner" && e.$$typeof) && !qe(e[l], t[l]))
        return !1;
    }
    return !0;
  }
  return e !== e && t !== t;
}
function Jn(e) {
  return typeof window > "u" ? 1 : (e.ownerDocument.defaultView || window).devicePixelRatio || 1;
}
function on(e, t) {
  const n = Jn(e);
  return Math.round(t * n) / n;
}
function ln(e) {
  const t = f.useRef(e);
  return He(() => {
    t.current = e;
  }), t;
}
function Gi(e) {
  e === void 0 && (e = {});
  const {
    placement: t = "bottom",
    strategy: n = "absolute",
    middleware: r = [],
    platform: o,
    elements: {
      reference: l,
      floating: i
    } = {},
    transform: s = !0,
    whileElementsMounted: u,
    open: a
  } = e, [p, d] = f.useState({
    x: 0,
    y: 0,
    strategy: n,
    placement: t,
    middlewareData: {},
    isPositioned: !1
  }), [g, h] = f.useState(r);
  qe(g, r) || h(r);
  const [R, C] = f.useState(null), [w, x] = f.useState(null), M = f.useCallback((I) => {
    I != _.current && (_.current = I, C(I));
  }, [C]), F = f.useCallback((I) => {
    I !== V.current && (V.current = I, x(I));
  }, [x]), j = l || R, S = i || w, _ = f.useRef(null), V = f.useRef(null), m = f.useRef(p), E = ln(u), v = ln(o), b = f.useCallback(() => {
    if (!_.current || !V.current)
      return;
    const I = {
      placement: t,
      strategy: n,
      middleware: g
    };
    v.current && (I.platform = v.current), Xi(_.current, V.current, I).then((T) => {
      const L = {
        ...T,
        isPositioned: !0
      };
      k.current && !qe(m.current, L) && (m.current = L, yr.flushSync(() => {
        d(L);
      }));
    });
  }, [g, t, n, v]);
  He(() => {
    a === !1 && m.current.isPositioned && (m.current.isPositioned = !1, d((I) => ({
      ...I,
      isPositioned: !1
    })));
  }, [a]);
  const k = f.useRef(!1);
  He(() => (k.current = !0, () => {
    k.current = !1;
  }), []), He(() => {
    if (j && (_.current = j), S && (V.current = S), j && S) {
      if (E.current)
        return E.current(j, S, b);
      b();
    }
  }, [j, S, b, E]);
  const P = f.useMemo(() => ({
    reference: _,
    floating: V,
    setReference: M,
    setFloating: F
  }), [M, F]), A = f.useMemo(() => ({
    reference: j,
    floating: S
  }), [j, S]), N = f.useMemo(() => {
    const I = {
      position: n,
      left: 0,
      top: 0
    };
    if (!A.floating)
      return I;
    const T = on(A.floating, p.x), L = on(A.floating, p.y);
    return s ? {
      ...I,
      transform: "translate(" + T + "px, " + L + "px)",
      ...Jn(A.floating) >= 1.5 && {
        willChange: "transform"
      }
    } : {
      position: n,
      left: T,
      top: L
    };
  }, [n, s, A.floating, p.x, p.y]);
  return f.useMemo(() => ({
    ...p,
    update: b,
    refs: P,
    elements: A,
    floatingStyles: N
  }), [p, b, P, A, N]);
}
/*!
* tabbable 6.2.0
* @license MIT, https://github.com/focus-trap/tabbable/blob/master/LICENSE
*/
var Ji = ["input:not([inert])", "select:not([inert])", "textarea:not([inert])", "a[href]:not([inert])", "button:not([inert])", "[tabindex]:not(slot):not([inert])", "audio[controls]:not([inert])", "video[controls]:not([inert])", '[contenteditable]:not([contenteditable="false"]):not([inert])', "details>summary:first-of-type:not([inert])", "details:not([inert])"], yt = /* @__PURE__ */ Ji.join(","), Qn = typeof Element > "u", De = Qn ? function() {
} : Element.prototype.matches || Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector, ze = !Qn && Element.prototype.getRootNode ? function(e) {
  var t;
  return e == null || (t = e.getRootNode) === null || t === void 0 ? void 0 : t.call(e);
} : function(e) {
  return e == null ? void 0 : e.ownerDocument;
}, Ye = function e(t, n) {
  var r;
  n === void 0 && (n = !0);
  var o = t == null || (r = t.getAttribute) === null || r === void 0 ? void 0 : r.call(t, "inert"), l = o === "" || o === "true", i = l || n && t && e(t.parentNode);
  return i;
}, Qi = function(t) {
  var n, r = t == null || (n = t.getAttribute) === null || n === void 0 ? void 0 : n.call(t, "contenteditable");
  return r === "" || r === "true";
}, el = function(t, n, r) {
  if (Ye(t))
    return [];
  var o = Array.prototype.slice.apply(t.querySelectorAll(yt));
  return n && De.call(t, yt) && o.unshift(t), o = o.filter(r), o;
}, tl = function e(t, n, r) {
  for (var o = [], l = Array.from(t); l.length; ) {
    var i = l.shift();
    if (!Ye(i, !1))
      if (i.tagName === "SLOT") {
        var s = i.assignedElements(), u = s.length ? s : i.children, a = e(u, !0, r);
        r.flatten ? o.push.apply(o, a) : o.push({
          scopeParent: i,
          candidates: a
        });
      } else {
        var p = De.call(i, yt);
        p && r.filter(i) && (n || !t.includes(i)) && o.push(i);
        var d = i.shadowRoot || // check for an undisclosed shadow
        typeof r.getShadowRoot == "function" && r.getShadowRoot(i), g = !Ye(d, !1) && (!r.shadowRootFilter || r.shadowRootFilter(i));
        if (d && g) {
          var h = e(d === !0 ? i.children : d.children, !0, r);
          r.flatten ? o.push.apply(o, h) : o.push({
            scopeParent: i,
            candidates: h
          });
        } else
          l.unshift.apply(l, i.children);
      }
  }
  return o;
}, er = function(t) {
  return !isNaN(parseInt(t.getAttribute("tabindex"), 10));
}, tr = function(t) {
  if (!t)
    throw new Error("No node provided");
  return t.tabIndex < 0 && (/^(AUDIO|VIDEO|DETAILS)$/.test(t.tagName) || Qi(t)) && !er(t) ? 0 : t.tabIndex;
}, nl = function(t, n) {
  var r = tr(t);
  return r < 0 && n && !er(t) ? 0 : r;
}, rl = function(t, n) {
  return t.tabIndex === n.tabIndex ? t.documentOrder - n.documentOrder : t.tabIndex - n.tabIndex;
}, nr = function(t) {
  return t.tagName === "INPUT";
}, ol = function(t) {
  return nr(t) && t.type === "hidden";
}, il = function(t) {
  var n = t.tagName === "DETAILS" && Array.prototype.slice.apply(t.children).some(function(r) {
    return r.tagName === "SUMMARY";
  });
  return n;
}, ll = function(t, n) {
  for (var r = 0; r < t.length; r++)
    if (t[r].checked && t[r].form === n)
      return t[r];
}, sl = function(t) {
  if (!t.name)
    return !0;
  var n = t.form || ze(t), r = function(s) {
    return n.querySelectorAll('input[type="radio"][name="' + s + '"]');
  }, o;
  if (typeof window < "u" && typeof window.CSS < "u" && typeof window.CSS.escape == "function")
    o = r(window.CSS.escape(t.name));
  else
    try {
      o = r(t.name);
    } catch (i) {
      return console.error("Looks like you have a radio button with a name attribute containing invalid CSS selector characters and need the CSS.escape polyfill: %s", i.message), !1;
    }
  var l = ll(o, t.form);
  return !l || l === t;
}, cl = function(t) {
  return nr(t) && t.type === "radio";
}, al = function(t) {
  return cl(t) && !sl(t);
}, ul = function(t) {
  var n, r = t && ze(t), o = (n = r) === null || n === void 0 ? void 0 : n.host, l = !1;
  if (r && r !== t) {
    var i, s, u;
    for (l = !!((i = o) !== null && i !== void 0 && (s = i.ownerDocument) !== null && s !== void 0 && s.contains(o) || t != null && (u = t.ownerDocument) !== null && u !== void 0 && u.contains(t)); !l && o; ) {
      var a, p, d;
      r = ze(o), o = (a = r) === null || a === void 0 ? void 0 : a.host, l = !!((p = o) !== null && p !== void 0 && (d = p.ownerDocument) !== null && d !== void 0 && d.contains(o));
    }
  }
  return l;
}, sn = function(t) {
  var n = t.getBoundingClientRect(), r = n.width, o = n.height;
  return r === 0 && o === 0;
}, dl = function(t, n) {
  var r = n.displayCheck, o = n.getShadowRoot;
  if (getComputedStyle(t).visibility === "hidden")
    return !0;
  var l = De.call(t, "details>summary:first-of-type"), i = l ? t.parentElement : t;
  if (De.call(i, "details:not([open]) *"))
    return !0;
  if (!r || r === "full" || r === "legacy-full") {
    if (typeof o == "function") {
      for (var s = t; t; ) {
        var u = t.parentElement, a = ze(t);
        if (u && !u.shadowRoot && o(u) === !0)
          return sn(t);
        t.assignedSlot ? t = t.assignedSlot : !u && a !== t.ownerDocument ? t = a.host : t = u;
      }
      t = s;
    }
    if (ul(t))
      return !t.getClientRects().length;
    if (r !== "legacy-full")
      return !0;
  } else if (r === "non-zero-area")
    return sn(t);
  return !1;
}, fl = function(t) {
  if (/^(INPUT|BUTTON|SELECT|TEXTAREA)$/.test(t.tagName))
    for (var n = t.parentElement; n; ) {
      if (n.tagName === "FIELDSET" && n.disabled) {
        for (var r = 0; r < n.children.length; r++) {
          var o = n.children.item(r);
          if (o.tagName === "LEGEND")
            return De.call(n, "fieldset[disabled] *") ? !0 : !o.contains(t);
        }
        return !0;
      }
      n = n.parentElement;
    }
  return !1;
}, ml = function(t, n) {
  return !(n.disabled || // we must do an inert look up to filter out any elements inside an inert ancestor
  //  because we're limited in the type of selectors we can use in JSDom (see related
  //  note related to `candidateSelectors`)
  Ye(n) || ol(n) || dl(n, t) || // For a details element with a summary, the summary element gets the focus
  il(n) || fl(n));
}, cn = function(t, n) {
  return !(al(n) || tr(n) < 0 || !ml(t, n));
}, hl = function(t) {
  var n = parseInt(t.getAttribute("tabindex"), 10);
  return !!(isNaN(n) || n >= 0);
}, pl = function e(t) {
  var n = [], r = [];
  return t.forEach(function(o, l) {
    var i = !!o.scopeParent, s = i ? o.scopeParent : o, u = nl(s, i), a = i ? e(o.candidates) : s;
    u === 0 ? i ? n.push.apply(n, a) : n.push(s) : r.push({
      documentOrder: l,
      tabIndex: u,
      item: o,
      isScope: i,
      content: a
    });
  }), r.sort(rl).reduce(function(o, l) {
    return l.isScope ? o.push.apply(o, l.content) : o.push(l.content), o;
  }, []).concat(n);
}, rr = function(t, n) {
  n = n || {};
  var r;
  return n.getShadowRoot ? r = tl([t], n.includeContainer, {
    filter: cn.bind(null, n),
    flatten: !1,
    getShadowRoot: n.getShadowRoot,
    shadowRootFilter: hl
  }) : r = el(t, n.includeContainer, cn.bind(null, n)), pl(r);
};
const gl = f.useInsertionEffect, vl = gl || ((e) => e());
function ye(e) {
  const t = f.useRef(() => {
    if (process.env.NODE_ENV !== "production")
      throw new Error("Cannot call an event handler while rendering.");
  });
  return vl(() => {
    t.current = e;
  }), f.useCallback(function() {
    for (var n = arguments.length, r = new Array(n), o = 0; o < n; o++)
      r[o] = arguments[o];
    return t.current == null ? void 0 : t.current(...r);
  }, []);
}
var Pe = typeof document < "u" ? xn : K;
function Ct() {
  return Ct = Object.assign ? Object.assign.bind() : function(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = arguments[t];
      for (var r in n)
        Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
    }
    return e;
  }, Ct.apply(this, arguments);
}
let ut = !1, wl = 0;
const an = () => "floating-ui-" + wl++;
function bl() {
  const [e, t] = f.useState(() => ut ? an() : void 0);
  return Pe(() => {
    e == null && t(an());
  }, []), f.useEffect(() => {
    ut || (ut = !0);
  }, []), e;
}
const xl = f.useId, or = xl || bl;
function yl() {
  const e = /* @__PURE__ */ new Map();
  return {
    emit(t, n) {
      var r;
      (r = e.get(t)) == null || r.forEach((o) => o(n));
    },
    on(t, n) {
      e.set(t, [...e.get(t) || [], n]);
    },
    off(t, n) {
      var r;
      e.set(t, ((r = e.get(t)) == null ? void 0 : r.filter((o) => o !== n)) || []);
    }
  };
}
const Cl = /* @__PURE__ */ f.createContext(null), Rl = /* @__PURE__ */ f.createContext(null), El = () => {
  var e;
  return ((e = f.useContext(Cl)) == null ? void 0 : e.id) || null;
}, ir = () => f.useContext(Rl);
function Bt(e) {
  return "data-floating-ui-" + e;
}
function dt(e, t) {
  let n = e.filter((o) => {
    var l;
    return o.parentId === t && ((l = o.context) == null ? void 0 : l.open);
  }), r = n;
  for (; r.length; )
    r = e.filter((o) => {
      var l;
      return (l = r) == null ? void 0 : l.some((i) => {
        var s;
        return o.parentId === i.id && ((s = o.context) == null ? void 0 : s.open);
      });
    }), n = n.concat(r);
  return n;
}
const lr = () => ({
  getShadowRoot: !0,
  displayCheck: (
    // JSDOM does not support the `tabbable` library. To solve this we can
    // check if `ResizeObserver` is a real function (not polyfilled), which
    // determines if the current environment is JSDOM-like.
    typeof ResizeObserver == "function" && ResizeObserver.toString().includes("[native code]") ? "full" : "none"
  )
});
function sr(e, t) {
  const n = rr(e, lr());
  t === "prev" && n.reverse();
  const r = n.indexOf(pi(bt(e)));
  return n.slice(r + 1)[0];
}
function Sl() {
  return sr(document.body, "next");
}
function Nl() {
  return sr(document.body, "prev");
}
function ft(e, t) {
  const n = t || e.currentTarget, r = e.relatedTarget;
  return !r || !wt(n, r);
}
function kl(e) {
  rr(e, lr()).forEach((n) => {
    n.dataset.tabindex = n.getAttribute("tabindex") || "", n.setAttribute("tabindex", "-1");
  });
}
function Ol(e) {
  e.querySelectorAll("[data-tabindex]").forEach((n) => {
    const r = n.dataset.tabindex;
    delete n.dataset.tabindex, r ? n.setAttribute("tabindex", r) : n.removeAttribute("tabindex");
  });
}
const cr = {
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
let Al;
function un(e) {
  e.key === "Tab" && (e.target, clearTimeout(Al));
}
const dn = /* @__PURE__ */ f.forwardRef(function(t, n) {
  const [r, o] = f.useState();
  Pe(() => (gi() && o("button"), document.addEventListener("keydown", un), () => {
    document.removeEventListener("keydown", un);
  }), []);
  const l = {
    ref: n,
    tabIndex: 0,
    // Role is only for VoiceOver
    role: r,
    "aria-hidden": r ? void 0 : !0,
    [Bt("focus-guard")]: "",
    style: cr
  };
  return /* @__PURE__ */ f.createElement("span", Ct({}, t, l));
}), ar = /* @__PURE__ */ f.createContext(null);
function Ll(e) {
  let {
    id: t,
    root: n
  } = e === void 0 ? {} : e;
  const [r, o] = f.useState(null), l = or(), i = Tl(), s = f.useMemo(() => ({
    id: t,
    root: n,
    portalContext: i,
    uniqueId: l
  }), [t, n, i, l]), u = f.useRef();
  return Pe(() => () => {
    r == null || r.remove();
  }, [r, s]), Pe(() => {
    if (u.current === s)
      return;
    u.current = s;
    const {
      id: a,
      root: p,
      portalContext: d,
      uniqueId: g
    } = s, h = a ? document.getElementById(a) : null, R = Bt("portal");
    if (h) {
      const C = document.createElement("div");
      C.id = g, C.setAttribute(R, ""), h.appendChild(C), o(C);
    } else {
      let C = p || (d == null ? void 0 : d.portalNode);
      C && !q(C) && (C = C.current), C = C || document.body;
      let w = null;
      a && (w = document.createElement("div"), w.id = a, C.appendChild(w));
      const x = document.createElement("div");
      x.id = g, x.setAttribute(R, ""), C = w || C, C.appendChild(x), o(x);
    }
  }, [s]), r;
}
function Ml(e) {
  let {
    children: t,
    id: n,
    root: r = null,
    preserveTabOrder: o = !0
  } = e;
  const l = Ll({
    id: n,
    root: r
  }), [i, s] = f.useState(null), u = f.useRef(null), a = f.useRef(null), p = f.useRef(null), d = f.useRef(null), g = (
    // The FocusManager and therefore floating element are currently open/
    // rendered.
    !!i && // Guards are only for non-modal focus management.
    !i.modal && // Don't render if unmount is transitioning.
    i.open && o && !!(r || l)
  );
  return f.useEffect(() => {
    if (!l || !o || i != null && i.modal)
      return;
    function h(R) {
      l && ft(R) && (R.type === "focusin" ? Ol : kl)(l);
    }
    return l.addEventListener("focusin", h, !0), l.addEventListener("focusout", h, !0), () => {
      l.removeEventListener("focusin", h, !0), l.removeEventListener("focusout", h, !0);
    };
  }, [l, o, i == null ? void 0 : i.modal]), /* @__PURE__ */ f.createElement(ar.Provider, {
    value: f.useMemo(() => ({
      preserveTabOrder: o,
      beforeOutsideRef: u,
      afterOutsideRef: a,
      beforeInsideRef: p,
      afterInsideRef: d,
      portalNode: l,
      setFocusManagerState: s
    }), [o, l])
  }, g && l && /* @__PURE__ */ f.createElement(dn, {
    "data-type": "outside",
    ref: u,
    onFocus: (h) => {
      if (ft(h, l)) {
        var R;
        (R = p.current) == null || R.focus();
      } else {
        const C = Nl() || (i == null ? void 0 : i.refs.domReference.current);
        C == null || C.focus();
      }
    }
  }), g && l && /* @__PURE__ */ f.createElement("span", {
    "aria-owns": l.id,
    style: cr
  }), l && /* @__PURE__ */ Cr(t, l), g && l && /* @__PURE__ */ f.createElement(dn, {
    "data-type": "outside",
    ref: a,
    onFocus: (h) => {
      if (ft(h, l)) {
        var R;
        (R = d.current) == null || R.focus();
      } else {
        const C = Sl() || (i == null ? void 0 : i.refs.domReference.current);
        C == null || C.focus(), i != null && i.closeOnFocusOut && (i == null || i.onOpenChange(!1, h.nativeEvent));
      }
    }
  }));
}
const Tl = () => f.useContext(ar);
function fn(e) {
  return Q(e.target) && e.target.tagName === "BUTTON";
}
function mn(e) {
  return xi(e);
}
function Il(e, t) {
  t === void 0 && (t = {});
  const {
    open: n,
    onOpenChange: r,
    dataRef: o,
    elements: {
      domReference: l
    }
  } = e, {
    enabled: i = !0,
    event: s = "click",
    toggle: u = !0,
    ignoreMouse: a = !1,
    keyboardHandlers: p = !0
  } = t, d = f.useRef(), g = f.useRef(!1);
  return f.useMemo(() => i ? {
    reference: {
      onPointerDown(h) {
        d.current = h.pointerType;
      },
      onMouseDown(h) {
        h.button === 0 && (Qt(d.current, !0) && a || s !== "click" && (n && u && (!o.current.openEvent || o.current.openEvent.type === "mousedown") ? r(!1, h.nativeEvent, "click") : (h.preventDefault(), r(!0, h.nativeEvent, "click"))));
      },
      onClick(h) {
        if (s === "mousedown" && d.current) {
          d.current = void 0;
          return;
        }
        Qt(d.current, !0) && a || (n && u && (!o.current.openEvent || o.current.openEvent.type === "click") ? r(!1, h.nativeEvent, "click") : r(!0, h.nativeEvent, "click"));
      },
      onKeyDown(h) {
        d.current = void 0, !(h.defaultPrevented || !p || fn(h)) && (h.key === " " && !mn(l) && (h.preventDefault(), g.current = !0), h.key === "Enter" && r(!(n && u), h.nativeEvent, "click"));
      },
      onKeyUp(h) {
        h.defaultPrevented || !p || fn(h) || mn(l) || h.key === " " && g.current && (g.current = !1, r(!(n && u), h.nativeEvent, "click"));
      }
    }
  } : {}, [i, o, s, a, p, l, u, n, r]);
}
const Dl = {
  pointerdown: "onPointerDown",
  mousedown: "onMouseDown",
  click: "onClick"
}, Pl = {
  pointerdown: "onPointerDownCapture",
  mousedown: "onMouseDownCapture",
  click: "onClickCapture"
}, hn = (e) => {
  var t, n;
  return {
    escapeKey: typeof e == "boolean" ? e : (t = e == null ? void 0 : e.escapeKey) != null ? t : !1,
    outsidePress: typeof e == "boolean" ? e : (n = e == null ? void 0 : e.outsidePress) != null ? n : !0
  };
};
function Fl(e, t) {
  t === void 0 && (t = {});
  const {
    open: n,
    onOpenChange: r,
    nodeId: o,
    elements: {
      reference: l,
      domReference: i,
      floating: s
    },
    dataRef: u
  } = e, {
    enabled: a = !0,
    escapeKey: p = !0,
    outsidePress: d = !0,
    outsidePressEvent: g = "pointerdown",
    referencePress: h = !1,
    referencePressEvent: R = "pointerdown",
    ancestorScroll: C = !1,
    bubbles: w,
    capture: x
  } = t, M = ir(), F = ye(typeof d == "function" ? d : () => !1), j = typeof d == "function" ? F : d, S = f.useRef(!1), _ = f.useRef(!1), {
    escapeKey: V,
    outsidePress: m
  } = hn(w), {
    escapeKey: E,
    outsidePress: v
  } = hn(x), b = ye((N) => {
    if (!n || !a || !p || N.key !== "Escape")
      return;
    const I = M ? dt(M.nodesRef.current, o) : [];
    if (!V && (N.stopPropagation(), I.length > 0)) {
      let T = !0;
      if (I.forEach((L) => {
        var Z;
        if ((Z = L.context) != null && Z.open && !L.context.dataRef.current.__escapeKeyBubbles) {
          T = !1;
          return;
        }
      }), !T)
        return;
    }
    r(!1, vi(N) ? N.nativeEvent : N, "escape-key");
  }), k = ye((N) => {
    var I;
    const T = () => {
      var L;
      b(N), (L = Ae(N)) == null || L.removeEventListener("keydown", T);
    };
    (I = Ae(N)) == null || I.addEventListener("keydown", T);
  }), P = ye((N) => {
    const I = S.current;
    S.current = !1;
    const T = _.current;
    if (_.current = !1, g === "click" && T || I || typeof j == "function" && !j(N))
      return;
    const L = Ae(N), Z = "[" + Bt("inert") + "]", Ve = bt(s).querySelectorAll(Z);
    let Ne = q(L) ? L : null;
    for (; Ne && !Re(Ne); ) {
      const te = ve(Ne);
      if (Re(te) || !q(te))
        break;
      Ne = te;
    }
    if (Ve.length && q(L) && !wi(L) && // Clicked on a direct ancestor (e.g. FloatingOverlay).
    !wt(L, s) && // If the target root element contains none of the markers, then the
    // element was injected after the floating element rendered.
    Array.from(Ve).every((te) => !wt(Ne, te)))
      return;
    if (Q(L) && s) {
      const te = L.clientWidth > 0 && L.scrollWidth > L.clientWidth, le = L.clientHeight > 0 && L.scrollHeight > L.clientHeight;
      let ke = le && N.offsetX > L.clientWidth;
      if (le && ee(L).direction === "rtl" && (ke = N.offsetX <= L.offsetWidth - L.clientWidth), ke || te && N.offsetY > L.clientHeight)
        return;
    }
    const hr = M && dt(M.nodesRef.current, o).some((te) => {
      var le;
      return at(N, (le = te.context) == null ? void 0 : le.elements.floating);
    });
    if (at(N, s) || at(N, i) || hr)
      return;
    const Wt = M ? dt(M.nodesRef.current, o) : [];
    if (Wt.length > 0) {
      let te = !0;
      if (Wt.forEach((le) => {
        var ke;
        if ((ke = le.context) != null && ke.open && !le.context.dataRef.current.__outsidePressBubbles) {
          te = !1;
          return;
        }
      }), !te)
        return;
    }
    r(!1, N, "outside-press");
  }), A = ye((N) => {
    var I;
    const T = () => {
      var L;
      P(N), (L = Ae(N)) == null || L.removeEventListener(g, T);
    };
    (I = Ae(N)) == null || I.addEventListener(g, T);
  });
  return f.useEffect(() => {
    if (!n || !a)
      return;
    u.current.__escapeKeyBubbles = V, u.current.__outsidePressBubbles = m;
    function N(L) {
      r(!1, L, "ancestor-scroll");
    }
    const I = bt(s);
    p && I.addEventListener("keydown", E ? k : b, E), j && I.addEventListener(g, v ? A : P, v);
    let T = [];
    return C && (q(i) && (T = ae(i)), q(s) && (T = T.concat(ae(s))), !q(l) && l && l.contextElement && (T = T.concat(ae(l.contextElement)))), T = T.filter((L) => {
      var Z;
      return L !== ((Z = I.defaultView) == null ? void 0 : Z.visualViewport);
    }), T.forEach((L) => {
      L.addEventListener("scroll", N, {
        passive: !0
      });
    }), () => {
      p && I.removeEventListener("keydown", E ? k : b, E), j && I.removeEventListener(g, v ? A : P, v), T.forEach((L) => {
        L.removeEventListener("scroll", N);
      });
    };
  }, [u, s, i, l, p, j, g, n, r, C, a, V, m, b, E, k, P, v, A]), f.useEffect(() => {
    S.current = !1;
  }, [j, g]), f.useMemo(() => a ? {
    reference: {
      onKeyDown: b,
      [Dl[R]]: (N) => {
        h && r(!1, N.nativeEvent, "reference-press");
      }
    },
    floating: {
      onKeyDown: b,
      onMouseDown() {
        _.current = !0;
      },
      onMouseUp() {
        _.current = !0;
      },
      [Pl[g]]: () => {
        S.current = !0;
      }
    }
  } : {}, [a, h, g, R, r, b]);
}
let Rt;
process.env.NODE_ENV !== "production" && (Rt = /* @__PURE__ */ new Set());
function jl(e) {
  var t;
  e === void 0 && (e = {});
  const {
    open: n = !1,
    onOpenChange: r,
    nodeId: o
  } = e;
  if (process.env.NODE_ENV !== "production") {
    var l;
    const m = "Floating UI: Cannot pass a virtual element to the `elements.reference` option, as it must be a real DOM element. Use `refs.setPositionReference` instead.";
    if ((l = e.elements) != null && l.reference && !q(e.elements.reference)) {
      var i;
      if (!((i = Rt) != null && i.has(m))) {
        var s;
        (s = Rt) == null || s.add(m), console.error(m);
      }
    }
  }
  const [u, a] = f.useState(null), p = ((t = e.elements) == null ? void 0 : t.reference) || u, d = Gi(e), g = ir(), h = El() != null, R = ye((m, E, v) => {
    m && (w.current.openEvent = E), x.emit("openchange", {
      open: m,
      event: E,
      reason: v,
      nested: h
    }), r == null || r(m, E, v);
  }), C = f.useRef(null), w = f.useRef({}), x = f.useState(() => yl())[0], M = or(), F = f.useCallback((m) => {
    const E = q(m) ? {
      getBoundingClientRect: () => m.getBoundingClientRect(),
      contextElement: m
    } : m;
    d.refs.setReference(E);
  }, [d.refs]), j = f.useCallback((m) => {
    (q(m) || m === null) && (C.current = m, a(m)), (q(d.refs.reference.current) || d.refs.reference.current === null || // Don't allow setting virtual elements using the old technique back to
    // `null` to support `positionReference` + an unstable `reference`
    // callback ref.
    m !== null && !q(m)) && d.refs.setReference(m);
  }, [d.refs]), S = f.useMemo(() => ({
    ...d.refs,
    setReference: j,
    setPositionReference: F,
    domReference: C
  }), [d.refs, j, F]), _ = f.useMemo(() => ({
    ...d.elements,
    domReference: p
  }), [d.elements, p]), V = f.useMemo(() => ({
    ...d,
    refs: S,
    elements: _,
    dataRef: w,
    nodeId: o,
    floatingId: M,
    events: x,
    open: n,
    onOpenChange: R
  }), [d, o, M, x, n, R, S, _]);
  return Pe(() => {
    const m = g == null ? void 0 : g.nodesRef.current.find((E) => E.id === o);
    m && (m.context = V);
  }), f.useMemo(() => ({
    ...d,
    context: V,
    refs: S,
    elements: _
  }), [d, S, _, V]);
}
const pn = "active", gn = "selected";
function mt(e, t, n) {
  const r = /* @__PURE__ */ new Map(), o = n === "item";
  let l = e;
  if (o && e) {
    const {
      [pn]: i,
      [gn]: s,
      ...u
    } = e;
    l = u;
  }
  return {
    ...n === "floating" && {
      tabIndex: -1
    },
    ...l,
    ...t.map((i) => {
      const s = i ? i[n] : null;
      return typeof s == "function" ? e ? s(e) : null : s;
    }).concat(e).reduce((i, s) => (s && Object.entries(s).forEach((u) => {
      let [a, p] = u;
      if (!(o && [pn, gn].includes(a)))
        if (a.indexOf("on") === 0) {
          if (r.has(a) || r.set(a, []), typeof p == "function") {
            var d;
            (d = r.get(a)) == null || d.push(p), i[a] = function() {
              for (var g, h = arguments.length, R = new Array(h), C = 0; C < h; C++)
                R[C] = arguments[C];
              return (g = r.get(a)) == null ? void 0 : g.map((w) => w(...R)).find((w) => w !== void 0);
            };
          }
        } else
          i[a] = p;
    }), i), {})
  };
}
function Vl(e) {
  e === void 0 && (e = []);
  const t = e, n = f.useCallback(
    (l) => mt(l, e, "reference"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    t
  ), r = f.useCallback(
    (l) => mt(l, e, "floating"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    t
  ), o = f.useCallback(
    (l) => mt(l, e, "item"),
    // Granularly check for `item` changes, because the `getItemProps` getter
    // should be as referentially stable as possible since it may be passed as
    // a prop to many components. All `item` key values must therefore be
    // memoized.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    e.map((l) => l == null ? void 0 : l.item)
  );
  return f.useMemo(() => ({
    getReferenceProps: n,
    getFloatingProps: r,
    getItemProps: o
  }), [n, r, o]);
}
function _l({
  isOpen: e,
  setIsOpen: t,
  offset: n = 0,
  placement: r = "bottom-start",
  click: o = !0
}) {
  const { x: l, y: i, strategy: s, refs: u, context: a } = jl({
    open: e,
    onOpenChange: t,
    middleware: [Ii(), Ti(n), Li()],
    whileElementsMounted: Yi,
    placement: r
  }), p = Il(a, {
    enabled: o
  }), d = Fl(a, {}), { getReferenceProps: g, getFloatingProps: h } = Vl([
    p,
    d
  ]);
  return {
    x: l,
    y: i,
    strategy: s,
    refs: u,
    getReferenceProps: g,
    getFloatingProps: h
  };
}
function re({
  isOpen: e,
  setIsOpen: t,
  offset: n = 0,
  placement: r = "bottom-start",
  hover: o = !1,
  click: l = !0,
  onReferenceClick: i,
  children: s,
  portal: u
}) {
  const { x: a, y: p, strategy: d, refs: g, getReferenceProps: h, getFloatingProps: R } = _l({
    isOpen: e,
    setIsOpen: t,
    offset: n,
    placement: r,
    hover: o,
    click: l
  }), [C, w] = xr.toArray(s), [x] = O(On);
  function M() {
    return e && /* @__PURE__ */ c(Ml, { id: x, children: /* @__PURE__ */ c(
      "div",
      {
        ref: g.setFloating,
        style: {
          position: d,
          top: p ?? 0,
          left: a ?? 0
        },
        ...R(),
        children: w
      }
    ) });
  }
  function F() {
    return e && /* @__PURE__ */ c(
      "div",
      {
        ref: g.setFloating,
        style: {
          position: d,
          top: p ?? 0,
          left: a ?? 0
        },
        ...R(),
        children: w
      }
    );
  }
  return /* @__PURE__ */ y(X, { children: [
    /* @__PURE__ */ c(
      "div",
      {
        ref: g.setReference,
        ...h({ onClick: i }),
        children: C
      }
    ),
    u ? M() : F()
  ] });
}
function Bl({
  rowId: e,
  colId: t,
  data: n,
  setData: r,
  focus: o,
  isViewOnly: l,
  configuration: i
}) {
  const s = W(
    () => n ? new Date(Date.parse(n)) : null,
    [n]
  ), [u, a] = H(
    s ? Me(s) : ""
  ), p = /^([1-9]|1[012]|0[1-9])[/.-]?$/g, d = /^([1-9]|1[012]|0[1-9])[/.-]([1-9]||0[1-9]|1[0-9]|2[0-9]|3[01])[/.-]?$/g, g = /^([1-9]|1[012]|0[1-9])[/.-]([1-9]||0[1-9]|1[0-9]|2[0-9]|3[01])[/.-](\d?\d?\d?\d)$/g, [h, R] = H(null), C = /* @__PURE__ */ new Date(), [w] = O(oe), [, x] = O(Dt), M = o === "editing", F = Y(
    (V) => {
      x({ rowId: e, colId: t, value: V ? "editing" : "focused" });
    },
    [e, t, x]
  );
  function j(V, m, E) {
    const v = Number(E), b = Number(V) - 1, k = Number(m), P = /* @__PURE__ */ new Date();
    return P.setUTCFullYear(v, b, k), P.setUTCHours(0, 0, 0, 0), P;
  }
  const S = Y(
    (V) => {
      r((V == null ? void 0 : V.toISOString()) || ""), a(Me(V)), x({ rowId: e, colId: t, value: "focused" });
    },
    [e, t, x, r]
  );
  K(() => {
    h && h.focus();
  }, [h]), K(() => {
    a(s ? Me(s) : "");
  }, [o]);
  function _(V) {
    a(V.target.value);
  }
  return li(() => {
    if (!u)
      return;
    let V = null;
    if (g.test(u)) {
      u.match(g);
      const [m] = u.matchAll(g);
      V = j(m[1], m[2], m[3]);
    } else if (p.test(u)) {
      u.match(p);
      const [m] = u.matchAll(p);
      V = j(m[1], 1, C.getUTCFullYear());
    } else if (d.test(u)) {
      u.match(d);
      const [m] = u.matchAll(d);
      V = j(
        m[1],
        m[2],
        C.getUTCFullYear()
      );
    }
    r((V == null ? void 0 : V.toISOString()) || "");
  }, [u]), /* @__PURE__ */ y(X, { children: [
    (o === "none" || o === "focused") && /* @__PURE__ */ c("div", { className: "p-1 flex items-center cursor-default w-full", children: s ? w.formatDate !== void 0 ? w.formatDate({ parsedData: s, configuration: i }) : Me(s) : "" }),
    o === "editing" && !l && /* @__PURE__ */ y(re, { isOpen: M, setIsOpen: F, offset: 4, children: [
      /* @__PURE__ */ y("div", { className: "h-full", children: [
        /* @__PURE__ */ c("input", { type: "data", className: "hidden", value: u, readOnly: !0 }),
        /* @__PURE__ */ c(
          "input",
          {
            placeholder: "mm/dd/yyyy",
            className: "rs-input focus:outline-none rounded p-1 w-full",
            onChange: _,
            value: u,
            ref: R
          }
        )
      ] }),
      /* @__PURE__ */ c(fi, { onSelect: S, value: s })
    ] })
  ] });
}
const Hl = {
  32: "truncate",
  64: "line-clamp-2",
  96: "line-clamp-4",
  128: "line-clamp-5"
};
function $l({ data: e, setData: t, focusState: n, isViewOnly: r }) {
  const [o, l] = H(null), i = W(() => e || "", [e]), [s] = O(It);
  function u(a) {
    a.preventDefault(), t(a.target.value);
  }
  return K(() => {
    o && (o.focus(), o.setSelectionRange(
      i.length + 1,
      i.length || 1
    ), o.scrollTop = o.scrollHeight);
  }, [o]), /* @__PURE__ */ y(X, { children: [
    (n === "none" || n === "focused") && /* @__PURE__ */ c(
      "div",
      {
        className: U(
          "p-1 cursor-default w-full h-full",
          Hl[s]
        ),
        children: e
      }
    ),
    n === "editing" && !r && /* @__PURE__ */ c(
      "textarea",
      {
        ref: l,
        name: "text",
        value: i,
        onChange: u,
        tabIndex: -1,
        className: "rs-textarea p-1 focus:outline-none border-none text-sm w-full max-w-full h-32 rounded-sm resize-none break-words"
      }
    )
  ] });
}
const Wl = [
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
function je({
  options: e = Wl,
  allOptions: t,
  onSelect: n,
  placeholder: r = "Search",
  inputRef: o,
  OptionRenderer: l,
  value: i = {},
  onNewOption: s,
  enableSearch: u = !0
}) {
  const [a, p] = H(e), d = a.find((v) => v.value === i.value), [g, h] = H(d || a[0]), [R, C] = H(!1), [w, x] = H(""), M = W(() => pt(), []), [F, j] = H({}), S = ce(!1);
  K(() => {
    let v = !1;
    if (t)
      for (const k in t)
        t[k].name.toLowerCase() === w.toLowerCase() && (v = !0);
    const b = e.filter((k) => (k.name.toLowerCase() === w.toLowerCase() && (v = !0), k.name.toLowerCase().includes(w.toLowerCase())));
    p(b), S.current ? b.length > 0 ? h(b[0]) : h({
      value: w,
      name: w,
      color: M
    }) : h(d || b[0]), j(v ? {} : {
      value: w,
      name: w,
      color: M
    }), C(v);
  }, [w]);
  function _(v) {
    n == null || n(v);
  }
  function V(v) {
    C(!1), x(v.target.value), S.current = !0;
  }
  const m = Y((v) => {
    if (v.code === "Enter") {
      if (v.preventDefault(), a.length === 0 && R || !g.value)
        return;
      s && !R && s(F), _(g);
    } else if (v.code === "ArrowDown") {
      g || h(a[0]);
      const b = a.findIndex(
        (k) => k.value === g.value
      );
      h(a[(b + 1) % a.length]);
    } else if (v.code === "ArrowUp") {
      g || h(a[0]);
      const b = a.findIndex(
        (k) => k.value === g.value
      );
      h(
        a[(b + a.length - 1) % a.length]
      );
    }
  });
  function E(v) {
    v.preventDefault(), h(a[0]);
  }
  return /* @__PURE__ */ y(
    "div",
    {
      className: "w-full relative pt-2",
      onKeyDown: m,
      onMouseEnter: E,
      role: "searchbox",
      tabIndex: 0,
      children: [
        u && /* @__PURE__ */ c("div", { className: "px-2 mb-2", children: /* @__PURE__ */ c(
          "input",
          {
            className: "rs-input border focus:ring rounded-2 rounded focus:outline-none px-2 p-1 w-full truncate",
            placeholder: r,
            onChange: V,
            ref: o,
            value: w
          }
        ) }),
        /* @__PURE__ */ y("ul", { className: "rs-list max-h-48 overflow-auto pb-2", children: [
          a.map((v) => /* @__PURE__ */ y(
            "li",
            {
              className: U(
                "hover:bg-hover-light px-2 p-1 cursor-default flex flex-row whitespace-nowrap",
                g && g.value === v.value && "bg-hover"
              ),
              onClick: (b) => {
                b.preventDefault(), _(v);
              },
              onMouseEnter: () => {
                h(v);
              },
              "aria-selected": g.value === v.value,
              onKeyDown: (b) => {
                b.code === "Enter" && _(v);
              },
              children: [
                l ? /* @__PURE__ */ c(l, { ...v }) : v.name,
                d && d.value === v.value && /* @__PURE__ */ c(Pt, { className: "w-4 h-4 ml-auto self-center" })
              ]
            },
            v.value
          )),
          s && w && !R && /* @__PURE__ */ y(
            "li",
            {
              className: U(
                "hover:bg-hover-light px-2 p-1 cursor-pointer flex flex-row whitespace-nowrap",
                g && g.value === F.value && "bg-hover"
              ),
              onClick: () => s(F),
              onMouseEnter: () => {
                h(F);
              },
              "aria-selected": !1,
              onKeyDown: (v) => {
                v.code === "Enter" && s(F);
              },
              children: [
                /* @__PURE__ */ c("span", { className: "mr-2", children: "Add option:" }),
                l ? /* @__PURE__ */ c(l, { ...F }) : F.name
              ]
            }
          )
        ] })
      ]
    }
  );
}
function Ul({
  rowId: e,
  colId: t,
  data: n,
  setData: r,
  options: o,
  updateColumn: l,
  focusState: i,
  showOptionSearch: s,
  isViewOnly: u
}) {
  const a = W(
    () => ge(n) ? [] : n.split(",").map((x) => o.find((M) => M.value === x)),
    [n, o]
  ), [p, d] = H(null), g = i === "editing", [, h] = O(Dt), R = Y(
    (x) => {
      h({ rowId: e, colId: t, value: x ? "editing" : "focused" });
    },
    [t, e, h]
  ), C = o.filter(
    (x) => a.findIndex((M) => M.value === x.value) === -1
  );
  K(() => {
    p && p.focus();
  }, [p]);
  const w = Y(
    (x) => {
      l({ id: t, options: [...o, x] }), r([...a.map((M) => M.value), x.value].join(",")), h({ rowId: e, colId: t, value: "focused" });
    },
    [t, e, a, o, l, r, h]
  );
  return /* @__PURE__ */ y(X, { children: [
    i === "none" && /* @__PURE__ */ c("div", { className: "p-1 flex items-center h-full overflow-hidden", children: /* @__PURE__ */ c("div", { className: "flex gap-1", children: a.map((x) => x ? /* @__PURE__ */ c(he, { color: x.color, name: x.name }, x.name) : null) }) }),
    (i === "focused" || i === "editing") && /* @__PURE__ */ y(
      re,
      {
        isOpen: g && !u,
        setIsOpen: R,
        referenceClass: "w-full max-h-8",
        children: [
          /* @__PURE__ */ c(
            "div",
            {
              className: "flex items-center p-1 w-full h-full bg-content",
              tabIndex: i === "editing" ? 0 : -1,
              children: /* @__PURE__ */ y("div", { className: "flex gap-1 flex-wrap", children: [
                a.map((x) => x ? /* @__PURE__ */ c(
                  he,
                  {
                    color: x.color,
                    name: x.name,
                    onCancel: (M) => {
                      M.stopPropagation(), r(
                        n.split(",").filter((F) => F !== x.value).join(",")
                      );
                    }
                  },
                  x.name
                ) : null),
                /* @__PURE__ */ c(
                  "button",
                  {
                    className: "p-[3px] bg-zinc-100 rounded flex items-center h-full",
                    type: "button",
                    children: /* @__PURE__ */ c(_n, { className: "w-4 text-dark" })
                  }
                )
              ] })
            }
          ),
          /* @__PURE__ */ y(B, { children: [
            /* @__PURE__ */ c("div", { className: "w-48" }),
            /* @__PURE__ */ c(
              je,
              {
                allOptions: o,
                options: C,
                onSelect: (x) => {
                  r(
                    ge(n) ? x.value : `${n},${x.value}`
                  );
                },
                inputRef: d,
                OptionRenderer: he,
                placeholder: "Search for an option...",
                onNewOption: w,
                enableSearch: s
              }
            )
          ] })
        ]
      }
    )
  ] });
}
function Zl({ data: e, setData: t, setError: n, focus: r, isViewOnly: o }) {
  const [l, i] = H(null), s = /^[+-]?(\d*(\.\d*)?)$/, u = W(() => e || "", [e]);
  function a(p) {
    p.preventDefault(), s.test(p.target.value) ? (t(p.target.value), n("")) : n("Please enter a number.");
  }
  return K(() => {
    n(""), l && l.focus();
  }, [n, l]), /* @__PURE__ */ y(X, { children: [
    (r === "none" || r === "focused") && /* @__PURE__ */ c("div", { className: "p-1 flex items-center justify-end truncate cursor-default w-full", children: e }),
    r === "editing" && !o && /* @__PURE__ */ c(
      "input",
      {
        type: "text",
        value: u,
        onChange: a,
        ref: i,
        className: "rs-input p-1 focus:outline-none w-full border-none text-sm rounded-sm truncate text-right"
      }
    )
  ] });
}
function Kl({
  rowId: e,
  colId: t,
  data: n,
  setData: r,
  options: o,
  updateColumn: l,
  focusState: i,
  showOptionSearch: s,
  isViewOnly: u
}) {
  const a = W(
    () => Ie(n) ? {} : o.find((w) => w.value === n)
  ), [p, d] = H(null), g = i === "editing", [, h] = O(Dt), R = Y(
    (w) => {
      h({ rowId: e, colId: t, value: w ? "editing" : "focused" });
    },
    [t, e, h]
  );
  K(() => {
    p && p.focus();
  }, [p]);
  const C = Y(
    (w) => {
      l({ id: t, options: [...o, w] }), r(w.value), h({ rowId: e, colId: t, value: "focused" });
    },
    [t, e, o, l]
  );
  return /* @__PURE__ */ y(X, { children: [
    i === "none" && /* @__PURE__ */ c("div", { className: "p-1 flex items-center h-full", children: a && /* @__PURE__ */ c(he, { color: a.color, name: a.name }) }),
    (i === "focused" || i === "editing") && /* @__PURE__ */ y(
      re,
      {
        isOpen: g,
        setIsOpen: R && !u,
        referenceClass: "w-full max-h-8",
        children: [
          /* @__PURE__ */ y(
            "div",
            {
              className: "flex items-center p-1 w-full h-full",
              tabIndex: i === "editing" ? 0 : -1,
              children: [
                a && /* @__PURE__ */ c(he, { color: a.color, name: a.name }),
                /* @__PURE__ */ c(
                  Bn,
                  {
                    className: "w-4 h-4 ml-auto",
                    style: { alignSelf: "center" }
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ y(B, { children: [
            /* @__PURE__ */ c("div", { className: "w-48" }),
            /* @__PURE__ */ c(
              je,
              {
                options: o,
                onSelect: (w) => {
                  r(w.value), R(!1);
                },
                inputRef: d,
                OptionRenderer: he,
                placeholder: "Search for an option...",
                value: a,
                onNewOption: C,
                enableSearch: s
              }
            )
          ] })
        ]
      }
    )
  ] });
}
function ql({ data: e, setData: t, focusState: n, isViewOnly: r }) {
  const [o, l] = H(null), i = W(() => e || "", [e]);
  function s(u) {
    u.preventDefault(), t(u.target.value);
  }
  return K(() => {
    o && (o.focus(), o.setSelectionRange(i.length + 1, i.length + 1), o.scrollLeft = o.scrollWidth);
  }, [o]), /* @__PURE__ */ y(X, { children: [
    (n === "none" || n === "focused") && /* @__PURE__ */ c("div", { className: "p-1 flex items-center cursor-default w-full", children: /* @__PURE__ */ c("div", { className: "truncate", children: e }) }),
    n === "editing" && !r && /* @__PURE__ */ c(
      "input",
      {
        ref: l,
        type: "text",
        value: i,
        onChange: s,
        tabIndex: -1,
        rows: 1,
        className: "focus:outline-none rs-input p-1 w-full border-none text-sm rounded-sm truncate resize-none max-h-8"
      }
    )
  ] });
}
function zl({ ...e }) {
  return /* @__PURE__ */ y(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...e,
      children: [
        /* @__PURE__ */ c(
          "path",
          {
            d: "M4 20H20M15 11H20M13 6.5H20M4 15.5H20",
            strokeLinecap: "round",
            strokeLinejoin: "round"
          }
        ),
        /* @__PURE__ */ c(
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
function Yl({ ...e }) {
  return /* @__PURE__ */ c(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...e,
      children: /* @__PURE__ */ c(
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
function Xl({ ...e }) {
  return /* @__PURE__ */ c(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...e,
      children: /* @__PURE__ */ c(
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
function Gl({ data: e, setData: t, focusState: n, isViewOnly: r }) {
  const [o, l] = H(null), i = W(() => e || "", [e]);
  function s(u) {
    u.preventDefault(), t(u.target.value);
  }
  return K(() => {
    o && (o.focus(), o.setSelectionRange(i.length + 1, i.length + 1), o.scrollLeft = o.scrollWidth);
  }, [o]), /* @__PURE__ */ y(X, { children: [
    (n === "none" || n === "focused") && /* @__PURE__ */ c("div", { className: "p-1 flex items-center cursor-default w-full", children: /* @__PURE__ */ c("div", { className: "truncate", children: /* @__PURE__ */ c(
      "a",
      {
        href: `//${e}`,
        rel: "noopener noreferrer",
        target: "_blank",
        className: "text-primary",
        children: e
      }
    ) }) }),
    n === "editing" && !r && /* @__PURE__ */ c(
      "input",
      {
        ref: l,
        type: "text",
        value: i,
        onChange: s,
        tabIndex: -1,
        rows: 1,
        className: "focus:outline-none rs-input p-1 w-full border-none text-sm rounded-sm truncate resize-none max-h-8"
      }
    )
  ] });
}
function Ht({ checked: e, toggle: t, isViewOnly: n }) {
  return /* @__PURE__ */ y("div", { children: [
    /* @__PURE__ */ c(
      "input",
      {
        className: "hidden sr-only",
        type: "checkbox",
        checked: e,
        value: e,
        readOnly: !0
      }
    ),
    /* @__PURE__ */ c(
      "div",
      {
        className: U(
          "rounded border w-4 h-4 relative",
          e ? "bg-blue-500 after:content-['✓'] after:absolute after:left-1/2 after:top-1/2 after:text-inverted after:-translate-x-1/2 after:-translate-y-1/2 after:text-xs" : "bg-background"
        ),
        onClick: () => !n && t()
      }
    )
  ] });
}
function Jl({ data: e, setData: t, focusState: n, isViewOnly: r }) {
  const o = W(() => e || !1, [e]);
  return /* @__PURE__ */ c(X, { children: /* @__PURE__ */ c("span", { className: "flex items-center justify-center p-1.5", children: /* @__PURE__ */ c(Ht, { checked: o, toggle: () => t(!o), isViewOnly: !0 }) }) });
}
function Ql({ rowData: e, formula: t }) {
  return /* @__PURE__ */ c(X, { children: /* @__PURE__ */ c("div", { className: "p-1 flex items-center cursor-default w-full", children: /* @__PURE__ */ c("div", { className: "truncate", children: t && typeof t == "function" && t(e) }) }) });
}
function es({ ...e }) {
  return /* @__PURE__ */ c(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...e,
      children: /* @__PURE__ */ c(
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
const ur = [
  {
    type: "text",
    cell: ql,
    icon: Yl,
    name: "Single-Line Text"
  },
  {
    type: "longText",
    cell: $l,
    icon: zl,
    name: "Long Text"
  },
  {
    type: "number",
    cell: Zl,
    icon: Ao,
    name: "Number"
  },
  {
    type: "select",
    cell: Kl,
    icon: Bo,
    name: "Select"
  },
  {
    type: "date",
    cell: Bl,
    icon: Xl,
    name: "Date"
  },
  {
    type: "multiSelect",
    cell: Ul,
    icon: Po,
    name: "Multiple Select"
  },
  {
    type: "url",
    cell: Gl,
    icon: To,
    name: "URL"
  },
  {
    type: "checkbox",
    cell: Jl,
    icon: yo,
    name: "Checkbox"
  },
  {
    type: "formula",
    cell: Ql,
    icon: es,
    name: "Formula"
  }
];
function Xe(e) {
  const [t] = O(oe);
  return [...ur, ...t.extraColumnTypes].find((n) => n.type === e);
}
function ts() {
  return ur;
}
const ns = Ge.memo(os), rs = ns;
function os({ rowId: e, colId: t, data: n, rowData: r, setData: o }) {
  const [l, i] = H(""), s = ce(null), u = W(
    () => et(e, t),
    [e, t]
  ), [a, p] = O(u), d = W(() => me(t), [t]), [g, h] = O(d), R = g.type === "custom" ? g.renderer : Xe(g.type).cell, C = W(
    () => po(e, t),
    [e, t]
  ), [, w] = O(C);
  function x(S) {
    s.current && !s.current.contains(S.target) && p("none");
  }
  function M(S) {
    if (!s.current || S.target !== s.current) {
      S.code === "Escape" && p("focused");
      return;
    }
    S.code === "ArrowUp" ? (S.stopPropagation(), S.preventDefault(), w("up")) : S.code === "ArrowDown" ? (S.stopPropagation(), S.preventDefault(), w("down")) : S.code === "ArrowLeft" ? (S.stopPropagation(), S.preventDefault(), w("left")) : S.code === "ArrowRight" ? (S.stopPropagation(), S.preventDefault(), w("right")) : S.code === "Enter" ? (p("editing"), S.stopPropagation(), S.preventDefault()) : S.code === "Escape" && p("none");
  }
  function F(S) {
    console.log("clicked"), s.current && S.target === s.current && p("focused");
  }
  function j(S) {
    S.stopPropagation(), !g.isViewOnly && p("editing");
  }
  return K(() => a === "focused" ? (document == null || document.addEventListener("mousedown", x), s.current && s.current.focus(), () => {
    document == null || document.removeEventListener("mousedown", x);
  }) : a === "editing" ? (document == null || document.addEventListener("mousedown", x), () => {
    document == null || document.removeEventListener("mousedown", x);
  }) : a === "none" ? (s.current && s.current.blur(), () => {
  }) : () => {
  }, [a]), /* @__PURE__ */ c(
    "div",
    {
      className: "relative p-0 border-r bg-content focus:outline-none",
      style: { width: g.width },
      ref: s,
      onClick: F,
      onFocus: F,
      onDoubleClick: j,
      tabIndex: 0,
      onKeyDown: M,
      role: "gridcell",
      children: /* @__PURE__ */ y(
        "div",
        {
          className: U(
            "w-full rounded-sm min-h-full focus:outline-none",
            (a === "focused" || a === "editing") && "ring-2 ring-blue-500 absolute top-0 z-10"
          ),
          children: [
            /* @__PURE__ */ c(
              R,
              {
                rowId: e,
                colId: t,
                initData: n,
                data: n,
                options: g.options,
                updateColumn: h,
                setError: i,
                focus: a,
                focusState: a,
                setFocus: p,
                setData: o,
                showOptionSearch: g.showOptionSearch,
                isViewOnly: g.isViewOnly,
                rowData: r,
                formula: g.formula,
                configuration: g.configuration
              }
            ),
            a === "editing" && l && /* @__PURE__ */ c("div", { className: "text-xs p-1.5 py-2", children: l })
          ]
        }
      )
    }
  );
}
function is(e, t) {
  if (e == null || e === "")
    return "(empty)";
  switch (t.type) {
    case "select": {
      const n = t.options.find((r) => r.value === e);
      return /* @__PURE__ */ c(he, { color: n.color, name: n.name });
    }
    case "date":
      return Me(new Date(Date.parse(e)));
    default:
      return e;
  }
}
function ls({ groupVal: e }) {
  const [t] = O(Se), n = W(
    () => {
      var i;
      return me(((i = t[0]) == null ? void 0 : i.columnId) || "");
    },
    [t]
  ), [r] = O(n), [o, l] = O(At);
  return /* @__PURE__ */ y(
    "div",
    {
      className: U(
        "w-full h-16 bg-header rounded-t-md border flex",
        o[e] && "rounded-b-md"
      ),
      children: [
        /* @__PURE__ */ c(
          "div",
          {
            className: "h-full flex items-center justify-center w-16",
            onClick: () => l((i) => ({ ...i, [e]: !i[e] })),
            children: /* @__PURE__ */ c(Eo, { className: "w-4 h-4" })
          }
        ),
        /* @__PURE__ */ y("div", { className: "h-full p-1.5", children: [
          /* @__PURE__ */ c("div", { className: "text-xs tracking-wider uppercase font-medium text-secondary", children: r.name }),
          /* @__PURE__ */ c("div", { className: "flex mt-1", children: is(e, r) })
        ] })
      ]
    }
  );
}
function ss({ groupVal: e }) {
  const [t] = O(Se), [, n] = O(Ln);
  function r(o) {
    o.preventDefault();
    const l = { data: {} };
    t.length > 0 && (l[t[0].columnId] = e), n({ id: Je(), ...l });
  }
  return /* @__PURE__ */ c(
    "div",
    {
      onClick: r,
      className: U(
        "rs-btn h-8 border-b border-r font-normal text-sm cursor-pointer flex items-center hover:bg-hover bg-content",
        t.length > 0 && "border-l rounded-b-md"
      ),
      tabIndex: 0,
      children: /* @__PURE__ */ c("div", { className: "flex items-center justify-center", style: { width: 63 }, children: /* @__PURE__ */ c(_n, { className: "w-4 h-4" }) })
    }
  );
}
function cs({ rowId: e, first: t, last: n, groupVal: r }) {
  const [o] = O(Se), [l] = O(At), [i] = O(so), [s] = O(oe);
  return /* @__PURE__ */ y(
    "div",
    {
      className: U(
        t && o.length > 0 && "mt-8",
        o.length > 0 && "ml-4"
      ),
      style: { width: i },
      children: [
        o.length > 0 && t && /* @__PURE__ */ c(ls, { groupVal: r }),
        !l[r] && /* @__PURE__ */ y(X, { children: [
          /* @__PURE__ */ c("div", { className: U(o.length > 0 && "border-l"), children: /* @__PURE__ */ c(as, { rowId: e }) }),
          s.addRow.enabled && s.addRow.body && n && /* @__PURE__ */ c(ss, { groupVal: r }),
          " "
        ] })
      ]
    }
  );
}
const as = Ge.memo(us);
function us({ rowId: e }) {
  const t = W(() => An(e), [e]), [n, r] = O(t), [o] = O(se), [l] = O(It), [i] = O(oe), s = W(
    () => (u) => (a) => {
      r({ [u]: a });
    },
    [r]
  );
  return /* @__PURE__ */ y("div", { className: U("flex relative border-b"), style: { height: l }, children: [
    i.selectRow.enabled && /* @__PURE__ */ c(
      "div",
      {
        className: U(
          "border-r bg-content flex items-center justify-center"
        ),
        style: { width: 64 },
        children: /* @__PURE__ */ c(
          Ht,
          {
            checked: n.isSelected || !1,
            toggle: () => r((u) => ({ isSelected: !u.isSelected }))
          }
        )
      }
    ),
    o.map((u) => /* @__PURE__ */ c(
      rs,
      {
        rowId: e,
        colId: u,
        data: n[u],
        rowData: n,
        setData: s(u)
      },
      `${e}-${u}`
    ))
  ] });
}
const ds = yn(({ handleScroll: e }, t) => {
  const [n] = O(Le), [r] = O(oe);
  return /* @__PURE__ */ c(
    "div",
    {
      className: "h-[calc(100%-65px)] overflow-auto border-b bg-background",
      onScroll: e,
      ref: t,
      children: /* @__PURE__ */ y("div", { className: "flex flex-row", children: [
        /* @__PURE__ */ y("div", { className: "flex flex-col", children: [
          n.map((o, l) => /* @__PURE__ */ c(
            cs,
            {
              rowId: o.id,
              first: o.first,
              last: o.last,
              groupVal: o.groupVal
            },
            o.id
          )),
          r.addRow.enabled && /* @__PURE__ */ c("div", { className: "h-48 shrink-0 grow" })
        ] }),
        r.addColumn.enabled && /* @__PURE__ */ c("div", { className: "w-48 shrink-0 grow" })
      ] })
    }
  );
}), fs = ds, dr = [
  {
    type: "empty",
    name: "Empty",
    atomFactory: (e) => Gt(e, (t) => ge(t))
  },
  {
    type: "filled",
    name: "Filled",
    atomFactory: (e) => Gt(e, (t) => !ge(t))
  },
  {
    type: "unique",
    name: "Unique",
    atomFactory: zr
  }
];
function vn(e) {
  return dr.find((t) => t.type === e);
}
function ms() {
  return dr.map((e) => e.type);
}
const hs = yn(({}, e) => {
  const [t] = O(se), [n] = O(Se);
  return /* @__PURE__ */ c("div", { className: "bg-header h-8", children: /* @__PURE__ */ y("div", { className: "h-8 flex relative", ref: e, children: [
    /* @__PURE__ */ c(
      "div",
      {
        style: { width: 64 },
        className: U(n.length > 0 && "ml-4", "shrink-0 border-r")
      }
    ),
    t.map((r) => /* @__PURE__ */ c(gs, { colId: r }, r)),
    /* @__PURE__ */ c("div", { className: "w-48 grow shrink-0" })
  ] }) });
}), ps = hs;
function gs({ colId: e }) {
  const t = W(() => me(e), [e]), [n, r] = O(t), o = vn(n.summary), l = W(
    () => o ? o.atomFactory(n.id) : D(""),
    [o, n.id]
  ), [i] = O(l), s = ms(), [u, a] = H(!1);
  function p(d) {
    r({ summary: d }), a(!1);
  }
  return /* @__PURE__ */ y(
    re,
    {
      isOpen: u,
      setIsOpen: a,
      click: !0,
      placement: "top-end",
      portal: !0,
      portalId: "table-footer",
      children: [
        /* @__PURE__ */ c(
          "div",
          {
            style: { width: n.width },
            className: U(
              "hover:bg-hover-light -mr-[1px] h-full flex items-center justify-end text-sm relative group px-2 cursor-default",
              u && "bg-hover"
            ),
            children: o ? /* @__PURE__ */ y(X, { children: [
              /* @__PURE__ */ c("span", { className: "text-xs text-secondary", children: o.name }),
              /* @__PURE__ */ c("span", { className: "ml-1", children: i })
            ] }) : /* @__PURE__ */ y(X, { children: [
              /* @__PURE__ */ c(Bn, { className: "w-4 h-4 hidden group-hover:block" }),
              /* @__PURE__ */ c("span", { className: "hidden group-hover:block text-xs ml-1", children: "Summary" })
            ] })
          }
        ),
        /* @__PURE__ */ y(B, { children: [
          /* @__PURE__ */ c("div", { className: "w-32" }),
          /* @__PURE__ */ y(B.Section, { children: [
            /* @__PURE__ */ c(
              B.Section.Button,
              {
                onClick: () => {
                  p("");
                },
                children: /* @__PURE__ */ c("span", { className: "text-secondary", children: "None" })
              }
            ),
            s.map((d) => {
              const g = vn(d);
              return /* @__PURE__ */ c(
                B.Section.Button,
                {
                  onClick: () => {
                    p(g.type);
                  },
                  children: g.name
                },
                g.type
              );
            })
          ] })
        ] })
      ]
    }
  );
}
function vs({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ f.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ f.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ f.createElement("path", {
    fillRule: "evenodd",
    d: "M12 2.25a.75.75 0 0 1 .75.75v16.19l6.22-6.22a.75.75 0 1 1 1.06 1.06l-7.5 7.5a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 1 1 1.06-1.06l6.22 6.22V3a.75.75 0 0 1 .75-.75Z",
    clipRule: "evenodd"
  }));
}
const ws = f.forwardRef(vs), bs = ws;
function xs({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ f.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ f.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ f.createElement("path", {
    fillRule: "evenodd",
    d: "M11.47 2.47a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 1 1-1.06 1.06l-6.22-6.22V21a.75.75 0 0 1-1.5 0V4.81l-6.22 6.22a.75.75 0 1 1-1.06-1.06l7.5-7.5Z",
    clipRule: "evenodd"
  }));
}
const ys = f.forwardRef(xs), Cs = ys;
function Rs({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ f.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ f.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ f.createElement("path", {
    fillRule: "evenodd",
    d: "M6.97 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1-1.06 1.06L8.25 4.81V16.5a.75.75 0 0 1-1.5 0V4.81L3.53 8.03a.75.75 0 0 1-1.06-1.06l4.5-4.5Zm9.53 4.28a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V7.5a.75.75 0 0 1 .75-.75Z",
    clipRule: "evenodd"
  }));
}
const Es = f.forwardRef(Rs), wn = Es;
function Ss({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ f.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ f.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ f.createElement("path", {
    fillRule: "evenodd",
    d: "M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z",
    clipRule: "evenodd"
  }));
}
const Ns = f.forwardRef(Ss), $t = Ns;
function ks({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ f.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ f.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ f.createElement("path", {
    fillRule: "evenodd",
    d: "M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z",
    clipRule: "evenodd"
  }));
}
const Os = f.forwardRef(ks), As = Os;
function Ls({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ f.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ f.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ f.createElement("path", {
    fillRule: "evenodd",
    d: "M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z",
    clipRule: "evenodd"
  }));
}
const Ms = f.forwardRef(Ls), it = Ms;
function Ts({ colId: e, supportedTypes: t }) {
  const [n] = O(W(() => me(e), [e])), [, r] = O(ho), o = W(() => Qe(e), [e]), [, l] = O(o);
  function i(s, u) {
    s.preventDefault(), r({ colId: n.id, type: u }), l(!1);
  }
  return /* @__PURE__ */ c(B, { children: /* @__PURE__ */ y(B.Section, { children: [
    /* @__PURE__ */ c("div", { className: "w-56" }),
    /* @__PURE__ */ c(B.Section.Item, { children: /* @__PURE__ */ c("span", { className: "uppercase font-medium text-secondary text-xs", children: "Property Type" }) }),
    t.map((s) => /* @__PURE__ */ y(
      B.Section.Button,
      {
        onClick: (u) => {
          i(u, s.type);
        },
        children: [
          /* @__PURE__ */ c(s.icon, { className: "w-4 h-4 mr-2" }),
          /* @__PURE__ */ c("span", { children: s.name })
        ]
      },
      s.name
    ))
  ] }) });
}
function Et({ ...e }) {
  return /* @__PURE__ */ c(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...e,
      children: /* @__PURE__ */ c(
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
function Is({
  colId: e,
  sortCallback: t,
  filterCallback: n,
  deleteCallback: r
}) {
  const [o, l] = O(W(() => me(e), [e])), i = ce(), s = o.type === "custom" ? o.icon : Xe(o.type).icon, u = o.type === "custom" ? "Custom" : Xe(o.type).name, [, a] = O(Tn), [, p] = O(In), d = W(() => Qe(e), [e]), [, g] = O(d), [h] = O(oe), R = W(() => [...ts(), ...h.extraColumnTypes], []);
  K(() => {
    i.current && i.current.select();
  }, [i]);
  function C(v) {
    v.preventDefault(), l({ name: v.target.value });
  }
  function w(v) {
    v.code;
  }
  function x(v) {
    v.preventDefault(), r(o), g(!1);
  }
  function M(v) {
    v.preventDefault(), v.stopPropagation(), t([{ columnId: o.id, order: "asc" }]), a(!0), g(!1);
  }
  function F(v) {
    v.preventDefault(), v.stopPropagation(), t([{ columnId: o.id, order: "desc" }]), a(!0), g(!1);
  }
  function j(v) {
    v.preventDefault(), v.stopPropagation(), n([{ columnId: o.id, type: "contains", value: "" }]), p(!0), g(!1);
  }
  const S = [
    [
      {
        name: "Sort Ascending",
        icon: Cs,
        action: M,
        enabled: h.sorting.enabled
      },
      {
        name: "Sort Descending",
        icon: bs,
        action: F,
        enabled: h.sorting.enabled
      },
      {
        name: "Filter",
        icon: Et,
        action: j,
        enabled: h.filtering.enabled
      }
    ],
    [
      {
        name: "Delete",
        icon: As,
        action: x,
        disabled: o.is_primary === "true" || o.is_primary === !0,
        enabled: h.deleteColumns.enabled
      }
    ]
  ], [_, V] = H(!1), [m, E] = H(null);
  if (_)
    return /* @__PURE__ */ c(Ts, { colId: e, supportedTypes: R });
  if (m !== null) {
    const v = h.extraColumnHeaderPopupActions[m];
    return /* @__PURE__ */ c(v.popup, { column: o, setColumn: l, close: () => g(!1) });
  }
  return /* @__PURE__ */ y(B, { children: [
    /* @__PURE__ */ c("div", { className: "w-56" }),
    /* @__PURE__ */ y(B.Section, { children: [
      /* @__PURE__ */ c(B.Section.Item, { children: /* @__PURE__ */ c(
        "input",
        {
          value: o.name,
          onChange: C,
          ref: i,
          onKeyDown: w,
          className: "rs-input focus:outline-none focus:ring rounded rounded-2 p-1 border w-full mb-2"
        }
      ) }),
      /* @__PURE__ */ c(B.Section.Item, { children: /* @__PURE__ */ c("span", { className: "uppercase font-medium text-secondary text-xs", children: "Property Type" }) }),
      /* @__PURE__ */ y(B.Section.Button, { onClick: () => V(!0), children: [
        s && /* @__PURE__ */ c(s, { className: "w-4 h-4 mr-2" }),
        u
      ] }),
      h.extraColumnHeaderPopupActions.map((v, b) => /* @__PURE__ */ c(v.menuItem, { column: o, showPopup: () => {
        E(b);
      } }, b))
    ] }),
    S.map(
      (v) => v.findIndex((b) => b.enabled === !0) !== -1 && /* @__PURE__ */ c(B.Section, { children: v.map(
        (b) => b.enabled && /* @__PURE__ */ y(
          B.Section.Button,
          {
            onClick: b.action,
            disabled: b.disabled,
            children: [
              /* @__PURE__ */ c(b.icon, { className: "w-4 h-4 mr-2" }),
              /* @__PURE__ */ c("span", { children: b.name })
            ]
          },
          b.name
        )
      ) }, v[0].name)
    )
  ] });
}
function Ds({
  colId: e,
  deleteCallback: t,
  sortCallback: n,
  filterCallback: r
}) {
  const [o, l] = O(W(() => me(e), [e])), i = o.type === "custom" ? o.icon : Xe(o.type).icon, [s, u] = H(o.width), [a, p] = H(!1), d = W(() => Qe(e), [e]), [g, h] = O(d), [R] = O(oe);
  function C(w) {
    w.preventDefault();
    const x = w.pageX, M = s;
    p(!0);
    function F(j) {
      const S = Math.max(
        128,
        M + j.pageX - x
      );
      u(S), l({ width: S });
    }
    window.addEventListener("mousemove", F), window.addEventListener("mouseup", () => {
      window.removeEventListener("mousemove", F), p(!1);
    });
  }
  return /* @__PURE__ */ y("div", { className: "relative", children: [
    /* @__PURE__ */ y(
      re,
      {
        isOpen: R.editColumns.enabled && o.isEditable && g && o.type !== "custom",
        setIsOpen: h,
        portal: !0,
        children: [
          /* @__PURE__ */ y(
            "div",
            {
              className: "p-1 px-2 font-normal flex items-center border-r hover:bg-hover-light h-8",
              style: { width: s },
              children: [
                i && /* @__PURE__ */ c(i, { className: "w-4 h-4 mr-2 shrink-0" }),
                /* @__PURE__ */ c("span", { className: "whitespace-nowrap truncate", children: o.name })
              ]
            }
          ),
          /* @__PURE__ */ c(
            Is,
            {
              colId: e,
              deleteCallback: t,
              sortCallback: n,
              filterCallback: r
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ c(
      "div",
      {
        className: U(
          "h-full w-[5px] hover:bg-blue-500/30 absolute -right-[3px] top-0 cursor-ew-resize z-10",
          a && "bg-blue-500/30"
        ),
        onMouseDown: C,
        role: "none"
      }
    )
  ] });
}
const Ps = Ge.forwardRef((e, t) => {
  const [n] = O(se), [r] = O(uo), o = Nt(fo), [l] = O(Mt), [i] = O(Se), [, s] = O(io), [, u] = O(Dn), [, a] = O(Fn), p = Y(
    (w) => {
      a({ filtering: w });
    },
    [a]
  ), d = Y(
    (w) => {
      u({ sorting: w });
    },
    [u]
  ), [, g] = O(lo), h = Y((w) => {
    if (l.find((x) => x.columnId === w.id)) {
      const x = l.filter((M) => M.columnId !== w.id);
      d(x);
    }
    g({ id: w.id });
  });
  function R(w) {
    w.preventDefault(), s({
      id: Je(),
      name: `Column-${ht()}`,
      type: "text",
      width: 192,
      position: n.length,
      isVisible: !0,
      isEditable: !0
    });
  }
  const [C] = O(oe);
  return /* @__PURE__ */ c("div", { className: "flex bg-header border-b z-10", children: /* @__PURE__ */ y("div", { className: "flex relative h-8", ref: t, children: [
    /* @__PURE__ */ y(
      "div",
      {
        className: U(
          "h-8 text-sm inline-flex flex-row",
          i.length > 0 && "ml-[17px]"
        ),
        children: [
          C.selectRow.enabled && /* @__PURE__ */ c(
            "div",
            {
              className: "border-r px-4 flex items-center justify-center h-8",
              style: { width: 64 },
              children: /* @__PURE__ */ c(Ht, { checked: r, toggle: o })
            }
          ),
          n.map((w) => /* @__PURE__ */ c(
            Ds,
            {
              colId: w,
              sortCallback: d,
              filterCallback: p,
              deleteCallback: h
            },
            w
          )),
          C.addColumn.enabled && /* @__PURE__ */ c(
            "div",
            {
              onClick: R,
              className: "rs-btn h-8 p-1 cursor-pointer border-r hover:bg-hover-light font-normal w-16 flex items-center justify-center",
              "aria-label": "add-column",
              onKeyDown: (w) => {
                w.code === "Enter" && R(w);
              },
              children: /* @__PURE__ */ c($t, { className: "w-4 h-4" })
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ c("div", { className: "w-32 shrink-0 grow" })
  ] }) });
}), Fs = Ps;
function js(e, t) {
  let n = null;
  return (...r) => {
    window.clearTimeout(n), n = window.setTimeout(() => {
      e.apply(null, r);
    }, t);
  };
}
const Vs = [
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
function Ee({
  options: e = Vs,
  value: t = {},
  onSelect: n
}) {
  const [r, o] = H(!1), [l, i] = H(t), s = e.find((a) => a.value === l.value);
  function u(a) {
    i(a), o(!1), n == null || n(a);
  }
  return /* @__PURE__ */ c("div", { className: "w-full relative", children: /* @__PURE__ */ y(
    re,
    {
      isOpen: r,
      setIsOpen: o,
      offset: 4,
      portal: !0,
      children: [
        /* @__PURE__ */ y("div", { className: "rs-btn flex flex-row relative w-full border rounded p-1 pl-2 items-center hover:bg-hover focus:outline-none cursor-default", children: [
          /* @__PURE__ */ c("div", { className: "text-ellipsis flex-grow text-left whitespace-nowrap overflow-hidden", children: l.name ? /* @__PURE__ */ c("span", { children: l.name }) : /* @__PURE__ */ c("span", { className: "text-secondary", children: "Select" }) }),
          /* @__PURE__ */ c(ni, { className: "w-4 h-4 duration-100 ml-auto" })
        ] }),
        /* @__PURE__ */ c("div", { className: "min-w-full w-max focus:outline-none", children: /* @__PURE__ */ y(B, { children: [
          /* @__PURE__ */ c("div", { className: "w-48" }),
          /* @__PURE__ */ c(B.Section, { children: e.map((a) => /* @__PURE__ */ y(
            B.Section.Button,
            {
              onClick: () => {
                u(a);
              },
              children: [
                /* @__PURE__ */ c("span", { children: a.name }),
                /* @__PURE__ */ c("span", { className: "ml-auto", children: s.value === a.value && /* @__PURE__ */ c(Pt, { className: "w-4 h-4" }) })
              ]
            },
            a.value
          )) })
        ] }) })
      ]
    }
  ) });
}
function _s({ columns: e, filter: t, setFilter: n }) {
  const [r, o] = H(null), l = [
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
  ], i = [
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
  K(() => {
    r && r.focus();
  }, [r]);
  const s = W(
    () => js((a, p) => {
      n((d) => {
        const g = d.findIndex((h) => h.id === a.id);
        return [
          ...d.slice(0, g),
          {
            ...d[g],
            value: p
          },
          ...d.slice(g + 1, d.length)
        ];
      });
    }, 150),
    []
  );
  function u(a) {
    var p;
    return (p = e.find((d) => d.id === a)) == null ? void 0 : p.type;
  }
  return /* @__PURE__ */ y(B, { children: [
    /* @__PURE__ */ c("div", { className: "w-56" }),
    t.length > 0 ? /* @__PURE__ */ y(B.Section, { children: [
      /* @__PURE__ */ c("h3", { className: "text-sm mb-3 px-3 font-medium", children: "Filter By" }),
      /* @__PURE__ */ c("div", { className: "px-3 flex flex-col space-y-3", children: t.map((a) => /* @__PURE__ */ y(
        "div",
        {
          className: "flex flex-row space-x-2",
          children: [
            /* @__PURE__ */ c("div", { className: "w-36", children: /* @__PURE__ */ c(
              Ee,
              {
                options: e.map((p) => ({
                  value: p.id,
                  name: p.name
                })),
                value: {
                  value: a.columnId,
                  name: e.find((p) => p.id === a.columnId).name
                },
                onSelect: (p) => n((d) => {
                  const g = d.findIndex((h) => h.id === a.id);
                  return [
                    ...d.slice(0, g),
                    {
                      ...d[g],
                      type: u(p.value) === "number" ? "equals" : "contains",
                      columnId: p.value
                    },
                    ...d.slice(g + 1, d.length)
                  ];
                })
              }
            ) }),
            /* @__PURE__ */ c("div", { className: "w-28", children: /* @__PURE__ */ c(
              Ee,
              {
                options: u(a.columnId) === "number" ? i : l,
                value: u(a.columnId) === "number" ? i.find(
                  (p) => p.value === a.type
                ) : l.find((p) => p.value === a.type),
                onSelect: (p) => n((d) => {
                  const g = d.findIndex((h) => h.id === a.id);
                  return [
                    ...d.slice(0, g),
                    {
                      ...d[g],
                      type: p.value
                    },
                    ...d.slice(g + 1, d.length)
                  ];
                })
              }
            ) }),
            /* @__PURE__ */ c("div", { className: "w-36", children: /* @__PURE__ */ c(
              "input",
              {
                type: "text",
                className: "rs-input border h-full rounded w-full focus:outline-none focus:ring px-2 p-1",
                defaultValue: a.value,
                placeholder: "Type a value...",
                onChange: (p) => s(a, p.target.value)
              }
            ) }),
            /* @__PURE__ */ c(
              "div",
              {
                className: "rs-btn flex items-center justify-center hover:bg-hover-light px-2 rounded hover:cursor-pointer",
                onClick: () => n((p) => p.filter((d) => d.id !== a.id)),
                "aria-label": "cancel-filter",
                children: /* @__PURE__ */ c(it, { className: "h-4 w-4" })
              }
            )
          ]
        },
        `filter-${a.columnId}`
      )) }),
      /* @__PURE__ */ c("div", { className: "py-2 px-3", children: /* @__PURE__ */ y(
        "button",
        {
          className: "rs-btn flex items-center justify-center bg-transparent rounded gap-x-1 h-6 font-thin hover:cursor-pointer text-sm p-0",
          onClick: () => n((a) => [
            ...a,
            {
              id: ht(),
              columnId: e[0].id,
              type: "contains",
              value: ""
            }
          ]),
          "aria-label": "add-condition",
          type: "button",
          children: [
            /* @__PURE__ */ c($t, { className: "h-3 w-3" }),
            /* @__PURE__ */ c("span", { children: "Add condition" })
          ]
        }
      ) })
    ] }) : /* @__PURE__ */ c(
      je,
      {
        options: e.map((a) => ({
          value: a.id,
          name: a.name
        })),
        onSelect: (a) => n([
          {
            id: ht(),
            columnId: a.value,
            type: u(a.value) === "number" ? "equals" : "contains",
            value: ""
          }
        ]),
        inputRef: o,
        placeholder: "Filter by..."
      }
    )
  ] });
}
function Bs({ setFilter: e }) {
  const [t] = O(Pn), [n] = O(eo), [r, o] = O(In);
  return /* @__PURE__ */ y(
    re,
    {
      isOpen: r,
      setIsOpen: o,
      offset: 4,
      portal: !0,
      portalId: "table",
      children: [
        Object.keys(t).length > 0 ? /* @__PURE__ */ y("div", { className: "rs-btn h-8 hover:ring-2 hover:ring-black/10 hover:ring-inset bg-indigo-200 px-3 rounded text-sm flex row items-center cursor-default text-dark", children: [
          /* @__PURE__ */ c(Et, { className: "w-4 h-4 mr-1" }),
          /* @__PURE__ */ c("span", { children: `Filtered by ${Object.keys(t).length} field` })
        ] }) : /* @__PURE__ */ y(
          "div",
          {
            className: U(
              "rs-btn h-8 hover:bg-hover px-3 rounded text-sm flex flex-row items-center cursor-default",
              r && "bg-hover"
            ),
            children: [
              /* @__PURE__ */ c(Et, { className: "w-4 h-4 mr-1" }),
              /* @__PURE__ */ c("span", { children: "Filter data" })
            ]
          }
        ),
        /* @__PURE__ */ c(_s, { columns: n, filter: t, setFilter: e })
      ]
    }
  );
}
function bn({ ...e }) {
  return /* @__PURE__ */ c(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...e,
      children: /* @__PURE__ */ c(
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
function Hs({ columns: e, grouping: t, setGroup: n }) {
  const [r, o] = H(null), l = [
    {
      value: "asc",
      name: "Ascending"
    },
    {
      value: "desc",
      name: "Descending"
    }
  ];
  return K(() => {
    r && r.focus();
  }, [r]), /* @__PURE__ */ y(B, { children: [
    /* @__PURE__ */ c("div", { className: "w-56" }),
    t.length > 0 ? /* @__PURE__ */ y(B.Section, { children: [
      /* @__PURE__ */ c("h3", { className: "text-sm mb-3 px-3 font-medium", children: "Group By" }),
      /* @__PURE__ */ c("div", { className: "px-3", children: t.map((i) => /* @__PURE__ */ y(
        "div",
        {
          className: "flex flex-row space-x-2",
          children: [
            /* @__PURE__ */ c("div", { className: "w-36", children: /* @__PURE__ */ c(
              Ee,
              {
                options: e.map((s) => ({
                  value: s.id,
                  name: s.name
                })),
                value: {
                  value: i.columnId,
                  name: e.find((s) => s.id === i.columnId).name
                },
                onSelect: (s) => n([{ columnId: s.value, order: "asc" }])
              }
            ) }),
            /* @__PURE__ */ c("div", { className: "w-28", children: /* @__PURE__ */ c(
              Ee,
              {
                options: l,
                value: l.find((s) => s.value === i.order),
                onSelect: (s) => n([
                  {
                    columnId: i.columnId,
                    order: s.value
                  }
                ])
              }
            ) }),
            /* @__PURE__ */ c(
              "div",
              {
                className: "rs-btn flex items-center justify-center hover:bg-hover-light px-2 rounded",
                onClick: () => n([]),
                "aria-label": "cancel-grouping",
                children: /* @__PURE__ */ c(it, { className: "h-4 w-4" })
              }
            )
          ]
        },
        `grouping-${i.columnId}`
      )) })
    ] }) : /* @__PURE__ */ c(
      je,
      {
        options: e.filter((i) => i.type !== "custom").map((i) => ({
          value: i.id,
          name: i.name
        })),
        onSelect: (i) => n([{ columnId: i.value, order: "asc" }]),
        inputRef: o,
        placeholder: "Group by..."
      }
    )
  ] });
}
function $s({ grouping: e = [], setGroup: t }) {
  const [n, r] = H(!1), [o] = O(Mn);
  return /* @__PURE__ */ y(
    re,
    {
      isOpen: n,
      setIsOpen: r,
      offset: 4,
      portal: !0,
      portalId: "table",
      children: [
        e.length > 0 ? /* @__PURE__ */ y("div", { className: "rs-btn h-8 hover:ring-2 hover:ring-black/10 hover:ring-inset bg-purple-200 px-3 rounded text-sm flex row items-center cursor-default text-dark", children: [
          /* @__PURE__ */ c(bn, { className: "w-4 h-4 mr-1" }),
          /* @__PURE__ */ c("span", { children: "Grouped by 1 field" })
        ] }) : /* @__PURE__ */ y(
          "div",
          {
            className: U(
              "rs-btn hover:bg-hover px-3 rounded flex flex-row items-center h-8 cursor-default",
              n && "bg-hover"
            ),
            children: [
              /* @__PURE__ */ c(bn, { className: "w-4 h-4 mr-1" }),
              /* @__PURE__ */ c("span", { children: "Group" })
            ]
          }
        ),
        /* @__PURE__ */ c(Hs, { columns: o, grouping: e, setGroup: t })
      ]
    }
  );
}
function Ws({ value: e, setValue: t }) {
  return /* @__PURE__ */ y(X, { children: [
    /* @__PURE__ */ c("input", { type: "checkbox", checked: e, className: "hidden", readOnly: !0 }),
    /* @__PURE__ */ c(
      "div",
      {
        className: U(
          "rs-btn rounded-full w-7 h-4 flex items-center cursor-pointer border transition duration-200 ease-in-out",
          e ? "bg-green-500 border-black/10" : "bg-background"
        ),
        onClick: () => t(!e),
        "aria-label": "toggle",
        children: /* @__PURE__ */ c(
          "div",
          {
            className: U(
              "rounded-full h-2.5 w-2.5 bg-white outline outline-1 transition duration-200 ease-in-out ml-0.5",
              e ? "translate-x-3 outline-black/10" : "outline-slate-300"
            )
          }
        )
      }
    )
  ] });
}
function Us({ colId: e }) {
  const [t, n] = O(W(() => me(e), [e]));
  return /* @__PURE__ */ y(B.Section.Item, { children: [
    /* @__PURE__ */ c(
      Ws,
      {
        value: t.isVisible,
        setValue: (r) => n({ isVisible: r })
      }
    ),
    /* @__PURE__ */ c("span", { className: "ml-2", children: t.name })
  ] }, t.id);
}
function Zs({ setColumnVisibility: e }) {
  const [t] = O(to);
  return /* @__PURE__ */ y(B, { children: [
    /* @__PURE__ */ c("div", { className: "w-48" }),
    /* @__PURE__ */ c(B.Section, { children: t.map((n) => /* @__PURE__ */ c(Us, { colId: n })) })
  ] });
}
function Ks({ setColumnVisibility: e }) {
  const [t, n] = H(!1), [r] = O(no);
  return /* @__PURE__ */ y(re, { isOpen: t, setIsOpen: n, offset: 4, portal: !0, children: [
    r > 0 ? /* @__PURE__ */ y("div", { className: "rs-btn h-8 hover:ring-2 hover:ring-black/10 hover:ring-inset bg-green-200 px-3 rounded text-sm flex row items-center focus:outline-none cursor-default text-dark", children: [
      /* @__PURE__ */ c(Jt, { className: "w-4 h-4 mr-1" }),
      /* @__PURE__ */ c("span", { children: `${r} hidden fields` })
    ] }) : /* @__PURE__ */ y(
      "div",
      {
        className: U(
          "rs-btn hover:bg-hover px-3 rounded flex flex-row items-center h-8 focus:outline-none cursor-default",
          t && "bg-hover"
        ),
        children: [
          /* @__PURE__ */ c(Jt, { className: "w-4 h-4 mr-1" }),
          /* @__PURE__ */ c("span", { children: "Hide fields" })
        ]
      }
    ),
    /* @__PURE__ */ c(Zs, { setColumnVisibility: e })
  ] });
}
function qs({ ...e }) {
  return /* @__PURE__ */ c(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...e,
      children: /* @__PURE__ */ c(
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
function zs({ ...e }) {
  return /* @__PURE__ */ c(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...e,
      children: /* @__PURE__ */ c(
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
function Ys({ ...e }) {
  return /* @__PURE__ */ c(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...e,
      children: /* @__PURE__ */ c(
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
function Xs({ ...e }) {
  return /* @__PURE__ */ c(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...e,
      children: /* @__PURE__ */ c(
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
const fr = [
  {
    value: 32,
    name: "Short",
    icon: qs
  },
  {
    value: 64,
    name: "Medium",
    icon: zs
  },
  {
    value: 96,
    name: "Tall",
    icon: Ys
  },
  {
    value: 128,
    name: "Extra Tall",
    icon: Xs
  }
];
function mr(e) {
  return fr.find((t) => t.value === e);
}
function Gs() {
  return fr.map((e) => e.value);
}
function Js({ height: e, setHeight: t }) {
  const n = Gs();
  return /* @__PURE__ */ y(B, { children: [
    /* @__PURE__ */ c("div", { className: "w-48" }),
    /* @__PURE__ */ c(B.Section, { children: n.map((r) => {
      const o = mr(r);
      return /* @__PURE__ */ y(
        B.Section.Button,
        {
          onClick: () => t(o.value),
          children: [
            /* @__PURE__ */ c(o.icon, { className: "w-4 h-4 mr-2" }),
            o.name,
            o.value === e && /* @__PURE__ */ c(Pt, { className: "w-4 h-4 ml-auto" })
          ]
        },
        o.value
      );
    }) })
  ] });
}
function Qs({ height: e, setHeight: t }) {
  const [n, r] = H(!1), o = mr(e);
  return /* @__PURE__ */ y(
    re,
    {
      isOpen: n,
      setIsOpen: r,
      offset: 4,
      portal: !0,
      portalId: "table",
      children: [
        /* @__PURE__ */ c(
          "div",
          {
            className: U(
              "rs-btn hover:bg-hover px-3 rounded flex flex-row items-center h-8 focus:outline-none cursor-default",
              n && "bg-hover"
            ),
            "aria-label": "height-selector",
            children: /* @__PURE__ */ c(o.icon, { className: "w-4 h-4 mr-1" })
          }
        ),
        /* @__PURE__ */ c(Js, { height: e, setHeight: t })
      ]
    }
  );
}
function ec({ active: e, Icon: t, text: n, bgColor: r }) {
  return /* @__PURE__ */ y(
    "div",
    {
      className: U(
        "rs-btn h-8 hover:ring-2 hover:ring-black/10 hover:ring-inset bg-orange-200 px-3 rounded flex items-center gap-x-1 cursor-default text-dark",
        r && r
      ),
      children: [
        t && /* @__PURE__ */ c(t, { className: "w-4 h-4" }),
        /* @__PURE__ */ c("span", { children: n })
      ]
    }
  );
}
function tc({ sort: e, setSort: t }) {
  const [n, r] = H(null), [o] = O(Mn), l = [
    {
      value: "asc",
      name: "Ascending"
    },
    {
      value: "desc",
      name: "Descending"
    }
  ];
  return K(() => {
    n && n.focus();
  }, [n]), /* @__PURE__ */ y(B, { children: [
    /* @__PURE__ */ c("div", { className: "w-56" }),
    e.length > 0 ? /* @__PURE__ */ y(B.Section, { children: [
      /* @__PURE__ */ c("h3", { className: "text-sm mb-3 px-3 font-medium", children: "Sort By" }),
      /* @__PURE__ */ c("div", { className: "px-3", children: e.map((i) => /* @__PURE__ */ y(
        "div",
        {
          className: "flex flex-row space-x-2",
          children: [
            /* @__PURE__ */ c("div", { className: "w-36", children: /* @__PURE__ */ c(
              Ee,
              {
                options: o.map((s) => ({
                  value: s.id,
                  name: s.name
                })),
                value: {
                  value: i.columnId,
                  name: o.find((s) => s.id === i.columnId).name
                },
                onSelect: (s) => t([{ columnId: s.value, order: "asc" }])
              }
            ) }),
            /* @__PURE__ */ c("div", { className: "w-28", children: /* @__PURE__ */ c(
              Ee,
              {
                options: l,
                value: l.find((s) => s.value === i.order),
                onSelect: (s) => t([
                  {
                    columnId: i.columnId,
                    order: s.value
                  }
                ])
              }
            ) }),
            /* @__PURE__ */ c(
              "div",
              {
                className: "rs-btn flex items-center justify-center hover:bg-hover-light px-2 rounded",
                onClick: () => t([]),
                "aria-label": "cancel-sort",
                children: /* @__PURE__ */ c(it, { className: "h-4 w-4" })
              }
            )
          ]
        },
        `sort-${i.columnId}`
      )) })
    ] }) : /* @__PURE__ */ c(
      je,
      {
        options: o.filter((i) => i.type !== "custom").map((i) => ({
          value: i.id,
          name: i.name
        })),
        onSelect: (i) => t([{ columnId: i.value, order: "asc" }]),
        inputRef: r,
        placeholder: "Sort by..."
      }
    )
  ] });
}
function nc({ setSort: e }) {
  const [t] = O(Mt), [n, r] = O(Tn);
  return /* @__PURE__ */ y(
    re,
    {
      isOpen: n,
      setIsOpen: r,
      offset: 4,
      portal: !0,
      portalId: "table",
      children: [
        t.length > 0 ? /* @__PURE__ */ c(
          ec,
          {
            Icon: wn,
            text: `Sorted by ${Object.keys(t).length} field`,
            customColor: "bg-orange-200"
          }
        ) : /* @__PURE__ */ y(
          "div",
          {
            className: U(
              "rs-btn hover:bg-hover px-3 rounded flex flex-row items-center h-8 cursor-default",
              n && "bg-hover"
            ),
            children: [
              /* @__PURE__ */ c(wn, { className: "w-4 h-4 mr-1" }),
              /* @__PURE__ */ c("span", { children: "Sort data" })
            ]
          }
        ),
        /* @__PURE__ */ c(tc, { sort: t, setSort: e })
      ]
    }
  );
}
function rc() {
  const [e] = O(Qr), [t] = O(Pn), [n] = O(Mt), [r] = O(Se), [o] = O(It), [l] = O(Jr), [, i] = O(Fn), s = Nt(mo), [, u] = O(Yr), [, a] = O(Ln), [, p] = O(Xr), [d] = O(oe), g = Y((S) => {
    i({ filtering: S });
  }, []), h = Y((S) => {
    S.preventDefault(), u();
  }, []);
  function R(S) {
    a({ id: Je() });
  }
  const [, C] = O(Dn), w = Y((S) => {
    C({ sorting: S });
  }, []), [, x] = O(ao), M = Y((S) => {
    x({ rowHeight: S });
  }, []), [, F] = O(co), j = Y((S) => {
    F({ grouping: S });
  }, []);
  return /* @__PURE__ */ c(
    "div",
    {
      className: "w-full bg-content py-2 text-sm overflow-y-hidden h-12 relative border-b",
      id: "toolbar",
      children: /* @__PURE__ */ y("div", { className: "flex flex-row space-x-2 px-3 items-center whitespace-nowrap h-full", children: [
        /* @__PURE__ */ y("div", { className: "items-center flex w-20 justify-center", children: [
          l > 0 ? l : "No",
          " row",
          l !== 1 && "s"
        ] }),
        e > 0 && /* @__PURE__ */ y("div", { className: "bg-header flex flex-row rounded items-center h-8 cursor-default", children: [
          /* @__PURE__ */ y("div", { className: "text-sm px-2 rounded-l", children: [
            e,
            " row",
            e !== 1 && "s",
            " selected"
          ] }),
          /* @__PURE__ */ c("div", { className: "bg-content h-4 w-px last:hidden" }),
          /* @__PURE__ */ y(
            "div",
            {
              className: "rs-btn self-stretch hover:bg-hover-light px-2 text-sm flex flex-row items-center",
              onClick: () => s(),
              children: [
                /* @__PURE__ */ c(it, { className: "w-4 h-4 mr-1" }),
                /* @__PURE__ */ c("span", { children: "Cancel" })
              ]
            }
          ),
          /* @__PURE__ */ c("div", { className: "bg-content h-4 w-px last:hidden" }),
          /* @__PURE__ */ y(
            "div",
            {
              className: "rs-btn self-stretch hover:bg-hover-light px-2 rounded-r text-sm flex flex-row items-center",
              onClick: h,
              children: [
                /* @__PURE__ */ c(Wo, { className: "w-4 h-4 mr-1" }),
                /* @__PURE__ */ c("span", { children: "Delete" })
              ]
            }
          ),
          /* @__PURE__ */ c("div", { className: "bg-content h-4 w-px last:hidden" }),
          d.rowSelectionButtons.map((S) => /* @__PURE__ */ y(X, { children: [
            /* @__PURE__ */ c(
              "div",
              {
                className: "rs-btn self-stretch hover:bg-hover-light px-2 rounded-r text-sm flex flex-row items-center",
                onClick: () => p({
                  handler: S.handler
                }),
                children: S.body
              }
            ),
            /* @__PURE__ */ c("div", { className: "bg-content h-4 w-px last:hidden" })
          ] }))
        ] }),
        /* @__PURE__ */ c("div", { className: "h-4 border" }),
        d.addRow.enabled && d.addRow.toolbar && /* @__PURE__ */ y(
          "div",
          {
            className: "rs-btn hover:bg-hover px-3 rounded flex flex-row items-center h-8 focus:outline-none",
            onClick: R,
            children: [
              /* @__PURE__ */ c($t, { className: "w-4 h-4 mr-1" }),
              /* @__PURE__ */ c("span", { children: "New row" })
            ]
          }
        ),
        d.hideFields.enabled && /* @__PURE__ */ c(Ks, {}),
        d.filtering.enabled && /* @__PURE__ */ c(Bs, { filter: t, setFilter: g }),
        d.grouping.enabled && /* @__PURE__ */ c($s, { grouping: r, setGroup: j }),
        d.sorting.enabled && /* @__PURE__ */ c(nc, { sort: n, setSort: w }),
        d.rowHeight.enabled && /* @__PURE__ */ c(Qs, { height: o, setHeight: M })
      ] })
    }
  );
}
const oc = {
  light: "",
  dark: "dark"
};
function ic() {
  const e = ce(null), t = ce(null), n = ce(null), [r] = O(oe);
  K(() => {
    if (!n.current)
      return () => null;
    function i(s) {
      e.current.scrollLeft = n.current.scrollLeft, e.current.style.transform = `translate3d(-${n.current.scrollLeft}px, 0, 0)`, t.current && (t.current.style.transform = `translate3d(-${n.current.scrollLeft}px, 0, 0)`);
    }
    n.current.addEventListener("scroll", i);
  }, []), K(() => {
    if (!e.current)
      return () => null;
    function i(s) {
      s.preventDefault(), n.current.scrollLeft += s.deltaX;
    }
    e.current.addEventListener("mousewheel", i, {
      passive: !1
    });
  }, []), K(() => {
    if (!t.current)
      return () => null;
    function i(s) {
      s.preventDefault(), n.current.scrollLeft += s.deltaX;
    }
    t.current.addEventListener("mousewheel", i, {
      passive: !1
    });
  }, []);
  const [o, l] = O(On);
  return K(() => {
    l(Je());
  }, []), /* @__PURE__ */ y(
    "div",
    {
      className: U(
        "h-full w-full relative rs-table text-sm text-primary overflow-hidden",
        oc[r.theme.color]
      ),
      id: o,
      children: [
        r.toolbar.enabled && /* @__PURE__ */ c(rc, {}),
        /* @__PURE__ */ y("div", { className: "h-[calc(100%-48px)] overflow-hidden", children: [
          /* @__PURE__ */ c(Fs, { ref: e }),
          /* @__PURE__ */ c(fs, { ref: n }),
          r.footer.enabled && /* @__PURE__ */ c(ps, { ref: t })
        ] })
      ]
    }
  );
}
function lc({ data: e, columns: t, onChange: n, config: r, children: o }) {
  return Ir([
    [oo, t],
    [Gr, e],
    [qr, { onChange: n }],
    [Kr, r]
  ]), o;
}
function fc({
  data: e,
  columns: t,
  onChange: n = () => null,
  config: r = {},
  licenseKey: o
}) {
  return K(() => {
    wo(o);
  }, []), /* @__PURE__ */ c(Ar, { children: /* @__PURE__ */ c(
    lc,
    {
      data: e,
      columns: t,
      onChange: n,
      config: r,
      children: /* @__PURE__ */ c(ic, {})
    }
  ) });
}
export {
  vo as EVALUATION_LICENSE,
  fc as default
};
