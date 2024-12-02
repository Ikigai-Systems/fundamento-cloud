import "./main.css";
import { jsxs as x, jsx as a, Fragment as X } from "react/jsx-runtime";
import * as h from "react";
import Je, { createContext as br, useRef as ae, createElement as yr, useCallback as Y, useContext as xr, useReducer as Cr, useEffect as Z, useDebugValue as Rr, useState as B, useLayoutEffect as xn, Children as Er, useMemo as W, forwardRef as Cn } from "react";
import * as Sr from "react-dom";
import { createPortal as Nr } from "react-dom";
var z = { BASE_URL: "/", MODE: "production", DEV: !1, PROD: !0, SSR: !1 };
let kr = 0;
function P(e, t) {
  const n = `atom${++kr}`, r = {
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
const at = (e) => "init" in e, ut = (e) => !!e.write, We = /* @__PURE__ */ new WeakMap(), Ar = (e, t) => {
  We.set(e, t), e.catch(() => {
  }).finally(() => We.delete(e));
}, Kt = (e, t) => {
  const n = We.get(e);
  n && (We.delete(e), n(t));
}, Zt = (e, t) => {
  e.status = "fulfilled", e.value = t;
}, qt = (e, t) => {
  e.status = "rejected", e.reason = t;
}, Or = (e) => typeof (e == null ? void 0 : e.then) == "function", Ae = (e, t) => !!e && "v" in e && "v" in t && Object.is(e.v, t.v), zt = (e, t) => !!e && "e" in e && "e" in t && Object.is(e.e, t.e), ye = (e) => !!e && "v" in e && e.v instanceof Promise, Dr = (e, t) => "v" in e && "v" in t && e.v.orig && e.v.orig === t.v.orig, _e = (e) => {
  if ("e" in e)
    throw e.e;
  return e.v;
}, Rn = () => {
  const e = /* @__PURE__ */ new WeakMap(), t = /* @__PURE__ */ new WeakMap(), n = /* @__PURE__ */ new Map();
  let r, o;
  (z ? "production" : void 0) !== "production" && (r = /* @__PURE__ */ new Set(), o = /* @__PURE__ */ new Set());
  const l = (m) => e.get(m), i = (m, S) => {
    (z ? "production" : void 0) !== "production" && Object.freeze(S);
    const v = e.get(m);
    if (e.set(m, S), n.has(m) || n.set(m, v), ye(v)) {
      const y = "v" in S ? S.v instanceof Promise ? S.v : Promise.resolve(S.v) : Promise.reject(S.e);
      v.v !== y && Kt(v.v, y);
    }
  }, c = (m, S, v) => {
    const y = /* @__PURE__ */ new Map();
    let E = !1;
    v.forEach((I, O) => {
      !I && O === m && (I = S), I ? (y.set(O, I), S.d.get(O) !== I && (E = !0)) : (z ? "production" : void 0) !== "production" && console.warn("[Bug] atom state not found");
    }), (E || S.d.size !== y.size) && (S.d = y);
  }, u = (m, S, v) => {
    const y = l(m), E = {
      d: (y == null ? void 0 : y.d) || /* @__PURE__ */ new Map(),
      v: S
    };
    if (v && c(m, E, v), Ae(y, E) && y.d === E.d)
      return y;
    if (ye(y) && ye(E) && Dr(y, E)) {
      if (y.d === E.d)
        return y;
      E.v = y.v;
    }
    return i(m, E), E;
  }, s = (m, S, v, y) => {
    if (Or(S)) {
      let E;
      const I = () => {
        const N = l(m);
        if (!ye(N) || N.v !== O)
          return;
        const F = u(
          m,
          O,
          v
        );
        t.has(m) && N.d !== F.d && A(m, F, N.d);
      }, O = new Promise((N, F) => {
        let T = !1;
        S.then(
          (M) => {
            T || (T = !0, Zt(O, M), N(M), I());
          },
          (M) => {
            T || (T = !0, qt(O, M), F(M), I());
          }
        ), E = (M) => {
          T || (T = !0, M.then(
            (K) => Zt(O, K),
            (K) => qt(O, K)
          ), N(M));
        };
      });
      return O.orig = S, O.status = "pending", Ar(O, (N) => {
        N && E(N), y == null || y();
      }), u(m, O, v);
    }
    return u(m, S, v);
  }, f = (m, S, v) => {
    const y = l(m), E = {
      d: (y == null ? void 0 : y.d) || /* @__PURE__ */ new Map(),
      e: S
    };
    return v && c(m, E, v), zt(y, E) && y.d === E.d ? y : (i(m, E), E);
  }, d = (m, S) => {
    const v = l(m);
    if (!S && v && (t.has(m) || Array.from(v.d).every(([T, M]) => {
      if (T === m)
        return !0;
      const K = d(T);
      return K === M || Ae(K, M);
    })))
      return v;
    const y = /* @__PURE__ */ new Map();
    let E = !0;
    const I = (T) => {
      if (T === m) {
        const K = l(T);
        if (K)
          return y.set(T, K), _e(K);
        if (at(T))
          return y.set(T, void 0), T.init;
        throw new Error("no atom init");
      }
      const M = d(T);
      return y.set(T, M), _e(M);
    };
    let O, N;
    const F = {
      get signal() {
        return O || (O = new AbortController()), O.signal;
      },
      get setSelf() {
        return (z ? "production" : void 0) !== "production" && !ut(m) && console.warn("setSelf function cannot be used with read-only atom"), !N && ut(m) && (N = (...T) => {
          if ((z ? "production" : void 0) !== "production" && E && console.warn("setSelf function cannot be called in sync"), !E)
            return D(m, ...T);
        }), N;
      }
    };
    try {
      const T = m.read(I, F);
      return s(
        m,
        T,
        y,
        () => O == null ? void 0 : O.abort()
      );
    } catch (T) {
      return f(m, T, y);
    } finally {
      E = !1;
    }
  }, g = (m) => _e(d(m)), p = (m) => {
    let S = t.get(m);
    return S || (S = V(m)), S;
  }, C = (m, S) => !S.l.size && (!S.t.size || S.t.size === 1 && S.t.has(m)), R = (m) => {
    const S = t.get(m);
    S && C(m, S) && j(m);
  }, w = (m) => {
    const S = /* @__PURE__ */ new Map(), v = /* @__PURE__ */ new WeakMap(), y = (O) => {
      var N;
      const F = new Set((N = t.get(O)) == null ? void 0 : N.t);
      return n.forEach((T, M) => {
        var K;
        (K = l(M)) != null && K.d.has(O) && F.add(M);
      }), F;
    }, E = (O) => {
      y(O).forEach((N) => {
        N !== O && (S.set(
          N,
          (S.get(N) || /* @__PURE__ */ new Set()).add(O)
        ), v.set(N, (v.get(N) || 0) + 1), E(N));
      });
    };
    E(m);
    const I = (O) => {
      y(O).forEach((N) => {
        var F;
        if (N !== O) {
          let T = v.get(N);
          if (T && v.set(N, --T), !T) {
            let M = !!((F = S.get(N)) != null && F.size);
            if (M) {
              const K = l(N), je = d(N, !0);
              M = !Ae(K, je);
            }
            M || S.forEach((K) => K.delete(N));
          }
          I(N);
        }
      });
    };
    I(m);
  }, b = (m, ...S) => {
    let v = !0;
    const y = (O) => _e(d(O)), E = (O, ...N) => {
      let F;
      if (O === m) {
        if (!at(O))
          throw new Error("atom not writable");
        const T = l(O), M = s(O, N[0]);
        Ae(T, M) || w(O);
      } else
        F = b(O, ...N);
      if (!v) {
        const T = _();
        (z ? "production" : void 0) !== "production" && r.forEach(
          (M) => M({ type: "async-write", flushed: T })
        );
      }
      return F;
    }, I = m.write(y, E, ...S);
    return v = !1, I;
  }, D = (m, ...S) => {
    const v = b(m, ...S), y = _();
    return (z ? "production" : void 0) !== "production" && r.forEach(
      (E) => E({ type: "write", flushed: y })
    ), v;
  }, V = (m, S, v) => {
    var y;
    const E = v || [];
    (y = l(m)) == null || y.d.forEach((O, N) => {
      const F = t.get(N);
      F ? F.t.add(m) : N !== m && V(N, m, E);
    }), d(m);
    const I = {
      t: new Set(S && [S]),
      l: /* @__PURE__ */ new Set()
    };
    if (t.set(m, I), (z ? "production" : void 0) !== "production" && o.add(m), ut(m) && m.onMount) {
      const { onMount: O } = m;
      E.push(() => {
        const N = O((...F) => D(m, ...F));
        N && (I.u = N);
      });
    }
    return v || E.forEach((O) => O()), I;
  }, j = (m) => {
    var S;
    const v = (S = t.get(m)) == null ? void 0 : S.u;
    v && v(), t.delete(m), (z ? "production" : void 0) !== "production" && o.delete(m);
    const y = l(m);
    y ? (ye(y) && Kt(y.v), y.d.forEach((E, I) => {
      if (I !== m) {
        const O = t.get(I);
        O && (O.t.delete(m), C(I, O) && j(I));
      }
    })) : (z ? "production" : void 0) !== "production" && console.warn("[Bug] could not find atom state to unmount", m);
  }, A = (m, S, v) => {
    const y = new Set(S.d.keys());
    v == null || v.forEach((E, I) => {
      if (y.has(I)) {
        y.delete(I);
        return;
      }
      const O = t.get(I);
      O && (O.t.delete(m), C(I, O) && j(I));
    }), y.forEach((E) => {
      const I = t.get(E);
      I ? I.t.add(m) : t.has(m) && V(E, m);
    });
  }, _ = () => {
    let m;
    for ((z ? "production" : void 0) !== "production" && (m = /* @__PURE__ */ new Set()); n.size; ) {
      const S = Array.from(n);
      n.clear(), S.forEach(([v, y]) => {
        const E = l(v);
        if (E) {
          const I = t.get(v);
          I && E.d !== (y == null ? void 0 : y.d) && A(v, E, y == null ? void 0 : y.d), I && !// TODO This seems pretty hacky. Hope to fix it.
          // Maybe we could `mountDependencies` in `setAtomState`?
          (!ye(y) && (Ae(y, E) || zt(y, E))) && (I.l.forEach((O) => O()), (z ? "production" : void 0) !== "production" && m.add(v));
        } else
          (z ? "production" : void 0) !== "production" && console.warn("[Bug] no atom state to flush");
      });
    }
    if ((z ? "production" : void 0) !== "production")
      return m;
  }, L = (m, S) => {
    const v = p(m), y = _(), E = v.l;
    return E.add(S), (z ? "production" : void 0) !== "production" && r.forEach(
      (I) => I({ type: "sub", flushed: y })
    ), () => {
      E.delete(S), R(m), (z ? "production" : void 0) !== "production" && r.forEach((I) => I({ type: "unsub" }));
    };
  };
  return (z ? "production" : void 0) !== "production" ? {
    get: g,
    set: D,
    sub: L,
    // store dev methods (these are tentative and subject to change without notice)
    dev_subscribe_store: (m, S) => {
      if (S !== 2)
        throw new Error("The current StoreListener revision is 2.");
      return r.add(m), () => {
        r.delete(m);
      };
    },
    dev_get_mounted_atoms: () => o.values(),
    dev_get_atom_state: (m) => e.get(m),
    dev_get_mounted: (m) => t.get(m),
    dev_restore_atoms: (m) => {
      for (const [v, y] of m)
        at(v) && (s(v, y), w(v));
      const S = _();
      r.forEach(
        (v) => v({ type: "restore", flushed: S })
      );
    }
  } : {
    get: g,
    set: D,
    sub: L
  };
};
let dt;
(z ? "production" : void 0) !== "production" && (typeof globalThis.__NUMBER_OF_JOTAI_INSTANCES__ == "number" ? ++globalThis.__NUMBER_OF_JOTAI_INSTANCES__ : globalThis.__NUMBER_OF_JOTAI_INSTANCES__ = 1);
const Mr = () => (dt || ((z ? "production" : void 0) !== "production" && globalThis.__NUMBER_OF_JOTAI_INSTANCES__ !== 1 && console.warn(
  "Detected multiple Jotai instances. It may cause unexpected behavior with the default store. https://github.com/pmndrs/jotai/discussions/2044"
), dt = Rn()), dt);
var Tr = { BASE_URL: "/", MODE: "production", DEV: !1, PROD: !0, SSR: !1 };
const En = br(void 0), At = (e) => {
  const t = xr(En);
  return (e == null ? void 0 : e.store) || t || Mr();
}, Lr = ({
  children: e,
  store: t
}) => {
  const n = ae();
  return !t && !n.current && (n.current = Rn()), yr(
    En.Provider,
    {
      value: t || n.current
    },
    e
  );
}, Ir = (e) => typeof (e == null ? void 0 : e.then) == "function", Pr = Je.use || ((e) => {
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
function Fr(e, t) {
  const n = At(t), [[r, o, l], i] = Cr(
    (s) => {
      const f = n.get(e);
      return Object.is(s[0], f) && s[1] === n && s[2] === e ? s : [f, n, e];
    },
    void 0,
    () => [n.get(e), n, e]
  );
  let c = r;
  (o !== n || l !== e) && (i(), c = n.get(e));
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
  }, [n, e, u]), Rr(c), Ir(c) ? Pr(c) : c;
}
function Ot(e, t) {
  const n = At(t);
  return Y(
    (...o) => {
      if ((Tr ? "production" : void 0) !== "production" && !("write" in e))
        throw new Error("not writable atom");
      return n.set(e, ...o);
    },
    [n, e]
  );
}
function k(e, t) {
  return [
    Fr(e, t),
    // We do wrong type assertion here, which results in throwing an error.
    Ot(e, t)
  ];
}
const Yt = /* @__PURE__ */ new WeakMap();
function Vr(e, t) {
  const n = At(t), r = jr(n);
  for (const [o, l] of e)
    (!r.has(o) || t != null && t.dangerouslyForceHydrate) && (r.add(o), n.set(o, l));
}
const jr = (e) => {
  let t = Yt.get(e);
  return t || (t = /* @__PURE__ */ new WeakSet(), Yt.set(e, t)), t;
};
let _r = (e) => crypto.getRandomValues(new Uint8Array(e)), $r = (e, t, n) => {
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
}, Sn = (e, t = 21) => $r(e, t, _r), Qe = (e = 21) => crypto.getRandomValues(new Uint8Array(e)).reduce((t, n) => (n &= 63, n < 36 ? t += n.toString(36) : n < 62 ? t += (n - 26).toString(36).toUpperCase() : n > 62 ? t += "-" : t += "_", t), "");
Sn(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  8
);
const Br = Sn(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  4
);
function vt() {
  return Br();
}
function ge(e) {
  return Le(e) || e === "";
}
function Le(e) {
  return e === null || e === void 0;
}
function U(...e) {
  return e.filter(Boolean).join(" ");
}
function wt() {
  return `hsl(${Math.floor(Math.random() * 360)}, 100%, 92%)`;
}
function Hr(e, t, n) {
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
function Wr(e, t) {
  if (t.length === 0)
    return !0;
  for (const n of t) {
    let r = e[n.columnId];
    switch (Le(r) && (r = ""), typeof r == "number" && (r = r.toString()), r = r.toLowerCase(), n.type) {
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
const Nn = "update_column", Ur = "delete_column", Kr = "add_row", Zr = "delete_rows", qr = "update_row", kn = "update_rows", zr = "add_column", Dt = (e, t) => e + t, An = (e, t) => {
  if (e === void 0)
    return t;
  for (const n of Object.keys(t))
    t[n] instanceof Object && Object.assign(t[n], An(e[n], t[n]));
  return Object.assign(e || {}, t), e;
}, bt = {
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
}, et = P(bt), ne = P((e) => e(et)), Yr = P(null, (e, t, n) => {
  bt.rowSelectionButtons = [], t(et, An(bt, n));
}), On = P(""), Xr = P((e) => e(On)), Gr = P(null, (e, t, n) => {
  t(On, n);
}), Dn = P(""), oe = P({ onChange: () => null }), Jr = P(
  null,
  (e, t, n) => t(oe, n)
);
P(null, (e, t, n) => {
  t(oe, { onChange: n });
});
const H = P({}), Qr = (e) => P((t) => new Set(Object.entries(t(H)).map(([n, r]) => r[e])).size), Mn = (e) => P(
  (t) => t(H)[e],
  (t, n, r) => {
    typeof r == "function" && (r = r(t(Mn(e)))), n(H, (o) => ({ ...o, [e]: { ...o[e], ...r } })), t(oe).onChange({ type: qr, rowId: e, update: r });
  }
), he = (e) => P(
  (t) => t(G)[e],
  (t, n, r) => {
    typeof r == "function" && (r = r(t(G)[e])), n(G, (o) => ({
      ...o,
      [e]: { ...o[e], ...r }
    })), t(oe).onChange({
      type: Nn,
      colId: e,
      update: r
    });
  }
), eo = P(null, (e, t, n) => {
  const r = Object.entries(e(H)).filter(([, o]) => o.isSelected === !0).map(([o, l]) => o);
  t(
    H,
    Object.fromEntries(
      Object.entries(e(H)).filter(([, o]) => o.isSelected !== !0)
    )
  ), t(de, !1), e(oe).onChange({
    type: Zr,
    rows: [r]
  });
}), to = P(
  null,
  (e, t, n = { handler: () => null }) => {
    t(
      H,
      Object.fromEntries(
        n.handler(Object.entries(e(H)).map(([r, o]) => o)).map((r) => [r.id, r])
      )
    ), e(oe).onChange({
      type: kn,
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
), no = P(null, (e, t, n) => {
  t(H, Object.fromEntries(n.map((r) => [r.id, r])));
}), Tn = P(null, (e, t, n) => {
  t(H, (r) => ({
    ...r,
    [n.id]: n
  })), t(nt(n.id, e(se)[0]), "editing"), e(oe).onChange({ type: Kr, rowId: n.id, update: n });
}), ro = P((e) => Object.keys(e(H)).length), oo = P(
  (e) => e(de) ? Object.keys(e(H)).length : Object.entries(e(H)).map(([, t]) => t.isSelected === !0).reduce(Dt, 0)
), Mt = P({}), De = P((e) => Object.entries(e(H)).filter(([, t]) => Wr(t, e(It))).sort(
  ([, t], [, n]) => Hr(t, n, [...e(Te), ...e(Tt)])
).map(([t, n]) => ({
  id: t,
  groupVal: e(Te).length === 0 ? "" : n[e(Te)[0].columnId]
})).map((t, n, r) => ({
  id: t.id,
  first: n === 0 || t.groupVal !== r[n - 1].groupVal,
  last: n === r.length - 1 || t.groupVal !== r[n + 1].groupVal,
  groupVal: t.groupVal
}))), Xt = P({}), tt = (e) => P(
  (t) => t(Xt)[e],
  (t, n, r) => n(Xt, (o) => ({ ...o, [e]: r }))
), G = P({}), se = P(
  (e) => Object.entries(e(G)).filter(([t, n]) => n.isVisible === !0).map(([t]) => t)
), Ln = P(
  (e) => Object.entries(e(G)).map(([t, n]) => n)
), io = P(
  (e) => Object.entries(e(G)).map(([t, n]) => n).filter((t) => t.type !== "custom")
), lo = P((e) => Object.keys(e(G))), so = P(
  (e) => Object.entries(e(G)).map(([, t]) => t.isVisible).reduce((t, n) => t + (n === !1), 0)
), co = {
  isVisible: !0,
  width: 192,
  type: "text",
  options: [],
  showOptionSearch: !0,
  isEditable: !0,
  isViewOnly: !1
}, ao = P(null, (e, t, n) => {
  t(
    G,
    Object.fromEntries(
      n.map((r) => ({ ...co, ...r })).map((r) => [r.id, r])
    )
  );
}), uo = P(null, (e, t, n) => {
  t(G, (r) => ({ ...r, [n.id]: n })), t(tt(n.id), !0), e(oe).onChange({
    type: zr,
    colId: n.id,
    update: n
  });
}), fo = P(null, (e, t, n) => {
  t(
    G,
    (r) => Object.fromEntries(Object.entries(r).filter(([o]) => o !== n.id))
  ), e(oe).onChange({ type: Ur, colId: n.id });
}), mo = P((e) => Object.entries(e(G)).filter(([t, n]) => n.isVisible === !0).map(([t, n]) => n.width).reduce(Dt, e(et).selectRow.enabled ? 64 : 0)), Te = P([]), Se = P((e) => e(Te)), ho = P(null, (e, t, n) => {
  t(Te, n.grouping), t(Mt, {});
}), In = P(!1), Pn = P(!1), Tt = P([]), Lt = P((e) => e(Tt)), Fn = P(null, (e, t, n) => {
  t(Tt, n.sorting);
}), It = P([]), Vn = P((e) => e(It)), jn = P(null, (e, t, n) => {
  t(It, n.filtering);
}), _n = P(32), Pt = P((e) => e(_n)), po = P(null, (e, t, n) => {
  t(_n, n.rowHeight);
}), de = P(!1), go = P((e) => e(de)), vo = P(null, (e, t, n) => {
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
}), wo = P(null, (e, t, n) => {
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
const $n = P(!1);
P((e) => e($n));
P(null, (e, t, n) => {
  t($n, n.dragging);
});
const Gt = P({}), nt = (e, t) => P(
  (n) => {
    var r;
    return ((r = n(Gt)[e]) == null ? void 0 : r[t]) || "none";
  },
  (n, r, o) => {
    r(Gt, { [e]: { [t]: o } });
  }
), rt = P(null, (e, t, n) => {
  t(nt(n.rowId, n.colId), n.value);
}), bo = P(null, (e, t, n) => {
  const { colId: r, type: o } = n;
  let { options: l, configuration: i } = e(G)[r];
  const c = e(et);
  let u = (s) => s;
  switch (o) {
    case "select": {
      l = [
        ...new Set(Object.entries(e(H)).map(([f, d]) => d[r]))
      ].filter((f) => !Le(f) && f !== "").map((f) => ({
        value: f,
        name: f,
        color: wt()
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
      ].filter((f) => !Le(f) && f !== "").map((f) => ({
        value: f,
        name: f,
        color: wt()
      }));
      break;
    }
    case "number": {
      u = (s) => s;
      break;
    }
    case "date": {
      u = (s) => c.parseDate !== void 0 ? s : Number.isNaN(Date.parse(s)) ? "" : new Date(Date.parse(s)).toISOString();
      break;
    }
    case "checkbox":
      u = (s) => {
        var f, d, g;
        return ((g = (d = (f = s == null ? void 0 : s.toLowerCase) == null ? void 0 : f.call(s)) == null ? void 0 : d.trim) == null ? void 0 : g.call(d)) === "true";
      };
  }
  t(he(r), (s) => ({ ...s[r], type: o, options: l })), t(
    H,
    Object.fromEntries(
      Object.entries(e(H)).map(([s, f]) => [
        s,
        { ...f, [r]: u(f[r]) }
      ])
    )
  ), e(oe).onChange({
    type: Nn,
    colId: r,
    update: { type: o, options: l }
  }), e(oe).onChange({
    type: kn,
    rows: Object.entries(e(H)).map(([s, f]) => ({
      rowId: s,
      update: { [r]: u(f[r]) }
    }))
  });
}), yo = (e, t) => P(null, (n, r, o) => {
  const l = n(se).findIndex((s) => s === t), i = n(De).findIndex(
    (s) => s.id === e
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
      c = n(De).map((s) => s.id)[Math.max(0, i - 1)];
      break;
    }
    case "down": {
      c = n(De).map((s) => s.id)[Math.min(
        n(De).flatMap((s) => s.rowIds).length - 1,
        i + 1
      )];
      break;
    }
  }
  t === u && e === c || r(nt(c, u), "focused");
}), Jt = (e, t) => P(
  (n) => Object.entries(n(H)).map(([r, o]) => o[e]).map(t).reduce(Dt, 0)
), gc = "100000000000000000000001";
function xo({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ h.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ h.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ h.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
  }));
}
const Co = h.forwardRef(xo), Ro = Co;
function Eo({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ h.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ h.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ h.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
  }));
}
const So = h.forwardRef(Eo), No = So;
function ko({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ h.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ h.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ h.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "m19.5 8.25-7.5 7.5-7.5-7.5"
  }));
}
const Ao = h.forwardRef(ko), Oo = Ao;
function Do({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ h.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ h.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ h.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
  }));
}
const Mo = h.forwardRef(Do), Qt = Mo;
function To({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ h.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ h.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ h.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5"
  }));
}
const Lo = h.forwardRef(To), Io = Lo;
function Po({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ h.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ h.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ h.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
  }));
}
const Fo = h.forwardRef(Po), Vo = Fo;
function jo({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ h.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ h.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ h.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
  }));
}
const _o = h.forwardRef(jo), $o = _o;
function Bo({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ h.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ h.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ h.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M12 4.5v15m7.5-7.5h-15"
  }));
}
const Ho = h.forwardRef(Bo), Bn = Ho;
function Wo({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ h.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ h.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ h.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M16.5 8.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v8.25A2.25 2.25 0 0 0 6 16.5h2.25m8.25-8.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-7.5A2.25 2.25 0 0 1 8.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 0 0-2.25 2.25v6"
  }));
}
const Uo = h.forwardRef(Wo), Ko = Uo;
function Zo({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ h.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ h.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ h.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
  }));
}
const qo = h.forwardRef(Zo), zo = qo;
function Me(e) {
  const t = e.getUTCMonth() + 1, n = e.getUTCDate(), r = e.getUTCFullYear();
  return `${t.toString().padStart(2, "0")}/${n.toString().padStart(2, "0")}/${r.toString().padStart(4, "0")}`;
}
function $e(e) {
  const t = e.getUTCMonth() + 1, n = e.getUTCDate(), r = e.getUTCFullYear();
  return `${t.toString().padStart(2, "0")}/${n.toString().padStart(2, "0")}/${r.toString().padStart(4, "0")}`;
}
function Yo({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ h.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ h.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ h.createElement("path", {
    fillRule: "evenodd",
    d: "M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z",
    clipRule: "evenodd"
  }));
}
const Xo = h.forwardRef(Yo), Ft = Xo;
function Go({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ h.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ h.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ h.createElement("path", {
    fillRule: "evenodd",
    d: "M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z",
    clipRule: "evenodd"
  }));
}
const Jo = h.forwardRef(Go), Hn = Jo;
function Qo({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ h.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ h.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ h.createElement("path", {
    fillRule: "evenodd",
    d: "M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z",
    clipRule: "evenodd"
  }));
}
const ei = h.forwardRef(Qo), ti = ei;
function ni({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ h.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ h.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ h.createElement("path", {
    fillRule: "evenodd",
    d: "M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z",
    clipRule: "evenodd"
  }));
}
const ri = h.forwardRef(ni), oi = ri;
function ii({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ h.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ h.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ h.createElement("path", {
    fillRule: "evenodd",
    d: "M10.53 3.47a.75.75 0 0 0-1.06 0L6.22 6.72a.75.75 0 0 0 1.06 1.06L10 5.06l2.72 2.72a.75.75 0 1 0 1.06-1.06l-3.25-3.25Zm-4.31 9.81 3.25 3.25a.75.75 0 0 0 1.06 0l3.25-3.25a.75.75 0 1 0-1.06-1.06L10 14.94l-2.72-2.72a.75.75 0 0 0-1.06 1.06Z",
    clipRule: "evenodd"
  }));
}
const li = h.forwardRef(ii), si = li;
function ci({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ h.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ h.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ h.createElement("path", {
    d: "M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"
  }));
}
const ai = h.forwardRef(ci), ui = ai;
function ce({ name: e, color: t, onCancel: n }) {
  return /* @__PURE__ */ x(
    "div",
    {
      className: "rounded px-1.5 p-[1px] truncate whitespace-nowrap text-dark items-center flex cursor-default",
      style: { backgroundColor: t },
      children: [
        e,
        n && /* @__PURE__ */ a(ui, { className: "w-4 h-4", onClick: n })
      ]
    }
  );
}
function Wn(e, t) {
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
function $({ children: e, background: t }) {
  return /* @__PURE__ */ a("div", { className: "shadow-md border rounded rounded-2 text-sm bg-header", children: e });
}
function Vt({ children: e }) {
  return /* @__PURE__ */ a("div", { className: "border-b last:border-none", children: /* @__PURE__ */ a("div", { className: "py-3", children: e }) });
}
$.Section = Vt;
function di({ children: e, ...t }) {
  return /* @__PURE__ */ a("div", { className: "px-3 py-1 flex items-center cursor-default", ...t, children: e });
}
function fi({ children: e, disabled: t, ...n }) {
  return /* @__PURE__ */ a(
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
Vt.Item = di;
Vt.Button = fi;
const mi = (e, t) => new Date(e, t + 1, 0).getDate(), hi = [
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
], pi = [
  "first:col-start-1",
  "first:col-start-2",
  "first:col-start-3",
  "first:col-start-4",
  "first:col-start-5",
  "first:col-start-6",
  "first:col-start-7"
];
function Un({
  value: e,
  onSelect: t
}) {
  const [n, r] = B(e || null), o = /* @__PURE__ */ new Date(), [l, i] = B(
    n ? n.getUTCMonth() : o.getUTCMonth()
  ), [c, u] = B(
    n ? n.getUTCFullYear() : o.getUTCFullYear()
  );
  Z(() => {
    if (!e) {
      r(null);
      return;
    }
    r(e), i(e.getUTCMonth()), u(e.getUTCFullYear());
  }, [e]);
  const s = [...Array(mi(c, l)).keys()], f = new Date(c, l, 1).getDay(), d = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  function g() {
    l === 0 ? (u((w) => w - 1), i(11)) : i((w) => w - 1);
  }
  function p() {
    l === 11 ? (u((w) => w + 1), i(0)) : i((w) => w + 1);
  }
  function C(w, b) {
    w.preventDefault();
    const D = /* @__PURE__ */ new Date();
    D.setUTCFullYear(c, l, b), r(D), t == null || t(D);
  }
  function R(w) {
    return n && n.getDate() === w && n.getMonth() === l && n.getFullYear() === c;
  }
  return /* @__PURE__ */ a("div", { className: "w-56", children: /* @__PURE__ */ x($, { children: [
    /* @__PURE__ */ a($.Section, { children: /* @__PURE__ */ x("div", { className: "flex px-2 items-center", children: [
      /* @__PURE__ */ x("div", { className: "grow text-left px-1", children: [
        hi[l],
        " ",
        c
      ] }),
      /* @__PURE__ */ a(
        "div",
        {
          className: "rs-btn hover:bg-hover-light rounded p-1",
          onClick: g,
          "aria-label": "move-calendar-left",
          children: /* @__PURE__ */ a(ti, { className: "w-4 h-4" })
        }
      ),
      /* @__PURE__ */ a(
        "div",
        {
          className: "rs-btn hover:bg-hover-light rounded p-1",
          onClick: p,
          "aria-label": "move-calendar-right",
          children: /* @__PURE__ */ a(oi, { className: "w-4 h-4" })
        }
      )
    ] }) }),
    /* @__PURE__ */ x($.Section, { children: [
      /* @__PURE__ */ a("div", { className: "grid grid-cols-7 text-sm px-2 gap-px mb-2", children: d.map((w) => /* @__PURE__ */ a("div", { className: "text-secondary font-medium flex items-center justify-center", children: w }, `wday-${w}`)) }),
      /* @__PURE__ */ a("div", { className: "grid grid-cols-7 text-sm px-2 gap-px", children: s.map((w) => /* @__PURE__ */ a(
        "div",
        {
          className: U(
            "rs-btn p-0.5 rounded flex items-center justify-center col-span-1",
            pi[f],
            !R(w + 1) && "hover:bg-hover-light",
            R(w + 1) && "bg-blue-500 text-inverted hover:bg-blue-500"
          ),
          onClick: (b) => {
            C(b, w + 1);
          },
          children: w + 1
        },
        `day-${w}`
      )) })
    ] })
  ] }) });
}
function fe(e) {
  return Kn(e) ? (e.nodeName || "").toLowerCase() : "#document";
}
function J(e) {
  var t;
  return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function ie(e) {
  var t;
  return (t = (Kn(e) ? e.ownerDocument : e.document) || window.document) == null ? void 0 : t.documentElement;
}
function Kn(e) {
  return e instanceof Node || e instanceof J(e).Node;
}
function q(e) {
  return e instanceof Element || e instanceof J(e).Element;
}
function Q(e) {
  return e instanceof HTMLElement || e instanceof J(e).HTMLElement;
}
function yt(e) {
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
function gi(e) {
  return ["table", "td", "th"].includes(fe(e));
}
function jt(e) {
  const t = _t(), n = ee(e);
  return n.transform !== "none" || n.perspective !== "none" || (n.containerType ? n.containerType !== "normal" : !1) || !t && (n.backdropFilter ? n.backdropFilter !== "none" : !1) || !t && (n.filter ? n.filter !== "none" : !1) || ["transform", "perspective", "filter"].some((r) => (n.willChange || "").includes(r)) || ["paint", "layout", "strict", "content"].some((r) => (n.contain || "").includes(r));
}
function vi(e) {
  let t = ve(e);
  for (; Q(t) && !Re(t); ) {
    if (jt(t))
      return t;
    t = ve(t);
  }
  return null;
}
function _t() {
  return typeof CSS > "u" || !CSS.supports ? !1 : CSS.supports("-webkit-backdrop-filter", "none");
}
function Re(e) {
  return ["html", "body", "#document"].includes(fe(e));
}
function ee(e) {
  return J(e).getComputedStyle(e);
}
function ot(e) {
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
    yt(e) && e.host || // Fallback.
    ie(e)
  );
  return yt(t) ? t.host : t;
}
function Zn(e) {
  const t = ve(e);
  return Re(t) ? e.ownerDocument ? e.ownerDocument.body : e.body : Q(t) && Fe(t) ? t : Zn(t);
}
function ue(e, t, n) {
  var r;
  t === void 0 && (t = []), n === void 0 && (n = !0);
  const o = Zn(e), l = o === ((r = e.ownerDocument) == null ? void 0 : r.body), i = J(o);
  return l ? t.concat(i, i.visualViewport || [], Fe(o) ? o : [], i.frameElement && n ? ue(i.frameElement) : []) : t.concat(o, ue(o, [], n));
}
function wi(e) {
  let t = e.activeElement;
  for (; ((n = t) == null || (n = n.shadowRoot) == null ? void 0 : n.activeElement) != null; ) {
    var n;
    t = t.shadowRoot.activeElement;
  }
  return t;
}
function xt(e, t) {
  if (!e || !t)
    return !1;
  const n = t.getRootNode && t.getRootNode();
  if (e.contains(t))
    return !0;
  if (n && yt(n)) {
    let r = t;
    for (; r; ) {
      if (e === r)
        return !0;
      r = r.parentNode || r.host;
    }
  }
  return !1;
}
function bi() {
  return /apple/i.test(navigator.vendor);
}
function en(e, t) {
  const n = ["mouse", "pen"];
  return t || n.push("", void 0), n.includes(e);
}
function yi(e) {
  return "nativeEvent" in e;
}
function xi(e) {
  return e.matches("html,body");
}
function Ct(e) {
  return (e == null ? void 0 : e.ownerDocument) || document;
}
function ft(e, t) {
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
const Ci = "input:not([type='hidden']):not([disabled]),[contenteditable]:not([contenteditable='false']),textarea:not([disabled])";
function Ri(e) {
  return Q(e) && e.matches(Ci);
}
const Ue = Math.min, pe = Math.max, Ke = Math.round, Be = Math.floor, me = (e) => ({
  x: e,
  y: e
}), Ei = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom"
}, Si = {
  start: "end",
  end: "start"
};
function tn(e, t, n) {
  return pe(e, Ue(t, n));
}
function it(e, t) {
  return typeof e == "function" ? e(t) : e;
}
function we(e) {
  return e.split("-")[0];
}
function lt(e) {
  return e.split("-")[1];
}
function qn(e) {
  return e === "x" ? "y" : "x";
}
function zn(e) {
  return e === "y" ? "height" : "width";
}
function st(e) {
  return ["top", "bottom"].includes(we(e)) ? "y" : "x";
}
function Yn(e) {
  return qn(st(e));
}
function Ni(e, t, n) {
  n === void 0 && (n = !1);
  const r = lt(e), o = Yn(e), l = zn(o);
  let i = o === "x" ? r === (n ? "end" : "start") ? "right" : "left" : r === "start" ? "bottom" : "top";
  return t.reference[l] > t.floating[l] && (i = Ze(i)), [i, Ze(i)];
}
function ki(e) {
  const t = Ze(e);
  return [Rt(e), t, Rt(t)];
}
function Rt(e) {
  return e.replace(/start|end/g, (t) => Si[t]);
}
function Ai(e, t, n) {
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
function Oi(e, t, n, r) {
  const o = lt(e);
  let l = Ai(we(e), n === "start", r);
  return o && (l = l.map((i) => i + "-" + o), t && (l = l.concat(l.map(Rt)))), l;
}
function Ze(e) {
  return e.replace(/left|right|bottom|top/g, (t) => Ei[t]);
}
function Di(e) {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...e
  };
}
function Mi(e) {
  return typeof e != "number" ? Di(e) : {
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
function nn(e, t, n) {
  let {
    reference: r,
    floating: o
  } = e;
  const l = st(t), i = Yn(t), c = zn(i), u = we(t), s = l === "y", f = r.x + r.width / 2 - o.width / 2, d = r.y + r.height / 2 - o.height / 2, g = r[c] / 2 - o[c] / 2;
  let p;
  switch (u) {
    case "top":
      p = {
        x: f,
        y: r.y - o.height
      };
      break;
    case "bottom":
      p = {
        x: f,
        y: r.y + r.height
      };
      break;
    case "right":
      p = {
        x: r.x + r.width,
        y: d
      };
      break;
    case "left":
      p = {
        x: r.x - o.width,
        y: d
      };
      break;
    default:
      p = {
        x: r.x,
        y: r.y
      };
  }
  switch (lt(t)) {
    case "start":
      p[i] -= g * (n && s ? -1 : 1);
      break;
    case "end":
      p[i] += g * (n && s ? -1 : 1);
      break;
  }
  return p;
}
const Ti = async (e, t, n) => {
  const {
    placement: r = "bottom",
    strategy: o = "absolute",
    middleware: l = [],
    platform: i
  } = n, c = l.filter(Boolean), u = await (i.isRTL == null ? void 0 : i.isRTL(t));
  let s = await i.getElementRects({
    reference: e,
    floating: t,
    strategy: o
  }), {
    x: f,
    y: d
  } = nn(s, r, u), g = r, p = {}, C = 0;
  for (let R = 0; R < c.length; R++) {
    const {
      name: w,
      fn: b
    } = c[R], {
      x: D,
      y: V,
      data: j,
      reset: A
    } = await b({
      x: f,
      y: d,
      initialPlacement: r,
      placement: g,
      strategy: o,
      middlewareData: p,
      rects: s,
      platform: i,
      elements: {
        reference: e,
        floating: t
      }
    });
    if (f = D ?? f, d = V ?? d, p = {
      ...p,
      [w]: {
        ...p[w],
        ...j
      }
    }, A && C <= 50) {
      C++, typeof A == "object" && (A.placement && (g = A.placement), A.rects && (s = A.rects === !0 ? await i.getElementRects({
        reference: e,
        floating: t,
        strategy: o
      }) : A.rects), {
        x: f,
        y: d
      } = nn(s, g, u)), R = -1;
      continue;
    }
  }
  return {
    x: f,
    y: d,
    placement: g,
    strategy: o,
    middlewareData: p
  };
};
async function Xn(e, t) {
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
    boundary: s = "clippingAncestors",
    rootBoundary: f = "viewport",
    elementContext: d = "floating",
    altBoundary: g = !1,
    padding: p = 0
  } = it(t, e), C = Mi(p), w = c[g ? d === "floating" ? "reference" : "floating" : d], b = qe(await l.getClippingRect({
    element: (n = await (l.isElement == null ? void 0 : l.isElement(w))) == null || n ? w : w.contextElement || await (l.getDocumentElement == null ? void 0 : l.getDocumentElement(c.floating)),
    boundary: s,
    rootBoundary: f,
    strategy: u
  })), D = d === "floating" ? {
    ...i.floating,
    x: r,
    y: o
  } : i.reference, V = await (l.getOffsetParent == null ? void 0 : l.getOffsetParent(c.floating)), j = await (l.isElement == null ? void 0 : l.isElement(V)) ? await (l.getScale == null ? void 0 : l.getScale(V)) || {
    x: 1,
    y: 1
  } : {
    x: 1,
    y: 1
  }, A = qe(l.convertOffsetParentRelativeRectToViewportRelativeRect ? await l.convertOffsetParentRelativeRectToViewportRelativeRect({
    rect: D,
    offsetParent: V,
    strategy: u
  }) : D);
  return {
    top: (b.top - A.top + C.top) / j.y,
    bottom: (A.bottom - b.bottom + C.bottom) / j.y,
    left: (b.left - A.left + C.left) / j.x,
    right: (A.right - b.right + C.right) / j.x
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
        elements: s
      } = t, {
        mainAxis: f = !0,
        crossAxis: d = !0,
        fallbackPlacements: g,
        fallbackStrategy: p = "bestFit",
        fallbackAxisSideDirection: C = "none",
        flipAlignment: R = !0,
        ...w
      } = it(e, t);
      if ((n = l.arrow) != null && n.alignmentOffset)
        return {};
      const b = we(o), D = we(c) === c, V = await (u.isRTL == null ? void 0 : u.isRTL(s.floating)), j = g || (D || !R ? [Ze(c)] : ki(c));
      !g && C !== "none" && j.push(...Oi(c, R, C, V));
      const A = [c, ...j], _ = await Xn(t, w), L = [];
      let m = ((r = l.flip) == null ? void 0 : r.overflows) || [];
      if (f && L.push(_[b]), d) {
        const E = Ni(o, i, V);
        L.push(_[E[0]], _[E[1]]);
      }
      if (m = [...m, {
        placement: o,
        overflows: L
      }], !L.every((E) => E <= 0)) {
        var S, v;
        const E = (((S = l.flip) == null ? void 0 : S.index) || 0) + 1, I = A[E];
        if (I)
          return {
            data: {
              index: E,
              overflows: m
            },
            reset: {
              placement: I
            }
          };
        let O = (v = m.filter((N) => N.overflows[0] <= 0).sort((N, F) => N.overflows[1] - F.overflows[1])[0]) == null ? void 0 : v.placement;
        if (!O)
          switch (p) {
            case "bestFit": {
              var y;
              const N = (y = m.map((F) => [F.placement, F.overflows.filter((T) => T > 0).reduce((T, M) => T + M, 0)]).sort((F, T) => F[1] - T[1])[0]) == null ? void 0 : y[0];
              N && (O = N);
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
async function Ii(e, t) {
  const {
    placement: n,
    platform: r,
    elements: o
  } = e, l = await (r.isRTL == null ? void 0 : r.isRTL(o.floating)), i = we(n), c = lt(n), u = st(n) === "y", s = ["left", "top"].includes(i) ? -1 : 1, f = l && u ? -1 : 1, d = it(t, e);
  let {
    mainAxis: g,
    crossAxis: p,
    alignmentAxis: C
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
  return c && typeof C == "number" && (p = c === "end" ? C * -1 : C), u ? {
    x: p * f,
    y: g * s
  } : {
    x: g * s,
    y: p * f
  };
}
const Pi = function(e) {
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
      } = t, u = await Ii(t, e);
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
}, Fi = function(e) {
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
              y: D
            } = w;
            return {
              x: b,
              y: D
            };
          }
        },
        ...u
      } = it(e, t), s = {
        x: n,
        y: r
      }, f = await Xn(t, u), d = st(we(o)), g = qn(d);
      let p = s[g], C = s[d];
      if (l) {
        const w = g === "y" ? "top" : "left", b = g === "y" ? "bottom" : "right", D = p + f[w], V = p - f[b];
        p = tn(D, p, V);
      }
      if (i) {
        const w = d === "y" ? "top" : "left", b = d === "y" ? "bottom" : "right", D = C + f[w], V = C - f[b];
        C = tn(D, C, V);
      }
      const R = c.fn({
        ...t,
        [g]: p,
        [d]: C
      });
      return {
        ...R,
        data: {
          x: R.x - n,
          y: R.y - r
        }
      };
    }
  };
};
function Gn(e) {
  const t = ee(e);
  let n = parseFloat(t.width) || 0, r = parseFloat(t.height) || 0;
  const o = Q(e), l = o ? e.offsetWidth : n, i = o ? e.offsetHeight : r, c = Ke(n) !== l || Ke(r) !== i;
  return c && (n = l, r = i), {
    width: n,
    height: r,
    $: c
  };
}
function $t(e) {
  return q(e) ? e : e.contextElement;
}
function Ce(e) {
  const t = $t(e);
  if (!Q(t))
    return me(1);
  const n = t.getBoundingClientRect(), {
    width: r,
    height: o,
    $: l
  } = Gn(t);
  let i = (l ? Ke(n.width) : n.width) / r, c = (l ? Ke(n.height) : n.height) / o;
  return (!i || !Number.isFinite(i)) && (i = 1), (!c || !Number.isFinite(c)) && (c = 1), {
    x: i,
    y: c
  };
}
const Vi = /* @__PURE__ */ me(0);
function Jn(e) {
  const t = J(e);
  return !_t() || !t.visualViewport ? Vi : {
    x: t.visualViewport.offsetLeft,
    y: t.visualViewport.offsetTop
  };
}
function ji(e, t, n) {
  return t === void 0 && (t = !1), !n || t && n !== J(e) ? !1 : t;
}
function be(e, t, n, r) {
  t === void 0 && (t = !1), n === void 0 && (n = !1);
  const o = e.getBoundingClientRect(), l = $t(e);
  let i = me(1);
  t && (r ? q(r) && (i = Ce(r)) : i = Ce(e));
  const c = ji(l, n, r) ? Jn(l) : me(0);
  let u = (o.left + c.x) / i.x, s = (o.top + c.y) / i.y, f = o.width / i.x, d = o.height / i.y;
  if (l) {
    const g = J(l), p = r && q(r) ? J(r) : r;
    let C = g.frameElement;
    for (; C && r && p !== g; ) {
      const R = Ce(C), w = C.getBoundingClientRect(), b = ee(C), D = w.left + (C.clientLeft + parseFloat(b.paddingLeft)) * R.x, V = w.top + (C.clientTop + parseFloat(b.paddingTop)) * R.y;
      u *= R.x, s *= R.y, f *= R.x, d *= R.y, u += D, s += V, C = J(C).frameElement;
    }
  }
  return qe({
    width: f,
    height: d,
    x: u,
    y: s
  });
}
function _i(e) {
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
  if ((o || !o && r !== "fixed") && ((fe(n) !== "body" || Fe(l)) && (i = ot(n)), Q(n))) {
    const s = be(n);
    c = Ce(n), u.x = s.x + n.clientLeft, u.y = s.y + n.clientTop;
  }
  return {
    width: t.width * c.x,
    height: t.height * c.y,
    x: t.x * c.x - i.scrollLeft * c.x + u.x,
    y: t.y * c.y - i.scrollTop * c.y + u.y
  };
}
function $i(e) {
  return Array.from(e.getClientRects());
}
function Qn(e) {
  return be(ie(e)).left + ot(e).scrollLeft;
}
function Bi(e) {
  const t = ie(e), n = ot(e), r = e.ownerDocument.body, o = pe(t.scrollWidth, t.clientWidth, r.scrollWidth, r.clientWidth), l = pe(t.scrollHeight, t.clientHeight, r.scrollHeight, r.clientHeight);
  let i = -n.scrollLeft + Qn(e);
  const c = -n.scrollTop;
  return ee(r).direction === "rtl" && (i += pe(t.clientWidth, r.clientWidth) - o), {
    width: o,
    height: l,
    x: i,
    y: c
  };
}
function Hi(e, t) {
  const n = J(e), r = ie(e), o = n.visualViewport;
  let l = r.clientWidth, i = r.clientHeight, c = 0, u = 0;
  if (o) {
    l = o.width, i = o.height;
    const s = _t();
    (!s || s && t === "fixed") && (c = o.offsetLeft, u = o.offsetTop);
  }
  return {
    width: l,
    height: i,
    x: c,
    y: u
  };
}
function Wi(e, t) {
  const n = be(e, !0, t === "fixed"), r = n.top + e.clientTop, o = n.left + e.clientLeft, l = Q(e) ? Ce(e) : me(1), i = e.clientWidth * l.x, c = e.clientHeight * l.y, u = o * l.x, s = r * l.y;
  return {
    width: i,
    height: c,
    x: u,
    y: s
  };
}
function rn(e, t, n) {
  let r;
  if (t === "viewport")
    r = Hi(e, n);
  else if (t === "document")
    r = Bi(ie(e));
  else if (q(t))
    r = Wi(t, n);
  else {
    const o = Jn(e);
    r = {
      ...t,
      x: t.x - o.x,
      y: t.y - o.y
    };
  }
  return qe(r);
}
function er(e, t) {
  const n = ve(e);
  return n === t || !q(n) || Re(n) ? !1 : ee(n).position === "fixed" || er(n, t);
}
function Ui(e, t) {
  const n = t.get(e);
  if (n)
    return n;
  let r = ue(e, [], !1).filter((c) => q(c) && fe(c) !== "body"), o = null;
  const l = ee(e).position === "fixed";
  let i = l ? ve(e) : e;
  for (; q(i) && !Re(i); ) {
    const c = ee(i), u = jt(i);
    !u && c.position === "fixed" && (o = null), (l ? !u && !o : !u && c.position === "static" && !!o && ["absolute", "fixed"].includes(o.position) || Fe(i) && !u && er(e, i)) ? r = r.filter((f) => f !== i) : o = c, i = ve(i);
  }
  return t.set(e, r), r;
}
function Ki(e) {
  let {
    element: t,
    boundary: n,
    rootBoundary: r,
    strategy: o
  } = e;
  const i = [...n === "clippingAncestors" ? Ui(t, this._c) : [].concat(n), r], c = i[0], u = i.reduce((s, f) => {
    const d = rn(t, f, o);
    return s.top = pe(d.top, s.top), s.right = Ue(d.right, s.right), s.bottom = Ue(d.bottom, s.bottom), s.left = pe(d.left, s.left), s;
  }, rn(t, c, o));
  return {
    width: u.right - u.left,
    height: u.bottom - u.top,
    x: u.left,
    y: u.top
  };
}
function Zi(e) {
  return Gn(e);
}
function qi(e, t, n) {
  const r = Q(t), o = ie(t), l = n === "fixed", i = be(e, !0, l, t);
  let c = {
    scrollLeft: 0,
    scrollTop: 0
  };
  const u = me(0);
  if (r || !r && !l)
    if ((fe(t) !== "body" || Fe(o)) && (c = ot(t)), r) {
      const s = be(t, !0, l, t);
      u.x = s.x + t.clientLeft, u.y = s.y + t.clientTop;
    } else
      o && (u.x = Qn(o));
  return {
    x: i.left + c.scrollLeft - u.x,
    y: i.top + c.scrollTop - u.y,
    width: i.width,
    height: i.height
  };
}
function on(e, t) {
  return !Q(e) || ee(e).position === "fixed" ? null : t ? t(e) : e.offsetParent;
}
function tr(e, t) {
  const n = J(e);
  if (!Q(e))
    return n;
  let r = on(e, t);
  for (; r && gi(r) && ee(r).position === "static"; )
    r = on(r, t);
  return r && (fe(r) === "html" || fe(r) === "body" && ee(r).position === "static" && !jt(r)) ? n : r || vi(e) || n;
}
const zi = async function(e) {
  let {
    reference: t,
    floating: n,
    strategy: r
  } = e;
  const o = this.getOffsetParent || tr, l = this.getDimensions;
  return {
    reference: qi(t, await o(n), r),
    floating: {
      x: 0,
      y: 0,
      ...await l(n)
    }
  };
};
function Yi(e) {
  return ee(e).direction === "rtl";
}
const Xi = {
  convertOffsetParentRelativeRectToViewportRelativeRect: _i,
  getDocumentElement: ie,
  getClippingRect: Ki,
  getOffsetParent: tr,
  getElementRects: zi,
  getClientRects: $i,
  getDimensions: Zi,
  getScale: Ce,
  isElement: q,
  isRTL: Yi
};
function Gi(e, t) {
  let n = null, r;
  const o = ie(e);
  function l() {
    clearTimeout(r), n && n.disconnect(), n = null;
  }
  function i(c, u) {
    c === void 0 && (c = !1), u === void 0 && (u = 1), l();
    const {
      left: s,
      top: f,
      width: d,
      height: g
    } = e.getBoundingClientRect();
    if (c || t(), !d || !g)
      return;
    const p = Be(f), C = Be(o.clientWidth - (s + d)), R = Be(o.clientHeight - (f + g)), w = Be(s), D = {
      rootMargin: -p + "px " + -C + "px " + -R + "px " + -w + "px",
      threshold: pe(0, Ue(1, u)) || 1
    };
    let V = !0;
    function j(A) {
      const _ = A[0].intersectionRatio;
      if (_ !== u) {
        if (!V)
          return i();
        _ ? i(!1, _) : r = setTimeout(() => {
          i(!1, 1e-7);
        }, 100);
      }
      V = !1;
    }
    try {
      n = new IntersectionObserver(j, {
        ...D,
        // Handle <iframe>s
        root: o.ownerDocument
      });
    } catch {
      n = new IntersectionObserver(j, D);
    }
    n.observe(e);
  }
  return i(!0), l;
}
function Ji(e, t, n, r) {
  r === void 0 && (r = {});
  const {
    ancestorScroll: o = !0,
    ancestorResize: l = !0,
    elementResize: i = typeof ResizeObserver == "function",
    layoutShift: c = typeof IntersectionObserver == "function",
    animationFrame: u = !1
  } = r, s = $t(e), f = o || l ? [...s ? ue(s) : [], ...ue(t)] : [];
  f.forEach((b) => {
    o && b.addEventListener("scroll", n, {
      passive: !0
    }), l && b.addEventListener("resize", n);
  });
  const d = s && c ? Gi(s, n) : null;
  let g = -1, p = null;
  i && (p = new ResizeObserver((b) => {
    let [D] = b;
    D && D.target === s && p && (p.unobserve(t), cancelAnimationFrame(g), g = requestAnimationFrame(() => {
      p && p.observe(t);
    })), n();
  }), s && !u && p.observe(s), p.observe(t));
  let C, R = u ? be(e) : null;
  u && w();
  function w() {
    const b = be(e);
    R && (b.x !== R.x || b.y !== R.y || b.width !== R.width || b.height !== R.height) && n(), R = b, C = requestAnimationFrame(w);
  }
  return n(), () => {
    f.forEach((b) => {
      o && b.removeEventListener("scroll", n), l && b.removeEventListener("resize", n);
    }), d && d(), p && p.disconnect(), p = null, u && cancelAnimationFrame(C);
  };
}
const Qi = (e, t, n) => {
  const r = /* @__PURE__ */ new Map(), o = {
    platform: Xi,
    ...n
  }, l = {
    ...o.platform,
    _c: r
  };
  return Ti(e, t, {
    ...o,
    platform: l
  });
};
var He = typeof document < "u" ? xn : Z;
function ze(e, t) {
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
        if (!ze(e[r], t[r]))
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
      if (!(l === "_owner" && e.$$typeof) && !ze(e[l], t[l]))
        return !1;
    }
    return !0;
  }
  return e !== e && t !== t;
}
function nr(e) {
  return typeof window > "u" ? 1 : (e.ownerDocument.defaultView || window).devicePixelRatio || 1;
}
function ln(e, t) {
  const n = nr(e);
  return Math.round(t * n) / n;
}
function sn(e) {
  const t = h.useRef(e);
  return He(() => {
    t.current = e;
  }), t;
}
function el(e) {
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
    open: s
  } = e, [f, d] = h.useState({
    x: 0,
    y: 0,
    strategy: n,
    placement: t,
    middlewareData: {},
    isPositioned: !1
  }), [g, p] = h.useState(r);
  ze(g, r) || p(r);
  const [C, R] = h.useState(null), [w, b] = h.useState(null), D = h.useCallback((F) => {
    F != _.current && (_.current = F, R(F));
  }, [R]), V = h.useCallback((F) => {
    F !== L.current && (L.current = F, b(F));
  }, [b]), j = l || C, A = i || w, _ = h.useRef(null), L = h.useRef(null), m = h.useRef(f), S = sn(u), v = sn(o), y = h.useCallback(() => {
    if (!_.current || !L.current)
      return;
    const F = {
      placement: t,
      strategy: n,
      middleware: g
    };
    v.current && (F.platform = v.current), Qi(_.current, L.current, F).then((T) => {
      const M = {
        ...T,
        isPositioned: !0
      };
      E.current && !ze(m.current, M) && (m.current = M, Sr.flushSync(() => {
        d(M);
      }));
    });
  }, [g, t, n, v]);
  He(() => {
    s === !1 && m.current.isPositioned && (m.current.isPositioned = !1, d((F) => ({
      ...F,
      isPositioned: !1
    })));
  }, [s]);
  const E = h.useRef(!1);
  He(() => (E.current = !0, () => {
    E.current = !1;
  }), []), He(() => {
    if (j && (_.current = j), A && (L.current = A), j && A) {
      if (S.current)
        return S.current(j, A, y);
      y();
    }
  }, [j, A, y, S]);
  const I = h.useMemo(() => ({
    reference: _,
    floating: L,
    setReference: D,
    setFloating: V
  }), [D, V]), O = h.useMemo(() => ({
    reference: j,
    floating: A
  }), [j, A]), N = h.useMemo(() => {
    const F = {
      position: n,
      left: 0,
      top: 0
    };
    if (!O.floating)
      return F;
    const T = ln(O.floating, f.x), M = ln(O.floating, f.y);
    return c ? {
      ...F,
      transform: "translate(" + T + "px, " + M + "px)",
      ...nr(O.floating) >= 1.5 && {
        willChange: "transform"
      }
    } : {
      position: n,
      left: T,
      top: M
    };
  }, [n, c, O.floating, f.x, f.y]);
  return h.useMemo(() => ({
    ...f,
    update: y,
    refs: I,
    elements: O,
    floatingStyles: N
  }), [f, y, I, O, N]);
}
/*!
* tabbable 6.2.0
* @license MIT, https://github.com/focus-trap/tabbable/blob/master/LICENSE
*/
var tl = ["input:not([inert])", "select:not([inert])", "textarea:not([inert])", "a[href]:not([inert])", "button:not([inert])", "[tabindex]:not(slot):not([inert])", "audio[controls]:not([inert])", "video[controls]:not([inert])", '[contenteditable]:not([contenteditable="false"]):not([inert])', "details>summary:first-of-type:not([inert])", "details:not([inert])"], Et = /* @__PURE__ */ tl.join(","), rr = typeof Element > "u", Ie = rr ? function() {
} : Element.prototype.matches || Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector, Ye = !rr && Element.prototype.getRootNode ? function(e) {
  var t;
  return e == null || (t = e.getRootNode) === null || t === void 0 ? void 0 : t.call(e);
} : function(e) {
  return e == null ? void 0 : e.ownerDocument;
}, Xe = function e(t, n) {
  var r;
  n === void 0 && (n = !0);
  var o = t == null || (r = t.getAttribute) === null || r === void 0 ? void 0 : r.call(t, "inert"), l = o === "" || o === "true", i = l || n && t && e(t.parentNode);
  return i;
}, nl = function(t) {
  var n, r = t == null || (n = t.getAttribute) === null || n === void 0 ? void 0 : n.call(t, "contenteditable");
  return r === "" || r === "true";
}, rl = function(t, n, r) {
  if (Xe(t))
    return [];
  var o = Array.prototype.slice.apply(t.querySelectorAll(Et));
  return n && Ie.call(t, Et) && o.unshift(t), o = o.filter(r), o;
}, ol = function e(t, n, r) {
  for (var o = [], l = Array.from(t); l.length; ) {
    var i = l.shift();
    if (!Xe(i, !1))
      if (i.tagName === "SLOT") {
        var c = i.assignedElements(), u = c.length ? c : i.children, s = e(u, !0, r);
        r.flatten ? o.push.apply(o, s) : o.push({
          scopeParent: i,
          candidates: s
        });
      } else {
        var f = Ie.call(i, Et);
        f && r.filter(i) && (n || !t.includes(i)) && o.push(i);
        var d = i.shadowRoot || // check for an undisclosed shadow
        typeof r.getShadowRoot == "function" && r.getShadowRoot(i), g = !Xe(d, !1) && (!r.shadowRootFilter || r.shadowRootFilter(i));
        if (d && g) {
          var p = e(d === !0 ? i.children : d.children, !0, r);
          r.flatten ? o.push.apply(o, p) : o.push({
            scopeParent: i,
            candidates: p
          });
        } else
          l.unshift.apply(l, i.children);
      }
  }
  return o;
}, or = function(t) {
  return !isNaN(parseInt(t.getAttribute("tabindex"), 10));
}, ir = function(t) {
  if (!t)
    throw new Error("No node provided");
  return t.tabIndex < 0 && (/^(AUDIO|VIDEO|DETAILS)$/.test(t.tagName) || nl(t)) && !or(t) ? 0 : t.tabIndex;
}, il = function(t, n) {
  var r = ir(t);
  return r < 0 && n && !or(t) ? 0 : r;
}, ll = function(t, n) {
  return t.tabIndex === n.tabIndex ? t.documentOrder - n.documentOrder : t.tabIndex - n.tabIndex;
}, lr = function(t) {
  return t.tagName === "INPUT";
}, sl = function(t) {
  return lr(t) && t.type === "hidden";
}, cl = function(t) {
  var n = t.tagName === "DETAILS" && Array.prototype.slice.apply(t.children).some(function(r) {
    return r.tagName === "SUMMARY";
  });
  return n;
}, al = function(t, n) {
  for (var r = 0; r < t.length; r++)
    if (t[r].checked && t[r].form === n)
      return t[r];
}, ul = function(t) {
  if (!t.name)
    return !0;
  var n = t.form || Ye(t), r = function(c) {
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
  var l = al(o, t.form);
  return !l || l === t;
}, dl = function(t) {
  return lr(t) && t.type === "radio";
}, fl = function(t) {
  return dl(t) && !ul(t);
}, ml = function(t) {
  var n, r = t && Ye(t), o = (n = r) === null || n === void 0 ? void 0 : n.host, l = !1;
  if (r && r !== t) {
    var i, c, u;
    for (l = !!((i = o) !== null && i !== void 0 && (c = i.ownerDocument) !== null && c !== void 0 && c.contains(o) || t != null && (u = t.ownerDocument) !== null && u !== void 0 && u.contains(t)); !l && o; ) {
      var s, f, d;
      r = Ye(o), o = (s = r) === null || s === void 0 ? void 0 : s.host, l = !!((f = o) !== null && f !== void 0 && (d = f.ownerDocument) !== null && d !== void 0 && d.contains(o));
    }
  }
  return l;
}, cn = function(t) {
  var n = t.getBoundingClientRect(), r = n.width, o = n.height;
  return r === 0 && o === 0;
}, hl = function(t, n) {
  var r = n.displayCheck, o = n.getShadowRoot;
  if (getComputedStyle(t).visibility === "hidden")
    return !0;
  var l = Ie.call(t, "details>summary:first-of-type"), i = l ? t.parentElement : t;
  if (Ie.call(i, "details:not([open]) *"))
    return !0;
  if (!r || r === "full" || r === "legacy-full") {
    if (typeof o == "function") {
      for (var c = t; t; ) {
        var u = t.parentElement, s = Ye(t);
        if (u && !u.shadowRoot && o(u) === !0)
          return cn(t);
        t.assignedSlot ? t = t.assignedSlot : !u && s !== t.ownerDocument ? t = s.host : t = u;
      }
      t = c;
    }
    if (ml(t))
      return !t.getClientRects().length;
    if (r !== "legacy-full")
      return !0;
  } else if (r === "non-zero-area")
    return cn(t);
  return !1;
}, pl = function(t) {
  if (/^(INPUT|BUTTON|SELECT|TEXTAREA)$/.test(t.tagName))
    for (var n = t.parentElement; n; ) {
      if (n.tagName === "FIELDSET" && n.disabled) {
        for (var r = 0; r < n.children.length; r++) {
          var o = n.children.item(r);
          if (o.tagName === "LEGEND")
            return Ie.call(n, "fieldset[disabled] *") ? !0 : !o.contains(t);
        }
        return !0;
      }
      n = n.parentElement;
    }
  return !1;
}, gl = function(t, n) {
  return !(n.disabled || // we must do an inert look up to filter out any elements inside an inert ancestor
  //  because we're limited in the type of selectors we can use in JSDom (see related
  //  note related to `candidateSelectors`)
  Xe(n) || sl(n) || hl(n, t) || // For a details element with a summary, the summary element gets the focus
  cl(n) || pl(n));
}, an = function(t, n) {
  return !(fl(n) || ir(n) < 0 || !gl(t, n));
}, vl = function(t) {
  var n = parseInt(t.getAttribute("tabindex"), 10);
  return !!(isNaN(n) || n >= 0);
}, wl = function e(t) {
  var n = [], r = [];
  return t.forEach(function(o, l) {
    var i = !!o.scopeParent, c = i ? o.scopeParent : o, u = il(c, i), s = i ? e(o.candidates) : c;
    u === 0 ? i ? n.push.apply(n, s) : n.push(c) : r.push({
      documentOrder: l,
      tabIndex: u,
      item: o,
      isScope: i,
      content: s
    });
  }), r.sort(ll).reduce(function(o, l) {
    return l.isScope ? o.push.apply(o, l.content) : o.push(l.content), o;
  }, []).concat(n);
}, sr = function(t, n) {
  n = n || {};
  var r;
  return n.getShadowRoot ? r = ol([t], n.includeContainer, {
    filter: an.bind(null, n),
    flatten: !1,
    getShadowRoot: n.getShadowRoot,
    shadowRootFilter: vl
  }) : r = rl(t, n.includeContainer, an.bind(null, n)), wl(r);
};
const bl = h.useInsertionEffect, yl = bl || ((e) => e());
function xe(e) {
  const t = h.useRef(() => {
    if (process.env.NODE_ENV !== "production")
      throw new Error("Cannot call an event handler while rendering.");
  });
  return yl(() => {
    t.current = e;
  }), h.useCallback(function() {
    for (var n = arguments.length, r = new Array(n), o = 0; o < n; o++)
      r[o] = arguments[o];
    return t.current == null ? void 0 : t.current(...r);
  }, []);
}
var Pe = typeof document < "u" ? xn : Z;
function St() {
  return St = Object.assign ? Object.assign.bind() : function(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = arguments[t];
      for (var r in n)
        Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
    }
    return e;
  }, St.apply(this, arguments);
}
let mt = !1, xl = 0;
const un = () => "floating-ui-" + xl++;
function Cl() {
  const [e, t] = h.useState(() => mt ? un() : void 0);
  return Pe(() => {
    e == null && t(un());
  }, []), h.useEffect(() => {
    mt || (mt = !0);
  }, []), e;
}
const Rl = h.useId, cr = Rl || Cl;
function El() {
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
const Sl = /* @__PURE__ */ h.createContext(null), Nl = /* @__PURE__ */ h.createContext(null), kl = () => {
  var e;
  return ((e = h.useContext(Sl)) == null ? void 0 : e.id) || null;
}, ar = () => h.useContext(Nl);
function Bt(e) {
  return "data-floating-ui-" + e;
}
function ht(e, t) {
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
const ur = () => ({
  getShadowRoot: !0,
  displayCheck: (
    // JSDOM does not support the `tabbable` library. To solve this we can
    // check if `ResizeObserver` is a real function (not polyfilled), which
    // determines if the current environment is JSDOM-like.
    typeof ResizeObserver == "function" && ResizeObserver.toString().includes("[native code]") ? "full" : "none"
  )
});
function dr(e, t) {
  const n = sr(e, ur());
  t === "prev" && n.reverse();
  const r = n.indexOf(wi(Ct(e)));
  return n.slice(r + 1)[0];
}
function Al() {
  return dr(document.body, "next");
}
function Ol() {
  return dr(document.body, "prev");
}
function pt(e, t) {
  const n = t || e.currentTarget, r = e.relatedTarget;
  return !r || !xt(n, r);
}
function Dl(e) {
  sr(e, ur()).forEach((n) => {
    n.dataset.tabindex = n.getAttribute("tabindex") || "", n.setAttribute("tabindex", "-1");
  });
}
function Ml(e) {
  e.querySelectorAll("[data-tabindex]").forEach((n) => {
    const r = n.dataset.tabindex;
    delete n.dataset.tabindex, r ? n.setAttribute("tabindex", r) : n.removeAttribute("tabindex");
  });
}
const fr = {
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
let Tl;
function dn(e) {
  e.key === "Tab" && (e.target, clearTimeout(Tl));
}
const fn = /* @__PURE__ */ h.forwardRef(function(t, n) {
  const [r, o] = h.useState();
  Pe(() => (bi() && o("button"), document.addEventListener("keydown", dn), () => {
    document.removeEventListener("keydown", dn);
  }), []);
  const l = {
    ref: n,
    tabIndex: 0,
    // Role is only for VoiceOver
    role: r,
    "aria-hidden": r ? void 0 : !0,
    [Bt("focus-guard")]: "",
    style: fr
  };
  return /* @__PURE__ */ h.createElement("span", St({}, t, l));
}), mr = /* @__PURE__ */ h.createContext(null);
function Ll(e) {
  let {
    id: t,
    root: n
  } = e === void 0 ? {} : e;
  const [r, o] = h.useState(null), l = cr(), i = Pl(), c = h.useMemo(() => ({
    id: t,
    root: n,
    portalContext: i,
    uniqueId: l
  }), [t, n, i, l]), u = h.useRef();
  return Pe(() => () => {
    r == null || r.remove();
  }, [r, c]), Pe(() => {
    if (u.current === c)
      return;
    u.current = c;
    const {
      id: s,
      root: f,
      portalContext: d,
      uniqueId: g
    } = c, p = s ? document.getElementById(s) : null, C = Bt("portal");
    if (p) {
      const R = document.createElement("div");
      R.id = g, R.setAttribute(C, ""), p.appendChild(R), o(R);
    } else {
      let R = f || (d == null ? void 0 : d.portalNode);
      R && !q(R) && (R = R.current), R = R || document.body;
      let w = null;
      s && (w = document.createElement("div"), w.id = s, R.appendChild(w));
      const b = document.createElement("div");
      b.id = g, b.setAttribute(C, ""), R = w || R, R.appendChild(b), o(b);
    }
  }, [c]), r;
}
function Il(e) {
  let {
    children: t,
    id: n,
    root: r = null,
    preserveTabOrder: o = !0
  } = e;
  const l = Ll({
    id: n,
    root: r
  }), [i, c] = h.useState(null), u = h.useRef(null), s = h.useRef(null), f = h.useRef(null), d = h.useRef(null), g = (
    // The FocusManager and therefore floating element are currently open/
    // rendered.
    !!i && // Guards are only for non-modal focus management.
    !i.modal && // Don't render if unmount is transitioning.
    i.open && o && !!(r || l)
  );
  return h.useEffect(() => {
    if (!l || !o || i != null && i.modal)
      return;
    function p(C) {
      l && pt(C) && (C.type === "focusin" ? Ml : Dl)(l);
    }
    return l.addEventListener("focusin", p, !0), l.addEventListener("focusout", p, !0), () => {
      l.removeEventListener("focusin", p, !0), l.removeEventListener("focusout", p, !0);
    };
  }, [l, o, i == null ? void 0 : i.modal]), /* @__PURE__ */ h.createElement(mr.Provider, {
    value: h.useMemo(() => ({
      preserveTabOrder: o,
      beforeOutsideRef: u,
      afterOutsideRef: s,
      beforeInsideRef: f,
      afterInsideRef: d,
      portalNode: l,
      setFocusManagerState: c
    }), [o, l])
  }, g && l && /* @__PURE__ */ h.createElement(fn, {
    "data-type": "outside",
    ref: u,
    onFocus: (p) => {
      if (pt(p, l)) {
        var C;
        (C = f.current) == null || C.focus();
      } else {
        const R = Ol() || (i == null ? void 0 : i.refs.domReference.current);
        R == null || R.focus();
      }
    }
  }), g && l && /* @__PURE__ */ h.createElement("span", {
    "aria-owns": l.id,
    style: fr
  }), l && /* @__PURE__ */ Nr(t, l), g && l && /* @__PURE__ */ h.createElement(fn, {
    "data-type": "outside",
    ref: s,
    onFocus: (p) => {
      if (pt(p, l)) {
        var C;
        (C = d.current) == null || C.focus();
      } else {
        const R = Al() || (i == null ? void 0 : i.refs.domReference.current);
        R == null || R.focus(), i != null && i.closeOnFocusOut && (i == null || i.onOpenChange(!1, p.nativeEvent));
      }
    }
  }));
}
const Pl = () => h.useContext(mr);
function mn(e) {
  return Q(e.target) && e.target.tagName === "BUTTON";
}
function hn(e) {
  return Ri(e);
}
function Fl(e, t) {
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
    ignoreMouse: s = !1,
    keyboardHandlers: f = !0
  } = t, d = h.useRef(), g = h.useRef(!1);
  return h.useMemo(() => i ? {
    reference: {
      onPointerDown(p) {
        d.current = p.pointerType;
      },
      onMouseDown(p) {
        p.button === 0 && (en(d.current, !0) && s || c !== "click" && (n && u && (!o.current.openEvent || o.current.openEvent.type === "mousedown") ? r(!1, p.nativeEvent, "click") : (p.preventDefault(), r(!0, p.nativeEvent, "click"))));
      },
      onClick(p) {
        if (c === "mousedown" && d.current) {
          d.current = void 0;
          return;
        }
        en(d.current, !0) && s || (n && u && (!o.current.openEvent || o.current.openEvent.type === "click") ? r(!1, p.nativeEvent, "click") : r(!0, p.nativeEvent, "click"));
      },
      onKeyDown(p) {
        d.current = void 0, !(p.defaultPrevented || !f || mn(p)) && (p.key === " " && !hn(l) && (p.preventDefault(), g.current = !0), p.key === "Enter" && r(!(n && u), p.nativeEvent, "click"));
      },
      onKeyUp(p) {
        p.defaultPrevented || !f || mn(p) || hn(l) || p.key === " " && g.current && (g.current = !1, r(!(n && u), p.nativeEvent, "click"));
      }
    }
  } : {}, [i, o, c, s, f, l, u, n, r]);
}
const Vl = {
  pointerdown: "onPointerDown",
  mousedown: "onMouseDown",
  click: "onClick"
}, jl = {
  pointerdown: "onPointerDownCapture",
  mousedown: "onMouseDownCapture",
  click: "onClickCapture"
}, pn = (e) => {
  var t, n;
  return {
    escapeKey: typeof e == "boolean" ? e : (t = e == null ? void 0 : e.escapeKey) != null ? t : !1,
    outsidePress: typeof e == "boolean" ? e : (n = e == null ? void 0 : e.outsidePress) != null ? n : !0
  };
};
function _l(e, t) {
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
    enabled: s = !0,
    escapeKey: f = !0,
    outsidePress: d = !0,
    outsidePressEvent: g = "pointerdown",
    referencePress: p = !1,
    referencePressEvent: C = "pointerdown",
    ancestorScroll: R = !1,
    bubbles: w,
    capture: b
  } = t, D = ar(), V = xe(typeof d == "function" ? d : () => !1), j = typeof d == "function" ? V : d, A = h.useRef(!1), _ = h.useRef(!1), {
    escapeKey: L,
    outsidePress: m
  } = pn(w), {
    escapeKey: S,
    outsidePress: v
  } = pn(b), y = xe((N) => {
    if (!n || !s || !f || N.key !== "Escape")
      return;
    const F = D ? ht(D.nodesRef.current, o) : [];
    if (!L && (N.stopPropagation(), F.length > 0)) {
      let T = !0;
      if (F.forEach((M) => {
        var K;
        if ((K = M.context) != null && K.open && !M.context.dataRef.current.__escapeKeyBubbles) {
          T = !1;
          return;
        }
      }), !T)
        return;
    }
    r(!1, yi(N) ? N.nativeEvent : N, "escape-key");
  }), E = xe((N) => {
    var F;
    const T = () => {
      var M;
      y(N), (M = Oe(N)) == null || M.removeEventListener("keydown", T);
    };
    (F = Oe(N)) == null || F.addEventListener("keydown", T);
  }), I = xe((N) => {
    const F = A.current;
    A.current = !1;
    const T = _.current;
    if (_.current = !1, g === "click" && T || F || typeof j == "function" && !j(N))
      return;
    const M = Oe(N), K = "[" + Bt("inert") + "]", je = Ct(c).querySelectorAll(K);
    let Ne = q(M) ? M : null;
    for (; Ne && !Re(Ne); ) {
      const te = ve(Ne);
      if (Re(te) || !q(te))
        break;
      Ne = te;
    }
    if (je.length && q(M) && !xi(M) && // Clicked on a direct ancestor (e.g. FloatingOverlay).
    !xt(M, c) && // If the target root element contains none of the markers, then the
    // element was injected after the floating element rendered.
    Array.from(je).every((te) => !xt(Ne, te)))
      return;
    if (Q(M) && c) {
      const te = M.clientWidth > 0 && M.scrollWidth > M.clientWidth, le = M.clientHeight > 0 && M.scrollHeight > M.clientHeight;
      let ke = le && N.offsetX > M.clientWidth;
      if (le && ee(M).direction === "rtl" && (ke = N.offsetX <= M.offsetWidth - M.clientWidth), ke || te && N.offsetY > M.clientHeight)
        return;
    }
    const wr = D && ht(D.nodesRef.current, o).some((te) => {
      var le;
      return ft(N, (le = te.context) == null ? void 0 : le.elements.floating);
    });
    if (ft(N, c) || ft(N, i) || wr)
      return;
    const Ut = D ? ht(D.nodesRef.current, o) : [];
    if (Ut.length > 0) {
      let te = !0;
      if (Ut.forEach((le) => {
        var ke;
        if ((ke = le.context) != null && ke.open && !le.context.dataRef.current.__outsidePressBubbles) {
          te = !1;
          return;
        }
      }), !te)
        return;
    }
    r(!1, N, "outside-press");
  }), O = xe((N) => {
    var F;
    const T = () => {
      var M;
      I(N), (M = Oe(N)) == null || M.removeEventListener(g, T);
    };
    (F = Oe(N)) == null || F.addEventListener(g, T);
  });
  return h.useEffect(() => {
    if (!n || !s)
      return;
    u.current.__escapeKeyBubbles = L, u.current.__outsidePressBubbles = m;
    function N(M) {
      r(!1, M, "ancestor-scroll");
    }
    const F = Ct(c);
    f && F.addEventListener("keydown", S ? E : y, S), j && F.addEventListener(g, v ? O : I, v);
    let T = [];
    return R && (q(i) && (T = ue(i)), q(c) && (T = T.concat(ue(c))), !q(l) && l && l.contextElement && (T = T.concat(ue(l.contextElement)))), T = T.filter((M) => {
      var K;
      return M !== ((K = F.defaultView) == null ? void 0 : K.visualViewport);
    }), T.forEach((M) => {
      M.addEventListener("scroll", N, {
        passive: !0
      });
    }), () => {
      f && F.removeEventListener("keydown", S ? E : y, S), j && F.removeEventListener(g, v ? O : I, v), T.forEach((M) => {
        M.removeEventListener("scroll", N);
      });
    };
  }, [u, c, i, l, f, j, g, n, r, R, s, L, m, y, S, E, I, v, O]), h.useEffect(() => {
    A.current = !1;
  }, [j, g]), h.useMemo(() => s ? {
    reference: {
      onKeyDown: y,
      [Vl[C]]: (N) => {
        p && r(!1, N.nativeEvent, "reference-press");
      }
    },
    floating: {
      onKeyDown: y,
      onMouseDown() {
        _.current = !0;
      },
      onMouseUp() {
        _.current = !0;
      },
      [jl[g]]: () => {
        A.current = !0;
      }
    }
  } : {}, [s, p, g, C, r, y]);
}
let Nt;
process.env.NODE_ENV !== "production" && (Nt = /* @__PURE__ */ new Set());
function $l(e) {
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
      if (!((i = Nt) != null && i.has(m))) {
        var c;
        (c = Nt) == null || c.add(m), console.error(m);
      }
    }
  }
  const [u, s] = h.useState(null), f = ((t = e.elements) == null ? void 0 : t.reference) || u, d = el(e), g = ar(), p = kl() != null, C = xe((m, S, v) => {
    m && (w.current.openEvent = S), b.emit("openchange", {
      open: m,
      event: S,
      reason: v,
      nested: p
    }), r == null || r(m, S, v);
  }), R = h.useRef(null), w = h.useRef({}), b = h.useState(() => El())[0], D = cr(), V = h.useCallback((m) => {
    const S = q(m) ? {
      getBoundingClientRect: () => m.getBoundingClientRect(),
      contextElement: m
    } : m;
    d.refs.setReference(S);
  }, [d.refs]), j = h.useCallback((m) => {
    (q(m) || m === null) && (R.current = m, s(m)), (q(d.refs.reference.current) || d.refs.reference.current === null || // Don't allow setting virtual elements using the old technique back to
    // `null` to support `positionReference` + an unstable `reference`
    // callback ref.
    m !== null && !q(m)) && d.refs.setReference(m);
  }, [d.refs]), A = h.useMemo(() => ({
    ...d.refs,
    setReference: j,
    setPositionReference: V,
    domReference: R
  }), [d.refs, j, V]), _ = h.useMemo(() => ({
    ...d.elements,
    domReference: f
  }), [d.elements, f]), L = h.useMemo(() => ({
    ...d,
    refs: A,
    elements: _,
    dataRef: w,
    nodeId: o,
    floatingId: D,
    events: b,
    open: n,
    onOpenChange: C
  }), [d, o, D, b, n, C, A, _]);
  return Pe(() => {
    const m = g == null ? void 0 : g.nodesRef.current.find((S) => S.id === o);
    m && (m.context = L);
  }), h.useMemo(() => ({
    ...d,
    context: L,
    refs: A,
    elements: _
  }), [d, A, _, L]);
}
const gn = "active", vn = "selected";
function gt(e, t, n) {
  const r = /* @__PURE__ */ new Map(), o = n === "item";
  let l = e;
  if (o && e) {
    const {
      [gn]: i,
      [vn]: c,
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
      let [s, f] = u;
      if (!(o && [gn, vn].includes(s)))
        if (s.indexOf("on") === 0) {
          if (r.has(s) || r.set(s, []), typeof f == "function") {
            var d;
            (d = r.get(s)) == null || d.push(f), i[s] = function() {
              for (var g, p = arguments.length, C = new Array(p), R = 0; R < p; R++)
                C[R] = arguments[R];
              return (g = r.get(s)) == null ? void 0 : g.map((w) => w(...C)).find((w) => w !== void 0);
            };
          }
        } else
          i[s] = f;
    }), i), {})
  };
}
function Bl(e) {
  e === void 0 && (e = []);
  const t = e, n = h.useCallback(
    (l) => gt(l, e, "reference"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    t
  ), r = h.useCallback(
    (l) => gt(l, e, "floating"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    t
  ), o = h.useCallback(
    (l) => gt(l, e, "item"),
    // Granularly check for `item` changes, because the `getItemProps` getter
    // should be as referentially stable as possible since it may be passed as
    // a prop to many components. All `item` key values must therefore be
    // memoized.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    e.map((l) => l == null ? void 0 : l.item)
  );
  return h.useMemo(() => ({
    getReferenceProps: n,
    getFloatingProps: r,
    getItemProps: o
  }), [n, r, o]);
}
function Hl({
  isOpen: e,
  setIsOpen: t,
  offset: n = 0,
  placement: r = "bottom-start",
  click: o = !0
}) {
  const { x: l, y: i, strategy: c, refs: u, context: s } = $l({
    open: e,
    onOpenChange: t,
    middleware: [Fi(), Pi(n), Li()],
    whileElementsMounted: Ji,
    placement: r
  }), f = Fl(s, {
    enabled: o
  }), d = _l(s, {}), { getReferenceProps: g, getFloatingProps: p } = Bl([
    f,
    d
  ]);
  return {
    x: l,
    y: i,
    strategy: c,
    refs: u,
    getReferenceProps: g,
    getFloatingProps: p
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
  children: c,
  portal: u
}) {
  const { x: s, y: f, strategy: d, refs: g, getReferenceProps: p, getFloatingProps: C } = Hl({
    isOpen: e,
    setIsOpen: t,
    offset: n,
    placement: r,
    hover: o,
    click: l
  }), [R, w] = Er.toArray(c), [b] = k(Dn);
  function D() {
    return e && /* @__PURE__ */ a(Il, { id: b, children: /* @__PURE__ */ a(
      "div",
      {
        ref: g.setFloating,
        style: {
          position: d,
          top: f ?? 0,
          left: s ?? 0
        },
        ...C(),
        children: w
      }
    ) });
  }
  function V() {
    return e && /* @__PURE__ */ a(
      "div",
      {
        ref: g.setFloating,
        style: {
          position: d,
          top: f ?? 0,
          left: s ?? 0
        },
        ...C(),
        children: w
      }
    );
  }
  return /* @__PURE__ */ x(X, { children: [
    /* @__PURE__ */ a(
      "div",
      {
        ref: g.setReference,
        ...p({ onClick: i }),
        children: R
      }
    ),
    u ? D() : V()
  ] });
}
function Wl({
  rowId: e,
  colId: t,
  data: n,
  setData: r,
  focus: o,
  isViewOnly: l,
  configuration: i
}) {
  const [c] = k(ne), u = W(
    () => c.parseDate !== void 0 ? c.parseDate(n, i) : n ? new Date(Date.parse(n)) : null,
    [n, i]
  ), [s, f] = B(
    u && u._isValid !== !1 ? Me(u) : ""
  ), d = /^([1-9]|1[012]|0[1-9])[/.-]?$/g, g = /^([1-9]|1[012]|0[1-9])[/.-]([1-9]||0[1-9]|1[0-9]|2[0-9]|3[01])[/.-]?$/g, p = /^([1-9]|1[012]|0[1-9])[/.-]([1-9]||0[1-9]|1[0-9]|2[0-9]|3[01])[/.-](\d?\d?\d?\d)$/g, [C, R] = B(null), w = /* @__PURE__ */ new Date(), [, b] = k(rt), D = o === "editing", V = Y(
    (L) => {
      b({ rowId: e, colId: t, value: L ? "editing" : "focused" });
    },
    [e, t, b]
  );
  function j(L, m, S) {
    const v = Number(S), y = Number(L) - 1, E = Number(m), I = /* @__PURE__ */ new Date();
    return I.setUTCFullYear(v, y, E), I.setUTCHours(0, 0, 0, 0), I;
  }
  const A = Y(
    (L) => {
      c.formatStoredDate !== void 0 ? r(c.formatStoredDate(L, i) || "") : r((L == null ? void 0 : L.toISOString()) || ""), c.formatStoredDate !== void 0 ? f(c.formatStoredDate(u, i) || "") : f(Me(L)), b({ rowId: e, colId: t, value: "focused" });
    },
    [e, t, b, r]
  );
  Z(() => {
    C && C.focus();
  }, [C]), Z(() => {
    c.formatStoredDate !== void 0 ? f(c.formatStoredDate(u, i) || "") : f(u && u._isValid !== !1 ? Me(u) : "");
  }, [o]);
  function _(L) {
    f(L.target.value);
  }
  return Wn(() => {
    if (!s || c.formatStoredDate !== void 0)
      return;
    let L = null;
    if (p.test(s)) {
      s.match(p);
      const [m] = s.matchAll(p);
      L = j(m[1], m[2], m[3]);
    } else if (d.test(s)) {
      s.match(d);
      const [m] = s.matchAll(d);
      L = j(m[1], 1, w.getUTCFullYear());
    } else if (g.test(s)) {
      s.match(g);
      const [m] = s.matchAll(g);
      L = j(
        m[1],
        m[2],
        w.getUTCFullYear()
      );
    }
    r((L == null ? void 0 : L.toISOString()) || "");
  }, [s]), /* @__PURE__ */ x(X, { children: [
    (o === "none" || o === "focused") && /* @__PURE__ */ a("div", { className: "p-1 flex items-center cursor-default w-full", children: u ? c.formatDisplayDate !== void 0 ? c.formatDisplayDate(u, i) : Me(u) : "" }),
    o === "editing" && !l && /* @__PURE__ */ x(re, { isOpen: D, setIsOpen: V, offset: 4, children: [
      /* @__PURE__ */ x("div", { className: "h-full", children: [
        /* @__PURE__ */ a("input", { type: "data", className: "hidden", value: s, readOnly: !0 }),
        /* @__PURE__ */ a(
          "input",
          {
            placeholder: "mm/dd/yyyy",
            className: "rs-input focus:outline-none rounded p-1 w-full",
            onChange: _,
            value: s,
            ref: R
          }
        )
      ] }),
      /* @__PURE__ */ a(Un, { onSelect: A, value: (u == null ? void 0 : u._isValid) !== !1 ? u : null })
    ] })
  ] });
}
function Ul({
  rowId: e,
  colId: t,
  data: n,
  setData: r,
  focus: o,
  isViewOnly: l,
  configuration: i
}) {
  const [c] = k(ne), u = W(
    () => c.parseDateTime !== void 0 ? c.parseDateTime(n, i) : n ? new Date(Date.parse(n)) : null,
    [n, i]
  ), [s, f] = B(
    u && u._isValid !== !1 ? $e(u) : ""
  ), d = /^([1-9]|1[012]|0[1-9])[/.-]?$/g, g = /^([1-9]|1[012]|0[1-9])[/.-]([1-9]||0[1-9]|1[0-9]|2[0-9]|3[01])[/.-]?$/g, p = /^([1-9]|1[012]|0[1-9])[/.-]([1-9]||0[1-9]|1[0-9]|2[0-9]|3[01])[/.-](\d?\d?\d?\d)$/g, [C, R] = B(null), w = /* @__PURE__ */ new Date(), [, b] = k(rt), D = o === "editing", V = Y(
    (L) => {
      b({ rowId: e, colId: t, value: L ? "editing" : "focused" });
    },
    [e, t, b]
  );
  function j(L, m, S) {
    const v = Number(S), y = Number(L) - 1, E = Number(m), I = /* @__PURE__ */ new Date();
    return I.setUTCFullYear(v, y, E), I.setUTCHours(0, 0, 0, 0), I;
  }
  const A = Y(
    (L) => {
      c.formatStoredDateTime !== void 0 ? r(c.formatStoredDateTime(L, i) || "") : r((L == null ? void 0 : L.toISOString()) || ""), c.formatStoredDateTime !== void 0 ? f(c.formatStoredDateTime(u, i) || "") : f($e(L)), b({ rowId: e, colId: t, value: "focused" });
    },
    [e, t, b, r]
  );
  Z(() => {
    C && C.focus();
  }, [C]), Z(() => {
    c.formatStoredDateTime !== void 0 ? f(c.formatStoredDateTime(u, i) || "") : f(u && u._isValid !== !1 ? $e(u) : "");
  }, [o]);
  function _(L) {
    f(L.target.value);
  }
  return Wn(() => {
    if (!s || c.formatStoredDateTime !== void 0)
      return;
    let L = null;
    if (p.test(s)) {
      s.match(p);
      const [m] = s.matchAll(p);
      L = j(m[1], m[2], m[3]);
    } else if (d.test(s)) {
      s.match(d);
      const [m] = s.matchAll(d);
      L = j(m[1], 1, w.getUTCFullYear());
    } else if (g.test(s)) {
      s.match(g);
      const [m] = s.matchAll(g);
      L = j(
        m[1],
        m[2],
        w.getUTCFullYear()
      );
    }
    r((L == null ? void 0 : L.toISOString()) || "");
  }, [s]), /* @__PURE__ */ x(X, { children: [
    (o === "none" || o === "focused") && /* @__PURE__ */ a("div", { className: "p-1 flex items-center cursor-default w-full", children: u ? c.formatDisplayDateTime !== void 0 ? c.formatDisplayDateTime(u, i) : $e(u) : "" }),
    o === "editing" && !l && /* @__PURE__ */ x(re, { isOpen: D, setIsOpen: V, offset: 4, children: [
      /* @__PURE__ */ x("div", { className: "h-full", children: [
        /* @__PURE__ */ a("input", { type: "data", className: "hidden", value: s, readOnly: !0 }),
        /* @__PURE__ */ a(
          "input",
          {
            placeholder: "mm/dd/yyyy hh:mm",
            className: "rs-input focus:outline-none rounded p-1 w-full",
            onChange: _,
            value: s,
            ref: R
          }
        )
      ] }),
      /* @__PURE__ */ a(Un, { onSelect: A, value: (u == null ? void 0 : u._isValid) !== !1 ? u : null })
    ] })
  ] });
}
const Kl = {
  32: "truncate",
  64: "line-clamp-2",
  96: "line-clamp-4",
  128: "line-clamp-5"
};
function Zl({ data: e, setData: t, focusState: n, isViewOnly: r }) {
  const [o, l] = B(null), i = W(() => e || "", [e]), [c] = k(Pt);
  function u(s) {
    s.preventDefault(), t(s.target.value);
  }
  return Z(() => {
    o && (o.focus(), o.setSelectionRange(
      i.length + 1,
      i.length || 1
    ), o.scrollTop = o.scrollHeight);
  }, [o]), /* @__PURE__ */ x(X, { children: [
    (n === "none" || n === "focused") && /* @__PURE__ */ a(
      "div",
      {
        className: U(
          "p-1 cursor-default w-full h-full",
          Kl[c]
        ),
        children: e
      }
    ),
    n === "editing" && !r && /* @__PURE__ */ a(
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
const ql = [
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
function Ve({
  options: e = ql,
  allOptions: t,
  onSelect: n,
  placeholder: r = "Search",
  inputRef: o,
  OptionRenderer: l,
  value: i = {},
  onNewOption: c,
  enableSearch: u = !0
}) {
  const [s, f] = B(e), d = s.find((v) => v.value === i.value), [g, p] = B(d || s[0]), [C, R] = B(!1), [w, b] = B(""), D = W(() => wt(), []), [V, j] = B({}), A = ae(!1);
  Z(() => {
    let v = !1;
    if (t)
      for (const E in t)
        t[E].name.toLowerCase() === w.toLowerCase() && (v = !0);
    const y = e.filter((E) => (E.name.toLowerCase() === w.toLowerCase() && (v = !0), E.name.toLowerCase().includes(w.toLowerCase())));
    f(y), A.current ? y.length > 0 ? p(y[0]) : p({
      value: w,
      name: w,
      color: D
    }) : p(d || y[0]), j(v ? {} : {
      value: w,
      name: w,
      color: D
    }), R(v);
  }, [w]);
  function _(v) {
    n == null || n(v);
  }
  function L(v) {
    R(!1), b(v.target.value), A.current = !0;
  }
  const m = Y((v) => {
    if (v.code === "Enter") {
      if (v.preventDefault(), s.length === 0 && C || !g.value)
        return;
      c && !C && c(V), _(g);
    } else if (v.code === "ArrowDown") {
      g || p(s[0]);
      const y = s.findIndex(
        (E) => E.value === g.value
      );
      p(s[(y + 1) % s.length]);
    } else if (v.code === "ArrowUp") {
      g || p(s[0]);
      const y = s.findIndex(
        (E) => E.value === g.value
      );
      p(
        s[(y + s.length - 1) % s.length]
      );
    }
  });
  function S(v) {
    v.preventDefault(), p(s[0]);
  }
  return /* @__PURE__ */ x(
    "div",
    {
      className: "w-full relative pt-2",
      onKeyDown: m,
      onMouseEnter: S,
      role: "searchbox",
      tabIndex: 0,
      children: [
        u && /* @__PURE__ */ a("div", { className: "px-2 mb-2", children: /* @__PURE__ */ a(
          "input",
          {
            className: "rs-input border focus:ring rounded-2 rounded focus:outline-none px-2 p-1 w-full truncate",
            placeholder: r,
            onChange: L,
            ref: o,
            value: w
          }
        ) }),
        /* @__PURE__ */ x("ul", { className: "rs-list max-h-48 overflow-auto pb-2", children: [
          s.map((v) => /* @__PURE__ */ x(
            "li",
            {
              className: U(
                "hover:bg-hover-light px-2 p-1 cursor-default flex flex-row whitespace-nowrap",
                g && g.value === v.value && "bg-hover"
              ),
              onClick: (y) => {
                y.preventDefault(), _(v);
              },
              onMouseEnter: () => {
                p(v);
              },
              "aria-selected": g.value === v.value,
              onKeyDown: (y) => {
                y.code === "Enter" && _(v);
              },
              children: [
                l ? /* @__PURE__ */ a(l, { ...v }) : v.name,
                d && d.value === v.value && /* @__PURE__ */ a(Ft, { className: "w-4 h-4 ml-auto self-center" })
              ]
            },
            v.value
          )),
          c && w && !C && /* @__PURE__ */ x(
            "li",
            {
              className: U(
                "hover:bg-hover-light px-2 p-1 cursor-pointer flex flex-row whitespace-nowrap",
                g && g.value === V.value && "bg-hover"
              ),
              onClick: () => c(V),
              onMouseEnter: () => {
                p(V);
              },
              "aria-selected": !1,
              onKeyDown: (v) => {
                v.code === "Enter" && c(V);
              },
              children: [
                /* @__PURE__ */ a("span", { className: "mr-2", children: "Add option:" }),
                l ? /* @__PURE__ */ a(l, { ...V }) : V.name
              ]
            }
          )
        ] })
      ]
    }
  );
}
function zl({
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
  const s = W(
    () => ge(n) ? [] : n.split(",").map((b) => o.find((D) => D.value === b)),
    [n, o]
  ), [f, d] = B(null), g = i === "editing", [, p] = k(rt), C = Y(
    (b) => {
      p({ rowId: e, colId: t, value: b ? "editing" : "focused" });
    },
    [t, e, p]
  ), R = o.filter(
    (b) => s.findIndex((D) => D.value === b.value) === -1
  );
  Z(() => {
    f && f.focus();
  }, [f]);
  const w = Y(
    (b) => {
      l({ id: t, options: [...o, b] }), r([...s.map((D) => D.value), b.value].join(",")), p({ rowId: e, colId: t, value: "focused" });
    },
    [t, e, s, o, l, r, p]
  );
  return /* @__PURE__ */ x(X, { children: [
    i === "none" && /* @__PURE__ */ a("div", { className: "p-1 flex items-center h-full overflow-hidden", children: /* @__PURE__ */ a("div", { className: "flex gap-1", children: s.map((b) => b ? /* @__PURE__ */ a(ce, { color: b.color, name: b.name }, b.name) : null) }) }),
    (i === "focused" || i === "editing") && /* @__PURE__ */ x(
      re,
      {
        isOpen: g && !u,
        setIsOpen: C,
        referenceClass: "w-full max-h-8",
        children: [
          /* @__PURE__ */ a(
            "div",
            {
              className: "flex items-center p-1 w-full h-full bg-content",
              tabIndex: i === "editing" ? 0 : -1,
              children: /* @__PURE__ */ x("div", { className: "flex gap-1 flex-wrap", children: [
                s.map((b) => b ? /* @__PURE__ */ a(
                  ce,
                  {
                    color: b.color,
                    name: b.name,
                    onCancel: (D) => {
                      D.stopPropagation(), r(
                        n.split(",").filter((V) => V !== b.value).join(",")
                      );
                    }
                  },
                  b.name
                ) : null),
                /* @__PURE__ */ a(
                  "button",
                  {
                    className: "p-[3px] bg-zinc-100 rounded flex items-center h-full",
                    type: "button",
                    children: /* @__PURE__ */ a(Bn, { className: "w-4 text-dark" })
                  }
                )
              ] })
            }
          ),
          /* @__PURE__ */ x($, { children: [
            /* @__PURE__ */ a("div", { className: "w-48" }),
            /* @__PURE__ */ a(
              Ve,
              {
                allOptions: o,
                options: R,
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
function Yl({ data: e, setData: t, setError: n, focus: r, isViewOnly: o, configuration: l }) {
  const [i] = k(ne), [c, u] = B(null), s = /^[+-]?(\d*(\.\d*)?)$/, f = W(() => i.parseNumber !== void 0 ? i.parseNumber(e, l) : Number.parseFloat(e), [e, l]);
  function d(g) {
    g.preventDefault(), (i.parseNumber !== void 0 ? !isNaN(i.parseNumber(g.target.value, l)) : s.test(g.target.value)) ? (t(g.target.value), n("")) : n("Please enter a number.");
  }
  return Z(() => {
    n(""), c && c.focus();
  }, [n, c]), /* @__PURE__ */ x(X, { children: [
    (r === "none" || r === "focused") && /* @__PURE__ */ a("div", { className: "p-1 flex items-center justify-end truncate cursor-default w-full", children: i.formatDisplayNumber !== void 0 ? i.formatDisplayNumber(f, l) : { data: e } }),
    r === "editing" && !o && /* @__PURE__ */ a(
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
function Xl({
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
  const s = W(
    () => Le(n) ? {} : o.find((w) => w.value === n)
  ), [f, d] = B(null), g = i === "editing", [, p] = k(rt), C = Y(
    (w) => {
      p({ rowId: e, colId: t, value: w ? "editing" : "focused" });
    },
    [t, e, p]
  );
  Z(() => {
    f && f.focus();
  }, [f]);
  const R = Y(
    (w) => {
      l({ id: t, options: [...o, w] }), r(w.value), p({ rowId: e, colId: t, value: "focused" });
    },
    [t, e, o, l]
  );
  return /* @__PURE__ */ x(X, { children: [
    i === "none" && /* @__PURE__ */ a("div", { className: "p-1 flex items-center h-full", children: s && /* @__PURE__ */ a(ce, { color: s.color, name: s.name }) }),
    u && (i === "focused" || i === "editing") && /* @__PURE__ */ a("div", { className: "flex items-center p-1 w-full h-full", children: s && /* @__PURE__ */ a(ce, { color: s.color, name: s.name }) }),
    !u && (i === "focused" || i === "editing") && /* @__PURE__ */ x(
      re,
      {
        isOpen: g,
        setIsOpen: C,
        referenceClass: "w-full max-h-8",
        children: [
          /* @__PURE__ */ x(
            "div",
            {
              className: "flex items-center p-1 w-full h-full",
              tabIndex: i === "editing" ? 0 : -1,
              children: [
                s && /* @__PURE__ */ a(ce, { color: s.color, name: s.name }),
                /* @__PURE__ */ a(
                  Hn,
                  {
                    className: "w-4 h-4 ml-auto",
                    style: { alignSelf: "center" }
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ x($, { children: [
            /* @__PURE__ */ a("div", { className: "w-48" }),
            /* @__PURE__ */ a(
              Ve,
              {
                options: o,
                onSelect: (w) => {
                  r(w.value), C(!1);
                },
                inputRef: d,
                OptionRenderer: ce,
                placeholder: "Search for an option...",
                value: s,
                onNewOption: R,
                enableSearch: c
              }
            )
          ] })
        ]
      }
    )
  ] });
}
function Gl({ data: e, setData: t, focusState: n, isViewOnly: r }) {
  const [o, l] = B(null), i = W(() => e || "", [e]);
  function c(u) {
    u.preventDefault(), t(u.target.value);
  }
  return Z(() => {
    o && (o.focus(), o.setSelectionRange(i.length + 1, i.length + 1), o.scrollLeft = o.scrollWidth);
  }, [o]), /* @__PURE__ */ x(X, { children: [
    (n === "none" || n === "focused") && /* @__PURE__ */ a("div", { className: "p-1 flex items-center cursor-default w-full", children: /* @__PURE__ */ a("div", { className: "truncate", children: e }) }),
    n === "editing" && !r && /* @__PURE__ */ a(
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
function Jl({ ...e }) {
  return /* @__PURE__ */ x(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...e,
      children: [
        /* @__PURE__ */ a(
          "path",
          {
            d: "M4 20H20M15 11H20M13 6.5H20M4 15.5H20",
            strokeLinecap: "round",
            strokeLinejoin: "round"
          }
        ),
        /* @__PURE__ */ a(
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
function Ql({ ...e }) {
  return /* @__PURE__ */ a(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...e,
      children: /* @__PURE__ */ a(
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
function es({ ...e }) {
  return /* @__PURE__ */ a(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...e,
      children: /* @__PURE__ */ a(
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
function ts({ data: e, setData: t, focusState: n, isViewOnly: r }) {
  const [o, l] = B(null), i = W(() => e || "", [e]);
  function c(u) {
    u.preventDefault(), t(u.target.value);
  }
  return Z(() => {
    o && (o.focus(), o.setSelectionRange(i.length + 1, i.length + 1), o.scrollLeft = o.scrollWidth);
  }, [o]), /* @__PURE__ */ x(X, { children: [
    (n === "none" || n === "focused") && /* @__PURE__ */ a("div", { className: "p-1 flex items-center cursor-default w-full", children: /* @__PURE__ */ a("div", { className: "truncate", children: /* @__PURE__ */ a(
      "a",
      {
        href: `//${e}`,
        rel: "noopener noreferrer",
        target: "_blank",
        className: "text-primary",
        children: e
      }
    ) }) }),
    n === "editing" && !r && /* @__PURE__ */ a(
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
function Ht({ checked: e, toggle: t, isViewOnly: n }) {
  return /* @__PURE__ */ x("div", { children: [
    /* @__PURE__ */ a(
      "input",
      {
        className: "hidden sr-only",
        type: "checkbox",
        checked: e,
        value: e,
        readOnly: !0
      }
    ),
    /* @__PURE__ */ a(
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
function ns({ data: e, setData: t, focusState: n, isViewOnly: r }) {
  const o = W(() => e || !1, [e]);
  return /* @__PURE__ */ a(X, { children: /* @__PURE__ */ a("span", { className: "flex items-center justify-center p-1.5", children: /* @__PURE__ */ a(Ht, { checked: o, toggle: () => t(!o), isViewOnly: r }) }) });
}
function rs({ rowData: e, formula: t }) {
  return /* @__PURE__ */ a(X, { children: /* @__PURE__ */ a("div", { className: "p-1 flex items-center cursor-default w-full", children: /* @__PURE__ */ a("div", { className: "truncate", children: t && typeof t == "function" && t(e) }) }) });
}
function os({ ...e }) {
  return /* @__PURE__ */ a(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...e,
      children: /* @__PURE__ */ a(
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
const hr = [
  {
    type: "text",
    cell: Gl,
    icon: Ql,
    name: "Single-Line Text"
  },
  {
    type: "longText",
    cell: Zl,
    icon: Jl,
    name: "Long Text"
  },
  {
    type: "number",
    cell: Yl,
    icon: Io,
    name: "Number"
  },
  {
    type: "select",
    cell: Xl,
    icon: Ko,
    name: "Select"
  },
  {
    type: "date",
    cell: Wl,
    icon: Ro,
    name: "Date"
  },
  {
    type: "datetime",
    cell: Ul,
    icon: es,
    name: "Date and Time"
  },
  {
    type: "multiSelect",
    cell: zl,
    icon: $o,
    name: "Multiple Select"
  },
  {
    type: "url",
    cell: ts,
    icon: Vo,
    name: "URL"
  },
  {
    type: "checkbox",
    cell: ns,
    icon: No,
    name: "Checkbox"
  },
  {
    type: "formula",
    cell: rs,
    icon: os,
    name: "Formula"
  }
];
function Ge(e) {
  const [t] = k(ne);
  return [...hr, ...t.extraColumnTypes].find((n) => n.type === e);
}
function is() {
  return hr;
}
const ls = Je.memo(cs), ss = ls;
function cs({ rowId: e, colId: t, data: n, rowData: r, setData: o }) {
  const [l, i] = B(""), c = ae(null), u = W(
    () => nt(e, t),
    [e, t]
  ), [s, f] = k(u), d = W(() => he(t), [t]), [g, p] = k(d), C = g.type === "custom" ? g.renderer : Ge(g.type).cell, R = W(
    () => yo(e, t),
    [e, t]
  ), [, w] = k(R);
  function b(A) {
    c.current && !c.current.contains(A.target) && f("none");
  }
  function D(A) {
    if (!c.current || A.target !== c.current) {
      A.code === "Escape" && f("focused");
      return;
    }
    A.code === "ArrowUp" ? (A.stopPropagation(), A.preventDefault(), w("up")) : A.code === "ArrowDown" ? (A.stopPropagation(), A.preventDefault(), w("down")) : A.code === "ArrowLeft" ? (A.stopPropagation(), A.preventDefault(), w("left")) : A.code === "ArrowRight" ? (A.stopPropagation(), A.preventDefault(), w("right")) : A.code === "Enter" ? (f("editing"), A.stopPropagation(), A.preventDefault()) : A.code === "Escape" && f("none");
  }
  function V(A) {
    c.current && A.target === c.current && f("focused");
  }
  function j(A) {
    A.stopPropagation(), !g.isViewOnly && f("editing");
  }
  return Z(() => s === "focused" ? (document == null || document.addEventListener("mousedown", b), c.current && c.current.focus(), () => {
    document == null || document.removeEventListener("mousedown", b);
  }) : s === "editing" ? (document == null || document.addEventListener("mousedown", b), () => {
    document == null || document.removeEventListener("mousedown", b);
  }) : s === "none" ? (c.current && c.current.blur(), () => {
  }) : () => {
  }, [s]), /* @__PURE__ */ a(
    "div",
    {
      className: "relative p-0 border-r bg-content focus:outline-none",
      style: { width: g.width },
      ref: c,
      onClick: V,
      onFocus: V,
      onDoubleClick: j,
      tabIndex: 0,
      onKeyDown: D,
      role: "gridcell",
      children: /* @__PURE__ */ x(
        "div",
        {
          className: U(
            "w-full rounded-sm min-h-full focus:outline-none",
            (s === "focused" || s === "editing") && "ring-2 ring-blue-500 absolute top-0 z-10"
          ),
          children: [
            /* @__PURE__ */ a(
              C,
              {
                rowId: e,
                colId: t,
                initData: n,
                data: n,
                options: g.options,
                updateColumn: p,
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
            s === "editing" && l && /* @__PURE__ */ a("div", { className: "text-xs p-1.5 py-2", children: l })
          ]
        }
      )
    }
  );
}
function as(e, t) {
  if (e == null || e === "")
    return "(empty)";
  switch (t.type) {
    case "select": {
      const n = t.options.find((r) => r.value === e);
      return /* @__PURE__ */ a(ce, { color: n.color, name: n.name });
    }
    case "date":
      return Me(new Date(Date.parse(e)));
    default:
      return e;
  }
}
function us({ groupVal: e }) {
  const [t] = k(Se), n = W(
    () => {
      var i;
      return he(((i = t[0]) == null ? void 0 : i.columnId) || "");
    },
    [t]
  ), [r] = k(n), [o, l] = k(Mt);
  return /* @__PURE__ */ x(
    "div",
    {
      className: U(
        "w-full h-16 bg-header rounded-t-md border flex",
        o[e] && "rounded-b-md"
      ),
      children: [
        /* @__PURE__ */ a(
          "div",
          {
            className: "h-full flex items-center justify-center w-16",
            onClick: () => l((i) => ({ ...i, [e]: !i[e] })),
            children: /* @__PURE__ */ a(Oo, { className: "w-4 h-4" })
          }
        ),
        /* @__PURE__ */ x("div", { className: "h-full p-1.5", children: [
          /* @__PURE__ */ a("div", { className: "text-xs tracking-wider uppercase font-medium text-secondary", children: r.name }),
          /* @__PURE__ */ a("div", { className: "flex mt-1", children: as(e, r) })
        ] })
      ]
    }
  );
}
function ds({ groupVal: e }) {
  const [t] = k(Se), [, n] = k(Tn);
  function r(o) {
    o.preventDefault();
    const l = { data: {} };
    t.length > 0 && (l[t[0].columnId] = e), n({ id: Qe(), ...l });
  }
  return /* @__PURE__ */ a(
    "div",
    {
      onClick: r,
      className: U(
        "rs-btn h-8 border-b border-r font-normal text-sm cursor-pointer flex items-center hover:bg-hover bg-content",
        t.length > 0 && "border-l rounded-b-md"
      ),
      tabIndex: 0,
      children: /* @__PURE__ */ a("div", { className: "flex items-center justify-center", style: { width: 63 }, children: /* @__PURE__ */ a(Bn, { className: "w-4 h-4" }) })
    }
  );
}
function fs({ rowId: e, first: t, last: n, groupVal: r }) {
  const [o] = k(Se), [l] = k(Mt), [i] = k(mo), [c] = k(ne);
  return /* @__PURE__ */ x(
    "div",
    {
      className: U(
        t && o.length > 0 && "mt-8",
        o.length > 0 && "ml-4"
      ),
      style: { width: i },
      children: [
        o.length > 0 && t && /* @__PURE__ */ a(us, { groupVal: r }),
        !l[r] && /* @__PURE__ */ x(X, { children: [
          /* @__PURE__ */ a("div", { className: U(o.length > 0 && "border-l"), children: /* @__PURE__ */ a(ms, { rowId: e }) }),
          c.addRow.enabled && c.addRow.body && n && /* @__PURE__ */ a(ds, { groupVal: r }),
          " "
        ] })
      ]
    }
  );
}
const ms = Je.memo(hs);
function hs({ rowId: e }) {
  const t = W(() => Mn(e), [e]), [n, r] = k(t), [o] = k(se), [l] = k(Pt), [i] = k(ne), c = W(
    () => (u) => (s) => {
      r({ [u]: s });
    },
    [r]
  );
  return /* @__PURE__ */ x("div", { className: U("flex relative border-b"), style: { height: l }, children: [
    i.selectRow.enabled && /* @__PURE__ */ a(
      "div",
      {
        className: U(
          "border-r bg-content flex items-center justify-center"
        ),
        style: { width: 64 },
        children: /* @__PURE__ */ a(
          Ht,
          {
            checked: n.isSelected || !1,
            toggle: () => r((u) => ({ isSelected: !u.isSelected }))
          }
        )
      }
    ),
    o.map((u) => /* @__PURE__ */ a(
      ss,
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
const ps = Cn(({ handleScroll: e }, t) => {
  const [n] = k(De), [r] = k(ne);
  return /* @__PURE__ */ a(
    "div",
    {
      className: "h-[calc(100%-65px)] overflow-auto border-b bg-background",
      onScroll: e,
      ref: t,
      children: /* @__PURE__ */ x("div", { className: "flex flex-row", children: [
        /* @__PURE__ */ x("div", { className: "flex flex-col", children: [
          n.map((o, l) => /* @__PURE__ */ a(
            fs,
            {
              rowId: o.id,
              first: o.first,
              last: o.last,
              groupVal: o.groupVal
            },
            o.id
          )),
          r.addRow.enabled && /* @__PURE__ */ a("div", { className: "h-48 shrink-0 grow" })
        ] }),
        r.addColumn.enabled && /* @__PURE__ */ a("div", { className: "w-48 shrink-0 grow" })
      ] })
    }
  );
}), gs = ps, pr = [
  {
    type: "empty",
    name: "Empty",
    atomFactory: (e) => Jt(e, (t) => ge(t))
  },
  {
    type: "filled",
    name: "Filled",
    atomFactory: (e) => Jt(e, (t) => !ge(t))
  },
  {
    type: "unique",
    name: "Unique",
    atomFactory: Qr
  }
];
function wn(e) {
  return pr.find((t) => t.type === e);
}
function vs() {
  return pr.map((e) => e.type);
}
const ws = Cn(({}, e) => {
  const [t] = k(se), [n] = k(Se);
  return /* @__PURE__ */ a("div", { className: "bg-header h-8", children: /* @__PURE__ */ x("div", { className: "h-8 flex relative", ref: e, children: [
    /* @__PURE__ */ a(
      "div",
      {
        style: { width: 64 },
        className: U(n.length > 0 && "ml-4", "shrink-0 border-r")
      }
    ),
    t.map((r) => /* @__PURE__ */ a(ys, { colId: r }, r)),
    /* @__PURE__ */ a("div", { className: "w-48 grow shrink-0" })
  ] }) });
}), bs = ws;
function ys({ colId: e }) {
  const t = W(() => he(e), [e]), [n, r] = k(t), o = wn(n.summary), l = W(
    () => o ? o.atomFactory(n.id) : P(""),
    [o, n.id]
  ), [i] = k(l), c = vs(), [u, s] = B(!1);
  function f(d) {
    r({ summary: d }), s(!1);
  }
  return /* @__PURE__ */ x(
    re,
    {
      isOpen: u,
      setIsOpen: s,
      click: !0,
      placement: "top-end",
      portal: !0,
      portalId: "table-footer",
      children: [
        /* @__PURE__ */ a(
          "div",
          {
            style: { width: n.width },
            className: U(
              "hover:bg-hover-light -mr-[1px] h-full flex items-center justify-end text-sm relative group px-2 cursor-default",
              u && "bg-hover"
            ),
            children: o ? /* @__PURE__ */ x(X, { children: [
              /* @__PURE__ */ a("span", { className: "text-xs text-secondary", children: o.name }),
              /* @__PURE__ */ a("span", { className: "ml-1", children: i })
            ] }) : /* @__PURE__ */ x(X, { children: [
              /* @__PURE__ */ a(Hn, { className: "w-4 h-4 hidden group-hover:block" }),
              /* @__PURE__ */ a("span", { className: "hidden group-hover:block text-xs ml-1", children: "Summary" })
            ] })
          }
        ),
        /* @__PURE__ */ x($, { children: [
          /* @__PURE__ */ a("div", { className: "w-32" }),
          /* @__PURE__ */ x($.Section, { children: [
            /* @__PURE__ */ a(
              $.Section.Button,
              {
                onClick: () => {
                  f("");
                },
                children: /* @__PURE__ */ a("span", { className: "text-secondary", children: "None" })
              }
            ),
            c.map((d) => {
              const g = wn(d);
              return /* @__PURE__ */ a(
                $.Section.Button,
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
function xs({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ h.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ h.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ h.createElement("path", {
    fillRule: "evenodd",
    d: "M12 2.25a.75.75 0 0 1 .75.75v16.19l6.22-6.22a.75.75 0 1 1 1.06 1.06l-7.5 7.5a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 1 1 1.06-1.06l6.22 6.22V3a.75.75 0 0 1 .75-.75Z",
    clipRule: "evenodd"
  }));
}
const Cs = h.forwardRef(xs), Rs = Cs;
function Es({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ h.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ h.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ h.createElement("path", {
    fillRule: "evenodd",
    d: "M11.47 2.47a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 1 1-1.06 1.06l-6.22-6.22V21a.75.75 0 0 1-1.5 0V4.81l-6.22 6.22a.75.75 0 1 1-1.06-1.06l7.5-7.5Z",
    clipRule: "evenodd"
  }));
}
const Ss = h.forwardRef(Es), Ns = Ss;
function ks({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ h.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ h.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ h.createElement("path", {
    fillRule: "evenodd",
    d: "M6.97 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1-1.06 1.06L8.25 4.81V16.5a.75.75 0 0 1-1.5 0V4.81L3.53 8.03a.75.75 0 0 1-1.06-1.06l4.5-4.5Zm9.53 4.28a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V7.5a.75.75 0 0 1 .75-.75Z",
    clipRule: "evenodd"
  }));
}
const As = h.forwardRef(ks), bn = As;
function Os({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ h.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ h.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ h.createElement("path", {
    fillRule: "evenodd",
    d: "M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z",
    clipRule: "evenodd"
  }));
}
const Ds = h.forwardRef(Os), Wt = Ds;
function Ms({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ h.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ h.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ h.createElement("path", {
    fillRule: "evenodd",
    d: "M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z",
    clipRule: "evenodd"
  }));
}
const Ts = h.forwardRef(Ms), Ls = Ts;
function Is({
  title: e,
  titleId: t,
  ...n
}, r) {
  return /* @__PURE__ */ h.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: r,
    "aria-labelledby": t
  }, n), e ? /* @__PURE__ */ h.createElement("title", {
    id: t
  }, e) : null, /* @__PURE__ */ h.createElement("path", {
    fillRule: "evenodd",
    d: "M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z",
    clipRule: "evenodd"
  }));
}
const Ps = h.forwardRef(Is), ct = Ps;
function Fs({ colId: e, supportedTypes: t }) {
  const [n] = k(W(() => he(e), [e])), [, r] = k(bo), o = W(() => tt(e), [e]), [, l] = k(o);
  function i(c, u) {
    c.preventDefault(), r({ colId: n.id, type: u }), l(!1);
  }
  return /* @__PURE__ */ a($, { children: /* @__PURE__ */ x($.Section, { children: [
    /* @__PURE__ */ a("div", { className: "w-56" }),
    /* @__PURE__ */ a($.Section.Item, { children: /* @__PURE__ */ a("span", { className: "uppercase font-medium text-secondary text-xs", children: "Property Type" }) }),
    t.map((c) => /* @__PURE__ */ x(
      $.Section.Button,
      {
        onClick: (u) => {
          i(u, c.type);
        },
        children: [
          /* @__PURE__ */ a(c.icon, { className: "w-4 h-4 mr-2" }),
          /* @__PURE__ */ a("span", { children: c.name })
        ]
      },
      c.name
    ))
  ] }) });
}
function kt({ ...e }) {
  return /* @__PURE__ */ a(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...e,
      children: /* @__PURE__ */ a(
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
function Vs({
  colId: e,
  sortCallback: t,
  filterCallback: n,
  deleteCallback: r
}) {
  const [o, l] = k(W(() => he(e), [e])), i = ae(), c = o.type === "custom" ? o.icon : Ge(o.type).icon, u = o.type === "custom" ? "Custom" : Ge(o.type).name, [, s] = k(In), [, f] = k(Pn), d = W(() => tt(e), [e]), [, g] = k(d), [p] = k(ne), C = W(() => [...is(), ...p.extraColumnTypes], []);
  Z(() => {
    i.current && i.current.select();
  }, [i]);
  function R(v) {
    v.preventDefault(), l({ name: v.target.value });
  }
  function w(v) {
    v.code;
  }
  function b(v) {
    v.preventDefault(), r(o), g(!1);
  }
  function D(v) {
    v.preventDefault(), v.stopPropagation(), t([{ columnId: o.id, order: "asc" }]), s(!0), g(!1);
  }
  function V(v) {
    v.preventDefault(), v.stopPropagation(), t([{ columnId: o.id, order: "desc" }]), s(!0), g(!1);
  }
  function j(v) {
    v.preventDefault(), v.stopPropagation(), n([{ columnId: o.id, type: "contains", value: "" }]), f(!0), g(!1);
  }
  const A = [
    [
      {
        name: "Sort Ascending",
        icon: Ns,
        action: D,
        enabled: p.sorting.enabled
      },
      {
        name: "Sort Descending",
        icon: Rs,
        action: V,
        enabled: p.sorting.enabled
      },
      {
        name: "Filter",
        icon: kt,
        action: j,
        enabled: p.filtering.enabled
      }
    ],
    [
      {
        name: "Delete",
        icon: Ls,
        action: b,
        disabled: o.is_primary === "true" || o.is_primary === !0,
        enabled: p.deleteColumns.enabled
      }
    ]
  ], [_, L] = B(!1), [m, S] = B(null);
  if (_)
    return /* @__PURE__ */ a(Fs, { colId: e, supportedTypes: C });
  if (m !== null) {
    const v = p.extraColumnHeaderPopupActions[m];
    return /* @__PURE__ */ a(v.popup, { column: o, setColumn: l, close: () => g(!1) });
  }
  return /* @__PURE__ */ x($, { children: [
    /* @__PURE__ */ a("div", { className: "w-56" }),
    /* @__PURE__ */ x($.Section, { children: [
      /* @__PURE__ */ a($.Section.Item, { children: /* @__PURE__ */ a(
        "input",
        {
          value: o.name,
          onChange: R,
          ref: i,
          onKeyDown: w,
          className: "rs-input focus:outline-none focus:ring rounded rounded-2 p-1 border w-full mb-2"
        }
      ) }),
      /* @__PURE__ */ a($.Section.Item, { children: /* @__PURE__ */ a("span", { className: "uppercase font-medium text-secondary text-xs", children: "Property Type" }) }),
      /* @__PURE__ */ x($.Section.Button, { onClick: () => L(!0), children: [
        c && /* @__PURE__ */ a(c, { className: "w-4 h-4 mr-2" }),
        u
      ] }),
      p.extraColumnHeaderPopupActions.map((v, y) => ({ popupAction: v, index: y })).filter(({ popupAction: v }) => v.section === "main").map(({ popupAction: v, index: y }) => /* @__PURE__ */ a(v.menuItem, { column: o, showPopup: () => {
        S(y);
      } }, y))
    ] }),
    A.map(
      (v, y) => v.findIndex((E) => E.enabled === !0) !== -1 && /* @__PURE__ */ x($.Section, { children: [
        v.map(
          (E) => E.enabled && /* @__PURE__ */ x(
            $.Section.Button,
            {
              onClick: E.action,
              disabled: E.disabled,
              children: [
                /* @__PURE__ */ a(E.icon, { className: "w-4 h-4 mr-2" }),
                /* @__PURE__ */ a("span", { children: E.name })
              ]
            },
            E.name
          )
        ),
        p.extraColumnHeaderPopupActions.filter((E) => E.section === "actions" + (y + 1)).map((E, I) => /* @__PURE__ */ a(E.menuItem, { column: o, showPopup: () => {
          S(I);
        } }, I))
      ] }, v[0].name)
    )
  ] });
}
function js({
  colId: e,
  deleteCallback: t,
  sortCallback: n,
  filterCallback: r
}) {
  const [o, l] = k(W(() => he(e), [e])), i = o.type === "custom" ? o.icon : Ge(o.type).icon, [c, u] = B(o.width), [s, f] = B(!1), d = W(() => tt(e), [e]), [g, p] = k(d), [C] = k(ne);
  function R(w) {
    w.preventDefault();
    const b = w.pageX, D = c;
    f(!0);
    function V(j) {
      const A = Math.max(
        128,
        D + j.pageX - b
      );
      u(A), l({ width: A });
    }
    window.addEventListener("mousemove", V), window.addEventListener("mouseup", () => {
      window.removeEventListener("mousemove", V), f(!1);
    });
  }
  return /* @__PURE__ */ x("div", { className: "relative", children: [
    /* @__PURE__ */ x(
      re,
      {
        isOpen: C.editColumns.enabled && o.isEditable && g && o.type !== "custom",
        setIsOpen: p,
        portal: !0,
        children: [
          /* @__PURE__ */ x(
            "div",
            {
              className: "p-1 px-2 font-normal flex items-center border-r hover:bg-hover-light h-8",
              style: { width: c },
              children: [
                i && /* @__PURE__ */ a(i, { className: "w-4 h-4 mr-2 shrink-0" }),
                /* @__PURE__ */ a("span", { className: "whitespace-nowrap truncate", children: o.name })
              ]
            }
          ),
          /* @__PURE__ */ a(
            Vs,
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
    /* @__PURE__ */ a(
      "div",
      {
        className: U(
          "h-full w-[5px] hover:bg-blue-500/30 absolute -right-[3px] top-0 cursor-ew-resize z-10",
          s && "bg-blue-500/30"
        ),
        onMouseDown: R,
        role: "none"
      }
    )
  ] });
}
const _s = Je.forwardRef((e, t) => {
  const [n] = k(se), [r] = k(go), o = Ot(vo), [l] = k(Lt), [i] = k(Se), [, c] = k(uo), [, u] = k(Fn), [, s] = k(jn), f = Y(
    (w) => {
      s({ filtering: w });
    },
    [s]
  ), d = Y(
    (w) => {
      u({ sorting: w });
    },
    [u]
  ), [, g] = k(fo), p = Y((w) => {
    if (l.find((b) => b.columnId === w.id)) {
      const b = l.filter((D) => D.columnId !== w.id);
      d(b);
    }
    g({ id: w.id });
  });
  function C(w) {
    w.preventDefault(), c({
      id: Qe(),
      name: `Column-${vt()}`,
      type: "text",
      width: 192,
      position: n.length,
      isVisible: !0,
      isEditable: !0
    });
  }
  const [R] = k(ne);
  return /* @__PURE__ */ a("div", { className: "flex bg-header border-b z-10", children: /* @__PURE__ */ x("div", { className: "flex relative h-8", ref: t, children: [
    /* @__PURE__ */ x(
      "div",
      {
        className: U(
          "h-8 text-sm inline-flex flex-row",
          i.length > 0 && "ml-[17px]"
        ),
        children: [
          R.selectRow.enabled && /* @__PURE__ */ a(
            "div",
            {
              className: "border-r px-4 flex items-center justify-center h-8",
              style: { width: 64 },
              children: /* @__PURE__ */ a(Ht, { checked: r, toggle: o })
            }
          ),
          n.map((w) => /* @__PURE__ */ a(
            js,
            {
              colId: w,
              sortCallback: d,
              filterCallback: f,
              deleteCallback: p
            },
            w
          )),
          R.addColumn.enabled && /* @__PURE__ */ a(
            "div",
            {
              onClick: C,
              className: "rs-btn h-8 p-1 cursor-pointer border-r hover:bg-hover-light font-normal w-16 flex items-center justify-center",
              "aria-label": "add-column",
              onKeyDown: (w) => {
                w.code === "Enter" && C(w);
              },
              children: /* @__PURE__ */ a(Wt, { className: "w-4 h-4" })
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ a("div", { className: "w-32 shrink-0 grow" })
  ] }) });
}), $s = _s;
function Bs(e, t) {
  let n = null;
  return (...r) => {
    window.clearTimeout(n), n = window.setTimeout(() => {
      e.apply(null, r);
    }, t);
  };
}
const Hs = [
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
  options: e = Hs,
  value: t = {},
  onSelect: n
}) {
  const [r, o] = B(!1), [l, i] = B(t), c = e.find((s) => s.value === l.value);
  function u(s) {
    i(s), o(!1), n == null || n(s);
  }
  return /* @__PURE__ */ a("div", { className: "w-full relative", children: /* @__PURE__ */ x(
    re,
    {
      isOpen: r,
      setIsOpen: o,
      offset: 4,
      portal: !0,
      children: [
        /* @__PURE__ */ x("div", { className: "rs-btn flex flex-row relative w-full border rounded p-1 pl-2 items-center hover:bg-hover focus:outline-none cursor-default", children: [
          /* @__PURE__ */ a("div", { className: "text-ellipsis flex-grow text-left whitespace-nowrap overflow-hidden", children: l.name ? /* @__PURE__ */ a("span", { children: l.name }) : /* @__PURE__ */ a("span", { className: "text-secondary", children: "Select" }) }),
          /* @__PURE__ */ a(si, { className: "w-4 h-4 duration-100 ml-auto" })
        ] }),
        /* @__PURE__ */ a("div", { className: "min-w-full w-max focus:outline-none", children: /* @__PURE__ */ x($, { children: [
          /* @__PURE__ */ a("div", { className: "w-48" }),
          /* @__PURE__ */ a($.Section, { children: e.map((s) => /* @__PURE__ */ x(
            $.Section.Button,
            {
              onClick: () => {
                u(s);
              },
              children: [
                /* @__PURE__ */ a("span", { children: s.name }),
                /* @__PURE__ */ a("span", { className: "ml-auto", children: c.value === s.value && /* @__PURE__ */ a(Ft, { className: "w-4 h-4" }) })
              ]
            },
            s.value
          )) })
        ] }) })
      ]
    }
  ) });
}
function Ws({ columns: e, filter: t, setFilter: n }) {
  const [r, o] = B(null), l = [
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
  const c = W(
    () => Bs((s, f) => {
      n((d) => {
        const g = d.findIndex((p) => p.id === s.id);
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
  return /* @__PURE__ */ x($, { children: [
    /* @__PURE__ */ a("div", { className: "w-56" }),
    t.length > 0 ? /* @__PURE__ */ x($.Section, { children: [
      /* @__PURE__ */ a("h3", { className: "text-sm mb-3 px-3 font-medium", children: "Filter By" }),
      /* @__PURE__ */ a("div", { className: "px-3 flex flex-col space-y-3", children: t.map((s) => /* @__PURE__ */ x(
        "div",
        {
          className: "flex flex-row space-x-2",
          children: [
            /* @__PURE__ */ a("div", { className: "w-36", children: /* @__PURE__ */ a(
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
                  const g = d.findIndex((p) => p.id === s.id);
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
            /* @__PURE__ */ a("div", { className: "w-28", children: /* @__PURE__ */ a(
              Ee,
              {
                options: u(s.columnId) === "number" ? i : l,
                value: u(s.columnId) === "number" ? i.find(
                  (f) => f.value === s.type
                ) : l.find((f) => f.value === s.type),
                onSelect: (f) => n((d) => {
                  const g = d.findIndex((p) => p.id === s.id);
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
            /* @__PURE__ */ a("div", { className: "w-36", children: /* @__PURE__ */ a(
              "input",
              {
                type: "text",
                className: "rs-input border h-full rounded w-full focus:outline-none focus:ring px-2 p-1",
                defaultValue: s.value,
                placeholder: "Type a value...",
                onChange: (f) => c(s, f.target.value)
              }
            ) }),
            /* @__PURE__ */ a(
              "div",
              {
                className: "rs-btn flex items-center justify-center hover:bg-hover-light px-2 rounded hover:cursor-pointer",
                onClick: () => n((f) => f.filter((d) => d.id !== s.id)),
                "aria-label": "cancel-filter",
                children: /* @__PURE__ */ a(ct, { className: "h-4 w-4" })
              }
            )
          ]
        },
        `filter-${s.columnId}`
      )) }),
      /* @__PURE__ */ a("div", { className: "py-2 px-3", children: /* @__PURE__ */ x(
        "button",
        {
          className: "rs-btn flex items-center justify-center bg-transparent rounded gap-x-1 h-6 font-thin hover:cursor-pointer text-sm p-0",
          onClick: () => n((s) => [
            ...s,
            {
              id: vt(),
              columnId: e[0].id,
              type: "contains",
              value: ""
            }
          ]),
          "aria-label": "add-condition",
          type: "button",
          children: [
            /* @__PURE__ */ a(Wt, { className: "h-3 w-3" }),
            /* @__PURE__ */ a("span", { children: "Add condition" })
          ]
        }
      ) })
    ] }) : /* @__PURE__ */ a(
      Ve,
      {
        options: e.map((s) => ({
          value: s.id,
          name: s.name
        })),
        onSelect: (s) => n([
          {
            id: vt(),
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
function Us({ setFilter: e }) {
  const [t] = k(Vn), [n] = k(io), [r, o] = k(Pn);
  return /* @__PURE__ */ x(
    re,
    {
      isOpen: r,
      setIsOpen: o,
      offset: 4,
      portal: !0,
      portalId: "table",
      children: [
        Object.keys(t).length > 0 ? /* @__PURE__ */ x("div", { className: "rs-btn h-8 hover:ring-2 hover:ring-black/10 hover:ring-inset bg-indigo-200 px-3 rounded text-sm flex row items-center cursor-default text-dark", children: [
          /* @__PURE__ */ a(kt, { className: "w-4 h-4 mr-1" }),
          /* @__PURE__ */ a("span", { children: `Filtered by ${Object.keys(t).length} field` })
        ] }) : /* @__PURE__ */ x(
          "div",
          {
            className: U(
              "rs-btn h-8 hover:bg-hover px-3 rounded text-sm flex flex-row items-center cursor-default",
              r && "bg-hover"
            ),
            children: [
              /* @__PURE__ */ a(kt, { className: "w-4 h-4 mr-1" }),
              /* @__PURE__ */ a("span", { children: "Filter data" })
            ]
          }
        ),
        /* @__PURE__ */ a(Ws, { columns: n, filter: t, setFilter: e })
      ]
    }
  );
}
function yn({ ...e }) {
  return /* @__PURE__ */ a(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...e,
      children: /* @__PURE__ */ a(
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
function Ks({ columns: e, grouping: t, setGroup: n }) {
  const [r, o] = B(null), l = [
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
  }, [r]), /* @__PURE__ */ x($, { children: [
    /* @__PURE__ */ a("div", { className: "w-56" }),
    t.length > 0 ? /* @__PURE__ */ x($.Section, { children: [
      /* @__PURE__ */ a("h3", { className: "text-sm mb-3 px-3 font-medium", children: "Group By" }),
      /* @__PURE__ */ a("div", { className: "px-3", children: t.map((i) => /* @__PURE__ */ x(
        "div",
        {
          className: "flex flex-row space-x-2",
          children: [
            /* @__PURE__ */ a("div", { className: "w-36", children: /* @__PURE__ */ a(
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
            /* @__PURE__ */ a("div", { className: "w-28", children: /* @__PURE__ */ a(
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
            /* @__PURE__ */ a(
              "div",
              {
                className: "rs-btn flex items-center justify-center hover:bg-hover-light px-2 rounded",
                onClick: () => n([]),
                "aria-label": "cancel-grouping",
                children: /* @__PURE__ */ a(ct, { className: "h-4 w-4" })
              }
            )
          ]
        },
        `grouping-${i.columnId}`
      )) })
    ] }) : /* @__PURE__ */ a(
      Ve,
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
function Zs({ grouping: e = [], setGroup: t }) {
  const [n, r] = B(!1), [o] = k(Ln);
  return /* @__PURE__ */ x(
    re,
    {
      isOpen: n,
      setIsOpen: r,
      offset: 4,
      portal: !0,
      portalId: "table",
      children: [
        e.length > 0 ? /* @__PURE__ */ x("div", { className: "rs-btn h-8 hover:ring-2 hover:ring-black/10 hover:ring-inset bg-purple-200 px-3 rounded text-sm flex row items-center cursor-default text-dark", children: [
          /* @__PURE__ */ a(yn, { className: "w-4 h-4 mr-1" }),
          /* @__PURE__ */ a("span", { children: "Grouped by 1 field" })
        ] }) : /* @__PURE__ */ x(
          "div",
          {
            className: U(
              "rs-btn hover:bg-hover px-3 rounded flex flex-row items-center h-8 cursor-default",
              n && "bg-hover"
            ),
            children: [
              /* @__PURE__ */ a(yn, { className: "w-4 h-4 mr-1" }),
              /* @__PURE__ */ a("span", { children: "Group" })
            ]
          }
        ),
        /* @__PURE__ */ a(Ks, { columns: o, grouping: e, setGroup: t })
      ]
    }
  );
}
function qs({ value: e, setValue: t }) {
  return /* @__PURE__ */ x(X, { children: [
    /* @__PURE__ */ a("input", { type: "checkbox", checked: e, className: "hidden", readOnly: !0 }),
    /* @__PURE__ */ a(
      "div",
      {
        className: U(
          "rs-btn rounded-full w-7 h-4 flex items-center cursor-pointer border transition duration-200 ease-in-out",
          e ? "bg-green-500 border-black/10" : "bg-background"
        ),
        onClick: () => t(!e),
        "aria-label": "toggle",
        children: /* @__PURE__ */ a(
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
function zs({ colId: e }) {
  const [t, n] = k(W(() => he(e), [e]));
  return /* @__PURE__ */ x($.Section.Item, { children: [
    /* @__PURE__ */ a(
      qs,
      {
        value: t.isVisible,
        setValue: (r) => n({ isVisible: r })
      }
    ),
    /* @__PURE__ */ a("span", { className: "ml-2", children: t.name })
  ] }, t.id);
}
function Ys({ setColumnVisibility: e }) {
  const [t] = k(lo);
  return /* @__PURE__ */ x($, { children: [
    /* @__PURE__ */ a("div", { className: "w-48" }),
    /* @__PURE__ */ a($.Section, { children: t.map((n) => /* @__PURE__ */ a(zs, { colId: n })) })
  ] });
}
function Xs({ setColumnVisibility: e }) {
  const [t, n] = B(!1), [r] = k(so);
  return /* @__PURE__ */ x(re, { isOpen: t, setIsOpen: n, offset: 4, portal: !0, children: [
    r > 0 ? /* @__PURE__ */ x("div", { className: "rs-btn h-8 hover:ring-2 hover:ring-black/10 hover:ring-inset bg-green-200 px-3 rounded text-sm flex row items-center focus:outline-none cursor-default text-dark", children: [
      /* @__PURE__ */ a(Qt, { className: "w-4 h-4 mr-1" }),
      /* @__PURE__ */ a("span", { children: `${r} hidden fields` })
    ] }) : /* @__PURE__ */ x(
      "div",
      {
        className: U(
          "rs-btn hover:bg-hover px-3 rounded flex flex-row items-center h-8 focus:outline-none cursor-default",
          t && "bg-hover"
        ),
        children: [
          /* @__PURE__ */ a(Qt, { className: "w-4 h-4 mr-1" }),
          /* @__PURE__ */ a("span", { children: "Hide fields" })
        ]
      }
    ),
    /* @__PURE__ */ a(Ys, { setColumnVisibility: e })
  ] });
}
function Gs({ ...e }) {
  return /* @__PURE__ */ a(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...e,
      children: /* @__PURE__ */ a(
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
function Js({ ...e }) {
  return /* @__PURE__ */ a(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...e,
      children: /* @__PURE__ */ a(
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
function Qs({ ...e }) {
  return /* @__PURE__ */ a(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...e,
      children: /* @__PURE__ */ a(
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
function ec({ ...e }) {
  return /* @__PURE__ */ a(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      ...e,
      children: /* @__PURE__ */ a(
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
const gr = [
  {
    value: 32,
    name: "Short",
    icon: Gs
  },
  {
    value: 64,
    name: "Medium",
    icon: Js
  },
  {
    value: 96,
    name: "Tall",
    icon: Qs
  },
  {
    value: 128,
    name: "Extra Tall",
    icon: ec
  }
];
function vr(e) {
  return gr.find((t) => t.value === e);
}
function tc() {
  return gr.map((e) => e.value);
}
function nc({ height: e, setHeight: t }) {
  const n = tc();
  return /* @__PURE__ */ x($, { children: [
    /* @__PURE__ */ a("div", { className: "w-48" }),
    /* @__PURE__ */ a($.Section, { children: n.map((r) => {
      const o = vr(r);
      return /* @__PURE__ */ x(
        $.Section.Button,
        {
          onClick: () => t(o.value),
          children: [
            /* @__PURE__ */ a(o.icon, { className: "w-4 h-4 mr-2" }),
            o.name,
            o.value === e && /* @__PURE__ */ a(Ft, { className: "w-4 h-4 ml-auto" })
          ]
        },
        o.value
      );
    }) })
  ] });
}
function rc({ height: e, setHeight: t }) {
  const [n, r] = B(!1), o = vr(e);
  return /* @__PURE__ */ x(
    re,
    {
      isOpen: n,
      setIsOpen: r,
      offset: 4,
      portal: !0,
      portalId: "table",
      children: [
        /* @__PURE__ */ a(
          "div",
          {
            className: U(
              "rs-btn hover:bg-hover px-3 rounded flex flex-row items-center h-8 focus:outline-none cursor-default",
              n && "bg-hover"
            ),
            "aria-label": "height-selector",
            children: /* @__PURE__ */ a(o.icon, { className: "w-4 h-4 mr-1" })
          }
        ),
        /* @__PURE__ */ a(nc, { height: e, setHeight: t })
      ]
    }
  );
}
function oc({ active: e, Icon: t, text: n, bgColor: r }) {
  return /* @__PURE__ */ x(
    "div",
    {
      className: U(
        "rs-btn h-8 hover:ring-2 hover:ring-black/10 hover:ring-inset bg-orange-200 px-3 rounded flex items-center gap-x-1 cursor-default text-dark",
        r && r
      ),
      children: [
        t && /* @__PURE__ */ a(t, { className: "w-4 h-4" }),
        /* @__PURE__ */ a("span", { children: n })
      ]
    }
  );
}
function ic({ sort: e, setSort: t }) {
  const [n, r] = B(null), [o] = k(Ln), l = [
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
  }, [n]), /* @__PURE__ */ x($, { children: [
    /* @__PURE__ */ a("div", { className: "w-56" }),
    e.length > 0 ? /* @__PURE__ */ x($.Section, { children: [
      /* @__PURE__ */ a("h3", { className: "text-sm mb-3 px-3 font-medium", children: "Sort By" }),
      /* @__PURE__ */ a("div", { className: "px-3", children: e.map((i) => /* @__PURE__ */ x(
        "div",
        {
          className: "flex flex-row space-x-2",
          children: [
            /* @__PURE__ */ a("div", { className: "w-36", children: /* @__PURE__ */ a(
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
            /* @__PURE__ */ a("div", { className: "w-28", children: /* @__PURE__ */ a(
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
            /* @__PURE__ */ a(
              "div",
              {
                className: "rs-btn flex items-center justify-center hover:bg-hover-light px-2 rounded",
                onClick: () => t([]),
                "aria-label": "cancel-sort",
                children: /* @__PURE__ */ a(ct, { className: "h-4 w-4" })
              }
            )
          ]
        },
        `sort-${i.columnId}`
      )) })
    ] }) : /* @__PURE__ */ a(
      Ve,
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
function lc({ setSort: e }) {
  const [t] = k(Lt), [n, r] = k(In);
  return /* @__PURE__ */ x(
    re,
    {
      isOpen: n,
      setIsOpen: r,
      offset: 4,
      portal: !0,
      portalId: "table",
      children: [
        t.length > 0 ? /* @__PURE__ */ a(
          oc,
          {
            Icon: bn,
            text: `Sorted by ${Object.keys(t).length} field`,
            customColor: "bg-orange-200"
          }
        ) : /* @__PURE__ */ x(
          "div",
          {
            className: U(
              "rs-btn hover:bg-hover px-3 rounded flex flex-row items-center h-8 cursor-default",
              n && "bg-hover"
            ),
            children: [
              /* @__PURE__ */ a(bn, { className: "w-4 h-4 mr-1" }),
              /* @__PURE__ */ a("span", { children: "Sort data" })
            ]
          }
        ),
        /* @__PURE__ */ a(ic, { sort: t, setSort: e })
      ]
    }
  );
}
function sc() {
  const [e] = k(oo), [t] = k(Vn), [n] = k(Lt), [r] = k(Se), [o] = k(Pt), [l] = k(ro), [, i] = k(jn), c = Ot(wo), [, u] = k(eo), [, s] = k(Tn), [, f] = k(to), [d] = k(ne), [g] = k(Xr), p = Y((_) => {
    i({ filtering: _ });
  }, []), C = Y((_) => {
    _.preventDefault(), u();
  }, []);
  function R(_) {
    s({ id: Qe() });
  }
  const [, w] = k(Fn), b = Y((_) => {
    w({ sorting: _ });
  }, []), [, D] = k(po), V = Y((_) => {
    D({ rowHeight: _ });
  }, []), [, j] = k(ho), A = Y((_) => {
    j({ grouping: _ });
  }, []);
  return /* @__PURE__ */ a(
    "div",
    {
      className: "w-full bg-content py-2 text-sm overflow-y-hidden h-12 relative border-b",
      id: "toolbar",
      children: /* @__PURE__ */ x("div", { className: "flex flex-row space-x-2 px-3 items-center whitespace-nowrap h-full", children: [
        /* @__PURE__ */ x("div", { className: "items-center flex w-20 justify-center", children: [
          l > 0 ? l : "No",
          " row",
          l !== 1 && "s"
        ] }),
        e > 0 && /* @__PURE__ */ x("div", { className: "bg-header flex flex-row rounded items-center h-8 cursor-default", children: [
          /* @__PURE__ */ x("div", { className: "text-sm px-2 rounded-l", children: [
            e,
            " row",
            e !== 1 && "s",
            " selected"
          ] }),
          /* @__PURE__ */ a("div", { className: "bg-content h-4 w-px last:hidden" }),
          /* @__PURE__ */ x(
            "div",
            {
              className: "rs-btn self-stretch hover:bg-hover-light px-2 text-sm flex flex-row items-center",
              onClick: () => c(),
              children: [
                /* @__PURE__ */ a(ct, { className: "w-4 h-4 mr-1" }),
                /* @__PURE__ */ a("span", { children: "Cancel" })
              ]
            }
          ),
          /* @__PURE__ */ a("div", { className: "bg-content h-4 w-px last:hidden" }),
          /* @__PURE__ */ x(
            "div",
            {
              className: "rs-btn self-stretch hover:bg-hover-light px-2 rounded-r text-sm flex flex-row items-center",
              onClick: C,
              children: [
                /* @__PURE__ */ a(zo, { className: "w-4 h-4 mr-1" }),
                /* @__PURE__ */ a("span", { children: "Delete" })
              ]
            }
          ),
          /* @__PURE__ */ a("div", { className: "bg-content h-4 w-px last:hidden" }),
          d.rowSelectionButtons.map((_) => /* @__PURE__ */ x(X, { children: [
            /* @__PURE__ */ a(
              "div",
              {
                className: "rs-btn self-stretch hover:bg-hover-light px-2 rounded-r text-sm flex flex-row items-center",
                onClick: () => f({
                  handler: _.handler
                }),
                children: _.body
              }
            ),
            /* @__PURE__ */ a("div", { className: "bg-content h-4 w-px last:hidden" })
          ] }))
        ] }),
        /* @__PURE__ */ a("div", { className: "h-4 border" }),
        d.addRow.enabled && d.addRow.toolbar && /* @__PURE__ */ x(
          "div",
          {
            className: "rs-btn hover:bg-hover px-3 rounded flex flex-row items-center h-8 focus:outline-none",
            onClick: R,
            children: [
              /* @__PURE__ */ a(Wt, { className: "w-4 h-4 mr-1" }),
              /* @__PURE__ */ a("span", { children: "New row" })
            ]
          }
        ),
        d.hideFields.enabled && /* @__PURE__ */ a(Xs, {}),
        d.filtering.enabled && /* @__PURE__ */ a(Us, { filter: t, setFilter: p }),
        d.grouping.enabled && /* @__PURE__ */ a(Zs, { grouping: r, setGroup: A }),
        d.sorting.enabled && /* @__PURE__ */ a(lc, { sort: n, setSort: b }),
        d.rowHeight.enabled && /* @__PURE__ */ a(rc, { height: o, setHeight: V }),
        g && /* @__PURE__ */ a(X, { children: /* @__PURE__ */ x("div", { title: `ID of this table is ${g} - you can use it in formulas`, style: { marginLeft: "auto" }, className: "text-slate-400 text-sm", children: [
          "#",
          g
        ] }) })
      ] })
    }
  );
}
const cc = {
  light: "",
  dark: "dark"
};
function ac() {
  const e = ae(null), t = ae(null), n = ae(null), [r] = k(ne);
  Z(() => {
    if (!n.current)
      return () => null;
    function i(c) {
      e.current.scrollLeft = n.current.scrollLeft, e.current.style.transform = `translate3d(-${n.current.scrollLeft}px, 0, 0)`, t.current && (t.current.style.transform = `translate3d(-${n.current.scrollLeft}px, 0, 0)`);
    }
    n.current.addEventListener("scroll", i);
  }, []), Z(() => {
    if (!e.current)
      return () => null;
    function i(c) {
      c.preventDefault(), n.current.scrollLeft += c.deltaX;
    }
    e.current.addEventListener("mousewheel", i, {
      passive: !1
    });
  }, []), Z(() => {
    if (!t.current)
      return () => null;
    function i(c) {
      c.preventDefault(), n.current.scrollLeft += c.deltaX;
    }
    t.current.addEventListener("mousewheel", i, {
      passive: !1
    });
  }, []);
  const [o, l] = k(Dn);
  return Z(() => {
    l(Qe());
  }, []), /* @__PURE__ */ x(
    "div",
    {
      className: U(
        "h-full w-full relative rs-table text-sm text-primary overflow-hidden",
        cc[r.theme.color]
      ),
      id: o,
      children: [
        r.toolbar.enabled && /* @__PURE__ */ a(sc, {}),
        /* @__PURE__ */ x("div", { className: "h-[calc(100%-48px)] overflow-hidden", children: [
          /* @__PURE__ */ a($s, { ref: e }),
          /* @__PURE__ */ a(gs, { ref: n }),
          r.footer.enabled && /* @__PURE__ */ a(bs, { ref: t })
        ] })
      ]
    }
  );
}
function uc({ data: e, columns: t, onChange: n, config: r, tableNpi: o, children: l }) {
  return Vr([
    [ao, t],
    [no, e],
    [Jr, { onChange: n }],
    [Yr, r],
    [Gr, o]
  ]), l;
}
function vc({
  data: e,
  columns: t,
  onChange: n = () => null,
  config: r = {},
  licenseKey: o,
  tableNpi: l = void 0
}) {
  return /* @__PURE__ */ a(Lr, { children: /* @__PURE__ */ a(
    uc,
    {
      data: e,
      columns: t,
      onChange: n,
      config: r,
      tableNpi: l,
      children: /* @__PURE__ */ a(ac, {})
    }
  ) });
}
export {
  gc as EVALUATION_LICENSE,
  vc as default
};
