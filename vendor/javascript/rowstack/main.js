import "./main.css";
import { jsx as a, jsxs as N, Fragment as G } from "react/jsx-runtime";
import * as m from "react";
import et, { createContext as Tr, useRef as he, createElement as Pr, useCallback as Y, useContext as Ir, useReducer as Fr, useEffect as q, useDebugValue as jr, useState as B, useLayoutEffect as Tn, Children as _r, useMemo as W, forwardRef as Pn } from "react";
import * as In from "react-dom";
const ne = { BASE_URL: "/", DEV: !1, MODE: "production", PROD: !0, SSR: !1 };
let Vr = 0;
function D(e, t) {
  const n = `atom${++Vr}`, r = {
    toString() {
      return (ne ? "production" : void 0) !== "production" && this.debugLabel ? n + ":" + this.debugLabel : n;
    }
  };
  return typeof e == "function" ? r.read = e : (r.init = e, r.read = Br, r.write = Hr), t && (r.write = t), r;
}
function Br(e) {
  return e(this);
}
function Hr(e, t, n) {
  return t(
    this,
    typeof n == "function" ? n(e(this)) : n
  );
}
const tn = (e, t) => e.unstable_is ? e.unstable_is(t) : t === e, ft = (e) => "init" in e, mt = (e) => !!e.write, Ke = /* @__PURE__ */ new WeakMap(), Rt = (e) => {
  var t;
  return Ct(e) && !((t = Ke.get(e)) != null && t[1]);
}, $r = (e, t) => {
  const n = Ke.get(e);
  if (n)
    n[1] = !0, n[0].forEach((r) => r(t));
  else if ((ne ? "production" : void 0) !== "production")
    throw new Error("[Bug] cancelable promise not found");
}, Wr = (e) => {
  if (Ke.has(e))
    return;
  const t = [/* @__PURE__ */ new Set(), !1];
  Ke.set(e, t);
  const n = () => {
    t[1] = !0;
  };
  e.then(n, n), e.onCancel = (r) => {
    t[0].add(r);
  };
}, Ct = (e) => typeof (e == null ? void 0 : e.then) == "function", nn = (e) => "v" in e || "e" in e, $e = (e) => {
  if ("e" in e)
    throw e.e;
  if ((ne ? "production" : void 0) !== "production" && !("v" in e))
    throw new Error("[Bug] atom state is not initialized");
  return e.v;
}, Fn = (e, t, n) => {
  n.p.has(e) || (n.p.add(e), t.then(
    () => {
      n.p.delete(e);
    },
    () => {
      n.p.delete(e);
    }
  ));
}, rn = (e, t, n, r, o) => {
  var l;
  if ((ne ? "production" : void 0) !== "production" && r === t)
    throw new Error("[Bug] atom cannot depend on itself");
  n.d.set(r, o.n), Rt(n.v) && Fn(t, n.v, o), (l = o.m) == null || l.t.add(t), e && Ur(e, r, t);
}, Ne = () => [/* @__PURE__ */ new Map(), /* @__PURE__ */ new Map(), /* @__PURE__ */ new Set()], ht = (e, t, n) => {
  e[0].has(t) || e[0].set(t, /* @__PURE__ */ new Set()), e[1].set(t, n);
}, Ur = (e, t, n) => {
  const r = e[0].get(t);
  r && r.add(n);
}, Kr = (e, t) => e[0].get(t), on = (e, t) => {
  e[2].add(t);
}, be = (e) => {
  for (; e[1].size || e[2].size; ) {
    e[0].clear();
    const t = new Set(e[1].values());
    e[1].clear();
    const n = new Set(e[2]);
    e[2].clear(), t.forEach((r) => {
      var o;
      return (o = r.m) == null ? void 0 : o.l.forEach((l) => l());
    }), n.forEach((r) => r());
  }
}, jn = (...[e, t, n, r]) => {
  let o;
  (ne ? "production" : void 0) !== "production" && (o = /* @__PURE__ */ new Set());
  const l = (g, v, y) => {
    const R = "v" in v, C = v.v, O = Rt(v.v) ? v.v : null;
    if (Ct(y)) {
      Wr(y);
      for (const A of v.d.keys())
        Fn(g, y, e(A));
      v.v = y, delete v.e;
    } else
      v.v = y, delete v.e;
    (!R || !Object.is(C, v.v)) && (++v.n, O && $r(O, y));
  }, i = (g, v, y) => {
    var R;
    const C = e(v);
    if (nn(C) && (C.m && !(y != null && y.has(v)) || Array.from(C.d).every(
      ([L, _]) => (
        // Recursively, read the atom state of the dependency, and
        // check if the atom epoch number is unchanged
        i(g, L, y).n === _
      )
    )))
      return C;
    C.d.clear();
    let O = !0;
    const A = (L) => {
      if (tn(v, L)) {
        const V = e(L);
        if (!nn(V))
          if (ft(L))
            l(L, V, L.init);
          else
            throw new Error("no atom init");
        return $e(V);
      }
      const _ = i(g, L, y);
      if (O)
        rn(g, v, C, L, _);
      else {
        const V = Ne();
        rn(V, v, C, L, _), p(V, v, C), be(V);
      }
      return $e(_);
    };
    let P, E;
    const M = {
      get signal() {
        return P || (P = new AbortController()), P.signal;
      },
      get setSelf() {
        return (ne ? "production" : void 0) !== "production" && !mt(v) && console.warn("setSelf function cannot be used with read-only atom"), !E && mt(v) && (E = (...L) => {
          if ((ne ? "production" : void 0) !== "production" && O && console.warn("setSelf function cannot be called in sync"), !O)
            return f(v, ...L);
        }), E;
      }
    };
    try {
      const L = t(v, A, M);
      if (l(v, C, L), Ct(L)) {
        (R = L.onCancel) == null || R.call(L, () => P == null ? void 0 : P.abort());
        const _ = () => {
          if (C.m) {
            const V = Ne();
            p(V, v, C), be(V);
          }
        };
        L.then(_, _);
      }
      return C;
    } catch (L) {
      return delete C.v, C.e = L, ++C.n, C;
    } finally {
      O = !1;
    }
  }, c = (g) => $e(i(void 0, g)), u = (g, v, y) => {
    var R, C;
    const O = /* @__PURE__ */ new Map();
    for (const A of ((R = y.m) == null ? void 0 : R.t) || [])
      O.set(A, e(A));
    for (const A of y.p)
      O.set(
        A,
        e(A)
      );
    return (C = Kr(g, v)) == null || C.forEach((A) => {
      O.set(A, e(A));
    }), O;
  }, s = (g, v, y) => {
    const R = [], C = /* @__PURE__ */ new Set(), O = (P, E) => {
      if (!C.has(P)) {
        C.add(P);
        for (const [M, L] of u(g, P, E))
          P !== M && O(M, L);
        R.push([P, E, E.n]);
      }
    };
    O(v, y);
    const A = /* @__PURE__ */ new Set([v]);
    for (let P = R.length - 1; P >= 0; --P) {
      const [E, M, L] = R[P];
      let _ = !1;
      for (const V of M.d.keys())
        if (V !== E && A.has(V)) {
          _ = !0;
          break;
        }
      _ && (i(g, E, C), p(g, E, M), L !== M.n && (ht(g, E, M), A.add(E))), C.delete(E);
    }
  }, d = (g, v, ...y) => n(v, (A) => $e(i(g, A)), (A, ...P) => {
    const E = e(A);
    let M;
    if (tn(v, A)) {
      if (!ft(A))
        throw new Error("atom not writable");
      const L = "v" in E, _ = E.v, V = P[0];
      l(A, E, V), p(g, A, E), (!L || !Object.is(_, E.v)) && (ht(g, A, E), s(g, A, E));
    } else
      M = d(g, A, ...P);
    return be(g), M;
  }, ...y), f = (g, ...v) => {
    const y = Ne(), R = d(y, g, ...v);
    return be(y), R;
  }, p = (g, v, y) => {
    if (y.m && !Rt(y.v)) {
      for (const R of y.d.keys())
        y.m.d.has(R) || (h(g, R, e(R)).t.add(v), y.m.d.add(R));
      for (const R of y.m.d || [])
        if (!y.d.has(R)) {
          y.m.d.delete(R);
          const C = x(g, R, e(R));
          C == null || C.t.delete(v);
        }
    }
  }, h = (g, v, y) => {
    if (!y.m) {
      i(g, v);
      for (const R of y.d.keys())
        h(g, R, e(R)).t.add(v);
      if (y.m = {
        l: /* @__PURE__ */ new Set(),
        d: new Set(y.d.keys()),
        t: /* @__PURE__ */ new Set()
      }, (ne ? "production" : void 0) !== "production" && o.add(v), mt(v)) {
        const R = y.m;
        on(g, () => {
          const C = r(
            v,
            (...O) => d(g, v, ...O)
          );
          C && (R.u = C);
        });
      }
    }
    return y.m;
  }, x = (g, v, y) => {
    if (y.m && !y.m.l.size && !Array.from(y.m.t).some((R) => {
      var C;
      return (C = e(R).m) == null ? void 0 : C.d.has(v);
    })) {
      const R = y.m.u;
      R && on(g, R), delete y.m, (ne ? "production" : void 0) !== "production" && o.delete(v);
      for (const C of y.d.keys()) {
        const O = x(g, C, e(C));
        O == null || O.t.delete(v);
      }
      return;
    }
    return y.m;
  }, b = {
    get: c,
    set: f,
    sub: (g, v) => {
      const y = Ne(), R = e(g), C = h(y, g, R);
      be(y);
      const O = C.l;
      return O.add(v), () => {
        O.delete(v);
        const A = Ne();
        x(A, g, R), be(A);
      };
    },
    unstable_derive: (g) => jn(...g(e, t, n, r))
  };
  return (ne ? "production" : void 0) !== "production" && Object.assign(b, {
    // store dev methods (these are tentative and subject to change without notice)
    dev4_get_internal_weak_map: () => ({
      get: (v) => {
        const y = e(v);
        if (y.n !== 0)
          return y;
      }
    }),
    dev4_get_mounted_atoms: () => o,
    dev4_restore_atoms: (v) => {
      const y = Ne();
      for (const [R, C] of v)
        if (ft(R)) {
          const O = e(R), A = "v" in O, P = O.v;
          l(R, O, C), p(y, R, O), (!A || !Object.is(P, O.v)) && (ht(y, R, O), s(y, R, O));
        }
      be(y);
    }
  }), b;
}, _n = () => {
  const e = /* @__PURE__ */ new WeakMap();
  return jn(
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
const Zr = () => (Te || (Te = _n(), (ne ? "production" : void 0) !== "production" && (globalThis.__JOTAI_DEFAULT_STORE__ || (globalThis.__JOTAI_DEFAULT_STORE__ = Te), globalThis.__JOTAI_DEFAULT_STORE__ !== Te && console.warn(
  "Detected multiple Jotai instances. It may cause unexpected behavior with the default store. https://github.com/pmndrs/jotai/discussions/2044"
))), Te), Vn = { BASE_URL: "/", DEV: !1, MODE: "production", PROD: !0, SSR: !1 }, Bn = Tr(
  void 0
), Ft = (e) => Ir(Bn) || Zr(), qr = ({
  children: e,
  store: t
}) => {
  const n = he();
  return !t && !n.current && (n.current = _n()), Pr(
    Bn.Provider,
    {
      value: t || n.current
    },
    e
  );
}, Hn = (e) => typeof (e == null ? void 0 : e.then) == "function", zr = (e) => {
  e.status = "pending", e.then(
    (t) => {
      e.status = "fulfilled", e.value = t;
    },
    (t) => {
      e.status = "rejected", e.reason = t;
    }
  );
}, Yr = et.use || ((e) => {
  if (e.status === "pending")
    throw e;
  if (e.status === "fulfilled")
    return e.value;
  throw e.status === "rejected" ? e.reason : (zr(e), e);
}), pt = /* @__PURE__ */ new WeakMap(), Gr = (e) => {
  let t = pt.get(e);
  return t || (t = new Promise((n, r) => {
    let o = e;
    const l = (u) => (s) => {
      o === u && n(s);
    }, i = (u) => (s) => {
      o === u && r(s);
    }, c = (u) => {
      "onCancel" in u && typeof u.onCancel == "function" && u.onCancel((s) => {
        if ((Vn ? "production" : void 0) !== "production" && s === u)
          throw new Error("[Bug] p is not updated even after cancelation");
        Hn(s) ? (pt.set(s, t), o = s, s.then(l(s), i(s)), c(s)) : n(s);
      });
    };
    e.then(l(e), i(e)), c(e);
  }), pt.set(e, t)), t;
};
function Xr(e, t) {
  const n = Ft(), [[r, o, l], i] = Fr(
    (s) => {
      const d = n.get(e);
      return Object.is(s[0], d) && s[1] === n && s[2] === e ? s : [d, n, e];
    },
    void 0,
    () => [n.get(e), n, e]
  );
  let c = r;
  if ((o !== n || l !== e) && (i(), c = n.get(e)), q(() => {
    const s = n.sub(e, () => {
      i();
    });
    return i(), s;
  }, [n, e, void 0]), jr(c), Hn(c)) {
    const s = Gr(c);
    return Yr(s);
  }
  return c;
}
function jt(e, t) {
  const n = Ft();
  return Y(
    (...o) => {
      if ((Vn ? "production" : void 0) !== "production" && !("write" in e))
        throw new Error("not writable atom");
      return n.set(e, ...o);
    },
    [n, e]
  );
}
function S(e, t) {
  return [
    Xr(e),
    // We do wrong type assertion here, which results in throwing an error.
    jt(e)
  ];
}
const ln = /* @__PURE__ */ new WeakMap();
function Jr(e, t) {
  const n = Ft(), r = Qr(n);
  for (const [o, l] of e)
    r.has(o) || (r.add(o), n.set(o, l));
}
const Qr = (e) => {
  let t = ln.get(e);
  return t || (t = /* @__PURE__ */ new WeakSet(), ln.set(e, t)), t;
}, eo = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
let to = (e) => crypto.getRandomValues(new Uint8Array(e)), no = (e, t, n) => {
  let r = (2 << Math.log2(e.length - 1)) - 1, o = -~(1.6 * r * t / e.length);
  return (l = t) => {
    let i = "";
    for (; ; ) {
      let c = n(o), u = o;
      for (; u--; )
        if (i += e[c[u] & r] || "", i.length === l) return i;
    }
  };
}, ro = (e, t = 21) => no(e, t, to), tt = (e = 21) => {
  let t = "", n = crypto.getRandomValues(new Uint8Array(e));
  for (; e--; )
    t += eo[n[e] & 63];
  return t;
};
const oo = ro(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  4
);
function Et() {
  return oo();
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
function Nt() {
  return `hsl(${Math.floor(Math.random() * 360)}, 100%, 92%)`;
}
function io(e, t, n) {
  if (n.length === 0)
    return 1;
  for (const r of n) {
    if (Re(e[r.columnId]))
      return 1;
    if (Re(t[r.columnId]))
      return -1;
    const o = e[r.columnId].toString().toLowerCase(), l = t[r.columnId].toString().toLowerCase();
    if (o < l)
      return r.order === "asc" ? -1 : 1;
    if (o > l)
      return r.order === "asc" ? 1 : -1;
  }
  return 0;
}
function lo(e, t) {
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
const $n = "update_column", so = "delete_column", co = "add_row", ao = "delete_rows", uo = "update_row", Wn = "update_rows", fo = "add_column", _t = (e, t) => e + t, Un = (e, t) => {
  if (e === void 0)
    return t;
  for (const n of Object.keys(t))
    t[n] instanceof Object && Object.assign(t[n], Un(e[n], t[n]));
  return Object.assign(e || {}, t), e;
}, kt = {
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
}, nt = D(kt), ie = D((e) => e(nt)), mo = D(null, (e, t, n) => {
  kt.rowSelectionButtons = [], t(nt, Un(kt, n));
}), Kn = D(""), oe = D({ onChange: () => null }), ho = D(
  null,
  (e, t, n) => t(oe, n)
);
D(null, (e, t, n) => {
  t(oe, { onChange: n });
});
const H = D({}), po = (e) => D((t) => new Set(Object.entries(t(H)).map(([n, r]) => r[e])).size), Zn = (e) => D(
  (t) => t(H)[e],
  (t, n, r) => {
    typeof r == "function" && (r = r(t(Zn(e)))), n(H, (o) => ({ ...o, [e]: { ...o[e], ...r } })), t(oe).onChange({ type: uo, rowId: e, update: r });
  }
), we = (e) => D(
  (t) => t(J)[e],
  (t, n, r) => {
    typeof r == "function" && (r = r(t(J)[e])), n(J, (o) => ({
      ...o,
      [e]: { ...o[e], ...r }
    })), t(oe).onChange({
      type: $n,
      colId: e,
      update: r
    });
  }
), vo = D(null, (e, t, n) => {
  const r = Object.entries(e(H)).filter(([, o]) => o.isSelected === !0).map(([o, l]) => o);
  t(
    H,
    Object.fromEntries(
      Object.entries(e(H)).filter(([, o]) => o.isSelected !== !0)
    )
  ), t(ve, !1), e(oe).onChange({
    type: ao,
    rows: [r]
  });
}), go = D(
  null,
  (e, t, n = { handler: () => null }) => {
    t(
      H,
      Object.fromEntries(
        n.handler(Object.entries(e(H)).map(([r, o]) => o)).map((r) => [r.id, r])
      )
    ), e(oe).onChange({
      type: Wn,
      rows: n.handler(Object.entries(e(H)).map(([r, o]) => o)).map((r) => ({ rowId: r.id, update: r }))
    }), t(
      H,
      Object.fromEntries(
        Object.entries(e(H)).map(([r, o]) => [
          r,
          { ...o, isSelected: !1 }
        ])
      )
    ), t(ve, !1);
  }
), wo = D(null, (e, t, n) => {
  t(H, Object.fromEntries(n.map((r) => [r.id, r])));
}), qn = D(null, (e, t, n) => {
  t(H, (r) => ({
    ...r,
    [n.id]: n
  })), t(ot(n.id, e(fe)[0]), "editing"), e(oe).onChange({ type: co, rowId: n.id, update: n });
}), bo = D((e) => Object.keys(e(H)).length), xo = D(
  (e) => e(ve) ? Object.keys(e(H)).length : Object.entries(e(H)).map(([, t]) => t.isSelected === !0).reduce(_t, 0)
), Vt = D({}), Ie = D((e) => Object.entries(e(H)).filter(([, t]) => lo(t, e($t))).sort(
  ([, t], [, n]) => io(t, n, [...e(je), ...e(Bt)])
).map(([t, n]) => ({
  id: t,
  groupVal: e(je).length === 0 ? "" : n[e(je)[0].columnId]
})).map((t, n, r) => ({
  id: t.id,
  first: n === 0 || t.groupVal !== r[n - 1].groupVal,
  last: n === r.length - 1 || t.groupVal !== r[n + 1].groupVal,
  groupVal: t.groupVal
}))), sn = D({}), rt = (e) => D(
  (t) => t(sn)[e],
  (t, n, r) => n(sn, (o) => ({ ...o, [e]: r }))
), J = D({}), fe = D(
  (e) => Object.entries(e(J)).filter(([t, n]) => n.isVisible === !0).map(([t]) => t)
), zn = D(
  (e) => Object.entries(e(J)).map(([t, n]) => n)
), yo = D(
  (e) => Object.entries(e(J)).map(([t, n]) => n).filter((t) => t.type !== "custom")
), Ro = D((e) => Object.keys(e(J))), Co = D(
  (e) => Object.entries(e(J)).map(([, t]) => t.isVisible).reduce((t, n) => t + (n === !1), 0)
), Eo = {
  isVisible: !0,
  width: 192,
  type: "text",
  options: [],
  showOptionSearch: !0,
  isEditable: !0,
  isViewOnly: !1
}, No = D(null, (e, t, n) => {
  t(
    J,
    Object.fromEntries(
      n.map((r) => ({ ...Eo, ...r })).map((r) => [r.id, r])
    )
  );
}), ko = D(null, (e, t, n) => {
  t(J, (r) => ({ ...r, [n.id]: n })), t(rt(n.id), !0), e(oe).onChange({
    type: fo,
    colId: n.id,
    update: n
  });
}), So = D(null, (e, t, n) => {
  t(
    J,
    (r) => Object.fromEntries(Object.entries(r).filter(([o]) => o !== n.id))
  ), e(oe).onChange({ type: so, colId: n.id });
}), Oo = D((e) => Object.entries(e(J)).filter(([t, n]) => n.isVisible === !0).map(([t, n]) => n.width).reduce(_t, e(nt).selectRow.enabled ? 64 : 0)), je = D([]), Le = D((e) => e(je)), Ao = D(null, (e, t, n) => {
  t(je, n.grouping), t(Vt, {});
}), Yn = D(!1), Gn = D(!1), Bt = D([]), Ht = D((e) => e(Bt)), Xn = D(null, (e, t, n) => {
  t(Bt, n.sorting);
}), $t = D([]), Jn = D((e) => e($t)), Qn = D(null, (e, t, n) => {
  t($t, n.filtering);
}), er = D(32), Wt = D((e) => e(er)), Lo = D(null, (e, t, n) => {
  t(er, n.rowHeight);
}), ve = D(!1), Do = D((e) => e(ve)), Mo = D(null, (e, t, n) => {
  const r = e(ve);
  t(ve, !r), t(
    H,
    Object.fromEntries(
      Object.entries(e(H)).map(([o, l]) => [
        o,
        { ...l, isSelected: !r }
      ])
    )
  );
}), To = D(null, (e, t, n) => {
  t(ve, !1), t(
    H,
    Object.fromEntries(
      Object.entries(e(H)).map(([r, o]) => [
        r,
        { ...o, isSelected: !1 }
      ])
    )
  );
});
D(null, (e, t, n) => {
  t(ve, n.value), t(
    H,
    Object.fromEntries(
      Object.entries(e(H)).map(([r, o]) => [
        r,
        { ...o, isSelected: n.value }
      ])
    )
  );
});
const tr = D(!1);
D((e) => e(tr));
D(null, (e, t, n) => {
  t(tr, n.dragging);
});
const cn = D({}), ot = (e, t) => D(
  (n) => {
    var r;
    return ((r = n(cn)[e]) == null ? void 0 : r[t]) || "none";
  },
  (n, r, o) => {
    r(cn, { [e]: { [t]: o } });
  }
), Ut = D(null, (e, t, n) => {
  t(ot(n.rowId, n.colId), n.value);
}), Po = D(null, (e, t, n) => {
  const { colId: r, type: o } = n;
  let { options: l, configuration: i } = e(J)[r];
  const c = e(nt);
  let u = (s) => s;
  switch (o) {
    case "select": {
      l = [
        ...new Set(Object.entries(e(H)).map(([d, f]) => f[r]))
      ].filter((d) => !_e(d) && d !== "").map((d) => ({
        value: d,
        name: d,
        color: Nt()
      }));
      break;
    }
    case "multiSelect": {
      l = [
        ...new Set(
          Object.entries(e(H)).flatMap(
            ([d, f]) => Re(f[r]) ? [] : f[r].split(",")
          )
        )
      ].filter((d) => !_e(d) && d !== "").map((d) => ({
        value: d,
        name: d,
        color: Nt()
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
        var d, f, p;
        return ((p = (f = (d = s == null ? void 0 : s.toLowerCase) == null ? void 0 : d.call(s)) == null ? void 0 : f.trim) == null ? void 0 : p.call(f)) === "true";
      };
  }
  t(we(r), (s) => ({ ...s[r], type: o, options: l })), t(
    H,
    Object.fromEntries(
      Object.entries(e(H)).map(([s, d]) => [
        s,
        { ...d, [r]: u(d[r]) }
      ])
    )
  ), e(oe).onChange({
    type: $n,
    colId: r,
    update: { type: o, options: l }
  }), e(oe).onChange({
    type: Wn,
    rows: Object.entries(e(H)).map(([s, d]) => ({
      rowId: s,
      update: { [r]: u(d[r]) }
    }))
  });
}), Io = (e, t) => D(null, (n, r, o) => {
  const l = n(fe).findIndex((s) => s === t), i = n(Ie).findIndex(
    (s) => s.id === e
  );
  let c = e, u = t;
  switch (o) {
    case "left": {
      u = n(fe)[Math.max(0, l - 1)];
      break;
    }
    case "right": {
      u = n(fe)[Math.min(n(fe).length - 1, l + 1)];
      break;
    }
    case "up": {
      c = n(Ie).map((s) => s.id)[Math.max(0, i - 1)];
      break;
    }
    case "down": {
      c = n(Ie).map((s) => s.id)[Math.min(
        n(Ie).flatMap((s) => s.rowIds).length - 1,
        i + 1
      )];
      break;
    }
  }
  t === u && e === c || r(ot(c, u), "focused");
}), an = (e, t) => D(
  (n) => Object.entries(n(H)).map(([r, o]) => o[e]).map(t).reduce(_t, 0)
), mc = "100000000000000000000001";
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
const un = /* @__PURE__ */ m.forwardRef($o);
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
const nr = /* @__PURE__ */ m.forwardRef(Yo);
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
const rr = /* @__PURE__ */ m.forwardRef(ti);
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
function li({
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
const si = /* @__PURE__ */ m.forwardRef(li);
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
function me({ name: e, color: t, onCancel: n }) {
  return /* @__PURE__ */ N(
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
function di(e, t) {
  const n = he(t);
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
function F({ children: e, background: t }) {
  return /* @__PURE__ */ a("div", { className: "shadow-md border rounded rounded-2 text-sm bg-header", children: e });
}
function Zt({ children: e }) {
  return /* @__PURE__ */ a("div", { className: "border-b last:border-none", children: /* @__PURE__ */ a("div", { className: "py-3", children: e }) });
}
F.Section = Zt;
function fi({ children: e, ...t }) {
  return /* @__PURE__ */ a("div", { className: "px-3 py-1 flex items-center cursor-default", ...t, children: e });
}
function mi({ children: e, disabled: t, ...n }) {
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
Zt.Item = fi;
Zt.Button = mi;
const hi = (e, t) => new Date(e, t + 1, 0).getDate(), pi = [
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
function gi({
  value: e,
  onSelect: t
}) {
  const [n, r] = B(e || null), o = /* @__PURE__ */ new Date(), [l, i] = B(
    n ? n.getUTCMonth() : o.getUTCMonth()
  ), [c, u] = B(
    n ? n.getUTCFullYear() : o.getUTCFullYear()
  );
  q(() => {
    if (!e) {
      r(null);
      return;
    }
    r(e), i(e.getUTCMonth()), u(e.getUTCFullYear());
  }, [e]);
  const s = [...Array(hi(c, l)).keys()], d = new Date(c, l, 1).getDay(), f = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  function p() {
    l === 0 ? (u((w) => w - 1), i(11)) : i((w) => w - 1);
  }
  function h() {
    l === 11 ? (u((w) => w + 1), i(0)) : i((w) => w + 1);
  }
  function x(w, b) {
    w.preventDefault();
    const g = /* @__PURE__ */ new Date();
    g.setUTCFullYear(c, l, b), r(g), t == null || t(g);
  }
  function k(w) {
    return n && n.getDate() === w && n.getMonth() === l && n.getFullYear() === c;
  }
  return /* @__PURE__ */ a("div", { className: "w-56", children: /* @__PURE__ */ N(F, { children: [
    /* @__PURE__ */ a(F.Section, { children: /* @__PURE__ */ N("div", { className: "flex px-2 items-center", children: [
      /* @__PURE__ */ N("div", { className: "grow text-left px-1", children: [
        pi[l],
        " ",
        c
      ] }),
      /* @__PURE__ */ a(
        "div",
        {
          className: "rs-btn hover:bg-hover-light rounded p-1",
          onClick: p,
          "aria-label": "move-calendar-left",
          children: /* @__PURE__ */ a(ri, { className: "w-4 h-4" })
        }
      ),
      /* @__PURE__ */ a(
        "div",
        {
          className: "rs-btn hover:bg-hover-light rounded p-1",
          onClick: h,
          "aria-label": "move-calendar-right",
          children: /* @__PURE__ */ a(ii, { className: "w-4 h-4" })
        }
      )
    ] }) }),
    /* @__PURE__ */ N(F.Section, { children: [
      /* @__PURE__ */ a("div", { className: "grid grid-cols-7 text-sm px-2 gap-px mb-2", children: f.map((w) => /* @__PURE__ */ a("div", { className: "text-secondary font-medium flex items-center justify-center", children: w }, `wday-${w}`)) }),
      /* @__PURE__ */ a("div", { className: "grid grid-cols-7 text-sm px-2 gap-px", children: s.map((w) => /* @__PURE__ */ a(
        "div",
        {
          className: U(
            "rs-btn p-0.5 rounded flex items-center justify-center col-span-1",
            vi[d],
            !k(w + 1) && "hover:bg-hover-light",
            k(w + 1) && "bg-blue-500 text-inverted hover:bg-blue-500"
          ),
          onClick: (b) => {
            x(b, w + 1);
          },
          children: w + 1
        },
        `day-${w}`
      )) })
    ] })
  ] }) });
}
function it() {
  return typeof window < "u";
}
function De(e) {
  return or(e) ? (e.nodeName || "").toLowerCase() : "#document";
}
function Q(e) {
  var t;
  return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function ce(e) {
  var t;
  return (t = (or(e) ? e.ownerDocument : e.document) || window.document) == null ? void 0 : t.documentElement;
}
function or(e) {
  return it() ? e instanceof Node || e instanceof Q(e).Node : !1;
}
function Z(e) {
  return it() ? e instanceof Element || e instanceof Q(e).Element : !1;
}
function ee(e) {
  return it() ? e instanceof HTMLElement || e instanceof Q(e).HTMLElement : !1;
}
function St(e) {
  return !it() || typeof ShadowRoot > "u" ? !1 : e instanceof ShadowRoot || e instanceof Q(e).ShadowRoot;
}
function Be(e) {
  const {
    overflow: t,
    overflowX: n,
    overflowY: r,
    display: o
  } = re(e);
  return /auto|scroll|overlay|hidden|clip/.test(t + r + n) && !["inline", "contents"].includes(o);
}
function wi(e) {
  return ["table", "td", "th"].includes(De(e));
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
function qt(e) {
  const t = st(), n = Z(e) ? re(e) : e;
  return n.transform !== "none" || n.perspective !== "none" || (n.containerType ? n.containerType !== "normal" : !1) || !t && (n.backdropFilter ? n.backdropFilter !== "none" : !1) || !t && (n.filter ? n.filter !== "none" : !1) || ["transform", "perspective", "filter"].some((r) => (n.willChange || "").includes(r)) || ["paint", "layout", "strict", "content"].some((r) => (n.contain || "").includes(r));
}
function bi(e) {
  let t = ae(e);
  for (; ee(t) && !ge(t); ) {
    if (qt(t))
      return t;
    if (lt(t))
      return null;
    t = ae(t);
  }
  return null;
}
function st() {
  return typeof CSS > "u" || !CSS.supports ? !1 : CSS.supports("-webkit-backdrop-filter", "none");
}
function ge(e) {
  return ["html", "body", "#document"].includes(De(e));
}
function re(e) {
  return Q(e).getComputedStyle(e);
}
function ct(e) {
  return Z(e) ? {
    scrollLeft: e.scrollLeft,
    scrollTop: e.scrollTop
  } : {
    scrollLeft: e.scrollX,
    scrollTop: e.scrollY
  };
}
function ae(e) {
  if (De(e) === "html")
    return e;
  const t = (
    // Step into the shadow DOM of the parent of a slotted node.
    e.assignedSlot || // DOM Element detected.
    e.parentNode || // ShadowRoot detected.
    St(e) && e.host || // Fallback.
    ce(e)
  );
  return St(t) ? t.host : t;
}
function ir(e) {
  const t = ae(e);
  return ge(t) ? e.ownerDocument ? e.ownerDocument.body : e.body : ee(t) && Be(t) ? t : ir(t);
}
function pe(e, t, n) {
  var r;
  t === void 0 && (t = []), n === void 0 && (n = !0);
  const o = ir(e), l = o === ((r = e.ownerDocument) == null ? void 0 : r.body), i = Q(o);
  if (l) {
    const c = Ot(i);
    return t.concat(i, i.visualViewport || [], Be(o) ? o : [], c && n ? pe(c) : []);
  }
  return t.concat(o, pe(o, [], n));
}
function Ot(e) {
  return e.parent && Object.getPrototypeOf(e.parent) ? e.frameElement : null;
}
function xi(e) {
  let t = e.activeElement;
  for (; ((n = t) == null || (n = n.shadowRoot) == null ? void 0 : n.activeElement) != null; ) {
    var n;
    t = t.shadowRoot.activeElement;
  }
  return t;
}
function At(e, t) {
  if (!e || !t)
    return !1;
  const n = t.getRootNode == null ? void 0 : t.getRootNode();
  if (e.contains(t))
    return !0;
  if (n && St(n)) {
    let r = t;
    for (; r; ) {
      if (e === r)
        return !0;
      r = r.parentNode || r.host;
    }
  }
  return !1;
}
function yi() {
  return /apple/i.test(navigator.vendor);
}
function dn(e, t) {
  return ["mouse", "pen"].includes(e);
}
function Ri(e) {
  return "nativeEvent" in e;
}
function Ci(e) {
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
const Ei = "input:not([type='hidden']):not([disabled]),[contenteditable]:not([contenteditable='false']),textarea:not([disabled])";
function Ni(e) {
  return ee(e) && e.matches(Ei);
}
const Ze = Math.min, xe = Math.max, qe = Math.round, We = Math.floor, se = (e) => ({
  x: e,
  y: e
}), ki = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom"
}, Si = {
  start: "end",
  end: "start"
};
function fn(e, t, n) {
  return xe(e, Ze(t, n));
}
function at(e, t) {
  return typeof e == "function" ? e(t) : e;
}
function Ce(e) {
  return e.split("-")[0];
}
function ut(e) {
  return e.split("-")[1];
}
function lr(e) {
  return e === "x" ? "y" : "x";
}
function sr(e) {
  return e === "y" ? "height" : "width";
}
function Oe(e) {
  return ["top", "bottom"].includes(Ce(e)) ? "y" : "x";
}
function cr(e) {
  return lr(Oe(e));
}
function Oi(e, t, n) {
  n === void 0 && (n = !1);
  const r = ut(e), o = cr(e), l = sr(o);
  let i = o === "x" ? r === (n ? "end" : "start") ? "right" : "left" : r === "start" ? "bottom" : "top";
  return t.reference[l] > t.floating[l] && (i = ze(i)), [i, ze(i)];
}
function Ai(e) {
  const t = ze(e);
  return [Dt(e), t, Dt(t)];
}
function Dt(e) {
  return e.replace(/start|end/g, (t) => Si[t]);
}
function Li(e, t, n) {
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
function Di(e, t, n, r) {
  const o = ut(e);
  let l = Li(Ce(e), n === "start", r);
  return o && (l = l.map((i) => i + "-" + o), t && (l = l.concat(l.map(Dt)))), l;
}
function ze(e) {
  return e.replace(/left|right|bottom|top/g, (t) => ki[t]);
}
function Mi(e) {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...e
  };
}
function Ti(e) {
  return typeof e != "number" ? Mi(e) : {
    top: e,
    right: e,
    bottom: e,
    left: e
  };
}
function Ye(e) {
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
var Pi = ["input:not([inert])", "select:not([inert])", "textarea:not([inert])", "a[href]:not([inert])", "button:not([inert])", "[tabindex]:not(slot):not([inert])", "audio[controls]:not([inert])", "video[controls]:not([inert])", '[contenteditable]:not([contenteditable="false"]):not([inert])', "details>summary:first-of-type:not([inert])", "details:not([inert])"], Mt = /* @__PURE__ */ Pi.join(","), ar = typeof Element > "u", Ve = ar ? function() {
} : Element.prototype.matches || Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector, Ge = !ar && Element.prototype.getRootNode ? function(e) {
  var t;
  return e == null || (t = e.getRootNode) === null || t === void 0 ? void 0 : t.call(e);
} : function(e) {
  return e == null ? void 0 : e.ownerDocument;
}, Xe = function e(t, n) {
  var r;
  n === void 0 && (n = !0);
  var o = t == null || (r = t.getAttribute) === null || r === void 0 ? void 0 : r.call(t, "inert"), l = o === "" || o === "true", i = l || n && t && e(t.parentNode);
  return i;
}, Ii = function(t) {
  var n, r = t == null || (n = t.getAttribute) === null || n === void 0 ? void 0 : n.call(t, "contenteditable");
  return r === "" || r === "true";
}, Fi = function(t, n, r) {
  if (Xe(t))
    return [];
  var o = Array.prototype.slice.apply(t.querySelectorAll(Mt));
  return n && Ve.call(t, Mt) && o.unshift(t), o = o.filter(r), o;
}, ji = function e(t, n, r) {
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
        var d = Ve.call(i, Mt);
        d && r.filter(i) && (n || !t.includes(i)) && o.push(i);
        var f = i.shadowRoot || // check for an undisclosed shadow
        typeof r.getShadowRoot == "function" && r.getShadowRoot(i), p = !Xe(f, !1) && (!r.shadowRootFilter || r.shadowRootFilter(i));
        if (f && p) {
          var h = e(f === !0 ? i.children : f.children, !0, r);
          r.flatten ? o.push.apply(o, h) : o.push({
            scopeParent: i,
            candidates: h
          });
        } else
          l.unshift.apply(l, i.children);
      }
  }
  return o;
}, ur = function(t) {
  return !isNaN(parseInt(t.getAttribute("tabindex"), 10));
}, dr = function(t) {
  if (!t)
    throw new Error("No node provided");
  return t.tabIndex < 0 && (/^(AUDIO|VIDEO|DETAILS)$/.test(t.tagName) || Ii(t)) && !ur(t) ? 0 : t.tabIndex;
}, _i = function(t, n) {
  var r = dr(t);
  return r < 0 && n && !ur(t) ? 0 : r;
}, Vi = function(t, n) {
  return t.tabIndex === n.tabIndex ? t.documentOrder - n.documentOrder : t.tabIndex - n.tabIndex;
}, fr = function(t) {
  return t.tagName === "INPUT";
}, Bi = function(t) {
  return fr(t) && t.type === "hidden";
}, Hi = function(t) {
  var n = t.tagName === "DETAILS" && Array.prototype.slice.apply(t.children).some(function(r) {
    return r.tagName === "SUMMARY";
  });
  return n;
}, $i = function(t, n) {
  for (var r = 0; r < t.length; r++)
    if (t[r].checked && t[r].form === n)
      return t[r];
}, Wi = function(t) {
  if (!t.name)
    return !0;
  var n = t.form || Ge(t), r = function(c) {
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
  var l = $i(o, t.form);
  return !l || l === t;
}, Ui = function(t) {
  return fr(t) && t.type === "radio";
}, Ki = function(t) {
  return Ui(t) && !Wi(t);
}, Zi = function(t) {
  var n, r = t && Ge(t), o = (n = r) === null || n === void 0 ? void 0 : n.host, l = !1;
  if (r && r !== t) {
    var i, c, u;
    for (l = !!((i = o) !== null && i !== void 0 && (c = i.ownerDocument) !== null && c !== void 0 && c.contains(o) || t != null && (u = t.ownerDocument) !== null && u !== void 0 && u.contains(t)); !l && o; ) {
      var s, d, f;
      r = Ge(o), o = (s = r) === null || s === void 0 ? void 0 : s.host, l = !!((d = o) !== null && d !== void 0 && (f = d.ownerDocument) !== null && f !== void 0 && f.contains(o));
    }
  }
  return l;
}, mn = function(t) {
  var n = t.getBoundingClientRect(), r = n.width, o = n.height;
  return r === 0 && o === 0;
}, qi = function(t, n) {
  var r = n.displayCheck, o = n.getShadowRoot;
  if (getComputedStyle(t).visibility === "hidden")
    return !0;
  var l = Ve.call(t, "details>summary:first-of-type"), i = l ? t.parentElement : t;
  if (Ve.call(i, "details:not([open]) *"))
    return !0;
  if (!r || r === "full" || r === "legacy-full") {
    if (typeof o == "function") {
      for (var c = t; t; ) {
        var u = t.parentElement, s = Ge(t);
        if (u && !u.shadowRoot && o(u) === !0)
          return mn(t);
        t.assignedSlot ? t = t.assignedSlot : !u && s !== t.ownerDocument ? t = s.host : t = u;
      }
      t = c;
    }
    if (Zi(t))
      return !t.getClientRects().length;
    if (r !== "legacy-full")
      return !0;
  } else if (r === "non-zero-area")
    return mn(t);
  return !1;
}, zi = function(t) {
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
}, Yi = function(t, n) {
  return !(n.disabled || // we must do an inert look up to filter out any elements inside an inert ancestor
  //  because we're limited in the type of selectors we can use in JSDom (see related
  //  note related to `candidateSelectors`)
  Xe(n) || Bi(n) || qi(n, t) || // For a details element with a summary, the summary element gets the focus
  Hi(n) || zi(n));
}, hn = function(t, n) {
  return !(Ki(n) || dr(n) < 0 || !Yi(t, n));
}, Gi = function(t) {
  var n = parseInt(t.getAttribute("tabindex"), 10);
  return !!(isNaN(n) || n >= 0);
}, Xi = function e(t) {
  var n = [], r = [];
  return t.forEach(function(o, l) {
    var i = !!o.scopeParent, c = i ? o.scopeParent : o, u = _i(c, i), s = i ? e(o.candidates) : c;
    u === 0 ? i ? n.push.apply(n, s) : n.push(c) : r.push({
      documentOrder: l,
      tabIndex: u,
      item: o,
      isScope: i,
      content: s
    });
  }), r.sort(Vi).reduce(function(o, l) {
    return l.isScope ? o.push.apply(o, l.content) : o.push(l.content), o;
  }, []).concat(n);
}, mr = function(t, n) {
  n = n || {};
  var r;
  return n.getShadowRoot ? r = ji([t], n.includeContainer, {
    filter: hn.bind(null, n),
    flatten: !1,
    getShadowRoot: n.getShadowRoot,
    shadowRootFilter: Gi
  }) : r = Fi(t, n.includeContainer, hn.bind(null, n)), Xi(r);
};
function pn(e, t, n) {
  let {
    reference: r,
    floating: o
  } = e;
  const l = Oe(t), i = cr(t), c = sr(i), u = Ce(t), s = l === "y", d = r.x + r.width / 2 - o.width / 2, f = r.y + r.height / 2 - o.height / 2, p = r[c] / 2 - o[c] / 2;
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
  switch (ut(t)) {
    case "start":
      h[i] -= p * (n && s ? -1 : 1);
      break;
    case "end":
      h[i] += p * (n && s ? -1 : 1);
      break;
  }
  return h;
}
const Ji = async (e, t, n) => {
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
    x: d,
    y: f
  } = pn(s, r, u), p = r, h = {}, x = 0;
  for (let k = 0; k < c.length; k++) {
    const {
      name: w,
      fn: b
    } = c[k], {
      x: g,
      y: v,
      data: y,
      reset: R
    } = await b({
      x: d,
      y: f,
      initialPlacement: r,
      placement: p,
      strategy: o,
      middlewareData: h,
      rects: s,
      platform: i,
      elements: {
        reference: e,
        floating: t
      }
    });
    d = g ?? d, f = v ?? f, h = {
      ...h,
      [w]: {
        ...h[w],
        ...y
      }
    }, R && x <= 50 && (x++, typeof R == "object" && (R.placement && (p = R.placement), R.rects && (s = R.rects === !0 ? await i.getElementRects({
      reference: e,
      floating: t,
      strategy: o
    }) : R.rects), {
      x: d,
      y: f
    } = pn(s, p, u)), k = -1);
  }
  return {
    x: d,
    y: f,
    placement: p,
    strategy: o,
    middlewareData: h
  };
};
async function hr(e, t) {
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
    rootBoundary: d = "viewport",
    elementContext: f = "floating",
    altBoundary: p = !1,
    padding: h = 0
  } = at(t, e), x = Ti(h), w = c[p ? f === "floating" ? "reference" : "floating" : f], b = Ye(await l.getClippingRect({
    element: (n = await (l.isElement == null ? void 0 : l.isElement(w))) == null || n ? w : w.contextElement || await (l.getDocumentElement == null ? void 0 : l.getDocumentElement(c.floating)),
    boundary: s,
    rootBoundary: d,
    strategy: u
  })), g = f === "floating" ? {
    x: r,
    y: o,
    width: i.floating.width,
    height: i.floating.height
  } : i.reference, v = await (l.getOffsetParent == null ? void 0 : l.getOffsetParent(c.floating)), y = await (l.isElement == null ? void 0 : l.isElement(v)) ? await (l.getScale == null ? void 0 : l.getScale(v)) || {
    x: 1,
    y: 1
  } : {
    x: 1,
    y: 1
  }, R = Ye(l.convertOffsetParentRelativeRectToViewportRelativeRect ? await l.convertOffsetParentRelativeRectToViewportRelativeRect({
    elements: c,
    rect: g,
    offsetParent: v,
    strategy: u
  }) : g);
  return {
    top: (b.top - R.top + x.top) / y.y,
    bottom: (R.bottom - b.bottom + x.bottom) / y.y,
    left: (b.left - R.left + x.left) / y.x,
    right: (R.right - b.right + x.right) / y.x
  };
}
const Qi = function(e) {
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
        mainAxis: d = !0,
        crossAxis: f = !0,
        fallbackPlacements: p,
        fallbackStrategy: h = "bestFit",
        fallbackAxisSideDirection: x = "none",
        flipAlignment: k = !0,
        ...w
      } = at(e, t);
      if ((n = l.arrow) != null && n.alignmentOffset)
        return {};
      const b = Ce(o), g = Oe(c), v = Ce(c) === c, y = await (u.isRTL == null ? void 0 : u.isRTL(s.floating)), R = p || (v || !k ? [ze(c)] : Ai(c)), C = x !== "none";
      !p && C && R.push(...Di(c, k, x, y));
      const O = [c, ...R], A = await hr(t, w), P = [];
      let E = ((r = l.flip) == null ? void 0 : r.overflows) || [];
      if (d && P.push(A[b]), f) {
        const V = Oi(o, i, y);
        P.push(A[V[0]], A[V[1]]);
      }
      if (E = [...E, {
        placement: o,
        overflows: P
      }], !P.every((V) => V <= 0)) {
        var M, L;
        const V = (((M = l.flip) == null ? void 0 : M.index) || 0) + 1, j = O[V];
        if (j)
          return {
            data: {
              index: V,
              overflows: E
            },
            reset: {
              placement: j
            }
          };
        let $ = (L = E.filter((z) => z.overflows[0] <= 0).sort((z, I) => z.overflows[1] - I.overflows[1])[0]) == null ? void 0 : L.placement;
        if (!$)
          switch (h) {
            case "bestFit": {
              var _;
              const z = (_ = E.filter((I) => {
                if (C) {
                  const T = Oe(I.placement);
                  return T === g || // Create a bias to the `y` side axis due to horizontal
                  // reading directions favoring greater width.
                  T === "y";
                }
                return !0;
              }).map((I) => [I.placement, I.overflows.filter((T) => T > 0).reduce((T, K) => T + K, 0)]).sort((I, T) => I[1] - T[1])[0]) == null ? void 0 : _[0];
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
async function el(e, t) {
  const {
    placement: n,
    platform: r,
    elements: o
  } = e, l = await (r.isRTL == null ? void 0 : r.isRTL(o.floating)), i = Ce(n), c = ut(n), u = Oe(n) === "y", s = ["left", "top"].includes(i) ? -1 : 1, d = l && u ? -1 : 1, f = at(t, e);
  let {
    mainAxis: p,
    crossAxis: h,
    alignmentAxis: x
  } = typeof f == "number" ? {
    mainAxis: f,
    crossAxis: 0,
    alignmentAxis: null
  } : {
    mainAxis: f.mainAxis || 0,
    crossAxis: f.crossAxis || 0,
    alignmentAxis: f.alignmentAxis
  };
  return c && typeof x == "number" && (h = c === "end" ? x * -1 : x), u ? {
    x: h * d,
    y: p * s
  } : {
    x: p * s,
    y: h * d
  };
}
const tl = function(e) {
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
      } = t, u = await el(t, e);
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
}, nl = function(e) {
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
              y: g
            } = w;
            return {
              x: b,
              y: g
            };
          }
        },
        ...u
      } = at(e, t), s = {
        x: n,
        y: r
      }, d = await hr(t, u), f = Oe(Ce(o)), p = lr(f);
      let h = s[p], x = s[f];
      if (l) {
        const w = p === "y" ? "top" : "left", b = p === "y" ? "bottom" : "right", g = h + d[w], v = h - d[b];
        h = fn(g, h, v);
      }
      if (i) {
        const w = f === "y" ? "top" : "left", b = f === "y" ? "bottom" : "right", g = x + d[w], v = x - d[b];
        x = fn(g, x, v);
      }
      const k = c.fn({
        ...t,
        [p]: h,
        [f]: x
      });
      return {
        ...k,
        data: {
          x: k.x - n,
          y: k.y - r,
          enabled: {
            [p]: l,
            [f]: i
          }
        }
      };
    }
  };
};
function pr(e) {
  const t = re(e);
  let n = parseFloat(t.width) || 0, r = parseFloat(t.height) || 0;
  const o = ee(e), l = o ? e.offsetWidth : n, i = o ? e.offsetHeight : r, c = qe(n) !== l || qe(r) !== i;
  return c && (n = l, r = i), {
    width: n,
    height: r,
    $: c
  };
}
function zt(e) {
  return Z(e) ? e : e.contextElement;
}
function Se(e) {
  const t = zt(e);
  if (!ee(t))
    return se(1);
  const n = t.getBoundingClientRect(), {
    width: r,
    height: o,
    $: l
  } = pr(t);
  let i = (l ? qe(n.width) : n.width) / r, c = (l ? qe(n.height) : n.height) / o;
  return (!i || !Number.isFinite(i)) && (i = 1), (!c || !Number.isFinite(c)) && (c = 1), {
    x: i,
    y: c
  };
}
const rl = /* @__PURE__ */ se(0);
function vr(e) {
  const t = Q(e);
  return !st() || !t.visualViewport ? rl : {
    x: t.visualViewport.offsetLeft,
    y: t.visualViewport.offsetTop
  };
}
function ol(e, t, n) {
  return t === void 0 && (t = !1), !n || t && n !== Q(e) ? !1 : t;
}
function Ee(e, t, n, r) {
  t === void 0 && (t = !1), n === void 0 && (n = !1);
  const o = e.getBoundingClientRect(), l = zt(e);
  let i = se(1);
  t && (r ? Z(r) && (i = Se(r)) : i = Se(e));
  const c = ol(l, n, r) ? vr(l) : se(0);
  let u = (o.left + c.x) / i.x, s = (o.top + c.y) / i.y, d = o.width / i.x, f = o.height / i.y;
  if (l) {
    const p = Q(l), h = r && Z(r) ? Q(r) : r;
    let x = p, k = Ot(x);
    for (; k && r && h !== x; ) {
      const w = Se(k), b = k.getBoundingClientRect(), g = re(k), v = b.left + (k.clientLeft + parseFloat(g.paddingLeft)) * w.x, y = b.top + (k.clientTop + parseFloat(g.paddingTop)) * w.y;
      u *= w.x, s *= w.y, d *= w.x, f *= w.y, u += v, s += y, x = Q(k), k = Ot(x);
    }
  }
  return Ye({
    width: d,
    height: f,
    x: u,
    y: s
  });
}
function Yt(e, t) {
  const n = ct(e).scrollLeft;
  return t ? t.left + n : Ee(ce(e)).left + n;
}
function gr(e, t, n) {
  n === void 0 && (n = !1);
  const r = e.getBoundingClientRect(), o = r.left + t.scrollLeft - (n ? 0 : (
    // RTL <body> scrollbar.
    Yt(e, r)
  )), l = r.top + t.scrollTop;
  return {
    x: o,
    y: l
  };
}
function il(e) {
  let {
    elements: t,
    rect: n,
    offsetParent: r,
    strategy: o
  } = e;
  const l = o === "fixed", i = ce(r), c = t ? lt(t.floating) : !1;
  if (r === i || c && l)
    return n;
  let u = {
    scrollLeft: 0,
    scrollTop: 0
  }, s = se(1);
  const d = se(0), f = ee(r);
  if ((f || !f && !l) && ((De(r) !== "body" || Be(i)) && (u = ct(r)), ee(r))) {
    const h = Ee(r);
    s = Se(r), d.x = h.x + r.clientLeft, d.y = h.y + r.clientTop;
  }
  const p = i && !f && !l ? gr(i, u, !0) : se(0);
  return {
    width: n.width * s.x,
    height: n.height * s.y,
    x: n.x * s.x - u.scrollLeft * s.x + d.x + p.x,
    y: n.y * s.y - u.scrollTop * s.y + d.y + p.y
  };
}
function ll(e) {
  return Array.from(e.getClientRects());
}
function sl(e) {
  const t = ce(e), n = ct(e), r = e.ownerDocument.body, o = xe(t.scrollWidth, t.clientWidth, r.scrollWidth, r.clientWidth), l = xe(t.scrollHeight, t.clientHeight, r.scrollHeight, r.clientHeight);
  let i = -n.scrollLeft + Yt(e);
  const c = -n.scrollTop;
  return re(r).direction === "rtl" && (i += xe(t.clientWidth, r.clientWidth) - o), {
    width: o,
    height: l,
    x: i,
    y: c
  };
}
function cl(e, t) {
  const n = Q(e), r = ce(e), o = n.visualViewport;
  let l = r.clientWidth, i = r.clientHeight, c = 0, u = 0;
  if (o) {
    l = o.width, i = o.height;
    const s = st();
    (!s || s && t === "fixed") && (c = o.offsetLeft, u = o.offsetTop);
  }
  return {
    width: l,
    height: i,
    x: c,
    y: u
  };
}
function al(e, t) {
  const n = Ee(e, !0, t === "fixed"), r = n.top + e.clientTop, o = n.left + e.clientLeft, l = ee(e) ? Se(e) : se(1), i = e.clientWidth * l.x, c = e.clientHeight * l.y, u = o * l.x, s = r * l.y;
  return {
    width: i,
    height: c,
    x: u,
    y: s
  };
}
function vn(e, t, n) {
  let r;
  if (t === "viewport")
    r = cl(e, n);
  else if (t === "document")
    r = sl(ce(e));
  else if (Z(t))
    r = al(t, n);
  else {
    const o = vr(e);
    r = {
      x: t.x - o.x,
      y: t.y - o.y,
      width: t.width,
      height: t.height
    };
  }
  return Ye(r);
}
function wr(e, t) {
  const n = ae(e);
  return n === t || !Z(n) || ge(n) ? !1 : re(n).position === "fixed" || wr(n, t);
}
function ul(e, t) {
  const n = t.get(e);
  if (n)
    return n;
  let r = pe(e, [], !1).filter((c) => Z(c) && De(c) !== "body"), o = null;
  const l = re(e).position === "fixed";
  let i = l ? ae(e) : e;
  for (; Z(i) && !ge(i); ) {
    const c = re(i), u = qt(i);
    !u && c.position === "fixed" && (o = null), (l ? !u && !o : !u && c.position === "static" && !!o && ["absolute", "fixed"].includes(o.position) || Be(i) && !u && wr(e, i)) ? r = r.filter((d) => d !== i) : o = c, i = ae(i);
  }
  return t.set(e, r), r;
}
function dl(e) {
  let {
    element: t,
    boundary: n,
    rootBoundary: r,
    strategy: o
  } = e;
  const i = [...n === "clippingAncestors" ? lt(t) ? [] : ul(t, this._c) : [].concat(n), r], c = i[0], u = i.reduce((s, d) => {
    const f = vn(t, d, o);
    return s.top = xe(f.top, s.top), s.right = Ze(f.right, s.right), s.bottom = Ze(f.bottom, s.bottom), s.left = xe(f.left, s.left), s;
  }, vn(t, c, o));
  return {
    width: u.right - u.left,
    height: u.bottom - u.top,
    x: u.left,
    y: u.top
  };
}
function fl(e) {
  const {
    width: t,
    height: n
  } = pr(e);
  return {
    width: t,
    height: n
  };
}
function ml(e, t, n) {
  const r = ee(t), o = ce(t), l = n === "fixed", i = Ee(e, !0, l, t);
  let c = {
    scrollLeft: 0,
    scrollTop: 0
  };
  const u = se(0);
  if (r || !r && !l)
    if ((De(t) !== "body" || Be(o)) && (c = ct(t)), r) {
      const p = Ee(t, !0, l, t);
      u.x = p.x + t.clientLeft, u.y = p.y + t.clientTop;
    } else o && (u.x = Yt(o));
  const s = o && !r && !l ? gr(o, c) : se(0), d = i.left + c.scrollLeft - u.x - s.x, f = i.top + c.scrollTop - u.y - s.y;
  return {
    x: d,
    y: f,
    width: i.width,
    height: i.height
  };
}
function gt(e) {
  return re(e).position === "static";
}
function gn(e, t) {
  if (!ee(e) || re(e).position === "fixed")
    return null;
  if (t)
    return t(e);
  let n = e.offsetParent;
  return ce(e) === n && (n = n.ownerDocument.body), n;
}
function br(e, t) {
  const n = Q(e);
  if (lt(e))
    return n;
  if (!ee(e)) {
    let o = ae(e);
    for (; o && !ge(o); ) {
      if (Z(o) && !gt(o))
        return o;
      o = ae(o);
    }
    return n;
  }
  let r = gn(e, t);
  for (; r && wi(r) && gt(r); )
    r = gn(r, t);
  return r && ge(r) && gt(r) && !qt(r) ? n : r || bi(e) || n;
}
const hl = async function(e) {
  const t = this.getOffsetParent || br, n = this.getDimensions, r = await n(e.floating);
  return {
    reference: ml(e.reference, await t(e.floating), e.strategy),
    floating: {
      x: 0,
      y: 0,
      width: r.width,
      height: r.height
    }
  };
};
function pl(e) {
  return re(e).direction === "rtl";
}
const vl = {
  convertOffsetParentRelativeRectToViewportRelativeRect: il,
  getDocumentElement: ce,
  getClippingRect: dl,
  getOffsetParent: br,
  getElementRects: hl,
  getClientRects: ll,
  getDimensions: fl,
  getScale: Se,
  isElement: Z,
  isRTL: pl
};
function gl(e, t) {
  let n = null, r;
  const o = ce(e);
  function l() {
    var c;
    clearTimeout(r), (c = n) == null || c.disconnect(), n = null;
  }
  function i(c, u) {
    c === void 0 && (c = !1), u === void 0 && (u = 1), l();
    const {
      left: s,
      top: d,
      width: f,
      height: p
    } = e.getBoundingClientRect();
    if (c || t(), !f || !p)
      return;
    const h = We(d), x = We(o.clientWidth - (s + f)), k = We(o.clientHeight - (d + p)), w = We(s), g = {
      rootMargin: -h + "px " + -x + "px " + -k + "px " + -w + "px",
      threshold: xe(0, Ze(1, u)) || 1
    };
    let v = !0;
    function y(R) {
      const C = R[0].intersectionRatio;
      if (C !== u) {
        if (!v)
          return i();
        C ? i(!1, C) : r = setTimeout(() => {
          i(!1, 1e-7);
        }, 1e3);
      }
      v = !1;
    }
    try {
      n = new IntersectionObserver(y, {
        ...g,
        // Handle <iframe>s
        root: o.ownerDocument
      });
    } catch {
      n = new IntersectionObserver(y, g);
    }
    n.observe(e);
  }
  return i(!0), l;
}
function wl(e, t, n, r) {
  r === void 0 && (r = {});
  const {
    ancestorScroll: o = !0,
    ancestorResize: l = !0,
    elementResize: i = typeof ResizeObserver == "function",
    layoutShift: c = typeof IntersectionObserver == "function",
    animationFrame: u = !1
  } = r, s = zt(e), d = o || l ? [...s ? pe(s) : [], ...pe(t)] : [];
  d.forEach((b) => {
    o && b.addEventListener("scroll", n, {
      passive: !0
    }), l && b.addEventListener("resize", n);
  });
  const f = s && c ? gl(s, n) : null;
  let p = -1, h = null;
  i && (h = new ResizeObserver((b) => {
    let [g] = b;
    g && g.target === s && h && (h.unobserve(t), cancelAnimationFrame(p), p = requestAnimationFrame(() => {
      var v;
      (v = h) == null || v.observe(t);
    })), n();
  }), s && !u && h.observe(s), h.observe(t));
  let x, k = u ? Ee(e) : null;
  u && w();
  function w() {
    const b = Ee(e);
    k && (b.x !== k.x || b.y !== k.y || b.width !== k.width || b.height !== k.height) && n(), k = b, x = requestAnimationFrame(w);
  }
  return n(), () => {
    var b;
    d.forEach((g) => {
      o && g.removeEventListener("scroll", n), l && g.removeEventListener("resize", n);
    }), f == null || f(), (b = h) == null || b.disconnect(), h = null, u && cancelAnimationFrame(x);
  };
}
const bl = tl, xl = nl, yl = Qi, Rl = (e, t, n) => {
  const r = /* @__PURE__ */ new Map(), o = {
    platform: vl,
    ...n
  }, l = {
    ...o.platform,
    _c: r
  };
  return Ji(e, t, {
    ...o,
    platform: l
  });
};
var Ue = typeof document < "u" ? Tn : q;
function Je(e, t) {
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
        if (!Je(e[r], t[r]))
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
      if (!(l === "_owner" && e.$$typeof) && !Je(e[l], t[l]))
        return !1;
    }
    return !0;
  }
  return e !== e && t !== t;
}
function xr(e) {
  return typeof window > "u" ? 1 : (e.ownerDocument.defaultView || window).devicePixelRatio || 1;
}
function wn(e, t) {
  const n = xr(e);
  return Math.round(t * n) / n;
}
function wt(e) {
  const t = m.useRef(e);
  return Ue(() => {
    t.current = e;
  }), t;
}
function Cl(e) {
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
  } = e, [d, f] = m.useState({
    x: 0,
    y: 0,
    strategy: n,
    placement: t,
    middlewareData: {},
    isPositioned: !1
  }), [p, h] = m.useState(r);
  Je(p, r) || h(r);
  const [x, k] = m.useState(null), [w, b] = m.useState(null), g = m.useCallback((I) => {
    I !== C.current && (C.current = I, k(I));
  }, []), v = m.useCallback((I) => {
    I !== O.current && (O.current = I, b(I));
  }, []), y = l || x, R = i || w, C = m.useRef(null), O = m.useRef(null), A = m.useRef(d), P = u != null, E = wt(u), M = wt(o), L = wt(s), _ = m.useCallback(() => {
    if (!C.current || !O.current)
      return;
    const I = {
      placement: t,
      strategy: n,
      middleware: p
    };
    M.current && (I.platform = M.current), Rl(C.current, O.current, I).then((T) => {
      const K = {
        ...T,
        // The floating element's position may be recomputed while it's closed
        // but still mounted (such as when transitioning out). To ensure
        // `isPositioned` will be `false` initially on the next open, avoid
        // setting it to `true` when `open === false` (must be specified).
        isPositioned: L.current !== !1
      };
      V.current && !Je(A.current, K) && (A.current = K, In.flushSync(() => {
        f(K);
      }));
    });
  }, [p, t, n, M, L]);
  Ue(() => {
    s === !1 && A.current.isPositioned && (A.current.isPositioned = !1, f((I) => ({
      ...I,
      isPositioned: !1
    })));
  }, [s]);
  const V = m.useRef(!1);
  Ue(() => (V.current = !0, () => {
    V.current = !1;
  }), []), Ue(() => {
    if (y && (C.current = y), R && (O.current = R), y && R) {
      if (E.current)
        return E.current(y, R, _);
      _();
    }
  }, [y, R, _, E, P]);
  const j = m.useMemo(() => ({
    reference: C,
    floating: O,
    setReference: g,
    setFloating: v
  }), [g, v]), $ = m.useMemo(() => ({
    reference: y,
    floating: R
  }), [y, R]), z = m.useMemo(() => {
    const I = {
      position: n,
      left: 0,
      top: 0
    };
    if (!$.floating)
      return I;
    const T = wn($.floating, d.x), K = wn($.floating, d.y);
    return c ? {
      ...I,
      transform: "translate(" + T + "px, " + K + "px)",
      ...xr($.floating) >= 1.5 && {
        willChange: "transform"
      }
    } : {
      position: n,
      left: T,
      top: K
    };
  }, [n, c, $.floating, d.x, d.y]);
  return m.useMemo(() => ({
    ...d,
    update: _,
    refs: j,
    elements: $,
    floatingStyles: z
  }), [d, _, j, $, z]);
}
const El = (e, t) => ({
  ...bl(e),
  options: [e, t]
}), Nl = (e, t) => ({
  ...xl(e),
  options: [e, t]
}), kl = (e, t) => ({
  ...yl(e),
  options: [e, t]
}), yr = {
  ...m
}, Sl = yr.useInsertionEffect, Ol = Sl || ((e) => e());
function ke(e) {
  const t = m.useRef(() => {
    if (process.env.NODE_ENV !== "production")
      throw new Error("Cannot call an event handler while rendering.");
  });
  return Ol(() => {
    t.current = e;
  }), m.useCallback(function() {
    for (var n = arguments.length, r = new Array(n), o = 0; o < n; o++)
      r[o] = arguments[o];
    return t.current == null ? void 0 : t.current(...r);
  }, []);
}
var ye = typeof document < "u" ? Tn : q;
function Tt() {
  return Tt = Object.assign ? Object.assign.bind() : function(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = arguments[t];
      for (var r in n)
        Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
    }
    return e;
  }, Tt.apply(this, arguments);
}
let bn = !1, Al = 0;
const xn = () => (
  // Ensure the id is unique with multiple independent versions of Floating UI
  // on <React 18
  "floating-ui-" + Math.random().toString(36).slice(2, 6) + Al++
);
function Ll() {
  const [e, t] = m.useState(() => bn ? xn() : void 0);
  return ye(() => {
    e == null && t(xn());
  }, []), m.useEffect(() => {
    bn = !0;
  }, []), e;
}
const Dl = yr.useId, Rr = Dl || Ll;
let Pt;
process.env.NODE_ENV !== "production" && (Pt = /* @__PURE__ */ new Set());
function Ml() {
  for (var e, t = arguments.length, n = new Array(t), r = 0; r < t; r++)
    n[r] = arguments[r];
  const o = "Floating UI: " + n.join(" ");
  if (!((e = Pt) != null && e.has(o))) {
    var l;
    (l = Pt) == null || l.add(o), console.error(o);
  }
}
function Tl() {
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
const Pl = /* @__PURE__ */ m.createContext(null), Il = /* @__PURE__ */ m.createContext(null), Fl = () => {
  var e;
  return ((e = m.useContext(Pl)) == null ? void 0 : e.id) || null;
}, Cr = () => m.useContext(Il);
function Gt(e) {
  return "data-floating-ui-" + e;
}
function bt(e, t) {
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
const Er = () => ({
  getShadowRoot: !0,
  displayCheck: (
    // JSDOM does not support the `tabbable` library. To solve this we can
    // check if `ResizeObserver` is a real function (not polyfilled), which
    // determines if the current environment is JSDOM-like.
    typeof ResizeObserver == "function" && ResizeObserver.toString().includes("[native code]") ? "full" : "none"
  )
});
function Nr(e, t) {
  const n = mr(e, Er());
  t === "prev" && n.reverse();
  const r = n.indexOf(xi(Lt(e)));
  return n.slice(r + 1)[0];
}
function jl() {
  return Nr(document.body, "next");
}
function _l() {
  return Nr(document.body, "prev");
}
function xt(e, t) {
  const n = t || e.currentTarget, r = e.relatedTarget;
  return !r || !At(n, r);
}
function Vl(e) {
  mr(e, Er()).forEach((n) => {
    n.dataset.tabindex = n.getAttribute("tabindex") || "", n.setAttribute("tabindex", "-1");
  });
}
function yn(e) {
  e.querySelectorAll("[data-tabindex]").forEach((n) => {
    const r = n.dataset.tabindex;
    delete n.dataset.tabindex, r ? n.setAttribute("tabindex", r) : n.removeAttribute("tabindex");
  });
}
const kr = {
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
let Bl;
function Rn(e) {
  e.key === "Tab" && (e.target, clearTimeout(Bl));
}
const Cn = /* @__PURE__ */ m.forwardRef(function(t, n) {
  const [r, o] = m.useState();
  ye(() => (yi() && o("button"), document.addEventListener("keydown", Rn), () => {
    document.removeEventListener("keydown", Rn);
  }), []);
  const l = {
    ref: n,
    tabIndex: 0,
    // Role is only for VoiceOver
    role: r,
    "aria-hidden": r ? void 0 : !0,
    [Gt("focus-guard")]: "",
    style: kr
  };
  return /* @__PURE__ */ m.createElement("span", Tt({}, t, l));
}), Sr = /* @__PURE__ */ m.createContext(null), En = /* @__PURE__ */ Gt("portal");
function Hl(e) {
  e === void 0 && (e = {});
  const {
    id: t,
    root: n
  } = e, r = Rr(), o = Wl(), [l, i] = m.useState(null), c = m.useRef(null);
  return ye(() => () => {
    l == null || l.remove(), queueMicrotask(() => {
      c.current = null;
    });
  }, [l]), ye(() => {
    if (!r || c.current) return;
    const u = t ? document.getElementById(t) : null;
    if (!u) return;
    const s = document.createElement("div");
    s.id = r, s.setAttribute(En, ""), u.appendChild(s), c.current = s, i(s);
  }, [t, r]), ye(() => {
    if (n === null || !r || c.current) return;
    let u = n || (o == null ? void 0 : o.portalNode);
    u && !Z(u) && (u = u.current), u = u || document.body;
    let s = null;
    t && (s = document.createElement("div"), s.id = t, u.appendChild(s));
    const d = document.createElement("div");
    d.id = r, d.setAttribute(En, ""), u = s || u, u.appendChild(d), c.current = d, i(d);
  }, [t, n, r, o]), l;
}
function $l(e) {
  const {
    children: t,
    id: n,
    root: r,
    preserveTabOrder: o = !0
  } = e, l = Hl({
    id: n,
    root: r
  }), [i, c] = m.useState(null), u = m.useRef(null), s = m.useRef(null), d = m.useRef(null), f = m.useRef(null), p = i == null ? void 0 : i.modal, h = i == null ? void 0 : i.open, x = (
    // The FocusManager and therefore floating element are currently open/
    // rendered.
    !!i && // Guards are only for non-modal focus management.
    !i.modal && // Don't render if unmount is transitioning.
    i.open && o && !!(r || l)
  );
  return m.useEffect(() => {
    if (!l || !o || p)
      return;
    function k(w) {
      l && xt(w) && (w.type === "focusin" ? yn : Vl)(l);
    }
    return l.addEventListener("focusin", k, !0), l.addEventListener("focusout", k, !0), () => {
      l.removeEventListener("focusin", k, !0), l.removeEventListener("focusout", k, !0);
    };
  }, [l, o, p]), m.useEffect(() => {
    l && (h || yn(l));
  }, [h, l]), /* @__PURE__ */ m.createElement(Sr.Provider, {
    value: m.useMemo(() => ({
      preserveTabOrder: o,
      beforeOutsideRef: u,
      afterOutsideRef: s,
      beforeInsideRef: d,
      afterInsideRef: f,
      portalNode: l,
      setFocusManagerState: c
    }), [o, l])
  }, x && l && /* @__PURE__ */ m.createElement(Cn, {
    "data-type": "outside",
    ref: u,
    onFocus: (k) => {
      if (xt(k, l)) {
        var w;
        (w = d.current) == null || w.focus();
      } else {
        const b = _l() || (i == null ? void 0 : i.refs.domReference.current);
        b == null || b.focus();
      }
    }
  }), x && l && /* @__PURE__ */ m.createElement("span", {
    "aria-owns": l.id,
    style: kr
  }), l && /* @__PURE__ */ In.createPortal(t, l), x && l && /* @__PURE__ */ m.createElement(Cn, {
    "data-type": "outside",
    ref: s,
    onFocus: (k) => {
      if (xt(k, l)) {
        var w;
        (w = f.current) == null || w.focus();
      } else {
        const b = jl() || (i == null ? void 0 : i.refs.domReference.current);
        b == null || b.focus(), i != null && i.closeOnFocusOut && (i == null || i.onOpenChange(!1, k.nativeEvent, "focus-out"));
      }
    }
  }));
}
const Wl = () => m.useContext(Sr), Ul = "data-floating-ui-focusable";
function Nn(e) {
  return ee(e.target) && e.target.tagName === "BUTTON";
}
function kn(e) {
  return Ni(e);
}
function Kl(e, t) {
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
    keyboardHandlers: d = !0
  } = t, f = m.useRef(), p = m.useRef(!1), h = m.useMemo(() => ({
    onPointerDown(x) {
      f.current = x.pointerType;
    },
    onMouseDown(x) {
      const k = f.current;
      x.button === 0 && c !== "click" && (dn(k) && s || (n && u && (!o.current.openEvent || o.current.openEvent.type === "mousedown") ? r(!1, x.nativeEvent, "click") : (x.preventDefault(), r(!0, x.nativeEvent, "click"))));
    },
    onClick(x) {
      const k = f.current;
      if (c === "mousedown" && f.current) {
        f.current = void 0;
        return;
      }
      dn(k) && s || (n && u && (!o.current.openEvent || o.current.openEvent.type === "click") ? r(!1, x.nativeEvent, "click") : r(!0, x.nativeEvent, "click"));
    },
    onKeyDown(x) {
      f.current = void 0, !(x.defaultPrevented || !d || Nn(x)) && (x.key === " " && !kn(l) && (x.preventDefault(), p.current = !0), x.key === "Enter" && r(!(n && u), x.nativeEvent, "click"));
    },
    onKeyUp(x) {
      x.defaultPrevented || !d || Nn(x) || kn(l) || x.key === " " && p.current && (p.current = !1, r(!(n && u), x.nativeEvent, "click"));
    }
  }), [o, l, c, s, d, r, n, u]);
  return m.useMemo(() => i ? {
    reference: h
  } : {}, [i, h]);
}
const Zl = {
  pointerdown: "onPointerDown",
  mousedown: "onMouseDown",
  click: "onClick"
}, ql = {
  pointerdown: "onPointerDownCapture",
  mousedown: "onMouseDownCapture",
  click: "onClickCapture"
}, Sn = (e) => {
  var t, n;
  return {
    escapeKey: typeof e == "boolean" ? e : (t = e == null ? void 0 : e.escapeKey) != null ? t : !1,
    outsidePress: typeof e == "boolean" ? e : (n = e == null ? void 0 : e.outsidePress) != null ? n : !0
  };
};
function zl(e, t) {
  t === void 0 && (t = {});
  const {
    open: n,
    onOpenChange: r,
    elements: o,
    dataRef: l
  } = e, {
    enabled: i = !0,
    escapeKey: c = !0,
    outsidePress: u = !0,
    outsidePressEvent: s = "pointerdown",
    referencePress: d = !1,
    referencePressEvent: f = "pointerdown",
    ancestorScroll: p = !1,
    bubbles: h,
    capture: x
  } = t, k = Cr(), w = ke(typeof u == "function" ? u : () => !1), b = typeof u == "function" ? w : u, g = m.useRef(!1), v = m.useRef(!1), {
    escapeKey: y,
    outsidePress: R
  } = Sn(h), {
    escapeKey: C,
    outsidePress: O
  } = Sn(x), A = m.useRef(!1), P = ke((j) => {
    var $;
    if (!n || !i || !c || j.key !== "Escape" || A.current)
      return;
    const z = ($ = l.current.floatingContext) == null ? void 0 : $.nodeId, I = k ? bt(k.nodesRef.current, z) : [];
    if (!y && (j.stopPropagation(), I.length > 0)) {
      let T = !0;
      if (I.forEach((K) => {
        var X;
        if ((X = K.context) != null && X.open && !K.context.dataRef.current.__escapeKeyBubbles) {
          T = !1;
          return;
        }
      }), !T)
        return;
    }
    r(!1, Ri(j) ? j.nativeEvent : j, "escape-key");
  }), E = ke((j) => {
    var $;
    const z = () => {
      var I;
      P(j), (I = Pe(j)) == null || I.removeEventListener("keydown", z);
    };
    ($ = Pe(j)) == null || $.addEventListener("keydown", z);
  }), M = ke((j) => {
    var $;
    const z = g.current;
    g.current = !1;
    const I = v.current;
    if (v.current = !1, s === "click" && I || z || typeof b == "function" && !b(j))
      return;
    const T = Pe(j), K = "[" + Gt("inert") + "]", X = Lt(o.floating).querySelectorAll(K);
    let ue = Z(T) ? T : null;
    for (; ue && !ge(ue); ) {
      const te = ae(ue);
      if (ge(te) || !Z(te))
        break;
      ue = te;
    }
    if (X.length && Z(T) && !Ci(T) && // Clicked on a direct ancestor (e.g. FloatingOverlay).
    !At(T, o.floating) && // If the target root element contains none of the markers, then the
    // element was injected after the floating element rendered.
    Array.from(X).every((te) => !At(ue, te)))
      return;
    if (ee(T) && V) {
      const te = T.clientWidth > 0 && T.scrollWidth > T.clientWidth, de = T.clientHeight > 0 && T.scrollHeight > T.clientHeight;
      let Me = de && j.offsetX > T.clientWidth;
      if (de && re(T).direction === "rtl" && (Me = j.offsetX <= T.offsetWidth - T.clientWidth), Me || te && j.offsetY > T.clientHeight)
        return;
    }
    const Qt = ($ = l.current.floatingContext) == null ? void 0 : $.nodeId, Mr = k && bt(k.nodesRef.current, Qt).some((te) => {
      var de;
      return vt(j, (de = te.context) == null ? void 0 : de.elements.floating);
    });
    if (vt(j, o.floating) || vt(j, o.domReference) || Mr)
      return;
    const en = k ? bt(k.nodesRef.current, Qt) : [];
    if (en.length > 0) {
      let te = !0;
      if (en.forEach((de) => {
        var Me;
        if ((Me = de.context) != null && Me.open && !de.context.dataRef.current.__outsidePressBubbles) {
          te = !1;
          return;
        }
      }), !te)
        return;
    }
    r(!1, j, "outside-press");
  }), L = ke((j) => {
    var $;
    const z = () => {
      var I;
      M(j), (I = Pe(j)) == null || I.removeEventListener(s, z);
    };
    ($ = Pe(j)) == null || $.addEventListener(s, z);
  });
  m.useEffect(() => {
    if (!n || !i)
      return;
    l.current.__escapeKeyBubbles = y, l.current.__outsidePressBubbles = R;
    let j = -1;
    function $(X) {
      r(!1, X, "ancestor-scroll");
    }
    function z() {
      window.clearTimeout(j), A.current = !0;
    }
    function I() {
      j = window.setTimeout(
        () => {
          A.current = !1;
        },
        // 0ms or 1ms don't work in Safari. 5ms appears to consistently work.
        // Only apply to WebKit for the test to remain 0ms.
        st() ? 5 : 0
      );
    }
    const T = Lt(o.floating);
    c && (T.addEventListener("keydown", C ? E : P, C), T.addEventListener("compositionstart", z), T.addEventListener("compositionend", I)), b && T.addEventListener(s, O ? L : M, O);
    let K = [];
    return p && (Z(o.domReference) && (K = pe(o.domReference)), Z(o.floating) && (K = K.concat(pe(o.floating))), !Z(o.reference) && o.reference && o.reference.contextElement && (K = K.concat(pe(o.reference.contextElement)))), K = K.filter((X) => {
      var ue;
      return X !== ((ue = T.defaultView) == null ? void 0 : ue.visualViewport);
    }), K.forEach((X) => {
      X.addEventListener("scroll", $, {
        passive: !0
      });
    }), () => {
      c && (T.removeEventListener("keydown", C ? E : P, C), T.removeEventListener("compositionstart", z), T.removeEventListener("compositionend", I)), b && T.removeEventListener(s, O ? L : M, O), K.forEach((X) => {
        X.removeEventListener("scroll", $);
      }), window.clearTimeout(j);
    };
  }, [l, o, c, b, s, n, r, p, i, y, R, P, C, E, M, O, L]), m.useEffect(() => {
    g.current = !1;
  }, [b, s]);
  const _ = m.useMemo(() => ({
    onKeyDown: P,
    [Zl[f]]: (j) => {
      d && r(!1, j.nativeEvent, "reference-press");
    }
  }), [P, r, d, f]), V = m.useMemo(() => ({
    onKeyDown: P,
    onMouseDown() {
      v.current = !0;
    },
    onMouseUp() {
      v.current = !0;
    },
    [ql[s]]: () => {
      g.current = !0;
    }
  }), [P, s]);
  return m.useMemo(() => i ? {
    reference: _,
    floating: V
  } : {}, [i, _, V]);
}
function Yl(e) {
  const {
    open: t = !1,
    onOpenChange: n,
    elements: r
  } = e, o = Rr(), l = m.useRef({}), [i] = m.useState(() => Tl()), c = Fl() != null;
  if (process.env.NODE_ENV !== "production") {
    const h = r.reference;
    h && !Z(h) && Ml("Cannot pass a virtual element to the `elements.reference` option,", "as it must be a real DOM element. Use `refs.setPositionReference()`", "instead.");
  }
  const [u, s] = m.useState(r.reference), d = ke((h, x, k) => {
    l.current.openEvent = h ? x : void 0, i.emit("openchange", {
      open: h,
      event: x,
      reason: k,
      nested: c
    }), n == null || n(h, x, k);
  }), f = m.useMemo(() => ({
    setPositionReference: s
  }), []), p = m.useMemo(() => ({
    reference: u || r.reference || null,
    floating: r.floating || null,
    domReference: r.reference
  }), [u, r.reference, r.floating]);
  return m.useMemo(() => ({
    dataRef: l,
    open: t,
    onOpenChange: d,
    elements: p,
    events: i,
    floatingId: o,
    refs: f
  }), [t, d, p, i, o, f]);
}
function Gl(e) {
  e === void 0 && (e = {});
  const {
    nodeId: t
  } = e, n = Yl({
    ...e,
    elements: {
      reference: null,
      floating: null,
      ...e.elements
    }
  }), r = e.rootContext || n, o = r.elements, [l, i] = m.useState(null), [c, u] = m.useState(null), d = (o == null ? void 0 : o.domReference) || l, f = m.useRef(null), p = Cr();
  ye(() => {
    d && (f.current = d);
  }, [d]);
  const h = Cl({
    ...e,
    elements: {
      ...o,
      ...c && {
        reference: c
      }
    }
  }), x = m.useCallback((v) => {
    const y = Z(v) ? {
      getBoundingClientRect: () => v.getBoundingClientRect(),
      contextElement: v
    } : v;
    u(y), h.refs.setReference(y);
  }, [h.refs]), k = m.useCallback((v) => {
    (Z(v) || v === null) && (f.current = v, i(v)), (Z(h.refs.reference.current) || h.refs.reference.current === null || // Don't allow setting virtual elements using the old technique back to
    // `null` to support `positionReference` + an unstable `reference`
    // callback ref.
    v !== null && !Z(v)) && h.refs.setReference(v);
  }, [h.refs]), w = m.useMemo(() => ({
    ...h.refs,
    setReference: k,
    setPositionReference: x,
    domReference: f
  }), [h.refs, k, x]), b = m.useMemo(() => ({
    ...h.elements,
    domReference: d
  }), [h.elements, d]), g = m.useMemo(() => ({
    ...h,
    ...r,
    refs: w,
    elements: b,
    nodeId: t
  }), [h, w, b, t, r]);
  return ye(() => {
    r.dataRef.current.floatingContext = g;
    const v = p == null ? void 0 : p.nodesRef.current.find((y) => y.id === t);
    v && (v.context = g);
  }), m.useMemo(() => ({
    ...h,
    context: g,
    refs: w,
    elements: b
  }), [h, w, b, g]);
}
const On = "active", An = "selected";
function yt(e, t, n) {
  const r = /* @__PURE__ */ new Map(), o = n === "item";
  let l = e;
  if (o && e) {
    const {
      [On]: i,
      [An]: c,
      ...u
    } = e;
    l = u;
  }
  return {
    ...n === "floating" && {
      tabIndex: -1,
      [Ul]: ""
    },
    ...l,
    ...t.map((i) => {
      const c = i ? i[n] : null;
      return typeof c == "function" ? e ? c(e) : null : c;
    }).concat(e).reduce((i, c) => (c && Object.entries(c).forEach((u) => {
      let [s, d] = u;
      if (!(o && [On, An].includes(s)))
        if (s.indexOf("on") === 0) {
          if (r.has(s) || r.set(s, []), typeof d == "function") {
            var f;
            (f = r.get(s)) == null || f.push(d), i[s] = function() {
              for (var p, h = arguments.length, x = new Array(h), k = 0; k < h; k++)
                x[k] = arguments[k];
              return (p = r.get(s)) == null ? void 0 : p.map((w) => w(...x)).find((w) => w !== void 0);
            };
          }
        } else
          i[s] = d;
    }), i), {})
  };
}
function Xl(e) {
  e === void 0 && (e = []);
  const t = e.map((c) => c == null ? void 0 : c.reference), n = e.map((c) => c == null ? void 0 : c.floating), r = e.map((c) => c == null ? void 0 : c.item), o = m.useCallback(
    (c) => yt(c, e, "reference"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    t
  ), l = m.useCallback(
    (c) => yt(c, e, "floating"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    n
  ), i = m.useCallback(
    (c) => yt(c, e, "item"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    r
  );
  return m.useMemo(() => ({
    getReferenceProps: o,
    getFloatingProps: l,
    getItemProps: i
  }), [o, l, i]);
}
function Jl({
  isOpen: e,
  setIsOpen: t,
  offset: n = 0,
  placement: r = "bottom-start",
  click: o = !0
}) {
  const { x: l, y: i, strategy: c, refs: u, context: s } = Gl({
    open: e,
    onOpenChange: t,
    middleware: [Nl(), El(n), kl()],
    whileElementsMounted: wl,
    placement: r
  }), d = Kl(s, {
    enabled: o
  }), f = zl(s, {}), { getReferenceProps: p, getFloatingProps: h } = Xl([
    d,
    f
  ]);
  return {
    x: l,
    y: i,
    strategy: c,
    refs: u,
    getReferenceProps: p,
    getFloatingProps: h
  };
}
function le({
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
  const { x: s, y: d, strategy: f, refs: p, getReferenceProps: h, getFloatingProps: x } = Jl({
    isOpen: e,
    setIsOpen: t,
    offset: n,
    placement: r,
    hover: o,
    click: l
  }), [k, w] = _r.toArray(c), [b] = S(Kn);
  function g() {
    return e && /* @__PURE__ */ a($l, { id: b, children: /* @__PURE__ */ a(
      "div",
      {
        ref: p.setFloating,
        style: {
          position: f,
          top: d ?? 0,
          left: s ?? 0,
          zIndex: 1
        },
        ...x(),
        children: w
      }
    ) });
  }
  function v() {
    return e && /* @__PURE__ */ a(
      "div",
      {
        ref: p.setFloating,
        style: {
          position: f,
          top: d ?? 0,
          left: s ?? 0
        },
        ...x(),
        children: w
      }
    );
  }
  return /* @__PURE__ */ N(G, { children: [
    /* @__PURE__ */ a(
      "div",
      {
        ref: p.setReference,
        ...h({ onClick: i }),
        children: k
      }
    ),
    u ? g() : v()
  ] });
}
function Ql({
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
  ), [s, d] = B(
    u && u._isValid !== !1 ? Fe(u) : ""
  ), f = /^([1-9]|1[012]|0[1-9])[/.-]?$/g, p = /^([1-9]|1[012]|0[1-9])[/.-]([1-9]||0[1-9]|1[0-9]|2[0-9]|3[01])[/.-]?$/g, h = /^([1-9]|1[012]|0[1-9])[/.-]([1-9]||0[1-9]|1[0-9]|2[0-9]|3[01])[/.-](\d?\d?\d?\d)$/g, [x, k] = B(null), w = /* @__PURE__ */ new Date(), [, b] = S(Ut), g = o === "editing", v = Y(
    (O) => {
      b({ rowId: e, colId: t, value: O ? "editing" : "focused" });
    },
    [e, t, b]
  );
  function y(O, A, P) {
    const E = Number(P), M = Number(O) - 1, L = Number(A), _ = /* @__PURE__ */ new Date();
    return _.setUTCFullYear(E, M, L), _.setUTCHours(0, 0, 0, 0), _;
  }
  const R = Y(
    (O) => {
      c.formatStoredDate !== void 0 ? r(c.formatStoredDate(O, i) || "") : r((O == null ? void 0 : O.toISOString()) || ""), c.formatStoredDate !== void 0 ? d(c.formatStoredDate(u, i) || "") : d(Fe(O)), b({ rowId: e, colId: t, value: "focused" });
    },
    [e, t, b, r]
  );
  q(() => {
    x && x.focus();
  }, [x]), q(() => {
    c.formatStoredDate !== void 0 ? d(c.formatStoredDate(u, i) || "") : d(u && u._isValid !== !1 ? Fe(u) : "");
  }, [o]);
  function C(O) {
    d(O.target.value);
  }
  return di(() => {
    if (!s || c.formatStoredDate !== void 0)
      return;
    let O = null;
    if (h.test(s)) {
      s.match(h);
      const [A] = s.matchAll(h);
      O = y(A[1], A[2], A[3]);
    } else if (f.test(s)) {
      s.match(f);
      const [A] = s.matchAll(f);
      O = y(A[1], 1, w.getUTCFullYear());
    } else if (p.test(s)) {
      s.match(p);
      const [A] = s.matchAll(p);
      O = y(
        A[1],
        A[2],
        w.getUTCFullYear()
      );
    }
    r((O == null ? void 0 : O.toISOString()) || "");
  }, [s]), /* @__PURE__ */ N(G, { children: [
    (o === "none" || o === "focused") && /* @__PURE__ */ a("div", { className: "p-1 flex items-center cursor-default w-full", children: u ? c.formatDisplayDate !== void 0 ? c.formatDisplayDate(u, i) : Fe(u) : "" }),
    o === "editing" && !l && /* @__PURE__ */ N(le, { isOpen: g, setIsOpen: v, offset: 4, children: [
      /* @__PURE__ */ N("div", { className: "h-full", children: [
        /* @__PURE__ */ a("input", { type: "data", className: "hidden", value: s, readOnly: !0 }),
        /* @__PURE__ */ a(
          "input",
          {
            placeholder: "mm/dd/yyyy",
            className: "rs-input focus:outline-none rounded p-1 w-full",
            onChange: C,
            value: s,
            ref: k
          }
        )
      ] }),
      /* @__PURE__ */ a(gi, { onSelect: R, value: (u == null ? void 0 : u._isValid) !== !1 ? u : null })
    ] })
  ] });
}
const es = {
  32: "truncate",
  64: "line-clamp-2",
  96: "line-clamp-4",
  128: "line-clamp-5"
};
function ts({ data: e, setData: t, focusState: n, isViewOnly: r }) {
  const [o, l] = B(null), i = W(() => e || "", [e]), [c] = S(Wt);
  function u(s) {
    s.preventDefault(), t(s.target.value);
  }
  return q(() => {
    o && (o.focus(), o.setSelectionRange(
      i.length + 1,
      i.length || 1
    ), o.scrollTop = o.scrollHeight);
  }, [o]), /* @__PURE__ */ N(G, { children: [
    (n === "none" || n === "focused") && /* @__PURE__ */ a(
      "div",
      {
        className: U(
          "p-1 cursor-default w-full h-full",
          es[c]
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
const ns = [
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
function He({
  options: e = ns,
  allOptions: t,
  onSelect: n,
  placeholder: r = "Search",
  inputRef: o,
  OptionRenderer: l,
  value: i = {},
  onNewOption: c,
  enableSearch: u = !0
}) {
  const [s, d] = B(e), f = s.find((E) => E.value === i.value), [p, h] = B(f || s[0]), [x, k] = B(!1), [w, b] = B(""), g = W(() => Nt(), []), [v, y] = B({}), R = he(!1);
  q(() => {
    let E = !1;
    if (t)
      for (const L in t)
        t[L].name.toLowerCase() === w.toLowerCase() && (E = !0);
    const M = e.filter((L) => (L.name.toLowerCase() === w.toLowerCase() && (E = !0), L.name.toLowerCase().includes(w.toLowerCase())));
    d(M), R.current ? M.length > 0 ? h(M[0]) : h({
      value: w,
      name: w,
      color: g
    }) : h(f || M[0]), y(E ? {} : {
      value: w,
      name: w,
      color: g
    }), k(E);
  }, [w]);
  function C(E) {
    n == null || n(E);
  }
  function O(E) {
    k(!1), b(E.target.value), R.current = !0;
  }
  const A = Y((E) => {
    if (E.code === "Enter") {
      if (E.preventDefault(), s.length === 0 && x || !p.value)
        return;
      c && !x && c(v), C(p);
    } else if (E.code === "ArrowDown") {
      p || h(s[0]);
      const M = s.findIndex(
        (L) => L.value === p.value
      );
      h(s[(M + 1) % s.length]);
    } else if (E.code === "ArrowUp") {
      p || h(s[0]);
      const M = s.findIndex(
        (L) => L.value === p.value
      );
      h(
        s[(M + s.length - 1) % s.length]
      );
    }
  });
  function P(E) {
    E.preventDefault(), h(s[0]);
  }
  return /* @__PURE__ */ N(
    "div",
    {
      className: "w-full relative pt-2",
      onKeyDown: A,
      onMouseEnter: P,
      role: "searchbox",
      tabIndex: 0,
      children: [
        u && /* @__PURE__ */ a("div", { className: "px-2 mb-2", children: /* @__PURE__ */ a(
          "input",
          {
            className: "rs-input border focus:ring rounded-2 rounded focus:outline-none px-2 p-1 w-full truncate",
            placeholder: r,
            onChange: O,
            ref: o,
            value: w
          }
        ) }),
        /* @__PURE__ */ N("ul", { className: "rs-list max-h-48 overflow-auto pb-2", children: [
          s.map((E) => /* @__PURE__ */ N(
            "li",
            {
              className: U(
                "hover:bg-hover-light px-2 p-1 cursor-default flex flex-row whitespace-nowrap",
                p && p.value === E.value && "bg-hover"
              ),
              onClick: (M) => {
                M.preventDefault(), C(E);
              },
              onMouseEnter: () => {
                h(E);
              },
              "aria-selected": p.value === E.value,
              onKeyDown: (M) => {
                M.code === "Enter" && C(E);
              },
              children: [
                l ? /* @__PURE__ */ a(l, { ...E }) : E.name,
                f && f.value === E.value && /* @__PURE__ */ a(Kt, { className: "w-4 h-4 ml-auto self-center" })
              ]
            },
            E.value
          )),
          c && w && !x && /* @__PURE__ */ N(
            "li",
            {
              className: U(
                "hover:bg-hover-light px-2 p-1 cursor-pointer flex flex-row whitespace-nowrap",
                p && p.value === v.value && "bg-hover"
              ),
              onClick: () => c(v),
              onMouseEnter: () => {
                h(v);
              },
              "aria-selected": !1,
              onKeyDown: (E) => {
                E.code === "Enter" && c(v);
              },
              children: [
                /* @__PURE__ */ a("span", { className: "mr-2", children: "Add option:" }),
                l ? /* @__PURE__ */ a(l, { ...v }) : v.name
              ]
            }
          )
        ] })
      ]
    }
  );
}
function rs({
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
    () => Re(n) ? [] : n.split(",").map((b) => o.find((g) => g.value === b)),
    [n, o]
  ), [d, f] = B(null), p = i === "editing", [, h] = S(Ut), x = Y(
    (b) => {
      h({ rowId: e, colId: t, value: b ? "editing" : "focused" });
    },
    [t, e, h]
  ), k = o.filter(
    (b) => s.findIndex((g) => g.value === b.value) === -1
  );
  q(() => {
    d && d.focus();
  }, [d]);
  const w = Y(
    (b) => {
      l({ id: t, options: [...o, b] }), r([...s.map((g) => g.value), b.value].join(",")), h({ rowId: e, colId: t, value: "focused" });
    },
    [t, e, s, o, l, r, h]
  );
  return /* @__PURE__ */ N(G, { children: [
    i === "none" && /* @__PURE__ */ a("div", { className: "p-1 flex items-center h-full overflow-hidden", children: /* @__PURE__ */ a("div", { className: "flex gap-1", children: s.map((b) => b ? /* @__PURE__ */ a(me, { color: b.color, name: b.name }, b.name) : null) }) }),
    (i === "focused" || i === "editing") && /* @__PURE__ */ N(
      le,
      {
        isOpen: p && !u,
        setIsOpen: x,
        referenceClass: "w-full max-h-8",
        children: [
          /* @__PURE__ */ a(
            "div",
            {
              className: "flex items-center p-1 w-full h-full bg-content",
              tabIndex: i === "editing" ? 0 : -1,
              children: /* @__PURE__ */ N("div", { className: "flex gap-1 flex-wrap", children: [
                s.map((b) => b ? /* @__PURE__ */ a(
                  me,
                  {
                    color: b.color,
                    name: b.name,
                    onCancel: (g) => {
                      g.stopPropagation(), r(
                        n.split(",").filter((v) => v !== b.value).join(",")
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
                    children: /* @__PURE__ */ a(nr, { className: "w-4 text-dark" })
                  }
                )
              ] })
            }
          ),
          /* @__PURE__ */ N(F, { children: [
            /* @__PURE__ */ a("div", { className: "w-48" }),
            /* @__PURE__ */ a(
              He,
              {
                allOptions: o,
                options: k,
                onSelect: (b) => {
                  r(
                    Re(n) ? b.value : `${n},${b.value}`
                  );
                },
                inputRef: f,
                OptionRenderer: me,
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
function os({ data: e, setData: t, setError: n, focus: r, isViewOnly: o, configuration: l }) {
  const [i] = S(ie), [c, u] = B(null), s = /^[+-]?(\d*(\.\d*)?)$/, d = W(() => i.parseNumber !== void 0 ? i.parseNumber(e, l) : Number.parseFloat(e), [e, l]);
  function f(h) {
    h.preventDefault(), (i.parseNumber !== void 0 ? !isNaN(i.parseNumber(h.target.value, l)) : s.test(h.target.value)) ? (t(h.target.value), n("")) : n("Please enter a number.");
  }
  q(() => {
    n(""), c && c.focus();
  }, [n, c]);
  const p = (e || "").toString();
  return /* @__PURE__ */ N(G, { children: [
    (r === "none" || r === "focused") && /* @__PURE__ */ a("div", { className: "p-1 flex items-center justify-end truncate cursor-default w-full", children: i.formatDisplayNumber !== void 0 ? i.formatDisplayNumber(d, l) : p }),
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
function is({
  rowId: e,
  colId: t,
  data: n,
  setData: r,
  options: o,
  updateColumn: l,
  focusState: i,
  showOptionSearch: c,
  isViewOnly: u,
  tableConfiguration: s
}) {
  const d = W(
    () => _e(n) ? {} : o.find((g) => g.value === n)
  ), [f, p] = B(null), h = W(() => [
    {
      value: null,
      isBlank: !0,
      name: "Blank"
    },
    ...o
  ], [o]), x = i === "editing", [, k] = S(Ut), w = Y(
    (g) => {
      k({ rowId: e, colId: t, value: g ? "editing" : "focused" });
    },
    [t, e, k]
  );
  q(() => {
    f && f.focus();
  }, [f]);
  const b = Y(
    (g) => {
      l({ id: t, options: [...o, g] }), r(g.value), k({ rowId: e, colId: t, value: "focused" });
    },
    [t, e, o, l]
  );
  return /* @__PURE__ */ N(G, { children: [
    i === "none" && /* @__PURE__ */ a("div", { className: "p-1 flex items-center h-full", children: d && /* @__PURE__ */ a(me, { color: d.color, name: d.name }) }),
    u && (i === "focused" || i === "editing") && /* @__PURE__ */ a("div", { className: "flex items-center p-1 w-full h-full", children: d && /* @__PURE__ */ a(me, { color: d.color, name: d.name }) }),
    !u && (i === "focused" || i === "editing") && /* @__PURE__ */ N(
      le,
      {
        isOpen: x,
        setIsOpen: w,
        referenceClass: "w-full max-h-8",
        children: [
          /* @__PURE__ */ N(
            "div",
            {
              className: "flex items-center p-1 w-full h-full",
              tabIndex: i === "editing" ? 0 : -1,
              children: [
                d && /* @__PURE__ */ a(me, { color: d.color, name: d.name }),
                /* @__PURE__ */ a(
                  rr,
                  {
                    className: "w-4 h-4 ml-auto",
                    style: { alignSelf: "center" }
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ N(F, { children: [
            /* @__PURE__ */ a("div", { className: "w-48" }),
            /* @__PURE__ */ a(
              He,
              {
                options: h,
                onSelect: (g) => {
                  r(g.value), w(!1);
                },
                inputRef: p,
                OptionRenderer: ({ isBlank: g, ...v }) => g ? /* @__PURE__ */ a(ui, { tableConfiguration: s, ...v }) : /* @__PURE__ */ a(me, { ...v }),
                placeholder: "Search for an option...",
                value: d,
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
function ls({ data: e, setData: t, focusState: n, isViewOnly: r }) {
  const [o, l] = B(null), i = W(() => e || "", [e]);
  function c(u) {
    u.preventDefault(), t(u.target.value);
  }
  return q(() => {
    o && (o.focus(), o.setSelectionRange(i.length + 1, i.length + 1), o.scrollLeft = o.scrollWidth);
  }, [o]), /* @__PURE__ */ N(G, { children: [
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
function ss({ ...e }) {
  return /* @__PURE__ */ N(
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
function cs({ ...e }) {
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
function as({ data: e, setData: t, focusState: n, isViewOnly: r }) {
  const [o, l] = B(null), i = W(() => e || "", [e]), c = W(() => {
    try {
      const s = new URL(e);
      return e;
    } catch {
      return "//" + e;
    }
  }, [e]);
  function u(s) {
    s.preventDefault(), t(s.target.value);
  }
  return q(() => {
    o && (o.focus(), o.setSelectionRange(i.length + 1, i.length + 1), o.scrollLeft = o.scrollWidth);
  }, [o]), /* @__PURE__ */ N(G, { children: [
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
        ref: l,
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
function Xt({ checked: e, toggle: t, isViewOnly: n }) {
  return /* @__PURE__ */ N("div", { children: [
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
function us({ data: e, setData: t, focusState: n, isViewOnly: r }) {
  const o = W(() => e || !1, [e]);
  return /* @__PURE__ */ a(G, { children: /* @__PURE__ */ a("span", { className: "flex items-center justify-center p-1.5", children: /* @__PURE__ */ a(Xt, { checked: o, toggle: () => t(!o), isViewOnly: r }) }) });
}
function ds({ rowData: e, formula: t }) {
  return /* @__PURE__ */ a(G, { children: /* @__PURE__ */ a("div", { className: "p-1 flex items-center cursor-default w-full", children: /* @__PURE__ */ a("div", { className: "truncate", children: t && typeof t == "function" && t(e) }) }) });
}
function fs({ ...e }) {
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
const Or = [
  {
    type: "text",
    cell: ls,
    icon: cs,
    name: "Single-Line Text"
  },
  {
    type: "longText",
    cell: ts,
    icon: ss,
    name: "Long Text"
  },
  {
    type: "number",
    cell: os,
    icon: Uo,
    name: "Number"
  },
  {
    type: "select",
    cell: is,
    icon: Xo,
    name: "Select"
  },
  {
    type: "date",
    cell: Ql,
    icon: jo,
    name: "Date"
  },
  {
    type: "multiSelect",
    cell: rs,
    icon: zo,
    name: "Multiple Select"
  },
  {
    type: "url",
    cell: as,
    icon: Zo,
    name: "URL"
  },
  {
    type: "checkbox",
    cell: us,
    icon: Vo,
    name: "Checkbox"
  },
  {
    type: "formula",
    cell: ds,
    icon: fs,
    name: "Formula"
  }
];
function Qe(e) {
  const [t] = S(ie);
  return [...Or, ...t.extraColumnTypes].find((n) => n.type === e);
}
function ms() {
  return Or;
}
const hs = et.memo(ps);
function ps({ rowId: e, colId: t, data: n, rowData: r, setData: o }) {
  const [l, i] = B(""), c = he(null), u = W(
    () => ot(e, t),
    [e, t]
  ), [s, d] = S(u), f = W(() => we(t), [t]), [p, h] = S(f), [x] = S(ie), k = p.type === "custom" ? p.renderer : Qe(p.type).cell, w = W(
    () => Io(e, t),
    [e, t]
  ), [, b] = S(w);
  function g(C) {
    c.current && !c.current.contains(C.target) && d("none");
  }
  function v(C) {
    if (!c.current || C.target !== c.current) {
      C.code === "Escape" && d("focused");
      return;
    }
    C.code === "ArrowUp" ? (C.stopPropagation(), C.preventDefault(), b("up")) : C.code === "ArrowDown" ? (C.stopPropagation(), C.preventDefault(), b("down")) : C.code === "ArrowLeft" ? (C.stopPropagation(), C.preventDefault(), b("left")) : C.code === "ArrowRight" ? (C.stopPropagation(), C.preventDefault(), b("right")) : C.code === "Enter" ? (d("editing"), C.stopPropagation(), C.preventDefault()) : C.code === "Escape" && d("none");
  }
  function y(C) {
    c.current && C.target === c.current && d("focused");
  }
  function R(C) {
    C.stopPropagation(), !p.isViewOnly && d("editing");
  }
  return q(() => s === "focused" ? (document == null || document.addEventListener("mousedown", g), c.current && c.current.focus(), () => {
    document == null || document.removeEventListener("mousedown", g);
  }) : s === "editing" ? (document == null || document.addEventListener("mousedown", g), () => {
    document == null || document.removeEventListener("mousedown", g);
  }) : s === "none" ? (c.current && c.current.blur(), () => {
  }) : () => {
  }, [s]), /* @__PURE__ */ a(
    "div",
    {
      className: "relative p-0 border-r bg-content focus:outline-none",
      style: { width: p.width },
      ref: c,
      onClick: y,
      onFocus: y,
      onDoubleClick: R,
      tabIndex: 0,
      onKeyDown: v,
      role: "gridcell",
      children: /* @__PURE__ */ N(
        "div",
        {
          className: U(
            "w-full rounded-sm min-h-full focus:outline-none",
            (s === "focused" || s === "editing") && "ring-2 ring-blue-500 absolute top-0 z-10"
          ),
          children: [
            /* @__PURE__ */ a(
              k,
              {
                rowId: e,
                colId: t,
                initData: n,
                data: n,
                options: p.options,
                updateColumn: h,
                setError: i,
                focus: s,
                focusState: s,
                setFocus: d,
                setData: o,
                showOptionSearch: p.showOptionSearch,
                isViewOnly: p.isViewOnly,
                rowData: r,
                formula: p.formula,
                columnConfiguration: p.configuration,
                tableConfiguration: x
              }
            ),
            s === "editing" && l && /* @__PURE__ */ a("div", { className: "text-xs p-1.5 py-2", children: l })
          ]
        }
      )
    }
  );
}
function vs(e, t) {
  if (e == null || e === "")
    return "(empty)";
  switch (t.type) {
    case "select": {
      const n = t.options.find((r) => r.value === e);
      return /* @__PURE__ */ a(me, { color: n.color, name: n.name });
    }
    case "date":
      return Fe(new Date(Date.parse(e)));
    default:
      return e;
  }
}
function gs({ groupVal: e }) {
  const [t] = S(Le), n = W(
    () => {
      var i;
      return we(((i = t[0]) == null ? void 0 : i.columnId) || "");
    },
    [t]
  ), [r] = S(n), [o, l] = S(Vt);
  return /* @__PURE__ */ N(
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
            children: /* @__PURE__ */ a(Ho, { className: "w-4 h-4" })
          }
        ),
        /* @__PURE__ */ N("div", { className: "h-full p-1.5", children: [
          /* @__PURE__ */ a("div", { className: "text-xs tracking-wider uppercase font-medium text-secondary", children: r.name }),
          /* @__PURE__ */ a("div", { className: "flex mt-1", children: vs(e, r) })
        ] })
      ]
    }
  );
}
function ws({ groupVal: e }) {
  const [t] = S(Le), [, n] = S(qn);
  function r(o) {
    o.preventDefault();
    const l = { data: {} };
    t.length > 0 && (l[t[0].columnId] = e), n({ id: tt(), ...l });
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
      children: /* @__PURE__ */ a("div", { className: "flex items-center justify-center", style: { width: 63 }, children: /* @__PURE__ */ a(nr, { className: "w-4 h-4" }) })
    }
  );
}
function bs({ rowId: e, first: t, last: n, groupVal: r }) {
  const [o] = S(Le), [l] = S(Vt), [i] = S(Oo), [c] = S(ie);
  return /* @__PURE__ */ N(
    "div",
    {
      className: U(
        t && o.length > 0 && "mt-8",
        o.length > 0 && "ml-4"
      ),
      style: { width: i },
      children: [
        o.length > 0 && t && /* @__PURE__ */ a(gs, { groupVal: r }),
        !l[r] && /* @__PURE__ */ N(G, { children: [
          /* @__PURE__ */ a("div", { className: U(o.length > 0 && "border-l"), children: /* @__PURE__ */ a(xs, { rowId: e }) }),
          c.addRow.enabled && c.addRow.body && n && /* @__PURE__ */ a(ws, { groupVal: r }),
          " "
        ] })
      ]
    }
  );
}
const xs = et.memo(ys);
function ys({ rowId: e }) {
  const t = W(() => Zn(e), [e]), [n, r] = S(t), [o] = S(fe), [l] = S(Wt), [i] = S(ie), c = W(
    () => (u) => (s) => {
      r({ [u]: s });
    },
    [r]
  );
  return /* @__PURE__ */ N("div", { className: U("flex relative border-b"), style: { height: l }, children: [
    i.selectRow.enabled && /* @__PURE__ */ a(
      "div",
      {
        className: U(
          "border-r bg-content flex items-center justify-center"
        ),
        style: { width: 64 },
        children: /* @__PURE__ */ a(
          Xt,
          {
            checked: n.isSelected || !1,
            toggle: () => r((u) => ({ isSelected: !u.isSelected }))
          }
        )
      }
    ),
    o.map((u) => /* @__PURE__ */ a(
      hs,
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
const Rs = Pn(({ handleScroll: e }, t) => {
  const [n] = S(Ie), [r] = S(ie);
  return /* @__PURE__ */ a(
    "div",
    {
      className: "h-[calc(100%-65px)] overflow-auto border-b bg-background",
      onScroll: e,
      ref: t,
      children: /* @__PURE__ */ N("div", { className: "flex flex-row", children: [
        /* @__PURE__ */ N("div", { className: "flex flex-col", children: [
          n.map((o, l) => /* @__PURE__ */ a(
            bs,
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
}), Ar = [
  {
    type: "empty",
    name: "Empty",
    atomFactory: (e) => an(e, (t) => Re(t))
  },
  {
    type: "filled",
    name: "Filled",
    atomFactory: (e) => an(e, (t) => !Re(t))
  },
  {
    type: "unique",
    name: "Unique",
    atomFactory: po
  }
];
function Ln(e) {
  return Ar.find((t) => t.type === e);
}
function Cs() {
  return Ar.map((e) => e.type);
}
const Es = Pn(({}, e) => {
  const [t] = S(fe), [n] = S(Le);
  return /* @__PURE__ */ a("div", { className: "bg-header h-8", children: /* @__PURE__ */ N("div", { className: "h-8 flex relative", ref: e, children: [
    /* @__PURE__ */ a(
      "div",
      {
        style: { width: 64 },
        className: U(n.length > 0 && "ml-4", "shrink-0 border-r")
      }
    ),
    t.map((r) => /* @__PURE__ */ a(Ns, { colId: r }, r)),
    /* @__PURE__ */ a("div", { className: "w-48 grow shrink-0" })
  ] }) });
});
function Ns({ colId: e }) {
  const t = W(() => we(e), [e]), [n, r] = S(t), o = Ln(n.summary), l = W(
    () => o ? o.atomFactory(n.id) : D(""),
    [o, n.id]
  ), [i] = S(l), c = Cs(), [u, s] = B(!1);
  function d(f) {
    r({ summary: f }), s(!1);
  }
  return /* @__PURE__ */ N(
    le,
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
            children: o ? /* @__PURE__ */ N(G, { children: [
              /* @__PURE__ */ a("span", { className: "text-xs text-secondary", children: o.name }),
              /* @__PURE__ */ a("span", { className: "ml-1", children: i })
            ] }) : /* @__PURE__ */ N(G, { children: [
              /* @__PURE__ */ a(rr, { className: "w-4 h-4 hidden group-hover:block" }),
              /* @__PURE__ */ a("span", { className: "hidden group-hover:block text-xs ml-1", children: "Summary" })
            ] })
          }
        ),
        /* @__PURE__ */ N(F, { children: [
          /* @__PURE__ */ a("div", { className: "w-32" }),
          /* @__PURE__ */ N(F.Section, { children: [
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
function ks({
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
const Ss = /* @__PURE__ */ m.forwardRef(ks);
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
    d: "M11.47 2.47a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 1 1-1.06 1.06l-6.22-6.22V21a.75.75 0 0 1-1.5 0V4.81l-6.22 6.22a.75.75 0 1 1-1.06-1.06l7.5-7.5Z",
    clipRule: "evenodd"
  }));
}
const As = /* @__PURE__ */ m.forwardRef(Os);
function Ls({
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
const Dn = /* @__PURE__ */ m.forwardRef(Ls);
function Ds({
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
const Jt = /* @__PURE__ */ m.forwardRef(Ds);
function Ms({
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
const Ts = /* @__PURE__ */ m.forwardRef(Ms);
function Ps({
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
const dt = /* @__PURE__ */ m.forwardRef(Ps);
function Is({ colId: e, supportedTypes: t }) {
  const [n] = S(W(() => we(e), [e])), [, r] = S(Po), o = W(() => rt(e), [e]), [, l] = S(o);
  function i(c, u) {
    c.preventDefault(), r({ colId: n.id, type: u }), l(!1);
  }
  return /* @__PURE__ */ a(F, { children: /* @__PURE__ */ N(F.Section, { children: [
    /* @__PURE__ */ a("div", { className: "w-56" }),
    /* @__PURE__ */ a(F.Section.Item, { children: /* @__PURE__ */ a("span", { className: "uppercase font-medium text-secondary text-xs", children: "Property Type" }) }),
    t.map((c) => /* @__PURE__ */ N(
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
function It({ ...e }) {
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
function Fs({
  colId: e,
  sortCallback: t,
  filterCallback: n,
  deleteCallback: r
}) {
  const [o, l] = S(W(() => we(e), [e])), i = he(), c = o.type === "custom" ? o.icon : Qe(o.type).icon, u = o.type === "custom" ? "Custom" : Qe(o.type).name, [, s] = S(Yn), [, d] = S(Gn), f = W(() => rt(e), [e]), [, p] = S(f), [h] = S(ie), x = W(() => [...ms(), ...h.extraColumnTypes], []);
  q(() => {
    i.current && i.current.select();
  }, [i]);
  function k(E) {
    E.preventDefault(), l({ name: E.target.value });
  }
  function w(E) {
    E.code;
  }
  function b(E) {
    E.preventDefault(), r(o), p(!1);
  }
  function g(E) {
    E.preventDefault(), E.stopPropagation(), t([{ columnId: o.id, order: "asc" }]), s(!0), p(!1);
  }
  function v(E) {
    E.preventDefault(), E.stopPropagation(), t([{ columnId: o.id, order: "desc" }]), s(!0), p(!1);
  }
  function y(E) {
    E.preventDefault(), E.stopPropagation(), n([{ columnId: o.id, type: o.type === "number" ? "equals" : "contains", value: "" }]), d(!0), p(!1);
  }
  const R = [
    [
      {
        name: "Sort Ascending",
        icon: As,
        action: g,
        enabled: h.sorting.enabled
      },
      {
        name: "Sort Descending",
        icon: Ss,
        action: v,
        enabled: h.sorting.enabled
      },
      {
        name: "Filter",
        icon: It,
        action: y,
        enabled: h.filtering.enabled
      }
    ],
    [
      {
        name: "Delete",
        icon: Ts,
        action: b,
        disabled: o.is_primary === "true" || o.is_primary === !0,
        enabled: h.deleteColumns.enabled
      }
    ]
  ], [C, O] = B(!1), [A, P] = B(null);
  if (C)
    return /* @__PURE__ */ a(Is, { colId: e, supportedTypes: x });
  if (A !== null) {
    const E = h.extraColumnHeaderPopupActions[A];
    return /* @__PURE__ */ a(E.popup, { column: o, setColumn: l, close: () => p(!1) });
  }
  return /* @__PURE__ */ N(F, { children: [
    /* @__PURE__ */ a("div", { className: "w-56" }),
    /* @__PURE__ */ N(F.Section, { children: [
      /* @__PURE__ */ a(F.Section.Item, { children: /* @__PURE__ */ a(
        "input",
        {
          value: o.name,
          onChange: k,
          ref: i,
          onKeyDown: w,
          className: "rs-input focus:outline-none focus:ring rounded rounded-2 p-1 border w-full mb-2"
        }
      ) }),
      /* @__PURE__ */ a(F.Section.Item, { children: /* @__PURE__ */ a("span", { className: "uppercase font-medium text-secondary text-xs", children: "Property Type" }) }),
      /* @__PURE__ */ N(F.Section.Button, { onClick: () => O(!0), children: [
        c && /* @__PURE__ */ a(c, { className: "w-4 h-4 mr-2" }),
        u
      ] }),
      h.extraColumnHeaderPopupActions.map((E, M) => ({ popupAction: E, index: M })).filter(({ popupAction: E }) => E.section === "main").map(({ popupAction: E, index: M }) => /* @__PURE__ */ a(E.menuItem, { column: o, showPopup: () => {
        P(M);
      } }, M))
    ] }),
    R.map(
      (E, M) => E.findIndex((L) => L.enabled === !0) !== -1 && /* @__PURE__ */ N(F.Section, { children: [
        E.map(
          (L) => L.enabled && /* @__PURE__ */ N(
            F.Section.Button,
            {
              onClick: L.action,
              disabled: L.disabled,
              children: [
                /* @__PURE__ */ a(L.icon, { className: "w-4 h-4 mr-2" }),
                /* @__PURE__ */ a("span", { children: L.name })
              ]
            },
            L.name
          )
        ),
        h.extraColumnHeaderPopupActions.filter((L) => L.section === "actions" + (M + 1)).map((L, _) => /* @__PURE__ */ a(L.menuItem, { column: o, showPopup: () => {
          P(_);
        } }, _))
      ] }, E[0].name)
    )
  ] });
}
function js({
  colId: e,
  deleteCallback: t,
  sortCallback: n,
  filterCallback: r
}) {
  const [o, l] = S(W(() => we(e), [e])), i = o.type === "custom" ? o.icon : Qe(o.type).icon, [c, u] = B(o.width), [s, d] = B(!1), f = W(() => rt(e), [e]), [p, h] = S(f), [x] = S(ie);
  function k(w) {
    w.preventDefault();
    const b = w.pageX, g = c;
    d(!0);
    function v(y) {
      const R = Math.max(
        128,
        g + y.pageX - b
      );
      u(R), l({ width: R });
    }
    window.addEventListener("mousemove", v), window.addEventListener("mouseup", () => {
      window.removeEventListener("mousemove", v), d(!1);
    });
  }
  return /* @__PURE__ */ N("div", { className: "relative", children: [
    /* @__PURE__ */ N(
      le,
      {
        isOpen: x.editColumns.enabled && o.isEditable && p && o.type !== "custom",
        setIsOpen: h,
        portal: !0,
        children: [
          /* @__PURE__ */ N(
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
            Fs,
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
        onMouseDown: k,
        role: "none"
      }
    )
  ] });
}
const _s = et.forwardRef((e, t) => {
  const [n] = S(fe), [r] = S(Do), o = jt(Mo), [l] = S(Ht), [i] = S(Le), [, c] = S(ko), [, u] = S(Xn), [, s] = S(Qn), d = Y(
    (w) => {
      s({ filtering: w });
    },
    [s]
  ), f = Y(
    (w) => {
      u({ sorting: w });
    },
    [u]
  ), [, p] = S(So), h = Y((w) => {
    if (l.find((b) => b.columnId === w.id)) {
      const b = l.filter((g) => g.columnId !== w.id);
      f(b);
    }
    p({ id: w.id });
  });
  function x(w) {
    w.preventDefault(), c({
      id: tt(),
      name: `Column-${Et()}`,
      type: "text",
      width: 192,
      position: n.length,
      isVisible: !0,
      isEditable: !0
    });
  }
  const [k] = S(ie);
  return /* @__PURE__ */ a("div", { className: "flex bg-header border-b z-10", children: /* @__PURE__ */ N("div", { className: "flex relative h-8", ref: t, children: [
    /* @__PURE__ */ N(
      "div",
      {
        className: U(
          "h-8 text-sm inline-flex flex-row",
          i.length > 0 && "ml-[17px]"
        ),
        children: [
          k.selectRow.enabled && /* @__PURE__ */ a(
            "div",
            {
              className: "border-r px-4 flex items-center justify-center h-8",
              style: { width: 64 },
              children: /* @__PURE__ */ a(Xt, { checked: r, toggle: o })
            }
          ),
          n.map((w) => /* @__PURE__ */ a(
            js,
            {
              colId: w,
              sortCallback: f,
              filterCallback: d,
              deleteCallback: h
            },
            w
          )),
          k.addColumn.enabled && /* @__PURE__ */ a(
            "div",
            {
              onClick: x,
              className: "rs-btn h-8 p-1 cursor-pointer border-r hover:bg-hover-light font-normal w-16 flex items-center justify-center",
              "aria-label": "add-column",
              onKeyDown: (w) => {
                w.code === "Enter" && x(w);
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
function Vs(e, t) {
  let n = null;
  return (...r) => {
    window.clearTimeout(n), n = window.setTimeout(() => {
      e.apply(null, r);
    }, t);
  };
}
const Bs = [
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
  options: e = Bs,
  value: t = {},
  onSelect: n
}) {
  const [r, o] = B(!1), [l, i] = B(t), c = e.find((s) => s.value === l.value);
  function u(s) {
    i(s), o(!1), n == null || n(s);
  }
  return /* @__PURE__ */ a("div", { className: "w-full relative", children: /* @__PURE__ */ N(
    le,
    {
      isOpen: r,
      setIsOpen: o,
      offset: 4,
      portal: !0,
      children: [
        /* @__PURE__ */ N("div", { className: "rs-btn flex flex-row relative w-full border rounded p-1 pl-2 items-center hover:bg-hover focus:outline-none cursor-default", children: [
          /* @__PURE__ */ a("div", { className: "text-ellipsis flex-grow text-left whitespace-nowrap overflow-hidden", children: l.name ? /* @__PURE__ */ a("span", { children: l.name }) : /* @__PURE__ */ a("span", { className: "text-secondary", children: "Select" }) }),
          /* @__PURE__ */ a(si, { className: "w-4 h-4 duration-100 ml-auto" })
        ] }),
        /* @__PURE__ */ a("div", { className: "min-w-full w-max focus:outline-none", children: /* @__PURE__ */ N(F, { children: [
          /* @__PURE__ */ a("div", { className: "w-48" }),
          /* @__PURE__ */ a(F.Section, { children: e.map((s) => /* @__PURE__ */ N(
            F.Section.Button,
            {
              onClick: () => {
                u(s);
              },
              children: [
                /* @__PURE__ */ a("span", { children: s.name }),
                /* @__PURE__ */ a("span", { className: "ml-auto", children: c.value === s.value && /* @__PURE__ */ a(Kt, { className: "w-4 h-4" }) })
              ]
            },
            s.value
          )) })
        ] }) })
      ]
    }
  ) });
}
function Hs({ columns: e, filter: t, setFilter: n }) {
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
  q(() => {
    r && r.focus();
  }, [r]);
  const c = W(
    () => Vs((s, d) => {
      n((f) => {
        const p = f.findIndex((h) => h.id === s.id);
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
  function u(s) {
    var d;
    return (d = e.find((f) => f.id === s)) == null ? void 0 : d.type;
  }
  return /* @__PURE__ */ N(F, { children: [
    /* @__PURE__ */ a("div", { className: "w-56" }),
    t.length > 0 ? /* @__PURE__ */ N(F.Section, { children: [
      /* @__PURE__ */ a("h3", { className: "text-sm mb-3 px-3 font-medium", children: "Filter By" }),
      /* @__PURE__ */ a("div", { className: "px-3 flex flex-col space-y-3", children: t.map((s) => /* @__PURE__ */ N(
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
                  value: s.columnId,
                  name: e.find((d) => d.id === s.columnId).name
                },
                onSelect: (d) => n((f) => {
                  const p = f.findIndex((h) => h.id === s.id);
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
                options: u(s.columnId) === "number" ? i : l,
                value: u(s.columnId) === "number" ? i.find(
                  (d) => d.value === s.type
                ) : l.find((d) => d.value === s.type),
                onSelect: (d) => n((f) => {
                  const p = f.findIndex((h) => h.id === s.id);
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
                defaultValue: s.value,
                placeholder: "Type a value...",
                onChange: (d) => c(s, d.target.value)
              }
            ) }),
            /* @__PURE__ */ a(
              "div",
              {
                className: "rs-btn flex items-center justify-center hover:bg-hover-light px-2 rounded hover:cursor-pointer",
                onClick: () => n((d) => d.filter((f) => f.id !== s.id)),
                "aria-label": "cancel-filter",
                children: /* @__PURE__ */ a(dt, { className: "h-4 w-4" })
              }
            )
          ]
        },
        `filter-${s.columnId}`
      )) }),
      /* @__PURE__ */ a("div", { className: "py-2 px-3", children: /* @__PURE__ */ N(
        "button",
        {
          className: "rs-btn flex items-center justify-center bg-transparent rounded gap-x-1 h-6 font-thin hover:cursor-pointer text-sm p-0",
          onClick: () => n((s) => [
            ...s,
            {
              id: Et(),
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
      He,
      {
        options: e.map((s) => ({
          value: s.id,
          name: s.name
        })),
        onSelect: (s) => n([
          {
            id: Et(),
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
function $s({ setFilter: e }) {
  const [t] = S(Jn), [n] = S(yo), [r, o] = S(Gn);
  return /* @__PURE__ */ N(
    le,
    {
      isOpen: r,
      setIsOpen: o,
      offset: 4,
      portal: !0,
      portalId: "table",
      children: [
        Object.keys(t).length > 0 ? /* @__PURE__ */ N("div", { className: "rs-btn h-8 hover:ring-2 hover:ring-black/10 hover:ring-inset bg-indigo-200 px-3 rounded text-sm flex row items-center cursor-default text-dark", children: [
          /* @__PURE__ */ a(It, { className: "w-4 h-4 mr-1" }),
          /* @__PURE__ */ a("span", { children: `Filtered by ${Object.keys(t).length} field` })
        ] }) : /* @__PURE__ */ N(
          "div",
          {
            className: U(
              "rs-btn h-8 hover:bg-hover px-3 rounded text-sm flex flex-row items-center cursor-default",
              r && "bg-hover"
            ),
            children: [
              /* @__PURE__ */ a(It, { className: "w-4 h-4 mr-1" }),
              /* @__PURE__ */ a("span", { children: "Filter data" })
            ]
          }
        ),
        /* @__PURE__ */ a(Hs, { columns: n, filter: t, setFilter: e })
      ]
    }
  );
}
function Mn({ ...e }) {
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
function Ws({ columns: e, grouping: t, setGroup: n }) {
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
  return q(() => {
    r && r.focus();
  }, [r]), /* @__PURE__ */ N(F, { children: [
    /* @__PURE__ */ a("div", { className: "w-56" }),
    t.length > 0 ? /* @__PURE__ */ N(F.Section, { children: [
      /* @__PURE__ */ a("h3", { className: "text-sm mb-3 px-3 font-medium", children: "Group By" }),
      /* @__PURE__ */ a("div", { className: "px-3", children: t.map((i) => /* @__PURE__ */ N(
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
                children: /* @__PURE__ */ a(dt, { className: "h-4 w-4" })
              }
            )
          ]
        },
        `grouping-${i.columnId}`
      )) })
    ] }) : /* @__PURE__ */ a(
      He,
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
function Us({ grouping: e = [], setGroup: t }) {
  const [n, r] = B(!1), [o] = S(zn);
  return /* @__PURE__ */ N(
    le,
    {
      isOpen: n,
      setIsOpen: r,
      offset: 4,
      portal: !0,
      portalId: "table",
      children: [
        e.length > 0 ? /* @__PURE__ */ N("div", { className: "rs-btn h-8 hover:ring-2 hover:ring-black/10 hover:ring-inset bg-purple-200 px-3 rounded text-sm flex row items-center cursor-default text-dark", children: [
          /* @__PURE__ */ a(Mn, { className: "w-4 h-4 mr-1" }),
          /* @__PURE__ */ a("span", { children: "Grouped by 1 field" })
        ] }) : /* @__PURE__ */ N(
          "div",
          {
            className: U(
              "rs-btn hover:bg-hover px-3 rounded flex flex-row items-center h-8 cursor-default",
              n && "bg-hover"
            ),
            children: [
              /* @__PURE__ */ a(Mn, { className: "w-4 h-4 mr-1" }),
              /* @__PURE__ */ a("span", { children: "Group" })
            ]
          }
        ),
        /* @__PURE__ */ a(Ws, { columns: o, grouping: e, setGroup: t })
      ]
    }
  );
}
function Ks({ value: e, setValue: t }) {
  return /* @__PURE__ */ N(G, { children: [
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
function Zs({ colId: e }) {
  const [t, n] = S(W(() => we(e), [e]));
  return /* @__PURE__ */ N(F.Section.Item, { children: [
    /* @__PURE__ */ a(
      Ks,
      {
        value: t.isVisible,
        setValue: (r) => n({ isVisible: r })
      }
    ),
    /* @__PURE__ */ a("span", { className: "ml-2", children: t.name })
  ] }, t.id);
}
function qs({ setColumnVisibility: e }) {
  const [t] = S(Ro);
  return /* @__PURE__ */ N(F, { children: [
    /* @__PURE__ */ a("div", { className: "w-48" }),
    /* @__PURE__ */ a(F.Section, { children: t.map((n) => /* @__PURE__ */ a(Zs, { colId: n })) })
  ] });
}
function zs({ setColumnVisibility: e }) {
  const [t, n] = B(!1), [r] = S(Co);
  return /* @__PURE__ */ N(le, { isOpen: t, setIsOpen: n, offset: 4, portal: !0, children: [
    r > 0 ? /* @__PURE__ */ N("div", { className: "rs-btn h-8 hover:ring-2 hover:ring-black/10 hover:ring-inset bg-green-200 px-3 rounded text-sm flex row items-center focus:outline-none cursor-default text-dark", children: [
      /* @__PURE__ */ a(un, { className: "w-4 h-4 mr-1" }),
      /* @__PURE__ */ a("span", { children: `${r} hidden fields` })
    ] }) : /* @__PURE__ */ N(
      "div",
      {
        className: U(
          "rs-btn hover:bg-hover px-3 rounded flex flex-row items-center h-8 focus:outline-none cursor-default",
          t && "bg-hover"
        ),
        children: [
          /* @__PURE__ */ a(un, { className: "w-4 h-4 mr-1" }),
          /* @__PURE__ */ a("span", { children: "Hide fields" })
        ]
      }
    ),
    /* @__PURE__ */ a(qs, { setColumnVisibility: e })
  ] });
}
function Ys({ ...e }) {
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
          d: "M2 20H14M20 4V20M20 4L18 6M20 4L22 6M20 20L18 18M20 20L22 18M14 14.5H2M2 9H14V4H2V9Z",
          strokeLinecap: "round",
          strokeLinejoin: "round"
        }
      )
    }
  );
}
function Xs({ ...e }) {
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
          d: "M20 4V20M20 4L18 6M20 4L22 6M20 20L18 18M20 20L22 18M2 4V20H14V4H2Z",
          strokeLinecap: "round",
          strokeLinejoin: "round"
        }
      )
    }
  );
}
const Lr = [
  {
    value: 32,
    name: "Short",
    icon: Ys
  },
  {
    value: 64,
    name: "Medium",
    icon: Gs
  },
  {
    value: 96,
    name: "Tall",
    icon: Xs
  },
  {
    value: 128,
    name: "Extra Tall",
    icon: Js
  }
];
function Dr(e) {
  return Lr.find((t) => t.value === e);
}
function Qs() {
  return Lr.map((e) => e.value);
}
function ec({ height: e, setHeight: t }) {
  const n = Qs();
  return /* @__PURE__ */ N(F, { children: [
    /* @__PURE__ */ a("div", { className: "w-48" }),
    /* @__PURE__ */ a(F.Section, { children: n.map((r) => {
      const o = Dr(r);
      return /* @__PURE__ */ N(
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
  const [n, r] = B(!1), o = Dr(e);
  return /* @__PURE__ */ N(
    le,
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
  return /* @__PURE__ */ N(
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
  const [n, r] = B(null), [o] = S(zn), l = [
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
  }, [n]), /* @__PURE__ */ N(F, { children: [
    /* @__PURE__ */ a("div", { className: "w-56" }),
    e.length > 0 ? /* @__PURE__ */ N(F.Section, { children: [
      /* @__PURE__ */ a("h3", { className: "text-sm mb-3 px-3 font-medium", children: "Sort By" }),
      /* @__PURE__ */ a("div", { className: "px-3", children: e.map((i) => /* @__PURE__ */ N(
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
                children: /* @__PURE__ */ a(dt, { className: "h-4 w-4" })
              }
            )
          ]
        },
        `sort-${i.columnId}`
      )) })
    ] }) : /* @__PURE__ */ a(
      He,
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
  const [t] = S(Ht), [n, r] = S(Yn);
  return /* @__PURE__ */ N(
    le,
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
            Icon: Dn,
            text: `Sorted by ${Object.keys(t).length} field`,
            customColor: "bg-orange-200"
          }
        ) : /* @__PURE__ */ N(
          "div",
          {
            className: U(
              "rs-btn hover:bg-hover px-3 rounded flex flex-row items-center h-8 cursor-default",
              n && "bg-hover"
            ),
            children: [
              /* @__PURE__ */ a(Dn, { className: "w-4 h-4 mr-1" }),
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
  const [e] = S(xo), [t] = S(Jn), [n] = S(Ht), [r] = S(Le), [o] = S(Wt), [l] = S(bo), [, i] = S(Qn), c = jt(To), [, u] = S(vo), [, s] = S(qn), [, d] = S(go), [f] = S(ie), p = Y((R) => {
    i({ filtering: R });
  }, []), h = Y((R) => {
    R.preventDefault(), u();
  }, []);
  function x(R) {
    s({ id: tt() });
  }
  const [, k] = S(Xn), w = Y((R) => {
    k({ sorting: R });
  }, []), [, b] = S(Lo), g = Y((R) => {
    b({ rowHeight: R });
  }, []), [, v] = S(Ao), y = Y((R) => {
    v({ grouping: R });
  }, []);
  return /* @__PURE__ */ a(
    "div",
    {
      className: "w-full bg-content py-2 text-sm overflow-y-hidden h-12 relative border-b",
      id: "toolbar",
      children: /* @__PURE__ */ N("div", { className: "flex flex-row space-x-2 px-3 items-center whitespace-nowrap h-full", children: [
        /* @__PURE__ */ N("div", { className: "items-center flex w-20 justify-center", children: [
          l > 0 ? l : "No",
          " row",
          l !== 1 && "s"
        ] }),
        e > 0 && /* @__PURE__ */ N("div", { className: "bg-header flex flex-row rounded items-center h-8 cursor-default", children: [
          /* @__PURE__ */ N("div", { className: "text-sm px-2 rounded-l", children: [
            e,
            " row",
            e !== 1 && "s",
            " selected"
          ] }),
          /* @__PURE__ */ a("div", { className: "bg-content h-4 w-px last:hidden" }),
          /* @__PURE__ */ N(
            "div",
            {
              className: "rs-btn self-stretch hover:bg-hover-light px-2 text-sm flex flex-row items-center",
              onClick: () => c(),
              children: [
                /* @__PURE__ */ a(dt, { className: "w-4 h-4 mr-1" }),
                /* @__PURE__ */ a("span", { children: "Cancel" })
              ]
            }
          ),
          /* @__PURE__ */ a("div", { className: "bg-content h-4 w-px last:hidden" }),
          /* @__PURE__ */ N(
            "div",
            {
              className: "rs-btn self-stretch hover:bg-hover-light px-2 rounded-r text-sm flex flex-row items-center",
              onClick: h,
              children: [
                /* @__PURE__ */ a(Qo, { className: "w-4 h-4 mr-1" }),
                /* @__PURE__ */ a("span", { children: "Delete" })
              ]
            }
          ),
          /* @__PURE__ */ a("div", { className: "bg-content h-4 w-px last:hidden" }),
          f.rowSelectionButtons.map((R) => /* @__PURE__ */ N(G, { children: [
            /* @__PURE__ */ a(
              "div",
              {
                className: "rs-btn self-stretch hover:bg-hover-light px-2 rounded-r text-sm flex flex-row items-center",
                onClick: () => d({
                  handler: R.handler
                }),
                children: R.body
              }
            ),
            /* @__PURE__ */ a("div", { className: "bg-content h-4 w-px last:hidden" })
          ] }))
        ] }),
        /* @__PURE__ */ a("div", { className: "h-4 border" }),
        f.addRow.enabled && f.addRow.toolbar && /* @__PURE__ */ N(
          "div",
          {
            className: "rs-btn hover:bg-hover px-3 rounded flex flex-row items-center h-8 focus:outline-none",
            onClick: x,
            children: [
              /* @__PURE__ */ a(Jt, { className: "w-4 h-4 mr-1" }),
              /* @__PURE__ */ a("span", { children: "New row" })
            ]
          }
        ),
        f.hideFields.enabled && /* @__PURE__ */ a(zs, {}),
        f.filtering.enabled && /* @__PURE__ */ a($s, { filter: t, setFilter: p }),
        f.grouping.enabled && /* @__PURE__ */ a(Us, { grouping: r, setGroup: y }),
        f.sorting.enabled && /* @__PURE__ */ a(oc, { sort: n, setSort: w }),
        f.rowHeight.enabled && /* @__PURE__ */ a(tc, { height: o, setHeight: g }),
        f.extraToolbarItems.map((R, C) => /* @__PURE__ */ a(R.render, {}, C))
      ] })
    }
  );
}
const lc = {
  light: "",
  dark: "dark"
};
function sc() {
  const e = he(null), t = he(null), n = he(null), [r] = S(ie);
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
  const [o, l] = S(Kn);
  return q(() => {
    l(tt());
  }, []), /* @__PURE__ */ N(
    "div",
    {
      className: U(
        "h-full w-full relative rs-table text-sm text-primary overflow-hidden",
        lc[r.theme.color]
      ),
      id: o,
      children: [
        r.toolbar.enabled && /* @__PURE__ */ a(ic, {}),
        /* @__PURE__ */ N("div", { className: "h-[calc(100%-48px)] overflow-hidden", children: [
          /* @__PURE__ */ a(_s, { ref: e }),
          /* @__PURE__ */ a(Rs, { ref: n }),
          r.footer.enabled && /* @__PURE__ */ a(Es, { ref: t })
        ] })
      ]
    }
  );
}
function cc({ data: e, columns: t, onChange: n, config: r, children: o }) {
  return Jr([
    [No, t],
    [wo, e],
    [ho, { onChange: n }],
    [mo, r]
  ]), o;
}
function hc({
  data: e,
  columns: t,
  onChange: n = () => null,
  config: r = {},
  licenseKey: o
}) {
  return /* @__PURE__ */ a(qr, { children: /* @__PURE__ */ a(
    cc,
    {
      data: e,
      columns: t,
      onChange: n,
      config: r,
      children: /* @__PURE__ */ a(sc, {})
    }
  ) });
}
export {
  mc as EVALUATION_LICENSE,
  hc as default
};
