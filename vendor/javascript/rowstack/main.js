import "./main.css";
import { jsx as s, jsxs as y, Fragment as X } from "react/jsx-runtime";
import * as m from "react";
import Ge, { createContext as pr, useRef as ae, createElement as gr, useCallback as Y, useContext as vr, useReducer as wr, useEffect as q, useDebugValue as br, useState as $, useLayoutEffect as xn, Children as xr, useMemo as W, forwardRef as yn } from "react";
import * as yr from "react-dom";
import { createPortal as Cr } from "react-dom";
var z = { BASE_URL: "/", MODE: "production", DEV: !1, PROD: !0, SSR: !1 };
let Rr = 0;
function P(e, t) {
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
const st = (e) => "init" in e, ct = (e) => !!e.write, He = /* @__PURE__ */ new WeakMap(), Er = (e, t) => {
  He.set(e, t), e.catch(() => {
  }).finally(() => He.delete(e));
}, Ut = (e, t) => {
  const n = He.get(e);
  n && (He.delete(e), n(t));
}, Kt = (e, t) => {
  e.status = "fulfilled", e.value = t;
}, qt = (e, t) => {
  e.status = "rejected", e.reason = t;
}, Sr = (e) => typeof (e == null ? void 0 : e.then) == "function", Ae = (e, t) => !!e && "v" in e && "v" in t && Object.is(e.v, t.v), Zt = (e, t) => !!e && "e" in e && "e" in t && Object.is(e.e, t.e), xe = (e) => !!e && "v" in e && e.v instanceof Promise, Nr = (e, t) => "v" in e && "v" in t && e.v.orig && e.v.orig === t.v.orig, _e = (e) => {
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
  }, c = (p, S, v) => {
    const x = /* @__PURE__ */ new Map();
    let E = !1;
    v.forEach((F, O) => {
      !F && O === p && (F = S), F ? (x.set(O, F), S.d.get(O) !== F && (E = !0)) : (z ? "production" : void 0) !== "production" && console.warn("[Bug] atom state not found");
    }), (E || S.d.size !== x.size) && (S.d = x);
  }, u = (p, S, v) => {
    const x = l(p), E = {
      d: (x == null ? void 0 : x.d) || /* @__PURE__ */ new Map(),
      v: S
    };
    if (v && c(p, E, v), Ae(x, E) && x.d === E.d)
      return x;
    if (xe(x) && xe(E) && Nr(x, E)) {
      if (x.d === E.d)
        return x;
      E.v = x.v;
    }
    return i(p, E), E;
  }, a = (p, S, v, x) => {
    if (Sr(S)) {
      let E;
      const F = () => {
        const k = l(p);
        if (!xe(k) || k.v !== O)
          return;
        const D = u(
          p,
          O,
          v
        );
        t.has(p) && k.d !== D.d && M(p, D, k.d);
      }, O = new Promise((k, D) => {
        let I = !1;
        S.then(
          (L) => {
            I || (I = !0, Kt(O, L), k(L), F());
          },
          (L) => {
            I || (I = !0, qt(O, L), D(L), F());
          }
        ), E = (L) => {
          I || (I = !0, L.then(
            (K) => Kt(O, K),
            (K) => qt(O, K)
          ), k(L));
        };
      });
      return O.orig = S, O.status = "pending", Er(O, (k) => {
        k && E(k), x == null || x();
      }), u(p, O, v);
    }
    return u(p, S, v);
  }, f = (p, S, v) => {
    const x = l(p), E = {
      d: (x == null ? void 0 : x.d) || /* @__PURE__ */ new Map(),
      e: S
    };
    return v && c(p, E, v), Zt(x, E) && x.d === E.d ? x : (i(p, E), E);
  }, d = (p, S) => {
    const v = l(p);
    if (!S && v && (t.has(p) || Array.from(v.d).every(([I, L]) => {
      if (I === p)
        return !0;
      const K = d(I);
      return K === L || Ae(K, L);
    })))
      return v;
    const x = /* @__PURE__ */ new Map();
    let E = !0;
    const F = (I) => {
      if (I === p) {
        const K = l(I);
        if (K)
          return x.set(I, K), _e(K);
        if (st(I))
          return x.set(I, void 0), I.init;
        throw new Error("no atom init");
      }
      const L = d(I);
      return x.set(I, L), _e(L);
    };
    let O, k;
    const D = {
      get signal() {
        return O || (O = new AbortController()), O.signal;
      },
      get setSelf() {
        return (z ? "production" : void 0) !== "production" && !ct(p) && console.warn("setSelf function cannot be used with read-only atom"), !k && ct(p) && (k = (...I) => {
          if ((z ? "production" : void 0) !== "production" && E && console.warn("setSelf function cannot be called in sync"), !E)
            return N(p, ...I);
        }), k;
      }
    };
    try {
      const I = p.read(F, D);
      return a(
        p,
        I,
        x,
        () => O == null ? void 0 : O.abort()
      );
    } catch (I) {
      return f(p, I, x);
    } finally {
      E = !1;
    }
  }, g = (p) => _e(d(p)), h = (p) => {
    let S = t.get(p);
    return S || (S = j(p)), S;
  }, R = (p, S) => !S.l.size && (!S.t.size || S.t.size === 1 && S.t.has(p)), C = (p) => {
    const S = t.get(p);
    S && R(p, S) && V(p);
  }, w = (p) => {
    const S = /* @__PURE__ */ new Map(), v = /* @__PURE__ */ new WeakMap(), x = (O) => {
      var k;
      const D = new Set((k = t.get(O)) == null ? void 0 : k.t);
      return n.forEach((I, L) => {
        var K;
        (K = l(L)) != null && K.d.has(O) && D.add(L);
      }), D;
    }, E = (O) => {
      x(O).forEach((k) => {
        k !== O && (S.set(
          k,
          (S.get(k) || /* @__PURE__ */ new Set()).add(O)
        ), v.set(k, (v.get(k) || 0) + 1), E(k));
      });
    };
    E(p);
    const F = (O) => {
      x(O).forEach((k) => {
        var D;
        if (k !== O) {
          let I = v.get(k);
          if (I && v.set(k, --I), !I) {
            let L = !!((D = S.get(k)) != null && D.size);
            if (L) {
              const K = l(k), Ve = d(k, !0);
              L = !Ae(K, Ve);
            }
            L || S.forEach((K) => K.delete(k));
          }
          F(k);
        }
      });
    };
    F(p);
  }, b = (p, ...S) => {
    let v = !0;
    const x = (O) => _e(d(O)), E = (O, ...k) => {
      let D;
      if (O === p) {
        if (!st(O))
          throw new Error("atom not writable");
        const I = l(O), L = a(O, k[0]);
        Ae(I, L) || w(O);
      } else
        D = b(O, ...k);
      if (!v) {
        const I = T();
        (z ? "production" : void 0) !== "production" && r.forEach(
          (L) => L({ type: "async-write", flushed: I })
        );
      }
      return D;
    }, F = p.write(x, E, ...S);
    return v = !1, F;
  }, N = (p, ...S) => {
    const v = b(p, ...S), x = T();
    return (z ? "production" : void 0) !== "production" && r.forEach(
      (E) => E({ type: "write", flushed: x })
    ), v;
  }, j = (p, S, v) => {
    var x;
    const E = v || [];
    (x = l(p)) == null || x.d.forEach((O, k) => {
      const D = t.get(k);
      D ? D.t.add(p) : k !== p && j(k, p, E);
    }), d(p);
    const F = {
      t: new Set(S && [S]),
      l: /* @__PURE__ */ new Set()
    };
    if (t.set(p, F), (z ? "production" : void 0) !== "production" && o.add(p), ct(p) && p.onMount) {
      const { onMount: O } = p;
      E.push(() => {
        const k = O((...D) => N(p, ...D));
        k && (F.u = k);
      });
    }
    return v || E.forEach((O) => O()), F;
  }, V = (p) => {
    var S;
    const v = (S = t.get(p)) == null ? void 0 : S.u;
    v && v(), t.delete(p), (z ? "production" : void 0) !== "production" && o.delete(p);
    const x = l(p);
    x ? (xe(x) && Ut(x.v), x.d.forEach((E, F) => {
      if (F !== p) {
        const O = t.get(F);
        O && (O.t.delete(p), R(F, O) && V(F));
      }
    })) : (z ? "production" : void 0) !== "production" && console.warn("[Bug] could not find atom state to unmount", p);
  }, M = (p, S, v) => {
    const x = new Set(S.d.keys());
    v == null || v.forEach((E, F) => {
      if (x.has(F)) {
        x.delete(F);
        return;
      }
      const O = t.get(F);
      O && (O.t.delete(p), R(F, O) && V(F));
    }), x.forEach((E) => {
      const F = t.get(E);
      F ? F.t.add(p) : t.has(p) && j(E, p);
    });
  }, T = () => {
    let p;
    for ((z ? "production" : void 0) !== "production" && (p = /* @__PURE__ */ new Set()); n.size; ) {
      const S = Array.from(n);
      n.clear(), S.forEach(([v, x]) => {
        const E = l(v);
        if (E) {
          const F = t.get(v);
          F && E.d !== (x == null ? void 0 : x.d) && M(v, E, x == null ? void 0 : x.d), F && !// TODO This seems pretty hacky. Hope to fix it.
          // Maybe we could `mountDependencies` in `setAtomState`?
          (!xe(x) && (Ae(x, E) || Zt(x, E))) && (F.l.forEach((O) => O()), (z ? "production" : void 0) !== "production" && p.add(v));
        } else
          (z ? "production" : void 0) !== "production" && console.warn("[Bug] no atom state to flush");
      });
    }
    if ((z ? "production" : void 0) !== "production")
      return p;
  }, _ = (p, S) => {
    const v = h(p), x = T(), E = v.l;
    return E.add(S), (z ? "production" : void 0) !== "production" && r.forEach(
      (F) => F({ type: "sub", flushed: x })
    ), () => {
      E.delete(S), C(p), (z ? "production" : void 0) !== "production" && r.forEach((F) => F({ type: "unsub" }));
    };
  };
  return (z ? "production" : void 0) !== "production" ? {
    get: g,
    set: N,
    sub: _,
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
        st(v) && (a(v, x), w(v));
      const S = T();
      r.forEach(
        (v) => v({ type: "restore", flushed: S })
      );
    }
  } : {
    get: g,
    set: N,
    sub: _
  };
};
let at;
(z ? "production" : void 0) !== "production" && (typeof globalThis.__NUMBER_OF_JOTAI_INSTANCES__ == "number" ? ++globalThis.__NUMBER_OF_JOTAI_INSTANCES__ : globalThis.__NUMBER_OF_JOTAI_INSTANCES__ = 1);
const kr = () => (at || ((z ? "production" : void 0) !== "production" && globalThis.__NUMBER_OF_JOTAI_INSTANCES__ !== 1 && console.warn(
  "Detected multiple Jotai instances. It may cause unexpected behavior with the default store. https://github.com/pmndrs/jotai/discussions/2044"
), at = Cn()), at);
var Ar = { BASE_URL: "/", MODE: "production", DEV: !1, PROD: !0, SSR: !1 };
const Rn = pr(void 0), Nt = (e) => {
  const t = vr(Rn);
  return (e == null ? void 0 : e.store) || t || kr();
}, Or = ({
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
function Ir(e, t) {
  const n = Nt(t), [[r, o, l], i] = wr(
    (a) => {
      const f = n.get(e);
      return Object.is(a[0], f) && a[1] === n && a[2] === e ? a : [f, n, e];
    },
    void 0,
    () => [n.get(e), n, e]
  );
  let c = r;
  (o !== n || l !== e) && (i(), c = n.get(e));
  const u = t == null ? void 0 : t.delay;
  return q(() => {
    const a = n.sub(e, () => {
      if (typeof u == "number") {
        setTimeout(i, u);
        return;
      }
      i();
    });
    return i(), a;
  }, [n, e, u]), br(c), Lr(c) ? Mr(c) : c;
}
function kt(e, t) {
  const n = Nt(t);
  return Y(
    (...o) => {
      if ((Ar ? "production" : void 0) !== "production" && !("write" in e))
        throw new Error("not writable atom");
      return n.set(e, ...o);
    },
    [n, e]
  );
}
function A(e, t) {
  return [
    Ir(e, t),
    // We do wrong type assertion here, which results in throwing an error.
    kt(e, t)
  ];
}
const zt = /* @__PURE__ */ new WeakMap();
function Tr(e, t) {
  const n = Nt(t), r = Dr(n);
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
      let c = n(o), u = o;
      for (; u--; )
        if (i += e[c[u] & r] || "", i.length === l)
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
  return Te(e) || e === "";
}
function Te(e) {
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
    switch (Te(r) && (r = ""), typeof r == "number" && (r = r.toString()), r = r.toLowerCase(), n.type) {
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
const Sn = "update_column", Br = "delete_column", $r = "add_row", Hr = "delete_rows", Wr = "update_row", Nn = "update_rows", Ur = "add_column", At = (e, t) => e + t, kn = (e, t) => {
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
  extraToolbarItems: [],
  parseDate: void 0,
  formatStoredDate: void 0,
  formatDisplayDate: void 0,
  parseNumber: void 0,
  formatDisplayNumber: void 0
}, Qe = P(vt), re = P((e) => e(Qe)), Kr = P(null, (e, t, n) => {
  vt.rowSelectionButtons = [], t(Qe, kn(vt, n));
}), An = P(""), ne = P({ onChange: () => null }), qr = P(
  null,
  (e, t, n) => t(ne, n)
);
P(null, (e, t, n) => {
  t(ne, { onChange: n });
});
const H = P({}), Zr = (e) => P((t) => new Set(Object.entries(t(H)).map(([n, r]) => r[e])).size), On = (e) => P(
  (t) => t(H)[e],
  (t, n, r) => {
    typeof r == "function" && (r = r(t(On(e)))), n(H, (o) => ({ ...o, [e]: { ...o[e], ...r } })), t(ne).onChange({ type: Wr, rowId: e, update: r });
  }
), he = (e) => P(
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
), zr = P(null, (e, t, n) => {
  const r = Object.entries(e(H)).filter(([, o]) => o.isSelected === !0).map(([o, l]) => o);
  t(
    H,
    Object.fromEntries(
      Object.entries(e(H)).filter(([, o]) => o.isSelected !== !0)
    )
  ), t(de, !1), e(ne).onChange({
    type: Hr,
    rows: [r]
  });
}), Yr = P(
  null,
  (e, t, n = { handler: () => null }) => {
    t(
      H,
      Object.fromEntries(
        n.handler(Object.entries(e(H)).map(([r, o]) => o)).map((r) => [r.id, r])
      )
    ), e(ne).onChange({
      type: Nn,
      rows: n.handler(Object.entries(e(H)).map(([r, o]) => o)).map((r) => ({ rowId: r.id, update: r }))
    }), t(
      H,
      Object.fromEntries(
        Object.entries(e(H)).map(([r, o]) => [
          r,
          { ...o, isSelected: !1 }
        ])
      )
    ), t(de, !1);
  }
), Xr = P(null, (e, t, n) => {
  t(H, Object.fromEntries(n.map((r) => [r.id, r])));
}), Ln = P(null, (e, t, n) => {
  t(H, (r) => ({
    ...r,
    [n.id]: n
  })), t(tt(n.id, e(se)[0]), "editing"), e(ne).onChange({ type: $r, rowId: n.id, update: n });
}), Gr = P((e) => Object.keys(e(H)).length), Jr = P(
  (e) => e(de) ? Object.keys(e(H)).length : Object.entries(e(H)).map(([, t]) => t.isSelected === !0).reduce(At, 0)
), Ot = P({}), Le = P((e) => Object.entries(e(H)).filter(([, t]) => _r(t, e(It))).sort(
  ([, t], [, n]) => Vr(t, n, [...e(Ie), ...e(Lt)])
).map(([t, n]) => ({
  id: t,
  groupVal: e(Ie).length === 0 ? "" : n[e(Ie)[0].columnId]
})).map((t, n, r) => ({
  id: t.id,
  first: n === 0 || t.groupVal !== r[n - 1].groupVal,
  last: n === r.length - 1 || t.groupVal !== r[n + 1].groupVal,
  groupVal: t.groupVal
}))), Yt = P({}), et = (e) => P(
  (t) => t(Yt)[e],
  (t, n, r) => n(Yt, (o) => ({ ...o, [e]: r }))
), G = P({}), se = P(
  (e) => Object.entries(e(G)).filter(([t, n]) => n.isVisible === !0).map(([t]) => t)
), Mn = P(
  (e) => Object.entries(e(G)).map(([t, n]) => n)
), Qr = P(
  (e) => Object.entries(e(G)).map(([t, n]) => n).filter((t) => t.type !== "custom")
), eo = P((e) => Object.keys(e(G))), to = P(
  (e) => Object.entries(e(G)).map(([, t]) => t.isVisible).reduce((t, n) => t + (n === !1), 0)
), no = {
  isVisible: !0,
  width: 192,
  type: "text",
  options: [],
  showOptionSearch: !0,
  isEditable: !0,
  isViewOnly: !1
}, ro = P(null, (e, t, n) => {
  t(
    G,
    Object.fromEntries(
      n.map((r) => ({ ...no, ...r })).map((r) => [r.id, r])
    )
  );
}), oo = P(null, (e, t, n) => {
  t(G, (r) => ({ ...r, [n.id]: n })), t(et(n.id), !0), e(ne).onChange({
    type: Ur,
    colId: n.id,
    update: n
  });
}), io = P(null, (e, t, n) => {
  t(
    G,
    (r) => Object.fromEntries(Object.entries(r).filter(([o]) => o !== n.id))
  ), e(ne).onChange({ type: Br, colId: n.id });
}), lo = P((e) => Object.entries(e(G)).filter(([t, n]) => n.isVisible === !0).map(([t, n]) => n.width).reduce(At, e(Qe).selectRow.enabled ? 64 : 0)), Ie = P([]), Se = P((e) => e(Ie)), so = P(null, (e, t, n) => {
  t(Ie, n.grouping), t(Ot, {});
}), In = P(!1), Tn = P(!1), Lt = P([]), Mt = P((e) => e(Lt)), Dn = P(null, (e, t, n) => {
  t(Lt, n.sorting);
}), It = P([]), Pn = P((e) => e(It)), Fn = P(null, (e, t, n) => {
  t(It, n.filtering);
}), jn = P(32), Tt = P((e) => e(jn)), co = P(null, (e, t, n) => {
  t(jn, n.rowHeight);
}), de = P(!1), ao = P((e) => e(de)), uo = P(null, (e, t, n) => {
  const r = e(de);
  t(de, !r), t(
    H,
    Object.fromEntries(
      Object.entries(e(H)).map(([o, l]) => [
        o,
        { ...l, isSelected: !r }
      ])
    )
  );
}), fo = P(null, (e, t, n) => {
  t(de, !1), t(
    H,
    Object.fromEntries(
      Object.entries(e(H)).map(([r, o]) => [
        r,
        { ...o, isSelected: !1 }
      ])
    )
  );
});
P(null, (e, t, n) => {
  t(de, n.value), t(
    H,
    Object.fromEntries(
      Object.entries(e(H)).map(([r, o]) => [
        r,
        { ...o, isSelected: n.value }
      ])
    )
  );
});
const Vn = P(!1);
P((e) => e(Vn));
P(null, (e, t, n) => {
  t(Vn, n.dragging);
});
const Xt = P({}), tt = (e, t) => P(
  (n) => {
    var r;
    return ((r = n(Xt)[e]) == null ? void 0 : r[t]) || "none";
  },
  (n, r, o) => {
    r(Xt, { [e]: { [t]: o } });
  }
), Dt = P(null, (e, t, n) => {
  t(tt(n.rowId, n.colId), n.value);
}), mo = P(null, (e, t, n) => {
  const { colId: r, type: o } = n;
  let { options: l, configuration: i } = e(G)[r];
  const c = e(Qe);
  let u = (a) => a;
  switch (o) {
    case "select": {
      l = [
        ...new Set(Object.entries(e(H)).map(([f, d]) => d[r]))
      ].filter((f) => !Te(f) && f !== "").map((f) => ({
        value: f,
        name: f,
        color: gt()
      }));
      break;
    }
    case "multiSelect": {
      l = [
        ...new Set(
          Object.entries(e(H)).flatMap(
            ([f, d]) => ge(d[r]) ? [] : d[r].split(",")
          )
        )
      ].filter((f) => !Te(f) && f !== "").map((f) => ({
        value: f,
        name: f,
        color: gt()
      }));
      break;
    }
    case "number": {
      u = (a) => a;
      break;
    }
    case "date": {
      u = (a) => c.parseDate !== void 0 ? a : Number.isNaN(Date.parse(a)) ? "" : new Date(Date.parse(a)).toISOString();
      break;
    }
    case "checkbox":
      u = (a) => {
        var f, d, g;
        return ((g = (d = (f = a == null ? void 0 : a.toLowerCase) == null ? void 0 : f.call(a)) == null ? void 0 : d.trim) == null ? void 0 : g.call(d)) === "true";
      };
  }
  t(he(r), (a) => ({ ...a[r], type: o, options: l })), t(
    H,
    Object.fromEntries(
      Object.entries(e(H)).map(([a, f]) => [
        a,
        { ...f, [r]: u(f[r]) }
      ])
    )
  ), e(ne).onChange({
    type: Sn,
    colId: r,
    update: { type: o, options: l }
  }), e(ne).onChange({
    type: Nn,
    rows: Object.entries(e(H)).map(([a, f]) => ({
      rowId: a,
      update: { [r]: u(f[r]) }
    }))
  });
}), ho = (e, t) => P(null, (n, r, o) => {
  const l = n(se).findIndex((a) => a === t), i = n(Le).findIndex(
    (a) => a.id === e
  );
  let c = e, u = t;
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
      c = n(Le).map((a) => a.id)[Math.max(0, i - 1)];
      break;
    }
    case "down": {
      c = n(Le).map((a) => a.id)[Math.min(
        n(Le).flatMap((a) => a.rowIds).length - 1,
        i + 1
      )];
      break;
    }
  }
  t === u && e === c || r(tt(c, u), "focused");
}), Gt = (e, t) => P(
  (n) => Object.entries(n(H)).map(([r, o]) => o[e]).map(t).reduce(At, 0)
), dc = "100000000000000000000001";
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
    d: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
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
    d: "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
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
    d: "m19.5 8.25-7.5 7.5-7.5-7.5"
  }));
}
const Co = m.forwardRef(yo), Ro = Co;
function Eo({
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
const So = m.forwardRef(Eo), Jt = So;
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
    d: "M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5"
  }));
}
const ko = m.forwardRef(No), Ao = ko;
function Oo({
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
const Lo = m.forwardRef(Oo), Mo = Lo;
function Io({
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
const To = m.forwardRef(Io), Do = To;
function Po({
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
const Fo = m.forwardRef(Po), _n = Fo;
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
    d: "M16.5 8.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v8.25A2.25 2.25 0 0 0 6 16.5h2.25m8.25-8.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-7.5A2.25 2.25 0 0 1 8.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 0 0-2.25 2.25v6"
  }));
}
const Vo = m.forwardRef(jo), _o = Vo;
function Bo({
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
const $o = m.forwardRef(Bo), Ho = $o;
function Me(e) {
  const t = e.getUTCMonth() + 1, n = e.getUTCDate(), r = e.getUTCFullYear();
  return `${t.toString().padStart(2, "0")}/${n.toString().padStart(2, "0")}/${r.toString().padStart(4, "0")}`;
}
function Wo({
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
const Uo = m.forwardRef(Wo), Pt = Uo;
function Ko({
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
const qo = m.forwardRef(Ko), Bn = qo;
function Zo({
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
const zo = m.forwardRef(Zo), Yo = zo;
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
    d: "M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z",
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
    fillRule: "evenodd",
    d: "M10.53 3.47a.75.75 0 0 0-1.06 0L6.22 6.72a.75.75 0 0 0 1.06 1.06L10 5.06l2.72 2.72a.75.75 0 1 0 1.06-1.06l-3.25-3.25Zm-4.31 9.81 3.25 3.25a.75.75 0 0 0 1.06 0l3.25-3.25a.75.75 0 1 0-1.06-1.06L10 14.94l-2.72-2.72a.75.75 0 0 0-1.06 1.06Z",
    clipRule: "evenodd"
  }));
}
const ei = m.forwardRef(Qo), ti = ei;
function ni({
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
const ri = m.forwardRef(ni), oi = ri;
function ii({ tableConfiguration: e, name: t }) {
  const { theme: n = { color: "light" } } = e;
  return /* @__PURE__ */ s(
    "div",
    {
      className: U(
        "px-1.5 p-[1px] truncate whitespace-nowrap items-center flex cursor-default",
        n.color === "dark" && "text-white",
        n.color !== "dark" && "text-dark"
      ),
      children: t
    }
  );
}
function ce({ name: e, color: t, onCancel: n }) {
  return /* @__PURE__ */ y(
    "div",
    {
      className: "rounded px-1.5 p-[1px] truncate whitespace-nowrap text-dark items-center flex cursor-default",
      style: { backgroundColor: t },
      children: [
        e,
        n && /* @__PURE__ */ s(oi, { className: "w-4 h-4", onClick: n })
      ]
    }
  );
}
function li(e, t) {
  const n = ae(t);
  q(() => {
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
  return /* @__PURE__ */ s("div", { className: "shadow-md border rounded rounded-2 text-sm bg-header", children: e });
}
function Ft({ children: e }) {
  return /* @__PURE__ */ s("div", { className: "border-b last:border-none", children: /* @__PURE__ */ s("div", { className: "py-3", children: e }) });
}
B.Section = Ft;
function si({ children: e, ...t }) {
  return /* @__PURE__ */ s("div", { className: "px-3 py-1 flex items-center cursor-default", ...t, children: e });
}
function ci({ children: e, disabled: t, ...n }) {
  return /* @__PURE__ */ s(
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
  const [n, r] = $(e || null), o = /* @__PURE__ */ new Date(), [l, i] = $(
    n ? n.getUTCMonth() : o.getUTCMonth()
  ), [c, u] = $(
    n ? n.getUTCFullYear() : o.getUTCFullYear()
  );
  q(() => {
    if (!e) {
      r(null);
      return;
    }
    r(e), i(e.getUTCMonth()), u(e.getUTCFullYear());
  }, [e]);
  const a = [...Array(ai(c, l)).keys()], f = new Date(c, l, 1).getDay(), d = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  function g() {
    l === 0 ? (u((w) => w - 1), i(11)) : i((w) => w - 1);
  }
  function h() {
    l === 11 ? (u((w) => w + 1), i(0)) : i((w) => w + 1);
  }
  function R(w, b) {
    w.preventDefault();
    const N = /* @__PURE__ */ new Date();
    N.setUTCFullYear(c, l, b), r(N), t == null || t(N);
  }
  function C(w) {
    return n && n.getDate() === w && n.getMonth() === l && n.getFullYear() === c;
  }
  return /* @__PURE__ */ s("div", { className: "w-56", children: /* @__PURE__ */ y(B, { children: [
    /* @__PURE__ */ s(B.Section, { children: /* @__PURE__ */ y("div", { className: "flex px-2 items-center", children: [
      /* @__PURE__ */ y("div", { className: "grow text-left px-1", children: [
        ui[l],
        " ",
        c
      ] }),
      /* @__PURE__ */ s(
        "div",
        {
          className: "rs-btn hover:bg-hover-light rounded p-1",
          onClick: g,
          "aria-label": "move-calendar-left",
          children: /* @__PURE__ */ s(Yo, { className: "w-4 h-4" })
        }
      ),
      /* @__PURE__ */ s(
        "div",
        {
          className: "rs-btn hover:bg-hover-light rounded p-1",
          onClick: h,
          "aria-label": "move-calendar-right",
          children: /* @__PURE__ */ s(Jo, { className: "w-4 h-4" })
        }
      )
    ] }) }),
    /* @__PURE__ */ y(B.Section, { children: [
      /* @__PURE__ */ s("div", { className: "grid grid-cols-7 text-sm px-2 gap-px mb-2", children: d.map((w) => /* @__PURE__ */ s("div", { className: "text-secondary font-medium flex items-center justify-center", children: w }, `wday-${w}`)) }),
      /* @__PURE__ */ s("div", { className: "grid grid-cols-7 text-sm px-2 gap-px", children: a.map((w) => /* @__PURE__ */ s(
        "div",
        {
          className: U(
            "rs-btn p-0.5 rounded flex items-center justify-center col-span-1",
            di[f],
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
  return $n(e) ? (e.nodeName || "").toLowerCase() : "#document";
}
function J(e) {
  var t;
  return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function ie(e) {
  var t;
  return (t = ($n(e) ? e.ownerDocument : e.document) || window.document) == null ? void 0 : t.documentElement;
}
function $n(e) {
  return e instanceof Node || e instanceof J(e).Node;
}
function Z(e) {
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
function mi(e) {
  return ["table", "td", "th"].includes(fe(e));
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
  return ["html", "body", "#document"].includes(fe(e));
}
function ee(e) {
  return J(e).getComputedStyle(e);
}
function nt(e) {
  return Z(e) ? {
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
function Hn(e) {
  const t = ve(e);
  return Re(t) ? e.ownerDocument ? e.ownerDocument.body : e.body : Q(t) && Fe(t) ? t : Hn(t);
}
function ue(e, t, n) {
  var r;
  t === void 0 && (t = []), n === void 0 && (n = !0);
  const o = Hn(e), l = o === ((r = e.ownerDocument) == null ? void 0 : r.body), i = J(o);
  return l ? t.concat(i, i.visualViewport || [], Fe(o) ? o : [], i.frameElement && n ? ue(i.frameElement) : []) : t.concat(o, ue(o, [], n));
}
function pi(e) {
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
function Oe(e) {
  return "composedPath" in e ? e.composedPath()[0] : e.target;
}
const bi = "input:not([type='hidden']):not([disabled]),[contenteditable]:not([contenteditable='false']),textarea:not([disabled])";
function xi(e) {
  return Q(e) && e.matches(bi);
}
const We = Math.min, pe = Math.max, Ue = Math.round, Be = Math.floor, me = (e) => ({
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
function Ri(e, t, n) {
  n === void 0 && (n = !1);
  const r = ot(e), o = Kn(e), l = Un(o);
  let i = o === "x" ? r === (n ? "end" : "start") ? "right" : "left" : r === "start" ? "bottom" : "top";
  return t.reference[l] > t.floating[l] && (i = Ke(i)), [i, Ke(i)];
}
function Ei(e) {
  const t = Ke(e);
  return [yt(e), t, yt(t)];
}
function yt(e) {
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
  const o = ot(e);
  let l = Si(we(e), n === "start", r);
  return o && (l = l.map((i) => i + "-" + o), t && (l = l.concat(l.map(yt)))), l;
}
function Ke(e) {
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
function Ai(e) {
  return typeof e != "number" ? ki(e) : {
    top: e,
    right: e,
    bottom: e,
    left: e
  };
}
function qe(e) {
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
  const l = it(t), i = Kn(t), c = Un(i), u = we(t), a = l === "y", f = r.x + r.width / 2 - o.width / 2, d = r.y + r.height / 2 - o.height / 2, g = r[c] / 2 - o[c] / 2;
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
      h[i] -= g * (n && a ? -1 : 1);
      break;
    case "end":
      h[i] += g * (n && a ? -1 : 1);
      break;
  }
  return h;
}
const Oi = async (e, t, n) => {
  const {
    placement: r = "bottom",
    strategy: o = "absolute",
    middleware: l = [],
    platform: i
  } = n, c = l.filter(Boolean), u = await (i.isRTL == null ? void 0 : i.isRTL(t));
  let a = await i.getElementRects({
    reference: e,
    floating: t,
    strategy: o
  }), {
    x: f,
    y: d
  } = tn(a, r, u), g = r, h = {}, R = 0;
  for (let C = 0; C < c.length; C++) {
    const {
      name: w,
      fn: b
    } = c[C], {
      x: N,
      y: j,
      data: V,
      reset: M
    } = await b({
      x: f,
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
    if (f = N ?? f, d = j ?? d, h = {
      ...h,
      [w]: {
        ...h[w],
        ...V
      }
    }, M && R <= 50) {
      R++, typeof M == "object" && (M.placement && (g = M.placement), M.rects && (a = M.rects === !0 ? await i.getElementRects({
        reference: e,
        floating: t,
        strategy: o
      }) : M.rects), {
        x: f,
        y: d
      } = tn(a, g, u)), C = -1;
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
async function qn(e, t) {
  var n;
  t === void 0 && (t = {});
  const {
    x: r,
    y: o,
    platform: l,
    rects: i,
    elements: c,
    strategy: u
  } = e, {
    boundary: a = "clippingAncestors",
    rootBoundary: f = "viewport",
    elementContext: d = "floating",
    altBoundary: g = !1,
    padding: h = 0
  } = rt(t, e), R = Ai(h), w = c[g ? d === "floating" ? "reference" : "floating" : d], b = qe(await l.getClippingRect({
    element: (n = await (l.isElement == null ? void 0 : l.isElement(w))) == null || n ? w : w.contextElement || await (l.getDocumentElement == null ? void 0 : l.getDocumentElement(c.floating)),
    boundary: a,
    rootBoundary: f,
    strategy: u
  })), N = d === "floating" ? {
    ...i.floating,
    x: r,
    y: o
  } : i.reference, j = await (l.getOffsetParent == null ? void 0 : l.getOffsetParent(c.floating)), V = await (l.isElement == null ? void 0 : l.isElement(j)) ? await (l.getScale == null ? void 0 : l.getScale(j)) || {
    x: 1,
    y: 1
  } : {
    x: 1,
    y: 1
  }, M = qe(l.convertOffsetParentRelativeRectToViewportRelativeRect ? await l.convertOffsetParentRelativeRectToViewportRelativeRect({
    rect: N,
    offsetParent: j,
    strategy: u
  }) : N);
  return {
    top: (b.top - M.top + R.top) / V.y,
    bottom: (M.bottom - b.bottom + R.bottom) / V.y,
    left: (b.left - M.left + R.left) / V.x,
    right: (M.right - b.right + R.right) / V.x
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
        initialPlacement: c,
        platform: u,
        elements: a
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
      const b = we(o), N = we(c) === c, j = await (u.isRTL == null ? void 0 : u.isRTL(a.floating)), V = g || (N || !C ? [Ke(c)] : Ei(c));
      !g && R !== "none" && V.push(...Ni(c, C, R, j));
      const M = [c, ...V], T = await qn(t, w), _ = [];
      let p = ((r = l.flip) == null ? void 0 : r.overflows) || [];
      if (f && _.push(T[b]), d) {
        const E = Ri(o, i, j);
        _.push(T[E[0]], T[E[1]]);
      }
      if (p = [...p, {
        placement: o,
        overflows: _
      }], !_.every((E) => E <= 0)) {
        var S, v;
        const E = (((S = l.flip) == null ? void 0 : S.index) || 0) + 1, F = M[E];
        if (F)
          return {
            data: {
              index: E,
              overflows: p
            },
            reset: {
              placement: F
            }
          };
        let O = (v = p.filter((k) => k.overflows[0] <= 0).sort((k, D) => k.overflows[1] - D.overflows[1])[0]) == null ? void 0 : v.placement;
        if (!O)
          switch (h) {
            case "bestFit": {
              var x;
              const k = (x = p.map((D) => [D.placement, D.overflows.filter((I) => I > 0).reduce((I, L) => I + L, 0)]).sort((D, I) => D[1] - I[1])[0]) == null ? void 0 : x[0];
              k && (O = k);
              break;
            }
            case "initialPlacement":
              O = c;
              break;
          }
        if (o !== O)
          return {
            reset: {
              placement: O
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
  } = e, l = await (r.isRTL == null ? void 0 : r.isRTL(o.floating)), i = we(n), c = ot(n), u = it(n) === "y", a = ["left", "top"].includes(i) ? -1 : 1, f = l && u ? -1 : 1, d = rt(t, e);
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
  return c && typeof R == "number" && (h = c === "end" ? R * -1 : R), u ? {
    x: h * f,
    y: g * a
  } : {
    x: g * a,
    y: h * f
  };
}
const Ii = function(e) {
  return e === void 0 && (e = 0), {
    name: "offset",
    options: e,
    async fn(t) {
      var n, r;
      const {
        x: o,
        y: l,
        placement: i,
        middlewareData: c
      } = t, u = await Mi(t, e);
      return i === ((n = c.offset) == null ? void 0 : n.placement) && (r = c.arrow) != null && r.alignmentOffset ? {} : {
        x: o + u.x,
        y: l + u.y,
        data: {
          ...u,
          placement: i
        }
      };
    }
  };
}, Ti = function(e) {
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
        limiter: c = {
          fn: (w) => {
            let {
              x: b,
              y: N
            } = w;
            return {
              x: b,
              y: N
            };
          }
        },
        ...u
      } = rt(e, t), a = {
        x: n,
        y: r
      }, f = await qn(t, u), d = it(we(o)), g = Wn(d);
      let h = a[g], R = a[d];
      if (l) {
        const w = g === "y" ? "top" : "left", b = g === "y" ? "bottom" : "right", N = h + f[w], j = h - f[b];
        h = en(N, h, j);
      }
      if (i) {
        const w = d === "y" ? "top" : "left", b = d === "y" ? "bottom" : "right", N = R + f[w], j = R - f[b];
        R = en(N, R, j);
      }
      const C = c.fn({
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
function Zn(e) {
  const t = ee(e);
  let n = parseFloat(t.width) || 0, r = parseFloat(t.height) || 0;
  const o = Q(e), l = o ? e.offsetWidth : n, i = o ? e.offsetHeight : r, c = Ue(n) !== l || Ue(r) !== i;
  return c && (n = l, r = i), {
    width: n,
    height: r,
    $: c
  };
}
function _t(e) {
  return Z(e) ? e : e.contextElement;
}
function Ce(e) {
  const t = _t(e);
  if (!Q(t))
    return me(1);
  const n = t.getBoundingClientRect(), {
    width: r,
    height: o,
    $: l
  } = Zn(t);
  let i = (l ? Ue(n.width) : n.width) / r, c = (l ? Ue(n.height) : n.height) / o;
  return (!i || !Number.isFinite(i)) && (i = 1), (!c || !Number.isFinite(c)) && (c = 1), {
    x: i,
    y: c
  };
}
const Di = /* @__PURE__ */ me(0);
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
  let i = me(1);
  t && (r ? Z(r) && (i = Ce(r)) : i = Ce(e));
  const c = Pi(l, n, r) ? zn(l) : me(0);
  let u = (o.left + c.x) / i.x, a = (o.top + c.y) / i.y, f = o.width / i.x, d = o.height / i.y;
  if (l) {
    const g = J(l), h = r && Z(r) ? J(r) : r;
    let R = g.frameElement;
    for (; R && r && h !== g; ) {
      const C = Ce(R), w = R.getBoundingClientRect(), b = ee(R), N = w.left + (R.clientLeft + parseFloat(b.paddingLeft)) * C.x, j = w.top + (R.clientTop + parseFloat(b.paddingTop)) * C.y;
      u *= C.x, a *= C.y, f *= C.x, d *= C.y, u += N, a += j, R = J(R).frameElement;
    }
  }
  return qe({
    width: f,
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
  }, c = me(1);
  const u = me(0);
  if ((o || !o && r !== "fixed") && ((fe(n) !== "body" || Fe(l)) && (i = nt(n)), Q(n))) {
    const a = be(n);
    c = Ce(n), u.x = a.x + n.clientLeft, u.y = a.y + n.clientTop;
  }
  return {
    width: t.width * c.x,
    height: t.height * c.y,
    x: t.x * c.x - i.scrollLeft * c.x + u.x,
    y: t.y * c.y - i.scrollTop * c.y + u.y
  };
}
function ji(e) {
  return Array.from(e.getClientRects());
}
function Yn(e) {
  return be(ie(e)).left + nt(e).scrollLeft;
}
function Vi(e) {
  const t = ie(e), n = nt(e), r = e.ownerDocument.body, o = pe(t.scrollWidth, t.clientWidth, r.scrollWidth, r.clientWidth), l = pe(t.scrollHeight, t.clientHeight, r.scrollHeight, r.clientHeight);
  let i = -n.scrollLeft + Yn(e);
  const c = -n.scrollTop;
  return ee(r).direction === "rtl" && (i += pe(t.clientWidth, r.clientWidth) - o), {
    width: o,
    height: l,
    x: i,
    y: c
  };
}
function _i(e, t) {
  const n = J(e), r = ie(e), o = n.visualViewport;
  let l = r.clientWidth, i = r.clientHeight, c = 0, u = 0;
  if (o) {
    l = o.width, i = o.height;
    const a = Vt();
    (!a || a && t === "fixed") && (c = o.offsetLeft, u = o.offsetTop);
  }
  return {
    width: l,
    height: i,
    x: c,
    y: u
  };
}
function Bi(e, t) {
  const n = be(e, !0, t === "fixed"), r = n.top + e.clientTop, o = n.left + e.clientLeft, l = Q(e) ? Ce(e) : me(1), i = e.clientWidth * l.x, c = e.clientHeight * l.y, u = o * l.x, a = r * l.y;
  return {
    width: i,
    height: c,
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
  else if (Z(t))
    r = Bi(t, n);
  else {
    const o = zn(e);
    r = {
      ...t,
      x: t.x - o.x,
      y: t.y - o.y
    };
  }
  return qe(r);
}
function Xn(e, t) {
  const n = ve(e);
  return n === t || !Z(n) || Re(n) ? !1 : ee(n).position === "fixed" || Xn(n, t);
}
function $i(e, t) {
  const n = t.get(e);
  if (n)
    return n;
  let r = ue(e, [], !1).filter((c) => Z(c) && fe(c) !== "body"), o = null;
  const l = ee(e).position === "fixed";
  let i = l ? ve(e) : e;
  for (; Z(i) && !Re(i); ) {
    const c = ee(i), u = jt(i);
    !u && c.position === "fixed" && (o = null), (l ? !u && !o : !u && c.position === "static" && !!o && ["absolute", "fixed"].includes(o.position) || Fe(i) && !u && Xn(e, i)) ? r = r.filter((f) => f !== i) : o = c, i = ve(i);
  }
  return t.set(e, r), r;
}
function Hi(e) {
  let {
    element: t,
    boundary: n,
    rootBoundary: r,
    strategy: o
  } = e;
  const i = [...n === "clippingAncestors" ? $i(t, this._c) : [].concat(n), r], c = i[0], u = i.reduce((a, f) => {
    const d = nn(t, f, o);
    return a.top = pe(d.top, a.top), a.right = We(d.right, a.right), a.bottom = We(d.bottom, a.bottom), a.left = pe(d.left, a.left), a;
  }, nn(t, c, o));
  return {
    width: u.right - u.left,
    height: u.bottom - u.top,
    x: u.left,
    y: u.top
  };
}
function Wi(e) {
  return Zn(e);
}
function Ui(e, t, n) {
  const r = Q(t), o = ie(t), l = n === "fixed", i = be(e, !0, l, t);
  let c = {
    scrollLeft: 0,
    scrollTop: 0
  };
  const u = me(0);
  if (r || !r && !l)
    if ((fe(t) !== "body" || Fe(o)) && (c = nt(t)), r) {
      const a = be(t, !0, l, t);
      u.x = a.x + t.clientLeft, u.y = a.y + t.clientTop;
    } else
      o && (u.x = Yn(o));
  return {
    x: i.left + c.scrollLeft - u.x,
    y: i.top + c.scrollTop - u.y,
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
  return r && (fe(r) === "html" || fe(r) === "body" && ee(r).position === "static" && !jt(r)) ? n : r || hi(e) || n;
}
const Ki = async function(e) {
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
function qi(e) {
  return ee(e).direction === "rtl";
}
const Zi = {
  convertOffsetParentRelativeRectToViewportRelativeRect: Fi,
  getDocumentElement: ie,
  getClippingRect: Hi,
  getOffsetParent: Gn,
  getElementRects: Ki,
  getClientRects: ji,
  getDimensions: Wi,
  getScale: Ce,
  isElement: Z,
  isRTL: qi
};
function zi(e, t) {
  let n = null, r;
  const o = ie(e);
  function l() {
    clearTimeout(r), n && n.disconnect(), n = null;
  }
  function i(c, u) {
    c === void 0 && (c = !1), u === void 0 && (u = 1), l();
    const {
      left: a,
      top: f,
      width: d,
      height: g
    } = e.getBoundingClientRect();
    if (c || t(), !d || !g)
      return;
    const h = Be(f), R = Be(o.clientWidth - (a + d)), C = Be(o.clientHeight - (f + g)), w = Be(a), N = {
      rootMargin: -h + "px " + -R + "px " + -C + "px " + -w + "px",
      threshold: pe(0, We(1, u)) || 1
    };
    let j = !0;
    function V(M) {
      const T = M[0].intersectionRatio;
      if (T !== u) {
        if (!j)
          return i();
        T ? i(!1, T) : r = setTimeout(() => {
          i(!1, 1e-7);
        }, 100);
      }
      j = !1;
    }
    try {
      n = new IntersectionObserver(V, {
        ...N,
        // Handle <iframe>s
        root: o.ownerDocument
      });
    } catch {
      n = new IntersectionObserver(V, N);
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
    layoutShift: c = typeof IntersectionObserver == "function",
    animationFrame: u = !1
  } = r, a = _t(e), f = o || l ? [...a ? ue(a) : [], ...ue(t)] : [];
  f.forEach((b) => {
    o && b.addEventListener("scroll", n, {
      passive: !0
    }), l && b.addEventListener("resize", n);
  });
  const d = a && c ? zi(a, n) : null;
  let g = -1, h = null;
  i && (h = new ResizeObserver((b) => {
    let [N] = b;
    N && N.target === a && h && (h.unobserve(t), cancelAnimationFrame(g), g = requestAnimationFrame(() => {
      h && h.observe(t);
    })), n();
  }), a && !u && h.observe(a), h.observe(t));
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
const Xi = (e, t, n) => {
  const r = /* @__PURE__ */ new Map(), o = {
    platform: Zi,
    ...n
  }, l = {
    ...o.platform,
    _c: r
  };
  return Oi(e, t, {
    ...o,
    platform: l
  });
};
var $e = typeof document < "u" ? xn : q;
function Ze(e, t) {
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
        if (!Ze(e[r], t[r]))
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
      if (!(l === "_owner" && e.$$typeof) && !Ze(e[l], t[l]))
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
  return $e(() => {
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
    transform: c = !0,
    whileElementsMounted: u,
    open: a
  } = e, [f, d] = m.useState({
    x: 0,
    y: 0,
    strategy: n,
    placement: t,
    middlewareData: {},
    isPositioned: !1
  }), [g, h] = m.useState(r);
  Ze(g, r) || h(r);
  const [R, C] = m.useState(null), [w, b] = m.useState(null), N = m.useCallback((D) => {
    D != T.current && (T.current = D, C(D));
  }, [C]), j = m.useCallback((D) => {
    D !== _.current && (_.current = D, b(D));
  }, [b]), V = l || R, M = i || w, T = m.useRef(null), _ = m.useRef(null), p = m.useRef(f), S = ln(u), v = ln(o), x = m.useCallback(() => {
    if (!T.current || !_.current)
      return;
    const D = {
      placement: t,
      strategy: n,
      middleware: g
    };
    v.current && (D.platform = v.current), Xi(T.current, _.current, D).then((I) => {
      const L = {
        ...I,
        isPositioned: !0
      };
      E.current && !Ze(p.current, L) && (p.current = L, yr.flushSync(() => {
        d(L);
      }));
    });
  }, [g, t, n, v]);
  $e(() => {
    a === !1 && p.current.isPositioned && (p.current.isPositioned = !1, d((D) => ({
      ...D,
      isPositioned: !1
    })));
  }, [a]);
  const E = m.useRef(!1);
  $e(() => (E.current = !0, () => {
    E.current = !1;
  }), []), $e(() => {
    if (V && (T.current = V), M && (_.current = M), V && M) {
      if (S.current)
        return S.current(V, M, x);
      x();
    }
  }, [V, M, x, S]);
  const F = m.useMemo(() => ({
    reference: T,
    floating: _,
    setReference: N,
    setFloating: j
  }), [N, j]), O = m.useMemo(() => ({
    reference: V,
    floating: M
  }), [V, M]), k = m.useMemo(() => {
    const D = {
      position: n,
      left: 0,
      top: 0
    };
    if (!O.floating)
      return D;
    const I = on(O.floating, f.x), L = on(O.floating, f.y);
    return c ? {
      ...D,
      transform: "translate(" + I + "px, " + L + "px)",
      ...Jn(O.floating) >= 1.5 && {
        willChange: "transform"
      }
    } : {
      position: n,
      left: I,
      top: L
    };
  }, [n, c, O.floating, f.x, f.y]);
  return m.useMemo(() => ({
    ...f,
    update: x,
    refs: F,
    elements: O,
    floatingStyles: k
  }), [f, x, F, O, k]);
}
/*!
* tabbable 6.2.0
* @license MIT, https://github.com/focus-trap/tabbable/blob/master/LICENSE
*/
var Ji = ["input:not([inert])", "select:not([inert])", "textarea:not([inert])", "a[href]:not([inert])", "button:not([inert])", "[tabindex]:not(slot):not([inert])", "audio[controls]:not([inert])", "video[controls]:not([inert])", '[contenteditable]:not([contenteditable="false"]):not([inert])', "details>summary:first-of-type:not([inert])", "details:not([inert])"], Ct = /* @__PURE__ */ Ji.join(","), Qn = typeof Element > "u", De = Qn ? function() {
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
  var o = Array.prototype.slice.apply(t.querySelectorAll(Ct));
  return n && De.call(t, Ct) && o.unshift(t), o = o.filter(r), o;
}, tl = function e(t, n, r) {
  for (var o = [], l = Array.from(t); l.length; ) {
    var i = l.shift();
    if (!Ye(i, !1))
      if (i.tagName === "SLOT") {
        var c = i.assignedElements(), u = c.length ? c : i.children, a = e(u, !0, r);
        r.flatten ? o.push.apply(o, a) : o.push({
          scopeParent: i,
          candidates: a
        });
      } else {
        var f = De.call(i, Ct);
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
  var n = t.form || ze(t), r = function(c) {
    return n.querySelectorAll('input[type="radio"][name="' + c + '"]');
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
    var i, c, u;
    for (l = !!((i = o) !== null && i !== void 0 && (c = i.ownerDocument) !== null && c !== void 0 && c.contains(o) || t != null && (u = t.ownerDocument) !== null && u !== void 0 && u.contains(t)); !l && o; ) {
      var a, f, d;
      r = ze(o), o = (a = r) === null || a === void 0 ? void 0 : a.host, l = !!((f = o) !== null && f !== void 0 && (d = f.ownerDocument) !== null && d !== void 0 && d.contains(o));
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
      for (var c = t; t; ) {
        var u = t.parentElement, a = ze(t);
        if (u && !u.shadowRoot && o(u) === !0)
          return sn(t);
        t.assignedSlot ? t = t.assignedSlot : !u && a !== t.ownerDocument ? t = a.host : t = u;
      }
      t = c;
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
    var i = !!o.scopeParent, c = i ? o.scopeParent : o, u = nl(c, i), a = i ? e(o.candidates) : c;
    u === 0 ? i ? n.push.apply(n, a) : n.push(c) : r.push({
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
const gl = m.useInsertionEffect, vl = gl || ((e) => e());
function ye(e) {
  const t = m.useRef(() => {
    if (process.env.NODE_ENV !== "production")
      throw new Error("Cannot call an event handler while rendering.");
  });
  return vl(() => {
    t.current = e;
  }), m.useCallback(function() {
    for (var n = arguments.length, r = new Array(n), o = 0; o < n; o++)
      r[o] = arguments[o];
    return t.current == null ? void 0 : t.current(...r);
  }, []);
}
var Pe = typeof document < "u" ? xn : q;
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
let dt = !1, wl = 0;
const an = () => "floating-ui-" + wl++;
function bl() {
  const [e, t] = m.useState(() => dt ? an() : void 0);
  return Pe(() => {
    e == null && t(an());
  }, []), m.useEffect(() => {
    dt || (dt = !0);
  }, []), e;
}
const xl = m.useId, or = xl || bl;
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
const Cl = /* @__PURE__ */ m.createContext(null), Rl = /* @__PURE__ */ m.createContext(null), El = () => {
  var e;
  return ((e = m.useContext(Cl)) == null ? void 0 : e.id) || null;
}, ir = () => m.useContext(Rl);
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
        var c;
        return o.parentId === i.id && ((c = o.context) == null ? void 0 : c.open);
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
  const r = n.indexOf(pi(xt(e)));
  return n.slice(r + 1)[0];
}
function Sl() {
  return sr(document.body, "next");
}
function Nl() {
  return sr(document.body, "prev");
}
function mt(e, t) {
  const n = t || e.currentTarget, r = e.relatedTarget;
  return !r || !bt(n, r);
}
function kl(e) {
  rr(e, lr()).forEach((n) => {
    n.dataset.tabindex = n.getAttribute("tabindex") || "", n.setAttribute("tabindex", "-1");
  });
}
function Al(e) {
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
let Ol;
function un(e) {
  e.key === "Tab" && (e.target, clearTimeout(Ol));
}
const dn = /* @__PURE__ */ m.forwardRef(function(t, n) {
  const [r, o] = m.useState();
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
  return /* @__PURE__ */ m.createElement("span", Rt({}, t, l));
}), ar = /* @__PURE__ */ m.createContext(null);
function Ll(e) {
  let {
    id: t,
    root: n
  } = e === void 0 ? {} : e;
  const [r, o] = m.useState(null), l = or(), i = Il(), c = m.useMemo(() => ({
    id: t,
    root: n,
    portalContext: i,
    uniqueId: l
  }), [t, n, i, l]), u = m.useRef();
  return Pe(() => () => {
    r == null || r.remove();
  }, [r, c]), Pe(() => {
    if (u.current === c)
      return;
    u.current = c;
    const {
      id: a,
      root: f,
      portalContext: d,
      uniqueId: g
    } = c, h = a ? document.getElementById(a) : null, R = Bt("portal");
    if (h) {
      const C = document.createElement("div");
      C.id = g, C.setAttribute(R, ""), h.appendChild(C), o(C);
    } else {
      let C = f || (d == null ? void 0 : d.portalNode);
      C && !Z(C) && (C = C.current), C = C || document.body;
      let w = null;
      a && (w = document.createElement("div"), w.id = a, C.appendChild(w));
      const b = document.createElement("div");
      b.id = g, b.setAttribute(R, ""), C = w || C, C.appendChild(b), o(b);
    }
  }, [c]), r;
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
  }), [i, c] = m.useState(null), u = m.useRef(null), a = m.useRef(null), f = m.useRef(null), d = m.useRef(null), g = (
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
      l && mt(R) && (R.type === "focusin" ? Al : kl)(l);
    }
    return l.addEventListener("focusin", h, !0), l.addEventListener("focusout", h, !0), () => {
      l.removeEventListener("focusin", h, !0), l.removeEventListener("focusout", h, !0);
    };
  }, [l, o, i == null ? void 0 : i.modal]), /* @__PURE__ */ m.createElement(ar.Provider, {
    value: m.useMemo(() => ({
      preserveTabOrder: o,
      beforeOutsideRef: u,
      afterOutsideRef: a,
      beforeInsideRef: f,
      afterInsideRef: d,
      portalNode: l,
      setFocusManagerState: c
    }), [o, l])
  }, g && l && /* @__PURE__ */ m.createElement(dn, {
    "data-type": "outside",
    ref: u,
    onFocus: (h) => {
      if (mt(h, l)) {
        var R;
        (R = f.current) == null || R.focus();
      } else {
        const C = Nl() || (i == null ? void 0 : i.refs.domReference.current);
        C == null || C.focus();
      }
    }
  }), g && l && /* @__PURE__ */ m.createElement("span", {
    "aria-owns": l.id,
    style: cr
  }), l && /* @__PURE__ */ Cr(t, l), g && l && /* @__PURE__ */ m.createElement(dn, {
    "data-type": "outside",
    ref: a,
    onFocus: (h) => {
      if (mt(h, l)) {
        var R;
        (R = d.current) == null || R.focus();
      } else {
        const C = Sl() || (i == null ? void 0 : i.refs.domReference.current);
        C == null || C.focus(), i != null && i.closeOnFocusOut && (i == null || i.onOpenChange(!1, h.nativeEvent));
      }
    }
  }));
}
const Il = () => m.useContext(ar);
function fn(e) {
  return Q(e.target) && e.target.tagName === "BUTTON";
}
function mn(e) {
  return xi(e);
}
function Tl(e, t) {
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
    event: c = "click",
    toggle: u = !0,
    ignoreMouse: a = !1,
    keyboardHandlers: f = !0
  } = t, d = m.useRef(), g = m.useRef(!1);
  return m.useMemo(() => i ? {
    reference: {
      onPointerDown(h) {
        d.current = h.pointerType;
      },
      onMouseDown(h) {
        h.button === 0 && (Qt(d.current, !0) && a || c !== "click" && (n && u && (!o.current.openEvent || o.current.openEvent.type === "mousedown") ? r(!1, h.nativeEvent, "click") : (h.preventDefault(), r(!0, h.nativeEvent, "click"))));
      },
      onClick(h) {
        if (c === "mousedown" && d.current) {
          d.current = void 0;
          return;
        }
        Qt(d.current, !0) && a || (n && u && (!o.current.openEvent || o.current.openEvent.type === "click") ? r(!1, h.nativeEvent, "click") : r(!0, h.nativeEvent, "click"));
      },
      onKeyDown(h) {
        d.current = void 0, !(h.defaultPrevented || !f || fn(h)) && (h.key === " " && !mn(l) && (h.preventDefault(), g.current = !0), h.key === "Enter" && r(!(n && u), h.nativeEvent, "click"));
      },
      onKeyUp(h) {
        h.defaultPrevented || !f || fn(h) || mn(l) || h.key === " " && g.current && (g.current = !1, r(!(n && u), h.nativeEvent, "click"));
      }
    }
  } : {}, [i, o, c, a, f, l, u, n, r]);
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
      floating: c
    },
    dataRef: u
  } = e, {
    enabled: a = !0,
    escapeKey: f = !0,
    outsidePress: d = !0,
    outsidePressEvent: g = "pointerdown",
    referencePress: h = !1,
    referencePressEvent: R = "pointerdown",
    ancestorScroll: C = !1,
    bubbles: w,
    capture: b
  } = t, N = ir(), j = ye(typeof d == "function" ? d : () => !1), V = typeof d == "function" ? j : d, M = m.useRef(!1), T = m.useRef(!1), {
    escapeKey: _,
    outsidePress: p
  } = hn(w), {
    escapeKey: S,
    outsidePress: v
  } = hn(b), x = ye((k) => {
    if (!n || !a || !f || k.key !== "Escape")
      return;
    const D = N ? ft(N.nodesRef.current, o) : [];
    if (!_ && (k.stopPropagation(), D.length > 0)) {
      let I = !0;
      if (D.forEach((L) => {
        var K;
        if ((K = L.context) != null && K.open && !L.context.dataRef.current.__escapeKeyBubbles) {
          I = !1;
          return;
        }
      }), !I)
        return;
    }
    r(!1, vi(k) ? k.nativeEvent : k, "escape-key");
  }), E = ye((k) => {
    var D;
    const I = () => {
      var L;
      x(k), (L = Oe(k)) == null || L.removeEventListener("keydown", I);
    };
    (D = Oe(k)) == null || D.addEventListener("keydown", I);
  }), F = ye((k) => {
    const D = M.current;
    M.current = !1;
    const I = T.current;
    if (T.current = !1, g === "click" && I || D || typeof V == "function" && !V(k))
      return;
    const L = Oe(k), K = "[" + Bt("inert") + "]", Ve = xt(c).querySelectorAll(K);
    let Ne = Z(L) ? L : null;
    for (; Ne && !Re(Ne); ) {
      const te = ve(Ne);
      if (Re(te) || !Z(te))
        break;
      Ne = te;
    }
    if (Ve.length && Z(L) && !wi(L) && // Clicked on a direct ancestor (e.g. FloatingOverlay).
    !bt(L, c) && // If the target root element contains none of the markers, then the
    // element was injected after the floating element rendered.
    Array.from(Ve).every((te) => !bt(Ne, te)))
      return;
    if (Q(L) && c) {
      const te = L.clientWidth > 0 && L.scrollWidth > L.clientWidth, le = L.clientHeight > 0 && L.scrollHeight > L.clientHeight;
      let ke = le && k.offsetX > L.clientWidth;
      if (le && ee(L).direction === "rtl" && (ke = k.offsetX <= L.offsetWidth - L.clientWidth), ke || te && k.offsetY > L.clientHeight)
        return;
    }
    const hr = N && ft(N.nodesRef.current, o).some((te) => {
      var le;
      return ut(k, (le = te.context) == null ? void 0 : le.elements.floating);
    });
    if (ut(k, c) || ut(k, i) || hr)
      return;
    const Wt = N ? ft(N.nodesRef.current, o) : [];
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
  }), O = ye((k) => {
    var D;
    const I = () => {
      var L;
      F(k), (L = Oe(k)) == null || L.removeEventListener(g, I);
    };
    (D = Oe(k)) == null || D.addEventListener(g, I);
  });
  return m.useEffect(() => {
    if (!n || !a)
      return;
    u.current.__escapeKeyBubbles = _, u.current.__outsidePressBubbles = p;
    function k(L) {
      r(!1, L, "ancestor-scroll");
    }
    const D = xt(c);
    f && D.addEventListener("keydown", S ? E : x, S), V && D.addEventListener(g, v ? O : F, v);
    let I = [];
    return C && (Z(i) && (I = ue(i)), Z(c) && (I = I.concat(ue(c))), !Z(l) && l && l.contextElement && (I = I.concat(ue(l.contextElement)))), I = I.filter((L) => {
      var K;
      return L !== ((K = D.defaultView) == null ? void 0 : K.visualViewport);
    }), I.forEach((L) => {
      L.addEventListener("scroll", k, {
        passive: !0
      });
    }), () => {
      f && D.removeEventListener("keydown", S ? E : x, S), V && D.removeEventListener(g, v ? O : F, v), I.forEach((L) => {
        L.removeEventListener("scroll", k);
      });
    };
  }, [u, c, i, l, f, V, g, n, r, C, a, _, p, x, S, E, F, v, O]), m.useEffect(() => {
    M.current = !1;
  }, [V, g]), m.useMemo(() => a ? {
    reference: {
      onKeyDown: x,
      [Dl[R]]: (k) => {
        h && r(!1, k.nativeEvent, "reference-press");
      }
    },
    floating: {
      onKeyDown: x,
      onMouseDown() {
        T.current = !0;
      },
      onMouseUp() {
        T.current = !0;
      },
      [Pl[g]]: () => {
        M.current = !0;
      }
    }
  } : {}, [a, h, g, R, r, x]);
}
let Et;
process.env.NODE_ENV !== "production" && (Et = /* @__PURE__ */ new Set());
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
    const p = "Floating UI: Cannot pass a virtual element to the `elements.reference` option, as it must be a real DOM element. Use `refs.setPositionReference` instead.";
    if ((l = e.elements) != null && l.reference && !Z(e.elements.reference)) {
      var i;
      if (!((i = Et) != null && i.has(p))) {
        var c;
        (c = Et) == null || c.add(p), console.error(p);
      }
    }
  }
  const [u, a] = m.useState(null), f = ((t = e.elements) == null ? void 0 : t.reference) || u, d = Gi(e), g = ir(), h = El() != null, R = ye((p, S, v) => {
    p && (w.current.openEvent = S), b.emit("openchange", {
      open: p,
      event: S,
      reason: v,
      nested: h
    }), r == null || r(p, S, v);
  }), C = m.useRef(null), w = m.useRef({}), b = m.useState(() => yl())[0], N = or(), j = m.useCallback((p) => {
    const S = Z(p) ? {
      getBoundingClientRect: () => p.getBoundingClientRect(),
      contextElement: p
    } : p;
    d.refs.setReference(S);
  }, [d.refs]), V = m.useCallback((p) => {
    (Z(p) || p === null) && (C.current = p, a(p)), (Z(d.refs.reference.current) || d.refs.reference.current === null || // Don't allow setting virtual elements using the old technique back to
    // `null` to support `positionReference` + an unstable `reference`
    // callback ref.
    p !== null && !Z(p)) && d.refs.setReference(p);
  }, [d.refs]), M = m.useMemo(() => ({
    ...d.refs,
    setReference: V,
    setPositionReference: j,
    domReference: C
  }), [d.refs, V, j]), T = m.useMemo(() => ({
    ...d.elements,
    domReference: f
  }), [d.elements, f]), _ = m.useMemo(() => ({
    ...d,
    refs: M,
    elements: T,
    dataRef: w,
    nodeId: o,
    floatingId: N,
    events: b,
    open: n,
    onOpenChange: R
  }), [d, o, N, b, n, R, M, T]);
  return Pe(() => {
    const p = g == null ? void 0 : g.nodesRef.current.find((S) => S.id === o);
    p && (p.context = _);
  }), m.useMemo(() => ({
    ...d,
    context: _,
    refs: M,
    elements: T
  }), [d, M, T, _]);
}
const pn = "active", gn = "selected";
function ht(e, t, n) {
  const r = /* @__PURE__ */ new Map(), o = n === "item";
  let l = e;
  if (o && e) {
    const {
      [pn]: i,
      [gn]: c,
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
      const c = i ? i[n] : null;
      return typeof c == "function" ? e ? c(e) : null : c;
    }).concat(e).reduce((i, c) => (c && Object.entries(c).forEach((u) => {
      let [a, f] = u;
      if (!(o && [pn, gn].includes(a)))
        if (a.indexOf("on") === 0) {
          if (r.has(a) || r.set(a, []), typeof f == "function") {
            var d;
            (d = r.get(a)) == null || d.push(f), i[a] = function() {
              for (var g, h = arguments.length, R = new Array(h), C = 0; C < h; C++)
                R[C] = arguments[C];
              return (g = r.get(a)) == null ? void 0 : g.map((w) => w(...R)).find((w) => w !== void 0);
            };
          }
        } else
          i[a] = f;
    }), i), {})
  };
}
function Vl(e) {
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
function _l({
  isOpen: e,
  setIsOpen: t,
  offset: n = 0,
  placement: r = "bottom-start",
  click: o = !0
}) {
  const { x: l, y: i, strategy: c, refs: u, context: a } = jl({
    open: e,
    onOpenChange: t,
    middleware: [Ti(), Ii(n), Li()],
    whileElementsMounted: Yi,
    placement: r
  }), f = Tl(a, {
    enabled: o
  }), d = Fl(a, {}), { getReferenceProps: g, getFloatingProps: h } = Vl([
    f,
    d
  ]);
  return {
    x: l,
    y: i,
    strategy: c,
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
  children: c,
  portal: u
}) {
  const { x: a, y: f, strategy: d, refs: g, getReferenceProps: h, getFloatingProps: R } = _l({
    isOpen: e,
    setIsOpen: t,
    offset: n,
    placement: r,
    hover: o,
    click: l
  }), [C, w] = xr.toArray(c), [b] = A(An);
  function N() {
    return e && /* @__PURE__ */ s(Ml, { id: b, children: /* @__PURE__ */ s(
      "div",
      {
        ref: g.setFloating,
        style: {
          position: d,
          top: f ?? 0,
          left: a ?? 0
        },
        ...R(),
        children: w
      }
    ) });
  }
  function j() {
    return e && /* @__PURE__ */ s(
      "div",
      {
        ref: g.setFloating,
        style: {
          position: d,
          top: f ?? 0,
          left: a ?? 0
        },
        ...R(),
        children: w
      }
    );
  }
  return /* @__PURE__ */ y(X, { children: [
    /* @__PURE__ */ s(
      "div",
      {
        ref: g.setReference,
        ...h({ onClick: i }),
        children: C
      }
    ),
    u ? N() : j()
  ] });
}
function Bl({
  rowId: e,
  colId: t,
  data: n,
  setData: r,
  focus: o,
  isViewOnly: l,
  columnConfiguration: i,
  tableConfiguration: c
}) {
  const u = W(
    () => c.parseDate !== void 0 ? c.parseDate(n, i) : n ? new Date(Date.parse(n)) : null,
    [n, i]
  ), [a, f] = $(
    u && u._isValid !== !1 ? Me(u) : ""
  ), d = /^([1-9]|1[012]|0[1-9])[/.-]?$/g, g = /^([1-9]|1[012]|0[1-9])[/.-]([1-9]||0[1-9]|1[0-9]|2[0-9]|3[01])[/.-]?$/g, h = /^([1-9]|1[012]|0[1-9])[/.-]([1-9]||0[1-9]|1[0-9]|2[0-9]|3[01])[/.-](\d?\d?\d?\d)$/g, [R, C] = $(null), w = /* @__PURE__ */ new Date(), [, b] = A(Dt), N = o === "editing", j = Y(
    (_) => {
      b({ rowId: e, colId: t, value: _ ? "editing" : "focused" });
    },
    [e, t, b]
  );
  function V(_, p, S) {
    const v = Number(S), x = Number(_) - 1, E = Number(p), F = /* @__PURE__ */ new Date();
    return F.setUTCFullYear(v, x, E), F.setUTCHours(0, 0, 0, 0), F;
  }
  const M = Y(
    (_) => {
      c.formatStoredDate !== void 0 ? r(c.formatStoredDate(_, i) || "") : r((_ == null ? void 0 : _.toISOString()) || ""), c.formatStoredDate !== void 0 ? f(c.formatStoredDate(u, i) || "") : f(Me(_)), b({ rowId: e, colId: t, value: "focused" });
    },
    [e, t, b, r]
  );
  q(() => {
    R && R.focus();
  }, [R]), q(() => {
    c.formatStoredDate !== void 0 ? f(c.formatStoredDate(u, i) || "") : f(u && u._isValid !== !1 ? Me(u) : "");
  }, [o]);
  function T(_) {
    f(_.target.value);
  }
  return li(() => {
    if (!a || c.formatStoredDate !== void 0)
      return;
    let _ = null;
    if (h.test(a)) {
      a.match(h);
      const [p] = a.matchAll(h);
      _ = V(p[1], p[2], p[3]);
    } else if (d.test(a)) {
      a.match(d);
      const [p] = a.matchAll(d);
      _ = V(p[1], 1, w.getUTCFullYear());
    } else if (g.test(a)) {
      a.match(g);
      const [p] = a.matchAll(g);
      _ = V(
        p[1],
        p[2],
        w.getUTCFullYear()
      );
    }
    r((_ == null ? void 0 : _.toISOString()) || "");
  }, [a]), /* @__PURE__ */ y(X, { children: [
    (o === "none" || o === "focused") && /* @__PURE__ */ s("div", { className: "p-1 flex items-center cursor-default w-full", children: u ? c.formatDisplayDate !== void 0 ? c.formatDisplayDate(u, i) : Me(u) : "" }),
    o === "editing" && !l && /* @__PURE__ */ y(oe, { isOpen: N, setIsOpen: j, offset: 4, children: [
      /* @__PURE__ */ y("div", { className: "h-full", children: [
        /* @__PURE__ */ s("input", { type: "data", className: "hidden", value: a, readOnly: !0 }),
        /* @__PURE__ */ s(
          "input",
          {
            placeholder: "mm/dd/yyyy",
            className: "rs-input focus:outline-none rounded p-1 w-full",
            onChange: T,
            value: a,
            ref: C
          }
        )
      ] }),
      /* @__PURE__ */ s(fi, { onSelect: M, value: (u == null ? void 0 : u._isValid) !== !1 ? u : null })
    ] })
  ] });
}
const $l = {
  32: "truncate",
  64: "line-clamp-2",
  96: "line-clamp-4",
  128: "line-clamp-5"
};
function Hl({ data: e, setData: t, focusState: n, isViewOnly: r }) {
  const [o, l] = $(null), i = W(() => e || "", [e]), [c] = A(Tt);
  function u(a) {
    a.preventDefault(), t(a.target.value);
  }
  return q(() => {
    o && (o.focus(), o.setSelectionRange(
      i.length + 1,
      i.length || 1
    ), o.scrollTop = o.scrollHeight);
  }, [o]), /* @__PURE__ */ y(X, { children: [
    (n === "none" || n === "focused") && /* @__PURE__ */ s(
      "div",
      {
        className: U(
          "p-1 cursor-default w-full h-full",
          $l[c]
        ),
        children: e
      }
    ),
    n === "editing" && !r && /* @__PURE__ */ s(
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
  onNewOption: c,
  enableSearch: u = !0
}) {
  const [a, f] = $(e), d = a.find((v) => v.value === i.value), [g, h] = $(d || a[0]), [R, C] = $(!1), [w, b] = $(""), N = W(() => gt(), []), [j, V] = $({}), M = ae(!1);
  q(() => {
    let v = !1;
    if (t)
      for (const E in t)
        t[E].name.toLowerCase() === w.toLowerCase() && (v = !0);
    const x = e.filter((E) => (E.name.toLowerCase() === w.toLowerCase() && (v = !0), E.name.toLowerCase().includes(w.toLowerCase())));
    f(x), M.current ? x.length > 0 ? h(x[0]) : h({
      value: w,
      name: w,
      color: N
    }) : h(d || x[0]), V(v ? {} : {
      value: w,
      name: w,
      color: N
    }), C(v);
  }, [w]);
  function T(v) {
    n == null || n(v);
  }
  function _(v) {
    C(!1), b(v.target.value), M.current = !0;
  }
  const p = Y((v) => {
    if (v.code === "Enter") {
      if (v.preventDefault(), a.length === 0 && R || !g.value)
        return;
      c && !R && c(j), T(g);
    } else if (v.code === "ArrowDown") {
      g || h(a[0]);
      const x = a.findIndex(
        (E) => E.value === g.value
      );
      h(a[(x + 1) % a.length]);
    } else if (v.code === "ArrowUp") {
      g || h(a[0]);
      const x = a.findIndex(
        (E) => E.value === g.value
      );
      h(
        a[(x + a.length - 1) % a.length]
      );
    }
  });
  function S(v) {
    v.preventDefault(), h(a[0]);
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
        u && /* @__PURE__ */ s("div", { className: "px-2 mb-2", children: /* @__PURE__ */ s(
          "input",
          {
            className: "rs-input border focus:ring rounded-2 rounded focus:outline-none px-2 p-1 w-full truncate",
            placeholder: r,
            onChange: _,
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
              onClick: (x) => {
                x.preventDefault(), T(v);
              },
              onMouseEnter: () => {
                h(v);
              },
              "aria-selected": g.value === v.value,
              onKeyDown: (x) => {
                x.code === "Enter" && T(v);
              },
              children: [
                l ? /* @__PURE__ */ s(l, { ...v }) : v.name,
                d && d.value === v.value && /* @__PURE__ */ s(Pt, { className: "w-4 h-4 ml-auto self-center" })
              ]
            },
            v.value
          )),
          c && w && !R && /* @__PURE__ */ y(
            "li",
            {
              className: U(
                "hover:bg-hover-light px-2 p-1 cursor-pointer flex flex-row whitespace-nowrap",
                g && g.value === j.value && "bg-hover"
              ),
              onClick: () => c(j),
              onMouseEnter: () => {
                h(j);
              },
              "aria-selected": !1,
              onKeyDown: (v) => {
                v.code === "Enter" && c(j);
              },
              children: [
                /* @__PURE__ */ s("span", { className: "mr-2", children: "Add option:" }),
                l ? /* @__PURE__ */ s(l, { ...j }) : j.name
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
  showOptionSearch: c,
  isViewOnly: u
}) {
  const a = W(
    () => ge(n) ? [] : n.split(",").map((b) => o.find((N) => N.value === b)),
    [n, o]
  ), [f, d] = $(null), g = i === "editing", [, h] = A(Dt), R = Y(
    (b) => {
      h({ rowId: e, colId: t, value: b ? "editing" : "focused" });
    },
    [t, e, h]
  ), C = o.filter(
    (b) => a.findIndex((N) => N.value === b.value) === -1
  );
  q(() => {
    f && f.focus();
  }, [f]);
  const w = Y(
    (b) => {
      l({ id: t, options: [...o, b] }), r([...a.map((N) => N.value), b.value].join(",")), h({ rowId: e, colId: t, value: "focused" });
    },
    [t, e, a, o, l, r, h]
  );
  return /* @__PURE__ */ y(X, { children: [
    i === "none" && /* @__PURE__ */ s("div", { className: "p-1 flex items-center h-full overflow-hidden", children: /* @__PURE__ */ s("div", { className: "flex gap-1", children: a.map((b) => b ? /* @__PURE__ */ s(ce, { color: b.color, name: b.name }, b.name) : null) }) }),
    (i === "focused" || i === "editing") && /* @__PURE__ */ y(
      oe,
      {
        isOpen: g && !u,
        setIsOpen: R,
        referenceClass: "w-full max-h-8",
        children: [
          /* @__PURE__ */ s(
            "div",
            {
              className: "flex items-center p-1 w-full h-full bg-content",
              tabIndex: i === "editing" ? 0 : -1,
              children: /* @__PURE__ */ y("div", { className: "flex gap-1 flex-wrap", children: [
                a.map((b) => b ? /* @__PURE__ */ s(
                  ce,
                  {
                    color: b.color,
                    name: b.name,
                    onCancel: (N) => {
                      N.stopPropagation(), r(
                        n.split(",").filter((j) => j !== b.value).join(",")
                      );
                    }
                  },
                  b.name
                ) : null),
                /* @__PURE__ */ s(
                  "button",
                  {
                    className: "p-[3px] bg-zinc-100 rounded flex items-center h-full",
                    type: "button",
                    children: /* @__PURE__ */ s(_n, { className: "w-4 text-dark" })
                  }
                )
              ] })
            }
          ),
          /* @__PURE__ */ y(B, { children: [
            /* @__PURE__ */ s("div", { className: "w-48" }),
            /* @__PURE__ */ s(
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
                enableSearch: c
              }
            )
          ] })
        ]
      }
    )
  ] });
}
function Kl({ data: e, setData: t, setError: n, focus: r, isViewOnly: o, configuration: l }) {
  const [i] = A(re), [c, u] = $(null), a = /^[+-]?(\d*(\.\d*)?)$/, f = W(() => i.parseNumber !== void 0 ? i.parseNumber(e, l) : Number.parseFloat(e), [e, l]);
  function d(h) {
    h.preventDefault(), (i.parseNumber !== void 0 ? !isNaN(i.parseNumber(h.target.value, l)) : a.test(h.target.value)) ? (t(h.target.value), n("")) : n("Please enter a number.");
  }
  q(() => {
    n(""), c && c.focus();
  }, [n, c]);
  const g = (e || "").toString();
  return /* @__PURE__ */ y(X, { children: [
    (r === "none" || r === "focused") && /* @__PURE__ */ s("div", { className: "p-1 flex items-center justify-end truncate cursor-default w-full", children: i.formatDisplayNumber !== void 0 ? i.formatDisplayNumber(f, l) : g }),
    r === "editing" && !o && /* @__PURE__ */ s(
      "input",
      {
        type: "text",
        value: g,
        onChange: d,
        ref: u,
        className: "rs-input p-1 focus:outline-none w-full border-none text-sm rounded-sm truncate text-right"
      }
    )
  ] });
}
function ql({
  rowId: e,
  colId: t,
  data: n,
  setData: r,
  options: o,
  updateColumn: l,
  focusState: i,
  showOptionSearch: c,
  isViewOnly: u,
  tableConfiguration: a
}) {
  const f = W(
    () => Te(n) ? {} : o.find((N) => N.value === n)
  ), [d, g] = $(null), h = W(() => [
    {
      value: null,
      isBlank: !0,
      name: "Blank"
    },
    ...o
  ], [o]), R = i === "editing", [, C] = A(Dt), w = Y(
    (N) => {
      C({ rowId: e, colId: t, value: N ? "editing" : "focused" });
    },
    [t, e, C]
  );
  q(() => {
    d && d.focus();
  }, [d]);
  const b = Y(
    (N) => {
      l({ id: t, options: [...o, N] }), r(N.value), C({ rowId: e, colId: t, value: "focused" });
    },
    [t, e, o, l]
  );
  return /* @__PURE__ */ y(X, { children: [
    i === "none" && /* @__PURE__ */ s("div", { className: "p-1 flex items-center h-full", children: f && /* @__PURE__ */ s(ce, { color: f.color, name: f.name }) }),
    u && (i === "focused" || i === "editing") && /* @__PURE__ */ s("div", { className: "flex items-center p-1 w-full h-full", children: f && /* @__PURE__ */ s(ce, { color: f.color, name: f.name }) }),
    !u && (i === "focused" || i === "editing") && /* @__PURE__ */ y(
      oe,
      {
        isOpen: R,
        setIsOpen: w,
        referenceClass: "w-full max-h-8",
        children: [
          /* @__PURE__ */ y(
            "div",
            {
              className: "flex items-center p-1 w-full h-full",
              tabIndex: i === "editing" ? 0 : -1,
              children: [
                f && /* @__PURE__ */ s(ce, { color: f.color, name: f.name }),
                /* @__PURE__ */ s(
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
            /* @__PURE__ */ s("div", { className: "w-48" }),
            /* @__PURE__ */ s(
              je,
              {
                options: h,
                onSelect: (N) => {
                  r(N.value), w(!1);
                },
                inputRef: g,
                OptionRenderer: ({ isBlank: N, ...j }) => N ? /* @__PURE__ */ s(ii, { tableConfiguration: a, ...j }) : /* @__PURE__ */ s(ce, { ...j }),
                placeholder: "Search for an option...",
                value: f,
                onNewOption: b,
                enableSearch: c
              }
            )
          ] })
        ]
      }
    )
  ] });
}
function Zl({ data: e, setData: t, focusState: n, isViewOnly: r }) {
  const [o, l] = $(null), i = W(() => e || "", [e]);
  function c(u) {
    u.preventDefault(), t(u.target.value);
  }
  return q(() => {
    o && (o.focus(), o.setSelectionRange(i.length + 1, i.length + 1), o.scrollLeft = o.scrollWidth);
  }, [o]), /* @__PURE__ */ y(X, { children: [
    (n === "none" || n === "focused") && /* @__PURE__ */ s("div", { className: "p-1 flex items-center cursor-default w-full", children: /* @__PURE__ */ s("div", { className: "truncate", children: e }) }),
    n === "editing" && !r && /* @__PURE__ */ s(
      "input",
      {
        ref: l,
        type: "text",
        value: i,
        onChange: c,
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
        /* @__PURE__ */ s(
          "path",
          {
            d: "M4 20H20M15 11H20M13 6.5H20M4 15.5H20",
            strokeLinecap: "round",
            strokeLinejoin: "round"
          }
        ),
        /* @__PURE__ */ s(
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
  return /* @__PURE__ */ s(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...e,
      children: /* @__PURE__ */ s(
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
function Xl({ data: e, setData: t, focusState: n, isViewOnly: r }) {
  const [o, l] = $(null), i = W(() => e || "", [e]);
  function c(u) {
    u.preventDefault(), t(u.target.value);
  }
  return q(() => {
    o && (o.focus(), o.setSelectionRange(i.length + 1, i.length + 1), o.scrollLeft = o.scrollWidth);
  }, [o]), /* @__PURE__ */ y(X, { children: [
    (n === "none" || n === "focused") && /* @__PURE__ */ s("div", { className: "p-1 flex items-center cursor-default w-full", children: /* @__PURE__ */ s("div", { className: "truncate", children: /* @__PURE__ */ s(
      "a",
      {
        href: `//${e}`,
        rel: "noopener noreferrer",
        target: "_blank",
        className: "text-primary",
        children: e
      }
    ) }) }),
    n === "editing" && !r && /* @__PURE__ */ s(
      "input",
      {
        ref: l,
        type: "text",
        value: i,
        onChange: c,
        tabIndex: -1,
        rows: 1,
        className: "focus:outline-none rs-input p-1 w-full border-none text-sm rounded-sm truncate resize-none max-h-8"
      }
    )
  ] });
}
function $t({ checked: e, toggle: t, isViewOnly: n }) {
  return /* @__PURE__ */ y("div", { children: [
    /* @__PURE__ */ s(
      "input",
      {
        className: "hidden sr-only",
        type: "checkbox",
        checked: e,
        value: e,
        readOnly: !0
      }
    ),
    /* @__PURE__ */ s(
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
function Gl({ data: e, setData: t, focusState: n, isViewOnly: r }) {
  const o = W(() => e || !1, [e]);
  return /* @__PURE__ */ s(X, { children: /* @__PURE__ */ s("span", { className: "flex items-center justify-center p-1.5", children: /* @__PURE__ */ s($t, { checked: o, toggle: () => t(!o), isViewOnly: r }) }) });
}
function Jl({ rowData: e, formula: t }) {
  return /* @__PURE__ */ s(X, { children: /* @__PURE__ */ s("div", { className: "p-1 flex items-center cursor-default w-full", children: /* @__PURE__ */ s("div", { className: "truncate", children: t && typeof t == "function" && t(e) }) }) });
}
function Ql({ ...e }) {
  return /* @__PURE__ */ s(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...e,
      children: /* @__PURE__ */ s(
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
    cell: Zl,
    icon: Yl,
    name: "Single-Line Text"
  },
  {
    type: "longText",
    cell: Hl,
    icon: zl,
    name: "Long Text"
  },
  {
    type: "number",
    cell: Kl,
    icon: Ao,
    name: "Number"
  },
  {
    type: "select",
    cell: ql,
    icon: _o,
    name: "Select"
  },
  {
    type: "date",
    cell: Bl,
    icon: vo,
    name: "Date"
  },
  {
    type: "multiSelect",
    cell: Ul,
    icon: Do,
    name: "Multiple Select"
  },
  {
    type: "url",
    cell: Xl,
    icon: Mo,
    name: "URL"
  },
  {
    type: "checkbox",
    cell: Gl,
    icon: xo,
    name: "Checkbox"
  },
  {
    type: "formula",
    cell: Jl,
    icon: Ql,
    name: "Formula"
  }
];
function Xe(e) {
  const [t] = A(re);
  return [...ur, ...t.extraColumnTypes].find((n) => n.type === e);
}
function es() {
  return ur;
}
const ts = Ge.memo(rs), ns = ts;
function rs({ rowId: e, colId: t, data: n, rowData: r, setData: o }) {
  const [l, i] = $(""), c = ae(null), u = W(
    () => tt(e, t),
    [e, t]
  ), [a, f] = A(u), d = W(() => he(t), [t]), [g, h] = A(d), [R] = A(re), C = g.type === "custom" ? g.renderer : Xe(g.type).cell, w = W(
    () => ho(e, t),
    [e, t]
  ), [, b] = A(w);
  function N(T) {
    c.current && !c.current.contains(T.target) && f("none");
  }
  function j(T) {
    if (!c.current || T.target !== c.current) {
      T.code === "Escape" && f("focused");
      return;
    }
    T.code === "ArrowUp" ? (T.stopPropagation(), T.preventDefault(), b("up")) : T.code === "ArrowDown" ? (T.stopPropagation(), T.preventDefault(), b("down")) : T.code === "ArrowLeft" ? (T.stopPropagation(), T.preventDefault(), b("left")) : T.code === "ArrowRight" ? (T.stopPropagation(), T.preventDefault(), b("right")) : T.code === "Enter" ? (f("editing"), T.stopPropagation(), T.preventDefault()) : T.code === "Escape" && f("none");
  }
  function V(T) {
    c.current && T.target === c.current && f("focused");
  }
  function M(T) {
    T.stopPropagation(), !g.isViewOnly && f("editing");
  }
  return q(() => a === "focused" ? (document == null || document.addEventListener("mousedown", N), c.current && c.current.focus(), () => {
    document == null || document.removeEventListener("mousedown", N);
  }) : a === "editing" ? (document == null || document.addEventListener("mousedown", N), () => {
    document == null || document.removeEventListener("mousedown", N);
  }) : a === "none" ? (c.current && c.current.blur(), () => {
  }) : () => {
  }, [a]), /* @__PURE__ */ s(
    "div",
    {
      className: "relative p-0 border-r bg-content focus:outline-none",
      style: { width: g.width },
      ref: c,
      onClick: V,
      onFocus: V,
      onDoubleClick: M,
      tabIndex: 0,
      onKeyDown: j,
      role: "gridcell",
      children: /* @__PURE__ */ y(
        "div",
        {
          className: U(
            "w-full rounded-sm min-h-full focus:outline-none",
            (a === "focused" || a === "editing") && "ring-2 ring-blue-500 absolute top-0 z-10"
          ),
          children: [
            /* @__PURE__ */ s(
              C,
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
                setFocus: f,
                setData: o,
                showOptionSearch: g.showOptionSearch,
                isViewOnly: g.isViewOnly,
                rowData: r,
                formula: g.formula,
                columnConfiguration: g.configuration,
                tableConfiguration: R
              }
            ),
            a === "editing" && l && /* @__PURE__ */ s("div", { className: "text-xs p-1.5 py-2", children: l })
          ]
        }
      )
    }
  );
}
function os(e, t) {
  if (e == null || e === "")
    return "(empty)";
  switch (t.type) {
    case "select": {
      const n = t.options.find((r) => r.value === e);
      return /* @__PURE__ */ s(ce, { color: n.color, name: n.name });
    }
    case "date":
      return Me(new Date(Date.parse(e)));
    default:
      return e;
  }
}
function is({ groupVal: e }) {
  const [t] = A(Se), n = W(
    () => {
      var i;
      return he(((i = t[0]) == null ? void 0 : i.columnId) || "");
    },
    [t]
  ), [r] = A(n), [o, l] = A(Ot);
  return /* @__PURE__ */ y(
    "div",
    {
      className: U(
        "w-full h-16 bg-header rounded-t-md border flex",
        o[e] && "rounded-b-md"
      ),
      children: [
        /* @__PURE__ */ s(
          "div",
          {
            className: "h-full flex items-center justify-center w-16",
            onClick: () => l((i) => ({ ...i, [e]: !i[e] })),
            children: /* @__PURE__ */ s(Ro, { className: "w-4 h-4" })
          }
        ),
        /* @__PURE__ */ y("div", { className: "h-full p-1.5", children: [
          /* @__PURE__ */ s("div", { className: "text-xs tracking-wider uppercase font-medium text-secondary", children: r.name }),
          /* @__PURE__ */ s("div", { className: "flex mt-1", children: os(e, r) })
        ] })
      ]
    }
  );
}
function ls({ groupVal: e }) {
  const [t] = A(Se), [, n] = A(Ln);
  function r(o) {
    o.preventDefault();
    const l = { data: {} };
    t.length > 0 && (l[t[0].columnId] = e), n({ id: Je(), ...l });
  }
  return /* @__PURE__ */ s(
    "div",
    {
      onClick: r,
      className: U(
        "rs-btn h-8 border-b border-r font-normal text-sm cursor-pointer flex items-center hover:bg-hover bg-content",
        t.length > 0 && "border-l rounded-b-md"
      ),
      tabIndex: 0,
      children: /* @__PURE__ */ s("div", { className: "flex items-center justify-center", style: { width: 63 }, children: /* @__PURE__ */ s(_n, { className: "w-4 h-4" }) })
    }
  );
}
function ss({ rowId: e, first: t, last: n, groupVal: r }) {
  const [o] = A(Se), [l] = A(Ot), [i] = A(lo), [c] = A(re);
  return /* @__PURE__ */ y(
    "div",
    {
      className: U(
        t && o.length > 0 && "mt-8",
        o.length > 0 && "ml-4"
      ),
      style: { width: i },
      children: [
        o.length > 0 && t && /* @__PURE__ */ s(is, { groupVal: r }),
        !l[r] && /* @__PURE__ */ y(X, { children: [
          /* @__PURE__ */ s("div", { className: U(o.length > 0 && "border-l"), children: /* @__PURE__ */ s(cs, { rowId: e }) }),
          c.addRow.enabled && c.addRow.body && n && /* @__PURE__ */ s(ls, { groupVal: r }),
          " "
        ] })
      ]
    }
  );
}
const cs = Ge.memo(as);
function as({ rowId: e }) {
  const t = W(() => On(e), [e]), [n, r] = A(t), [o] = A(se), [l] = A(Tt), [i] = A(re), c = W(
    () => (u) => (a) => {
      r({ [u]: a });
    },
    [r]
  );
  return /* @__PURE__ */ y("div", { className: U("flex relative border-b"), style: { height: l }, children: [
    i.selectRow.enabled && /* @__PURE__ */ s(
      "div",
      {
        className: U(
          "border-r bg-content flex items-center justify-center"
        ),
        style: { width: 64 },
        children: /* @__PURE__ */ s(
          $t,
          {
            checked: n.isSelected || !1,
            toggle: () => r((u) => ({ isSelected: !u.isSelected }))
          }
        )
      }
    ),
    o.map((u) => /* @__PURE__ */ s(
      ns,
      {
        rowId: e,
        colId: u,
        data: n[u],
        rowData: n,
        setData: c(u)
      },
      `${e}-${u}`
    ))
  ] });
}
const us = yn(({ handleScroll: e }, t) => {
  const [n] = A(Le), [r] = A(re);
  return /* @__PURE__ */ s(
    "div",
    {
      className: "h-[calc(100%-65px)] overflow-auto border-b bg-background",
      onScroll: e,
      ref: t,
      children: /* @__PURE__ */ y("div", { className: "flex flex-row", children: [
        /* @__PURE__ */ y("div", { className: "flex flex-col", children: [
          n.map((o, l) => /* @__PURE__ */ s(
            ss,
            {
              rowId: o.id,
              first: o.first,
              last: o.last,
              groupVal: o.groupVal
            },
            o.id
          )),
          r.addRow.enabled && /* @__PURE__ */ s("div", { className: "h-48 shrink-0 grow" })
        ] }),
        r.addColumn.enabled && /* @__PURE__ */ s("div", { className: "w-48 shrink-0 grow" })
      ] })
    }
  );
}), ds = us, dr = [
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
    atomFactory: Zr
  }
];
function vn(e) {
  return dr.find((t) => t.type === e);
}
function fs() {
  return dr.map((e) => e.type);
}
const ms = yn(({}, e) => {
  const [t] = A(se), [n] = A(Se);
  return /* @__PURE__ */ s("div", { className: "bg-header h-8", children: /* @__PURE__ */ y("div", { className: "h-8 flex relative", ref: e, children: [
    /* @__PURE__ */ s(
      "div",
      {
        style: { width: 64 },
        className: U(n.length > 0 && "ml-4", "shrink-0 border-r")
      }
    ),
    t.map((r) => /* @__PURE__ */ s(ps, { colId: r }, r)),
    /* @__PURE__ */ s("div", { className: "w-48 grow shrink-0" })
  ] }) });
}), hs = ms;
function ps({ colId: e }) {
  const t = W(() => he(e), [e]), [n, r] = A(t), o = vn(n.summary), l = W(
    () => o ? o.atomFactory(n.id) : P(""),
    [o, n.id]
  ), [i] = A(l), c = fs(), [u, a] = $(!1);
  function f(d) {
    r({ summary: d }), a(!1);
  }
  return /* @__PURE__ */ y(
    oe,
    {
      isOpen: u,
      setIsOpen: a,
      click: !0,
      placement: "top-end",
      portal: !0,
      portalId: "table-footer",
      children: [
        /* @__PURE__ */ s(
          "div",
          {
            style: { width: n.width },
            className: U(
              "hover:bg-hover-light -mr-[1px] h-full flex items-center justify-end text-sm relative group px-2 cursor-default",
              u && "bg-hover"
            ),
            children: o ? /* @__PURE__ */ y(X, { children: [
              /* @__PURE__ */ s("span", { className: "text-xs text-secondary", children: o.name }),
              /* @__PURE__ */ s("span", { className: "ml-1", children: i })
            ] }) : /* @__PURE__ */ y(X, { children: [
              /* @__PURE__ */ s(Bn, { className: "w-4 h-4 hidden group-hover:block" }),
              /* @__PURE__ */ s("span", { className: "hidden group-hover:block text-xs ml-1", children: "Summary" })
            ] })
          }
        ),
        /* @__PURE__ */ y(B, { children: [
          /* @__PURE__ */ s("div", { className: "w-32" }),
          /* @__PURE__ */ y(B.Section, { children: [
            /* @__PURE__ */ s(
              B.Section.Button,
              {
                onClick: () => {
                  f("");
                },
                children: /* @__PURE__ */ s("span", { className: "text-secondary", children: "None" })
              }
            ),
            c.map((d) => {
              const g = vn(d);
              return /* @__PURE__ */ s(
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
    d: "M12 2.25a.75.75 0 0 1 .75.75v16.19l6.22-6.22a.75.75 0 1 1 1.06 1.06l-7.5 7.5a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 1 1 1.06-1.06l6.22 6.22V3a.75.75 0 0 1 .75-.75Z",
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
    d: "M11.47 2.47a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 1 1-1.06 1.06l-6.22-6.22V21a.75.75 0 0 1-1.5 0V4.81l-6.22 6.22a.75.75 0 1 1-1.06-1.06l7.5-7.5Z",
    clipRule: "evenodd"
  }));
}
const xs = m.forwardRef(bs), ys = xs;
function Cs({
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
const Rs = m.forwardRef(Cs), wn = Rs;
function Es({
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
const Ss = m.forwardRef(Es), Ht = Ss;
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
    d: "M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z",
    clipRule: "evenodd"
  }));
}
const ks = m.forwardRef(Ns), As = ks;
function Os({
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
const Ls = m.forwardRef(Os), lt = Ls;
function Ms({ colId: e, supportedTypes: t }) {
  const [n] = A(W(() => he(e), [e])), [, r] = A(mo), o = W(() => et(e), [e]), [, l] = A(o);
  function i(c, u) {
    c.preventDefault(), r({ colId: n.id, type: u }), l(!1);
  }
  return /* @__PURE__ */ s(B, { children: /* @__PURE__ */ y(B.Section, { children: [
    /* @__PURE__ */ s("div", { className: "w-56" }),
    /* @__PURE__ */ s(B.Section.Item, { children: /* @__PURE__ */ s("span", { className: "uppercase font-medium text-secondary text-xs", children: "Property Type" }) }),
    t.map((c) => /* @__PURE__ */ y(
      B.Section.Button,
      {
        onClick: (u) => {
          i(u, c.type);
        },
        children: [
          /* @__PURE__ */ s(c.icon, { className: "w-4 h-4 mr-2" }),
          /* @__PURE__ */ s("span", { children: c.name })
        ]
      },
      c.name
    ))
  ] }) });
}
function St({ ...e }) {
  return /* @__PURE__ */ s(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...e,
      children: /* @__PURE__ */ s(
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
  const [o, l] = A(W(() => he(e), [e])), i = ae(), c = o.type === "custom" ? o.icon : Xe(o.type).icon, u = o.type === "custom" ? "Custom" : Xe(o.type).name, [, a] = A(In), [, f] = A(Tn), d = W(() => et(e), [e]), [, g] = A(d), [h] = A(re), R = W(() => [...es(), ...h.extraColumnTypes], []);
  q(() => {
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
  function N(v) {
    v.preventDefault(), v.stopPropagation(), t([{ columnId: o.id, order: "asc" }]), a(!0), g(!1);
  }
  function j(v) {
    v.preventDefault(), v.stopPropagation(), t([{ columnId: o.id, order: "desc" }]), a(!0), g(!1);
  }
  function V(v) {
    v.preventDefault(), v.stopPropagation(), n([{ columnId: o.id, type: o.type === "number" ? "equals" : "contains", value: "" }]), f(!0), g(!1);
  }
  const M = [
    [
      {
        name: "Sort Ascending",
        icon: ys,
        action: N,
        enabled: h.sorting.enabled
      },
      {
        name: "Sort Descending",
        icon: ws,
        action: j,
        enabled: h.sorting.enabled
      },
      {
        name: "Filter",
        icon: St,
        action: V,
        enabled: h.filtering.enabled
      }
    ],
    [
      {
        name: "Delete",
        icon: As,
        action: b,
        disabled: o.is_primary === "true" || o.is_primary === !0,
        enabled: h.deleteColumns.enabled
      }
    ]
  ], [T, _] = $(!1), [p, S] = $(null);
  if (T)
    return /* @__PURE__ */ s(Ms, { colId: e, supportedTypes: R });
  if (p !== null) {
    const v = h.extraColumnHeaderPopupActions[p];
    return /* @__PURE__ */ s(v.popup, { column: o, setColumn: l, close: () => g(!1) });
  }
  return /* @__PURE__ */ y(B, { children: [
    /* @__PURE__ */ s("div", { className: "w-56" }),
    /* @__PURE__ */ y(B.Section, { children: [
      /* @__PURE__ */ s(B.Section.Item, { children: /* @__PURE__ */ s(
        "input",
        {
          value: o.name,
          onChange: C,
          ref: i,
          onKeyDown: w,
          className: "rs-input focus:outline-none focus:ring rounded rounded-2 p-1 border w-full mb-2"
        }
      ) }),
      /* @__PURE__ */ s(B.Section.Item, { children: /* @__PURE__ */ s("span", { className: "uppercase font-medium text-secondary text-xs", children: "Property Type" }) }),
      /* @__PURE__ */ y(B.Section.Button, { onClick: () => _(!0), children: [
        c && /* @__PURE__ */ s(c, { className: "w-4 h-4 mr-2" }),
        u
      ] }),
      h.extraColumnHeaderPopupActions.map((v, x) => ({ popupAction: v, index: x })).filter(({ popupAction: v }) => v.section === "main").map(({ popupAction: v, index: x }) => /* @__PURE__ */ s(v.menuItem, { column: o, showPopup: () => {
        S(x);
      } }, x))
    ] }),
    M.map(
      (v, x) => v.findIndex((E) => E.enabled === !0) !== -1 && /* @__PURE__ */ y(B.Section, { children: [
        v.map(
          (E) => E.enabled && /* @__PURE__ */ y(
            B.Section.Button,
            {
              onClick: E.action,
              disabled: E.disabled,
              children: [
                /* @__PURE__ */ s(E.icon, { className: "w-4 h-4 mr-2" }),
                /* @__PURE__ */ s("span", { children: E.name })
              ]
            },
            E.name
          )
        ),
        h.extraColumnHeaderPopupActions.filter((E) => E.section === "actions" + (x + 1)).map((E, F) => /* @__PURE__ */ s(E.menuItem, { column: o, showPopup: () => {
          S(F);
        } }, F))
      ] }, v[0].name)
    )
  ] });
}
function Ts({
  colId: e,
  deleteCallback: t,
  sortCallback: n,
  filterCallback: r
}) {
  const [o, l] = A(W(() => he(e), [e])), i = o.type === "custom" ? o.icon : Xe(o.type).icon, [c, u] = $(o.width), [a, f] = $(!1), d = W(() => et(e), [e]), [g, h] = A(d), [R] = A(re);
  function C(w) {
    w.preventDefault();
    const b = w.pageX, N = c;
    f(!0);
    function j(V) {
      const M = Math.max(
        128,
        N + V.pageX - b
      );
      u(M), l({ width: M });
    }
    window.addEventListener("mousemove", j), window.addEventListener("mouseup", () => {
      window.removeEventListener("mousemove", j), f(!1);
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
              style: { width: c },
              children: [
                i && /* @__PURE__ */ s(i, { className: "w-4 h-4 mr-2 shrink-0" }),
                /* @__PURE__ */ s("span", { className: "whitespace-nowrap truncate", children: o.name })
              ]
            }
          ),
          /* @__PURE__ */ s(
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
    /* @__PURE__ */ s(
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
const Ds = Ge.forwardRef((e, t) => {
  const [n] = A(se), [r] = A(ao), o = kt(uo), [l] = A(Mt), [i] = A(Se), [, c] = A(oo), [, u] = A(Dn), [, a] = A(Fn), f = Y(
    (w) => {
      a({ filtering: w });
    },
    [a]
  ), d = Y(
    (w) => {
      u({ sorting: w });
    },
    [u]
  ), [, g] = A(io), h = Y((w) => {
    if (l.find((b) => b.columnId === w.id)) {
      const b = l.filter((N) => N.columnId !== w.id);
      d(b);
    }
    g({ id: w.id });
  });
  function R(w) {
    w.preventDefault(), c({
      id: Je(),
      name: `Column-${pt()}`,
      type: "text",
      width: 192,
      position: n.length,
      isVisible: !0,
      isEditable: !0
    });
  }
  const [C] = A(re);
  return /* @__PURE__ */ s("div", { className: "flex bg-header border-b z-10", children: /* @__PURE__ */ y("div", { className: "flex relative h-8", ref: t, children: [
    /* @__PURE__ */ y(
      "div",
      {
        className: U(
          "h-8 text-sm inline-flex flex-row",
          i.length > 0 && "ml-[17px]"
        ),
        children: [
          C.selectRow.enabled && /* @__PURE__ */ s(
            "div",
            {
              className: "border-r px-4 flex items-center justify-center h-8",
              style: { width: 64 },
              children: /* @__PURE__ */ s($t, { checked: r, toggle: o })
            }
          ),
          n.map((w) => /* @__PURE__ */ s(
            Ts,
            {
              colId: w,
              sortCallback: d,
              filterCallback: f,
              deleteCallback: h
            },
            w
          )),
          C.addColumn.enabled && /* @__PURE__ */ s(
            "div",
            {
              onClick: R,
              className: "rs-btn h-8 p-1 cursor-pointer border-r hover:bg-hover-light font-normal w-16 flex items-center justify-center",
              "aria-label": "add-column",
              onKeyDown: (w) => {
                w.code === "Enter" && R(w);
              },
              children: /* @__PURE__ */ s(Ht, { className: "w-4 h-4" })
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ s("div", { className: "w-32 shrink-0 grow" })
  ] }) });
}), Ps = Ds;
function Fs(e, t) {
  let n = null;
  return (...r) => {
    window.clearTimeout(n), n = window.setTimeout(() => {
      e.apply(null, r);
    }, t);
  };
}
const js = [
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
  options: e = js,
  value: t = {},
  onSelect: n
}) {
  const [r, o] = $(!1), [l, i] = $(t), c = e.find((a) => a.value === l.value);
  function u(a) {
    i(a), o(!1), n == null || n(a);
  }
  return /* @__PURE__ */ s("div", { className: "w-full relative", children: /* @__PURE__ */ y(
    oe,
    {
      isOpen: r,
      setIsOpen: o,
      offset: 4,
      portal: !0,
      children: [
        /* @__PURE__ */ y("div", { className: "rs-btn flex flex-row relative w-full border rounded p-1 pl-2 items-center hover:bg-hover focus:outline-none cursor-default", children: [
          /* @__PURE__ */ s("div", { className: "text-ellipsis flex-grow text-left whitespace-nowrap overflow-hidden", children: l.name ? /* @__PURE__ */ s("span", { children: l.name }) : /* @__PURE__ */ s("span", { className: "text-secondary", children: "Select" }) }),
          /* @__PURE__ */ s(ti, { className: "w-4 h-4 duration-100 ml-auto" })
        ] }),
        /* @__PURE__ */ s("div", { className: "min-w-full w-max focus:outline-none", children: /* @__PURE__ */ y(B, { children: [
          /* @__PURE__ */ s("div", { className: "w-48" }),
          /* @__PURE__ */ s(B.Section, { children: e.map((a) => /* @__PURE__ */ y(
            B.Section.Button,
            {
              onClick: () => {
                u(a);
              },
              children: [
                /* @__PURE__ */ s("span", { children: a.name }),
                /* @__PURE__ */ s("span", { className: "ml-auto", children: c.value === a.value && /* @__PURE__ */ s(Pt, { className: "w-4 h-4" }) })
              ]
            },
            a.value
          )) })
        ] }) })
      ]
    }
  ) });
}
function Vs({ columns: e, filter: t, setFilter: n }) {
  const [r, o] = $(null), l = [
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
  q(() => {
    r && r.focus();
  }, [r]);
  const c = W(
    () => Fs((a, f) => {
      n((d) => {
        const g = d.findIndex((h) => h.id === a.id);
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
  function u(a) {
    var f;
    return (f = e.find((d) => d.id === a)) == null ? void 0 : f.type;
  }
  return /* @__PURE__ */ y(B, { children: [
    /* @__PURE__ */ s("div", { className: "w-56" }),
    t.length > 0 ? /* @__PURE__ */ y(B.Section, { children: [
      /* @__PURE__ */ s("h3", { className: "text-sm mb-3 px-3 font-medium", children: "Filter By" }),
      /* @__PURE__ */ s("div", { className: "px-3 flex flex-col space-y-3", children: t.map((a) => /* @__PURE__ */ y(
        "div",
        {
          className: "flex flex-row space-x-2",
          children: [
            /* @__PURE__ */ s("div", { className: "w-36", children: /* @__PURE__ */ s(
              Ee,
              {
                options: e.map((f) => ({
                  value: f.id,
                  name: f.name
                })),
                value: {
                  value: a.columnId,
                  name: e.find((f) => f.id === a.columnId).name
                },
                onSelect: (f) => n((d) => {
                  const g = d.findIndex((h) => h.id === a.id);
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
            /* @__PURE__ */ s("div", { className: "w-28", children: /* @__PURE__ */ s(
              Ee,
              {
                options: u(a.columnId) === "number" ? i : l,
                value: u(a.columnId) === "number" ? i.find(
                  (f) => f.value === a.type
                ) : l.find((f) => f.value === a.type),
                onSelect: (f) => n((d) => {
                  const g = d.findIndex((h) => h.id === a.id);
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
            /* @__PURE__ */ s("div", { className: "w-36", children: /* @__PURE__ */ s(
              "input",
              {
                type: "text",
                className: "rs-input border h-full rounded w-full focus:outline-none focus:ring px-2 p-1",
                defaultValue: a.value,
                placeholder: "Type a value...",
                onChange: (f) => c(a, f.target.value)
              }
            ) }),
            /* @__PURE__ */ s(
              "div",
              {
                className: "rs-btn flex items-center justify-center hover:bg-hover-light px-2 rounded hover:cursor-pointer",
                onClick: () => n((f) => f.filter((d) => d.id !== a.id)),
                "aria-label": "cancel-filter",
                children: /* @__PURE__ */ s(lt, { className: "h-4 w-4" })
              }
            )
          ]
        },
        `filter-${a.columnId}`
      )) }),
      /* @__PURE__ */ s("div", { className: "py-2 px-3", children: /* @__PURE__ */ y(
        "button",
        {
          className: "rs-btn flex items-center justify-center bg-transparent rounded gap-x-1 h-6 font-thin hover:cursor-pointer text-sm p-0",
          onClick: () => n((a) => [
            ...a,
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
            /* @__PURE__ */ s(Ht, { className: "h-3 w-3" }),
            /* @__PURE__ */ s("span", { children: "Add condition" })
          ]
        }
      ) })
    ] }) : /* @__PURE__ */ s(
      je,
      {
        options: e.map((a) => ({
          value: a.id,
          name: a.name
        })),
        onSelect: (a) => n([
          {
            id: pt(),
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
function _s({ setFilter: e }) {
  const [t] = A(Pn), [n] = A(Qr), [r, o] = A(Tn);
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
          /* @__PURE__ */ s(St, { className: "w-4 h-4 mr-1" }),
          /* @__PURE__ */ s("span", { children: `Filtered by ${Object.keys(t).length} field` })
        ] }) : /* @__PURE__ */ y(
          "div",
          {
            className: U(
              "rs-btn h-8 hover:bg-hover px-3 rounded text-sm flex flex-row items-center cursor-default",
              r && "bg-hover"
            ),
            children: [
              /* @__PURE__ */ s(St, { className: "w-4 h-4 mr-1" }),
              /* @__PURE__ */ s("span", { children: "Filter data" })
            ]
          }
        ),
        /* @__PURE__ */ s(Vs, { columns: n, filter: t, setFilter: e })
      ]
    }
  );
}
function bn({ ...e }) {
  return /* @__PURE__ */ s(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...e,
      children: /* @__PURE__ */ s(
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
function Bs({ columns: e, grouping: t, setGroup: n }) {
  const [r, o] = $(null), l = [
    {
      value: "asc",
      name: "Ascending"
    },
    {
      value: "desc",
      name: "Descending"
    }
  ];
  return q(() => {
    r && r.focus();
  }, [r]), /* @__PURE__ */ y(B, { children: [
    /* @__PURE__ */ s("div", { className: "w-56" }),
    t.length > 0 ? /* @__PURE__ */ y(B.Section, { children: [
      /* @__PURE__ */ s("h3", { className: "text-sm mb-3 px-3 font-medium", children: "Group By" }),
      /* @__PURE__ */ s("div", { className: "px-3", children: t.map((i) => /* @__PURE__ */ y(
        "div",
        {
          className: "flex flex-row space-x-2",
          children: [
            /* @__PURE__ */ s("div", { className: "w-36", children: /* @__PURE__ */ s(
              Ee,
              {
                options: e.map((c) => ({
                  value: c.id,
                  name: c.name
                })),
                value: {
                  value: i.columnId,
                  name: e.find((c) => c.id === i.columnId).name
                },
                onSelect: (c) => n([{ columnId: c.value, order: "asc" }])
              }
            ) }),
            /* @__PURE__ */ s("div", { className: "w-28", children: /* @__PURE__ */ s(
              Ee,
              {
                options: l,
                value: l.find((c) => c.value === i.order),
                onSelect: (c) => n([
                  {
                    columnId: i.columnId,
                    order: c.value
                  }
                ])
              }
            ) }),
            /* @__PURE__ */ s(
              "div",
              {
                className: "rs-btn flex items-center justify-center hover:bg-hover-light px-2 rounded",
                onClick: () => n([]),
                "aria-label": "cancel-grouping",
                children: /* @__PURE__ */ s(lt, { className: "h-4 w-4" })
              }
            )
          ]
        },
        `grouping-${i.columnId}`
      )) })
    ] }) : /* @__PURE__ */ s(
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
  const [n, r] = $(!1), [o] = A(Mn);
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
          /* @__PURE__ */ s(bn, { className: "w-4 h-4 mr-1" }),
          /* @__PURE__ */ s("span", { children: "Grouped by 1 field" })
        ] }) : /* @__PURE__ */ y(
          "div",
          {
            className: U(
              "rs-btn hover:bg-hover px-3 rounded flex flex-row items-center h-8 cursor-default",
              n && "bg-hover"
            ),
            children: [
              /* @__PURE__ */ s(bn, { className: "w-4 h-4 mr-1" }),
              /* @__PURE__ */ s("span", { children: "Group" })
            ]
          }
        ),
        /* @__PURE__ */ s(Bs, { columns: o, grouping: e, setGroup: t })
      ]
    }
  );
}
function Hs({ value: e, setValue: t }) {
  return /* @__PURE__ */ y(X, { children: [
    /* @__PURE__ */ s("input", { type: "checkbox", checked: e, className: "hidden", readOnly: !0 }),
    /* @__PURE__ */ s(
      "div",
      {
        className: U(
          "rs-btn rounded-full w-7 h-4 flex items-center cursor-pointer border transition duration-200 ease-in-out",
          e ? "bg-green-500 border-black/10" : "bg-background"
        ),
        onClick: () => t(!e),
        "aria-label": "toggle",
        children: /* @__PURE__ */ s(
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
function Ws({ colId: e }) {
  const [t, n] = A(W(() => he(e), [e]));
  return /* @__PURE__ */ y(B.Section.Item, { children: [
    /* @__PURE__ */ s(
      Hs,
      {
        value: t.isVisible,
        setValue: (r) => n({ isVisible: r })
      }
    ),
    /* @__PURE__ */ s("span", { className: "ml-2", children: t.name })
  ] }, t.id);
}
function Us({ setColumnVisibility: e }) {
  const [t] = A(eo);
  return /* @__PURE__ */ y(B, { children: [
    /* @__PURE__ */ s("div", { className: "w-48" }),
    /* @__PURE__ */ s(B.Section, { children: t.map((n) => /* @__PURE__ */ s(Ws, { colId: n })) })
  ] });
}
function Ks({ setColumnVisibility: e }) {
  const [t, n] = $(!1), [r] = A(to);
  return /* @__PURE__ */ y(oe, { isOpen: t, setIsOpen: n, offset: 4, portal: !0, children: [
    r > 0 ? /* @__PURE__ */ y("div", { className: "rs-btn h-8 hover:ring-2 hover:ring-black/10 hover:ring-inset bg-green-200 px-3 rounded text-sm flex row items-center focus:outline-none cursor-default text-dark", children: [
      /* @__PURE__ */ s(Jt, { className: "w-4 h-4 mr-1" }),
      /* @__PURE__ */ s("span", { children: `${r} hidden fields` })
    ] }) : /* @__PURE__ */ y(
      "div",
      {
        className: U(
          "rs-btn hover:bg-hover px-3 rounded flex flex-row items-center h-8 focus:outline-none cursor-default",
          t && "bg-hover"
        ),
        children: [
          /* @__PURE__ */ s(Jt, { className: "w-4 h-4 mr-1" }),
          /* @__PURE__ */ s("span", { children: "Hide fields" })
        ]
      }
    ),
    /* @__PURE__ */ s(Us, { setColumnVisibility: e })
  ] });
}
function qs({ ...e }) {
  return /* @__PURE__ */ s(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...e,
      children: /* @__PURE__ */ s(
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
function Zs({ ...e }) {
  return /* @__PURE__ */ s(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...e,
      children: /* @__PURE__ */ s(
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
function zs({ ...e }) {
  return /* @__PURE__ */ s(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...e,
      children: /* @__PURE__ */ s(
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
function Ys({ ...e }) {
  return /* @__PURE__ */ s(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...e,
      children: /* @__PURE__ */ s(
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
    icon: Zs
  },
  {
    value: 96,
    name: "Tall",
    icon: zs
  },
  {
    value: 128,
    name: "Extra Tall",
    icon: Ys
  }
];
function mr(e) {
  return fr.find((t) => t.value === e);
}
function Xs() {
  return fr.map((e) => e.value);
}
function Gs({ height: e, setHeight: t }) {
  const n = Xs();
  return /* @__PURE__ */ y(B, { children: [
    /* @__PURE__ */ s("div", { className: "w-48" }),
    /* @__PURE__ */ s(B.Section, { children: n.map((r) => {
      const o = mr(r);
      return /* @__PURE__ */ y(
        B.Section.Button,
        {
          onClick: () => t(o.value),
          children: [
            /* @__PURE__ */ s(o.icon, { className: "w-4 h-4 mr-2" }),
            o.name,
            o.value === e && /* @__PURE__ */ s(Pt, { className: "w-4 h-4 ml-auto" })
          ]
        },
        o.value
      );
    }) })
  ] });
}
function Js({ height: e, setHeight: t }) {
  const [n, r] = $(!1), o = mr(e);
  return /* @__PURE__ */ y(
    oe,
    {
      isOpen: n,
      setIsOpen: r,
      offset: 4,
      portal: !0,
      portalId: "table",
      children: [
        /* @__PURE__ */ s(
          "div",
          {
            className: U(
              "rs-btn hover:bg-hover px-3 rounded flex flex-row items-center h-8 focus:outline-none cursor-default",
              n && "bg-hover"
            ),
            "aria-label": "height-selector",
            children: /* @__PURE__ */ s(o.icon, { className: "w-4 h-4 mr-1" })
          }
        ),
        /* @__PURE__ */ s(Gs, { height: e, setHeight: t })
      ]
    }
  );
}
function Qs({ active: e, Icon: t, text: n, bgColor: r }) {
  return /* @__PURE__ */ y(
    "div",
    {
      className: U(
        "rs-btn h-8 hover:ring-2 hover:ring-black/10 hover:ring-inset bg-orange-200 px-3 rounded flex items-center gap-x-1 cursor-default text-dark",
        r && r
      ),
      children: [
        t && /* @__PURE__ */ s(t, { className: "w-4 h-4" }),
        /* @__PURE__ */ s("span", { children: n })
      ]
    }
  );
}
function ec({ sort: e, setSort: t }) {
  const [n, r] = $(null), [o] = A(Mn), l = [
    {
      value: "asc",
      name: "Ascending"
    },
    {
      value: "desc",
      name: "Descending"
    }
  ];
  return q(() => {
    n && n.focus();
  }, [n]), /* @__PURE__ */ y(B, { children: [
    /* @__PURE__ */ s("div", { className: "w-56" }),
    e.length > 0 ? /* @__PURE__ */ y(B.Section, { children: [
      /* @__PURE__ */ s("h3", { className: "text-sm mb-3 px-3 font-medium", children: "Sort By" }),
      /* @__PURE__ */ s("div", { className: "px-3", children: e.map((i) => /* @__PURE__ */ y(
        "div",
        {
          className: "flex flex-row space-x-2",
          children: [
            /* @__PURE__ */ s("div", { className: "w-36", children: /* @__PURE__ */ s(
              Ee,
              {
                options: o.map((c) => ({
                  value: c.id,
                  name: c.name
                })),
                value: {
                  value: i.columnId,
                  name: o.find((c) => c.id === i.columnId).name
                },
                onSelect: (c) => t([{ columnId: c.value, order: "asc" }])
              }
            ) }),
            /* @__PURE__ */ s("div", { className: "w-28", children: /* @__PURE__ */ s(
              Ee,
              {
                options: l,
                value: l.find((c) => c.value === i.order),
                onSelect: (c) => t([
                  {
                    columnId: i.columnId,
                    order: c.value
                  }
                ])
              }
            ) }),
            /* @__PURE__ */ s(
              "div",
              {
                className: "rs-btn flex items-center justify-center hover:bg-hover-light px-2 rounded",
                onClick: () => t([]),
                "aria-label": "cancel-sort",
                children: /* @__PURE__ */ s(lt, { className: "h-4 w-4" })
              }
            )
          ]
        },
        `sort-${i.columnId}`
      )) })
    ] }) : /* @__PURE__ */ s(
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
function tc({ setSort: e }) {
  const [t] = A(Mt), [n, r] = A(In);
  return /* @__PURE__ */ y(
    oe,
    {
      isOpen: n,
      setIsOpen: r,
      offset: 4,
      portal: !0,
      portalId: "table",
      children: [
        t.length > 0 ? /* @__PURE__ */ s(
          Qs,
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
              /* @__PURE__ */ s(wn, { className: "w-4 h-4 mr-1" }),
              /* @__PURE__ */ s("span", { children: "Sort data" })
            ]
          }
        ),
        /* @__PURE__ */ s(ec, { sort: t, setSort: e })
      ]
    }
  );
}
function nc() {
  const [e] = A(Jr), [t] = A(Pn), [n] = A(Mt), [r] = A(Se), [o] = A(Tt), [l] = A(Gr), [, i] = A(Fn), c = kt(fo), [, u] = A(zr), [, a] = A(Ln), [, f] = A(Yr), [d] = A(re), g = Y((M) => {
    i({ filtering: M });
  }, []), h = Y((M) => {
    M.preventDefault(), u();
  }, []);
  function R(M) {
    a({ id: Je() });
  }
  const [, C] = A(Dn), w = Y((M) => {
    C({ sorting: M });
  }, []), [, b] = A(co), N = Y((M) => {
    b({ rowHeight: M });
  }, []), [, j] = A(so), V = Y((M) => {
    j({ grouping: M });
  }, []);
  return /* @__PURE__ */ s(
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
          /* @__PURE__ */ s("div", { className: "bg-content h-4 w-px last:hidden" }),
          /* @__PURE__ */ y(
            "div",
            {
              className: "rs-btn self-stretch hover:bg-hover-light px-2 text-sm flex flex-row items-center",
              onClick: () => c(),
              children: [
                /* @__PURE__ */ s(lt, { className: "w-4 h-4 mr-1" }),
                /* @__PURE__ */ s("span", { children: "Cancel" })
              ]
            }
          ),
          /* @__PURE__ */ s("div", { className: "bg-content h-4 w-px last:hidden" }),
          /* @__PURE__ */ y(
            "div",
            {
              className: "rs-btn self-stretch hover:bg-hover-light px-2 rounded-r text-sm flex flex-row items-center",
              onClick: h,
              children: [
                /* @__PURE__ */ s(Ho, { className: "w-4 h-4 mr-1" }),
                /* @__PURE__ */ s("span", { children: "Delete" })
              ]
            }
          ),
          /* @__PURE__ */ s("div", { className: "bg-content h-4 w-px last:hidden" }),
          d.rowSelectionButtons.map((M) => /* @__PURE__ */ y(X, { children: [
            /* @__PURE__ */ s(
              "div",
              {
                className: "rs-btn self-stretch hover:bg-hover-light px-2 rounded-r text-sm flex flex-row items-center",
                onClick: () => f({
                  handler: M.handler
                }),
                children: M.body
              }
            ),
            /* @__PURE__ */ s("div", { className: "bg-content h-4 w-px last:hidden" })
          ] }))
        ] }),
        /* @__PURE__ */ s("div", { className: "h-4 border" }),
        d.addRow.enabled && d.addRow.toolbar && /* @__PURE__ */ y(
          "div",
          {
            className: "rs-btn hover:bg-hover px-3 rounded flex flex-row items-center h-8 focus:outline-none",
            onClick: R,
            children: [
              /* @__PURE__ */ s(Ht, { className: "w-4 h-4 mr-1" }),
              /* @__PURE__ */ s("span", { children: "New row" })
            ]
          }
        ),
        d.hideFields.enabled && /* @__PURE__ */ s(Ks, {}),
        d.filtering.enabled && /* @__PURE__ */ s(_s, { filter: t, setFilter: g }),
        d.grouping.enabled && /* @__PURE__ */ s($s, { grouping: r, setGroup: V }),
        d.sorting.enabled && /* @__PURE__ */ s(tc, { sort: n, setSort: w }),
        d.rowHeight.enabled && /* @__PURE__ */ s(Js, { height: o, setHeight: N }),
        d.extraToolbarItems.map((M, T) => /* @__PURE__ */ s(M.render, {}, T))
      ] })
    }
  );
}
const rc = {
  light: "",
  dark: "dark"
};
function oc() {
  const e = ae(null), t = ae(null), n = ae(null), [r] = A(re);
  q(() => {
    if (!n.current)
      return () => null;
    function i(c) {
      e.current.scrollLeft = n.current.scrollLeft, e.current.style.transform = `translate3d(-${n.current.scrollLeft}px, 0, 0)`, t.current && (t.current.style.transform = `translate3d(-${n.current.scrollLeft}px, 0, 0)`);
    }
    n.current.addEventListener("scroll", i);
  }, []), q(() => {
    if (!e.current)
      return () => null;
    function i(c) {
      c.preventDefault(), n.current.scrollLeft += c.deltaX;
    }
    e.current.addEventListener("mousewheel", i, {
      passive: !1
    });
  }, []), q(() => {
    if (!t.current)
      return () => null;
    function i(c) {
      c.preventDefault(), n.current.scrollLeft += c.deltaX;
    }
    t.current.addEventListener("mousewheel", i, {
      passive: !1
    });
  }, []);
  const [o, l] = A(An);
  return q(() => {
    l(Je());
  }, []), /* @__PURE__ */ y(
    "div",
    {
      className: U(
        "h-full w-full relative rs-table text-sm text-primary overflow-hidden",
        rc[r.theme.color]
      ),
      id: o,
      children: [
        r.toolbar.enabled && /* @__PURE__ */ s(nc, {}),
        /* @__PURE__ */ y("div", { className: "h-[calc(100%-48px)] overflow-hidden", children: [
          /* @__PURE__ */ s(Ps, { ref: e }),
          /* @__PURE__ */ s(ds, { ref: n }),
          r.footer.enabled && /* @__PURE__ */ s(hs, { ref: t })
        ] })
      ]
    }
  );
}
function ic({ data: e, columns: t, onChange: n, config: r, children: o }) {
  return Tr([
    [ro, t],
    [Xr, e],
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
  return /* @__PURE__ */ s(Or, { children: /* @__PURE__ */ s(
    ic,
    {
      data: e,
      columns: t,
      onChange: n,
      config: r,
      children: /* @__PURE__ */ s(oc, {})
    }
  ) });
}
export {
  dc as EVALUATION_LICENSE,
  fc as default
};
