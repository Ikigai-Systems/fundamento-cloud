import "./main.css";
import { jsx as a, jsxs as E, Fragment as G } from "react/jsx-runtime";
import * as m from "react";
import Be, { createContext as Ir, useRef as le, createElement as Fr, useCallback as Y, useContext as jr, useReducer as _r, useEffect as K, useDebugValue as Vr, useMemo as W, useState as B, useLayoutEffect as Pn, Children as Br, forwardRef as In } from "react";
import * as Fn from "react-dom";
const ne = { BASE_URL: "/", DEV: !1, MODE: "production", PROD: !0, SSR: !1 };
let Hr = 0;
function L(e, t) {
  const n = `atom${++Hr}`, r = {
    toString() {
      return (ne ? "production" : void 0) !== "production" && this.debugLabel ? n + ":" + this.debugLabel : n;
    }
  };
  return typeof e == "function" ? r.read = e : (r.init = e, r.read = $r, r.write = Wr), t && (r.write = t), r;
}
function $r(e) {
  return e(this);
}
function Wr(e, t, n) {
  return t(
    this,
    typeof n == "function" ? n(e(this)) : n
  );
}
const tn = (e, t) => e.unstable_is ? e.unstable_is(t) : t === e, mt = (e) => "init" in e, ht = (e) => !!e.write, Ze = /* @__PURE__ */ new WeakMap(), Ct = (e) => {
  var t;
  return Et(e) && !((t = Ze.get(e)) != null && t[1]);
}, Ur = (e, t) => {
  const n = Ze.get(e);
  if (n)
    n[1] = !0, n[0].forEach((r) => r(t));
  else if ((ne ? "production" : void 0) !== "production")
    throw new Error("[Bug] cancelable promise not found");
}, Kr = (e) => {
  if (Ze.has(e))
    return;
  const t = [/* @__PURE__ */ new Set(), !1];
  Ze.set(e, t);
  const n = () => {
    t[1] = !0;
  };
  e.then(n, n), e.onCancel = (r) => {
    t[0].add(r);
  };
}, Et = (e) => typeof (e == null ? void 0 : e.then) == "function", nn = (e) => "v" in e || "e" in e, We = (e) => {
  if ("e" in e)
    throw e.e;
  if ((ne ? "production" : void 0) !== "production" && !("v" in e))
    throw new Error("[Bug] atom state is not initialized");
  return e.v;
}, jn = (e, t, n) => {
  n.p.has(e) || (n.p.add(e), t.then(
    () => {
      n.p.delete(e);
    },
    () => {
      n.p.delete(e);
    }
  ));
}, rn = (e, t, n, r, o) => {
  var s;
  if ((ne ? "production" : void 0) !== "production" && r === t)
    throw new Error("[Bug] atom cannot depend on itself");
  n.d.set(r, o.n), Ct(n.v) && jn(t, n.v, o), (s = o.m) == null || s.t.add(t), e && Zr(e, r, t);
}, Ne = () => [/* @__PURE__ */ new Map(), /* @__PURE__ */ new Map(), /* @__PURE__ */ new Set()], pt = (e, t, n) => {
  e[0].has(t) || e[0].set(t, /* @__PURE__ */ new Set()), e[1].set(t, n);
}, Zr = (e, t, n) => {
  const r = e[0].get(t);
  r && r.add(n);
}, qr = (e, t) => e[0].get(t), on = (e, t) => {
  e[2].add(t);
}, be = (e) => {
  for (; e[1].size || e[2].size; ) {
    e[0].clear();
    const t = new Set(e[1].values());
    e[1].clear();
    const n = new Set(e[2]);
    e[2].clear(), t.forEach((r) => {
      var o;
      return (o = r.m) == null ? void 0 : o.l.forEach((s) => s());
    }), n.forEach((r) => r());
  }
}, _n = (...[e, t, n, r]) => {
  let o;
  (ne ? "production" : void 0) !== "production" && (o = /* @__PURE__ */ new Set());
  const s = (v, g, R) => {
    const x = "v" in g, k = g.v, S = Ct(g.v) ? g.v : null;
    if (Et(R)) {
      Kr(R);
      for (const A of g.d.keys())
        jn(v, R, e(A));
      g.v = R, delete g.e;
    } else
      g.v = R, delete g.e;
    (!x || !Object.is(k, g.v)) && (++g.n, S && Ur(S, R));
  }, i = (v, g, R) => {
    var x;
    const k = e(g);
    if (nn(k) && (k.m && !(R != null && R.has(g)) || Array.from(k.d).every(
      ([D, V]) => (
        // Recursively, read the atom state of the dependency, and
        // check if the atom epoch number is unchanged
        i(v, D, R).n === V
      )
    )))
      return k;
    k.d.clear();
    let S = !0;
    const A = (D) => {
      if (tn(g, D)) {
        const j = e(D);
        if (!nn(j))
          if (mt(D))
            s(D, j, D.init);
          else
            throw new Error("no atom init");
        return We(j);
      }
      const V = i(v, D, R);
      if (S)
        rn(v, g, k, D, V);
      else {
        const j = Ne();
        rn(j, g, k, D, V), p(j, g, k), be(j);
      }
      return We(V);
    };
    let M, C;
    const T = {
      get signal() {
        return M || (M = new AbortController()), M.signal;
      },
      get setSelf() {
        return (ne ? "production" : void 0) !== "production" && !ht(g) && console.warn("setSelf function cannot be used with read-only atom"), !C && ht(g) && (C = (...D) => {
          if ((ne ? "production" : void 0) !== "production" && S && console.warn("setSelf function cannot be called in sync"), !S)
            return f(g, ...D);
        }), C;
      }
    };
    try {
      const D = t(g, A, T);
      if (s(g, k, D), Et(D)) {
        (x = D.onCancel) == null || x.call(D, () => M == null ? void 0 : M.abort());
        const V = () => {
          if (k.m) {
            const j = Ne();
            p(j, g, k), be(j);
          }
        };
        D.then(V, V);
      }
      return k;
    } catch (D) {
      return delete k.v, k.e = D, ++k.n, k;
    } finally {
      S = !1;
    }
  }, c = (v) => We(i(void 0, v)), u = (v, g, R) => {
    var x, k;
    const S = /* @__PURE__ */ new Map();
    for (const A of ((x = R.m) == null ? void 0 : x.t) || [])
      S.set(A, e(A));
    for (const A of R.p)
      S.set(
        A,
        e(A)
      );
    return (k = qr(v, g)) == null || k.forEach((A) => {
      S.set(A, e(A));
    }), S;
  }, l = (v, g, R) => {
    const x = [], k = /* @__PURE__ */ new Set(), S = (M, C) => {
      if (!k.has(M)) {
        k.add(M);
        for (const [T, D] of u(v, M, C))
          M !== T && S(T, D);
        x.push([M, C, C.n]);
      }
    };
    S(g, R);
    const A = /* @__PURE__ */ new Set([g]);
    for (let M = x.length - 1; M >= 0; --M) {
      const [C, T, D] = x[M];
      let V = !1;
      for (const j of T.d.keys())
        if (j !== C && A.has(j)) {
          V = !0;
          break;
        }
      V && (i(v, C, k), p(v, C, T), D !== T.n && (pt(v, C, T), A.add(C))), k.delete(C);
    }
  }, d = (v, g, ...R) => n(g, (A) => We(i(v, A)), (A, ...M) => {
    const C = e(A);
    let T;
    if (tn(g, A)) {
      if (!mt(A))
        throw new Error("atom not writable");
      const D = "v" in C, V = C.v, j = M[0];
      s(A, C, j), p(v, A, C), (!D || !Object.is(V, C.v)) && (pt(v, A, C), l(v, A, C));
    } else
      T = d(v, A, ...M);
    return be(v), T;
  }, ...R), f = (v, ...g) => {
    const R = Ne(), x = d(R, v, ...g);
    return be(R), x;
  }, p = (v, g, R) => {
    if (R.m && !Ct(R.v)) {
      for (const x of R.d.keys())
        R.m.d.has(x) || (h(v, x, e(x)).t.add(g), R.m.d.add(x));
      for (const x of R.m.d || [])
        if (!R.d.has(x)) {
          R.m.d.delete(x);
          const k = b(v, x, e(x));
          k == null || k.t.delete(g);
        }
    }
  }, h = (v, g, R) => {
    if (!R.m) {
      i(v, g);
      for (const x of R.d.keys())
        h(v, x, e(x)).t.add(g);
      if (R.m = {
        l: /* @__PURE__ */ new Set(),
        d: new Set(R.d.keys()),
        t: /* @__PURE__ */ new Set()
      }, (ne ? "production" : void 0) !== "production" && o.add(g), ht(g)) {
        const x = R.m;
        on(v, () => {
          const k = r(
            g,
            (...S) => d(v, g, ...S)
          );
          k && (x.u = k);
        });
      }
    }
    return R.m;
  }, b = (v, g, R) => {
    if (R.m && !R.m.l.size && !Array.from(R.m.t).some((x) => {
      var k;
      return (k = e(x).m) == null ? void 0 : k.d.has(g);
    })) {
      const x = R.m.u;
      x && on(v, x), delete R.m, (ne ? "production" : void 0) !== "production" && o.delete(g);
      for (const k of R.d.keys()) {
        const S = b(v, k, e(k));
        S == null || S.t.delete(g);
      }
      return;
    }
    return R.m;
  }, y = {
    get: c,
    set: f,
    sub: (v, g) => {
      const R = Ne(), x = e(v), k = h(R, v, x);
      be(R);
      const S = k.l;
      return S.add(g), () => {
        S.delete(g);
        const A = Ne();
        b(A, v, x), be(A);
      };
    },
    unstable_derive: (v) => _n(...v(e, t, n, r))
  };
  return (ne ? "production" : void 0) !== "production" && Object.assign(y, {
    // store dev methods (these are tentative and subject to change without notice)
    dev4_get_internal_weak_map: () => ({
      get: (g) => {
        const R = e(g);
        if (R.n !== 0)
          return R;
      }
    }),
    dev4_get_mounted_atoms: () => o,
    dev4_restore_atoms: (g) => {
      const R = Ne();
      for (const [x, k] of g)
        if (mt(x)) {
          const S = e(x), A = "v" in S, M = S.v;
          s(x, S, k), p(R, x, S), (!A || !Object.is(M, S.v)) && (pt(R, x, S), l(R, x, S));
        }
      be(R);
    }
  }), y;
}, Vn = () => {
  const e = /* @__PURE__ */ new WeakMap();
  return _n(
    (n) => {
      if ((ne ? "production" : void 0) !== "production" && !n)
        throw new Error("Atom is undefined or null");
      let r = e.get(n);
      return r || (r = { d: /* @__PURE__ */ new Map(), p: /* @__PURE__ */ new Set(), n: 0 }, e.set(n, r)), r;
    },
    (n, ...r) => n.read(...r),
    (n, ...r) => n.write(...r),
    (n, ...r) => {
      var o;
      return (o = n.onMount) == null ? void 0 : o.call(n, ...r);
    }
  );
};
let Te;
const zr = () => (Te || (Te = Vn(), (ne ? "production" : void 0) !== "production" && (globalThis.__JOTAI_DEFAULT_STORE__ || (globalThis.__JOTAI_DEFAULT_STORE__ = Te), globalThis.__JOTAI_DEFAULT_STORE__ !== Te && console.warn(
  "Detected multiple Jotai instances. It may cause unexpected behavior with the default store. https://github.com/pmndrs/jotai/discussions/2044"
))), Te), Bn = { BASE_URL: "/", DEV: !1, MODE: "production", PROD: !0, SSR: !1 }, Hn = Ir(
  void 0
), jt = (e) => jr(Hn) || zr(), Yr = ({
  children: e,
  store: t
}) => {
  const n = le();
  return !t && !n.current && (n.current = Vn()), Fr(
    Hn.Provider,
    {
      value: t || n.current
    },
    e
  );
}, $n = (e) => typeof (e == null ? void 0 : e.then) == "function", Gr = (e) => {
  e.status = "pending", e.then(
    (t) => {
      e.status = "fulfilled", e.value = t;
    },
    (t) => {
      e.status = "rejected", e.reason = t;
    }
  );
}, Xr = Be.use || ((e) => {
  if (e.status === "pending")
    throw e;
  if (e.status === "fulfilled")
    return e.value;
  throw e.status === "rejected" ? e.reason : (Gr(e), e);
}), gt = /* @__PURE__ */ new WeakMap(), Jr = (e) => {
  let t = gt.get(e);
  return t || (t = new Promise((n, r) => {
    let o = e;
    const s = (u) => (l) => {
      o === u && n(l);
    }, i = (u) => (l) => {
      o === u && r(l);
    }, c = (u) => {
      "onCancel" in u && typeof u.onCancel == "function" && u.onCancel((l) => {
        if ((Bn ? "production" : void 0) !== "production" && l === u)
          throw new Error("[Bug] p is not updated even after cancelation");
        $n(l) ? (gt.set(l, t), o = l, l.then(s(l), i(l)), c(l)) : n(l);
      });
    };
    e.then(s(e), i(e)), c(e);
  }), gt.set(e, t)), t;
};
function Qr(e, t) {
  const n = jt(), [[r, o, s], i] = _r(
    (l) => {
      const d = n.get(e);
      return Object.is(l[0], d) && l[1] === n && l[2] === e ? l : [d, n, e];
    },
    void 0,
    () => [n.get(e), n, e]
  );
  let c = r;
  if ((o !== n || s !== e) && (i(), c = n.get(e)), K(() => {
    const l = n.sub(e, () => {
      i();
    });
    return i(), l;
  }, [n, e, void 0]), Vr(c), $n(c)) {
    const l = Jr(c);
    return Xr(l);
  }
  return c;
}
function tt(e, t) {
  const n = jt();
  return Y(
    (...o) => {
      if ((Bn ? "production" : void 0) !== "production" && !("write" in e))
        throw new Error("not writable atom");
      return n.set(e, ...o);
    },
    [n, e]
  );
}
function O(e, t) {
  return [
    Qr(e),
    // We do wrong type assertion here, which results in throwing an error.
    tt(e)
  ];
}
const sn = /* @__PURE__ */ new WeakMap();
function eo(e, t) {
  const n = jt(), r = to(n);
  for (const [o, s] of e)
    r.has(o) || (r.add(o), n.set(o, s));
}
const to = (e) => {
  let t = sn.get(e);
  return t || (t = /* @__PURE__ */ new WeakSet(), sn.set(e, t)), t;
}, no = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
let ro = (e) => crypto.getRandomValues(new Uint8Array(e)), oo = (e, t, n) => {
  let r = (2 << Math.log2(e.length - 1)) - 1, o = -~(1.6 * r * t / e.length);
  return (s = t) => {
    let i = "";
    for (; ; ) {
      let c = n(o), u = o;
      for (; u--; )
        if (i += e[c[u] & r] || "", i.length === s) return i;
    }
  };
}, io = (e, t = 21) => oo(e, t, ro), nt = (e = 21) => {
  let t = "", n = crypto.getRandomValues(new Uint8Array(e));
  for (; e--; )
    t += no[n[e] & 63];
  return t;
};
const so = io(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  4
);
function Nt() {
  return so();
}
function Re(e) {
  return _e(e) || e === "";
}
function _e(e) {
  return e === null || e === void 0;
}
function U(...e) {
  return e.filter(Boolean).join(" ");
}
function kt() {
  return `hsl(${Math.floor(Math.random() * 360)}, 100%, 92%)`;
}
function lo(e, t, n) {
  if (n.length === 0)
    return 1;
  for (const r of n) {
    if (Re(e[r.columnId]))
      return 1;
    if (Re(t[r.columnId]))
      return -1;
    const o = e[r.columnId].toString().toLowerCase(), s = t[r.columnId].toString().toLowerCase();
    if (o < s)
      return r.order === "asc" ? -1 : 1;
    if (o > s)
      return r.order === "asc" ? 1 : -1;
  }
  return 0;
}
function co(e, t) {
  if (t.length === 0)
    return !0;
  for (const n of t) {
    let r = e[n.columnId];
    switch (_e(r) && (r = ""), typeof r == "number" && (r = r.toString()), r = r.toLowerCase(), n.type) {
      case "contains":
        if (!r.includes(n.value.toLowerCase())) return !1;
        break;
      case "does-not-contain":
        if (r.includes(n.value.toLowerCase())) return !1;
        break;
      case "is":
        if (r !== n.value.toLowerCase()) return !1;
        break;
      case "is-not":
        if (r === n.value.toLowerCase()) return !1;
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
const Wn = "update_column", ao = "delete_column", uo = "add_row", fo = "delete_rows", mo = "update_row", Un = "update_rows", ho = "add_column", _t = (e, t) => e + t, Kn = (e, t) => {
  if (e === void 0)
    return t;
  for (const n of Object.keys(t))
    t[n] instanceof Object && Object.assign(t[n], Kn(e[n], t[n]));
  return Object.assign(e || {}, t), e;
}, St = {
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
}, rt = L(St), ie = L((e) => e(rt)), ln = L(null, (e, t, n) => {
  St.rowSelectionButtons = [], t(rt, { ...Kn(St, n) });
}), Zn = L(""), oe = L({ onChange: () => null }), po = L(
  null,
  (e, t, n) => t(oe, n)
);
L(null, (e, t, n) => {
  t(oe, { onChange: n });
});
const H = L({}), go = (e) => L((t) => new Set(Object.entries(t(H)).map(([n, r]) => r[e])).size), qn = (e) => L(
  (t) => t(H)[e],
  (t, n, r) => {
    const o = typeof r == "function" ? r(t(qn(e))) : r;
    n(H, (s) => ({
      ...s,
      [e]: { ...s[e], ...o }
    })), t(oe).onChange({
      type: mo,
      rowId: e,
      update: o
    });
  }
), we = (e) => L(
  (t) => t(J)[e],
  (t, n, r) => {
    const o = typeof r == "function" ? r(t(J)[e]) : r;
    n(J, (s) => ({
      ...s,
      [e]: { ...s[e], ...o }
    })), t(oe).onChange({
      type: Wn,
      colId: e,
      update: o
    });
  }
), vo = L(null, (e, t, n) => {
  const r = Object.entries(e(H)).filter(([, o]) => o.isSelected === !0).map(([o, s]) => o);
  t(
    H,
    Object.fromEntries(
      Object.entries(e(H)).filter(([, o]) => o.isSelected !== !0)
    )
  ), t(ge, !1), e(oe).onChange({
    type: fo,
    rows: [r]
  });
}), wo = L(
  null,
  (e, t, n = { handler: () => null }) => {
    t(
      H,
      Object.fromEntries(
        n.handler(Object.entries(e(H)).map(([r, o]) => o)).map((r) => [r.id, r])
      )
    ), e(oe).onChange({
      type: Un,
      rows: n.handler(Object.entries(e(H)).map(([r, o]) => o)).map((r) => ({ rowId: r.id, update: r }))
    }), t(
      H,
      Object.fromEntries(
        Object.entries(e(H)).map(([r, o]) => [
          r,
          { ...o, isSelected: !1 }
        ])
      )
    ), t(ge, !1);
  }
), bo = L(null, (e, t, n) => {
  t(H, Object.fromEntries(n.map((r) => [r.id, r])));
}), zn = L(null, (e, t, n) => {
  t(H, (r) => ({
    ...r,
    [n.id]: n
  })), t(it(n.id, e(me)[0]), "editing"), e(oe).onChange({ type: uo, rowId: n.id, update: n });
}), xo = L((e) => Object.keys(e(H)).length), yo = L(
  (e) => e(ge) ? Object.keys(e(H)).length : Object.entries(e(H)).map(([, t]) => t.isSelected === !0).reduce(_t, 0)
), Vt = L({}), Ie = L((e) => Object.entries(e(H)).filter(([, t]) => co(t, e($t))).sort(
  ([, t], [, n]) => lo(t, n, [...e(je), ...e(Bt)])
).map(([t, n]) => ({
  id: t,
  groupVal: e(je).length === 0 ? "" : n[e(je)[0].columnId]
})).map((t, n, r) => ({
  id: t.id,
  first: n === 0 || t.groupVal !== r[n - 1].groupVal,
  last: n === r.length - 1 || t.groupVal !== r[n + 1].groupVal,
  groupVal: t.groupVal
}))), cn = L({}), ot = (e) => L(
  (t) => t(cn)[e],
  (t, n, r) => n(cn, (o) => ({ ...o, [e]: r }))
), J = L({}), me = L(
  (e) => Object.entries(e(J)).filter(([t, n]) => n.isVisible === !0).map(([t]) => t)
), Yn = L(
  (e) => Object.entries(e(J)).map(([t, n]) => n)
), Ro = L(
  (e) => Object.entries(e(J)).map(([t, n]) => n).filter((t) => t.type !== "custom")
), Co = L((e) => Object.keys(e(J))), Eo = L(
  (e) => Object.entries(e(J)).map(([, t]) => t.isVisible).reduce((t, n) => t + (n === !1), 0)
), No = {
  isVisible: !0,
  width: 192,
  type: "text",
  options: [],
  showOptionSearch: !0,
  isEditable: !0,
  isViewOnly: !1
}, ko = L(null, (e, t, n) => {
  t(
    J,
    Object.fromEntries(
      n.map((r) => ({ ...No, ...r })).map((r) => [r.id, r])
    )
  );
}), So = L(null, (e, t, n) => {
  t(J, (r) => ({ ...r, [n.id]: n })), t(ot(n.id), !0), e(oe).onChange({
    type: ho,
    colId: n.id,
    update: n
  });
}), Oo = L(null, (e, t, n) => {
  t(
    J,
    (r) => Object.fromEntries(Object.entries(r).filter(([o]) => o !== n.id))
  ), e(oe).onChange({ type: ao, colId: n.id });
}), Gn = L((e) => Object.entries(e(J)).filter(([t, n]) => n.isVisible === !0).map(([t, n]) => n.width).reduce(_t, e(rt).selectRow.enabled ? 64 : 0)), je = L([]), De = L((e) => e(je)), Ao = L(null, (e, t, n) => {
  t(je, n.grouping), t(Vt, {});
}), Xn = L(!1), Jn = L(!1), Bt = L([]), Ht = L((e) => e(Bt)), Qn = L(null, (e, t, n) => {
  t(Bt, n.sorting);
}), $t = L([]), er = L((e) => e($t)), tr = L(null, (e, t, n) => {
  t($t, n.filtering);
}), nr = L(32), Wt = L((e) => e(nr)), Do = L(null, (e, t, n) => {
  t(nr, n.rowHeight);
}), ge = L(!1), Lo = L((e) => e(ge)), Mo = L(null, (e, t, n) => {
  const r = e(ge);
  t(ge, !r), t(
    H,
    Object.fromEntries(
      Object.entries(e(H)).map(([o, s]) => [
        o,
        { ...s, isSelected: !r }
      ])
    )
  );
}), To = L(null, (e, t, n) => {
  t(ge, !1), t(
    H,
    Object.fromEntries(
      Object.entries(e(H)).map(([r, o]) => [
        r,
        { ...o, isSelected: !1 }
      ])
    )
  );
});
L(null, (e, t, n) => {
  t(ge, n.value), t(
    H,
    Object.fromEntries(
      Object.entries(e(H)).map(([r, o]) => [
        r,
        { ...o, isSelected: n.value }
      ])
    )
  );
});
const rr = L(!1);
L((e) => e(rr));
L(null, (e, t, n) => {
  t(rr, n.dragging);
});
const an = L({}), it = (e, t) => L(
  (n) => {
    var r;
    return ((r = n(an)[e]) == null ? void 0 : r[t]) || "none";
  },
  (n, r, o) => {
    r(an, { [e]: { [t]: o } });
  }
), Ut = L(null, (e, t, n) => {
  t(it(n.rowId, n.colId), n.value);
}), Po = L(null, (e, t, n) => {
  const { colId: r, type: o } = n;
  let { options: s, configuration: i } = e(J)[r];
  const c = e(rt);
  let u = (l) => l;
  switch (o) {
    case "select": {
      s = [
        ...new Set(Object.entries(e(H)).map(([d, f]) => f[r]))
      ].filter((d) => !_e(d) && d !== "").map((d) => ({
        value: d,
        name: d,
        color: kt()
      }));
      break;
    }
    case "multiSelect": {
      s = [
        ...new Set(
          Object.entries(e(H)).flatMap(
            ([d, f]) => Re(f[r]) ? [] : f[r].split(",")
          )
        )
      ].filter((d) => !_e(d) && d !== "").map((d) => ({
        value: d,
        name: d,
        color: kt()
      }));
      break;
    }
    case "number": {
      u = (l) => l;
      break;
    }
    case "date": {
      u = (l) => c.parseDate !== void 0 ? l : Number.isNaN(Date.parse(l)) ? "" : new Date(Date.parse(l)).toISOString();
      break;
    }
    case "checkbox": {
      u = (l) => {
        var d, f, p;
        return ((p = (f = (d = l == null ? void 0 : l.toLowerCase) == null ? void 0 : d.call(l)) == null ? void 0 : f.trim) == null ? void 0 : p.call(f)) === "true";
      };
      break;
    }
  }
  t(we(r), (l) => ({ ...l[r], type: o, options: s })), t(
    H,
    Object.fromEntries(
      Object.entries(e(H)).map(([l, d]) => [
        l,
        { ...d, [r]: u(d[r]) }
      ])
    )
  ), e(oe).onChange({
    type: Wn,
    colId: r,
    update: { type: o, options: s }
  }), e(oe).onChange({
    type: Un,
    rows: Object.entries(e(H)).map(([l, d]) => ({
      rowId: l,
      update: { [r]: u(d[r]) }
    }))
  });
}), Io = (e, t) => L(null, (n, r, o) => {
  const s = n(me).findIndex((l) => l === t), i = n(Ie).findIndex(
    (l) => l.id === e
  );
  let c = e, u = t;
  switch (o) {
    case "left": {
      u = n(me)[Math.max(0, s - 1)];
      break;
    }
    case "right": {
      u = n(me)[Math.min(n(me).length - 1, s + 1)];
      break;
    }
    case "up": {
      c = n(Ie).map((l) => l.id)[Math.max(0, i - 1)];
      break;
    }
    case "down": {
      c = n(Ie).map((l) => l.id)[Math.min(
        n(Ie).flatMap((l) => l.rowIds).length - 1,
        i + 1
      )];
      break;
    }
  }
  t === u && e === c || r(it(c, u), "focused");
}), un = (e, t) => L(
  (n) => Object.entries(n(H)).map(([r, o]) => o[e]).map(t).reduce(_t, 0)
);
function Fo({
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
const jo = /* @__PURE__ */ m.forwardRef(Fo);
function _o({
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
const Vo = /* @__PURE__ */ m.forwardRef(_o);
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
    d: "m19.5 8.25-7.5 7.5-7.5-7.5"
  }));
}
const Ho = /* @__PURE__ */ m.forwardRef(Bo);
function $o({
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
const dn = /* @__PURE__ */ m.forwardRef($o);
function Wo({
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
const Uo = /* @__PURE__ */ m.forwardRef(Wo);
function Ko({
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
const Zo = /* @__PURE__ */ m.forwardRef(Ko);
function qo({
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
const zo = /* @__PURE__ */ m.forwardRef(qo);
function Yo({
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
const or = /* @__PURE__ */ m.forwardRef(Yo);
function Go({
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
const Xo = /* @__PURE__ */ m.forwardRef(Go);
function Jo({
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
const Qo = /* @__PURE__ */ m.forwardRef(Jo);
function Fe(e) {
  const t = e.getUTCMonth() + 1, n = e.getUTCDate(), r = e.getUTCFullYear();
  return `${t.toString().padStart(2, "0")}/${n.toString().padStart(2, "0")}/${r.toString().padStart(4, "0")}`;
}
function ei({
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
const Kt = /* @__PURE__ */ m.forwardRef(ei);
function ti({
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
const ir = /* @__PURE__ */ m.forwardRef(ti);
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
    fillRule: "evenodd",
    d: "M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z",
    clipRule: "evenodd"
  }));
}
const ri = /* @__PURE__ */ m.forwardRef(ni);
function oi({
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
const ii = /* @__PURE__ */ m.forwardRef(oi);
function si({
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
const li = /* @__PURE__ */ m.forwardRef(si);
function ci({
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
const ai = /* @__PURE__ */ m.forwardRef(ci);
function ui({ tableConfiguration: e, name: t }) {
  const { theme: n = { color: "light" } } = e;
  return /* @__PURE__ */ a(
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
function he({ name: e, color: t, onCancel: n }) {
  return /* @__PURE__ */ E(
    "div",
    {
      className: "rounded px-1.5 p-[1px] truncate whitespace-nowrap text-dark items-center flex cursor-default",
      style: { backgroundColor: t },
      children: [
        e,
        n && /* @__PURE__ */ a(ai, { className: "w-4 h-4", onClick: n })
      ]
    }
  );
}
function Zt({ checked: e, toggle: t, isViewOnly: n }) {
  return /* @__PURE__ */ E("div", { children: [
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
        onClick: () => !n && t(),
        onKeyDown: (r) => {
          (r.key === "Enter" || r.key === " ") && t();
        }
      }
    )
  ] });
}
function di({ data: e, setData: t, focusState: n, isViewOnly: r }) {
  const o = W(() => e || !1, [e]);
  return /* @__PURE__ */ a(G, { children: /* @__PURE__ */ a("span", { className: "flex items-center justify-center p-1.5", children: /* @__PURE__ */ a(
    Zt,
    {
      checked: o,
      toggle: () => t(!o),
      isViewOnly: r
    }
  ) }) });
}
function fi(e, t) {
  const n = le(t);
  K(() => {
    let r = !1;
    for (const o in t) {
      let s = t[o], i = n.current[o];
      if (s instanceof Date && (s = s.getTime()), i instanceof Date && (i = i.getTime()), s !== i) {
        r = !0;
        break;
      }
    }
    if (n.current = t, r)
      return e();
  }, t);
}
function F({ children: e, background: t }) {
  return /* @__PURE__ */ a("div", { className: "shadow-md border rounded rounded-2 text-sm bg-header", children: e });
}
function qt({ children: e }) {
  return /* @__PURE__ */ a("div", { className: "border-b last:border-none", children: /* @__PURE__ */ a("div", { className: "py-3", children: e }) });
}
F.Section = qt;
function mi({ children: e, ...t }) {
  return /* @__PURE__ */ a("div", { className: "px-3 py-1 flex items-center cursor-default", ...t, children: e });
}
function hi({ children: e, disabled: t, ...n }) {
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
qt.Item = mi;
qt.Button = hi;
const pi = (e, t) => new Date(e, t + 1, 0).getDate(), gi = [
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
], vi = [
  "first:col-start-1",
  "first:col-start-2",
  "first:col-start-3",
  "first:col-start-4",
  "first:col-start-5",
  "first:col-start-6",
  "first:col-start-7"
];
function wi({
  value: e,
  onSelect: t
}) {
  const [n, r] = B(e || null), o = /* @__PURE__ */ new Date(), [s, i] = B(
    n ? n.getUTCMonth() : o.getUTCMonth()
  ), [c, u] = B(
    n ? n.getUTCFullYear() : o.getUTCFullYear()
  );
  K(() => {
    if (!e) {
      r(null);
      return;
    }
    r(e), i(e.getUTCMonth()), u(e.getUTCFullYear());
  }, [e]);
  const l = [...Array(pi(c, s)).keys()], d = new Date(c, s, 1).getDay(), f = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  function p() {
    s === 0 ? (u((w) => w - 1), i(11)) : i((w) => w - 1);
  }
  function h() {
    s === 11 ? (u((w) => w + 1), i(0)) : i((w) => w + 1);
  }
  function b(w, y) {
    w.preventDefault();
    const v = /* @__PURE__ */ new Date();
    v.setUTCFullYear(c, s, y), r(v), t == null || t(v);
  }
  function N(w) {
    return n && n.getDate() === w && n.getMonth() === s && n.getFullYear() === c;
  }
  return /* @__PURE__ */ a("div", { className: "w-56", children: /* @__PURE__ */ E(F, { children: [
    /* @__PURE__ */ a(F.Section, { children: /* @__PURE__ */ E("div", { className: "flex px-2 items-center", children: [
      /* @__PURE__ */ E("div", { className: "grow text-left px-1", children: [
        gi[s],
        " ",
        c
      ] }),
      /* @__PURE__ */ a(
        "button",
        {
          type: "button",
          className: "rs-btn hover:bg-hover-light rounded p-1",
          onClick: p,
          "aria-label": "move-calendar-left",
          children: /* @__PURE__ */ a(ri, { className: "w-4 h-4" })
        }
      ),
      /* @__PURE__ */ a(
        "button",
        {
          type: "button",
          className: "rs-btn hover:bg-hover-light rounded p-1",
          onClick: h,
          "aria-label": "move-calendar-right",
          children: /* @__PURE__ */ a(ii, { className: "w-4 h-4" })
        }
      )
    ] }) }),
    /* @__PURE__ */ E(F.Section, { children: [
      /* @__PURE__ */ a("div", { className: "grid grid-cols-7 text-sm px-2 gap-px mb-2", children: f.map((w) => /* @__PURE__ */ a(
        "div",
        {
          className: "text-secondary font-medium flex items-center justify-center",
          children: w
        },
        `wday-${w}`
      )) }),
      /* @__PURE__ */ a("div", { className: "grid grid-cols-7 text-sm px-2 gap-px", children: l.map((w) => /* @__PURE__ */ a(
        "button",
        {
          type: "button",
          className: U(
            "rs-btn p-0.5 rounded flex items-center justify-center col-span-1",
            vi[d],
            !N(w + 1) && "hover:bg-hover-light",
            N(w + 1) && "bg-blue-500 text-inverted hover:bg-blue-500"
          ),
          onClick: (y) => {
            b(y, w + 1);
          },
          children: w + 1
        },
        `day-${w}`
      )) })
    ] })
  ] }) });
}
function st() {
  return typeof window < "u";
}
function Le(e) {
  return sr(e) ? (e.nodeName || "").toLowerCase() : "#document";
}
function Q(e) {
  var t;
  return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function ae(e) {
  var t;
  return (t = (sr(e) ? e.ownerDocument : e.document) || window.document) == null ? void 0 : t.documentElement;
}
function sr(e) {
  return st() ? e instanceof Node || e instanceof Q(e).Node : !1;
}
function q(e) {
  return st() ? e instanceof Element || e instanceof Q(e).Element : !1;
}
function ee(e) {
  return st() ? e instanceof HTMLElement || e instanceof Q(e).HTMLElement : !1;
}
function Ot(e) {
  return !st() || typeof ShadowRoot > "u" ? !1 : e instanceof ShadowRoot || e instanceof Q(e).ShadowRoot;
}
function He(e) {
  const {
    overflow: t,
    overflowX: n,
    overflowY: r,
    display: o
  } = re(e);
  return /auto|scroll|overlay|hidden|clip/.test(t + r + n) && !["inline", "contents"].includes(o);
}
function bi(e) {
  return ["table", "td", "th"].includes(Le(e));
}
function lt(e) {
  return [":popover-open", ":modal"].some((t) => {
    try {
      return e.matches(t);
    } catch {
      return !1;
    }
  });
}
function zt(e) {
  const t = ct(), n = q(e) ? re(e) : e;
  return n.transform !== "none" || n.perspective !== "none" || (n.containerType ? n.containerType !== "normal" : !1) || !t && (n.backdropFilter ? n.backdropFilter !== "none" : !1) || !t && (n.filter ? n.filter !== "none" : !1) || ["transform", "perspective", "filter"].some((r) => (n.willChange || "").includes(r)) || ["paint", "layout", "strict", "content"].some((r) => (n.contain || "").includes(r));
}
function xi(e) {
  let t = ue(e);
  for (; ee(t) && !ve(t); ) {
    if (zt(t))
      return t;
    if (lt(t))
      return null;
    t = ue(t);
  }
  return null;
}
function ct() {
  return typeof CSS > "u" || !CSS.supports ? !1 : CSS.supports("-webkit-backdrop-filter", "none");
}
function ve(e) {
  return ["html", "body", "#document"].includes(Le(e));
}
function re(e) {
  return Q(e).getComputedStyle(e);
}
function at(e) {
  return q(e) ? {
    scrollLeft: e.scrollLeft,
    scrollTop: e.scrollTop
  } : {
    scrollLeft: e.scrollX,
    scrollTop: e.scrollY
  };
}
function ue(e) {
  if (Le(e) === "html")
    return e;
  const t = (
    // Step into the shadow DOM of the parent of a slotted node.
    e.assignedSlot || // DOM Element detected.
    e.parentNode || // ShadowRoot detected.
    Ot(e) && e.host || // Fallback.
    ae(e)
  );
  return Ot(t) ? t.host : t;
}
function lr(e) {
  const t = ue(e);
  return ve(t) ? e.ownerDocument ? e.ownerDocument.body : e.body : ee(t) && He(t) ? t : lr(t);
}
function pe(e, t, n) {
  var r;
  t === void 0 && (t = []), n === void 0 && (n = !0);
  const o = lr(e), s = o === ((r = e.ownerDocument) == null ? void 0 : r.body), i = Q(o);
  if (s) {
    const c = At(i);
    return t.concat(i, i.visualViewport || [], He(o) ? o : [], c && n ? pe(c) : []);
  }
  return t.concat(o, pe(o, [], n));
}
function At(e) {
  return e.parent && Object.getPrototypeOf(e.parent) ? e.frameElement : null;
}
function yi(e) {
  let t = e.activeElement;
  for (; ((n = t) == null || (n = n.shadowRoot) == null ? void 0 : n.activeElement) != null; ) {
    var n;
    t = t.shadowRoot.activeElement;
  }
  return t;
}
function Dt(e, t) {
  if (!e || !t)
    return !1;
  const n = t.getRootNode == null ? void 0 : t.getRootNode();
  if (e.contains(t))
    return !0;
  if (n && Ot(n)) {
    let r = t;
    for (; r; ) {
      if (e === r)
        return !0;
      r = r.parentNode || r.host;
    }
  }
  return !1;
}
function Ri() {
  return /apple/i.test(navigator.vendor);
}
function fn(e, t) {
  return ["mouse", "pen"].includes(e);
}
function Ci(e) {
  return "nativeEvent" in e;
}
function Ei(e) {
  return e.matches("html,body");
}
function Lt(e) {
  return (e == null ? void 0 : e.ownerDocument) || document;
}
function vt(e, t) {
  if (t == null)
    return !1;
  if ("composedPath" in e)
    return e.composedPath().includes(t);
  const n = e;
  return n.target != null && t.contains(n.target);
}
function Pe(e) {
  return "composedPath" in e ? e.composedPath()[0] : e.target;
}
const Ni = "input:not([type='hidden']):not([disabled]),[contenteditable]:not([contenteditable='false']),textarea:not([disabled])";
function ki(e) {
  return ee(e) && e.matches(Ni);
}
const qe = Math.min, xe = Math.max, ze = Math.round, Ue = Math.floor, ce = (e) => ({
  x: e,
  y: e
}), Si = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom"
}, Oi = {
  start: "end",
  end: "start"
};
function mn(e, t, n) {
  return xe(e, qe(t, n));
}
function ut(e, t) {
  return typeof e == "function" ? e(t) : e;
}
function Ce(e) {
  return e.split("-")[0];
}
function dt(e) {
  return e.split("-")[1];
}
function cr(e) {
  return e === "x" ? "y" : "x";
}
function ar(e) {
  return e === "y" ? "height" : "width";
}
function Oe(e) {
  return ["top", "bottom"].includes(Ce(e)) ? "y" : "x";
}
function ur(e) {
  return cr(Oe(e));
}
function Ai(e, t, n) {
  n === void 0 && (n = !1);
  const r = dt(e), o = ur(e), s = ar(o);
  let i = o === "x" ? r === (n ? "end" : "start") ? "right" : "left" : r === "start" ? "bottom" : "top";
  return t.reference[s] > t.floating[s] && (i = Ye(i)), [i, Ye(i)];
}
function Di(e) {
  const t = Ye(e);
  return [Mt(e), t, Mt(t)];
}
function Mt(e) {
  return e.replace(/start|end/g, (t) => Oi[t]);
}
function Li(e, t, n) {
  const r = ["left", "right"], o = ["right", "left"], s = ["top", "bottom"], i = ["bottom", "top"];
  switch (e) {
    case "top":
    case "bottom":
      return n ? t ? o : r : t ? r : o;
    case "left":
    case "right":
      return t ? s : i;
    default:
      return [];
  }
}
function Mi(e, t, n, r) {
  const o = dt(e);
  let s = Li(Ce(e), n === "start", r);
  return o && (s = s.map((i) => i + "-" + o), t && (s = s.concat(s.map(Mt)))), s;
}
function Ye(e) {
  return e.replace(/left|right|bottom|top/g, (t) => Si[t]);
}
function Ti(e) {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...e
  };
}
function Pi(e) {
  return typeof e != "number" ? Ti(e) : {
    top: e,
    right: e,
    bottom: e,
    left: e
  };
}
function Ge(e) {
  const {
    x: t,
    y: n,
    width: r,
    height: o
  } = e;
  return {
    width: r,
    height: o,
    top: n,
    left: t,
    right: t + r,
    bottom: n + o,
    x: t,
    y: n
  };
}
/*!
* tabbable 6.2.0
* @license MIT, https://github.com/focus-trap/tabbable/blob/master/LICENSE
*/
var Ii = ["input:not([inert])", "select:not([inert])", "textarea:not([inert])", "a[href]:not([inert])", "button:not([inert])", "[tabindex]:not(slot):not([inert])", "audio[controls]:not([inert])", "video[controls]:not([inert])", '[contenteditable]:not([contenteditable="false"]):not([inert])', "details>summary:first-of-type:not([inert])", "details:not([inert])"], Tt = /* @__PURE__ */ Ii.join(","), dr = typeof Element > "u", Ve = dr ? function() {
} : Element.prototype.matches || Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector, Xe = !dr && Element.prototype.getRootNode ? function(e) {
  var t;
  return e == null || (t = e.getRootNode) === null || t === void 0 ? void 0 : t.call(e);
} : function(e) {
  return e == null ? void 0 : e.ownerDocument;
}, Je = function e(t, n) {
  var r;
  n === void 0 && (n = !0);
  var o = t == null || (r = t.getAttribute) === null || r === void 0 ? void 0 : r.call(t, "inert"), s = o === "" || o === "true", i = s || n && t && e(t.parentNode);
  return i;
}, Fi = function(t) {
  var n, r = t == null || (n = t.getAttribute) === null || n === void 0 ? void 0 : n.call(t, "contenteditable");
  return r === "" || r === "true";
}, ji = function(t, n, r) {
  if (Je(t))
    return [];
  var o = Array.prototype.slice.apply(t.querySelectorAll(Tt));
  return n && Ve.call(t, Tt) && o.unshift(t), o = o.filter(r), o;
}, _i = function e(t, n, r) {
  for (var o = [], s = Array.from(t); s.length; ) {
    var i = s.shift();
    if (!Je(i, !1))
      if (i.tagName === "SLOT") {
        var c = i.assignedElements(), u = c.length ? c : i.children, l = e(u, !0, r);
        r.flatten ? o.push.apply(o, l) : o.push({
          scopeParent: i,
          candidates: l
        });
      } else {
        var d = Ve.call(i, Tt);
        d && r.filter(i) && (n || !t.includes(i)) && o.push(i);
        var f = i.shadowRoot || // check for an undisclosed shadow
        typeof r.getShadowRoot == "function" && r.getShadowRoot(i), p = !Je(f, !1) && (!r.shadowRootFilter || r.shadowRootFilter(i));
        if (f && p) {
          var h = e(f === !0 ? i.children : f.children, !0, r);
          r.flatten ? o.push.apply(o, h) : o.push({
            scopeParent: i,
            candidates: h
          });
        } else
          s.unshift.apply(s, i.children);
      }
  }
  return o;
}, fr = function(t) {
  return !isNaN(parseInt(t.getAttribute("tabindex"), 10));
}, mr = function(t) {
  if (!t)
    throw new Error("No node provided");
  return t.tabIndex < 0 && (/^(AUDIO|VIDEO|DETAILS)$/.test(t.tagName) || Fi(t)) && !fr(t) ? 0 : t.tabIndex;
}, Vi = function(t, n) {
  var r = mr(t);
  return r < 0 && n && !fr(t) ? 0 : r;
}, Bi = function(t, n) {
  return t.tabIndex === n.tabIndex ? t.documentOrder - n.documentOrder : t.tabIndex - n.tabIndex;
}, hr = function(t) {
  return t.tagName === "INPUT";
}, Hi = function(t) {
  return hr(t) && t.type === "hidden";
}, $i = function(t) {
  var n = t.tagName === "DETAILS" && Array.prototype.slice.apply(t.children).some(function(r) {
    return r.tagName === "SUMMARY";
  });
  return n;
}, Wi = function(t, n) {
  for (var r = 0; r < t.length; r++)
    if (t[r].checked && t[r].form === n)
      return t[r];
}, Ui = function(t) {
  if (!t.name)
    return !0;
  var n = t.form || Xe(t), r = function(c) {
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
  var s = Wi(o, t.form);
  return !s || s === t;
}, Ki = function(t) {
  return hr(t) && t.type === "radio";
}, Zi = function(t) {
  return Ki(t) && !Ui(t);
}, qi = function(t) {
  var n, r = t && Xe(t), o = (n = r) === null || n === void 0 ? void 0 : n.host, s = !1;
  if (r && r !== t) {
    var i, c, u;
    for (s = !!((i = o) !== null && i !== void 0 && (c = i.ownerDocument) !== null && c !== void 0 && c.contains(o) || t != null && (u = t.ownerDocument) !== null && u !== void 0 && u.contains(t)); !s && o; ) {
      var l, d, f;
      r = Xe(o), o = (l = r) === null || l === void 0 ? void 0 : l.host, s = !!((d = o) !== null && d !== void 0 && (f = d.ownerDocument) !== null && f !== void 0 && f.contains(o));
    }
  }
  return s;
}, hn = function(t) {
  var n = t.getBoundingClientRect(), r = n.width, o = n.height;
  return r === 0 && o === 0;
}, zi = function(t, n) {
  var r = n.displayCheck, o = n.getShadowRoot;
  if (getComputedStyle(t).visibility === "hidden")
    return !0;
  var s = Ve.call(t, "details>summary:first-of-type"), i = s ? t.parentElement : t;
  if (Ve.call(i, "details:not([open]) *"))
    return !0;
  if (!r || r === "full" || r === "legacy-full") {
    if (typeof o == "function") {
      for (var c = t; t; ) {
        var u = t.parentElement, l = Xe(t);
        if (u && !u.shadowRoot && o(u) === !0)
          return hn(t);
        t.assignedSlot ? t = t.assignedSlot : !u && l !== t.ownerDocument ? t = l.host : t = u;
      }
      t = c;
    }
    if (qi(t))
      return !t.getClientRects().length;
    if (r !== "legacy-full")
      return !0;
  } else if (r === "non-zero-area")
    return hn(t);
  return !1;
}, Yi = function(t) {
  if (/^(INPUT|BUTTON|SELECT|TEXTAREA)$/.test(t.tagName))
    for (var n = t.parentElement; n; ) {
      if (n.tagName === "FIELDSET" && n.disabled) {
        for (var r = 0; r < n.children.length; r++) {
          var o = n.children.item(r);
          if (o.tagName === "LEGEND")
            return Ve.call(n, "fieldset[disabled] *") ? !0 : !o.contains(t);
        }
        return !0;
      }
      n = n.parentElement;
    }
  return !1;
}, Gi = function(t, n) {
  return !(n.disabled || // we must do an inert look up to filter out any elements inside an inert ancestor
  //  because we're limited in the type of selectors we can use in JSDom (see related
  //  note related to `candidateSelectors`)
  Je(n) || Hi(n) || zi(n, t) || // For a details element with a summary, the summary element gets the focus
  $i(n) || Yi(n));
}, pn = function(t, n) {
  return !(Zi(n) || mr(n) < 0 || !Gi(t, n));
}, Xi = function(t) {
  var n = parseInt(t.getAttribute("tabindex"), 10);
  return !!(isNaN(n) || n >= 0);
}, Ji = function e(t) {
  var n = [], r = [];
  return t.forEach(function(o, s) {
    var i = !!o.scopeParent, c = i ? o.scopeParent : o, u = Vi(c, i), l = i ? e(o.candidates) : c;
    u === 0 ? i ? n.push.apply(n, l) : n.push(c) : r.push({
      documentOrder: s,
      tabIndex: u,
      item: o,
      isScope: i,
      content: l
    });
  }), r.sort(Bi).reduce(function(o, s) {
    return s.isScope ? o.push.apply(o, s.content) : o.push(s.content), o;
  }, []).concat(n);
}, pr = function(t, n) {
  n = n || {};
  var r;
  return n.getShadowRoot ? r = _i([t], n.includeContainer, {
    filter: pn.bind(null, n),
    flatten: !1,
    getShadowRoot: n.getShadowRoot,
    shadowRootFilter: Xi
  }) : r = ji(t, n.includeContainer, pn.bind(null, n)), Ji(r);
};
function gn(e, t, n) {
  let {
    reference: r,
    floating: o
  } = e;
  const s = Oe(t), i = ur(t), c = ar(i), u = Ce(t), l = s === "y", d = r.x + r.width / 2 - o.width / 2, f = r.y + r.height / 2 - o.height / 2, p = r[c] / 2 - o[c] / 2;
  let h;
  switch (u) {
    case "top":
      h = {
        x: d,
        y: r.y - o.height
      };
      break;
    case "bottom":
      h = {
        x: d,
        y: r.y + r.height
      };
      break;
    case "right":
      h = {
        x: r.x + r.width,
        y: f
      };
      break;
    case "left":
      h = {
        x: r.x - o.width,
        y: f
      };
      break;
    default:
      h = {
        x: r.x,
        y: r.y
      };
  }
  switch (dt(t)) {
    case "start":
      h[i] -= p * (n && l ? -1 : 1);
      break;
    case "end":
      h[i] += p * (n && l ? -1 : 1);
      break;
  }
  return h;
}
const Qi = async (e, t, n) => {
  const {
    placement: r = "bottom",
    strategy: o = "absolute",
    middleware: s = [],
    platform: i
  } = n, c = s.filter(Boolean), u = await (i.isRTL == null ? void 0 : i.isRTL(t));
  let l = await i.getElementRects({
    reference: e,
    floating: t,
    strategy: o
  }), {
    x: d,
    y: f
  } = gn(l, r, u), p = r, h = {}, b = 0;
  for (let N = 0; N < c.length; N++) {
    const {
      name: w,
      fn: y
    } = c[N], {
      x: v,
      y: g,
      data: R,
      reset: x
    } = await y({
      x: d,
      y: f,
      initialPlacement: r,
      placement: p,
      strategy: o,
      middlewareData: h,
      rects: l,
      platform: i,
      elements: {
        reference: e,
        floating: t
      }
    });
    d = v ?? d, f = g ?? f, h = {
      ...h,
      [w]: {
        ...h[w],
        ...R
      }
    }, x && b <= 50 && (b++, typeof x == "object" && (x.placement && (p = x.placement), x.rects && (l = x.rects === !0 ? await i.getElementRects({
      reference: e,
      floating: t,
      strategy: o
    }) : x.rects), {
      x: d,
      y: f
    } = gn(l, p, u)), N = -1);
  }
  return {
    x: d,
    y: f,
    placement: p,
    strategy: o,
    middlewareData: h
  };
};
async function gr(e, t) {
  var n;
  t === void 0 && (t = {});
  const {
    x: r,
    y: o,
    platform: s,
    rects: i,
    elements: c,
    strategy: u
  } = e, {
    boundary: l = "clippingAncestors",
    rootBoundary: d = "viewport",
    elementContext: f = "floating",
    altBoundary: p = !1,
    padding: h = 0
  } = ut(t, e), b = Pi(h), w = c[p ? f === "floating" ? "reference" : "floating" : f], y = Ge(await s.getClippingRect({
    element: (n = await (s.isElement == null ? void 0 : s.isElement(w))) == null || n ? w : w.contextElement || await (s.getDocumentElement == null ? void 0 : s.getDocumentElement(c.floating)),
    boundary: l,
    rootBoundary: d,
    strategy: u
  })), v = f === "floating" ? {
    x: r,
    y: o,
    width: i.floating.width,
    height: i.floating.height
  } : i.reference, g = await (s.getOffsetParent == null ? void 0 : s.getOffsetParent(c.floating)), R = await (s.isElement == null ? void 0 : s.isElement(g)) ? await (s.getScale == null ? void 0 : s.getScale(g)) || {
    x: 1,
    y: 1
  } : {
    x: 1,
    y: 1
  }, x = Ge(s.convertOffsetParentRelativeRectToViewportRelativeRect ? await s.convertOffsetParentRelativeRectToViewportRelativeRect({
    elements: c,
    rect: v,
    offsetParent: g,
    strategy: u
  }) : v);
  return {
    top: (y.top - x.top + b.top) / R.y,
    bottom: (x.bottom - y.bottom + b.bottom) / R.y,
    left: (y.left - x.left + b.left) / R.x,
    right: (x.right - y.right + b.right) / R.x
  };
}
const es = function(e) {
  return e === void 0 && (e = {}), {
    name: "flip",
    options: e,
    async fn(t) {
      var n, r;
      const {
        placement: o,
        middlewareData: s,
        rects: i,
        initialPlacement: c,
        platform: u,
        elements: l
      } = t, {
        mainAxis: d = !0,
        crossAxis: f = !0,
        fallbackPlacements: p,
        fallbackStrategy: h = "bestFit",
        fallbackAxisSideDirection: b = "none",
        flipAlignment: N = !0,
        ...w
      } = ut(e, t);
      if ((n = s.arrow) != null && n.alignmentOffset)
        return {};
      const y = Ce(o), v = Oe(c), g = Ce(c) === c, R = await (u.isRTL == null ? void 0 : u.isRTL(l.floating)), x = p || (g || !N ? [Ye(c)] : Di(c)), k = b !== "none";
      !p && k && x.push(...Mi(c, N, b, R));
      const S = [c, ...x], A = await gr(t, w), M = [];
      let C = ((r = s.flip) == null ? void 0 : r.overflows) || [];
      if (d && M.push(A[y]), f) {
        const j = Ai(o, i, R);
        M.push(A[j[0]], A[j[1]]);
      }
      if (C = [...C, {
        placement: o,
        overflows: M
      }], !M.every((j) => j <= 0)) {
        var T, D;
        const j = (((T = s.flip) == null ? void 0 : T.index) || 0) + 1, _ = S[j];
        if (_)
          return {
            data: {
              index: j,
              overflows: C
            },
            reset: {
              placement: _
            }
          };
        let $ = (D = C.filter((z) => z.overflows[0] <= 0).sort((z, I) => z.overflows[1] - I.overflows[1])[0]) == null ? void 0 : D.placement;
        if (!$)
          switch (h) {
            case "bestFit": {
              var V;
              const z = (V = C.filter((I) => {
                if (k) {
                  const P = Oe(I.placement);
                  return P === v || // Create a bias to the `y` side axis due to horizontal
                  // reading directions favoring greater width.
                  P === "y";
                }
                return !0;
              }).map((I) => [I.placement, I.overflows.filter((P) => P > 0).reduce((P, Z) => P + Z, 0)]).sort((I, P) => I[1] - P[1])[0]) == null ? void 0 : V[0];
              z && ($ = z);
              break;
            }
            case "initialPlacement":
              $ = c;
              break;
          }
        if (o !== $)
          return {
            reset: {
              placement: $
            }
          };
      }
      return {};
    }
  };
};
async function ts(e, t) {
  const {
    placement: n,
    platform: r,
    elements: o
  } = e, s = await (r.isRTL == null ? void 0 : r.isRTL(o.floating)), i = Ce(n), c = dt(n), u = Oe(n) === "y", l = ["left", "top"].includes(i) ? -1 : 1, d = s && u ? -1 : 1, f = ut(t, e);
  let {
    mainAxis: p,
    crossAxis: h,
    alignmentAxis: b
  } = typeof f == "number" ? {
    mainAxis: f,
    crossAxis: 0,
    alignmentAxis: null
  } : {
    mainAxis: f.mainAxis || 0,
    crossAxis: f.crossAxis || 0,
    alignmentAxis: f.alignmentAxis
  };
  return c && typeof b == "number" && (h = c === "end" ? b * -1 : b), u ? {
    x: h * d,
    y: p * l
  } : {
    x: p * l,
    y: h * d
  };
}
const ns = function(e) {
  return e === void 0 && (e = 0), {
    name: "offset",
    options: e,
    async fn(t) {
      var n, r;
      const {
        x: o,
        y: s,
        placement: i,
        middlewareData: c
      } = t, u = await ts(t, e);
      return i === ((n = c.offset) == null ? void 0 : n.placement) && (r = c.arrow) != null && r.alignmentOffset ? {} : {
        x: o + u.x,
        y: s + u.y,
        data: {
          ...u,
          placement: i
        }
      };
    }
  };
}, rs = function(e) {
  return e === void 0 && (e = {}), {
    name: "shift",
    options: e,
    async fn(t) {
      const {
        x: n,
        y: r,
        placement: o
      } = t, {
        mainAxis: s = !0,
        crossAxis: i = !1,
        limiter: c = {
          fn: (w) => {
            let {
              x: y,
              y: v
            } = w;
            return {
              x: y,
              y: v
            };
          }
        },
        ...u
      } = ut(e, t), l = {
        x: n,
        y: r
      }, d = await gr(t, u), f = Oe(Ce(o)), p = cr(f);
      let h = l[p], b = l[f];
      if (s) {
        const w = p === "y" ? "top" : "left", y = p === "y" ? "bottom" : "right", v = h + d[w], g = h - d[y];
        h = mn(v, h, g);
      }
      if (i) {
        const w = f === "y" ? "top" : "left", y = f === "y" ? "bottom" : "right", v = b + d[w], g = b - d[y];
        b = mn(v, b, g);
      }
      const N = c.fn({
        ...t,
        [p]: h,
        [f]: b
      });
      return {
        ...N,
        data: {
          x: N.x - n,
          y: N.y - r,
          enabled: {
            [p]: s,
            [f]: i
          }
        }
      };
    }
  };
};
function vr(e) {
  const t = re(e);
  let n = parseFloat(t.width) || 0, r = parseFloat(t.height) || 0;
  const o = ee(e), s = o ? e.offsetWidth : n, i = o ? e.offsetHeight : r, c = ze(n) !== s || ze(r) !== i;
  return c && (n = s, r = i), {
    width: n,
    height: r,
    $: c
  };
}
function Yt(e) {
  return q(e) ? e : e.contextElement;
}
function Se(e) {
  const t = Yt(e);
  if (!ee(t))
    return ce(1);
  const n = t.getBoundingClientRect(), {
    width: r,
    height: o,
    $: s
  } = vr(t);
  let i = (s ? ze(n.width) : n.width) / r, c = (s ? ze(n.height) : n.height) / o;
  return (!i || !Number.isFinite(i)) && (i = 1), (!c || !Number.isFinite(c)) && (c = 1), {
    x: i,
    y: c
  };
}
const os = /* @__PURE__ */ ce(0);
function wr(e) {
  const t = Q(e);
  return !ct() || !t.visualViewport ? os : {
    x: t.visualViewport.offsetLeft,
    y: t.visualViewport.offsetTop
  };
}
function is(e, t, n) {
  return t === void 0 && (t = !1), !n || t && n !== Q(e) ? !1 : t;
}
function Ee(e, t, n, r) {
  t === void 0 && (t = !1), n === void 0 && (n = !1);
  const o = e.getBoundingClientRect(), s = Yt(e);
  let i = ce(1);
  t && (r ? q(r) && (i = Se(r)) : i = Se(e));
  const c = is(s, n, r) ? wr(s) : ce(0);
  let u = (o.left + c.x) / i.x, l = (o.top + c.y) / i.y, d = o.width / i.x, f = o.height / i.y;
  if (s) {
    const p = Q(s), h = r && q(r) ? Q(r) : r;
    let b = p, N = At(b);
    for (; N && r && h !== b; ) {
      const w = Se(N), y = N.getBoundingClientRect(), v = re(N), g = y.left + (N.clientLeft + parseFloat(v.paddingLeft)) * w.x, R = y.top + (N.clientTop + parseFloat(v.paddingTop)) * w.y;
      u *= w.x, l *= w.y, d *= w.x, f *= w.y, u += g, l += R, b = Q(N), N = At(b);
    }
  }
  return Ge({
    width: d,
    height: f,
    x: u,
    y: l
  });
}
function Gt(e, t) {
  const n = at(e).scrollLeft;
  return t ? t.left + n : Ee(ae(e)).left + n;
}
function br(e, t, n) {
  n === void 0 && (n = !1);
  const r = e.getBoundingClientRect(), o = r.left + t.scrollLeft - (n ? 0 : (
    // RTL <body> scrollbar.
    Gt(e, r)
  )), s = r.top + t.scrollTop;
  return {
    x: o,
    y: s
  };
}
function ss(e) {
  let {
    elements: t,
    rect: n,
    offsetParent: r,
    strategy: o
  } = e;
  const s = o === "fixed", i = ae(r), c = t ? lt(t.floating) : !1;
  if (r === i || c && s)
    return n;
  let u = {
    scrollLeft: 0,
    scrollTop: 0
  }, l = ce(1);
  const d = ce(0), f = ee(r);
  if ((f || !f && !s) && ((Le(r) !== "body" || He(i)) && (u = at(r)), ee(r))) {
    const h = Ee(r);
    l = Se(r), d.x = h.x + r.clientLeft, d.y = h.y + r.clientTop;
  }
  const p = i && !f && !s ? br(i, u, !0) : ce(0);
  return {
    width: n.width * l.x,
    height: n.height * l.y,
    x: n.x * l.x - u.scrollLeft * l.x + d.x + p.x,
    y: n.y * l.y - u.scrollTop * l.y + d.y + p.y
  };
}
function ls(e) {
  return Array.from(e.getClientRects());
}
function cs(e) {
  const t = ae(e), n = at(e), r = e.ownerDocument.body, o = xe(t.scrollWidth, t.clientWidth, r.scrollWidth, r.clientWidth), s = xe(t.scrollHeight, t.clientHeight, r.scrollHeight, r.clientHeight);
  let i = -n.scrollLeft + Gt(e);
  const c = -n.scrollTop;
  return re(r).direction === "rtl" && (i += xe(t.clientWidth, r.clientWidth) - o), {
    width: o,
    height: s,
    x: i,
    y: c
  };
}
function as(e, t) {
  const n = Q(e), r = ae(e), o = n.visualViewport;
  let s = r.clientWidth, i = r.clientHeight, c = 0, u = 0;
  if (o) {
    s = o.width, i = o.height;
    const l = ct();
    (!l || l && t === "fixed") && (c = o.offsetLeft, u = o.offsetTop);
  }
  return {
    width: s,
    height: i,
    x: c,
    y: u
  };
}
function us(e, t) {
  const n = Ee(e, !0, t === "fixed"), r = n.top + e.clientTop, o = n.left + e.clientLeft, s = ee(e) ? Se(e) : ce(1), i = e.clientWidth * s.x, c = e.clientHeight * s.y, u = o * s.x, l = r * s.y;
  return {
    width: i,
    height: c,
    x: u,
    y: l
  };
}
function vn(e, t, n) {
  let r;
  if (t === "viewport")
    r = as(e, n);
  else if (t === "document")
    r = cs(ae(e));
  else if (q(t))
    r = us(t, n);
  else {
    const o = wr(e);
    r = {
      x: t.x - o.x,
      y: t.y - o.y,
      width: t.width,
      height: t.height
    };
  }
  return Ge(r);
}
function xr(e, t) {
  const n = ue(e);
  return n === t || !q(n) || ve(n) ? !1 : re(n).position === "fixed" || xr(n, t);
}
function ds(e, t) {
  const n = t.get(e);
  if (n)
    return n;
  let r = pe(e, [], !1).filter((c) => q(c) && Le(c) !== "body"), o = null;
  const s = re(e).position === "fixed";
  let i = s ? ue(e) : e;
  for (; q(i) && !ve(i); ) {
    const c = re(i), u = zt(i);
    !u && c.position === "fixed" && (o = null), (s ? !u && !o : !u && c.position === "static" && !!o && ["absolute", "fixed"].includes(o.position) || He(i) && !u && xr(e, i)) ? r = r.filter((d) => d !== i) : o = c, i = ue(i);
  }
  return t.set(e, r), r;
}
function fs(e) {
  let {
    element: t,
    boundary: n,
    rootBoundary: r,
    strategy: o
  } = e;
  const i = [...n === "clippingAncestors" ? lt(t) ? [] : ds(t, this._c) : [].concat(n), r], c = i[0], u = i.reduce((l, d) => {
    const f = vn(t, d, o);
    return l.top = xe(f.top, l.top), l.right = qe(f.right, l.right), l.bottom = qe(f.bottom, l.bottom), l.left = xe(f.left, l.left), l;
  }, vn(t, c, o));
  return {
    width: u.right - u.left,
    height: u.bottom - u.top,
    x: u.left,
    y: u.top
  };
}
function ms(e) {
  const {
    width: t,
    height: n
  } = vr(e);
  return {
    width: t,
    height: n
  };
}
function hs(e, t, n) {
  const r = ee(t), o = ae(t), s = n === "fixed", i = Ee(e, !0, s, t);
  let c = {
    scrollLeft: 0,
    scrollTop: 0
  };
  const u = ce(0);
  if (r || !r && !s)
    if ((Le(t) !== "body" || He(o)) && (c = at(t)), r) {
      const p = Ee(t, !0, s, t);
      u.x = p.x + t.clientLeft, u.y = p.y + t.clientTop;
    } else o && (u.x = Gt(o));
  const l = o && !r && !s ? br(o, c) : ce(0), d = i.left + c.scrollLeft - u.x - l.x, f = i.top + c.scrollTop - u.y - l.y;
  return {
    x: d,
    y: f,
    width: i.width,
    height: i.height
  };
}
function wt(e) {
  return re(e).position === "static";
}
function wn(e, t) {
  if (!ee(e) || re(e).position === "fixed")
    return null;
  if (t)
    return t(e);
  let n = e.offsetParent;
  return ae(e) === n && (n = n.ownerDocument.body), n;
}
function yr(e, t) {
  const n = Q(e);
  if (lt(e))
    return n;
  if (!ee(e)) {
    let o = ue(e);
    for (; o && !ve(o); ) {
      if (q(o) && !wt(o))
        return o;
      o = ue(o);
    }
    return n;
  }
  let r = wn(e, t);
  for (; r && bi(r) && wt(r); )
    r = wn(r, t);
  return r && ve(r) && wt(r) && !zt(r) ? n : r || xi(e) || n;
}
const ps = async function(e) {
  const t = this.getOffsetParent || yr, n = this.getDimensions, r = await n(e.floating);
  return {
    reference: hs(e.reference, await t(e.floating), e.strategy),
    floating: {
      x: 0,
      y: 0,
      width: r.width,
      height: r.height
    }
  };
};
function gs(e) {
  return re(e).direction === "rtl";
}
const vs = {
  convertOffsetParentRelativeRectToViewportRelativeRect: ss,
  getDocumentElement: ae,
  getClippingRect: fs,
  getOffsetParent: yr,
  getElementRects: ps,
  getClientRects: ls,
  getDimensions: ms,
  getScale: Se,
  isElement: q,
  isRTL: gs
};
function ws(e, t) {
  let n = null, r;
  const o = ae(e);
  function s() {
    var c;
    clearTimeout(r), (c = n) == null || c.disconnect(), n = null;
  }
  function i(c, u) {
    c === void 0 && (c = !1), u === void 0 && (u = 1), s();
    const {
      left: l,
      top: d,
      width: f,
      height: p
    } = e.getBoundingClientRect();
    if (c || t(), !f || !p)
      return;
    const h = Ue(d), b = Ue(o.clientWidth - (l + f)), N = Ue(o.clientHeight - (d + p)), w = Ue(l), v = {
      rootMargin: -h + "px " + -b + "px " + -N + "px " + -w + "px",
      threshold: xe(0, qe(1, u)) || 1
    };
    let g = !0;
    function R(x) {
      const k = x[0].intersectionRatio;
      if (k !== u) {
        if (!g)
          return i();
        k ? i(!1, k) : r = setTimeout(() => {
          i(!1, 1e-7);
        }, 1e3);
      }
      g = !1;
    }
    try {
      n = new IntersectionObserver(R, {
        ...v,
        // Handle <iframe>s
        root: o.ownerDocument
      });
    } catch {
      n = new IntersectionObserver(R, v);
    }
    n.observe(e);
  }
  return i(!0), s;
}
function bs(e, t, n, r) {
  r === void 0 && (r = {});
  const {
    ancestorScroll: o = !0,
    ancestorResize: s = !0,
    elementResize: i = typeof ResizeObserver == "function",
    layoutShift: c = typeof IntersectionObserver == "function",
    animationFrame: u = !1
  } = r, l = Yt(e), d = o || s ? [...l ? pe(l) : [], ...pe(t)] : [];
  d.forEach((y) => {
    o && y.addEventListener("scroll", n, {
      passive: !0
    }), s && y.addEventListener("resize", n);
  });
  const f = l && c ? ws(l, n) : null;
  let p = -1, h = null;
  i && (h = new ResizeObserver((y) => {
    let [v] = y;
    v && v.target === l && h && (h.unobserve(t), cancelAnimationFrame(p), p = requestAnimationFrame(() => {
      var g;
      (g = h) == null || g.observe(t);
    })), n();
  }), l && !u && h.observe(l), h.observe(t));
  let b, N = u ? Ee(e) : null;
  u && w();
  function w() {
    const y = Ee(e);
    N && (y.x !== N.x || y.y !== N.y || y.width !== N.width || y.height !== N.height) && n(), N = y, b = requestAnimationFrame(w);
  }
  return n(), () => {
    var y;
    d.forEach((v) => {
      o && v.removeEventListener("scroll", n), s && v.removeEventListener("resize", n);
    }), f == null || f(), (y = h) == null || y.disconnect(), h = null, u && cancelAnimationFrame(b);
  };
}
const xs = ns, ys = rs, Rs = es, Cs = (e, t, n) => {
  const r = /* @__PURE__ */ new Map(), o = {
    platform: vs,
    ...n
  }, s = {
    ...o.platform,
    _c: r
  };
  return Qi(e, t, {
    ...o,
    platform: s
  });
};
var Ke = typeof document < "u" ? Pn : K;
function Qe(e, t) {
  if (e === t)
    return !0;
  if (typeof e != typeof t)
    return !1;
  if (typeof e == "function" && e.toString() === t.toString())
    return !0;
  let n, r, o;
  if (e && t && typeof e == "object") {
    if (Array.isArray(e)) {
      if (n = e.length, n !== t.length) return !1;
      for (r = n; r-- !== 0; )
        if (!Qe(e[r], t[r]))
          return !1;
      return !0;
    }
    if (o = Object.keys(e), n = o.length, n !== Object.keys(t).length)
      return !1;
    for (r = n; r-- !== 0; )
      if (!{}.hasOwnProperty.call(t, o[r]))
        return !1;
    for (r = n; r-- !== 0; ) {
      const s = o[r];
      if (!(s === "_owner" && e.$$typeof) && !Qe(e[s], t[s]))
        return !1;
    }
    return !0;
  }
  return e !== e && t !== t;
}
function Rr(e) {
  return typeof window > "u" ? 1 : (e.ownerDocument.defaultView || window).devicePixelRatio || 1;
}
function bn(e, t) {
  const n = Rr(e);
  return Math.round(t * n) / n;
}
function bt(e) {
  const t = m.useRef(e);
  return Ke(() => {
    t.current = e;
  }), t;
}
function Es(e) {
  e === void 0 && (e = {});
  const {
    placement: t = "bottom",
    strategy: n = "absolute",
    middleware: r = [],
    platform: o,
    elements: {
      reference: s,
      floating: i
    } = {},
    transform: c = !0,
    whileElementsMounted: u,
    open: l
  } = e, [d, f] = m.useState({
    x: 0,
    y: 0,
    strategy: n,
    placement: t,
    middlewareData: {},
    isPositioned: !1
  }), [p, h] = m.useState(r);
  Qe(p, r) || h(r);
  const [b, N] = m.useState(null), [w, y] = m.useState(null), v = m.useCallback((I) => {
    I !== k.current && (k.current = I, N(I));
  }, []), g = m.useCallback((I) => {
    I !== S.current && (S.current = I, y(I));
  }, []), R = s || b, x = i || w, k = m.useRef(null), S = m.useRef(null), A = m.useRef(d), M = u != null, C = bt(u), T = bt(o), D = bt(l), V = m.useCallback(() => {
    if (!k.current || !S.current)
      return;
    const I = {
      placement: t,
      strategy: n,
      middleware: p
    };
    T.current && (I.platform = T.current), Cs(k.current, S.current, I).then((P) => {
      const Z = {
        ...P,
        // The floating element's position may be recomputed while it's closed
        // but still mounted (such as when transitioning out). To ensure
        // `isPositioned` will be `false` initially on the next open, avoid
        // setting it to `true` when `open === false` (must be specified).
        isPositioned: D.current !== !1
      };
      j.current && !Qe(A.current, Z) && (A.current = Z, Fn.flushSync(() => {
        f(Z);
      }));
    });
  }, [p, t, n, T, D]);
  Ke(() => {
    l === !1 && A.current.isPositioned && (A.current.isPositioned = !1, f((I) => ({
      ...I,
      isPositioned: !1
    })));
  }, [l]);
  const j = m.useRef(!1);
  Ke(() => (j.current = !0, () => {
    j.current = !1;
  }), []), Ke(() => {
    if (R && (k.current = R), x && (S.current = x), R && x) {
      if (C.current)
        return C.current(R, x, V);
      V();
    }
  }, [R, x, V, C, M]);
  const _ = m.useMemo(() => ({
    reference: k,
    floating: S,
    setReference: v,
    setFloating: g
  }), [v, g]), $ = m.useMemo(() => ({
    reference: R,
    floating: x
  }), [R, x]), z = m.useMemo(() => {
    const I = {
      position: n,
      left: 0,
      top: 0
    };
    if (!$.floating)
      return I;
    const P = bn($.floating, d.x), Z = bn($.floating, d.y);
    return c ? {
      ...I,
      transform: "translate(" + P + "px, " + Z + "px)",
      ...Rr($.floating) >= 1.5 && {
        willChange: "transform"
      }
    } : {
      position: n,
      left: P,
      top: Z
    };
  }, [n, c, $.floating, d.x, d.y]);
  return m.useMemo(() => ({
    ...d,
    update: V,
    refs: _,
    elements: $,
    floatingStyles: z
  }), [d, V, _, $, z]);
}
const Ns = (e, t) => ({
  ...xs(e),
  options: [e, t]
}), ks = (e, t) => ({
  ...ys(e),
  options: [e, t]
}), Ss = (e, t) => ({
  ...Rs(e),
  options: [e, t]
}), Cr = {
  ...m
}, Os = Cr.useInsertionEffect, As = Os || ((e) => e());
function ke(e) {
  const t = m.useRef(() => {
    if (process.env.NODE_ENV !== "production")
      throw new Error("Cannot call an event handler while rendering.");
  });
  return As(() => {
    t.current = e;
  }), m.useCallback(function() {
    for (var n = arguments.length, r = new Array(n), o = 0; o < n; o++)
      r[o] = arguments[o];
    return t.current == null ? void 0 : t.current(...r);
  }, []);
}
var ye = typeof document < "u" ? Pn : K;
function Pt() {
  return Pt = Object.assign ? Object.assign.bind() : function(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = arguments[t];
      for (var r in n)
        Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
    }
    return e;
  }, Pt.apply(this, arguments);
}
let xn = !1, Ds = 0;
const yn = () => (
  // Ensure the id is unique with multiple independent versions of Floating UI
  // on <React 18
  "floating-ui-" + Math.random().toString(36).slice(2, 6) + Ds++
);
function Ls() {
  const [e, t] = m.useState(() => xn ? yn() : void 0);
  return ye(() => {
    e == null && t(yn());
  }, []), m.useEffect(() => {
    xn = !0;
  }, []), e;
}
const Ms = Cr.useId, Er = Ms || Ls;
let It;
process.env.NODE_ENV !== "production" && (It = /* @__PURE__ */ new Set());
function Ts() {
  for (var e, t = arguments.length, n = new Array(t), r = 0; r < t; r++)
    n[r] = arguments[r];
  const o = "Floating UI: " + n.join(" ");
  if (!((e = It) != null && e.has(o))) {
    var s;
    (s = It) == null || s.add(o), console.error(o);
  }
}
function Ps() {
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
const Is = /* @__PURE__ */ m.createContext(null), Fs = /* @__PURE__ */ m.createContext(null), js = () => {
  var e;
  return ((e = m.useContext(Is)) == null ? void 0 : e.id) || null;
}, Nr = () => m.useContext(Fs);
function Xt(e) {
  return "data-floating-ui-" + e;
}
function xt(e, t) {
  let n = e.filter((o) => {
    var s;
    return o.parentId === t && ((s = o.context) == null ? void 0 : s.open);
  }), r = n;
  for (; r.length; )
    r = e.filter((o) => {
      var s;
      return (s = r) == null ? void 0 : s.some((i) => {
        var c;
        return o.parentId === i.id && ((c = o.context) == null ? void 0 : c.open);
      });
    }), n = n.concat(r);
  return n;
}
const kr = () => ({
  getShadowRoot: !0,
  displayCheck: (
    // JSDOM does not support the `tabbable` library. To solve this we can
    // check if `ResizeObserver` is a real function (not polyfilled), which
    // determines if the current environment is JSDOM-like.
    typeof ResizeObserver == "function" && ResizeObserver.toString().includes("[native code]") ? "full" : "none"
  )
});
function Sr(e, t) {
  const n = pr(e, kr());
  t === "prev" && n.reverse();
  const r = n.indexOf(yi(Lt(e)));
  return n.slice(r + 1)[0];
}
function _s() {
  return Sr(document.body, "next");
}
function Vs() {
  return Sr(document.body, "prev");
}
function yt(e, t) {
  const n = t || e.currentTarget, r = e.relatedTarget;
  return !r || !Dt(n, r);
}
function Bs(e) {
  pr(e, kr()).forEach((n) => {
    n.dataset.tabindex = n.getAttribute("tabindex") || "", n.setAttribute("tabindex", "-1");
  });
}
function Rn(e) {
  e.querySelectorAll("[data-tabindex]").forEach((n) => {
    const r = n.dataset.tabindex;
    delete n.dataset.tabindex, r ? n.setAttribute("tabindex", r) : n.removeAttribute("tabindex");
  });
}
const Or = {
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
let Hs;
function Cn(e) {
  e.key === "Tab" && (e.target, clearTimeout(Hs));
}
const En = /* @__PURE__ */ m.forwardRef(function(t, n) {
  const [r, o] = m.useState();
  ye(() => (Ri() && o("button"), document.addEventListener("keydown", Cn), () => {
    document.removeEventListener("keydown", Cn);
  }), []);
  const s = {
    ref: n,
    tabIndex: 0,
    // Role is only for VoiceOver
    role: r,
    "aria-hidden": r ? void 0 : !0,
    [Xt("focus-guard")]: "",
    style: Or
  };
  return /* @__PURE__ */ m.createElement("span", Pt({}, t, s));
}), Ar = /* @__PURE__ */ m.createContext(null), Nn = /* @__PURE__ */ Xt("portal");
function $s(e) {
  e === void 0 && (e = {});
  const {
    id: t,
    root: n
  } = e, r = Er(), o = Us(), [s, i] = m.useState(null), c = m.useRef(null);
  return ye(() => () => {
    s == null || s.remove(), queueMicrotask(() => {
      c.current = null;
    });
  }, [s]), ye(() => {
    if (!r || c.current) return;
    const u = t ? document.getElementById(t) : null;
    if (!u) return;
    const l = document.createElement("div");
    l.id = r, l.setAttribute(Nn, ""), u.appendChild(l), c.current = l, i(l);
  }, [t, r]), ye(() => {
    if (n === null || !r || c.current) return;
    let u = n || (o == null ? void 0 : o.portalNode);
    u && !q(u) && (u = u.current), u = u || document.body;
    let l = null;
    t && (l = document.createElement("div"), l.id = t, u.appendChild(l));
    const d = document.createElement("div");
    d.id = r, d.setAttribute(Nn, ""), u = l || u, u.appendChild(d), c.current = d, i(d);
  }, [t, n, r, o]), s;
}
function Ws(e) {
  const {
    children: t,
    id: n,
    root: r,
    preserveTabOrder: o = !0
  } = e, s = $s({
    id: n,
    root: r
  }), [i, c] = m.useState(null), u = m.useRef(null), l = m.useRef(null), d = m.useRef(null), f = m.useRef(null), p = i == null ? void 0 : i.modal, h = i == null ? void 0 : i.open, b = (
    // The FocusManager and therefore floating element are currently open/
    // rendered.
    !!i && // Guards are only for non-modal focus management.
    !i.modal && // Don't render if unmount is transitioning.
    i.open && o && !!(r || s)
  );
  return m.useEffect(() => {
    if (!s || !o || p)
      return;
    function N(w) {
      s && yt(w) && (w.type === "focusin" ? Rn : Bs)(s);
    }
    return s.addEventListener("focusin", N, !0), s.addEventListener("focusout", N, !0), () => {
      s.removeEventListener("focusin", N, !0), s.removeEventListener("focusout", N, !0);
    };
  }, [s, o, p]), m.useEffect(() => {
    s && (h || Rn(s));
  }, [h, s]), /* @__PURE__ */ m.createElement(Ar.Provider, {
    value: m.useMemo(() => ({
      preserveTabOrder: o,
      beforeOutsideRef: u,
      afterOutsideRef: l,
      beforeInsideRef: d,
      afterInsideRef: f,
      portalNode: s,
      setFocusManagerState: c
    }), [o, s])
  }, b && s && /* @__PURE__ */ m.createElement(En, {
    "data-type": "outside",
    ref: u,
    onFocus: (N) => {
      if (yt(N, s)) {
        var w;
        (w = d.current) == null || w.focus();
      } else {
        const y = Vs() || (i == null ? void 0 : i.refs.domReference.current);
        y == null || y.focus();
      }
    }
  }), b && s && /* @__PURE__ */ m.createElement("span", {
    "aria-owns": s.id,
    style: Or
  }), s && /* @__PURE__ */ Fn.createPortal(t, s), b && s && /* @__PURE__ */ m.createElement(En, {
    "data-type": "outside",
    ref: l,
    onFocus: (N) => {
      if (yt(N, s)) {
        var w;
        (w = f.current) == null || w.focus();
      } else {
        const y = _s() || (i == null ? void 0 : i.refs.domReference.current);
        y == null || y.focus(), i != null && i.closeOnFocusOut && (i == null || i.onOpenChange(!1, N.nativeEvent, "focus-out"));
      }
    }
  }));
}
const Us = () => m.useContext(Ar), Ks = "data-floating-ui-focusable";
function kn(e) {
  return ee(e.target) && e.target.tagName === "BUTTON";
}
function Sn(e) {
  return ki(e);
}
function Zs(e, t) {
  t === void 0 && (t = {});
  const {
    open: n,
    onOpenChange: r,
    dataRef: o,
    elements: {
      domReference: s
    }
  } = e, {
    enabled: i = !0,
    event: c = "click",
    toggle: u = !0,
    ignoreMouse: l = !1,
    keyboardHandlers: d = !0
  } = t, f = m.useRef(), p = m.useRef(!1), h = m.useMemo(() => ({
    onPointerDown(b) {
      f.current = b.pointerType;
    },
    onMouseDown(b) {
      const N = f.current;
      b.button === 0 && c !== "click" && (fn(N) && l || (n && u && (!o.current.openEvent || o.current.openEvent.type === "mousedown") ? r(!1, b.nativeEvent, "click") : (b.preventDefault(), r(!0, b.nativeEvent, "click"))));
    },
    onClick(b) {
      const N = f.current;
      if (c === "mousedown" && f.current) {
        f.current = void 0;
        return;
      }
      fn(N) && l || (n && u && (!o.current.openEvent || o.current.openEvent.type === "click") ? r(!1, b.nativeEvent, "click") : r(!0, b.nativeEvent, "click"));
    },
    onKeyDown(b) {
      f.current = void 0, !(b.defaultPrevented || !d || kn(b)) && (b.key === " " && !Sn(s) && (b.preventDefault(), p.current = !0), b.key === "Enter" && r(!(n && u), b.nativeEvent, "click"));
    },
    onKeyUp(b) {
      b.defaultPrevented || !d || kn(b) || Sn(s) || b.key === " " && p.current && (p.current = !1, r(!(n && u), b.nativeEvent, "click"));
    }
  }), [o, s, c, l, d, r, n, u]);
  return m.useMemo(() => i ? {
    reference: h
  } : {}, [i, h]);
}
const qs = {
  pointerdown: "onPointerDown",
  mousedown: "onMouseDown",
  click: "onClick"
}, zs = {
  pointerdown: "onPointerDownCapture",
  mousedown: "onMouseDownCapture",
  click: "onClickCapture"
}, On = (e) => {
  var t, n;
  return {
    escapeKey: typeof e == "boolean" ? e : (t = e == null ? void 0 : e.escapeKey) != null ? t : !1,
    outsidePress: typeof e == "boolean" ? e : (n = e == null ? void 0 : e.outsidePress) != null ? n : !0
  };
};
function Ys(e, t) {
  t === void 0 && (t = {});
  const {
    open: n,
    onOpenChange: r,
    elements: o,
    dataRef: s
  } = e, {
    enabled: i = !0,
    escapeKey: c = !0,
    outsidePress: u = !0,
    outsidePressEvent: l = "pointerdown",
    referencePress: d = !1,
    referencePressEvent: f = "pointerdown",
    ancestorScroll: p = !1,
    bubbles: h,
    capture: b
  } = t, N = Nr(), w = ke(typeof u == "function" ? u : () => !1), y = typeof u == "function" ? w : u, v = m.useRef(!1), g = m.useRef(!1), {
    escapeKey: R,
    outsidePress: x
  } = On(h), {
    escapeKey: k,
    outsidePress: S
  } = On(b), A = m.useRef(!1), M = ke((_) => {
    var $;
    if (!n || !i || !c || _.key !== "Escape" || A.current)
      return;
    const z = ($ = s.current.floatingContext) == null ? void 0 : $.nodeId, I = N ? xt(N.nodesRef.current, z) : [];
    if (!R && (_.stopPropagation(), I.length > 0)) {
      let P = !0;
      if (I.forEach((Z) => {
        var X;
        if ((X = Z.context) != null && X.open && !Z.context.dataRef.current.__escapeKeyBubbles) {
          P = !1;
          return;
        }
      }), !P)
        return;
    }
    r(!1, Ci(_) ? _.nativeEvent : _, "escape-key");
  }), C = ke((_) => {
    var $;
    const z = () => {
      var I;
      M(_), (I = Pe(_)) == null || I.removeEventListener("keydown", z);
    };
    ($ = Pe(_)) == null || $.addEventListener("keydown", z);
  }), T = ke((_) => {
    var $;
    const z = v.current;
    v.current = !1;
    const I = g.current;
    if (g.current = !1, l === "click" && I || z || typeof y == "function" && !y(_))
      return;
    const P = Pe(_), Z = "[" + Xt("inert") + "]", X = Lt(o.floating).querySelectorAll(Z);
    let de = q(P) ? P : null;
    for (; de && !ve(de); ) {
      const te = ue(de);
      if (ve(te) || !q(te))
        break;
      de = te;
    }
    if (X.length && q(P) && !Ei(P) && // Clicked on a direct ancestor (e.g. FloatingOverlay).
    !Dt(P, o.floating) && // If the target root element contains none of the markers, then the
    // element was injected after the floating element rendered.
    Array.from(X).every((te) => !Dt(de, te)))
      return;
    if (ee(P) && j) {
      const te = P.clientWidth > 0 && P.scrollWidth > P.clientWidth, fe = P.clientHeight > 0 && P.scrollHeight > P.clientHeight;
      let Me = fe && _.offsetX > P.clientWidth;
      if (fe && re(P).direction === "rtl" && (Me = _.offsetX <= P.offsetWidth - P.clientWidth), Me || te && _.offsetY > P.clientHeight)
        return;
    }
    const Qt = ($ = s.current.floatingContext) == null ? void 0 : $.nodeId, Pr = N && xt(N.nodesRef.current, Qt).some((te) => {
      var fe;
      return vt(_, (fe = te.context) == null ? void 0 : fe.elements.floating);
    });
    if (vt(_, o.floating) || vt(_, o.domReference) || Pr)
      return;
    const en = N ? xt(N.nodesRef.current, Qt) : [];
    if (en.length > 0) {
      let te = !0;
      if (en.forEach((fe) => {
        var Me;
        if ((Me = fe.context) != null && Me.open && !fe.context.dataRef.current.__outsidePressBubbles) {
          te = !1;
          return;
        }
      }), !te)
        return;
    }
    r(!1, _, "outside-press");
  }), D = ke((_) => {
    var $;
    const z = () => {
      var I;
      T(_), (I = Pe(_)) == null || I.removeEventListener(l, z);
    };
    ($ = Pe(_)) == null || $.addEventListener(l, z);
  });
  m.useEffect(() => {
    if (!n || !i)
      return;
    s.current.__escapeKeyBubbles = R, s.current.__outsidePressBubbles = x;
    let _ = -1;
    function $(X) {
      r(!1, X, "ancestor-scroll");
    }
    function z() {
      window.clearTimeout(_), A.current = !0;
    }
    function I() {
      _ = window.setTimeout(
        () => {
          A.current = !1;
        },
        // 0ms or 1ms don't work in Safari. 5ms appears to consistently work.
        // Only apply to WebKit for the test to remain 0ms.
        ct() ? 5 : 0
      );
    }
    const P = Lt(o.floating);
    c && (P.addEventListener("keydown", k ? C : M, k), P.addEventListener("compositionstart", z), P.addEventListener("compositionend", I)), y && P.addEventListener(l, S ? D : T, S);
    let Z = [];
    return p && (q(o.domReference) && (Z = pe(o.domReference)), q(o.floating) && (Z = Z.concat(pe(o.floating))), !q(o.reference) && o.reference && o.reference.contextElement && (Z = Z.concat(pe(o.reference.contextElement)))), Z = Z.filter((X) => {
      var de;
      return X !== ((de = P.defaultView) == null ? void 0 : de.visualViewport);
    }), Z.forEach((X) => {
      X.addEventListener("scroll", $, {
        passive: !0
      });
    }), () => {
      c && (P.removeEventListener("keydown", k ? C : M, k), P.removeEventListener("compositionstart", z), P.removeEventListener("compositionend", I)), y && P.removeEventListener(l, S ? D : T, S), Z.forEach((X) => {
        X.removeEventListener("scroll", $);
      }), window.clearTimeout(_);
    };
  }, [s, o, c, y, l, n, r, p, i, R, x, M, k, C, T, S, D]), m.useEffect(() => {
    v.current = !1;
  }, [y, l]);
  const V = m.useMemo(() => ({
    onKeyDown: M,
    [qs[f]]: (_) => {
      d && r(!1, _.nativeEvent, "reference-press");
    }
  }), [M, r, d, f]), j = m.useMemo(() => ({
    onKeyDown: M,
    onMouseDown() {
      g.current = !0;
    },
    onMouseUp() {
      g.current = !0;
    },
    [zs[l]]: () => {
      v.current = !0;
    }
  }), [M, l]);
  return m.useMemo(() => i ? {
    reference: V,
    floating: j
  } : {}, [i, V, j]);
}
function Gs(e) {
  const {
    open: t = !1,
    onOpenChange: n,
    elements: r
  } = e, o = Er(), s = m.useRef({}), [i] = m.useState(() => Ps()), c = js() != null;
  if (process.env.NODE_ENV !== "production") {
    const h = r.reference;
    h && !q(h) && Ts("Cannot pass a virtual element to the `elements.reference` option,", "as it must be a real DOM element. Use `refs.setPositionReference()`", "instead.");
  }
  const [u, l] = m.useState(r.reference), d = ke((h, b, N) => {
    s.current.openEvent = h ? b : void 0, i.emit("openchange", {
      open: h,
      event: b,
      reason: N,
      nested: c
    }), n == null || n(h, b, N);
  }), f = m.useMemo(() => ({
    setPositionReference: l
  }), []), p = m.useMemo(() => ({
    reference: u || r.reference || null,
    floating: r.floating || null,
    domReference: r.reference
  }), [u, r.reference, r.floating]);
  return m.useMemo(() => ({
    dataRef: s,
    open: t,
    onOpenChange: d,
    elements: p,
    events: i,
    floatingId: o,
    refs: f
  }), [t, d, p, i, o, f]);
}
function Xs(e) {
  e === void 0 && (e = {});
  const {
    nodeId: t
  } = e, n = Gs({
    ...e,
    elements: {
      reference: null,
      floating: null,
      ...e.elements
    }
  }), r = e.rootContext || n, o = r.elements, [s, i] = m.useState(null), [c, u] = m.useState(null), d = (o == null ? void 0 : o.domReference) || s, f = m.useRef(null), p = Nr();
  ye(() => {
    d && (f.current = d);
  }, [d]);
  const h = Es({
    ...e,
    elements: {
      ...o,
      ...c && {
        reference: c
      }
    }
  }), b = m.useCallback((g) => {
    const R = q(g) ? {
      getBoundingClientRect: () => g.getBoundingClientRect(),
      contextElement: g
    } : g;
    u(R), h.refs.setReference(R);
  }, [h.refs]), N = m.useCallback((g) => {
    (q(g) || g === null) && (f.current = g, i(g)), (q(h.refs.reference.current) || h.refs.reference.current === null || // Don't allow setting virtual elements using the old technique back to
    // `null` to support `positionReference` + an unstable `reference`
    // callback ref.
    g !== null && !q(g)) && h.refs.setReference(g);
  }, [h.refs]), w = m.useMemo(() => ({
    ...h.refs,
    setReference: N,
    setPositionReference: b,
    domReference: f
  }), [h.refs, N, b]), y = m.useMemo(() => ({
    ...h.elements,
    domReference: d
  }), [h.elements, d]), v = m.useMemo(() => ({
    ...h,
    ...r,
    refs: w,
    elements: y,
    nodeId: t
  }), [h, w, y, t, r]);
  return ye(() => {
    r.dataRef.current.floatingContext = v;
    const g = p == null ? void 0 : p.nodesRef.current.find((R) => R.id === t);
    g && (g.context = v);
  }), m.useMemo(() => ({
    ...h,
    context: v,
    refs: w,
    elements: y
  }), [h, w, y, v]);
}
const An = "active", Dn = "selected";
function Rt(e, t, n) {
  const r = /* @__PURE__ */ new Map(), o = n === "item";
  let s = e;
  if (o && e) {
    const {
      [An]: i,
      [Dn]: c,
      ...u
    } = e;
    s = u;
  }
  return {
    ...n === "floating" && {
      tabIndex: -1,
      [Ks]: ""
    },
    ...s,
    ...t.map((i) => {
      const c = i ? i[n] : null;
      return typeof c == "function" ? e ? c(e) : null : c;
    }).concat(e).reduce((i, c) => (c && Object.entries(c).forEach((u) => {
      let [l, d] = u;
      if (!(o && [An, Dn].includes(l)))
        if (l.indexOf("on") === 0) {
          if (r.has(l) || r.set(l, []), typeof d == "function") {
            var f;
            (f = r.get(l)) == null || f.push(d), i[l] = function() {
              for (var p, h = arguments.length, b = new Array(h), N = 0; N < h; N++)
                b[N] = arguments[N];
              return (p = r.get(l)) == null ? void 0 : p.map((w) => w(...b)).find((w) => w !== void 0);
            };
          }
        } else
          i[l] = d;
    }), i), {})
  };
}
function Js(e) {
  e === void 0 && (e = []);
  const t = e.map((c) => c == null ? void 0 : c.reference), n = e.map((c) => c == null ? void 0 : c.floating), r = e.map((c) => c == null ? void 0 : c.item), o = m.useCallback(
    (c) => Rt(c, e, "reference"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    t
  ), s = m.useCallback(
    (c) => Rt(c, e, "floating"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    n
  ), i = m.useCallback(
    (c) => Rt(c, e, "item"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    r
  );
  return m.useMemo(() => ({
    getReferenceProps: o,
    getFloatingProps: s,
    getItemProps: i
  }), [o, s, i]);
}
function Qs({
  isOpen: e,
  setIsOpen: t,
  offset: n = 0,
  placement: r = "bottom-start",
  click: o = !0
}) {
  const { x: s, y: i, strategy: c, refs: u, context: l } = Xs({
    open: e,
    onOpenChange: t,
    middleware: [ks(), Ns(n), Ss()],
    whileElementsMounted: bs,
    placement: r
  }), d = Zs(l, {
    enabled: o
  }), f = Ys(l, {}), { getReferenceProps: p, getFloatingProps: h } = Js([
    d,
    f
  ]);
  return {
    x: s,
    y: i,
    strategy: c,
    refs: u,
    getReferenceProps: p,
    getFloatingProps: h
  };
}
function se({
  isOpen: e,
  setIsOpen: t,
  offset: n = 0,
  placement: r = "bottom-start",
  hover: o = !1,
  click: s = !0,
  onReferenceClick: i,
  children: c,
  portal: u
}) {
  const { x: l, y: d, strategy: f, refs: p, getReferenceProps: h, getFloatingProps: b } = Qs({
    isOpen: e,
    setIsOpen: t,
    offset: n,
    placement: r,
    hover: o,
    click: s
  }), [N, w] = Br.toArray(c), [y] = O(Zn);
  function v() {
    return e && /* @__PURE__ */ a(Ws, { id: y, children: /* @__PURE__ */ a(
      "div",
      {
        ref: p.setFloating,
        style: {
          position: f,
          top: d ?? 0,
          left: l ?? 0,
          zIndex: 1
        },
        ...b(),
        children: w
      }
    ) });
  }
  function g() {
    return e && /* @__PURE__ */ a(
      "div",
      {
        ref: p.setFloating,
        style: {
          position: f,
          top: d ?? 0,
          left: l ?? 0
        },
        ...b(),
        children: w
      }
    );
  }
  return /* @__PURE__ */ E(G, { children: [
    /* @__PURE__ */ a(
      "div",
      {
        ref: p.setReference,
        ...h({ onClick: i }),
        children: N
      }
    ),
    u ? v() : g()
  ] });
}
function el({
  rowId: e,
  colId: t,
  data: n,
  setData: r,
  focus: o,
  isViewOnly: s,
  columnConfiguration: i,
  tableConfiguration: c
}) {
  const u = W(
    () => c.parseDate !== void 0 ? c.parseDate(n, i) : n ? new Date(Date.parse(n)) : null,
    [n, i]
  ), [l, d] = B(
    u && u._isValid !== !1 ? Fe(u) : ""
  ), f = /^([1-9]|1[012]|0[1-9])[/.-]?$/g, p = /^([1-9]|1[012]|0[1-9])[/.-]([1-9]||0[1-9]|1[0-9]|2[0-9]|3[01])[/.-]?$/g, h = /^([1-9]|1[012]|0[1-9])[/.-]([1-9]||0[1-9]|1[0-9]|2[0-9]|3[01])[/.-](\d?\d?\d?\d)$/g, [b, N] = B(null), w = /* @__PURE__ */ new Date(), y = le(n), [, v] = O(Ut), g = o === "editing", R = Y(
    (A) => {
      v({ rowId: e, colId: t, value: A ? "editing" : "focused" });
    },
    [e, t, v]
  );
  function x(A, M, C) {
    const T = Number(C), D = Number(A) - 1, V = Number(M), j = /* @__PURE__ */ new Date();
    return j.setUTCFullYear(T, D, V), j.setUTCHours(0, 0, 0, 0), j;
  }
  const k = Y(
    (A) => {
      c.formatStoredDate !== void 0 ? r(
        c.formatStoredDate(
          A,
          i
        ) || ""
      ) : r((A == null ? void 0 : A.toISOString()) || ""), c.formatStoredDate !== void 0 ? d(
        c.formatStoredDate(
          u,
          i
        ) || ""
      ) : d(Fe(A)), v({ rowId: e, colId: t, value: "focused" });
    },
    [e, t, v, r]
  );
  K(() => {
    b && b.focus();
  }, [b]), K(() => {
    o === "editing" && (y.current = n), c.formatStoredDate !== void 0 ? d(
      c.formatStoredDate(u, i) || ""
    ) : d(
      u && u._isValid !== !1 ? Fe(u) : ""
    );
  }, [o]);
  function S(A) {
    d(A.target.value);
  }
  return fi(() => {
    if (!l || c.formatStoredDate !== void 0)
      return;
    let A = null;
    if (h.test(l)) {
      l.match(h);
      const [M] = l.matchAll(h);
      A = x(M[1], M[2], M[3]);
    } else if (f.test(l)) {
      l.match(f);
      const [M] = l.matchAll(f);
      A = x(M[1], 1, w.getUTCFullYear());
    } else if (p.test(l)) {
      l.match(p);
      const [M] = l.matchAll(p);
      A = x(
        M[1],
        M[2],
        w.getUTCFullYear()
      );
    }
    r((A == null ? void 0 : A.toISOString()) || "");
  }, [l]), /* @__PURE__ */ E(G, { children: [
    (o === "none" || o === "focused") && /* @__PURE__ */ a("div", { className: "p-1 flex items-center cursor-default w-full", children: u ? c.formatDisplayDate !== void 0 ? c.formatDisplayDate(
      u,
      i
    ) : Fe(u) : "" }),
    o === "editing" && !s && /* @__PURE__ */ E(se, { isOpen: g, setIsOpen: R, offset: 4, children: [
      /* @__PURE__ */ E("div", { className: "h-full", children: [
        /* @__PURE__ */ a("input", { type: "data", className: "hidden", value: l, readOnly: !0 }),
        /* @__PURE__ */ a(
          "input",
          {
            placeholder: "mm/dd/yyyy",
            className: "rs-input focus:outline-none rounded p-1 w-full",
            onChange: S,
            value: l,
            ref: N,
            onKeyDown: (A) => {
              A.code === "Escape" && (A.stopPropagation(), A.nativeEvent.stopImmediatePropagation(), r(y.current), v({ rowId: e, colId: t, value: "focused" }));
            }
          }
        )
      ] }),
      /* @__PURE__ */ a(
        wi,
        {
          onSelect: k,
          value: (u == null ? void 0 : u._isValid) !== !1 ? u : null
        }
      )
    ] })
  ] });
}
function tl({ rowData: e, formula: t }) {
  return /* @__PURE__ */ a(G, { children: /* @__PURE__ */ a("div", { className: "p-1 flex items-center cursor-default w-full", children: /* @__PURE__ */ a("div", { className: "truncate", children: t && typeof t == "function" && t(e) }) }) });
}
function nl({ data: e, setData: t, focusState: n, isViewOnly: r }) {
  const [o, s] = B(null), i = W(() => e || "", [e]), c = W(() => {
    try {
      const l = new URL(e);
      return e;
    } catch {
      return `//${e}`;
    }
  }, [e]);
  function u(l) {
    l.preventDefault(), t(l.target.value);
  }
  return K(() => {
    o && (o.focus(), o.setSelectionRange(i.length + 1, i.length + 1), o.scrollLeft = o.scrollWidth);
  }, [o]), /* @__PURE__ */ E(G, { children: [
    (n === "none" || n === "focused") && /* @__PURE__ */ a("div", { className: "p-1 flex items-center cursor-default w-full", children: /* @__PURE__ */ a("div", { className: "truncate", children: /* @__PURE__ */ a(
      "a",
      {
        href: c,
        rel: "noopener noreferrer",
        target: "_blank",
        className: "text-primary",
        children: e
      }
    ) }) }),
    n === "editing" && !r && /* @__PURE__ */ a(
      "input",
      {
        ref: s,
        type: "text",
        value: i,
        onChange: u,
        tabIndex: -1,
        rows: 1,
        className: "focus:outline-none rs-input p-1 w-full border-none text-sm rounded-sm truncate resize-none max-h-8"
      }
    )
  ] });
}
const rl = {
  32: "truncate",
  64: "line-clamp-2",
  96: "line-clamp-4",
  128: "line-clamp-5"
};
function ol({ data: e, setData: t, focusState: n, isViewOnly: r, setFocus: o }) {
  const [s, i] = B(null), c = W(() => e || "", [e]), [u] = O(Wt);
  function l(f) {
    f.preventDefault(), t(f.target.value);
  }
  function d(f) {
    f.code === "Enter" && (f.ctrlKey || f.metaKey) ? (f.preventDefault(), f.stopPropagation(), o("focused")) : f.code === "Enter" && f.stopPropagation();
  }
  return K(() => {
    s && (s.focus(), s.setSelectionRange(
      c.length + 1,
      c.length || 1
    ), s.scrollTop = s.scrollHeight);
  }, [s]), /* @__PURE__ */ E(G, { children: [
    (n === "none" || n === "focused") && /* @__PURE__ */ a(
      "div",
      {
        className: U(
          "p-1 cursor-default w-full h-full",
          rl[u]
        ),
        children: e
      }
    ),
    n === "editing" && !r && /* @__PURE__ */ a(
      "textarea",
      {
        ref: i,
        name: "text",
        value: c,
        onChange: l,
        onKeyDown: d,
        tabIndex: -1,
        className: "rs-textarea p-1 focus:outline-none border-none text-sm w-full max-w-full h-32 rounded-sm resize-none break-words"
      }
    )
  ] });
}
const il = [
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
function $e({
  options: e = il,
  allOptions: t,
  onSelect: n,
  placeholder: r = "Search",
  inputRef: o,
  OptionRenderer: s,
  value: i = {},
  onNewOption: c,
  enableSearch: u = !0
}) {
  const [l, d] = B(e), f = l.find((C) => C.value === i.value), [p, h] = B(f || l[0]), [b, N] = B(!1), [w, y] = B(""), v = W(() => kt(), []), [g, R] = B({}), x = le(!1);
  K(() => {
    let C = !1;
    if (t)
      for (const D in t)
        t[D].name.toLowerCase() === w.toLowerCase() && (C = !0);
    const T = e.filter((D) => (D.name.toLowerCase() === w.toLowerCase() && (C = !0), D.name.toLowerCase().includes(w.toLowerCase())));
    d(T), x.current ? T.length > 0 ? h(T[0]) : h({
      value: w,
      name: w,
      color: v
    }) : h(f || T[0]), R(C ? {} : {
      value: w,
      name: w,
      color: v
    }), N(C);
  }, [w]);
  function k(C) {
    n == null || n(C);
  }
  function S(C) {
    N(!1), y(C.target.value), x.current = !0;
  }
  const A = Y((C) => {
    if (C.code === "Enter") {
      if (C.preventDefault(), l.length === 0 && b || !p.value)
        return;
      c && !b && c(g), k(p);
    } else if (C.code === "ArrowDown") {
      p || h(l[0]);
      const T = l.findIndex(
        (D) => D.value === p.value
      );
      h(l[(T + 1) % l.length]);
    } else if (C.code === "ArrowUp") {
      p || h(l[0]);
      const T = l.findIndex(
        (D) => D.value === p.value
      );
      h(
        l[(T + l.length - 1) % l.length]
      );
    }
  });
  function M(C) {
    C.preventDefault(), h(l[0]);
  }
  return /* @__PURE__ */ E(
    "div",
    {
      className: "w-full relative pt-2",
      onKeyDown: A,
      onMouseEnter: M,
      role: "searchbox",
      tabIndex: 0,
      children: [
        u && /* @__PURE__ */ a("div", { className: "px-2 mb-2", children: /* @__PURE__ */ a(
          "input",
          {
            className: "rs-input border focus:ring rounded-2 rounded focus:outline-none px-2 p-1 w-full truncate",
            placeholder: r,
            onChange: S,
            ref: o,
            value: w
          }
        ) }),
        /* @__PURE__ */ E("ul", { className: "rs-list max-h-48 overflow-auto pb-2", children: [
          l.map((C) => /* @__PURE__ */ E(
            "li",
            {
              className: U(
                "hover:bg-hover-light px-2 p-1 cursor-default flex flex-row whitespace-nowrap",
                p && p.value === C.value && "bg-hover"
              ),
              onClick: (T) => {
                T.preventDefault(), k(C);
              },
              onMouseEnter: () => {
                h(C);
              },
              "aria-selected": p.value === C.value,
              onKeyDown: (T) => {
                T.code === "Enter" && k(C);
              },
              children: [
                s ? /* @__PURE__ */ a(s, { ...C }) : C.name,
                f && f.value === C.value && /* @__PURE__ */ a(Kt, { className: "w-4 h-4 ml-auto self-center" })
              ]
            },
            C.value
          )),
          c && w && !b && /* @__PURE__ */ E(
            "li",
            {
              className: U(
                "hover:bg-hover-light px-2 p-1 cursor-pointer flex flex-row whitespace-nowrap",
                p && p.value === g.value && "bg-hover"
              ),
              onClick: () => c(g),
              onMouseEnter: () => {
                h(g);
              },
              "aria-selected": !1,
              onKeyDown: (C) => {
                C.code === "Enter" && c(g);
              },
              children: [
                /* @__PURE__ */ a("span", { className: "mr-2", children: "Add option:" }),
                s ? /* @__PURE__ */ a(s, { ...g }) : g.name
              ]
            }
          )
        ] })
      ]
    }
  );
}
function sl({
  rowId: e,
  colId: t,
  data: n,
  setData: r,
  options: o,
  updateColumn: s,
  focusState: i,
  showOptionSearch: c,
  isViewOnly: u
}) {
  const l = W(
    () => Re(n) ? [] : n.split(",").map((y) => o.find((v) => v.value === y)),
    [n, o]
  ), [d, f] = B(null), p = i === "editing", [, h] = O(Ut), b = Y(
    (y) => {
      h({ rowId: e, colId: t, value: y ? "editing" : "focused" });
    },
    [t, e, h]
  ), N = o.filter(
    (y) => l.findIndex((v) => v.value === y.value) === -1
  );
  K(() => {
    d && d.focus();
  }, [d]);
  const w = Y(
    (y) => {
      s({ id: t, options: [...o, y] }), r([...l.map((v) => v.value), y.value].join(",")), h({ rowId: e, colId: t, value: "focused" });
    },
    [t, e, l, o, s, r, h]
  );
  return /* @__PURE__ */ E(G, { children: [
    i === "none" && /* @__PURE__ */ a("div", { className: "p-1 flex items-center h-full overflow-hidden", children: /* @__PURE__ */ a("div", { className: "flex gap-1", children: l.map((y) => y ? /* @__PURE__ */ a(he, { color: y.color, name: y.name }, y.name) : null) }) }),
    (i === "focused" || i === "editing") && /* @__PURE__ */ E(
      se,
      {
        isOpen: p && !u,
        setIsOpen: b,
        referenceClass: "w-full max-h-8",
        children: [
          /* @__PURE__ */ a(
            "div",
            {
              className: "flex items-center p-1 w-full h-full bg-content",
              tabIndex: i === "editing" ? 0 : -1,
              children: /* @__PURE__ */ E("div", { className: "flex gap-1 flex-wrap", children: [
                l.map((y) => y ? /* @__PURE__ */ a(
                  he,
                  {
                    color: y.color,
                    name: y.name,
                    onCancel: (v) => {
                      v.stopPropagation(), r(
                        n.split(",").filter((g) => g !== y.value).join(",")
                      );
                    }
                  },
                  y.name
                ) : null),
                /* @__PURE__ */ a(
                  "button",
                  {
                    className: "p-[3px] bg-zinc-100 rounded flex items-center h-full",
                    type: "button",
                    children: /* @__PURE__ */ a(or, { className: "w-4 text-dark" })
                  }
                )
              ] })
            }
          ),
          /* @__PURE__ */ E(F, { children: [
            /* @__PURE__ */ a("div", { className: "w-48" }),
            /* @__PURE__ */ a(
              $e,
              {
                allOptions: o,
                options: N,
                onSelect: (y) => {
                  r(
                    Re(n) ? y.value : `${n},${y.value}`
                  );
                },
                inputRef: f,
                OptionRenderer: he,
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
function ll({
  data: e,
  setData: t,
  setError: n,
  focus: r,
  isViewOnly: o,
  configuration: s
}) {
  const [i] = O(ie), [c, u] = B(null), l = /^[+-]?(\d*(\.\d*)?)$/, d = W(() => i.parseNumber !== void 0 ? i.parseNumber(e, s) : Number.parseFloat(e), [e, s]);
  function f(h) {
    h.preventDefault(), (i.parseNumber !== void 0 ? !Number.isNaN(i.parseNumber(h.target.value, s)) : l.test(h.target.value)) ? (t(h.target.value), n("")) : n("Please enter a number.");
  }
  K(() => {
    n(""), c && c.focus();
  }, [n, c]);
  const p = (e || "").toString();
  return /* @__PURE__ */ E(G, { children: [
    (r === "none" || r === "focused") && /* @__PURE__ */ a("div", { className: "p-1 flex items-center justify-end truncate cursor-default w-full", children: i.formatDisplayNumber !== void 0 ? i.formatDisplayNumber(d, s) : p }),
    r === "editing" && !o && /* @__PURE__ */ a(
      "input",
      {
        type: "text",
        value: p,
        onChange: f,
        ref: u,
        className: "rs-input p-1 focus:outline-none w-full border-none text-sm rounded-sm truncate text-right"
      }
    )
  ] });
}
function cl({
  rowId: e,
  colId: t,
  data: n,
  setData: r,
  options: o,
  updateColumn: s,
  focusState: i,
  showOptionSearch: c,
  isViewOnly: u,
  tableConfiguration: l
}) {
  const d = W(
    () => _e(n) ? {} : o.find((v) => v.value === n)
  ), [f, p] = B(null), h = W(() => [
    {
      value: null,
      isBlank: !0,
      name: "Blank"
    },
    ...o
  ], [o]), b = i === "editing", [, N] = O(Ut), w = Y(
    (v) => {
      N({ rowId: e, colId: t, value: v ? "editing" : "focused" });
    },
    [t, e, N]
  );
  K(() => {
    f && f.focus();
  }, [f]);
  const y = Y(
    (v) => {
      s({ id: t, options: [...o, v] }), r(v.value), N({ rowId: e, colId: t, value: "focused" });
    },
    [t, e, o, s]
  );
  return /* @__PURE__ */ E(G, { children: [
    i === "none" && /* @__PURE__ */ a("div", { className: "p-1 flex items-center h-full", children: d && /* @__PURE__ */ a(he, { color: d.color, name: d.name }) }),
    u && (i === "focused" || i === "editing") && /* @__PURE__ */ a("div", { className: "flex items-center p-1 w-full h-full", children: d && /* @__PURE__ */ a(he, { color: d.color, name: d.name }) }),
    !u && (i === "focused" || i === "editing") && /* @__PURE__ */ E(
      se,
      {
        isOpen: b,
        setIsOpen: w,
        referenceClass: "w-full max-h-8",
        children: [
          /* @__PURE__ */ E(
            "div",
            {
              className: "flex items-center p-1 w-full h-full",
              tabIndex: i === "editing" ? 0 : -1,
              children: [
                d && /* @__PURE__ */ a(he, { color: d.color, name: d.name }),
                /* @__PURE__ */ a(
                  ir,
                  {
                    className: "w-4 h-4 ml-auto",
                    style: { alignSelf: "center" }
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ E(F, { children: [
            /* @__PURE__ */ a("div", { className: "w-48" }),
            /* @__PURE__ */ a(
              $e,
              {
                options: h,
                onSelect: (v) => {
                  r(v.value), w(!1);
                },
                inputRef: p,
                OptionRenderer: ({ isBlank: v, ...g }) => v ? /* @__PURE__ */ a(
                  ui,
                  {
                    tableConfiguration: l,
                    ...g
                  }
                ) : /* @__PURE__ */ a(he, { ...g }),
                placeholder: "Search for an option...",
                value: d,
                onNewOption: y,
                enableSearch: c
              }
            )
          ] })
        ]
      }
    )
  ] });
}
function al({ data: e, setData: t, focusState: n, isViewOnly: r }) {
  const [o, s] = B(null), i = W(() => e || "", [e]);
  function c(u) {
    u.preventDefault(), t(u.target.value);
  }
  return K(() => {
    o && (o.focus(), o.setSelectionRange(i.length + 1, i.length + 1), o.scrollLeft = o.scrollWidth);
  }, [o]), /* @__PURE__ */ E(G, { children: [
    (n === "none" || n === "focused") && /* @__PURE__ */ a("div", { className: "p-1 flex items-center cursor-default w-full", children: /* @__PURE__ */ a("div", { className: "truncate", children: e }) }),
    n === "editing" && !r && /* @__PURE__ */ a(
      "input",
      {
        ref: s,
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
function ul({ ...e }) {
  return /* @__PURE__ */ E(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      "aria-hidden": "true",
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
function dl({ ...e }) {
  return /* @__PURE__ */ a(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      "aria-hidden": "true",
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
function fl({ ...e }) {
  return /* @__PURE__ */ a(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      "aria-hidden": "true",
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
const Dr = [
  {
    type: "text",
    cell: al,
    icon: dl,
    name: "Single-Line Text"
  },
  {
    type: "longText",
    cell: ol,
    icon: ul,
    name: "Long Text"
  },
  {
    type: "number",
    cell: ll,
    icon: Uo,
    name: "Number"
  },
  {
    type: "select",
    cell: cl,
    icon: Xo,
    name: "Select"
  },
  {
    type: "date",
    cell: el,
    icon: jo,
    name: "Date"
  },
  {
    type: "multiSelect",
    cell: sl,
    icon: zo,
    name: "Multiple Select"
  },
  {
    type: "url",
    cell: nl,
    icon: Zo,
    name: "URL"
  },
  {
    type: "checkbox",
    cell: di,
    icon: Vo,
    name: "Checkbox"
  },
  {
    type: "formula",
    cell: tl,
    icon: fl,
    name: "Formula"
  }
];
function et(e) {
  const [t] = O(ie);
  return [...Dr, ...t.extraColumnTypes].find((n) => n.type === e);
}
function ml() {
  return Dr;
}
const hl = Be.memo(pl);
function pl({ rowId: e, colId: t, data: n, rowData: r, setData: o }) {
  const [s, i] = B(""), c = le(null), u = le(n), l = W(
    () => it(e, t),
    [e, t]
  ), [d, f] = O(l), p = W(() => we(t), [t]), [h, b] = O(p), [N] = O(ie), w = h.type === "custom" ? h.renderer : et(h.type).cell, y = W(
    () => Io(e, t),
    [e, t]
  ), [, v] = O(y);
  function g(S) {
    c.current && !c.current.contains(S.target) && f("none");
  }
  function R(S) {
    if (!c.current || S.target !== c.current) {
      S.code === "Escape" ? (o(u.current), f("focused")) : S.code === "Enter" && f("focused");
      return;
    }
    S.code === "ArrowUp" ? (S.stopPropagation(), S.preventDefault(), v("up")) : S.code === "ArrowDown" ? (S.stopPropagation(), S.preventDefault(), v("down")) : S.code === "ArrowLeft" ? (S.stopPropagation(), S.preventDefault(), v("left")) : S.code === "ArrowRight" ? (S.stopPropagation(), S.preventDefault(), v("right")) : S.code === "Enter" ? (u.current = n, f("editing"), S.stopPropagation(), S.preventDefault()) : S.code === "Escape" && f("none");
  }
  function x(S) {
    c.current && S.target === c.current && f("focused");
  }
  function k(S) {
    S.stopPropagation(), !h.isViewOnly && (u.current = n, f("editing"));
  }
  return K(() => d === "focused" ? (document == null || document.addEventListener("mousedown", g), c.current && c.current.focus(), () => {
    document == null || document.removeEventListener("mousedown", g);
  }) : d === "editing" ? (document == null || document.addEventListener("mousedown", g), () => {
    document == null || document.removeEventListener("mousedown", g);
  }) : d === "none" ? (c.current && c.current.blur(), () => {
  }) : () => {
  }, [d]), /* @__PURE__ */ a(
    "div",
    {
      className: "relative p-0 border-r bg-content focus:outline-none",
      style: { width: h.width },
      ref: c,
      onClick: x,
      onFocus: x,
      onDoubleClick: k,
      tabIndex: 0,
      onKeyDown: R,
      role: "gridcell",
      children: /* @__PURE__ */ E(
        "div",
        {
          className: U(
            "w-full rounded-sm min-h-full focus:outline-none",
            (d === "focused" || d === "editing") && "ring-2 ring-blue-500 absolute top-0 z-10"
          ),
          children: [
            /* @__PURE__ */ a(
              w,
              {
                rowId: e,
                colId: t,
                initData: n,
                data: n,
                options: h.options,
                updateColumn: b,
                setError: i,
                focus: d,
                focusState: d,
                setFocus: f,
                setData: o,
                showOptionSearch: h.showOptionSearch,
                isViewOnly: h.isViewOnly,
                rowData: r,
                formula: h.formula,
                columnConfiguration: h.configuration,
                tableConfiguration: N
              }
            ),
            d === "editing" && s && /* @__PURE__ */ a("div", { className: "text-xs p-1.5 py-2", children: s })
          ]
        }
      )
    }
  );
}
function gl(e, t) {
  if (e == null || e === "")
    return "(empty)";
  switch (t.type) {
    case "select": {
      const n = t.options.find((r) => r.value === e);
      return /* @__PURE__ */ a(he, { color: n.color, name: n.name });
    }
    case "date":
      return Fe(new Date(Date.parse(e)));
    default:
      return e;
  }
}
function vl({ groupVal: e }) {
  const [t] = O(De), n = W(
    () => {
      var i;
      return we(((i = t[0]) == null ? void 0 : i.columnId) || "");
    },
    [t]
  ), [r] = O(n), [o, s] = O(Vt);
  return /* @__PURE__ */ E(
    "div",
    {
      className: U(
        "w-full h-16 bg-header rounded-t-md border flex",
        o[e] && "rounded-b-md"
      ),
      children: [
        /* @__PURE__ */ a(
          "button",
          {
            type: "button",
            className: "h-full flex items-center justify-center w-16",
            onClick: () => s((i) => ({ ...i, [e]: !i[e] })),
            children: /* @__PURE__ */ a(Ho, { className: "w-4 h-4" })
          }
        ),
        /* @__PURE__ */ E("div", { className: "h-full p-1.5", children: [
          /* @__PURE__ */ a("div", { className: "text-xs tracking-wider uppercase font-medium text-secondary", children: r.name }),
          /* @__PURE__ */ a("div", { className: "flex mt-1", children: gl(e, r) })
        ] })
      ]
    }
  );
}
function wl({ groupVal: e }) {
  const [t] = O(De), [, n] = O(zn);
  function r(o) {
    o.preventDefault();
    const s = { data: {} };
    t.length > 0 && (s[t[0].columnId] = e), n({ id: nt(), ...s });
  }
  return /* @__PURE__ */ a(
    "button",
    {
      type: "button",
      onClick: r,
      className: U(
        "rs-btn h-8 border-b border-r font-normal text-sm cursor-pointer flex items-center hover:bg-hover bg-content",
        t.length > 0 && "border-l rounded-b-md"
      ),
      children: /* @__PURE__ */ a("div", { className: "flex items-center justify-center", style: { width: 63 }, children: /* @__PURE__ */ a(or, { className: "w-4 h-4" }) })
    }
  );
}
function bl({ rowId: e, first: t, last: n, groupVal: r }) {
  const [o] = O(De), [s] = O(Vt), [i] = O(Gn), [c] = O(ie);
  return /* @__PURE__ */ E(
    "div",
    {
      className: U(
        t && o.length > 0 && "mt-8",
        o.length > 0 && "ml-4"
      ),
      style: { width: i },
      children: [
        o.length > 0 && t && /* @__PURE__ */ a(vl, { groupVal: r }),
        !s[r] && /* @__PURE__ */ E(G, { children: [
          /* @__PURE__ */ a("div", { className: U(o.length > 0 && "border-l"), children: /* @__PURE__ */ a(xl, { rowId: e }) }),
          c.addRow.enabled && c.addRow.body && n && /* @__PURE__ */ a(wl, { groupVal: r }),
          " "
        ] })
      ]
    }
  );
}
const xl = Be.memo(yl);
function yl({ rowId: e }) {
  const t = W(() => qn(e), [e]), [n, r] = O(t), [o] = O(me), [s] = O(Wt), [i] = O(ie), c = W(
    () => (u) => (l) => {
      r({ [u]: l });
    },
    [r]
  );
  return /* @__PURE__ */ E("div", { className: U("flex relative border-b"), style: { height: s }, children: [
    i.selectRow.enabled && /* @__PURE__ */ a(
      "div",
      {
        className: U(
          "border-r bg-content flex items-center justify-center"
        ),
        style: { width: 64 },
        children: /* @__PURE__ */ a(
          Zt,
          {
            checked: n.isSelected || !1,
            toggle: () => r((u) => ({ isSelected: !u.isSelected }))
          }
        )
      }
    ),
    o.map((u) => /* @__PURE__ */ a(
      hl,
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
const Rl = In(({ handleScroll: e }, t) => {
  const [n] = O(Ie), [r] = O(ie), [o] = O(Gn);
  return /* @__PURE__ */ a(
    "div",
    {
      className: "h-[calc(100%-65px)] overflow-auto border-b bg-background",
      onScroll: e,
      ref: t,
      children: /* @__PURE__ */ E("div", { className: "flex flex-row", style: { minWidth: o }, children: [
        /* @__PURE__ */ E("div", { className: "flex flex-col", children: [
          n.map((s, i) => /* @__PURE__ */ a(
            bl,
            {
              rowId: s.id,
              first: s.first,
              last: s.last,
              groupVal: s.groupVal
            },
            s.id
          )),
          r.addRow.enabled && /* @__PURE__ */ a("div", { className: "h-48 shrink-0 grow" })
        ] }),
        r.addColumn.enabled && /* @__PURE__ */ a("div", { className: "w-48 shrink-0 grow" })
      ] })
    }
  );
}), Lr = [
  {
    type: "empty",
    name: "Empty",
    atomFactory: (e) => un(e, (t) => Re(t))
  },
  {
    type: "filled",
    name: "Filled",
    atomFactory: (e) => un(e, (t) => !Re(t))
  },
  {
    type: "unique",
    name: "Unique",
    atomFactory: go
  }
];
function Ln(e) {
  return Lr.find((t) => t.type === e);
}
function Cl() {
  return Lr.map((e) => e.type);
}
const El = In((e, t) => {
  const [n] = O(me), [r] = O(De);
  return /* @__PURE__ */ a("div", { className: "bg-header h-8", children: /* @__PURE__ */ E("div", { className: "h-8 flex relative", ref: t, children: [
    /* @__PURE__ */ a(
      "div",
      {
        style: { width: 64 },
        className: U(r.length > 0 && "ml-4", "shrink-0 border-r")
      }
    ),
    n.map((o) => /* @__PURE__ */ a(Nl, { colId: o }, o)),
    /* @__PURE__ */ a("div", { className: "w-48 grow shrink-0" })
  ] }) });
});
function Nl({ colId: e }) {
  const t = W(() => we(e), [e]), [n, r] = O(t), o = Ln(n.summary), s = W(
    () => o ? o.atomFactory(n.id) : L(""),
    [o, n.id]
  ), [i] = O(s), c = Cl(), [u, l] = B(!1);
  function d(f) {
    r({ summary: f }), l(!1);
  }
  return /* @__PURE__ */ E(
    se,
    {
      isOpen: u,
      setIsOpen: l,
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
            children: o ? /* @__PURE__ */ E(G, { children: [
              /* @__PURE__ */ a("span", { className: "text-xs text-secondary", children: o.name }),
              /* @__PURE__ */ a("span", { className: "ml-1", children: i })
            ] }) : /* @__PURE__ */ E(G, { children: [
              /* @__PURE__ */ a(ir, { className: "w-4 h-4 hidden group-hover:block" }),
              /* @__PURE__ */ a("span", { className: "hidden group-hover:block text-xs ml-1", children: "Summary" })
            ] })
          }
        ),
        /* @__PURE__ */ E(F, { children: [
          /* @__PURE__ */ a("div", { className: "w-32" }),
          /* @__PURE__ */ E(F.Section, { children: [
            /* @__PURE__ */ a(
              F.Section.Button,
              {
                onClick: () => {
                  d("");
                },
                children: /* @__PURE__ */ a("span", { className: "text-secondary", children: "None" })
              }
            ),
            c.map((f) => {
              const p = Ln(f);
              return /* @__PURE__ */ a(
                F.Section.Button,
                {
                  onClick: () => {
                    d(p.type);
                  },
                  children: p.name
                },
                p.type
              );
            })
          ] })
        ] })
      ]
    }
  );
}
function kl({
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
const Sl = /* @__PURE__ */ m.forwardRef(kl);
function Ol({
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
const Al = /* @__PURE__ */ m.forwardRef(Ol);
function Dl({
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
const Mn = /* @__PURE__ */ m.forwardRef(Dl);
function Ll({
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
const Jt = /* @__PURE__ */ m.forwardRef(Ll);
function Ml({
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
const Tl = /* @__PURE__ */ m.forwardRef(Ml);
function Pl({
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
const ft = /* @__PURE__ */ m.forwardRef(Pl);
function Il({ colId: e, supportedTypes: t }) {
  const [n] = O(W(() => we(e), [e])), [, r] = O(Po), o = W(() => ot(e), [e]), [, s] = O(o);
  function i(c, u) {
    c.preventDefault(), r({ colId: n.id, type: u }), s(!1);
  }
  return /* @__PURE__ */ a(F, { children: /* @__PURE__ */ E(F.Section, { children: [
    /* @__PURE__ */ a("div", { className: "w-56" }),
    /* @__PURE__ */ a(F.Section.Item, { children: /* @__PURE__ */ a("span", { className: "uppercase font-medium text-secondary text-xs", children: "Property Type" }) }),
    t.map((c) => /* @__PURE__ */ E(
      F.Section.Button,
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
function Ft({ ...e }) {
  return /* @__PURE__ */ a(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      "aria-hidden": "true",
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
function Fl({
  colId: e,
  sortCallback: t,
  filterCallback: n,
  deleteCallback: r
}) {
  const [o, s] = O(W(() => we(e), [e])), i = le(), c = o.type === "custom" ? o.icon : et(o.type).icon, u = o.type === "custom" ? "Custom" : et(o.type).name, [, l] = O(Xn), [, d] = O(Jn), f = W(() => ot(e), [e]), [, p] = O(f), [h] = O(ie), b = W(
    () => [...ml(), ...h.extraColumnTypes],
    []
  );
  K(() => {
    i.current && i.current.select();
  }, [i]);
  function N(C) {
    C.preventDefault(), s({ name: C.target.value });
  }
  function w(C) {
    C.code;
  }
  function y(C) {
    C.preventDefault(), r(o), p(!1);
  }
  function v(C) {
    C.preventDefault(), C.stopPropagation(), t([{ columnId: o.id, order: "asc" }]), l(!0), p(!1);
  }
  function g(C) {
    C.preventDefault(), C.stopPropagation(), t([{ columnId: o.id, order: "desc" }]), l(!0), p(!1);
  }
  function R(C) {
    C.preventDefault(), C.stopPropagation(), n([
      {
        columnId: o.id,
        type: o.type === "number" ? "equals" : "contains",
        value: ""
      }
    ]), d(!0), p(!1);
  }
  const x = [
    [
      {
        name: "Sort Ascending",
        icon: Al,
        action: v,
        enabled: h.sorting.enabled
      },
      {
        name: "Sort Descending",
        icon: Sl,
        action: g,
        enabled: h.sorting.enabled
      },
      {
        name: "Filter",
        icon: Ft,
        action: R,
        enabled: h.filtering.enabled
      }
    ],
    [
      {
        name: "Delete",
        icon: Tl,
        action: y,
        disabled: o.is_primary === "true" || o.is_primary === !0,
        enabled: h.deleteColumns.enabled
      }
    ]
  ], [k, S] = B(!1), [A, M] = B(null);
  if (k)
    return /* @__PURE__ */ a(Il, { colId: e, supportedTypes: b });
  if (A !== null) {
    const C = h.extraColumnHeaderPopupActions[A];
    return /* @__PURE__ */ a(
      C.popup,
      {
        column: o,
        setColumn: s,
        close: () => p(!1)
      }
    );
  }
  return /* @__PURE__ */ E(F, { children: [
    /* @__PURE__ */ a("div", { className: "w-56" }),
    /* @__PURE__ */ E(F.Section, { children: [
      /* @__PURE__ */ a(F.Section.Item, { children: /* @__PURE__ */ a(
        "input",
        {
          value: o.name,
          onChange: N,
          ref: i,
          onKeyDown: w,
          className: "rs-input focus:outline-none focus:ring rounded rounded-2 p-1 border w-full mb-2"
        }
      ) }),
      /* @__PURE__ */ a(F.Section.Item, { children: /* @__PURE__ */ a("span", { className: "uppercase font-medium text-secondary text-xs", children: "Property Type" }) }),
      /* @__PURE__ */ E(F.Section.Button, { onClick: () => S(!0), children: [
        c && /* @__PURE__ */ a(c, { className: "w-4 h-4 mr-2" }),
        u
      ] }),
      h.extraColumnHeaderPopupActions.map((C, T) => ({ popupAction: C, index: T })).filter(({ popupAction: C }) => C.section === "main").map(({ popupAction: C, index: T }) => /* @__PURE__ */ a(
        C.menuItem,
        {
          column: o,
          showPopup: () => {
            M(T);
          }
        },
        T
      ))
    ] }),
    x.map(
      (C, T) => C.findIndex((D) => D.enabled === !0) !== -1 && /* @__PURE__ */ E(F.Section, { children: [
        C.map(
          (D) => D.enabled && /* @__PURE__ */ E(
            F.Section.Button,
            {
              onClick: D.action,
              disabled: D.disabled,
              children: [
                /* @__PURE__ */ a(D.icon, { className: "w-4 h-4 mr-2" }),
                /* @__PURE__ */ a("span", { children: D.name })
              ]
            },
            D.name
          )
        ),
        h.extraColumnHeaderPopupActions.filter(
          (D) => D.section === `actions${T + 1}`
        ).map((D, V) => /* @__PURE__ */ a(
          D.menuItem,
          {
            column: o,
            showPopup: () => {
              M(V);
            }
          },
          V
        ))
      ] }, C[0].name)
    )
  ] });
}
function jl({
  colId: e,
  deleteCallback: t,
  sortCallback: n,
  filterCallback: r
}) {
  const [o, s] = O(W(() => we(e), [e])), i = o.type === "custom" ? o.icon : et(o.type).icon, [c, u] = B(o.width), [l, d] = B(!1), f = W(() => ot(e), [e]), [p, h] = O(f), [b] = O(ie);
  function N(w) {
    w.preventDefault();
    const y = w.pageX, v = c;
    d(!0);
    function g(R) {
      const x = Math.max(
        128,
        v + R.pageX - y
      );
      u(x), s({ width: x });
    }
    window.addEventListener("mousemove", g), window.addEventListener("mouseup", () => {
      window.removeEventListener("mousemove", g), d(!1);
    });
  }
  return /* @__PURE__ */ E("div", { className: "relative", children: [
    /* @__PURE__ */ E(
      se,
      {
        isOpen: b.editColumns.enabled && o.isEditable && p && o.type !== "custom",
        setIsOpen: h,
        portal: !0,
        children: [
          /* @__PURE__ */ E(
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
            Fl,
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
          l && "bg-blue-500/30"
        ),
        onMouseDown: N,
        role: "presentation"
      }
    )
  ] });
}
const _l = Be.forwardRef((e, t) => {
  const [n] = O(me), [r] = O(Lo), o = tt(Mo), [s] = O(Ht), [i] = O(De), [, c] = O(So), [, u] = O(Qn), [, l] = O(tr), d = Y(
    (w) => {
      l({ filtering: w });
    },
    [l]
  ), f = Y(
    (w) => {
      u({ sorting: w });
    },
    [u]
  ), [, p] = O(Oo), h = Y((w) => {
    if (s.find((y) => y.columnId === w.id)) {
      const y = s.filter((v) => v.columnId !== w.id);
      f(y);
    }
    p({ id: w.id });
  });
  function b(w) {
    w.preventDefault(), c({
      id: nt(),
      name: `Column-${Nt()}`,
      type: "text",
      width: 192,
      position: n.length,
      isVisible: !0,
      isEditable: !0
    });
  }
  const [N] = O(ie);
  return /* @__PURE__ */ a("div", { className: "flex bg-header border-b z-10", children: /* @__PURE__ */ E("div", { className: "flex relative h-8", ref: t, children: [
    /* @__PURE__ */ E(
      "div",
      {
        className: U(
          "h-8 text-sm inline-flex flex-row",
          i.length > 0 && "ml-[17px]"
        ),
        children: [
          N.selectRow.enabled && /* @__PURE__ */ a(
            "div",
            {
              className: "border-r px-4 flex items-center justify-center h-8",
              style: { width: 64 },
              children: /* @__PURE__ */ a(Zt, { checked: r, toggle: o })
            }
          ),
          n.map((w) => /* @__PURE__ */ a(
            jl,
            {
              colId: w,
              sortCallback: f,
              filterCallback: d,
              deleteCallback: h
            },
            w
          )),
          N.addColumn.enabled && /* @__PURE__ */ a(
            "div",
            {
              onClick: b,
              className: "rs-btn h-8 p-1 cursor-pointer border-r hover:bg-hover-light font-normal w-16 flex items-center justify-center",
              "aria-label": "add-column",
              onKeyDown: (w) => {
                w.code === "Enter" && b(w);
              },
              children: /* @__PURE__ */ a(Jt, { className: "w-4 h-4" })
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ a("div", { className: "w-32 shrink-0 grow" })
  ] }) });
});
function Vl(e, t) {
  let n = null;
  return (...r) => {
    window.clearTimeout(n), n = window.setTimeout(() => {
      e.apply(null, r);
    }, t);
  };
}
const Bl = [
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
function Ae({
  options: e = Bl,
  value: t = {},
  onSelect: n
}) {
  const [r, o] = B(!1), [s, i] = B(t), c = e.find((l) => l.value === s.value);
  function u(l) {
    i(l), o(!1), n == null || n(l);
  }
  return /* @__PURE__ */ a("div", { className: "w-full relative", children: /* @__PURE__ */ E(
    se,
    {
      isOpen: r,
      setIsOpen: o,
      offset: 4,
      portal: !0,
      children: [
        /* @__PURE__ */ E("div", { className: "rs-btn flex flex-row relative w-full border rounded p-1 pl-2 items-center hover:bg-hover focus:outline-none cursor-default", children: [
          /* @__PURE__ */ a("div", { className: "text-ellipsis flex-grow text-left whitespace-nowrap overflow-hidden", children: s.name ? /* @__PURE__ */ a("span", { children: s.name }) : /* @__PURE__ */ a("span", { className: "text-secondary", children: "Select" }) }),
          /* @__PURE__ */ a(li, { className: "w-4 h-4 duration-100 ml-auto" })
        ] }),
        /* @__PURE__ */ a("div", { className: "min-w-full w-max focus:outline-none", children: /* @__PURE__ */ E(F, { children: [
          /* @__PURE__ */ a("div", { className: "w-48" }),
          /* @__PURE__ */ a(F.Section, { children: e.map((l) => /* @__PURE__ */ E(
            F.Section.Button,
            {
              onClick: () => {
                u(l);
              },
              children: [
                /* @__PURE__ */ a("span", { children: l.name }),
                /* @__PURE__ */ a("span", { className: "ml-auto", children: c.value === l.value && /* @__PURE__ */ a(Kt, { className: "w-4 h-4" }) })
              ]
            },
            l.value
          )) })
        ] }) })
      ]
    }
  ) });
}
function Hl({ columns: e, filter: t, setFilter: n }) {
  const [r, o] = B(null), s = [
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
  const c = W(
    () => Vl((l, d) => {
      n((f) => {
        const p = f.findIndex((h) => h.id === l.id);
        return [
          ...f.slice(0, p),
          {
            ...f[p],
            value: d
          },
          ...f.slice(p + 1, f.length)
        ];
      });
    }, 150),
    []
  );
  function u(l) {
    var d;
    return (d = e.find((f) => f.id === l)) == null ? void 0 : d.type;
  }
  return /* @__PURE__ */ E(F, { children: [
    /* @__PURE__ */ a("div", { className: "w-56" }),
    t.length > 0 ? /* @__PURE__ */ E(F.Section, { children: [
      /* @__PURE__ */ a("h3", { className: "text-sm mb-3 px-3 font-medium", children: "Filter By" }),
      /* @__PURE__ */ a("div", { className: "px-3 flex flex-col space-y-3", children: t.map((l) => /* @__PURE__ */ E(
        "div",
        {
          className: "flex flex-row space-x-2",
          children: [
            /* @__PURE__ */ a("div", { className: "w-36", children: /* @__PURE__ */ a(
              Ae,
              {
                options: e.map((d) => ({
                  value: d.id,
                  name: d.name
                })),
                value: {
                  value: l.columnId,
                  name: e.find((d) => d.id === l.columnId).name
                },
                onSelect: (d) => n((f) => {
                  const p = f.findIndex((h) => h.id === l.id);
                  return [
                    ...f.slice(0, p),
                    {
                      ...f[p],
                      type: u(d.value) === "number" ? "equals" : "contains",
                      columnId: d.value
                    },
                    ...f.slice(p + 1, f.length)
                  ];
                })
              }
            ) }),
            /* @__PURE__ */ a("div", { className: "w-28", children: /* @__PURE__ */ a(
              Ae,
              {
                options: u(l.columnId) === "number" ? i : s,
                value: u(l.columnId) === "number" ? i.find(
                  (d) => d.value === l.type
                ) : s.find((d) => d.value === l.type),
                onSelect: (d) => n((f) => {
                  const p = f.findIndex((h) => h.id === l.id);
                  return [
                    ...f.slice(0, p),
                    {
                      ...f[p],
                      type: d.value
                    },
                    ...f.slice(p + 1, f.length)
                  ];
                })
              }
            ) }),
            /* @__PURE__ */ a("div", { className: "w-36", children: /* @__PURE__ */ a(
              "input",
              {
                type: "text",
                className: "rs-input border h-full rounded w-full focus:outline-none focus:ring px-2 p-1",
                defaultValue: l.value,
                placeholder: "Type a value...",
                onChange: (d) => c(l, d.target.value)
              }
            ) }),
            /* @__PURE__ */ a(
              "button",
              {
                type: "button",
                className: "rs-btn flex items-center justify-center hover:bg-hover-light px-2 rounded hover:cursor-pointer",
                onClick: () => n((d) => d.filter((f) => f.id !== l.id)),
                "aria-label": "cancel-filter",
                children: /* @__PURE__ */ a(ft, { className: "h-4 w-4" })
              }
            )
          ]
        },
        `filter-${l.columnId}`
      )) }),
      /* @__PURE__ */ a("div", { className: "py-2 px-3", children: /* @__PURE__ */ E(
        "button",
        {
          className: "rs-btn flex items-center justify-center bg-transparent rounded gap-x-1 h-6 font-thin hover:cursor-pointer text-sm p-0",
          onClick: () => n((l) => [
            ...l,
            {
              id: Nt(),
              columnId: e[0].id,
              type: "contains",
              value: ""
            }
          ]),
          "aria-label": "add-condition",
          type: "button",
          children: [
            /* @__PURE__ */ a(Jt, { className: "h-3 w-3" }),
            /* @__PURE__ */ a("span", { children: "Add condition" })
          ]
        }
      ) })
    ] }) : /* @__PURE__ */ a(
      $e,
      {
        options: e.map((l) => ({
          value: l.id,
          name: l.name
        })),
        onSelect: (l) => n([
          {
            id: Nt(),
            columnId: l.value,
            type: u(l.value) === "number" ? "equals" : "contains",
            value: ""
          }
        ]),
        inputRef: o,
        placeholder: "Filter by..."
      }
    )
  ] });
}
function $l({ setFilter: e }) {
  const [t] = O(er), [n] = O(Ro), [r, o] = O(Jn);
  return /* @__PURE__ */ E(
    se,
    {
      isOpen: r,
      setIsOpen: o,
      offset: 4,
      portal: !0,
      portalId: "table",
      children: [
        Object.keys(t).length > 0 ? /* @__PURE__ */ E("div", { className: "rs-btn h-8 hover:ring-2 hover:ring-black/10 hover:ring-inset bg-indigo-200 px-3 rounded text-sm flex row items-center cursor-default text-dark", children: [
          /* @__PURE__ */ a(Ft, { className: "w-4 h-4 mr-1" }),
          /* @__PURE__ */ a("span", { children: `Filtered by ${Object.keys(t).length} field` })
        ] }) : /* @__PURE__ */ E(
          "div",
          {
            className: U(
              "rs-btn h-8 hover:bg-hover px-3 rounded text-sm flex flex-row items-center cursor-default",
              r && "bg-hover"
            ),
            children: [
              /* @__PURE__ */ a(Ft, { className: "w-4 h-4 mr-1" }),
              /* @__PURE__ */ a("span", { children: "Filter data" })
            ]
          }
        ),
        /* @__PURE__ */ a(Hl, { columns: n, filter: t, setFilter: e })
      ]
    }
  );
}
function Tn({ ...e }) {
  return /* @__PURE__ */ a(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      "aria-hidden": "true",
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
function Wl({ columns: e, grouping: t, setGroup: n }) {
  const [r, o] = B(null), s = [
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
  }, [r]), /* @__PURE__ */ E(F, { children: [
    /* @__PURE__ */ a("div", { className: "w-56" }),
    t.length > 0 ? /* @__PURE__ */ E(F.Section, { children: [
      /* @__PURE__ */ a("h3", { className: "text-sm mb-3 px-3 font-medium", children: "Group By" }),
      /* @__PURE__ */ a("div", { className: "px-3", children: t.map((i) => /* @__PURE__ */ E(
        "div",
        {
          className: "flex flex-row space-x-2",
          children: [
            /* @__PURE__ */ a("div", { className: "w-36", children: /* @__PURE__ */ a(
              Ae,
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
              Ae,
              {
                options: s,
                value: s.find((c) => c.value === i.order),
                onSelect: (c) => n([
                  {
                    columnId: i.columnId,
                    order: c.value
                  }
                ])
              }
            ) }),
            /* @__PURE__ */ a(
              "button",
              {
                type: "button",
                className: "rs-btn flex items-center justify-center hover:bg-hover-light px-2 rounded",
                onClick: () => n([]),
                "aria-label": "cancel-grouping",
                children: /* @__PURE__ */ a(ft, { className: "h-4 w-4" })
              }
            )
          ]
        },
        `grouping-${i.columnId}`
      )) })
    ] }) : /* @__PURE__ */ a(
      $e,
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
function Ul({ grouping: e = [], setGroup: t }) {
  const [n, r] = B(!1), [o] = O(Yn);
  return /* @__PURE__ */ E(
    se,
    {
      isOpen: n,
      setIsOpen: r,
      offset: 4,
      portal: !0,
      portalId: "table",
      children: [
        e.length > 0 ? /* @__PURE__ */ E("div", { className: "rs-btn h-8 hover:ring-2 hover:ring-black/10 hover:ring-inset bg-purple-200 px-3 rounded text-sm flex row items-center cursor-default text-dark", children: [
          /* @__PURE__ */ a(Tn, { className: "w-4 h-4 mr-1" }),
          /* @__PURE__ */ a("span", { children: "Grouped by 1 field" })
        ] }) : /* @__PURE__ */ E(
          "div",
          {
            className: U(
              "rs-btn hover:bg-hover px-3 rounded flex flex-row items-center h-8 cursor-default",
              n && "bg-hover"
            ),
            children: [
              /* @__PURE__ */ a(Tn, { className: "w-4 h-4 mr-1" }),
              /* @__PURE__ */ a("span", { children: "Group" })
            ]
          }
        ),
        /* @__PURE__ */ a(Wl, { columns: o, grouping: e, setGroup: t })
      ]
    }
  );
}
function Kl({ value: e, setValue: t }) {
  return /* @__PURE__ */ E(G, { children: [
    /* @__PURE__ */ a("input", { type: "checkbox", checked: e, className: "hidden", readOnly: !0 }),
    /* @__PURE__ */ a(
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
function Zl({ colId: e }) {
  const [t, n] = O(W(() => we(e), [e]));
  return /* @__PURE__ */ E(F.Section.Item, { children: [
    /* @__PURE__ */ a(
      Kl,
      {
        value: t.isVisible,
        setValue: (r) => n({ isVisible: r })
      }
    ),
    /* @__PURE__ */ a("span", { className: "ml-2", children: t.name })
  ] }, t.id);
}
function ql({ setColumnVisibility: e }) {
  const [t] = O(Co);
  return /* @__PURE__ */ E(F, { children: [
    /* @__PURE__ */ a("div", { className: "w-48" }),
    /* @__PURE__ */ a(F.Section, { children: t.map((n) => /* @__PURE__ */ a(Zl, { colId: n }, n)) })
  ] });
}
function zl({ setColumnVisibility: e }) {
  const [t, n] = B(!1), [r] = O(Eo);
  return /* @__PURE__ */ E(se, { isOpen: t, setIsOpen: n, offset: 4, portal: !0, children: [
    r > 0 ? /* @__PURE__ */ E("div", { className: "rs-btn h-8 hover:ring-2 hover:ring-black/10 hover:ring-inset bg-green-200 px-3 rounded text-sm flex row items-center focus:outline-none cursor-default text-dark", children: [
      /* @__PURE__ */ a(dn, { className: "w-4 h-4 mr-1" }),
      /* @__PURE__ */ a("span", { children: `${r} hidden fields` })
    ] }) : /* @__PURE__ */ E(
      "div",
      {
        className: U(
          "rs-btn hover:bg-hover px-3 rounded flex flex-row items-center h-8 focus:outline-none cursor-default",
          t && "bg-hover"
        ),
        children: [
          /* @__PURE__ */ a(dn, { className: "w-4 h-4 mr-1" }),
          /* @__PURE__ */ a("span", { children: "Hide fields" })
        ]
      }
    ),
    /* @__PURE__ */ a(ql, { setColumnVisibility: e })
  ] });
}
function Yl({ ...e }) {
  return /* @__PURE__ */ a(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      "aria-hidden": "true",
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
function Gl({ ...e }) {
  return /* @__PURE__ */ a(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      "aria-hidden": "true",
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
function Xl({ ...e }) {
  return /* @__PURE__ */ a(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      "aria-hidden": "true",
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
function Jl({ ...e }) {
  return /* @__PURE__ */ a(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      strokeWidth: 1.5,
      stroke: "currentColor",
      "aria-hidden": "true",
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
const Mr = [
  {
    value: 32,
    name: "Short",
    icon: Yl
  },
  {
    value: 64,
    name: "Medium",
    icon: Gl
  },
  {
    value: 96,
    name: "Tall",
    icon: Xl
  },
  {
    value: 128,
    name: "Extra Tall",
    icon: Jl
  }
];
function Tr(e) {
  return Mr.find((t) => t.value === e);
}
function Ql() {
  return Mr.map((e) => e.value);
}
function ec({ height: e, setHeight: t }) {
  const n = Ql();
  return /* @__PURE__ */ E(F, { children: [
    /* @__PURE__ */ a("div", { className: "w-48" }),
    /* @__PURE__ */ a(F.Section, { children: n.map((r) => {
      const o = Tr(r);
      return /* @__PURE__ */ E(
        F.Section.Button,
        {
          onClick: () => t(o.value),
          children: [
            /* @__PURE__ */ a(o.icon, { className: "w-4 h-4 mr-2" }),
            o.name,
            o.value === e && /* @__PURE__ */ a(Kt, { className: "w-4 h-4 ml-auto" })
          ]
        },
        o.value
      );
    }) })
  ] });
}
function tc({ height: e, setHeight: t }) {
  const [n, r] = B(!1), o = Tr(e);
  return /* @__PURE__ */ E(
    se,
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
        /* @__PURE__ */ a(ec, { height: e, setHeight: t })
      ]
    }
  );
}
function nc({ active: e, Icon: t, text: n, bgColor: r }) {
  return /* @__PURE__ */ E(
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
function rc({ sort: e, setSort: t }) {
  const [n, r] = B(null), [o] = O(Yn), s = [
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
  }, [n]), /* @__PURE__ */ E(F, { children: [
    /* @__PURE__ */ a("div", { className: "w-56" }),
    e.length > 0 ? /* @__PURE__ */ E(F.Section, { children: [
      /* @__PURE__ */ a("h3", { className: "text-sm mb-3 px-3 font-medium", children: "Sort By" }),
      /* @__PURE__ */ a("div", { className: "px-3", children: e.map((i) => /* @__PURE__ */ E(
        "div",
        {
          className: "flex flex-row space-x-2",
          children: [
            /* @__PURE__ */ a("div", { className: "w-36", children: /* @__PURE__ */ a(
              Ae,
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
              Ae,
              {
                options: s,
                value: s.find((c) => c.value === i.order),
                onSelect: (c) => t([
                  {
                    columnId: i.columnId,
                    order: c.value
                  }
                ])
              }
            ) }),
            /* @__PURE__ */ a(
              "button",
              {
                type: "button",
                className: "rs-btn flex items-center justify-center hover:bg-hover-light px-2 rounded",
                onClick: () => t([]),
                "aria-label": "cancel-sort",
                children: /* @__PURE__ */ a(ft, { className: "h-4 w-4" })
              }
            )
          ]
        },
        `sort-${i.columnId}`
      )) })
    ] }) : /* @__PURE__ */ a(
      $e,
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
function oc({ setSort: e }) {
  const [t] = O(Ht), [n, r] = O(Xn);
  return /* @__PURE__ */ E(
    se,
    {
      isOpen: n,
      setIsOpen: r,
      offset: 4,
      portal: !0,
      portalId: "table",
      children: [
        t.length > 0 ? /* @__PURE__ */ a(
          nc,
          {
            Icon: Mn,
            text: `Sorted by ${Object.keys(t).length} field`,
            customColor: "bg-orange-200"
          }
        ) : /* @__PURE__ */ E(
          "div",
          {
            className: U(
              "rs-btn hover:bg-hover px-3 rounded flex flex-row items-center h-8 cursor-default",
              n && "bg-hover"
            ),
            children: [
              /* @__PURE__ */ a(Mn, { className: "w-4 h-4 mr-1" }),
              /* @__PURE__ */ a("span", { children: "Sort data" })
            ]
          }
        ),
        /* @__PURE__ */ a(rc, { sort: t, setSort: e })
      ]
    }
  );
}
function ic() {
  const [e] = O(yo), [t] = O(er), [n] = O(Ht), [r] = O(De), [o] = O(Wt), [s] = O(xo), [, i] = O(tr), c = tt(To), [, u] = O(vo), [, l] = O(zn), [, d] = O(wo), [f] = O(ie), p = Y((x) => {
    i({ filtering: x });
  }, []), h = Y((x) => {
    x.preventDefault(), u();
  }, []);
  function b(x) {
    l({ id: nt() });
  }
  const [, N] = O(Qn), w = Y((x) => {
    N({ sorting: x });
  }, []), [, y] = O(Do), v = Y((x) => {
    y({ rowHeight: x });
  }, []), [, g] = O(Ao), R = Y((x) => {
    g({ grouping: x });
  }, []);
  return /* @__PURE__ */ a(
    "div",
    {
      className: "w-full bg-content py-2 text-sm overflow-y-hidden h-12 relative border-b",
      id: "toolbar",
      children: /* @__PURE__ */ E("div", { className: "flex flex-row space-x-2 px-3 items-center whitespace-nowrap h-full", children: [
        /* @__PURE__ */ E("div", { className: "items-center flex w-20 justify-center", children: [
          s > 0 ? s : "No",
          " row",
          s !== 1 && "s"
        ] }),
        e > 0 && /* @__PURE__ */ E("div", { className: "bg-header flex flex-row rounded items-center h-8 cursor-default", children: [
          /* @__PURE__ */ E("div", { className: "text-sm px-2 rounded-l", children: [
            e,
            " row",
            e !== 1 && "s",
            " selected"
          ] }),
          /* @__PURE__ */ a("div", { className: "bg-content h-4 w-px last:hidden" }),
          /* @__PURE__ */ E(
            "button",
            {
              type: "button",
              className: "rs-btn self-stretch hover:bg-hover-light px-2 text-sm flex flex-row items-center",
              onClick: () => c(),
              children: [
                /* @__PURE__ */ a(ft, { className: "w-4 h-4 mr-1" }),
                /* @__PURE__ */ a("span", { children: "Cancel" })
              ]
            }
          ),
          /* @__PURE__ */ a("div", { className: "bg-content h-4 w-px last:hidden" }),
          /* @__PURE__ */ E(
            "button",
            {
              type: "button",
              className: "rs-btn self-stretch hover:bg-hover-light px-2 rounded-r text-sm flex flex-row items-center",
              onClick: h,
              children: [
                /* @__PURE__ */ a(Qo, { className: "w-4 h-4 mr-1" }),
                /* @__PURE__ */ a("span", { children: "Delete" })
              ]
            }
          ),
          /* @__PURE__ */ a("div", { className: "bg-content h-4 w-px last:hidden" }),
          f.rowSelectionButtons.map((x, k) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: plugin-provided toolbar buttons have no stable ID
            /* @__PURE__ */ E(Be.Fragment, { children: [
              /* @__PURE__ */ a(
                "button",
                {
                  type: "button",
                  className: "rs-btn self-stretch hover:bg-hover-light px-2 rounded-r text-sm flex flex-row items-center",
                  onClick: () => d({
                    handler: x.handler
                  }),
                  children: x.body
                }
              ),
              /* @__PURE__ */ a("div", { className: "bg-content h-4 w-px last:hidden" })
            ] }, k)
          ))
        ] }),
        /* @__PURE__ */ a("div", { className: "h-4 border" }),
        f.addRow.enabled && f.addRow.toolbar && /* @__PURE__ */ E(
          "button",
          {
            type: "button",
            className: "rs-btn hover:bg-hover px-3 rounded flex flex-row items-center h-8 focus:outline-none",
            onClick: b,
            children: [
              /* @__PURE__ */ a(Jt, { className: "w-4 h-4 mr-1" }),
              /* @__PURE__ */ a("span", { children: "New row" })
            ]
          }
        ),
        f.hideFields.enabled && /* @__PURE__ */ a(zl, {}),
        f.filtering.enabled && /* @__PURE__ */ a($l, { filter: t, setFilter: p }),
        f.grouping.enabled && /* @__PURE__ */ a(Ul, { grouping: r, setGroup: R }),
        f.sorting.enabled && /* @__PURE__ */ a(oc, { sort: n, setSort: w }),
        f.rowHeight.enabled && /* @__PURE__ */ a(tc, { height: o, setHeight: v }),
        f.extraToolbarItems.map((x, k) => /* @__PURE__ */ a(x.render, {}, k))
      ] })
    }
  );
}
const sc = {
  light: "",
  dark: "dark"
};
function lc() {
  const e = le(null), t = le(null), n = le(null), [r] = O(ie);
  K(() => {
    if (!n.current)
      return () => null;
    function i(c) {
      e.current.scrollLeft = n.current.scrollLeft, e.current.style.transform = `translate3d(-${n.current.scrollLeft}px, 0, 0)`, t.current && (t.current.style.transform = `translate3d(-${n.current.scrollLeft}px, 0, 0)`);
    }
    n.current.addEventListener("scroll", i);
  }, []), K(() => {
    if (!e.current)
      return () => null;
    function i(c) {
      c.preventDefault(), n.current.scrollLeft += c.deltaX;
    }
    e.current.addEventListener("mousewheel", i, {
      passive: !1
    });
  }, []), K(() => {
    if (!t.current)
      return () => null;
    function i(c) {
      c.preventDefault(), n.current.scrollLeft += c.deltaX;
    }
    t.current.addEventListener("mousewheel", i, {
      passive: !1
    });
  }, []);
  const [o, s] = O(Zn);
  return K(() => {
    s(nt());
  }, []), /* @__PURE__ */ E(
    "div",
    {
      className: U("rs-table", sc[r.theme.color]),
      id: o,
      children: [
        r.toolbar.enabled && /* @__PURE__ */ a(ic, {}),
        /* @__PURE__ */ E("div", { className: "h-[calc(100%-48px)] overflow-hidden", children: [
          /* @__PURE__ */ a(_l, { ref: e }),
          /* @__PURE__ */ a(Rl, { ref: n }),
          r.footer.enabled && /* @__PURE__ */ a(El, { ref: t })
        ] })
      ]
    }
  );
}
function cc({ data: e, columns: t, onChange: n, config: r, children: o }) {
  eo([
    [ko, t],
    [bo, e],
    [po, { onChange: n }],
    [ln, r]
  ]);
  const s = tt(ln);
  return K(() => {
    s(r);
  }, [r, s]), o;
}
function mc({
  data: e,
  columns: t,
  onChange: n = () => null,
  config: r = {}
}) {
  return /* @__PURE__ */ a(Yr, { children: /* @__PURE__ */ a(
    cc,
    {
      data: e,
      columns: t,
      onChange: n,
      config: r,
      children: /* @__PURE__ */ a(lc, {})
    }
  ) });
}
export {
  mc as default
};
