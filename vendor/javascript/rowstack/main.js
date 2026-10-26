import "./main.css";
import { jsxs as x, jsx as u, Fragment as Z } from "react/jsx-runtime";
import * as N from "react";
import Te, { createContext as Ko, useRef as ae, createElement as $e, useCallback as J, useContext as Go, useReducer as zo, useEffect as z, useDebugValue as qo, forwardRef as Kt, useMemo as H, useState as V, useLayoutEffect as Wn, Children as Yo } from "react";
import * as Kn from "react-dom";
const ce = { BASE_URL: "/", DEV: !1, MODE: "production", PROD: !0, SSR: !1 };
function Gn(e) {
  return "init" in e;
}
function At(e) {
  return !!e.write;
}
function Xo(e) {
  return !!e.onMount;
}
function dn(e) {
  return "v" in e || "e" in e;
}
function Xe(e) {
  if ("e" in e)
    throw e.e;
  if ((ce ? "production" : void 0) !== "production" && !("v" in e))
    throw new Error("[Bug] atom state is not initialized");
  return e.v;
}
function Je(e) {
  return typeof (e == null ? void 0 : e.then) == "function";
}
function zn(e, t, n) {
  if (!n.p.has(e)) {
    n.p.add(e);
    const o = () => n.p.delete(e);
    t.then(o, o);
  }
}
function qn(e, t, n) {
  const o = n.get(e), r = o == null ? void 0 : o.t, i = t.p;
  if (!(r != null && r.size))
    return i;
  if (!i.size)
    return r;
  const s = new Set(r);
  for (const l of i)
    s.add(l);
  return s;
}
const Jo = (e, t, ...n) => t.read(...n), Zo = (e, t, ...n) => t.write(...n), Qo = (e, t) => {
  var n;
  return (n = t.INTERNAL_onInit) == null ? void 0 : n.call(t, e);
}, er = (e, t, n) => {
  var o;
  return (o = t.onMount) == null ? void 0 : o.call(t, n);
}, tr = (e, t) => {
  var n;
  const o = X(e), r = o[0], i = o[6], s = o[9];
  if ((ce ? "production" : void 0) !== "production" && !t)
    throw new Error("Atom is undefined or null");
  let l = r.get(t);
  return l || (l = { d: /* @__PURE__ */ new Map(), p: /* @__PURE__ */ new Set(), n: 0 }, r.set(t, l), (n = i.i) == null || n.call(i, t), s == null || s(e, t)), l;
}, nr = (e) => {
  var t;
  const n = X(e), o = n[1], r = n[3], i = n[4], s = n[5], l = n[6], a = n[13];
  if (!l.f && !r.size && !i.size && !s.size)
    return;
  const c = [], d = (f) => {
    try {
      f();
    } catch (h) {
      c.push(h);
    }
  };
  do {
    l.f && d(l.f);
    const f = /* @__PURE__ */ new Set();
    for (const h of r) {
      const m = (t = o.get(h)) == null ? void 0 : t.l;
      if (m)
        for (const w of m)
          f.add(w);
    }
    r.clear();
    for (const h of s)
      f.add(h);
    s.clear();
    for (const h of i)
      f.add(h);
    i.clear();
    for (const h of f)
      d(h);
    r.size && a(e);
  } while (r.size || s.size || i.size);
  if (c.length)
    throw new AggregateError(c);
}, or = (e) => {
  const t = X(e), n = t[1], o = t[2], r = t[3], i = t[11], s = t[14], l = t[17];
  if (!r.size)
    return;
  const a = [], c = [], d = /* @__PURE__ */ new WeakSet(), f = /* @__PURE__ */ new WeakSet(), h = [], m = [];
  for (const w of r)
    h.push(w), m.push(i(e, w));
  for (; h.length; ) {
    const w = h.length - 1, p = h[w], g = m[w];
    if (f.has(p)) {
      h.pop(), m.pop();
      continue;
    }
    if (d.has(p)) {
      if (o.get(p) === g.n)
        a.push(p), c.push(g);
      else if ((ce ? "production" : void 0) !== "production" && o.has(p))
        throw new Error("[Bug] invalidated atom exists");
      f.add(p), h.pop(), m.pop();
      continue;
    }
    d.add(p);
    for (const v of qn(p, g, n))
      d.has(v) || (h.push(v), m.push(i(e, v)));
  }
  for (let w = a.length - 1; w >= 0; --w) {
    const p = a[w], g = c[w];
    let v = !1;
    for (const y of g.d.keys())
      if (y !== p && r.has(y)) {
        v = !0;
        break;
      }
    v && (o.set(p, g.n), s(e, p), l(e, p)), o.delete(p);
  }
}, Et = /* @__PURE__ */ new WeakSet(), rr = (e, t) => {
  var n, o;
  const r = X(e), i = r[1], s = r[2], l = r[3], a = r[6], c = r[7], d = r[11], f = r[12], h = r[13], m = r[14], w = r[16], p = r[17], g = r[20], v = r[26], y = r[28], b = d(e, t), E = y[0];
  if (dn(b)) {
    if (
      // If the atom is mounted, we can use cached atom state,
      // because it should have been updated by dependencies.
      // We can't use the cache if the atom is invalidated.
      i.has(t) && s.get(t) !== b.n || // If atom is not mounted, we can use cached atom state,
      // only if store hasn't been mutated.
      b.m === E
    )
      return b.m = E, b;
    let R = !1;
    for (const [P, $] of b.d)
      if (m(e, P).n !== $) {
        R = !0;
        break;
      }
    if (!R)
      return b.m = E, b;
  }
  let k = !0;
  const D = new Set(b.d.keys()), O = () => {
    for (const R of D)
      b.d.delete(R);
  }, I = () => {
    if (i.has(t)) {
      const R = !l.size;
      p(e, t), R && (h(e), f(e));
    }
  }, F = (R) => {
    var P;
    if (R === t) {
      const T = d(e, R);
      if (!dn(T))
        if (Gn(R))
          g(e, R, R.init);
        else
          throw new Error("no atom init");
      return Xe(T);
    }
    const $ = m(e, R);
    try {
      return Xe($);
    } finally {
      D.delete(R), b.d.set(R, $.n), Je(b.v) && zn(t, b.v, $), i.has(t) && ((P = i.get(R)) == null || P.t.add(t)), k || I();
    }
  };
  let S, _;
  const B = {
    get signal() {
      return S || (S = new AbortController()), S.signal;
    },
    get setSelf() {
      return (ce ? "production" : void 0) !== "production" && console.warn(
        "[DEPRECATED] setSelf is deprecated and will be removed in v3."
      ), (ce ? "production" : void 0) !== "production" && !At(t) && console.warn("setSelf function cannot be used with read-only atom"), !_ && At(t) && (_ = (...R) => {
        if ((ce ? "production" : void 0) !== "production" && k && console.warn("setSelf function cannot be called in sync"), !k)
          try {
            return w(e, t, ...R);
          } finally {
            h(e), f(e);
          }
      }), _;
    }
  }, Y = b.n, q = s.get(t) === Y;
  try {
    (ce ? "production" : void 0) !== "production" && Et.delete(e);
    const R = c(e, t, F, B);
    if ((ce ? "production" : void 0) !== "production" && Et.has(e) && console.warn(
      "Detected store mutation during atom read. This is not supported."
    ), g(e, t, R), Je(R)) {
      v(e, R, () => S == null ? void 0 : S.abort());
      const P = () => {
        O(), I();
      };
      R.then(P, P);
    } else
      O();
    return (n = a.r) == null || n.call(a, t), b.m = E, b;
  } catch (R) {
    return delete b.v, b.e = R, ++b.n, b.m = E, b;
  } finally {
    k = !1, b.n !== Y && q && (s.set(t, b.n), l.add(t), (o = a.c) == null || o.call(a, t));
  }
}, sr = (e, t) => {
  const n = X(e), o = n[1], r = n[2], i = n[11], s = [t];
  for (; s.length; ) {
    const l = s.pop(), a = i(e, l);
    for (const c of qn(l, a, o)) {
      const d = i(e, c);
      r.get(c) !== d.n && (r.set(c, d.n), s.push(c));
    }
  }
}, ir = (e, t, ...n) => {
  const o = X(e), r = o[3], i = o[6], s = o[8], l = o[11], a = o[12], c = o[13], d = o[14], f = o[15], h = o[16], m = o[17], w = o[20], p = o[28];
  let g = !0;
  const v = (b) => Xe(d(e, b)), y = (b, ...E) => {
    var k;
    const D = l(e, b);
    try {
      if (b === t) {
        if (!Gn(b))
          throw new Error("atom not writable");
        (ce ? "production" : void 0) !== "production" && Et.add(e);
        const O = D.n, I = E[0];
        w(e, b, I), m(e, b), O !== D.n && (++p[0], r.add(b), f(e, b), (k = i.c) == null || k.call(i, b));
        return;
      } else
        return h(e, b, ...E);
    } finally {
      g || (c(e), a(e));
    }
  };
  try {
    return s(e, t, v, y, ...n);
  } finally {
    g = !1;
  }
}, lr = (e, t) => {
  var n;
  const o = X(e), r = o[1], i = o[3], s = o[6], l = o[11], a = o[15], c = o[18], d = o[19], f = l(e, t), h = r.get(t);
  if (h && f.d.size > 0) {
    for (const [m, w] of f.d)
      if (!h.d.has(m)) {
        const p = l(e, m);
        c(e, m).t.add(t), h.d.add(m), w !== p.n && (i.add(m), a(e, m), (n = s.c) == null || n.call(s, m));
      }
    for (const m of h.d)
      if (!f.d.has(m)) {
        h.d.delete(m);
        const w = d(e, m);
        w == null || w.t.delete(t);
      }
  }
}, cr = (e, t) => {
  var n;
  const o = X(e), r = o[1], i = o[4], s = o[6], l = o[10], a = o[11], c = o[12], d = o[13], f = o[14], h = o[16], m = o[18], w = a(e, t);
  let p = r.get(t);
  if (!p) {
    f(e, t);
    for (const g of w.d.keys())
      m(e, g).t.add(t);
    if (p = {
      l: /* @__PURE__ */ new Set(),
      d: new Set(w.d.keys()),
      t: /* @__PURE__ */ new Set()
    }, r.set(t, p), At(t) && Xo(t)) {
      const g = () => {
        let v = !0;
        const y = (...b) => {
          try {
            return h(e, t, ...b);
          } finally {
            v || (d(e), c(e));
          }
        };
        try {
          const b = l(e, t, y);
          b && (p.u = () => {
            v = !0;
            try {
              b();
            } finally {
              v = !1;
            }
          });
        } finally {
          v = !1;
        }
      };
      i.add(g);
    }
    (n = s.m) == null || n.call(s, t);
  }
  return p;
}, ar = (e, t) => {
  var n, o;
  const r = X(e), i = r[1], s = r[5], l = r[6], a = r[11], c = r[19], d = a(e, t);
  let f = i.get(t);
  if (!f || f.l.size)
    return f;
  let h = !1;
  for (const m of f.t)
    if ((n = i.get(m)) != null && n.d.has(t)) {
      h = !0;
      break;
    }
  if (!h) {
    f.u && s.add(f.u), f = void 0, i.delete(t);
    for (const m of d.d.keys()) {
      const w = c(e, m);
      w == null || w.t.delete(t);
    }
    (o = l.u) == null || o.call(l, t);
    return;
  }
  return f;
}, ur = (e, t, n) => {
  const o = X(e), r = o[11], i = o[27], s = r(e, t), l = "v" in s, a = s.v;
  if (Je(n))
    for (const c of s.d.keys())
      zn(
        t,
        n,
        r(e, c)
      );
  s.v = n, delete s.e, (!l || !Object.is(a, s.v)) && (++s.n, Je(a) && i(e, a));
}, dr = (e, t) => {
  const n = X(e)[14];
  return Xe(n(e, t));
}, fr = (e, t, ...n) => {
  const o = X(e), r = o[3], i = o[12], s = o[13], l = o[16], a = r.size;
  try {
    return l(e, t, ...n);
  } finally {
    r.size !== a && (s(e), i(e));
  }
}, mr = (e, t, n) => {
  const o = X(e), r = o[12], i = o[18], s = o[19], a = i(e, t).l;
  return a.add(n), r(e), () => {
    a.delete(n), s(e, t), r(e);
  };
}, hr = (e, t, n) => {
  const r = X(e)[25];
  let i = r.get(t);
  if (!i) {
    i = /* @__PURE__ */ new Set(), r.set(t, i);
    const s = () => r.delete(t);
    t.then(s, s);
  }
  i.add(n);
}, pr = (e, t) => {
  const r = X(e)[25].get(t);
  r == null || r.forEach((i) => i());
}, Yn = /* @__PURE__ */ new WeakMap(), X = (e) => {
  const t = Yn.get(e);
  if ((ce ? "production" : void 0) !== "production" && !t)
    throw new Error(
      "Store must be created by buildStore to read its building blocks"
    );
  return t;
};
function gr(e) {
  const t = X(e), n = t[24];
  return n ? n(t) : t;
}
function vr(...e) {
  const t = {
    get(o) {
      const r = X(t)[21];
      return r(t, o);
    },
    set(o, ...r) {
      const i = X(t)[22];
      return i(t, o, ...r);
    },
    sub(o, r) {
      const i = X(t)[23];
      return i(t, o, r);
    }
  }, n = [
    // store state
    /* @__PURE__ */ new WeakMap(),
    // atomStateMap
    /* @__PURE__ */ new WeakMap(),
    // mountedMap
    /* @__PURE__ */ new WeakMap(),
    // invalidatedAtoms
    /* @__PURE__ */ new Set(),
    // changedAtoms
    /* @__PURE__ */ new Set(),
    // mountCallbacks
    /* @__PURE__ */ new Set(),
    // unmountCallbacks
    {},
    // storeHooks
    // atom interceptors
    Jo,
    Zo,
    Qo,
    er,
    // building-block functions
    tr,
    nr,
    or,
    rr,
    sr,
    ir,
    lr,
    cr,
    ar,
    ur,
    dr,
    fr,
    mr,
    void 0,
    // abortable promise support
    /* @__PURE__ */ new WeakMap(),
    // abortHandlersMap
    hr,
    pr,
    // store epoch
    [0]
  ].map((o, r) => e[r] || o);
  return Yn.set(t, Object.freeze(n)), t;
}
const Xn = {};
let br = 0;
function A(e, t) {
  const n = `atom${++br}`, o = {
    toString() {
      return (Xn ? "production" : void 0) !== "production" && this.debugLabel ? n + ":" + this.debugLabel : n;
    }
  };
  return typeof e == "function" ? o.read = e : (o.init = e, o.read = wr, o.write = yr), t && (o.write = t), o;
}
function wr(e) {
  return e(this);
}
function yr(e, t, n) {
  return t(
    this,
    typeof n == "function" ? n(e(this)) : n
  );
}
function Jn() {
  return vr();
}
let Le;
function xr() {
  return Le || (Le = Jn(), (Xn ? "production" : void 0) !== "production" && (globalThis.__JOTAI_DEFAULT_STORE__ || (globalThis.__JOTAI_DEFAULT_STORE__ = Le), globalThis.__JOTAI_DEFAULT_STORE__ !== Le && console.warn(
    "Detected multiple Jotai instances. It may cause unexpected behavior with the default store. https://github.com/pmndrs/jotai/discussions/2044"
  ))), Le;
}
const Sr = {}, Ot = Ko(
  void 0
);
function Gt(e) {
  return Go(Ot) || xr();
}
function Cr({
  children: e,
  store: t
}) {
  const n = ae(null);
  return t ? $e(Ot.Provider, { value: t }, e) : (n.current === null && (n.current = Jn()), $e(
    Ot.Provider,
    {
      // TODO: If this is not a false positive, consider using useState instead of useRef like https://github.com/pmndrs/jotai/pull/2771
      // eslint-disable-next-line react-hooks/refs
      value: n.current
    },
    e
  ));
}
const Dt = (e) => typeof (e == null ? void 0 : e.then) == "function", It = (e) => {
  e.status || (e.status = "pending", e.then(
    (t) => {
      e.status = "fulfilled", e.value = t;
    },
    (t) => {
      e.status = "rejected", e.reason = t;
    }
  ));
}, Nr = Te.use || // A shim for older React versions
((e) => {
  if (e.status === "pending")
    throw e;
  if (e.status === "fulfilled")
    return e.value;
  throw e.status === "rejected" ? e.reason : (It(e), e);
}), wt = /* @__PURE__ */ new WeakMap(), fn = (e, t, n) => {
  const r = gr(e)[26];
  let i = wt.get(t);
  return i || (i = new Promise((s, l) => {
    let a = t;
    const c = (h) => (m) => {
      a === h && s(m);
    }, d = (h) => (m) => {
      a === h && l(m);
    }, f = () => {
      try {
        const h = n();
        Dt(h) ? (wt.set(h, i), a = h, h.then(c(h), d(h)), r(e, h, f)) : s(h);
      } catch (h) {
        l(h);
      }
    };
    t.then(c(t), d(t)), r(e, t, f);
  }), wt.set(t, i)), i;
};
function kr(e, t) {
  const { delay: n, unstable_promiseStatus: o = !Te.use } = {}, r = Gt(), [[i, s, l], a] = zo(
    (d) => {
      const f = r.get(e);
      return Object.is(d[0], f) && d[1] === r && d[2] === e ? d : [f, r, e];
    },
    void 0,
    () => [r.get(e), r, e]
  );
  let c = i;
  if ((s !== r || l !== e) && (a(), c = r.get(e)), z(() => {
    const d = r.sub(e, () => {
      if (o)
        try {
          const f = r.get(e);
          Dt(f) && It(
            fn(r, f, () => r.get(e))
          );
        } catch {
        }
      if (typeof n == "number") {
        console.warn(`[DEPRECATED] delay option is deprecated and will be removed in v3.

Migration guide:

Create a custom hook like the following.

function useAtomValueWithDelay<Value>(
  atom: Atom<Value>,
  options: { delay: number },
): Value {
  const { delay } = options
  const store = useStore(options)
  const [value, setValue] = useState(() => store.get(atom))
  useEffect(() => {
    const unsub = store.sub(atom, () => {
      setTimeout(() => setValue(store.get(atom)), delay)
    })
    return unsub
  }, [store, atom, delay])
  return value
}
`), setTimeout(a, n);
        return;
      }
      a();
    });
    return a(), d;
  }, [r, e, n, o]), qo(c), Dt(c)) {
    const d = fn(
      r,
      c,
      () => r.get(e)
    );
    return o && It(d), Nr(d);
  }
  return c;
}
function it(e, t) {
  const n = Gt();
  return J(
    (...r) => {
      if ((Sr ? "production" : void 0) !== "production" && !("write" in e))
        throw new Error("not writable atom");
      return n.set(e, ...r);
    },
    [n, e]
  );
}
function C(e, t) {
  return [
    kr(e),
    // We do wrong type assertion here, which results in throwing an error.
    it(e)
  ];
}
const mn = /* @__PURE__ */ new WeakMap();
function Rr(e, t) {
  const n = Gt(), o = Ar(n);
  for (const [r, ...i] of e)
    o.has(r) || (o.add(r), n.set(r, ...i));
}
const Ar = (e) => {
  let t = mn.get(e);
  return t || (t = /* @__PURE__ */ new WeakSet(), mn.set(e, t)), t;
};
let Er = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict", Or = (e) => crypto.getRandomValues(new Uint8Array(e)), Dr = (e, t, n) => {
  let o = 256 - 256 % e.length;
  if (o === 256) {
    let i = e.length - 1;
    return (s = t) => {
      if (!s) return "";
      let l = "";
      for (; ; ) {
        let a = n(s), c = s;
        for (; c--; )
          if (l += e[a[c] & i], l.length >= s) return l;
      }
    };
  }
  let r = Math.ceil(1.6 * 256 * t / o);
  return (i = t) => {
    if (!i) return "";
    let s = "";
    for (; ; ) {
      let l = n(r), a = r;
      for (; a--; )
        if (l[a] < o && (s += e[l[a] % e.length], s.length >= i))
          return s;
    }
  };
}, Ir = (e, t = 21) => Dr(e, t | 0, Or), lt = (e = 21) => {
  let t = "", n = crypto.getRandomValues(new Uint8Array(e |= 0));
  for (; e--; )
    t += Er[n[e] & 63];
  return t;
};
const Tr = Ir(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  4
);
function Tt() {
  return Tr();
}
function Re(e) {
  return He(e) || e === "";
}
function He(e) {
  return e === null || e === void 0;
}
function U(...e) {
  return e.filter(Boolean).join(" ");
}
function Mt() {
  return `hsl(${Math.floor(Math.random() * 360)}, 100%, 92%)`;
}
function Mr(e, t, n) {
  if (n.length === 0)
    return 1;
  for (const o of n) {
    if (Re(e[o.columnId]))
      return 1;
    if (Re(t[o.columnId]))
      return -1;
    const r = e[o.columnId].toString().toLowerCase(), i = t[o.columnId].toString().toLowerCase();
    if (r < i)
      return o.order === "asc" ? -1 : 1;
    if (r > i)
      return o.order === "asc" ? 1 : -1;
  }
  return 0;
}
function _r(e, t) {
  if (t.length === 0)
    return !0;
  for (const n of t) {
    let o = e[n.columnId];
    switch (He(o) && (o = ""), typeof o == "number" && (o = o.toString()), o = o.toLowerCase(), n.type) {
      case "contains":
        if (!o.includes(n.value.toLowerCase())) return !1;
        break;
      case "does-not-contain":
        if (o.includes(n.value.toLowerCase())) return !1;
        break;
      case "is":
        if (o !== n.value.toLowerCase()) return !1;
        break;
      case "is-not":
        if (o === n.value.toLowerCase()) return !1;
        break;
      case "less-than":
        if (n.value !== "" && Number(o) >= Number(n.value))
          return !1;
        break;
      case "greater-than":
        if (n.value !== "" && Number(o) <= Number(n.value))
          return !1;
        break;
      case "equals":
        if (n.value !== "" && Number(o) !== Number(n.value))
          return !1;
        break;
    }
  }
  return !0;
}
const Zn = "update_column", Pr = "delete_column", Lr = "add_row", Br = "delete_rows", Fr = "update_row", Qn = "update_rows", Vr = "add_column", zt = (e, t) => e + t, eo = (e, t) => {
  if (e === void 0)
    return t;
  for (const n of Object.keys(t))
    t[n] instanceof Object && Object.assign(t[n], eo(e[n], t[n]));
  return Object.assign(e || {}, t), e;
}, _t = {
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
}, ct = A(_t), ie = A((e) => e(ct)), hn = A(null, (e, t, n) => {
  _t.rowSelectionButtons = [], t(ct, { ...eo(_t, n) });
}), to = A(""), se = A({ onChange: () => null }), $r = A(
  null,
  (e, t, n) => t(se, n)
);
A(null, (e, t, n) => {
  t(se, { onChange: n });
});
const j = A({}), jr = (e) => A((t) => new Set(Object.entries(t(j)).map(([n, o]) => o[e])).size), no = (e) => A(
  (t) => t(j)[e],
  (t, n, o) => {
    const r = typeof o == "function" ? o(t(no(e))) : o;
    n(j, (i) => ({
      ...i,
      [e]: { ...i[e], ...r }
    })), t(se).onChange({
      type: Fr,
      rowId: e,
      update: r
    });
  }
), xe = (e) => A(
  (t) => t(ee)[e],
  (t, n, o) => {
    const r = typeof o == "function" ? o(t(ee)[e]) : o;
    n(ee, (i) => ({
      ...i,
      [e]: { ...i[e], ...r }
    })), t(se).onChange({
      type: Zn,
      colId: e,
      update: r
    });
  }
), Hr = A(null, (e, t, n) => {
  const o = Object.entries(e(j)).filter(([, r]) => r.isSelected === !0).map(([r, i]) => r);
  t(
    j,
    Object.fromEntries(
      Object.entries(e(j)).filter(([, r]) => r.isSelected !== !0)
    )
  ), t(we, !1), e(se).onChange({
    type: Br,
    rows: [o]
  });
}), Ur = A(
  null,
  (e, t, n = { handler: () => null }) => {
    t(
      j,
      Object.fromEntries(
        n.handler(Object.entries(e(j)).map(([o, r]) => r)).map((o) => [o.id, o])
      )
    ), e(se).onChange({
      type: Qn,
      rows: n.handler(Object.entries(e(j)).map(([o, r]) => r)).map((o) => ({ rowId: o.id, update: o }))
    }), t(
      j,
      Object.fromEntries(
        Object.entries(e(j)).map(([o, r]) => [
          o,
          { ...r, isSelected: !1 }
        ])
      )
    ), t(we, !1);
  }
), Wr = A(null, (e, t, n) => {
  t(j, Object.fromEntries(n.map((o) => [o.id, o])));
}), oo = A(null, (e, t, n) => {
  t(j, (o) => ({
    ...o,
    [n.id]: n
  })), t(ut(n.id, e(pe)[0]), "editing"), e(se).onChange({ type: Lr, rowId: n.id, update: n });
}), Kr = A((e) => Object.keys(e(j)).length), Gr = A(
  (e) => e(we) ? Object.keys(e(j)).length : Object.entries(e(j)).map(([, t]) => t.isSelected === !0).reduce(zt, 0)
), qt = A({}), Fe = A((e) => Object.entries(e(j)).filter(([, t]) => _r(t, e(Jt))).sort(
  ([, t], [, n]) => Mr(t, n, [...e(je), ...e(Yt)])
).map(([t, n]) => ({
  id: t,
  groupVal: e(je).length === 0 ? "" : n[e(je)[0].columnId]
})).map((t, n, o) => ({
  id: t.id,
  first: n === 0 || t.groupVal !== o[n - 1].groupVal,
  last: n === o.length - 1 || t.groupVal !== o[n + 1].groupVal,
  groupVal: t.groupVal
}))), pn = A({}), at = (e) => A(
  (t) => t(pn)[e],
  (t, n, o) => n(pn, (r) => ({ ...r, [e]: o }))
), ee = A({}), pe = A(
  (e) => Object.entries(e(ee)).filter(([t, n]) => n.isVisible === !0).map(([t]) => t)
), ro = A(
  (e) => Object.entries(e(ee)).map(([t, n]) => n)
), zr = A(
  (e) => Object.entries(e(ee)).map(([t, n]) => n).filter((t) => t.type !== "custom")
), qr = A((e) => Object.keys(e(ee))), Yr = A(
  (e) => Object.entries(e(ee)).map(([, t]) => t.isVisible).reduce((t, n) => t + (n === !1), 0)
), Xr = {
  isVisible: !0,
  width: 192,
  type: "text",
  options: [],
  showOptionSearch: !0,
  isEditable: !0,
  isViewOnly: !1
}, Jr = A(null, (e, t, n) => {
  t(
    ee,
    Object.fromEntries(
      n.map((o) => ({ ...Xr, ...o })).map((o) => [o.id, o])
    )
  );
}), Zr = A(null, (e, t, n) => {
  t(ee, (o) => ({ ...o, [n.id]: n })), t(at(n.id), !0), e(se).onChange({
    type: Vr,
    colId: n.id,
    update: n
  });
}), Qr = A(null, (e, t, n) => {
  t(
    ee,
    (o) => Object.fromEntries(Object.entries(o).filter(([r]) => r !== n.id))
  ), e(se).onChange({ type: Pr, colId: n.id });
}), so = A((e) => Object.entries(e(ee)).filter(([t, n]) => n.isVisible === !0).map(([t, n]) => n.width).reduce(zt, e(ct).selectRow.enabled ? 64 : 0)), je = A([]), Me = A((e) => e(je)), es = A(null, (e, t, n) => {
  t(je, n.grouping), t(qt, {});
}), io = A(!1), lo = A(!1), Yt = A([]), Xt = A((e) => e(Yt)), co = A(null, (e, t, n) => {
  t(Yt, n.sorting);
}), Jt = A([]), ao = A((e) => e(Jt)), uo = A(null, (e, t, n) => {
  t(Jt, n.filtering);
}), fo = A(32), Zt = A((e) => e(fo)), ts = A(null, (e, t, n) => {
  t(fo, n.rowHeight);
}), we = A(!1), ns = A((e) => e(we)), os = A(null, (e, t, n) => {
  const o = e(we);
  t(we, !o), t(
    j,
    Object.fromEntries(
      Object.entries(e(j)).map(([r, i]) => [
        r,
        { ...i, isSelected: !o }
      ])
    )
  );
}), rs = A(null, (e, t, n) => {
  t(we, !1), t(
    j,
    Object.fromEntries(
      Object.entries(e(j)).map(([o, r]) => [
        o,
        { ...r, isSelected: !1 }
      ])
    )
  );
});
A(null, (e, t, n) => {
  t(we, n.value), t(
    j,
    Object.fromEntries(
      Object.entries(e(j)).map(([o, r]) => [
        o,
        { ...r, isSelected: n.value }
      ])
    )
  );
});
const mo = A(!1);
A((e) => e(mo));
A(null, (e, t, n) => {
  t(mo, n.dragging);
});
const gn = A({}), ut = (e, t) => A(
  (n) => {
    var o;
    return ((o = n(gn)[e]) == null ? void 0 : o[t]) || "none";
  },
  (n, o, r) => {
    o(gn, { [e]: { [t]: r } });
  }
), Qt = A(null, (e, t, n) => {
  t(ut(n.rowId, n.colId), n.value);
}), ss = A(null, (e, t, n) => {
  const { colId: o, type: r } = n;
  let { options: i, configuration: s } = e(ee)[o];
  const l = e(ct);
  let a = (c) => c;
  switch (r) {
    case "select": {
      i = [
        ...new Set(Object.entries(e(j)).map(([d, f]) => f[o]))
      ].filter((d) => !He(d) && d !== "").map((d) => ({
        value: d,
        name: d,
        color: Mt()
      }));
      break;
    }
    case "multiSelect": {
      i = [
        ...new Set(
          Object.entries(e(j)).flatMap(
            ([d, f]) => Re(f[o]) ? [] : f[o].split(",")
          )
        )
      ].filter((d) => !He(d) && d !== "").map((d) => ({
        value: d,
        name: d,
        color: Mt()
      }));
      break;
    }
    case "number": {
      a = (c) => c;
      break;
    }
    case "date": {
      a = (c) => l.parseDate !== void 0 ? c : Number.isNaN(Date.parse(c)) ? "" : new Date(Date.parse(c)).toISOString();
      break;
    }
    case "checkbox": {
      a = (c) => {
        var d, f, h;
        return ((h = (f = (d = c == null ? void 0 : c.toLowerCase) == null ? void 0 : d.call(c)) == null ? void 0 : f.trim) == null ? void 0 : h.call(f)) === "true";
      };
      break;
    }
  }
  t(xe(o), (c) => ({ ...c[o], type: r, options: i })), t(
    j,
    Object.fromEntries(
      Object.entries(e(j)).map(([c, d]) => [
        c,
        { ...d, [o]: a(d[o]) }
      ])
    )
  ), e(se).onChange({
    type: Zn,
    colId: o,
    update: { type: r, options: i }
  }), e(se).onChange({
    type: Qn,
    rows: Object.entries(e(j)).map(([c, d]) => ({
      rowId: c,
      update: { [o]: a(d[o]) }
    }))
  });
}), is = (e, t) => A(null, (n, o, r) => {
  const i = n(pe).findIndex((c) => c === t), s = n(Fe).findIndex(
    (c) => c.id === e
  );
  let l = e, a = t;
  switch (r) {
    case "left": {
      a = n(pe)[Math.max(0, i - 1)];
      break;
    }
    case "right": {
      a = n(pe)[Math.min(n(pe).length - 1, i + 1)];
      break;
    }
    case "up": {
      l = n(Fe).map((c) => c.id)[Math.max(0, s - 1)];
      break;
    }
    case "down": {
      l = n(Fe).map((c) => c.id)[Math.min(
        n(Fe).flatMap((c) => c.rowIds).length - 1,
        s + 1
      )];
      break;
    }
  }
  t === a && e === l || o(ut(l, a), "focused");
}), vn = (e, t) => A(
  (n) => Object.entries(n(j)).map(([o, r]) => r[e]).map(t).reduce(zt, 0)
);
/**
 * @license @tabler/icons-react v3.49.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */
