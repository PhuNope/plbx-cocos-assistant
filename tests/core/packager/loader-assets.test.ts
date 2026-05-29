import { describe, it, expect } from 'vitest';
import { emitAssetIO } from '../../../src/core/packager/loader/assets';

describe('emitAssetIO (Facebook-safe)', () => {
  const js = emitAssetIO({});

  it('defines window._XMLLocalRequest and contains NO literal XMLHttpRequest', () => {
    expect(js).toContain('window._XMLLocalRequest =');
    // FB blocks/rewrites the literal "XMLHttpRequest" → _xrq_. The loader must
    // not reference it; the engine is rewritten to use _XMLLocalRequest.
    expect(js).not.toContain('XMLHttpRequest');
  });

  it('_XMLLocalRequest completes via direct onload (no dispatchEvent)', () => {
    expect(js).not.toContain('dispatchEvent');
    expect(js).toContain('self.onload()');
  });

  it('defines window._createLocalJSElement using an inert custom tag (no real <script>)', () => {
    expect(js).toContain('window._createLocalJSElement =');
    expect(js).toContain("createElement('plbx-script')");
    expect(js).not.toContain("createElement('script')");
  });

  it('registers image+font downloader handlers reading plbx_getRes', () => {
    expect(js).toContain('assetManager.downloader.register');
    expect(js).toContain('plbx_getRes');
    expect(js).toContain("'.png': loadImage");
    expect(js).toContain("'.ttf': loadFont");
    // json/bin/cconb go via _XMLLocalRequest (arraybuffer); audio must NOT be
    // handler-intercepted — WebAudio needs the arraybuffer, an <audio> element
    // would break decodeAudioData → silence.
    expect(js).not.toContain("'.cconb'");
    expect(js).not.toContain("loadAudio");
    expect(js).not.toContain("'.mp3'");
  });

  it('fetch override enforces the no-network policy for off-cache URLs', () => {
    expect(js).toContain('window.fetch =');
    expect(js).toContain('_isExternalUrl(url)');
  });
});
