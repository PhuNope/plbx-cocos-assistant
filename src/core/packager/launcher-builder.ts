/**
 * Moloco V2.0 launcher.html generator.
 *
 * Spec (Moloco Playable Ad Integration v2.0, Feb 2026):
 * - Metadata comment header with ASSET_PROVIDER / ASSET_TITLE / ASSET_REVISION / ASSET_VERSION
 * - <script src="mraid.js"> reference
 * - window.MOLOCO_MACROS object with macro placeholders Moloco DSP fills server-side
 * - <script src="$PAYLOAD_URL"> pulling in the IIFE payload (URL injected post-upload)
 * - %{IMP_BEACON} placeholder Moloco substitutes with the impression beacon
 *
 * Strict size ceiling: 3 KB. Default config emits < 2 KB so longer asset titles
 * leave headroom.
 */

export interface LauncherBuildOptions {
  assetProvider: string;
  assetTitle: string;
  assetRevision: string;
  assetVersion: string;
  /** URL the launcher loads the payload IIFE from. Use '#PAYLOAD_URL#' for placeholder. */
  payloadUrl: string;
  includeSplash: boolean;
  /** Optional inline SVG markup for the splash element (used when includeSplash=true) */
  splashSvg?: string;
}

const PAYLOAD_URL_PLACEHOLDER = '#PAYLOAD_URL#';

function escapeHtml(s: string): string {
  return s.replace(/[<>&"]/g, (c) =>
    c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : '&quot;',
  );
}

/**
 * Render the launcher HTML. Output is minified — no leading whitespace, single line.
 */
export function buildLauncher(opts: LauncherBuildOptions): string {
  const meta =
    `<!--ASSET_PROVIDER=${escapeHtml(opts.assetProvider)};` +
    `ASSET_TITLE=${escapeHtml(opts.assetTitle)};` +
    `ASSET_REVISION=${escapeHtml(opts.assetRevision)};` +
    `ASSET_VERSION=${escapeHtml(opts.assetVersion)}-->`;

  // Moloco macros — DSP substitutes the #...# placeholders server-side at bid time.
  // Four are validator-required (mraid_viewable, game_viewable, click, final_url);
  // engagement/complete/redirection drive lifecycle beacons; start_muted controls audio;
  // taps_for_engagement/redirection are per-campaign thresholds the adapter reads at tap
  // time; cachebuster + draw_custom_close_button are DSP-side toggles.
  const macros =
    'window.MOLOCO_MACROS={' +
    'mraid_viewable:"#MRAID_VIEWABLE#",' +
    'game_viewable:"#GAME_VIEWABLE#",' +
    'click:"#CLICK#",' +
    'engagement:"#ENGAGEMENT#",' +
    'complete:"#COMPLETE#",' +
    'redirection:"#REDIRECTION#",' +
    'final_url:"#FINAL_URL#",' +
    'start_muted:"#START_MUTED#",' +
    'taps_for_engagement:"#TAPS_FOR_ENGAGEMENT#",' +
    'taps_for_redirection:"#TAPS_FOR_REDIRECTION#",' +
    'cachebuster:"#CACHEBUSTER#",' +
    'draw_custom_close_button:"#DRAW_CLOSE#"' +
    '};';

  const baseStyle = 'html,body{margin:0;height:100%;background:#000;overflow:hidden}';

  let splashBlock = '';
  let splashStyle = '';
  if (opts.includeSplash) {
    const svg =
      opts.splashSvg ||
      '<svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="28" fill="#fff"/><text x="32" y="38" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#000">PLBX</text></svg>';
    splashStyle = '#s{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:9}';
    splashBlock = `<div id=s>${svg}</div>`;
  }

  const head =
    '<head>' +
    '<meta charset=utf-8>' +
    '<meta name=viewport content="width=device-width,initial-scale=1,user-scalable=no">' +
    '<title>Ad</title>' +
    '<script src=mraid.js></script>' +
    `<script>${macros}</script>` +
    `<style>${baseStyle}${splashStyle}</style>` +
    '</head>';

  const body =
    '<body>' +
    splashBlock +
    `<script src="${opts.payloadUrl}"></script>` +
    '%{IMP_BEACON}' +
    '</body>';

  return `${meta}<!doctype html><html>${head}${body}</html>`;
}

/**
 * Replace the #PAYLOAD_URL# placeholder with the real CDN URL after the
 * payload has been uploaded (Moloco creative-assets API returns the asset_url).
 */
export function fillLauncherPayloadUrl(launcherHtml: string, payloadUrl: string): string {
  return launcherHtml.split(PAYLOAD_URL_PLACEHOLDER).join(payloadUrl);
}
