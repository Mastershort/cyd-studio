/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ve = globalThis, wt = Ve.ShadowRoot && (Ve.ShadyCSS === void 0 || Ve.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, xt = Symbol(), Ot = /* @__PURE__ */ new WeakMap();
let ri = class {
  constructor(e, t, i) {
    if (this._$cssResult$ = !0, i !== xt) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (wt && e === void 0) {
      const i = t !== void 0 && t.length === 1;
      i && (e = Ot.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), i && Ot.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const Le = (o) => new ri(typeof o == "string" ? o : o + "", void 0, xt), be = (o, ...e) => {
  const t = o.length === 1 ? o[0] : e.reduce((i, s, r) => i + ((n) => {
    if (n._$cssResult$ === !0) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s) + o[r + 1], o[0]);
  return new ri(t, o, xt);
}, zi = (o, e) => {
  if (wt) o.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const i = document.createElement("style"), s = Ve.litNonce;
    s !== void 0 && i.setAttribute("nonce", s), i.textContent = t.cssText, o.appendChild(i);
  }
}, Dt = wt ? (o) => o : (o) => o instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const i of e.cssRules) t += i.cssText;
  return Le(t);
})(o) : o;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: Bi, defineProperty: Oi, getOwnPropertyDescriptor: Di, getOwnPropertyNames: ji, getOwnPropertySymbols: Wi, getPrototypeOf: Ni } = Object, it = globalThis, jt = it.trustedTypes, Yi = jt ? jt.emptyScript : "", Fi = it.reactiveElementPolyfillSupport, Ue = (o, e) => o, ut = { toAttribute(o, e) {
  switch (e) {
    case Boolean:
      o = o ? Yi : null;
      break;
    case Object:
    case Array:
      o = o == null ? o : JSON.stringify(o);
  }
  return o;
}, fromAttribute(o, e) {
  let t = o;
  switch (e) {
    case Boolean:
      t = o !== null;
      break;
    case Number:
      t = o === null ? null : Number(o);
      break;
    case Object:
    case Array:
      try {
        t = JSON.parse(o);
      } catch {
        t = null;
      }
  }
  return t;
} }, oi = (o, e) => !Bi(o, e), Wt = { attribute: !0, type: String, converter: ut, reflect: !1, useDefault: !1, hasChanged: oi };
Symbol.metadata ??= Symbol("metadata"), it.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let ke = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = Wt) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const i = Symbol(), s = this.getPropertyDescriptor(e, i, t);
      s !== void 0 && Oi(this.prototype, e, s);
    }
  }
  static getPropertyDescriptor(e, t, i) {
    const { get: s, set: r } = Di(this.prototype, e) ?? { get() {
      return this[t];
    }, set(n) {
      this[t] = n;
    } };
    return { get: s, set(n) {
      const l = s?.call(this);
      r?.call(this, n), this.requestUpdate(e, l, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? Wt;
  }
  static _$Ei() {
    if (this.hasOwnProperty(Ue("elementProperties"))) return;
    const e = Ni(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(Ue("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(Ue("properties"))) {
      const t = this.properties, i = [...ji(t), ...Wi(t)];
      for (const s of i) this.createProperty(s, t[s]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const t = litPropertyMetadata.get(e);
      if (t !== void 0) for (const [i, s] of t) this.elementProperties.set(i, s);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t, i] of this.elementProperties) {
      const s = this._$Eu(t, i);
      s !== void 0 && this._$Eh.set(s, t);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const t = [];
    if (Array.isArray(e)) {
      const i = new Set(e.flat(1 / 0).reverse());
      for (const s of i) t.unshift(Dt(s));
    } else e !== void 0 && t.push(Dt(e));
    return t;
  }
  static _$Eu(e, t) {
    const i = t.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof e == "string" ? e.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((e) => e(this));
  }
  addController(e) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(e), this.renderRoot !== void 0 && this.isConnected && e.hostConnected?.();
  }
  removeController(e) {
    this._$EO?.delete(e);
  }
  _$E_() {
    const e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
    for (const i of t.keys()) this.hasOwnProperty(i) && (e.set(i, this[i]), delete this[i]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return zi(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((e) => e.hostDisconnected?.());
  }
  attributeChangedCallback(e, t, i) {
    this._$AK(e, i);
  }
  _$ET(e, t) {
    const i = this.constructor.elementProperties.get(e), s = this.constructor._$Eu(e, i);
    if (s !== void 0 && i.reflect === !0) {
      const r = (i.converter?.toAttribute !== void 0 ? i.converter : ut).toAttribute(t, i.type);
      this._$Em = e, r == null ? this.removeAttribute(s) : this.setAttribute(s, r), this._$Em = null;
    }
  }
  _$AK(e, t) {
    const i = this.constructor, s = i._$Eh.get(e);
    if (s !== void 0 && this._$Em !== s) {
      const r = i.getPropertyOptions(s), n = typeof r.converter == "function" ? { fromAttribute: r.converter } : r.converter?.fromAttribute !== void 0 ? r.converter : ut;
      this._$Em = s;
      const l = n.fromAttribute(t, r.type);
      this[s] = l ?? this._$Ej?.get(s) ?? l, this._$Em = null;
    }
  }
  requestUpdate(e, t, i, s = !1, r) {
    if (e !== void 0) {
      const n = this.constructor;
      if (s === !1 && (r = this[e]), i ??= n.getPropertyOptions(e), !((i.hasChanged ?? oi)(r, t) || i.useDefault && i.reflect && r === this._$Ej?.get(e) && !this.hasAttribute(n._$Eu(e, i)))) return;
      this.C(e, t, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: i, reflect: s, wrapped: r }, n) {
    i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, n ?? t ?? this[e]), r !== !0 || n !== void 0) || (this._$AL.has(e) || (this.hasUpdated || i || (t = void 0), this._$AL.set(e, t)), s === !0 && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (t) {
      Promise.reject(t);
    }
    const e = this.scheduleUpdate();
    return e != null && await e, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [s, r] of this._$Ep) this[s] = r;
        this._$Ep = void 0;
      }
      const i = this.constructor.elementProperties;
      if (i.size > 0) for (const [s, r] of i) {
        const { wrapped: n } = r, l = this[s];
        n !== !0 || this._$AL.has(s) || l === void 0 || this.C(s, void 0, r, l);
      }
    }
    let e = !1;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), this._$EO?.forEach((i) => i.hostUpdate?.()), this.update(t)) : this._$EM();
    } catch (i) {
      throw e = !1, this._$EM(), i;
    }
    e && this._$AE(t);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    this._$EO?.forEach((t) => t.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(e) {
    return !0;
  }
  update(e) {
    this._$Eq &&= this._$Eq.forEach((t) => this._$ET(t, this[t])), this._$EM();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
};
ke.elementStyles = [], ke.shadowRootOptions = { mode: "open" }, ke[Ue("elementProperties")] = /* @__PURE__ */ new Map(), ke[Ue("finalized")] = /* @__PURE__ */ new Map(), Fi?.({ ReactiveElement: ke }), (it.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Et = globalThis, Nt = (o) => o, $e = Et.trustedTypes, Yt = $e ? $e.createPolicy("lit-html", { createHTML: (o) => o }) : void 0, ai = "$lit$", fe = `lit$${Math.random().toFixed(9).slice(2)}$`, li = "?" + fe, Ui = `<${li}>`, Me = document, Ze = () => Me.createComment(""), Re = (o) => o === null || typeof o != "object" && typeof o != "function", Mt = Array.isArray, Li = (o) => Mt(o) || typeof o?.[Symbol.iterator] == "function", ot = `[ 	
\f\r]`, Ye = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Ft = /-->/g, Ut = />/g, Ae = RegExp(`>|${ot}(?:([^\\s"'>=/]+)(${ot}*=${ot}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Lt = /'/g, Zt = /"/g, ci = /^(?:script|style|textarea|title)$/i, Zi = (o) => (e, ...t) => ({ _$litType$: o, strings: e, values: t }), y = Zi(1), Be = Symbol.for("lit-noChange"), Y = Symbol.for("lit-nothing"), Rt = /* @__PURE__ */ new WeakMap(), we = Me.createTreeWalker(Me, 129);
function di(o, e) {
  if (!Mt(o) || !o.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Yt !== void 0 ? Yt.createHTML(e) : e;
}
const Ri = (o, e) => {
  const t = o.length - 1, i = [];
  let s, r = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", n = Ye;
  for (let l = 0; l < t; l++) {
    const a = o[l];
    let c, h, b = -1, k = 0;
    for (; k < a.length && (n.lastIndex = k, h = n.exec(a), h !== null); ) k = n.lastIndex, n === Ye ? h[1] === "!--" ? n = Ft : h[1] !== void 0 ? n = Ut : h[2] !== void 0 ? (ci.test(h[2]) && (s = RegExp("</" + h[2], "g")), n = Ae) : h[3] !== void 0 && (n = Ae) : n === Ae ? h[0] === ">" ? (n = s ?? Ye, b = -1) : h[1] === void 0 ? b = -2 : (b = n.lastIndex - h[2].length, c = h[1], n = h[3] === void 0 ? Ae : h[3] === '"' ? Zt : Lt) : n === Zt || n === Lt ? n = Ae : n === Ft || n === Ut ? n = Ye : (n = Ae, s = void 0);
    const A = n === Ae && o[l + 1].startsWith("/>") ? " " : "";
    r += n === Ye ? a + Ui : b >= 0 ? (i.push(c), a.slice(0, b) + ai + a.slice(b) + fe + A) : a + fe + (b === -2 ? l : A);
  }
  return [di(o, r + (o[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), i];
};
class Ge {
  constructor({ strings: e, _$litType$: t }, i) {
    let s;
    this.parts = [];
    let r = 0, n = 0;
    const l = e.length - 1, a = this.parts, [c, h] = Ri(e, t);
    if (this.el = Ge.createElement(c, i), we.currentNode = this.el.content, t === 2 || t === 3) {
      const b = this.el.content.firstChild;
      b.replaceWith(...b.childNodes);
    }
    for (; (s = we.nextNode()) !== null && a.length < l; ) {
      if (s.nodeType === 1) {
        if (s.hasAttributes()) for (const b of s.getAttributeNames()) if (b.endsWith(ai)) {
          const k = h[n++], A = s.getAttribute(b).split(fe), x = /([.?@])?(.*)/.exec(k);
          a.push({ type: 1, index: r, name: x[2], strings: A, ctor: x[1] === "." ? Hi : x[1] === "?" ? Qi : x[1] === "@" ? qi : st }), s.removeAttribute(b);
        } else b.startsWith(fe) && (a.push({ type: 6, index: r }), s.removeAttribute(b));
        if (ci.test(s.tagName)) {
          const b = s.textContent.split(fe), k = b.length - 1;
          if (k > 0) {
            s.textContent = $e ? $e.emptyScript : "";
            for (let A = 0; A < k; A++) s.append(b[A], Ze()), we.nextNode(), a.push({ type: 2, index: ++r });
            s.append(b[k], Ze());
          }
        }
      } else if (s.nodeType === 8) if (s.data === li) a.push({ type: 2, index: r });
      else {
        let b = -1;
        for (; (b = s.data.indexOf(fe, b + 1)) !== -1; ) a.push({ type: 7, index: r }), b += fe.length - 1;
      }
      r++;
    }
  }
  static createElement(e, t) {
    const i = Me.createElement("template");
    return i.innerHTML = e, i;
  }
}
function Oe(o, e, t = o, i) {
  if (e === Be) return e;
  let s = i !== void 0 ? t._$Co?.[i] : t._$Cl;
  const r = Re(e) ? void 0 : e._$litDirective$;
  return s?.constructor !== r && (s?._$AO?.(!1), r === void 0 ? s = void 0 : (s = new r(o), s._$AT(o, t, i)), i !== void 0 ? (t._$Co ??= [])[i] = s : t._$Cl = s), s !== void 0 && (e = Oe(o, s._$AS(o, e.values), s, i)), e;
}
class Gi {
  constructor(e, t) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    const { el: { content: t }, parts: i } = this._$AD, s = (e?.creationScope ?? Me).importNode(t, !0);
    we.currentNode = s;
    let r = we.nextNode(), n = 0, l = 0, a = i[0];
    for (; a !== void 0; ) {
      if (n === a.index) {
        let c;
        a.type === 2 ? c = new He(r, r.nextSibling, this, e) : a.type === 1 ? c = new a.ctor(r, a.name, a.strings, this, e) : a.type === 6 && (c = new Pi(r, this, e)), this._$AV.push(c), a = i[++l];
      }
      n !== a?.index && (r = we.nextNode(), n++);
    }
    return we.currentNode = Me, s;
  }
  p(e) {
    let t = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(e, i, t), t += i.strings.length - 2) : i._$AI(e[t])), t++;
  }
}
class He {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, t, i, s) {
    this.type = 2, this._$AH = Y, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = i, this.options = s, this._$Cv = s?.isConnected ?? !0;
  }
  get parentNode() {
    let e = this._$AA.parentNode;
    const t = this._$AM;
    return t !== void 0 && e?.nodeType === 11 && (e = t.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, t = this) {
    e = Oe(this, e, t), Re(e) ? e === Y || e == null || e === "" ? (this._$AH !== Y && this._$AR(), this._$AH = Y) : e !== this._$AH && e !== Be && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : Li(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== Y && Re(this._$AH) ? this._$AA.nextSibling.data = e : this.T(Me.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: t, _$litType$: i } = e, s = typeof i == "number" ? this._$AC(e) : (i.el === void 0 && (i.el = Ge.createElement(di(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === s) this._$AH.p(t);
    else {
      const r = new Gi(s, this), n = r.u(this.options);
      r.p(t), this.T(n), this._$AH = r;
    }
  }
  _$AC(e) {
    let t = Rt.get(e.strings);
    return t === void 0 && Rt.set(e.strings, t = new Ge(e)), t;
  }
  k(e) {
    Mt(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let i, s = 0;
    for (const r of e) s === t.length ? t.push(i = new He(this.O(Ze()), this.O(Ze()), this, this.options)) : i = t[s], i._$AI(r), s++;
    s < t.length && (this._$AR(i && i._$AB.nextSibling, s), t.length = s);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    for (this._$AP?.(!1, !0, t); e !== this._$AB; ) {
      const i = Nt(e).nextSibling;
      Nt(e).remove(), e = i;
    }
  }
  setConnected(e) {
    this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
  }
}
class st {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, i, s, r) {
    this.type = 1, this._$AH = Y, this._$AN = void 0, this.element = e, this.name = t, this._$AM = s, this.options = r, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = Y;
  }
  _$AI(e, t = this, i, s) {
    const r = this.strings;
    let n = !1;
    if (r === void 0) e = Oe(this, e, t, 0), n = !Re(e) || e !== this._$AH && e !== Be, n && (this._$AH = e);
    else {
      const l = e;
      let a, c;
      for (e = r[0], a = 0; a < r.length - 1; a++) c = Oe(this, l[i + a], t, a), c === Be && (c = this._$AH[a]), n ||= !Re(c) || c !== this._$AH[a], c === Y ? e = Y : e !== Y && (e += (c ?? "") + r[a + 1]), this._$AH[a] = c;
    }
    n && !s && this.j(e);
  }
  j(e) {
    e === Y ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class Hi extends st {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === Y ? void 0 : e;
  }
}
class Qi extends st {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== Y);
  }
}
class qi extends st {
  constructor(e, t, i, s, r) {
    super(e, t, i, s, r), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = Oe(this, e, t, 0) ?? Y) === Be) return;
    const i = this._$AH, s = e === Y && i !== Y || e.capture !== i.capture || e.once !== i.once || e.passive !== i.passive, r = e !== Y && (i === Y || s);
    s && this.element.removeEventListener(this.name, this, i), r && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class Pi {
  constructor(e, t, i) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    Oe(this, e);
  }
}
const Ki = Et.litHtmlPolyfillSupport;
Ki?.(Ge, He), (Et.litHtmlVersions ??= []).push("3.3.3");
const Ji = (o, e, t) => {
  const i = t?.renderBefore ?? e;
  let s = i._$litPart$;
  if (s === void 0) {
    const r = t?.renderBefore ?? null;
    i._$litPart$ = s = new He(e.insertBefore(Ze(), r), r, void 0, t ?? {});
  }
  return s._$AI(o), s;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const It = globalThis;
class ae extends ke {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const t = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Ji(t, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return Be;
  }
}
ae._$litElement$ = !0, ae.finalized = !0, It.litElementHydrateSupport?.({ LitElement: ae });
const Xi = It.litElementPolyfillSupport;
Xi?.({ LitElement: ae });
(It.litElementVersions ??= []).push("4.2.2");
class Vi {
  constructor(e) {
    this.hass = e;
  }
  setHass(e) {
    this.hass = e;
  }
  ws(e, t = {}) {
    return this.hass.callWS({ type: `cyd_studio/${e}`, ...t });
  }
  info = () => this.ws("info");
  boards = () => this.ws("boards/list");
  widgets = () => this.ws("widgets/list");
  themes = () => this.ws("themes/list");
  templates = () => this.ws("templates/list");
  projects = () => this.ws("projects/list");
  project = (e) => this.ws("projects/get", { project_id: e });
  save = (e) => this.ws("projects/save", { project: e });
  remove = (e) => this.ws("projects/delete", { project_id: e });
  duplicate = (e) => this.ws("projects/duplicate", { project_id: e });
  importProject = (e, t) => this.ws("projects/import", { project: e, ...t ? { assets: t } : {} });
  /** Take the design (pages, widgets, theme, styles) of another project or a project file; the identity stays. */
  applyDesign = (e, t) => this.ws("projects/apply_design", { project_id: e, ...t });
  history = (e) => this.ws("projects/history", { project_id: e });
  restore = (e, t) => this.ws("projects/restore", { project_id: e, index: t });
  importYaml = (e) => this.ws("projects/import", { yaml: e });
  devices = () => this.ws("esphome/devices");
  allowActions = (e) => this.ws("esphome/allow_actions", { project_id: e });
  uploadAsset = (e, t, i, s) => this.ws("assets/upload", { project_id: e, data: t, width: i, height: s });
  getAsset = (e, t) => this.ws("assets/get", { project_id: e, asset_id: t });
  /** Link to the installed ESPHome add-on (slug differs: official, beta, dev, community); null without Supervisor. */
  async esphomeUrl() {
    try {
      const t = ((await this.hass.callWS(
        { type: "supervisor/api", endpoint: "/addons", method: "get" }
      )).addons ?? []).filter((s) => /(^|_)esphome(-beta|-dev)?$/.test(s.slug)), i = t.find((s) => s.state === "started") ?? t[0];
      return i ? `/${i.slug}` : null;
    } catch {
      return null;
    }
  }
  esphomeStatus = () => this.ws("esphome/status");
  esphomeSave = (e, t = !1) => this.ws("esphome/save", { project_id: e, overwrite: t });
  secretsSet = (e, t) => this.ws("esphome/secrets_set", { wifi_ssid: e, wifi_password: t });
  generate = (e, t = !1) => this.ws("generate/yaml", { project: e, mark_exported: t });
}
const Ct = {
  app_title: "CYD Studio",
  projects: "Projekte",
  new_project: "Neues Projekt",
  import_file: "Datei importieren",
  no_projects: "Noch kein Projekt. Leg dein erstes Display-Dashboard an!",
  open: "Öffnen",
  duplicate: "Duplizieren",
  design_apply_button: "Design übernehmen",
  design_apply_hint: "Seiten, Widgets, Theme und Stile aus einem anderen Projekt oder einer Datei übernehmen",
  design_apply_title: "Design in „{name}“ übernehmen",
  design_apply_text: "Übernommen werden Seiten mit allen Widgets, Popups, Kopfzeile, Navigation, Raster, Theme, Farben, Kachel-Stil, Hintergrundbilder sowie Helligkeit, Nachtmodus und Bildschirmschoner. Name, Gerätename, API-Schlüssel, WLAN und Board bleiben unverändert.",
  design_choose_source: "Quelle wählen …",
  design_from_file: "Aus Datei",
  design_mismatch: "Die Quelle hat ein anderes Board oder eine andere Ausrichtung – Kacheln können verrutschen oder außerhalb liegen.",
  design_apply: "Übernehmen",
  design_applied: "Design in „{name}“ übernommen.",
  design_file_invalid: "Keine CYD-Studio-Projektdatei.",
  delete: "Löschen",
  delete_confirm: "Projekt „{name}“ wirklich löschen? Die ESPHome-Datei bleibt erhalten.",
  export_file: "Als Datei sichern",
  pages_count: "{n} Seiten",
  widgets_count: "{n} Widgets",
  exported: "exportiert",
  changed_since_export: "geändert seit letztem Export",
  never_exported: "noch nicht exportiert",
  back: "Zurück",
  // wizard
  wizard_title: "Neues Projekt",
  step_board: "Board",
  step_orientation: "Ausrichtung",
  step_template: "Vorlage",
  step_name: "Name",
  next: "Weiter",
  create: "Anlegen",
  cancel: "Abbrechen",
  board_variant: "Display-Variante",
  variant_default: "Standard",
  where_to_buy: "Wo bekomme ich das Board?",
  matching_case: "Passendes Gehäuse",
  landscape: "Querformat",
  portrait: "Hochformat",
  landscape_flipped: "Querformat (gedreht)",
  portrait_flipped: "Hochformat (gedreht)",
  usb_side: "USB {side}",
  usb_right: "rechts",
  usb_left: "links",
  usb_top: "oben",
  usb_bottom: "unten",
  project_name: "Projektname",
  device_name: "Gerätename (ESPHome)",
  device_name_hint: "Kleinbuchstaben, Ziffern, Bindestriche",
  assign_placeholder: "Welche Entität ist „{label}“?",
  // editor
  palette: "Widgets",
  pages: "Seiten",
  add_page: "Seite hinzufügen",
  add_subpage: "Unterseite",
  rename: "Umbenennen",
  move_up: "Nach oben",
  move_down: "Nach unten",
  in_navigation: "In Navigation",
  hidden_in_navigation: "nicht in Navigation",
  properties: "Eigenschaften",
  project_settings: "Projekt",
  page_settings: "Seite",
  undo: "Rückgängig",
  redo: "Wiederholen",
  preview_mode: "Vorschau",
  edit_mode: "Bearbeiten",
  generate_code: "Code erzeugen",
  saved: "Gespeichert",
  saving: "Speichert …",
  save_failed: "Speichern fehlgeschlagen",
  zoom_fit: "Passend",
  sample_data: "Beispieldaten",
  live_data: "Live-Daten",
  night_view: "Nacht",
  entity: "Entität",
  pick_entity: "Entität wählen …",
  search: "Suchen …",
  icon: "Icon",
  action: "Aktion",
  action_service: "Aktion (z. B. script.turn_on)",
  action_target: "Ziel-Entität",
  position: "Position & Größe",
  delete_widget: "Widget löschen",
  copy: "Kopieren",
  paste: "Einfügen",
  simulate_state: "Zustand simulieren",
  sim_live: "live",
  sim_on: "an",
  sim_off: "aus",
  sim_unavailable: "nicht verfügbar",
  board: "Board",
  orientation: "Ausrichtung",
  grid: "Raster",
  cols: "Spalten",
  rows: "Zeilen",
  gap: "Abstand",
  padding: "Rand",
  theme: "Theme",
  accent: "Akzentfarbe",
  language: "Display-Sprache",
  header: "Kopfzeile",
  header_enabled: "Kopfzeile anzeigen",
  navigation: "Navigation",
  nav_style: "Stil",
  nav_tabbar: "Tab-Leiste",
  nav_none: "Keine",
  tabbar_position: "Position",
  pos_bottom: "unten",
  pos_top: "oben",
  pos_left: "links",
  show_labels: "Beschriftungen",
  show_icons: "Icons",
  swipe: "Wischen zwischen Seiten",
  wrap_around: "Endlos wischen",
  home_page: "Startseite",
  return_home_after: "Zurück zur Startseite nach (s, 0 = nie)",
  page_timeout: "Eigene Rückkehrzeit (s, leer = Standard)",
  page_name: "Seitenname",
  parent_page: "Eltern-Seite",
  none: "keine",
  screensaver: "Bildschirmschoner (dimmen)",
  screensaver_after: "Dimmen nach (s)",
  brightness_day: "Helligkeit",
  brightness_night: "Helligkeit gedimmt",
  rgb_led: "RGB-LED als Entität",
  validation: "Hinweise",
  no_issues: "Alles in Ordnung – bereit zum Export.",
  preview_note: "Die Vorschau entspricht dem Display bis auf kleine Abweichungen bei Kantenglättung und Farben (Display-Panel).",
  next_step_hint: "Fertig gestaltet? → Code erzeugen",
  empty_page_hint: "Widget links anklicken oder hierher ziehen",
  // export
  export_title: "ESPHome-Code",
  copy_code: "Kopieren",
  copied: "Kopiert!",
  download: "Herunterladen",
  export_blocked: "Der Code kann noch nicht erzeugt werden – bitte zuerst die Fehler beheben:",
  how_to_install: "So kommt der Code aufs Display",
  install_steps: "ESPHome öffnen → Gerät bearbeiten (oder „Neues Gerät“) → alles ersetzen → Speichern → Installieren.",
  first_install: "Erstinstallation",
  first_install_steps: "Beim ersten Mal per USB installieren („Plug into this computer“) – mit Chrome oder Edge und einem Datenkabel. Unter Windows ggf. den CH340-Treiber installieren. Danach geht alles drahtlos.",
  secrets_hint: "In ESPHome unter „Secrets“ müssen wifi_ssid und wifi_password eingetragen sein.",
  allow_actions_hint: "Wichtig: In Home Assistant beim ESPHome-Gerät „Dem Gerät erlauben, Home-Assistant-Aktionen auszuführen“ aktivieren.",
  memory: "Speicher",
  memory_estimate: "ca. {objects} Objekte · {ram} KB RAM ({pct} % des Budgets) · Schriften {flash} KB Flash",
  close: "Schließen",
  generating: "Code wird erzeugt …",
  state_on: "An",
  state_off: "Aus",
  state_open: "Offen",
  state_closed: "Geschlossen",
  state_opening: "Öffnet",
  state_closing: "Schließt",
  state_locked: "Verriegelt",
  state_unlocked: "Entriegelt",
  state_unavailable: "Nicht verfügbar",
  device_connected: "Display verbunden",
  device_offline: "Display in HA angelegt, aber gerade nicht erreichbar",
  device_not_found: "Noch kein ESPHome-Gerät „{name}“ in Home Assistant",
  actions_blocked: "Das Display darf Home Assistant noch nicht steuern – Tippen und Regler bewirken nichts.",
  allow_actions: "Jetzt erlauben",
  allow_actions_confirm: "Für das ESPHome-Gerät „{device}“ die Option „Dem Gerät erlauben, Home-Assistant-Aktionen auszuführen“ einschalten?",
  actions_allowed_done: "Erlaubt – das Display kann jetzt schalten.",
  how_to_connect: "so verbindest du es",
  what_to_do: "was tun?",
  connect_step_flash: "Code in ESPHome einfügen und aufs Display installieren (einmal per USB).",
  connect_step_discovered: "Home Assistant meldet das Display unter „Geräte & Dienste“ als „Entdeckt“ → „Hinzufügen“.",
  connect_step_key: "Nach dem Verschlüsselungsschlüssel gefragt? Diesen hier einfügen:",
  connect_step_manual: "Nichts entdeckt? „Integration hinzufügen“ → ESPHome → IP-Adresse des Displays (steht in den ESPHome-Logs oder im Router).",
  offline_step_power: "Hat das Display Strom und WLAN? In den ESPHome-Logs sieht man, ob es verbunden ist.",
  offline_step_key: "Passt der Schlüssel nicht (Gerät „nicht verfügbar“)? Beim ESPHome-Gerät ⋮ → „Neu konfigurieren“ und diesen Schlüssel eintragen:",
  open_integrations: "Geräte & Dienste öffnen",
  copy_key: "Schlüssel kopieren",
  key_copied: "Kopiert!",
  appearance: "Aussehen",
  style_preset: "Stil-Vorlage",
  style_project_default: "(wie Projekt)",
  style_theme_default: "(wie Theme)",
  style_default: "Kachel-Stil (Standard)",
  color_bg: "Hintergrund",
  color_bg_on: "Hintergrund an",
  color_border: "Rahmen",
  color_text: "Text",
  color_text_on: "Text an",
  color_icon: "Icon an",
  color_icon_off: "Icon aus",
  color_track: "Spur",
  color_fill: "Füllung",
  color_knob: "Knopf",
  opacity: "Deckkraft %",
  corners: "Ecken",
  border_width: "Rahmen",
  icon_circle: "Icon im Kreis",
  show_label: "Beschriftung anzeigen",
  text_size: "Textgröße",
  style_to_page: "Auf ganze Seite",
  style_as_default: "Als Projekt-Standard",
  style_reset: "Stil zurücksetzen",
  reset: "Zurücksetzen",
  opt_slider: "Regler-Popup",
  opt_none: "Nichts",
  opt_left: "Links",
  opt_center: "Mitte",
  opt_right: "Rechts",
  group_tiles: "Kacheln",
  group_controls: "Steuerung",
  group_display: "Anzeige",
  group_layout: "Navigation & Layout",
  group_other: "Sonstiges",
  palette_search: "Widget suchen …",
  palette_hint: "Anklicken oder auf das Display ziehen.",
  palette_none: "Kein Widget gefunden.",
  zoom_in: "Vergrößern",
  zoom_out: "Verkleinern",
  png_hint: "Aktuelle Seite als PNG speichern",
  real_actions: "Aktionen wirklich ausführen",
  actions: "Aktionen",
  actions_hint: "Was beim Tippen, langen Drücken und Doppeltippen passiert. Mehrere Schritte laufen nacheinander.",
  trigger_tap: "Tippen",
  trigger_long_press: "Lange drücken",
  trigger_double_tap: "Doppeltippen",
  trigger_default: "Standard",
  trigger_none: "Nichts",
  trigger_custom: "Eigene Aktionen",
  add_step: "Schritt",
  step_toggle: "Umschalten",
  step_service: "HA-Aktion",
  step_page: "Seite öffnen",
  step_back: "Zurück",
  step_home: "Startseite",
  step_popup: "Popup (Regler)",
  step_delay: "Warten",
  step_data_hint: "Daten, z. B. brightness_pct=50",
  icon_and_font: "Icon & Schrift",
  icon_size: "Icon-Größe",
  icon_hidden: "Aus (kein Icon)",
  auto: "Automatisch",
  text_weight: "Schriftstärke",
  weight_normal: "Normal",
  weight_bold: "Fett",
  value_size: "Größe des Werts",
  conditions: "Bedingungen",
  conditions_hint: "Nur anzeigen, wenn alle Bedingungen zutreffen.",
  add_condition: "Bedingung",
  rules: "Zustandsregeln",
  rules_hint: "Die erste passende Regel färbt das Widget um (z. B. rot ab 25 °C).",
  add_rule: "Regel",
  this_entity: "(diese Entität)",
  value: "Wert",
  op_eq: "ist",
  op_ne: "ist nicht",
  op_on: "ist an / offen",
  op_off: "ist aus / zu",
  op_gt: "über",
  op_lt: "unter",
  device_actions: "Aus Home Assistant steuerbar (Seite öffnen, Meldungen, Helligkeit)",
  test_message: "Meldung testen",
  test_message_hint: "So sieht eine Meldung aus, die eine Automation schickt",
  test_message_title: "Paket",
  test_message_text: "Das Paket wurde geliefert und liegt vor der Tür.",
  ha_actions: "Aus Home Assistant steuern",
  ha_actions_hint: "Diese Aktionen kannst du in Automationen und Skripten verwenden:",
  background: "Hintergrund",
  bg_color: "Farbe",
  bg_image: "Bild",
  bg_choose: "Bild wählen …",
  bg_change: "Ändern",
  bg_page_hint: "Nur für diese Seite (sonst gilt der Projekt-Hintergrund).",
  bg_project_hint: "Für alle Seiten. Das Bild wird auf die Display-Größe zugeschnitten (ca. 150 KB Flash). Tipp: Kachel-Stil „Glas“.",
  bg_upload_failed: "Bild konnte nicht übernommen werden",
  save_to_esphome: "In ESPHome speichern",
  saving_to_esphome: "Speichert …",
  saved_to_esphome: "Gespeichert: {path}",
  backup_created: "Sicherung der alten Datei: {path}",
  conflict_foreign: "Die Datei {path} gibt es schon und sie stammt nicht von CYD Studio. Überschreiben? (Die alte Datei wird gesichert.)",
  conflict_modified: "Die Datei {path} wurde in ESPHome von Hand geändert. Diese Änderungen gehen verloren (Sicherung wird angelegt). Unterschiede:",
  overwrite: "Trotzdem speichern",
  no_esphome_dir: "Kein ESPHome-Ordner gefunden ({path}) – ist der ESPHome Device Builder installiert? Code dann bitte kopieren.",
  secrets_missing: "In ESPHome fehlen noch die WLAN-Zugangsdaten:",
  wifi_ssid: "WLAN-Name (SSID)",
  wifi_password: "WLAN-Passwort",
  save_secrets: "In secrets.yaml speichern",
  secrets_saved: "WLAN-Daten gespeichert.",
  open_esphome: "ESPHome öffnen",
  next_install: "Jetzt in ESPHome beim Gerät auf „Installieren“ – beim ersten Mal per USB."
}, hi = {
  app_title: "CYD Studio",
  projects: "Projects",
  new_project: "New project",
  import_file: "Import file",
  no_projects: "No project yet. Create your first display dashboard!",
  open: "Open",
  duplicate: "Duplicate",
  design_apply_button: "Apply design",
  design_apply_hint: "Take pages, widgets, theme and styles from another project or a file",
  design_apply_title: 'Apply a design to "{name}"',
  design_apply_text: "Takes the pages with all widgets, popups, header, navigation, grid, theme, colors, tile style, background images as well as brightness, night mode and screensaver. Name, device name, API key, WiFi and board stay unchanged.",
  design_choose_source: "Choose source …",
  design_from_file: "From file",
  design_mismatch: "The source uses a different board or orientation – tiles may shift or fall outside the screen.",
  design_apply: "Apply",
  design_applied: 'Design applied to "{name}".',
  design_file_invalid: "Not a CYD Studio project file.",
  delete: "Delete",
  delete_confirm: 'Really delete project "{name}"? The ESPHome file is kept.',
  export_file: "Save as file",
  pages_count: "{n} pages",
  widgets_count: "{n} widgets",
  exported: "exported",
  changed_since_export: "changed since last export",
  never_exported: "not exported yet",
  back: "Back",
  wizard_title: "New project",
  step_board: "Board",
  step_orientation: "Orientation",
  step_template: "Template",
  step_name: "Name",
  next: "Next",
  create: "Create",
  cancel: "Cancel",
  board_variant: "Display variant",
  variant_default: "Default",
  where_to_buy: "Where do I get the board?",
  matching_case: "Matching case",
  landscape: "Landscape",
  portrait: "Portrait",
  landscape_flipped: "Landscape (flipped)",
  portrait_flipped: "Portrait (flipped)",
  usb_side: "USB {side}",
  usb_right: "right",
  usb_left: "left",
  usb_top: "top",
  usb_bottom: "bottom",
  project_name: "Project name",
  device_name: "Device name (ESPHome)",
  device_name_hint: "lowercase letters, digits, dashes",
  assign_placeholder: 'Which entity is "{label}"?',
  palette: "Widgets",
  pages: "Pages",
  add_page: "Add page",
  add_subpage: "Sub page",
  rename: "Rename",
  move_up: "Move up",
  move_down: "Move down",
  in_navigation: "In navigation",
  hidden_in_navigation: "not in navigation",
  properties: "Properties",
  project_settings: "Project",
  page_settings: "Page",
  undo: "Undo",
  redo: "Redo",
  preview_mode: "Preview",
  edit_mode: "Edit",
  generate_code: "Generate code",
  saved: "Saved",
  saving: "Saving …",
  save_failed: "Saving failed",
  zoom_fit: "Fit",
  sample_data: "Sample data",
  live_data: "Live data",
  night_view: "Night",
  entity: "Entity",
  pick_entity: "Pick entity …",
  search: "Search …",
  icon: "Icon",
  action: "Action",
  action_service: "Action (e.g. script.turn_on)",
  action_target: "Target entity",
  position: "Position & size",
  delete_widget: "Delete widget",
  copy: "Copy",
  paste: "Paste",
  simulate_state: "Simulate state",
  sim_live: "live",
  sim_on: "on",
  sim_off: "off",
  sim_unavailable: "unavailable",
  board: "Board",
  orientation: "Orientation",
  grid: "Grid",
  cols: "Columns",
  rows: "Rows",
  gap: "Gap",
  padding: "Padding",
  theme: "Theme",
  accent: "Accent color",
  language: "Display language",
  header: "Header",
  header_enabled: "Show header",
  navigation: "Navigation",
  nav_style: "Style",
  nav_tabbar: "Tab bar",
  nav_none: "None",
  tabbar_position: "Position",
  pos_bottom: "bottom",
  pos_top: "top",
  pos_left: "left",
  show_labels: "Labels",
  show_icons: "Icons",
  swipe: "Swipe between pages",
  wrap_around: "Wrap around",
  home_page: "Home page",
  return_home_after: "Return to home page after (s, 0 = never)",
  page_timeout: "Own return time (s, empty = default)",
  page_name: "Page name",
  parent_page: "Parent page",
  none: "none",
  screensaver: "Screensaver (dim)",
  screensaver_after: "Dim after (s)",
  brightness_day: "Brightness",
  brightness_night: "Dimmed brightness",
  rgb_led: "RGB LED as entity",
  validation: "Hints",
  no_issues: "All good – ready to export.",
  preview_note: "The preview matches the display except for small differences in anti-aliasing and colors (display panel).",
  next_step_hint: "Done designing? → Generate code",
  empty_page_hint: "Click a widget on the left or drag it here",
  export_title: "ESPHome code",
  copy_code: "Copy",
  copied: "Copied!",
  download: "Download",
  export_blocked: "The code cannot be generated yet – please fix these errors first:",
  how_to_install: "How the code gets onto the display",
  install_steps: 'Open ESPHome → edit the device (or "New device") → replace everything → Save → Install.',
  first_install: "First installation",
  first_install_steps: 'Install via USB the first time ("Plug into this computer") – with Chrome or Edge and a data cable. On Windows you may need the CH340 driver. After that everything works wirelessly.',
  secrets_hint: 'ESPHome "Secrets" must contain wifi_ssid and wifi_password.',
  allow_actions_hint: 'Important: in Home Assistant enable "Allow the device to perform Home Assistant actions" for the ESPHome device.',
  memory: "Memory",
  memory_estimate: "about {objects} objects · {ram} KB RAM ({pct} % of budget) · fonts {flash} KB flash",
  close: "Close",
  generating: "Generating code …",
  state_on: "On",
  state_off: "Off",
  state_open: "Open",
  state_closed: "Closed",
  state_opening: "Opening",
  state_closing: "Closing",
  state_locked: "Locked",
  state_unlocked: "Unlocked",
  state_unavailable: "Unavailable",
  device_connected: "Display connected",
  device_offline: "Display is set up in HA but currently unreachable",
  device_not_found: 'No ESPHome device "{name}" in Home Assistant yet',
  actions_blocked: "The display may not control Home Assistant yet – taps and sliders do nothing.",
  allow_actions: "Allow now",
  allow_actions_confirm: 'Enable "Allow the device to perform Home Assistant actions" for the ESPHome device "{device}"?',
  actions_allowed_done: "Allowed – the display can switch things now.",
  how_to_connect: "how to connect it",
  what_to_do: "what to do?",
  connect_step_flash: "Paste the code into ESPHome and install it on the display (USB the first time).",
  connect_step_discovered: 'Home Assistant lists the display as "Discovered" under "Devices & services" → "Add".',
  connect_step_key: "Asked for the encryption key? Paste this one:",
  connect_step_manual: 'Nothing discovered? "Add integration" → ESPHome → IP address of the display (see the ESPHome logs or your router).',
  offline_step_power: "Does the display have power and WiFi? The ESPHome logs show whether it is connected.",
  offline_step_key: 'Wrong key (device "unavailable")? On the ESPHome device ⋮ → "Reconfigure" and enter this key:',
  open_integrations: "Open devices & services",
  copy_key: "Copy key",
  key_copied: "Copied!",
  appearance: "Appearance",
  style_preset: "Style preset",
  style_project_default: "(project default)",
  style_theme_default: "(theme default)",
  style_default: "Tile style (default)",
  color_bg: "Background",
  color_bg_on: "Background on",
  color_border: "Border",
  color_text: "Text",
  color_text_on: "Text on",
  color_icon: "Icon on",
  color_icon_off: "Icon off",
  color_track: "Track",
  color_fill: "Fill",
  color_knob: "Knob",
  opacity: "Opacity %",
  corners: "Corners",
  border_width: "Border",
  icon_circle: "Icon in circle",
  show_label: "Show label",
  text_size: "Text size",
  style_to_page: "Apply to page",
  style_as_default: "Make project default",
  style_reset: "Reset style",
  reset: "Reset",
  opt_slider: "Slider popup",
  opt_none: "Nothing",
  opt_left: "Left",
  opt_center: "Center",
  opt_right: "Right",
  group_tiles: "Tiles",
  group_controls: "Controls",
  group_display: "Display",
  group_layout: "Navigation & layout",
  group_other: "Other",
  palette_search: "Search widgets …",
  palette_hint: "Click or drag onto the display.",
  palette_none: "No widget found.",
  zoom_in: "Zoom in",
  zoom_out: "Zoom out",
  png_hint: "Save the current page as PNG",
  real_actions: "Really run actions",
  actions: "Actions",
  actions_hint: "What happens on tap, long press and double tap. Several steps run one after another.",
  trigger_tap: "Tap",
  trigger_long_press: "Long press",
  trigger_double_tap: "Double tap",
  trigger_default: "Default",
  trigger_none: "Nothing",
  trigger_custom: "Own actions",
  add_step: "Step",
  step_toggle: "Toggle",
  step_service: "HA action",
  step_page: "Open page",
  step_back: "Back",
  step_home: "Home page",
  step_popup: "Popup (slider)",
  step_delay: "Wait",
  step_data_hint: "Data, e.g. brightness_pct=50",
  icon_and_font: "Icon & font",
  icon_size: "Icon size",
  icon_hidden: "Off (no icon)",
  auto: "Automatic",
  text_weight: "Font weight",
  weight_normal: "Normal",
  weight_bold: "Bold",
  value_size: "Value size",
  conditions: "Conditions",
  conditions_hint: "Only show when all conditions hold.",
  add_condition: "Condition",
  rules: "State rules",
  rules_hint: "The first matching rule recolors the widget (e.g. red above 25 °C).",
  add_rule: "Rule",
  this_entity: "(this entity)",
  value: "Value",
  op_eq: "is",
  op_ne: "is not",
  op_on: "is on / open",
  op_off: "is off / closed",
  op_gt: "above",
  op_lt: "below",
  device_actions: "Controllable from Home Assistant (open page, messages, brightness)",
  test_message: "Test message",
  test_message_hint: "What a message sent by an automation looks like",
  test_message_title: "Parcel",
  test_message_text: "The parcel was delivered and is at the door.",
  ha_actions: "Control from Home Assistant",
  ha_actions_hint: "Use these actions in automations and scripts:",
  background: "Background",
  bg_color: "Color",
  bg_image: "Image",
  bg_choose: "Choose image …",
  bg_change: "Change",
  bg_page_hint: "Only for this page (otherwise the project background applies).",
  bg_project_hint: 'For all pages. The image is cropped to the display size (about 150 KB flash). Tip: tile style "Glass".',
  bg_upload_failed: "Image could not be used",
  save_to_esphome: "Save to ESPHome",
  saving_to_esphome: "Saving …",
  saved_to_esphome: "Saved: {path}",
  backup_created: "Backup of the old file: {path}",
  conflict_foreign: "The file {path} already exists and was not created by CYD Studio. Overwrite? (The old file is backed up.)",
  conflict_modified: "The file {path} was edited by hand in ESPHome. These changes will be lost (a backup is kept). Differences:",
  overwrite: "Save anyway",
  no_esphome_dir: "No ESPHome folder found ({path}) – is the ESPHome Device Builder installed? Please copy the code instead.",
  secrets_missing: "ESPHome still needs your WiFi credentials:",
  wifi_ssid: "WiFi name (SSID)",
  wifi_password: "WiFi password",
  save_secrets: "Save to secrets.yaml",
  secrets_saved: "WiFi credentials saved.",
  open_esphome: "Open ESPHome",
  next_install: 'Now click "Install" on the device in ESPHome – via USB the first time.'
};
let ui = Ct, et = "de";
function _i(o) {
  et = o.startsWith("de") ? "de" : "en", ui = et === "de" ? Ct : hi;
}
function Ee() {
  return et;
}
function d(o, e = {}) {
  let t = ui[o] ?? o;
  for (const [i, s] of Object.entries(e)) t = t.replace(`{${i}}`, String(s));
  return t;
}
function $i(o) {
  const e = o === "en" ? hi : Ct;
  return {
    on: e.state_on,
    off: e.state_off,
    open: e.state_open,
    closed: e.state_closed,
    opening: e.state_opening,
    closing: e.state_closing,
    locked: e.state_locked,
    unlocked: e.state_unlocked,
    unavailable: e.state_unavailable,
    unknown: "–"
  };
}
function ne(o, e) {
  const t = o, i = et === "en" ? t[`${e}_en`] ?? t[e] : t[e] ?? t[`${e}_en`];
  return String(i ?? "");
}
const es = "data:font/woff2;base64,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", ts = "data:font/woff2;base64,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", is = "data:font/woff2;base64,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", ss = "data:font/woff2;base64,d09GMgABAAAAAIL8ABIAAAABXowAAIKRAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGoQ4G4HICByMYgZgP1NUQVREAI82CHwJnxQRCAqCwhiCiRgLjEYAATYCJAOZCAQgBYRmB79UDIMoW486cYY6d/+BrKXuqkLmY++DS9SwbRr0r+c2PM28MtLLDCjYOIAGprzM/v///9ykQ4YGqgFaWlXvvjm3Xydoijkc7hGiNla0gBlpjTB3Zjg7okYYvHX3GIu6brrNbm/ZaMRmKjFqwOBrXdOOisw2vO/pP2fnI8UqgmL7pcHRNul4ppcG1eBCaaBR2mKKE0nlhezasWfDkD6/KhwUraIruwiksOiFJi6FBa2gJ/a3uB17l17wKR7TnRN8BSWVrzDlQgpTRuFZRvl3SxMmKkwjHjZd174gu6R+k1RJhcol/40+3fXcpeFF4TO835WLOIKeW3uizc7vxlNeGDeIDtdvlbM49LE91qI6wyE+ZSRL3wVr6TogHpsjlYgWYz1x1omv/zzO+ee+l6SipEWsdJSmRXxmMJgjW8dgIsrEhP2ZMRGzX+ihcdDPvD3IiYl2iIz8stIhfzKBO4DbnBhPoxEDjtWF3c/Qfiioz8Bo1HHu2czzCxio+ND7Vl+Yzf/zv98/6Fz73P/yExaSsKAQFcu0kkAoQCdqY0SHR9m6VMhWdfwz79ynEWfUaZgVU3Jub54YC0ApBKjJ7/CwNv8hEwSU6KvisoiLKA7u4A6OPlqqJRQwUMAEAzAnM2qbsDBmLJ1Ol650ulAXzvr7m/83tz+kdFKyyiOezMQaIVPaDVBqwzQ93mEsxkqUKlvz/yO8H1vbjdKtd9bJby6YxIp6gpDf2dFv5s8AqexAU3XZmeXgJCE56aUuxy/5fSJSE4kM4KlwOhidO9AdZGfWhf6GpN0u2Mj+BQOxwCiMYLprvpOtPEJJHKv+/n3OhdOydsDtKYbEdtl2Eu0F7Z9x2Ae+1JW7a9l8Mw6gA/pRpACQ5v0E9wg+BwgUIBVVmtIXoL7IFcD//M+ZPza1B0BqesYeTk3h81PmEAOMLf82/r9O+2R0EbICCFlEBzD2zPBTTNXffPqUu9JNuW2x1Vbv0M28rsP+4mvwisgBeQjSFKsNumvHKQYaZWxfTaDaAAMCASnY3OMpOFg1zkF+aftsxoSzjrZKhla1D/XXMeF8xNbsgfSxHGSHsav6suTpcDY8yiqX76Suvv7/S2ff9j0VapfAjCW7g9w9Af8UzYS97J6U4q7erVdUvff0UKmEulUSwgg5SGBPI2T7I/iBksBHCHcPppPtH3KSwMcHOtOd3f2D/58Y8y6HxX6WyxB3aT+L1TZkeP6d9bN9uX9t2XIKu1CGSWZEcydmwl4FozgIibAS4QwIsgP+8HTzIPQkyDJMIABIiIL//98vtXPXDj41L9TrumLraPmAKrg6M0BvTvg3Q6/suqIKrOIK6AQ6VpEVaqSrkhW2yrgeTS2p9vZTSgEkhNlO7ywEnkczGkvrib4XlFrgbdPLa+l7AywEMN+he5aCwsP3+616D3iKNOhN9A1JfD0SP5to69Fbt7a0Fb/X5vutxncnMoagJCx6aYNlTooyTWVLIyvvrRQHiF3nV28/7ibc+QNbpaotKfyKnjHeKXcFSRVN6FR11AP3oKVfSA7nRNEhZtCJlHNHsHLInTtPb+idiV/n6SNdUlhhjCjBBGNELse1NqqKyIRugCmYohBpRCQRERERqZVGCsl7/TaMz524JHu1tUfIXiHYIEMQERGRhwwiEvIPxI2hscpDehg+9ur/F4zp2NKUY40DI/HO9fXetZZRNeaYw8yVyTLZDFFiWgRFQSRIxuzevzOZ2p+x+X1uel0rA2xMEIlHuAlGO/tp4gmE0W7/DA+CYQQAQD9hZCGMEGZmhMyC8BWMCBWOiJCISFYUUVwaorIaiAwZiGz1EA21QLTSGtFWH0Q/4xETFSD+sxSxwh7EPocQR5xDXHATcdttxF1PEM88R7zyD8JLBaRIOpAGMoI0h0VGpI6MTx9ZLHtkek7Iqrkia+aJrFUQMq9oZPNikS1LRLbtNLJPl5BDykYOqwQ5pXvIObUit9aPPN935ONWkb/aQXpZc1AMzA8lYEiUoCmhuGeBUn62KJXmhlJznihZi0FpsQyUActBGb58lNErQpmyMpRZu4cyb49QVq4GZcNa8WzdKzwHRsdzbgN4Lm0Ez439xfNx83g+bwnPt63h8fICKiquAhXzQaFiO3IIggPYAGaADSHm3IY3sj/7i6HKhrUCe2avCDkwOnVu7Dd585vn2OKWRJT/5FcQgJaKBhCm/doHgfL77WUMyh83OBEE/UWgTkEhAMDrJeT06ozNuxf2/mGZQhKP+nPtgvC/rEpEUGxARErRbYgBhX9uIVS9f9Qmof7TRPWR7cwkzAgtDGrdXQ/U6iA9suZv59/Oa/iKVFe26tKUV1LS20kxFNMghyJZfBQp4FhjzktSuMFVCshP6GVM+FDPCSGPNPIo6xxt9H3c533Zt/3a782PizhbpadBROFuL9Qr0PUHpSI2AeTJ9aUS1wrIIk/6RTgR0v/qCTXUatpnZFDLx/RR+ck8AAcN8v/+VwaA/OTgl3tHz26Qp7u5swPZNmzVCvM3ecMQb9577dd41Vd6+ZcpEm7yxSLCXTHwvM81hf1bg8HBJoARvdP4kZ+llU7mYCd4PMd2DKikOpLDg2BBUBih2t8hLvfT3lTpw652sn3Dm2xZaJY8Wo1vcN1rXf0qv+cVL3fprJ1KExe90Pn/KEEG89RqnWc7ixlNZ2pT2N9JTXSIQT/8Tb2N1zguxjIYnYcoRsRwoBAYB0bajYH9u9+Ein7oS+96Ue5Rd429GFsXUOlipzva/qAsOrGpubUtB84WNvvjpjaes4vkwSi7L/Wtu1/qWOua1WBWalWlcpWocGlXJV85ylSakh0ZE0WCAti7NhoN639+5stlH88XUPYAiP02e1h9ZN7VOk+5yVnAbGc185nMcHpHoT2NqS5iovSnVX4yk5zYhCfQit5xjT33CY9J9KLBQgndZQKLYHjCplkpQ6hCEryfZtrfMArmXyNc3J90Mt/4wVc+8b43vexZj3vQ3W51vStd7FynO9HRDrW/PWHOo9TWFjayjlh6YTWm8AhJWVSjFGous5jOKilMZBxMDMzEjoZAMhPT9Vvf9EEvzgiKd7owlNVd6Ui7WteipjWqfnWqWbUuyg+3UNnSqExVvCIVLN+y3BU3woOOsibJzEKTayCtAi5VkZwkJHwu5ROHmEQjRuYFAgEYaMT5/+r6yS98R4SfxA32nBHk9qu4ynlOFhvWSC/bsz0it9snZLrZ+GbVS2bWxS5byvxXMZPJjLXKcAbSm660ZyU4TahHDSpRhjAKXqvhIRsZSEUS4qFjoaOg/QUCcuUwjfBJY99kOGy26ArK3UI84Aon2McmljGLcQzyDN1oRT0qUSycW0hHYiOby1x1NBDdUUrWYtP4RsuMa3oLlHoGh6UvLO4n3V2DMgA0jb297jPUJWXxt9H4kz+56jPgMM8SjFxUrDNgkvd5OajWjA8RlQMLBmOBErOQfygq5R4rs6JlNjTVpFuMHARrU7OC6JGd4Wi8swkOPbBiTPWiu3ucXKAMzMO7uwfTsUFj6yvZsmn6Sm3jTJj+qLaUSmTQFJev9M6L4BhYMEAVbgfowhwGdOyzmIEcc+SS0f1dQSq4Ji3TBk6RtIcyEVugY2e7U1iAwxgMegKV4t/WO7MjMYHhqTmsJoT3HskxOmh42NyKwDkcBhWAlu+0UM6wevO4nZa2e4ROcVPloLVjWttyE1ceyzKgSluNgYXm8728IQQ4sECVVIPa7cHV7GKepxcnKV2tnF6MBI5MiTz2bbsqkigDh11YMKKna8Zj7AUfd/2VlTBQWHPggjiyOK4WMmHBYQwUjKnn0k432ksqJalE3crAgRWMfopjLFcRwSKmyA81/RjRkNT9AtSRzhHBkGXgHMEYjOgxibWn5LMwkd5N2sFYXHNDh9Jwpd0RuhYEOc0cgzFkKVLpr2iWLOJAAYMMlXI2F3K4qM2MY13L1/JOCp6kGHKdk1+h81AYvkqzqkPn0tApiGH72dpy1FKb9n4On5wzMcx+hZGILmSQ0lxF3yfFUJvCKF/Ocp7wnm6T2UsDBkXeNze3Zz5X4jMnZq6NvCBDgnT0wl4apY7OnWYJHYphX2GWujR1P/Lyw4xp7WdOZRvkmLvdG0PuyrO8pnlumzwXw2AaqnCmb4no00GbMyeXho6TUiUUCBSQ2w0qAmteaDDNnYJp6NrAvOQqJuhIhmRDnCoazuvoGFSwk9l1J5+Lof4VYtixLlGeu6jO5j7Mgyhxexva5inOOcNQjRx2+xKMqh1ANDHEkQoSGgzEKFFhwU0uQTrpjfHtnd92Lq3T7tRDwbCDHOIUZ3jIM96m96RXByQgWaF1JJLPqFQr3RKkJwPZy1VuCooiX9o6EzVGF+urv+IGGwrfSN8rU/N6ppdot3o1rBF907LWo/qBM9cSVl/Ack1PImgUUUYFVdQ2dXWOxWCJcL5A3KEY58z26p2327HbrcnjJtXfGEwVW4SGLZwDfOroPGU6GY0xMscEFiDQPURwsHcFGkc+nexM5L8dIg4qHq0LNlwAa1JXOrL3lO1EAWrILd2XH1VCxts4mbeBIgKnH+YJAD1kkqmN4CMYDkZ1MRJxvBM0koOF9yZTQez/qUyp9hu15C1ML/Rkaih4zzF7grIynWzVWGBl8QvAcgM015RTRL+pBgNinl9mW8z5K/3fwECNdM6sVGk+40UNzaq5AtJpFkEHRoECFUQ/AN6KKWMHHacpXiYJWOO7dYyUkpazHRqH6u5kFyGOPmh3u/21ruq0N3AQYv2n7FR51LJyWHnADz1ZpJnY5cR9UX7MEWwtzPRezAC65iMlhGEwaD/i8KrKBTT0//xZmrQBzcT57uJPGlC7IWajg25zG9CBZPJ5NRgQUOiVWWBBkjUar66QZGkd/RIJn47ImC/fn/nMdCLZxGL9+nC1yOADmwCDahT2b031MqeAvfeHyYyC5NGS+ifKoChzGC+EJ0cx7fjrwQ4g8OnD3yhLm6A6ccL2hTfFstKEd2yWrUHbmWRJABQoEUdT02W6U7yATvrhBHUpceI+7R9BNELhLzN4whm21iE8oDph4UTKGErQUNt6BLkGQHwGoIazAeQUADEmG8Rbw0e+cIzRvONpuvbBVJL80hqefBOA1xzXpIDPvCFxA73UIGe/FGFdn78cmodwEm94BRNcj2A9HE7CWc7SthQzpy+8kTfYiPNUtaOryGkAeABsyGu8VaR4HOiy96W4nYfBJSsKLVnhQ7ilDhdjSzHh9AGgKumDTFhdkhSidGzmxC8mXzqkCtzm5/UcF57b/LBRYTK1MCy8DHoZ5SQZHJJ4Qpai0aPpSUE4k2gu50d5n6yq3INOJ4eHqi4ZnFaTPBV8mwn//dvOdLPog2A5JdvCN15C3uCVmFeIPB1k6dDRHNtlWAeta70SIHCSvsJ1kF+u85weSvpHAFCqllST/bA2w1qkvU/Cr1AYEM0+98PJeelTbrIuKfE+ebuQt7G5DsXgCb2LdPZThZ1xOlsnBqcMd9w3KexNZZ+TV7N56OSCzIw4MO1WdiuZCxQI3A7zxqoKBkrvoS8dUuhT3tzAdrX5pdWg3zzcjFUwy1fsZMyu0XSlax4qGBFx652dJduZj97/idBu96+CoIkSWqJjO7X+eR0sgKkdnz0QqYDEa6iw6jBHucV9nqUXi98g2IcESFAhs0aHzerFo4E2VuHw99Ucu15JHpt++OT6cB8tUvfv5e313KGejbRH76oYnVH+pplLK/9S99ja74QdZG2AHzFQyCi70SMneosHk9WJEaKfPV3lX3RmwL4Q/MvbiAY1RC4D9d0u8yMBsAsTYaXnN9GDxPhpK9WIkpTsGR+juEjl317gqv+CUBvvUoQliJj1eYN4YxD1xV7g02/8LOYK+mQDP1pCC3G7bwSM/4OmjR6Np+Kl2ET4WH5uFZnjebBEU2ZCB1NdVLEf3Cw5VWMgzc2i6b8UL3PzPeksxINCL7LIm1jiRZZ6yjIvstzjVuwVTWxVw1Xq7s4a+0raWo0J69OLJnSveJJ/mJiwwRQVVbUn3QLxwJpjRaoREgQcQ4okYyqzmQkyn1R7p9VCxoIAwRAaZCuRLi0B9xnUApk4wr43crOLOUmS3d/QRzdDDTfCSKOMNsZY44w3wSSTFVS9AYwwvvwRgQIRwYIRijhEgoR7D6RMV4mNtIxtdY35esR+BtecJfLG7Qcm2fQ408K8yNI7EOy3M+lclskARzodGeXImMbNgEYCm6nbYLcBdoolT0IwON3K5IoCmf8EQ4NZ88dTj57j2uNKHgNMaO52vSzJXJAHZ1Nvyj6rUpiVNqrWwq8jsLaN2i0bd1Cq1FoLXReK99uoZtaKU668s3AyTsOAcGl/B6d+juKhdP1poRm5k3zCdjdBPgJpXTd7ONfaBvZrCUprisCbjmRttzr12ZI4H/q7GEk5Hs48it0Vuqn5DtYuaU3R71Dt9rFJepWZTXenpK9JlzPU0L2Cxr+hMDFSQJRo7ilCMD0aE8PxHsYyZu23YBY4lVKWTvGrU/Ok3CuVtU7S3/Yp9c887MO5Iq3EWi/mdG7pshAdREvttlG3PbYMzVAZ2eInRKLJA3NGoVTfGnBMmBON6n5oTI7SyXpFaqTOp7/XSsdfuqE5NanIMPP8E3FFjQpuUNUPNcL8RtW9wzcZ1MmtxPEH6yoFCMEYGCalNDyiM7Yyr9dHgrHkQVRfywlOzzv9pMbicg/53X7ag45/QnDPOf/5H4yXu9H2ALZ6x3drd/Z0z0Zc5WpWd/i4L4ZFekbiUGR8iZxfZcFBTuN4p/OvMw9w+Oz4Pqml68ygYGycUEnbMknfLMkg9zdMDdLO4UuHWHzfYRHzAfaW709INymXNf8+vQbk/vuEjdw5NF1shml/Stcl63B1mZMudC5CZi0LOKaYnWo1Qpl5Ph+QbGXQE428e+gXCAqt2Vr/piTvJfTA4tWNVT9qMZjbJ37mHUF/LL9h9oSad9rhMTpJZ0IqniLXYP2OjlIqkftklU7SzBXu57ae+PNAXnoeLe+TB/xtpJx/x0LV8UA5qt3GP9eq3DT5ESes1OfIkZ0hPZ/9KWeBQX1FyXKx0v+OVfNWM0P5IQN8PpERkdAzoTaDsV5U69mJNC1Gr3o5tn+lhcSeEfN/Q4RO132XeGq+s7LnWyb+YNkZrSrvlCiFFbnE+WWAqM1VbbdVikdxOLBk5KuSD+0eoBAvr/Uv+Z8grUCw1lI2GG10tYAoT4DDh+NYCP9VR/GJvkMJYpAJJ75PTX5+9xiyv1n64g9WYIet+kW/aNv1LqYvRn9UZ42bjvuf5eQP/ZUT3QUZ0Fx1nf5fPmUzC1SLud5pwrBiiWB662RDRemZZ+8DJCAn6crYoruN5RIi1lrj3l0w/0EUGkZxihhQVb8yupt7BpTN+LHBvYfcifLGx2OB9jE55h4JxgwQFkTH8ucEpyT58PmDKMEhQ6bc5NNOp+BCiy6muM50sUtld63rFUeoo+76+tvODrGAKU5vrvNf7DLGeYGVDT/Ywz0a3E3Y81WserXDN83jR8pH5A76YAaA5VEcHHwcupzcDOp1OAyubZbQFCZY32HywkahqUuO7L1H8Kdgfmg7YI6VExzn9E5weic7cx1O6yFn8owTfOVE/zmKrvncdiDEiaMkOSnVnCYep0lzZ0inPZrACgGPa8VGljIOK/HHiiz1gFK+o8muX9CzdFmKduyI6hldix06ftWiXxDyTb/LQPl+YENpujWZDEpuRaLbyUk1jHltozOvVM2X2M0EhW9/W0p3hgA/PW1LizMxTg8x1vs/IE5JYhfsAYhbTACm6x4WiwTh0oI2RQsOe1BwZgk3YMQBqBuEg/Crp6/3EPaKq+DH2EqY5IbOyS9gcFzadc60lRwZLdIq+hwiRaU+3yFrA0+Uyn7b1u3hV+/zCPeogNxhF9x53Eq697cPtv/ESMN8QBURxIKs9ezusIIZN5zBBK7ZImPQynJcjPzVGhhORDTZdjTf8L9pdi8p5tQRvXJqwfU7fAaUTqY5HtL3s2UuZNh9OxVEon9WbwPFzEpySMG3xLY3c+Rybbkuj8Y9dewkcorj+w+zUQ7PcqbGUe6CQ1i//LarRvWo9JcShEztgNQA2vWh3uxis27e8C/fBTNfZ/wmglm4JCy3dnRE2S1ec/KuEn6IZkirnlqMxZH0Ix2ZlENy/FeAexn44TkBcb8Xw54wxfaO/tuodtqsxsq1DIQCO2ZyJuaMdrgcrOtSjeZ2ZDAHbVRNo6PTY0KfW/sMgjVomif5ax2dGcFqpg/8jSRxujoSld/xXfEGLBZcbSLg0ybTxqMKIXMwnGy4uE1tkdVj37UkXWXVkqlUHUq9/F+7eLWHvzqYhdZwZ/pNKbuXRjoAg6Z3mMTaMhaH4hbtGQa1BLd9RgIQVPI8/9d4rvyFCQwSKv3lQGOQoR8TvqAvm4ndoM2vNlkac6eE3DoTbdNoYWYpaBvJn7Wo2b9apbPAo7f5iEgDLj6M860cppkdB4JstvjWXdrjAEa8D/7oMO6FbN9wAMve4KMwn0/+YYvJ02Ez9/9lUwKM09O1QYLZV8Y2+vP8nNHFgcabVAYK6IHRHWrcapwOE/1Rah4ajOaff3yzjFu+0pPd/WeIg/kvQu3fzM0Yxy207vKr57SSBkMd+iToZ1HBpGM0hrbKzeSMFnabj9OWXmhmFpklmcuxx19OUyfKUOK5xc/r8K8Gg5n5uKcQ+FZS+Bij7agtdVARisoMF0P5k/pBXU5JgHMD7ImZo0ZAcyGcLDd9or4ohDcfRD297A6RwY59CkyRHMvdcGqWg9Euc6F13F/eCkIm0P2N5RernGx6eVqbtVKv/p4fPlZTDp6pAeLw1uSzugdqsH5H6iU3NXbNU19NjbSW9eoTVi8XaP8o7VdDLbfHNPscfMUJW98wFbRvP3fMK5+56Cs/n+m3eMATXvLBPh2lGA+50oiPEtPvsKMhaHLZO8yYyrdD0iqs8HSKLOoTY4utURqGZpIv5LwJYe7u4vOjtLWAyLWfKjvrKruemMH6U9zQNFzc+k9P+9daVW201WR7evU8Py6mpZ3jZ/71DDWFBqY0pT5NZbqNTX8W/WI1PFNwaWFuJFqTNbw+2a/NBQzX7iuFy81aaqVDrM2Sd5i1X/oE2PJcaZAwV7ivrH5Va+WtyB0ErXukSKGixLBYCX8dlsXKRCqz9zCGIQhxyO4XdQYczj1u25HcZhhToT0nQxPs0CGnZ19CGqagu6Z019I9eVlrmI7unN5jS09CmmohI0RkCksytEFURslTD6e+ZDnFYa0IObWW4ZbDuiFVnLOnpz4cosOGSEaiDhvBXJGuw2YgVbTDCpEW3WHL6a5ihe04O/YtY6c9uPSwA4ScDs3i3qMTpRvolkJabotApXQNPEU4obLSwGs/UfELUTZnrMoBuX/avVFGbISbONSBKzI2ZyUF+ZAbGEpQHkiH5d9oBtEppFPrdKTLqXQ7bmRVDTTqROsS2Y3q3Rvp/M83Pt30iCanzyfDzGksmwVmuexorJQ9yfScaKyaO8GaeeBm5EkwMy8xeedNsFa+mLXzUyH/EjHbdgKzRycldapTbJ3uNGbvzrB0tguYA7oouUtdYutyl6WUXTal3HIxh5dH74iuYY7ruqhudENqxRWLqiQ85uQIkiurTEzlPSQ4r0ck5/eY4IKeEF1YFcEVVZNcWQ2faqsnuLZmllpqVTRyrwjurI3orqgE9wSJCa6d4P46uOqsi0/dvSN4ol4+0WMQPB2TT331Ueqvn0+DDRO93AjJK30mercJlr70nejjFjA/t8jWUmuYv9oi+rdtPu20g+mlikqHEMWmCWEaxLRMi1wU0yFmYP4FqVLbB0WokCat80hI5ciECSWlFylFlFCeJKMCaUJFsowU8qRKDBk1mZuzym3Bw9MFXoFqRYo6okRJuXLlTbVVUaS9yoQOqop0VJ3QSU1Gdw3d1Ki5TH+9ZYYqKjMRvnM2KWtmws2OmXSrk7a40x1THnbKtEf1dnpSabenre3xrM6M55XmEOvsU1lnv6p6B1TXOaim3iF1dQ6r7555jY2OaKqb6AkumCSXk5aXS/J5olkzk0JBVFHhfqVKTVWVUF1N1tQ4qK0lW7a0bdXKWNdaJzIG1JUhGCUVEasCllYctY8jGjmHnMIxycR0uv0iKTNOqGQBuTLBKoGichySm7XvUoVdE4IgHK59z/ZGpZ8Pm61QrMj2tyDbnmDD8naJ4SYIvoYFgmUz0yxdk5hNx4IsNsn21Ko14c/agDdpqFXuUkg17nZ47TNS/UaShDr0SCv16LESio3QZ82QQ7WSICT0dxtMSo8Jb8g1sGV7DGlriSXvmjyY4V+JXf4xCqFZAk2gmaVJ8fOgVYl0kEPEn4iTBft0jmg/CRhb1jqlhzUsSQMkNBRBlgZFJmeIHTzSICfK9aCJcgw0kmGDfCfzSt8x+REIgRAIAV0CAmb5PY0iT3oKjNgQQ4UESEiLhwltTYoE2kAbmAJtoC3oCBkmEQwSylTO4sPSKDv4s5qCm/Srl1p7ED9HwWP406TtvfA9OWPkO259qzULj39i8hODW9E/vvAKese9fF5WVH0cmocKLzmtFlsp0EHcFH+//aHzvuR23qjHan8LuOKRt+a30++4t/TRmv0FqDcA6T/mtKL4m133dOQzSxa22TsdEN6ZFivx4KcLUOzv9/jtz5M/0e8FCP3P6vnjbJpknw5ML3n6vx5lnzbslw+evb6hy2NeVi+5dxyTbIZPvyef9ERCgkswytInOyNgFt1LgQ0FJhJFFkmCTFM81TEiK0Dkiw6FQEMRKJAidOR6NXkirWR2V7rkrXzGSbnfQjWqp5p6+qSMTndBfYFC01Kzqqz503gdKuuRzlIj9qtq0L+6LAyQFxp442UwLLr2DH+tulkj8nejipTZFGp95WfT3U+Ni+mwpcKfvH9yQzswxe6hdiE4MuNc1XSjhnObx92nbcGs9znDx6qrr7VU3+7A8F0/KqF+1bRx/UZwoaAqGVzFGokKo8Mvr/nesAtL+bs2m7F3s+fAkRNnLly5RcY3KCXvb1oyRSkc1c5o0KgJSXNMVFY2xo/b9Ir5PfaL0CeIMcESIpRNGLsiwjlEhLPjhJWVlZWVlZWVdW2lb3Fzj9zOmk1u7nC3huZ1l4A2d9aNOeFuj7UWwzsKJZTqpRQKhUL5TPL0fd0EZWXWQJss+mSrpTaPOnLUlRt5nQAAQHEAABjBSrJkyZIlS5YsWXI+mUwmk8lkMpl8KmNJnmIUzf9dyN0zkT3XvxeSqxBepUQRfXmVktUR5HMnujv377iRxD9A5V2l6Mjkp/BKZ8a2+JIaKjWiCUlzTFRWtiSkvhv1/SLI+Qbi91eO+QNbCaDjrh7muCsum6I1K5FL5Tg34UrkjySE9Fw7fE1uvFIqbT0v1ISxKyJcBKeqstVSm0cdOerKU88KK62y2hprrbPeBhttstkWW22z3U677LYnDtUkxKAPmYWVLz/+AgUldy/rcT/uqQST8rPYiLevQkiVwqq6vFqOT/XyQ+5xw3f7va/3+P7eE8XzOsHMwnmrARB48dlnvwMOOkSIMBGixIiTIEkKivrXT8VWSanqsmor6t8mGh7FL9gHDXJMarOrnCKaSWmkiMPGAGV8J4tivkCoWsncCHNrqFT7fkmM4d7/6Z22C06uXLly5cqVK1du5kJdrsjpIM6VjcuzHxGra8wQch289nfdc98DDz3y2BNPPfN8inuG9i8wR47OZKAHgF4HegPofaCPgD4B+hdYM4D1B7YNQC5jQy6ShAC0nM1JAkPfA0Q5JU69+8cKiWAvWD7Zq0aDSaXDNUNGuTdotprCwxa5O9xlcZpD9Q5retglP690WVUsUOJyGO/N3XoXGuTm2tQx0zuHbPNZRpFepBvJIp1IQkg6CqBxXTpia3FNPaisriuuBiWr4ldyFYdiUjSTZQ0tDbUYApQErqBvwjwpPopJMSoGRY91XRIMARx+EqJFflafT2foPFvPrs9t16NW4S/vXfWfQVrKpiCPH58hk95X5AhCev8R04rsnqdWBBHArNTCjF4GqhCxCqZlB6Mil2Zs9L1SrJRRSbWPiFOstNCD+b7Wk6Krbbb7qVUnqmq+hRlfiNnzErji/oQnY3TKtMW0+fwYwcQc00wyxjAD9NJVey01lqe2miojTLi4JStqmLEmmmVRCSVGi977vmBeqQErEl3B3PtLm4GVbKi3cBR6JjNrCOjJhkJoH14/MKUFky+0I9k6aR8TmbHtz5y/EYKhgn5EmqqrV3cUM46VEXWOY9m6t1g2rBfLdgIh/JhpcwTL0XWfKl1KzzAhZIdZ/6Fs67lKbLZXmmWLZZ2Y9u0kzOnKA/B4ZklbZq5XwRPqkUAPGQZ7D6EUeINMwJK9rQgtAOMh6/6T5tPGNr7Pm9iXfd23fd+P/dyvTW5q0/u9P/t7eFyuKURyJ8uZeM3tOwTARUeKqyERUEtXka2+ahpqrU7nX2midFVG4zkbDtmobMMHMy+cfe055abyTvmMf23T8MefNfLPZcI60prXstaR93KUvVrnutazN6Pt7d6td/QNbGR7ETkxK5ULFrf4JdS4xBUhVM6vqprqBHxiVyJxQ9UctFKBPpqqKkEAgAMfxO4Z88PJjaaIxW86gyPGvWlXRnaPXB1ZP3J5ZGrk2sgo/3xc0S8f0HeGgr5FfQNAsnr444EMwZ8V1DedHG4mPi/YlxAx8cjiioVMH0wE7OxwgBrb49MGST0SR4WzBt9dHcr59dftxuS8zCv+q9CvCITlvf0idBkA1m0wwI5D9WcA6wZFTDr5x37NAcBfm28SJ4uwElCChRFdCvoQnWUICAkuDhigIaHx4v9fPGoIiTSAAbsUhQ6lk295FXer51VV2+tWhpn89Gc8q/kuYCELX/QSl76sHd+pXV728lY8/Mp3e/f2eM2jrnv9+7gv42x224eLC1zDHUcVECIToUToEUaEE5GLyEN0InoQmxB7EWcQC4h3kFPIXcgXaDR6Br0XfQB9CH0YfQR9An0afRb9FvodTAKtjFZHazxAPCA/sP7AxIHDB44cePPAlQMfHcDX7lYvOtAaoCEFVBi+O1VsujfU1fqwU1rJbLbzX9DCFrW4JW9uf2wnd0kp8t+686vB6/2wtw7AC1f7a0cOxICyuIGIqXq9jZgWDBnThoF/zjaldaJ1P6BU2xwYW11eXVPdWN1S3Xv/mftvV+/O7dKS77v9vSl4OeP/W5zr7bWVgYlsgbjypz6WgffMx+vf9/+fuXv3zfI+DxB+G+plkZOxul79evKU6dfFvk4Cz777ddSX24An/zr5eXJgsm/yDYDHP03uX/3Y2T5sP99+/PmhJ/bov38U4eXjavDr0lu6gziZO0MWFLmu+vsJ9FW7S17bqMCubHyb2wYOD1fz5q24+YgA4CFE2mY9cszT73OwR+EoFcoetK1Lj3i7ME0VFuiQmvN4hPzj8wQsb8qSJ/KJfeKfxCf5Ofocf84+50v+ax+d5XCL0VteaL6KFCi8IGH5iyxUTBHKd1TxkpUtU0onlCiFp0K1ypfTVXUq0rTbGlYmv1pdqtSup7pWpZO21esVyYAotRleuzG9MapuY6MpqN/sRs3rkzl96L2lfbcpjhX9sqF/jrSHd4fA0XHhwvhxdSKuTNilCeL+ZNybtLtD+RMz32Po9VT9jqmv0fczxvGxtITmnXAyCwu9yGQXPmReAgTnbYeIgiWKl1S8SqpKlbkydXlxWHeDel1nHWYo7KtV1vfXgbZCejp5z32Jnl9yke/8wy5GNTW6vKM7tqwd51a0RMNMjG6WRX0hWFz7nlnZpDdT8zm63k/Tx2j7FJ3OkyxJbWmWnNQLr3YF+vfStuZtb0H1LtXEJbkE2eVa2GcGK5JztLMloiVoLKNMGcqVpUPPda7C6qZs7L/j48bp7ce7afgWA9cm6uHk1I+gcTctsbw1KkspWao1TdvTqrX9tq4/SS6QCWc4IzySW7Egr+JG5c7qU6tD7Ti7gxS44OyzyL3F4orudBdq6Vp5A+iWHlRTddox62q4iXT7uUNMxZQpTmUms57tTm4aA3EuueAJt9zwKVc84hlnoeOcpxQJ+2+3L7Qt0vYf+Zaz7LbTZzSFby78chWYJ3sBYosUV5SEYkUVJrpwFTuuQseULl2VzilVmoyy5VWieXe16J5m3dGkWxpVrkd1OvZCv8gG9srgqMb11vjemRTD6Hr816CpsUxryPzGLGjc4r6Z20e7Wra7FVuatbkZ+9qwv00nxoOT48Wp8eHMDuD6xNyYuIsTwOUJuTkJj3fEk2E9m4IHk/VhWv7Fwtup+xtzP2IUglUMYBM6yKrGyyq1j6W3n1XuAKuSAMuIn9VMZD7JLSLMojqy6B4OM7cFZV1fYvNLdL5JLCDUcHu2ihHXuNo934s9XsPqV7mq1ZlQr8kOOpfd0LRMZ+4Qq6Zl9w0J2s3dTX6xWrPl5/YktZJm5BHyQm8O/rnZ2twRPiKbxrOXmt4gj5MaeH8G/10r4MEuB7DescXc0Ex1HjOgNKXYh5KsEXn7ZSNgXsMRXfULht+su3eKCgvy83Jzsq/0LPM0Dn3XNnVVFnmWJnEUBr7nOrZlGrqmKvK9DZxWXlbLxXw2GY+Gg36v22m3mp8/KK6Fe/JmHOX8bndtbyNrRrG1rkNZXnk5/JwTwbAj6InY3lTK98Zab9hCg8lyvTNutcy1vJJlHQ688kv1ZtybVEKlLgPJ6uaMWRR7zDe2KVC+ddHltlOXSrc5wz0ewL06tGQC1NVeSOBIKa9Nwo+V3fyXGQw7z2g4tiw7XUUKIGmbh3f+lKRVzlugnOoUGrSnXHGNUFEJ+PLet5V5IIm3vWY1HBXf7W5QAC+J4Elej0XbKlxmw4amwnZhBI3Hkvd1q3uBPElsTxqJoD0J/DySdP55rJI6hYp/HpdfCSkPb33aJmsGcUX7CGbwycc3Zf15/1QE2JSpdZtifEx4Nl/WCFklQGcqQhtFUyU+RURMbUzRBDFrC6IG6d+BA19adgaEUN3TFyeBUy7r9TVXX9FX9Q2qUZZwn/06TPiHACHC999+1UrIKNPBP2iauoSppchpig1kFaM/tRNMrcSaudFW101oP3mikt8SqGG2IYv87cvzOGmUiYYcD2mNUiBZQDgUvOHPyGFktJozE1wuGOud7d/3gWcNkvBOc5k+rV6td8qUpu96mk8qP9MH196puKSC0+EGgyzFxVNTAUd2NtwM9RyDScc6aWqzpMFqKMlrmIqmdnkEj+QVgrVNcmRCJvNz2bkmkpdUkdi9RSzeck89n533ecjvB661+KdxySUdf9CS10TQYzmYvY/gJTRHMPHWJAbt1vrjfG+DygRD7v1JozdJeuTGp5Ih7CK1HTR8QcVNXOzz3hq2mv+wouO9R1ulsSutYWExUHqoinGh0MmRtmLlBEwSYIxfTlXhR88r0eQC3+2ZzC/ntRa0iYY23ujMxtqD708auUNZ3cXIZMw4hbsrN/vH3jWHRuD1HgRm1WzDA2F7hYc43FWlUwWL2sfldhHWVrT35eRTsbT1w8WBesyY5hGRmCc4suIBTU8zfiQD2R9Fq8uzNVd4c70pgMlH+sxRVOkDWFwzuOHd4cUiTIOUp/yU3/WSuIVazH1LmzKOTNzzO5Lg7nFJ1sZ6MNUM6m3aQGKzliNwy1UH4+lYHBcLkm0ZBVOn4B0LAhqxrWHspmkfBxaMudFxV9LjSjrsRh3rc2AmfHLwx6UptWMbQVZ4m4JTQO1KXcCYADJrha1wJmPNxgqCq+CpzhPuJ9xxHHfgy3VZHECMtETVMiCpYEq2vkhGsCMYbagmaLyvvlRREBaCgyuPdKXlJ3X6DBaKrGGpzTI4tlRQk/rZjiYCA/AO2P4Z0KMCoQRR/e2+FG66tHBZZkzou+2ObA/U/gQYFdQPC58g17qbubTucQVansLRalmwXnLgHLI7oQdpxxrBPIHGiWQr3iknTQaxNo/7F5/t0VWJDYXCe1MSFKLAvuVAW2Mc4n5beuTpu2Td4ZEj7zYeiEUoietzZfiUZnK3oudCaDw4Pa0jr0eZutX1kvdOYNAMqBaBEkDr1QpdQGvhce7ADMA133yx6DTfkyciInx9gU/bM8s1umm5TN3qshpd0HvgZh35MSCNkEMX0ZXoVkBeit5pok3UTmwmFxr2qXTm2F7OCpis2LV9zGnZrehHi0a7kQE8spB3cdYl9nxMgLVQgejJ362sy8IpDpqb2wn8KwEG4vEdCscmQr/CtSPRqOJmYkt2fWF7li4dC+BE9rwMhuBhAm7lj8alsnG5mF2YGS5aFn3cn0Jt4KA544/Dsde3Ig/4MZ2DEfWSwpMAGyBzXxG4BGygCAUifuMh6JHoYqgrafR872S6YD9Ez0llXQIC4eyoHdfSaeFWcLqJOpJK7yCST+ATaKjbxXohO1BXK4KMfufMpRUy7rO4vF5khU78PazJHPvIExkC7jN1a09nHUkNAASe4c04ZAiCZwJh3vPmmoU6b4IRRPJ6gM5OIr5ZNXVng/BAjCuCs7xkaZSxE5rLm8uF7OIMIkUFHPnUlpY6MD+29VS101c+F9GA2jj2w2zkDEBnE8ujwozupfDStTwKaoMat+EVjrg5Nxwsa5TmGKfCcJQjzi9d4GuJh72/zyO48uf/482hTHab7i8AhzNwjCDm8Sgi94j5Fbrkv1I9Cc3lZ7CS+38lY0xfyq6Z+bbRmsC/k7fdJJf/7Fj29l3BZnNOHyJYngtnOexcXpCS7PURzlVbFHj8kf4Uxjq2Tm96YXyMWSVcUH4mO/MTIck/xxglBCalMPGJBy7Xrb+LWAWJI1vrkrlyXhyVNbZWjpkCH0xr8AVnNZOFpxDEk0uftRjQfMINsv0zMPWzMeuaZdes+ZOri/x19yFOohOBooYr/J21Q0kNi/y9LZUwOP9KWloA/sDgXa+W37n4mVRiKRv9AEJ0ACYk80wDizbP5j2UfB20wqJu1Rth61zzBj+Gba8+auPZX4bh5uDcRn9LGIvLn6hANIKkRr2lOq+zbLnCCWh7NnQBFhmhJDTGd+rnPxBUvVoDgPcDQJoG7BQ4/glAwg+AgH8HjIcAAIPVl3nK9iwYgsgmJHySSpFeB6MSJgXBU8Dpd8IguWJmDE5pUCfVLFyjdoMC00B8LpOMFHdWx1Cg0D5A623MgOQXIU5YKvOT0eAUhK3Kq88eZQPsSpZKMSnGld35EMEE7bZx4UMwh5OnFZgLqePUj1wEm2DHk4dpurPkyw9qgOC2MKGyghDcYbaM7WG5aFofSpA3nVYs5qujxXes7wDnThkiPo/DbPTK9ub4BGqmRAlu/XcwjEcS294OHuZVHKI8z6orMCWE7XLLNl7P83gkgGU/9kYh5g7K9WYOvXCmRRZkCnwjiRgxdI3wOuVWgS0sceP2F5YJhbYliBbEcvoZM/J4OCtfPyKDbK1o7S6U+AokFJFJc35b0PXFJMRNDpAILpGUJRT2fj9b1ktfDgNaaQcMWmfDJjuVOM365ZJjvUAGMQW7MVmcxItVgZphVIEcHtbqt0hENb9ECIhG8C2q3XzfrArpQ3BpOAgXjoYh1VmqU+jUsifiPqlRQx8/fQJSQqJIIb3HkVGOC+lqZ2YzwMAYwIkBQF83M122r+8WTKvnLnFnXOFCMJ5jvXG1gmUuwIvVIMuxOQ5unDxYHGDceMziyjHkuRmG9UwzeKyq4Oy9vWkzC5gsQwbaA2EeETBkU/OEejw/Vn01VLwE9ty50a2cDTWJon5ys6/lTLauP3psB5URiGNp9PtlqgqH5VK6xs0wB5EBWqht+UJLOxQ9NlJcdR+0PtmZvDx6AJiVc86gQCFVpFWTbIiHrll+qY3XD5wEKnmitxhcxKsU58jGS6xzU+ino0sf4AoJcvQuFaRMnbnnUCO0WO6WqMq2gqqED4icrDCzWipS7qDrOiCodbS29VjcPAEc8+5KLOFlUBssiQU1hK9hbPGVjY1uqKpA21U9tYjxOJtMbkGMmyAVx0Ew0JZiZGNcslUSbDCH8iwaQXLKoFaMJZnjdOR4S2RtxxxrV+QCKNNihssHnUqDa3nQhB5QyivKs9UkhvmQEirKTSmFgHqouyC3L15Y4XyoXXhvot+Ll0AlxOPbfk2lpuJTVloRPFMjCNRwxkGDp+bpWK9h0lv0PWvwD/P4x3KbvYjDDAtH70MPdp6BmmZTg5PgO0vZE78x12EKH9d8a+qHO/6NCFv54f5/qeDZN0djCgGuVPjk8XE6YhB662FOLUPd2VBZsfYRjpdUq0EFuph2IsIjGeupX6HTMDuMBiRNSK/Rfw0ZtbjDOu+deHQGmrLiPG5Ld0LPdjHtu+h1pjeam9ydGHNVLzheNdwOGy71QEyqQZpZrM6NNaSqyQwMJoqOOUZTGpooDJj5FZqjgehGLMNEbkvKP1cR48mnIU1+Ah5vN1vikpa+nDuMgaKn2QkHtpo7+WXa/KnzyGeyKl4J0xm5/zmgzYhNCM9zHAit97fMfWPkw7wZLXKDn9wPb948gHp1SIlNRBpGfcbYy6a/wuZ6fd/hLDNsWC239VlWD6yao5hOkdOJWHDx7DK7sAs7ekeSjTRXX6ta0UiMocrQ4KfuRsox1Tysfq9wxWFH2XNKUF36kOxL3khl6oAYtMlqq7Omp5NFt7BUbLnFffRd/oQkw2IYXGrOdoQiYiv0tL3swBU9cBPjFpi7r1bR5pGwhvzGpaNBwgpGmimv8ylyvMA0Rs/r8+UFmkpGt+wn6cBOHIpnBIzNufsw1ev93ojfU7FThugnD00IYMiWx0fFoiNRU/zVq8XEnLL6hJcvqUgv0i+dqmxUzVSnAvLpvq2d5k9VpxGbkaoAHFNWOe4oHGPAPplhxw02WeYHbOF4zexxVBNZXpshmKtwGEjZsdayigNUWXJn6qJO5XJWlOl1LTiZzDVkScXRkTu4tVUGrC8amQxIV5XJW5AvsJHiAzBh+d+Xd/kh11urtl/ER+L7GXMnAtPDB2emMRuCOL+MzsA7sjba1G3dtTrujspEOluaKWVCaBhkfGbkZt2QLz7RPg3pK+0zi/jMFfFZ/kyCJkUBz6guu9XclTNGZM+XMHUT3qWMhWpqLvOlNkmVwiJYz2bGAVmGxN4X0nCiESGnjVR3KzSj9+UJcTTtdO7Lu8ALUymqWGa1kaq+a9peo2npyLJsMlkozE59fgODrxobWoK/itAZxx2fjHnfMdJ8pfp430SZkh98iyOlzUBjxgCSv/V/PYxyEGMrf/vnaOu4IiFTSmEalPMH9ETPGQBNCy81RiXGo7ivfy5UjvTPc3b2NUFOD9mhxhe04BB0QkplhW4OePdw+7ALMFjVTO2wxYsdx0Hd5SVjUfdZpNCD0pZuIHLUgdc51CJeldVBYavlm+DDg3ejb8mDUvSo73Ky5tuBezs1jDGnKVpWGzGIAqibpApUT3Wq4UewVtVPubYvN22752is6J+2WDM0UY0OKY+Nksr1bDZYpY11WHJaPkt1bz1eVW/AnMFTPLPZa124RmlFLZVNmAbCwhSXj2yZ6p1BehZCm3xPieqmUMJP9TBIp4KYL9XUZvPbj+vKw6fjdWHQNHuTk0EPWrW1WCjLFkZsiQdbIWh0licizHLOWDzbqUdAOoFQD3dLPOyL8RD6R4tdp8gskbHWHQfosqdQbxALkGi0LlBLA/RJ0GB7M44NmS9zK0EfWTAUcmjS7j8umE0qOHSEjQxMkXh0xt9OuejNjqNXC+niARj8eu0+J1mZKiG9UnyRKEWWZjDF3qxa7zS8zZuHveVUvvWhM2r+oZKuPmCVRu/zQOL5dDyQPrBatVn0vXGHrx+YAaCNA7LhpUzigeUvPyZcYJzugzQ4EHhvtl62sT6XbBHYk3jVDHLAHJi1H+59Qs1XJDNywKtrq84NR4B5vh0cyEsUZ1M0M1JhIi1vXp6htTawtnIWK7B28SrYiDC0HChsBR+mFT2NZ3IvWg1EXkTXQHjemM9kptiPe0lM3elLYqMFm/owfjRS5aetUStcMe6EKljM8CK1E2SxPPbDLAy569rCZUk+Rkua/IfDHFIvm845H0nFwnA6Ql9jImqxyoHoFSz1TFuqLwMq07rxTUP9uFtafRshZy8NCWCIYWpvp0F+AE01h8wPemzQljfh2+wkHU+OH08KW/43jsPooi7O42aC8Nnw4pMomAvrbYhxI4xlKCh9WmEdhR/ff50PcNW28cJHtuDcNhcAeApjyYtJ20R2guYgwZPEum5YLm9GtQf/iDEH0QTgWt88ATkv2dUCDau/B4XE75E32rC872sw+jPWwstpOswRwxoOhpIelXr0IPkgtEPW25w3SxXRpPSbkrKp8dUD85GwroZKDoPl1r7gAjUk0CBaWxkP4zSQJcKSVOXiQTLEeETFDpg+QztGfhjqQFS7BE6rcestbJmbSprIj5TENF4x9o3dDnuJTAvu5WgojstT6tCgrzxbaPJd6IbZV6Hk2LlEYeGSsVzbofIiEUH00qLDvjE485PUf84Lk+rVLctOG+puogRMnNyFeOUoz7rwb47jt7NVsdozB65gx4QLjVbMzezL/6CaWjzzSM3VGpNpI/MqWW7wEMSyS1UzD8rNSJbP6NVsUcS2qlId7wwS+yBqO6ZSiOUiSxDdFXFkhYPfj/z3bQ2lX5QBnk5VMc/nCBoSElQwk+aNl+HUtoCZpIByvaH7iwbKqAb2S2QmRaDZCqeNBfrqYnAg6n00I0yD4j5EMOrhqzR8dT0sCRPZt8iYmMfU+icOTYw9TTC36mDc4tf33IFQ1qmfWRKPXn4J3x1rBknOnhhB81EdQDUboua9P1sRBHu79FkmINAIvgxdmo+ykdjKKunsR+5ilwGMmTpvH0Y6Gf/St43rDymsembbCt/LhxExrEJ9msVGTFQQkZs/ZAIalzVu6zJJZmcB7PcGaXQRzcmYUV1KC7VZjSTcKhvCPsh7QfeEbhrBxawkpxvJdE7goPUIVvrxuDluqe9GD+vzuY5S/7x/Q7FKUL1jd1jt7jYfFRCNvyzG3emiNz39Zbju75INmDo23JUf119hxJyfYb62L4/0KQp1nmJtJAvHjLAODKtfZs5eNYsrwdojzYcwpoHDCMZscsnP8pSI2Aa+5wVhCWDWXS7pOR9tqHLdwSFsnuI6g2iq58wjTTEQkq8QvH7Iwxxg9FnmQ+lwj/TeCOnJjOEuwhK2FRLSXdtkESiwrTCkYSxfKgOg7L7zHABhMIGTfSWkTVKNVBE5enHSbO6WmEWe9SxK3puXrETqzgi/mra6Y4ZY3+dooWs6LtfS76uD3B/Hb8uB91P0zlPNHqjE2lrs/H+LLc1jHcL1ZXC21K8KMm8PSqqf+8wZYjVwW1U8PUqEtsvts47VjD0xRpNkuND9lnqvQoLPdXTRXpzw2A4F8clsh5zKXnXF1fEMjWWHDDBfr9EnM4fHH8UKDKe/7BIkSLO94ymDAcDYFqRzgoKnaQkSiE2JfuQnmjvTz0zxE3MyH5Tm6jNr4nCm0oP5ERyFRY8K/OhD3L6Y//asshSOOQOjRGPex/ghmglq7AYmEtBrmwClBlJ4MCuk35M2z/BV8fZxTv9YJUJ+8+DM8vG5xZLcUGRsYotze2rHSbcydP03czowyibp+b+Ijou1xDvBfdPYokwu0JzqfGaQgEA5Dwu5TiXUONqxk0NfzXAH7tHU7akdAfj+GFF19fioYRqaXNAo7Azh6PzLgyDoCBSkTdzFy6x3pbiRZMs9MpA8bBftiK43ty2S7Gp5HY15nGr+RfkHFSCB9/ObqNHYqkhQHONQpuxUSApjlqayB59uM2RIErHh/4eYWAiNecJaxQi7wEhV/M6sKauLkcxkQgSRPgJTUI/PT2jfat+il18244Bq9mEa9CTHaj07qQUypsJd5ESYgww18oKQxQi7wQj1EcfWo+ct/lUIcYMhXUDu/kFIYpeVABa4t5PJmf+ohQYHUUnEuyAf9UDlZ4I3S71oNGQ27fTBUzG8tM2iKGP/NNMkJzWgB4Wtf9Mc3r83lbYhHBNQxl3qqBenXf0k+tOeelg0+HynFk1gnF9o5u6nasyUxBrcI76d0z+dPN9VyeD1kA03oKoId7nG5JgL1PLjeRYSy6LQhOku4vtKSFDzwx2nIwWnTZet+XULbgivS2eZOJ5ypfgXSvfjEonKO0Dz4pmDjEZhI9f++8gT+RYiLL81EddpmNuZQSr9ANFZOPMWRDEmz3pAqK1npOmsATPoKVCe4JRSW1b5cXpTBjrtlJLv7k2p/wNjnqd/mnDihekENQ5/BMMYOsIJlVS3LW6KjnYqUvq+0vBPdTREsiyQoflC0n30iDAK4di+AnKSRMYqMhKEVP0BApVMtXfqYTfmQITMUHQKZLeZKiRXf4vGOEfaCc50B15rWIgmCufZzmAw5kv64cUdF6AZ+O0CMyB6Gm55pmDJg4bno5q1rdGD6yl+g+ohLLcN1m+rPrvSs+MDy/8IfK3Cjc8lEJI7/1TdAGlKHUu5eKO5IKkhsRziH3xnHoFP3fy6Tlr8Z7FOncfKAxEjF/akL7z6MmgDghGbozoqqB1gwzLzKk7ALxi0OwQDhf5VHJOmkeby0Nd4vbQhpydo42hJkSC9WK1GjVMSSbFJlahUqMFnBaLn0NIz+jPLZhdBxKiF8YyFHeENWWENu9KqV6ZVl99JDtUVJz3WAVb/YvrCHuHCIRCUN4kov+0QcXbPTP/agDK/m7h5SUdep2DzYlx//Rvd/cO4HkcPcC66BweLHUK+zUcVkxSllHSn2Lu+ZPRK+1tSGYlOk1GkV1tey/qZQv45awY4zvXgnv5Zx5XTrrTM/7h/Bbh9SWhfWD7TnM9Q8wcF8H86H2eYZxbdg0PFDqGgudDbEnlYTpG8r4q+UL8QyTLCu+Bb/eR3iYi2osi7rmztuZmSySfv4d570pK8potGZ8oZqK7t1pLORUXHzJW3pDIyg07/p/+97pHiyuD6ilEwE2Uf5ZUG0ges1vSBssAIz5E3LoGXF6TnkHhsO2oBbedw0PYFO4rNyyFllBfAx6Xg2yjHZyzEQi1k7XkTCPMDhzEhjP1wG/9L4oSUkVmzuQZ81/7UQyt081/tDOXoNiOvqLrS3flLc2kF2cLbVbfp6gPyK9k7SYt7iZF/XzhzHPrjtU+3gyvGEeATMS1moh9cx9XpXn8Lhj7iGKFX4/pRdAafbUO2Nfxvjg+pU5W60lSublNGb5s6FyUNr7kDU1WVgWls3jA1OKkp46UHFMr0Qr4omslF1VZ0Ns5r2LgR/ehwByZWVhSvqRn4YnK8m7vob3974W2ZjEmhyvnAyZLI/v+OjVGVE3xTgUQosBSQRYpMJ5tqZXDZOhezKjlLtRpppHce0SSbl+MJ19RonFrwascp0sBNONXGdqtaUY/Y7bHjacCE7O9+o64/dnKrvccOUqJyxtPQnPZHrSiV28amwm8OkE53HBaocWj1tTS8ebk6+W1ap3EIqc6sSs5msnVcBtXqZGcpxH6ywCKUmArG+aAzipEN+4pZV3g0Cb0k8hUCMAgLihgyphP2FaOu8J3E+Px6dCghmuD8wZwIJtWpCbri1FDdPnXPvsJti7Kt4RcFBGvsWHvtjzwO3JprRLBYRoQOZmZDmWjrdiuKgdfHKXBThRUhfm4dXOwc5ZUFBAMWm2CguHCID7KjKoak0jKRSJzfxs1jaug3vwm+XFX47a3btTaDmkGmmZlKUT1mg6DrrwmlaT3Busyo//p9+gH1NLHx1Z9+QFyM7a9VyoVuL6UK/HU1NbE3qgXKIpuXB9byXL5JMaVbjieNz3WiPkDsHwl96EBxWF7k3rym0S30T3InEsMnSx1lwK9uHv/ldhf49CAHo6SfwECR+NdUKUSsKn6rtdvwfUDWjpFlVcNy0jnuLBZaKdusAdjpVj8Pa7+uqa/J6Z9IjJpE6IGwoeZRM7Zm6q8kRMjBtuOYiL4hiPazabAk2SQWmR1XhBOyWt6vpbSmZmZXsrk2hkBsrxDIYgpNCa1IlUuiclfvstxmAu7i7GI/tYpCjrhHgGxxbnGAllgOHXIPKT+v4dZkvnyy+1BYaori3jMLPBC9og5KgQSdX/KOoOhWfv/9grWFCtE9dd+yvQuLuwZpaGuPydO1bsf4e7Pvuu0OpTYvx3cKOBWfZkATZR2mxInabwfRHJst1z8yu6rSummDwWvumO0AcZGA6yUK3OrQ2Z+EJnhsxDJc6yN1LCg+/vbAC0aNowbciNK28GyeqveeOoubzE/7717q7+0FX0ZJvCSmjk4kafPpZn4lHWd7PWrFzbOJyUUjeNDypP9uyE9ZquIaRtmf/Xsza3pqwJ3dy85mFp6iqzwFS5IXZxYlz1nBBuMcuD0TsWAUhwWwniSWtqxYUPlUn1N5fzj0XHb9ybUL+UbpM1bF8N8xgdZAX1dOLxgEvsW5dP9gLqOmtwYcO2jhNqcIJCYKVk4gwi4Q04ZQhgwpxBkfg42OfUDsCKkFPdhLLanqreqZqe6tBr0lVubJYLL4547YxJ5Ua4hcZBXM8YtPug1h1mixFTgXV5MfavEPh0IWZoHr8F+G9Y+GsTeA7mHqyuoztALI17Db2DasT4P3SpEsCoYrOmcF0GIXF3duy4XIW3QuT4s1WXMHoRky5nSs3bD2yOwhk0UnVriMzt2vRfQ6EVWJTtMIdzdXMf1M/nwPPLTz+ckL1F8nNg5fehdxcecRGNraY87tXjc1vmNus9vmUOq8bt+4XOjOpQQBOHYu5/6I0blFwmh+fQ7hwtsT/I0hLMaiDHVqHZIBzVy/p1uLK5ZLPQiwP8q5ji9UHRZLju9wjsabZ/RbLRmDZYWjAyNMi97YcdiKYn4MsdGOVqA1onxrhqPKoHVwuLxiS0ZYa3BUfRaUdzkL5BnpBTKn0AbfQkjbYkMI/guMcPQBdf1MndAs0mjMImHdTL1aHxjlgH1Rji4g68/KisIN/Ox0zwpC2nF0/FudeZi7IQhDmdWbpo/AvZ3yjTqHWCujbBT6LNrBZpN11mv4tqyow19OpBH6MpG0ArlKW8h9/dv9D2jNqb0iEaxkmo56N0XBPjJ7hJ2ieBfNWAcpFWWl9FCaH+77hVqX0i3TIFfJKspFem11lqh6ic4WohNXV2WBs/cVWjEH/auKo1h1zR7hWMsvL0wf7K7GxqTdmsKMAWuuem2LT5/08MYXyUk/w2Kfn5bQkPNZpS+Og61/NV+NygthXTY6gtKossa5ehvlapKzfAKNY/rXiPQrrRbSeBn/Ta0u8rnW9KFRL83IBNv4YZiO6p5hGeaph4ZFOo3YMCDdCf1vJK2zqneTTveR3ijPEhtl+o90OrA+ytTPL1RXyKKxFsaZjB18byFroMtmDaKGYzgjLCtqqs8plG3+xFhRYR5lZ7OJwGcXU4ALghwy3yXbF38p5mO2fvEl+Ce32oBzkTo+s7rVoq9fk+W/qdVEwo78+1rzv1fXqhg/NOplXTwgJNflxXx6VTU4fNDYGFVKkLi1VxkFQ9fLHKtg8S8gVZt5uXpKWLB46NkpN8PwqWaQGk49ByZRru20O4L2TzpIUtbs8WT4MW2iO94N01Jp2nSRrKg/s1jRi4xmd0QFoEzm6fEUWPV2Ce4EN+RzizBLHujPAt9EUXRRv/n36vNgGd8xGb8LE7P/hmnuR0YHK3Og3HxfiW9wdrjYumG7uYbmjXYifip+5ytZbqgzSdXAURZqNPSp1cIBwkhhMMGLf8ZrfqeTLOVcOJmMOK5LcsfnQLVUmi49SxpYlVGs6EH+y2r5rQjKZF/amwIHnEi7YWfK4CZkTp50UPdn2Yngbvr3g0WD36f//eKVhqw+XA1+Tr87WDB4Jz1RnRqqK0lN0AGN48UqueW1BF2dOAmVH5bPMOcylD8MhpIdgH3Q2BhZipfkaD2zbkht1uUaUDtYNAiGFir+wWMkavOKfTuGZ/tL7DkGgz2npH/P8I4D+8Bo2g8McmYNpQbsvy/XiTnoF0quIv6YbTnRl93O0k0uZNPl4vikL2Bxz/dJaCD5gIddHOz9VdBhMmZ0lnlGWA7bKKvck95lMAk6vuoZtHVqcOZOAwdt3WZFMFlWxDaUlWM0dWqwnYBAXzgaXlUeVTXDWACujxhGPF1JJ6CMTD1L/+eP/TMx2DfuLUtMSbyS6K5/0t9XqvYnpR397sP/IjVkE8xMoFOVBgJYPRjfXFBvtH1qXEPYTZd9hJXklZFFOEmO4faOg/vAxQXGwrGwqrKoqj30BfDPXejgpSrXJ1VbLlfZP6iamj/NI8dQjNOoxOu4WGV7LQYql1uSHdFqdtM7jlNn2K8dwPg0Ch28qwU1/salVBO4ADmGWNvEmFv4iGR4nwRCeuED3Jfz/4eLHwzv5r7EFUjw8qvWr8qQ3huY9c5mHb/owxxRPr0wGhzsX3VtrfRfG7y5nobr1oj8DBjSAlr8aviRNeEgpFnPj7+EvXcmlHcntnITcIHI+c81b9SAtOCxiMy3Bs3BoxGZNwYvv+wkM2qu1AAlaWJPwjhIYywcfaJUffrrsExmSrEsV3Oa3o6/8zsP5DHWY1f1L2wetc2h5JDNnp/+2SmL0E8MwvCtslgiwxdHafiuIp4vKE42c+i2TBHL4WJXJ4E9sVOzU7DYVZtXTWY+rj+4cTW9AC0zNqqFqKKmYrfNodLmuX2jsyqxq9vs6V67WKC/rw8g5lpsLVb0dJ9Cp6GAe/ozB4/uehVeIIb2aQpEhduhPZqirGKgg4a1DVfmiSS5DQzrUZXs0483Xjyw6WLz2yr9QV42geDmHVSpwXhwyyLnspTqgF4SVr/diZF1rmns5PLDpR4KU89gMbSlJMdYXo9wAIb8kUz87EaKNtTDL1E4poSeMLt+cAtSsp3iVD/uOLNrdVMHyr0bHZPJ0JUEu9Mb0fWOuxduIwhrXNnqM9IY6lKyY11ep3AAirpDFRxkNnIuS2idQB3/sMhplHYrlpA65ebMkjSTllIiXRGWejRPv8AwvYPDfeJjptIICg2WRZZBvnR4vCupGkkNzmmcdsUq9MYAAgyFa0uz+B3+gvT20iyVqU2p6cx2aTrbVCPh9+ZlROxiuzuvbyVewCsYTLz8ApF4AydnMnCKG8D53D6Prrkzy2KtF4h8mSyi/i8TlESQ6asZYo8ik24zcQpTOLIGXC216aoXScM0RKBpMka6oHOlXMikFHH5D7PeAGvCNaWZgna/P729LFPZdKjD5fwMUA6Hs3k43UNjIpnqTD7Jq/zmYQrqd9rqiM20u/P6FuJ1nILBxMmvE4nn8XImA684b5x4IJKp6WeOxjHWEX7H4x8RnDbt/h2Uhmsm5CNB2F6WpTSvTbuh3kjDeIT/UbN86d3iBQPhqtJMQWueP6O1NENhapdr2h1OTXu7Yrgkb5pEm06jzW4QSTewchr9mtzwL5nqdKMWGMNz1mhM3Ta7qYuXz8nu1iDkbTL1HQLpMV7OZML4xyTCj5o2OUImHgr6yb4Wrh4NXN4qy76DfxmN/9HdKofL4Kcz1x94G7xAtK0/9FBpmlGPzw6ZCa3SDq2D/qFt64DRVYhTwk+YXRPACDe1qzSdrmz6DmtXmlSlWcL2Aj+/oySL2jt536yfbK1dsluzq9T0PaBR6LvLiRK23UksWYKtNMy9jZRUcDPnE+P64jZu52C087oEa6gfUdO7kWwk7+5B1Pitoak1X7xAOdUtURjmXr7bsitj+p863rbP+kp3habd6dC0t8ubZwhb83381pJMalfa9U0XnYGXXdd8Ssagw8D1k02j8qr9tLX2+lQNcITnj2qNXTa7oWuVxmHtUei7ciKSI043KD5LQZwgkc4jqam0NLFHVHToh2H6Ohp4975cJ+URGaYrj9PDoGWP7fSMsF8/tiQ1MfV/0Bio/PkAsCNM7SSNiScu0+RauHbsv0S2WtmKM4SgyyF8QtVxVzwZ96A1LlZghDcF+ilnoYkfWPDswsQJcnVGBwRkhDd4V93uiLCIM+1kZJMYSio9Ta7Gsimbk/2mw+Oto+p9w1pjp92u71qlASk3EJV6Ut1cywpMCpGdV1VdAg96yPWTTdGY5PgSr6wek0KMEnbC7JJA2BmKO+t9RMBAny8aqSpZLcGpZZbK7YauPg2QfJBeAXUKmDniotXNq2gqxscPgr/21+k/eFCVo/meRjBewGM00Wr4CVFrWDamIA7kpdH8X0yxD/2k+isvZKyGyAlVHHu0ua25Daiumtbh74rrYBVortOg19sjVtOaHpPvbplaf+iOsU2ma7JYdU1tUqOqXJDR4PVkNJQL8b3kP7KIpMw/yOQ/DCSi8Q+g8QFRi1ykoir16+MvBDc+PD0rMk3Fx8/FxDYmJHTRno0tn318PhhvfkFGMKZVSKC6Cpo8OBA3AvHnmrPHaFK2zUbyg09hNbW9ZBo4/hs3RcttZjWkQm8loYhW0lCz5htPViVCwPKkaFgkA49YbtqS1Ub8DQRM/0asMG4xlRN5JaapfQFlpVcgvFkfNmuarSQSKukWNLWB1axM1nLB+3hWshLdjC5JgV1KQBBthME29Ud5omqEQNlA0eQoSR15+yubCXiguGpcR7ghroosxwjsRp3BHjE6pFfq5PaxbXOmdmDeWGZpESurtFplVUuWRVnBFVc4HaJgkItqpPxHTEtL+4/CSPBFX/gf4H9f6qqOnSI4MihJio91ddDlzdUwwwI7Ie5BCIxUTfiQ0ljqxQcSmUofia1nsTnqXMYG055SuNgicvY2/KACunvTAdp7VRlqWQkno8LBm4bL1/MIR2I4kcCV/H5V8mJOpvOoljaZZrGDzPdjDYBPYQQNpssuIufhdbdNiSSaQ62qXz963O+p4Lu+1k9jTadWhk0ncvH6b0xJSl0JB26npkEQUl396e4sipCt56YdQcnYkUBnri2ihUxXk3dvQNTUSs3ANLa3CLZd8z29VDuBYKdS/QSiAqCu4uXRteT6WSLipNXvB+IL1gD+VcJ9JzL5SdpwxGvyJprVYdr3Hwe4UhP61u+H1D/+tsmf/Tg9fe/Jth+Btlhv2umoaWjExeK2H0/9UGiGjk+zueBjy6Rp1Zrc41iik3sP4H9nWZAK3dF/tXsWztuJ+T/0Ytj16VX7nZBtN/KC7xzfUvAV1tq1GWMBRa3LP2LkKfLAGh1fjv4bgbkuwsmX+5JzPgQZt/y2dsUmewzI+6dGfpoMps2Wb37QVkqfb8Ll5ILdfjUQFGpG+0NcoinZHSITmrNQ58qi2zgSloMUm4EOunni7JmydIWh1hBnqj3SojfLijjpLFTqY2P9t1nR2GY+EnA3pRhoWuVdCQ///QHGuJqUC/zg+49S0N9TgTgeShqqMcSHmvWWqJBHhnwsnKU+8x907yJsXlwXE7hnkTU9u8n0TKWyLTO8k5u2qxehp3eBT899y+pVqjriKSAyzMHAcRbl+ipqgDbcPag1dRk312NQ484e0hg7HTZj15DW1Uu8YXCiGz2Kfbq4zTpJj3FqJgunekzyXye8isXEqx8fPuqd9ZKjoWawYnw85i48/q213ssNwCAYNLUNL0g5pSzRWJG+QW+7YFRURZ+fDjUVuVg8e2qZwEAcZexgob3xRQxKvLICgwmhjW0bo6PRmIo4FZkRF0DlsbbXYlzxfrYgtYxvz2aJRB4Gx4Y14Li2XDooDZh9PbLRvylZ6LZrDcv7c/wuu8c/ZEXz2rITkn4JlF1oRsFUHJ+7cXaPBi5rlWffIRDhICIW3K0yuFwcl52zWmPqsttJ42sAdBHeAYm2warTVPZn5PsGMnhQb9E15E297RK1XkJ5cIwsVoEloVeOCOpsZcsLVEMzw+kjXN729OGZIZW8oI0NhsJVpVnpHf4CfjtktaY2SFbWphx585vNxtIDjV+dYbtAIZQZ8PlxJlgdQZemI1fWQzzfCvaEINoYBIeuF/Aiqjln+vGmiZycvw2qyJf2rvAVySxh+28Jjbkv7c5I1d+xFILV3t8BABq2xXd0u8qkLcnitxf4hR2lWSQgKSJthwU2Mz7C6vkj2jZjWzDTtHHjHxEyi878H8BFOkpMYsQajrLTHFiXLWGzlFy8f4msIZKcm5yA7LXY1v/6XWzKB8nJC2Ex394+YrHVohKTc8mNkUCG9au4LLZb0mUuXsdWrEaQbtuxQOERMTx5XBVGtmJDZP3ViFiskJzb6uBHLbkqaYuigNzsPGLJ7hqk/3aZUpgmUv9Apn77Nb/ypDOZRjIl3sbreOD/4eoetI5bpymBswVXUxKw21UR6thNZAY301xHswhXpri5tWWWWALvn+RE3JRqmTquL53ByTLVU8F/Yco+ZDmntFuWpIvGcGnwBN6CZpkmbo+OLhCZ6yhmfmNSM7e0emUrjG2CJwvmNRHa2CMCunV1/rYhA37dYz0WlEG00jci4jHJRMIO7b12uPCCYGHhF9O3sDwUYYJcU6+IlR4CbnOREvHO27Lyda/BCwjhhcGCgi+3fI7LxiYZfiYF+9SxF0Dn4Ec/tHWvDWHCfd8/2nhY/bw2MQ0ni9kVWX05Ig62iVpX2TSbdzBObeAwrua87R3T23hBkbUbMMGbeJw6R5Lyui6TEq6s4GZUOlnTEOUGHr5Hg2u7F8nk5KsHKtKBKEM9+/ofDC3h3steYAkXBTF2GT0/iw4xvDq+f2dbVOPrLCePjpd9TyRdw8noXEb2rcblbdP7x3dADPRMhs8uC2LAVz9AZhY+tp3/eMuPEFD4r8vYtEbkbeoL1hqmJSwph3r8O1oDeeOY+XBIJ4S82YVzkIk9H2sOfDw4O93MfR+Pnods3bCOMbEOyOL59JUv/jz9YHLntrF1jPF121RoEmk/T62e+Vi9pjehW5VqiASv/Ja1JPse9+imK/KQLaf332e5fhcd33ZTtmzrWXDjKsUO2ZJei/ohBVP7GCY/9u4nW/7KhMgUehuCcup3xsyb55YbgHjFaztXjVkUha9YKHWdr91ZfKf1dJ0N2ai0urDj7J1xBjWKtdnO0zflC161F3zye1MwdY3Q96ODsbRrP9fCXnKdHcF+F1XI+8Wtc462a8+jnSxuu/zaHbvrHfACJQn07EjogVy/1gBa3ucbSGlKEpmkc9GkIcElpPj4hKHYVCoFO53EQpqa9XBwmEtf+esPp8/O75z5ATJz5rwKTDU5X1Ml66Ps8VadpqHgr3MaN7tvltJdI6YRt7pvlf7tSANM6Y8tP82rjXim0qN3XG05QyxGE54zXgWrpasL6mqJgkZiSS2Rt5JYsaagoeAptugpSFhAHEOSHQej4pJnJknrBkkr99fBFTZWWNP+2vZeJFh3mFRffSm/EHJx7pJGmlOc1hheeWlxbnEFak3BGkCJMk+mxQu6djVgsjRGJo2sYhht1bduPxoZWFL56TcGBiOvnSvKF4mkZYNSsDfKuTaYhMsUJ073p/+jB1md0k2QD8+3EeTr1SmHEPsceR2aFCJRk9KRB0A4oQOSQa4eKEzk4C0LidCzlFWBJlheWmxc6zc4Unb8OUKVuhyCNoS04lRKNvGhHcuVeEo1Yp7G1EYCf111W0u6K2gNBPF8uS6dQ5Vz9KbyK7/+3an3XvDdXx00xuBAk18iruyWAYH0cimEx+K3Xy6F8th8kCRV1LVLXYgxC8n2d24C1VNodl78bqnCIGawTBk5hTI7/mRc7F0oZHAoevYqmEgXuCFYHElLlxD4Om4aBu5KlrFMsWK45dfDCDwyesWRYLXGCn0rJm4jDqeI+tpms7qjwf8yFAEm387j8+159Eyhh8KzZYbHhLNlf51DljRCoY0uSDxsy2MU4m2pWL7DigBGaWFL4Ylx2R+y1ieYARh8AIPuh8KHwJkMsZct9jLub4FAJ5rh8JYJaOrmF15mljBaUkAX2Pl8vC8/A/yVIfYxrkp9dLHIT+cHxhdHZRVABlpgPfEBCC8Lh7U0gocCcYFQEDQaBRU8SizxC4UVISgM+psGyEyFTseUk8kMOfxcYSg2lTirneDDDI3X7LjUcoLiwuB+ph9uKawvNvG0aZH7Kr6UAe/noC9eRa2FK4vz+XoC2CWdLmhfRZSsJq7cWQBQUs1X9wW/evSaL++7n3mGGmwtPDnuTxlw/IW8ctatRvw/SjYhzUGhKtIIamCGYRexG477tQjIthBAWhog4H99KoE92+W/J3mpRTRqE5nioq4gzSxkjIHM3RGwoUgYUAp8kNHc+yBXluYkk+1paXYy2UmImrWRliU5wVPByvu5oxCAP9hMbYYSdweyA/Fs+AIHHOcOjh0E373COgNTA3SBI5P8IrGupFTGlyglQmqx1pNt3bPrfTJJxj56iaasFMltAZmN6CZBvbEpqyMV4ItzuIW+ha+nv17sW8SBiiNhCzoFB8hKbrWeLjntpa9lwp9vWctJdLqcfHitePtUySkvVHkCjJc+Uj1f+egpPlE1XzJfqKS4KvrxfARJ6z/T9Ew+68UDdr4dGxqc/OG93emYcoDexbj+2sxQj/Mb5929/fZnd/jQYBJ/Xjy+c1IOL/et5msDiqSNXcshA9Dk5OOzLFkv+ktS+/cbsPMvnSTnkZHHp0IDIV+VeDY5ZXYzi1WagMd3DLekZOQP8nVFipSJXhDvg/nehvocvsU9i4BWtKqojpagd04OWBW7zWvq3aQqkxQnl7F6H5tjSDanTj8VFtvv7/c9cj1zPR2Bawr6F/dkEBprWypnQU3BrkX3ulcWc58uG+129/4T2Q2cumb//H5fXe0Bn2++WbdVY2FWB9IN+uJ0TrVFM9+6WLII+hdXTz+TPd8TV4Q+qmN08Y6NAhHNnesN9cPipcOsTpITnaMzfWQwSPd1NXBNYa8WbNCrLKyba25pJmudKqGlT7L9+Tnf5DOlXsDj6vnKz/BkAcfd/rPZWg1XbDa6wG1nm/NP+P8zgmKjLrhG6F9/93Tqa6+nsr6VWgHkV9+5Aq7vv+orfy4LVqxXvTLYfHCpykfV5Zy67rjy1/IA9mjh0LWq3C+rdnxalX2zatd8hSMLKMbbqFcfueZcBtYoNAMbixHNKFQzAjE0dQzdF4i7UkAtJvxOwLtlX+LlS2A2nBo7uHoMXPOvZnRqUo5fOzZePiY6NQdU2NXmhCsg1j8wNorhhpHWsjS45/+PWuyWhvFXAIDqtpTZl6iLYpficEmgaIm6zA4oVmzfEyzmaR8WXx+GwS6tp0LjoLB4GAQDg2FyvgA11xtS2rpMWaAlD9rw/IRA4jTUGqIQW/jQhogThqTpZdYYiQU0dOQ25IIsfehHjeIStiQhz/83LBuGr/4enfYJCPaXj41rx0S/xoNG/xJNmc1iGb8ALdEUgSQcbmksoLpJAejyddtpHhdnkkfsgcEKQeLxChj8L3j8kdE8zJ0QpDE32wr+CiX2voJlwGAyNFoOXV63F6sEkd8GRfmz1svwlT5sx8Vd7NT/Uo195/2/GOfYE5K+cEW/IADfau+0FzTdzzArH6dbQZnRN+vMnwVjxqRZc9Is6HwEn4DciE3qi3ABhcwlhM9F3DUnrQx3ApnUBZz06mPVBe1WCN01aFbD53TVRwBqSZDqM3n/faFcxGFmOMae+yZSk9rj4n9JVJ4CXya/+SciLnqXX2yrNkW+MApVaTIJpGwVWF8IK0EgSmBwFwLh+v7sQ2QB1cc48KspiPNPt+2uaQM3/bWMpsfdLxlc2bjaU+SsxuOnJmjNh/fePRqdmJtki/ykKO6FNyHJE2pZliUDDSudDU6gynZlLI1cwYxJqtodedaPAsUju0Gnv3psNYTr6lr9afCz/xNqSbfUVTPTSVF57EDtxySjUMkYP1Dn2kFNXirnbFFUzL9wi46rZ6Zy3zyH/w+1qJcBmztyablgnR9oPDZVY9YGNMX2BVTTQl3MWUYxmNtk9q/JNY9gytGS6JiXiDGg5tu5cOXh4hUx/8EcSr4dhJ+PJdZDYWNpfM5mF81zZnoFtB6sksLx1u9fVIuLSfwnEeIOz2NL5WRzEpFhh5NpqEomowQOB/+TNsDhJQxmJYpGtsMZJHOSnMzMYz9zQxP+wcfE6V98H4XXkStTrLi+pVhMWJ9DDMFAoRhI5ophcb4fKiaIxXEB+cf3Kt4Dqs8uJl58GgLt2eTIMRodvl3OcMbh0aOmPNYdxW26c9UWbRk/o0ipygjws1K7JTOm+tNqldKU1kW6Q1AxWQTlHdL5AfBKFhOvunN6X+f3+t++453ygmORsgKywMDFIzSSnBXl61nGUn1Wpl1CbgqxdEdJliGhbzyo6KZviExEtaGwHlRMl5p3sqL7t+0wZLikJxLYKY12kVBUZmAZSscKBLploVCOwFBABodTEtrMQyco9ERIxvxZl2+2T6nsQ7VySrvlydoVGC4Vnsh71Za+VTNaBl9kqaOYBQ3JTZzSzpVtMLYZliKY1y7TuNkXc8gXJr1MMLuAxAd4L1/7N1z0YHgX50mJJ1p+paahJvE8QLuKV4T4au2xjBz1VdQM2cE1ju774nGRebzmO4DZl9lXktUXhpgO5Xj57rsuy91zGSMPtA1pLtWr1E5fOSzKTTntEVjg+INmWzSHN783xzpH6vfRmLJZs3rLz1b8n3n4rtV5wT3DXwI9X8f7VWxePegCmwcCyKTAg+5dUxOswzYkNxlYp/NL0katXot13AZpodwEc0o2be8Q4wOApY69Vs6209uT5NNyn8IDmAbraUBkrxlMtC5bDulcdYswof9BVrdomwoGO8phka4+gL5cl0crk4I1qDyvg9UAcQcV1TbSubf8W08VmB5p0pnBIBrYPmNzIQELocWsEUcB646AXOymEc/FEO/oTWXFwxH1xNAq4oUzI09ggzbTpK3X1cnmzEu4Y7p5kRIT9g5RFuC736A9G3yIMz/O+OahzTUbQAyyFino6RGswzYkz6jw90MdgghwSkxDg70w2m5CQSuPNhU2qRR8Z3D4EKf/B55oM4e9ZwlBkNY1w3+PDm6Q47oW4zjAKdtMc/tZnY2o2CvvVyDYCrORevYy8I6h7yIFWdCQH1wni/tWWVPLfZW3sjwU+3HKFACGZkpD4u19jeFgBxXujUjphlvcjaci746rBLejpOcq+uEE4VEaWTgWZ2igONE67M697v/Op3lKl9gkXik40Zg0s5dBVYqZfbQN0JDgVpu9g0ejbQaDkRwFLJNl4HoYcosBa+SZSE7LJqiPfoEVNGEtH+JsDMFwJKud+6GfxG2QFspNtE3JZrZpubQqXz7yoxCAYe/flvUIOX4jrRfSK7/dL8bCEedj03nvHSHVeyNBHLYpGvI3RqlB1AzB9/FoMPTzWI83mCSyv798vj4CHa/XpclmvoAjenEb0ssbAqPs1zoFhlRQp6I5yGD0RoMLV8bznbpZQ74CaYKoqGt2hQcF0ER2CCAaXc0vpxdNBARBl9JoIpgxZJni3GQm0ETiirRmw0wi6P1WWbwYhfBVoAlenu8nZrHXbmuszUSbBl6151X7CGVevzUBUj+80gl9I5v2//tB+j+Tql0Jz8akUNGzqTapFFwzOJNlHF4koRQYhOCpVCg2qRT0xQvBOu2lQ5oJmuY76yiFdB8xgW3IppaBVTwERHMTB9o+h5GAXAxoojaq1Y/FGURsCBzXFlZ+GaevNw+XlqkQj8OlGBT5ChadCWnGK5xvuDVx90RqYyZ4+oWGCGIuHkRmFabJNtXAigvlf59gdtxs927s3MM4PMMa4DEtOTdSNXBhnPcaDGKiEbvySblHkcEM+R3zvXKkSSWAKWQfeETliDr8KmlUEOdUVNgw7WAD4rRk43doDRU4RFmfQ7tDQwbI1DBL29hNQO79K9jsTEiziFqSNAazHGAIm6DJbNJK0ar76n9LAzFct0jAP/gQ56jzvBPyRulxXRjTO48zrtXOqXRlBNu843SmnFuhyOBM2IRMqtlngqDl0pW9nLCWg7cX8qbyJapebJIG5a6QICAasfFkaaY1A7A37Q3NkF15w3HAuHIkOKol6x1BLZdm/M7csERLt+Qeut70JkF2tiFp9vF4vMrrZO8xe6NYv2JiEugAM2VUQgTh67+OhpxyC4Q8RAYhAjhTMgDfe61WExXVTW3w1OBmQNaWkNqqswS2GErC1Zi0sfxQ19+KnMM+bFg3uvpWHlg4eC5eGVg9qpXY07t/AoCEM+vDbl2wqwQXdeuMLWJQiME4bZEUGfCaoQDvMXlS4zxWP3APDoIzIWb4ZV50Q5DEGPRAtzrQJs5kMs2vg9RtRUCOoUcVjvfPp196zwbX8A/ySoHfCmLRcYT52CDW71EqwAHE7kmUIwzJLKmsKDLDZ65MUOBoUNJzHaxM7DAvediNKLe2BpfcBvysFjyKmRAvb/EoA0vIpJqDDEpjNCZHYYxWUvTVbms3Yt3x35X6HEVzcE7yXuLklYHV51rnlBd1dAz5sn1EijiS4ScvDbhbFRkTiTQbiYJE0PtWZhSLMZQZVpGxyD/6MVMzaBNnMpu0H6za84tDFF/AbOdOP33f34V7+FT0hGw5JuzBst/pzXZLRa2Ink21SaXgmkFtspzbUblX+or0vwMIr5OoXxmUolgqIshCJt2kme3oROhJlBcmZFIZlAHhnxxEk+e19rzFhyzuif25Pkj6vTkQnsb+3Kv8I4p7zoNxCV1RmZiHuCZ0EPcFBk88D3kxEtwyYjtBlSXg86a/F/5nlHhw+qSstP4wz61+55lYBdRbs0QnV0F6sTkvOirvWPq9A23fCtOpgGLLxS2WzHKzV3P8q9vUECm0VAXcO8JYpAr8fk3zixnM4AjyVM6mWhRjih+5RFUpBkwkzdm9iI6HHemSn3LqUmUBtKArFYTmwRR/K0tmaT9t9mqOSdDfuTGFfmiAllO9y0anzitRrgiABUGn1FDPCAmkG07gxkemOK+d6jXXgfPBbxqQ9Fe5+/b0H/+D3du2C/+88hcns7Ya8y2uouGeXyeKnrHes/jn6X/i/zyUrO/+JdJa8U7+BWmE8e3dC4SIy1OTV9CvIwPr93+5dPBex8J1s7dPX/8OUPXvMeR/+NEg5qMuNPDvn2UDALw/gDfhI61/8lZGJgXB39oSORGo3T4XedCDY8ipfvxKKSE0KwEcbMcTZtcPUb3owGDF8qG77vLenAIF6ZUgJwziq5SICO28vfpBLyXY6CLA+9AYrWXAZ9EukIwSsfHWN/da7PAhoAL1prYPpuRctm/GKPuJ/pK2lHWPMOSKayUEEx/vf5cXygbhbdAjG1gpxwgwoX5Ijg4jFWr1Xe4oVSCqYhvnj7wr57L3qcUFQOsO4QZY+4nf06ApDkjhRxDZNn7JSAmVMK5+zElR+6YmNvgyoMUHD974wtY9y11uqGbsV6vfTUfmJBp+S+jvx4xV7/iWARKbGjEOgByd1kL7RbffAajsCk7oES0F0h4MbPOdi10Elt69TK4158aI1EugoNY7KjMVuPMxM2Z2x1E8BBsqoGyTH93XkXx4sDWiLIC/pC3lTT/CEinVU0u1Ca57ZKA1/BRlhShf9wHQk7/TlGhvFIGL9qfgEsVihWAvtkvtQg/KxwIIOW90af4HIGLnxSiYogDYjk5KqAEVGNyW2P7//xsxTPTblcx9M+7f6z0E4ALENqW2gsAjGMFf92hS+Hh2Hf0TkkPhL5EpkDK+fE/1+BKICStt6GK2TCqED57fuyccPwX+fERUL+bcwTHEVfa+gRDxotOePgX+fLJTL2ahweTvlikI4SnWWaZjEVG9mMBgn5e+qtF+c7UhxQ4DnbW+0a0+CpSqp7iCsXaVQv25vqE47R2hsLnOk9mA39+4NfbTUodlbAaQs0Dy2AGVqx+n0o7zZnMIslXduPLDj1CBTSsWKAmrewopSK9E3ljhCh/9I5j7kHS0VeqQJvkSIj1FoqVer1jyaWNJKjU7GBjpxwILHd+bkjz8kGu2jb3uXCi13tXxM4Ve7VygN3Bnb/GJDFU5Rw3ortOPZvjE9KnzaLbx6yMcT17mpu85oPM0bXhxhw3PpYquEfszAWOLAX4W0Zm3aYTi97nwDFyAh+PP6QXnXO4OvDn8KaE1SA0em40XGTdeGD92K/fTjQ+3kl3IaOoWsdb6/3Xy3Fzx4i0WvjO5LLBL58X9ha4mVT/orUkUFAsxh/bEiFIPHsHu3dyEojbdztONQO93pV6UN5vd+zcs71NIW2jBAvTo6b/PFN1CNr8uSnT2yOrDlrADm7vvNXBts9AIXI7AtqZDH6Wf38yBWupppqM17ppl7WrbzpPZgN83U9rWOseuv0ASKdWTS/nPrSnsqnolK6cEraaBvj2mCL0AvajeUe9fAlkBpJOuclFSXHGtXDO2EkD3b431rrclHQudfB+fxcg6LCU/AGKY348WaDC1ubVnf20KiLiy9QkNkTfE7Luh2VkngRrn8zBJlf6wS9wcMKsBCoFzLkK47tylUDKP1r1XpeQaJDsFF25L3eUSbXbzt8KcWUPzoYtepA1AcAW9e/yBzbXNqodfrWELDBULHzuCzRZ2KGmM8n6/Ros0SuDTGtUkaUh+tmIHLSBHgJXaloAc6rgJitfGlJsa/Zb1pwEjY9iViALyiRxRH2cZs6iPCCeO9VyJx5u2gehWIqvwKfC9U4/1YrOietBHxre40lYui+ekvvAt9FxMQ+ecMeDJ1vkLb+pk6rD4JgoPxHP33HUR/TmFWzvHMt/g47IQay6cvJs3rOz7lfnuo+/9UOfLbOaeMnSbfTz5em6toUcQYwpNEqHFlg8P8rZS0SnQocMmVnQpMAAPxHP7dt1Sfx4Z9gt250H+EW7qpKD9nY/MGuGbu3IfKj3dbl572febFpfZ8mWZtKjpbQ4NtRUCWnFOwcgC3gwn9qz8pz0H9Ap7p99TSVzw7kC10hcIaMD0n9ssymTxvzvEXwJw9/+wFoAnP3Y+4+Xo/3MH/2giJBgAQIB/cEUg3XdP/BfAh8+Y+vtNiPebO/d279r1iM9JLim6aOc9JvRutsOTPzRWZIQYOT3KRWTlOvZSeeodzabY2G4znrcRgDMx4Izwmg8XrJvd5S0JeQsBvHXvqVssEiuu9rtqvN7b0qSjy7Vs/hy6wq14PvLuXfNww4VE80u5D4CUF13upUeF59hTs0G4+JaepbXlnDnWrXPnMiqrnOL3gfDXaFcAotlhnJHK2pXLKJmOyU+LANbzzqOowGfYOvokD2LjHBTSUH2KiCZWXxIxu26PGnw/97ddpRwC2NW1K/U+PpCXwm81enhGL86bU0/TpfNU7+iT5YtGVnj8rweuQL+km5spdjwoiYB5augTszdBz9XiEFn3E5UuO/xt5vhm5P7Zksa7LOQqOYeQsfN64KkE1LfBEWf5yhOKVcaRvKt2ZnwwR+ioIfzDCft3f6zijnzmOYjqgEftucHvQg2vMyb+Di+9qK4PMC7TPchPKZxPVdpK0XS4J5f7hnY3yfAcueIfDfsFWX/Qr5itNkX3VLkdU3XjhLTjvB7UVvbYnvQzyQlIi1WF8nKkxsFx+ZkOZDPe7JQpJMADmY4HjSwcjHSSLXFi0Jr9jCrwDD9kz7BfIT1OZuX9D0//kjJqdxZ3qyWoPOqzspd9W8j9n/MAk4O83rtl8JvCnWfcK5T+9YCOAWwIvL/aItU7JKRKcGUrpbliepqKgaoG7hqexqVosU9qmIA49gpFM+EF99OiOVL/EvluH92/Rd83NoagKiqbvL8cRQYvHf3ll9Yk50zQfVoWL6dtiAHLe53eQvnXrnIsWv6O+99HorksOd+fHilVr970Pl/zIO9sLTyhV/fnmeKHOIEdu06yWBzdmyWevcUxuyYPHQRMM5aLpCoQMqmiit93OwRU2VS8YqmsBCN+MZhSHzKirBeS0MdVDlK7k8F6iJ/FuXfz5TaIgvQRn5Gkf89AM7oOpl16+5/wywTd5xgoV949aqcWIfodu+Ih4O2ve582euCfFn3/eZKfD82B+0lBWppSZp1/mmlYR/C9kl0s4D6hdfwcVtiJ5rFlyDNpno5IbErCbgM9eNejK3dfgWcTVoH+va/eUIlAAd0V2qgiCcDkIjqf3+yLbuj3+6FxUb3GLGBPECaD4dJ/ocZdmQ9YU2gEh+drt/LuHc2lFV0DEHUvbu40Z8mcw2nR3nEbY0wW21HSdtfT1x2rfwpuKk3bD7Y9GmxejCCrqAKvKhT/ReLsh22jojamwjrEPd/YAEMBPQFjAPmAm4A8QAfAJcBAwCSgwYAWjHv4N+KOW+u6tXy8VSo56F6SOtbAL/B6HI3NrDO4MS6D2zQsaK1WW+enRV28Ut5MkXXK4l74DI7zx8sXNfD1+hZl8F054MIT8ejoDFdCg4czCZyPL+EWMi9cflDionwispcSu3h/weF7z2RvrVcudXtPbLdFfz3NMJOwh8N95k8c/a6TEeXz5MP8G88/zAloBth34G7hXvV7/KQnwPvJJJFHhGEWbw6wYhpOgAD0zMChBhoAG8O4OxK2EHdkqPl9R05pB+8o4DbrjiJBBt1RQpF3ByPFhXOqI/1Q518uTqE7v5bZfisBtXXRSTOdVdOjunfUTgu5Wg230VaPi/hddpWvtHjSDXXVym2ty5Q9DghYvljchnV/JTMiELLuzprdrepoq53OYqXa7TtqqW4mX7vEcrtS4iScNXNj9vca+5Tk0jJy1JRSM69rYgZVRKVet/XVfRSldkkSJCZNYK1qGvks++t20f4pWviZFD1HCcNh+WrsHmumjXbR8p6ai9PiXtx41Q0GLFrdDsuBxgNvJv5ePhLjfEDeeSS5dbwfIMKpEMRJIJEkUpGaNKQlHWn0c2RCQfxcE+ZMJNHEEk8iyZAU/5TipW5JJ5NscqG5wnQkbPLC4lxqqWNrurlWvQFGnBl4M6OMM8k0s8yNWKVV1tlkm903FZlDxEWF+1Pn6HLNLXfCdfPKW3Q++eaXfwEFFlRwbCMTKgZfRInfRhcTOM5KiJzYkuKWpYgrtbTSyyizrI6K71jHO9HJTsHP6PVhejfv1lz2WEJXyi6n3PIkll9BhRV1NaLHbgQUOf6lk1CppCfESTKFSqMzmCw2h8vjC4QisUQqk3fgilKl1nTkpk5vMJrMFquzS8c8cav0LOW5p5e3j69f4533Pvjok8+++Oqb73742frltz/++uc/g8lic7g8vkAoEkukso5coVSpuxqtTm8AjD2TuW8J8odgBMVwgszS2jRF29konz0AjNVmdzhdbu4enl7ePqnEQTCCYjhBUjTDcnntcRCkhhWJJVKZXJGmXWqLo1JrtLq0WAbjAnzNFqvN7nC60hF5vD4/OQUlFTUNLR09AyMTMwsrGztHrpy5ccluQ5AcuTy88uTz8StQmLuAIh8xcY8WerJHHyVq1RlV0w0anaUTtGjVpv05vg46denWozcvfSBwuD+IwRfNahiFxmCbEGECMUBeWaXRu1PdViaL/ZH2yGAmEBpCM4l0w4UyRwOCuJ4bNA3IsYXFbu4eYj7EYNb+EaqrkHk38xHIy89gTNbH+tkAG2QsNoQgh9kIprCxnVH2nn2wM19EBOMAx+Wyf+w/47AZNsvm2HwWZNfRZW511rORzWxlm3ruZDd7nxuI7g1My6i6ftfgZ1ENxR2X2+MFIRhB8yl1HydIima0xf8cJBSJJVKZXKFUqTVand5gNJktVpvd4XS5PV6fP4T7YuMI/gQ7WsuJSTVq1qpdRxNdw/TqN2hIkjgnBCMonkAkkSlUGp3BZLE5XB5fIBSJJVKZXKFUqTVand5gNJktVpsdBIZAYXAEEoXGYHF4ApFEplBpdAaTxeZweXyBUCSWSGVyhVKl1mh1eoOxhGguI1udXVzd3D08vbx9fP2EIrFEKpMrlCq1to6unr6BLLEuu/iEw8GBvEGOHaH9WCu7dsy12JOzFvkw9ZFdm0T294evGU6v0VDajKH/HiEtTQR+dUT93S1zS15Z83yRJESMp2O8Fv2GS6xC6DKUiRcQk5tIWTf2ZgL4mzZ5fYxVqQ/KNSOSqkCUpoRgdUGnz3HhFPgiUkkKle7EUmtQ8BXQE6Ykz2LSiJcM7LTCm3hPiFcgFqUCk1Ite4SPfNNlv9t3vJHT49hpm6XU6KkSWq9FugP9esRuOYvQMWFBHFKdCUslAjQTVVYkfhAXDZ3mn0E8ihqLAKlGA4q1hogfQcgLSQb3AD2Hky3rJsl3WXYKlIHieI7E7n/TcdZohhpejUUVEmhXNRtGHWwYkZ0+IqXhE0vFZcq5NRvkhhWxg0bHKSgodZ7B3DDScDL2REppnxTinRzdGR6htlcqpcRLcdFWaZpVTz3BfHWiJjvxJCHZV7lSH8q+r5miHQ91m/NhqKs+ZlduLJmKvXSpBAxGkfh2y5465w/abhhLr490QDnfV8xj6ITTMHfVy55O3UNyasWPaeAGtgVBmEyZu542pKyu8iMZnZj8t/at51ng6ZFLOcGPgsKytRdNnY3nvX3Jy9Bo0TBFCDLHyKJNKZxZBJQaq5xIHuYyalhrLrTct9GAdOWpfNYEKLzcRod/6sVYBjc0bqLHqVQ5YvgqJQBntpzJYopcDWh6icvEvaSq0ck8CJGlAQM67XLi7gkmM6DvJoviUDiVFwP63Fnpw9DkRFZRKsqtsZl52MDkCW5lZvoP4jNT/x6dqQTfYJ50qdppWcvs1kMF3G8UOVVNyEjfFpEt1nlifZVFOWmCoXj9+BhCZ3MuM/xXlp5xxupxGYtln0jJUtnGSo2b5+65l39MwJ+6aJrm2WYNCZ5eUMtlJtiTcf6g7bqjTsawSeL+iQVpyZUKs4ezocbLb78lc3u8+0jbKB63fkgQHbYetVbGRwVGe0wCCQty/JIjFEmwtltM8J4AeoudRvoRpjOEU5GtXKUOYALylA08VtSpaRElYaWkaQ1osm1KTRECLWVRpy8AL4FBOTQIYjM1AC4eOzAjuaGT2Qu+fGnAMAzYtO2Ip8oOQ9rNZOCUMyjSqCoRiI8JvjWilhYa+bys8c0TlqsPTnYq2mVMc20zHTVBskomUzZNDMYInOQTGBf6ZQ0Ca3rbdAgIjaKcfTCys8OtEF+3o9LKLq0DCS4dtrjd2BHbDxBbazda0kKmOafGGTG8imK1kXUzzjK5WZ7LFpGtmhTZPIg7XoeumVcKS/4fFFCJur6EdPdThmKdTGpB6Vq2s1aYDmFMygsLAgPAGHJCAI0qLSCAeJwKYDurHJJ2/OmudFbreuCo47QwNUKgo0Fo0ojA7Bgn5rCdYzJDWqER5hi+igFmnSC4pOfHCeiMunaUzcfiBtn0n5H4Xh3NG50SYWB5Xbw8Niqg3uKzwKccxZ3mLnaeF6ZIEAAMYYbKxBjKhp8vKo3iTZXQppfNgwFAtCnSbrv87+s65D35aYMPAoTwtexUpRAG5TCHmA9dVQmkZCVwur8s8XZh40FJLB2Y0OmXgTdMELjRtwDuSzUbFRy0vS+ZMDUEMDbqdWewGEtZziHSf54oNTtDplg5G7KmHHR0bNcJE9aU73IF49dXRwMsYT/TWW4Tp2nheAOhoW/Mm2RW7a6nGNNjaZbIY4+iPiPLwcRqOQzNiIRoL6gbPbDM9E422fqgwCVVFxIpKiCijRgVEukGTrGzCm+cAoT7XnJimRDGYv+yjQzaEPhDqMAAZdKi3oZJnf+tXs/Y4VN30m6Xrl4ZlZuW6tr+DSwa1/PcTStL26cr+lUGhs7JC0l1SBE8ISc+AIhsrLE+ate/7/Pkv8T4Kh/c65NqqeUTieFbfTxZxIUVHHl7L0fsYX8J4CAwo9Zn2vRTVHWDWeqvu3og4/bIIYCK396ZpNW6mw8nRoHTD3hGcimvPvnezxIpEt365sTnDqNKQaJ73a93OQs7PZ5Oe6b1BO7nDtfzGD90XafUBJlKlVVY1AIAL8Q1lfr/zWlPHanYAQI1ZqmiQazefPTqky9dosAhYfxk4PVnHNRzrylEvJAyTqGormaGKkAdZCYtQJUirVVev5NSI+lEPacO6LnXtEYwmOuRZDWQtfrTClq28KmhNUikUbRdxfDNdgUqbmbRMi1O2Y3TxnhcFrImzlaZKXrha+nM9szCcR4otjdDmNQjePXjJ65Lz5+bJHpfRkGxaJCJBejPhmhyc96SRRfTKPyjyE4VEhumXZFKnh4pNZJieHFWMGDDsMy0mdRpVphgQ43ZFCgCaYYdLkWVERbXdg6v8/xvbFn5rYgrv4p3iG3x45c/P3GR5b9B7tlPGIGnAxcpAL11W/bt/ze/+GjPPr+nz/735Cmp/UmT9uQvj598uEePg427YgPqMKj9elS33nX1oDadXa/ArlY96uGlXSx16rhQg0b1W+ax6paqrbAZra82JImr23ZJ+fhfiLS5WZKId16+c/wn98nunngH5hM+ZehwA5/xD/7FWLb79Eq9S1YmfwVWLedzIT9qLP0cQlvvFfJFievhiwv1Pg90MdkFD4ifojdQbxU0MdhCYtPY98CjucD3kIV8HhE260Xtyjr3bfu2fwHgk37hyrWz0u8HUGscK+FnZBqf32N09fuK/mnBxi4yyX76ADm/K/EHcU363tDEEiD0l4yswD/3zwGE/pLnYIhKv8MfAvek7ykqiBb9nej8xqqG6DVB2OPRCUZJPb3OF31vJJAAASwBHgAAAA==", ns = "data:font/woff2;base64,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", Fe = "CYD Montserrat", De = "CYD MDI", Gt = "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD";
let qe = null;
function rs() {
  if (qe) return qe;
  const o = [
    new FontFace(Fe, `url(${es})`, { weight: "500", unicodeRange: Gt }),
    new FontFace(Fe, `url(${ts})`, { weight: "500" }),
    new FontFace(Fe, `url(${is})`, { weight: "700", unicodeRange: Gt }),
    new FontFace(Fe, `url(${ss})`, { weight: "700" }),
    new FontFace(De, `url(${ns})`)
  ];
  return qe = Promise.all(o.map(async (e) => {
    const t = await e.load();
    document.fonts.add(t);
  })).then(() => {
  }), qe;
}
function os(o, e = !1) {
  return `${e ? 700 : 500} ${o}px "${Fe}"`;
}
function as(o) {
  return `${o}px "${De}"`;
}
let ve = null, Ht = null;
function ls(o) {
  return ve ? Promise.resolve(ve) : (Ht ??= fetch(o).then((e) => e.json()).then((e) => (ve = new Map(Object.entries(e).map(([t, i]) => [t, parseInt(i, 16)])), ve)), Ht);
}
function je(o) {
  if (!o || !o.startsWith("mdi:") || !ve) return null;
  const e = ve.get(o.slice(4));
  return e === void 0 ? null : String.fromCodePoint(e);
}
function cs(o, e = 60) {
  if (!ve) return [];
  const t = o.toLowerCase().replace(/^mdi:/, "").trim(), i = [], s = [];
  for (const r of ve.keys())
    if (!t || r.startsWith(t) ? i.push(r) : r.includes(t) && s.push(r), i.length >= e) break;
  return [...i, ...s].slice(0, e).map((r) => `mdi:${r}`);
}
const pt = ["on", "open", "opening", "unlocked", "home", "playing"];
function ds() {
  return {
    schema: 1,
    id: "",
    name: "CYD",
    device_name: "cyd-display",
    board: "esp32-2432s028r",
    board_variant: null,
    orientation: "landscape",
    grid: { cols: 4, rows: 3, gap: 8, padding: 8 },
    theme: "mastershort_dark",
    theme_overrides: {},
    settings: {
      brightness_day: 100,
      brightness_night: 25,
      night_mode: { source: "off", threshold: 2.6, invert: !1, from: "22:00", to: "06:30", entity: null },
      screensaver: { enabled: !1, after_s: 60, action: "dim" },
      return_home_after_s: 30,
      rgb_led: { enabled: !1, show_status: !1 },
      wifi: { use_secrets: !0, ap_fallback: !0 },
      language: "de",
      api_key: null,
      device_actions: !0
    },
    global: {
      header: { enabled: !0, height: 28, widgets: [{ type: "page_title", align: "left" }, { type: "clock", align: "right" }] },
      footer: { enabled: !1, height: 36, widgets: [] }
    },
    pages: [],
    navigation: {
      style: "tabbar",
      tabbar_position: "bottom",
      show_labels: !0,
      show_icons: !0,
      swipe: !0,
      wrap_around: !1,
      home_page: null,
      transition: "slide"
    },
    popups: [],
    meta: {}
  };
}
function pi(o, e) {
  if (e && typeof e == "object" && !Array.isArray(e) && o && typeof o == "object" && !Array.isArray(o)) {
    const t = structuredClone(e);
    for (const [i, s] of Object.entries(o))
      t[i] = i in e ? pi(s, e[i]) : structuredClone(s);
    return t;
  }
  return o === void 0 ? structuredClone(e) : structuredClone(o);
}
function Tt(o) {
  const e = pi(o, ds());
  for (const t of e.pages) {
    t.parent ??= null, t.in_navigation ??= !t.parent, t.icon ??= "mdi:checkbox-blank-outline", t.layout ??= "grid", t.widgets ??= [];
    for (const i of t.widgets) i.props ??= {};
  }
  return !e.navigation.home_page && e.pages.length && (e.navigation.home_page = e.pages[0].id), e;
}
function gi(o, e, t) {
  let i = o.native, s = o.orientations;
  const r = o.display.variants?.find((a) => a.id === e);
  r?.native && (i = r.native), r?.orientations && (s = { ...s, ...r.orientations });
  const n = s[t]?.rotation ?? 0, l = n === 90 || n === 270;
  return { width: l ? i.height : i.width, height: l ? i.width : i.height, rotation: n };
}
const hs = { ä: "ae", ö: "oe", ü: "ue", ß: "ss" };
function Se(o, e = 31) {
  return o.toLowerCase().replace(/[äöüß]/g, (i) => hs[i]).normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, e).replace(/-+$/g, "") || "cyd";
}
function us(o, e) {
  const t = Se(o, 24).replace(/-/g, "_") || "page";
  let i = t, s = 2;
  for (; e.includes(i); ) i = `${t}_${s++}`;
  return i;
}
function Qt(o) {
  let e = o.widgets.length + 1;
  const t = new Set(o.widgets.map((i) => i.id));
  for (; t.has(`w${e}`); ) e++;
  return `w${e}`;
}
function ps(o) {
  const e = {};
  for (const t of o.props) t.default !== null && t.default !== void 0 && (e[t.key] = t.default);
  return e;
}
function at(o, e, t, i, s, r) {
  for (let n = 0; n + s <= t; n++)
    for (let l = 0; l + i <= e; l++)
      if (!gt(o.widgets, { x: l, y: n, w: i, h: s }, r)) return { x: l, y: n };
  return null;
}
function gt(o, e, t) {
  return o.some((i) => i.id !== t && e.x < i.x + i.w && i.x < e.x + e.w && e.y < i.y + i.h && i.y < e.y + e.h);
}
function mi(o, e) {
  const t = new Map(o.pages.map((r) => [r.id, r])), i = /* @__PURE__ */ new Set();
  let s = e;
  for (; s.parent && t.has(s.parent) && !i.has(s.id); )
    i.add(s.id), s = t.get(s.parent);
  return s;
}
function gs(o, e) {
  const t = JSON.stringify(o).replace(/\{\{(\w+)\}\}/g, (s, r) => e[r] ?? ""), i = JSON.parse(t);
  for (const s of i.pages ?? [])
    for (const r of s.widgets)
      r.entity === "" && (r.entity = null), r.action && r.action.target === "" && (r.action.target = null);
  return i;
}
const ms = 40, fs = 32, qt = 48, Pt = 6, re = 6, vs = 5, Pe = 40, me = 12, Ke = 44, lt = 6, P = 6, Kt = 968, bs = 1219, As = 875, Ne = { xs: 12, s: 14, m: 16, l: 20, xl: 28, xxl: 40 }, Ie = { s: 20, m: 28, l: 40 }, K = (o, e) => Math.floor(o / e);
function X(o) {
  return -K(-o * bs, 1e3);
}
function Jt(o, e, t, i, s) {
  const r = o + K(s * (e + i), t), n = o + K((s + 1) * (e + i), t) - i;
  return [r, n];
}
function ue(o, e, t, i, s, r = 1) {
  const [n] = Jt(o, e, t, i, s), [, l] = Jt(o, e, t, i, s + r - 1);
  return [n, l - n];
}
function nt(o) {
  return (o.pages ?? []).filter((e) => !e.parent && (e.in_navigation ?? !0));
}
function ys(o, e, t, i) {
  const s = o.global?.header ?? { enabled: !1 }, r = o.navigation ?? {};
  let n = null, l = null, a = 0, c = 0, h = i;
  if (s.enabled && (e.show_header ?? !0)) {
    const b = Math.trunc(s.height ?? 28);
    n = { x: 0, y: 0, w: t, h: b }, a = b;
  }
  if (r.style === "tabbar" && nt(o).length > 0) {
    const b = r.tabbar_position ?? "bottom", k = r.show_labels ?? !0 ? ms : fs;
    b === "top" ? (l = { x: 0, y: a, w: t, h: k }, a += k) : b === "left" ? (l = { x: 0, y: a, w: qt, h: i - a }, c = qt) : (l = { x: 0, y: i - k, w: t, h: k }, h = i - k);
  }
  return { header: n, tabbar: l, content: { x: c, y: a, w: t - c, h: h - a } };
}
function ws(o, e) {
  const i = nt(o).length, s = (o.navigation?.tabbar_position ?? "bottom") === "left", r = [];
  for (let n = 0; n < i; n++)
    if (s) {
      const [l, a] = ue(e.y, e.h, i, 0, n);
      r.push({ x: e.x, y: l, w: e.w, h: a });
    } else {
      const [l, a] = ue(e.x, e.w, i, 0, n);
      r.push({ x: l, y: e.y, w: a, h: e.h });
    }
  return r;
}
function mt(o, e) {
  const t = { ...o.grid ?? {}, ...e.grid_override ?? {} };
  return {
    cols: Math.trunc(t.cols ?? 4),
    rows: Math.trunc(t.rows ?? 3),
    gap: Math.trunc(t.gap ?? 8),
    padding: Math.trunc(t.padding ?? 8)
  };
}
function _e(o, e, t, i = !1) {
  if (i)
    return { x: o.x + t.x, y: o.y + t.y, w: t.w, h: t.h };
  const s = e.padding, r = o.w - 2 * s, n = o.h - 2 * s, [l, a] = ue(o.x + s, r, e.cols, e.gap, t.x, t.w), [c, h] = ue(o.y + s, n, e.rows, e.gap, t.y, t.h);
  return { x: l, y: c, w: a, h };
}
function ze(o, e, t, i) {
  const s = ys(o, e, t, i), r = mt(o, e), n = e.layout === "free", l = {};
  for (const c of e.widgets ?? []) l[c.id] = _e(s.content, r, c, n);
  const a = s.tabbar ? ws(o, s.tabbar) : [];
  return { ...s, grid: r, widgets: l, tabs: a };
}
function ct(o, e, t, i) {
  const s = e.padding, r = o.w - 2 * s, n = o.h - 2 * s, l = Math.min(e.cols - 1, Math.max(0, K((t - o.x - s) * e.cols, Math.max(r, 1)))), a = Math.min(e.rows - 1, Math.max(0, K((i - o.y - s) * e.rows, Math.max(n, 1))));
  return { x: l, y: a };
}
function L(o, e, t, i, s, r, n, l = null, a = "left") {
  return { kind: o, role: e, align: t, x: i, y: s, width: l, size: r, color: n, text_align: a };
}
function _(o, e, t, i, s = {}, r = {}) {
  const n = String(i.icon_size ?? "auto");
  let l = i, a = r;
  if (n === "none") l = { ...i, icon: "" };
  else if (n === "s" || n === "m" || n === "l") {
    const h = { ...Ie, ...r };
    a = { ...h, s: h[n], m: h[n] };
  }
  let c = Is(o, e, t, l, s, a);
  if (i.hide_label && (c = Ms(o, c)), i.text_weight === "bold")
    for (const h of c) h.kind === "text" && h.color === "text" && (h.bold = !0);
  return c;
}
const xs = ["label", "label0", "label1", "label2"], Es = ["toggle_tile", "binary_indicator", "sensor_value", "person_presence", "notification_area"];
function Ms(o, e) {
  if ((o === "scene_button" || o === "page_button") && !e.some((r) => r.kind === "icon")) return e;
  const t = e.filter((r) => !xs.includes(r.role)), i = t.filter((r) => r.kind === "text"), s = t.filter((r) => r.kind === "icon");
  if (!i.length && s.length === 1 && t.length === 1) Object.assign(s[0], { align: "CENTER", x: 0, y: 0 });
  else if ((Es.includes(o) || o === "multi_value") && s.every((r) => r.align === "LEFT_MID"))
    for (const r of i)
      (r.align === "TOP_LEFT" || r.align === "BOTTOM_LEFT") && (o === "multi_value" || i.length === 1) && Object.assign(r, { align: "LEFT_MID", y: 0 });
  return t;
}
function Is(o, e, t, i, s = {}, r = {}) {
  const n = { ...Ne, ...s }, l = { ...Ie, ...r }, a = Math.max(e - 2 * re, 1), c = Math.max(t - 2 * re, 1), h = [], b = !!i.icon, k = !!i.icon_circle, A = (I) => k ? I + 2 * vs : I, x = (I, C, w, z, p, m) => {
    const g = L("icon", I, C, w, z, p, m);
    return k && (g.circle = A(p)), g;
  };
  if (o === "toggle_tile" || o === "binary_indicator" || o === "sensor_value" || o === "person_presence" || o === "notification_area") {
    const I = n[String(i.value_size ?? "auto")], C = o === "sensor_value" ? I ?? n.l : n[String(i.text_size ?? "s")] ?? n.s;
    (o === "person_presence" || o === "notification_area") && (o = "binary_indicator");
    const w = n.xs;
    if (c >= A(l.m) + X(C) + X(w))
      if (o === "sensor_value") {
        const p = I ?? (c >= A(l.s) + X(n.xl) ? n.xl : n.l);
        h.push(L("text", "label", "TOP_LEFT", 0, 0, w, "text_muted", a - (b ? A(l.s) + P : 0))), b && h.push(x("icon", "TOP_RIGHT", 0, 0, l.s, "accent")), h.push(L("text", "value", "BOTTOM_LEFT", 0, 0, p, "text", a));
      } else
        b && h.push(x("icon", "TOP_LEFT", 0, 0, l.m, "state_icon")), o === "toggle_tile" && (i.show_state ?? !0) || o === "binary_indicator" ? (h.push(L("text", "label", "BOTTOM_LEFT", 0, -X(w), C, "text", a)), h.push(L("text", "state", "BOTTOM_LEFT", 0, 0, w, "text_muted", a))) : h.push(L("text", "label", "BOTTOM_LEFT", 0, 0, C, "text", a));
    else {
      const p = c >= A(l.m) && a >= 3 * A(l.m) ? l.m : l.s, m = b ? A(p) + P : 0, g = Math.max(a - m, 1);
      b && h.push(x("icon", "LEFT_MID", 0, 0, p, o === "sensor_value" ? "accent" : "state_icon")), o === "sensor_value" ? (h.push(L("text", "value", "TOP_LEFT", m, 0, C, "text", g)), h.push(L("text", "label", "BOTTOM_LEFT", m, 0, w, "text_muted", g))) : (o === "binary_indicator" || (i.show_state ?? !0)) && c >= X(C) + X(w) ? (h.push(L("text", "label", "TOP_LEFT", m, 0, C, "text", g)), h.push(L("text", "state", "BOTTOM_LEFT", m, 0, w, "text_muted", g))) : h.push(L("text", "label", "LEFT_MID", m, 0, C, "text", g));
    }
    return h;
  }
  if (o === "clock") {
    let I = n[String(i.size ?? "xl")] ?? n.xl;
    if (i.show_date ?? !0) {
      let C = I <= n.l ? n.xs : n.s;
      X(I) + X(C) > c && (I = n.l, C = n.xs);
      const w = X(I), z = X(C);
      h.push(L("text", "time", "CENTER", 0, -K(z, 2), I, "text", a, "center")), h.push(L("text", "date", "CENTER", 0, K(w, 2), C, "text_muted", a, "center"));
    } else
      h.push(L("text", "time", "CENTER", 0, 0, I, "text", a, "center"));
    return h;
  }
  if (o === "label") {
    const I = n[String(i.size ?? "m")] ?? n.m, C = String(i.align ?? "center"), w = C === "left" ? "LEFT_MID" : C === "right" ? "RIGHT_MID" : "CENTER";
    return h.push(L("text", "text", w, 0, 0, I, i.muted ? "text_muted" : "text", a, C)), h;
  }
  if (o === "scene_button" || o === "page_button") {
    const I = n[String(i.text_size ?? "s")] ?? n.s, C = X(I);
    if (b && c >= A(l.m) + C + 2)
      h.push(x("icon", "CENTER", 0, -K(C, 2) - 1, l.m, "accent")), h.push(L("text", "label", "CENTER", 0, K(A(l.m), 2) + 1, I, "text", a, "center"));
    else if (b) {
      const w = c >= A(l.m) ? l.m : l.s, z = A(w) + P;
      h.push(x("icon", "LEFT_MID", 0, 0, w, "accent")), h.push(L("text", "label", "LEFT_MID", z, 0, I, "text", Math.max(a - z, 1)));
    } else
      h.push(L("text", "label", "CENTER", 0, 0, I, "text", a, "center"));
    return h;
  }
  const E = (I, C, w, z, p, m, g, f, v) => ({ ...L(I, C, w, z, p, f, v, Math.max(m, 1)), height: Math.max(g, 1) }), F = n[String(i.text_size ?? "s")] ?? n.s, B = X(F), Z = X(n.xs);
  if (o === "media_player") {
    const I = B + Z, C = ["prev", "play", "next"];
    if (c >= I + P + 24) {
      h.push(L("text", "title", "TOP_LEFT", 0, 0, F, "text", a)), h.push(L("text", "artist", "TOP_LEFT", 0, B, n.xs, "text_muted", a));
      const w = c - I - P, z = me + P + 4, p = !!(i.show_volume ?? !0) && w >= 24 + z, m = Math.min(w - (p ? z : 0), Pe), g = p ? -z : 0, f = m >= l.m + 8 ? l.m : l.s;
      C.forEach((v, u) => {
        const [j, T] = ue(0, a, 3, P, u);
        h.push(E("button", v, "BOTTOM_LEFT", j, g, T, m, f, "accent"));
      }), p && h.push(E("slider", "volume", "BOTTOM_MID", 0, -2, a - 2 * me, me, 0, "accent"));
    } else if (c >= B + 2 + 20) {
      h.push(L("text", "title", "TOP_LEFT", 0, 0, F, "text", a));
      const w = Math.min(c - B - 2, Pe), z = w >= l.m + 8 ? l.m : l.s;
      C.forEach((p, m) => {
        const [g, f] = ue(0, a, 3, P, m);
        h.push(E("button", p, "BOTTOM_LEFT", g, 0, f, w, z, "accent"));
      });
    } else {
      const w = Math.max(Math.min(c, 28), 16), z = [3, 2].find((g) => a - g * (w + P) >= K(a, 2)) ?? 1, p = z === 1 ? C.slice(1, 2) : C.slice(3 - z), m = Math.max(a - z * (w + P), 1);
      c >= I ? (h.push(L("text", "title", "TOP_LEFT", 0, 0, F, "text", m)), h.push(L("text", "artist", "BOTTOM_LEFT", 0, 0, n.xs, "text_muted", m))) : h.push(L("text", "title", "LEFT_MID", 0, 0, F, "text", m)), p.forEach((g, f) => h.push(E("button", g, "RIGHT_MID", (f - (p.length - 1)) * (w + P), 0, w, w, l.s, "accent")));
    }
    return h;
  }
  if (o === "cover_control") {
    const I = c >= B + P + 24, C = I ? Math.min(c - B - P, Pe) : c;
    return I && (h.push(L("text", "label", "TOP_LEFT", 0, 0, F, "text", Math.max(a - Ke - P, 1))), h.push(L("text", "state", "TOP_RIGHT", 0, 0, n.xs, "text_muted", Ke, "right"))), ["up", "stop", "down"].forEach((w, z) => {
      const [p, m] = ue(0, a, 3, P, z), g = C >= l.m + 8 ? l.m : l.s;
      h.push(E("button", w, "BOTTOM_LEFT", p, 0, m, C, g, "accent"));
    }), h;
  }
  if (o === "climate" || o === "number_stepper" || o === "select") {
    const I = c >= 2 * Z + X(n.l) + 2 * P, C = I ? 2 * Z : Z, w = Math.max(Math.min(c - C - P, Pe, K(a, 4)), 16), z = Math.max(a - 2 * (w + P), 1), p = [n.xl, n.l].filter((f) => z >= 3 * f && c - C >= X(f)), m = p.length ? p[0] : n.m, g = I ? 0 : K(Z, 2);
    if (I)
      h.push(L("text", "label", "TOP_LEFT", 0, 0, n.xs, "text_muted", a)), h.push(L("text", "state", "BOTTOM_MID", 0, 0, n.xs, "text_muted", a, "center"));
    else {
      const f = K(a, 2);
      h.push(L("text", "label", "TOP_LEFT", 0, 0, n.xs, "text_muted", Math.max(f - P, 1))), h.push(L("text", "state", "TOP_RIGHT", 0, 0, n.xs, "text_muted", Math.max(a - f, 1), "right"));
    }
    return h.push(L("text", "value", "CENTER", 0, g, m, "text", z, "center")), h.push(E("button", "minus", "LEFT_MID", 0, g, w, w, l.s, "accent")), h.push(E("button", "plus", "RIGHT_MID", 0, g, w, w, l.s, "accent")), h;
  }
  if (o === "slider")
    return c >= B + me + 4 ? (h.push(L("text", "label", "TOP_LEFT", 0, 0, F, "text", Math.max(a - Ke - P, 1))), h.push(L("text", "value", "TOP_RIGHT", 0, 0, n.xs, "text_muted", Ke, "right")), h.push(E("slider", "slider", "BOTTOM_MID", 0, -2, a - 2 * me, me, 0, "accent"))) : h.push(E("slider", "slider", "CENTER", 0, 0, a - 2 * me, me, 0, "accent")), h;
  if (o === "gauge") {
    const I = Math.max(Math.min(a, c - (i.hide_label ? 0 : Z)), 24), C = Math.max(K(I, 10), 4), w = I >= 90 ? n.l : I < 60 ? n.s : n.m;
    return h.push(E("arc", "arc", "TOP_MID", 0, 0, I, I, C, "accent")), h.push(L("text", "value", "TOP_MID", 0, K(I, 2) - K(X(w), 2), w, "text", I, "center")), h.push(L("text", "label", "BOTTOM_MID", 0, 0, n.xs, "text_muted", a, "center")), h;
  }
  if (o === "weather") {
    const I = c >= A(l.l) && a >= 3 * A(l.l) ? l.l : l.m, C = A(I) + P, w = c >= X(n.xl) + Z ? n.xl : n.l;
    return h.push(x("icon", "LEFT_MID", 0, 0, I, "accent")), h.push(L("text", "value", "TOP_LEFT", C, 0, w, "text", Math.max(a - C, 1))), h.push(L("text", "state", "BOTTOM_LEFT", C, 0, n.xs, "text_muted", Math.max(a - C, 1))), h;
  }
  if (o === "multi_value") {
    const I = Math.max(1, Math.min(Math.trunc(Number(i._count ?? 1)), 3)), C = c >= X(n.l) + Z ? n.l : n.s;
    for (let w = 0; w < I; w++) {
      const [z, p] = ue(0, a, I, P, w);
      h.push(L("text", `value${w}`, "TOP_LEFT", z, 0, C, "text", p)), h.push(L("text", `label${w}`, "BOTTOM_LEFT", z, 0, n.xs, "text_muted", p));
    }
    return h;
  }
  if (o === "countdown") {
    if (c < B + X(n.l))
      return h.push(L("text", "label", "LEFT_MID", 0, 0, F, "text", Math.max(K(a, 2) - P, 1))), h.push(L("text", "value", "RIGHT_MID", 0, 0, n.l, "text", a - K(a, 2), "right")), h;
    const I = c >= B + X(n.xl) + lt + 4 ? n.xl : n.l, C = c >= B + X(I) + lt + 4;
    return h.push(L("text", "label", "TOP_LEFT", 0, 0, F, "text", a)), h.push(L("text", "value", "BOTTOM_LEFT", 0, C ? -10 : 0, I, "text", a)), C && h.push(E("bar", "bar", "BOTTOM_MID", 0, 0, a, lt, 0, "accent")), h;
  }
  if (o === "qr_code") {
    const I = !!i.label && c >= 48 + Z, C = Math.max(Math.min(a, c - (I ? Z : 0)), 16);
    return h.push(E("qr", "qr", I ? "TOP_MID" : "CENTER", 0, 0, C, C, 0, "text")), I && h.push(L("text", "label", "BOTTOM_MID", 0, 0, n.xs, "text_muted", a, "center")), h;
  }
  if (o === "divider")
    return h.push(E("line", "line", "CENTER", 0, 0, a, 2, 0, "text_muted")), h;
  if (o === "button_grid") {
    const I = Math.max(1, Math.min(Math.trunc(Number(i._count ?? 1)), 6)), C = I <= 3 ? I : K(I + 1, 2), w = K(I + C - 1, C);
    for (let z = 0; z < I; z++) {
      const [p, m] = ue(0, a, C, P, z % C), [g, f] = ue(0, c, w, P, K(z, C)), v = f >= l.s + Z + 4, u = E("button", `btn${z}`, "TOP_LEFT", p, g, m, f, v || f < l.m + 6 ? l.s : l.m, "accent");
      u.label_size = v ? n.xs : 0, h.push(u);
    }
    return h;
  }
  if (o === "page_title") {
    const I = n[String(i.size ?? "m")] ?? n.m;
    if (i._has_back) {
      const C = l.s;
      h.push(L("icon", "back", "LEFT_MID", 0, 0, C, "accent")), h.push(L("text", "title", "LEFT_MID", C + P, 0, I, "text", Math.max(a - C - P, 1)));
    } else
      h.push(L("text", "title", "LEFT_MID", 0, 0, I, "text", a));
    return h;
  }
  return h;
}
function Cs(o, e, t = {}, i = {}) {
  const s = { ...Ne, ...t }, r = { ...Ie, ...i }, n = o.global?.header?.widgets ?? [], l = [];
  for (const a of n) {
    const c = a.align ?? "left", h = c === "left" ? "LEFT_MID" : c === "right" ? "RIGHT_MID" : "CENTER";
    if (a.type === "page_title") {
      const b = (o.pages ?? []).some((A) => !!A.parent);
      let k = 0;
      b && (l.push(L("icon", "back", "LEFT_MID", 0, 0, r.s, "accent")), k = c === "left" ? r.s + P : 0), l.push(L("text", "title", h, k, 0, s.s, "text", null, c));
    } else a.type === "clock" ? l.push(L("text", "time", h, 0, 0, s.s, "text", null, c)) : a.type === "label" && l.push(L("text", "text", h, 0, 0, s.s, "text_muted", null, c));
  }
  return l;
}
function Ts(o, e, t, i = {}, s = {}) {
  const r = { ...Ne, ...i }, n = { ...Ie, ...s }, l = [];
  return o && e && t.h >= n.s + X(r.xs) ? (l.push(L("icon", "icon", "TOP_MID", 0, 2, n.s, "nav")), l.push(L("text", "label", "BOTTOM_MID", 0, -1, r.xs, "nav", t.w - 2, "center"))) : o ? l.push(L("icon", "icon", "CENTER", 0, 0, n.s, "nav")) : l.push(L("text", "label", "CENTER", 0, 0, r.xs, "nav", t.w - 2, "center")), l;
}
function oe(o, e, t, i, s, r) {
  const n = Math.trunc((o.w - e) / 2), l = Math.trunc((o.h - t) / 2), a = {
    TOP_LEFT: [0, 0],
    TOP_MID: [n, 0],
    TOP_RIGHT: [o.w - e, 0],
    LEFT_MID: [0, l],
    CENTER: [n, l],
    RIGHT_MID: [o.w - e, l],
    BOTTOM_LEFT: [0, o.h - t],
    BOTTOM_MID: [n, o.h - t],
    BOTTOM_RIGHT: [o.w - e, o.h - t]
  }, [c, h] = a[i] ?? [0, 0];
  return { x: o.x + c + s, y: o.y + h + r };
}
const ks = 240, Ss = 150, We = 16, xe = 18;
function zs(o, e, t = {}, i = {}) {
  const s = { ...Ne, ...t }, r = { ...Ie, ...i }, n = Math.min(o - 2 * We, ks), l = Math.min(e - 2 * We, Ss), a = { x: K(o - n, 2), y: K(e - l, 2), w: n, h: l }, c = n - 2 * re, h = [
    L("text", "title", "TOP_LEFT", 0, 0, s.m, "text", Math.max(c - r.s - P, 1)),
    L("icon", "close", "TOP_RIGHT", 0, 0, r.s, "text_muted"),
    L("text", "value", "CENTER", 0, -K(xe, 2), s.xl, "text", c, "center"),
    { ...L("slider", "slider", "BOTTOM_MID", 0, -K(xe, 2), 0, "accent", c - 2 * xe), height: xe }
  ];
  return { panel: a, elements: h };
}
const Bs = 260, Os = 140;
function Ds(o, e, t = {}, i = {}) {
  const s = { ...Ne, ...t }, r = { ...Ie, ...i }, n = Math.min(o - 2 * We, Bs), l = Math.min(e - 2 * We, Os), a = { x: K(o - n, 2), y: K(e - l, 2), w: n, h: l }, c = n - 2 * re, h = l - 2 * re, b = r.s + P, k = Math.max(X(s.m), r.s), A = [
    L("icon", "icon", "TOP_LEFT", 0, 0, r.s, "accent"),
    L("text", "title", "TOP_LEFT", b, 0, s.m, "text", Math.max(c - b, 1)),
    { ...L("text", "text", "TOP_LEFT", 0, k + P, s.s, "text_muted", c), wrap: !0, height: Math.max(h - k - P, 1) }
  ];
  return { panel: a, elements: A };
}
const js = 260, Ws = 170, Xt = 56, ft = [["brightness", "mdi:brightness-6"], ["ct", "mdi:thermometer"], ["hue", "mdi:palette"]];
function Ns(o, e, t = {}, i = {}) {
  const s = { ...Ne, ...t }, r = { ...Ie, ...i }, n = Math.min(o - 2 * We, js), l = Math.min(e - 2 * We, Ws), a = { x: K(o - n, 2), y: K(e - l, 2), w: n, h: l }, c = n - 2 * re, h = l - 2 * re, b = Math.max(X(s.m), r.s), k = Math.max(K(h - b - P, ft.length), xe), A = r.s + P, x = Math.max(c - A - Xt - P, 1), E = [
    L("text", "title", "TOP_LEFT", 0, 0, s.m, "text", Math.max(c - r.s - P, 1)),
    L("icon", "close", "TOP_RIGHT", 0, 0, r.s, "text_muted")
  ];
  return ft.forEach(([F], B) => {
    const Z = b + P + B * k;
    E.push(L("icon", `${F}_icon`, "TOP_LEFT", 0, Z + K(k - r.s, 2), r.s, "text_muted")), E.push({ ...L("slider", F, "TOP_LEFT", A, Z + K(k - xe, 2), 0, "accent", x), height: xe }), E.push(L("text", `${F}_value`, "TOP_RIGHT", 0, Z + K(k - X(s.s), 2), s.s, "text", Xt, "right"));
  }), { panel: a, elements: E };
}
const Ys = "Tile style presets. Color values are theme color roles or #rrggbb. Numbers: opacity 0-100, px.", Fs = { card: { name: "Karte", name_en: "Card", bg: "tile", bg_opa: 100, bg_on: "tile_on", bg_opa_on: 100, border: "border", border_on: "accent", border_width: "theme", radius: "theme", text: "text", text_on: "text", sub: "text_muted", sub_on: "text_muted", icon: "off", icon_on: "on", circle: !1, circle_bg: "tile_on", circle_bg_on: "accent", text_size: "s" }, flat: { name: "Flach", name_en: "Flat", bg: "tile", bg_opa: 100, bg_on: "tile_on", bg_opa_on: 100, border: "tile", border_on: "tile_on", border_width: 0, radius: "theme", text: "text", text_on: "text", sub: "text_muted", sub_on: "text_muted", icon: "off", icon_on: "accent", circle: !1, circle_bg: "tile_on", circle_bg_on: "accent", text_size: "s" }, outline: { name: "Umriss", name_en: "Outline", bg: "background", bg_opa: 0, bg_on: "accent", bg_opa_on: 20, border: "border", border_on: "accent", border_width: 2, radius: "theme", text: "text", text_on: "text", sub: "text_muted", sub_on: "text", icon: "off", icon_on: "accent", circle: !1, circle_bg: "tile", circle_bg_on: "accent", text_size: "s" }, glass: { name: "Glas (für Hintergrundbilder)", name_en: "Glass (for background images)", bg: "tile", bg_opa: 55, bg_on: "tile_on", bg_opa_on: 80, border: "border", border_on: "accent", border_width: 1, radius: "theme", text: "text", text_on: "text", sub: "text_muted", sub_on: "text_muted", icon: "off", icon_on: "on", circle: !1, circle_bg: "tile_on", circle_bg_on: "accent", text_size: "s" }, solid: { name: "Kräftig (an = hell)", name_en: "Bold (on = light)", bg: "tile", bg_opa: 100, bg_on: "on_bg", bg_opa_on: 100, border: "tile", border_on: "on_bg", border_width: 0, radius: "theme", text: "text", text_on: "on_text", sub: "text_muted", sub_on: "on_sub", icon: "off", icon_on: "#ffffff", circle: !0, circle_bg: "tile_on", circle_bg_on: "accent", text_size: "s" } }, Us = { on_bg: "#f2f2f2", on_text: "#111111", on_sub: "#5f6b76" }, Ls = {
  _doc: Ys,
  presets: Fs,
  role_defaults: Us
}, fi = Ls, Zs = [
  "bg",
  "bg_on",
  "border",
  "border_on",
  "text",
  "text_on",
  "sub",
  "sub_on",
  "icon",
  "icon_on",
  "circle_bg",
  "circle_bg_on"
], Rs = { track: "circle_bg", fill: "icon_on", knob: "text" }, Gs = ["bg_opa", "bg_opa_on", "border_width", "radius"], Vt = ["xs", "s", "m", "l", "xl"], Hs = ["auto", "none", "s", "m", "l"], Qs = ["normal", "bold"];
function _t(o, e, t) {
  const i = String(o);
  return i.startsWith("#") ? i.toLowerCase() : String(e[i] || t[i] || e.text || "#ffffff").toLowerCase();
}
function vt(o, e, t = fi) {
  const i = e ?? {}, s = String(o.default_tile_style ?? "card"), r = String(i.preset || s), l = { ...t.presets[r] ?? t.presets.card };
  for (const [x, E] of Object.entries(i)) E != null && E !== "" && (l[x] = E);
  const a = o.colors ?? {}, c = { preset: r in t.presets ? r : "card" };
  for (const x of Zs) c[x] = _t(l[x], a, t.role_defaults ?? {});
  for (const [x, E] of Object.entries(Rs))
    c[x] = l[x] ? _t(l[x], a, t.role_defaults ?? {}) : c[E];
  for (const x of Gs) {
    let E = l[x];
    E === "theme" && (E = o[x] ?? 0), c[x] = Math.max(0, Math.trunc(Number(E)));
  }
  c.bg_opa = Math.min(c.bg_opa, 100), c.bg_opa_on = Math.min(c.bg_opa_on, 100), c.circle = !!(l.circle ?? !1), c.show_label = !!(l.show_label ?? !0);
  const h = String(l.text_size ?? "s");
  c.text_size = Vt.includes(h) ? h : "s";
  const b = String(l.value_size ?? "auto");
  c.value_size = Vt.includes(b) ? b : "auto";
  const k = String(l.icon_size ?? "auto");
  c.icon_size = Hs.includes(k) ? k : "auto";
  const A = String(l.text_weight ?? "normal");
  return c.text_weight = Qs.includes(A) ? A : "normal", c;
}
function qs(o, e) {
  return {
    ...o,
    icon_circle: e.circle,
    text_size: e.text_size,
    value_size: e.value_size,
    icon_size: e.icon_size,
    text_weight: e.text_weight,
    hide_label: !e.show_label
  };
}
const vi = ["eq", "ne", "on", "off", "gt", "lt"];
function bi(o, e) {
  const t = o.entity || e.entity;
  return !(!vi.includes(o.op) || !t || !/^[a-z_]+\.[a-z0-9_]+$/.test(t) || (o.op === "gt" || o.op === "lt") && Number.isNaN(Number.parseFloat(String(o.value ?? ""))));
}
function Ai(o, e, t) {
  const i = t(String(o.entity || e.entity))?.state ?? "";
  switch (o.op) {
    case "on":
      return pt.includes(i);
    case "off":
      return !pt.includes(i);
    case "gt":
      return i !== "" && (Number.parseFloat(i) || 0) > Number.parseFloat(String(o.value));
    case "lt":
      return i !== "" && (Number.parseFloat(i) || 0) < Number.parseFloat(String(o.value));
    case "eq":
      return i === String(o.value ?? "");
    case "ne":
      return i !== String(o.value ?? "");
  }
}
function Ps(o, e) {
  return (o.visible_if ?? []).filter((i) => bi(i, o)).every((i) => Ai(i, o, e));
}
function Ks(o, e) {
  return (o.style_rules ?? []).filter((i) => bi(i, o)).find((i) => Ai(i, o, e)) ?? null;
}
const Js = { "clear-night": { icon: "mdi:weather-night", de: "Klare Nacht", en: "Clear night" }, cloudy: { icon: "mdi:weather-cloudy", de: "Bewölkt", en: "Cloudy" }, exceptional: { icon: "mdi:alert-circle-outline", de: "Unwetter", en: "Exceptional" }, fog: { icon: "mdi:weather-fog", de: "Nebel", en: "Fog" }, hail: { icon: "mdi:weather-hail", de: "Hagel", en: "Hail" }, lightning: { icon: "mdi:weather-lightning", de: "Gewitter", en: "Lightning" }, "lightning-rainy": { icon: "mdi:weather-lightning-rainy", de: "Gewitter, Regen", en: "Lightning, rainy" }, partlycloudy: { icon: "mdi:weather-partly-cloudy", de: "Teilweise bewölkt", en: "Partly cloudy" }, pouring: { icon: "mdi:weather-pouring", de: "Starkregen", en: "Pouring" }, rainy: { icon: "mdi:weather-rainy", de: "Regen", en: "Rainy" }, snowy: { icon: "mdi:weather-snowy", de: "Schnee", en: "Snowy" }, "snowy-rainy": { icon: "mdi:weather-snowy-rainy", de: "Schneeregen", en: "Snowy, rainy" }, sunny: { icon: "mdi:weather-sunny", de: "Sonnig", en: "Sunny" }, windy: { icon: "mdi:weather-windy", de: "Windig", en: "Windy" }, "windy-variant": { icon: "mdi:weather-windy-variant", de: "Windig, bewölkt", en: "Windy, cloudy" } }, Xs = { icon: "mdi:weather-cloudy-alert", de: "–", en: "–" }, Vs = { off: { de: "Aus", en: "Off" }, heat: { de: "Heizen", en: "Heat" }, cool: { de: "Kühlen", en: "Cool" }, heat_cool: { de: "Heizen/Kühlen", en: "Heat/Cool" }, auto: { de: "Automatik", en: "Auto" }, dry: { de: "Entfeuchten", en: "Dry" }, fan_only: { de: "Lüften", en: "Fan" } }, _s = { playing: { de: "Wiedergabe", en: "Playing" }, paused: { de: "Pausiert", en: "Paused" }, idle: { de: "Bereit", en: "Idle" }, on: { de: "An", en: "On" }, off: { de: "Aus", en: "Off" }, standby: { de: "Standby", en: "Standby" }, buffering: { de: "Lädt …", en: "Buffering …" }, unavailable: { de: "Nicht verfügbar", en: "Unavailable" } }, $s = {
  weather: Js,
  weather_unknown: Xs,
  climate: Vs,
  media: _s
};
function en(o) {
  return o && o.__esModule && Object.prototype.hasOwnProperty.call(o, "default") ? o.default : o;
}
var dt = { exports: {} }, $t;
function tn() {
  return $t || ($t = 1, (function(o, e) {
    var t = (function() {
      var i = function(w, z) {
        var p = 236, m = 17, g = w, f = r[z], v = null, u = 0, j = null, T = [], N = {}, Q = function(S, O) {
          u = g * 4 + 17, v = (function(M) {
            for (var D = new Array(M), W = 0; W < M; W += 1) {
              D[W] = new Array(M);
              for (var U = 0; U < M; U += 1)
                D[W][U] = null;
            }
            return D;
          })(u), q(0, 0), q(u - 7, 0), q(0, u - 7), ie(), $(), pe(S, O), g >= 7 && he(S), j == null && (j = ki(g, f, T)), ge(j, O);
        }, q = function(S, O) {
          for (var M = -1; M <= 7; M += 1)
            if (!(S + M <= -1 || u <= S + M))
              for (var D = -1; D <= 7; D += 1)
                O + D <= -1 || u <= O + D || (0 <= M && M <= 6 && (D == 0 || D == 6) || 0 <= D && D <= 6 && (M == 0 || M == 6) || 2 <= M && M <= 4 && 2 <= D && D <= 4 ? v[S + M][O + D] = !0 : v[S + M][O + D] = !1);
        }, J = function() {
          for (var S = 0, O = 0, M = 0; M < 8; M += 1) {
            Q(!0, M);
            var D = l.getLostPoint(N);
            (M == 0 || S > D) && (S = D, O = M);
          }
          return O;
        }, $ = function() {
          for (var S = 8; S < u - 8; S += 1)
            v[S][6] == null && (v[S][6] = S % 2 == 0);
          for (var O = 8; O < u - 8; O += 1)
            v[6][O] == null && (v[6][O] = O % 2 == 0);
        }, ie = function() {
          for (var S = l.getPatternPosition(g), O = 0; O < S.length; O += 1)
            for (var M = 0; M < S.length; M += 1) {
              var D = S[O], W = S[M];
              if (v[D][W] == null)
                for (var U = -2; U <= 2; U += 1)
                  for (var G = -2; G <= 2; G += 1)
                    U == -2 || U == 2 || G == -2 || G == 2 || U == 0 && G == 0 ? v[D + U][W + G] = !0 : v[D + U][W + G] = !1;
            }
        }, he = function(S) {
          for (var O = l.getBCHTypeNumber(g), M = 0; M < 18; M += 1) {
            var D = !S && (O >> M & 1) == 1;
            v[Math.floor(M / 3)][M % 3 + u - 8 - 3] = D;
          }
          for (var M = 0; M < 18; M += 1) {
            var D = !S && (O >> M & 1) == 1;
            v[M % 3 + u - 8 - 3][Math.floor(M / 3)] = D;
          }
        }, pe = function(S, O) {
          for (var M = f << 3 | O, D = l.getBCHTypeInfo(M), W = 0; W < 15; W += 1) {
            var U = !S && (D >> W & 1) == 1;
            W < 6 ? v[W][8] = U : W < 8 ? v[W + 1][8] = U : v[u - 15 + W][8] = U;
          }
          for (var W = 0; W < 15; W += 1) {
            var U = !S && (D >> W & 1) == 1;
            W < 8 ? v[8][u - W - 1] = U : W < 9 ? v[8][15 - W - 1 + 1] = U : v[8][15 - W - 1] = U;
          }
          v[u - 8][8] = !S;
        }, ge = function(S, O) {
          for (var M = -1, D = u - 1, W = 7, U = 0, G = l.getMaskFunction(O), R = u - 1; R > 0; R -= 2)
            for (R == 6 && (R -= 1); ; ) {
              for (var V = 0; V < 2; V += 1)
                if (v[D][R - V] == null) {
                  var ee = !1;
                  U < S.length && (ee = (S[U] >>> W & 1) == 1);
                  var H = G(D, R - V);
                  H && (ee = !ee), v[D][R - V] = ee, W -= 1, W == -1 && (U += 1, W = 7);
                }
              if (D += M, D < 0 || u <= D) {
                D -= M, M = -M;
                break;
              }
            }
        }, Ce = function(S, O) {
          for (var M = 0, D = 0, W = 0, U = new Array(O.length), G = new Array(O.length), R = 0; R < O.length; R += 1) {
            var V = O[R].dataCount, ee = O[R].totalCount - V;
            D = Math.max(D, V), W = Math.max(W, ee), U[R] = new Array(V);
            for (var H = 0; H < U[R].length; H += 1)
              U[R][H] = 255 & S.getBuffer()[H + M];
            M += V;
            var le = l.getErrorCorrectPolynomial(ee), ce = c(U[R], le.getLength() - 1), St = ce.mod(le);
            G[R] = new Array(le.getLength() - 1);
            for (var H = 0; H < G[R].length; H += 1) {
              var zt = H + St.getLength() - G[R].length;
              G[R][H] = zt >= 0 ? St.getAt(zt) : 0;
            }
          }
          for (var Bt = 0, H = 0; H < O.length; H += 1)
            Bt += O[H].totalCount;
          for (var rt = new Array(Bt), Qe = 0, H = 0; H < D; H += 1)
            for (var R = 0; R < O.length; R += 1)
              H < U[R].length && (rt[Qe] = U[R][H], Qe += 1);
          for (var H = 0; H < W; H += 1)
            for (var R = 0; R < O.length; R += 1)
              H < G[R].length && (rt[Qe] = G[R][H], Qe += 1);
          return rt;
        }, ki = function(S, O, M) {
          for (var D = h.getRSBlocks(S, O), W = b(), U = 0; U < M.length; U += 1) {
            var G = M[U];
            W.put(G.getMode(), 4), W.put(G.getLength(), l.getLengthInBits(G.getMode(), S)), G.write(W);
          }
          for (var R = 0, U = 0; U < D.length; U += 1)
            R += D[U].dataCount;
          if (W.getLengthInBits() > R * 8)
            throw "code length overflow. (" + W.getLengthInBits() + ">" + R * 8 + ")";
          for (W.getLengthInBits() + 4 <= R * 8 && W.put(0, 4); W.getLengthInBits() % 8 != 0; )
            W.putBit(!1);
          for (; !(W.getLengthInBits() >= R * 8 || (W.put(p, 8), W.getLengthInBits() >= R * 8)); )
            W.put(m, 8);
          return Ce(W, D);
        };
        N.addData = function(S, O) {
          O = O || "Byte";
          var M = null;
          switch (O) {
            case "Numeric":
              M = k(S);
              break;
            case "Alphanumeric":
              M = A(S);
              break;
            case "Byte":
              M = x(S);
              break;
            case "Kanji":
              M = E(S);
              break;
            default:
              throw "mode:" + O;
          }
          T.push(M), j = null;
        }, N.isDark = function(S, O) {
          if (S < 0 || u <= S || O < 0 || u <= O)
            throw S + "," + O;
          return v[S][O];
        }, N.getModuleCount = function() {
          return u;
        }, N.make = function() {
          if (g < 1) {
            for (var S = 1; S < 40; S++) {
              for (var O = h.getRSBlocks(S, f), M = b(), D = 0; D < T.length; D++) {
                var W = T[D];
                M.put(W.getMode(), 4), M.put(W.getLength(), l.getLengthInBits(W.getMode(), S)), W.write(M);
              }
              for (var U = 0, D = 0; D < O.length; D++)
                U += O[D].dataCount;
              if (M.getLengthInBits() <= U * 8)
                break;
            }
            g = S;
          }
          Q(!1, J());
        }, N.createTableTag = function(S, O) {
          S = S || 2, O = typeof O > "u" ? S * 4 : O;
          var M = "";
          M += '<table style="', M += " border-width: 0px; border-style: none;", M += " border-collapse: collapse;", M += " padding: 0px; margin: " + O + "px;", M += '">', M += "<tbody>";
          for (var D = 0; D < N.getModuleCount(); D += 1) {
            M += "<tr>";
            for (var W = 0; W < N.getModuleCount(); W += 1)
              M += '<td style="', M += " border-width: 0px; border-style: none;", M += " border-collapse: collapse;", M += " padding: 0px; margin: 0px;", M += " width: " + S + "px;", M += " height: " + S + "px;", M += " background-color: ", M += N.isDark(D, W) ? "#000000" : "#ffffff", M += ";", M += '"/>';
            M += "</tr>";
          }
          return M += "</tbody>", M += "</table>", M;
        }, N.createSvgTag = function(S, O, M, D) {
          var W = {};
          typeof arguments[0] == "object" && (W = arguments[0], S = W.cellSize, O = W.margin, M = W.alt, D = W.title), S = S || 2, O = typeof O > "u" ? S * 4 : O, M = typeof M == "string" ? { text: M } : M || {}, M.text = M.text || null, M.id = M.text ? M.id || "qrcode-description" : null, D = typeof D == "string" ? { text: D } : D || {}, D.text = D.text || null, D.id = D.text ? D.id || "qrcode-title" : null;
          var U = N.getModuleCount() * S + O * 2, G, R, V, ee, H = "", le;
          for (le = "l" + S + ",0 0," + S + " -" + S + ",0 0,-" + S + "z ", H += '<svg version="1.1" xmlns="http://www.w3.org/2000/svg"', H += W.scalable ? "" : ' width="' + U + 'px" height="' + U + 'px"', H += ' viewBox="0 0 ' + U + " " + U + '" ', H += ' preserveAspectRatio="xMinYMin meet"', H += D.text || M.text ? ' role="img" aria-labelledby="' + Te([D.id, M.id].join(" ").trim()) + '"' : "", H += ">", H += D.text ? '<title id="' + Te(D.id) + '">' + Te(D.text) + "</title>" : "", H += M.text ? '<description id="' + Te(M.id) + '">' + Te(M.text) + "</description>" : "", H += '<rect width="100%" height="100%" fill="white" cx="0" cy="0"/>', H += '<path d="', V = 0; V < N.getModuleCount(); V += 1)
            for (ee = V * S + O, G = 0; G < N.getModuleCount(); G += 1)
              N.isDark(V, G) && (R = G * S + O, H += "M" + R + "," + ee + le);
          return H += '" stroke="transparent" fill="black"/>', H += "</svg>", H;
        }, N.createDataURL = function(S, O) {
          S = S || 2, O = typeof O > "u" ? S * 4 : O;
          var M = N.getModuleCount() * S + O * 2, D = O, W = M - O;
          return C(M, M, function(U, G) {
            if (D <= U && U < W && D <= G && G < W) {
              var R = Math.floor((U - D) / S), V = Math.floor((G - D) / S);
              return N.isDark(V, R) ? 0 : 1;
            } else
              return 1;
          });
        }, N.createImgTag = function(S, O, M) {
          S = S || 2, O = typeof O > "u" ? S * 4 : O;
          var D = N.getModuleCount() * S + O * 2, W = "";
          return W += "<img", W += ' src="', W += N.createDataURL(S, O), W += '"', W += ' width="', W += D, W += '"', W += ' height="', W += D, W += '"', M && (W += ' alt="', W += Te(M), W += '"'), W += "/>", W;
        };
        var Te = function(S) {
          for (var O = "", M = 0; M < S.length; M += 1) {
            var D = S.charAt(M);
            switch (D) {
              case "<":
                O += "&lt;";
                break;
              case ">":
                O += "&gt;";
                break;
              case "&":
                O += "&amp;";
                break;
              case '"':
                O += "&quot;";
                break;
              default:
                O += D;
                break;
            }
          }
          return O;
        }, Si = function(S) {
          var O = 1;
          S = typeof S > "u" ? O * 2 : S;
          var M = N.getModuleCount() * O + S * 2, D = S, W = M - S, U, G, R, V, ee, H = {
            "██": "█",
            "█ ": "▀",
            " █": "▄",
            "  ": " "
          }, le = {
            "██": "▀",
            "█ ": "▀",
            " █": " ",
            "  ": " "
          }, ce = "";
          for (U = 0; U < M; U += 2) {
            for (R = Math.floor((U - D) / O), V = Math.floor((U + 1 - D) / O), G = 0; G < M; G += 1)
              ee = "█", D <= G && G < W && D <= U && U < W && N.isDark(R, Math.floor((G - D) / O)) && (ee = " "), D <= G && G < W && D <= U + 1 && U + 1 < W && N.isDark(V, Math.floor((G - D) / O)) ? ee += " " : ee += "█", ce += S < 1 && U + 1 >= W ? le[ee] : H[ee];
            ce += `
`;
          }
          return M % 2 && S > 0 ? ce.substring(0, ce.length - M - 1) + Array(M + 1).join("▀") : ce.substring(0, ce.length - 1);
        };
        return N.createASCII = function(S, O) {
          if (S = S || 1, S < 2)
            return Si(O);
          S -= 1, O = typeof O > "u" ? S * 2 : O;
          var M = N.getModuleCount() * S + O * 2, D = O, W = M - O, U, G, R, V, ee = Array(S + 1).join("██"), H = Array(S + 1).join("  "), le = "", ce = "";
          for (U = 0; U < M; U += 1) {
            for (R = Math.floor((U - D) / S), ce = "", G = 0; G < M; G += 1)
              V = 1, D <= G && G < W && D <= U && U < W && N.isDark(R, Math.floor((G - D) / S)) && (V = 0), ce += V ? ee : H;
            for (R = 0; R < S; R += 1)
              le += ce + `
`;
          }
          return le.substring(0, le.length - 1);
        }, N.renderTo2dContext = function(S, O) {
          O = O || 2;
          for (var M = N.getModuleCount(), D = 0; D < M; D++)
            for (var W = 0; W < M; W++)
              S.fillStyle = N.isDark(D, W) ? "black" : "white", S.fillRect(D * O, W * O, O, O);
        }, N;
      };
      i.stringToBytesFuncs = {
        default: function(w) {
          for (var z = [], p = 0; p < w.length; p += 1) {
            var m = w.charCodeAt(p);
            z.push(m & 255);
          }
          return z;
        }
      }, i.stringToBytes = i.stringToBytesFuncs.default, i.createStringToBytes = function(w, z) {
        var p = (function() {
          for (var g = Z(w), f = function() {
            var $ = g.read();
            if ($ == -1) throw "eof";
            return $;
          }, v = 0, u = {}; ; ) {
            var j = g.read();
            if (j == -1) break;
            var T = f(), N = f(), Q = f(), q = String.fromCharCode(j << 8 | T), J = N << 8 | Q;
            u[q] = J, v += 1;
          }
          if (v != z)
            throw v + " != " + z;
          return u;
        })(), m = 63;
        return function(g) {
          for (var f = [], v = 0; v < g.length; v += 1) {
            var u = g.charCodeAt(v);
            if (u < 128)
              f.push(u);
            else {
              var j = p[g.charAt(v)];
              typeof j == "number" ? (j & 255) == j ? f.push(j) : (f.push(j >>> 8), f.push(j & 255)) : f.push(m);
            }
          }
          return f;
        };
      };
      var s = {
        MODE_NUMBER: 1,
        MODE_ALPHA_NUM: 2,
        MODE_8BIT_BYTE: 4,
        MODE_KANJI: 8
      }, r = {
        L: 1,
        M: 0,
        Q: 3,
        H: 2
      }, n = {
        PATTERN000: 0,
        PATTERN001: 1,
        PATTERN010: 2,
        PATTERN011: 3,
        PATTERN100: 4,
        PATTERN101: 5,
        PATTERN110: 6,
        PATTERN111: 7
      }, l = (function() {
        var w = [
          [],
          [6, 18],
          [6, 22],
          [6, 26],
          [6, 30],
          [6, 34],
          [6, 22, 38],
          [6, 24, 42],
          [6, 26, 46],
          [6, 28, 50],
          [6, 30, 54],
          [6, 32, 58],
          [6, 34, 62],
          [6, 26, 46, 66],
          [6, 26, 48, 70],
          [6, 26, 50, 74],
          [6, 30, 54, 78],
          [6, 30, 56, 82],
          [6, 30, 58, 86],
          [6, 34, 62, 90],
          [6, 28, 50, 72, 94],
          [6, 26, 50, 74, 98],
          [6, 30, 54, 78, 102],
          [6, 28, 54, 80, 106],
          [6, 32, 58, 84, 110],
          [6, 30, 58, 86, 114],
          [6, 34, 62, 90, 118],
          [6, 26, 50, 74, 98, 122],
          [6, 30, 54, 78, 102, 126],
          [6, 26, 52, 78, 104, 130],
          [6, 30, 56, 82, 108, 134],
          [6, 34, 60, 86, 112, 138],
          [6, 30, 58, 86, 114, 142],
          [6, 34, 62, 90, 118, 146],
          [6, 30, 54, 78, 102, 126, 150],
          [6, 24, 50, 76, 102, 128, 154],
          [6, 28, 54, 80, 106, 132, 158],
          [6, 32, 58, 84, 110, 136, 162],
          [6, 26, 54, 82, 110, 138, 166],
          [6, 30, 58, 86, 114, 142, 170]
        ], z = 1335, p = 7973, m = 21522, g = {}, f = function(v) {
          for (var u = 0; v != 0; )
            u += 1, v >>>= 1;
          return u;
        };
        return g.getBCHTypeInfo = function(v) {
          for (var u = v << 10; f(u) - f(z) >= 0; )
            u ^= z << f(u) - f(z);
          return (v << 10 | u) ^ m;
        }, g.getBCHTypeNumber = function(v) {
          for (var u = v << 12; f(u) - f(p) >= 0; )
            u ^= p << f(u) - f(p);
          return v << 12 | u;
        }, g.getPatternPosition = function(v) {
          return w[v - 1];
        }, g.getMaskFunction = function(v) {
          switch (v) {
            case n.PATTERN000:
              return function(u, j) {
                return (u + j) % 2 == 0;
              };
            case n.PATTERN001:
              return function(u, j) {
                return u % 2 == 0;
              };
            case n.PATTERN010:
              return function(u, j) {
                return j % 3 == 0;
              };
            case n.PATTERN011:
              return function(u, j) {
                return (u + j) % 3 == 0;
              };
            case n.PATTERN100:
              return function(u, j) {
                return (Math.floor(u / 2) + Math.floor(j / 3)) % 2 == 0;
              };
            case n.PATTERN101:
              return function(u, j) {
                return u * j % 2 + u * j % 3 == 0;
              };
            case n.PATTERN110:
              return function(u, j) {
                return (u * j % 2 + u * j % 3) % 2 == 0;
              };
            case n.PATTERN111:
              return function(u, j) {
                return (u * j % 3 + (u + j) % 2) % 2 == 0;
              };
            default:
              throw "bad maskPattern:" + v;
          }
        }, g.getErrorCorrectPolynomial = function(v) {
          for (var u = c([1], 0), j = 0; j < v; j += 1)
            u = u.multiply(c([1, a.gexp(j)], 0));
          return u;
        }, g.getLengthInBits = function(v, u) {
          if (1 <= u && u < 10)
            switch (v) {
              case s.MODE_NUMBER:
                return 10;
              case s.MODE_ALPHA_NUM:
                return 9;
              case s.MODE_8BIT_BYTE:
                return 8;
              case s.MODE_KANJI:
                return 8;
              default:
                throw "mode:" + v;
            }
          else if (u < 27)
            switch (v) {
              case s.MODE_NUMBER:
                return 12;
              case s.MODE_ALPHA_NUM:
                return 11;
              case s.MODE_8BIT_BYTE:
                return 16;
              case s.MODE_KANJI:
                return 10;
              default:
                throw "mode:" + v;
            }
          else if (u < 41)
            switch (v) {
              case s.MODE_NUMBER:
                return 14;
              case s.MODE_ALPHA_NUM:
                return 13;
              case s.MODE_8BIT_BYTE:
                return 16;
              case s.MODE_KANJI:
                return 12;
              default:
                throw "mode:" + v;
            }
          else
            throw "type:" + u;
        }, g.getLostPoint = function(v) {
          for (var u = v.getModuleCount(), j = 0, T = 0; T < u; T += 1)
            for (var N = 0; N < u; N += 1) {
              for (var Q = 0, q = v.isDark(T, N), J = -1; J <= 1; J += 1)
                if (!(T + J < 0 || u <= T + J))
                  for (var $ = -1; $ <= 1; $ += 1)
                    N + $ < 0 || u <= N + $ || J == 0 && $ == 0 || q == v.isDark(T + J, N + $) && (Q += 1);
              Q > 5 && (j += 3 + Q - 5);
            }
          for (var T = 0; T < u - 1; T += 1)
            for (var N = 0; N < u - 1; N += 1) {
              var ie = 0;
              v.isDark(T, N) && (ie += 1), v.isDark(T + 1, N) && (ie += 1), v.isDark(T, N + 1) && (ie += 1), v.isDark(T + 1, N + 1) && (ie += 1), (ie == 0 || ie == 4) && (j += 3);
            }
          for (var T = 0; T < u; T += 1)
            for (var N = 0; N < u - 6; N += 1)
              v.isDark(T, N) && !v.isDark(T, N + 1) && v.isDark(T, N + 2) && v.isDark(T, N + 3) && v.isDark(T, N + 4) && !v.isDark(T, N + 5) && v.isDark(T, N + 6) && (j += 40);
          for (var N = 0; N < u; N += 1)
            for (var T = 0; T < u - 6; T += 1)
              v.isDark(T, N) && !v.isDark(T + 1, N) && v.isDark(T + 2, N) && v.isDark(T + 3, N) && v.isDark(T + 4, N) && !v.isDark(T + 5, N) && v.isDark(T + 6, N) && (j += 40);
          for (var he = 0, N = 0; N < u; N += 1)
            for (var T = 0; T < u; T += 1)
              v.isDark(T, N) && (he += 1);
          var pe = Math.abs(100 * he / u / u - 50) / 5;
          return j += pe * 10, j;
        }, g;
      })(), a = (function() {
        for (var w = new Array(256), z = new Array(256), p = 0; p < 8; p += 1)
          w[p] = 1 << p;
        for (var p = 8; p < 256; p += 1)
          w[p] = w[p - 4] ^ w[p - 5] ^ w[p - 6] ^ w[p - 8];
        for (var p = 0; p < 255; p += 1)
          z[w[p]] = p;
        var m = {};
        return m.glog = function(g) {
          if (g < 1)
            throw "glog(" + g + ")";
          return z[g];
        }, m.gexp = function(g) {
          for (; g < 0; )
            g += 255;
          for (; g >= 256; )
            g -= 255;
          return w[g];
        }, m;
      })();
      function c(w, z) {
        if (typeof w.length > "u")
          throw w.length + "/" + z;
        var p = (function() {
          for (var g = 0; g < w.length && w[g] == 0; )
            g += 1;
          for (var f = new Array(w.length - g + z), v = 0; v < w.length - g; v += 1)
            f[v] = w[v + g];
          return f;
        })(), m = {};
        return m.getAt = function(g) {
          return p[g];
        }, m.getLength = function() {
          return p.length;
        }, m.multiply = function(g) {
          for (var f = new Array(m.getLength() + g.getLength() - 1), v = 0; v < m.getLength(); v += 1)
            for (var u = 0; u < g.getLength(); u += 1)
              f[v + u] ^= a.gexp(a.glog(m.getAt(v)) + a.glog(g.getAt(u)));
          return c(f, 0);
        }, m.mod = function(g) {
          if (m.getLength() - g.getLength() < 0)
            return m;
          for (var f = a.glog(m.getAt(0)) - a.glog(g.getAt(0)), v = new Array(m.getLength()), u = 0; u < m.getLength(); u += 1)
            v[u] = m.getAt(u);
          for (var u = 0; u < g.getLength(); u += 1)
            v[u] ^= a.gexp(a.glog(g.getAt(u)) + f);
          return c(v, 0).mod(g);
        }, m;
      }
      var h = (function() {
        var w = [
          // L
          // M
          // Q
          // H
          // 1
          [1, 26, 19],
          [1, 26, 16],
          [1, 26, 13],
          [1, 26, 9],
          // 2
          [1, 44, 34],
          [1, 44, 28],
          [1, 44, 22],
          [1, 44, 16],
          // 3
          [1, 70, 55],
          [1, 70, 44],
          [2, 35, 17],
          [2, 35, 13],
          // 4
          [1, 100, 80],
          [2, 50, 32],
          [2, 50, 24],
          [4, 25, 9],
          // 5
          [1, 134, 108],
          [2, 67, 43],
          [2, 33, 15, 2, 34, 16],
          [2, 33, 11, 2, 34, 12],
          // 6
          [2, 86, 68],
          [4, 43, 27],
          [4, 43, 19],
          [4, 43, 15],
          // 7
          [2, 98, 78],
          [4, 49, 31],
          [2, 32, 14, 4, 33, 15],
          [4, 39, 13, 1, 40, 14],
          // 8
          [2, 121, 97],
          [2, 60, 38, 2, 61, 39],
          [4, 40, 18, 2, 41, 19],
          [4, 40, 14, 2, 41, 15],
          // 9
          [2, 146, 116],
          [3, 58, 36, 2, 59, 37],
          [4, 36, 16, 4, 37, 17],
          [4, 36, 12, 4, 37, 13],
          // 10
          [2, 86, 68, 2, 87, 69],
          [4, 69, 43, 1, 70, 44],
          [6, 43, 19, 2, 44, 20],
          [6, 43, 15, 2, 44, 16],
          // 11
          [4, 101, 81],
          [1, 80, 50, 4, 81, 51],
          [4, 50, 22, 4, 51, 23],
          [3, 36, 12, 8, 37, 13],
          // 12
          [2, 116, 92, 2, 117, 93],
          [6, 58, 36, 2, 59, 37],
          [4, 46, 20, 6, 47, 21],
          [7, 42, 14, 4, 43, 15],
          // 13
          [4, 133, 107],
          [8, 59, 37, 1, 60, 38],
          [8, 44, 20, 4, 45, 21],
          [12, 33, 11, 4, 34, 12],
          // 14
          [3, 145, 115, 1, 146, 116],
          [4, 64, 40, 5, 65, 41],
          [11, 36, 16, 5, 37, 17],
          [11, 36, 12, 5, 37, 13],
          // 15
          [5, 109, 87, 1, 110, 88],
          [5, 65, 41, 5, 66, 42],
          [5, 54, 24, 7, 55, 25],
          [11, 36, 12, 7, 37, 13],
          // 16
          [5, 122, 98, 1, 123, 99],
          [7, 73, 45, 3, 74, 46],
          [15, 43, 19, 2, 44, 20],
          [3, 45, 15, 13, 46, 16],
          // 17
          [1, 135, 107, 5, 136, 108],
          [10, 74, 46, 1, 75, 47],
          [1, 50, 22, 15, 51, 23],
          [2, 42, 14, 17, 43, 15],
          // 18
          [5, 150, 120, 1, 151, 121],
          [9, 69, 43, 4, 70, 44],
          [17, 50, 22, 1, 51, 23],
          [2, 42, 14, 19, 43, 15],
          // 19
          [3, 141, 113, 4, 142, 114],
          [3, 70, 44, 11, 71, 45],
          [17, 47, 21, 4, 48, 22],
          [9, 39, 13, 16, 40, 14],
          // 20
          [3, 135, 107, 5, 136, 108],
          [3, 67, 41, 13, 68, 42],
          [15, 54, 24, 5, 55, 25],
          [15, 43, 15, 10, 44, 16],
          // 21
          [4, 144, 116, 4, 145, 117],
          [17, 68, 42],
          [17, 50, 22, 6, 51, 23],
          [19, 46, 16, 6, 47, 17],
          // 22
          [2, 139, 111, 7, 140, 112],
          [17, 74, 46],
          [7, 54, 24, 16, 55, 25],
          [34, 37, 13],
          // 23
          [4, 151, 121, 5, 152, 122],
          [4, 75, 47, 14, 76, 48],
          [11, 54, 24, 14, 55, 25],
          [16, 45, 15, 14, 46, 16],
          // 24
          [6, 147, 117, 4, 148, 118],
          [6, 73, 45, 14, 74, 46],
          [11, 54, 24, 16, 55, 25],
          [30, 46, 16, 2, 47, 17],
          // 25
          [8, 132, 106, 4, 133, 107],
          [8, 75, 47, 13, 76, 48],
          [7, 54, 24, 22, 55, 25],
          [22, 45, 15, 13, 46, 16],
          // 26
          [10, 142, 114, 2, 143, 115],
          [19, 74, 46, 4, 75, 47],
          [28, 50, 22, 6, 51, 23],
          [33, 46, 16, 4, 47, 17],
          // 27
          [8, 152, 122, 4, 153, 123],
          [22, 73, 45, 3, 74, 46],
          [8, 53, 23, 26, 54, 24],
          [12, 45, 15, 28, 46, 16],
          // 28
          [3, 147, 117, 10, 148, 118],
          [3, 73, 45, 23, 74, 46],
          [4, 54, 24, 31, 55, 25],
          [11, 45, 15, 31, 46, 16],
          // 29
          [7, 146, 116, 7, 147, 117],
          [21, 73, 45, 7, 74, 46],
          [1, 53, 23, 37, 54, 24],
          [19, 45, 15, 26, 46, 16],
          // 30
          [5, 145, 115, 10, 146, 116],
          [19, 75, 47, 10, 76, 48],
          [15, 54, 24, 25, 55, 25],
          [23, 45, 15, 25, 46, 16],
          // 31
          [13, 145, 115, 3, 146, 116],
          [2, 74, 46, 29, 75, 47],
          [42, 54, 24, 1, 55, 25],
          [23, 45, 15, 28, 46, 16],
          // 32
          [17, 145, 115],
          [10, 74, 46, 23, 75, 47],
          [10, 54, 24, 35, 55, 25],
          [19, 45, 15, 35, 46, 16],
          // 33
          [17, 145, 115, 1, 146, 116],
          [14, 74, 46, 21, 75, 47],
          [29, 54, 24, 19, 55, 25],
          [11, 45, 15, 46, 46, 16],
          // 34
          [13, 145, 115, 6, 146, 116],
          [14, 74, 46, 23, 75, 47],
          [44, 54, 24, 7, 55, 25],
          [59, 46, 16, 1, 47, 17],
          // 35
          [12, 151, 121, 7, 152, 122],
          [12, 75, 47, 26, 76, 48],
          [39, 54, 24, 14, 55, 25],
          [22, 45, 15, 41, 46, 16],
          // 36
          [6, 151, 121, 14, 152, 122],
          [6, 75, 47, 34, 76, 48],
          [46, 54, 24, 10, 55, 25],
          [2, 45, 15, 64, 46, 16],
          // 37
          [17, 152, 122, 4, 153, 123],
          [29, 74, 46, 14, 75, 47],
          [49, 54, 24, 10, 55, 25],
          [24, 45, 15, 46, 46, 16],
          // 38
          [4, 152, 122, 18, 153, 123],
          [13, 74, 46, 32, 75, 47],
          [48, 54, 24, 14, 55, 25],
          [42, 45, 15, 32, 46, 16],
          // 39
          [20, 147, 117, 4, 148, 118],
          [40, 75, 47, 7, 76, 48],
          [43, 54, 24, 22, 55, 25],
          [10, 45, 15, 67, 46, 16],
          // 40
          [19, 148, 118, 6, 149, 119],
          [18, 75, 47, 31, 76, 48],
          [34, 54, 24, 34, 55, 25],
          [20, 45, 15, 61, 46, 16]
        ], z = function(g, f) {
          var v = {};
          return v.totalCount = g, v.dataCount = f, v;
        }, p = {}, m = function(g, f) {
          switch (f) {
            case r.L:
              return w[(g - 1) * 4 + 0];
            case r.M:
              return w[(g - 1) * 4 + 1];
            case r.Q:
              return w[(g - 1) * 4 + 2];
            case r.H:
              return w[(g - 1) * 4 + 3];
            default:
              return;
          }
        };
        return p.getRSBlocks = function(g, f) {
          var v = m(g, f);
          if (typeof v > "u")
            throw "bad rs block @ typeNumber:" + g + "/errorCorrectionLevel:" + f;
          for (var u = v.length / 3, j = [], T = 0; T < u; T += 1)
            for (var N = v[T * 3 + 0], Q = v[T * 3 + 1], q = v[T * 3 + 2], J = 0; J < N; J += 1)
              j.push(z(Q, q));
          return j;
        }, p;
      })(), b = function() {
        var w = [], z = 0, p = {};
        return p.getBuffer = function() {
          return w;
        }, p.getAt = function(m) {
          var g = Math.floor(m / 8);
          return (w[g] >>> 7 - m % 8 & 1) == 1;
        }, p.put = function(m, g) {
          for (var f = 0; f < g; f += 1)
            p.putBit((m >>> g - f - 1 & 1) == 1);
        }, p.getLengthInBits = function() {
          return z;
        }, p.putBit = function(m) {
          var g = Math.floor(z / 8);
          w.length <= g && w.push(0), m && (w[g] |= 128 >>> z % 8), z += 1;
        }, p;
      }, k = function(w) {
        var z = s.MODE_NUMBER, p = w, m = {};
        m.getMode = function() {
          return z;
        }, m.getLength = function(v) {
          return p.length;
        }, m.write = function(v) {
          for (var u = p, j = 0; j + 2 < u.length; )
            v.put(g(u.substring(j, j + 3)), 10), j += 3;
          j < u.length && (u.length - j == 1 ? v.put(g(u.substring(j, j + 1)), 4) : u.length - j == 2 && v.put(g(u.substring(j, j + 2)), 7));
        };
        var g = function(v) {
          for (var u = 0, j = 0; j < v.length; j += 1)
            u = u * 10 + f(v.charAt(j));
          return u;
        }, f = function(v) {
          if ("0" <= v && v <= "9")
            return v.charCodeAt(0) - 48;
          throw "illegal char :" + v;
        };
        return m;
      }, A = function(w) {
        var z = s.MODE_ALPHA_NUM, p = w, m = {};
        m.getMode = function() {
          return z;
        }, m.getLength = function(f) {
          return p.length;
        }, m.write = function(f) {
          for (var v = p, u = 0; u + 1 < v.length; )
            f.put(
              g(v.charAt(u)) * 45 + g(v.charAt(u + 1)),
              11
            ), u += 2;
          u < v.length && f.put(g(v.charAt(u)), 6);
        };
        var g = function(f) {
          if ("0" <= f && f <= "9")
            return f.charCodeAt(0) - 48;
          if ("A" <= f && f <= "Z")
            return f.charCodeAt(0) - 65 + 10;
          switch (f) {
            case " ":
              return 36;
            case "$":
              return 37;
            case "%":
              return 38;
            case "*":
              return 39;
            case "+":
              return 40;
            case "-":
              return 41;
            case ".":
              return 42;
            case "/":
              return 43;
            case ":":
              return 44;
            default:
              throw "illegal char :" + f;
          }
        };
        return m;
      }, x = function(w) {
        var z = s.MODE_8BIT_BYTE, p = i.stringToBytes(w), m = {};
        return m.getMode = function() {
          return z;
        }, m.getLength = function(g) {
          return p.length;
        }, m.write = function(g) {
          for (var f = 0; f < p.length; f += 1)
            g.put(p[f], 8);
        }, m;
      }, E = function(w) {
        var z = s.MODE_KANJI, p = i.stringToBytesFuncs.SJIS;
        if (!p)
          throw "sjis not supported.";
        (function(f, v) {
          var u = p(f);
          if (u.length != 2 || (u[0] << 8 | u[1]) != v)
            throw "sjis not supported.";
        })("友", 38726);
        var m = p(w), g = {};
        return g.getMode = function() {
          return z;
        }, g.getLength = function(f) {
          return ~~(m.length / 2);
        }, g.write = function(f) {
          for (var v = m, u = 0; u + 1 < v.length; ) {
            var j = (255 & v[u]) << 8 | 255 & v[u + 1];
            if (33088 <= j && j <= 40956)
              j -= 33088;
            else if (57408 <= j && j <= 60351)
              j -= 49472;
            else
              throw "illegal char at " + (u + 1) + "/" + j;
            j = (j >>> 8 & 255) * 192 + (j & 255), f.put(j, 13), u += 2;
          }
          if (u < v.length)
            throw "illegal char at " + (u + 1);
        }, g;
      }, F = function() {
        var w = [], z = {};
        return z.writeByte = function(p) {
          w.push(p & 255);
        }, z.writeShort = function(p) {
          z.writeByte(p), z.writeByte(p >>> 8);
        }, z.writeBytes = function(p, m, g) {
          m = m || 0, g = g || p.length;
          for (var f = 0; f < g; f += 1)
            z.writeByte(p[f + m]);
        }, z.writeString = function(p) {
          for (var m = 0; m < p.length; m += 1)
            z.writeByte(p.charCodeAt(m));
        }, z.toByteArray = function() {
          return w;
        }, z.toString = function() {
          var p = "";
          p += "[";
          for (var m = 0; m < w.length; m += 1)
            m > 0 && (p += ","), p += w[m];
          return p += "]", p;
        }, z;
      }, B = function() {
        var w = 0, z = 0, p = 0, m = "", g = {}, f = function(u) {
          m += String.fromCharCode(v(u & 63));
        }, v = function(u) {
          if (!(u < 0)) {
            if (u < 26)
              return 65 + u;
            if (u < 52)
              return 97 + (u - 26);
            if (u < 62)
              return 48 + (u - 52);
            if (u == 62)
              return 43;
            if (u == 63)
              return 47;
          }
          throw "n:" + u;
        };
        return g.writeByte = function(u) {
          for (w = w << 8 | u & 255, z += 8, p += 1; z >= 6; )
            f(w >>> z - 6), z -= 6;
        }, g.flush = function() {
          if (z > 0 && (f(w << 6 - z), w = 0, z = 0), p % 3 != 0)
            for (var u = 3 - p % 3, j = 0; j < u; j += 1)
              m += "=";
        }, g.toString = function() {
          return m;
        }, g;
      }, Z = function(w) {
        var z = w, p = 0, m = 0, g = 0, f = {};
        f.read = function() {
          for (; g < 8; ) {
            if (p >= z.length) {
              if (g == 0)
                return -1;
              throw "unexpected end of file./" + g;
            }
            var u = z.charAt(p);
            if (p += 1, u == "=")
              return g = 0, -1;
            if (u.match(/^\s$/))
              continue;
            m = m << 6 | v(u.charCodeAt(0)), g += 6;
          }
          var j = m >>> g - 8 & 255;
          return g -= 8, j;
        };
        var v = function(u) {
          if (65 <= u && u <= 90)
            return u - 65;
          if (97 <= u && u <= 122)
            return u - 97 + 26;
          if (48 <= u && u <= 57)
            return u - 48 + 52;
          if (u == 43)
            return 62;
          if (u == 47)
            return 63;
          throw "c:" + u;
        };
        return f;
      }, I = function(w, z) {
        var p = w, m = z, g = new Array(w * z), f = {};
        f.setPixel = function(T, N, Q) {
          g[N * p + T] = Q;
        }, f.write = function(T) {
          T.writeString("GIF87a"), T.writeShort(p), T.writeShort(m), T.writeByte(128), T.writeByte(0), T.writeByte(0), T.writeByte(0), T.writeByte(0), T.writeByte(0), T.writeByte(255), T.writeByte(255), T.writeByte(255), T.writeString(","), T.writeShort(0), T.writeShort(0), T.writeShort(p), T.writeShort(m), T.writeByte(0);
          var N = 2, Q = u(N);
          T.writeByte(N);
          for (var q = 0; Q.length - q > 255; )
            T.writeByte(255), T.writeBytes(Q, q, 255), q += 255;
          T.writeByte(Q.length - q), T.writeBytes(Q, q, Q.length - q), T.writeByte(0), T.writeString(";");
        };
        var v = function(T) {
          var N = T, Q = 0, q = 0, J = {};
          return J.write = function($, ie) {
            if ($ >>> ie)
              throw "length over";
            for (; Q + ie >= 8; )
              N.writeByte(255 & ($ << Q | q)), ie -= 8 - Q, $ >>>= 8 - Q, q = 0, Q = 0;
            q = $ << Q | q, Q = Q + ie;
          }, J.flush = function() {
            Q > 0 && N.writeByte(q);
          }, J;
        }, u = function(T) {
          for (var N = 1 << T, Q = (1 << T) + 1, q = T + 1, J = j(), $ = 0; $ < N; $ += 1)
            J.add(String.fromCharCode($));
          J.add(String.fromCharCode(N)), J.add(String.fromCharCode(Q));
          var ie = F(), he = v(ie);
          he.write(N, q);
          var pe = 0, ge = String.fromCharCode(g[pe]);
          for (pe += 1; pe < g.length; ) {
            var Ce = String.fromCharCode(g[pe]);
            pe += 1, J.contains(ge + Ce) ? ge = ge + Ce : (he.write(J.indexOf(ge), q), J.size() < 4095 && (J.size() == 1 << q && (q += 1), J.add(ge + Ce)), ge = Ce);
          }
          return he.write(J.indexOf(ge), q), he.write(Q, q), he.flush(), ie.toByteArray();
        }, j = function() {
          var T = {}, N = 0, Q = {};
          return Q.add = function(q) {
            if (Q.contains(q))
              throw "dup key:" + q;
            T[q] = N, N += 1;
          }, Q.size = function() {
            return N;
          }, Q.indexOf = function(q) {
            return T[q];
          }, Q.contains = function(q) {
            return typeof T[q] < "u";
          }, Q;
        };
        return f;
      }, C = function(w, z, p) {
        for (var m = I(w, z), g = 0; g < z; g += 1)
          for (var f = 0; f < w; f += 1)
            m.setPixel(f, g, p(f, g));
        var v = F();
        m.write(v);
        for (var u = B(), j = v.toByteArray(), T = 0; T < j.length; T += 1)
          u.writeByte(j[T]);
        return u.flush(), "data:image/gif;base64," + u;
      };
      return i;
    })();
    (function() {
      t.stringToBytesFuncs["UTF-8"] = function(i) {
        function s(r) {
          for (var n = [], l = 0; l < r.length; l++) {
            var a = r.charCodeAt(l);
            a < 128 ? n.push(a) : a < 2048 ? n.push(
              192 | a >> 6,
              128 | a & 63
            ) : a < 55296 || a >= 57344 ? n.push(
              224 | a >> 12,
              128 | a >> 6 & 63,
              128 | a & 63
            ) : (l++, a = 65536 + ((a & 1023) << 10 | r.charCodeAt(l) & 1023), n.push(
              240 | a >> 18,
              128 | a >> 12 & 63,
              128 | a >> 6 & 63,
              128 | a & 63
            ));
          }
          return n;
        }
        return s(i);
      };
    })(), (function(i) {
      o.exports = i();
    })(function() {
      return t;
    });
  })(dt)), dt.exports;
}
var sn = tn();
const nn = /* @__PURE__ */ en(sn), bt = {
  brightness: [0, 100, "%"],
  ct: [2e3, 6500, "K"],
  hue: [0, 359, "°"]
}, rn = ["#ff9329", "#ffd6aa", "#cbe1ff"], on = ["#ff0000", "#ffff00", "#00ff00", "#00ffff", "#0000ff", "#ff00ff", "#ff0000"];
function an(o) {
  const e = o?.attributes.supported_color_modes, t = Array.isArray(e) ? e.join(",") : String(e ?? "");
  return { hasCt: t.includes("color_temp"), hasHs: ["hs", "rgb", "xy"].some((i) => t.includes(i)) };
}
const ln = {
  de: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
}, cn = {
  de: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
}, de = (o) => String(o).padStart(2, "0");
function yi(o, e) {
  if (e === "HH:mm:ss") return `${de(o.getHours())}:${de(o.getMinutes())}:${de(o.getSeconds())}`;
  if (e === "h:mm a") {
    const t = o.getHours() % 12 || 12;
    return `${de(t)}:${de(o.getMinutes())} ${o.getHours() < 12 ? "AM" : "PM"}`;
  }
  return `${de(o.getHours())}:${de(o.getMinutes())}`;
}
function dn(o, e) {
  const t = e === "en" ? "en" : "de", i = ln[t][o.getDay()], s = cn[t][o.getMonth()];
  return t === "de" ? `${i}, ${o.getDate()}. ${s}` : `${i}, ${s} ${o.getDate()}`;
}
function tt(o) {
  return o !== void 0 && pt.includes(o);
}
function ht(o, e, t, i) {
  return o === void 0 || o === "" || o === "unknown" ? e.unknown : {
    on: t || e.on,
    off: i || e.off,
    open: t || e.open,
    closed: i || e.closed,
    opening: e.opening,
    closing: e.closing,
    locked: i || e.locked,
    unlocked: t || e.unlocked,
    unavailable: e.unavailable
  }[o] ?? o;
}
function se(o) {
  if (!o) return "";
  const e = o.split(".").slice(1).join(".").replace(/_/g, " ");
  return e.charAt(0).toUpperCase() + e.slice(1);
}
class hn {
  constructor(e, t) {
    this.ctx = e, this.theme = t;
  }
  color(e) {
    const t = this.theme.colors;
    return t[e] ?? t[{ state_icon: "off", nav: "nav_inactive" }[e] ?? "text"] ?? "#ffffff";
  }
  box(e, t, i, s, r, n = 1) {
    const l = this.ctx, a = Math.max(0, Math.min(s, Math.floor(e.w / 2), Math.floor(e.h / 2)));
    if (t && (l.save(), l.globalAlpha = n, l.fillStyle = t, l.beginPath(), l.roundRect(e.x, e.y, e.w, e.h, a), l.fill(), l.restore()), i && r > 0) {
      l.save(), l.strokeStyle = i, l.lineWidth = r;
      const c = r / 2;
      l.beginPath(), l.roundRect(e.x + c, e.y + c, e.w - r, e.h - r, Math.max(0, a - c)), l.stroke(), l.restore();
    }
  }
  /** Small button (cyd_small_btn): rounded box with a centered icon. */
  smallButton(e, t, i, s, r, n) {
    const l = t.width ?? 20, a = t.height ?? 20, c = oe(e, l, a, t.align, t.x, t.y), h = { x: c.x, y: c.y, w: l, h: a };
    this.box(h, s, null, Math.min(n, 10), 0), this.element(h, { ...t, kind: "icon", align: "CENTER", x: 0, y: 0, width: null }, i, r);
  }
  /** LVGL slider: rounded track, filled indicator, round knob. */
  slider(e, t, i, s, r, n) {
    const l = t.width ?? 100, a = t.height ?? 12, c = oe(e, l, a, t.align, t.x, t.y), h = Math.floor(a / 2);
    this.box({ x: c.x, y: c.y, w: l, h: a }, s, null, h, 0);
    const b = Math.round(l * Math.max(0, Math.min(1, i)));
    b > 0 && this.box({ x: c.x, y: c.y, w: Math.max(b, a), h: a }, r, null, h, 0);
    const k = a + 6;
    return this.box({ x: c.x + b - Math.floor(k / 2), y: c.y - 3, w: k, h: k }, n, null, k, 0), { x: c.x, y: c.y, w: l, h: a };
  }
  /** LVGL qrcode: modules scaled to the size, white quiet area. */
  qr(e, t, i) {
    const s = t.width ?? 60, r = oe(e, s, s, t.align, t.x, t.y), n = this.ctx;
    n.fillStyle = "#ffffff", n.fillRect(r.x, r.y, s, s);
    const l = nn(0, "M");
    l.addData(i || " "), l.make();
    const a = l.getModuleCount(), c = Math.max(1, Math.floor(s / a)), h = Math.floor((s - c * a) / 2);
    n.fillStyle = "#000000";
    for (let b = 0; b < a; b++) for (let k = 0; k < a; k++) l.isDark(b, k) && n.fillRect(r.x + h + k * c, r.y + h + b * c, c, c);
  }
  /** LVGL bar: rounded track with indicator. */
  bar(e, t, i, s, r) {
    const n = t.width ?? 100, l = t.height ?? 6, a = oe(e, n, l, t.align, t.x, t.y), c = Math.floor(l / 2);
    this.box({ x: a.x, y: a.y, w: n, h: l }, s, null, c, 0);
    const h = Math.round(n * Math.max(0, Math.min(1, i)));
    h > 0 && this.box({ x: a.x, y: a.y, w: Math.max(h, l), h: l }, r, null, c, 0);
  }
  /** LVGL arc from 135° over 270° (0° = 3 o'clock, clockwise), rounded ends. */
  arc(e, t, i, s, r) {
    const n = t.width ?? 60, l = oe(e, n, n, t.align, t.x, t.y), a = this.ctx, c = n / 2 - t.size / 2, h = l.x + n / 2, b = l.y + n / 2, k = 135 * Math.PI / 180, A = 270 * Math.PI / 180;
    a.save(), a.lineWidth = t.size, a.lineCap = "round", a.strokeStyle = s, a.beginPath(), a.arc(h, b, c, k, k + A), a.stroke();
    const x = Math.max(0, Math.min(1, i));
    x > 0 && (a.strokeStyle = r, a.beginPath(), a.arc(h, b, c, k, k + A * x), a.stroke()), a.restore();
  }
  /** Draw one layout element inside the parent's content box (like an LVGL label). */
  element(e, t, i, s, r) {
    const n = this.ctx;
    if (t.kind === "icon" && t.circle && r) {
      const A = t.circle, x = oe(e, A, A, t.align, t.x, t.y), E = { x: x.x, y: x.y, w: A, h: A };
      return this.box(E, r, null, A, 0), this.element(E, { ...t, align: "CENTER", x: 0, y: 0, circle: void 0 }, i, s), E;
    }
    if (t.kind === "icon") {
      const A = je(i);
      if (!A) return null;
      const x = t.size;
      n.font = as(x);
      const E = Math.round(n.measureText(A).width) || x, F = oe(e, E, x, t.align, t.x, t.y);
      return n.fillStyle = s, n.textBaseline = "alphabetic", n.textAlign = "left", n.fillText(A, F.x, F.y + Math.round(x * As / 1e3)), { x: F.x, y: F.y, w: E, h: x };
    }
    n.font = os(t.size, !!t.bold);
    const l = X(t.size);
    if (t.wrap && t.width) {
      const A = [];
      for (const F of i.split(`
`)) {
        let B = "";
        for (const Z of F.split(" ")) {
          const I = B ? `${B} ${Z}` : Z;
          n.measureText(I).width > t.width && B ? (A.push(B), B = Z) : B = I;
        }
        A.push(B);
      }
      const x = { w: t.width, h: t.height ?? l }, E = oe(e, x.w, x.h, t.align, t.x, t.y);
      return n.save(), n.beginPath(), n.rect(E.x, E.y, x.w, x.h), n.clip(), n.fillStyle = s, n.textBaseline = "alphabetic", n.textAlign = "left", A.forEach((F, B) => n.fillText(F, E.x, E.y + B * l + Math.round(t.size * Kt / 1e3))), n.restore(), { x: E.x, y: E.y, w: x.w, h: x.h };
    }
    let a = i, c = n.measureText(a).width;
    const h = t.width ?? Math.ceil(c);
    if (t.width !== null && c > t.width) {
      for (; a.length > 0 && n.measureText(a + "...").width > t.width; ) a = a.slice(0, -1);
      a += "...", c = n.measureText(a).width;
    }
    const b = oe(e, h, l, t.align, t.x, t.y);
    let k = b.x;
    return t.width !== null && (t.text_align === "center" ? k = b.x + (h - c) / 2 : t.text_align === "right" && (k = b.x + h - c)), n.save(), n.beginPath(), n.rect(b.x, b.y, h, l), n.clip(), n.fillStyle = s, n.textBaseline = "alphabetic", n.textAlign = "left", n.fillText(a, Math.round(k), b.y + Math.round(t.size * Kt / 1e3)), n.restore(), { x: b.x, y: b.y, w: h, h: l };
  }
}
const kt = (o, e) => ({ x: o.x + e, y: o.y + e, w: o.w - 2 * e, h: o.h - 2 * e });
function wi(o, e) {
  const { project: t, board: i, theme: s } = e;
  o.width = i.width, o.height = i.height;
  const r = o.getContext("2d"), n = new hn(r, s), l = [], a = t.pages.find((A) => A.id === e.pageId) ?? t.pages[0];
  r.clearRect(0, 0, i.width, i.height);
  const c = a?.background ?? t.background ?? null;
  r.fillStyle = c?.color || n.color("background"), r.fillRect(0, 0, i.width, i.height);
  const h = c?.image ? e.images?.[c.image] : void 0;
  if (h && r.drawImage(h, 0, 0, i.width, i.height), !a) return l;
  const b = ze(t, a, i.width, i.height), k = [...a.widgets].sort((A, x) => (A.z ?? 0) - (x.z ?? 0));
  for (const A of k) {
    const x = b.widgets[A.id];
    if (x) {
      if (Ps(A, e.state))
        ei(n, e, a, A, x);
      else {
        if (!e.editMode) continue;
        r.save(), r.globalAlpha = 0.3, ei(n, e, a, A, x), r.restore();
      }
      l.push({ kind: "widget", id: A.id, rect: x });
    }
  }
  if (un(n, e, a, l), e.overlay && pn(n, e, e.overlay, l), e.message && yn(n, e, e.message, l), e.night) {
    const A = t.settings?.brightness_night ?? 25;
    r.fillStyle = `rgba(0,0,0,${1 - Math.max(A, 5) / 100})`, r.fillRect(0, 0, i.width, i.height);
  }
  return l;
}
function ei(o, e, t, i, s) {
  const { project: r, theme: n } = e, l = i.props ?? {}, a = $i(r.settings?.language ?? "de"), c = n.font_sizes, h = n.icon_sizes, b = kt(s, re), k = i.entity ? e.state(i.entity) : void 0, A = k?.state, x = e.pressed === i.id, E = vt(n, { ...r.tile_style ?? {}, ...i.style ?? {} }), F = Ks(i, e.state), B = F ? {
    ...E,
    ...F.bg ? { bg: F.bg, bg_on: F.bg } : {},
    ...F.border ? { border: F.border, border_on: F.border } : {},
    ...F.text ? { text: F.text, text_on: F.text, sub: F.text, sub_on: F.text } : {},
    ...F.icon ? { icon: F.icon, icon_on: F.icon } : {}
  } : E, Z = (p = {}) => qs({ ...l, ...p }, B), I = (p, m = !1) => {
    const f = {
      text: ["text_on", "text"],
      text_muted: ["sub_on", "sub"],
      accent: ["icon_on", "icon_on"],
      state_icon: ["icon_on", "icon"]
    }[p];
    return f ? String(B[f[m ? 0 : 1]]) : o.color(p);
  }, C = (p, m, g, f = !1) => o.element(b, p, m, g, p.circle ? f ? B.circle_bg_on : B.circle_bg : void 0), w = () => o.box(s, B.bg, B.border, B.radius, B.border_width, B.bg_opa / 100), z = (p, m) => {
    const g = p || x, f = (p ? B.bg_opa_on : B.bg_opa) / 100;
    o.box(
      s,
      g ? B.bg_on : B.bg,
      p ? B.border_on : B.border,
      B.radius,
      B.border_width,
      m ? f * 0.5 : x && !p ? Math.max(f, 0.5) : f
    );
  };
  switch (i.type) {
    case "toggle_tile": {
      const p = tt(A);
      z(p, A === "unavailable");
      for (const m of _(i.type, s.w, s.h, Z(), c, h))
        if (m.role === "icon") C(m, String(l.icon ?? ""), p ? B.icon_on : B.icon, p);
        else if (m.role === "label") C(m, String(l.label || se(i.entity)), I(m.color, p));
        else if (m.role === "state") {
          const g = l.show_value ?? !0 ? Ei(i.entity, k) : null;
          C(m, p && g !== null ? `${g} %` : ht(A, a), I(m.color, p));
        }
      break;
    }
    case "sensor_value": {
      w();
      const p = String(l.unit ?? ""), m = Math.max(0, Math.min(Number(l.decimals ?? 1), 3));
      let g = "--";
      if (A !== void 0 && A !== "unknown" && A !== "unavailable" && A !== "") {
        if (l.numeric ?? !0) {
          const f = Number.parseFloat(A);
          g = Number.isNaN(f) ? "--" : f.toFixed(m);
        } else g = A;
        g !== "--" && p && (g += ` ${p}`);
      }
      for (const f of _(i.type, s.w, s.h, Z(), c, h))
        f.role === "icon" ? C(f, String(l.icon ?? ""), I(f.color)) : f.role === "label" ? C(f, String(l.label || se(i.entity)), I(f.color)) : f.role === "value" && C(f, g, I(f.color));
      break;
    }
    case "binary_indicator": {
      w();
      const p = tt(A), m = String(l.text_on || a.on), g = String(l.text_off || a.off), f = i.style ?? {}, v = A === void 0 ? B.icon : p ? f.icon_on ? B.icon_on : o.color(l.alert_on ?? !0 ? "error" : "accent") : f.icon ? B.icon : o.color("on");
      for (const u of _(i.type, s.w, s.h, Z(), c, h))
        u.role === "icon" ? C(u, String(l.icon ?? ""), v) : u.role === "label" ? C(u, String(l.label || se(i.entity)), I(u.color)) : u.role === "state" && C(u, ht(A, a, m, g), I(u.color));
      break;
    }
    case "clock": {
      for (const p of _(i.type, s.w, s.h, Z(), c, h)) {
        const m = p.role === "time" ? yi(e.now, String(l.format ?? "HH:mm")) : dn(e.now, r.settings?.language ?? "de");
        C(p, m, I(p.color));
      }
      break;
    }
    case "label": {
      l.background && w();
      for (const p of _(i.type, s.w, s.h, Z(), c, h)) C(p, String(l.text ?? ""), I(p.color));
      break;
    }
    case "scene_button": {
      z(!1, !1);
      const p = String(l.label || se(i.action?.target) || i.action?.service || "");
      for (const m of _(i.type, s.w, s.h, Z(), c, h))
        C(m, m.role === "icon" ? String(l.icon ?? "") : p, I(m.color));
      break;
    }
    case "page_button": {
      z(!1, !1);
      const p = r.pages.find((f) => f.id === l.target), m = String(l.label || p?.name || "?"), g = String(l.icon || p?.icon || "");
      for (const f of _(i.type, s.w, s.h, Z({ icon: g }), c, h))
        C(f, f.role === "icon" ? g : m, I(f.color));
      break;
    }
    case "page_title": {
      const p = !!(t.parent && (l.show_back ?? !0));
      for (const m of _(i.type, s.w, s.h, Z({ _has_back: p }), c, h))
        C(m, m.role === "back" ? "mdi:chevron-left" : t.name, I(m.color));
      break;
    }
    case "cover_control": {
      w();
      const p = ye(k, "current_position"), m = p !== null ? `${Math.round(p)} %` : ht(A, a), g = { up: "mdi:arrow-up", stop: "mdi:stop", down: "mdi:arrow-down" };
      for (const f of _(i.type, s.w, s.h, Z(), c, h))
        f.role === "label" ? C(f, String(l.label || se(i.entity)), I(f.color)) : f.role === "state" ? C(f, m, I(f.color)) : o.smallButton(b, f, g[f.role], B.circle_bg, B.icon_on, B.radius);
      break;
    }
    case "media_player": {
      w();
      const p = r.settings?.language === "en" ? "en" : "de", m = Je.media, g = (T) => typeof T == "string" && T !== "" && T !== "unknown" && T !== "unavailable" ? T : null, f = g(k?.attributes.media_title) ?? String(l.label || se(i.entity)), v = g(k?.attributes.media_artist) ?? (m[A ?? ""] ?? m.unavailable)[p], u = ye(k, "volume_level"), j = { prev: "mdi:skip-previous", play: A === "playing" ? "mdi:pause" : "mdi:play", next: "mdi:skip-next" };
      for (const T of _(i.type, s.w, s.h, Z(), c, h))
        T.role === "title" ? C(T, f, I(T.color)) : T.role === "artist" ? C(T, v, I(T.color)) : T.role === "volume" ? o.slider(b, T, u === null ? 0 : u, B.track, B.fill, B.knob) : o.smallButton(b, T, j[T.role], B.circle_bg, B.icon_on, B.radius);
      break;
    }
    case "climate": {
      w();
      const p = r.settings?.language === "en" ? "en" : "de", m = Je.climate, g = A === "unavailable" ? a.unavailable : A && m[A] ? m[A][p] : a.unknown, f = ye(k, "current_temperature"), v = ye(k, "temperature");
      for (const u of _(i.type, s.w, s.h, Z(), c, h))
        u.role === "label" ? C(u, String(l.label || se(i.entity)), I(u.color)) : u.role === "state" ? C(u, f !== null ? `${g} · ${f.toFixed(1)}°` : g, I(u.color)) : u.role === "value" ? C(u, v !== null ? `${v.toFixed(1)}°` : "--", I(u.color)) : o.smallButton(b, u, u.role === "plus" ? "mdi:plus" : "mdi:minus", B.circle_bg, B.icon_on, B.radius);
      break;
    }
    case "slider": {
      w();
      const p = mn(i, k), m = ["input_number", "number"].includes((i.entity ?? "").split(".")[0]), g = m ? Number(l.min ?? 0) : 0, f = m ? Number(l.max ?? 100) : 100, v = m ? String(l.unit ?? "") : "%";
      for (const u of _(i.type, s.w, s.h, Z(), c, h))
        u.role === "label" ? C(u, String(l.label || se(i.entity)), I(u.color)) : u.role === "value" ? C(u, p === null ? "--" : `${Math.round(p)}${v ? ` ${v}` : ""}`, I(u.color)) : o.slider(b, u, p === null ? 0 : (p - g) / Math.max(f - g, 1), B.track, B.fill, B.knob);
      break;
    }
    case "gauge": {
      w();
      const p = Number(l.min ?? 0), m = Math.max(Number(l.max ?? 100), p + 1), g = A !== void 0 ? Number.parseFloat(A) : Number.NaN, f = String(l.unit ?? ""), v = Math.max(0, Math.min(Number(l.decimals ?? 0), 2));
      for (const u of _(i.type, s.w, s.h, Z(), c, h))
        u.kind === "arc" ? o.arc(b, u, Number.isNaN(g) ? 0 : (Math.round(Math.min(m, Math.max(p, g))) - p) / (m - p), B.track, B.fill) : u.role === "value" ? C(u, Number.isNaN(g) ? "--" : `${g.toFixed(v)}${f ? ` ${f}` : ""}`, I(u.color)) : u.role === "label" && C(u, String(l.label || se(i.entity)), I(u.color));
      break;
    }
    case "weather": {
      w();
      const p = r.settings?.language === "en" ? "en" : "de", m = Je.weather, g = A && m[A] || Je.weather_unknown, f = ye(k, "temperature"), v = l.show_humidity ?? !0 ? ye(k, "humidity") : null, u = v !== null ? `${g[p]} · ${Math.round(v)} %` : g[p];
      for (const j of _(i.type, s.w, s.h, Z(), c, h))
        j.role === "icon" ? C(j, g.icon, I(j.color)) : j.role === "value" ? C(j, f !== null ? `${f.toFixed(0)}°` : "--", I(j.color)) : j.role === "state" && C(j, u, I(j.color));
      break;
    }
    case "multi_value": {
      w();
      const p = fn(i), m = Math.max(0, Math.min(Number(l.decimals ?? 1), 2));
      for (const g of _(i.type, s.w, s.h, Z({ _count: p.length }), c, h)) {
        const f = p[Number(g.role.slice(-1))];
        if (f)
          if (g.role.startsWith("label")) C(g, f.label || se(f.entity), I(g.color));
          else {
            const v = Number.parseFloat(e.state(f.entity)?.state ?? "");
            C(g, Number.isNaN(v) ? "--" : `${v.toFixed(m)}${f.unit ? ` ${f.unit}` : ""}`, I(g.color));
          }
      }
      break;
    }
    case "number_stepper": {
      w();
      const p = A !== void 0 ? Number.parseFloat(A) : Number.NaN, m = String(l.unit ?? ""), g = Math.max(0, Math.min(Number(l.decimals ?? 0), 2));
      for (const f of _(i.type, s.w, s.h, Z(), c, h))
        f.role === "label" ? C(f, String(l.label || se(i.entity)), I(f.color)) : f.role === "value" ? C(f, Number.isNaN(p) ? "--" : `${p.toFixed(g)}${m ? ` ${m}` : ""}`, I(f.color)) : f.kind === "button" && o.smallButton(b, f, f.role === "plus" ? "mdi:plus" : "mdi:minus", B.circle_bg, B.icon_on, B.radius);
      break;
    }
    case "select": {
      w();
      const p = !A || A === "unknown" || A === "unavailable" ? "--" : A;
      for (const m of _(i.type, s.w, s.h, Z(), c, h))
        m.role === "label" ? C(m, String(l.label || se(i.entity)), I(m.color)) : m.role === "value" ? C(m, p, I(m.color)) : m.kind === "button" && o.smallButton(b, m, m.role === "plus" ? "mdi:chevron-right" : "mdi:chevron-left", B.circle_bg, B.icon_on, B.radius);
      break;
    }
    case "countdown": {
      w();
      const { remaining: p, total: m } = An(i, k, e.now), g = p < 0 ? "–" : p >= 3600 ? `${Math.floor(p / 3600)}:${de(Math.floor(p / 60) % 60)}:${de(p % 60)}` : `${de(Math.floor(p / 60))}:${de(p % 60)}`;
      for (const f of _(i.type, s.w, s.h, Z(), c, h))
        f.role === "label" ? C(f, String(l.label || se(i.entity)), I(f.color)) : f.role === "value" ? C(f, g, I(f.color)) : f.kind === "bar" && o.bar(b, f, p < 0 || m <= 0 ? 0 : (m - p) / m, B.track, B.fill);
      break;
    }
    case "person_presence": {
      w();
      const p = A === "home", m = String(l.text_on || (r.settings?.language === "en" ? "Home" : "Zuhause")), g = String(l.text_off || (r.settings?.language === "en" ? "Away" : "Unterwegs"));
      for (const f of _(i.type, s.w, s.h, Z(), c, h))
        f.role === "icon" ? C(f, String(l.icon || "mdi:account"), p ? B.icon_on : B.icon, p) : f.role === "label" ? C(f, String(l.label || se(i.entity)), I(f.color)) : f.role === "state" && C(f, A === void 0 ? a.unknown : p ? m : g, I(f.color));
      break;
    }
    case "qr_code": {
      const p = i.entity && A || String(l.text || " ");
      for (const m of _(i.type, s.w, s.h, Z(), c, h))
        m.kind === "qr" ? o.qr(b, m, p) : C(m, String(l.label ?? ""), I(m.color));
      break;
    }
    case "divider": {
      for (const p of _(i.type, s.w, s.h, Z(), c, h)) {
        const m = oe(b, p.width ?? 10, p.height ?? 2, p.align, p.x, p.y);
        o.box({ x: m.x, y: m.y, w: p.width ?? 10, h: p.height ?? 2 }, B.sub, null, 1, 0, 0.5);
      }
      break;
    }
    case "spacer":
      break;
    case "notification_area": {
      w();
      const p = e.message, m = String(l.empty_text || (r.settings?.language === "en" ? "No messages" : "Keine Meldungen"));
      for (const g of _(i.type, s.w, s.h, Z(), c, h))
        g.role === "icon" ? C(g, String(l.icon || "mdi:bell-outline"), I(g.color)) : g.role === "label" ? C(g, p?.title || m, I(g.color)) : g.role === "state" && C(g, p?.text ?? "", I(g.color));
      break;
    }
    case "button_grid": {
      w();
      const p = bn(i);
      for (const m of _(i.type, s.w, s.h, Z({ _count: p.length }), c, h)) {
        const g = p[Number(m.role.slice(3))];
        if (!m.label_size) {
          o.smallButton(b, m, g.icon || "mdi:gesture-tap", B.circle_bg, B.icon_on, B.radius);
          continue;
        }
        const f = oe(b, m.width ?? 20, m.height ?? 20, m.align, m.x, m.y), v = { x: f.x, y: f.y, w: m.width ?? 20, h: m.height ?? 20 };
        o.box(v, B.circle_bg, null, Math.min(B.radius, 10), 0);
        const u = X(m.label_size);
        o.element(v, { ...m, kind: "icon", align: "CENTER", x: 0, y: -Math.floor(u / 2), width: null }, g.icon || "mdi:gesture-tap", B.icon_on), o.element(v, {
          kind: "text",
          role: "text",
          align: "BOTTOM_MID",
          x: 0,
          y: -2,
          size: m.label_size,
          color: "text",
          width: Math.max(v.w - 4, 1),
          text_align: "center"
        }, g.label || se(g.target), B.text);
      }
      break;
    }
    default:
      o.box(s, null, o.color("warning"), B.radius, 1);
  }
}
function un(o, e, t, i) {
  const { project: s, board: r, theme: n } = e, l = s.pages.find((b) => b.id === s.navigation?.home_page) ?? s.pages[0], a = ze(s, l, r.width, r.height), c = n.font_sizes, h = n.icon_sizes;
  if (a.header) {
    const b = a.header;
    s.background?.image || o.box(b, o.color("header_bg"), null, 0, 0);
    const k = { x: b.x + Pt, y: b.y, w: b.w - 2 * Pt, h: b.h };
    for (const A of Cs(s, b, c, h))
      if (A.role === "back") {
        if (t.parent) {
          const x = o.element(k, A, "mdi:chevron-left", o.color(A.color));
          x && i.push({ kind: "back", id: t.parent, rect: x });
        }
      } else A.role === "title" ? o.element(k, A, t.name, o.color(A.color)) : A.role === "time" ? o.element(k, A, yi(e.now, "HH:mm"), o.color(A.color)) : A.role === "text" && o.element(k, A, s.name, o.color(A.color));
  }
  if (a.tabbar) {
    o.box(a.tabbar, o.color("nav_bg"), null, 0, 0, s.background?.image ? 0.8 : 1);
    const b = nt(s), k = mi(s, t), A = s.navigation?.show_icons ?? !0, x = s.navigation?.show_labels ?? !0;
    b.forEach((E, F) => {
      const B = a.tabs[F], Z = E.id === k.id ? o.color("nav_active") : o.color("nav_inactive");
      for (const I of Ts(A, x, B, c, h))
        o.element(B, I, I.kind === "icon" ? E.icon ?? "" : E.name, Z);
      i.push({ kind: "tab", id: E.id, rect: B });
    });
  }
}
function xi(o) {
  const e = /* @__PURE__ */ new Map();
  let t = 0;
  for (const i of o.pages)
    for (const s of i.widgets) {
      for (const a of [2, 3]) {
        const c = s.props?.[`entity_${a}`];
        typeof c == "string" && !e.has(c) && e.set(c, { entity_id: c, state: String(40 + a * 11), attributes: {} });
      }
      if (!s.entity || e.has(s.entity)) continue;
      const r = s.entity.split(".")[0];
      let n = t % 2 === 0 ? "on" : "off";
      (r === "sensor" || r === "input_number" || r === "number") && (n = String(20 + t * 7 % 10 + 0.5)), r === "cover" && (n = t % 2 === 0 ? "open" : "closed"), r === "binary_sensor" && (n = "off");
      const l = {};
      r === "light" && n === "on" && (l.brightness = 204), r === "light" && Object.assign(l, { supported_color_modes: ["color_temp", "hs"], color_temp_kelvin: 3e3, hs_color: [30, 80] }), r === "cover" && (l.current_position = n === "open" ? 60 : 0), r === "fan" && n === "on" && (l.percentage = 50), r === "climate" && (n = "heat", l.temperature = 21.5, l.current_temperature = 20.8), r === "weather" && (n = "partlycloudy", l.temperature = 17, l.humidity = 62), r === "media_player" && (n = "playing", Object.assign(l, { volume_level: 0.35, media_title: "Bohemian Rhapsody", media_artist: "Queen" })), (r === "input_number" || r === "number") && (n = "21"), r === "counter" && (n = "3"), (r === "input_select" || r === "select") && (n = "Komfort"), (r === "person" || r === "device_tracker") && (n = t % 2 === 0 ? "home" : "not_home"), r === "timer" && (n = "active", l.duration = "1:30:00", l.finishes_at = "2026-09-24T09:22:40+00:00"), r === "sensor" && /fertig|finish|ende|end/i.test(s.entity) && (n = "2026-09-24T08:45:00+00:00"), e.set(s.entity, { entity_id: s.entity, state: n, attributes: l }), t++;
    }
  return (i) => e.get(i);
}
const At = {
  light: ["brightness", 1],
  cover: ["current_position", 2],
  fan: ["percentage", 3]
};
function Ei(o, e) {
  if (!o || !e) return null;
  const t = At[o.split(".")[0]];
  if (!t) return null;
  const i = Number(e.attributes[t[0]]);
  return e.attributes[t[0]] === void 0 || e.attributes[t[0]] === null || Number.isNaN(i) ? null : Math.round(t[1] === 1 ? i * 100 / 255 : i);
}
function pn(o, e, t, i) {
  if (t.light) {
    gn(o, e, t.title, t.value, t.light, i);
    return;
  }
  const { board: s, theme: r } = e, n = o.ctx;
  n.fillStyle = "rgba(0,0,0,0.6)", n.fillRect(0, 0, s.width, s.height), i.push({ kind: "overlay-close", id: "backdrop", rect: { x: 0, y: 0, w: s.width, h: s.height } });
  const { panel: l, elements: a } = zs(s.width, s.height, r.font_sizes, r.icon_sizes);
  o.box(l, o.color("tile"), o.color("border"), r.radius ?? 8, r.border_width ?? 0), i.push({ kind: "overlay-panel", id: "panel", rect: l });
  const c = kt(l, re), h = Math.max(0, Math.min(100, Math.round(t.value)));
  for (const b of a)
    if (b.role === "title") o.element(c, b, t.title, o.color(b.color));
    else if (b.role === "close") {
      const k = o.element(c, b, "mdi:close", o.color(b.color));
      k && i.push({ kind: "overlay-close", id: "close", rect: k });
    } else if (b.role === "value") o.element(c, b, `${h} %`, o.color(b.color));
    else if (b.role === "slider") {
      const k = b.width ?? 100, A = b.height ?? 18, x = oe(c, k, A, b.align, b.x, b.y), E = { x: x.x, y: x.y, w: k, h: A }, F = Math.floor(A / 2);
      o.box(E, o.color("border"), null, F, 0);
      const B = Math.round(k * h / 100);
      B > 0 && o.box({ ...E, w: Math.max(B, A) }, o.color("accent"), null, F, 0);
      const Z = A + 8;
      o.box({ x: x.x + B - Math.floor(Z / 2), y: x.y - 4, w: Z, h: Z }, o.color("text"), null, Z, 0), i.push({ kind: "overlay-slider", id: "slider", rect: E });
    }
}
function gn(o, e, t, i, s, r) {
  const { board: n, theme: l } = e, a = o.ctx;
  a.fillStyle = "rgba(0,0,0,0.6)", a.fillRect(0, 0, n.width, n.height), r.push({ kind: "overlay-close", id: "backdrop", rect: { x: 0, y: 0, w: n.width, h: n.height } });
  const { panel: c, elements: h } = Ns(n.width, n.height, l.font_sizes, l.icon_sizes);
  o.box(c, o.color("tile"), o.color("border"), l.radius ?? 8, l.border_width ?? 0), r.push({ kind: "overlay-panel", id: "panel", rect: c });
  const b = kt(c, re), k = Object.fromEntries(ft), A = { brightness: i, ct: s.ct, hue: s.hue }, x = (E) => E === "ct" ? s.hasCt : E === "hue" ? s.hasHs : !0;
  for (const E of h) {
    const F = E.role.replace(/_(icon|value)$/, "");
    if (E.role === "title") o.element(b, E, t, o.color(E.color));
    else if (E.role === "close") {
      const B = o.element(b, E, "mdi:close", o.color(E.color));
      B && r.push({ kind: "overlay-close", id: "close", rect: B });
    } else if (x(F)) {
      if (E.role.endsWith("_icon")) o.element(b, E, k[F], o.color(E.color));
      else if (E.role.endsWith("_value")) {
        const [B, Z, I] = bt[F], C = Math.round(Math.max(B, Math.min(Z, A[F])));
        o.element(b, E, F === "hue" ? `${C}${I}` : `${C} ${I}`, o.color(E.color));
      } else if (E.kind === "slider") {
        const [B, Z] = bt[F], I = E.width ?? 100, C = E.height ?? 18, w = oe(b, I, C, E.align, E.x, E.y), z = { x: w.x, y: w.y, w: I, h: C }, p = Math.floor(C / 2), m = Math.max(0, Math.min(1, (A[F] - B) / (Z - B))), g = Math.round(I * m);
        if (F === "brightness")
          o.box(z, o.color("border"), null, p, 0), g > 0 && o.box({ ...z, w: Math.max(g, C) }, o.color("accent"), null, p, 0);
        else {
          const v = F === "ct" ? rn : on, u = a.createLinearGradient(z.x, 0, z.x + I, 0);
          v.forEach((j, T) => u.addColorStop(Math.floor(T * 100 / (v.length - 1)) / 100, j)), a.save(), a.beginPath(), a.roundRect(z.x, z.y, I, C, p), a.clip(), a.fillStyle = u, a.fillRect(z.x, z.y, I, C), a.restore();
        }
        const f = C + 8;
        o.box({ x: w.x + g - Math.floor(f / 2), y: w.y - 4, w: f, h: f }, o.color("text"), null, f, 0), r.push({ kind: "overlay-slider", id: F, rect: z });
      }
    } else continue;
  }
}
const Je = $s;
function ye(o, e) {
  const t = o?.attributes[e];
  if (t == null || t === "") return null;
  const i = Number(t);
  return Number.isNaN(i) ? null : i;
}
function mn(o, e) {
  const t = (o.entity ?? "").split(".")[0];
  if (!e) return null;
  if (t === "input_number" || t === "number") {
    const l = Number.parseFloat(e.state);
    return Number.isNaN(l) ? null : l;
  }
  const i = {
    light: ["brightness", 1],
    cover: ["current_position", 2],
    fan: ["percentage", 2],
    media_player: ["volume_level", 3]
  }, [s, r] = i[t] ?? ["", 2], n = ye(e, s);
  return n === null || (r === 1 || r === 3) && e.state === "off" ? 0 : r === 1 ? n * 100 / 255 : r === 3 ? n * 100 : n;
}
function fn(o) {
  const e = o.props ?? {}, t = [];
  o.entity && t.push({ entity: o.entity, label: String(e.label ?? ""), unit: String(e.unit ?? "") });
  for (const i of [2, 3]) {
    const s = e[`entity_${i}`];
    s && t.push({ entity: String(s), label: String(e[`label_${i}`] ?? ""), unit: String(e[`unit_${i}`] ?? "") });
  }
  return t;
}
const vn = {
  scene: "scene.turn_on",
  script: "script.turn_on",
  button: "button.press",
  input_button: "input_button.press",
  automation: "automation.trigger"
};
function bn(o) {
  const e = o.props ?? {}, t = Math.max(1, Math.min(Math.trunc(Number(e.count ?? 4)), 6)), i = [];
  for (let s = 1; s <= t; s++) {
    const r = String(e[`target_${s}`] ?? "");
    let n = String(e[`service_${s}`] ?? "") || vn[r.split(".")[0]] || "";
    r && !n && (n = "homeassistant.toggle"), i.push({ label: String(e[`label_${s}`] ?? ""), icon: String(e[`icon_${s}`] ?? ""), target: r, service: n });
  }
  return i;
}
function ti(o) {
  if (!o) return -1;
  const e = Date.parse(o.includes("T") || o.includes("+") || o.endsWith("Z") ? o : o.replace(" ", "T"));
  return Number.isNaN(e) ? -1 : Math.floor(e / 1e3);
}
function ii(o) {
  const e = /^(\d+):(\d+):(\d+)/.exec(String(o ?? ""));
  return e ? Number(e[1]) * 3600 + Number(e[2]) * 60 + Number(e[3]) : -1;
}
function An(o, e, t) {
  const i = Math.floor(t.getTime() / 1e3);
  if (!e) return { remaining: -1, total: -1 };
  if ((o.entity ?? "").startsWith("timer.")) {
    const r = ii(e.attributes.duration);
    if (e.state === "active") {
      const n = ti(String(e.attributes.finishes_at ?? ""));
      return { remaining: n > 0 ? Math.max(0, n - i) : -1, total: r };
    }
    return e.state === "paused" ? { remaining: ii(e.attributes.remaining), total: r } : { remaining: -1, total: r };
  }
  const s = ti(e.state);
  return { remaining: s > 0 ? Math.max(0, s - i) : -1, total: -1 };
}
function yn(o, e, t, i) {
  const { board: s, theme: r } = e, n = o.ctx;
  n.fillStyle = "rgba(0,0,0,0.5)", n.fillRect(0, 0, s.width, s.height), i.push({ kind: "overlay-close", id: "message", rect: { x: 0, y: 0, w: s.width, h: s.height } });
  const { panel: l, elements: a } = Ds(s.width, s.height, r.font_sizes, r.icon_sizes);
  o.box(l, o.color("tile"), o.color("accent"), r.radius ?? 8, 2);
  const c = { x: l.x + re, y: l.y + re, w: l.w - 2 * re, h: l.h - 2 * re };
  for (const h of a)
    h.role === "icon" ? o.element(c, h, "mdi:bell-ring-outline", o.color("accent")) : h.role === "title" ? o.element(c, h, t.title, o.color("text")) : o.element(c, h, t.text, o.color("text_muted"));
}
async function wn(o, e, t) {
  const i = URL.createObjectURL(o);
  try {
    const s = await new Promise((h, b) => {
      const k = new Image();
      k.onload = () => h(k), k.onerror = () => b(new Error("image")), k.src = i;
    }), r = Math.max(e / s.naturalWidth, t / s.naturalHeight), n = s.naturalWidth * r, l = s.naturalHeight * r, a = document.createElement("canvas");
    a.width = e, a.height = t;
    const c = a.getContext("2d");
    return c.imageSmoothingQuality = "high", c.drawImage(s, (e - n) / 2, (t - l) / 2, n, l), a.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(i);
  }
}
function Mi(o) {
  const e = [];
  for (const t of [o.background, ...o.pages.map((i) => i.background)])
    t?.image && !e.includes(t.image) && e.push(t.image);
  return e;
}
async function Ii(o, e, t = {}) {
  const i = { ...t };
  return await Promise.all(Mi(e).filter((s) => !i[s]).map(async (s) => {
    try {
      const { data_url: r } = await o.getAsset(e.id, s), n = new Image();
      n.src = r, await n.decode(), i[s] = n;
    } catch {
    }
  })), i;
}
class xn extends ae {
  static properties = {
    api: { attribute: !1 },
    projectId: {},
    deviceName: {},
    compact: { type: Boolean },
    collapsed: { type: Boolean },
    status: { attribute: !1 },
    _busy: { state: !0 },
    _done: { state: !0 },
    _copied: { state: !0 }
  };
  timer;
  constructor() {
    super(), this.compact = !1, this.collapsed = !1, this.status = null, this._busy = !1, this._done = !1, this._copied = !1;
  }
  static styles = be`
    :host { display: block; font-size: 13px; }
    .row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .warn { color: var(--warning-color, #f59e0b); }
    .ok { color: var(--success-color, #22c55e); }
    .muted { color: var(--secondary-text-color); }
    details { margin-top: 2px; }
    summary { cursor: pointer; color: var(--secondary-text-color); }
    ol { margin: 6px 0; padding-left: 20px; line-height: 1.5; }
    code { font-size: 12px; }
    a { color: var(--primary-color); }
    .btn2 { background: var(--primary-color); border-color: var(--primary-color); color: var(--text-primary-color, #000); }
    .banner { padding: 8px 12px; border-radius: 8px; border: 1px solid var(--warning-color, #f59e0b);
      background: rgba(245, 158, 11, .1); }
    button { font: inherit; padding: 4px 10px; border-radius: 6px; border: 1px solid var(--warning-color, #f59e0b);
      background: var(--warning-color, #f59e0b); color: #111; cursor: pointer; }
    button:disabled { opacity: .5; }
  `;
  connectedCallback() {
    super.connectedCallback(), this.status || this.refresh(), this.compact || (this.timer = window.setInterval(() => void this.refresh(), 1e4));
  }
  disconnectedCallback() {
    super.disconnectedCallback(), window.clearInterval(this.timer);
  }
  async copyKey() {
    const t = (await this.api.project(this.projectId)).settings?.api_key;
    t && (await navigator.clipboard.writeText(t), this._copied = !0, setTimeout(() => this._copied = !1, 2500));
  }
  keyButton() {
    return y`<button class="btn2" @click=${() => this.copyKey()}>${this._copied ? d("key_copied") : d("copy_key")}</button>`;
  }
  guideNotFound() {
    return y`<details ?open=${!this.compact && !this.collapsed}>
      <summary>○ ${d("device_not_found", { name: this.deviceName })} – ${d("how_to_connect")}</summary>
      <ol>
        <li>${d("connect_step_flash")}</li>
        <li>${d("connect_step_discovered")} <a href="/config/integrations/dashboard" target="_top">${d("open_integrations")}</a></li>
        <li>${d("connect_step_key")} ${this.keyButton()}</li>
        <li>${d("connect_step_manual")}</li>
      </ol>
    </details>`;
  }
  guideOffline() {
    return y`<details>
      <summary>◐ ${d("device_offline")} – ${d("what_to_do")}</summary>
      <ol>
        <li>${d("offline_step_power")}</li>
        <li>${d("offline_step_key")} ${this.keyButton()}</li>
      </ol>
    </details>`;
  }
  async refresh() {
    try {
      this.status = (await this.api.devices())[this.projectId] ?? null;
    } catch {
      this.status = null;
    }
  }
  async allow() {
    const e = this.status;
    if (!(!e?.found || !confirm(d("allow_actions_confirm", { device: e.title ?? this.deviceName })))) {
      this._busy = !0;
      try {
        this.status = await this.api.allowActions(this.projectId), this._done = !0;
      } finally {
        this._busy = !1;
      }
    }
  }
  render() {
    const e = this.status;
    return e ? e.found ? e.actions_allowed ? this._done ? y`<div class="ok">✓ ${d("actions_allowed_done")}</div>` : e.loaded ? y`<div class="ok">● ${d("device_connected")}</div>` : this.guideOffline() : y`<div class="row ${this.compact ? "warn" : "banner warn"}">
        <span>⚠ ${d("actions_blocked")}</span>
        <button ?disabled=${this._busy} @click=${() => this.allow()}>${d("allow_actions")}</button></div>` : this.guideNotFound() : Y;
  }
}
customElements.define("cyd-device-status", xn);
class En extends ae {
  static properties = {
    api: { attribute: !1 },
    boards: { attribute: !1 },
    themes: { attribute: !1 },
    _projects: { state: !0 },
    _thumbs: { state: !0 },
    _devices: { state: !0 },
    _design: { state: !0 },
    _undo: { state: !0 }
  };
  constructor() {
    super(), this._projects = null, this._thumbs = {}, this._devices = {}, this._design = null, this._undo = null;
  }
  static styles = be`
    :host { display: block; padding: 24px; max-width: 1200px; margin: 0 auto; color: var(--primary-text-color); }
    .head { display: flex; gap: 8px; align-items: center; margin-bottom: 20px; flex-wrap: wrap; }
    .head h1 { flex: 1; margin: 0; font-size: 24px; font-weight: 500; }
    button { font: inherit; padding: 7px 12px; border-radius: 6px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); cursor: pointer; }
    button.primary { background: var(--primary-color); color: var(--text-primary-color, #000); border-color: var(--primary-color); }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .card { background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; }
    .thumb { background: #000; display: flex; justify-content: center; align-items: center; height: 180px; cursor: pointer; }
    .thumb img { image-rendering: pixelated; max-width: 100%; max-height: 180px; }
    .info { padding: 12px; display: flex; flex-direction: column; gap: 4px; }
    .name { font-size: 16px; font-weight: 500; }
    .meta { font-size: 12px; color: var(--secondary-text-color); }
    .badge { align-self: flex-start; font-size: 11px; padding: 2px 8px; border-radius: 10px; margin-top: 4px;
      background: rgba(127,127,127,.15); color: var(--secondary-text-color); }
    .badge.changed { background: color-mix(in srgb, var(--warning-color, #f59e0b) 18%, transparent); color: var(--warning-color, #f59e0b); }
    .badge.ok { background: color-mix(in srgb, var(--success-color, #22c55e) 18%, transparent); color: var(--success-color, #22c55e); }
    .actions { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; padding: 0 12px 12px; margin-top: auto; }
    .actions .open { grid-column: 1 / -1; }
    button.quiet { border-color: transparent; background: transparent; font-size: 12px; padding: 6px 4px; white-space: nowrap; color: var(--secondary-text-color); }
    button.quiet:hover { color: var(--primary-text-color); background: rgba(127,127,127,.12); }
    button.quiet.danger:hover { color: var(--error-color, #ef4444); }
    .card { transition: border-color .15s, transform .15s; }
    .card:hover { border-color: var(--primary-color); }
    .info { flex: 1; }
    .notice { display: flex; gap: 12px; align-items: center; padding: 10px 14px; margin-bottom: 16px; border-radius: 10px;
      background: color-mix(in srgb, var(--success-color, #22c55e) 14%, transparent); }
    .notice span { flex: 1; }
    .backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 10; padding: 16px; }
    .dialog { background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 12px; padding: 20px;
      width: min(480px, 100%); display: flex; flex-direction: column; gap: 12px; }
    .dialog h2 { margin: 0; font-size: 18px; font-weight: 500; }
    .dialog p { margin: 0; font-size: 13px; color: var(--secondary-text-color); line-height: 1.45; }
    .dialog select { font: inherit; padding: 7px 8px; border-radius: 6px; border: 1px solid var(--divider-color);
      background: var(--card-background-color); color: var(--primary-text-color); }
    .dialog .warn { color: var(--warning-color, #f59e0b); }
    .dialog .buttons { display: flex; gap: 8px; justify-content: flex-end; }
    .empty { padding: 48px; text-align: center; color: var(--secondary-text-color); border: 2px dashed var(--divider-color); border-radius: 12px; }
  `;
  connectedCallback() {
    super.connectedCallback(), this.refresh();
  }
  async refresh() {
    this._projects = await this.api.projects(), this._devices = await this.api.devices().catch(() => ({}));
    for (const e of this._projects) this.thumb(e.id);
  }
  async thumb(e) {
    const t = Tt(await this.api.project(e)), i = this.boards[t.board], s = this.themes[t.theme];
    if (!i || !s) return;
    const r = document.createElement("canvas");
    wi(r, {
      project: t,
      board: gi(i, t.board_variant, t.orientation),
      theme: { ...s, colors: { ...s.colors, ...t.theme_overrides ?? {} } },
      pageId: t.navigation?.home_page ?? t.pages[0]?.id ?? "",
      state: xi(t),
      now: /* @__PURE__ */ new Date(),
      images: await Ii(this.api, t)
    }), this._thumbs = { ...this._thumbs, [e]: r.toDataURL() };
  }
  open(e) {
    this.dispatchEvent(new CustomEvent("open-project", { detail: { id: e }, bubbles: !0, composed: !0 }));
  }
  async duplicate(e) {
    await this.api.duplicate(e), await this.refresh();
  }
  async removeProject(e) {
    confirm(d("delete_confirm", { name: e.name })) && (await this.api.remove(e.id), await this.refresh());
  }
  async exportFile(e) {
    const t = await this.api.project(e), i = {};
    for (const l of Mi(t))
      try {
        i[l] = (await this.api.getAsset(e, l)).data_url;
      } catch {
      }
    const s = { ...t, settings: { ...t.settings, api_key: null }, _assets: i }, r = new Blob([JSON.stringify(s, null, 2)], { type: "application/json" }), n = document.createElement("a");
    n.href = URL.createObjectURL(r), n.download = `${t.device_name}.cydstudio.json`, n.click(), URL.revokeObjectURL(n.href);
  }
  /** Let the user pick a file; resolves with its name and text (null when cancelled). */
  pickFile(e) {
    return new Promise((t) => {
      const i = document.createElement("input");
      i.type = "file", i.accept = e, i.onchange = async () => {
        const s = i.files?.[0];
        t(s ? { name: s.name, text: await s.text() } : null);
      }, i.click();
    });
  }
  async importFile() {
    const e = await this.pickFile(".json,.yaml,.yml");
    if (e)
      try {
        let t;
        if (e.name.endsWith(".json")) {
          const { _assets: i, ...s } = JSON.parse(e.text);
          t = await this.api.importProject(s, i);
        } else t = await this.api.importYaml(e.text);
        this.open(t.id);
      } catch (t) {
        alert(String(t.message ?? t));
      }
  }
  async loadDesignFile() {
    const e = await this.pickFile(".json"), t = this._design;
    if (t) {
      if (!e) {
        this._design = { ...t };
        return;
      }
      try {
        const i = JSON.parse(e.text);
        if (!Array.isArray(i.pages)) throw new Error(d("design_file_invalid"));
        this._design = { ...t, source: "file", file: i };
      } catch (i) {
        this._design = { ...t }, alert(String(i.message ?? i));
      }
    }
  }
  async applyDesign() {
    const e = this._design;
    if (!(!e || !e.source || e.source === "file" && !e.file)) {
      this._design = { ...e, busy: !0 };
      try {
        if (e.source === "file") {
          const { _assets: t, ...i } = e.file;
          await this.api.applyDesign(e.target.id, { project: i, assets: t });
        } else
          await this.api.applyDesign(e.target.id, { source_project_id: e.source });
        this._undo = { id: e.target.id, name: e.target.name }, this._design = null, await this.refresh();
      } catch (t) {
        this._design = { ...e, busy: !1 }, alert(String(t.message ?? t));
      }
    }
  }
  async undoDesign() {
    const e = this._undo;
    if (!e) return;
    const [t] = await this.api.history(e.id);
    t && await this.api.restore(e.id, t.index), this._undo = null, await this.refresh();
  }
  /** Source differs in board or orientation from the target: the grid may not fit the same way. */
  designMismatch() {
    const e = this._design;
    if (!e) return !1;
    const t = e.source === "file" ? e.file : this._projects?.find((s) => s.id === e.source);
    if (!t) return !1;
    const i = (s) => (s ?? "landscape").startsWith("portrait");
    return t.board !== e.target.board || i(t.orientation) !== i(e.target.orientation);
  }
  renderDesignDialog() {
    const e = this._design, t = (this._projects ?? []).filter((i) => i.id !== e.target.id);
    return y`<div class="backdrop" @click=${(i) => {
      i.target === i.currentTarget && !e.busy && (this._design = null);
    }}>
      <div class="dialog">
        <h2>${d("design_apply_title", { name: e.target.name })}</h2>
        <p>${d("design_apply_text")}</p>
        <select @change=${(i) => {
      const s = i.target.value;
      s === "file" ? this.loadDesignFile() : this._design = { ...e, source: s, file: null };
    }}>
          <option value="" ?selected=${!e.source}>${d("design_choose_source")}</option>
          ${t.map((i) => y`<option value=${i.id} ?selected=${e.source === i.id}>${i.name} (${i.device_name})</option>`)}
          <option value="file" ?selected=${e.source === "file"}>${e.file ? `${d("design_from_file")}: ${e.file.name}` : `${d("design_from_file")}…`}</option>
        </select>
        ${this.designMismatch() ? y`<p class="warn">${d("design_mismatch")}</p>` : Y}
        <div class="buttons">
          <button ?disabled=${e.busy} @click=${() => {
      this._design = null;
    }}>${d("cancel")}</button>
          <button class="primary" ?disabled=${e.busy || !e.source || e.source === "file" && !e.file} @click=${() => this.applyDesign()}>${d("design_apply")}</button>
        </div>
      </div>
    </div>`;
  }
  render() {
    const e = this._projects;
    return y`
      <div class="head">
        <h1>${d("app_title")}</h1>
        <button @click=${() => this.importFile()}>⤒ ${d("import_file")}</button>
        <button class="primary" @click=${() => this.dispatchEvent(new CustomEvent("new-project", { bubbles: !0, composed: !0 }))}>+ ${d("new_project")}</button>
      </div>
      ${this._undo ? y`<div class="notice"><span>${d("design_applied", { name: this._undo.name })}</span>
        <button @click=${() => this.undoDesign()}>${d("undo")}</button>
        <button class="quiet" @click=${() => {
      this._undo = null;
    }}>✕</button></div>` : Y}
      ${this._design ? this.renderDesignDialog() : Y}
      ${e === null ? y`…` : e.length ? y`<div class="grid">${e.map((t) => y`<div class="card">
          <div class="thumb" @click=${() => this.open(t.id)}>${this._thumbs[t.id] ? y`<img src=${this._thumbs[t.id]} alt="" />` : Y}</div>
          <div class="info">
            <span class="name">${t.name}</span>
            <span class="meta">${this.boards[t.board] ? ne(this.boards[t.board], "name") : t.board} · ${t.device_name}</span>
            <span class="meta">${d("pages_count", { n: t.page_count })} · ${d("widgets_count", { n: t.widget_count })}${t.updated ? ` · ${new Date(t.updated).toLocaleString()}` : ""}</span>
            <cyd-device-status compact .api=${this.api} .projectId=${t.id} .deviceName=${t.device_name}
              .status=${this._devices[t.id] ?? null}></cyd-device-status>
            <span class="badge ${t.exported ? t.changed_since_export ? "changed" : "ok" : "new"}">${t.exported ? t.changed_since_export ? d("changed_since_export") : `✓ ${d("exported")}` : d("never_exported")}</span>
          </div>
          <div class="actions">
            <button class="primary open" @click=${() => this.open(t.id)}>${d("open")}</button>
            <button class="quiet" title=${d("duplicate")} @click=${() => this.duplicate(t.id)}>${d("duplicate")}</button>
            <button class="quiet" title=${d("export_file")} @click=${() => this.exportFile(t.id)}>${d("export_file")}</button>
            <button class="quiet" title=${d("design_apply_hint")} @click=${() => {
      this._design = { target: t, source: "", file: null, busy: !1 };
    }}>${d("design_apply_button")}</button>
            <button class="quiet danger" title=${d("delete")} @click=${() => this.removeProject(t)}>${d("delete")}</button>
          </div>
        </div>`)}</div>` : y`<div class="empty">${d("no_projects")}<br /><br />
        <button class="primary" @click=${() => this.dispatchEvent(new CustomEvent("new-project", { bubbles: !0, composed: !0 }))}>+ ${d("new_project")}</button></div>`}`;
  }
}
customElements.define("cyd-project-list", En);
const Ci = be`
  :host { display: block; position: relative; }
  input { width: 100%; box-sizing: border-box; padding: 8px; border-radius: 6px; border: 1px solid var(--divider-color, #444);
    background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #eee); font: inherit; }
  .list { position: absolute; z-index: 20; left: 0; right: 0; max-height: 320px; overflow: auto; margin-top: 2px;
    background: var(--card-background-color, #1c1c1c); border: 1px solid var(--divider-color, #444); border-radius: 6px;
    box-shadow: 0 6px 18px rgba(0,0,0,.35); }
  .item { padding: 6px 8px; cursor: pointer; display: flex; gap: 8px; align-items: center; }
  .item:hover, .item.active { background: rgba(127,127,127,.18); }
  .main { flex: 1; min-width: 0; }
  .name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sub { font-size: 12px; color: var(--secondary-text-color, #999); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .state { font-size: 12px; color: var(--secondary-text-color, #999); }
  .glyph { font-family: "${Le(De)}"; font-size: 22px; width: 26px; text-align: center; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(40px, 1fr)); gap: 2px; padding: 4px; }
  .grid .item { justify-content: center; padding: 6px 0; }
  .row { display: flex; gap: 6px; align-items: center; }
  .preview { font-family: "${Le(De)}"; font-size: 24px; width: 32px; text-align: center; }
`;
class Mn extends ae {
  static properties = {
    hass: { attribute: !1 },
    value: {},
    domains: { attribute: !1 },
    _open: { state: !0 },
    _query: { state: !0 }
  };
  static styles = Ci;
  constructor() {
    super(), this.value = null, this.domains = [], this._open = !1, this._query = "";
  }
  areaName(e) {
    const t = this.hass.entities?.[e], i = t?.area_id ?? (t?.device_id ? this.hass.devices?.[t.device_id]?.area_id : null);
    return i ? this.hass.areas?.[i]?.name ?? "" : "";
  }
  candidates() {
    const e = this._query.toLowerCase();
    return Object.values(this.hass?.states ?? {}).filter((t) => !this.domains.length || this.domains.includes(t.entity_id.split(".")[0])).map((t) => ({
      id: t.entity_id,
      name: String(t.attributes.friendly_name ?? t.entity_id),
      area: this.areaName(t.entity_id),
      state: `${t.state}${t.attributes.unit_of_measurement ? " " + String(t.attributes.unit_of_measurement) : ""}`
    })).filter((t) => !e || t.id.includes(e) || t.name.toLowerCase().includes(e) || t.area.toLowerCase().includes(e)).sort((t, i) => t.name.localeCompare(i.name)).slice(0, 100);
  }
  render() {
    const e = this.value ? this.hass?.states[this.value] : void 0, t = e ? String(e.attributes.friendly_name ?? this.value) : this.value ?? "";
    return y`
      <input .value=${this._open ? this._query : t} placeholder=${d("pick_entity")}
        @focus=${() => {
      this._open = !0, this._query = "";
    }}
        @input=${(i) => this._query = i.target.value}
        @blur=${() => setTimeout(() => this._open = !1, 150)} />
      ${this.value && !this._open ? y`<div class="sub">${this.value}${e ? y` · ${e.state}` : y` · ⚠`}</div>` : Y}
      ${this._open ? y`<div class="list">
        ${this.candidates().map((i) => y`<div class="item" @mousedown=${() => this.pick(i.id)}>
          <div class="main"><div class="name">${i.name}</div><div class="sub">${i.id}${i.area ? ` · ${i.area}` : ""}</div></div>
          <div class="state">${i.state}</div></div>`)}
      </div>` : Y}`;
  }
  pick(e) {
    this.value = e, this._open = !1, this.dispatchEvent(new CustomEvent("value-changed", { detail: { value: e }, bubbles: !0, composed: !0 }));
  }
}
class In extends ae {
  static properties = {
    value: {},
    _open: { state: !0 },
    _query: { state: !0 }
  };
  static styles = Ci;
  constructor() {
    super(), this.value = "", this._open = !1, this._query = "";
  }
  render() {
    return y`
      <div class="row">
        <span class="preview">${je(this.value) ?? ""}</span>
        <input .value=${this._open ? this._query : this.value} placeholder="mdi:lightbulb"
          @focus=${() => {
      this._open = !0, this._query = this.value?.replace(/^mdi:/, "") ?? "";
    }}
          @input=${(e) => this._query = e.target.value}
          @keydown=${(e) => {
      e.key === "Enter" && this.pick(this._query.startsWith("mdi:") ? this._query : `mdi:${this._query}`);
    }}
          @blur=${() => setTimeout(() => this._open = !1, 150)} />
      </div>
      ${this._open ? y`<div class="list"><div class="grid">
        ${cs(this._query, 120).map((e) => y`<div class="item" title=${e} @mousedown=${() => this.pick(e)}>
          <span class="glyph">${je(e)}</span></div>`)}
      </div></div>` : Y}`;
  }
  pick(e) {
    this.value = e, this._open = !1, this.dispatchEvent(new CustomEvent("value-changed", { detail: { value: e }, bubbles: !0, composed: !0 }));
  }
}
customElements.define("cyd-entity-picker", Mn);
customElements.define("cyd-icon-picker", In);
class Cn extends ae {
  static properties = {
    hass: { attribute: !1 },
    api: { attribute: !1 },
    info: { attribute: !1 },
    boards: { attribute: !1 },
    templates: { attribute: !1 },
    _step: { state: !0 },
    _board: { state: !0 },
    _variant: { state: !0 },
    _orientation: { state: !0 },
    _template: { state: !0 },
    _mapping: { state: !0 },
    _name: { state: !0 },
    _device: { state: !0 },
    _busy: { state: !0 }
  };
  constructor() {
    super(), this._step = 0, this._board = "", this._variant = "", this._orientation = "landscape", this._template = "room_panel", this._mapping = {}, this._name = "", this._device = "", this._busy = !1;
  }
  static styles = be`
    :host { display: block; padding: 24px; max-width: 820px; margin: 0 auto; color: var(--primary-text-color); }
    h1 { font-size: 22px; font-weight: 500; }
    .steps { display: flex; gap: 8px; margin-bottom: 20px; font-size: 13px; color: var(--secondary-text-color); }
    .steps .active { color: var(--primary-color); font-weight: 600; }
    .options { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
    .opt { border: 2px solid var(--divider-color); border-radius: 10px; padding: 12px; cursor: pointer; background: var(--card-background-color); }
    .opt.sel { border-color: var(--primary-color); }
    .opt .t { font-weight: 500; }
    .opt .d { font-size: 12px; color: var(--secondary-text-color); margin-top: 4px; }
    .field { display: flex; flex-direction: column; gap: 4px; margin: 12px 0; font-size: 13px; }
    .field > span { color: var(--secondary-text-color); }
    input, select { padding: 8px; border-radius: 6px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); font: inherit; }
    .nav { display: flex; gap: 8px; justify-content: flex-end; margin-top: 24px; }
    button { font: inherit; padding: 8px 14px; border-radius: 6px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); cursor: pointer; }
    button.primary { background: var(--primary-color); color: var(--text-primary-color, #000); border-color: var(--primary-color); }
    button:disabled { opacity: .4; }
    a { color: var(--primary-color); font-size: 12px; }
  `;
  connectedCallback() {
    super.connectedCallback(), this._board ||= Object.keys(this.boards)[0] ?? "";
  }
  get template() {
    return this.templates.find((e) => e.id === this._template);
  }
  async create() {
    this._busy = !0;
    try {
      const e = this.template?.project ?? { pages: [] }, t = gs(e, this._mapping), i = Tt({
        ...t,
        name: this._name || "CYD",
        device_name: this._device || Se(this._name || "cyd"),
        board: this._board,
        board_variant: this._variant || null,
        orientation: this._orientation,
        theme: this.info?.default_theme ?? "mastershort_dark",
        settings: { language: Ee() }
      });
      i.pages.length || (i.pages = [{ id: "home", name: Ee() === "de" ? "Start" : "Home", icon: "mdi:home", parent: null, in_navigation: !0, widgets: [] }]), i.navigation.home_page = i.pages[0].id;
      const s = await this.api.save(i);
      this.dispatchEvent(new CustomEvent("open-project", { detail: { id: s.id }, bubbles: !0, composed: !0 }));
    } finally {
      this._busy = !1;
    }
  }
  render() {
    const e = ["step_board", "step_orientation", "step_template", "step_name"];
    return y`
      <h1>${d("wizard_title")}</h1>
      <div class="steps">${e.map((t, i) => y`<span class=${i === this._step ? "active" : ""}>${i + 1}. ${d(t)}</span>`)}</div>
      ${[this.stepBoard, this.stepOrientation, this.stepTemplate, this.stepName][this._step].call(this)}
      <div class="nav">
        <button @click=${() => this._step === 0 ? this.dispatchEvent(new CustomEvent("cancel", { bubbles: !0, composed: !0 })) : this._step--}>
          ${this._step === 0 ? d("cancel") : d("back")}</button>
        ${this._step < 3 ? y`<button class="primary" ?disabled=${!this._board} @click=${() => this._step++}>${d("next")}</button>` : y`<button class="primary" ?disabled=${this._busy || !this._name} @click=${() => this.create()}>${d("create")}</button>`}
      </div>`;
  }
  stepBoard() {
    const e = this.boards[this._board];
    return y`<div class="options">${Object.values(this.boards).map((t) => y`
      <div class="opt ${t.id === this._board ? "sel" : ""}" @click=${() => {
      this._board = t.id, this._variant = "";
    }}>
        <div class="t">${ne(t, "name")}</div>
        <div class="d">${Ee() === "de" ? t.notes_de : t.notes_en}</div>
        ${this.info?.hardware_hints ? y`<div class="d"><a href=${this.info.hardware_info_url} target="_blank" rel="noopener">${d("where_to_buy")}</a>
          · <a href=${this.info.hardware_info_url} target="_blank" rel="noopener">${d("matching_case")}</a></div>` : Y}
      </div>`)}</div>
      ${e?.display.variants?.length ? y`<label class="field"><span>${d("board_variant")}</span>
        <select @change=${(t) => this._variant = t.target.value}>
          <option value="">${d("variant_default")} (${e.display.model})</option>
          ${e.display.variants.map((t) => y`<option value=${t.id} ?selected=${t.id === this._variant}>${ne(t, "label")}</option>`)}
        </select></label>` : Y}`;
  }
  stepOrientation() {
    const e = this.boards[this._board];
    return y`<div class="options">${Object.entries(e?.orientations ?? {}).map(([t, i]) => y`
      <div class="opt ${t === this._orientation ? "sel" : ""}" @click=${() => this._orientation = t}>
        <div class="t">${d(t)}</div>
        ${i.usb ? y`<div class="d">${d("usb_side", { side: d(`usb_${i.usb}`) })}</div>` : Y}
      </div>`)}</div>`;
  }
  stepTemplate() {
    const e = this.template;
    return y`<div class="options">${this.templates.map((t) => y`
      <div class="opt ${t.id === this._template ? "sel" : ""}" @click=${() => {
      this._template = t.id, this._mapping = {};
    }}>
        <div class="t">${ne(t, "name")}</div><div class="d">${ne(t, "description")}</div>
      </div>`)}</div>
      ${e?.placeholders.map((t) => y`<div class="field"><span>${d("assign_placeholder", { label: ne(t, "label") })}</span>
        <cyd-entity-picker .hass=${this.hass} .value=${this._mapping[t.key] ?? null} .domains=${t.domains}
          @value-changed=${(i) => this._mapping = { ...this._mapping, [t.key]: i.detail.value }}></cyd-entity-picker></div>`)}`;
  }
  stepName() {
    return y`
      <label class="field"><span>${d("project_name")}</span>
        <input .value=${this._name} @input=${(e) => {
      const t = e.target.value, i = !this._device || this._device === Se(this._name);
      this._name = t, i && (this._device = Se(t));
    }} /></label>
      <label class="field"><span>${d("device_name")} – ${d("device_name_hint")}</span>
        <input .value=${this._device} @change=${(e) => this._device = Se(e.target.value)} /></label>`;
  }
}
customElements.define("cyd-wizard", Cn);
const Ti = ["toggle", "service", "page", "back", "home", "popup", "delay"];
function Xe(o, e) {
  const t = o[e];
  return !t || typeof t != "object" || !Array.isArray(t.actions) ? null : t.actions.filter((i) => i && typeof i == "object" && Ti.includes(i.type));
}
const yt = "application/x-cyd-widget";
class Tn extends ae {
  static properties = {
    project: { attribute: !1 },
    board: { attribute: !1 },
    theme: { attribute: !1 },
    pageId: { attribute: !1 },
    state: { attribute: !1 },
    mode: {},
    selected: { attribute: !1 },
    scale: { type: Number },
    night: { type: Boolean },
    now: { attribute: !1 },
    overlay: { attribute: !1 },
    images: { attribute: !1 },
    message: { attribute: !1 },
    _drag: { state: !0 },
    _dropCell: { state: !0 },
    _pressed: { state: !0 }
  };
  hits = [];
  tapStart = null;
  constructor() {
    super(), this.mode = "edit", this.selected = [], this.scale = 2, this.night = !1, this.now = /* @__PURE__ */ new Date(), this.overlay = null, this.images = {}, this.message = null, this._drag = null, this._dropCell = null, this._pressed = null;
  }
  static styles = be`
    :host { display: inline-block; position: relative; }
    .frame { position: relative; line-height: 0; box-shadow: 0 0 0 6px #111, 0 0 0 7px #333, 0 8px 24px rgba(0,0,0,.4); border-radius: 2px; }
    canvas { image-rendering: pixelated; image-rendering: crisp-edges; display: block; touch-action: none; }
    .overlay { position: absolute; inset: 0; }
    .w { position: absolute; box-sizing: border-box; cursor: move; border: 1px dashed rgba(255,255,255,.18); }
    .w:hover { border-color: rgba(34,211,238,.6); }
    .w.sel { border: 2px solid var(--primary-color, #22d3ee); }
    .handle { position: absolute; right: -6px; bottom: -6px; width: 12px; height: 12px; background: var(--primary-color, #22d3ee); border-radius: 2px; cursor: nwse-resize; }
    .ghost { position: absolute; box-sizing: border-box; border: 2px solid var(--primary-color, #22d3ee); background: rgba(34,211,238,.15); pointer-events: none; }
    .cell { position: absolute; box-sizing: border-box; border: 1px dotted rgba(255,255,255,.08); pointer-events: none; }
    .preview canvas { cursor: pointer; }
  `;
  updated(e) {
    super.updated(e);
    const t = this.renderRoot.querySelector("canvas");
    !t || !this.project || !this.board || !this.theme || (this.hits = wi(t, {
      project: this.project,
      board: this.board,
      theme: this.theme,
      pageId: this.pageId,
      state: this.state,
      now: this.now,
      pressed: this._pressed,
      night: this.night,
      overlay: this.mode === "preview" ? this.overlay : null,
      images: this.images,
      message: this.mode === "preview" ? this.message : null,
      editMode: this.mode === "edit"
    }));
  }
  /** Current canvas as PNG data URL (native resolution). */
  toPng() {
    return this.renderRoot.querySelector("canvas").toDataURL("image/png");
  }
  get page() {
    return this.project.pages.find((e) => e.id === this.pageId) ?? this.project.pages[0];
  }
  toScreen(e) {
    const i = this.renderRoot.querySelector("canvas").getBoundingClientRect();
    return { x: (e.clientX - i.left) / this.scale, y: (e.clientY - i.top) / this.scale };
  }
  render() {
    if (!this.project || !this.board) return Y;
    const { width: e, height: t } = this.board, i = this.scale, s = this.page, r = s ? ze(this.project, s, e, t) : null, n = (a) => `left:${a.x * i}px;top:${a.y * i}px;width:${a.w * i}px;height:${a.h * i}px`, l = this.mode === "edit";
    return y`
      <div class="frame ${l ? "edit" : "preview"}" style="width:${e * i}px;height:${t * i}px">
        <canvas style="width:${e * i}px;height:${t * i}px"
          @pointerdown=${this.onCanvasDown} @pointerup=${this.onCanvasUp} @pointercancel=${() => this._pressed = null}></canvas>
        ${l && r && s ? y`
          <div class="overlay" @pointerdown=${this.onBackgroundDown}
            @dragover=${this.onDragOver} @dragleave=${() => this._dropCell = null} @drop=${this.onDrop}>
            ${s.layout !== "free" ? this.renderCells(r, n) : Y}
            ${s.widgets.map((a) => {
      const c = this._drag?.id === a.id ? _e(r.content, r.grid, this._drag.cur) : r.widgets[a.id], h = this.selected.includes(a.id);
      return y`<div class="w ${h ? "sel" : ""}" style=${n(c)} title=${a.type}
                  @pointerdown=${(b) => this.onWidgetDown(b, a.id, "move")}
                  @pointermove=${this.onPointerMove} @pointerup=${this.onPointerUp}>
                  ${h && this.selected.length === 1 ? y`<div class="handle"
                    @pointerdown=${(b) => this.onWidgetDown(b, a.id, "resize")}></div>` : Y}
                </div>`;
    })}
            ${this._dropCell ? y`<div class="ghost" style=${n(_e(r.content, r.grid, { ...this._dropCell, w: 1, h: 1 }))}></div>` : Y}
          </div>` : Y}
      </div>`;
  }
  renderCells(e, t) {
    const i = [];
    for (let s = 0; s < e.grid.rows; s++)
      for (let r = 0; r < e.grid.cols; r++)
        i.push(y`<div class="cell" style=${t(_e(e.content, e.grid, { x: r, y: s, w: 1, h: 1 }))}></div>`);
    return i;
  }
  // -- edit mode ------------------------------------------------------------
  onBackgroundDown(e) {
    (e.target === e.currentTarget || e.target.classList.contains("cell")) && this.emit("select", { ids: [] });
  }
  onWidgetDown(e, t, i) {
    e.stopPropagation(), e.preventDefault();
    const s = this.page, r = s.widgets.find((b) => b.id === t);
    if (!r) return;
    if (i === "move") {
      if (e.ctrlKey || e.metaKey || e.shiftKey) {
        const k = this.selected.includes(t) ? this.selected.filter((A) => A !== t) : [...this.selected, t];
        this.emit("select", { ids: k });
        return;
      }
      this.selected.includes(t) || this.emit("select", { ids: [t] });
    }
    if (s.layout === "free") return;
    const n = ze(this.project, s, this.board.width, this.board.height), l = this.toScreen(e), a = ct(n.content, n.grid, l.x, l.y);
    (i === "resize" ? e.currentTarget.parentElement : e.currentTarget).setPointerCapture(e.pointerId);
    const h = { x: r.x, y: r.y, w: r.w, h: r.h };
    this._drag = { mode: i, id: t, pointerId: e.pointerId, grab: a, orig: h, cur: { ...h } };
  }
  onPointerMove(e) {
    const t = this._drag;
    if (!t || e.pointerId !== t.pointerId) return;
    const i = this.page, s = ze(this.project, i, this.board.width, this.board.height), r = this.toScreen(e), n = ct(s.content, s.grid, r.x, r.y), { cols: l, rows: a } = s.grid;
    let c;
    if (t.mode === "move") {
      const h = Math.max(0, Math.min(l - t.orig.w, t.orig.x + n.x - t.grab.x)), b = Math.max(0, Math.min(a - t.orig.h, t.orig.y + n.y - t.grab.y));
      c = { ...t.orig, x: h, y: b };
    } else {
      const h = Math.max(1, Math.min(l - t.orig.x, n.x - t.orig.x + 1)), b = Math.max(1, Math.min(a - t.orig.y, n.y - t.orig.y + 1));
      c = { ...t.orig, w: h, h: b };
    }
    (c.x !== t.cur.x || c.y !== t.cur.y || c.w !== t.cur.w || c.h !== t.cur.h) && (this._drag = { ...t, cur: c });
  }
  onPointerUp(e) {
    const t = this._drag;
    if (!t || e.pointerId !== t.pointerId) return;
    this._drag = null;
    const i = t.cur;
    (i.x !== t.orig.x || i.y !== t.orig.y || i.w !== t.orig.w || i.h !== t.orig.h) && this.emit("widget-change", { id: t.id, changes: i });
  }
  onDragOver(e) {
    if (!e.dataTransfer?.types.includes(yt)) return;
    e.preventDefault();
    const t = ze(this.project, this.page, this.board.width, this.board.height), i = this.toScreen(e);
    this._dropCell = ct(t.content, t.grid, i.x, i.y);
  }
  onDrop(e) {
    const t = e.dataTransfer?.getData(yt), i = this._dropCell;
    this._dropCell = null, !(!t || !i) && (e.preventDefault(), this.emit("widget-add", { type: t, x: i.x, y: i.y }));
  }
  // -- preview mode ---------------------------------------------------------
  hitAt(e, t) {
    const i = (r) => ({ "overlay-slider": 0, "overlay-close": r.id === "close" ? 1 : 3, "overlay-panel": 2 })[r.kind] ?? (r.kind === "widget" ? 5 : 4);
    return [...this.hits].sort((r, n) => i(r) - i(n)).find((r) => e >= r.rect.x && e < r.rect.x + r.rect.w && t >= r.rect.y && t < r.rect.y + r.rect.h) ?? null;
  }
  lastTap = null;
  onCanvasDown(e) {
    if (this.mode !== "preview") return;
    const t = this.toScreen(e), i = this.hitAt(t.x, t.y);
    this.tapStart = { ...t, t: Date.now(), hit: i }, i?.kind === "widget" && (this._pressed = i.id);
  }
  onCanvasUp(e) {
    if (this.mode !== "preview" || !this.tapStart) return;
    const t = this.toScreen(e), i = this.tapStart;
    this.tapStart = null, this._pressed = null;
    const s = t.x - i.x, r = t.y - i.y;
    if (Math.abs(s) > 40 && Math.abs(s) > Math.abs(r) * 1.5) {
      this.emit("preview-swipe", { direction: s < 0 ? "left" : "right" });
      return;
    }
    const n = this.hitAt(t.x, t.y);
    if (n && i.hit && n.id === i.hit.id && n.kind === i.hit.kind) {
      const l = Date.now(), a = l - i.t > 500, c = this.lastTap, h = !a && !!c && c.id === n.id && c.kind === n.kind && l - c.t < 350;
      this.lastTap = a || h ? null : { id: n.id, kind: n.kind, t: l }, this.emit("preview-tap", { hit: n, long: a, double: h, point: t });
    }
  }
  emit(e, t) {
    this.dispatchEvent(new CustomEvent(e, { detail: t, bubbles: !0, composed: !0 }));
  }
}
customElements.define("cyd-screen", Tn);
function kn(o) {
  return o.split(`
`).map((e) => {
    if (/^\s*#/.test(e)) return y`<span class="c">${e}</span>\n`;
    const t = /^(\s*-?\s*)([A-Za-z0-9_."$\\{}-]+:)(.*)$/.exec(e);
    if (t) {
      const i = t[3], s = /^\s*!/.test(i) ? "t" : /^\s*"/.test(i) ? "s" : "v";
      return y`${t[1]}<span class="k">${t[2]}</span><span class=${s}>${i}</span>\n`;
    }
    return y`${e}\n`;
  });
}
class Sn extends ae {
  static properties = {
    api: { attribute: !1 },
    project: { attribute: !1 },
    info: { attribute: !1 },
    _result: { state: !0 },
    _copied: { state: !0 },
    _error: { state: !0 },
    _dir: { state: !0 },
    _save: { state: !0 },
    _saving: { state: !0 },
    _secretsDone: { state: !0 },
    _esphomeUrl: { state: !0 }
  };
  constructor() {
    super(), this._result = null, this._copied = !1, this._error = null, this._dir = null, this._save = null, this._saving = !1, this._secretsDone = !1, this._esphomeUrl = null;
  }
  static styles = be`
    .backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 100; display: flex; align-items: center; justify-content: center; }
    .dialog { background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color); width: min(1000px, 96vw); max-height: 92vh;
      display: flex; flex-direction: column; border-radius: 12px; box-shadow: 0 12px 40px rgba(0,0,0,.5); }
    header { display: flex; align-items: center; gap: 8px; padding: 14px 18px; border-bottom: 1px solid var(--divider-color); }
    header h2 { margin: 0; font-size: 18px; font-weight: 500; flex: 1; }
    .body { display: grid; grid-template-columns: 1fr 300px; gap: 0; min-height: 0; flex: 1; }
    pre { margin: 0; padding: 12px 16px; overflow: auto; font: 12px/1.45 ui-monospace, SFMono-Regular, Consolas, monospace; background: #0d1117; color: #c9d1d9; min-height: 300px; }
    .c { color: #8b949e; } .k { color: #7ee787; } .s { color: #a5d6ff; } .t { color: #ff7b72; } .v { color: #c9d1d9; }
    aside { padding: 14px 16px; overflow: auto; font-size: 13px; border-left: 1px solid var(--divider-color); }
    aside h4 { margin: 12px 0 6px; font-size: 13px; }
    aside h4:first-child { margin-top: 0; }
    aside p { margin: 0 0 8px; color: var(--secondary-text-color); }
    button { font: inherit; padding: 6px 12px; border-radius: 6px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); cursor: pointer; }
    button.primary { background: var(--primary-color); color: var(--text-primary-color, #000); border-color: var(--primary-color); }
    .error { color: var(--error-color, #ef4444); } .warning { color: var(--warning-color, #f59e0b); }
    ul { padding-left: 18px; margin: 4px 0 8px; }
    .notice { border-radius: 8px; padding: 8px 10px; margin-bottom: 12px; }
    .notice.ok { border: 1px solid var(--success-color, #22c55e); background: rgba(34,197,94,.08); }
    .notice.warning { border: 1px solid var(--warning-color, #f59e0b); background: rgba(245,158,11,.08); }
    .notice p { margin: 0 0 6px; color: var(--primary-text-color); }
    .notice input { width: 100%; box-sizing: border-box; margin-bottom: 6px; padding: 6px; border-radius: 6px;
      border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); }
    pre.diff { max-height: 200px; min-height: 0; font-size: 11px; padding: 6px; }
    .muted { color: var(--secondary-text-color); }
    a.btn { display: inline-block; padding: 6px 12px; border-radius: 6px; background: var(--primary-color);
      color: var(--text-primary-color, #000); text-decoration: none; }
    .blocked { padding: 18px; }
    @media (max-width: 800px) { .body { grid-template-columns: 1fr; } aside { border-left: 0; border-top: 1px solid var(--divider-color); } }
  `;
  connectedCallback() {
    super.connectedCallback(), this.generate();
  }
  async generate() {
    this.api.esphomeStatus().then((e) => this._dir = e).catch(() => this._dir = null), this.api.esphomeUrl().then((e) => this._esphomeUrl = e);
    try {
      this._result = await this.api.generate(this.project, !0);
    } catch (e) {
      this._error = String(e.message ?? e);
    }
  }
  async copy() {
    this._result && (await navigator.clipboard.writeText(this._result.yaml), this._copied = !0, setTimeout(() => this._copied = !1, 2e3));
  }
  download() {
    if (!this._result) return;
    const e = new Blob([this._result.yaml], { type: "text/yaml" }), t = document.createElement("a");
    t.href = URL.createObjectURL(e), t.download = `${this.project.device_name}.yaml`, t.click(), URL.revokeObjectURL(t.href);
  }
  async saveToEsphome(e = !1) {
    this._saving = !0;
    try {
      this._save = await this.api.esphomeSave(this.project.id, e);
    } catch (t) {
      this._error = String(t.message ?? t);
    } finally {
      this._saving = !1;
    }
  }
  async saveSecrets(e) {
    const t = new FormData(e);
    await this.api.secretsSet(String(t.get("ssid") ?? ""), String(t.get("password") ?? "")), this._secretsDone = !0;
  }
  renderSave() {
    const e = this._save;
    return this._dir && !this._dir.directory_exists ? y`<p class="muted">${d("no_esphome_dir", { path: this._dir.directory })}</p>` : e ? e.status === "conflict" ? y`<div class="notice warning">
        <p>${d(e.state === "foreign" ? "conflict_foreign" : "conflict_modified", { path: e.path ?? "" })}</p>
        ${e.diff ? y`<pre class="diff">${e.diff}</pre>` : Y}
        <button class="primary" @click=${() => this.saveToEsphome(!0)}>${d("overwrite")}</button>
      </div>` : e.status === "saved" ? y`<div class="notice ok">
        <p>✓ ${d("saved_to_esphome", { path: e.path ?? "" })}</p>
        ${e.backup ? y`<p class="muted">${d("backup_created", { path: e.backup })}</p>` : Y}
        ${e.secrets_missing?.length && !this._secretsDone ? y`<form @submit=${(t) => {
      t.preventDefault(), this.saveSecrets(t.target);
    }}>
          <p>${d("secrets_missing")}</p>
          <input name="ssid" placeholder=${d("wifi_ssid")} required />
          <input name="password" type="password" placeholder=${d("wifi_password")} />
          <button class="primary" type="submit">${d("save_secrets")}</button>
        </form>` : this._secretsDone ? y`<p>✓ ${d("secrets_saved")}</p>` : Y}
        <p>${d("next_install")}</p>
        ${this._esphomeUrl ? y`<a class="btn" href=${this._esphomeUrl} target="_top">${d("open_esphome")}</a>` : Y}
      </div>` : Y : Y;
  }
  /** Example automation actions for the device actions (esphome.<device>_<action>). */
  actionsExample() {
    const e = this.project.device_name.replace(/-/g, "_"), t = this.project.pages[0]?.id ?? "home";
    return [
      `action: esphome.${e}_show_message`,
      "data:",
      '  title: "Paket"',
      '  message: "Das Paket wurde geliefert."',
      "  duration: 15",
      "",
      `action: esphome.${e}_show_page`,
      "data:",
      `  page: "${t}"`,
      "",
      `action: esphome.${e}_set_brightness`,
      "data:",
      "  brightness: 60",
      "",
      `# ${e}_wake · ${e}_dim${this.project.settings?.rgb_led?.enabled ? ` · ${e}_set_led (red, green, blue)` : ""}`
    ].join(`
`);
  }
  close() {
    this.dispatchEvent(new CustomEvent("closed", { bubbles: !0, composed: !0 }));
  }
  render() {
    const e = this._result, t = (n) => Ee() === "de" ? n.message : n.message_en, i = e?.issues.filter((n) => n.level === "error") ?? [], s = e?.issues.filter((n) => n.level === "warning") ?? [], r = e?.memory;
    return y`<div class="backdrop" @click=${(n) => n.target === n.currentTarget && this.close()}>
      <div class="dialog" role="dialog" aria-modal="true">
        <header>
          <h2>${d("export_title")} · ${this.project.device_name}.yaml</h2>
          ${e?.ok && this._dir?.directory_exists ? y`<button class="primary" ?disabled=${this._saving}
            @click=${() => this.saveToEsphome()}>${this._saving ? d("saving_to_esphome") : d("save_to_esphome")}</button>` : Y}
          ${e?.ok ? y`<button class=${this._dir?.directory_exists ? "" : "primary"} @click=${() => this.copy()}>${this._copied ? d("copied") : d("copy_code")}</button>
            <button @click=${() => this.download()}>⤓ ${d("download")}</button>` : Y}
          <button @click=${() => this.close()}>${d("close")}</button>
        </header>
        ${this._error ? y`<div class="blocked error">${this._error}</div>` : e ? e.ok ? y`<div class="body">
            <pre>${kn(e.yaml)}</pre>
            <aside>
              ${this.renderSave()}
              <h4>${d("how_to_install")}</h4>
              <p>${d("install_steps")}</p>
              <p>${d("secrets_hint")}</p>
              <p><strong>${d("allow_actions_hint")}</strong></p>
              ${this.project.id ? y`<cyd-device-status .api=${this.api} .projectId=${this.project.id}
                .deviceName=${this.project.device_name}></cyd-device-status>` : Y}
              ${this.project.settings?.device_actions !== !1 ? y`<h4>${d("ha_actions")}</h4>
                <p>${d("ha_actions_hint")}</p>
                <pre class="diff">${this.actionsExample()}</pre>` : Y}
              <h4>${d("first_install")}</h4>
              <p>${d("first_install_steps")}</p>
              ${r ? y`<h4>${d("memory")}</h4><p>${d("memory_estimate", {
      objects: r.objects,
      ram: Math.round(r.ram_bytes / 1024),
      pct: Math.round(r.ratio * 100),
      flash: Math.round(r.flash_fonts_bytes / 1024)
    })}</p>` : Y}
              ${s.length ? y`<h4>${d("validation")}</h4><ul>${s.map((n) => y`<li class="warning">${t(n)}</li>`)}</ul>` : Y}
              ${this.info?.hardware_hints ? y`<p><a href=${this.info.hardware_info_url} target="_blank" rel="noopener">${d("where_to_buy")} · ${d("matching_case")}</a></p>` : Y}
            </aside>
          </div>` : y`<div class="blocked"><p>${d("export_blocked")}</p><ul>${i.map((n) => y`<li class="error">${t(n)}</li>`)}</ul></div>` : y`<div class="blocked">${d("generating")}</div>`}
      </div>
    </div>`;
  }
}
customElements.define("cyd-export-dialog", Sn);
const zn = 100;
function te(o) {
  const e = je(o);
  return e ? y`<span class="bi">${e}</span>` : Y;
}
function Bn(o) {
  const e = `opt_${o}`, t = d(e);
  return t !== e ? t : /^(xs|s|m|l|xl|xxl)$/.test(o) ? o.toUpperCase() : o;
}
const si = [
  ["group_tiles", ["toggle_tile", "sensor_value", "binary_indicator", "person_presence", "multi_value"]],
  ["group_controls", ["cover_control", "climate", "slider", "number_stepper", "select", "media_player", "scene_button", "button_grid"]],
  ["group_display", ["clock", "weather", "gauge", "countdown", "notification_area", "qr_code", "label"]],
  ["group_layout", ["page_button", "page_title", "divider", "spacer"]]
];
function On(o) {
  const e = {};
  for (const t of o.split(",")) {
    const [i, ...s] = t.split("=");
    i.trim() && s.length && (e[i.trim()] = s.join("=").trim());
  }
  return Object.keys(e).length ? e : void 0;
}
const ni = {
  scene: "scene.turn_on",
  script: "script.turn_on",
  button: "button.press",
  input_button: "input_button.press",
  automation: "automation.trigger"
};
class Dn extends ae {
  static properties = {
    hass: { attribute: !1 },
    api: { attribute: !1 },
    info: { attribute: !1 },
    boards: { attribute: !1 },
    widgetDefs: { attribute: !1 },
    themes: { attribute: !1 },
    projectId: {},
    narrow: { type: Boolean },
    _project: { state: !0 },
    _pageId: { state: !0 },
    _selected: { state: !0 },
    _mode: { state: !0 },
    _zoom: { state: !0 },
    _paletteFilter: { state: !0 },
    _avail: { state: !0 },
    _sample: { state: !0 },
    _night: { state: !0 },
    _realActions: { state: !0 },
    _sim: { state: !0 },
    _simAttr: { state: !0 },
    _overlay: { state: !0 },
    _images: { state: !0 },
    _message: { state: !0 },
    _saveState: { state: !0 },
    _issues: { state: !0 },
    _showExport: { state: !0 },
    _now: { state: !0 }
  };
  resizeObserver;
  undoStack = [];
  redoStack = [];
  saveTimer;
  validateTimer;
  clockTimer;
  clipboard = [];
  keyHandler = (e) => this.onKey(e);
  constructor() {
    super(), this._project = null, this._pageId = "", this._selected = [], this._mode = "edit", this._zoom = "fit", this._paletteFilter = "", this._avail = null, this._sample = !1, this._night = !1, this._realActions = !1, this._sim = {}, this._simAttr = {}, this._overlay = null, this._images = {}, this._message = null, this._saveState = "saved", this._issues = [], this._showExport = !1, this._now = /* @__PURE__ */ new Date();
  }
  connectedCallback() {
    super.connectedCallback(), window.addEventListener("keydown", this.keyHandler), this.clockTimer = window.setInterval(() => this._now = /* @__PURE__ */ new Date(), 1e3);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), window.removeEventListener("keydown", this.keyHandler), window.clearInterval(this.clockTimer), this.resizeObserver?.disconnect(), this.resizeObserver = void 0, this._saveState === "dirty" && this.flushSave();
  }
  willUpdate(e) {
    e.has("projectId") && this.projectId && this.load();
  }
  async load() {
    const e = Tt(await this.api.project(this.projectId));
    this._project = e, this._pageId = e.navigation?.home_page ?? e.pages[0]?.id ?? "", this._selected = [], this.undoStack = [], this.redoStack = [], this.scheduleValidate(0), this._images = await Ii(this.api, e);
  }
  // -- model mutations --------------------------------------------------------
  mutate(e) {
    if (!this._project) return;
    this.undoStack.push(JSON.stringify(this._project)), this.undoStack.length > zn && this.undoStack.shift(), this.redoStack = [];
    const t = structuredClone(this._project);
    e(t), this._project = t, this.changed();
  }
  changed() {
    this._saveState = "dirty", window.clearTimeout(this.saveTimer), this.saveTimer = window.setTimeout(() => void this.flushSave(), 800), this.scheduleValidate();
  }
  async flushSave() {
    if (this._project) {
      window.clearTimeout(this.saveTimer), this._saveState = "saving";
      try {
        const e = await this.api.save(this._project);
        this._project && (this._project = {
          ...this._project,
          id: e.id,
          meta: e.meta,
          settings: { ...this._project.settings, api_key: e.settings?.api_key }
        }), this._saveState = "saved";
      } catch {
        this._saveState = "error";
      }
    }
  }
  scheduleValidate(e = 1200) {
    window.clearTimeout(this.validateTimer), this.validateTimer = window.setTimeout(async () => {
      if (this._project)
        try {
          const t = await this.api.generate(this._project);
          this._issues = t.issues;
        } catch {
        }
    }, e);
  }
  undo() {
    const e = this.undoStack.pop();
    !e || !this._project || (this.redoStack.push(JSON.stringify(this._project)), this._project = JSON.parse(e), this.fixSelection(), this.changed());
  }
  redo() {
    const e = this.redoStack.pop();
    !e || !this._project || (this.undoStack.push(JSON.stringify(this._project)), this._project = JSON.parse(e), this.fixSelection(), this.changed());
  }
  fixSelection() {
    this.page || (this._pageId = this._project?.pages[0]?.id ?? ""), this._selected = this._selected.filter((t) => this.page?.widgets.some((i) => i.id === t));
  }
  get page() {
    return this._project?.pages.find((e) => e.id === this._pageId);
  }
  editPage(e) {
    const t = this._pageId;
    this.mutate((i) => {
      const s = i.pages.find((r) => r.id === t);
      s && e(s, i);
    });
  }
  editWidget(e, t) {
    this.editPage((i) => {
      const s = i.widgets.find((r) => r.id === e);
      s && t(s);
    });
  }
  addWidget(e, t) {
    const i = this.widgetDefs[e], s = this.page;
    if (!i || !s || !this._project) return;
    const r = mt(this._project, s);
    let { w: n, h: l } = i.default_size;
    n = Math.min(n, r.cols), l = Math.min(l, r.rows);
    let a = t ? { x: Math.min(t.x, r.cols - n), y: Math.min(t.y, r.rows - l) } : null;
    if (a && gt(s.widgets, { ...a, w: n, h: l }) && (a = null), a ??= at(s, r.cols, r.rows, n, l), a || (n = 1, l = 1, a = t && !gt(s.widgets, { ...t, w: n, h: l }) ? t : at(s, r.cols, r.rows, 1, 1)), !a) return;
    const c = { id: Qt(s), type: e, x: a.x, y: a.y, w: n, h: l, entity: null, props: ps(i) };
    e === "scene_button" && (c.action = { service: "", target: null }), this.editPage((h) => h.widgets.push(c)), this._selected = [c.id];
  }
  deleteSelected() {
    const e = this._selected;
    e.length && (this.editPage((t) => t.widgets = t.widgets.filter((i) => !e.includes(i.id))), this._selected = []);
  }
  copySelected() {
    this.clipboard = (this.page?.widgets ?? []).filter((e) => this._selected.includes(e.id)).map((e) => structuredClone(e));
  }
  paste() {
    if (!this.clipboard.length || !this._project) return;
    const e = this.page, t = mt(this._project, e), i = [];
    this.editPage((s) => {
      for (const r of this.clipboard) {
        const n = at(s, t.cols, t.rows, Math.min(r.w, t.cols), Math.min(r.h, t.rows));
        if (!n) break;
        const l = { ...structuredClone(r), id: Qt(s), ...n };
        s.widgets.push(l), i.push(l.id);
      }
    }), this._selected = i;
  }
  onKey(e) {
    if (e.composedPath().some((r) => r instanceof HTMLElement && (r.tagName === "INPUT" || r.tagName === "TEXTAREA" || r.tagName === "SELECT")) || this._showExport) return;
    const s = e.ctrlKey || e.metaKey;
    s && e.key.toLowerCase() === "z" && !e.shiftKey ? (e.preventDefault(), this.undo()) : s && (e.key.toLowerCase() === "y" || e.key.toLowerCase() === "z" && e.shiftKey) ? (e.preventDefault(), this.redo()) : s && e.key.toLowerCase() === "c" ? this.copySelected() : s && e.key.toLowerCase() === "v" ? (e.preventDefault(), this.paste()) : (e.key === "Delete" || e.key === "Backspace") && this._selected.length && this._mode === "edit" ? (e.preventDefault(), this.deleteSelected()) : e.key === "Escape" && (this._selected = []);
  }
  // -- pages --------------------------------------------------------------------
  addPage(e = null) {
    if (!this._project) return;
    const t = e ? `${d("add_subpage")} ${this._project.pages.length + 1}` : `${Ee() === "de" ? "Seite" : "Page"} ${this._project.pages.length + 1}`, i = us(t, this._project.pages.map((s) => s.id));
    this.mutate((s) => s.pages.push({
      id: i,
      name: t,
      icon: e ? "mdi:subdirectory-arrow-right" : "mdi:view-dashboard",
      parent: e,
      in_navigation: !e,
      layout: "grid",
      widgets: []
    })), this._pageId = i, this._selected = [];
  }
  deletePage(e) {
    if (!this._project || this._project.pages.length <= 1) return;
    const t = /* @__PURE__ */ new Set([e]);
    let i = !0;
    for (; i; ) {
      i = !1;
      for (const s of this._project.pages) s.parent && t.has(s.parent) && !t.has(s.id) && (t.add(s.id), i = !0);
    }
    this.mutate((s) => {
      s.pages = s.pages.filter((r) => !t.has(r.id)), s.navigation && t.has(s.navigation.home_page ?? "") && (s.navigation.home_page = s.pages[0]?.id ?? null);
    }), this._pageId = this._project.pages[0]?.id ?? "";
  }
  movePage(e, t) {
    this.mutate((i) => {
      const s = i.pages.findIndex((l) => l.id === e), r = i.pages[s];
      let n = s + t;
      for (; n >= 0 && n < i.pages.length && (i.pages[n].parent ?? null) !== (r.parent ?? null); ) n += t;
      n < 0 || n >= i.pages.length || ([i.pages[s], i.pages[n]] = [i.pages[n], i.pages[s]]);
    });
  }
  // -- preview interaction --------------------------------------------------------
  stateResolver() {
    const e = this._sample && this._project ? xi(this._project) : null;
    return (t) => {
      const i = e ? e(t) : this.hass?.states[t], s = this._sim[t], r = { ...i?.attributes ?? {}, ...this._simAttr[t] ?? {} };
      return s ? { entity_id: t, state: s, attributes: r } : i && { ...i, attributes: r };
    };
  }
  tapTimer = 0;
  onPreviewTap(e) {
    const { hit: t, long: i, point: s } = e.detail;
    if (!this._message && !this._overlay && t.kind === "widget") {
      const r = this.page?.widgets.find((n) => n.id === t.id);
      if (r && this.runTrigger(r, e.detail)) return;
    }
    if (this._message) {
      t.kind === "overlay-close" && (this._message = null);
      return;
    }
    if (this._overlay) {
      if (t.kind === "overlay-close") this._overlay = null;
      else if (t.kind === "overlay-slider") {
        const r = Math.max(0, Math.min(1, (s.x - t.rect.x) / t.rect.w));
        t.id === "ct" || t.id === "hue" ? this.setLightValue(t.id, r) : this.setOverlayValue(r * 100);
      }
      return;
    }
    if (i) {
      const r = this.page?.widgets.find((n) => n.id === t.id);
      if (r && t.kind === "widget" && this.openPopup(r)) return;
    }
    this.builtinTap(t);
  }
  /**
   * Action builder in the preview. Returns true when the event was handled (configured steps,
   * or a tap held back to see whether a second tap follows).
   */
  runTrigger(e, t) {
    const i = Xe(e, "double_tap") !== null;
    if (t.double && i)
      return window.clearTimeout(this.tapTimer), this.runSteps(e, Xe(e, "double_tap")), !0;
    const s = t.long ? "long_press" : "tap", r = Xe(e, s);
    return s === "tap" && i ? (window.clearTimeout(this.tapTimer), this.tapTimer = window.setTimeout(() => {
      r !== null ? this.runSteps(e, r) : this.builtinTap({ kind: "widget", id: e.id, rect: { x: 0, y: 0, w: 0, h: 0 } });
    }, 350), !0) : r === null ? !1 : (this.runSteps(e, r), !0);
  }
  async runSteps(e, t) {
    const i = this._project, s = this._realActions && this.info?.preview_real_actions, r = i.navigation?.home_page || i.pages[0].id;
    for (const n of t)
      if (n.type === "toggle") {
        const l = n.entity || e.entity;
        if (!l) continue;
        const a = this.stateResolver()(l)?.state, c = l.split(".")[0], h = tt(a) ? c === "cover" ? "closed" : "off" : c === "cover" ? "open" : "on";
        this._sim = { ...this._sim, [l]: h }, s && this.hass.callService("homeassistant", "toggle", { entity_id: l });
      } else if (n.type === "service" && n.service && s) {
        const [l, a] = n.service.split(".");
        this.hass.callService(l, a, { ...n.data ?? {}, ...n.target ? { entity_id: n.target } : {} });
      } else n.type === "page" && n.page && i.pages.some((l) => l.id === n.page) ? this._pageId = n.page : n.type === "back" ? this._pageId = this.page?.parent || r : n.type === "home" ? this._pageId = r : n.type === "popup" ? this.openPopup(e) : n.type === "delay" && n.ms && await new Promise((l) => window.setTimeout(l, Math.min(n.ms, 6e4)));
  }
  /** The widget's own popup (long press slider / light popup); false if it has none. */
  openPopup(e) {
    const t = e.entity ? At[e.entity.split(".")[0]] : void 0;
    if (e.type === "toggle_tile" && t && (e.props.long_press ?? "slider") === "slider") {
      const i = this.stateResolver()(e.entity), s = t[1] === 2 || i?.state === "on";
      this._overlay = {
        entity: e.entity,
        kind: t[1],
        title: String(e.props.label || i?.attributes.friendly_name || e.entity),
        value: s ? Ei(e.entity, i) ?? 0 : 0
      };
      const r = an(i);
      if (t[1] === 1 && (e.props.color_controls ?? !0) && (r.hasCt || r.hasHs)) {
        const n = i?.attributes.hs_color, l = Number(i?.attributes.color_temp_kelvin);
        this._overlay.light = {
          ...r,
          ct: Number.isFinite(l) && l > 0 ? l : 4e3,
          hue: Array.isArray(n) && Number(n[0]) || 0
        };
      }
      return !0;
    }
    return !1;
  }
  /** Built-in tap behavior of widgets, tabs and the back button. */
  builtinTap(e) {
    const t = this._project;
    if (e.kind === "tab" || e.kind === "back") {
      this._pageId = e.id;
      return;
    }
    const i = this.page?.widgets.find((s) => s.id === e.id);
    if (i) {
      if (i.type === "toggle_tile" && i.entity) {
        const s = this.stateResolver()(i.entity)?.state, r = i.entity.split(".")[0], n = tt(s) ? r === "cover" ? "closed" : "off" : r === "cover" ? "open" : "on";
        this._sim = { ...this._sim, [i.entity]: n }, this._realActions && this.info?.preview_real_actions && this.hass.callService("homeassistant", "toggle", { entity_id: i.entity });
      } else if (i.type === "page_button" && typeof i.props.target == "string")
        this._pageId = i.props.target;
      else if (i.type === "sensor_value" && typeof i.props.tap_page == "string" && t.pages.some((s) => s.id === i.props.tap_page))
        this._pageId = i.props.tap_page;
      else if (i.type === "page_title" && this.page?.parent)
        this._pageId = this.page.parent;
      else if (i.type === "scene_button" && this._realActions && this.info?.preview_real_actions && i.action?.service) {
        const [s, r] = i.action.service.split(".");
        this.hass.callService(s, r, i.action.target ? { entity_id: i.action.target, ...i.action.data ?? {} } : i.action.data);
      }
    }
  }
  /** Slider released in the preview: update the simulated state (and call HA when real actions are on). */
  setOverlayValue(e) {
    const t = this._overlay;
    if (!t) return;
    const i = Math.max(0, Math.min(100, Math.round(e)));
    this._overlay = { ...t, value: i };
    const [s] = At[t.entity.split(".")[0]], r = t.kind === 1 ? Math.round(i * 255 / 100) : i;
    this._simAttr = { ...this._simAttr, [t.entity]: { ...this._simAttr[t.entity] ?? {}, [s]: r } };
    const n = t.kind === 2 ? i > 0 ? "open" : "closed" : i > 0 ? "on" : "off";
    if (this._sim = { ...this._sim, [t.entity]: n }, this._realActions && this.info?.preview_real_actions) {
      const l = {
        1: ["light", "turn_on", "brightness_pct"],
        2: ["cover", "set_cover_position", "position"],
        3: ["fan", "set_percentage", "percentage"]
      }, [a, c, h] = l[t.kind];
      this.hass.callService(a, c, { entity_id: t.entity, [h]: i });
    }
  }
  /** Color temperature / hue slider of the light overlay (like the device: light.turn_on on release). */
  setLightValue(e, t) {
    const i = this._overlay;
    if (!i?.light) return;
    const [s, r] = bt[e], n = Math.round(s + t * (r - s));
    this._overlay = { ...i, light: { ...i.light, [e]: n } };
    const l = this._simAttr[i.entity] ?? {}, a = e === "ct" ? { color_temp_kelvin: n, color_mode: "color_temp" } : { hs_color: [n, 100], color_mode: "hs" };
    if (this._simAttr = { ...this._simAttr, [i.entity]: { ...l, ...a } }, this._sim = { ...this._sim, [i.entity]: "on" }, this._realActions && this.info?.preview_real_actions) {
      const c = e === "ct" ? { color_temp_kelvin: n } : { hs_color: [n, 100] };
      this.hass.callService("light", "turn_on", { entity_id: i.entity, ...c });
    }
  }
  onPreviewSwipe(e) {
    const t = this._project, i = this.page;
    if (!i || !(t.navigation?.swipe ?? !0)) return;
    if (i.parent) {
      e.detail.direction === "right" && (this._pageId = i.parent);
      return;
    }
    const s = nt(t), r = s.findIndex((l) => l.id === i.id);
    if (r < 0) return;
    let n = r + (e.detail.direction === "left" ? 1 : -1);
    t.navigation?.wrap_around && (n = (n + s.length) % s.length), n >= 0 && n < s.length && (this._pageId = s[n].id);
  }
  // -- rendering ---------------------------------------------------------------
  static styles = be`
    :host { display: flex; flex-direction: column; height: 100%; color: var(--primary-text-color); }
    .toolbar { display: flex; gap: 8px; align-items: center; padding: 8px 12px; border-bottom: 1px solid var(--divider-color); flex-wrap: wrap; }
    .toolbar .title { font-size: 18px; font-weight: 500; margin-right: auto; }
    .toolbar .status { font-size: 12px; color: var(--secondary-text-color); }
    button { font: inherit; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); cursor: pointer; }
    button:hover { border-color: var(--primary-color); }
    button.primary { background: var(--primary-color); color: var(--text-primary-color, #000); border-color: var(--primary-color); }
    button.on { border-color: var(--primary-color); color: var(--primary-color); }
    button:disabled { opacity: .4; cursor: default; }
    button.small { padding: 3px 8px; font-size: 12px; }
    button.ghost { background: transparent; }
    button.icon { padding: 2px 6px; }
    button { display: inline-flex; align-items: center; justify-content: center; gap: 4px; transition: border-color .15s, background .15s; }
    .bi { font-family: "${Le(De)}"; font-size: 1.15em; line-height: 1; }
    .seg { display: inline-flex; border: 1px solid var(--divider-color); border-radius: 8px; overflow: hidden; }
    .seg > button, .seg > label { border: 0; border-radius: 0; background: transparent; }
    .seg > * + * { border-left: 1px solid var(--divider-color) !important; }
    .seg > button.on { background: color-mix(in srgb, var(--primary-color) 18%, transparent); color: var(--primary-color); }
    .tb-check { margin: 0 !important; padding: 0 8px; gap: 4px !important; }
    .toolbar .status { display: inline-flex; align-items: center; gap: 4px; min-width: 70px; justify-content: flex-end; }
    .toolbar .status.error { color: var(--error-color, #ef4444); }
    .search { display: flex; align-items: center; gap: 6px; border: 1px solid var(--divider-color); border-radius: 8px; padding: 0 8px; margin-bottom: 6px; background: var(--card-background-color); }
    .search input { flex: 1; min-width: 0; border: 0; background: transparent; color: var(--primary-text-color); font: inherit; padding: 7px 0; outline: none; }
    .pal-hint { margin-bottom: 4px; }
    .pal-group { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: var(--secondary-text-color); margin: 12px 0 4px; }
    .pi-icon { width: 32px; height: 32px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; flex: none;
      background: color-mix(in srgb, var(--primary-color) 14%, transparent); color: var(--primary-color); }
    .pi-desc { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .swatch { display: flex; align-items: center; gap: 6px; border: 1px solid var(--divider-color); border-radius: 8px; padding: 3px; background: var(--card-background-color); }
    .swatch.own { border-color: var(--primary-color); }
    .swatch input[type=color] { width: 26px !important; height: 26px !important; padding: 0 !important; border: 0 !important; border-radius: 6px; background: none; cursor: pointer; flex: none; }
    .swatch code { flex: 1; font-size: 11px; color: var(--secondary-text-color); overflow: hidden; }
    .btnrow { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
    .footer-btns { margin-top: 16px; }
    .right h3 { border-top: 1px solid var(--divider-color); padding-top: 14px; margin-top: 18px; }
    .right h3:first-child { border-top: 0; padding-top: 0; margin-top: 0; }
    .field input, .field select { min-width: 0; width: 100%; box-sizing: border-box; }
    input[type=checkbox] { accent-color: var(--primary-color); }
    input:focus-visible, select:focus-visible, button:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 1px; }
    .col { scrollbar-width: thin; }
    .main { flex: 1; display: grid; grid-template-columns: 240px minmax(0, 1fr) 320px; min-height: 0; }
    .main.narrow { grid-template-columns: 1fr; grid-template-rows: auto auto auto; overflow: auto; }
    .col { overflow: auto; padding: 12px; min-height: 0; }
    .left { border-right: 1px solid var(--divider-color); }
    .right { border-left: 1px solid var(--divider-color); }
    .center { display: flex; flex-direction: column; align-items: center; justify-content: flex-start; gap: 12px; padding: 24px 12px; overflow: auto; }
    h3 { font-size: 13px; text-transform: uppercase; letter-spacing: .06em; color: var(--secondary-text-color); margin: 16px 0 8px; font-weight: 600; }
    h3:first-child { margin-top: 0; }
    .palette-item { display: flex; gap: 8px; align-items: center; padding: 6px 8px; border-radius: 6px; cursor: grab; border: 1px solid transparent; }
    .palette-item:hover { border-color: var(--divider-color); background: rgba(127,127,127,.08); }
    .glyph { font-family: "${Le(De)}"; font-size: 20px; width: 24px; text-align: center; }
    .pi-text { display: flex; flex-direction: column; min-width: 0; }
    .pi-name { font-size: 14px; }
    .pi-desc { font-size: 11px; color: var(--secondary-text-color); }
    .page-row { display: flex; align-items: center; gap: 6px; padding: 4px 6px; border-radius: 6px; cursor: pointer; }
    .page-row.active { background: rgba(127,127,127,.18); }
    .page-row .pname { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .page-row .muted { font-size: 11px; color: var(--secondary-text-color); }
    .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; font-size: 13px; }
    .field > span { color: var(--secondary-text-color); }
    .field input[type=text], .field input[type=number], .field select { padding: 7px; border-radius: 6px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); font: inherit; }
    .check { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; font-size: 13px; }
    .row4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
    .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .issues { border-top: 1px solid var(--divider-color); padding: 6px 12px; max-height: 120px; overflow: auto; font-size: 13px; }
    .issue { display: flex; gap: 6px; padding: 2px 0; cursor: pointer; }
    .issue.error { color: var(--error-color, #ef4444); }
    .issue.warning { color: var(--warning-color, #f59e0b); }
    .ok { color: var(--success-color, #22c55e); }
    .note { font-size: 12px; color: var(--secondary-text-color); max-width: 640px; text-align: center; }
    .zoom { display: flex; gap: 4px; align-items: center; }
    .danger { color: var(--error-color, #ef4444); }
    .crow { display: flex; gap: 4px; align-items: center; }
    .muted { font-size: 12px; color: var(--secondary-text-color); }
    h4 { margin: 12px 0 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: var(--secondary-text-color); }
    .trigger { border: 1px solid var(--divider-color); border-radius: 8px; padding: 6px; margin: 6px 0; display: flex; flex-direction: column; gap: 6px; }
    .trigger > .crow b { flex: 1; font-size: 13px; }
    .step { display: flex; flex-direction: column; gap: 4px; padding: 6px; border-radius: 6px; background: var(--secondary-background-color, rgba(127,127,127,.08)); }
    .step select, .step input[type=text], .step input[type=number], .trigger select { font-size: 13px !important; padding: 5px; border-radius: 6px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); font: inherit; min-width: 0; }
    .step .crow select { flex: 1; }
    .stepno { width: 18px; height: 18px; border-radius: 9px; background: var(--primary-color); color: var(--text-primary-color, #fff); font-size: 11px; display: inline-flex; align-items: center; justify-content: center; }
    .cond, .rule { border: 1px solid var(--divider-color); border-radius: 8px; padding: 6px; margin: 6px 0; display: flex; flex-direction: column; gap: 4px; }
    .rule .cond { border: 0; padding: 0; margin: 0; }
    .cond select, .cond input[type=text] { padding: 5px; border-radius: 6px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); font: inherit; min-width: 0; flex: 1; }
    .field.color input[type=color] { width: 100%; height: 30px; padding: 0 2px; border: 1px solid var(--divider-color); border-radius: 6px; background: none; }
    input[type=range] { width: 100%; }
  `;
  fitScale() {
    if (!this._project) return 2;
    const e = this.resolved();
    if (!e) return 2;
    if (this._zoom !== "fit") return this._zoom;
    const t = this._avail ?? { w: window.innerWidth - 640, h: window.innerHeight - 200 }, i = t.w - 24 - 8, s = this.narrow ? 1 / 0 : t.h - 48 - 40, r = Math.min(i / e.width, s / e.height);
    return Math.max(1, Math.min(3, Math.floor(r * 4) / 4));
  }
  updated() {
    const e = this.renderRoot.querySelector(".col.center");
    !e || this.resizeObserver || (this.resizeObserver = new ResizeObserver(([t]) => {
      const { width: i, height: s } = t.contentRect, r = { w: Math.round(i + 24), h: Math.round(s + 48) };
      (!this._avail || Math.abs(this._avail.w - r.w) > 4 || Math.abs(this._avail.h - r.h) > 4) && (this._avail = r);
    }), this.resizeObserver.observe(e));
  }
  resolved() {
    const e = this._project, t = this.boards[e.board];
    return t ? gi(t, e.board_variant, e.orientation) : null;
  }
  render() {
    const e = this._project;
    if (!e) return y`<div style="padding:24px">…</div>`;
    const t = this.resolved(), i = this.themes[e.theme], s = i ? { ...i, colors: { ...i.colors, ...e.theme_overrides ?? {} } } : void 0, r = { saved: d("saved"), saving: d("saving"), dirty: "•", error: d("save_failed") }[this._saveState], n = this._issues.filter((l) => l.level === "error").length;
    return y`
      <div class="toolbar">
        <button class="ghost" @click=${() => this.close()}>${te("mdi:arrow-left")}${d("projects")}</button>
        <span class="title">${e.name}</span>
        <span class="seg">
          <button ?disabled=${!this.undoStack.length} title="${d("undo")} (Strg+Z)" @click=${() => this.undo()}>${te("mdi:undo")}${d("undo")}</button>
          <button ?disabled=${!this.redoStack.length} title="${d("redo")} (Strg+Y)" @click=${() => this.redo()}>${te("mdi:redo")}${d("redo")}</button>
        </span>
        <span class="seg">
          <button class=${this._mode === "edit" ? "on" : ""} @click=${() => {
      this._mode = "edit", this._selected = [], this._overlay = null;
    }}>${te("mdi:pencil")}${d("edit_mode")}</button>
          <button class=${this._mode === "preview" ? "on" : ""} @click=${() => {
      this._mode = "preview", this._selected = [], this._overlay = null;
    }}>${te("mdi:play")}${d("preview_mode")}</button>
        </span>
        <span class="seg">
          <button class=${this._sample ? "on" : ""} title=${d("sample_data")} @click=${() => this._sample = !this._sample}>${te(this._sample ? "mdi:flask-outline" : "mdi:home-assistant")}${this._sample ? d("sample_data") : d("live_data")}</button>
          <button class=${this._night ? "on" : ""} @click=${() => this._night = !this._night}>${te("mdi:weather-night")}${d("night_view")}</button>
          ${this._mode === "preview" && e.settings?.device_actions !== !1 ? y`<button title=${d("test_message_hint")}
            @click=${() => this._message = this._message ? null : { title: d("test_message_title"), text: d("test_message_text") }}>${te("mdi:message-text-outline")}${d("test_message")}</button>` : Y}
          ${this.info?.preview_real_actions && this._mode === "preview" ? y`<label class="check tb-check" title=${d("real_actions")}>
            <input type="checkbox" .checked=${this._realActions} @change=${(l) => this._realActions = l.target.checked} />${te("mdi:flash")}</label>` : Y}
        </span>
        <span class="seg">
          <button title=${d("zoom_out")} @click=${() => this._zoom = Math.max(1, (this._zoom === "fit" ? this.fitScale() : this._zoom) - 0.5)}>${te("mdi:magnify-minus-outline")}</button>
          <button class=${this._zoom === "fit" ? "on" : ""} @click=${() => this._zoom = "fit"}>${d("zoom_fit")}</button>
          <button title=${d("zoom_in")} @click=${() => this._zoom = Math.min(3, (this._zoom === "fit" ? this.fitScale() : this._zoom) + 0.5)}>${te("mdi:magnify-plus-outline")}</button>
        </span>
        <button class="ghost" title=${d("png_hint")} @click=${() => this.savePng()}>${te("mdi:camera-outline")}PNG</button>
        <span class="status ${this._saveState}">${this._saveState === "saved" ? te("mdi:cloud-check-outline") : Y}${r}</span>
        <button class="primary" @click=${() => {
      this.flushSave(), this._showExport = !0;
    }}>${te("mdi:code-braces")}${d("generate_code")}${n ? ` (${n} ⚠)` : ""}</button>
      </div>
      <div class="main ${this.narrow ? "narrow" : ""}">
        ${this.narrow ? Y : y`<div class="col left">${this.renderPalette()}${this.renderPageTree()}</div>`}
        <div class="col center">
          ${t && s ? y`<cyd-screen .project=${e} .board=${t} .theme=${s} .pageId=${this._pageId}
            .state=${this.stateResolver()} .mode=${this._mode} .selected=${this._selected} .scale=${this.fitScale()}
            .night=${this._night} .now=${this._now}
            .overlay=${this._overlay ? { title: this._overlay.title, value: this._overlay.value, light: this._overlay.light } : null}
            .images=${this._images}
            .message=${this._message}
            @select=${(l) => this._selected = l.detail.ids}
            @widget-change=${(l) => this.editWidget(l.detail.id, (a) => Object.assign(a, l.detail.changes))}
            @widget-add=${(l) => this.addWidget(l.detail.type, l.detail)}
            @preview-tap=${this.onPreviewTap} @preview-swipe=${this.onPreviewSwipe}></cyd-screen>` : y`<div>Board/Theme?</div>`}
          <div class="note">${this.page && !this.page.widgets.length && this._mode === "edit" ? d("empty_page_hint") : d("next_step_hint")}</div>
          <div class="note">${d("preview_note")}</div>
          ${this.narrow ? y`<div style="width:100%">${this.renderPalette()}${this.renderPageTree()}</div>` : Y}
        </div>
        <div class="col right">${this.renderProperties()}</div>
      </div>
      ${e.id ? y`<cyd-device-status collapsed style="padding:6px 12px" .api=${this.api} .projectId=${e.id}
        .deviceName=${e.device_name}></cyd-device-status>` : Y}
      <div class="issues">
        ${this._issues.length ? this._issues.map((l) => y`<div class="issue ${l.level}" @click=${() => this.focusIssue(l)}>
          ${l.level === "error" ? "⛔" : "⚠"} ${Ee() === "de" ? l.message : l.message_en}</div>`) : y`<span class="ok">✓ ${d("no_issues")}</span>`}
      </div>
      ${this._showExport ? y`<cyd-export-dialog .api=${this.api} .project=${e} .info=${this.info}
        @closed=${() => this._showExport = !1}></cyd-export-dialog>` : Y}`;
  }
  focusIssue(e) {
    e.page && (this._pageId = e.page), e.widget && (this._selected = [e.widget]);
  }
  savePng() {
    const e = this.renderRoot.querySelector("cyd-screen");
    if (!e) return;
    const t = document.createElement("a");
    t.href = e.toPng(), t.download = `${this._project?.device_name ?? "cyd"}-${this._pageId}.png`, t.click();
  }
  close() {
    this.flushSave(), this.dispatchEvent(new CustomEvent("close-editor", { bubbles: !0, composed: !0 }));
  }
  renderPalette() {
    const e = this._paletteFilter.trim().toLowerCase(), t = Object.values(this.widgetDefs).filter((n) => !e || `${ne(n, "name")} ${ne(n, "description")} ${n.type}`.toLowerCase().includes(e)), i = new Set(si.flatMap(([, n]) => n)), s = [
      ...si.map(([n, l]) => [n, l.map((a) => t.find((c) => c.type === a)).filter((a) => !!a)]),
      ["group_other", t.filter((n) => !i.has(n.type))]
    ], r = (n) => y`<div class="palette-item" draggable="true" title=${ne(n, "description")}
        @dragstart=${(l) => l.dataTransfer?.setData(yt, n.type)}
        @click=${() => this.addWidget(n.type)}>
        <span class="glyph pi-icon">${je(n.icon) ?? ""}</span>
        <span class="pi-text"><span class="pi-name">${ne(n, "name")}</span><span class="pi-desc">${ne(n, "description")}</span></span>
      </div>`;
    return y`<h3>${d("palette")}</h3>
      <div class="search">${te("mdi:magnify")}<input type="search" placeholder=${d("palette_search")} .value=${this._paletteFilter}
        @input=${(n) => this._paletteFilter = n.target.value} /></div>
      <div class="muted pal-hint">${d("palette_hint")}</div>
      ${s.filter(([, n]) => n.length).map(([n, l]) => y`<div class="pal-group">${d(n)}</div>${l.map(r)}`)}
      ${t.length ? Y : y`<div class="muted">${d("palette_none")}</div>`}`;
  }
  renderPageTree() {
    const e = this._project, t = [], i = (s, r) => {
      for (const n of e.pages.filter((l) => (l.parent ?? null) === s))
        t.push(y`<div class="page-row ${n.id === this._pageId ? "active" : ""}" style="padding-left:${6 + r * 16}px"
            @click=${() => {
          this._pageId = n.id, this._selected = [];
        }}>
            <span class="glyph">${je(n.icon) ?? ""}</span>
            <span class="pname">${n.name}${e.navigation?.home_page === n.id ? " ⌂" : ""}
              ${!n.parent && n.in_navigation === !1 ? y`<span class="muted">(${d("hidden_in_navigation")})</span>` : Y}</span>
            <button class="small" title=${d("move_up")} @click=${(l) => {
          l.stopPropagation(), this.movePage(n.id, -1);
        }}>↑</button>
            <button class="small" title=${d("move_down")} @click=${(l) => {
          l.stopPropagation(), this.movePage(n.id, 1);
        }}>↓</button>
          </div>`), i(n.id, r + 1);
    };
    return i(null, 0), y`<h3>${d("pages")}</h3>${t}
      <div class="row2" style="margin-top:8px">
        <button @click=${() => this.addPage(null)}>+ ${d("add_page")}</button>
        <button ?disabled=${!this.page} @click=${() => this.addPage(this._pageId)}>+ ${d("add_subpage")}</button>
      </div>`;
  }
  // -- properties -----------------------------------------------------------------
  renderProperties() {
    const e = this.page;
    if (this._selected.length === 1 && e) {
      const t = e.widgets.find((i) => i.id === this._selected[0]);
      if (t) return this.renderWidgetProps(t);
    }
    return this._selected.length > 1 ? y`<h3>${this._selected.length} Widgets</h3>
        <button class="danger" @click=${() => this.deleteSelected()}>${d("delete_widget")}</button>` : y`${e ? this.renderPageProps(e) : Y}${this.renderProjectProps()}`;
  }
  text(e, t, i) {
    return y`<label class="field"><span>${e}</span><input type="text" .value=${String(t ?? "")}
      @change=${(s) => i(s.target.value)} /></label>`;
  }
  num(e, t, i, s, r) {
    return y`<label class="field"><span>${e}</span><input type="number" .value=${t == null ? "" : String(t)}
      min=${s ?? ""} max=${r ?? ""} @change=${(n) => {
      const l = n.target.value;
      i(l === "" ? null : Number(l));
    }} /></label>`;
  }
  check(e, t, i) {
    return y`<label class="check"><input type="checkbox" .checked=${!!t}
      @change=${(s) => i(s.target.checked)} />${e}</label>`;
  }
  select(e, t, i, s) {
    return y`<label class="field"><span>${e}</span><select @change=${(r) => s(r.target.value)}>
      ${i.map(([r, n]) => y`<option value=${r} ?selected=${String(t ?? "") === r}>${n}</option>`)}</select></label>`;
  }
  renderWidgetProps(e) {
    const t = this.widgetDefs[e.type], i = this._project, s = [["", `– ${d("none")} –`], ...i.pages.map((a) => [a.id, a.name])], r = (a) => this.editWidget(e.id, a), n = (a) => {
      const c = Ee() === "de" ? a.label : a.label_en, h = e.props[a.key] ?? a.default, b = (k) => r((A) => {
        A.props[a.key] = k;
      });
      switch (a.type) {
        case "text":
          return this.text(c, h, b);
        case "int":
          return this.num(c, h, (k) => b(k ?? a.default), a.min, a.max);
        case "bool":
          return this.check(c, h, b);
        case "select":
          return this.select(c, h, (a.options ?? []).map((k) => [k, Bn(k)]), b);
        case "page":
          return this.select(c, h, s, (k) => b(k || null));
        case "entity":
          return y`<div class="field"><span>${c}</span><cyd-entity-picker .hass=${this.hass}
          .value=${h ?? null} .domains=${a.domains ?? []}
          @value-changed=${(k) => b(k.detail.value)}></cyd-entity-picker>
          ${h ? y`<button class="small" @click=${() => b(null)}>✕</button>` : Y}</div>`;
        case "icon":
          return y`<div class="field"><span>${c}</span><cyd-icon-picker .value=${String(h ?? "")}
          @value-changed=${(k) => b(k.detail.value)}></cyd-icon-picker></div>`;
        default:
          return Y;
      }
    }, l = e.entity ? this._sim[e.entity] ?? "" : "";
    return y`
      <h3>${t ? ne(t, "name") : e.type}</h3>
      ${t?.entity === "required" || t?.entity === "optional" ? y`<div class="field"><span>${d("entity")}</span>
        <cyd-entity-picker .hass=${this.hass} .value=${e.entity ?? null} .domains=${t.domains}
          @value-changed=${(a) => this.pickEntity(e, a.detail.value)}></cyd-entity-picker></div>` : Y}
      ${t?.entity === "action" ? y`
        <div class="field"><span>${d("action_target")}</span>
          <cyd-entity-picker .hass=${this.hass} .value=${e.action?.target ?? null} .domains=${t.domains}
            @value-changed=${(a) => this.pickActionTarget(e, a.detail.value)}></cyd-entity-picker></div>
        ${this.text(d("action_service"), e.action?.service, (a) => r((c) => {
      c.action = { ...c.action ?? { service: "" }, service: a.trim() };
    }))}` : Y}
      ${t?.props.filter((a) => !a.min_count || Number(e.props.count ?? 4) >= a.min_count).map(n)}
      ${this.renderAppearance(e)}
      ${this.renderActions(e)}
      ${this.renderConditions(e)}
      ${this.renderRules(e)}
      <h3>${d("position")}</h3>
      <div class="row4">
        ${this.num("x", e.x, (a) => r((c) => {
      c.x = Math.max(0, a ?? 0);
    }), 0)}
        ${this.num("y", e.y, (a) => r((c) => {
      c.y = Math.max(0, a ?? 0);
    }), 0)}
        ${this.num("w", e.w, (a) => r((c) => {
      c.w = Math.max(1, a ?? 1);
    }), 1)}
        ${this.num("h", e.h, (a) => r((c) => {
      c.h = Math.max(1, a ?? 1);
    }), 1)}
      </div>
      ${e.entity ? this.select(
      d("simulate_state"),
      l,
      [["", d("sim_live")], ["on", d("sim_on")], ["off", d("sim_off")], ["unavailable", d("sim_unavailable")]],
      (a) => {
        const c = { ...this._sim };
        a ? c[e.entity] = a : delete c[e.entity], this._sim = c;
      }
    ) : Y}
      <div class="row2 footer-btns">
        <button @click=${() => this.copySelected()}>${te("mdi:content-duplicate")}${d("copy")}</button>
        <button class="danger" @click=${() => this.deleteSelected()}>${te("mdi:delete-outline")}${d("delete_widget")}</button>
      </div>`;
  }
  /** Background color / image chooser (image is fitted to the display size in the browser). */
  renderBackground(e, t, i) {
    const s = this.resolved(), r = () => {
      const l = document.createElement("input");
      l.type = "file", l.accept = "image/*", l.onchange = async () => {
        const a = l.files?.[0];
        if (!(!a || !s || !this._project)) {
          this._project.id || await this.flushSave();
          try {
            const c = await wn(a, s.width, s.height), { asset_id: h } = await this.api.uploadAsset(this._project.id, c, s.width, s.height), b = new Image();
            b.src = c, await b.decode(), this._images = { ...this._images, [h]: b }, t({ ...e ?? {}, image: h });
          } catch (c) {
            alert(`${d("bg_upload_failed")}: ${String(c.message ?? c)}`);
          }
        }
      }, l.click();
    }, n = !!e?.color;
    return y`<div class="field"><span class="muted">${i}</span></div>
      <div class="row2">
        <label class="field color"><span>${d("bg_color")}</span><span class="crow">
          <input type="color" .value=${e?.color ?? this.themed().colors.background}
            @change=${(l) => t({ ...e ?? {}, color: l.target.value })} />
          ${n ? y`<button class="small" title=${d("reset")} @click=${() => t(e?.image ? { image: e.image } : null)}>↺</button>` : Y}</span></label>
        <div class="field"><span>${d("bg_image")}</span>
          ${e?.image ? y`<span class="crow"><button class="small" @click=${r}>${d("bg_change")}</button>
            <button class="small danger" @click=${() => t(n ? { color: e.color } : null)}>✕</button></span>` : y`<button @click=${r}>${d("bg_choose")}</button>`}
        </div>
      </div>`;
  }
  /** Action builder: per trigger built-in / nothing / own steps. */
  renderActions(e) {
    const t = this._project, i = Object.entries(this.hass?.services ?? {}).flatMap(([n, l]) => Object.keys(l).map((a) => `${n}.${a}`)).sort(), s = t.pages.map((n) => [n.id, n.name]), r = (n) => {
      const l = Xe(e, n), a = (A) => this.editWidget(e.id, (x) => {
        A === null ? delete x[n] : x[n] = { actions: A };
      }), c = l === null ? "default" : l.length ? "custom" : "none", h = (A, x) => a(l.map((E, F) => F === A ? { ...E, ...x } : E)), b = (A, x) => {
        const E = [...l], [F] = E.splice(A, 1);
        E.splice(Math.max(0, Math.min(E.length, A + x)), 0, F), a(E);
      }, k = (A, x) => y`<div class="step">
        <div class="crow">
          <span class="stepno">${x + 1}</span>
          <select @change=${(E) => h(x, { type: E.target.value })}>
            ${Ti.map((E) => y`<option value=${E} ?selected=${A.type === E}>${d(`step_${E}`)}</option>`)}</select>
          <button class="small" title="↑" ?disabled=${x === 0} @click=${() => b(x, -1)}>↑</button>
          <button class="small" title="↓" ?disabled=${x === l.length - 1} @click=${() => b(x, 1)}>↓</button>
          <button class="small danger" @click=${() => a(l.filter((E, F) => F !== x))}>✕</button>
        </div>
        ${A.type === "toggle" ? y`<cyd-entity-picker .hass=${this.hass} .value=${A.entity ?? null} .domains=${[]}
            @value-changed=${(E) => h(x, { entity: E.detail.value })}></cyd-entity-picker>
          ${A.entity ? Y : y`<span class="muted">${d("this_entity")}</span>`}` : Y}
        ${A.type === "service" ? y`
          <input type="text" list="cyd-services" placeholder="light.turn_on" .value=${A.service ?? ""}
            @change=${(E) => h(x, { service: E.target.value.trim() })} />
          <cyd-entity-picker .hass=${this.hass} .value=${A.target ?? null} .domains=${[]}
            @value-changed=${(E) => h(x, { target: E.detail.value })}></cyd-entity-picker>
          <input type="text" placeholder=${d("step_data_hint")} .value=${A.data ? Object.entries(A.data).map(([E, F]) => `${E}=${String(F)}`).join(", ") : ""}
            @change=${(E) => h(x, { data: On(E.target.value) })} />` : Y}
        ${A.type === "page" ? y`<select @change=${(E) => h(x, { page: E.target.value })}>
            <option value="">– ${d("none")} –</option>
            ${s.map(([E, F]) => y`<option value=${E} ?selected=${A.page === E}>${F}</option>`)}</select>` : Y}
        ${A.type === "delay" ? y`<input type="number" min="0" max="60000" step="100" .value=${String(A.ms ?? 500)}
            @change=${(E) => h(x, { ms: Number(E.target.value) || 0 })} /> ms` : Y}
      </div>`;
      return y`<div class="trigger">
        <div class="crow"><b>${d(`trigger_${n}`)}</b>
          <select @change=${(A) => {
        const x = A.target.value;
        a(x === "default" ? null : x === "none" ? [] : [{ type: e.entity ? "toggle" : "page" }]);
      }}>
            <option value="default" ?selected=${c === "default"}>${d("trigger_default")}</option>
            <option value="none" ?selected=${c === "none"}>${d("trigger_none")}</option>
            <option value="custom" ?selected=${c === "custom"}>${d("trigger_custom")}</option>
          </select></div>
        ${l?.map(k)}
        ${c === "custom" ? y`<button class="small" @click=${() => a([...l, { type: "delay", ms: 500 }])}>+ ${d("add_step")}</button>` : Y}
      </div>`;
    };
    return y`<h3>${d("actions")}</h3>
      <div class="muted">${d("actions_hint")}</div>
      <datalist id="cyd-services">${i.map((n) => y`<option value=${n}></option>`)}</datalist>
      ${r("tap")}${r("long_press")}${r("double_tap")}`;
  }
  opOptions() {
    return vi.map((e) => [e, d(`op_${e}`)]);
  }
  /** One condition row: [entity] [operator] [value] – entity empty = the widget's own entity. */
  conditionRow(e, t, i, s) {
    const r = !["on", "off"].includes(e.op);
    return y`<div class="cond">
      <cyd-entity-picker .hass=${this.hass} .value=${e.entity ?? null} .domains=${[]}
        @value-changed=${(n) => t({ ...e, entity: n.detail.value })}></cyd-entity-picker>
      ${s && !e.entity ? y`<span class="muted">${d("this_entity")}</span>` : Y}
      <div class="crow">
        <select @change=${(n) => t({ ...e, op: n.target.value })}>
          ${this.opOptions().map(([n, l]) => y`<option value=${n} ?selected=${e.op === n}>${l}</option>`)}</select>
        ${r ? y`<input type="text" .value=${e.value ?? ""} placeholder=${d("value")}
          @change=${(n) => t({ ...e, value: n.target.value })} />` : Y}
        <button class="small danger" @click=${i}>✕</button>
      </div>
    </div>`;
  }
  renderConditions(e) {
    const t = e.visible_if ?? [], i = (s) => this.editWidget(e.id, (r) => {
      r.visible_if = s;
    });
    return y`<h3>${d("conditions")}</h3>
      <div class="muted">${d("conditions_hint")}</div>
      ${t.map((s, r) => this.conditionRow(
      s,
      (n) => i(t.map((l, a) => a === r ? n : l)),
      () => i(t.filter((n, l) => l !== r)),
      !1
    ))}
      <button class="small" @click=${() => i([...t, { entity: e.entity ?? null, op: "on" }])}>+ ${d("add_condition")}</button>`;
  }
  renderRules(e) {
    const t = e.style_rules ?? [], i = (r) => this.editWidget(e.id, (n) => {
      n.style_rules = r;
    }), s = (r, n, l, a) => y`
      <label class="field color"><span>${a}</span><span class="crow">
        <input type="color" .value=${r[l] ?? "#ef4444"} @change=${(c) => i(t.map((h, b) => b === n ? { ...h, [l]: c.target.value } : h))} />
        ${r[l] ? y`<button class="small" @click=${() => i(t.map((c, h) => {
      if (h !== n) return c;
      const b = { ...c };
      return delete b[l], b;
    }))}>↺</button>` : Y}
      </span></label>`;
    return y`<h3>${d("rules")}</h3>
      <div class="muted">${d("rules_hint")}</div>
      ${t.map((r, n) => y`<div class="rule">
        ${this.conditionRow(r, (l) => i(t.map((a, c) => c === n ? { ...a, ...l } : a)), () => i(t.filter((l, a) => a !== n)), !0)}
        <div class="row4">${s(r, n, "bg", d("color_bg"))}${s(r, n, "border", d("color_border"))}${s(r, n, "text", d("color_text"))}${s(r, n, "icon", d("icon"))}</div>
      </div>`)}
      <button class="small" @click=${() => i([...t, { entity: null, op: "gt", value: "25", text: "#ef4444" }])}>+ ${d("add_rule")}</button>`;
  }
  /** Theme of the project with the user's color overrides. */
  themed() {
    const e = this._project, t = this.themes[e.theme];
    return { ...t, colors: { ...t.colors, ...e.theme_overrides ?? {} } };
  }
  presetOptions(e) {
    return [["", e], ...Object.entries(fi.presets).map(([t, i]) => [t, ne(i, "name")])];
  }
  /** "Aussehen": preset, colors, opacity, corners, border, icon circle, text size – with apply-to-page / as default. */
  renderAppearance(e) {
    const t = this._project, i = e.style ?? {}, s = vt(this.themed(), { ...t.tile_style ?? {}, ...i }), r = (x, E) => this.editWidget(e.id, (F) => {
      const B = { ...F.style ?? {} };
      E == null || E === "" ? delete B[x] : B[x] = E, F.style = B;
    }), n = (x, E, F) => {
      const B = String(i[x] || F === void 0 ? s[x] : F);
      return y`<label class="field color"><span>${E}</span>
      <span class="swatch ${i[x] ? "own" : ""}"><input type="color" .value=${B} @change=${(Z) => r(x, Z.target.value)} />
      <code>${B}</code>
      ${i[x] ? y`<button class="small icon" title=${d("reset")} @click=${(Z) => {
        Z.preventDefault(), r(x, null);
      }}>↺</button>` : Y}</span></label>`;
    }, l = this.themed().colors, a = e.type === "binary_indicator", c = a ? l[e.props.alert_on ?? !0 ? "error" : "accent"] : void 0, h = ["slider", "media_player"].includes(e.type), b = h || ["gauge", "countdown"].includes(e.type), k = (x, E, F) => y`<label class="field"><span>${E}: ${s[x]}</span>
      <input type="range" min="0" max=${F} .value=${String(s[x])} @change=${(B) => r(x, Number(B.target.value))} /></label>`, A = ["toggle_tile", "sensor_value", "binary_indicator", "scene_button", "page_button"].includes(e.type) || e.type === "label" && e.props.background;
    return y`
      <h3>${d("appearance")}</h3>
      ${this.select(d("style_preset"), i.preset ?? "", this.presetOptions(d("style_project_default")), (x) => r("preset", x || null))}
      ${A ? y`<div class="row2">${n("bg", d("color_bg"))}${e.type === "toggle_tile" ? n("bg_on", d("color_bg_on")) : n("border", d("color_border"))}</div>` : Y}
      <div class="row2">${n("text", d("color_text"))}${n("icon_on", d("color_icon"), c)}</div>
      ${e.type === "toggle_tile" ? y`<div class="row2">${n("text_on", d("color_text_on"))}${n("icon", d("color_icon_off"))}</div>` : Y}
      ${a ? y`<div class="row2">${n("icon", d("color_icon_off"), l.on)}</div>` : Y}
      ${b ? y`<div class="row2">${n("track", d("color_track"))}${n("fill", d("color_fill"))}</div>
        ${h ? y`<div class="row2">${n("knob", d("color_knob"))}</div>` : Y}` : Y}
      ${A ? y`${k("bg_opa", d("opacity"), 100)}${k("radius", d("corners"), 40)}${k("border_width", d("border_width"), 4)}` : Y}
      <h4>${d("icon_and_font")}</h4>
      <div class="row2">
        ${this.select(d("icon_size"), s.icon_size, [["auto", d("auto")], ["none", d("icon_hidden")], ["s", "S"], ["m", "M"], ["l", "L"]], (x) => r("icon_size", x === "auto" ? null : x))}
        ${this.check(d("icon_circle"), s.circle, (x) => r("circle", x))}
      </div>
      ${this.check(d("show_label"), s.show_label, (x) => r("show_label", x ? null : !1))}
      <div class="row2">
        ${this.select(d("text_size"), s.text_size, [["xs", "XS"], ["s", "S"], ["m", "M"], ["l", "L"], ["xl", "XL"]], (x) => r("text_size", x))}
        ${this.select(d("text_weight"), s.text_weight, [["normal", d("weight_normal")], ["bold", d("weight_bold")]], (x) => r("text_weight", x === "normal" ? null : x))}
      </div>
      ${e.type === "sensor_value" ? this.select(d("value_size"), s.value_size, [["auto", d("auto")], ["xs", "XS"], ["s", "S"], ["m", "M"], ["l", "L"], ["xl", "XL"]], (x) => r("value_size", x === "auto" ? null : x)) : Y}
      <div class="btnrow">
        <button class="small" @click=${() => this.editPage((x) => {
      for (const E of x.widgets) E.id !== e.id && (E.style = { ...e.style ?? {} });
    })}>${te("mdi:content-copy")}${d("style_to_page")}</button>
        <button class="small" @click=${() => this.mutate((x) => {
      x.tile_style = { ...e.style ?? {} };
      for (const E of x.pages) for (const F of E.widgets) F.id === e.id && E.id === this._pageId && (F.style = {});
    })}>${te("mdi:star-outline")}${d("style_as_default")}</button>
        ${Object.keys(i).length ? y`<button class="small" @click=${() => this.editWidget(e.id, (x) => {
      x.style = {};
    })}>↺ ${d("style_reset")}</button>` : Y}
      </div>`;
  }
  pickEntity(e, t) {
    const i = this.hass?.states[t];
    this.editWidget(e.id, (s) => {
      s.entity = t, !s.props.label && i && (s.props.label = String(i.attributes.friendly_name ?? "")), s.type === "sensor_value" && i && (!s.props.unit && i.attributes.unit_of_measurement && (s.props.unit = String(i.attributes.unit_of_measurement)), s.props.numeric = i.state === "unavailable" || i.state === "unknown" || !Number.isNaN(Number.parseFloat(i.state))), i?.attributes.icon && typeof i.attributes.icon == "string" && i.attributes.icon.startsWith("mdi:") && (s.props.icon = i.attributes.icon);
      const r = t.split(".")[0];
      i && s.type === "slider" && (r === "input_number" || r === "number") && (i.attributes.min !== void 0 && (s.props.min = Math.round(Number(i.attributes.min))), i.attributes.max !== void 0 && (s.props.max = Math.round(Number(i.attributes.max))), i.attributes.unit_of_measurement && (s.props.unit = String(i.attributes.unit_of_measurement))), i && s.type === "climate" && (i.attributes.min_temp !== void 0 && (s.props.min = Math.round(Number(i.attributes.min_temp))), i.attributes.max_temp !== void 0 && (s.props.max = Math.round(Number(i.attributes.max_temp)))), i && (s.type === "gauge" || s.type === "multi_value") && !s.props.unit && i.attributes.unit_of_measurement && (s.props.unit = String(i.attributes.unit_of_measurement));
    });
  }
  pickActionTarget(e, t) {
    const i = this.hass?.states[t], s = t.split(".")[0];
    this.editWidget(e.id, (r) => {
      r.action = { ...r.action ?? { service: "" }, target: t }, (!r.action.service || Object.values(ni).includes(r.action.service)) && (r.action.service = ni[s] ?? `${s}.turn_on`), !r.props.label && i && (r.props.label = String(i.attributes.friendly_name ?? ""));
    });
  }
  renderPageProps(e) {
    const t = this._project, i = [["", `– ${d("none")} –`], ...t.pages.filter((s) => s.id !== e.id).map((s) => [s.id, s.name])];
    return y`
      <h3>${d("page_settings")}</h3>
      ${this.text(d("page_name"), e.name, (s) => this.editPage((r) => {
      r.name = s || r.name;
    }))}
      <div class="field"><span>${d("icon")}</span><cyd-icon-picker .value=${e.icon ?? ""}
        @value-changed=${(s) => this.editPage((r) => {
      r.icon = s.detail.value;
    })}></cyd-icon-picker></div>
      ${this.select(d("parent_page"), e.parent ?? "", i, (s) => this.editPage((r) => {
      s && mi({ ...t, pages: t.pages.map((n) => n.id === r.id ? { ...n, parent: s } : n) }, r).id === r.id || (r.parent = s || null, r.in_navigation = !r.parent);
    }))}
      ${e.parent ? Y : this.check(d("in_navigation"), e.in_navigation ?? !0, (s) => this.editPage((r) => {
      r.in_navigation = s;
    }))}
      ${this.renderBackground(e.background ?? null, (s) => this.editPage((r) => {
      r.background = s;
    }), d("bg_page_hint"))}
      ${this.num(d("page_timeout"), e.timeout_s ?? null, (s) => this.editPage((r) => {
      r.timeout_s = s && s >= 5 ? s : null;
    }), 5)}
      <div class="row2">
        <button @click=${() => this.mutate((s) => {
      s.navigation = { ...s.navigation, home_page: e.id };
    })}
          ?disabled=${t.navigation?.home_page === e.id}>⌂ ${d("home_page")}</button>
        <button class="danger" ?disabled=${t.pages.length <= 1} @click=${() => this.deletePage(e.id)}>${d("delete")}</button>
      </div>`;
  }
  renderProjectProps() {
    const e = this._project, t = this.boards[e.board], i = (a) => this.mutate(a), s = [["", d("variant_default")], ...(t?.display.variants ?? []).map((a) => [a.id, ne(a, "label")])], r = Object.keys(t?.orientations ?? {}).map((a) => [a, d(a)]), n = e.navigation ?? {}, l = e.settings ?? {};
    return y`
      <h3>${d("project_settings")}</h3>
      ${this.text(d("project_name"), e.name, (a) => i((c) => {
      c.name = a || c.name;
    }))}
      ${this.text(d("device_name"), e.device_name, (a) => i((c) => {
      c.device_name = Se(a);
    }))}
      ${this.select(d("board"), e.board, Object.values(this.boards).map((a) => [a.id, ne(a, "name")]), (a) => i((c) => {
      c.board = a, c.board_variant = null;
    }))}
      ${this.select(d("board_variant"), e.board_variant ?? "", s, (a) => i((c) => {
      c.board_variant = a || null;
    }))}
      ${this.select(d("orientation"), e.orientation, r, (a) => i((c) => {
      c.orientation = a;
    }))}
      <h3>${d("grid")}</h3>
      <div class="row4">
        ${this.num(d("cols"), e.grid?.cols, (a) => i((c) => {
      c.grid = { ...c.grid, cols: Math.max(1, Math.min(12, a ?? 4)) };
    }), 1, 12)}
        ${this.num(d("rows"), e.grid?.rows, (a) => i((c) => {
      c.grid = { ...c.grid, rows: Math.max(1, Math.min(12, a ?? 3)) };
    }), 1, 12)}
        ${this.num(d("gap"), e.grid?.gap, (a) => i((c) => {
      c.grid = { ...c.grid, gap: Math.max(0, a ?? 8) };
    }), 0, 32)}
        ${this.num(d("padding"), e.grid?.padding, (a) => i((c) => {
      c.grid = { ...c.grid, padding: Math.max(0, a ?? 8) };
    }), 0, 32)}
      </div>
      ${this.select(d("theme"), e.theme, Object.values(this.themes).map((a) => [a.id, a.name]), (a) => i((c) => {
      c.theme = a;
    }))}
      ${this.select(
      d("style_default"),
      e.tile_style?.preset ?? "",
      this.presetOptions(d("style_theme_default")),
      (a) => i((c) => {
        c.tile_style = { ...c.tile_style ?? {}, preset: a || void 0 }, a || delete c.tile_style.preset;
      })
    )}
      ${this.check(
      d("icon_circle"),
      vt(this.themed(), e.tile_style ?? {}).circle,
      (a) => i((c) => {
        c.tile_style = { ...c.tile_style ?? {}, circle: a };
      })
    )}
      <label class="field"><span>${d("accent")}</span><input type="color" .value=${e.theme_overrides?.accent ?? this.themes[e.theme]?.colors.accent ?? "#22d3ee"}
        @change=${(a) => i((c) => {
      c.theme_overrides = { ...c.theme_overrides, accent: a.target.value };
    })} /></label>
      ${this.select(d("language"), l.language ?? "de", [["de", "Deutsch"], ["en", "English"]], (a) => i((c) => {
      c.settings = { ...c.settings, language: a };
    }))}
      <h3>${d("background")}</h3>
      ${this.renderBackground(e.background ?? null, (a) => i((c) => {
      c.background = a;
    }), d("bg_project_hint"))}
      <h3>${d("header")}</h3>
      ${this.check(d("header_enabled"), e.global?.header?.enabled ?? !0, (a) => i((c) => {
      c.global = { ...c.global, header: { ...c.global?.header ?? {}, enabled: a } };
    }))}
      <h3>${d("navigation")}</h3>
      ${this.select(d("nav_style"), n.style ?? "tabbar", [["tabbar", d("nav_tabbar")], ["none", d("nav_none")]], (a) => i((c) => {
      c.navigation = { ...c.navigation, style: a };
    }))}
      ${n.style !== "none" ? y`
        ${this.select(
      d("tabbar_position"),
      n.tabbar_position ?? "bottom",
      [["bottom", d("pos_bottom")], ["top", d("pos_top")], ["left", d("pos_left")]],
      (a) => i((c) => {
        c.navigation = { ...c.navigation, tabbar_position: a };
      })
    )}
        ${this.check(d("show_icons"), n.show_icons ?? !0, (a) => i((c) => {
      c.navigation = { ...c.navigation, show_icons: a };
    }))}
        ${this.check(d("show_labels"), n.show_labels ?? !0, (a) => i((c) => {
      c.navigation = { ...c.navigation, show_labels: a };
    }))}` : Y}
      ${this.check(d("swipe"), n.swipe ?? !0, (a) => i((c) => {
      c.navigation = { ...c.navigation, swipe: a };
    }))}
      ${this.check(d("wrap_around"), n.wrap_around ?? !1, (a) => i((c) => {
      c.navigation = { ...c.navigation, wrap_around: a };
    }))}
      ${this.num(d("return_home_after"), l.return_home_after_s ?? 30, (a) => i((c) => {
      c.settings = { ...c.settings, return_home_after_s: a ?? 0 };
    }), 0)}
      <h3>${d("screensaver")}</h3>
      ${this.check(d("screensaver"), l.screensaver?.enabled ?? !1, (a) => i((c) => {
      c.settings = { ...c.settings, screensaver: { ...c.settings?.screensaver, enabled: a } };
    }))}
      ${l.screensaver?.enabled ? this.num(d("screensaver_after"), l.screensaver?.after_s ?? 60, (a) => i((c) => {
      c.settings = { ...c.settings, screensaver: { ...c.settings?.screensaver, after_s: Math.max(5, a ?? 60) } };
    }), 5) : Y}
      <div class="row2">
        ${this.num(d("brightness_day"), l.brightness_day ?? 100, (a) => i((c) => {
      c.settings = { ...c.settings, brightness_day: Math.max(1, Math.min(100, a ?? 100)) };
    }), 1, 100)}
        ${this.num(d("brightness_night"), l.brightness_night ?? 25, (a) => i((c) => {
      c.settings = { ...c.settings, brightness_night: Math.max(0, Math.min(100, a ?? 25)) };
    }), 0, 100)}
      </div>
      ${this.check(d("device_actions"), l.device_actions ?? !0, (a) => i((c) => {
      c.settings = { ...c.settings, device_actions: a };
    }))}
      ${this.check(d("rgb_led"), l.rgb_led?.enabled ?? !1, (a) => i((c) => {
      c.settings = { ...c.settings, rgb_led: { ...c.settings?.rgb_led, enabled: a } };
    }))}`;
  }
}
customElements.define("cyd-editor", Dn);
class jn extends ae {
  static properties = {
    hass: { attribute: !1 },
    narrow: { type: Boolean },
    route: { attribute: !1 },
    panel: { attribute: !1 },
    _ready: { state: !0 },
    _error: { state: !0 },
    _view: { state: !0 }
  };
  api;
  info;
  boards = {};
  widgetDefs = {};
  themes = {};
  templates = [];
  constructor() {
    super(), this._ready = !1, this._error = null, this._view = { name: "list" };
  }
  static styles = be`
    :host { display: block; height: 100%; background: var(--primary-background-color); font-family: var(--paper-font-body1_-_font-family, Roboto, sans-serif); }
    .error { padding: 24px; color: var(--error-color); }
    .loading { padding: 24px; color: var(--secondary-text-color); }
    cyd-editor { height: 100vh; }
  `;
  willUpdate(e) {
    e.has("hass") && this.hass && (_i(this.hass.language ?? "en"), this.api ? this.api.setHass(this.hass) : (this.api = new Vi(this.hass), this.init()));
  }
  async init() {
    try {
      const e = this.api, [t, i, s, r, n] = await Promise.all([
        e.info(),
        e.boards(),
        e.widgets(),
        e.themes(),
        e.templates()
      ]);
      this.info = t, this.boards = Object.fromEntries(i.map((a) => [a.id, a])), this.widgetDefs = Object.fromEntries(s.map((a) => [a.type, a])), this.themes = Object.fromEntries(r.map((a) => [a.id, a])), this.templates = n, await Promise.all([rs(), ls(t.icons_url)]);
      const l = location.hash.match(/^#project=(\w+)/);
      l && (this._view = { name: "editor", id: l[1] }), this._ready = !0;
    } catch (e) {
      this._error = String(e.message ?? e);
    }
  }
  go(e) {
    this._view = e, history.replaceState(null, "", e.name === "editor" ? `#project=${e.id}` : location.pathname);
  }
  render() {
    if (this._error) return y`<div class="error">CYD Studio: ${this._error}</div>`;
    if (!this._ready) return y`<div class="loading">CYD Studio …</div>`;
    const e = this._view;
    return e.name === "wizard" ? y`<cyd-wizard .hass=${this.hass} .api=${this.api} .info=${this.info} .boards=${this.boards} .templates=${this.templates}
        @cancel=${() => this.go({ name: "list" })}
        @open-project=${(t) => this.go({ name: "editor", id: t.detail.id })}></cyd-wizard>` : e.name === "editor" ? y`<cyd-editor .hass=${this.hass} .api=${this.api} .info=${this.info} .boards=${this.boards}
        .widgetDefs=${this.widgetDefs} .themes=${this.themes} .projectId=${e.id} .narrow=${this.narrow}
        @close-editor=${() => this.go({ name: "list" })}></cyd-editor>` : y`${Y}<cyd-project-list .api=${this.api} .boards=${this.boards} .themes=${this.themes}
      @new-project=${() => this.go({ name: "wizard" })}
      @open-project=${(t) => this.go({ name: "editor", id: t.detail.id })}></cyd-project-list>`;
  }
}
customElements.define("cyd-studio-panel", jn);
