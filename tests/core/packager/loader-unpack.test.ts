import { describe, it, expect } from 'vitest';
import { emitUnpack } from '../../../src/core/packager/loader/unpack';
import { emitLifecycle } from '../../../src/core/packager/loader/lifecycle';

describe('unpack + lifecycle', () => {
  it('unpack populates __plbx_res and calls plbx_boot', () => {
    const js = emitUnpack({});
    expect(js).toContain('window.__plbx_res');
    expect(js).toContain('window.__plbx_js');
    expect(js).toContain('plbx_boot(');
    expect(js).toContain('loadAsync');
    expect(js).toContain('delete window.__plbx_zip');
  });

  it('lifecycle defines plbx_boot + plbx_boot_engine + gameReady + defer-boot gate', () => {
    const js = emitLifecycle({});
    expect(js).toContain('function plbx_boot(');
    expect(js).toContain('function plbx_boot_engine(');
    expect(js).toContain('window.gameReady');
    expect(js).toContain('__plbx_pre_boot');
    expect(js).toContain('window.__plbx_pre_boot(doBoot)');
  });
});
