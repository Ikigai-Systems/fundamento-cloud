import "./main.css";
import { jsxs as y, jsx as c, Fragment as X } from "react/jsx-runtime";
import * as m from "react";
import Ge, { createContext as pr, useRef as ae, createElement as gr, useCallback as Y, useContext as vr, useReducer as wr, useEffect as Z, useDebugValue as br, useState as H, useLayoutEffect as xn, Children as xr, useMemo as W, forwardRef as yn } from "react";
import * as yr from "react-dom";
import { createPortal as Cr } from "react-dom";
var z = { BASE_URL: "/", MODE: "production", DEV: !1, PROD: !0, SSR: !1 };
let Rr = 0;
function T(e, t) {
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
const st = (e) => "init" in e, ct = (e) => !!e.write, $e = /* @__PURE__ */ new WeakMap(), Er = (e, t) => {
  $e.set(e, t), e.catch(() => {
  }).finally(() => $e.delete(e));
}, Ut = (e, t) => {
  const n = $e.get(e);
  n && ($e.delete(e), n(t));
}, Kt = (e, t) => {
  e.status = "fulfilled", e.value = t;
}, Zt = (e, t) => {
  e.status = "rejected", e.reason = t;
}, Sr = (e) => typeof (e == null ? void 0 : e.then) == "function", Oe = (e, t) => !!e && "v" in e && "v" in t && Object.is(e.v, t.v), qt = (e, t) => !!e && "e" in e && "e" in t && Object.is(e.e, t.e), xe = (e) => !!e && "v" in e && e.v instanceof Promise, Nr = (e, t) => "v" in e && "v" in t && e.v.orig && e.v.orig === t.v.orig, _e = (e) => {
  if ("e" in e)
    throw e.e;
  return e.v;
}, Cn = () => {
  const e = /* @__PURE__ */ new WeakMap(), t = /* @__PURE__ */ new WeakMap(), n = /* @__PURE__ */ new Map();
  let r, o;
  (z ? "production" : void 0) !== "production" && (r = /* @__PURE__ */ new Set(), o = /* @__PURE__ */ new Set());
  const l = (p) => e.get(p), i = (p, S) => {
    (z ? "production" : void 0) !== "production" && Object.freeze(S);
    const v = e.get(p);
    if (e.set(p, S), n.has(p) || n.set(p, v), xe(v)) {
      const x = "v" in S ? S.v instanceof Promise ? S.v : Promise.resolve(S.v) : Promise.reject(S.e);
      v.v !== x && Ut(v.v, x);
    }
  }, a = (p, S, v) => {
    const x = /* @__PURE__ */ new Map();
    let E = !1;
    v.forEach((P, A) => {
      !P && A === p && (P = S), P ? (x.set(A, P), S.d.get(A) !== P && (E = !0)) : (z ? "production" : void 0) !== "production" && console.warn("[Bug] atom state not found");
    }), (E || S.d.size !== x.size) && (S.d = x);
  }, u = (p, S, v) => {
    const x = l(p), E = {
      d: (x == null ? void 0 : x.d) || /* @__PURE__ */ new Map(),
      v: S
    };
    if (v && a(p, E, v), Oe(x, E) && x.d === E.d)
      return x;
    if (xe(x) && xe(E) && Nr(x, E)) {
      if (x.d === E.d)
        return x;
      E.v = x.v;
    }
    return i(p, E), E;
  }, s = (p, S, v, x) => {
    if (Sr(S)) {
      let E;
      const P = () => {
        const k = l(p);
        if (!xe(k) || k.v !== A)
          return;
        const I = u(
          p,
          A,
          v
        );
        t.has(p) && k.d !== I.d && N(p, I, k.d);
      }, A = new Promise((k, I) => {
        let D = !1;
        S.then(
          (M) => {
            D || (D = !0, Kt(A, M), k(M), P());
          },
          (M) => {
            D || (D = !0, Zt(A, M), I(M), P());
          }
        ), E = (M) => {
          D || (D = !0, M.then(
            (K) => Kt(A, K),
            (K) => Zt(A, K)
          ), k(M));
        };
      });
      return A.orig = S, A.status = "pending", Er(A, (k) => {
        k && E(k), x == null || x();
      }), u(p, A, v);
    }
    return u(p, S, v);
  }, f = (p, S, v) => {
    const x = l(p), E = {
      d: (x == null ? void 0 : x.d) || /* @__PURE__ */ new Map(),
      e: S
    };
    return v && a(p, E, v), qt(x, E) && x.d === E.d ? x : (i(p, E), E);
  }, d = (p, S) => {
    const v = l(p);
    if (!S && v && (t.has(p) || Array.from(v.d).every(([D, M]) => {
      if (D === p)
        return !0;
      const K = d(D);
      return K === M || Oe(K, M);
    })))
      return v;
    const x = /* @__PURE__ */ new Map();
    let E = !0;
    const P = (D) => {
      if (D === p) {
        const K = l(D);
        if (K)
          return x.set(D, K), _e(K);
        if (st(D))
          return x.set(D, void 0), D.init;
        throw new Error("no atom init");
      }
      const M = d(D);
      return x.set(D, M), _e(M);
    };
    let A, k;
    const I = {
      get signal() {
        return A || (A = new AbortController()), A.signal;
      },
      get setSelf() {
        return (z ? "production" : void 0) !== "production" && !ct(p) && console.warn("setSelf function cannot be used with read-only atom"), !k && ct(p) && (k = (...D) => {
          if ((z ? "production" : void 0) !== "production" && E && console.warn("setSelf function cannot be called in sync"), !E)
            return L(p, ...D);
        }), k;
      }
    };
    try {
      const D = p.read(P, I);
      return s(
        p,
        D,
        x,
        () => A == null ? void 0 : A.abort()
      );
    } catch (D) {
      return f(p, D, x);
    } finally {
      E = !1;
    }
  }, g = (p) => _e(d(p)), h = (p) => {
    let S = t.get(p);
    return S || (S = F(p)), S;
  }, R = (p, S) => !S.l.size && (!S.t.size || S.t.size === 1 && S.t.has(p)), C = (p) => {
    const S = t.get(p);
    S && R(p, S) && j(p);
  }, w = (p) => {
    const S = /* @__PURE__ */ new Map(), v = /* @__PURE__ */ new WeakMap(), x = (A) => {
      var k;
      const I = new Set((k = t.get(A)) == null ? void 0 : k.t);
      return n.forEach((D, M) => {
        var K;
        (K = l(M)) != null && K.d.has(A) && I.add(M);
      }), I;
    }, E = (A) => {
      x(A).forEach((k) => {
        k !== A && (S.set(
          k,
          (S.get(k) || /* @__PURE__ */ new Set()).add(A)
        ), v.set(k, (v.get(k) || 0) + 1), E(k));
      });
    };
    E(p);
    const P = (A) => {
      x(A).forEach((k) => {
        var I;
        if (k !== A) {
          let D = v.get(k);
          if (D && v.set(k, --D), !D) {
            let M = !!((I = S.get(k)) != null && I.size);
            if (M) {
              const K = l(k), Ve = d(k, !0);
              M = !Oe(K, Ve);
            }
            M || S.forEach((K) => K.delete(k));
          }
          P(k);
        }
      });
    };
    P(p);
  }, b = (p, ...S) => {
    let v = !0;
    const x = (A) => _e(d(A)), E = (A, ...k) => {
      let I;
      if (A === p) {
        if (!st(A))
          throw new Error("atom not writable");
        const D = l(A), M = s(A, k[0]);
        Oe(D, M) || w(A);
      } else
        I = b(A, ...k);
      if (!v) {
        const D = _();
        (z ? "production" : void 0) !== "production" && r.forEach(
          (M) => M({ type: "async-write", flushed: D })
        );
      }
      return I;
    }, P = p.write(x, E, ...S);
    return v = !1, P;
  }, L = (p, ...S) => {
    const v = b(p, ...S), x = _();
    return (z ? "production" : void 0) !== "production" && r.forEach(
      (E) => E({ type: "write", flushed: x })
    ), v;
  }, F = (p, S, v) => {
    var x;
    const E = v || [];
    (x = l(p)) == null || x.d.forEach((A, k) => {
      const I = t.get(k);
      I ? I.t.add(p) : k !== p && F(k, p, E);
    }), d(p);
    const P = {
      t: new Set(S && [S]),
      l: /* @__PURE__ */ new Set()
    };
    if (t.set(p, P), (z ? "production" : void 0) !== "production" && o.add(p), ct(p) && p.onMount) {
      const { onMount: A } = p;
      E.push(() => {
        const k = A((...I) => L(p, ...I));
        k && (P.u = k);
      });
    }
    return v || E.forEach((A) => A()), P;
  }, j = (p) => {
    var S;
    const v = (S = t.get(p)) == null ? void 0 : S.u;
    v && v(), t.delete(p), (z ? "production" : void 0) !== "production" && o.delete(p);
    const x = l(p);
    x ? (xe(x) && Ut(x.v), x.d.forEach((E, P) => {
      if (P !== p) {
        const A = t.get(P);
        A && (A.t.delete(p), R(P, A) && j(P));
      }
    })) : (z ? "production" : void 0) !== "production" && console.warn("[Bug] could not find atom state to unmount", p);
  }, N = (p, S, v) => {
    const x = new Set(S.d.keys());
    v == null || v.forEach((E, P) => {
      if (x.has(P)) {
        x.delete(P);
        return;
      }
      const A = t.get(P);
      A && (A.t.delete(p), R(P, A) && j(P));
    }), x.forEach((E) => {
      const P = t.get(E);
      P ? P.t.add(p) : t.has(p) && F(E, p);
    });
  }, _ = () => {
    let p;
    for ((z ? "production" : void 0) !== "production" && (p = /* @__PURE__ */ new Set()); n.size; ) {
      const S = Array.from(n);
      n.clear(), S.forEach(([v, x]) => {
        const E = l(v);
        if (E) {
          const P = t.get(v);
          P && E.d !== (x == null ? void 0 : x.d) && N(v, E, x == null ? void 0 : x.d), P && !// TODO This seems pretty hacky. Hope to fix it.
          // Maybe we could `mountDependencies` in `setAtomState`?
          (!xe(x) && (Oe(x, E) || qt(x, E))) && (P.l.forEach((A) => A()), (z ? "production" : void 0) !== "production" && p.add(v));
        } else
          (z ? "production" : void 0) !== "production" && console.warn("[Bug] no atom state to flush");
      });
    }
    if ((z ? "production" : void 0) !== "production")
      return p;
  }, V = (p, S) => {
    const v = h(p), x = _(), E = v.l;
    return E.add(S), (z ? "production" : void 0) !== "production" && r.forEach(
      (P) => P({ type: "sub", flushed: x })
    ), () => {
      E.delete(S), C(p), (z ? "production" : void 0) !== "production" && r.forEach((P) => P({ type: "unsub" }));
    };
  };
  return (z ? "production" : void 0) !== "production" ? {
    get: g,
    set: L,
    sub: V,
    // store dev methods (these are tentative and subject to change without notice)
    dev_subscribe_store: (p, S) => {
      if (S !== 2)
        throw new Error("The current StoreListener revision is 2.");
      return r.add(p), () => {
        r.delete(p);
      };
    },
    dev_get_mounted_atoms: () => o.values(),
    dev_get_atom_state: (p) => e.get(p),
    dev_get_mounted: (p) => t.get(p),
    dev_restore_atoms: (p) => {
      for (const [v, x] of p)
        st(v) && (s(v, x), w(v));
      const S = _();
      r.forEach(
        (v) => v({ type: "restore", flushed: S })
      );
    }
  } : {
    get: g,
    set: L,
    sub: V
  };
};
let at;
(z ? "production" : void 0) !== "production" && (typeof globalThis.__NUMBER_OF_JOTAI_INSTANCES__ == "number" ? ++globalThis.__NUMBER_OF_JOTAI_INSTANCES__ : globalThis.__NUMBER_OF_JOTAI_INSTANCES__ = 1);
const kr = () => (at || ((z ? "production" : void 0) !== "production" && globalThis.__NUMBER_OF_JOTAI_INSTANCES__ !== 1 && console.warn(
  "Detected multiple Jotai instances. It may cause unexpected behavior with the default store. https://github.com/pmndrs/jotai/discussions/2044"
), at = Cn()), at);
var Or = { BASE_URL: "/", MODE: "production", DEV: !1, PROD: !0, SSR: !1 };
const Rn = pr(void 0), Nt = (e) => {
  const t = vr(Rn);
  return (e == null ? void 0 : e.store) || t || kr();
}, Ar = ({
  children: e,
  store: t
}) => {
  const n = ae();
  return !t && !n.current && (n.current = Cn()), gr(
    Rn.Provider,
    {
      value: t || n.current
    },
    e
  );
}, Mr = (e) => typeof (e == null ? void 0 : e.then) == "function", Lr = Ge.use || ((e) => {
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
function Dr(e, t) {
  const n = Nt(t), [[r, o, l], i] = wr(
    (s) => {
      const f = n.get(e);
      return Object.is(s[0], f) && s[1] === n && s[2] === e ? s : [f, n, e];
    },
    void 0,
    () => [n.get(e), n, e]
  );
  let a = r;
  (o !== n || l !== e) && (i(), a = n.get(e));
  const u = t == null ? void 0 : t.delay;
  return Z(() => {
    const s = n.sub(e, () => {
      if (typeof u == "number") {
        setTimeout(i, u);
        return;
      }
      i();
    });
    return i(), s;
  }, [n, e, u]), br(a), Mr(a) ? Lr(a) : a;
}
function kt(e, t) {
  const n = Nt(t);
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
    Dr(e, t),
    // We do wrong type assertion here, which results in throwing an error.
    kt(e, t)
  ];
}
const zt = /* @__PURE__ */ new WeakMap();
function Ir(e, t) {
  const n = Nt(t), r = Tr(n);
  for (const [o, l] of e)
    (!r.has(o) || t != null && t.dangerouslyForceHydrate) && (r.add(o), n.set(o, l));
}
const Tr = (e) => {
  let t = zt.get(e);
  return t || (t = /* @__PURE__ */ new WeakSet(), zt.set(e, t)), t;
};
let Pr = (e) => crypto.getRandomValues(new Uint8Array(e)), Fr = (e, t, n) => {
  let r = (2 << Math.log(e.length - 1) / Math.LN2) - 1, o = -~(1.6 * r * t / e.length);
  return (l = t) => {
    let i = "";
    for (; ; ) {
      let a = n(o), u = o;
      for (; u--; )
        if (i += e[a[u] & r] || "", i.length === l)
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
function pt() {
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
function gt() {
  return `hsl(${Math.floor(Math.random() * 360)}, 100%, 92%)`;
}
function Vr(e, t, n) {
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
function _r(e, t) {
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
const Sn = "update_column", Br = "delete_column", Hr = "add_row", $r = "delete_rows", Wr = "update_row", Nn = "update_rows", Ur = "add_column", Ot = (e, t) => e + t, kn = (e, t) => {
  if (e === void 0)
    return t;
  for (const n of Object.keys(t))
    t[n] instanceof Object && Object.assign(t[n], kn(e[n], t[n]));
  return Object.assign(e || {}, t), e;
}, vt = {
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
  parseDate: void 0,
  formatStoredDate: void 0,
  formatDisplayDate: void 0,
  parseNumber: void 0,
  formatDisplayNumber: void 0
}, Qe = T(vt), re = T((e) => e(Qe)), Kr = T(null, (e, t, n) => {
  vt.rowSelectionButtons = [], t(Qe, kn(vt, n));
}), On = T(""), ne = T({ onChange: () => null }), Zr = T(
  null,
  (e, t, n) => t(ne, n)
);
T(null, (e, t, n) => {
  t(ne, { onChange: n });
});
const $ = T({}), qr = (e) => T((t) => new Set(Object.entries(t($)).map(([n, r]) => r[e])).size), An = (e) => T(
  (t) => t($)[e],
  (t, n, r) => {
    typeof r == "function" && (r = r(t(An(e)))), n($, (o) => ({ ...o, [e]: { ...o[e], ...r } })), t(ne).onChange({ type: Wr, rowId: e, update: r });
  }
), he = (e) => T(
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
), zr = T(null, (e, t, n) => {
  const r = Object.entries(e($)).filter(([, o]) => o.isSelected === !0).map(([o, l]) => o);
  t(
    $,
    Object.fromEntries(
      Object.entries(e($)).filter(([, o]) => o.isSelected !== !0)
    )
  ), t(de, !1), e(ne).onChange({
    type: $r,
    rows: [r]
  });
}), Yr = T(
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
    ), t(de, !1);
  }
), Xr = T(null, (e, t, n) => {
  t($, Object.fromEntries(n.map((r) => [r.id, r])));
}), Mn = T(null, (e, t, n) => {
  t($, (r) => ({
    ...r,
    [n.id]: n
  })), t(tt(n.id, e(se)[0]), "editing"), e(ne).onChange({ type: Hr, rowId: n.id, update: n });
}), Gr = T((e) => Object.keys(e($)).length), Jr = T(
  (e) => e(de) ? Object.keys(e($)).length : Object.entries(e($)).map(([, t]) => t.isSelected === !0).reduce(Ot, 0)
), At = T({}), Me = T((e) => Object.entries(e($)).filter(([, t]) => _r(t, e(Dt))).sort(
  ([, t], [, n]) => Vr(t, n, [...e(De), ...e(Mt)])
).map(([t, n]) => ({
  id: t,
  groupVal: e(De).length === 0 ? "" : n[e(De)[0].columnId]
})).map((t, n, r) => ({
  id: t.id,
  first: n === 0 || t.groupVal !== r[n - 1].groupVal,
  last: n === r.length - 1 || t.groupVal !== r[n + 1].groupVal,
  groupVal: t.groupVal
}))), Yt = T({}), et = (e) => T(
  (t) => t(Yt)[e],
  (t, n, r) => n(Yt, (o) => ({ ...o, [e]: r }))
), G = T({}), se = T(
  (e) => Object.entries(e(G)).filter(([t, n]) => n.isVisible === !0).map(([t]) => t)
), Ln = T(
  (e) => Object.entries(e(G)).map(([t, n]) => n)
), Qr = T(
  (e) => Object.entries(e(G)).map(([t, n]) => n).filter((t) => t.type !== "custom")
), eo = T((e) => Object.keys(e(G))), to = T(
  (e) => Object.entries(e(G)).map(([, t]) => t.isVisible).reduce((t, n) => t + (n === !1), 0)
), no = {
  isVisible: !0,
  width: 192,
  type: "text",
  options: [],
  showOptionSearch: !0,
  isEditable: !0,
  isViewOnly: !1
}, ro = T(null, (e, t, n) => {
  t(
    G,
    Object.fromEntries(
      n.map((r) => ({ ...no, ...r })).map((r) => [r.id, r])
    )
  );
}), oo = T(null, (e, t, n) => {
  t(G, (r) => ({ ...r, [n.id]: n })), t(et(n.id), !0), e(ne).onChange({
    type: Ur,
    colId: n.id,
    update: n
  });
}), io = T(null, (e, t, n) => {
  t(
    G,
    (r) => Object.fromEntries(Object.entries(r).filter(([o]) => o !== n.id))
  ), e(ne).onChange({ type: Br, colId: n.id });
}), lo = T((e) => Object.entries(e(G)).filter(([t, n]) => n.isVisible === !0).map(([t, n]) => n.width).reduce(Ot, e(Qe).selectRow.enabled ? 64 : 0)), De = T([]), Se = T((e) => e(De)), so = T(null, (e, t, n) => {
  t(De, n.grouping), t(At, {});
}), Dn = T(!1), In = T(!1), Mt = T([]), Lt = T((e) => e(Mt)), Tn = T(null, (e, t, n) => {
  t(Mt, n.sorting);
}), Dt = T([]), Pn = T((e) => e(Dt)), Fn = T(null, (e, t, n) => {
  t(Dt, n.filtering);
}), jn = T(32), It = T((e) => e(jn)), co = T(null, (e, t, n) => {
  t(jn, n.rowHeight);
}), de = T(!1), ao = T((e) => e(de)), uo = T(null, (e, t, n) => {
  const r = e(de);
  t(de, !r), t(
    $,
    Object.fromEntries(
      Object.entries(e($)).map(([o, l]) => [
        o,
        { ...l, isSelected: !r }
      ])
    )
  );
}), fo = T(null, (e, t, n) => {
  t(de, !1), t(
    $,
    Object.fromEntries(
      Object.entries(e($)).map(([r, o]) => [
        r,
        { ...o, isSelected: !1 }
      ])
    )
  );
});
T(null, (e, t, n) => {
  t(de, n.value), t(
    $,
    Object.fromEntries(
      Object.entries(e($)).map(([r, o]) => [
        r,
        { ...o, isSelected: n.value }
      ])
    )
  );
});
const Vn = T(!1);
T((e) => e(Vn));
T(null, (e, t, n) => {
  t(Vn, n.dragging);
});
const Xt = T({}), tt = (e, t) => T(
  (n) => {
    var r;
    return ((r = n(Xt)[e]) == null ? void 0 : r[t]) || "none";
  },
  (n, r, o) => {
    r(Xt, { [e]: { [t]: o } });
  }
), Tt = T(null, (e, t, n) => {
  t(tt(n.rowId, n.colId), n.value);
}), mo = T(null, (e, t, n) => {
  const { colId: r, type: o } = n;
  let { options: l, configuration: i } = e(G)[r];
  const a = e(Qe);
  let u = (s) => s;
  switch (o) {
    case "select": {
      l = [
        ...new Set(Object.entries(e($)).map(([f, d]) => d[r]))
      ].filter((f) => !Ie(f) && f !== "").map((f) => ({
        value: f,
        name: f,
        color: gt()
      }));
      break;
    }
    case "multiSelect": {
      l = [
        ...new Set(
          Object.entries(e($)).flatMap(
            ([f, d]) => ge(d[r]) ? [] : d[r].split(",")
          )
        )
      ].filter((f) => !Ie(f) && f !== "").map((f) => ({
        value: f,
        name: f,
        color: gt()
      }));
      break;
    }
    case "number": {
      u = (s) => s;
      break;
    }
    case "date": {
      u = (s) => a.parseDate !== void 0 ? s : Number.isNaN(Date.parse(s)) ? "" : new Date(Date.parse(s)).toISOString();
      break;
    }
    case "checkbox":
      u = (s) => {
        var f, d, g;
        return ((g = (d = (f = s == null ? void 0 : s.toLowerCase) == null ? void 0 : f.call(s)) == null ? void 0 : d.trim) == null ? void 0 : g.call(d)) === "true";
      };
  }
  t(he(r), (s) => ({ ...s[r], type: o, options: l })), t(
    $,
    Object.fromEntries(
      Object.entries(e($)).map(([s, f]) => [
        s,
        { ...f, [r]: u(f[r]) }
      ])
    )
  ), e(ne).onChange({
    type: Sn,
    colId: r,
    update: { type: o, options: l }
  }), e(ne).onChange({
    type: Nn,
    rows: Object.entries(e($)).map(([s, f]) => ({
      rowId: s,
      update: { [r]: u(f[r]) }
    }))
  });
}), ho = (e, t) => T(null, (n, r, o) => {
  const l = n(se).findIndex((s) => s === t), i = n(Me).findIndex(
    (s) => s.id === e
  );
  let a = e, u = t;
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
      a = n(Me).map((s) => s.id)[Math.max(0, i - 1)];
      break;
    }
    case "down": {
      a = n(Me).map((s) => s.id)[Math.min(
        n(Me).flatMap((s) => s.rowIds).length - 1,
        i + 1
      )];
      break;
    }
  }
  t === u && e === a || r(tt(a, u), "focused");
}), Gt = (e, t) => T(
  (n) => Object.entries(n($)).map(([r, o]) => o[e]).map(t).reduce(Ot, 0)
), cc = "100000000000000000000001";
function po({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ m.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ m.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ m.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
  }));
}
const go = m.forwardRef(po), vo = go;
function wo({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ m.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ m.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ m.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "m19.5 8.25-7.5 7.5-7.5-7.5"
  }));
}
const bo = m.forwardRef(wo), xo = bo;
function yo({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ m.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ m.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ m.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
  }));
}
const Co = m.forwardRef(yo), Jt = Co;
function Ro({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ m.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ m.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ m.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5"
  }));
}
const Eo = m.forwardRef(Ro), So = Eo;
function No({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ m.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ m.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ m.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
  }));
}
const ko = m.forwardRef(No), Oo = ko;
function Ao({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ m.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ m.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ m.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
  }));
}
const Mo = m.forwardRef(Ao), Lo = Mo;
function Do({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ m.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ m.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ m.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M12 4.5v15m7.5-7.5h-15"
  }));
}
const Io = m.forwardRef(Do), _n = Io;
function To({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ m.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ m.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ m.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M16.5 8.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v8.25A2.25 2.25 0 0 0 6 16.5h2.25m8.25-8.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-7.5A2.25 2.25 0 0 1 8.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 0 0-2.25 2.25v6"
  }));
}
const Po = m.forwardRef(To), Fo = Po;
function jo({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ m.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ m.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ m.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
  }));
}
const Vo = m.forwardRef(jo), _o = Vo;
function Le(e) {
  const t = e.getUTCMonth() + 1, n = e.getUTCDate(), r = e.getUTCFullYear();
  return `${t.toString().padStart(2, "0")}/${n.toString().padStart(2, "0")}/${r.toString().padStart(4, "0")}`;
}
function Bo({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ m.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ m.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ m.createElement("path", {
    fillRule: "evenodd",
    d: "M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z",
    clipRule: "evenodd"
  }));
}
const Ho = m.forwardRef(Bo), Pt = Ho;
function $o({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ m.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ m.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ m.createElement("path", {
    fillRule: "evenodd",
    d: "M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z",
    clipRule: "evenodd"
  }));
}
const Wo = m.forwardRef($o), Bn = Wo;
function Uo({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ m.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ m.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ m.createElement("path", {
    fillRule: "evenodd",
    d: "M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z",
    clipRule: "evenodd"
  }));
}
const Ko = m.forwardRef(Uo), Zo = Ko;
function qo({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ m.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ m.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ m.createElement("path", {
    fillRule: "evenodd",
    d: "M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z",
    clipRule: "evenodd"
  }));
}
const zo = m.forwardRef(qo), Yo = zo;
function Xo({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ m.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ m.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ m.createElement("path", {
    fillRule: "evenodd",
    d: "M10.53 3.47a.75.75 0 0 0-1.06 0L6.22 6.72a.75.75 0 0 0 1.06 1.06L10 5.06l2.72 2.72a.75.75 0 1 0 1.06-1.06l-3.25-3.25Zm-4.31 9.81 3.25 3.25a.75.75 0 0 0 1.06 0l3.25-3.25a.75.75 0 1 0-1.06-1.06L10 14.94l-2.72-2.72a.75.75 0 0 0-1.06 1.06Z",
    clipRule: "evenodd"
  }));
}
const Go = m.forwardRef(Xo), Jo = Go;
function Qo({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ m.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ m.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ m.createElement("path", {
    d: "M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"
  }));
}
const ei = m.forwardRef(Qo), ti = ei;
function ce({ name: e, color: t, onCancel: n }) {
  return /* @__PURE__ */ y(
    "div",
    {
      className: "rounded px-1.5 p-[1px] truncate whitespace-nowrap text-dark items-center flex cursor-default",
      style: { backgroundColor: t },
      children: [
        e,
        n && /* @__PURE__ */ c(ti, { className: "w-4 h-4", onClick: n })
      ]
    }
  );
}
function ni(e, t) {
  const n = ae(t);
  Z(() => {
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
function ri({ children: e, ...t }) {
  return /* @__PURE__ */ c("div", { className: "px-3 py-1 flex items-center cursor-default", ...t, children: e });
}
function oi({ children: e, disabled: t, ...n }) {
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
Ft.Item = ri;
Ft.Button = oi;
const ii = (e, t) => new Date(e, t + 1, 0).getDate(), li = [
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
], si = [
  "first:col-start-1",
  "first:col-start-2",
  "first:col-start-3",
  "first:col-start-4",
  "first:col-start-5",
  "first:col-start-6",
  "first:col-start-7"
];
function ci({
  value: e,
  onSelect: t
}) {
  const [n, r] = H(e || null), o = /* @__PURE__ */ new Date(), [l, i] = H(
    n ? n.getUTCMonth() : o.getUTCMonth()
  ), [a, u] = H(
    n ? n.getUTCFullYear() : o.getUTCFullYear()
  );
  Z(() => {
    if (!e) {
      r(null);
      return;
    }
    r(e), i(e.getUTCMonth()), u(e.getUTCFullYear());
  }, [e]);
  const s = [...Array(ii(a, l)).keys()], f = new Date(a, l, 1).getDay(), d = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  function g() {
    l === 0 ? (u((w) => w - 1), i(11)) : i((w) => w - 1);
  }
  function h() {
    l === 11 ? (u((w) => w + 1), i(0)) : i((w) => w + 1);
  }
  function R(w, b) {
    w.preventDefault();
    const L = /* @__PURE__ */ new Date();
    L.setUTCFullYear(a, l, b), r(L), t == null || t(L);
  }
  function C(w) {
    return n && n.getDate() === w && n.getMonth() === l && n.getFullYear() === a;
  }
  return /* @__PURE__ */ c("div", { className: "w-56", children: /* @__PURE__ */ y(B, { children: [
    /* @__PURE__ */ c(B.Section, { children: /* @__PURE__ */ y("div", { className: "flex px-2 items-center", children: [
      /* @__PURE__ */ y("div", { className: "grow text-left px-1", children: [
        li[l],
        " ",
        a
      ] }),
      /* @__PURE__ */ c(
        "div",
        {
          className: "rs-btn hover:bg-hover-light rounded p-1",
          onClick: g,
          "aria-label": "move-calendar-left",
          children: /* @__PURE__ */ c(Zo, { className: "w-4 h-4" })
        }
      ),
      /* @__PURE__ */ c(
        "div",
        {
          className: "rs-btn hover:bg-hover-light rounded p-1",
          onClick: h,
          "aria-label": "move-calendar-right",
          children: /* @__PURE__ */ c(Yo, { className: "w-4 h-4" })
        }
      )
    ] }) }),
    /* @__PURE__ */ y(B.Section, { children: [
      /* @__PURE__ */ c("div", { className: "grid grid-cols-7 text-sm px-2 gap-px mb-2", children: d.map((w) => /* @__PURE__ */ c("div", { className: "text-secondary font-medium flex items-center justify-center", children: w })) }),
      /* @__PURE__ */ c("div", { className: "grid grid-cols-7 text-sm px-2 gap-px", children: s.map((w) => /* @__PURE__ */ c(
        "div",
        {
          className: U(
            "rs-btn p-0.5 rounded flex items-center justify-center col-span-1",
            si[f],
            !C(w + 1) && "hover:bg-hover-light",
            C(w + 1) && "bg-blue-500 text-inverted hover:bg-blue-500"
          ),
          onClick: (b) => {
            R(b, w + 1);
          },
          children: w + 1
        },
        `day-${w}`
      )) })
    ] })
  ] }) });
}
function fe(e) {
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
function wt(e) {
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
function ai(e) {
  return ["table", "td", "th"].includes(fe(e));
}
function jt(e) {
  const t = Vt(), n = ee(e);
  return n.transform !== "none" || n.perspective !== "none" || (n.containerType ? n.containerType !== "normal" : !1) || !t && (n.backdropFilter ? n.backdropFilter !== "none" : !1) || !t && (n.filter ? n.filter !== "none" : !1) || ["transform", "perspective", "filter"].some((r) => (n.willChange || "").includes(r)) || ["paint", "layout", "strict", "content"].some((r) => (n.contain || "").includes(r));
}
function ui(e) {
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
  return ["html", "body", "#document"].includes(fe(e));
}
function ee(e) {
  return J(e).getComputedStyle(e);
}
function nt(e) {
  return q(e) ? {
    scrollLeft: e.scrollLeft,
    scrollTop: e.scrollTop
  } : {
    scrollLeft: e.pageXOffset,
    scrollTop: e.pageYOffset
  };
}
function ve(e) {
  if (fe(e) === "html")
    return e;
  const t = (
    // Step into the shadow DOM of the parent of a slotted node.
    e.assignedSlot || // DOM Element detected.
    e.parentNode || // ShadowRoot detected.
    wt(e) && e.host || // Fallback.
    ie(e)
  );
  return wt(t) ? t.host : t;
}
function $n(e) {
  const t = ve(e);
  return Re(t) ? e.ownerDocument ? e.ownerDocument.body : e.body : Q(t) && Fe(t) ? t : $n(t);
}
function ue(e, t, n) {
  var r;
  t === void 0 && (t = []), n === void 0 && (n = !0);
  const o = $n(e), l = o === ((r = e.ownerDocument) == null ? void 0 : r.body), i = J(o);
  return l ? t.concat(i, i.visualViewport || [], Fe(o) ? o : [], i.frameElement && n ? ue(i.frameElement) : []) : t.concat(o, ue(o, [], n));
}
function di(e) {
  let t = e.activeElement;
  for (; ((n = t) == null || (n = n.shadowRoot) == null ? void 0 : n.activeElement) != null; ) {
    var n;
    t = t.shadowRoot.activeElement;
  }
  return t;
}
function bt(e, t) {
  if (!e || !t)
    return !1;
  const n = t.getRootNode && t.getRootNode();
  if (e.contains(t))
    return !0;
  if (n && wt(n)) {
    let r = t;
    for (; r; ) {
      if (e === r)
        return !0;
      r = r.parentNode || r.host;
    }
  }
  return !1;
}
function fi() {
  return /apple/i.test(navigator.vendor);
}
function Qt(e, t) {
  const n = ["mouse", "pen"];
  return t || n.push("", void 0), n.includes(e);
}
function mi(e) {
  return "nativeEvent" in e;
}
function hi(e) {
  return e.matches("html,body");
}
function xt(e) {
  return (e == null ? void 0 : e.ownerDocument) || document;
}
function ut(e, t) {
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
const pi = "input:not([type='hidden']):not([disabled]),[contenteditable]:not([contenteditable='false']),textarea:not([disabled])";
function gi(e) {
  return Q(e) && e.matches(pi);
}
const We = Math.min, pe = Math.max, Ue = Math.round, Be = Math.floor, me = (e) => ({
  x: e,
  y: e
}), vi = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom"
}, wi = {
  start: "end",
  end: "start"
};
function en(e, t, n) {
  return pe(e, We(t, n));
}
function rt(e, t) {
  return typeof e == "function" ? e(t) : e;
}
function we(e) {
  return e.split("-")[0];
}
function ot(e) {
  return e.split("-")[1];
}
function Wn(e) {
  return e === "x" ? "y" : "x";
}
function Un(e) {
  return e === "y" ? "height" : "width";
}
function it(e) {
  return ["top", "bottom"].includes(we(e)) ? "y" : "x";
}
function Kn(e) {
  return Wn(it(e));
}
function bi(e, t, n) {
  n === void 0 && (n = !1);
  const r = ot(e), o = Kn(e), l = Un(o);
  let i = o === "x" ? r === (n ? "end" : "start") ? "right" : "left" : r === "start" ? "bottom" : "top";
  return t.reference[l] > t.floating[l] && (i = Ke(i)), [i, Ke(i)];
}
function xi(e) {
  const t = Ke(e);
  return [yt(e), t, yt(t)];
}
function yt(e) {
  return e.replace(/start|end/g, (t) => wi[t]);
}
function yi(e, t, n) {
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
function Ci(e, t, n, r) {
  const o = ot(e);
  let l = yi(we(e), n === "start", r);
  return o && (l = l.map((i) => i + "-" + o), t && (l = l.concat(l.map(yt)))), l;
}
function Ke(e) {
  return e.replace(/left|right|bottom|top/g, (t) => vi[t]);
}
function Ri(e) {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...e
  };
}
function Ei(e) {
  return typeof e != "number" ? Ri(e) : {
    top: e,
    right: e,
    bottom: e,
    left: e
  };
}
function Ze(e) {
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
  const l = it(t), i = Kn(t), a = Un(i), u = we(t), s = l === "y", f = r.x + r.width / 2 - o.width / 2, d = r.y + r.height / 2 - o.height / 2, g = r[a] / 2 - o[a] / 2;
  let h;
  switch (u) {
    case "top":
      h = {
        x: f,
        y: r.y - o.height
      };
      break;
    case "bottom":
      h = {
        x: f,
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
  switch (ot(t)) {
    case "start":
      h[i] -= g * (n && s ? -1 : 1);
      break;
    case "end":
      h[i] += g * (n && s ? -1 : 1);
      break;
  }
  return h;
}
const Si = async (e, t, n) => {
  const {
    placement: r = "bottom",
    strategy: o = "absolute",
    middleware: l = [],
    platform: i
  } = n, a = l.filter(Boolean), u = await (i.isRTL == null ? void 0 : i.isRTL(t));
  let s = await i.getElementRects({
    reference: e,
    floating: t,
    strategy: o
  }), {
    x: f,
    y: d
  } = tn(s, r, u), g = r, h = {}, R = 0;
  for (let C = 0; C < a.length; C++) {
    const {
      name: w,
      fn: b
    } = a[C], {
      x: L,
      y: F,
      data: j,
      reset: N
    } = await b({
      x: f,
      y: d,
      initialPlacement: r,
      placement: g,
      strategy: o,
      middlewareData: h,
      rects: s,
      platform: i,
      elements: {
        reference: e,
        floating: t
      }
    });
    if (f = L ?? f, d = F ?? d, h = {
      ...h,
      [w]: {
        ...h[w],
        ...j
      }
    }, N && R <= 50) {
      R++, typeof N == "object" && (N.placement && (g = N.placement), N.rects && (s = N.rects === !0 ? await i.getElementRects({
        reference: e,
        floating: t,
        strategy: o
      }) : N.rects), {
        x: f,
        y: d
      } = tn(s, g, u)), C = -1;
      continue;
    }
  }
  return {
    x: f,
    y: d,
    placement: g,
    strategy: o,
    middlewareData: h
  };
};
async function Zn(e, t) {
  var n;
  t === void 0 && (t = {});
  const {
    x: r,
    y: o,
    platform: l,
    rects: i,
    elements: a,
    strategy: u
  } = e, {
    boundary: s = "clippingAncestors",
    rootBoundary: f = "viewport",
    elementContext: d = "floating",
    altBoundary: g = !1,
    padding: h = 0
  } = rt(t, e), R = Ei(h), w = a[g ? d === "floating" ? "reference" : "floating" : d], b = Ze(await l.getClippingRect({
    element: (n = await (l.isElement == null ? void 0 : l.isElement(w))) == null || n ? w : w.contextElement || await (l.getDocumentElement == null ? void 0 : l.getDocumentElement(a.floating)),
    boundary: s,
    rootBoundary: f,
    strategy: u
  })), L = d === "floating" ? {
    ...i.floating,
    x: r,
    y: o
  } : i.reference, F = await (l.getOffsetParent == null ? void 0 : l.getOffsetParent(a.floating)), j = await (l.isElement == null ? void 0 : l.isElement(F)) ? await (l.getScale == null ? void 0 : l.getScale(F)) || {
    x: 1,
    y: 1
  } : {
    x: 1,
    y: 1
  }, N = Ze(l.convertOffsetParentRelativeRectToViewportRelativeRect ? await l.convertOffsetParentRelativeRectToViewportRelativeRect({
    rect: L,
    offsetParent: F,
    strategy: u
  }) : L);
  return {
    top: (b.top - N.top + R.top) / j.y,
    bottom: (N.bottom - b.bottom + R.bottom) / j.y,
    left: (b.left - N.left + R.left) / j.x,
    right: (N.right - b.right + R.right) / j.x
  };
}
const Ni = function(e) {
  return e === void 0 && (e = {}), {
    name: "flip",
    options: e,
    async fn(t) {
      var n, r;
      const {
        placement: o,
        middlewareData: l,
        rects: i,
        initialPlacement: a,
        platform: u,
        elements: s
      } = t, {
        mainAxis: f = !0,
        crossAxis: d = !0,
        fallbackPlacements: g,
        fallbackStrategy: h = "bestFit",
        fallbackAxisSideDirection: R = "none",
        flipAlignment: C = !0,
        ...w
      } = rt(e, t);
      if ((n = l.arrow) != null && n.alignmentOffset)
        return {};
      const b = we(o), L = we(a) === a, F = await (u.isRTL == null ? void 0 : u.isRTL(s.floating)), j = g || (L || !C ? [Ke(a)] : xi(a));
      !g && R !== "none" && j.push(...Ci(a, C, R, F));
      const N = [a, ...j], _ = await Zn(t, w), V = [];
      let p = ((r = l.flip) == null ? void 0 : r.overflows) || [];
      if (f && V.push(_[b]), d) {
        const E = bi(o, i, F);
        V.push(_[E[0]], _[E[1]]);
      }
      if (p = [...p, {
        placement: o,
        overflows: V
      }], !V.every((E) => E <= 0)) {
        var S, v;
        const E = (((S = l.flip) == null ? void 0 : S.index) || 0) + 1, P = N[E];
        if (P)
          return {
            data: {
              index: E,
              overflows: p
            },
            reset: {
              placement: P
            }
          };
        let A = (v = p.filter((k) => k.overflows[0] <= 0).sort((k, I) => k.overflows[1] - I.overflows[1])[0]) == null ? void 0 : v.placement;
        if (!A)
          switch (h) {
            case "bestFit": {
              var x;
              const k = (x = p.map((I) => [I.placement, I.overflows.filter((D) => D > 0).reduce((D, M) => D + M, 0)]).sort((I, D) => I[1] - D[1])[0]) == null ? void 0 : x[0];
              k && (A = k);
              break;
            }
            case "initialPlacement":
              A = a;
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
async function ki(e, t) {
  const {
    placement: n,
    platform: r,
    elements: o
  } = e, l = await (r.isRTL == null ? void 0 : r.isRTL(o.floating)), i = we(n), a = ot(n), u = it(n) === "y", s = ["left", "top"].includes(i) ? -1 : 1, f = l && u ? -1 : 1, d = rt(t, e);
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
  return a && typeof R == "number" && (h = a === "end" ? R * -1 : R), u ? {
    x: h * f,
    y: g * s
  } : {
    x: g * s,
    y: h * f
  };
}
const Oi = function(e) {
  return e === void 0 && (e = 0), {
    name: "offset",
    options: e,
    async fn(t) {
      var n, r;
      const {
        x: o,
        y: l,
        placement: i,
        middlewareData: a
      } = t, u = await ki(t, e);
      return i === ((n = a.offset) == null ? void 0 : n.placement) && (r = a.arrow) != null && r.alignmentOffset ? {} : {
        x: o + u.x,
        y: l + u.y,
        data: {
          ...u,
          placement: i
        }
      };
    }
  };
}, Ai = function(e) {
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
        limiter: a = {
          fn: (w) => {
            let {
              x: b,
              y: L
            } = w;
            return {
              x: b,
              y: L
            };
          }
        },
        ...u
      } = rt(e, t), s = {
        x: n,
        y: r
      }, f = await Zn(t, u), d = it(we(o)), g = Wn(d);
      let h = s[g], R = s[d];
      if (l) {
        const w = g === "y" ? "top" : "left", b = g === "y" ? "bottom" : "right", L = h + f[w], F = h - f[b];
        h = en(L, h, F);
      }
      if (i) {
        const w = d === "y" ? "top" : "left", b = d === "y" ? "bottom" : "right", L = R + f[w], F = R - f[b];
        R = en(L, R, F);
      }
      const C = a.fn({
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
  const o = Q(e), l = o ? e.offsetWidth : n, i = o ? e.offsetHeight : r, a = Ue(n) !== l || Ue(r) !== i;
  return a && (n = l, r = i), {
    width: n,
    height: r,
    $: a
  };
}
function _t(e) {
  return q(e) ? e : e.contextElement;
}
function Ce(e) {
  const t = _t(e);
  if (!Q(t))
    return me(1);
  const n = t.getBoundingClientRect(), {
    width: r,
    height: o,
    $: l
  } = qn(t);
  let i = (l ? Ue(n.width) : n.width) / r, a = (l ? Ue(n.height) : n.height) / o;
  return (!i || !Number.isFinite(i)) && (i = 1), (!a || !Number.isFinite(a)) && (a = 1), {
    x: i,
    y: a
  };
}
const Mi = /* @__PURE__ */ me(0);
function zn(e) {
  const t = J(e);
  return !Vt() || !t.visualViewport ? Mi : {
    x: t.visualViewport.offsetLeft,
    y: t.visualViewport.offsetTop
  };
}
function Li(e, t, n) {
  return t === void 0 && (t = !1), !n || t && n !== J(e) ? !1 : t;
}
function be(e, t, n, r) {
  t === void 0 && (t = !1), n === void 0 && (n = !1);
  const o = e.getBoundingClientRect(), l = _t(e);
  let i = me(1);
  t && (r ? q(r) && (i = Ce(r)) : i = Ce(e));
  const a = Li(l, n, r) ? zn(l) : me(0);
  let u = (o.left + a.x) / i.x, s = (o.top + a.y) / i.y, f = o.width / i.x, d = o.height / i.y;
  if (l) {
    const g = J(l), h = r && q(r) ? J(r) : r;
    let R = g.frameElement;
    for (; R && r && h !== g; ) {
      const C = Ce(R), w = R.getBoundingClientRect(), b = ee(R), L = w.left + (R.clientLeft + parseFloat(b.paddingLeft)) * C.x, F = w.top + (R.clientTop + parseFloat(b.paddingTop)) * C.y;
      u *= C.x, s *= C.y, f *= C.x, d *= C.y, u += L, s += F, R = J(R).frameElement;
    }
  }
  return Ze({
    width: f,
    height: d,
    x: u,
    y: s
  });
}
function Di(e) {
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
  }, a = me(1);
  const u = me(0);
  if ((o || !o && r !== "fixed") && ((fe(n) !== "body" || Fe(l)) && (i = nt(n)), Q(n))) {
    const s = be(n);
    a = Ce(n), u.x = s.x + n.clientLeft, u.y = s.y + n.clientTop;
  }
  return {
    width: t.width * a.x,
    height: t.height * a.y,
    x: t.x * a.x - i.scrollLeft * a.x + u.x,
    y: t.y * a.y - i.scrollTop * a.y + u.y
  };
}
function Ii(e) {
  return Array.from(e.getClientRects());
}
function Yn(e) {
  return be(ie(e)).left + nt(e).scrollLeft;
}
function Ti(e) {
  const t = ie(e), n = nt(e), r = e.ownerDocument.body, o = pe(t.scrollWidth, t.clientWidth, r.scrollWidth, r.clientWidth), l = pe(t.scrollHeight, t.clientHeight, r.scrollHeight, r.clientHeight);
  let i = -n.scrollLeft + Yn(e);
  const a = -n.scrollTop;
  return ee(r).direction === "rtl" && (i += pe(t.clientWidth, r.clientWidth) - o), {
    width: o,
    height: l,
    x: i,
    y: a
  };
}
function Pi(e, t) {
  const n = J(e), r = ie(e), o = n.visualViewport;
  let l = r.clientWidth, i = r.clientHeight, a = 0, u = 0;
  if (o) {
    l = o.width, i = o.height;
    const s = Vt();
    (!s || s && t === "fixed") && (a = o.offsetLeft, u = o.offsetTop);
  }
  return {
    width: l,
    height: i,
    x: a,
    y: u
  };
}
function Fi(e, t) {
  const n = be(e, !0, t === "fixed"), r = n.top + e.clientTop, o = n.left + e.clientLeft, l = Q(e) ? Ce(e) : me(1), i = e.clientWidth * l.x, a = e.clientHeight * l.y, u = o * l.x, s = r * l.y;
  return {
    width: i,
    height: a,
    x: u,
    y: s
  };
}
function nn(e, t, n) {
  let r;
  if (t === "viewport")
    r = Pi(e, n);
  else if (t === "document")
    r = Ti(ie(e));
  else if (q(t))
    r = Fi(t, n);
  else {
    const o = zn(e);
    r = {
      ...t,
      x: t.x - o.x,
      y: t.y - o.y
    };
  }
  return Ze(r);
}
function Xn(e, t) {
  const n = ve(e);
  return n === t || !q(n) || Re(n) ? !1 : ee(n).position === "fixed" || Xn(n, t);
}
function ji(e, t) {
  const n = t.get(e);
  if (n)
    return n;
  let r = ue(e, [], !1).filter((a) => q(a) && fe(a) !== "body"), o = null;
  const l = ee(e).position === "fixed";
  let i = l ? ve(e) : e;
  for (; q(i) && !Re(i); ) {
    const a = ee(i), u = jt(i);
    !u && a.position === "fixed" && (o = null), (l ? !u && !o : !u && a.position === "static" && !!o && ["absolute", "fixed"].includes(o.position) || Fe(i) && !u && Xn(e, i)) ? r = r.filter((f) => f !== i) : o = a, i = ve(i);
  }
  return t.set(e, r), r;
}
function Vi(e) {
  let {
    element: t,
    boundary: n,
    rootBoundary: r,
    strategy: o
  } = e;
  const i = [...n === "clippingAncestors" ? ji(t, this._c) : [].concat(n), r], a = i[0], u = i.reduce((s, f) => {
    const d = nn(t, f, o);
    return s.top = pe(d.top, s.top), s.right = We(d.right, s.right), s.bottom = We(d.bottom, s.bottom), s.left = pe(d.left, s.left), s;
  }, nn(t, a, o));
  return {
    width: u.right - u.left,
    height: u.bottom - u.top,
    x: u.left,
    y: u.top
  };
}
function _i(e) {
  return qn(e);
}
function Bi(e, t, n) {
  const r = Q(t), o = ie(t), l = n === "fixed", i = be(e, !0, l, t);
  let a = {
    scrollLeft: 0,
    scrollTop: 0
  };
  const u = me(0);
  if (r || !r && !l)
    if ((fe(t) !== "body" || Fe(o)) && (a = nt(t)), r) {
      const s = be(t, !0, l, t);
      u.x = s.x + t.clientLeft, u.y = s.y + t.clientTop;
    } else
      o && (u.x = Yn(o));
  return {
    x: i.left + a.scrollLeft - u.x,
    y: i.top + a.scrollTop - u.y,
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
  for (; r && ai(r) && ee(r).position === "static"; )
    r = rn(r, t);
  return r && (fe(r) === "html" || fe(r) === "body" && ee(r).position === "static" && !jt(r)) ? n : r || ui(e) || n;
}
const Hi = async function(e) {
  let {
    reference: t,
    floating: n,
    strategy: r
  } = e;
  const o = this.getOffsetParent || Gn, l = this.getDimensions;
  return {
    reference: Bi(t, await o(n), r),
    floating: {
      x: 0,
      y: 0,
      ...await l(n)
    }
  };
};
function $i(e) {
  return ee(e).direction === "rtl";
}
const Wi = {
  convertOffsetParentRelativeRectToViewportRelativeRect: Di,
  getDocumentElement: ie,
  getClippingRect: Vi,
  getOffsetParent: Gn,
  getElementRects: Hi,
  getClientRects: Ii,
  getDimensions: _i,
  getScale: Ce,
  isElement: q,
  isRTL: $i
};
function Ui(e, t) {
  let n = null, r;
  const o = ie(e);
  function l() {
    clearTimeout(r), n && n.disconnect(), n = null;
  }
  function i(a, u) {
    a === void 0 && (a = !1), u === void 0 && (u = 1), l();
    const {
      left: s,
      top: f,
      width: d,
      height: g
    } = e.getBoundingClientRect();
    if (a || t(), !d || !g)
      return;
    const h = Be(f), R = Be(o.clientWidth - (s + d)), C = Be(o.clientHeight - (f + g)), w = Be(s), L = {
      rootMargin: -h + "px " + -R + "px " + -C + "px " + -w + "px",
      threshold: pe(0, We(1, u)) || 1
    };
    let F = !0;
    function j(N) {
      const _ = N[0].intersectionRatio;
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
        ...L,
        // Handle <iframe>s
        root: o.ownerDocument
      });
    } catch {
      n = new IntersectionObserver(j, L);
    }
    n.observe(e);
  }
  return i(!0), l;
}
function Ki(e, t, n, r) {
  r === void 0 && (r = {});
  const {
    ancestorScroll: o = !0,
    ancestorResize: l = !0,
    elementResize: i = typeof ResizeObserver == "function",
    layoutShift: a = typeof IntersectionObserver == "function",
    animationFrame: u = !1
  } = r, s = _t(e), f = o || l ? [...s ? ue(s) : [], ...ue(t)] : [];
  f.forEach((b) => {
    o && b.addEventListener("scroll", n, {
      passive: !0
    }), l && b.addEventListener("resize", n);
  });
  const d = s && a ? Ui(s, n) : null;
  let g = -1, h = null;
  i && (h = new ResizeObserver((b) => {
    let [L] = b;
    L && L.target === s && h && (h.unobserve(t), cancelAnimationFrame(g), g = requestAnimationFrame(() => {
      h && h.observe(t);
    })), n();
  }), s && !u && h.observe(s), h.observe(t));
  let R, C = u ? be(e) : null;
  u && w();
  function w() {
    const b = be(e);
    C && (b.x !== C.x || b.y !== C.y || b.width !== C.width || b.height !== C.height) && n(), C = b, R = requestAnimationFrame(w);
  }
  return n(), () => {
    f.forEach((b) => {
      o && b.removeEventListener("scroll", n), l && b.removeEventListener("resize", n);
    }), d && d(), h && h.disconnect(), h = null, u && cancelAnimationFrame(R);
  };
}
const Zi = (e, t, n) => {
  const r = /* @__PURE__ */ new Map(), o = {
    platform: Wi,
    ...n
  }, l = {
    ...o.platform,
    _c: r
  };
  return Si(e, t, {
    ...o,
    platform: l
  });
};
var He = typeof document < "u" ? xn : Z;
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
  const t = m.useRef(e);
  return He(() => {
    t.current = e;
  }), t;
}
function qi(e) {
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
    transform: a = !0,
    whileElementsMounted: u,
    open: s
  } = e, [f, d] = m.useState({
    x: 0,
    y: 0,
    strategy: n,
    placement: t,
    middlewareData: {},
    isPositioned: !1
  }), [g, h] = m.useState(r);
  qe(g, r) || h(r);
  const [R, C] = m.useState(null), [w, b] = m.useState(null), L = m.useCallback((I) => {
    I != _.current && (_.current = I, C(I));
  }, [C]), F = m.useCallback((I) => {
    I !== V.current && (V.current = I, b(I));
  }, [b]), j = l || R, N = i || w, _ = m.useRef(null), V = m.useRef(null), p = m.useRef(f), S = ln(u), v = ln(o), x = m.useCallback(() => {
    if (!_.current || !V.current)
      return;
    const I = {
      placement: t,
      strategy: n,
      middleware: g
    };
    v.current && (I.platform = v.current), Zi(_.current, V.current, I).then((D) => {
      const M = {
        ...D,
        isPositioned: !0
      };
      E.current && !qe(p.current, M) && (p.current = M, yr.flushSync(() => {
        d(M);
      }));
    });
  }, [g, t, n, v]);
  He(() => {
    s === !1 && p.current.isPositioned && (p.current.isPositioned = !1, d((I) => ({
      ...I,
      isPositioned: !1
    })));
  }, [s]);
  const E = m.useRef(!1);
  He(() => (E.current = !0, () => {
    E.current = !1;
  }), []), He(() => {
    if (j && (_.current = j), N && (V.current = N), j && N) {
      if (S.current)
        return S.current(j, N, x);
      x();
    }
  }, [j, N, x, S]);
  const P = m.useMemo(() => ({
    reference: _,
    floating: V,
    setReference: L,
    setFloating: F
  }), [L, F]), A = m.useMemo(() => ({
    reference: j,
    floating: N
  }), [j, N]), k = m.useMemo(() => {
    const I = {
      position: n,
      left: 0,
      top: 0
    };
    if (!A.floating)
      return I;
    const D = on(A.floating, f.x), M = on(A.floating, f.y);
    return a ? {
      ...I,
      transform: "translate(" + D + "px, " + M + "px)",
      ...Jn(A.floating) >= 1.5 && {
        willChange: "transform"
      }
    } : {
      position: n,
      left: D,
      top: M
    };
  }, [n, a, A.floating, f.x, f.y]);
  return m.useMemo(() => ({
    ...f,
    update: x,
    refs: P,
    elements: A,
    floatingStyles: k
  }), [f, x, P, A, k]);
}
/*!
* tabbable 6.2.0
* @license MIT, https://github.com/focus-trap/tabbable/blob/master/LICENSE
*/
var zi = ["input:not([inert])", "select:not([inert])", "textarea:not([inert])", "a[href]:not([inert])", "button:not([inert])", "[tabindex]:not(slot):not([inert])", "audio[controls]:not([inert])", "video[controls]:not([inert])", '[contenteditable]:not([contenteditable="false"]):not([inert])', "details>summary:first-of-type:not([inert])", "details:not([inert])"], Ct = /* @__PURE__ */ zi.join(","), Qn = typeof Element > "u", Te = Qn ? function() {
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
}, Yi = function(t) {
  var n, r = t == null || (n = t.getAttribute) === null || n === void 0 ? void 0 : n.call(t, "contenteditable");
  return r === "" || r === "true";
}, Xi = function(t, n, r) {
  if (Ye(t))
    return [];
  var o = Array.prototype.slice.apply(t.querySelectorAll(Ct));
  return n && Te.call(t, Ct) && o.unshift(t), o = o.filter(r), o;
}, Gi = function e(t, n, r) {
  for (var o = [], l = Array.from(t); l.length; ) {
    var i = l.shift();
    if (!Ye(i, !1))
      if (i.tagName === "SLOT") {
        var a = i.assignedElements(), u = a.length ? a : i.children, s = e(u, !0, r);
        r.flatten ? o.push.apply(o, s) : o.push({
          scopeParent: i,
          candidates: s
        });
      } else {
        var f = Te.call(i, Ct);
        f && r.filter(i) && (n || !t.includes(i)) && o.push(i);
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
  return t.tabIndex < 0 && (/^(AUDIO|VIDEO|DETAILS)$/.test(t.tagName) || Yi(t)) && !er(t) ? 0 : t.tabIndex;
}, Ji = function(t, n) {
  var r = tr(t);
  return r < 0 && n && !er(t) ? 0 : r;
}, Qi = function(t, n) {
  return t.tabIndex === n.tabIndex ? t.documentOrder - n.documentOrder : t.tabIndex - n.tabIndex;
}, nr = function(t) {
  return t.tagName === "INPUT";
}, el = function(t) {
  return nr(t) && t.type === "hidden";
}, tl = function(t) {
  var n = t.tagName === "DETAILS" && Array.prototype.slice.apply(t.children).some(function(r) {
    return r.tagName === "SUMMARY";
  });
  return n;
}, nl = function(t, n) {
  for (var r = 0; r < t.length; r++)
    if (t[r].checked && t[r].form === n)
      return t[r];
}, rl = function(t) {
  if (!t.name)
    return !0;
  var n = t.form || ze(t), r = function(a) {
    return n.querySelectorAll('input[type="radio"][name="' + a + '"]');
  }, o;
  if (typeof window < "u" && typeof window.CSS < "u" && typeof window.CSS.escape == "function")
    o = r(window.CSS.escape(t.name));
  else
    try {
      o = r(t.name);
    } catch (i) {
      return console.error("Looks like you have a radio button with a name attribute containing invalid CSS selector characters and need the CSS.escape polyfill: %s", i.message), !1;
    }
  var l = nl(o, t.form);
  return !l || l === t;
}, ol = function(t) {
  return nr(t) && t.type === "radio";
}, il = function(t) {
  return ol(t) && !rl(t);
}, ll = function(t) {
  var n, r = t && ze(t), o = (n = r) === null || n === void 0 ? void 0 : n.host, l = !1;
  if (r && r !== t) {
    var i, a, u;
    for (l = !!((i = o) !== null && i !== void 0 && (a = i.ownerDocument) !== null && a !== void 0 && a.contains(o) || t != null && (u = t.ownerDocument) !== null && u !== void 0 && u.contains(t)); !l && o; ) {
      var s, f, d;
      r = ze(o), o = (s = r) === null || s === void 0 ? void 0 : s.host, l = !!((f = o) !== null && f !== void 0 && (d = f.ownerDocument) !== null && d !== void 0 && d.contains(o));
    }
  }
  return l;
}, sn = function(t) {
  var n = t.getBoundingClientRect(), r = n.width, o = n.height;
  return r === 0 && o === 0;
}, sl = function(t, n) {
  var r = n.displayCheck, o = n.getShadowRoot;
  if (getComputedStyle(t).visibility === "hidden")
    return !0;
  var l = Te.call(t, "details>summary:first-of-type"), i = l ? t.parentElement : t;
  if (Te.call(i, "details:not([open]) *"))
    return !0;
  if (!r || r === "full" || r === "legacy-full") {
    if (typeof o == "function") {
      for (var a = t; t; ) {
        var u = t.parentElement, s = ze(t);
        if (u && !u.shadowRoot && o(u) === !0)
          return sn(t);
        t.assignedSlot ? t = t.assignedSlot : !u && s !== t.ownerDocument ? t = s.host : t = u;
      }
      t = a;
    }
    if (ll(t))
      return !t.getClientRects().length;
    if (r !== "legacy-full")
      return !0;
  } else if (r === "non-zero-area")
    return sn(t);
  return !1;
}, cl = function(t) {
  if (/^(INPUT|BUTTON|SELECT|TEXTAREA)$/.test(t.tagName))
    for (var n = t.parentElement; n; ) {
      if (n.tagName === "FIELDSET" && n.disabled) {
        for (var r = 0; r < n.children.length; r++) {
          var o = n.children.item(r);
          if (o.tagName === "LEGEND")
            return Te.call(n, "fieldset[disabled] *") ? !0 : !o.contains(t);
        }
        return !0;
      }
      n = n.parentElement;
    }
  return !1;
}, al = function(t, n) {
  return !(n.disabled || // we must do an inert look up to filter out any elements inside an inert ancestor
  //  because we're limited in the type of selectors we can use in JSDom (see related
  //  note related to `candidateSelectors`)
  Ye(n) || el(n) || sl(n, t) || // For a details element with a summary, the summary element gets the focus
  tl(n) || cl(n));
}, cn = function(t, n) {
  return !(il(n) || tr(n) < 0 || !al(t, n));
}, ul = function(t) {
  var n = parseInt(t.getAttribute("tabindex"), 10);
  return !!(isNaN(n) || n >= 0);
}, dl = function e(t) {
  var n = [], r = [];
  return t.forEach(function(o, l) {
    var i = !!o.scopeParent, a = i ? o.scopeParent : o, u = Ji(a, i), s = i ? e(o.candidates) : a;
    u === 0 ? i ? n.push.apply(n, s) : n.push(a) : r.push({
      documentOrder: l,
      tabIndex: u,
      item: o,
      isScope: i,
      content: s
    });
  }), r.sort(Qi).reduce(function(o, l) {
    return l.isScope ? o.push.apply(o, l.content) : o.push(l.content), o;
  }, []).concat(n);
}, rr = function(t, n) {
  n = n || {};
  var r;
  return n.getShadowRoot ? r = Gi([t], n.includeContainer, {
    filter: cn.bind(null, n),
    flatten: !1,
    getShadowRoot: n.getShadowRoot,
    shadowRootFilter: ul
  }) : r = Xi(t, n.includeContainer, cn.bind(null, n)), dl(r);
};
const fl = m.useInsertionEffect, ml = fl || ((e) => e());
function ye(e) {
  const t = m.useRef(() => {
    if (process.env.NODE_ENV !== "production")
      throw new Error("Cannot call an event handler while rendering.");
  });
  return ml(() => {
    t.current = e;
  }), m.useCallback(function() {
    for (var n = arguments.length, r = new Array(n), o = 0; o < n; o++)
      r[o] = arguments[o];
    return t.current == null ? void 0 : t.current(...r);
  }, []);
}
var Pe = typeof document < "u" ? xn : Z;
function Rt() {
  return Rt = Object.assign ? Object.assign.bind() : function(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = arguments[t];
      for (var r in n)
        Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
    }
    return e;
  }, Rt.apply(this, arguments);
}
let dt = !1, hl = 0;
const an = () => "floating-ui-" + hl++;
function pl() {
  const [e, t] = m.useState(() => dt ? an() : void 0);
  return Pe(() => {
    e == null && t(an());
  }, []), m.useEffect(() => {
    dt || (dt = !0);
  }, []), e;
}
const gl = m.useId, or = gl || pl;
function vl() {
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
const wl = /* @__PURE__ */ m.createContext(null), bl = /* @__PURE__ */ m.createContext(null), xl = () => {
  var e;
  return ((e = m.useContext(wl)) == null ? void 0 : e.id) || null;
}, ir = () => m.useContext(bl);
function Bt(e) {
  return "data-floating-ui-" + e;
}
function ft(e, t) {
  let n = e.filter((o) => {
    var l;
    return o.parentId === t && ((l = o.context) == null ? void 0 : l.open);
  }), r = n;
  for (; r.length; )
    r = e.filter((o) => {
      var l;
      return (l = r) == null ? void 0 : l.some((i) => {
        var a;
        return o.parentId === i.id && ((a = o.context) == null ? void 0 : a.open);
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
  const r = n.indexOf(di(xt(e)));
  return n.slice(r + 1)[0];
}
function yl() {
  return sr(document.body, "next");
}
function Cl() {
  return sr(document.body, "prev");
}
function mt(e, t) {
  const n = t || e.currentTarget, r = e.relatedTarget;
  return !r || !bt(n, r);
}
function Rl(e) {
  rr(e, lr()).forEach((n) => {
    n.dataset.tabindex = n.getAttribute("tabindex") || "", n.setAttribute("tabindex", "-1");
  });
}
function El(e) {
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
let Sl;
function un(e) {
  e.key === "Tab" && (e.target, clearTimeout(Sl));
}
const dn = /* @__PURE__ */ m.forwardRef(function(t, n) {
  const [r, o] = m.useState();
  Pe(() => (fi() && o("button"), document.addEventListener("keydown", un), () => {
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
  return /* @__PURE__ */ m.createElement("span", Rt({}, t, l));
}), ar = /* @__PURE__ */ m.createContext(null);
function Nl(e) {
  let {
    id: t,
    root: n
  } = e === void 0 ? {} : e;
  const [r, o] = m.useState(null), l = or(), i = Ol(), a = m.useMemo(() => ({
    id: t,
    root: n,
    portalContext: i,
    uniqueId: l
  }), [t, n, i, l]), u = m.useRef();
  return Pe(() => () => {
    r == null || r.remove();
  }, [r, a]), Pe(() => {
    if (u.current === a)
      return;
    u.current = a;
    const {
      id: s,
      root: f,
      portalContext: d,
      uniqueId: g
    } = a, h = s ? document.getElementById(s) : null, R = Bt("portal");
    if (h) {
      const C = document.createElement("div");
      C.id = g, C.setAttribute(R, ""), h.appendChild(C), o(C);
    } else {
      let C = f || (d == null ? void 0 : d.portalNode);
      C && !q(C) && (C = C.current), C = C || document.body;
      let w = null;
      s && (w = document.createElement("div"), w.id = s, C.appendChild(w));
      const b = document.createElement("div");
      b.id = g, b.setAttribute(R, ""), C = w || C, C.appendChild(b), o(b);
    }
  }, [a]), r;
}
function kl(e) {
  let {
    children: t,
    id: n,
    root: r = null,
    preserveTabOrder: o = !0
  } = e;
  const l = Nl({
    id: n,
    root: r
  }), [i, a] = m.useState(null), u = m.useRef(null), s = m.useRef(null), f = m.useRef(null), d = m.useRef(null), g = (
    // The FocusManager and therefore floating element are currently open/
    // rendered.
    !!i && // Guards are only for non-modal focus management.
    !i.modal && // Don't render if unmount is transitioning.
    i.open && o && !!(r || l)
  );
  return m.useEffect(() => {
    if (!l || !o || i != null && i.modal)
      return;
    function h(R) {
      l && mt(R) && (R.type === "focusin" ? El : Rl)(l);
    }
    return l.addEventListener("focusin", h, !0), l.addEventListener("focusout", h, !0), () => {
      l.removeEventListener("focusin", h, !0), l.removeEventListener("focusout", h, !0);
    };
  }, [l, o, i == null ? void 0 : i.modal]), /* @__PURE__ */ m.createElement(ar.Provider, {
    value: m.useMemo(() => ({
      preserveTabOrder: o,
      beforeOutsideRef: u,
      afterOutsideRef: s,
      beforeInsideRef: f,
      afterInsideRef: d,
      portalNode: l,
      setFocusManagerState: a
    }), [o, l])
  }, g && l && /* @__PURE__ */ m.createElement(dn, {
    "data-type": "outside",
    ref: u,
    onFocus: (h) => {
      if (mt(h, l)) {
        var R;
        (R = f.current) == null || R.focus();
      } else {
        const C = Cl() || (i == null ? void 0 : i.refs.domReference.current);
        C == null || C.focus();
      }
    }
  }), g && l && /* @__PURE__ */ m.createElement("span", {
    "aria-owns": l.id,
    style: cr
  }), l && /* @__PURE__ */ Cr(t, l), g && l && /* @__PURE__ */ m.createElement(dn, {
    "data-type": "outside",
    ref: s,
    onFocus: (h) => {
      if (mt(h, l)) {
        var R;
        (R = d.current) == null || R.focus();
      } else {
        const C = yl() || (i == null ? void 0 : i.refs.domReference.current);
        C == null || C.focus(), i != null && i.closeOnFocusOut && (i == null || i.onOpenChange(!1, h.nativeEvent));
      }
    }
  }));
}
const Ol = () => m.useContext(ar);
function fn(e) {
  return Q(e.target) && e.target.tagName === "BUTTON";
}
function mn(e) {
  return gi(e);
}
function Al(e, t) {
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
    event: a = "click",
    toggle: u = !0,
    ignoreMouse: s = !1,
    keyboardHandlers: f = !0
  } = t, d = m.useRef(), g = m.useRef(!1);
  return m.useMemo(() => i ? {
    reference: {
      onPointerDown(h) {
        d.current = h.pointerType;
      },
      onMouseDown(h) {
        h.button === 0 && (Qt(d.current, !0) && s || a !== "click" && (n && u && (!o.current.openEvent || o.current.openEvent.type === "mousedown") ? r(!1, h.nativeEvent, "click") : (h.preventDefault(), r(!0, h.nativeEvent, "click"))));
      },
      onClick(h) {
        if (a === "mousedown" && d.current) {
          d.current = void 0;
          return;
        }
        Qt(d.current, !0) && s || (n && u && (!o.current.openEvent || o.current.openEvent.type === "click") ? r(!1, h.nativeEvent, "click") : r(!0, h.nativeEvent, "click"));
      },
      onKeyDown(h) {
        d.current = void 0, !(h.defaultPrevented || !f || fn(h)) && (h.key === " " && !mn(l) && (h.preventDefault(), g.current = !0), h.key === "Enter" && r(!(n && u), h.nativeEvent, "click"));
      },
      onKeyUp(h) {
        h.defaultPrevented || !f || fn(h) || mn(l) || h.key === " " && g.current && (g.current = !1, r(!(n && u), h.nativeEvent, "click"));
      }
    }
  } : {}, [i, o, a, s, f, l, u, n, r]);
}
const Ml = {
  pointerdown: "onPointerDown",
  mousedown: "onMouseDown",
  click: "onClick"
}, Ll = {
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
function Dl(e, t) {
  t === void 0 && (t = {});
  const {
    open: n,
    onOpenChange: r,
    nodeId: o,
    elements: {
      reference: l,
      domReference: i,
      floating: a
    },
    dataRef: u
  } = e, {
    enabled: s = !0,
    escapeKey: f = !0,
    outsidePress: d = !0,
    outsidePressEvent: g = "pointerdown",
    referencePress: h = !1,
    referencePressEvent: R = "pointerdown",
    ancestorScroll: C = !1,
    bubbles: w,
    capture: b
  } = t, L = ir(), F = ye(typeof d == "function" ? d : () => !1), j = typeof d == "function" ? F : d, N = m.useRef(!1), _ = m.useRef(!1), {
    escapeKey: V,
    outsidePress: p
  } = hn(w), {
    escapeKey: S,
    outsidePress: v
  } = hn(b), x = ye((k) => {
    if (!n || !s || !f || k.key !== "Escape")
      return;
    const I = L ? ft(L.nodesRef.current, o) : [];
    if (!V && (k.stopPropagation(), I.length > 0)) {
      let D = !0;
      if (I.forEach((M) => {
        var K;
        if ((K = M.context) != null && K.open && !M.context.dataRef.current.__escapeKeyBubbles) {
          D = !1;
          return;
        }
      }), !D)
        return;
    }
    r(!1, mi(k) ? k.nativeEvent : k, "escape-key");
  }), E = ye((k) => {
    var I;
    const D = () => {
      var M;
      x(k), (M = Ae(k)) == null || M.removeEventListener("keydown", D);
    };
    (I = Ae(k)) == null || I.addEventListener("keydown", D);
  }), P = ye((k) => {
    const I = N.current;
    N.current = !1;
    const D = _.current;
    if (_.current = !1, g === "click" && D || I || typeof j == "function" && !j(k))
      return;
    const M = Ae(k), K = "[" + Bt("inert") + "]", Ve = xt(a).querySelectorAll(K);
    let Ne = q(M) ? M : null;
    for (; Ne && !Re(Ne); ) {
      const te = ve(Ne);
      if (Re(te) || !q(te))
        break;
      Ne = te;
    }
    if (Ve.length && q(M) && !hi(M) && // Clicked on a direct ancestor (e.g. FloatingOverlay).
    !bt(M, a) && // If the target root element contains none of the markers, then the
    // element was injected after the floating element rendered.
    Array.from(Ve).every((te) => !bt(Ne, te)))
      return;
    if (Q(M) && a) {
      const te = M.clientWidth > 0 && M.scrollWidth > M.clientWidth, le = M.clientHeight > 0 && M.scrollHeight > M.clientHeight;
      let ke = le && k.offsetX > M.clientWidth;
      if (le && ee(M).direction === "rtl" && (ke = k.offsetX <= M.offsetWidth - M.clientWidth), ke || te && k.offsetY > M.clientHeight)
        return;
    }
    const hr = L && ft(L.nodesRef.current, o).some((te) => {
      var le;
      return ut(k, (le = te.context) == null ? void 0 : le.elements.floating);
    });
    if (ut(k, a) || ut(k, i) || hr)
      return;
    const Wt = L ? ft(L.nodesRef.current, o) : [];
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
    r(!1, k, "outside-press");
  }), A = ye((k) => {
    var I;
    const D = () => {
      var M;
      P(k), (M = Ae(k)) == null || M.removeEventListener(g, D);
    };
    (I = Ae(k)) == null || I.addEventListener(g, D);
  });
  return m.useEffect(() => {
    if (!n || !s)
      return;
    u.current.__escapeKeyBubbles = V, u.current.__outsidePressBubbles = p;
    function k(M) {
      r(!1, M, "ancestor-scroll");
    }
    const I = xt(a);
    f && I.addEventListener("keydown", S ? E : x, S), j && I.addEventListener(g, v ? A : P, v);
    let D = [];
    return C && (q(i) && (D = ue(i)), q(a) && (D = D.concat(ue(a))), !q(l) && l && l.contextElement && (D = D.concat(ue(l.contextElement)))), D = D.filter((M) => {
      var K;
      return M !== ((K = I.defaultView) == null ? void 0 : K.visualViewport);
    }), D.forEach((M) => {
      M.addEventListener("scroll", k, {
        passive: !0
      });
    }), () => {
      f && I.removeEventListener("keydown", S ? E : x, S), j && I.removeEventListener(g, v ? A : P, v), D.forEach((M) => {
        M.removeEventListener("scroll", k);
      });
    };
  }, [u, a, i, l, f, j, g, n, r, C, s, V, p, x, S, E, P, v, A]), m.useEffect(() => {
    N.current = !1;
  }, [j, g]), m.useMemo(() => s ? {
    reference: {
      onKeyDown: x,
      [Ml[R]]: (k) => {
        h && r(!1, k.nativeEvent, "reference-press");
      }
    },
    floating: {
      onKeyDown: x,
      onMouseDown() {
        _.current = !0;
      },
      onMouseUp() {
        _.current = !0;
      },
      [Ll[g]]: () => {
        N.current = !0;
      }
    }
  } : {}, [s, h, g, R, r, x]);
}
let Et;
process.env.NODE_ENV !== "production" && (Et = /* @__PURE__ */ new Set());
function Il(e) {
  var t;
  e === void 0 && (e = {});
  const {
    open: n = !1,
    onOpenChange: r,
    nodeId: o
  } = e;
  if (process.env.NODE_ENV !== "production") {
    var l;
    const p = "Floating UI: Cannot pass a virtual element to the `elements.reference` option, as it must be a real DOM element. Use `refs.setPositionReference` instead.";
    if ((l = e.elements) != null && l.reference && !q(e.elements.reference)) {
      var i;
      if (!((i = Et) != null && i.has(p))) {
        var a;
        (a = Et) == null || a.add(p), console.error(p);
      }
    }
  }
  const [u, s] = m.useState(null), f = ((t = e.elements) == null ? void 0 : t.reference) || u, d = qi(e), g = ir(), h = xl() != null, R = ye((p, S, v) => {
    p && (w.current.openEvent = S), b.emit("openchange", {
      open: p,
      event: S,
      reason: v,
      nested: h
    }), r == null || r(p, S, v);
  }), C = m.useRef(null), w = m.useRef({}), b = m.useState(() => vl())[0], L = or(), F = m.useCallback((p) => {
    const S = q(p) ? {
      getBoundingClientRect: () => p.getBoundingClientRect(),
      contextElement: p
    } : p;
    d.refs.setReference(S);
  }, [d.refs]), j = m.useCallback((p) => {
    (q(p) || p === null) && (C.current = p, s(p)), (q(d.refs.reference.current) || d.refs.reference.current === null || // Don't allow setting virtual elements using the old technique back to
    // `null` to support `positionReference` + an unstable `reference`
    // callback ref.
    p !== null && !q(p)) && d.refs.setReference(p);
  }, [d.refs]), N = m.useMemo(() => ({
    ...d.refs,
    setReference: j,
    setPositionReference: F,
    domReference: C
  }), [d.refs, j, F]), _ = m.useMemo(() => ({
    ...d.elements,
    domReference: f
  }), [d.elements, f]), V = m.useMemo(() => ({
    ...d,
    refs: N,
    elements: _,
    dataRef: w,
    nodeId: o,
    floatingId: L,
    events: b,
    open: n,
    onOpenChange: R
  }), [d, o, L, b, n, R, N, _]);
  return Pe(() => {
    const p = g == null ? void 0 : g.nodesRef.current.find((S) => S.id === o);
    p && (p.context = V);
  }), m.useMemo(() => ({
    ...d,
    context: V,
    refs: N,
    elements: _
  }), [d, N, _, V]);
}
const pn = "active", gn = "selected";
function ht(e, t, n) {
  const r = /* @__PURE__ */ new Map(), o = n === "item";
  let l = e;
  if (o && e) {
    const {
      [pn]: i,
      [gn]: a,
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
      const a = i ? i[n] : null;
      return typeof a == "function" ? e ? a(e) : null : a;
    }).concat(e).reduce((i, a) => (a && Object.entries(a).forEach((u) => {
      let [s, f] = u;
      if (!(o && [pn, gn].includes(s)))
        if (s.indexOf("on") === 0) {
          if (r.has(s) || r.set(s, []), typeof f == "function") {
            var d;
            (d = r.get(s)) == null || d.push(f), i[s] = function() {
              for (var g, h = arguments.length, R = new Array(h), C = 0; C < h; C++)
                R[C] = arguments[C];
              return (g = r.get(s)) == null ? void 0 : g.map((w) => w(...R)).find((w) => w !== void 0);
            };
          }
        } else
          i[s] = f;
    }), i), {})
  };
}
function Tl(e) {
  e === void 0 && (e = []);
  const t = e, n = m.useCallback(
    (l) => ht(l, e, "reference"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    t
  ), r = m.useCallback(
    (l) => ht(l, e, "floating"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    t
  ), o = m.useCallback(
    (l) => ht(l, e, "item"),
    // Granularly check for `item` changes, because the `getItemProps` getter
    // should be as referentially stable as possible since it may be passed as
    // a prop to many components. All `item` key values must therefore be
    // memoized.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    e.map((l) => l == null ? void 0 : l.item)
  );
  return m.useMemo(() => ({
    getReferenceProps: n,
    getFloatingProps: r,
    getItemProps: o
  }), [n, r, o]);
}
function Pl({
  isOpen: e,
  setIsOpen: t,
  offset: n = 0,
  placement: r = "bottom-start",
  click: o = !0
}) {
  const { x: l, y: i, strategy: a, refs: u, context: s } = Il({
    open: e,
    onOpenChange: t,
    middleware: [Ai(), Oi(n), Ni()],
    whileElementsMounted: Ki,
    placement: r
  }), f = Al(s, {
    enabled: o
  }), d = Dl(s, {}), { getReferenceProps: g, getFloatingProps: h } = Tl([
    f,
    d
  ]);
  return {
    x: l,
    y: i,
    strategy: a,
    refs: u,
    getReferenceProps: g,
    getFloatingProps: h
  };
}
function oe({
  isOpen: e,
  setIsOpen: t,
  offset: n = 0,
  placement: r = "bottom-start",
  hover: o = !1,
  click: l = !0,
  onReferenceClick: i,
  children: a,
  portal: u
}) {
  const { x: s, y: f, strategy: d, refs: g, getReferenceProps: h, getFloatingProps: R } = Pl({
    isOpen: e,
    setIsOpen: t,
    offset: n,
    placement: r,
    hover: o,
    click: l
  }), [C, w] = xr.toArray(a), [b] = O(On);
  function L() {
    return e && /* @__PURE__ */ c(kl, { id: b, children: /* @__PURE__ */ c(
      "div",
      {
        ref: g.setFloating,
        style: {
          position: d,
          top: f ?? 0,
          left: s ?? 0
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
          top: f ?? 0,
          left: s ?? 0
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
    u ? L() : F()
  ] });
}
function Fl({
  rowId: e,
  colId: t,
  data: n,
  setData: r,
  focus: o,
  isViewOnly: l,
  configuration: i
}) {
  const [a] = O(re), u = W(
    () => a.parseDate !== void 0 ? a.parseDate(n, i) : n ? new Date(Date.parse(n)) : null,
    [n, i]
  ), [s, f] = H(
    u && u._isValid !== !1 ? Le(u) : ""
  ), d = /^([1-9]|1[012]|0[1-9])[/.-]?$/g, g = /^([1-9]|1[012]|0[1-9])[/.-]([1-9]||0[1-9]|1[0-9]|2[0-9]|3[01])[/.-]?$/g, h = /^([1-9]|1[012]|0[1-9])[/.-]([1-9]||0[1-9]|1[0-9]|2[0-9]|3[01])[/.-](\d?\d?\d?\d)$/g, [R, C] = H(null), w = /* @__PURE__ */ new Date(), [, b] = O(Tt), L = o === "editing", F = Y(
    (V) => {
      b({ rowId: e, colId: t, value: V ? "editing" : "focused" });
    },
    [e, t, b]
  );
  function j(V, p, S) {
    const v = Number(S), x = Number(V) - 1, E = Number(p), P = /* @__PURE__ */ new Date();
    return P.setUTCFullYear(v, x, E), P.setUTCHours(0, 0, 0, 0), P;
  }
  const N = Y(
    (V) => {
      a.formatStoredDate !== void 0 ? r(a.formatStoredDate(V, i) || "") : r((V == null ? void 0 : V.toISOString()) || ""), a.formatStoredDate !== void 0 ? f(a.formatStoredDate(u, i) || "") : f(Le(V)), b({ rowId: e, colId: t, value: "focused" });
    },
    [e, t, b, r]
  );
  Z(() => {
    R && R.focus();
  }, [R]), Z(() => {
    a.formatStoredDate !== void 0 ? f(a.formatStoredDate(u, i) || "") : f(u && u._isValid !== !1 ? Le(u) : "");
  }, [o]);
  function _(V) {
    f(V.target.value);
  }
  return ni(() => {
    if (!s || a.formatStoredDate !== void 0)
      return;
    let V = null;
    if (h.test(s)) {
      s.match(h);
      const [p] = s.matchAll(h);
      V = j(p[1], p[2], p[3]);
    } else if (d.test(s)) {
      s.match(d);
      const [p] = s.matchAll(d);
      V = j(p[1], 1, w.getUTCFullYear());
    } else if (g.test(s)) {
      s.match(g);
      const [p] = s.matchAll(g);
      V = j(
        p[1],
        p[2],
        w.getUTCFullYear()
      );
    }
    r((V == null ? void 0 : V.toISOString()) || "");
  }, [s]), /* @__PURE__ */ y(X, { children: [
    (o === "none" || o === "focused") && /* @__PURE__ */ c("div", { className: "p-1 flex items-center cursor-default w-full", children: u ? a.formatDisplayDate !== void 0 ? a.formatDisplayDate(u, i) : Le(u) : "" }),
    o === "editing" && !l && /* @__PURE__ */ y(oe, { isOpen: L, setIsOpen: F, offset: 4, children: [
      /* @__PURE__ */ y("div", { className: "h-full", children: [
        /* @__PURE__ */ c("input", { type: "data", className: "hidden", value: s, readOnly: !0 }),
        /* @__PURE__ */ c(
          "input",
          {
            placeholder: "mm/dd/yyyy",
            className: "rs-input focus:outline-none rounded p-1 w-full",
            onChange: _,
            value: s,
            ref: C
          }
        )
      ] }),
      /* @__PURE__ */ c(ci, { onSelect: N, value: (u == null ? void 0 : u._isValid) !== !1 ? u : null })
    ] })
  ] });
}
const jl = {
  32: "truncate",
  64: "line-clamp-2",
  96: "line-clamp-4",
  128: "line-clamp-5"
};
function Vl({ data: e, setData: t, focusState: n, isViewOnly: r }) {
  const [o, l] = H(null), i = W(() => e || "", [e]), [a] = O(It);
  function u(s) {
    s.preventDefault(), t(s.target.value);
  }
  return Z(() => {
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
          jl[a]
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
const _l = [
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
  options: e = _l,
  allOptions: t,
  onSelect: n,
  placeholder: r = "Search",
  inputRef: o,
  OptionRenderer: l,
  value: i = {},
  onNewOption: a,
  enableSearch: u = !0
}) {
  const [s, f] = H(e), d = s.find((v) => v.value === i.value), [g, h] = H(d || s[0]), [R, C] = H(!1), [w, b] = H(""), L = W(() => gt(), []), [F, j] = H({}), N = ae(!1);
  Z(() => {
    let v = !1;
    if (t)
      for (const E in t)
        t[E].name.toLowerCase() === w.toLowerCase() && (v = !0);
    const x = e.filter((E) => (E.name.toLowerCase() === w.toLowerCase() && (v = !0), E.name.toLowerCase().includes(w.toLowerCase())));
    f(x), N.current ? x.length > 0 ? h(x[0]) : h({
      value: w,
      name: w,
      color: L
    }) : h(d || x[0]), j(v ? {} : {
      value: w,
      name: w,
      color: L
    }), C(v);
  }, [w]);
  function _(v) {
    n == null || n(v);
  }
  function V(v) {
    C(!1), b(v.target.value), N.current = !0;
  }
  const p = Y((v) => {
    if (v.code === "Enter") {
      if (v.preventDefault(), s.length === 0 && R || !g.value)
        return;
      a && !R && a(F), _(g);
    } else if (v.code === "ArrowDown") {
      g || h(s[0]);
      const x = s.findIndex(
        (E) => E.value === g.value
      );
      h(s[(x + 1) % s.length]);
    } else if (v.code === "ArrowUp") {
      g || h(s[0]);
      const x = s.findIndex(
        (E) => E.value === g.value
      );
      h(
        s[(x + s.length - 1) % s.length]
      );
    }
  });
  function S(v) {
    v.preventDefault(), h(s[0]);
  }
  return /* @__PURE__ */ y(
    "div",
    {
      className: "w-full relative pt-2",
      onKeyDown: p,
      onMouseEnter: S,
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
          s.map((v) => /* @__PURE__ */ y(
            "li",
            {
              className: U(
                "hover:bg-hover-light px-2 p-1 cursor-default flex flex-row whitespace-nowrap",
                g && g.value === v.value && "bg-hover"
              ),
              onClick: (x) => {
                x.preventDefault(), _(v);
              },
              onMouseEnter: () => {
                h(v);
              },
              "aria-selected": g.value === v.value,
              onKeyDown: (x) => {
                x.code === "Enter" && _(v);
              },
              children: [
                l ? /* @__PURE__ */ c(l, { ...v }) : v.name,
                d && d.value === v.value && /* @__PURE__ */ c(Pt, { className: "w-4 h-4 ml-auto self-center" })
              ]
            },
            v.value
          )),
          a && w && !R && /* @__PURE__ */ y(
            "li",
            {
              className: U(
                "hover:bg-hover-light px-2 p-1 cursor-pointer flex flex-row whitespace-nowrap",
                g && g.value === F.value && "bg-hover"
              ),
              onClick: () => a(F),
              onMouseEnter: () => {
                h(F);
              },
              "aria-selected": !1,
              onKeyDown: (v) => {
                v.code === "Enter" && a(F);
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
function Bl({
  rowId: e,
  colId: t,
  data: n,
  setData: r,
  options: o,
  updateColumn: l,
  focusState: i,
  showOptionSearch: a,
  isViewOnly: u
}) {
  const s = W(
    () => ge(n) ? [] : n.split(",").map((b) => o.find((L) => L.value === b)),
    [n, o]
  ), [f, d] = H(null), g = i === "editing", [, h] = O(Tt), R = Y(
    (b) => {
      h({ rowId: e, colId: t, value: b ? "editing" : "focused" });
    },
    [t, e, h]
  ), C = o.filter(
    (b) => s.findIndex((L) => L.value === b.value) === -1
  );
  Z(() => {
    f && f.focus();
  }, [f]);
  const w = Y(
    (b) => {
      l({ id: t, options: [...o, b] }), r([...s.map((L) => L.value), b.value].join(",")), h({ rowId: e, colId: t, value: "focused" });
    },
    [t, e, s, o, l, r, h]
  );
  return /* @__PURE__ */ y(X, { children: [
    i === "none" && /* @__PURE__ */ c("div", { className: "p-1 flex items-center h-full overflow-hidden", children: /* @__PURE__ */ c("div", { className: "flex gap-1", children: s.map((b) => b ? /* @__PURE__ */ c(ce, { color: b.color, name: b.name }, b.name) : null) }) }),
    (i === "focused" || i === "editing") && /* @__PURE__ */ y(
      oe,
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
                s.map((b) => b ? /* @__PURE__ */ c(
                  ce,
                  {
                    color: b.color,
                    name: b.name,
                    onCancel: (L) => {
                      L.stopPropagation(), r(
                        n.split(",").filter((F) => F !== b.value).join(",")
                      );
                    }
                  },
                  b.name
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
                onSelect: (b) => {
                  r(
                    ge(n) ? b.value : `${n},${b.value}`
                  );
                },
                inputRef: d,
                OptionRenderer: ce,
                placeholder: "Search for an option...",
                onNewOption: w,
                enableSearch: a
              }
            )
          ] })
        ]
      }
    )
  ] });
}
function Hl({ data: e, setData: t, setError: n, focus: r, isViewOnly: o, configuration: l }) {
  const [i] = O(re), [a, u] = H(null), s = /^[+-]?(\d*(\.\d*)?)$/, f = W(() => i.parseNumber !== void 0 ? i.parseNumber(e, l) : Number.parseFloat(e), [e, l]);
  function d(g) {
    g.preventDefault(), (i.parseNumber !== void 0 ? !isNaN(i.parseNumber(g.target.value, l)) : s.test(g.target.value)) ? (t(g.target.value), n("")) : n("Please enter a number.");
  }
  return Z(() => {
    n(""), a && a.focus();
  }, [n, a]), /* @__PURE__ */ y(X, { children: [
    (r === "none" || r === "focused") && /* @__PURE__ */ c("div", { className: "p-1 flex items-center justify-end truncate cursor-default w-full", children: i.formatDisplayNumber !== void 0 ? i.formatDisplayNumber(f, l) : { data: e } }),
    r === "editing" && !o && /* @__PURE__ */ c(
      "input",
      {
        type: "text",
        value: (e || "").toString(),
        onChange: d,
        ref: u,
        className: "rs-input p-1 focus:outline-none w-full border-none text-sm rounded-sm truncate text-right"
      }
    )
  ] });
}
function $l({
  rowId: e,
  colId: t,
  data: n,
  setData: r,
  options: o,
  updateColumn: l,
  focusState: i,
  showOptionSearch: a,
  isViewOnly: u
}) {
  const s = W(
    () => Ie(n) ? {} : o.find((w) => w.value === n)
  ), [f, d] = H(null), g = i === "editing", [, h] = O(Tt), R = Y(
    (w) => {
      h({ rowId: e, colId: t, value: w ? "editing" : "focused" });
    },
    [t, e, h]
  );
  Z(() => {
    f && f.focus();
  }, [f]);
  const C = Y(
    (w) => {
      l({ id: t, options: [...o, w] }), r(w.value), h({ rowId: e, colId: t, value: "focused" });
    },
    [t, e, o, l]
  );
  return /* @__PURE__ */ y(X, { children: [
    i === "none" && /* @__PURE__ */ c("div", { className: "p-1 flex items-center h-full", children: s && /* @__PURE__ */ c(ce, { color: s.color, name: s.name }) }),
    u && (i === "focused" || i === "editing") && /* @__PURE__ */ c("div", { className: "flex items-center p-1 w-full h-full", children: s && /* @__PURE__ */ c(ce, { color: s.color, name: s.name }) }),
    !u && (i === "focused" || i === "editing") && /* @__PURE__ */ y(
      oe,
      {
        isOpen: g,
        setIsOpen: R,
        referenceClass: "w-full max-h-8",
        children: [
          /* @__PURE__ */ y(
            "div",
            {
              className: "flex items-center p-1 w-full h-full",
              tabIndex: i === "editing" ? 0 : -1,
              children: [
                s && /* @__PURE__ */ c(ce, { color: s.color, name: s.name }),
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
                OptionRenderer: ce,
                placeholder: "Search for an option...",
                value: s,
                onNewOption: C,
                enableSearch: a
              }
            )
          ] })
        ]
      }
    )
  ] });
}
function Wl({ data: e, setData: t, focusState: n, isViewOnly: r }) {
  const [o, l] = H(null), i = W(() => e || "", [e]);
  function a(u) {
    u.preventDefault(), t(u.target.value);
  }
  return Z(() => {
    o && (o.focus(), o.setSelectionRange(i.length + 1, i.length + 1), o.scrollLeft = o.scrollWidth);
  }, [o]), /* @__PURE__ */ y(X, { children: [
    (n === "none" || n === "focused") && /* @__PURE__ */ c("div", { className: "p-1 flex items-center cursor-default w-full", children: /* @__PURE__ */ c("div", { className: "truncate", children: e }) }),
    n === "editing" && !r && /* @__PURE__ */ c(
      "input",
      {
        ref: l,
        type: "text",
        value: i,
        onChange: a,
        tabIndex: -1,
        rows: 1,
        className: "focus:outline-none rs-input p-1 w-full border-none text-sm rounded-sm truncate resize-none max-h-8"
      }
    )
  ] });
}
function Ul({ ...e }) {
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
function Kl({ ...e }) {
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
function Zl({ ...e }) {
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
function ql({ data: e, setData: t, focusState: n, isViewOnly: r }) {
  const [o, l] = H(null), i = W(() => e || "", [e]);
  function a(u) {
    u.preventDefault(), t(u.target.value);
  }
  return Z(() => {
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
        onChange: a,
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
function zl({ data: e, setData: t, focusState: n, isViewOnly: r }) {
  const o = W(() => e || !1, [e]);
  return /* @__PURE__ */ c(X, { children: /* @__PURE__ */ c("span", { className: "flex items-center justify-center p-1.5", children: /* @__PURE__ */ c(Ht, { checked: o, toggle: () => t(!o), isViewOnly: r }) }) });
}
function Yl({ rowData: e, formula: t }) {
  return /* @__PURE__ */ c(X, { children: /* @__PURE__ */ c("div", { className: "p-1 flex items-center cursor-default w-full", children: /* @__PURE__ */ c("div", { className: "truncate", children: t && typeof t == "function" && t(e) }) }) });
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
    cell: Wl,
    icon: Kl,
    name: "Single-Line Text"
  },
  {
    type: "longText",
    cell: Vl,
    icon: Ul,
    name: "Long Text"
  },
  {
    type: "number",
    cell: Hl,
    icon: So,
    name: "Number"
  },
  {
    type: "select",
    cell: $l,
    icon: Fo,
    name: "Select"
  },
  {
    type: "date",
    cell: Fl,
    icon: Zl,
    name: "Date"
  },
  {
    type: "multiSelect",
    cell: Bl,
    icon: Lo,
    name: "Multiple Select"
  },
  {
    type: "url",
    cell: ql,
    icon: Oo,
    name: "URL"
  },
  {
    type: "checkbox",
    cell: zl,
    icon: vo,
    name: "Checkbox"
  },
  {
    type: "formula",
    cell: Yl,
    icon: Xl,
    name: "Formula"
  }
];
function Xe(e) {
  const [t] = O(re);
  return [...ur, ...t.extraColumnTypes].find((n) => n.type === e);
}
function Gl() {
  return ur;
}
const Jl = Ge.memo(es), Ql = Jl;
function es({ rowId: e, colId: t, data: n, rowData: r, setData: o }) {
  const [l, i] = H(""), a = ae(null), u = W(
    () => tt(e, t),
    [e, t]
  ), [s, f] = O(u), d = W(() => he(t), [t]), [g, h] = O(d), R = g.type === "custom" ? g.renderer : Xe(g.type).cell, C = W(
    () => ho(e, t),
    [e, t]
  ), [, w] = O(C);
  function b(N) {
    a.current && !a.current.contains(N.target) && f("none");
  }
  function L(N) {
    if (!a.current || N.target !== a.current) {
      N.code === "Escape" && f("focused");
      return;
    }
    N.code === "ArrowUp" ? (N.stopPropagation(), N.preventDefault(), w("up")) : N.code === "ArrowDown" ? (N.stopPropagation(), N.preventDefault(), w("down")) : N.code === "ArrowLeft" ? (N.stopPropagation(), N.preventDefault(), w("left")) : N.code === "ArrowRight" ? (N.stopPropagation(), N.preventDefault(), w("right")) : N.code === "Enter" ? (f("editing"), N.stopPropagation(), N.preventDefault()) : N.code === "Escape" && f("none");
  }
  function F(N) {
    a.current && N.target === a.current && f("focused");
  }
  function j(N) {
    N.stopPropagation(), !g.isViewOnly && f("editing");
  }
  return Z(() => s === "focused" ? (document == null || document.addEventListener("mousedown", b), a.current && a.current.focus(), () => {
    document == null || document.removeEventListener("mousedown", b);
  }) : s === "editing" ? (document == null || document.addEventListener("mousedown", b), () => {
    document == null || document.removeEventListener("mousedown", b);
  }) : s === "none" ? (a.current && a.current.blur(), () => {
  }) : () => {
  }, [s]), /* @__PURE__ */ c(
    "div",
    {
      className: "relative p-0 border-r bg-content focus:outline-none",
      style: { width: g.width },
      ref: a,
      onClick: F,
      onFocus: F,
      onDoubleClick: j,
      tabIndex: 0,
      onKeyDown: L,
      role: "gridcell",
      children: /* @__PURE__ */ y(
        "div",
        {
          className: U(
            "w-full rounded-sm min-h-full focus:outline-none",
            (s === "focused" || s === "editing") && "ring-2 ring-blue-500 absolute top-0 z-10"
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
                focus: s,
                focusState: s,
                setFocus: f,
                setData: o,
                showOptionSearch: g.showOptionSearch,
                isViewOnly: g.isViewOnly,
                rowData: r,
                formula: g.formula,
                configuration: g.configuration
              }
            ),
            s === "editing" && l && /* @__PURE__ */ c("div", { className: "text-xs p-1.5 py-2", children: l })
          ]
        }
      )
    }
  );
}
function ts(e, t) {
  if (e == null || e === "")
    return "(empty)";
  switch (t.type) {
    case "select": {
      const n = t.options.find((r) => r.value === e);
      return /* @__PURE__ */ c(ce, { color: n.color, name: n.name });
    }
    case "date":
      return Le(new Date(Date.parse(e)));
    default:
      return e;
  }
}
function ns({ groupVal: e }) {
  const [t] = O(Se), n = W(
    () => {
      var i;
      return he(((i = t[0]) == null ? void 0 : i.columnId) || "");
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
            children: /* @__PURE__ */ c(xo, { className: "w-4 h-4" })
          }
        ),
        /* @__PURE__ */ y("div", { className: "h-full p-1.5", children: [
          /* @__PURE__ */ c("div", { className: "text-xs tracking-wider uppercase font-medium text-secondary", children: r.name }),
          /* @__PURE__ */ c("div", { className: "flex mt-1", children: ts(e, r) })
        ] })
      ]
    }
  );
}
function rs({ groupVal: e }) {
  const [t] = O(Se), [, n] = O(Mn);
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
function os({ rowId: e, first: t, last: n, groupVal: r }) {
  const [o] = O(Se), [l] = O(At), [i] = O(lo), [a] = O(re);
  return /* @__PURE__ */ y(
    "div",
    {
      className: U(
        t && o.length > 0 && "mt-8",
        o.length > 0 && "ml-4"
      ),
      style: { width: i },
      children: [
        o.length > 0 && t && /* @__PURE__ */ c(ns, { groupVal: r }),
        !l[r] && /* @__PURE__ */ y(X, { children: [
          /* @__PURE__ */ c("div", { className: U(o.length > 0 && "border-l"), children: /* @__PURE__ */ c(is, { rowId: e }) }),
          a.addRow.enabled && a.addRow.body && n && /* @__PURE__ */ c(rs, { groupVal: r }),
          " "
        ] })
      ]
    }
  );
}
const is = Ge.memo(ls);
function ls({ rowId: e }) {
  const t = W(() => An(e), [e]), [n, r] = O(t), [o] = O(se), [l] = O(It), [i] = O(re), a = W(
    () => (u) => (s) => {
      r({ [u]: s });
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
      Ql,
      {
        rowId: e,
        colId: u,
        data: n[u],
        rowData: n,
        setData: a(u)
      },
      `${e}-${u}`
    ))
  ] });
}
const ss = yn(({ handleScroll: e }, t) => {
  const [n] = O(Me), [r] = O(re);
  return /* @__PURE__ */ c(
    "div",
    {
      className: "h-[calc(100%-65px)] overflow-auto border-b bg-background",
      onScroll: e,
      ref: t,
      children: /* @__PURE__ */ y("div", { className: "flex flex-row", children: [
        /* @__PURE__ */ y("div", { className: "flex flex-col", children: [
          n.map((o, l) => /* @__PURE__ */ c(
            os,
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
}), cs = ss, dr = [
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
    atomFactory: qr
  }
];
function vn(e) {
  return dr.find((t) => t.type === e);
}
function as() {
  return dr.map((e) => e.type);
}
const us = yn(({}, e) => {
  const [t] = O(se), [n] = O(Se);
  return /* @__PURE__ */ c("div", { className: "bg-header h-8", children: /* @__PURE__ */ y("div", { className: "h-8 flex relative", ref: e, children: [
    /* @__PURE__ */ c(
      "div",
      {
        style: { width: 64 },
        className: U(n.length > 0 && "ml-4", "shrink-0 border-r")
      }
    ),
    t.map((r) => /* @__PURE__ */ c(fs, { colId: r }, r)),
    /* @__PURE__ */ c("div", { className: "w-48 grow shrink-0" })
  ] }) });
}), ds = us;
function fs({ colId: e }) {
  const t = W(() => he(e), [e]), [n, r] = O(t), o = vn(n.summary), l = W(
    () => o ? o.atomFactory(n.id) : T(""),
    [o, n.id]
  ), [i] = O(l), a = as(), [u, s] = H(!1);
  function f(d) {
    r({ summary: d }), s(!1);
  }
  return /* @__PURE__ */ y(
    oe,
    {
      isOpen: u,
      setIsOpen: s,
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
                  f("");
                },
                children: /* @__PURE__ */ c("span", { className: "text-secondary", children: "None" })
              }
            ),
            a.map((d) => {
              const g = vn(d);
              return /* @__PURE__ */ c(
                B.Section.Button,
                {
                  onClick: () => {
                    f(g.type);
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
function ms({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ m.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ m.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ m.createElement("path", {
    fillRule: "evenodd",
    d: "M12 2.25a.75.75 0 0 1 .75.75v16.19l6.22-6.22a.75.75 0 1 1 1.06 1.06l-7.5 7.5a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 1 1 1.06-1.06l6.22 6.22V3a.75.75 0 0 1 .75-.75Z",
    clipRule: "evenodd"
  }));
}
const hs = m.forwardRef(ms), ps = hs;
function gs({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ m.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ m.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ m.createElement("path", {
    fillRule: "evenodd",
    d: "M11.47 2.47a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 1 1-1.06 1.06l-6.22-6.22V21a.75.75 0 0 1-1.5 0V4.81l-6.22 6.22a.75.75 0 1 1-1.06-1.06l7.5-7.5Z",
    clipRule: "evenodd"
  }));
}
const vs = m.forwardRef(gs), ws = vs;
function bs({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ m.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ m.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ m.createElement("path", {
    fillRule: "evenodd",
    d: "M6.97 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1-1.06 1.06L8.25 4.81V16.5a.75.75 0 0 1-1.5 0V4.81L3.53 8.03a.75.75 0 0 1-1.06-1.06l4.5-4.5Zm9.53 4.28a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V7.5a.75.75 0 0 1 .75-.75Z",
    clipRule: "evenodd"
  }));
}
const xs = m.forwardRef(bs), wn = xs;
function ys({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ m.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ m.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ m.createElement("path", {
    fillRule: "evenodd",
    d: "M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z",
    clipRule: "evenodd"
  }));
}
const Cs = m.forwardRef(ys), $t = Cs;
function Rs({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ m.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ m.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ m.createElement("path", {
    fillRule: "evenodd",
    d: "M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z",
    clipRule: "evenodd"
  }));
}
const Es = m.forwardRef(Rs), Ss = Es;
function Ns({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ m.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ m.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ m.createElement("path", {
    fillRule: "evenodd",
    d: "M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z",
    clipRule: "evenodd"
  }));
}
const ks = m.forwardRef(Ns), lt = ks;
function Os({ colId: e, supportedTypes: t }) {
  const [n] = O(W(() => he(e), [e])), [, r] = O(mo), o = W(() => et(e), [e]), [, l] = O(o);
  function i(a, u) {
    a.preventDefault(), r({ colId: n.id, type: u }), l(!1);
  }
  return /* @__PURE__ */ c(B, { children: /* @__PURE__ */ y(B.Section, { children: [
    /* @__PURE__ */ c("div", { className: "w-56" }),
    /* @__PURE__ */ c(B.Section.Item, { children: /* @__PURE__ */ c("span", { className: "uppercase font-medium text-secondary text-xs", children: "Property Type" }) }),
    t.map((a) => /* @__PURE__ */ y(
      B.Section.Button,
      {
        onClick: (u) => {
          i(u, a.type);
        },
        children: [
          /* @__PURE__ */ c(a.icon, { className: "w-4 h-4 mr-2" }),
          /* @__PURE__ */ c("span", { children: a.name })
        ]
      },
      a.name
    ))
  ] }) });
}
function St({ ...e }) {
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
function As({
  colId: e,
  sortCallback: t,
  filterCallback: n,
  deleteCallback: r
}) {
  const [o, l] = O(W(() => he(e), [e])), i = ae(), a = o.type === "custom" ? o.icon : Xe(o.type).icon, u = o.type === "custom" ? "Custom" : Xe(o.type).name, [, s] = O(Dn), [, f] = O(In), d = W(() => et(e), [e]), [, g] = O(d), [h] = O(re), R = W(() => [...Gl(), ...h.extraColumnTypes], []);
  Z(() => {
    i.current && i.current.select();
  }, [i]);
  function C(v) {
    v.preventDefault(), l({ name: v.target.value });
  }
  function w(v) {
    v.code;
  }
  function b(v) {
    v.preventDefault(), r(o), g(!1);
  }
  function L(v) {
    v.preventDefault(), v.stopPropagation(), t([{ columnId: o.id, order: "asc" }]), s(!0), g(!1);
  }
  function F(v) {
    v.preventDefault(), v.stopPropagation(), t([{ columnId: o.id, order: "desc" }]), s(!0), g(!1);
  }
  function j(v) {
    v.preventDefault(), v.stopPropagation(), n([{ columnId: o.id, type: "contains", value: "" }]), f(!0), g(!1);
  }
  const N = [
    [
      {
        name: "Sort Ascending",
        icon: ws,
        action: L,
        enabled: h.sorting.enabled
      },
      {
        name: "Sort Descending",
        icon: ps,
        action: F,
        enabled: h.sorting.enabled
      },
      {
        name: "Filter",
        icon: St,
        action: j,
        enabled: h.filtering.enabled
      }
    ],
    [
      {
        name: "Delete",
        icon: Ss,
        action: b,
        disabled: o.is_primary === "true" || o.is_primary === !0,
        enabled: h.deleteColumns.enabled
      }
    ]
  ], [_, V] = H(!1), [p, S] = H(null);
  if (_)
    return /* @__PURE__ */ c(Os, { colId: e, supportedTypes: R });
  if (p !== null) {
    const v = h.extraColumnHeaderPopupActions[p];
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
        a && /* @__PURE__ */ c(a, { className: "w-4 h-4 mr-2" }),
        u
      ] }),
      h.extraColumnHeaderPopupActions.filter((v) => v.section === "main").map((v, x) => /* @__PURE__ */ c(v.menuItem, { column: o, showPopup: () => {
        S(x);
      } }, x))
    ] }),
    N.map(
      (v, x) => v.findIndex((E) => E.enabled === !0) !== -1 && /* @__PURE__ */ y(B.Section, { children: [
        v.map(
          (E) => E.enabled && /* @__PURE__ */ y(
            B.Section.Button,
            {
              onClick: E.action,
              disabled: E.disabled,
              children: [
                /* @__PURE__ */ c(E.icon, { className: "w-4 h-4 mr-2" }),
                /* @__PURE__ */ c("span", { children: E.name })
              ]
            },
            E.name
          )
        ),
        h.extraColumnHeaderPopupActions.filter((E) => E.section === "actions" + (x + 1)).map((E, P) => /* @__PURE__ */ c(E.menuItem, { column: o, showPopup: () => {
          S(P);
        } }, P))
      ] }, v[0].name)
    )
  ] });
}
function Ms({
  colId: e,
  deleteCallback: t,
  sortCallback: n,
  filterCallback: r
}) {
  const [o, l] = O(W(() => he(e), [e])), i = o.type === "custom" ? o.icon : Xe(o.type).icon, [a, u] = H(o.width), [s, f] = H(!1), d = W(() => et(e), [e]), [g, h] = O(d), [R] = O(re);
  function C(w) {
    w.preventDefault();
    const b = w.pageX, L = a;
    f(!0);
    function F(j) {
      const N = Math.max(
        128,
        L + j.pageX - b
      );
      u(N), l({ width: N });
    }
    window.addEventListener("mousemove", F), window.addEventListener("mouseup", () => {
      window.removeEventListener("mousemove", F), f(!1);
    });
  }
  return /* @__PURE__ */ y("div", { className: "relative", children: [
    /* @__PURE__ */ y(
      oe,
      {
        isOpen: R.editColumns.enabled && o.isEditable && g && o.type !== "custom",
        setIsOpen: h,
        portal: !0,
        children: [
          /* @__PURE__ */ y(
            "div",
            {
              className: "p-1 px-2 font-normal flex items-center border-r hover:bg-hover-light h-8",
              style: { width: a },
              children: [
                i && /* @__PURE__ */ c(i, { className: "w-4 h-4 mr-2 shrink-0" }),
                /* @__PURE__ */ c("span", { className: "whitespace-nowrap truncate", children: o.name })
              ]
            }
          ),
          /* @__PURE__ */ c(
            As,
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
          s && "bg-blue-500/30"
        ),
        onMouseDown: C,
        role: "none"
      }
    )
  ] });
}
const Ls = Ge.forwardRef((e, t) => {
  const [n] = O(se), [r] = O(ao), o = kt(uo), [l] = O(Lt), [i] = O(Se), [, a] = O(oo), [, u] = O(Tn), [, s] = O(Fn), f = Y(
    (w) => {
      s({ filtering: w });
    },
    [s]
  ), d = Y(
    (w) => {
      u({ sorting: w });
    },
    [u]
  ), [, g] = O(io), h = Y((w) => {
    if (l.find((b) => b.columnId === w.id)) {
      const b = l.filter((L) => L.columnId !== w.id);
      d(b);
    }
    g({ id: w.id });
  });
  function R(w) {
    w.preventDefault(), a({
      id: Je(),
      name: `Column-${pt()}`,
      type: "text",
      width: 192,
      position: n.length,
      isVisible: !0,
      isEditable: !0
    });
  }
  const [C] = O(re);
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
            Ms,
            {
              colId: w,
              sortCallback: d,
              filterCallback: f,
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
}), Ds = Ls;
function Is(e, t) {
  let n = null;
  return (...r) => {
    window.clearTimeout(n), n = window.setTimeout(() => {
      e.apply(null, r);
    }, t);
  };
}
const Ts = [
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
  options: e = Ts,
  value: t = {},
  onSelect: n
}) {
  const [r, o] = H(!1), [l, i] = H(t), a = e.find((s) => s.value === l.value);
  function u(s) {
    i(s), o(!1), n == null || n(s);
  }
  return /* @__PURE__ */ c("div", { className: "w-full relative", children: /* @__PURE__ */ y(
    oe,
    {
      isOpen: r,
      setIsOpen: o,
      offset: 4,
      portal: !0,
      children: [
        /* @__PURE__ */ y("div", { className: "rs-btn flex flex-row relative w-full border rounded p-1 pl-2 items-center hover:bg-hover focus:outline-none cursor-default", children: [
          /* @__PURE__ */ c("div", { className: "text-ellipsis flex-grow text-left whitespace-nowrap overflow-hidden", children: l.name ? /* @__PURE__ */ c("span", { children: l.name }) : /* @__PURE__ */ c("span", { className: "text-secondary", children: "Select" }) }),
          /* @__PURE__ */ c(Jo, { className: "w-4 h-4 duration-100 ml-auto" })
        ] }),
        /* @__PURE__ */ c("div", { className: "min-w-full w-max focus:outline-none", children: /* @__PURE__ */ y(B, { children: [
          /* @__PURE__ */ c("div", { className: "w-48" }),
          /* @__PURE__ */ c(B.Section, { children: e.map((s) => /* @__PURE__ */ y(
            B.Section.Button,
            {
              onClick: () => {
                u(s);
              },
              children: [
                /* @__PURE__ */ c("span", { children: s.name }),
                /* @__PURE__ */ c("span", { className: "ml-auto", children: a.value === s.value && /* @__PURE__ */ c(Pt, { className: "w-4 h-4" }) })
              ]
            },
            s.value
          )) })
        ] }) })
      ]
    }
  ) });
}
function Ps({ columns: e, filter: t, setFilter: n }) {
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
  Z(() => {
    r && r.focus();
  }, [r]);
  const a = W(
    () => Is((s, f) => {
      n((d) => {
        const g = d.findIndex((h) => h.id === s.id);
        return [
          ...d.slice(0, g),
          {
            ...d[g],
            value: f
          },
          ...d.slice(g + 1, d.length)
        ];
      });
    }, 150),
    []
  );
  function u(s) {
    var f;
    return (f = e.find((d) => d.id === s)) == null ? void 0 : f.type;
  }
  return /* @__PURE__ */ y(B, { children: [
    /* @__PURE__ */ c("div", { className: "w-56" }),
    t.length > 0 ? /* @__PURE__ */ y(B.Section, { children: [
      /* @__PURE__ */ c("h3", { className: "text-sm mb-3 px-3 font-medium", children: "Filter By" }),
      /* @__PURE__ */ c("div", { className: "px-3 flex flex-col space-y-3", children: t.map((s) => /* @__PURE__ */ y(
        "div",
        {
          className: "flex flex-row space-x-2",
          children: [
            /* @__PURE__ */ c("div", { className: "w-36", children: /* @__PURE__ */ c(
              Ee,
              {
                options: e.map((f) => ({
                  value: f.id,
                  name: f.name
                })),
                value: {
                  value: s.columnId,
                  name: e.find((f) => f.id === s.columnId).name
                },
                onSelect: (f) => n((d) => {
                  const g = d.findIndex((h) => h.id === s.id);
                  return [
                    ...d.slice(0, g),
                    {
                      ...d[g],
                      type: u(f.value) === "number" ? "equals" : "contains",
                      columnId: f.value
                    },
                    ...d.slice(g + 1, d.length)
                  ];
                })
              }
            ) }),
            /* @__PURE__ */ c("div", { className: "w-28", children: /* @__PURE__ */ c(
              Ee,
              {
                options: u(s.columnId) === "number" ? i : l,
                value: u(s.columnId) === "number" ? i.find(
                  (f) => f.value === s.type
                ) : l.find((f) => f.value === s.type),
                onSelect: (f) => n((d) => {
                  const g = d.findIndex((h) => h.id === s.id);
                  return [
                    ...d.slice(0, g),
                    {
                      ...d[g],
                      type: f.value
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
                defaultValue: s.value,
                placeholder: "Type a value...",
                onChange: (f) => a(s, f.target.value)
              }
            ) }),
            /* @__PURE__ */ c(
              "div",
              {
                className: "rs-btn flex items-center justify-center hover:bg-hover-light px-2 rounded hover:cursor-pointer",
                onClick: () => n((f) => f.filter((d) => d.id !== s.id)),
                "aria-label": "cancel-filter",
                children: /* @__PURE__ */ c(lt, { className: "h-4 w-4" })
              }
            )
          ]
        },
        `filter-${s.columnId}`
      )) }),
      /* @__PURE__ */ c("div", { className: "py-2 px-3", children: /* @__PURE__ */ y(
        "button",
        {
          className: "rs-btn flex items-center justify-center bg-transparent rounded gap-x-1 h-6 font-thin hover:cursor-pointer text-sm p-0",
          onClick: () => n((s) => [
            ...s,
            {
              id: pt(),
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
        options: e.map((s) => ({
          value: s.id,
          name: s.name
        })),
        onSelect: (s) => n([
          {
            id: pt(),
            columnId: s.value,
            type: u(s.value) === "number" ? "equals" : "contains",
            value: ""
          }
        ]),
        inputRef: o,
        placeholder: "Filter by..."
      }
    )
  ] });
}
function Fs({ setFilter: e }) {
  const [t] = O(Pn), [n] = O(Qr), [r, o] = O(In);
  return /* @__PURE__ */ y(
    oe,
    {
      isOpen: r,
      setIsOpen: o,
      offset: 4,
      portal: !0,
      portalId: "table",
      children: [
        Object.keys(t).length > 0 ? /* @__PURE__ */ y("div", { className: "rs-btn h-8 hover:ring-2 hover:ring-black/10 hover:ring-inset bg-indigo-200 px-3 rounded text-sm flex row items-center cursor-default text-dark", children: [
          /* @__PURE__ */ c(St, { className: "w-4 h-4 mr-1" }),
          /* @__PURE__ */ c("span", { children: `Filtered by ${Object.keys(t).length} field` })
        ] }) : /* @__PURE__ */ y(
          "div",
          {
            className: U(
              "rs-btn h-8 hover:bg-hover px-3 rounded text-sm flex flex-row items-center cursor-default",
              r && "bg-hover"
            ),
            children: [
              /* @__PURE__ */ c(St, { className: "w-4 h-4 mr-1" }),
              /* @__PURE__ */ c("span", { children: "Filter data" })
            ]
          }
        ),
        /* @__PURE__ */ c(Ps, { columns: n, filter: t, setFilter: e })
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
function js({ columns: e, grouping: t, setGroup: n }) {
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
  return Z(() => {
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
                options: e.map((a) => ({
                  value: a.id,
                  name: a.name
                })),
                value: {
                  value: i.columnId,
                  name: e.find((a) => a.id === i.columnId).name
                },
                onSelect: (a) => n([{ columnId: a.value, order: "asc" }])
              }
            ) }),
            /* @__PURE__ */ c("div", { className: "w-28", children: /* @__PURE__ */ c(
              Ee,
              {
                options: l,
                value: l.find((a) => a.value === i.order),
                onSelect: (a) => n([
                  {
                    columnId: i.columnId,
                    order: a.value
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
                children: /* @__PURE__ */ c(lt, { className: "h-4 w-4" })
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
function Vs({ grouping: e = [], setGroup: t }) {
  const [n, r] = H(!1), [o] = O(Ln);
  return /* @__PURE__ */ y(
    oe,
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
        /* @__PURE__ */ c(js, { columns: o, grouping: e, setGroup: t })
      ]
    }
  );
}
function _s({ value: e, setValue: t }) {
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
function Bs({ colId: e }) {
  const [t, n] = O(W(() => he(e), [e]));
  return /* @__PURE__ */ y(B.Section.Item, { children: [
    /* @__PURE__ */ c(
      _s,
      {
        value: t.isVisible,
        setValue: (r) => n({ isVisible: r })
      }
    ),
    /* @__PURE__ */ c("span", { className: "ml-2", children: t.name })
  ] }, t.id);
}
function Hs({ setColumnVisibility: e }) {
  const [t] = O(eo);
  return /* @__PURE__ */ y(B, { children: [
    /* @__PURE__ */ c("div", { className: "w-48" }),
    /* @__PURE__ */ c(B.Section, { children: t.map((n) => /* @__PURE__ */ c(Bs, { colId: n })) })
  ] });
}
function $s({ setColumnVisibility: e }) {
  const [t, n] = H(!1), [r] = O(to);
  return /* @__PURE__ */ y(oe, { isOpen: t, setIsOpen: n, offset: 4, portal: !0, children: [
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
    /* @__PURE__ */ c(Hs, { setColumnVisibility: e })
  ] });
}
function Ws({ ...e }) {
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
function Us({ ...e }) {
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
function Ks({ ...e }) {
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
function Zs({ ...e }) {
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
    icon: Ws
  },
  {
    value: 64,
    name: "Medium",
    icon: Us
  },
  {
    value: 96,
    name: "Tall",
    icon: Ks
  },
  {
    value: 128,
    name: "Extra Tall",
    icon: Zs
  }
];
function mr(e) {
  return fr.find((t) => t.value === e);
}
function qs() {
  return fr.map((e) => e.value);
}
function zs({ height: e, setHeight: t }) {
  const n = qs();
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
function Ys({ height: e, setHeight: t }) {
  const [n, r] = H(!1), o = mr(e);
  return /* @__PURE__ */ y(
    oe,
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
        /* @__PURE__ */ c(zs, { height: e, setHeight: t })
      ]
    }
  );
}
function Xs({ active: e, Icon: t, text: n, bgColor: r }) {
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
function Gs({ sort: e, setSort: t }) {
  const [n, r] = H(null), [o] = O(Ln), l = [
    {
      value: "asc",
      name: "Ascending"
    },
    {
      value: "desc",
      name: "Descending"
    }
  ];
  return Z(() => {
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
                options: o.map((a) => ({
                  value: a.id,
                  name: a.name
                })),
                value: {
                  value: i.columnId,
                  name: o.find((a) => a.id === i.columnId).name
                },
                onSelect: (a) => t([{ columnId: a.value, order: "asc" }])
              }
            ) }),
            /* @__PURE__ */ c("div", { className: "w-28", children: /* @__PURE__ */ c(
              Ee,
              {
                options: l,
                value: l.find((a) => a.value === i.order),
                onSelect: (a) => t([
                  {
                    columnId: i.columnId,
                    order: a.value
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
                children: /* @__PURE__ */ c(lt, { className: "h-4 w-4" })
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
function Js({ setSort: e }) {
  const [t] = O(Lt), [n, r] = O(Dn);
  return /* @__PURE__ */ y(
    oe,
    {
      isOpen: n,
      setIsOpen: r,
      offset: 4,
      portal: !0,
      portalId: "table",
      children: [
        t.length > 0 ? /* @__PURE__ */ c(
          Xs,
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
        /* @__PURE__ */ c(Gs, { sort: t, setSort: e })
      ]
    }
  );
}
function Qs() {
  const [e] = O(Jr), [t] = O(Pn), [n] = O(Lt), [r] = O(Se), [o] = O(It), [l] = O(Gr), [, i] = O(Fn), a = kt(fo), [, u] = O(zr), [, s] = O(Mn), [, f] = O(Yr), [d] = O(re), g = Y((N) => {
    i({ filtering: N });
  }, []), h = Y((N) => {
    N.preventDefault(), u();
  }, []);
  function R(N) {
    s({ id: Je() });
  }
  const [, C] = O(Tn), w = Y((N) => {
    C({ sorting: N });
  }, []), [, b] = O(co), L = Y((N) => {
    b({ rowHeight: N });
  }, []), [, F] = O(so), j = Y((N) => {
    F({ grouping: N });
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
              onClick: () => a(),
              children: [
                /* @__PURE__ */ c(lt, { className: "w-4 h-4 mr-1" }),
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
                /* @__PURE__ */ c(_o, { className: "w-4 h-4 mr-1" }),
                /* @__PURE__ */ c("span", { children: "Delete" })
              ]
            }
          ),
          /* @__PURE__ */ c("div", { className: "bg-content h-4 w-px last:hidden" }),
          d.rowSelectionButtons.map((N) => /* @__PURE__ */ y(X, { children: [
            /* @__PURE__ */ c(
              "div",
              {
                className: "rs-btn self-stretch hover:bg-hover-light px-2 rounded-r text-sm flex flex-row items-center",
                onClick: () => f({
                  handler: N.handler
                }),
                children: N.body
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
        d.hideFields.enabled && /* @__PURE__ */ c($s, {}),
        d.filtering.enabled && /* @__PURE__ */ c(Fs, { filter: t, setFilter: g }),
        d.grouping.enabled && /* @__PURE__ */ c(Vs, { grouping: r, setGroup: j }),
        d.sorting.enabled && /* @__PURE__ */ c(Js, { sort: n, setSort: w }),
        d.rowHeight.enabled && /* @__PURE__ */ c(Ys, { height: o, setHeight: L })
      ] })
    }
  );
}
const ec = {
  light: "",
  dark: "dark"
};
function tc() {
  const e = ae(null), t = ae(null), n = ae(null), [r] = O(re);
  Z(() => {
    if (!n.current)
      return () => null;
    function i(a) {
      e.current.scrollLeft = n.current.scrollLeft, e.current.style.transform = `translate3d(-${n.current.scrollLeft}px, 0, 0)`, t.current && (t.current.style.transform = `translate3d(-${n.current.scrollLeft}px, 0, 0)`);
    }
    n.current.addEventListener("scroll", i);
  }, []), Z(() => {
    if (!e.current)
      return () => null;
    function i(a) {
      a.preventDefault(), n.current.scrollLeft += a.deltaX;
    }
    e.current.addEventListener("mousewheel", i, {
      passive: !1
    });
  }, []), Z(() => {
    if (!t.current)
      return () => null;
    function i(a) {
      a.preventDefault(), n.current.scrollLeft += a.deltaX;
    }
    t.current.addEventListener("mousewheel", i, {
      passive: !1
    });
  }, []);
  const [o, l] = O(On);
  return Z(() => {
    l(Je());
  }, []), /* @__PURE__ */ y(
    "div",
    {
      className: U(
        "h-full w-full relative rs-table text-sm text-primary overflow-hidden",
        ec[r.theme.color]
      ),
      id: o,
      children: [
        r.toolbar.enabled && /* @__PURE__ */ c(Qs, {}),
        /* @__PURE__ */ y("div", { className: "h-[calc(100%-48px)] overflow-hidden", children: [
          /* @__PURE__ */ c(Ds, { ref: e }),
          /* @__PURE__ */ c(cs, { ref: n }),
          r.footer.enabled && /* @__PURE__ */ c(ds, { ref: t })
        ] })
      ]
    }
  );
}
function nc({ data: e, columns: t, onChange: n, config: r, children: o }) {
  return Ir([
    [ro, t],
    [Xr, e],
    [Zr, { onChange: n }],
    [Kr, r]
  ]), o;
}
function ac({
  data: e,
  columns: t,
  onChange: n = () => null,
  config: r = {},
  licenseKey: o
}) {
  return /* @__PURE__ */ c(Ar, { children: /* @__PURE__ */ c(
    nc,
    {
      data: e,
      columns: t,
      onChange: n,
      config: r,
      children: /* @__PURE__ */ c(tc, {})
    }
  ) });
}
export {
  cc as EVALUATION_LICENSE,
  ac as default
};
