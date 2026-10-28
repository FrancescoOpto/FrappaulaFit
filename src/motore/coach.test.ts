import { describe, expect, it } from 'vitest';
import { avvisoEnergia, mediePesoSettimanali, trendCarichi, valutaCirconferenze, valutaPeso } from './coach';

describe('coach', () => {
  it('massa in deficit → avviso (info per principianti)', () => {
    expect(avvisoEnergia('massa', 'deficit', 'intermedio')?.livello).toBe('avviso');
    expect(avvisoEnergia('massa', 'deficit', 'principiante')?.livello).toBe('info');
    expect(avvisoEnergia('massa', 'surplus', 'intermedio')).toBeNull();
    expect(avvisoEnergia('definizione', 'deficit', 'intermedio')).toBeNull();
  });
  it('medie settimanali lun–dom', () => {
    const m = mediePesoSettimanali([
      { data: '2026-11-02', peso: 80 }, // lunedì
      { data: '2026-11-05', peso: 79.6 },
      { data: '2026-11-09', peso: 79.2 }, // lunedì successivo
    ]);
    expect(m.length).toBe(2);
    expect(m[0].media).toBe(79.8);
    expect(m[1].media).toBe(79.2);
  });
  it('taratura: troppo lento → −100/200; troppo veloce → avviso; niente prima di 3 medie', () => {
    const lento = [{ settimana: 'a', media: 80, n: 3 }, { settimana: 'b', media: 79.95, n: 3 }, { settimana: 'c', media: 79.9, n: 3 }];
    expect(valutaPeso(lento, 'definizione', -0.625)?.regola).toBe('taratura_calorie');
    const veloce = [{ settimana: 'a', media: 80, n: 3 }, { settimana: 'b', media: 78.8, n: 3 }, { settimana: 'c', media: 77.6, n: 3 }];
    expect(valutaPeso(veloce, 'definizione', -0.625)?.regola).toBe('ritmo_dimagrimento');
    expect(valutaPeso(lento.slice(0, 2), 'definizione', -0.625)).toBeNull();
    const ok = [{ settimana: 'a', media: 80, n: 3 }, { settimana: 'b', media: 79.5, n: 3 }, { settimana: 'c', media: 79, n: 3 }];
    expect(valutaPeso(ok, 'definizione', -0.625)).toBeNull();
  });
  it('braccio vs vita e trend carichi', () => {
    expect(valutaCirconferenze([{ data: '2026-11-01', vita: 90, braccio: 36 }, { data: '2026-11-29', vita: 86, braccio: 35 }])?.regola).toBe('braccio_vs_vita');
    expect(valutaCirconferenze([{ data: '2026-11-01', vita: 90, braccio: 36 }, { data: '2026-11-29', vita: 86, braccio: 35.8 }])).toBeNull();
    expect(trendCarichi('Panca', [1200, 1150, 1100])?.regola).toBe('trend_carichi');
    expect(trendCarichi('Panca', [1200, 1250, 1100])).toBeNull();
  });
});
