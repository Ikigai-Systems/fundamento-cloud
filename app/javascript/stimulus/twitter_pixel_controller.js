import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = { id: String }

  connect() {
    if (!this.idValue || !window.posthog) return;

    this.loaded = false;
    this.boundOnConsentChange = this.onConsentChange.bind(this);
    document.addEventListener("consent:changed", this.boundOnConsentChange);

    this.checkConsentAndLoad();
  }

  disconnect() {
    if (this.boundOnConsentChange) {
      document.removeEventListener("consent:changed", this.boundOnConsentChange);
    }
  }

  onConsentChange() {
    this.checkConsentAndLoad();
  }

  checkConsentAndLoad() {
    if (this.loaded) return;
    if (!window.posthog || window.posthog.get_explicit_consent_status() !== "granted") return;

    this.loaded = true;
    this.loadPixel();
  }

  loadPixel() {
    !function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);},s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');

    window.twq('config', this.idValue);
  }
}
