module.exports = {
  'plbx-cocos-extension': {
    title: 'Расширение Playbox',
    description: 'Инструменты сборки Playbox: отчёты, сжатие, упаковка и деплой.',
    'open-panel': 'Открыть панель Playbox',
    panels: {
      default: {
        title: 'Playbox',
      },
    },
    networks: {
      'moloco-v2': 'Moloco V2.0 (Launcher API)',
    },
    'moloco-v2-desc':
      'Создаёт launcher.html (<3KB) + payload.js (IIFE). Launcher отправляется в Moloco QA вручную, payload загружается через /cm/v1/creative-assets API.',
  },
};