var ls = {
  outline: {
    xmlns: "http://www.w3.org/2000/svg",
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round"
  },
  filled: {
    xmlns: "http://www.w3.org/2000/svg",
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "currentColor",
    stroke: "none"
  }
};
/**
 * @license @tabler/icons-react v3.49.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */
const W = (e, t, n, o) => {
  const r = Kt(
    ({
      color: i = "currentColor",
      size: s = 24,
      stroke: l = 2,
      title: a,
      className: c,
      children: d,
      ...f
    }, h) => $e(
      "svg",
      {
        ref: h,
        ...ls[e],
        width: s,
        height: s,
        className: ["tabler-icon", `tabler-icon-${t}`, c].filter(Boolean).join(" "),
        strokeWidth: l,
        stroke: i,
        ...f
      },
      [
        a && $e("title", { key: "svg-title" }, a),
        ...o.map(([m, w]) => $e(m, w)),
        ...Array.isArray(d) ? d : [d]
      ]
    )
  );
  return r.displayName = `${n}`, r;
};
/**
 * @license @tabler/icons-react v3.49.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */
const cs = [["path", { d: "M4 6l16 0", key: "svg-0" }], ["path", { d: "M4 12l10 0", key: "svg-1" }], ["path", { d: "M4 18l14 0", key: "svg-2" }]], as = W("outline", "align-left", "AlignLeft", cs);
/**
 * @license @tabler/icons-react v3.49.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */
const us = [["path", { d: "M12 5l0 14", key: "svg-0" }], ["path", { d: "M18 13l-6 6", key: "svg-1" }], ["path", { d: "M6 13l6 6", key: "svg-2" }]], ds = W("outline", "arrow-down", "ArrowDown", us);
/**
 * @license @tabler/icons-react v3.49.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */
const fs = [["path", { d: "M12 5l0 14", key: "svg-0" }], ["path", { d: "M18 11l-6 -6", key: "svg-1" }], ["path", { d: "M6 11l6 -6", key: "svg-2" }]], ms = W("outline", "arrow-up", "ArrowUp", fs);
/**
 * @license @tabler/icons-react v3.49.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */
const hs = [["path", { d: "M3 9l4 -4l4 4m-4 -4v14", key: "svg-0" }], ["path", { d: "M21 15l-4 4l-4 -4m4 4v-14", key: "svg-1" }]], bn = W("outline", "arrows-sort", "ArrowsSort", hs);
/**
 * @license @tabler/icons-react v3.49.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ps = [["path", { d: "M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12", key: "svg-0" }], ["path", { d: "M16 3v4", key: "svg-1" }], ["path", { d: "M8 3v4", key: "svg-2" }], ["path", { d: "M4 11h16", key: "svg-3" }], ["path", { d: "M11 15h1", key: "svg-4" }], ["path", { d: "M12 15v3", key: "svg-5" }]], gs = W("outline", "calendar", "Calendar", ps);
/**
 * @license @tabler/icons-react v3.49.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */
const vs = [["path", { d: "M5 12l5 5l10 -10", key: "svg-0" }]], en = W("outline", "check", "Check", vs);
/**
 * @license @tabler/icons-react v3.49.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */
const bs = [["path", { d: "M6 9l6 6l6 -6", key: "svg-0" }]], tn = W("outline", "chevron-down", "ChevronDown", bs);
/**
 * @license @tabler/icons-react v3.49.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ws = [["path", { d: "M15 6l-6 6l6 6", key: "svg-0" }]], ys = W("outline", "chevron-left", "ChevronLeft", ws);
/**
 * @license @tabler/icons-react v3.49.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */
const xs = [["path", { d: "M9 6l6 6l-6 6", key: "svg-0" }]], Ss = W("outline", "chevron-right", "ChevronRight", xs);
/**
 * @license @tabler/icons-react v3.49.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Cs = [["path", { d: "M15 11l-3 3l-3 -3", key: "svg-0" }], ["path", { d: "M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0 -18", key: "svg-1" }]], Ns = W("outline", "circle-chevron-down", "CircleChevronDown", Cs);
/**
 * @license @tabler/icons-react v3.49.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ks = [["path", { d: "M10.585 10.587a2 2 0 0 0 2.829 2.828", key: "svg-0" }], ["path", { d: "M16.681 16.673a8.717 8.717 0 0 1 -4.681 1.327c-3.6 0 -6.6 -2 -9 -6c1.272 -2.12 2.712 -3.678 4.32 -4.674m2.86 -1.146a9.055 9.055 0 0 1 1.82 -.18c3.6 0 6.6 2 9 6c-.666 1.11 -1.379 2.067 -2.138 2.87", key: "svg-1" }], ["path", { d: "M3 3l18 18", key: "svg-2" }]], wn = W("outline", "eye-off", "EyeOff", ks);
/**
 * @license @tabler/icons-react v3.49.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Rs = [["path", { d: "M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.414 4.414v7l-6 2v-8.5l-4.48 -4.928a2 2 0 0 1 -.52 -1.345v-2.227", key: "svg-0" }]], Pt = W("outline", "filter", "Filter", Rs);
/**
 * @license @tabler/icons-react v3.49.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */
const As = [["path", { d: "M5 9l14 0", key: "svg-0" }], ["path", { d: "M5 15l14 0", key: "svg-1" }], ["path", { d: "M11 4l-4 16", key: "svg-2" }], ["path", { d: "M17 4l-4 16", key: "svg-3" }]], Es = W("outline", "hash", "Hash", As);
/**
 * @license @tabler/icons-react v3.49.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Os = [["path", { d: "M4 6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -2", key: "svg-0" }], ["path", { d: "M4 16a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -2", key: "svg-1" }]], yn = W("outline", "layout-list", "LayoutList", Os);
/**
 * @license @tabler/icons-react v3.49.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Ds = [["path", { d: "M7 20v-12a4 4 0 0 1 4 -4h2a4 4 0 0 1 4 4v12", key: "svg-0" }], ["path", { d: "M7 13l10 0", key: "svg-1" }]], Is = W("outline", "letter-a", "LetterA", Ds);
/**
 * @license @tabler/icons-react v3.49.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Ts = [["path", { d: "M9 15l6 -6", key: "svg-0" }], ["path", { d: "M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464", key: "svg-1" }], ["path", { d: "M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463", key: "svg-2" }]], Ms = W("outline", "link", "Link", Ts);
/**
 * @license @tabler/icons-react v3.49.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */
const _s = [["path", { d: "M9 6l11 0", key: "svg-0" }], ["path", { d: "M9 12l11 0", key: "svg-1" }], ["path", { d: "M9 18l11 0", key: "svg-2" }], ["path", { d: "M5 6l0 .01", key: "svg-3" }], ["path", { d: "M5 12l0 .01", key: "svg-4" }], ["path", { d: "M5 18l0 .01", key: "svg-5" }]], Ps = W("outline", "list", "List", _s);
/**
 * @license @tabler/icons-react v3.49.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Ls = [["path", { d: "M12 5l0 14", key: "svg-0" }], ["path", { d: "M5 12l14 0", key: "svg-1" }]], We = W("outline", "plus", "Plus", Ls);
/**
 * @license @tabler/icons-react v3.49.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Bs = [["path", { d: "M8 9l4 -4l4 4", key: "svg-0" }], ["path", { d: "M16 15l-4 4l-4 -4", key: "svg-1" }]], Fs = W("outline", "selector", "Selector", Bs);
/**
 * @license @tabler/icons-react v3.49.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Vs = [["path", { d: "M3 5a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14", key: "svg-0" }], ["path", { d: "M9 12l2 2l4 -4", key: "svg-1" }]], $s = W("outline", "square-check", "SquareCheck", Vs);
/**
 * @license @tabler/icons-react v3.49.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */
