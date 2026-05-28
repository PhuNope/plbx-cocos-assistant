import { HtmlBuilder } from '../html-builder';
import { NetworkConfig, PackageConfig } from '../../../shared/types';
import { BaseAdapter } from './base';

/**
 * Moloco V2.0 (Launcher API) adapter.
 *
 * Spec: Moloco Playable Ad Integration v2.0 (Feb 2026).
 *
 * Build emits two files via the packager's launcher-payload branch:
 *  - launcher.html (< 3 KB) — submitted to Moloco QA via account manager
 *  - payload.js (IIFE) — uploaded through Moloco /cm/v1/creative-assets API
 *
 * Adapter responsibility: produce the plbx_html bridge that translates game
 * lifecycle callbacks into MOLOCO_MACROS impression beacons + mraid.open()
 * for the CTA. The macros object is provisioned by launcher.html at runtime;
 * the DSP substitutes the #...# placeholders before serving.
 */

const MOLOCO_V2_DEFAULT_TAP_ENGAGEMENT = 1;
const MOLOCO_V2_DEFAULT_TAP_REDIRECTION = 3;

function molocoV2Bridge(): string {
  return `(function(){
var M = window.MOLOCO_MACROS || {};
function decode(v) {
  if (v == null) return '';
  try { return decodeURIComponent(v); } catch(e) { return String(v); }
}
function fire(k) {
  var u = M[k];
  if (!u) return;
  var dec = decode(u);
  if (!dec) return;
  try { (new Image()).src = dec; } catch(e) {}
}
function macroInt(k, fallback) {
  var raw = decode(M[k]);
  var n = parseInt(raw, 10);
  return (isFinite(n) && n > 0) ? n : fallback;
}
var taps = 0;
window.plbx_html = window.plbx_html || {};
window.plbx_html.google_play_url = window.plbx_html.google_play_url || "";
window.plbx_html.appstore_url = window.plbx_html.appstore_url || "";
window.plbx_html.download = function(url) {
  fire('click');
  fire('engagement');
  try {
    var dest = M.final_url ? decode(M.final_url) : (url || "");
    if (window.mraid && dest) { mraid.open(dest); }
    else if (dest) { window.open(dest, '_blank'); }
  } catch(e) {}
};
window.plbx_html.game_end = function() { fire('complete'); };
window.plbx_html.game_ready = function() { fire('game_viewable'); };
window.plbx_html.is_audio = function() { return true; };
window.plbx_html.is_hide_download = function() { return false; };
window.plbx_html.is_muted = function() {
  var sm = decode(M.start_muted);
  return sm === '1' || sm === 'true';
};
window.plbx_html.report = function(k) { fire(k); };
window.plbx_html.tap = function() {
  taps++;
  var te = macroInt('taps_for_engagement', ${MOLOCO_V2_DEFAULT_TAP_ENGAGEMENT});
  var tr = macroInt('taps_for_redirection', ${MOLOCO_V2_DEFAULT_TAP_REDIRECTION});
  if (taps === te) fire('engagement');
  if (taps === tr) fire('redirection');
};
window.super_html = window.super_html || window.plbx_html;
// Playables that hit FbPlayableAd directly (legacy FAN bridge in game code)
// still go through plbx_html. Pre-existing FbPlayableAd from the ad container
// is preserved via ||= so Moloco's own SDK (if any) takes precedence.
window.FbPlayableAd = window.FbPlayableAd || {
  onCTAClick: function() { window.plbx_html.download(); },
  onAdClicked: function() { fire('click'); },
  onPause: function() {},
  onResume: function() {}
};
})();`;
}

export class MolocoV2Adapter extends BaseAdapter {
  constructor(networkId: string, networkConfig: NetworkConfig) {
    super(networkId, networkConfig);
  }

  protected getPlbxBridge(_config: PackageConfig): string {
    return molocoV2Bridge();
  }

  transform(builder: HtmlBuilder, config: PackageConfig): void {
    super.transform(builder, config);
  }

  getForbiddenStrings(): string[] {
    // Moloco v2.0 spec section 2.5 — payload must not call out to non-Moloco
    // trackers. Guards against analytics SDKs accidentally pulled in by the game.
    return [
      'google-analytics.com',
      'googletagmanager.com',
      'doubleclick.net',
      'facebook.net/en_US/fbevents.js',
      'connect.facebook.net',
    ];
  }

  getRequiredStrings(): string[] {
    return [
      ...super.getRequiredStrings(),
      // Launcher structural markers
      'ASSET_PROVIDER=',
      'window.MOLOCO_MACROS',
      'mraid_viewable',
      'game_viewable',
      'click',
      'final_url',
      'taps_for_engagement',
      'taps_for_redirection',
      '%{IMP_BEACON}',
      '#PAYLOAD_URL#',
      // Payload bridge markers
      'decodeURIComponent',
      'window.plbx_html.report',
      'window.FbPlayableAd',
    ];
  }
}
