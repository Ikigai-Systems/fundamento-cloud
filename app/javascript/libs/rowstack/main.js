import "./main.css";
import { jsxs as E, jsx as a, Fragment as G } from "react/jsx-runtime";
import * as m from "react";
import et, { createContext as Tr, useRef as he, createElement as Pr, useCallback as Y, useContext as Ir, useReducer as Fr, useEffect as q, useDebugValue as jr, useState as B, useLayoutEffect as Tn, Children as Vr, useMemo as W, forwardRef as Pn } from "react";
import * as In from "react-dom";
const ne = { BASE_URL: "/", DEV: !1, MODE: "production", PROD: !0, SSR: !1 };
let _r = 0;
function M(e, t) {
  const n = `atom${++_r}`, r = {
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
const tn = (e, t) => e.unstable_is ? e.unstable_is(t) : t === e, ft = (e) => "init" in e, mt = (e) => !!e.write, Ke = /* @__PURE__ */ new WeakMap(), Ct = (e) => {
  var t;
  return Rt(e) && !((t = Ke.get(e)) != null && t[1]);
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
}, Rt = (e) => typeof (e == null ? void 0 : e.then) == "function", nn = (e) => "v" in e || "e" in e, $e = (e) => {
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
  n.d.set(r, o.n), Ct(n.v) && Fn(t, n.v, o), (l = o.m) == null || l.t.add(t), e && Ur(e, r, t);
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
  const l = (b, v, C) => {
    const w = "v" in v, S = v.v, O = Ct(v.v) ? v.v : null;
    if (Rt(C)) {
      Wr(C);
      for (const A of v.d.keys())
        Fn(b, C, e(A));
      v.v = C, delete v.e;
    } else
      v.v = C, delete v.e;
    (!w || !Object.is(S, v.v)) && (++v.n, O && $r(O, C));
  }, i = (b, v, C) => {
    var w;
    const S = e(v);
    if (nn(S) && (S.m && !(C != null && C.has(v)) || Array.from(S.d).every(
      ([L, V]) => (
        // Recursively, read the atom state of the dependency, and
        // check if the atom epoch number is unchanged
        i(b, L, C).n === V
      )
    )))
      return S;
    S.d.clear();
    let O = !0;
    const A = (L) => {
      if (tn(v, L)) {
        const _ = e(L);
        if (!nn(_))
          if (ft(L))
            l(L, _, L.init);
          else
            throw new Error("no atom init");
        return $e(_);
      }
      const V = i(b, L, C);
      if (O)
        rn(b, v, S, L, V);
      else {
        const _ = Ne();
        rn(_, v, S, L, V), h(_, v, S), be(_);
      }
      return $e(V);
    };
    let P, R;
    const D = {
      get signal() {
        return P || (P = new AbortController()), P.signal;
      },
      get setSelf() {
        return (ne ? "production" : void 0) !== "production" && !mt(v) && console.warn("setSelf function cannot be used with read-only atom"), !R && mt(v) && (R = (...L) => {
          if ((ne ? "production" : void 0) !== "production" && O && console.warn("setSelf function cannot be called in sync"), !O)
            return f(v, ...L);
        }), R;
      }
    };
    try {
      const L = t(v, A, D);
      if (l(v, S, L), Rt(L)) {
        (w = L.onCancel) == null || w.call(L, () => P == null ? void 0 : P.abort());
        const V = () => {
          if (S.m) {
            const _ = Ne();
            h(_, v, S), be(_);
          }
        };
        L.then(V, V);
      }
      return S;
    } catch (L) {
      return delete S.v, S.e = L, ++S.n, S;
    } finally {
      O = !1;
    }
  }, c = (b) => $e(i(void 0, b)), u = (b, v, C) => {
    var w, S;
    const O = /* @__PURE__ */ new Map();
    for (const A of ((w = C.m) == null ? void 0 : w.t) || [])
      O.set(A, e(A));
    for (const A of C.p)
      O.set(
        A,
        e(A)
      );
    return (S = Kr(b, v)) == null || S.forEach((A) => {
      O.set(A, e(A));
    }), O;
  }, s = (b, v, C) => {
    const w = [], S = /* @__PURE__ */ new Set(), O = (P, R) => {
      if (!S.has(P)) {
        S.add(P);
        for (const [D, L] of u(b, P, R))
          P !== D && O(D, L);
        w.push([P, R, R.n]);
      }
    };
    O(v, C);
    const A = /* @__PURE__ */ new Set([v]);
    for (let P = w.length - 1; P >= 0; --P) {
      const [R, D, L] = w[P];
      let V = !1;
      for (const _ of D.d.keys())
        if (_ !== R && A.has(_)) {
          V = !0;
          break;
        }
      V && (i(b, R, S), h(b, R, D), L !== D.n && (ht(b, R, D), A.add(R))), S.delete(R);
    }
  }, d = (b, v, ...C) => n(v, (A) => $e(i(b, A)), (A, ...P) => {
    const R = e(A);
    let D;
    if (tn(v, A)) {
      if (!ft(A))
        throw new Error("atom not writable");
      const L = "v" in R, V = R.v, _ = P[0];
      l(A, R, _), h(b, A, R), (!L || !Object.is(V, R.v)) && (ht(b, A, R), s(b, A, R));
    } else
      D = d(b, A, ...P);
    return be(b), D;
  }, ...C), f = (b, ...v) => {
    const C = Ne(), w = d(C, b, ...v);
    return be(C), w;
  }, h = (b, v, C) => {
    if (C.m && !Ct(C.v)) {
      for (const w of C.d.keys())
        C.m.d.has(w) || (p(b, w, e(w)).t.add(v), C.m.d.add(w));
      for (const w of C.m.d || [])
        if (!C.d.has(w)) {
          C.m.d.delete(w);
          const S = y(b, w, e(w));
          S == null || S.t.delete(v);
        }
    }
  }, p = (b, v, C) => {
    if (!C.m) {
      i(b, v);
      for (const w of C.d.keys())
        p(b, w, e(w)).t.add(v);
      if (C.m = {
        l: /* @__PURE__ */ new Set(),
        d: new Set(C.d.keys()),
        t: /* @__PURE__ */ new Set()
      }, (ne ? "production" : void 0) !== "production" && o.add(v), mt(v)) {
        const w = C.m;
        on(b, () => {
          const S = r(
            v,
            (...O) => d(b, v, ...O)
          );
          S && (w.u = S);
        });
      }
    }
    return C.m;
  }, y = (b, v, C) => {
    if (C.m && !C.m.l.size && !Array.from(C.m.t).some((w) => {
      var S;
      return (S = e(w).m) == null ? void 0 : S.d.has(v);
    })) {
      const w = C.m.u;
      w && on(b, w), delete C.m, (ne ? "production" : void 0) !== "production" && o.delete(v);
      for (const S of C.d.keys()) {
        const O = y(b, S, e(S));
        O == null || O.t.delete(v);
      }
      return;
    }
    return C.m;
  }, x = {
    get: c,
    set: f,
    sub: (b, v) => {
      const C = Ne(), w = e(b), S = p(C, b, w);
      be(C);
      const O = S.l;
      return O.add(v), () => {
        O.delete(v);
        const A = Ne();
        y(A, b, w), be(A);
      };
    },
    unstable_derive: (b) => jn(...b(e, t, n, r))
  };
  return (ne ? "production" : void 0) !== "production" && Object.assign(x, {
    // store dev methods (these are tentative and subject to change without notice)
    dev4_get_internal_weak_map: () => ({
      get: (v) => {
        const C = e(v);
        if (C.n !== 0)
          return C;
      }
    }),
    dev4_get_mounted_atoms: () => o,
    dev4_restore_atoms: (v) => {
      const C = Ne();
      for (const [w, S] of v)
        if (ft(w)) {
          const O = e(w), A = "v" in O, P = O.v;
          l(w, O, S), h(C, w, O), (!A || !Object.is(P, O.v)) && (ht(C, w, O), s(C, w, O));
        }
      be(C);
    }
  }), x;
}, Vn = () => {
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
const Zr = () => (Te || (Te = Vn(), (ne ? "production" : void 0) !== "production" && (globalThis.__JOTAI_DEFAULT_STORE__ || (globalThis.__JOTAI_DEFAULT_STORE__ = Te), globalThis.__JOTAI_DEFAULT_STORE__ !== Te && console.warn(
  "Detected multiple Jotai instances. It may cause unexpected behavior with the default store. https://github.com/pmndrs/jotai/discussions/2044"
))), Te), _n = { BASE_URL: "/", DEV: !1, MODE: "production", PROD: !0, SSR: !1 }, Bn = Tr(
  void 0
), Ft = (e) => Ir(Bn) || Zr(), qr = ({
  children: e,
  store: t
}) => {
  const n = he();
  return !t && !n.current && (n.current = Vn()), Pr(
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
        if ((_n ? "production" : void 0) !== "production" && s === u)
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
      if ((_n ? "production" : void 0) !== "production" && !("write" in e))
        throw new Error("not writable atom");
      return n.set(e, ...o);
    },
    [n, e]
  );
}
function k(e, t) {
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
function Ce(e) {
  return Ve(e) || e === "";
}
function Ve(e) {
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
    if (Ce(e[r.columnId]))
      return 1;
    if (Ce(t[r.columnId]))
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
    switch (Ve(r) && (r = ""), typeof r == "number" && (r = r.toString()), r = r.toLowerCase(), n.type) {
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
const $n = "update_column", so = "delete_column", co = "add_row", ao = "delete_rows", uo = "update_row", Wn = "update_rows", fo = "add_column", Vt = (e, t) => e + t, Un = (e, t) => {
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
  parseDate: void 0,
  formatStoredDate: void 0,
  formatDisplayDate: void 0,
  parseNumber: void 0,
  formatDisplayNumber: void 0
}, nt = M(kt), ie = M((e) => e(nt)), mo = M(null, (e, t, n) => {
  kt.rowSelectionButtons = [], t(nt, Un(kt, n));
}), Kn = M(""), oe = M({ onChange: () => null }), ho = M(
  null,
  (e, t, n) => t(oe, n)
);
M(null, (e, t, n) => {
  t(oe, { onChange: n });
});
const H = M({}), po = (e) => M((t) => new Set(Object.entries(t(H)).map(([n, r]) => r[e])).size), Zn = (e) => M(
  (t) => t(H)[e],
  (t, n, r) => {
    typeof r == "function" && (r = r(t(Zn(e)))), n(H, (o) => ({ ...o, [e]: { ...o[e], ...r } })), t(oe).onChange({ type: uo, rowId: e, update: r });
  }
), we = (e) => M(
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
), go = M(null, (e, t, n) => {
  const r = Object.entries(e(H)).filter(([, o]) => o.isSelected === !0).map(([o, l]) => o);
  t(
    H,
    Object.fromEntries(
      Object.entries(e(H)).filter(([, o]) => o.isSelected !== !0)
    )
  ), t(ge, !1), e(oe).onChange({
    type: ao,
    rows: [r]
  });
}), vo = M(
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
    ), t(ge, !1);
  }
), wo = M(null, (e, t, n) => {
  t(H, Object.fromEntries(n.map((r) => [r.id, r])));
}), qn = M(null, (e, t, n) => {
  t(H, (r) => ({
    ...r,
    [n.id]: n
  })), t(ot(n.id, e(fe)[0]), "editing"), e(oe).onChange({ type: co, rowId: n.id, update: n });
}), bo = M((e) => Object.keys(e(H)).length), xo = M(
  (e) => e(ge) ? Object.keys(e(H)).length : Object.entries(e(H)).map(([, t]) => t.isSelected === !0).reduce(Vt, 0)
), _t = M({}), Ie = M((e) => Object.entries(e(H)).filter(([, t]) => lo(t, e($t))).sort(
  ([, t], [, n]) => io(t, n, [...e(je), ...e(Bt)])
).map(([t, n]) => ({
  id: t,
  groupVal: e(je).length === 0 ? "" : n[e(je)[0].columnId]
})).map((t, n, r) => ({
  id: t.id,
  first: n === 0 || t.groupVal !== r[n - 1].groupVal,
  last: n === r.length - 1 || t.groupVal !== r[n + 1].groupVal,
  groupVal: t.groupVal
}))), sn = M({}), rt = (e) => M(
  (t) => t(sn)[e],
  (t, n, r) => n(sn, (o) => ({ ...o, [e]: r }))
), J = M({}), fe = M(
  (e) => Object.entries(e(J)).filter(([t, n]) => n.isVisible === !0).map(([t]) => t)
), zn = M(
  (e) => Object.entries(e(J)).map(([t, n]) => n)
), yo = M(
  (e) => Object.entries(e(J)).map(([t, n]) => n).filter((t) => t.type !== "custom")
), Co = M((e) => Object.keys(e(J))), Ro = M(
  (e) => Object.entries(e(J)).map(([, t]) => t.isVisible).reduce((t, n) => t + (n === !1), 0)
), Eo = {
  isVisible: !0,
  width: 192,
  type: "text",
  options: [],
  showOptionSearch: !0,
  isEditable: !0,
  isViewOnly: !1
}, No = M(null, (e, t, n) => {
  t(
    J,
    Object.fromEntries(
      n.map((r) => ({ ...Eo, ...r })).map((r) => [r.id, r])
    )
  );
}), ko = M(null, (e, t, n) => {
  t(J, (r) => ({ ...r, [n.id]: n })), t(rt(n.id), !0), e(oe).onChange({
    type: fo,
    colId: n.id,
    update: n
  });
}), So = M(null, (e, t, n) => {
  t(
    J,
    (r) => Object.fromEntries(Object.entries(r).filter(([o]) => o !== n.id))
  ), e(oe).onChange({ type: so, colId: n.id });
}), Oo = M((e) => Object.entries(e(J)).filter(([t, n]) => n.isVisible === !0).map(([t, n]) => n.width).reduce(Vt, e(nt).selectRow.enabled ? 64 : 0)), je = M([]), Le = M((e) => e(je)), Ao = M(null, (e, t, n) => {
  t(je, n.grouping), t(_t, {});
}), Yn = M(!1), Gn = M(!1), Bt = M([]), Ht = M((e) => e(Bt)), Xn = M(null, (e, t, n) => {
  t(Bt, n.sorting);
}), $t = M([]), Jn = M((e) => e($t)), Qn = M(null, (e, t, n) => {
  t($t, n.filtering);
}), er = M(32), Wt = M((e) => e(er)), Lo = M(null, (e, t, n) => {
  t(er, n.rowHeight);
}), ge = M(!1), Mo = M((e) => e(ge)), Do = M(null, (e, t, n) => {
  const r = e(ge);
  t(ge, !r), t(
    H,
    Object.fromEntries(
      Object.entries(e(H)).map(([o, l]) => [
        o,
        { ...l, isSelected: !r }
      ])
    )
  );
}), To = M(null, (e, t, n) => {
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
M(null, (e, t, n) => {
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
const tr = M(!1);
M((e) => e(tr));
M(null, (e, t, n) => {
  t(tr, n.dragging);
});
const cn = M({}), ot = (e, t) => M(
  (n) => {
    var r;
    return ((r = n(cn)[e]) == null ? void 0 : r[t]) || "none";
  },
  (n, r, o) => {
    r(cn, { [e]: { [t]: o } });
  }
), Ut = M(null, (e, t, n) => {
  t(ot(n.rowId, n.colId), n.value);
}), Po = M(null, (e, t, n) => {
  const { colId: r, type: o } = n;
  let { options: l, configuration: i } = e(J)[r];
  const c = e(nt);
  let u = (s) => s;
  switch (o) {
    case "select": {
      l = [
        ...new Set(Object.entries(e(H)).map(([d, f]) => f[r]))
      ].filter((d) => !Ve(d) && d !== "").map((d) => ({
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
            ([d, f]) => Ce(f[r]) ? [] : f[r].split(",")
          )
        )
      ].filter((d) => !Ve(d) && d !== "").map((d) => ({
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
        var d, f, h;
        return ((h = (f = (d = s == null ? void 0 : s.toLowerCase) == null ? void 0 : d.call(s)) == null ? void 0 : f.trim) == null ? void 0 : h.call(f)) === "true";
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
}), Io = (e, t) => M(null, (n, r, o) => {
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
}), an = (e, t) => M(
  (n) => Object.entries(n(H)).map(([r, o]) => o[e]).map(t).reduce(Vt, 0)
), dc = "100000000000000000000001";
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
    d: "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
  }));
}
const jo = /* @__PURE__ */ m.forwardRef(Fo);
function Vo({
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
const _o = /* @__PURE__ */ m.forwardRef(Vo);
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
    d: "M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
  }));
}
const un = /* @__PURE__ */ m.forwardRef(Bo);
function Ho({
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
const $o = /* @__PURE__ */ m.forwardRef(Ho);
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
    d: "M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
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
    d: "M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
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
    d: "M12 4.5v15m7.5-7.5h-15"
  }));
}
const nr = /* @__PURE__ */ m.forwardRef(qo);
function zo({
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
const Yo = /* @__PURE__ */ m.forwardRef(zo);
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
    d: "m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
  }));
}
const Xo = /* @__PURE__ */ m.forwardRef(Go);
function Fe(e) {
  const t = e.getUTCMonth() + 1, n = e.getUTCDate(), r = e.getUTCFullYear();
  return `${t.toString().padStart(2, "0")}/${n.toString().padStart(2, "0")}/${r.toString().padStart(4, "0")}`;
}
function Jo({
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
const Kt = /* @__PURE__ */ m.forwardRef(Jo);
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
    d: "M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z",
    clipRule: "evenodd"
  }));
}
const rr = /* @__PURE__ */ m.forwardRef(Qo);
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
    d: "M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z",
    clipRule: "evenodd"
  }));
}
const ti = /* @__PURE__ */ m.forwardRef(ei);
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
    d: "M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z",
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
    d: "M10.53 3.47a.75.75 0 0 0-1.06 0L6.22 6.72a.75.75 0 0 0 1.06 1.06L10 5.06l2.72 2.72a.75.75 0 1 0 1.06-1.06l-3.25-3.25Zm-4.31 9.81 3.25 3.25a.75.75 0 0 0 1.06 0l3.25-3.25a.75.75 0 1 0-1.06-1.06L10 14.94l-2.72-2.72a.75.75 0 0 0-1.06 1.06Z",
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
    d: "M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"
  }));
}
const si = /* @__PURE__ */ m.forwardRef(li);
function me({ name: e, color: t, onCancel: n }) {
  return /* @__PURE__ */ E(
    "div",
    {
      className: "rounded px-1.5 p-[1px] truncate whitespace-nowrap text-dark items-center flex cursor-default",
      style: { backgroundColor: t },
      children: [
        e,
        n && /* @__PURE__ */ a(si, { className: "w-4 h-4", onClick: n })
      ]
    }
  );
}
function ci(e, t) {
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
function ai({ children: e, ...t }) {
  return /* @__PURE__ */ a("div", { className: "px-3 py-1 flex items-center cursor-default", ...t, children: e });
}
function ui({ children: e, disabled: t, ...n }) {
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
Zt.Item = ai;
Zt.Button = ui;
const di = (e, t) => new Date(e, t + 1, 0).getDate(), fi = [
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
], mi = [
  "first:col-start-1",
  "first:col-start-2",
  "first:col-start-3",
  "first:col-start-4",
  "first:col-start-5",
  "first:col-start-6",
  "first:col-start-7"
];
function hi({
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
  const s = [...Array(di(c, l)).keys()], d = new Date(c, l, 1).getDay(), f = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  function h() {
    l === 0 ? (u((g) => g - 1), i(11)) : i((g) => g - 1);
  }
  function p() {
    l === 11 ? (u((g) => g + 1), i(0)) : i((g) => g + 1);
  }
  function y(g, x) {
    g.preventDefault();
    const b = /* @__PURE__ */ new Date();
    b.setUTCFullYear(c, l, x), r(b), t == null || t(b);
  }
  function N(g) {
    return n && n.getDate() === g && n.getMonth() === l && n.getFullYear() === c;
  }
  return /* @__PURE__ */ a("div", { className: "w-56", children: /* @__PURE__ */ E(F, { children: [
    /* @__PURE__ */ a(F.Section, { children: /* @__PURE__ */ E("div", { className: "flex px-2 items-center", children: [
      /* @__PURE__ */ E("div", { className: "grow text-left px-1", children: [
        fi[l],
        " ",
        c
      ] }),
      /* @__PURE__ */ a(
        "div",
        {
          className: "rs-btn hover:bg-hover-light rounded p-1",
          onClick: h,
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
          children: /* @__PURE__ */ a(ri, { className: "w-4 h-4" })
        }
      )
    ] }) }),
    /* @__PURE__ */ E(F.Section, { children: [
      /* @__PURE__ */ a("div", { className: "grid grid-cols-7 text-sm px-2 gap-px mb-2", children: f.map((g) => /* @__PURE__ */ a("div", { className: "text-secondary font-medium flex items-center justify-center", children: g })) }),
      /* @__PURE__ */ a("div", { className: "grid grid-cols-7 text-sm px-2 gap-px", children: s.map((g) => /* @__PURE__ */ a(
        "div",
        {
          className: U(
            "rs-btn p-0.5 rounded flex items-center justify-center col-span-1",
            mi[d],
            !N(g + 1) && "hover:bg-hover-light",
            N(g + 1) && "bg-blue-500 text-inverted hover:bg-blue-500"
          ),
          onClick: (x) => {
            y(x, g + 1);
          },
          children: g + 1
        },
        `day-${g}`
      )) })
    ] })
  ] }) });
}
function it() {
  return typeof window < "u";
}
function Me(e) {
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
function pi(e) {
  return ["table", "td", "th"].includes(Me(e));
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
function gi(e) {
  let t = ae(e);
  for (; ee(t) && !ve(t); ) {
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
function ve(e) {
  return ["html", "body", "#document"].includes(Me(e));
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
  if (Me(e) === "html")
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
  return ve(t) ? e.ownerDocument ? e.ownerDocument.body : e.body : ee(t) && Be(t) ? t : ir(t);
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
function vi(e) {
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
function wi() {
  return /apple/i.test(navigator.vendor);
}
function dn(e, t) {
  return ["mouse", "pen"].includes(e);
}
function bi(e) {
  return "nativeEvent" in e;
}
function xi(e) {
  return e.matches("html,body");
}
function Lt(e) {
  return (e == null ? void 0 : e.ownerDocument) || document;
}
function gt(e, t) {
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
const yi = "input:not([type='hidden']):not([disabled]),[contenteditable]:not([contenteditable='false']),textarea:not([disabled])";
function Ci(e) {
  return ee(e) && e.matches(yi);
}
const Ze = Math.min, xe = Math.max, qe = Math.round, We = Math.floor, se = (e) => ({
  x: e,
  y: e
}), Ri = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom"
}, Ei = {
  start: "end",
  end: "start"
};
function fn(e, t, n) {
  return xe(e, Ze(t, n));
}
function at(e, t) {
  return typeof e == "function" ? e(t) : e;
}
function Re(e) {
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
  return ["top", "bottom"].includes(Re(e)) ? "y" : "x";
}
function cr(e) {
  return lr(Oe(e));
}
function Ni(e, t, n) {
  n === void 0 && (n = !1);
  const r = ut(e), o = cr(e), l = sr(o);
  let i = o === "x" ? r === (n ? "end" : "start") ? "right" : "left" : r === "start" ? "bottom" : "top";
  return t.reference[l] > t.floating[l] && (i = ze(i)), [i, ze(i)];
}
function ki(e) {
  const t = ze(e);
  return [Mt(e), t, Mt(t)];
}
function Mt(e) {
  return e.replace(/start|end/g, (t) => Ei[t]);
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
function Oi(e, t, n, r) {
  const o = ut(e);
  let l = Si(Re(e), n === "start", r);
  return o && (l = l.map((i) => i + "-" + o), t && (l = l.concat(l.map(Mt)))), l;
}
function ze(e) {
  return e.replace(/left|right|bottom|top/g, (t) => Ri[t]);
}
function Ai(e) {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...e
  };
}
function Li(e) {
  return typeof e != "number" ? Ai(e) : {
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
var Mi = ["input:not([inert])", "select:not([inert])", "textarea:not([inert])", "a[href]:not([inert])", "button:not([inert])", "[tabindex]:not(slot):not([inert])", "audio[controls]:not([inert])", "video[controls]:not([inert])", '[contenteditable]:not([contenteditable="false"]):not([inert])', "details>summary:first-of-type:not([inert])", "details:not([inert])"], Dt = /* @__PURE__ */ Mi.join(","), ar = typeof Element > "u", _e = ar ? function() {
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
}, Di = function(t) {
  var n, r = t == null || (n = t.getAttribute) === null || n === void 0 ? void 0 : n.call(t, "contenteditable");
  return r === "" || r === "true";
}, Ti = function(t, n, r) {
  if (Xe(t))
    return [];
  var o = Array.prototype.slice.apply(t.querySelectorAll(Dt));
  return n && _e.call(t, Dt) && o.unshift(t), o = o.filter(r), o;
}, Pi = function e(t, n, r) {
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
        var d = _e.call(i, Dt);
        d && r.filter(i) && (n || !t.includes(i)) && o.push(i);
        var f = i.shadowRoot || // check for an undisclosed shadow
        typeof r.getShadowRoot == "function" && r.getShadowRoot(i), h = !Xe(f, !1) && (!r.shadowRootFilter || r.shadowRootFilter(i));
        if (f && h) {
          var p = e(f === !0 ? i.children : f.children, !0, r);
          r.flatten ? o.push.apply(o, p) : o.push({
            scopeParent: i,
            candidates: p
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
  return t.tabIndex < 0 && (/^(AUDIO|VIDEO|DETAILS)$/.test(t.tagName) || Di(t)) && !ur(t) ? 0 : t.tabIndex;
}, Ii = function(t, n) {
  var r = dr(t);
  return r < 0 && n && !ur(t) ? 0 : r;
}, Fi = function(t, n) {
  return t.tabIndex === n.tabIndex ? t.documentOrder - n.documentOrder : t.tabIndex - n.tabIndex;
}, fr = function(t) {
  return t.tagName === "INPUT";
}, ji = function(t) {
  return fr(t) && t.type === "hidden";
}, Vi = function(t) {
  var n = t.tagName === "DETAILS" && Array.prototype.slice.apply(t.children).some(function(r) {
    return r.tagName === "SUMMARY";
  });
  return n;
}, _i = function(t, n) {
  for (var r = 0; r < t.length; r++)
    if (t[r].checked && t[r].form === n)
      return t[r];
}, Bi = function(t) {
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
  var l = _i(o, t.form);
  return !l || l === t;
}, Hi = function(t) {
  return fr(t) && t.type === "radio";
}, $i = function(t) {
  return Hi(t) && !Bi(t);
}, Wi = function(t) {
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
}, Ui = function(t, n) {
  var r = n.displayCheck, o = n.getShadowRoot;
  if (getComputedStyle(t).visibility === "hidden")
    return !0;
  var l = _e.call(t, "details>summary:first-of-type"), i = l ? t.parentElement : t;
  if (_e.call(i, "details:not([open]) *"))
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
    if (Wi(t))
      return !t.getClientRects().length;
    if (r !== "legacy-full")
      return !0;
  } else if (r === "non-zero-area")
    return mn(t);
  return !1;
}, Ki = function(t) {
  if (/^(INPUT|BUTTON|SELECT|TEXTAREA)$/.test(t.tagName))
    for (var n = t.parentElement; n; ) {
      if (n.tagName === "FIELDSET" && n.disabled) {
        for (var r = 0; r < n.children.length; r++) {
          var o = n.children.item(r);
          if (o.tagName === "LEGEND")
            return _e.call(n, "fieldset[disabled] *") ? !0 : !o.contains(t);
        }
        return !0;
      }
      n = n.parentElement;
    }
  return !1;
}, Zi = function(t, n) {
  return !(n.disabled || // we must do an inert look up to filter out any elements inside an inert ancestor
  //  because we're limited in the type of selectors we can use in JSDom (see related
  //  note related to `candidateSelectors`)
  Xe(n) || ji(n) || Ui(n, t) || // For a details element with a summary, the summary element gets the focus
  Vi(n) || Ki(n));
}, hn = function(t, n) {
  return !($i(n) || dr(n) < 0 || !Zi(t, n));
}, qi = function(t) {
  var n = parseInt(t.getAttribute("tabindex"), 10);
  return !!(isNaN(n) || n >= 0);
}, zi = function e(t) {
  var n = [], r = [];
  return t.forEach(function(o, l) {
    var i = !!o.scopeParent, c = i ? o.scopeParent : o, u = Ii(c, i), s = i ? e(o.candidates) : c;
    u === 0 ? i ? n.push.apply(n, s) : n.push(c) : r.push({
      documentOrder: l,
      tabIndex: u,
      item: o,
      isScope: i,
      content: s
    });
  }), r.sort(Fi).reduce(function(o, l) {
    return l.isScope ? o.push.apply(o, l.content) : o.push(l.content), o;
  }, []).concat(n);
}, mr = function(t, n) {
  n = n || {};
  var r;
  return n.getShadowRoot ? r = Pi([t], n.includeContainer, {
    filter: hn.bind(null, n),
    flatten: !1,
    getShadowRoot: n.getShadowRoot,
    shadowRootFilter: qi
  }) : r = Ti(t, n.includeContainer, hn.bind(null, n)), zi(r);
};
function pn(e, t, n) {
  let {
    reference: r,
    floating: o
  } = e;
  const l = Oe(t), i = cr(t), c = sr(i), u = Re(t), s = l === "y", d = r.x + r.width / 2 - o.width / 2, f = r.y + r.height / 2 - o.height / 2, h = r[c] / 2 - o[c] / 2;
  let p;
  switch (u) {
    case "top":
      p = {
        x: d,
        y: r.y - o.height
      };
      break;
    case "bottom":
      p = {
        x: d,
        y: r.y + r.height
      };
      break;
    case "right":
      p = {
        x: r.x + r.width,
        y: f
      };
      break;
    case "left":
      p = {
        x: r.x - o.width,
        y: f
      };
      break;
    default:
      p = {
        x: r.x,
        y: r.y
      };
  }
  switch (ut(t)) {
    case "start":
      p[i] -= h * (n && s ? -1 : 1);
      break;
    case "end":
      p[i] += h * (n && s ? -1 : 1);
      break;
  }
  return p;
}
const Yi = async (e, t, n) => {
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
  } = pn(s, r, u), h = r, p = {}, y = 0;
  for (let N = 0; N < c.length; N++) {
    const {
      name: g,
      fn: x
    } = c[N], {
      x: b,
      y: v,
      data: C,
      reset: w
    } = await x({
      x: d,
      y: f,
      initialPlacement: r,
      placement: h,
      strategy: o,
      middlewareData: p,
      rects: s,
      platform: i,
      elements: {
        reference: e,
        floating: t
      }
    });
    d = b ?? d, f = v ?? f, p = {
      ...p,
      [g]: {
        ...p[g],
        ...C
      }
    }, w && y <= 50 && (y++, typeof w == "object" && (w.placement && (h = w.placement), w.rects && (s = w.rects === !0 ? await i.getElementRects({
      reference: e,
      floating: t,
      strategy: o
    }) : w.rects), {
      x: d,
      y: f
    } = pn(s, h, u)), N = -1);
  }
  return {
    x: d,
    y: f,
    placement: h,
    strategy: o,
    middlewareData: p
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
    altBoundary: h = !1,
    padding: p = 0
  } = at(t, e), y = Li(p), g = c[h ? f === "floating" ? "reference" : "floating" : f], x = Ye(await l.getClippingRect({
    element: (n = await (l.isElement == null ? void 0 : l.isElement(g))) == null || n ? g : g.contextElement || await (l.getDocumentElement == null ? void 0 : l.getDocumentElement(c.floating)),
    boundary: s,
    rootBoundary: d,
    strategy: u
  })), b = f === "floating" ? {
    x: r,
    y: o,
    width: i.floating.width,
    height: i.floating.height
  } : i.reference, v = await (l.getOffsetParent == null ? void 0 : l.getOffsetParent(c.floating)), C = await (l.isElement == null ? void 0 : l.isElement(v)) ? await (l.getScale == null ? void 0 : l.getScale(v)) || {
    x: 1,
    y: 1
  } : {
    x: 1,
    y: 1
  }, w = Ye(l.convertOffsetParentRelativeRectToViewportRelativeRect ? await l.convertOffsetParentRelativeRectToViewportRelativeRect({
    elements: c,
    rect: b,
    offsetParent: v,
    strategy: u
  }) : b);
  return {
    top: (x.top - w.top + y.top) / C.y,
    bottom: (w.bottom - x.bottom + y.bottom) / C.y,
    left: (x.left - w.left + y.left) / C.x,
    right: (w.right - x.right + y.right) / C.x
  };
}
const Gi = function(e) {
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
        fallbackPlacements: h,
        fallbackStrategy: p = "bestFit",
        fallbackAxisSideDirection: y = "none",
        flipAlignment: N = !0,
        ...g
      } = at(e, t);
      if ((n = l.arrow) != null && n.alignmentOffset)
        return {};
      const x = Re(o), b = Oe(c), v = Re(c) === c, C = await (u.isRTL == null ? void 0 : u.isRTL(s.floating)), w = h || (v || !N ? [ze(c)] : ki(c)), S = y !== "none";
      !h && S && w.push(...Oi(c, N, y, C));
      const O = [c, ...w], A = await hr(t, g), P = [];
      let R = ((r = l.flip) == null ? void 0 : r.overflows) || [];
      if (d && P.push(A[x]), f) {
        const _ = Ni(o, i, C);
        P.push(A[_[0]], A[_[1]]);
      }
      if (R = [...R, {
        placement: o,
        overflows: P
      }], !P.every((_) => _ <= 0)) {
        var D, L;
        const _ = (((D = l.flip) == null ? void 0 : D.index) || 0) + 1, j = O[_];
        if (j)
          return {
            data: {
              index: _,
              overflows: R
            },
            reset: {
              placement: j
            }
          };
        let $ = (L = R.filter((z) => z.overflows[0] <= 0).sort((z, I) => z.overflows[1] - I.overflows[1])[0]) == null ? void 0 : L.placement;
        if (!$)
          switch (p) {
            case "bestFit": {
              var V;
              const z = (V = R.filter((I) => {
                if (S) {
                  const T = Oe(I.placement);
                  return T === b || // Create a bias to the `y` side axis due to horizontal
                  // reading directions favoring greater width.
                  T === "y";
                }
                return !0;
              }).map((I) => [I.placement, I.overflows.filter((T) => T > 0).reduce((T, K) => T + K, 0)]).sort((I, T) => I[1] - T[1])[0]) == null ? void 0 : V[0];
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
async function Xi(e, t) {
  const {
    placement: n,
    platform: r,
    elements: o
  } = e, l = await (r.isRTL == null ? void 0 : r.isRTL(o.floating)), i = Re(n), c = ut(n), u = Oe(n) === "y", s = ["left", "top"].includes(i) ? -1 : 1, d = l && u ? -1 : 1, f = at(t, e);
  let {
    mainAxis: h,
    crossAxis: p,
    alignmentAxis: y
  } = typeof f == "number" ? {
    mainAxis: f,
    crossAxis: 0,
    alignmentAxis: null
  } : {
    mainAxis: f.mainAxis || 0,
    crossAxis: f.crossAxis || 0,
    alignmentAxis: f.alignmentAxis
  };
  return c && typeof y == "number" && (p = c === "end" ? y * -1 : y), u ? {
    x: p * d,
    y: h * s
  } : {
    x: h * s,
    y: p * d
  };
}
const Ji = function(e) {
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
      } = t, u = await Xi(t, e);
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
}, Qi = function(e) {
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
          fn: (g) => {
            let {
              x,
              y: b
            } = g;
            return {
              x,
              y: b
            };
          }
        },
        ...u
      } = at(e, t), s = {
        x: n,
        y: r
      }, d = await hr(t, u), f = Oe(Re(o)), h = lr(f);
      let p = s[h], y = s[f];
      if (l) {
        const g = h === "y" ? "top" : "left", x = h === "y" ? "bottom" : "right", b = p + d[g], v = p - d[x];
        p = fn(b, p, v);
      }
      if (i) {
        const g = f === "y" ? "top" : "left", x = f === "y" ? "bottom" : "right", b = y + d[g], v = y - d[x];
        y = fn(b, y, v);
      }
      const N = c.fn({
        ...t,
        [h]: p,
        [f]: y
      });
      return {
        ...N,
        data: {
          x: N.x - n,
          y: N.y - r,
          enabled: {
            [h]: l,
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
const el = /* @__PURE__ */ se(0);
function gr(e) {
  const t = Q(e);
  return !st() || !t.visualViewport ? el : {
    x: t.visualViewport.offsetLeft,
    y: t.visualViewport.offsetTop
  };
}
function tl(e, t, n) {
  return t === void 0 && (t = !1), !n || t && n !== Q(e) ? !1 : t;
}
function Ee(e, t, n, r) {
  t === void 0 && (t = !1), n === void 0 && (n = !1);
  const o = e.getBoundingClientRect(), l = zt(e);
  let i = se(1);
  t && (r ? Z(r) && (i = Se(r)) : i = Se(e));
  const c = tl(l, n, r) ? gr(l) : se(0);
  let u = (o.left + c.x) / i.x, s = (o.top + c.y) / i.y, d = o.width / i.x, f = o.height / i.y;
  if (l) {
    const h = Q(l), p = r && Z(r) ? Q(r) : r;
    let y = h, N = Ot(y);
    for (; N && r && p !== y; ) {
      const g = Se(N), x = N.getBoundingClientRect(), b = re(N), v = x.left + (N.clientLeft + parseFloat(b.paddingLeft)) * g.x, C = x.top + (N.clientTop + parseFloat(b.paddingTop)) * g.y;
      u *= g.x, s *= g.y, d *= g.x, f *= g.y, u += v, s += C, y = Q(N), N = Ot(y);
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
function vr(e, t, n) {
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
function nl(e) {
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
  if ((f || !f && !l) && ((Me(r) !== "body" || Be(i)) && (u = ct(r)), ee(r))) {
    const p = Ee(r);
    s = Se(r), d.x = p.x + r.clientLeft, d.y = p.y + r.clientTop;
  }
  const h = i && !f && !l ? vr(i, u, !0) : se(0);
  return {
    width: n.width * s.x,
    height: n.height * s.y,
    x: n.x * s.x - u.scrollLeft * s.x + d.x + h.x,
    y: n.y * s.y - u.scrollTop * s.y + d.y + h.y
  };
}
function rl(e) {
  return Array.from(e.getClientRects());
}
function ol(e) {
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
function il(e, t) {
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
function ll(e, t) {
  const n = Ee(e, !0, t === "fixed"), r = n.top + e.clientTop, o = n.left + e.clientLeft, l = ee(e) ? Se(e) : se(1), i = e.clientWidth * l.x, c = e.clientHeight * l.y, u = o * l.x, s = r * l.y;
  return {
    width: i,
    height: c,
    x: u,
    y: s
  };
}
function gn(e, t, n) {
  let r;
  if (t === "viewport")
    r = il(e, n);
  else if (t === "document")
    r = ol(ce(e));
  else if (Z(t))
    r = ll(t, n);
  else {
    const o = gr(e);
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
  return n === t || !Z(n) || ve(n) ? !1 : re(n).position === "fixed" || wr(n, t);
}
function sl(e, t) {
  const n = t.get(e);
  if (n)
    return n;
  let r = pe(e, [], !1).filter((c) => Z(c) && Me(c) !== "body"), o = null;
  const l = re(e).position === "fixed";
  let i = l ? ae(e) : e;
  for (; Z(i) && !ve(i); ) {
    const c = re(i), u = qt(i);
    !u && c.position === "fixed" && (o = null), (l ? !u && !o : !u && c.position === "static" && !!o && ["absolute", "fixed"].includes(o.position) || Be(i) && !u && wr(e, i)) ? r = r.filter((d) => d !== i) : o = c, i = ae(i);
  }
  return t.set(e, r), r;
}
function cl(e) {
  let {
    element: t,
    boundary: n,
    rootBoundary: r,
    strategy: o
  } = e;
  const i = [...n === "clippingAncestors" ? lt(t) ? [] : sl(t, this._c) : [].concat(n), r], c = i[0], u = i.reduce((s, d) => {
    const f = gn(t, d, o);
    return s.top = xe(f.top, s.top), s.right = Ze(f.right, s.right), s.bottom = Ze(f.bottom, s.bottom), s.left = xe(f.left, s.left), s;
  }, gn(t, c, o));
  return {
    width: u.right - u.left,
    height: u.bottom - u.top,
    x: u.left,
    y: u.top
  };
}
function al(e) {
  const {
    width: t,
    height: n
  } = pr(e);
  return {
    width: t,
    height: n
  };
}
function ul(e, t, n) {
  const r = ee(t), o = ce(t), l = n === "fixed", i = Ee(e, !0, l, t);
  let c = {
    scrollLeft: 0,
    scrollTop: 0
  };
  const u = se(0);
  if (r || !r && !l)
    if ((Me(t) !== "body" || Be(o)) && (c = ct(t)), r) {
      const h = Ee(t, !0, l, t);
      u.x = h.x + t.clientLeft, u.y = h.y + t.clientTop;
    } else o && (u.x = Yt(o));
  const s = o && !r && !l ? vr(o, c) : se(0), d = i.left + c.scrollLeft - u.x - s.x, f = i.top + c.scrollTop - u.y - s.y;
  return {
    x: d,
    y: f,
    width: i.width,
    height: i.height
  };
}
function vt(e) {
  return re(e).position === "static";
}
function vn(e, t) {
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
    for (; o && !ve(o); ) {
      if (Z(o) && !vt(o))
        return o;
      o = ae(o);
    }
    return n;
  }
  let r = vn(e, t);
  for (; r && pi(r) && vt(r); )
    r = vn(r, t);
  return r && ve(r) && vt(r) && !qt(r) ? n : r || gi(e) || n;
}
const dl = async function(e) {
  const t = this.getOffsetParent || br, n = this.getDimensions, r = await n(e.floating);
  return {
    reference: ul(e.reference, await t(e.floating), e.strategy),
    floating: {
      x: 0,
      y: 0,
      width: r.width,
      height: r.height
    }
  };
};
function fl(e) {
  return re(e).direction === "rtl";
}
const ml = {
  convertOffsetParentRelativeRectToViewportRelativeRect: nl,
  getDocumentElement: ce,
  getClippingRect: cl,
  getOffsetParent: br,
  getElementRects: dl,
  getClientRects: rl,
  getDimensions: al,
  getScale: Se,
  isElement: Z,
  isRTL: fl
};
function hl(e, t) {
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
      height: h
    } = e.getBoundingClientRect();
    if (c || t(), !f || !h)
      return;
    const p = We(d), y = We(o.clientWidth - (s + f)), N = We(o.clientHeight - (d + h)), g = We(s), b = {
      rootMargin: -p + "px " + -y + "px " + -N + "px " + -g + "px",
      threshold: xe(0, Ze(1, u)) || 1
    };
    let v = !0;
    function C(w) {
      const S = w[0].intersectionRatio;
      if (S !== u) {
        if (!v)
          return i();
        S ? i(!1, S) : r = setTimeout(() => {
          i(!1, 1e-7);
        }, 1e3);
      }
      v = !1;
    }
    try {
      n = new IntersectionObserver(C, {
        ...b,
        // Handle <iframe>s
        root: o.ownerDocument
      });
    } catch {
      n = new IntersectionObserver(C, b);
    }
    n.observe(e);
  }
  return i(!0), l;
}
function pl(e, t, n, r) {
  r === void 0 && (r = {});
  const {
    ancestorScroll: o = !0,
    ancestorResize: l = !0,
    elementResize: i = typeof ResizeObserver == "function",
    layoutShift: c = typeof IntersectionObserver == "function",
    animationFrame: u = !1
  } = r, s = zt(e), d = o || l ? [...s ? pe(s) : [], ...pe(t)] : [];
  d.forEach((x) => {
    o && x.addEventListener("scroll", n, {
      passive: !0
    }), l && x.addEventListener("resize", n);
  });
  const f = s && c ? hl(s, n) : null;
  let h = -1, p = null;
  i && (p = new ResizeObserver((x) => {
    let [b] = x;
    b && b.target === s && p && (p.unobserve(t), cancelAnimationFrame(h), h = requestAnimationFrame(() => {
      var v;
      (v = p) == null || v.observe(t);
    })), n();
  }), s && !u && p.observe(s), p.observe(t));
  let y, N = u ? Ee(e) : null;
  u && g();
  function g() {
    const x = Ee(e);
    N && (x.x !== N.x || x.y !== N.y || x.width !== N.width || x.height !== N.height) && n(), N = x, y = requestAnimationFrame(g);
  }
  return n(), () => {
    var x;
    d.forEach((b) => {
      o && b.removeEventListener("scroll", n), l && b.removeEventListener("resize", n);
    }), f == null || f(), (x = p) == null || x.disconnect(), p = null, u && cancelAnimationFrame(y);
  };
}
const gl = Ji, vl = Qi, wl = Gi, bl = (e, t, n) => {
  const r = /* @__PURE__ */ new Map(), o = {
    platform: ml,
    ...n
  }, l = {
    ...o.platform,
    _c: r
  };
  return Yi(e, t, {
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
function xl(e) {
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
  }), [h, p] = m.useState(r);
  Je(h, r) || p(r);
  const [y, N] = m.useState(null), [g, x] = m.useState(null), b = m.useCallback((I) => {
    I !== S.current && (S.current = I, N(I));
  }, []), v = m.useCallback((I) => {
    I !== O.current && (O.current = I, x(I));
  }, []), C = l || y, w = i || g, S = m.useRef(null), O = m.useRef(null), A = m.useRef(d), P = u != null, R = wt(u), D = wt(o), L = wt(s), V = m.useCallback(() => {
    if (!S.current || !O.current)
      return;
    const I = {
      placement: t,
      strategy: n,
      middleware: h
    };
    D.current && (I.platform = D.current), bl(S.current, O.current, I).then((T) => {
      const K = {
        ...T,
        // The floating element's position may be recomputed while it's closed
        // but still mounted (such as when transitioning out). To ensure
        // `isPositioned` will be `false` initially on the next open, avoid
        // setting it to `true` when `open === false` (must be specified).
        isPositioned: L.current !== !1
      };
      _.current && !Je(A.current, K) && (A.current = K, In.flushSync(() => {
        f(K);
      }));
    });
  }, [h, t, n, D, L]);
  Ue(() => {
    s === !1 && A.current.isPositioned && (A.current.isPositioned = !1, f((I) => ({
      ...I,
      isPositioned: !1
    })));
  }, [s]);
  const _ = m.useRef(!1);
  Ue(() => (_.current = !0, () => {
    _.current = !1;
  }), []), Ue(() => {
    if (C && (S.current = C), w && (O.current = w), C && w) {
      if (R.current)
        return R.current(C, w, V);
      V();
    }
  }, [C, w, V, R, P]);
  const j = m.useMemo(() => ({
    reference: S,
    floating: O,
    setReference: b,
    setFloating: v
  }), [b, v]), $ = m.useMemo(() => ({
    reference: C,
    floating: w
  }), [C, w]), z = m.useMemo(() => {
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
    update: V,
    refs: j,
    elements: $,
    floatingStyles: z
  }), [d, V, j, $, z]);
}
const yl = (e, t) => ({
  ...gl(e),
  options: [e, t]
}), Cl = (e, t) => ({
  ...vl(e),
  options: [e, t]
}), Rl = (e, t) => ({
  ...wl(e),
  options: [e, t]
}), yr = {
  ...m
}, El = yr.useInsertionEffect, Nl = El || ((e) => e());
function ke(e) {
  const t = m.useRef(() => {
    if (process.env.NODE_ENV !== "production")
      throw new Error("Cannot call an event handler while rendering.");
  });
  return Nl(() => {
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
let bn = !1, kl = 0;
const xn = () => (
  // Ensure the id is unique with multiple independent versions of Floating UI
  // on <React 18
  "floating-ui-" + Math.random().toString(36).slice(2, 6) + kl++
);
function Sl() {
  const [e, t] = m.useState(() => bn ? xn() : void 0);
  return ye(() => {
    e == null && t(xn());
  }, []), m.useEffect(() => {
    bn = !0;
  }, []), e;
}
const Ol = yr.useId, Cr = Ol || Sl;
let Pt;
process.env.NODE_ENV !== "production" && (Pt = /* @__PURE__ */ new Set());
function Al() {
  for (var e, t = arguments.length, n = new Array(t), r = 0; r < t; r++)
    n[r] = arguments[r];
  const o = "Floating UI: " + n.join(" ");
  if (!((e = Pt) != null && e.has(o))) {
    var l;
    (l = Pt) == null || l.add(o), console.error(o);
  }
}
function Ll() {
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
const Ml = /* @__PURE__ */ m.createContext(null), Dl = /* @__PURE__ */ m.createContext(null), Tl = () => {
  var e;
  return ((e = m.useContext(Ml)) == null ? void 0 : e.id) || null;
}, Rr = () => m.useContext(Dl);
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
  const r = n.indexOf(vi(Lt(e)));
  return n.slice(r + 1)[0];
}
function Pl() {
  return Nr(document.body, "next");
}
function Il() {
  return Nr(document.body, "prev");
}
function xt(e, t) {
  const n = t || e.currentTarget, r = e.relatedTarget;
  return !r || !At(n, r);
}
function Fl(e) {
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
let jl;
function Cn(e) {
  e.key === "Tab" && (e.target, clearTimeout(jl));
}
const Rn = /* @__PURE__ */ m.forwardRef(function(t, n) {
  const [r, o] = m.useState();
  ye(() => (wi() && o("button"), document.addEventListener("keydown", Cn), () => {
    document.removeEventListener("keydown", Cn);
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
function Vl(e) {
  e === void 0 && (e = {});
  const {
    id: t,
    root: n
  } = e, r = Cr(), o = Bl(), [l, i] = m.useState(null), c = m.useRef(null);
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
function _l(e) {
  const {
    children: t,
    id: n,
    root: r,
    preserveTabOrder: o = !0
  } = e, l = Vl({
    id: n,
    root: r
  }), [i, c] = m.useState(null), u = m.useRef(null), s = m.useRef(null), d = m.useRef(null), f = m.useRef(null), h = i == null ? void 0 : i.modal, p = i == null ? void 0 : i.open, y = (
    // The FocusManager and therefore floating element are currently open/
    // rendered.
    !!i && // Guards are only for non-modal focus management.
    !i.modal && // Don't render if unmount is transitioning.
    i.open && o && !!(r || l)
  );
  return m.useEffect(() => {
    if (!l || !o || h)
      return;
    function N(g) {
      l && xt(g) && (g.type === "focusin" ? yn : Fl)(l);
    }
    return l.addEventListener("focusin", N, !0), l.addEventListener("focusout", N, !0), () => {
      l.removeEventListener("focusin", N, !0), l.removeEventListener("focusout", N, !0);
    };
  }, [l, o, h]), m.useEffect(() => {
    l && (p || yn(l));
  }, [p, l]), /* @__PURE__ */ m.createElement(Sr.Provider, {
    value: m.useMemo(() => ({
      preserveTabOrder: o,
      beforeOutsideRef: u,
      afterOutsideRef: s,
      beforeInsideRef: d,
      afterInsideRef: f,
      portalNode: l,
      setFocusManagerState: c
    }), [o, l])
  }, y && l && /* @__PURE__ */ m.createElement(Rn, {
    "data-type": "outside",
    ref: u,
    onFocus: (N) => {
      if (xt(N, l)) {
        var g;
        (g = d.current) == null || g.focus();
      } else {
        const x = Il() || (i == null ? void 0 : i.refs.domReference.current);
        x == null || x.focus();
      }
    }
  }), y && l && /* @__PURE__ */ m.createElement("span", {
    "aria-owns": l.id,
    style: kr
  }), l && /* @__PURE__ */ In.createPortal(t, l), y && l && /* @__PURE__ */ m.createElement(Rn, {
    "data-type": "outside",
    ref: s,
    onFocus: (N) => {
      if (xt(N, l)) {
        var g;
        (g = f.current) == null || g.focus();
      } else {
        const x = Pl() || (i == null ? void 0 : i.refs.domReference.current);
        x == null || x.focus(), i != null && i.closeOnFocusOut && (i == null || i.onOpenChange(!1, N.nativeEvent, "focus-out"));
      }
    }
  }));
}
const Bl = () => m.useContext(Sr), Hl = "data-floating-ui-focusable";
function Nn(e) {
  return ee(e.target) && e.target.tagName === "BUTTON";
}
function kn(e) {
  return Ci(e);
}
function $l(e, t) {
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
  } = t, f = m.useRef(), h = m.useRef(!1), p = m.useMemo(() => ({
    onPointerDown(y) {
      f.current = y.pointerType;
    },
    onMouseDown(y) {
      const N = f.current;
      y.button === 0 && c !== "click" && (dn(N) && s || (n && u && (!o.current.openEvent || o.current.openEvent.type === "mousedown") ? r(!1, y.nativeEvent, "click") : (y.preventDefault(), r(!0, y.nativeEvent, "click"))));
    },
    onClick(y) {
      const N = f.current;
      if (c === "mousedown" && f.current) {
        f.current = void 0;
        return;
      }
      dn(N) && s || (n && u && (!o.current.openEvent || o.current.openEvent.type === "click") ? r(!1, y.nativeEvent, "click") : r(!0, y.nativeEvent, "click"));
    },
    onKeyDown(y) {
      f.current = void 0, !(y.defaultPrevented || !d || Nn(y)) && (y.key === " " && !kn(l) && (y.preventDefault(), h.current = !0), y.key === "Enter" && r(!(n && u), y.nativeEvent, "click"));
    },
    onKeyUp(y) {
      y.defaultPrevented || !d || Nn(y) || kn(l) || y.key === " " && h.current && (h.current = !1, r(!(n && u), y.nativeEvent, "click"));
    }
  }), [o, l, c, s, d, r, n, u]);
  return m.useMemo(() => i ? {
    reference: p
  } : {}, [i, p]);
}
const Wl = {
  pointerdown: "onPointerDown",
  mousedown: "onMouseDown",
  click: "onClick"
}, Ul = {
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
function Kl(e, t) {
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
    ancestorScroll: h = !1,
    bubbles: p,
    capture: y
  } = t, N = Rr(), g = ke(typeof u == "function" ? u : () => !1), x = typeof u == "function" ? g : u, b = m.useRef(!1), v = m.useRef(!1), {
    escapeKey: C,
    outsidePress: w
  } = Sn(p), {
    escapeKey: S,
    outsidePress: O
  } = Sn(y), A = m.useRef(!1), P = ke((j) => {
    var $;
    if (!n || !i || !c || j.key !== "Escape" || A.current)
      return;
    const z = ($ = l.current.floatingContext) == null ? void 0 : $.nodeId, I = N ? bt(N.nodesRef.current, z) : [];
    if (!C && (j.stopPropagation(), I.length > 0)) {
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
    r(!1, bi(j) ? j.nativeEvent : j, "escape-key");
  }), R = ke((j) => {
    var $;
    const z = () => {
      var I;
      P(j), (I = Pe(j)) == null || I.removeEventListener("keydown", z);
    };
    ($ = Pe(j)) == null || $.addEventListener("keydown", z);
  }), D = ke((j) => {
    var $;
    const z = b.current;
    b.current = !1;
    const I = v.current;
    if (v.current = !1, s === "click" && I || z || typeof x == "function" && !x(j))
      return;
    const T = Pe(j), K = "[" + Gt("inert") + "]", X = Lt(o.floating).querySelectorAll(K);
    let ue = Z(T) ? T : null;
    for (; ue && !ve(ue); ) {
      const te = ae(ue);
      if (ve(te) || !Z(te))
        break;
      ue = te;
    }
    if (X.length && Z(T) && !xi(T) && // Clicked on a direct ancestor (e.g. FloatingOverlay).
    !At(T, o.floating) && // If the target root element contains none of the markers, then the
    // element was injected after the floating element rendered.
    Array.from(X).every((te) => !At(ue, te)))
      return;
    if (ee(T) && _) {
      const te = T.clientWidth > 0 && T.scrollWidth > T.clientWidth, de = T.clientHeight > 0 && T.scrollHeight > T.clientHeight;
      let De = de && j.offsetX > T.clientWidth;
      if (de && re(T).direction === "rtl" && (De = j.offsetX <= T.offsetWidth - T.clientWidth), De || te && j.offsetY > T.clientHeight)
        return;
    }
    const Qt = ($ = l.current.floatingContext) == null ? void 0 : $.nodeId, Dr = N && bt(N.nodesRef.current, Qt).some((te) => {
      var de;
      return gt(j, (de = te.context) == null ? void 0 : de.elements.floating);
    });
    if (gt(j, o.floating) || gt(j, o.domReference) || Dr)
      return;
    const en = N ? bt(N.nodesRef.current, Qt) : [];
    if (en.length > 0) {
      let te = !0;
      if (en.forEach((de) => {
        var De;
        if ((De = de.context) != null && De.open && !de.context.dataRef.current.__outsidePressBubbles) {
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
      D(j), (I = Pe(j)) == null || I.removeEventListener(s, z);
    };
    ($ = Pe(j)) == null || $.addEventListener(s, z);
  });
  m.useEffect(() => {
    if (!n || !i)
      return;
    l.current.__escapeKeyBubbles = C, l.current.__outsidePressBubbles = w;
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
    c && (T.addEventListener("keydown", S ? R : P, S), T.addEventListener("compositionstart", z), T.addEventListener("compositionend", I)), x && T.addEventListener(s, O ? L : D, O);
    let K = [];
    return h && (Z(o.domReference) && (K = pe(o.domReference)), Z(o.floating) && (K = K.concat(pe(o.floating))), !Z(o.reference) && o.reference && o.reference.contextElement && (K = K.concat(pe(o.reference.contextElement)))), K = K.filter((X) => {
      var ue;
      return X !== ((ue = T.defaultView) == null ? void 0 : ue.visualViewport);
    }), K.forEach((X) => {
      X.addEventListener("scroll", $, {
        passive: !0
      });
    }), () => {
      c && (T.removeEventListener("keydown", S ? R : P, S), T.removeEventListener("compositionstart", z), T.removeEventListener("compositionend", I)), x && T.removeEventListener(s, O ? L : D, O), K.forEach((X) => {
        X.removeEventListener("scroll", $);
      }), window.clearTimeout(j);
    };
  }, [l, o, c, x, s, n, r, h, i, C, w, P, S, R, D, O, L]), m.useEffect(() => {
    b.current = !1;
  }, [x, s]);
  const V = m.useMemo(() => ({
    onKeyDown: P,
    [Wl[f]]: (j) => {
      d && r(!1, j.nativeEvent, "reference-press");
    }
  }), [P, r, d, f]), _ = m.useMemo(() => ({
    onKeyDown: P,
    onMouseDown() {
      v.current = !0;
    },
    onMouseUp() {
      v.current = !0;
    },
    [Ul[s]]: () => {
      b.current = !0;
    }
  }), [P, s]);
  return m.useMemo(() => i ? {
    reference: V,
    floating: _
  } : {}, [i, V, _]);
}
function Zl(e) {
  const {
    open: t = !1,
    onOpenChange: n,
    elements: r
  } = e, o = Cr(), l = m.useRef({}), [i] = m.useState(() => Ll()), c = Tl() != null;
  if (process.env.NODE_ENV !== "production") {
    const p = r.reference;
    p && !Z(p) && Al("Cannot pass a virtual element to the `elements.reference` option,", "as it must be a real DOM element. Use `refs.setPositionReference()`", "instead.");
  }
  const [u, s] = m.useState(r.reference), d = ke((p, y, N) => {
    l.current.openEvent = p ? y : void 0, i.emit("openchange", {
      open: p,
      event: y,
      reason: N,
      nested: c
    }), n == null || n(p, y, N);
  }), f = m.useMemo(() => ({
    setPositionReference: s
  }), []), h = m.useMemo(() => ({
    reference: u || r.reference || null,
    floating: r.floating || null,
    domReference: r.reference
  }), [u, r.reference, r.floating]);
  return m.useMemo(() => ({
    dataRef: l,
    open: t,
    onOpenChange: d,
    elements: h,
    events: i,
    floatingId: o,
    refs: f
  }), [t, d, h, i, o, f]);
}
function ql(e) {
  e === void 0 && (e = {});
  const {
    nodeId: t
  } = e, n = Zl({
    ...e,
    elements: {
      reference: null,
      floating: null,
      ...e.elements
    }
  }), r = e.rootContext || n, o = r.elements, [l, i] = m.useState(null), [c, u] = m.useState(null), d = (o == null ? void 0 : o.domReference) || l, f = m.useRef(null), h = Rr();
  ye(() => {
    d && (f.current = d);
  }, [d]);
  const p = xl({
    ...e,
    elements: {
      ...o,
      ...c && {
        reference: c
      }
    }
  }), y = m.useCallback((v) => {
    const C = Z(v) ? {
      getBoundingClientRect: () => v.getBoundingClientRect(),
      contextElement: v
    } : v;
    u(C), p.refs.setReference(C);
  }, [p.refs]), N = m.useCallback((v) => {
    (Z(v) || v === null) && (f.current = v, i(v)), (Z(p.refs.reference.current) || p.refs.reference.current === null || // Don't allow setting virtual elements using the old technique back to
    // `null` to support `positionReference` + an unstable `reference`
    // callback ref.
    v !== null && !Z(v)) && p.refs.setReference(v);
  }, [p.refs]), g = m.useMemo(() => ({
    ...p.refs,
    setReference: N,
    setPositionReference: y,
    domReference: f
  }), [p.refs, N, y]), x = m.useMemo(() => ({
    ...p.elements,
    domReference: d
  }), [p.elements, d]), b = m.useMemo(() => ({
    ...p,
    ...r,
    refs: g,
    elements: x,
    nodeId: t
  }), [p, g, x, t, r]);
  return ye(() => {
    r.dataRef.current.floatingContext = b;
    const v = h == null ? void 0 : h.nodesRef.current.find((C) => C.id === t);
    v && (v.context = b);
  }), m.useMemo(() => ({
    ...p,
    context: b,
    refs: g,
    elements: x
  }), [p, g, x, b]);
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
      [Hl]: ""
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
              for (var h, p = arguments.length, y = new Array(p), N = 0; N < p; N++)
                y[N] = arguments[N];
              return (h = r.get(s)) == null ? void 0 : h.map((g) => g(...y)).find((g) => g !== void 0);
            };
          }
        } else
          i[s] = d;
    }), i), {})
  };
}
function zl(e) {
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
function Yl({
  isOpen: e,
  setIsOpen: t,
  offset: n = 0,
  placement: r = "bottom-start",
  click: o = !0
}) {
  const { x: l, y: i, strategy: c, refs: u, context: s } = ql({
    open: e,
    onOpenChange: t,
    middleware: [Cl(), yl(n), Rl()],
    whileElementsMounted: pl,
    placement: r
  }), d = $l(s, {
    enabled: o
  }), f = Kl(s, {}), { getReferenceProps: h, getFloatingProps: p } = zl([
    d,
    f
  ]);
  return {
    x: l,
    y: i,
    strategy: c,
    refs: u,
    getReferenceProps: h,
    getFloatingProps: p
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
  const { x: s, y: d, strategy: f, refs: h, getReferenceProps: p, getFloatingProps: y } = Yl({
    isOpen: e,
    setIsOpen: t,
    offset: n,
    placement: r,
    hover: o,
    click: l
  }), [N, g] = Vr.toArray(c), [x] = k(Kn);
  function b() {
    return e && /* @__PURE__ */ a(_l, { id: x, children: /* @__PURE__ */ a(
      "div",
      {
        ref: h.setFloating,
        style: {
          position: f,
          top: d ?? 0,
          left: s ?? 0
        },
        ...y(),
        children: g
      }
    ) });
  }
  function v() {
    return e && /* @__PURE__ */ a(
      "div",
      {
        ref: h.setFloating,
        style: {
          position: f,
          top: d ?? 0,
          left: s ?? 0
        },
        ...y(),
        children: g
      }
    );
  }
  return /* @__PURE__ */ E(G, { children: [
    /* @__PURE__ */ a(
      "div",
      {
        ref: h.setReference,
        ...p({ onClick: i }),
        children: N
      }
    ),
    u ? b() : v()
  ] });
}
function Gl({
  rowId: e,
  colId: t,
  data: n,
  setData: r,
  focus: o,
  isViewOnly: l,
  configuration: i
}) {
  const [c] = k(ie), u = W(
    () => c.parseDate !== void 0 ? c.parseDate(n, i) : n ? new Date(Date.parse(n)) : null,
    [n, i]
  ), [s, d] = B(
    u && u._isValid !== !1 ? Fe(u) : ""
  ), f = /^([1-9]|1[012]|0[1-9])[/.-]?$/g, h = /^([1-9]|1[012]|0[1-9])[/.-]([1-9]||0[1-9]|1[0-9]|2[0-9]|3[01])[/.-]?$/g, p = /^([1-9]|1[012]|0[1-9])[/.-]([1-9]||0[1-9]|1[0-9]|2[0-9]|3[01])[/.-](\d?\d?\d?\d)$/g, [y, N] = B(null), g = /* @__PURE__ */ new Date(), [, x] = k(Ut), b = o === "editing", v = Y(
    (O) => {
      x({ rowId: e, colId: t, value: O ? "editing" : "focused" });
    },
    [e, t, x]
  );
  function C(O, A, P) {
    const R = Number(P), D = Number(O) - 1, L = Number(A), V = /* @__PURE__ */ new Date();
    return V.setUTCFullYear(R, D, L), V.setUTCHours(0, 0, 0, 0), V;
  }
  const w = Y(
    (O) => {
      c.formatStoredDate !== void 0 ? r(c.formatStoredDate(O, i) || "") : r((O == null ? void 0 : O.toISOString()) || ""), c.formatStoredDate !== void 0 ? d(c.formatStoredDate(u, i) || "") : d(Fe(O)), x({ rowId: e, colId: t, value: "focused" });
    },
    [e, t, x, r]
  );
  q(() => {
    y && y.focus();
  }, [y]), q(() => {
    c.formatStoredDate !== void 0 ? d(c.formatStoredDate(u, i) || "") : d(u && u._isValid !== !1 ? Fe(u) : "");
  }, [o]);
  function S(O) {
    d(O.target.value);
  }
  return ci(() => {
    if (!s || c.formatStoredDate !== void 0)
      return;
    let O = null;
    if (p.test(s)) {
      s.match(p);
      const [A] = s.matchAll(p);
      O = C(A[1], A[2], A[3]);
    } else if (f.test(s)) {
      s.match(f);
      const [A] = s.matchAll(f);
      O = C(A[1], 1, g.getUTCFullYear());
    } else if (h.test(s)) {
      s.match(h);
      const [A] = s.matchAll(h);
      O = C(
        A[1],
        A[2],
        g.getUTCFullYear()
      );
    }
    r((O == null ? void 0 : O.toISOString()) || "");
  }, [s]), /* @__PURE__ */ E(G, { children: [
    (o === "none" || o === "focused") && /* @__PURE__ */ a("div", { className: "p-1 flex items-center cursor-default w-full", children: u ? c.formatDisplayDate !== void 0 ? c.formatDisplayDate(u, i) : Fe(u) : "" }),
    o === "editing" && !l && /* @__PURE__ */ E(le, { isOpen: b, setIsOpen: v, offset: 4, children: [
      /* @__PURE__ */ E("div", { className: "h-full", children: [
        /* @__PURE__ */ a("input", { type: "data", className: "hidden", value: s, readOnly: !0 }),
        /* @__PURE__ */ a(
          "input",
          {
            placeholder: "mm/dd/yyyy",
            className: "rs-input focus:outline-none rounded p-1 w-full",
            onChange: S,
            value: s,
            ref: N
          }
        )
      ] }),
      /* @__PURE__ */ a(hi, { onSelect: w, value: (u == null ? void 0 : u._isValid) !== !1 ? u : null })
    ] })
  ] });
}
const Xl = {
  32: "truncate",
  64: "line-clamp-2",
  96: "line-clamp-4",
  128: "line-clamp-5"
};
function Jl({ data: e, setData: t, focusState: n, isViewOnly: r }) {
  const [o, l] = B(null), i = W(() => e || "", [e]), [c] = k(Wt);
  function u(s) {
    s.preventDefault(), t(s.target.value);
  }
  return q(() => {
    o && (o.focus(), o.setSelectionRange(
      i.length + 1,
      i.length || 1
    ), o.scrollTop = o.scrollHeight);
  }, [o]), /* @__PURE__ */ E(G, { children: [
    (n === "none" || n === "focused") && /* @__PURE__ */ a(
      "div",
      {
        className: U(
          "p-1 cursor-default w-full h-full",
          Xl[c]
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
const Ql = [
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
  options: e = Ql,
  allOptions: t,
  onSelect: n,
  placeholder: r = "Search",
  inputRef: o,
  OptionRenderer: l,
  value: i = {},
  onNewOption: c,
  enableSearch: u = !0
}) {
  const [s, d] = B(e), f = s.find((R) => R.value === i.value), [h, p] = B(f || s[0]), [y, N] = B(!1), [g, x] = B(""), b = W(() => Nt(), []), [v, C] = B({}), w = he(!1);
  q(() => {
    let R = !1;
    if (t)
      for (const L in t)
        t[L].name.toLowerCase() === g.toLowerCase() && (R = !0);
    const D = e.filter((L) => (L.name.toLowerCase() === g.toLowerCase() && (R = !0), L.name.toLowerCase().includes(g.toLowerCase())));
    d(D), w.current ? D.length > 0 ? p(D[0]) : p({
      value: g,
      name: g,
      color: b
    }) : p(f || D[0]), C(R ? {} : {
      value: g,
      name: g,
      color: b
    }), N(R);
  }, [g]);
  function S(R) {
    n == null || n(R);
  }
  function O(R) {
    N(!1), x(R.target.value), w.current = !0;
  }
  const A = Y((R) => {
    if (R.code === "Enter") {
      if (R.preventDefault(), s.length === 0 && y || !h.value)
        return;
      c && !y && c(v), S(h);
    } else if (R.code === "ArrowDown") {
      h || p(s[0]);
      const D = s.findIndex(
        (L) => L.value === h.value
      );
      p(s[(D + 1) % s.length]);
    } else if (R.code === "ArrowUp") {
      h || p(s[0]);
      const D = s.findIndex(
        (L) => L.value === h.value
      );
      p(
        s[(D + s.length - 1) % s.length]
      );
    }
  });
  function P(R) {
    R.preventDefault(), p(s[0]);
  }
  return /* @__PURE__ */ E(
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
            value: g
          }
        ) }),
        /* @__PURE__ */ E("ul", { className: "rs-list max-h-48 overflow-auto pb-2", children: [
          s.map((R) => /* @__PURE__ */ E(
            "li",
            {
              className: U(
                "hover:bg-hover-light px-2 p-1 cursor-default flex flex-row whitespace-nowrap",
                h && h.value === R.value && "bg-hover"
              ),
              onClick: (D) => {
                D.preventDefault(), S(R);
              },
              onMouseEnter: () => {
                p(R);
              },
              "aria-selected": h.value === R.value,
              onKeyDown: (D) => {
                D.code === "Enter" && S(R);
              },
              children: [
                l ? /* @__PURE__ */ a(l, { ...R }) : R.name,
                f && f.value === R.value && /* @__PURE__ */ a(Kt, { className: "w-4 h-4 ml-auto self-center" })
              ]
            },
            R.value
          )),
          c && g && !y && /* @__PURE__ */ E(
            "li",
            {
              className: U(
                "hover:bg-hover-light px-2 p-1 cursor-pointer flex flex-row whitespace-nowrap",
                h && h.value === v.value && "bg-hover"
              ),
              onClick: () => c(v),
              onMouseEnter: () => {
                p(v);
              },
              "aria-selected": !1,
              onKeyDown: (R) => {
                R.code === "Enter" && c(v);
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
function es({
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
    () => Ce(n) ? [] : n.split(",").map((x) => o.find((b) => b.value === x)),
    [n, o]
  ), [d, f] = B(null), h = i === "editing", [, p] = k(Ut), y = Y(
    (x) => {
      p({ rowId: e, colId: t, value: x ? "editing" : "focused" });
    },
    [t, e, p]
  ), N = o.filter(
    (x) => s.findIndex((b) => b.value === x.value) === -1
  );
  q(() => {
    d && d.focus();
  }, [d]);
  const g = Y(
    (x) => {
      l({ id: t, options: [...o, x] }), r([...s.map((b) => b.value), x.value].join(",")), p({ rowId: e, colId: t, value: "focused" });
    },
    [t, e, s, o, l, r, p]
  );
  return /* @__PURE__ */ E(G, { children: [
    i === "none" && /* @__PURE__ */ a("div", { className: "p-1 flex items-center h-full overflow-hidden", children: /* @__PURE__ */ a("div", { className: "flex gap-1", children: s.map((x) => x ? /* @__PURE__ */ a(me, { color: x.color, name: x.name }, x.name) : null) }) }),
    (i === "focused" || i === "editing") && /* @__PURE__ */ E(
      le,
      {
        isOpen: h && !u,
        setIsOpen: y,
        referenceClass: "w-full max-h-8",
        children: [
          /* @__PURE__ */ a(
            "div",
            {
              className: "flex items-center p-1 w-full h-full bg-content",
              tabIndex: i === "editing" ? 0 : -1,
              children: /* @__PURE__ */ E("div", { className: "flex gap-1 flex-wrap", children: [
                s.map((x) => x ? /* @__PURE__ */ a(
                  me,
                  {
                    color: x.color,
                    name: x.name,
                    onCancel: (b) => {
                      b.stopPropagation(), r(
                        n.split(",").filter((v) => v !== x.value).join(",")
                      );
                    }
                  },
                  x.name
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
          /* @__PURE__ */ E(F, { children: [
            /* @__PURE__ */ a("div", { className: "w-48" }),
            /* @__PURE__ */ a(
              He,
              {
                allOptions: o,
                options: N,
                onSelect: (x) => {
                  r(
                    Ce(n) ? x.value : `${n},${x.value}`
                  );
                },
                inputRef: f,
                OptionRenderer: me,
                placeholder: "Search for an option...",
                onNewOption: g,
                enableSearch: c
              }
            )
          ] })
        ]
      }
    )
  ] });
}
function ts({ data: e, setData: t, setError: n, focus: r, isViewOnly: o, configuration: l }) {
  const [i] = k(ie), [c, u] = B(null), s = /^[+-]?(\d*(\.\d*)?)$/, d = W(() => i.parseNumber !== void 0 ? i.parseNumber(e, l) : Number.parseFloat(e), [e, l]);
  function f(h) {
    h.preventDefault(), (i.parseNumber !== void 0 ? !isNaN(i.parseNumber(h.target.value, l)) : s.test(h.target.value)) ? (t(h.target.value), n("")) : n("Please enter a number.");
  }
  return q(() => {
    n(""), c && c.focus();
  }, [n, c]), /* @__PURE__ */ E(G, { children: [
    (r === "none" || r === "focused") && /* @__PURE__ */ a("div", { className: "p-1 flex items-center justify-end truncate cursor-default w-full", children: i.formatDisplayNumber !== void 0 ? i.formatDisplayNumber(d, l) : { data: e } }),
    r === "editing" && !o && /* @__PURE__ */ a(
      "input",
      {
        type: "text",
        value: (e || "").toString(),
        onChange: f,
        ref: u,
        className: "rs-input p-1 focus:outline-none w-full border-none text-sm rounded-sm truncate text-right"
      }
    )
  ] });
}
function ns({
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
    () => Ve(n) ? {} : o.find((g) => g.value === n)
  ), [d, f] = B(null), h = i === "editing", [, p] = k(Ut), y = Y(
    (g) => {
      p({ rowId: e, colId: t, value: g ? "editing" : "focused" });
    },
    [t, e, p]
  );
  q(() => {
    d && d.focus();
  }, [d]);
  const N = Y(
    (g) => {
      l({ id: t, options: [...o, g] }), r(g.value), p({ rowId: e, colId: t, value: "focused" });
    },
    [t, e, o, l]
  );
  return /* @__PURE__ */ E(G, { children: [
    i === "none" && /* @__PURE__ */ a("div", { className: "p-1 flex items-center h-full", children: s && /* @__PURE__ */ a(me, { color: s.color, name: s.name }) }),
    u && (i === "focused" || i === "editing") && /* @__PURE__ */ a("div", { className: "flex items-center p-1 w-full h-full", children: s && /* @__PURE__ */ a(me, { color: s.color, name: s.name }) }),
    !u && (i === "focused" || i === "editing") && /* @__PURE__ */ E(
      le,
      {
        isOpen: h,
        setIsOpen: y,
        referenceClass: "w-full max-h-8",
        children: [
          /* @__PURE__ */ E(
            "div",
            {
              className: "flex items-center p-1 w-full h-full",
              tabIndex: i === "editing" ? 0 : -1,
              children: [
                s && /* @__PURE__ */ a(me, { color: s.color, name: s.name }),
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
          /* @__PURE__ */ E(F, { children: [
            /* @__PURE__ */ a("div", { className: "w-48" }),
            /* @__PURE__ */ a(
              He,
              {
                options: o,
                onSelect: (g) => {
                  r(g.value), y(!1);
                },
                inputRef: f,
                OptionRenderer: me,
                placeholder: "Search for an option...",
                value: s,
                onNewOption: N,
                enableSearch: c
              }
            )
          ] })
        ]
      }
    )
  ] });
}
function rs({ data: e, setData: t, focusState: n, isViewOnly: r }) {
  const [o, l] = B(null), i = W(() => e || "", [e]);
  function c(u) {
    u.preventDefault(), t(u.target.value);
  }
  return q(() => {
    o && (o.focus(), o.setSelectionRange(i.length + 1, i.length + 1), o.scrollLeft = o.scrollWidth);
  }, [o]), /* @__PURE__ */ E(G, { children: [
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
function os({ ...e }) {
  return /* @__PURE__ */ E(
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
function is({ ...e }) {
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
function ls({ ...e }) {
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
function ss({ data: e, setData: t, focusState: n, isViewOnly: r }) {
  const [o, l] = B(null), i = W(() => e || "", [e]);
  function c(u) {
    u.preventDefault(), t(u.target.value);
  }
  return q(() => {
    o && (o.focus(), o.setSelectionRange(i.length + 1, i.length + 1), o.scrollLeft = o.scrollWidth);
  }, [o]), /* @__PURE__ */ E(G, { children: [
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
function Xt({ checked: e, toggle: t, isViewOnly: n }) {
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
        onClick: () => !n && t()
      }
    )
  ] });
}
function cs({ data: e, setData: t, focusState: n, isViewOnly: r }) {
  const o = W(() => e || !1, [e]);
  return /* @__PURE__ */ a(G, { children: /* @__PURE__ */ a("span", { className: "flex items-center justify-center p-1.5", children: /* @__PURE__ */ a(Xt, { checked: o, toggle: () => t(!o), isViewOnly: r }) }) });
}
function as({ rowData: e, formula: t }) {
  return /* @__PURE__ */ a(G, { children: /* @__PURE__ */ a("div", { className: "p-1 flex items-center cursor-default w-full", children: /* @__PURE__ */ a("div", { className: "truncate", children: t && typeof t == "function" && t(e) }) }) });
}
function us({ ...e }) {
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
    cell: rs,
    icon: is,
    name: "Single-Line Text"
  },
  {
    type: "longText",
    cell: Jl,
    icon: os,
    name: "Long Text"
  },
  {
    type: "number",
    cell: ts,
    icon: $o,
    name: "Number"
  },
  {
    type: "select",
    cell: ns,
    icon: Yo,
    name: "Select"
  },
  {
    type: "date",
    cell: Gl,
    icon: ls,
    name: "Date"
  },
  {
    type: "multiSelect",
    cell: es,
    icon: Zo,
    name: "Multiple Select"
  },
  {
    type: "url",
    cell: ss,
    icon: Uo,
    name: "URL"
  },
  {
    type: "checkbox",
    cell: cs,
    icon: jo,
    name: "Checkbox"
  },
  {
    type: "formula",
    cell: as,
    icon: us,
    name: "Formula"
  }
];
function Qe(e) {
  const [t] = k(ie);
  return [...Or, ...t.extraColumnTypes].find((n) => n.type === e);
}
function ds() {
  return Or;
}
const fs = et.memo(ms);
function ms({ rowId: e, colId: t, data: n, rowData: r, setData: o }) {
  const [l, i] = B(""), c = he(null), u = W(
    () => ot(e, t),
    [e, t]
  ), [s, d] = k(u), f = W(() => we(t), [t]), [h, p] = k(f), y = h.type === "custom" ? h.renderer : Qe(h.type).cell, N = W(
    () => Io(e, t),
    [e, t]
  ), [, g] = k(N);
  function x(w) {
    c.current && !c.current.contains(w.target) && d("none");
  }
  function b(w) {
    if (!c.current || w.target !== c.current) {
      w.code === "Escape" && d("focused");
      return;
    }
    w.code === "ArrowUp" ? (w.stopPropagation(), w.preventDefault(), g("up")) : w.code === "ArrowDown" ? (w.stopPropagation(), w.preventDefault(), g("down")) : w.code === "ArrowLeft" ? (w.stopPropagation(), w.preventDefault(), g("left")) : w.code === "ArrowRight" ? (w.stopPropagation(), w.preventDefault(), g("right")) : w.code === "Enter" ? (d("editing"), w.stopPropagation(), w.preventDefault()) : w.code === "Escape" && d("none");
  }
  function v(w) {
    c.current && w.target === c.current && d("focused");
  }
  function C(w) {
    w.stopPropagation(), !h.isViewOnly && d("editing");
  }
  return q(() => s === "focused" ? (document == null || document.addEventListener("mousedown", x), c.current && c.current.focus(), () => {
    document == null || document.removeEventListener("mousedown", x);
  }) : s === "editing" ? (document == null || document.addEventListener("mousedown", x), () => {
    document == null || document.removeEventListener("mousedown", x);
  }) : s === "none" ? (c.current && c.current.blur(), () => {
  }) : () => {
  }, [s]), /* @__PURE__ */ a(
    "div",
    {
      className: "relative p-0 border-r bg-content focus:outline-none",
      style: { width: h.width },
      ref: c,
      onClick: v,
      onFocus: v,
      onDoubleClick: C,
      tabIndex: 0,
      onKeyDown: b,
      role: "gridcell",
      children: /* @__PURE__ */ E(
        "div",
        {
          className: U(
            "w-full rounded-sm min-h-full focus:outline-none",
            (s === "focused" || s === "editing") && "ring-2 ring-blue-500 absolute top-0 z-10"
          ),
          children: [
            /* @__PURE__ */ a(
              y,
              {
                rowId: e,
                colId: t,
                initData: n,
                data: n,
                options: h.options,
                updateColumn: p,
                setError: i,
                focus: s,
                focusState: s,
                setFocus: d,
                setData: o,
                showOptionSearch: h.showOptionSearch,
                isViewOnly: h.isViewOnly,
                rowData: r,
                formula: h.formula,
                configuration: h.configuration
              }
            ),
            s === "editing" && l && /* @__PURE__ */ a("div", { className: "text-xs p-1.5 py-2", children: l })
          ]
        }
      )
    }
  );
}
function hs(e, t) {
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
function ps({ groupVal: e }) {
  const [t] = k(Le), n = W(
    () => {
      var i;
      return we(((i = t[0]) == null ? void 0 : i.columnId) || "");
    },
    [t]
  ), [r] = k(n), [o, l] = k(_t);
  return /* @__PURE__ */ E(
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
            children: /* @__PURE__ */ a(_o, { className: "w-4 h-4" })
          }
        ),
        /* @__PURE__ */ E("div", { className: "h-full p-1.5", children: [
          /* @__PURE__ */ a("div", { className: "text-xs tracking-wider uppercase font-medium text-secondary", children: r.name }),
          /* @__PURE__ */ a("div", { className: "flex mt-1", children: hs(e, r) })
        ] })
      ]
    }
  );
}
function gs({ groupVal: e }) {
  const [t] = k(Le), [, n] = k(qn);
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
function vs({ rowId: e, first: t, last: n, groupVal: r }) {
  const [o] = k(Le), [l] = k(_t), [i] = k(Oo), [c] = k(ie);
  return /* @__PURE__ */ E(
    "div",
    {
      className: U(
        t && o.length > 0 && "mt-8",
        o.length > 0 && "ml-4"
      ),
      style: { width: i },
      children: [
        o.length > 0 && t && /* @__PURE__ */ a(ps, { groupVal: r }),
        !l[r] && /* @__PURE__ */ E(G, { children: [
          /* @__PURE__ */ a("div", { className: U(o.length > 0 && "border-l"), children: /* @__PURE__ */ a(ws, { rowId: e }) }),
          c.addRow.enabled && c.addRow.body && n && /* @__PURE__ */ a(gs, { groupVal: r }),
          " "
        ] })
      ]
    }
  );
}
const ws = et.memo(bs);
function bs({ rowId: e }) {
  const t = W(() => Zn(e), [e]), [n, r] = k(t), [o] = k(fe), [l] = k(Wt), [i] = k(ie), c = W(
    () => (u) => (s) => {
      r({ [u]: s });
    },
    [r]
  );
  return /* @__PURE__ */ E("div", { className: U("flex relative border-b"), style: { height: l }, children: [
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
      fs,
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
const xs = Pn(({ handleScroll: e }, t) => {
  const [n] = k(Ie), [r] = k(ie);
  return /* @__PURE__ */ a(
    "div",
    {
      className: "h-[calc(100%-65px)] overflow-auto border-b bg-background",
      onScroll: e,
      ref: t,
      children: /* @__PURE__ */ E("div", { className: "flex flex-row", children: [
        /* @__PURE__ */ E("div", { className: "flex flex-col", children: [
          n.map((o, l) => /* @__PURE__ */ a(
            vs,
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
    atomFactory: (e) => an(e, (t) => Ce(t))
  },
  {
    type: "filled",
    name: "Filled",
    atomFactory: (e) => an(e, (t) => !Ce(t))
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
function ys() {
  return Ar.map((e) => e.type);
}
const Cs = Pn(({}, e) => {
  const [t] = k(fe), [n] = k(Le);
  return /* @__PURE__ */ a("div", { className: "bg-header h-8", children: /* @__PURE__ */ E("div", { className: "h-8 flex relative", ref: e, children: [
    /* @__PURE__ */ a(
      "div",
      {
        style: { width: 64 },
        className: U(n.length > 0 && "ml-4", "shrink-0 border-r")
      }
    ),
    t.map((r) => /* @__PURE__ */ a(Rs, { colId: r }, r)),
    /* @__PURE__ */ a("div", { className: "w-48 grow shrink-0" })
  ] }) });
});
function Rs({ colId: e }) {
  const t = W(() => we(e), [e]), [n, r] = k(t), o = Ln(n.summary), l = W(
    () => o ? o.atomFactory(n.id) : M(""),
    [o, n.id]
  ), [i] = k(l), c = ys(), [u, s] = B(!1);
  function d(f) {
    r({ summary: f }), s(!1);
  }
  return /* @__PURE__ */ E(
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
            children: o ? /* @__PURE__ */ E(G, { children: [
              /* @__PURE__ */ a("span", { className: "text-xs text-secondary", children: o.name }),
              /* @__PURE__ */ a("span", { className: "ml-1", children: i })
            ] }) : /* @__PURE__ */ E(G, { children: [
              /* @__PURE__ */ a(rr, { className: "w-4 h-4 hidden group-hover:block" }),
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
              const h = Ln(f);
              return /* @__PURE__ */ a(
                F.Section.Button,
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
    d: "M12 2.25a.75.75 0 0 1 .75.75v16.19l6.22-6.22a.75.75 0 1 1 1.06 1.06l-7.5 7.5a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 1 1 1.06-1.06l6.22 6.22V3a.75.75 0 0 1 .75-.75Z",
    clipRule: "evenodd"
  }));
}
const Ns = /* @__PURE__ */ m.forwardRef(Es);
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
    d: "M11.47 2.47a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 1 1-1.06 1.06l-6.22-6.22V21a.75.75 0 0 1-1.5 0V4.81l-6.22 6.22a.75.75 0 1 1-1.06-1.06l7.5-7.5Z",
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
    d: "M6.97 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1-1.06 1.06L8.25 4.81V16.5a.75.75 0 0 1-1.5 0V4.81L3.53 8.03a.75.75 0 0 1-1.06-1.06l4.5-4.5Zm9.53 4.28a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V7.5a.75.75 0 0 1 .75-.75Z",
    clipRule: "evenodd"
  }));
}
const Mn = /* @__PURE__ */ m.forwardRef(Os);
function As({
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
const Jt = /* @__PURE__ */ m.forwardRef(As);
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
    d: "M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z",
    clipRule: "evenodd"
  }));
}
const Ms = /* @__PURE__ */ m.forwardRef(Ls);
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
    d: "M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z",
    clipRule: "evenodd"
  }));
}
const dt = /* @__PURE__ */ m.forwardRef(Ds);
function Ts({ colId: e, supportedTypes: t }) {
  const [n] = k(W(() => we(e), [e])), [, r] = k(Po), o = W(() => rt(e), [e]), [, l] = k(o);
  function i(c, u) {
    c.preventDefault(), r({ colId: n.id, type: u }), l(!1);
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
function Ps({
  colId: e,
  sortCallback: t,
  filterCallback: n,
  deleteCallback: r
}) {
  const [o, l] = k(W(() => we(e), [e])), i = he(), c = o.type === "custom" ? o.icon : Qe(o.type).icon, u = o.type === "custom" ? "Custom" : Qe(o.type).name, [, s] = k(Yn), [, d] = k(Gn), f = W(() => rt(e), [e]), [, h] = k(f), [p] = k(ie), y = W(() => [...ds(), ...p.extraColumnTypes], []);
  q(() => {
    i.current && i.current.select();
  }, [i]);
  function N(R) {
    R.preventDefault(), l({ name: R.target.value });
  }
  function g(R) {
    R.code;
  }
  function x(R) {
    R.preventDefault(), r(o), h(!1);
  }
  function b(R) {
    R.preventDefault(), R.stopPropagation(), t([{ columnId: o.id, order: "asc" }]), s(!0), h(!1);
  }
  function v(R) {
    R.preventDefault(), R.stopPropagation(), t([{ columnId: o.id, order: "desc" }]), s(!0), h(!1);
  }
  function C(R) {
    R.preventDefault(), R.stopPropagation(), n([{ columnId: o.id, type: "contains", value: "" }]), d(!0), h(!1);
  }
  const w = [
    [
      {
        name: "Sort Ascending",
        icon: Ss,
        action: b,
        enabled: p.sorting.enabled
      },
      {
        name: "Sort Descending",
        icon: Ns,
        action: v,
        enabled: p.sorting.enabled
      },
      {
        name: "Filter",
        icon: It,
        action: C,
        enabled: p.filtering.enabled
      }
    ],
    [
      {
        name: "Delete",
        icon: Ms,
        action: x,
        disabled: o.is_primary === "true" || o.is_primary === !0,
        enabled: p.deleteColumns.enabled
      }
    ]
  ], [S, O] = B(!1), [A, P] = B(null);
  if (S)
    return /* @__PURE__ */ a(Ts, { colId: e, supportedTypes: y });
  if (A !== null) {
    const R = p.extraColumnHeaderPopupActions[A];
    return /* @__PURE__ */ a(R.popup, { column: o, setColumn: l, close: () => h(!1) });
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
          onKeyDown: g,
          className: "rs-input focus:outline-none focus:ring rounded rounded-2 p-1 border w-full mb-2"
        }
      ) }),
      /* @__PURE__ */ a(F.Section.Item, { children: /* @__PURE__ */ a("span", { className: "uppercase font-medium text-secondary text-xs", children: "Property Type" }) }),
      /* @__PURE__ */ E(F.Section.Button, { onClick: () => O(!0), children: [
        c && /* @__PURE__ */ a(c, { className: "w-4 h-4 mr-2" }),
        u
      ] }),
      p.extraColumnHeaderPopupActions.map((R, D) => ({ popupAction: R, index: D })).filter(({ popupAction: R }) => R.section === "main").map(({ popupAction: R, index: D }) => /* @__PURE__ */ a(R.menuItem, { column: o, showPopup: () => {
        P(D);
      } }, D))
    ] }),
    w.map(
      (R, D) => R.findIndex((L) => L.enabled === !0) !== -1 && /* @__PURE__ */ E(F.Section, { children: [
        R.map(
          (L) => L.enabled && /* @__PURE__ */ E(
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
        p.extraColumnHeaderPopupActions.filter((L) => L.section === "actions" + (D + 1)).map((L, V) => /* @__PURE__ */ a(L.menuItem, { column: o, showPopup: () => {
          P(V);
        } }, V))
      ] }, R[0].name)
    )
  ] });
}
function Is({
  colId: e,
  deleteCallback: t,
  sortCallback: n,
  filterCallback: r
}) {
  const [o, l] = k(W(() => we(e), [e])), i = o.type === "custom" ? o.icon : Qe(o.type).icon, [c, u] = B(o.width), [s, d] = B(!1), f = W(() => rt(e), [e]), [h, p] = k(f), [y] = k(ie);
  function N(g) {
    g.preventDefault();
    const x = g.pageX, b = c;
    d(!0);
    function v(C) {
      const w = Math.max(
        128,
        b + C.pageX - x
      );
      u(w), l({ width: w });
    }
    window.addEventListener("mousemove", v), window.addEventListener("mouseup", () => {
      window.removeEventListener("mousemove", v), d(!1);
    });
  }
  return /* @__PURE__ */ E("div", { className: "relative", children: [
    /* @__PURE__ */ E(
      le,
      {
        isOpen: y.editColumns.enabled && o.isEditable && h && o.type !== "custom",
        setIsOpen: p,
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
            Ps,
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
        onMouseDown: N,
        role: "none"
      }
    )
  ] });
}
const Fs = et.forwardRef((e, t) => {
  const [n] = k(fe), [r] = k(Mo), o = jt(Do), [l] = k(Ht), [i] = k(Le), [, c] = k(ko), [, u] = k(Xn), [, s] = k(Qn), d = Y(
    (g) => {
      s({ filtering: g });
    },
    [s]
  ), f = Y(
    (g) => {
      u({ sorting: g });
    },
    [u]
  ), [, h] = k(So), p = Y((g) => {
    if (l.find((x) => x.columnId === g.id)) {
      const x = l.filter((b) => b.columnId !== g.id);
      f(x);
    }
    h({ id: g.id });
  });
  function y(g) {
    g.preventDefault(), c({
      id: tt(),
      name: `Column-${Et()}`,
      type: "text",
      width: 192,
      position: n.length,
      isVisible: !0,
      isEditable: !0
    });
  }
  const [N] = k(ie);
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
              children: /* @__PURE__ */ a(Xt, { checked: r, toggle: o })
            }
          ),
          n.map((g) => /* @__PURE__ */ a(
            Is,
            {
              colId: g,
              sortCallback: f,
              filterCallback: d,
              deleteCallback: p
            },
            g
          )),
          N.addColumn.enabled && /* @__PURE__ */ a(
            "div",
            {
              onClick: y,
              className: "rs-btn h-8 p-1 cursor-pointer border-r hover:bg-hover-light font-normal w-16 flex items-center justify-center",
              "aria-label": "add-column",
              onKeyDown: (g) => {
                g.code === "Enter" && y(g);
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
function Ae({
  options: e = Vs,
  value: t = {},
  onSelect: n
}) {
  const [r, o] = B(!1), [l, i] = B(t), c = e.find((s) => s.value === l.value);
  function u(s) {
    i(s), o(!1), n == null || n(s);
  }
  return /* @__PURE__ */ a("div", { className: "w-full relative", children: /* @__PURE__ */ E(
    le,
    {
      isOpen: r,
      setIsOpen: o,
      offset: 4,
      portal: !0,
      children: [
        /* @__PURE__ */ E("div", { className: "rs-btn flex flex-row relative w-full border rounded p-1 pl-2 items-center hover:bg-hover focus:outline-none cursor-default", children: [
          /* @__PURE__ */ a("div", { className: "text-ellipsis flex-grow text-left whitespace-nowrap overflow-hidden", children: l.name ? /* @__PURE__ */ a("span", { children: l.name }) : /* @__PURE__ */ a("span", { className: "text-secondary", children: "Select" }) }),
          /* @__PURE__ */ a(ii, { className: "w-4 h-4 duration-100 ml-auto" })
        ] }),
        /* @__PURE__ */ a("div", { className: "min-w-full w-max focus:outline-none", children: /* @__PURE__ */ E(F, { children: [
          /* @__PURE__ */ a("div", { className: "w-48" }),
          /* @__PURE__ */ a(F.Section, { children: e.map((s) => /* @__PURE__ */ E(
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
function _s({ columns: e, filter: t, setFilter: n }) {
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
    () => js((s, d) => {
      n((f) => {
        const h = f.findIndex((p) => p.id === s.id);
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
  function u(s) {
    var d;
    return (d = e.find((f) => f.id === s)) == null ? void 0 : d.type;
  }
  return /* @__PURE__ */ E(F, { children: [
    /* @__PURE__ */ a("div", { className: "w-56" }),
    t.length > 0 ? /* @__PURE__ */ E(F.Section, { children: [
      /* @__PURE__ */ a("h3", { className: "text-sm mb-3 px-3 font-medium", children: "Filter By" }),
      /* @__PURE__ */ a("div", { className: "px-3 flex flex-col space-y-3", children: t.map((s) => /* @__PURE__ */ E(
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
                  const h = f.findIndex((p) => p.id === s.id);
                  return [
                    ...f.slice(0, h),
                    {
                      ...f[h],
                      type: u(d.value) === "number" ? "equals" : "contains",
                      columnId: d.value
                    },
                    ...f.slice(h + 1, f.length)
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
                  const h = f.findIndex((p) => p.id === s.id);
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
      /* @__PURE__ */ a("div", { className: "py-2 px-3", children: /* @__PURE__ */ E(
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
function Bs({ setFilter: e }) {
  const [t] = k(Jn), [n] = k(yo), [r, o] = k(Gn);
  return /* @__PURE__ */ E(
    le,
    {
      isOpen: r,
      setIsOpen: o,
      offset: 4,
      portal: !0,
      portalId: "table",
      children: [
        Object.keys(t).length > 0 ? /* @__PURE__ */ E("div", { className: "rs-btn h-8 hover:ring-2 hover:ring-black/10 hover:ring-inset bg-indigo-200 px-3 rounded text-sm flex row items-center cursor-default text-dark", children: [
          /* @__PURE__ */ a(It, { className: "w-4 h-4 mr-1" }),
          /* @__PURE__ */ a("span", { children: `Filtered by ${Object.keys(t).length} field` })
        ] }) : /* @__PURE__ */ E(
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
        /* @__PURE__ */ a(_s, { columns: n, filter: t, setFilter: e })
      ]
    }
  );
}
function Dn({ ...e }) {
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
function Hs({ columns: e, grouping: t, setGroup: n }) {
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
function $s({ grouping: e = [], setGroup: t }) {
  const [n, r] = B(!1), [o] = k(zn);
  return /* @__PURE__ */ E(
    le,
    {
      isOpen: n,
      setIsOpen: r,
      offset: 4,
      portal: !0,
      portalId: "table",
      children: [
        e.length > 0 ? /* @__PURE__ */ E("div", { className: "rs-btn h-8 hover:ring-2 hover:ring-black/10 hover:ring-inset bg-purple-200 px-3 rounded text-sm flex row items-center cursor-default text-dark", children: [
          /* @__PURE__ */ a(Dn, { className: "w-4 h-4 mr-1" }),
          /* @__PURE__ */ a("span", { children: "Grouped by 1 field" })
        ] }) : /* @__PURE__ */ E(
          "div",
          {
            className: U(
              "rs-btn hover:bg-hover px-3 rounded flex flex-row items-center h-8 cursor-default",
              n && "bg-hover"
            ),
            children: [
              /* @__PURE__ */ a(Dn, { className: "w-4 h-4 mr-1" }),
              /* @__PURE__ */ a("span", { children: "Group" })
            ]
          }
        ),
        /* @__PURE__ */ a(Hs, { columns: o, grouping: e, setGroup: t })
      ]
    }
  );
}
function Ws({ value: e, setValue: t }) {
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
function Us({ colId: e }) {
  const [t, n] = k(W(() => we(e), [e]));
  return /* @__PURE__ */ E(F.Section.Item, { children: [
    /* @__PURE__ */ a(
      Ws,
      {
        value: t.isVisible,
        setValue: (r) => n({ isVisible: r })
      }
    ),
    /* @__PURE__ */ a("span", { className: "ml-2", children: t.name })
  ] }, t.id);
}
function Ks({ setColumnVisibility: e }) {
  const [t] = k(Co);
  return /* @__PURE__ */ E(F, { children: [
    /* @__PURE__ */ a("div", { className: "w-48" }),
    /* @__PURE__ */ a(F.Section, { children: t.map((n) => /* @__PURE__ */ a(Us, { colId: n })) })
  ] });
}
function Zs({ setColumnVisibility: e }) {
  const [t, n] = B(!1), [r] = k(Ro);
  return /* @__PURE__ */ E(le, { isOpen: t, setIsOpen: n, offset: 4, portal: !0, children: [
    r > 0 ? /* @__PURE__ */ E("div", { className: "rs-btn h-8 hover:ring-2 hover:ring-black/10 hover:ring-inset bg-green-200 px-3 rounded text-sm flex row items-center focus:outline-none cursor-default text-dark", children: [
      /* @__PURE__ */ a(un, { className: "w-4 h-4 mr-1" }),
      /* @__PURE__ */ a("span", { children: `${r} hidden fields` })
    ] }) : /* @__PURE__ */ E(
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
    /* @__PURE__ */ a(Ks, { setColumnVisibility: e })
  ] });
}
function qs({ ...e }) {
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
function zs({ ...e }) {
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
          d: "M2 20H14M20 4V20M20 4L18 6M20 4L22 6M20 20L18 18M20 20L22 18M14 4H2V14.5H14V4Z",
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
    icon: Gs
  }
];
function Mr(e) {
  return Lr.find((t) => t.value === e);
}
function Xs() {
  return Lr.map((e) => e.value);
}
function Js({ height: e, setHeight: t }) {
  const n = Xs();
  return /* @__PURE__ */ E(F, { children: [
    /* @__PURE__ */ a("div", { className: "w-48" }),
    /* @__PURE__ */ a(F.Section, { children: n.map((r) => {
      const o = Mr(r);
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
function Qs({ height: e, setHeight: t }) {
  const [n, r] = B(!1), o = Mr(e);
  return /* @__PURE__ */ E(
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
        /* @__PURE__ */ a(Js, { height: e, setHeight: t })
      ]
    }
  );
}
function ec({ active: e, Icon: t, text: n, bgColor: r }) {
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
function tc({ sort: e, setSort: t }) {
  const [n, r] = B(null), [o] = k(zn), l = [
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
function nc({ setSort: e }) {
  const [t] = k(Ht), [n, r] = k(Yn);
  return /* @__PURE__ */ E(
    le,
    {
      isOpen: n,
      setIsOpen: r,
      offset: 4,
      portal: !0,
      portalId: "table",
      children: [
        t.length > 0 ? /* @__PURE__ */ a(
          ec,
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
        /* @__PURE__ */ a(tc, { sort: t, setSort: e })
      ]
    }
  );
}
function rc() {
  const [e] = k(xo), [t] = k(Jn), [n] = k(Ht), [r] = k(Le), [o] = k(Wt), [l] = k(bo), [, i] = k(Qn), c = jt(To), [, u] = k(go), [, s] = k(qn), [, d] = k(vo), [f] = k(ie), h = Y((w) => {
    i({ filtering: w });
  }, []), p = Y((w) => {
    w.preventDefault(), u();
  }, []);
  function y(w) {
    s({ id: tt() });
  }
  const [, N] = k(Xn), g = Y((w) => {
    N({ sorting: w });
  }, []), [, x] = k(Lo), b = Y((w) => {
    x({ rowHeight: w });
  }, []), [, v] = k(Ao), C = Y((w) => {
    v({ grouping: w });
  }, []);
  return /* @__PURE__ */ a(
    "div",
    {
      className: "w-full bg-content py-2 text-sm overflow-y-hidden h-12 relative border-b",
      id: "toolbar",
      children: /* @__PURE__ */ E("div", { className: "flex flex-row space-x-2 px-3 items-center whitespace-nowrap h-full", children: [
        /* @__PURE__ */ E("div", { className: "items-center flex w-20 justify-center", children: [
          l > 0 ? l : "No",
          " row",
          l !== 1 && "s"
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
          /* @__PURE__ */ E(
            "div",
            {
              className: "rs-btn self-stretch hover:bg-hover-light px-2 rounded-r text-sm flex flex-row items-center",
              onClick: p,
              children: [
                /* @__PURE__ */ a(Xo, { className: "w-4 h-4 mr-1" }),
                /* @__PURE__ */ a("span", { children: "Delete" })
              ]
            }
          ),
          /* @__PURE__ */ a("div", { className: "bg-content h-4 w-px last:hidden" }),
          f.rowSelectionButtons.map((w) => /* @__PURE__ */ E(G, { children: [
            /* @__PURE__ */ a(
              "div",
              {
                className: "rs-btn self-stretch hover:bg-hover-light px-2 rounded-r text-sm flex flex-row items-center",
                onClick: () => d({
                  handler: w.handler
                }),
                children: w.body
              }
            ),
            /* @__PURE__ */ a("div", { className: "bg-content h-4 w-px last:hidden" })
          ] }))
        ] }),
        /* @__PURE__ */ a("div", { className: "h-4 border" }),
        f.addRow.enabled && f.addRow.toolbar && /* @__PURE__ */ E(
          "div",
          {
            className: "rs-btn hover:bg-hover px-3 rounded flex flex-row items-center h-8 focus:outline-none",
            onClick: y,
            children: [
              /* @__PURE__ */ a(Jt, { className: "w-4 h-4 mr-1" }),
              /* @__PURE__ */ a("span", { children: "New row" })
            ]
          }
        ),
        f.hideFields.enabled && /* @__PURE__ */ a(Zs, {}),
        f.filtering.enabled && /* @__PURE__ */ a(Bs, { filter: t, setFilter: h }),
        f.grouping.enabled && /* @__PURE__ */ a($s, { grouping: r, setGroup: C }),
        f.sorting.enabled && /* @__PURE__ */ a(nc, { sort: n, setSort: g }),
        f.rowHeight.enabled && /* @__PURE__ */ a(Qs, { height: o, setHeight: b })
      ] })
    }
  );
}
const oc = {
  light: "",
  dark: "dark"
};
function ic() {
  const e = he(null), t = he(null), n = he(null), [r] = k(ie);
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
  const [o, l] = k(Kn);
  return q(() => {
    l(tt());
  }, []), /* @__PURE__ */ E(
    "div",
    {
      className: U(
        "h-full w-full relative rs-table text-sm text-primary overflow-hidden",
        oc[r.theme.color]
      ),
      id: o,
      children: [
        r.toolbar.enabled && /* @__PURE__ */ a(rc, {}),
        /* @__PURE__ */ E("div", { className: "h-[calc(100%-48px)] overflow-hidden", children: [
          /* @__PURE__ */ a(Fs, { ref: e }),
          /* @__PURE__ */ a(xs, { ref: n }),
          r.footer.enabled && /* @__PURE__ */ a(Cs, { ref: t })
        ] })
      ]
    }
  );
}
function lc({ data: e, columns: t, onChange: n, config: r, children: o }) {
  return Jr([
    [No, t],
    [wo, e],
    [ho, { onChange: n }],
    [mo, r]
  ]), o;
}
function fc({
  data: e,
  columns: t,
  onChange: n = () => null,
  config: r = {},
  licenseKey: o
}) {
  return /* @__PURE__ */ a(qr, { children: /* @__PURE__ */ a(
    lc,
    {
      data: e,
      columns: t,
      onChange: n,
      config: r,
      children: /* @__PURE__ */ a(ic, {})
    }
  ) });
}
export {
  dc as EVALUATION_LICENSE,
  fc as default
};