const js = [["path", { d: "M18 16v2a1 1 0 0 1 -1 1h-11l6 -7l-6 -7h11a1 1 0 0 1 1 1v2", key: "svg-0" }]], Hs = W("outline", "sum", "Sum", js);
/**
 * @license @tabler/icons-react v3.49.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Us = [["path", { d: "M4 7l16 0", key: "svg-0" }], ["path", { d: "M10 11l0 6", key: "svg-1" }], ["path", { d: "M14 11l0 6", key: "svg-2" }], ["path", { d: "M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12", key: "svg-3" }], ["path", { d: "M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3", key: "svg-4" }]], ho = W("outline", "trash", "Trash", Us);
/**
 * @license @tabler/icons-react v3.49.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Ws = [["path", { d: "M18 6l-12 12", key: "svg-0" }], ["path", { d: "M6 6l12 12", key: "svg-1" }]], Ke = W("outline", "x", "X", Ws);
function Ve(e) {
  const t = e.getUTCMonth() + 1, n = e.getUTCDate(), o = e.getUTCFullYear();
  return `${t.toString().padStart(2, "0")}/${n.toString().padStart(2, "0")}/${o.toString().padStart(4, "0")}`;
}
function Ks({ tableConfiguration: e, name: t }) {
  const { theme: n = { color: "light" } } = e;
  return /* @__PURE__ */ u(
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
function ge({ name: e, color: t, onCancel: n }) {
  return /* @__PURE__ */ x(
    "div",
    {
      className: "rounded px-1.5 p-[1px] truncate whitespace-nowrap text-dark items-center flex cursor-default",
      style: { backgroundColor: t },
      children: [
        e,
        n && /* @__PURE__ */ u(Ke, { className: "w-4 h-4", onClick: n })
      ]
    }
  );
}
function nn({ checked: e, toggle: t, isViewOnly: n }) {
  return /* @__PURE__ */ x("div", { children: [
    /* @__PURE__ */ u(
      "input",
      {
        className: "hidden sr-only",
        type: "checkbox",
        checked: e,
        value: e,
        readOnly: !0
      }
    ),
    /* @__PURE__ */ u(
      "div",
      {
        className: U(
          "rounded border w-4 h-4 relative",
          e ? "bg-blue-500 after:content-['✓'] after:absolute after:left-1/2 after:top-1/2 after:text-inverted after:-translate-x-1/2 after:-translate-y-1/2 after:text-xs" : "bg-background"
        ),
        onClick: () => !n && t(),
        onKeyDown: (o) => {
          (o.key === "Enter" || o.key === " ") && t();
        }
      }
    )
  ] });
}
function Gs({ data: e, setData: t, focusState: n, isViewOnly: o }) {
  const r = H(() => e || !1, [e]);
  return /* @__PURE__ */ u(Z, { children: /* @__PURE__ */ u("span", { className: "flex items-center justify-center p-1.5", children: /* @__PURE__ */ u(
    nn,
    {
      checked: r,
      toggle: () => t(!r),
      isViewOnly: o
    }
  ) }) });
}
function zs(e, t) {
  const n = ae(t);
  z(() => {
    let o = !1;
    for (const r in t) {
      let i = t[r], s = n.current[r];
      if (i instanceof Date && (i = i.getTime()), s instanceof Date && (s = s.getTime()), i !== s) {
        o = !0;
        break;
      }
    }
    if (n.current = t, o)
      return e();
  }, t);
}
function L({ children: e, background: t }) {
  return /* @__PURE__ */ u("div", { className: "shadow-md border rounded rounded-2 text-sm bg-header", children: e });
}
function on({ children: e }) {
  return /* @__PURE__ */ u("div", { className: "border-b last:border-none", children: /* @__PURE__ */ u("div", { className: "py-3", children: e }) });
}
L.Section = on;
function qs({ children: e, ...t }) {
  return /* @__PURE__ */ u("div", { className: "px-3 py-1 flex items-center cursor-default", ...t, children: e });
}
function Ys({ children: e, disabled: t, ...n }) {
  return /* @__PURE__ */ u(
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
on.Item = qs;
on.Button = Ys;
const Xs = (e, t) => new Date(e, t + 1, 0).getDate(), Js = [
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
], Zs = [
  "first:col-start-1",
  "first:col-start-2",
  "first:col-start-3",
  "first:col-start-4",
  "first:col-start-5",
  "first:col-start-6",
  "first:col-start-7"
];
function Qs({
  value: e,
  onSelect: t
}) {
  const [n, o] = V(e || null), r = /* @__PURE__ */ new Date(), [i, s] = V(
    n ? n.getUTCMonth() : r.getUTCMonth()
  ), [l, a] = V(
    n ? n.getUTCFullYear() : r.getUTCFullYear()
  );
  z(() => {
    if (!e) {
      o(null);
      return;
    }
    o(e), s(e.getUTCMonth()), a(e.getUTCFullYear());
  }, [e]);
  const c = [...Array(Xs(l, i)).keys()], d = new Date(l, i, 1).getDay(), f = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  function h() {
    i === 0 ? (a((g) => g - 1), s(11)) : s((g) => g - 1);
  }
  function m() {
    i === 11 ? (a((g) => g + 1), s(0)) : s((g) => g + 1);
  }
  function w(g, v) {
    g.preventDefault();
    const y = /* @__PURE__ */ new Date();
    y.setUTCFullYear(l, i, v), o(y), t == null || t(y);
  }
  function p(g) {
    return n && n.getDate() === g && n.getMonth() === i && n.getFullYear() === l;
  }
  return /* @__PURE__ */ u("div", { className: "w-56", children: /* @__PURE__ */ x(L, { children: [
    /* @__PURE__ */ u(L.Section, { children: /* @__PURE__ */ x("div", { className: "flex px-2 items-center", children: [
      /* @__PURE__ */ x("div", { className: "grow text-left px-1", children: [
        Js[i],
        " ",
        l
      ] }),
      /* @__PURE__ */ u(
        "button",
        {
          type: "button",
          className: "rs-btn hover:bg-hover-light rounded p-1",
          onClick: h,
          "aria-label": "move-calendar-left",
          children: /* @__PURE__ */ u(ys, { className: "w-4 h-4" })
        }
      ),
      /* @__PURE__ */ u(
        "button",
        {
          type: "button",
          className: "rs-btn hover:bg-hover-light rounded p-1",
          onClick: m,
          "aria-label": "move-calendar-right",
          children: /* @__PURE__ */ u(Ss, { className: "w-4 h-4" })
        }
      )
    ] }) }),
    /* @__PURE__ */ x(L.Section, { children: [
      /* @__PURE__ */ u("div", { className: "grid grid-cols-7 text-sm px-2 gap-px mb-2", children: f.map((g) => /* @__PURE__ */ u(
        "div",
        {
          className: "text-secondary font-medium flex items-center justify-center",
          children: g
        },
        `wday-${g}`
      )) }),
      /* @__PURE__ */ u("div", { className: "grid grid-cols-7 text-sm px-2 gap-px", children: c.map((g) => /* @__PURE__ */ u(
        "button",
        {
          type: "button",
          className: U(
            "rs-btn p-0.5 rounded flex items-center justify-center col-span-1",
            Zs[d],
            !p(g + 1) && "hover:bg-hover-light",
            p(g + 1) && "bg-blue-500 text-inverted hover:bg-blue-500"
          ),
          onClick: (v) => {
            w(v, g + 1);
          },
          children: g + 1
        },
        `day-${g}`
      )) })
    ] })
  ] }) });
}
function dt() {
  return typeof window < "u";
}
function _e(e) {
  return po(e) ? (e.nodeName || "").toLowerCase() : "#document";
}
function te(e) {
  var t;
  return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function de(e) {
  var t;
  return (t = (po(e) ? e.ownerDocument : e.document) || window.document) == null ? void 0 : t.documentElement;
}
function po(e) {
  return dt() ? e instanceof Node || e instanceof te(e).Node : !1;
}
function G(e) {
  return dt() ? e instanceof Element || e instanceof te(e).Element : !1;
}
function re(e) {
  return dt() ? e instanceof HTMLElement || e instanceof te(e).HTMLElement : !1;
}
function Lt(e) {
  return !dt() || typeof ShadowRoot > "u" ? !1 : e instanceof ShadowRoot || e instanceof te(e).ShadowRoot;
}
function Ge(e) {
  const {
    overflow: t,
    overflowX: n,
    overflowY: o,
    display: r
  } = oe(e);
  return /auto|scroll|overlay|hidden|clip/.test(t + o + n) && r !== "inline" && r !== "contents";
}
function ei(e) {
  return /^(table|td|th)$/.test(_e(e));
}
function ft(e) {
  try {
    if (e.matches(":popover-open"))
      return !0;
  } catch {
  }
  try {
    return e.matches(":modal");
  } catch {
    return !1;
  }
}
const ti = /transform|translate|scale|rotate|perspective|filter/, ni = /paint|layout|strict|content/, Se = (e) => !!e && e !== "none";
let yt;
function rn(e) {
  const t = G(e) ? oe(e) : e;
  return Se(t.transform) || Se(t.translate) || Se(t.scale) || Se(t.rotate) || Se(t.perspective) || !mt() && (Se(t.backdropFilter) || Se(t.filter)) || ti.test(t.willChange || "") || ni.test(t.contain || "");
}
function oi(e) {
  let t = fe(e);
  for (; re(t) && !ye(t); ) {
    if (rn(t))
      return t;
    if (ft(t))
      return null;
    t = fe(t);
  }
  return null;
}
function mt() {
  return yt == null && (yt = typeof CSS < "u" && CSS.supports && CSS.supports("-webkit-backdrop-filter", "none")), yt;
}
function ye(e) {
  return /^(html|body|#document)$/.test(_e(e));
}
function oe(e) {
  return te(e).getComputedStyle(e);
}
function ht(e) {
  return G(e) ? {
    scrollLeft: e.scrollLeft,
    scrollTop: e.scrollTop
  } : {
    scrollLeft: e.scrollX,
    scrollTop: e.scrollY
  };
}
function fe(e) {
  if (_e(e) === "html")
    return e;
  const t = (
    // Step into the shadow DOM of the parent of a slotted node.
    e.assignedSlot || // DOM Element detected.
    e.parentNode || // ShadowRoot detected.
    Lt(e) && e.host || // Fallback.
    de(e)
  );
  return Lt(t) ? t.host : t;
}
function go(e) {
  const t = fe(e);
  return ye(t) ? e.ownerDocument ? e.ownerDocument.body : e.body : re(t) && Ge(t) ? t : go(t);
}
function be(e, t, n) {
  var o;
  t === void 0 && (t = []), n === void 0 && (n = !0);
  const r = go(e), i = r === ((o = e.ownerDocument) == null ? void 0 : o.body), s = te(r);
  if (i) {
    const l = Bt(s);
    return t.concat(s, s.visualViewport || [], Ge(r) ? r : [], l && n ? be(l) : []);
  } else
    return t.concat(r, be(r, [], n));
}
function Bt(e) {
  return e.parent && Object.getPrototypeOf(e.parent) ? e.frameElement : null;
}
function ri(e) {
  let t = e.activeElement;
  for (; ((n = t) == null || (n = n.shadowRoot) == null ? void 0 : n.activeElement) != null; ) {
    var n;
    t = t.shadowRoot.activeElement;
  }
  return t;
}
function Ft(e, t) {
  if (!e || !t)
    return !1;
  const n = t.getRootNode == null ? void 0 : t.getRootNode();
  if (e.contains(t))
    return !0;
  if (n && Lt(n)) {
    let o = t;
    for (; o; ) {
      if (e === o)
        return !0;
      o = o.parentNode || o.host;
    }
  }
  return !1;
}
function si() {
  return /apple/i.test(navigator.vendor);
}
function xn(e, t) {
  return ["mouse", "pen"].includes(e);
}
function ii(e) {
  return "nativeEvent" in e;
}
function li(e) {
  return e.matches("html,body");
}
function Vt(e) {
  return (e == null ? void 0 : e.ownerDocument) || document;
}
function xt(e, t) {
  if (t == null)
    return !1;
  if ("composedPath" in e)
    return e.composedPath().includes(t);
  const n = e;
  return n.target != null && t.contains(n.target);
}
function Be(e) {
  return "composedPath" in e ? e.composedPath()[0] : e.target;
}
const ci = "input:not([type='hidden']):not([disabled]),[contenteditable]:not([contenteditable='false']),textarea:not([disabled])";
function ai(e) {
  return re(e) && e.matches(ci);
}
const Ze = Math.min, Ne = Math.max, Qe = Math.round, qe = Math.floor, ue = (e) => ({
  x: e,
  y: e
}), ui = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom"
};
function Sn(e, t, n) {
  return Ne(e, Ze(t, n));
}
function pt(e, t) {
  return typeof e == "function" ? e(t) : e;
}
function Ae(e) {
  return e.split("-")[0];
}
function gt(e) {
  return e.split("-")[1];
}
function vo(e) {
  return e === "x" ? "y" : "x";
}
function bo(e) {
  return e === "y" ? "height" : "width";
}
function ve(e) {
  const t = e[0];
  return t === "t" || t === "b" ? "y" : "x";
}
function wo(e) {
  return vo(ve(e));
}
function di(e, t, n) {
  n === void 0 && (n = !1);
  const o = gt(e), r = wo(e), i = bo(r);
  let s = r === "x" ? o === (n ? "end" : "start") ? "right" : "left" : o === "start" ? "bottom" : "top";
  return t.reference[i] > t.floating[i] && (s = et(s)), [s, et(s)];
}
function fi(e) {
  const t = et(e);
  return [$t(e), t, $t(t)];
}
function $t(e) {
  return e.includes("start") ? e.replace("start", "end") : e.replace("end", "start");
}
const Cn = ["left", "right"], Nn = ["right", "left"], mi = ["top", "bottom"], hi = ["bottom", "top"];
function pi(e, t, n) {
  switch (e) {
    case "top":
    case "bottom":
      return n ? t ? Nn : Cn : t ? Cn : Nn;
    case "left":
    case "right":
      return t ? mi : hi;
    default:
      return [];
  }
}
function gi(e, t, n, o) {
  const r = gt(e);
  let i = pi(Ae(e), n === "start", o);
  return r && (i = i.map((s) => s + "-" + r), t && (i = i.concat(i.map($t)))), i;
}
function et(e) {
  const t = Ae(e);
  return ui[t] + e.slice(t.length);
}
function vi(e) {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...e
  };
}
function bi(e) {
  return typeof e != "number" ? vi(e) : {
    top: e,
    right: e,
    bottom: e,
    left: e
  };
}
function tt(e) {
  const {
    x: t,
    y: n,
    width: o,
    height: r
  } = e;
  return {
    width: o,
    height: r,
    top: n,
    left: t,
    right: t + o,
    bottom: n + r,
    x: t,
    y: n
  };
}
/*!
* tabbable 6.4.0
* @license MIT, https://github.com/focus-trap/tabbable/blob/master/LICENSE
*/
var wi = ["input:not([inert]):not([inert] *)", "select:not([inert]):not([inert] *)", "textarea:not([inert]):not([inert] *)", "a[href]:not([inert]):not([inert] *)", "button:not([inert]):not([inert] *)", "[tabindex]:not(slot):not([inert]):not([inert] *)", "audio[controls]:not([inert]):not([inert] *)", "video[controls]:not([inert]):not([inert] *)", '[contenteditable]:not([contenteditable="false"]):not([inert]):not([inert] *)', "details>summary:first-of-type:not([inert]):not([inert] *)", "details:not([inert]):not([inert] *)"], jt = /* @__PURE__ */ wi.join(","), yo = typeof Element > "u", Ue = yo ? function() {
} : Element.prototype.matches || Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector, nt = !yo && Element.prototype.getRootNode ? function(e) {
  var t;
  return e == null || (t = e.getRootNode) === null || t === void 0 ? void 0 : t.call(e);
} : function(e) {
  return e == null ? void 0 : e.ownerDocument;
}, ot = function(t, n) {
  var o;
  n === void 0 && (n = !0);
  var r = t == null || (o = t.getAttribute) === null || o === void 0 ? void 0 : o.call(t, "inert"), i = r === "" || r === "true", s = i || n && t && // closest does not exist on shadow roots, so we fall back to a manual
  // lookup upward, in case it is not defined.
  (typeof t.closest == "function" ? t.closest("[inert]") : ot(t.parentNode));
  return s;
}, yi = function(t) {
  var n, o = t == null || (n = t.getAttribute) === null || n === void 0 ? void 0 : n.call(t, "contenteditable");
  return o === "" || o === "true";
}, xi = function(t, n, o) {
  if (ot(t))
    return [];
  var r = Array.prototype.slice.apply(t.querySelectorAll(jt));
  return n && Ue.call(t, jt) && r.unshift(t), r = r.filter(o), r;
}, Ht = function(t, n, o) {
  for (var r = [], i = Array.from(t); i.length; ) {
    var s = i.shift();
    if (!ot(s, !1))
      if (s.tagName === "SLOT") {
        var l = s.assignedElements(), a = l.length ? l : s.children, c = Ht(a, !0, o);
        o.flatten ? r.push.apply(r, c) : r.push({
          scopeParent: s,
          candidates: c
        });
      } else {
        var d = Ue.call(s, jt);
        d && o.filter(s) && (n || !t.includes(s)) && r.push(s);
        var f = s.shadowRoot || // check for an undisclosed shadow
        typeof o.getShadowRoot == "function" && o.getShadowRoot(s), h = !ot(f, !1) && (!o.shadowRootFilter || o.shadowRootFilter(s));
        if (f && h) {
          var m = Ht(f === !0 ? s.children : f.children, !0, o);
          o.flatten ? r.push.apply(r, m) : r.push({
            scopeParent: s,
            candidates: m
          });
        } else
          i.unshift.apply(i, s.children);
      }
  }
  return r;
}, xo = function(t) {
  return !isNaN(parseInt(t.getAttribute("tabindex"), 10));
}, So = function(t) {
  if (!t)
    throw new Error("No node provided");
  return t.tabIndex < 0 && (/^(AUDIO|VIDEO|DETAILS)$/.test(t.tagName) || yi(t)) && !xo(t) ? 0 : t.tabIndex;
}, Si = function(t, n) {
  var o = So(t);
  return o < 0 && n && !xo(t) ? 0 : o;
}, Ci = function(t, n) {
  return t.tabIndex === n.tabIndex ? t.documentOrder - n.documentOrder : t.tabIndex - n.tabIndex;
}, Co = function(t) {
  return t.tagName === "INPUT";
}, Ni = function(t) {
  return Co(t) && t.type === "hidden";
}, ki = function(t) {
  var n = t.tagName === "DETAILS" && Array.prototype.slice.apply(t.children).some(function(o) {
    return o.tagName === "SUMMARY";
  });
  return n;
}, Ri = function(t, n) {
  for (var o = 0; o < t.length; o++)
    if (t[o].checked && t[o].form === n)
      return t[o];
}, Ai = function(t) {
  if (!t.name)
    return !0;
  var n = t.form || nt(t), o = function(l) {
    return n.querySelectorAll('input[type="radio"][name="' + l + '"]');
  }, r;
  if (typeof window < "u" && typeof window.CSS < "u" && typeof window.CSS.escape == "function")
    r = o(window.CSS.escape(t.name));
  else
    try {
      r = o(t.name);
    } catch (s) {
      return console.error("Looks like you have a radio button with a name attribute containing invalid CSS selector characters and need the CSS.escape polyfill: %s", s.message), !1;
    }
  var i = Ri(r, t.form);
  return !i || i === t;
}, Ei = function(t) {
  return Co(t) && t.type === "radio";
}, Oi = function(t) {
  return Ei(t) && !Ai(t);
}, Di = function(t) {
  var n, o = t && nt(t), r = (n = o) === null || n === void 0 ? void 0 : n.host, i = !1;
  if (o && o !== t) {
    var s, l, a;
    for (i = !!((s = r) !== null && s !== void 0 && (l = s.ownerDocument) !== null && l !== void 0 && l.contains(r) || t != null && (a = t.ownerDocument) !== null && a !== void 0 && a.contains(t)); !i && r; ) {
      var c, d, f;
      o = nt(r), r = (c = o) === null || c === void 0 ? void 0 : c.host, i = !!((d = r) !== null && d !== void 0 && (f = d.ownerDocument) !== null && f !== void 0 && f.contains(r));
    }
  }
  return i;
}, kn = function(t) {
  var n = t.getBoundingClientRect(), o = n.width, r = n.height;
  return o === 0 && r === 0;
}, Ii = function(t, n) {
  var o = n.displayCheck, r = n.getShadowRoot;
  if (o === "full-native" && "checkVisibility" in t) {
    var i = t.checkVisibility({
      // Checking opacity might be desirable for some use cases, but natively,
      // opacity zero elements _are_ focusable and tabbable.
      checkOpacity: !1,
      opacityProperty: !1,
      contentVisibilityAuto: !0,
      visibilityProperty: !0,
      // This is an alias for `visibilityProperty`. Contemporary browsers
      // support both. However, this alias has wider browser support (Chrome
      // >= 105 and Firefox >= 106, vs. Chrome >= 121 and Firefox >= 122), so
      // we include it anyway.
      checkVisibilityCSS: !0
    });
    return !i;
  }
  if (getComputedStyle(t).visibility === "hidden")
    return !0;
  var s = Ue.call(t, "details>summary:first-of-type"), l = s ? t.parentElement : t;
  if (Ue.call(l, "details:not([open]) *"))
    return !0;
  if (!o || o === "full" || // full-native can run this branch when it falls through in case
  // Element#checkVisibility is unsupported
  o === "full-native" || o === "legacy-full") {
    if (typeof r == "function") {
      for (var a = t; t; ) {
        var c = t.parentElement, d = nt(t);
        if (c && !c.shadowRoot && r(c) === !0)
          return kn(t);
        t.assignedSlot ? t = t.assignedSlot : !c && d !== t.ownerDocument ? t = d.host : t = c;
      }
      t = a;
    }
    if (Di(t))
      return !t.getClientRects().length;
    if (o !== "legacy-full")
      return !0;
  } else if (o === "non-zero-area")
    return kn(t);
  return !1;
}, Ti = function(t) {
  if (/^(INPUT|BUTTON|SELECT|TEXTAREA)$/.test(t.tagName))
    for (var n = t.parentElement; n; ) {
      if (n.tagName === "FIELDSET" && n.disabled) {
        for (var o = 0; o < n.children.length; o++) {
          var r = n.children.item(o);
          if (r.tagName === "LEGEND")
            return Ue.call(n, "fieldset[disabled] *") ? !0 : !r.contains(t);
        }
        return !0;
      }
      n = n.parentElement;
    }
  return !1;
}, Mi = function(t, n) {
  return !(n.disabled || Ni(n) || Ii(n, t) || // For a details element with a summary, the summary element gets the focus
  ki(n) || Ti(n));
}, Rn = function(t, n) {
  return !(Oi(n) || So(n) < 0 || !Mi(t, n));
}, _i = function(t) {
  var n = parseInt(t.getAttribute("tabindex"), 10);
  return !!(isNaN(n) || n >= 0);
}, No = function(t) {
  var n = [], o = [];
  return t.forEach(function(r, i) {
    var s = !!r.scopeParent, l = s ? r.scopeParent : r, a = Si(l, s), c = s ? No(r.candidates) : l;
    a === 0 ? s ? n.push.apply(n, c) : n.push(l) : o.push({
      documentOrder: i,
      tabIndex: a,
      item: r,
      isScope: s,
      content: c
    });
  }), o.sort(Ci).reduce(function(r, i) {
    return i.isScope ? r.push.apply(r, i.content) : r.push(i.content), r;
  }, []).concat(n);
}, ko = function(t, n) {
  n = n || {};
  var o;
  return n.getShadowRoot ? o = Ht([t], n.includeContainer, {
    filter: Rn.bind(null, n),
    flatten: !1,
    getShadowRoot: n.getShadowRoot,
    shadowRootFilter: _i
  }) : o = xi(t, n.includeContainer, Rn.bind(null, n)), No(o);
};
function An(e, t, n) {
  let {
    reference: o,
    floating: r
  } = e;
  const i = ve(t), s = wo(t), l = bo(s), a = Ae(t), c = i === "y", d = o.x + o.width / 2 - r.width / 2, f = o.y + o.height / 2 - r.height / 2, h = o[l] / 2 - r[l] / 2;
  let m;
  switch (a) {
    case "top":
      m = {
        x: d,
        y: o.y - r.height
      };
      break;
    case "bottom":
      m = {
        x: d,
        y: o.y + o.height
      };
      break;
    case "right":
      m = {
        x: o.x + o.width,
        y: f
      };
      break;
    case "left":
      m = {
        x: o.x - r.width,
        y: f
      };
      break;
    default:
      m = {
        x: o.x,
        y: o.y
      };
  }
  switch (gt(t)) {
    case "start":
      m[s] -= h * (n && c ? -1 : 1);
      break;
    case "end":
      m[s] += h * (n && c ? -1 : 1);
      break;
  }
  return m;
}
async function Pi(e, t) {
  var n;
  t === void 0 && (t = {});
  const {
    x: o,
    y: r,
    platform: i,
    rects: s,
    elements: l,
    strategy: a
  } = e, {
    boundary: c = "clippingAncestors",
    rootBoundary: d = "viewport",
    elementContext: f = "floating",
    altBoundary: h = !1,
    padding: m = 0
  } = pt(t, e), w = bi(m), g = l[h ? f === "floating" ? "reference" : "floating" : f], v = tt(await i.getClippingRect({
    element: (n = await (i.isElement == null ? void 0 : i.isElement(g))) == null || n ? g : g.contextElement || await (i.getDocumentElement == null ? void 0 : i.getDocumentElement(l.floating)),
    boundary: c,
    rootBoundary: d,
    strategy: a
  })), y = f === "floating" ? {
    x: o,
    y: r,
    width: s.floating.width,
    height: s.floating.height
  } : s.reference, b = await (i.getOffsetParent == null ? void 0 : i.getOffsetParent(l.floating)), E = await (i.isElement == null ? void 0 : i.isElement(b)) ? await (i.getScale == null ? void 0 : i.getScale(b)) || {
    x: 1,
    y: 1
  } : {
    x: 1,
    y: 1
  }, k = tt(i.convertOffsetParentRelativeRectToViewportRelativeRect ? await i.convertOffsetParentRelativeRectToViewportRelativeRect({
    elements: l,
    rect: y,
    offsetParent: b,
    strategy: a
  }) : y);
  return {
    top: (v.top - k.top + w.top) / E.y,
    bottom: (k.bottom - v.bottom + w.bottom) / E.y,
    left: (v.left - k.left + w.left) / E.x,
    right: (k.right - v.right + w.right) / E.x
  };
}
const Li = 50, Bi = async (e, t, n) => {
  const {
    placement: o = "bottom",
    strategy: r = "absolute",
    middleware: i = [],
    platform: s
  } = n, l = s.detectOverflow ? s : {
    ...s,
    detectOverflow: Pi
  }, a = await (s.isRTL == null ? void 0 : s.isRTL(t));
  let c = await s.getElementRects({
    reference: e,
    floating: t,
    strategy: r
  }), {
    x: d,
    y: f
  } = An(c, o, a), h = o, m = 0;
  const w = {};
  for (let p = 0; p < i.length; p++) {
    const g = i[p];
    if (!g)
      continue;
    const {
      name: v,
      fn: y
    } = g, {
      x: b,
      y: E,
      data: k,
      reset: D
    } = await y({
      x: d,
      y: f,
      initialPlacement: o,
      placement: h,
      strategy: r,
      middlewareData: w,
      rects: c,
      platform: l,
      elements: {
        reference: e,
        floating: t
      }
    });
    d = b ?? d, f = E ?? f, w[v] = {
      ...w[v],
      ...k
    }, D && m < Li && (m++, typeof D == "object" && (D.placement && (h = D.placement), D.rects && (c = D.rects === !0 ? await s.getElementRects({
      reference: e,
      floating: t,
      strategy: r
    }) : D.rects), {
      x: d,
      y: f
    } = An(c, h, a)), p = -1);
  }
  return {
    x: d,
    y: f,
    placement: h,
    strategy: r,
    middlewareData: w
  };
}, Fi = function(e) {
  return e === void 0 && (e = {}), {
    name: "flip",
    options: e,
    async fn(t) {
      var n, o;
      const {
        placement: r,
        middlewareData: i,
        rects: s,
        initialPlacement: l,
        platform: a,
        elements: c
      } = t, {
        mainAxis: d = !0,
        crossAxis: f = !0,
        fallbackPlacements: h,
        fallbackStrategy: m = "bestFit",
        fallbackAxisSideDirection: w = "none",
        flipAlignment: p = !0,
        ...g
      } = pt(e, t);
      if ((n = i.arrow) != null && n.alignmentOffset)
        return {};
      const v = Ae(r), y = ve(l), b = Ae(l) === l, E = await (a.isRTL == null ? void 0 : a.isRTL(c.floating)), k = h || (b || !p ? [et(l)] : fi(l)), D = w !== "none";
      !h && D && k.push(...gi(l, p, w, E));
      const O = [l, ...k], I = await a.detectOverflow(t, g), F = [];
      let S = ((o = i.flip) == null ? void 0 : o.overflows) || [];
      if (d && F.push(I[v]), f) {
        const q = di(r, s, E);
        F.push(I[q[0]], I[q[1]]);
      }
      if (S = [...S, {
        placement: r,
        overflows: F
      }], !F.every((q) => q <= 0)) {
        var _, B;
        const q = (((_ = i.flip) == null ? void 0 : _.index) || 0) + 1, R = O[q];
        if (R && (!(f === "alignment" ? y !== ve(R) : !1) || // We leave the current main axis only if every placement on that axis
        // overflows the main axis.
        S.every((T) => ve(T.placement) === y ? T.overflows[0] > 0 : !0)))
          return {
            data: {
              index: q,
              overflows: S
            },
            reset: {
              placement: R
            }
          };
        let P = (B = S.filter(($) => $.overflows[0] <= 0).sort(($, T) => $.overflows[1] - T.overflows[1])[0]) == null ? void 0 : B.placement;
        if (!P)
          switch (m) {
            case "bestFit": {
              var Y;
              const $ = (Y = S.filter((T) => {
                if (D) {
                  const M = ve(T.placement);
                  return M === y || // Create a bias to the `y` side axis due to horizontal
                  // reading directions favoring greater width.
                  M === "y";
                }
                return !0;
              }).map((T) => [T.placement, T.overflows.filter((M) => M > 0).reduce((M, K) => M + K, 0)]).sort((T, M) => T[1] - M[1])[0]) == null ? void 0 : Y[0];
              $ && (P = $);
              break;
            }
            case "initialPlacement":
              P = l;
              break;
          }
        if (r !== P)
          return {
            reset: {
              placement: P
            }
          };
      }
      return {};
    }
  };
}, Vi = /* @__PURE__ */ new Set(["left", "top"]);
async function $i(e, t) {
  const {
    placement: n,
    platform: o,
    elements: r
  } = e, i = await (o.isRTL == null ? void 0 : o.isRTL(r.floating)), s = Ae(n), l = gt(n), a = ve(n) === "y", c = Vi.has(s) ? -1 : 1, d = i && a ? -1 : 1, f = pt(t, e);
  let {
    mainAxis: h,
    crossAxis: m,
    alignmentAxis: w
  } = typeof f == "number" ? {
    mainAxis: f,
    crossAxis: 0,
    alignmentAxis: null
  } : {
    mainAxis: f.mainAxis || 0,
    crossAxis: f.crossAxis || 0,
    alignmentAxis: f.alignmentAxis
  };
  return l && typeof w == "number" && (m = l === "end" ? w * -1 : w), a ? {
    x: m * d,
    y: h * c
  } : {
    x: h * c,
    y: m * d
  };
}
const ji = function(e) {
  return e === void 0 && (e = 0), {
    name: "offset",
    options: e,
    async fn(t) {
      var n, o;
      const {
        x: r,
        y: i,
        placement: s,
        middlewareData: l
      } = t, a = await $i(t, e);
      return s === ((n = l.offset) == null ? void 0 : n.placement) && (o = l.arrow) != null && o.alignmentOffset ? {} : {
        x: r + a.x,
        y: i + a.y,
        data: {
          ...a,
          placement: s
        }
      };
    }
  };
}, Hi = function(e) {
  return e === void 0 && (e = {}), {
    name: "shift",
    options: e,
    async fn(t) {
      const {
        x: n,
        y: o,
        placement: r,
        platform: i
      } = t, {
        mainAxis: s = !0,
        crossAxis: l = !1,
        limiter: a = {
          fn: (v) => {
            let {
              x: y,
              y: b
            } = v;
            return {
              x: y,
              y: b
            };
          }
        },
        ...c
      } = pt(e, t), d = {
        x: n,
        y: o
      }, f = await i.detectOverflow(t, c), h = ve(Ae(r)), m = vo(h);
      let w = d[m], p = d[h];
      if (s) {
        const v = m === "y" ? "top" : "left", y = m === "y" ? "bottom" : "right", b = w + f[v], E = w - f[y];
        w = Sn(b, w, E);
      }
      if (l) {
        const v = h === "y" ? "top" : "left", y = h === "y" ? "bottom" : "right", b = p + f[v], E = p - f[y];
        p = Sn(b, p, E);
      }
      const g = a.fn({
        ...t,
        [m]: w,
        [h]: p
      });
      return {
        ...g,
        data: {
          x: g.x - n,
          y: g.y - o,
          enabled: {
            [m]: s,
            [h]: l
          }
        }
      };
    }
  };
};
function Ro(e) {
  const t = oe(e);
  let n = parseFloat(t.width) || 0, o = parseFloat(t.height) || 0;
  const r = re(e), i = r ? e.offsetWidth : n, s = r ? e.offsetHeight : o, l = Qe(n) !== i || Qe(o) !== s;
  return l && (n = i, o = s), {
    width: n,
    height: o,
    $: l
  };
}
function sn(e) {
  return G(e) ? e : e.contextElement;
}
function De(e) {
  const t = sn(e);
  if (!re(t))
    return ue(1);
  const n = t.getBoundingClientRect(), {
    width: o,
    height: r,
    $: i
  } = Ro(t);
  let s = (i ? Qe(n.width) : n.width) / o, l = (i ? Qe(n.height) : n.height) / r;
  return (!s || !Number.isFinite(s)) && (s = 1), (!l || !Number.isFinite(l)) && (l = 1), {
    x: s,
    y: l
  };
}
const Ui = /* @__PURE__ */ ue(0);
function Ao(e) {
  const t = te(e);
  return !mt() || !t.visualViewport ? Ui : {
    x: t.visualViewport.offsetLeft,
    y: t.visualViewport.offsetTop
  };
}
function Wi(e, t, n) {
  return t === void 0 && (t = !1), !n || t && n !== te(e) ? !1 : t;
}
function Ee(e, t, n, o) {
  t === void 0 && (t = !1), n === void 0 && (n = !1);
  const r = e.getBoundingClientRect(), i = sn(e);
  let s = ue(1);
  t && (o ? G(o) && (s = De(o)) : s = De(e));
  const l = Wi(i, n, o) ? Ao(i) : ue(0);
  let a = (r.left + l.x) / s.x, c = (r.top + l.y) / s.y, d = r.width / s.x, f = r.height / s.y;
  if (i) {
    const h = te(i), m = o && G(o) ? te(o) : o;
    let w = h, p = Bt(w);
    for (; p && o && m !== w; ) {
      const g = De(p), v = p.getBoundingClientRect(), y = oe(p), b = v.left + (p.clientLeft + parseFloat(y.paddingLeft)) * g.x, E = v.top + (p.clientTop + parseFloat(y.paddingTop)) * g.y;
      a *= g.x, c *= g.y, d *= g.x, f *= g.y, a += b, c += E, w = te(p), p = Bt(w);
    }
  }
  return tt({
    width: d,
    height: f,
    x: a,
    y: c
  });
}
function vt(e, t) {
  const n = ht(e).scrollLeft;
  return t ? t.left + n : Ee(de(e)).left + n;
}
function Eo(e, t) {
  const n = e.getBoundingClientRect(), o = n.left + t.scrollLeft - vt(e, n), r = n.top + t.scrollTop;
  return {
    x: o,
    y: r
  };
}
function Ki(e) {
  let {
    elements: t,
    rect: n,
    offsetParent: o,
    strategy: r
  } = e;
  const i = r === "fixed", s = de(o), l = t ? ft(t.floating) : !1;
  if (o === s || l && i)
    return n;
  let a = {
    scrollLeft: 0,
    scrollTop: 0
  }, c = ue(1);
  const d = ue(0), f = re(o);
  if ((f || !f && !i) && ((_e(o) !== "body" || Ge(s)) && (a = ht(o)), f)) {
    const m = Ee(o);
    c = De(o), d.x = m.x + o.clientLeft, d.y = m.y + o.clientTop;
  }
  const h = s && !f && !i ? Eo(s, a) : ue(0);
  return {
    width: n.width * c.x,
    height: n.height * c.y,
    x: n.x * c.x - a.scrollLeft * c.x + d.x + h.x,
    y: n.y * c.y - a.scrollTop * c.y + d.y + h.y
  };
}
function Gi(e) {
  return Array.from(e.getClientRects());
}
function zi(e) {
  const t = de(e), n = ht(e), o = e.ownerDocument.body, r = Ne(t.scrollWidth, t.clientWidth, o.scrollWidth, o.clientWidth), i = Ne(t.scrollHeight, t.clientHeight, o.scrollHeight, o.clientHeight);
  let s = -n.scrollLeft + vt(e);
  const l = -n.scrollTop;
  return oe(o).direction === "rtl" && (s += Ne(t.clientWidth, o.clientWidth) - r), {
    width: r,
    height: i,
    x: s,
    y: l
  };
}
const En = 25;
function qi(e, t) {
  const n = te(e), o = de(e), r = n.visualViewport;
  let i = o.clientWidth, s = o.clientHeight, l = 0, a = 0;
  if (r) {
    i = r.width, s = r.height;
    const d = mt();
    (!d || d && t === "fixed") && (l = r.offsetLeft, a = r.offsetTop);
  }
  const c = vt(o);
  if (c <= 0) {
    const d = o.ownerDocument, f = d.body, h = getComputedStyle(f), m = d.compatMode === "CSS1Compat" && parseFloat(h.marginLeft) + parseFloat(h.marginRight) || 0, w = Math.abs(o.clientWidth - f.clientWidth - m);
    w <= En && (i -= w);
  } else c <= En && (i += c);
  return {
    width: i,
    height: s,
    x: l,
    y: a
  };
}
function Yi(e, t) {
  const n = Ee(e, !0, t === "fixed"), o = n.top + e.clientTop, r = n.left + e.clientLeft, i = re(e) ? De(e) : ue(1), s = e.clientWidth * i.x, l = e.clientHeight * i.y, a = r * i.x, c = o * i.y;
  return {
    width: s,
    height: l,
    x: a,
    y: c
  };
}
function On(e, t, n) {
  let o;
  if (t === "viewport")
    o = qi(e, n);
  else if (t === "document")
    o = zi(de(e));
  else if (G(t))
    o = Yi(t, n);
  else {
    const r = Ao(e);
    o = {
      x: t.x - r.x,
      y: t.y - r.y,
      width: t.width,
      height: t.height
    };
  }
  return tt(o);
}
function Oo(e, t) {
  const n = fe(e);
  return n === t || !G(n) || ye(n) ? !1 : oe(n).position === "fixed" || Oo(n, t);
}
function Xi(e, t) {
  const n = t.get(e);
  if (n)
    return n;
  let o = be(e, [], !1).filter((l) => G(l) && _e(l) !== "body"), r = null;
  const i = oe(e).position === "fixed";
  let s = i ? fe(e) : e;
  for (; G(s) && !ye(s); ) {
    const l = oe(s), a = rn(s);
    !a && l.position === "fixed" && (r = null), (i ? !a && !r : !a && l.position === "static" && !!r && (r.position === "absolute" || r.position === "fixed") || Ge(s) && !a && Oo(e, s)) ? o = o.filter((d) => d !== s) : r = l, s = fe(s);
  }
  return t.set(e, o), o;
}
function Ji(e) {
  let {
    element: t,
    boundary: n,
    rootBoundary: o,
    strategy: r
  } = e;
  const s = [...n === "clippingAncestors" ? ft(t) ? [] : Xi(t, this._c) : [].concat(n), o], l = On(t, s[0], r);
  let a = l.top, c = l.right, d = l.bottom, f = l.left;
  for (let h = 1; h < s.length; h++) {
    const m = On(t, s[h], r);
    a = Ne(m.top, a), c = Ze(m.right, c), d = Ze(m.bottom, d), f = Ne(m.left, f);
  }
  return {
    width: c - f,
    height: d - a,
    x: f,
    y: a
  };
}
function Zi(e) {
  const {
    width: t,
    height: n
  } = Ro(e);
  return {
    width: t,
    height: n
  };
}
function Qi(e, t, n) {
  const o = re(t), r = de(t), i = n === "fixed", s = Ee(e, !0, i, t);
  let l = {
    scrollLeft: 0,
    scrollTop: 0
  };
  const a = ue(0);
  function c() {
    a.x = vt(r);
  }
  if (o || !o && !i)
    if ((_e(t) !== "body" || Ge(r)) && (l = ht(t)), o) {
      const m = Ee(t, !0, i, t);
      a.x = m.x + t.clientLeft, a.y = m.y + t.clientTop;
    } else r && c();
  i && !o && r && c();
  const d = r && !o && !i ? Eo(r, l) : ue(0), f = s.left + l.scrollLeft - a.x - d.x, h = s.top + l.scrollTop - a.y - d.y;
  return {
    x: f,
    y: h,
    width: s.width,
    height: s.height
  };
}
function St(e) {
  return oe(e).position === "static";
}
function Dn(e, t) {
  if (!re(e) || oe(e).position === "fixed")
    return null;
  if (t)
    return t(e);
  let n = e.offsetParent;
  return de(e) === n && (n = n.ownerDocument.body), n;
}
function Do(e, t) {
  const n = te(e);
  if (ft(e))
    return n;
  if (!re(e)) {
    let r = fe(e);
    for (; r && !ye(r); ) {
      if (G(r) && !St(r))
        return r;
      r = fe(r);
    }
    return n;
  }
  let o = Dn(e, t);
  for (; o && ei(o) && St(o); )
    o = Dn(o, t);
  return o && ye(o) && St(o) && !rn(o) ? n : o || oi(e) || n;
}
const el = async function(e) {
  const t = this.getOffsetParent || Do, n = this.getDimensions, o = await n(e.floating);
  return {
    reference: Qi(e.reference, await t(e.floating), e.strategy),
    floating: {
      x: 0,
      y: 0,
      width: o.width,
      height: o.height
    }
  };
};
function tl(e) {
  return oe(e).direction === "rtl";
}
const nl = {
  convertOffsetParentRelativeRectToViewportRelativeRect: Ki,
  getDocumentElement: de,
  getClippingRect: Ji,
  getOffsetParent: Do,
  getElementRects: el,
  getClientRects: Gi,
  getDimensions: Zi,
  getScale: De,
  isElement: G,
  isRTL: tl
};
function Io(e, t) {
  return e.x === t.x && e.y === t.y && e.width === t.width && e.height === t.height;
}
function ol(e, t) {
  let n = null, o;
  const r = de(e);
  function i() {
    var l;
    clearTimeout(o), (l = n) == null || l.disconnect(), n = null;
  }
  function s(l, a) {
    l === void 0 && (l = !1), a === void 0 && (a = 1), i();
    const c = e.getBoundingClientRect(), {
      left: d,
      top: f,
      width: h,
      height: m
    } = c;
    if (l || t(), !h || !m)
      return;
    const w = qe(f), p = qe(r.clientWidth - (d + h)), g = qe(r.clientHeight - (f + m)), v = qe(d), b = {
      rootMargin: -w + "px " + -p + "px " + -g + "px " + -v + "px",
      threshold: Ne(0, Ze(1, a)) || 1
    };
    let E = !0;
    function k(D) {
      const O = D[0].intersectionRatio;
      if (O !== a) {
        if (!E)
          return s();
        O ? s(!1, O) : o = setTimeout(() => {
          s(!1, 1e-7);
        }, 1e3);
      }
      O === 1 && !Io(c, e.getBoundingClientRect()) && s(), E = !1;
    }
    try {
      n = new IntersectionObserver(k, {
        ...b,
        // Handle <iframe>s
        root: r.ownerDocument
      });
    } catch {
      n = new IntersectionObserver(k, b);
    }
    n.observe(e);
  }
  return s(!0), i;
}
function rl(e, t, n, o) {
  o === void 0 && (o = {});
  const {
    ancestorScroll: r = !0,
    ancestorResize: i = !0,
    elementResize: s = typeof ResizeObserver == "function",
    layoutShift: l = typeof IntersectionObserver == "function",
    animationFrame: a = !1
  } = o, c = sn(e), d = r || i ? [...c ? be(c) : [], ...t ? be(t) : []] : [];
  d.forEach((v) => {
    r && v.addEventListener("scroll", n, {
      passive: !0
    }), i && v.addEventListener("resize", n);
  });
  const f = c && l ? ol(c, n) : null;
  let h = -1, m = null;
  s && (m = new ResizeObserver((v) => {
    let [y] = v;
    y && y.target === c && m && t && (m.unobserve(t), cancelAnimationFrame(h), h = requestAnimationFrame(() => {
      var b;
      (b = m) == null || b.observe(t);
    })), n();
  }), c && !a && m.observe(c), t && m.observe(t));
  let w, p = a ? Ee(e) : null;
  a && g();
  function g() {
    const v = Ee(e);
    p && !Io(p, v) && n(), p = v, w = requestAnimationFrame(g);
  }
  return n(), () => {
    var v;
    d.forEach((y) => {
      r && y.removeEventListener("scroll", n), i && y.removeEventListener("resize", n);
    }), f == null || f(), (v = m) == null || v.disconnect(), m = null, a && cancelAnimationFrame(w);
  };
}
const sl = ji, il = Hi, ll = Fi, cl = (e, t, n) => {
  const o = /* @__PURE__ */ new Map(), r = {
    platform: nl,
    ...n
  }, i = {
    ...r.platform,
    _c: o
  };
  return Bi(e, t, {
    ...r,
    platform: i
  });
};
var al = typeof document < "u", ul = function() {
}, Ye = al ? Wn : ul;
function rt(e, t) {
  if (e === t)
    return !0;
  if (typeof e != typeof t)
    return !1;
  if (typeof e == "function" && e.toString() === t.toString())
    return !0;
  let n, o, r;
  if (e && t && typeof e == "object") {
    if (Array.isArray(e)) {
      if (n = e.length, n !== t.length) return !1;
      for (o = n; o-- !== 0; )
        if (!rt(e[o], t[o]))
          return !1;
      return !0;
    }
    if (r = Object.keys(e), n = r.length, n !== Object.keys(t).length)
      return !1;
    for (o = n; o-- !== 0; )
      if (!{}.hasOwnProperty.call(t, r[o]))
        return !1;
    for (o = n; o-- !== 0; ) {
      const i = r[o];
      if (!(i === "_owner" && e.$$typeof) && !rt(e[i], t[i]))
        return !1;
    }
    return !0;
  }
  return e !== e && t !== t;
}
function To(e) {
  return typeof window > "u" ? 1 : (e.ownerDocument.defaultView || window).devicePixelRatio || 1;
}
function In(e, t) {
  const n = To(e);
  return Math.round(t * n) / n;
}
function Ct(e) {
  const t = N.useRef(e);
  return Ye(() => {
    t.current = e;
  }), t;
}
function dl(e) {
  e === void 0 && (e = {});
  const {
    placement: t = "bottom",
    strategy: n = "absolute",
    middleware: o = [],
    platform: r,
    elements: {
      reference: i,
      floating: s
    } = {},
    transform: l = !0,
    whileElementsMounted: a,
    open: c
  } = e, [d, f] = N.useState({
    x: 0,
    y: 0,
    strategy: n,
    placement: t,
    middlewareData: {},
    isPositioned: !1
  }), [h, m] = N.useState(o);
  rt(h, o) || m(o);
  const [w, p] = N.useState(null), [g, v] = N.useState(null), y = N.useCallback((T) => {
    T !== D.current && (D.current = T, p(T));
  }, []), b = N.useCallback((T) => {
    T !== O.current && (O.current = T, v(T));
  }, []), E = i || w, k = s || g, D = N.useRef(null), O = N.useRef(null), I = N.useRef(d), F = a != null, S = Ct(a), _ = Ct(r), B = Ct(c), Y = N.useCallback(() => {
    if (!D.current || !O.current)
      return;
    const T = {
      placement: t,
      strategy: n,
      middleware: h
    };
    _.current && (T.platform = _.current), cl(D.current, O.current, T).then((M) => {
      const K = {
        ...M,
        // The floating element's position may be recomputed while it's closed
        // but still mounted (such as when transitioning out). To ensure
        // `isPositioned` will be `false` initially on the next open, avoid
        // setting it to `true` when `open === false` (must be specified).
        isPositioned: B.current !== !1
      };
      q.current && !rt(I.current, K) && (I.current = K, Kn.flushSync(() => {
        f(K);
      }));
    });
  }, [h, t, n, _, B]);
  Ye(() => {
    c === !1 && I.current.isPositioned && (I.current.isPositioned = !1, f((T) => ({
      ...T,
      isPositioned: !1
    })));
  }, [c]);
  const q = N.useRef(!1);
  Ye(() => (q.current = !0, () => {
    q.current = !1;
  }), []), Ye(() => {
    if (E && (D.current = E), k && (O.current = k), E && k) {
      if (S.current)
        return S.current(E, k, Y);
      Y();
    }
  }, [E, k, Y, S, F]);
  const R = N.useMemo(() => ({
    reference: D,
    floating: O,
    setReference: y,
    setFloating: b
  }), [y, b]), P = N.useMemo(() => ({
    reference: E,
    floating: k
  }), [E, k]), $ = N.useMemo(() => {
    const T = {
      position: n,
      left: 0,
      top: 0
    };
    if (!P.floating)
      return T;
    const M = In(P.floating, d.x), K = In(P.floating, d.y);
    return l ? {
      ...T,
      transform: "translate(" + M + "px, " + K + "px)",
      ...To(P.floating) >= 1.5 && {
        willChange: "transform"
      }
    } : {
      position: n,
      left: M,
      top: K
    };
  }, [n, l, P.floating, d.x, d.y]);
  return N.useMemo(() => ({
    ...d,
    update: Y,
    refs: R,
    elements: P,
    floatingStyles: $
  }), [d, Y, R, P, $]);
}
const fl = (e, t) => {
  const n = sl(e);
  return {
    name: n.name,
    fn: n.fn,
    options: [e, t]
  };
}, ml = (e, t) => {
  const n = il(e);
  return {
    name: n.name,
    fn: n.fn,
    options: [e, t]
  };
}, hl = (e, t) => {
  const n = ll(e);
  return {
    name: n.name,
    fn: n.fn,
    options: [e, t]
  };
}, Mo = {
  ...N
}, pl = Mo.useInsertionEffect, gl = pl || ((e) => e());
function Oe(e) {
  const t = N.useRef(() => {
    if (process.env.NODE_ENV !== "production")
      throw new Error("Cannot call an event handler while rendering.");
  });
  return gl(() => {
    t.current = e;
  }), N.useCallback(function() {
    for (var n = arguments.length, o = new Array(n), r = 0; r < n; r++)
      o[r] = arguments[r];
    return t.current == null ? void 0 : t.current(...o);
  }, []);
}
var ke = typeof document < "u" ? Wn : z;
function Ut() {
  return Ut = Object.assign ? Object.assign.bind() : function(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = arguments[t];
      for (var o in n)
        Object.prototype.hasOwnProperty.call(n, o) && (e[o] = n[o]);
    }
    return e;
  }, Ut.apply(this, arguments);
}
let Tn = !1, vl = 0;
const Mn = () => (
  // Ensure the id is unique with multiple independent versions of Floating UI
  // on <React 18
  "floating-ui-" + Math.random().toString(36).slice(2, 6) + vl++
);
function bl() {
  const [e, t] = N.useState(() => Tn ? Mn() : void 0);
  return ke(() => {
    e == null && t(Mn());
  }, []), N.useEffect(() => {
    Tn = !0;
  }, []), e;
}
const wl = Mo.useId, _o = wl || bl;
let Wt;
process.env.NODE_ENV !== "production" && (Wt = /* @__PURE__ */ new Set());
function yl() {
  for (var e, t = arguments.length, n = new Array(t), o = 0; o < t; o++)
    n[o] = arguments[o];
  const r = "Floating UI: " + n.join(" ");
  if (!((e = Wt) != null && e.has(r))) {
    var i;
    (i = Wt) == null || i.add(r), console.error(r);
  }
}
function xl() {
  const e = /* @__PURE__ */ new Map();
  return {
    emit(t, n) {
      var o;
      (o = e.get(t)) == null || o.forEach((r) => r(n));
    },
    on(t, n) {
      e.set(t, [...e.get(t) || [], n]);
    },
    off(t, n) {
      var o;
      e.set(t, ((o = e.get(t)) == null ? void 0 : o.filter((r) => r !== n)) || []);
    }
  };
}
const Sl = /* @__PURE__ */ N.createContext(null), Cl = /* @__PURE__ */ N.createContext(null), Nl = () => {
  var e;
  return ((e = N.useContext(Sl)) == null ? void 0 : e.id) || null;
}, Po = () => N.useContext(Cl);
function ln(e) {
  return "data-floating-ui-" + e;
}
function Nt(e, t) {
  let n = e.filter((r) => {
    var i;
    return r.parentId === t && ((i = r.context) == null ? void 0 : i.open);
  }), o = n;
  for (; o.length; )
    o = e.filter((r) => {
      var i;
      return (i = o) == null ? void 0 : i.some((s) => {
        var l;
        return r.parentId === s.id && ((l = r.context) == null ? void 0 : l.open);
      });
    }), n = n.concat(o);
  return n;
}
const Lo = () => ({
  getShadowRoot: !0,
  displayCheck: (
    // JSDOM does not support the `tabbable` library. To solve this we can
    // check if `ResizeObserver` is a real function (not polyfilled), which
    // determines if the current environment is JSDOM-like.
    typeof ResizeObserver == "function" && ResizeObserver.toString().includes("[native code]") ? "full" : "none"
  )
});
function Bo(e, t) {
  const n = ko(e, Lo());
  t === "prev" && n.reverse();
  const o = n.indexOf(ri(Vt(e)));
  return n.slice(o + 1)[0];
}
function kl() {
  return Bo(document.body, "next");
}
function Rl() {
  return Bo(document.body, "prev");
}
function kt(e, t) {
  const n = t || e.currentTarget, o = e.relatedTarget;
  return !o || !Ft(n, o);
}
function Al(e) {
  ko(e, Lo()).forEach((n) => {
    n.dataset.tabindex = n.getAttribute("tabindex") || "", n.setAttribute("tabindex", "-1");
  });
}
function _n(e) {
  e.querySelectorAll("[data-tabindex]").forEach((n) => {
    const o = n.dataset.tabindex;
    delete n.dataset.tabindex, o ? n.setAttribute("tabindex", o) : n.removeAttribute("tabindex");
  });
}
const Fo = {
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
let El;
function Pn(e) {
  e.key === "Tab" && (e.target, clearTimeout(El));
}
const Ln = /* @__PURE__ */ N.forwardRef(function(t, n) {
  const [o, r] = N.useState();
  ke(() => (si() && r("button"), document.addEventListener("keydown", Pn), () => {
    document.removeEventListener("keydown", Pn);
  }), []);
  const i = {
    ref: n,
    tabIndex: 0,
    // Role is only for VoiceOver
    role: o,
    "aria-hidden": o ? void 0 : !0,
    [ln("focus-guard")]: "",
    style: Fo
  };
  return /* @__PURE__ */ N.createElement("span", Ut({}, t, i));
}), Vo = /* @__PURE__ */ N.createContext(null), Bn = /* @__PURE__ */ ln("portal");
function Ol(e) {
  e === void 0 && (e = {});
  const {
    id: t,
    root: n
  } = e, o = _o(), r = Il(), [i, s] = N.useState(null), l = N.useRef(null);
  return ke(() => () => {
    i == null || i.remove(), queueMicrotask(() => {
      l.current = null;
    });
  }, [i]), ke(() => {
    if (!o || l.current) return;
    const a = t ? document.getElementById(t) : null;
    if (!a) return;
    const c = document.createElement("div");
    c.id = o, c.setAttribute(Bn, ""), a.appendChild(c), l.current = c, s(c);
  }, [t, o]), ke(() => {
    if (n === null || !o || l.current) return;
    let a = n || (r == null ? void 0 : r.portalNode);
    a && !G(a) && (a = a.current), a = a || document.body;
    let c = null;
    t && (c = document.createElement("div"), c.id = t, a.appendChild(c));
    const d = document.createElement("div");
    d.id = o, d.setAttribute(Bn, ""), a = c || a, a.appendChild(d), l.current = d, s(d);
  }, [t, n, o, r]), i;
}
function Dl(e) {
  const {
    children: t,
    id: n,
    root: o,
    preserveTabOrder: r = !0
  } = e, i = Ol({
    id: n,
    root: o
  }), [s, l] = N.useState(null), a = N.useRef(null), c = N.useRef(null), d = N.useRef(null), f = N.useRef(null), h = s == null ? void 0 : s.modal, m = s == null ? void 0 : s.open, w = (
    // The FocusManager and therefore floating element are currently open/
    // rendered.
    !!s && // Guards are only for non-modal focus management.
    !s.modal && // Don't render if unmount is transitioning.
    s.open && r && !!(o || i)
  );
  return N.useEffect(() => {
    if (!i || !r || h)
      return;
    function p(g) {
      i && kt(g) && (g.type === "focusin" ? _n : Al)(i);
    }
    return i.addEventListener("focusin", p, !0), i.addEventListener("focusout", p, !0), () => {
      i.removeEventListener("focusin", p, !0), i.removeEventListener("focusout", p, !0);
    };
  }, [i, r, h]), N.useEffect(() => {
    i && (m || _n(i));
  }, [m, i]), /* @__PURE__ */ N.createElement(Vo.Provider, {
    value: N.useMemo(() => ({
      preserveTabOrder: r,
      beforeOutsideRef: a,
      afterOutsideRef: c,
      beforeInsideRef: d,
      afterInsideRef: f,
      portalNode: i,
      setFocusManagerState: l
    }), [r, i])
  }, w && i && /* @__PURE__ */ N.createElement(Ln, {
    "data-type": "outside",
    ref: a,
    onFocus: (p) => {
      if (kt(p, i)) {
        var g;
        (g = d.current) == null || g.focus();
      } else {
        const v = Rl() || (s == null ? void 0 : s.refs.domReference.current);
        v == null || v.focus();
      }
    }
  }), w && i && /* @__PURE__ */ N.createElement("span", {
    "aria-owns": i.id,
    style: Fo
  }), i && /* @__PURE__ */ Kn.createPortal(t, i), w && i && /* @__PURE__ */ N.createElement(Ln, {
    "data-type": "outside",
    ref: c,
    onFocus: (p) => {
      if (kt(p, i)) {
        var g;
        (g = f.current) == null || g.focus();
      } else {
        const v = kl() || (s == null ? void 0 : s.refs.domReference.current);
        v == null || v.focus(), s != null && s.closeOnFocusOut && (s == null || s.onOpenChange(!1, p.nativeEvent, "focus-out"));
      }
    }
  }));
}
const Il = () => N.useContext(Vo), Tl = "data-floating-ui-focusable";
function Fn(e) {
  return re(e.target) && e.target.tagName === "BUTTON";
}
function Vn(e) {
  return ai(e);
}
function Ml(e, t) {
  t === void 0 && (t = {});
  const {
    open: n,
    onOpenChange: o,
    dataRef: r,
    elements: {
      domReference: i
    }
  } = e, {
    enabled: s = !0,
    event: l = "click",
    toggle: a = !0,
    ignoreMouse: c = !1,
    keyboardHandlers: d = !0,
    stickIfOpen: f = !0
  } = t, h = N.useRef(), m = N.useRef(!1), w = N.useMemo(() => ({
    onPointerDown(p) {
      h.current = p.pointerType;
    },
    onMouseDown(p) {
      const g = h.current;
      p.button === 0 && l !== "click" && (xn(g) && c || (n && a && (!(r.current.openEvent && f) || r.current.openEvent.type === "mousedown") ? o(!1, p.nativeEvent, "click") : (p.preventDefault(), o(!0, p.nativeEvent, "click"))));
    },
    onClick(p) {
      const g = h.current;
      if (l === "mousedown" && h.current) {
        h.current = void 0;
        return;
      }
      xn(g) && c || (n && a && (!(r.current.openEvent && f) || r.current.openEvent.type === "click") ? o(!1, p.nativeEvent, "click") : o(!0, p.nativeEvent, "click"));
    },
    onKeyDown(p) {
      h.current = void 0, !(p.defaultPrevented || !d || Fn(p)) && (p.key === " " && !Vn(i) && (p.preventDefault(), m.current = !0), p.key === "Enter" && o(!(n && a), p.nativeEvent, "click"));
    },
    onKeyUp(p) {
      p.defaultPrevented || !d || Fn(p) || Vn(i) || p.key === " " && m.current && (m.current = !1, o(!(n && a), p.nativeEvent, "click"));
    }
  }), [r, i, l, c, d, o, n, f, a]);
  return N.useMemo(() => s ? {
    reference: w
  } : {}, [s, w]);
}
const _l = {
  pointerdown: "onPointerDown",
  mousedown: "onMouseDown",
  click: "onClick"
}, Pl = {
  pointerdown: "onPointerDownCapture",
  mousedown: "onMouseDownCapture",
  click: "onClickCapture"
}, $n = (e) => {
  var t, n;
  return {
    escapeKey: typeof e == "boolean" ? e : (t = e == null ? void 0 : e.escapeKey) != null ? t : !1,
    outsidePress: typeof e == "boolean" ? e : (n = e == null ? void 0 : e.outsidePress) != null ? n : !0
  };
};
function Ll(e, t) {
  t === void 0 && (t = {});
  const {
    open: n,
    onOpenChange: o,
    elements: r,
    dataRef: i
  } = e, {
    enabled: s = !0,
    escapeKey: l = !0,
    outsidePress: a = !0,
    outsidePressEvent: c = "pointerdown",
    referencePress: d = !1,
    referencePressEvent: f = "pointerdown",
    ancestorScroll: h = !1,
    bubbles: m,
    capture: w
  } = t, p = Po(), g = Oe(typeof a == "function" ? a : () => !1), v = typeof a == "function" ? g : a, y = N.useRef(!1), b = N.useRef(!1), {
    escapeKey: E,
    outsidePress: k
  } = $n(m), {
    escapeKey: D,
    outsidePress: O
  } = $n(w), I = N.useRef(!1), F = Oe((R) => {
    var P;
    if (!n || !s || !l || R.key !== "Escape" || I.current)
      return;
    const $ = (P = i.current.floatingContext) == null ? void 0 : P.nodeId, T = p ? Nt(p.nodesRef.current, $) : [];
    if (!E && (R.stopPropagation(), T.length > 0)) {
      let M = !0;
      if (T.forEach((K) => {
        var Q;
        if ((Q = K.context) != null && Q.open && !K.context.dataRef.current.__escapeKeyBubbles) {
          M = !1;
          return;
        }
      }), !M)
        return;
    }
    o(!1, ii(R) ? R.nativeEvent : R, "escape-key");
  }), S = Oe((R) => {
    var P;
    const $ = () => {
      var T;
      F(R), (T = Be(R)) == null || T.removeEventListener("keydown", $);
    };
    (P = Be(R)) == null || P.addEventListener("keydown", $);
  }), _ = Oe((R) => {
    var P;
    const $ = y.current;
    y.current = !1;
    const T = b.current;
    if (b.current = !1, c === "click" && T || $ || typeof v == "function" && !v(R))
      return;
    const M = Be(R), K = "[" + ln("inert") + "]", Q = Vt(r.floating).querySelectorAll(K);
    let me = G(M) ? M : null;
    for (; me && !ye(me); ) {
      const ne = fe(me);
      if (ye(ne) || !G(ne))
        break;
      me = ne;
    }
    if (Q.length && G(M) && !li(M) && // Clicked on a direct ancestor (e.g. FloatingOverlay).
    !Ft(M, r.floating) && // If the target root element contains none of the markers, then the
    // element was injected after the floating element rendered.
    Array.from(Q).every((ne) => !Ft(me, ne)))
      return;
    if (re(M) && q) {
      const ne = M.clientWidth > 0 && M.scrollWidth > M.clientWidth, he = M.clientHeight > 0 && M.scrollHeight > M.clientHeight;
      let Pe = he && R.offsetX > M.clientWidth;
      if (he && oe(M).direction === "rtl" && (Pe = R.offsetX <= M.offsetWidth - M.clientWidth), Pe || ne && R.offsetY > M.clientHeight)
        return;
    }
    const an = (P = i.current.floatingContext) == null ? void 0 : P.nodeId, Wo = p && Nt(p.nodesRef.current, an).some((ne) => {
      var he;
      return xt(R, (he = ne.context) == null ? void 0 : he.elements.floating);
    });
    if (xt(R, r.floating) || xt(R, r.domReference) || Wo)
      return;
    const un = p ? Nt(p.nodesRef.current, an) : [];
    if (un.length > 0) {
      let ne = !0;
      if (un.forEach((he) => {
        var Pe;
        if ((Pe = he.context) != null && Pe.open && !he.context.dataRef.current.__outsidePressBubbles) {
          ne = !1;
          return;
        }
      }), !ne)
        return;
    }
    o(!1, R, "outside-press");
  }), B = Oe((R) => {
    var P;
    const $ = () => {
      var T;
      _(R), (T = Be(R)) == null || T.removeEventListener(c, $);
    };
    (P = Be(R)) == null || P.addEventListener(c, $);
  });
  N.useEffect(() => {
    if (!n || !s)
      return;
    i.current.__escapeKeyBubbles = E, i.current.__outsidePressBubbles = k;
    let R = -1;
    function P(Q) {
      o(!1, Q, "ancestor-scroll");
    }
    function $() {
      window.clearTimeout(R), I.current = !0;
    }
    function T() {
      R = window.setTimeout(
        () => {
          I.current = !1;
        },
        // 0ms or 1ms don't work in Safari. 5ms appears to consistently work.
        // Only apply to WebKit for the test to remain 0ms.
        mt() ? 5 : 0
      );
    }
    const M = Vt(r.floating);
    l && (M.addEventListener("keydown", D ? S : F, D), M.addEventListener("compositionstart", $), M.addEventListener("compositionend", T)), v && M.addEventListener(c, O ? B : _, O);
    let K = [];
    return h && (G(r.domReference) && (K = be(r.domReference)), G(r.floating) && (K = K.concat(be(r.floating))), !G(r.reference) && r.reference && r.reference.contextElement && (K = K.concat(be(r.reference.contextElement)))), K = K.filter((Q) => {
      var me;
      return Q !== ((me = M.defaultView) == null ? void 0 : me.visualViewport);
    }), K.forEach((Q) => {
      Q.addEventListener("scroll", P, {
        passive: !0
      });
    }), () => {
      l && (M.removeEventListener("keydown", D ? S : F, D), M.removeEventListener("compositionstart", $), M.removeEventListener("compositionend", T)), v && M.removeEventListener(c, O ? B : _, O), K.forEach((Q) => {
        Q.removeEventListener("scroll", P);
      }), window.clearTimeout(R);
    };
  }, [i, r, l, v, c, n, o, h, s, E, k, F, D, S, _, O, B]), N.useEffect(() => {
    y.current = !1;
  }, [v, c]);
  const Y = N.useMemo(() => ({
    onKeyDown: F,
    [_l[f]]: (R) => {
      d && o(!1, R.nativeEvent, "reference-press");
    }
  }), [F, o, d, f]), q = N.useMemo(() => ({
    onKeyDown: F,
    onMouseDown() {
      b.current = !0;
    },
    onMouseUp() {
      b.current = !0;
    },
    [Pl[c]]: () => {
      y.current = !0;
    }
  }), [F, c]);
  return N.useMemo(() => s ? {
    reference: Y,
    floating: q
  } : {}, [s, Y, q]);
}
function Bl(e) {
  const {
    open: t = !1,
    onOpenChange: n,
    elements: o
  } = e, r = _o(), i = N.useRef({}), [s] = N.useState(() => xl()), l = Nl() != null;
  if (process.env.NODE_ENV !== "production") {
    const m = o.reference;
    m && !G(m) && yl("Cannot pass a virtual element to the `elements.reference` option,", "as it must be a real DOM element. Use `refs.setPositionReference()`", "instead.");
  }
  const [a, c] = N.useState(o.reference), d = Oe((m, w, p) => {
    i.current.openEvent = m ? w : void 0, s.emit("openchange", {
      open: m,
      event: w,
      reason: p,
      nested: l
    }), n == null || n(m, w, p);
  }), f = N.useMemo(() => ({
    setPositionReference: c
  }), []), h = N.useMemo(() => ({
    reference: a || o.reference || null,
    floating: o.floating || null,
    domReference: o.reference
  }), [a, o.reference, o.floating]);
  return N.useMemo(() => ({
    dataRef: i,
    open: t,
    onOpenChange: d,
    elements: h,
    events: s,
    floatingId: r,
    refs: f
  }), [t, d, h, s, r, f]);
}
function Fl(e) {
  e === void 0 && (e = {});
  const {
    nodeId: t
  } = e, n = Bl({
    ...e,
    elements: {
      reference: null,
      floating: null,
      ...e.elements
    }
  }), o = e.rootContext || n, r = o.elements, [i, s] = N.useState(null), [l, a] = N.useState(null), d = (r == null ? void 0 : r.domReference) || i, f = N.useRef(null), h = Po();
  ke(() => {
    d && (f.current = d);
  }, [d]);
  const m = dl({
    ...e,
    elements: {
      ...r,
      ...l && {
        reference: l
      }
    }
  }), w = N.useCallback((b) => {
    const E = G(b) ? {
      getBoundingClientRect: () => b.getBoundingClientRect(),
      contextElement: b
    } : b;
    a(E), m.refs.setReference(E);
  }, [m.refs]), p = N.useCallback((b) => {
    (G(b) || b === null) && (f.current = b, s(b)), (G(m.refs.reference.current) || m.refs.reference.current === null || // Don't allow setting virtual elements using the old technique back to
    // `null` to support `positionReference` + an unstable `reference`
    // callback ref.
    b !== null && !G(b)) && m.refs.setReference(b);
  }, [m.refs]), g = N.useMemo(() => ({
    ...m.refs,
    setReference: p,
    setPositionReference: w,
    domReference: f
  }), [m.refs, p, w]), v = N.useMemo(() => ({
    ...m.elements,
    domReference: d
  }), [m.elements, d]), y = N.useMemo(() => ({
    ...m,
    ...o,
    refs: g,
    elements: v,
    nodeId: t
  }), [m, g, v, t, o]);
  return ke(() => {
    o.dataRef.current.floatingContext = y;
    const b = h == null ? void 0 : h.nodesRef.current.find((E) => E.id === t);
    b && (b.context = y);
  }), N.useMemo(() => ({
    ...m,
    context: y,
    refs: g,
    elements: v
  }), [m, g, v, y]);
}
const jn = "active", Hn = "selected";
function Rt(e, t, n) {
  const o = /* @__PURE__ */ new Map(), r = n === "item";
  let i = e;
  if (r && e) {
    const {
      [jn]: s,
      [Hn]: l,
      ...a
    } = e;
    i = a;
  }
  return {
    ...n === "floating" && {
      tabIndex: -1,
      [Tl]: ""
    },
    ...i,
    ...t.map((s) => {
      const l = s ? s[n] : null;
      return typeof l == "function" ? e ? l(e) : null : l;
    }).concat(e).reduce((s, l) => (l && Object.entries(l).forEach((a) => {
      let [c, d] = a;
      if (!(r && [jn, Hn].includes(c)))
        if (c.indexOf("on") === 0) {
          if (o.has(c) || o.set(c, []), typeof d == "function") {
            var f;
            (f = o.get(c)) == null || f.push(d), s[c] = function() {
              for (var h, m = arguments.length, w = new Array(m), p = 0; p < m; p++)
                w[p] = arguments[p];
              return (h = o.get(c)) == null ? void 0 : h.map((g) => g(...w)).find((g) => g !== void 0);
            };
          }
        } else
          s[c] = d;
    }), s), {})
  };
}
function Vl(e) {
  e === void 0 && (e = []);
  const t = e.map((l) => l == null ? void 0 : l.reference), n = e.map((l) => l == null ? void 0 : l.floating), o = e.map((l) => l == null ? void 0 : l.item), r = N.useCallback(
    (l) => Rt(l, e, "reference"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    t
  ), i = N.useCallback(
    (l) => Rt(l, e, "floating"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    n
  ), s = N.useCallback(
    (l) => Rt(l, e, "item"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    o
  );
  return N.useMemo(() => ({
    getReferenceProps: r,
    getFloatingProps: i,
    getItemProps: s
  }), [r, i, s]);
}
function $l({
  isOpen: e,
  setIsOpen: t,
  offset: n = 0,
  placement: o = "bottom-start",
  click: r = !0
}) {
  const { x: i, y: s, strategy: l, refs: a, context: c } = Fl({
    open: e,
    onOpenChange: t,
    middleware: [ml(), fl(n), hl()],
    whileElementsMounted: rl,
    placement: o
  }), d = Ml(c, {
    enabled: r
  }), f = Ll(c, {}), { getReferenceProps: h, getFloatingProps: m } = Vl([
    d,
    f
  ]);
  return {
    x: i,
    y: s,
    strategy: l,
    refs: a,
    getReferenceProps: h,
    getFloatingProps: m
  };
}
function le({
  isOpen: e,
  setIsOpen: t,
  offset: n = 0,
  placement: o = "bottom-start",
  hover: r = !1,
  click: i = !0,
  onReferenceClick: s,
  children: l,
  portal: a
}) {
  const { x: c, y: d, strategy: f, refs: h, getReferenceProps: m, getFloatingProps: w } = $l({
    isOpen: e,
    setIsOpen: t,
    offset: n,
    placement: o,
    click: i
  }), [p, g] = Yo.toArray(l), [v] = C(to);
  function y() {
    return e && /* @__PURE__ */ u(Dl, { id: v, children: /* @__PURE__ */ u(
      "div",
      {
        ref: h.setFloating,
        style: {
          position: f,
          top: d ?? 0,
          left: c ?? 0,
          zIndex: 1
        },
        ...w(),
        children: g
      }
    ) });
  }
  function b() {
    return e && /* @__PURE__ */ u(
      "div",
      {
        ref: h.setFloating,
        style: {
          position: f,
          top: d ?? 0,
          left: c ?? 0
        },
        ...w(),
        children: g
      }
    );
  }
  return /* @__PURE__ */ x(Z, { children: [
    /* @__PURE__ */ u(
      "div",
      {
        ref: h.setReference,
        ...m({ onClick: s }),
        children: p
      }
    ),
    a ? y() : b()
  ] });
}
function jl({
  rowId: e,
  colId: t,
  data: n,
  setData: o,
  focus: r,
  isViewOnly: i,
  columnConfiguration: s,
  tableConfiguration: l
}) {
  const a = H(
    () => l.parseDate !== void 0 ? l.parseDate(n, s) : n ? new Date(Date.parse(n)) : null,
    [n, s]
  ), [c, d] = V(
    a && a._isValid !== !1 ? Ve(a) : ""
  ), f = /^([1-9]|1[012]|0[1-9])[/.-]?$/g, h = /^([1-9]|1[012]|0[1-9])[/.-]([1-9]||0[1-9]|1[0-9]|2[0-9]|3[01])[/.-]?$/g, m = /^([1-9]|1[012]|0[1-9])[/.-]([1-9]||0[1-9]|1[0-9]|2[0-9]|3[01])[/.-](\d?\d?\d?\d)$/g, [w, p] = V(null), g = /* @__PURE__ */ new Date(), v = ae(n), [, y] = C(Qt), b = r === "editing", E = J(
    (I) => {
      y({ rowId: e, colId: t, value: I ? "editing" : "focused" });
    },
    [e, t, y]
  );
  function k(I, F, S) {
    const _ = Number(S), B = Number(I) - 1, Y = Number(F), q = /* @__PURE__ */ new Date();
    return q.setUTCFullYear(_, B, Y), q.setUTCHours(0, 0, 0, 0), q;
  }
  const D = J(
    (I) => {
      l.formatStoredDate !== void 0 ? o(
        l.formatStoredDate(
          I,
          s
        ) || ""
      ) : o((I == null ? void 0 : I.toISOString()) || ""), l.formatStoredDate !== void 0 ? d(
        l.formatStoredDate(
          a,
          s
        ) || ""
      ) : d(Ve(I)), y({ rowId: e, colId: t, value: "focused" });
    },
    [e, t, y, o]
  );
  z(() => {
    w && w.focus();
  }, [w]), z(() => {
    r === "editing" && (v.current = n), l.formatStoredDate !== void 0 ? d(
      l.formatStoredDate(a, s) || ""
    ) : d(
      a && a._isValid !== !1 ? Ve(a) : ""
    );
  }, [r]);
  function O(I) {
    d(I.target.value);
  }
  return zs(() => {
    if (!c || l.formatStoredDate !== void 0)
      return;
    let I = null;
    if (m.test(c)) {
      c.match(m);
      const [F] = c.matchAll(m);
      I = k(F[1], F[2], F[3]);
    } else if (f.test(c)) {
      c.match(f);
      const [F] = c.matchAll(f);
      I = k(F[1], 1, g.getUTCFullYear());
    } else if (h.test(c)) {
      c.match(h);
      const [F] = c.matchAll(h);
      I = k(
        F[1],
        F[2],
        g.getUTCFullYear()
      );
    }
    o((I == null ? void 0 : I.toISOString()) || "");
  }, [c]), /* @__PURE__ */ x(Z, { children: [
    (r === "none" || r === "focused") && /* @__PURE__ */ u("div", { className: "p-1 flex items-center cursor-default w-full", children: a ? l.formatDisplayDate !== void 0 ? l.formatDisplayDate(
      a,
      s
    ) : Ve(a) : "" }),
    r === "editing" && !i && /* @__PURE__ */ x(le, { isOpen: b, setIsOpen: E, offset: 4, children: [
      /* @__PURE__ */ x("div", { className: "h-full", children: [
        /* @__PURE__ */ u("input", { type: "data", className: "hidden", value: c, readOnly: !0 }),
        /* @__PURE__ */ u(
          "input",
          {
            placeholder: "mm/dd/yyyy",
            className: "rs-input focus:outline-none rounded p-1 w-full",
            onChange: O,
            value: c,
            ref: p,
            onKeyDown: (I) => {
              I.code === "Escape" && (I.stopPropagation(), I.nativeEvent.stopImmediatePropagation(), o(v.current), y({ rowId: e, colId: t, value: "focused" }));
            }
          }
        )
      ] }),
      /* @__PURE__ */ u(
        Qs,
        {
          onSelect: D,
          value: (a == null ? void 0 : a._isValid) !== !1 ? a : null
        }
      )
    ] })
  ] });
}
function Hl({ rowData: e, formula: t }) {
  return /* @__PURE__ */ u(Z, { children: /* @__PURE__ */ u("div", { className: "p-1 flex items-center cursor-default w-full", children: /* @__PURE__ */ u("div", { className: "truncate", children: t && typeof t == "function" && t(e) }) }) });
}
function Ul({ data: e, setData: t, focusState: n, isViewOnly: o }) {
  const [r, i] = V(null), s = H(() => e || "", [e]), l = H(() => {
    try {
      const c = new URL(e);
      return e;
    } catch {
      return `//${e}`;
    }
  }, [e]);
  function a(c) {
    c.preventDefault(), t(c.target.value);
  }
  return z(() => {
    r && (r.focus(), r.setSelectionRange(s.length + 1, s.length + 1), r.scrollLeft = r.scrollWidth);
  }, [r]), /* @__PURE__ */ x(Z, { children: [
    (n === "none" || n === "focused") && /* @__PURE__ */ u("div", { className: "p-1 flex items-center cursor-default w-full", children: /* @__PURE__ */ u("div", { className: "truncate", children: /* @__PURE__ */ u(
      "a",
      {
        href: l,
        rel: "noopener noreferrer",
        target: "_blank",
        className: "text-primary",
        children: e
      }
    ) }) }),
    n === "editing" && !o && /* @__PURE__ */ u(
      "input",
      {
        ref: i,
        type: "text",
        value: s,
        onChange: a,
        tabIndex: -1,
        rows: 1,
        className: "focus:outline-none rs-input p-1 w-full border-none text-sm rounded-sm truncate resize-none max-h-8"
      }
    )
  ] });
}
const Wl = {
  32: "truncate",
  64: "line-clamp-2",
  96: "line-clamp-4",
  128: "line-clamp-5"
};
function Kl({ data: e, setData: t, focusState: n, isViewOnly: o, setFocus: r }) {
  const [i, s] = V(null), l = H(() => e || "", [e]), [a] = C(Zt);
  function c(f) {
    f.preventDefault(), t(f.target.value);
  }
  function d(f) {
    f.code === "Enter" && (f.ctrlKey || f.metaKey) ? (f.preventDefault(), f.stopPropagation(), r("focused")) : f.code === "Enter" && f.stopPropagation();
  }
  return z(() => {
    i && (i.focus(), i.setSelectionRange(
      l.length + 1,
      l.length || 1
    ), i.scrollTop = i.scrollHeight);
  }, [i]), /* @__PURE__ */ x(Z, { children: [
    (n === "none" || n === "focused") && /* @__PURE__ */ u(
      "div",
      {
        className: U(
          "p-1 cursor-default w-full h-full",
          Wl[a]
        ),
        children: e
      }
    ),
    n === "editing" && !o && /* @__PURE__ */ u(
      "textarea",
      {
        ref: s,
        name: "text",
        value: l,
        onChange: c,
        onKeyDown: d,
        tabIndex: -1,
        className: "rs-textarea p-1 focus:outline-none border-none text-sm w-full max-w-full h-32 rounded-sm resize-none break-words"
      }
    )
  ] });
}
const Gl = [
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
function ze({
  options: e = Gl,
  allOptions: t,
  onSelect: n,
  placeholder: o = "Search",
  inputRef: r,
  OptionRenderer: i,
  value: s = {},
  onNewOption: l,
  enableSearch: a = !0
}) {
  const [c, d] = V(e), f = c.find((S) => S.value === s.value), [h, m] = V(f || c[0]), [w, p] = V(!1), [g, v] = V(""), y = H(() => Mt(), []), [b, E] = V({}), k = ae(!1);
  z(() => {
    let S = !1;
    if (t)
      for (const B in t)
        t[B].name.toLowerCase() === g.toLowerCase() && (S = !0);
    const _ = e.filter((B) => (B.name.toLowerCase() === g.toLowerCase() && (S = !0), B.name.toLowerCase().includes(g.toLowerCase())));
    d(_), k.current ? _.length > 0 ? m(_[0]) : m({
      value: g,
      name: g,
      color: y
    }) : m(f || _[0]), E(S ? {} : {
      value: g,
      name: g,
      color: y
    }), p(S);
  }, [g]);
  function D(S) {
    n == null || n(S);
  }
  function O(S) {
    p(!1), v(S.target.value), k.current = !0;
  }
  const I = J((S) => {
    if (S.code === "Enter") {
      if (S.preventDefault(), c.length === 0 && w || !h.value)
        return;
      l && !w && l(b), D(h);
    } else if (S.code === "ArrowDown") {
      h || m(c[0]);
      const _ = c.findIndex(
        (B) => B.value === h.value
      );
      m(c[(_ + 1) % c.length]);
    } else if (S.code === "ArrowUp") {
      h || m(c[0]);
      const _ = c.findIndex(
        (B) => B.value === h.value
      );
      m(
        c[(_ + c.length - 1) % c.length]
      );
    }
  });
  function F(S) {
    S.preventDefault(), m(c[0]);
  }
  return /* @__PURE__ */ x(
    "div",
    {
      className: "w-full relative pt-2",
      onKeyDown: I,
      onMouseEnter: F,
      role: "searchbox",
      tabIndex: 0,
      children: [
        a && /* @__PURE__ */ u("div", { className: "px-2 mb-2", children: /* @__PURE__ */ u(
          "input",
          {
            className: "rs-input border focus:ring rounded-2 rounded focus:outline-none px-2 p-1 w-full truncate",
            placeholder: o,
            onChange: O,
            ref: r,
            value: g
          }
        ) }),
        /* @__PURE__ */ x("ul", { className: "rs-list max-h-48 overflow-auto pb-2", children: [
          c.map((S) => /* @__PURE__ */ x(
            "li",
            {
              className: U(
                "hover:bg-hover-light px-2 p-1 cursor-default flex flex-row whitespace-nowrap",
                h && h.value === S.value && "bg-hover"
              ),
              onClick: (_) => {
                _.preventDefault(), D(S);
              },
              onMouseEnter: () => {
                m(S);
              },
              "aria-selected": h.value === S.value,
              onKeyDown: (_) => {
                _.code === "Enter" && D(S);
              },
              children: [
                i ? /* @__PURE__ */ u(i, { ...S }) : S.name,
                f && f.value === S.value && /* @__PURE__ */ u(en, { className: "w-4 h-4 ml-auto self-center" })
              ]
            },
            S.value
          )),
          l && g && !w && /* @__PURE__ */ x(
            "li",
            {
              className: U(
                "hover:bg-hover-light px-2 p-1 cursor-pointer flex flex-row whitespace-nowrap",
                h && h.value === b.value && "bg-hover"
              ),
              onClick: () => l(b),
              onMouseEnter: () => {
                m(b);
              },
              "aria-selected": !1,
              onKeyDown: (S) => {
                S.code === "Enter" && l(b);
              },
              children: [
                /* @__PURE__ */ u("span", { className: "mr-2", children: "Add option:" }),
                i ? /* @__PURE__ */ u(i, { ...b }) : b.name
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
  setData: o,
  options: r,
  updateColumn: i,
  focusState: s,
  showOptionSearch: l,
  isViewOnly: a
}) {
  const c = H(
    () => Re(n) ? [] : n.split(",").map((v) => r.find((y) => y.value === v)),
    [n, r]
  ), [d, f] = V(null), h = s === "editing", [, m] = C(Qt), w = J(
    (v) => {
      m({ rowId: e, colId: t, value: v ? "editing" : "focused" });
    },
    [t, e, m]
  ), p = r.filter(
    (v) => c.findIndex((y) => y.value === v.value) === -1
  );
  z(() => {
    d && d.focus();
  }, [d]);
  const g = J(
    (v) => {
      i({ id: t, options: [...r, v] }), o([...c.map((y) => y.value), v.value].join(",")), m({ rowId: e, colId: t, value: "focused" });
    },
    [t, e, c, r, i, o, m]
  );
  return /* @__PURE__ */ x(Z, { children: [
    s === "none" && /* @__PURE__ */ u("div", { className: "p-1 flex items-center h-full overflow-hidden", children: /* @__PURE__ */ u("div", { className: "flex gap-1", children: c.map((v) => v ? /* @__PURE__ */ u(ge, { color: v.color, name: v.name }, v.name) : null) }) }),
    (s === "focused" || s === "editing") && /* @__PURE__ */ x(
      le,
      {
        isOpen: h && !a,
        setIsOpen: w,
        referenceClass: "w-full max-h-8",
        children: [
          /* @__PURE__ */ u(
            "div",
            {
              className: "flex items-center p-1 w-full h-full bg-content",
              tabIndex: s === "editing" ? 0 : -1,
              children: /* @__PURE__ */ x("div", { className: "flex gap-1 flex-wrap", children: [
                c.map((v) => v ? /* @__PURE__ */ u(
                  ge,
                  {
                    color: v.color,
                    name: v.name,
                    onCancel: (y) => {
                      y.stopPropagation(), o(
                        n.split(",").filter((b) => b !== v.value).join(",")
                      );
                    }
                  },
                  v.name
                ) : null),
                /* @__PURE__ */ u(
                  "button",
                  {
                    className: "p-[3px] bg-zinc-100 rounded flex items-center h-full",
                    type: "button",
                    children: /* @__PURE__ */ u(We, { className: "w-4 h-4 text-dark" })
                  }
                )
              ] })
            }
          ),
          /* @__PURE__ */ x(L, { children: [
            /* @__PURE__ */ u("div", { className: "w-48" }),
            /* @__PURE__ */ u(
              ze,
              {
                allOptions: r,
                options: p,
                onSelect: (v) => {
                  o(
                    Re(n) ? v.value : `${n},${v.value}`
                  );
                },
                inputRef: f,
                OptionRenderer: ge,
                placeholder: "Search for an option...",
                onNewOption: g,
                enableSearch: l
              }
            )
          ] })
        ]
      }
    )
  ] });
}
function ql({
  data: e,
  setData: t,
  setError: n,
  focus: o,
  isViewOnly: r,
  configuration: i
}) {
  const [s] = C(ie), [l, a] = V(null), c = /^[+-]?(\d*(\.\d*)?)$/, d = H(() => s.parseNumber !== void 0 ? s.parseNumber(e, i) : Number.parseFloat(e), [e, i]);
  function f(m) {
    m.preventDefault(), (s.parseNumber !== void 0 ? !Number.isNaN(s.parseNumber(m.target.value, i)) : c.test(m.target.value)) ? (t(m.target.value), n("")) : n("Please enter a number.");
  }
  z(() => {
    n(""), l && l.focus();
  }, [n, l]);
  const h = (e || "").toString();
  return /* @__PURE__ */ x(Z, { children: [
    (o === "none" || o === "focused") && /* @__PURE__ */ u("div", { className: "p-1 flex items-center justify-end truncate cursor-default w-full", children: s.formatDisplayNumber !== void 0 ? s.formatDisplayNumber(d, i) : h }),
    o === "editing" && !r && /* @__PURE__ */ u(
      "input",
      {
        type: "text",
        value: h,
        onChange: f,
        ref: a,
        className: "rs-input p-1 focus:outline-none w-full border-none text-sm rounded-sm truncate text-right"
      }
    )
  ] });
}
function Yl({
  rowId: e,
  colId: t,
  data: n,
  setData: o,
  options: r,
  updateColumn: i,
  focusState: s,
  showOptionSearch: l,
  isViewOnly: a,
  tableConfiguration: c
}) {
  const d = H(
    () => He(n) ? {} : r.find((y) => y.value === n)
  ), [f, h] = V(null), m = H(() => [
    {
      value: null,
      isBlank: !0,
      name: "Blank"
    },
    ...r
  ], [r]), w = s === "editing", [, p] = C(Qt), g = J(
    (y) => {
      p({ rowId: e, colId: t, value: y ? "editing" : "focused" });
    },
    [t, e, p]
  );
  z(() => {
    f && f.focus();
  }, [f]);
  const v = J(
    (y) => {
      i({ id: t, options: [...r, y] }), o(y.value), p({ rowId: e, colId: t, value: "focused" });
    },
    [t, e, r, i]
  );
  return /* @__PURE__ */ x(Z, { children: [
    s === "none" && /* @__PURE__ */ u("div", { className: "p-1 flex items-center h-full", children: d && /* @__PURE__ */ u(ge, { color: d.color, name: d.name }) }),
    a && (s === "focused" || s === "editing") && /* @__PURE__ */ u("div", { className: "flex items-center p-1 w-full h-full", children: d && /* @__PURE__ */ u(ge, { color: d.color, name: d.name }) }),
    !a && (s === "focused" || s === "editing") && /* @__PURE__ */ x(
      le,
      {
        isOpen: w,
        setIsOpen: g,
        referenceClass: "w-full max-h-8",
        children: [
          /* @__PURE__ */ x(
            "div",
            {
              className: "flex items-center p-1 w-full h-full",
              tabIndex: s === "editing" ? 0 : -1,
              children: [
                d && /* @__PURE__ */ u(ge, { color: d.color, name: d.name }),
                /* @__PURE__ */ u(
                  tn,
                  {
                    className: "w-4 h-4 ml-auto",
                    style: { alignSelf: "center" }
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ x(L, { children: [
            /* @__PURE__ */ u("div", { className: "w-48" }),
            /* @__PURE__ */ u(
              ze,
              {
                options: m,
                onSelect: (y) => {
                  o(y.value), g(!1);
                },
                inputRef: h,
                OptionRenderer: ({ isBlank: y, ...b }) => y ? /* @__PURE__ */ u(
                  Ks,
                  {
                    tableConfiguration: c,
                    ...b
                  }
                ) : /* @__PURE__ */ u(ge, { ...b }),
                placeholder: "Search for an option...",
                value: d,
                onNewOption: v,
                enableSearch: l
              }
            )
          ] })
        ]
      }
    )
  ] });
}
function Xl({ data: e, setData: t, focusState: n, isViewOnly: o }) {
  const [r, i] = V(null), s = H(() => e || "", [e]);
  function l(a) {
    a.preventDefault(), t(a.target.value);
  }
  return z(() => {
    r && (r.focus(), r.setSelectionRange(s.length + 1, s.length + 1), r.scrollLeft = r.scrollWidth);
  }, [r]), /* @__PURE__ */ x(Z, { children: [
    (n === "none" || n === "focused") && /* @__PURE__ */ u("div", { className: "p-1 flex items-center cursor-default w-full", children: /* @__PURE__ */ u("div", { className: "truncate", children: e }) }),
    n === "editing" && !o && /* @__PURE__ */ u(
      "input",
      {
        ref: i,
        type: "text",
        value: s,
        onChange: l,
        tabIndex: -1,
        rows: 1,
        className: "focus:outline-none rs-input p-1 w-full border-none text-sm rounded-sm truncate resize-none max-h-8"
      }
    )
  ] });
}
const $o = [
  {
    type: "text",
    cell: Xl,
    icon: Is,
    name: "Single-Line Text"
  },
  {
    type: "longText",
    cell: Kl,
    icon: as,
    name: "Long Text"
  },
  {
    type: "number",
    cell: ql,
    icon: Es,
    name: "Number"
  },
  {
    type: "select",
    cell: Yl,
    icon: Ns,
    name: "Select"
  },
  {
    type: "date",
    cell: jl,
    icon: gs,
    name: "Date"
  },
  {
    type: "multiSelect",
    cell: zl,
    icon: Ps,
    name: "Multiple Select"
  },
  {
    type: "url",
    cell: Ul,
    icon: Ms,
    name: "URL"
  },
  {
    type: "checkbox",
    cell: Gs,
    icon: $s,
    name: "Checkbox"
  },
  {
    type: "formula",
    cell: Hl,
    icon: Hs,
    name: "Formula"
  }
];
function st(e) {
  const [t] = C(ie);
  return [...$o, ...t.extraColumnTypes].find((n) => n.type === e);
}
function Jl() {
  return $o;
}
const Zl = Te.memo(Ql);
function Ql({ rowId: e, colId: t, data: n, rowData: o, setData: r }) {
  const [i, s] = V(""), l = ae(null), a = ae(n), c = H(
    () => ut(e, t),
    [e, t]
  ), [d, f] = C(c), h = H(() => xe(t), [t]), [m, w] = C(h), [p] = C(ie), g = m.type === "custom" ? m.renderer : st(m.type).cell, v = H(
    () => is(e, t),
    [e, t]
  ), [, y] = C(v);
  function b(O) {
    l.current && !l.current.contains(O.target) && f("none");
  }
  function E(O) {
    if (!l.current || O.target !== l.current) {
      O.code === "Escape" ? (r(a.current), f("focused")) : O.code === "Enter" && f("focused");
      return;
    }
    O.code === "ArrowUp" ? (O.stopPropagation(), O.preventDefault(), y("up")) : O.code === "ArrowDown" ? (O.stopPropagation(), O.preventDefault(), y("down")) : O.code === "ArrowLeft" ? (O.stopPropagation(), O.preventDefault(), y("left")) : O.code === "ArrowRight" ? (O.stopPropagation(), O.preventDefault(), y("right")) : O.code === "Enter" ? (a.current = n, f("editing"), O.stopPropagation(), O.preventDefault()) : O.code === "Escape" && f("none");
  }
  function k(O) {
    l.current && O.target === l.current && f("focused");
  }
  function D(O) {
    O.stopPropagation(), !m.isViewOnly && (a.current = n, f("editing"));
  }
  return z(() => d === "focused" ? (document == null || document.addEventListener("mousedown", b), l.current && l.current.focus(), () => {
    document == null || document.removeEventListener("mousedown", b);
  }) : d === "editing" ? (document == null || document.addEventListener("mousedown", b), () => {
    document == null || document.removeEventListener("mousedown", b);
  }) : d === "none" ? (l.current && l.current.blur(), () => {
  }) : () => {
  }, [d]), /* @__PURE__ */ u(
    "div",
    {
      className: "relative p-0 border-r bg-content focus:outline-none",
      style: { width: m.width },
      ref: l,
      onClick: k,
      onFocus: k,
      onDoubleClick: D,
      tabIndex: 0,
      onKeyDown: E,
      role: "gridcell",
      children: /* @__PURE__ */ x(
        "div",
        {
          className: U(
            "w-full rounded-sm min-h-full focus:outline-none",
            (d === "focused" || d === "editing") && "ring-2 ring-blue-500 absolute top-0 z-10"
          ),
          children: [
            /* @__PURE__ */ u(
              g,
              {
                rowId: e,
                colId: t,
                initData: n,
                data: n,
                options: m.options,
                updateColumn: w,
                setError: s,
                focus: d,
                focusState: d,
                setFocus: f,
                setData: r,
                showOptionSearch: m.showOptionSearch,
                isViewOnly: m.isViewOnly,
                rowData: o,
                formula: m.formula,
                columnConfiguration: m.configuration,
                tableConfiguration: p
              }
            ),
            d === "editing" && i && /* @__PURE__ */ u("div", { className: "text-xs p-1.5 py-2", children: i })
          ]
        }
      )
    }
  );
}
function ec(e, t) {
  if (e == null || e === "")
    return "(empty)";
  switch (t.type) {
    case "select": {
      const n = t.options.find((o) => o.value === e);
      return /* @__PURE__ */ u(ge, { color: n.color, name: n.name });
    }
    case "date":
      return Ve(new Date(Date.parse(e)));
    default:
      return e;
  }
}
function tc({ groupVal: e }) {
  const [t] = C(Me), n = H(
    () => {
      var s;
      return xe(((s = t[0]) == null ? void 0 : s.columnId) || "");
    },
    [t]
  ), [o] = C(n), [r, i] = C(qt);
  return /* @__PURE__ */ x(
    "div",
    {
      className: U(
        "w-full h-16 bg-header rounded-t-md border flex",
        r[e] && "rounded-b-md"
      ),
      children: [
        /* @__PURE__ */ u(
          "button",
          {
            type: "button",
            className: "h-full flex items-center justify-center w-16",
            onClick: () => i((s) => ({ ...s, [e]: !s[e] })),
            children: /* @__PURE__ */ u(tn, { className: "w-4 h-4" })
          }
        ),
        /* @__PURE__ */ x("div", { className: "h-full p-1.5", children: [
          /* @__PURE__ */ u("div", { className: "text-xs tracking-wider uppercase font-medium text-secondary", children: o.name }),
          /* @__PURE__ */ u("div", { className: "flex mt-1", children: ec(e, o) })
        ] })
      ]
    }
  );
}
function nc({ groupVal: e }) {
  const [t] = C(Me), [, n] = C(oo);
  function o(r) {
    r.preventDefault();
    const i = { data: {} };
    t.length > 0 && (i[t[0].columnId] = e), n({ id: lt(), ...i });
  }
  return /* @__PURE__ */ u(
    "button",
    {
      type: "button",
      onClick: o,
      className: U(
        "rs-btn h-8 border-b border-r font-normal text-sm cursor-pointer flex items-center hover:bg-hover bg-content",
        t.length > 0 && "border-l rounded-b-md"
      ),
      children: /* @__PURE__ */ u("div", { className: "flex items-center justify-center", style: { width: 63 }, children: /* @__PURE__ */ u(We, { className: "w-4 h-4" }) })
    }
  );
}
function oc({ rowId: e, first: t, last: n, groupVal: o }) {
  const [r] = C(Me), [i] = C(qt), [s] = C(so), [l] = C(ie);
  return /* @__PURE__ */ x(
    "div",
    {
      className: U(
        t && r.length > 0 && "mt-8",
        r.length > 0 && "ml-4"
      ),
      style: { width: s },
      children: [
        r.length > 0 && t && /* @__PURE__ */ u(tc, { groupVal: o }),
        !i[o] && /* @__PURE__ */ x(Z, { children: [
          /* @__PURE__ */ u("div", { className: U(r.length > 0 && "border-l"), children: /* @__PURE__ */ u(rc, { rowId: e }) }),
          l.addRow.enabled && l.addRow.body && n && /* @__PURE__ */ u(nc, { groupVal: o }),
          " "
        ] })
      ]
    }
  );
}
const rc = Te.memo(sc);
function sc({ rowId: e }) {
  const t = H(() => no(e), [e]), [n, o] = C(t), [r] = C(pe), [i] = C(Zt), [s] = C(ie), l = H(
    () => (a) => (c) => {
      o({ [a]: c });
    },
    [o]
  );
  return /* @__PURE__ */ x("div", { className: U("flex relative border-b"), style: { height: i }, children: [
    s.selectRow.enabled && /* @__PURE__ */ u(
      "div",
      {
        className: U(
          "border-r bg-content flex items-center justify-center"
        ),
        style: { width: 64 },
        children: /* @__PURE__ */ u(
          nn,
          {
            checked: n.isSelected || !1,
            toggle: () => o((a) => ({ isSelected: !a.isSelected }))
          }
        )
      }
    ),
    r.map((a) => /* @__PURE__ */ u(
      Zl,
      {
        rowId: e,
        colId: a,
        data: n[a],
        rowData: n,
        setData: l(a)
      },
      `${e}-${a}`
    ))
  ] });
}
const ic = Kt(({ handleScroll: e }, t) => {
  const [n] = C(Fe), [o] = C(ie), [r] = C(so);
  return /* @__PURE__ */ u(
    "div",
    {
      className: "h-[calc(100%-65px)] overflow-auto border-b bg-background",
      onScroll: e,
      ref: t,
      children: /* @__PURE__ */ x("div", { className: "flex flex-row", style: { minWidth: r }, children: [
        /* @__PURE__ */ x("div", { className: "flex flex-col", children: [
          n.map((i, s) => /* @__PURE__ */ u(
            oc,
            {
              rowId: i.id,
              first: i.first,
              last: i.last,
              groupVal: i.groupVal
            },
            i.id
          )),
          o.addRow.enabled && /* @__PURE__ */ u("div", { className: "h-48 shrink-0 grow" })
        ] }),
        o.addColumn.enabled && /* @__PURE__ */ u("div", { className: "w-48 shrink-0 grow" })
      ] })
    }
  );
}), jo = [
  {
    type: "empty",
    name: "Empty",
    atomFactory: (e) => vn(e, (t) => Re(t))
  },
  {
    type: "filled",
    name: "Filled",
    atomFactory: (e) => vn(e, (t) => !Re(t))
  },
  {
    type: "unique",
    name: "Unique",
    atomFactory: jr
  }
];
function Un(e) {
  return jo.find((t) => t.type === e);
}
function lc() {
  return jo.map((e) => e.type);
}
const cc = Kt((e, t) => {
  const [n] = C(pe), [o] = C(Me);
  return /* @__PURE__ */ u("div", { className: "bg-header h-8", children: /* @__PURE__ */ x("div", { className: "h-8 flex relative", ref: t, children: [
    /* @__PURE__ */ u(
      "div",
      {
        style: { width: 64 },
        className: U(o.length > 0 && "ml-4", "shrink-0 border-r")
      }
    ),
    n.map((r) => /* @__PURE__ */ u(ac, { colId: r }, r)),
    /* @__PURE__ */ u("div", { className: "w-48 grow shrink-0" })
  ] }) });
});
function ac({ colId: e }) {
  const t = H(() => xe(e), [e]), [n, o] = C(t), r = Un(n.summary), i = H(
    () => r ? r.atomFactory(n.id) : A(""),
    [r, n.id]
  ), [s] = C(i), l = lc(), [a, c] = V(!1);
  function d(f) {
    o({ summary: f }), c(!1);
  }
  return /* @__PURE__ */ x(
    le,
    {
      isOpen: a,
      setIsOpen: c,
      click: !0,
      placement: "top-end",
      portal: !0,
      portalId: "table-footer",
      children: [
        /* @__PURE__ */ u(
          "div",
          {
            style: { width: n.width },
            className: U(
              "hover:bg-hover-light -mr-[1px] h-full flex items-center justify-end text-sm relative group px-2 cursor-default",
              a && "bg-hover"
            ),
            children: r ? /* @__PURE__ */ x(Z, { children: [
              /* @__PURE__ */ u("span", { className: "text-xs text-secondary", children: r.name }),
              /* @__PURE__ */ u("span", { className: "ml-1", children: s })
            ] }) : /* @__PURE__ */ x(Z, { children: [
              /* @__PURE__ */ u(tn, { className: "w-4 h-4 hidden group-hover:block" }),
              /* @__PURE__ */ u("span", { className: "hidden group-hover:block text-xs ml-1", children: "Summary" })
            ] })
          }
        ),
        /* @__PURE__ */ x(L, { children: [
          /* @__PURE__ */ u("div", { className: "w-32" }),
          /* @__PURE__ */ x(L.Section, { children: [
            /* @__PURE__ */ u(
              L.Section.Button,
              {
                onClick: () => {
                  d("");
                },
                children: /* @__PURE__ */ u("span", { className: "text-secondary", children: "None" })
              }
            ),
            l.map((f) => {
              const h = Un(f);
              return /* @__PURE__ */ u(
                L.Section.Button,
                {
                  onClick: () => {
                    d(h.type);
                  },
                  children: h.name
                },
                h.type
              );
            })
          ] })
        ] })
      ]
    }
  );
}
function uc({ colId: e, supportedTypes: t }) {
  const [n] = C(H(() => xe(e), [e])), [, o] = C(ss), r = H(() => at(e), [e]), [, i] = C(r);
  function s(l, a) {
    l.preventDefault(), o({ colId: n.id, type: a }), i(!1);
  }
  return /* @__PURE__ */ u(L, { children: /* @__PURE__ */ x(L.Section, { children: [
    /* @__PURE__ */ u("div", { className: "w-56" }),
    /* @__PURE__ */ u(L.Section.Item, { children: /* @__PURE__ */ u("span", { className: "uppercase font-medium text-secondary text-xs", children: "Property Type" }) }),
    t.map((l) => /* @__PURE__ */ x(
      L.Section.Button,
      {
        onClick: (a) => {
          s(a, l.type);
        },
        children: [
          /* @__PURE__ */ u(l.icon, { className: "w-4 h-4 mr-2" }),
          /* @__PURE__ */ u("span", { children: l.name })
        ]
      },
      l.name
    ))
  ] }) });
}
function dc({
  colId: e,
  sortCallback: t,
  filterCallback: n,
  deleteCallback: o
}) {
  const [r, i] = C(H(() => xe(e), [e])), s = ae(), l = r.type === "custom" ? r.icon : st(r.type).icon, a = r.type === "custom" ? "Custom" : st(r.type).name, [, c] = C(io), [, d] = C(lo), f = H(() => at(e), [e]), [, h] = C(f), [m] = C(ie), w = H(
    () => [...Jl(), ...m.extraColumnTypes],
    []
  );
  z(() => {
    s.current && s.current.select();
  }, [s]);
  function p(S) {
    S.preventDefault(), i({ name: S.target.value });
  }
  function g(S) {
    S.code;
  }
  function v(S) {
    S.preventDefault(), o(r), h(!1);
  }
  function y(S) {
    S.preventDefault(), S.stopPropagation(), t([{ columnId: r.id, order: "asc" }]), c(!0), h(!1);
  }
  function b(S) {
    S.preventDefault(), S.stopPropagation(), t([{ columnId: r.id, order: "desc" }]), c(!0), h(!1);
  }
  function E(S) {
    S.preventDefault(), S.stopPropagation(), n([
      {
        columnId: r.id,
        type: r.type === "number" ? "equals" : "contains",
        value: ""
      }
    ]), d(!0), h(!1);
  }
  const k = [
    [
      {
        name: "Sort Ascending",
        icon: ms,
        action: y,
        enabled: m.sorting.enabled
      },
      {
        name: "Sort Descending",
        icon: ds,
        action: b,
        enabled: m.sorting.enabled
      },
      {
        name: "Filter",
        icon: Pt,
        action: E,
        enabled: m.filtering.enabled
      }
    ],
    [
      {
        name: "Delete",
        icon: ho,
        action: v,
        disabled: r.is_primary === "true" || r.is_primary === !0,
        enabled: m.deleteColumns.enabled
      }
    ]
  ], [D, O] = V(!1), [I, F] = V(null);
  if (D)
    return /* @__PURE__ */ u(uc, { colId: e, supportedTypes: w });
  if (I !== null) {
    const S = m.extraColumnHeaderPopupActions[I];
    return /* @__PURE__ */ u(
      S.popup,
      {
        column: r,
        setColumn: i,
        close: () => h(!1)
      }
    );
  }
  return /* @__PURE__ */ x(L, { children: [
    /* @__PURE__ */ u("div", { className: "w-56" }),
    /* @__PURE__ */ x(L.Section, { children: [
      /* @__PURE__ */ u(L.Section.Item, { children: /* @__PURE__ */ u(
        "input",
        {
          value: r.name,
          onChange: p,
          ref: s,
          onKeyDown: g,
          className: "rs-input focus:outline-none focus:ring rounded rounded-2 p-1 border w-full mb-2"
        }
      ) }),
      /* @__PURE__ */ u(L.Section.Item, { children: /* @__PURE__ */ u("span", { className: "uppercase font-medium text-secondary text-xs", children: "Property Type" }) }),
      /* @__PURE__ */ x(L.Section.Button, { onClick: () => O(!0), children: [
        l && /* @__PURE__ */ u(l, { className: "w-4 h-4 mr-2" }),
        a
      ] }),
      m.extraColumnHeaderPopupActions.map((S, _) => ({ popupAction: S, index: _ })).filter(({ popupAction: S }) => S.section === "main").map(({ popupAction: S, index: _ }) => /* @__PURE__ */ u(
        S.menuItem,
        {
          column: r,
          showPopup: () => {
            F(_);
          }
        },
        _
      ))
    ] }),
    k.map(
      (S, _) => S.findIndex((B) => B.enabled === !0) !== -1 && /* @__PURE__ */ x(L.Section, { children: [
        S.map(
          (B) => B.enabled && /* @__PURE__ */ x(
            L.Section.Button,
            {
              onClick: B.action,
              disabled: B.disabled,
              children: [
                /* @__PURE__ */ u(B.icon, { className: "w-4 h-4 mr-2" }),
                /* @__PURE__ */ u("span", { children: B.name })
              ]
            },
            B.name
          )
        ),
        m.extraColumnHeaderPopupActions.filter(
          (B) => B.section === `actions${_ + 1}`
        ).map((B, Y) => /* @__PURE__ */ u(
          B.menuItem,
          {
            column: r,
            showPopup: () => {
              F(Y);
            }
          },
          Y
        ))
      ] }, S[0].name)
    )
  ] });
}
function fc({
  colId: e,
  deleteCallback: t,
  sortCallback: n,
  filterCallback: o
}) {
  const [r, i] = C(H(() => xe(e), [e])), s = r.type === "custom" ? r.icon : st(r.type).icon, [l, a] = V(r.width), [c, d] = V(!1), f = H(() => at(e), [e]), [h, m] = C(f), [w] = C(ie);
  function p(g) {
    g.preventDefault();
    const v = g.pageX, y = l;
    d(!0);
    function b(E) {
      const k = Math.max(
        128,
        y + E.pageX - v
      );
      a(k), i({ width: k });
    }
    window.addEventListener("mousemove", b), window.addEventListener("mouseup", () => {
      window.removeEventListener("mousemove", b), d(!1);
    });
  }
  return /* @__PURE__ */ x("div", { className: "relative", children: [
    /* @__PURE__ */ x(
      le,
      {
        isOpen: w.editColumns.enabled && r.isEditable && h && r.type !== "custom",
        setIsOpen: m,
        portal: !0,
        children: [
          /* @__PURE__ */ x(
            "div",
            {
              className: "p-1 px-2 font-normal flex items-center border-r hover:bg-hover-light h-8",
              style: { width: l },
              children: [
                s && /* @__PURE__ */ u(s, { className: "w-4 h-4 mr-2 shrink-0" }),
                /* @__PURE__ */ u("span", { className: "whitespace-nowrap truncate", children: r.name })
              ]
            }
          ),
          /* @__PURE__ */ u(
            dc,
            {
              colId: e,
              deleteCallback: t,
              sortCallback: n,
              filterCallback: o
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ u(
      "div",
      {
        className: U(
          "h-full w-[5px] hover:bg-blue-500/30 absolute -right-[3px] top-0 cursor-ew-resize z-10",
          c && "bg-blue-500/30"
        ),
        onMouseDown: p,
        role: "presentation"
      }
    )
  ] });
}
const mc = Te.forwardRef((e, t) => {
  const [n] = C(pe), [o] = C(ns), r = it(os), [i] = C(Xt), [s] = C(Me), [, l] = C(Zr), [, a] = C(co), [, c] = C(uo), d = J(
    (g) => {
      c({ filtering: g });
    },
    [c]
  ), f = J(
    (g) => {
      a({ sorting: g });
    },
    [a]
  ), [, h] = C(Qr), m = J((g) => {
    if (i.find((v) => v.columnId === g.id)) {
      const v = i.filter((y) => y.columnId !== g.id);
      f(v);
    }
    h({ id: g.id });
  });
  function w(g) {
    g.preventDefault(), l({
      id: lt(),
      name: `Column-${Tt()}`,
      type: "text",
      width: 192,
      position: n.length,
      isVisible: !0,
      isEditable: !0
    });
  }
  const [p] = C(ie);
  return /* @__PURE__ */ u("div", { className: "flex bg-header border-b z-10", children: /* @__PURE__ */ x("div", { className: "flex relative h-8", ref: t, children: [
    /* @__PURE__ */ x(
      "div",
      {
        className: U(
          "h-8 text-sm inline-flex flex-row",
          s.length > 0 && "ml-[17px]"
        ),
        children: [
          p.selectRow.enabled && /* @__PURE__ */ u(
            "div",
            {
              className: "border-r px-4 flex items-center justify-center h-8",
              style: { width: 64 },
              children: /* @__PURE__ */ u(nn, { checked: o, toggle: r })
            }
          ),
          n.map((g) => /* @__PURE__ */ u(
            fc,
            {
              colId: g,
              sortCallback: f,
              filterCallback: d,
              deleteCallback: m
            },
            g
          )),
          p.addColumn.enabled && /* @__PURE__ */ u(
            "div",
            {
              onClick: w,
              className: "rs-btn h-8 p-1 cursor-pointer border-r hover:bg-hover-light font-normal w-16 flex items-center justify-center",
              "aria-label": "add-column",
              onKeyDown: (g) => {
                g.code === "Enter" && w(g);
              },
              children: /* @__PURE__ */ u(We, { className: "w-4 h-4" })
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ u("div", { className: "w-32 shrink-0 grow" })
  ] }) });
});
function hc(e, t) {
  let n = null;
  return (...o) => {
    window.clearTimeout(n), n = window.setTimeout(() => {
      e.apply(null, o);
    }, t);
  };
}
const pc = [
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
function Ie({
  options: e = pc,
  value: t = {},
  onSelect: n
}) {
  const [o, r] = V(!1), [i, s] = V(t), l = e.find((c) => c.value === i.value);
  function a(c) {
    s(c), r(!1), n == null || n(c);
  }
  return /* @__PURE__ */ u("div", { className: "w-full relative", children: /* @__PURE__ */ x(
    le,
    {
      isOpen: o,
      setIsOpen: r,
      offset: 4,
      portal: !0,
      children: [
        /* @__PURE__ */ x("div", { className: "rs-btn flex flex-row relative w-full border rounded p-1 pl-2 items-center hover:bg-hover focus:outline-none cursor-default", children: [
          /* @__PURE__ */ u("div", { className: "text-ellipsis flex-grow text-left whitespace-nowrap overflow-hidden", children: i.name ? /* @__PURE__ */ u("span", { children: i.name }) : /* @__PURE__ */ u("span", { className: "text-secondary", children: "Select" }) }),
          /* @__PURE__ */ u(Fs, { className: "w-4 h-4 duration-100 ml-auto" })
        ] }),
        /* @__PURE__ */ u("div", { className: "min-w-full w-max focus:outline-none", children: /* @__PURE__ */ x(L, { children: [
          /* @__PURE__ */ u("div", { className: "w-48" }),
          /* @__PURE__ */ u(L.Section, { children: e.map((c) => /* @__PURE__ */ x(
            L.Section.Button,
            {
              onClick: () => {
                a(c);
              },
              children: [
                /* @__PURE__ */ u("span", { children: c.name }),
                /* @__PURE__ */ u("span", { className: "ml-auto", children: l.value === c.value && /* @__PURE__ */ u(en, { className: "w-4 h-4" }) })
              ]
            },
            c.value
          )) })
        ] }) })
      ]
    }
  ) });
}
function gc({ columns: e, filter: t, setFilter: n }) {
  const [o, r] = V(null), i = [
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
  ], s = [
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
  z(() => {
    o && o.focus();
  }, [o]);
  const l = H(
    () => hc((c, d) => {
      n((f) => {
        const h = f.findIndex((m) => m.id === c.id);
        return [
          ...f.slice(0, h),
          {
            ...f[h],
            value: d
          },
          ...f.slice(h + 1, f.length)
        ];
      });
    }, 150),
    []
  );
  function a(c) {
    var d;
    return (d = e.find((f) => f.id === c)) == null ? void 0 : d.type;
  }
  return /* @__PURE__ */ x(L, { children: [
    /* @__PURE__ */ u("div", { className: "w-56" }),
    t.length > 0 ? /* @__PURE__ */ x(L.Section, { children: [
      /* @__PURE__ */ u("h3", { className: "text-sm mb-3 px-3 font-medium", children: "Filter By" }),
      /* @__PURE__ */ u("div", { className: "px-3 flex flex-col space-y-3", children: t.map((c) => /* @__PURE__ */ x(
        "div",
        {
          className: "flex flex-row space-x-2",
          children: [
            /* @__PURE__ */ u("div", { className: "w-36", children: /* @__PURE__ */ u(
              Ie,
              {
                options: e.map((d) => ({
                  value: d.id,
                  name: d.name
                })),
                value: {
                  value: c.columnId,
                  name: e.find((d) => d.id === c.columnId).name
                },
                onSelect: (d) => n((f) => {
                  const h = f.findIndex((m) => m.id === c.id);
                  return [
                    ...f.slice(0, h),
                    {
                      ...f[h],
                      type: a(d.value) === "number" ? "equals" : "contains",
                      columnId: d.value
                    },
                    ...f.slice(h + 1, f.length)
                  ];
                })
              }
            ) }),
            /* @__PURE__ */ u("div", { className: "w-28", children: /* @__PURE__ */ u(
              Ie,
              {
                options: a(c.columnId) === "number" ? s : i,
                value: a(c.columnId) === "number" ? s.find(
                  (d) => d.value === c.type
                ) : i.find((d) => d.value === c.type),
                onSelect: (d) => n((f) => {
                  const h = f.findIndex((m) => m.id === c.id);
                  return [
                    ...f.slice(0, h),
                    {
                      ...f[h],
                      type: d.value
                    },
                    ...f.slice(h + 1, f.length)
                  ];
                })
              }
            ) }),
            /* @__PURE__ */ u("div", { className: "w-36", children: /* @__PURE__ */ u(
              "input",
              {
                type: "text",
                className: "rs-input border h-full rounded w-full focus:outline-none focus:ring px-2 p-1",
                defaultValue: c.value,
                placeholder: "Type a value...",
                onChange: (d) => l(c, d.target.value)
              }
            ) }),
            /* @__PURE__ */ u(
              "button",
              {
                type: "button",
                className: "rs-btn flex items-center justify-center hover:bg-hover-light px-2 rounded hover:cursor-pointer",
                onClick: () => n((d) => d.filter((f) => f.id !== c.id)),
                "aria-label": "cancel-filter",
                children: /* @__PURE__ */ u(Ke, { className: "h-4 w-4" })
              }
            )
          ]
        },
        `filter-${c.columnId}`
      )) }),
      /* @__PURE__ */ u("div", { className: "py-2 px-3", children: /* @__PURE__ */ x(
        "button",
        {
          className: "rs-btn flex items-center justify-center bg-transparent rounded gap-x-1 h-6 font-thin hover:cursor-pointer text-sm p-0",
          onClick: () => n((c) => [
            ...c,
            {
              id: Tt(),
              columnId: e[0].id,
              type: "contains",
              value: ""
            }
          ]),
          "aria-label": "add-condition",
          type: "button",
          children: [
            /* @__PURE__ */ u(We, { className: "h-3 w-3" }),
            /* @__PURE__ */ u("span", { children: "Add condition" })
          ]
        }
      ) })
    ] }) : /* @__PURE__ */ u(
      ze,
      {
        options: e.map((c) => ({
          value: c.id,
          name: c.name
        })),
        onSelect: (c) => n([
          {
            id: Tt(),
            columnId: c.value,
            type: a(c.value) === "number" ? "equals" : "contains",
            value: ""
          }
        ]),
        inputRef: r,
        placeholder: "Filter by..."
      }
    )
  ] });
}
function vc({ setFilter: e }) {
  const [t] = C(ao), [n] = C(zr), [o, r] = C(lo);
  return /* @__PURE__ */ x(
    le,
    {
      isOpen: o,
      setIsOpen: r,
      offset: 4,
      portal: !0,
      portalId: "table",
      children: [
        Object.keys(t).length > 0 ? /* @__PURE__ */ x("div", { className: "rs-btn h-8 hover:ring-2 hover:ring-black/10 hover:ring-inset bg-indigo-200 px-3 rounded text-sm flex row items-center cursor-default text-dark", children: [
          /* @__PURE__ */ u(Pt, { className: "w-4 h-4 mr-1" }),
          /* @__PURE__ */ u("span", { children: `Filtered by ${Object.keys(t).length} field` })
        ] }) : /* @__PURE__ */ x(
          "div",
          {
            className: U(
              "rs-btn h-8 hover:bg-hover px-3 rounded text-sm flex flex-row items-center cursor-default",
              o && "bg-hover"
            ),
            children: [
              /* @__PURE__ */ u(Pt, { className: "w-4 h-4 mr-1" }),
              /* @__PURE__ */ u("span", { children: "Filter data" })
            ]
          }
        ),
        /* @__PURE__ */ u(gc, { columns: n, filter: t, setFilter: e })
      ]
    }
  );
}
function bc({ columns: e, grouping: t, setGroup: n }) {
  const [o, r] = V(null), i = [
    {
      value: "asc",
      name: "Ascending"
    },
    {
      value: "desc",
      name: "Descending"
    }
  ];
  return z(() => {
    o && o.focus();
  }, [o]), /* @__PURE__ */ x(L, { children: [
    /* @__PURE__ */ u("div", { className: "w-56" }),
    t.length > 0 ? /* @__PURE__ */ x(L.Section, { children: [
      /* @__PURE__ */ u("h3", { className: "text-sm mb-3 px-3 font-medium", children: "Group By" }),
      /* @__PURE__ */ u("div", { className: "px-3", children: t.map((s) => /* @__PURE__ */ x(
        "div",
        {
          className: "flex flex-row space-x-2",
          children: [
            /* @__PURE__ */ u("div", { className: "w-36", children: /* @__PURE__ */ u(
              Ie,
              {
                options: e.map((l) => ({
                  value: l.id,
                  name: l.name
                })),
                value: {
                  value: s.columnId,
                  name: e.find((l) => l.id === s.columnId).name
                },
                onSelect: (l) => n([{ columnId: l.value, order: "asc" }])
              }
            ) }),
            /* @__PURE__ */ u("div", { className: "w-28", children: /* @__PURE__ */ u(
              Ie,
              {
                options: i,
                value: i.find((l) => l.value === s.order),
                onSelect: (l) => n([
                  {
                    columnId: s.columnId,
                    order: l.value
                  }
                ])
              }
            ) }),
            /* @__PURE__ */ u(
              "button",
              {
                type: "button",
                className: "rs-btn flex items-center justify-center hover:bg-hover-light px-2 rounded",
                onClick: () => n([]),
                "aria-label": "cancel-grouping",
                children: /* @__PURE__ */ u(Ke, { className: "h-4 w-4" })
              }
            )
          ]
        },
        `grouping-${s.columnId}`
      )) })
    ] }) : /* @__PURE__ */ u(
      ze,
      {
        options: e.filter((s) => s.type !== "custom").map((s) => ({
          value: s.id,
          name: s.name
        })),
        onSelect: (s) => n([{ columnId: s.value, order: "asc" }]),
        inputRef: r,
        placeholder: "Group by..."
      }
    )
  ] });
}
function wc({ grouping: e = [], setGroup: t }) {
  const [n, o] = V(!1), [r] = C(ro);
  return /* @__PURE__ */ x(
    le,
    {
      isOpen: n,
      setIsOpen: o,
      offset: 4,
      portal: !0,
      portalId: "table",
      children: [
        e.length > 0 ? /* @__PURE__ */ x("div", { className: "rs-btn h-8 hover:ring-2 hover:ring-black/10 hover:ring-inset bg-purple-200 px-3 rounded text-sm flex row items-center cursor-default text-dark", children: [
          /* @__PURE__ */ u(yn, { className: "w-4 h-4 mr-1" }),
          /* @__PURE__ */ u("span", { children: "Grouped by 1 field" })
        ] }) : /* @__PURE__ */ x(
          "div",
          {
            className: U(
              "rs-btn hover:bg-hover px-3 rounded flex flex-row items-center h-8 cursor-default",
              n && "bg-hover"
            ),
            children: [
              /* @__PURE__ */ u(yn, { className: "w-4 h-4 mr-1" }),
              /* @__PURE__ */ u("span", { children: "Group" })
            ]
          }
        ),
        /* @__PURE__ */ u(bc, { columns: r, grouping: e, setGroup: t })
      ]
    }
  );
}
function yc({ value: e, setValue: t }) {
  return /* @__PURE__ */ x(Z, { children: [
    /* @__PURE__ */ u("input", { type: "checkbox", checked: e, className: "hidden", readOnly: !0 }),
    /* @__PURE__ */ u(
      "div",
      {
        className: U(
          "rs-btn rounded-full w-7 h-4 flex items-center cursor-pointer border transition duration-200 ease-in-out",
          e ? "bg-green-500 border-black/10" : "bg-background"
        ),
        onClick: () => t(!e),
        onKeyDown: (n) => {
          (n.key === "Enter" || n.key === " ") && t(!e);
        },
        "aria-label": "toggle",
        children: /* @__PURE__ */ u(
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
function xc({ colId: e }) {
  const [t, n] = C(H(() => xe(e), [e]));
  return /* @__PURE__ */ x(L.Section.Item, { children: [
    /* @__PURE__ */ u(
      yc,
      {
        value: t.isVisible,
        setValue: (o) => n({ isVisible: o })
      }
    ),
    /* @__PURE__ */ u("span", { className: "ml-2", children: t.name })
  ] }, t.id);
}
function Sc({ setColumnVisibility: e }) {
  const [t] = C(qr);
  return /* @__PURE__ */ x(L, { children: [
    /* @__PURE__ */ u("div", { className: "w-48" }),
    /* @__PURE__ */ u(L.Section, { children: t.map((n) => /* @__PURE__ */ u(xc, { colId: n }, n)) })
  ] });
}
function Cc({ setColumnVisibility: e }) {
  const [t, n] = V(!1), [o] = C(Yr);
  return /* @__PURE__ */ x(le, { isOpen: t, setIsOpen: n, offset: 4, portal: !0, children: [
    o > 0 ? /* @__PURE__ */ x("div", { className: "rs-btn h-8 hover:ring-2 hover:ring-black/10 hover:ring-inset bg-green-200 px-3 rounded text-sm flex row items-center focus:outline-none cursor-default text-dark", children: [
      /* @__PURE__ */ u(wn, { className: "w-4 h-4 mr-1" }),
      /* @__PURE__ */ u("span", { children: `${o} hidden fields` })
    ] }) : /* @__PURE__ */ x(
      "div",
      {
        className: U(
          "rs-btn hover:bg-hover px-3 rounded flex flex-row items-center h-8 focus:outline-none cursor-default",
          t && "bg-hover"
        ),
        children: [
          /* @__PURE__ */ u(wn, { className: "w-4 h-4 mr-1" }),
          /* @__PURE__ */ u("span", { children: "Hide fields" })
        ]
      }
    ),
    /* @__PURE__ */ u(Sc, { setColumnVisibility: e })
  ] });
}
const bt = [
  ["path", { d: "M18 4v16", key: "arrow-0" }],
  ["path", { d: "M16 6l2 -2l2 2", key: "arrow-1" }],
  ["path", { d: "M16 18l2 2l2 -2", key: "arrow-2" }]
], Ce = (e) => ["path", { d: `M4 ${e}h9`, key: `line-${e}` }], cn = (e, t) => [
  "rect",
  { x: 4, y: e, width: 9, height: t, rx: 1, key: "row" }
], Nc = W(
  "outline",
  "rs-row-height-short",
  "Height1Icon",
  [...bt, Ce(4), Ce(9), Ce(15), Ce(20)]
), kc = W(
  "outline",
  "rs-row-height-medium",
  "Height2Icon",
  [...bt, cn(4, 5), Ce(15), Ce(20)]
), Rc = W(
  "outline",
  "rs-row-height-tall",
  "Height3Icon",
  [...bt, cn(4, 11), Ce(20)]
), Ac = W(
  "outline",
  "rs-row-height-extra-tall",
  "Height4Icon",
  [...bt, cn(4, 16)]
), Ho = [
  {
    value: 32,
    name: "Short",
    icon: Nc
  },
  {
    value: 64,
    name: "Medium",
    icon: kc
  },
  {
    value: 96,
    name: "Tall",
    icon: Rc
  },
  {
    value: 128,
    name: "Extra Tall",
    icon: Ac
  }
];
function Uo(e) {
  return Ho.find((t) => t.value === e);
}
function Ec() {
  return Ho.map((e) => e.value);
}
function Oc({ height: e, setHeight: t }) {
  const n = Ec();
  return /* @__PURE__ */ x(L, { children: [
    /* @__PURE__ */ u("div", { className: "w-48" }),
    /* @__PURE__ */ u(L.Section, { children: n.map((o) => {
      const r = Uo(o);
      return /* @__PURE__ */ x(
        L.Section.Button,
        {
          onClick: () => t(r.value),
          children: [
            /* @__PURE__ */ u(r.icon, { className: "w-4 h-4 mr-2" }),
            r.name,
            r.value === e && /* @__PURE__ */ u(en, { className: "w-4 h-4 ml-auto" })
          ]
        },
        r.value
      );
    }) })
  ] });
}
function Dc({ height: e, setHeight: t }) {
  const [n, o] = V(!1), r = Uo(e);
  return /* @__PURE__ */ x(
    le,
    {
      isOpen: n,
      setIsOpen: o,
      offset: 4,
      portal: !0,
      portalId: "table",
      children: [
        /* @__PURE__ */ u(
          "div",
          {
            className: U(
              "rs-btn hover:bg-hover px-3 rounded flex flex-row items-center h-8 focus:outline-none cursor-default",
              n && "bg-hover"
            ),
            "aria-label": "height-selector",
            children: /* @__PURE__ */ u(r.icon, { className: "w-4 h-4 mr-1" })
          }
        ),
        /* @__PURE__ */ u(Oc, { height: e, setHeight: t })
      ]
    }
  );
}
function Ic({ active: e, Icon: t, text: n, bgColor: o }) {
  return /* @__PURE__ */ x(
    "div",
    {
      className: U(
        "rs-btn h-8 hover:ring-2 hover:ring-black/10 hover:ring-inset bg-orange-200 px-3 rounded flex items-center gap-x-1 cursor-default text-dark",
        o && o
      ),
      children: [
        t && /* @__PURE__ */ u(t, { className: "w-4 h-4" }),
        /* @__PURE__ */ u("span", { children: n })
      ]
    }
  );
}
function Tc({ sort: e, setSort: t }) {
  const [n, o] = V(null), [r] = C(ro), i = [
    {
      value: "asc",
      name: "Ascending"
    },
    {
      value: "desc",
      name: "Descending"
    }
  ];
  return z(() => {
    n && n.focus();
  }, [n]), /* @__PURE__ */ x(L, { children: [
    /* @__PURE__ */ u("div", { className: "w-56" }),
    e.length > 0 ? /* @__PURE__ */ x(L.Section, { children: [
      /* @__PURE__ */ u("h3", { className: "text-sm mb-3 px-3 font-medium", children: "Sort By" }),
      /* @__PURE__ */ u("div", { className: "px-3", children: e.map((s) => /* @__PURE__ */ x(
        "div",
        {
          className: "flex flex-row space-x-2",
          children: [
            /* @__PURE__ */ u("div", { className: "w-36", children: /* @__PURE__ */ u(
              Ie,
              {
                options: r.map((l) => ({
                  value: l.id,
                  name: l.name
                })),
                value: {
                  value: s.columnId,
                  name: r.find((l) => l.id === s.columnId).name
                },
                onSelect: (l) => t([{ columnId: l.value, order: "asc" }])
              }
            ) }),
            /* @__PURE__ */ u("div", { className: "w-28", children: /* @__PURE__ */ u(
              Ie,
              {
                options: i,
                value: i.find((l) => l.value === s.order),
                onSelect: (l) => t([
                  {
                    columnId: s.columnId,
                    order: l.value
                  }
                ])
              }
            ) }),
            /* @__PURE__ */ u(
              "button",
              {
                type: "button",
                className: "rs-btn flex items-center justify-center hover:bg-hover-light px-2 rounded",
                onClick: () => t([]),
                "aria-label": "cancel-sort",
                children: /* @__PURE__ */ u(Ke, { className: "h-4 w-4" })
              }
            )
          ]
        },
        `sort-${s.columnId}`
      )) })
    ] }) : /* @__PURE__ */ u(
      ze,
      {
        options: r.filter((s) => s.type !== "custom").map((s) => ({
          value: s.id,
          name: s.name
        })),
        onSelect: (s) => t([{ columnId: s.value, order: "asc" }]),
        inputRef: o,
        placeholder: "Sort by..."
      }
    )
  ] });
}
function Mc({ setSort: e }) {
  const [t] = C(Xt), [n, o] = C(io);
  return /* @__PURE__ */ x(
    le,
    {
      isOpen: n,
      setIsOpen: o,
      offset: 4,
      portal: !0,
      portalId: "table",
      children: [
        t.length > 0 ? /* @__PURE__ */ u(
          Ic,
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
              /* @__PURE__ */ u(bn, { className: "w-4 h-4 mr-1" }),
              /* @__PURE__ */ u("span", { children: "Sort data" })
            ]
          }
        ),
        /* @__PURE__ */ u(Tc, { sort: t, setSort: e })
      ]
    }
  );
}
function _c() {
  const [e] = C(Gr), [t] = C(ao), [n] = C(Xt), [o] = C(Me), [r] = C(Zt), [i] = C(Kr), [, s] = C(uo), l = it(rs), [, a] = C(Hr), [, c] = C(oo), [, d] = C(Ur), [f] = C(ie), h = J((k) => {
    s({ filtering: k });
  }, []), m = J((k) => {
    k.preventDefault(), a();
  }, []);
  function w(k) {
    c({ id: lt() });
  }
  const [, p] = C(co), g = J((k) => {
    p({ sorting: k });
  }, []), [, v] = C(ts), y = J((k) => {
    v({ rowHeight: k });
  }, []), [, b] = C(es), E = J((k) => {
    b({ grouping: k });
  }, []);
  return /* @__PURE__ */ u(
    "div",
    {
      className: "w-full bg-content py-2 text-sm overflow-y-hidden h-12 relative border-b",
      id: "toolbar",
      children: /* @__PURE__ */ x("div", { className: "flex flex-row space-x-2 px-3 items-center whitespace-nowrap h-full", children: [
        /* @__PURE__ */ x("div", { className: "items-center flex w-20 justify-center", children: [
          i > 0 ? i : "No",
          " row",
          i !== 1 && "s"
        ] }),
        e > 0 && /* @__PURE__ */ x("div", { className: "bg-header flex flex-row rounded items-center h-8 cursor-default", children: [
          /* @__PURE__ */ x("div", { className: "text-sm px-2 rounded-l", children: [
            e,
            " row",
            e !== 1 && "s",
            " selected"
          ] }),
          /* @__PURE__ */ u("div", { className: "bg-content h-4 w-px last:hidden" }),
          /* @__PURE__ */ x(
            "button",
            {
              type: "button",
              className: "rs-btn self-stretch hover:bg-hover-light px-2 text-sm flex flex-row items-center",
              onClick: () => l(),
              children: [
                /* @__PURE__ */ u(Ke, { className: "w-4 h-4 mr-1" }),
                /* @__PURE__ */ u("span", { children: "Cancel" })
              ]
            }
          ),
          /* @__PURE__ */ u("div", { className: "bg-content h-4 w-px last:hidden" }),
          /* @__PURE__ */ x(
            "button",
            {
              type: "button",
              className: "rs-btn self-stretch hover:bg-hover-light px-2 rounded-r text-sm flex flex-row items-center",
              onClick: m,
              children: [
                /* @__PURE__ */ u(ho, { className: "w-4 h-4 mr-1" }),
                /* @__PURE__ */ u("span", { children: "Delete" })
              ]
            }
          ),
          /* @__PURE__ */ u("div", { className: "bg-content h-4 w-px last:hidden" }),
          f.rowSelectionButtons.map((k, D) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: plugin-provided toolbar buttons have no stable ID
            /* @__PURE__ */ x(Te.Fragment, { children: [
              /* @__PURE__ */ u(
                "button",
                {
                  type: "button",
                  className: "rs-btn self-stretch hover:bg-hover-light px-2 rounded-r text-sm flex flex-row items-center",
                  onClick: () => d({
                    handler: k.handler
                  }),
                  children: k.body
                }
              ),
              /* @__PURE__ */ u("div", { className: "bg-content h-4 w-px last:hidden" })
            ] }, D)
          ))
        ] }),
        /* @__PURE__ */ u("div", { className: "h-4 border" }),
        f.addRow.enabled && f.addRow.toolbar && /* @__PURE__ */ x(
          "button",
          {
            type: "button",
            className: "rs-btn hover:bg-hover px-3 rounded flex flex-row items-center h-8 focus:outline-none",
            onClick: w,
            children: [
              /* @__PURE__ */ u(We, { className: "w-4 h-4 mr-1" }),
              /* @__PURE__ */ u("span", { children: "New row" })
            ]
          }
        ),
        f.hideFields.enabled && /* @__PURE__ */ u(Cc, {}),
        f.filtering.enabled && /* @__PURE__ */ u(vc, { filter: t, setFilter: h }),
        f.grouping.enabled && /* @__PURE__ */ u(wc, { grouping: o, setGroup: E }),
        f.sorting.enabled && /* @__PURE__ */ u(Mc, { sort: n, setSort: g }),
        f.rowHeight.enabled && /* @__PURE__ */ u(Dc, { height: r, setHeight: y }),
        f.extraToolbarItems.map((k, D) => /* @__PURE__ */ u(k.render, {}, D))
      ] })
    }
  );
}
const Pc = {
  light: "",
  dark: "dark"
};
function Lc() {
  const e = ae(null), t = ae(null), n = ae(null), [o] = C(ie);
  z(() => {
    if (!n.current)
      return () => null;
    function s(l) {
      e.current.scrollLeft = n.current.scrollLeft, e.current.style.transform = `translate3d(-${n.current.scrollLeft}px, 0, 0)`, t.current && (t.current.style.transform = `translate3d(-${n.current.scrollLeft}px, 0, 0)`);
    }
    n.current.addEventListener("scroll", s);
  }, []), z(() => {
    if (!e.current)
      return () => null;
    function s(l) {
      l.preventDefault(), n.current.scrollLeft += l.deltaX;
    }
    e.current.addEventListener("mousewheel", s, {
      passive: !1
    });
  }, []), z(() => {
    if (!t.current)
      return () => null;
    function s(l) {
      l.preventDefault(), n.current.scrollLeft += l.deltaX;
    }
    t.current.addEventListener("mousewheel", s, {
      passive: !1
    });
  }, []);
  const [r, i] = C(to);
  return z(() => {
    i(lt());
  }, []), /* @__PURE__ */ x(
    "div",
    {
      className: U("rs-table", Pc[o.theme.color]),
      id: r,
      children: [
        o.toolbar.enabled && /* @__PURE__ */ u(_c, {}),
        /* @__PURE__ */ x("div", { className: "h-[calc(100%-48px)] overflow-hidden", children: [
          /* @__PURE__ */ u(mc, { ref: e }),
          /* @__PURE__ */ u(ic, { ref: n }),
          o.footer.enabled && /* @__PURE__ */ u(cc, { ref: t })
        ] })
      ]
    }
  );
}
function Bc({ data: e, columns: t, onChange: n, config: o, children: r }) {
  Rr([
    [Jr, t],
    [Wr, e],
    [$r, { onChange: n }],
    [hn, o]
  ]);
  const i = it(hn);
  return z(() => {
    i(o);
  }, [o, i]), r;
}
function Hc({
  data: e,
  columns: t,
  onChange: n = () => null,
  config: o = {}
}) {
  return /* @__PURE__ */ u(Cr, { children: /* @__PURE__ */ u(
    Bc,
    {
      data: e,
      columns: t,
      onChange: n,
      config: o,
      children: /* @__PURE__ */ u(Lc, {})
    }
  ) });
}
export {
  Hc as default
};
