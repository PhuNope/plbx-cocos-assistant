module.exports = {
  'plbx-cocos-extension': {
    title: 'Playbox Extension',
    description: 'Playbox build tools: reports, compression, packaging and deployment.',
    'open-panel': 'Open Playbox Panel',
    panels: {
      default: {
        title: 'Playbox',
      },
    },
    networks: {
      'moloco-v2': 'Moloco V2.0 (Launcher API)',
    },
    'moloco-v2-desc':
      'Outputs launcher.html (<3KB) + payload.js (IIFE). Submit launcher to Moloco QA, upload payload via /cm/v1/creative-assets API.',
  },
};
