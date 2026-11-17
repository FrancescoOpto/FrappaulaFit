import { describe, expect, it, vi } from 'vitest';

// Il salvataggio su IndexedDB non serve qui: si prova solo la logica dello stato.
vi.mock('./db', async (orig) => ({ ...(await orig<typeof import('./db')>()), salvaChiave: vi.fn(async () => {}), salvaMeta: vi.fn(async () => {}) }));

import { valutaRicalcolo } from '../motore/ricalcolo';
import { aggiornaSerie, creaProfilo, iniziaSeduta, salvaTest, stato } from './stato';

// App di lei: il giudizio "Facile / Giusto / Al limite" c'è solo sull'ultima serie dei fondamentali e serve al
// ricalcolo del massimale (ripetizioni di riserva 2 / 1 / 0). Arriva dopo "Serie fatta": cambiarlo rifà il ricalcolo.
describe('Lei: giudizio dell\'ultima serie sui fondamentali', () => {
  it('il giudizio dato dopo "Serie fatta" cambia il massimale; tornando ad "Al limite" si torna al valore di prima', async () => {
    await creaProfilo({ nome: 'Prova', esperienza: 'intermedio', obiettivo: 'mantenimento', mesi: 6 });
    await salvaTest('squat', 50, 5, 'stima');
    const rm1Test = stato.value.programma!.test.squat.rm1;
    const s = stato.value.programma!.sedute.find((x) => x.fase === 'fase1' && x.giorno === 'A')!;
    await iniziaSeduta(s.id, 'classica');
    const voce = Object.entries(stato.value.registro[s.id].voci).find(([, v]) => v.esercizio_id === 'squat')!;
    const [voceId, rv] = voce;
    const ultima = rv.serie[rv.serie.length - 1];
    // Aumento piccolo: con 0 ripetizioni di riserva non basta per il ricalcolo, con 2 sì.
    let kg = (ultima.kg_piano ?? ultima.kg_prev) + 0.5;
    while (valutaRicalcolo(rm1Test, kg, ultima.rip_prev, 0).aggiorna || !valutaRicalcolo(rm1Test, kg, ultima.rip_prev, 2).aggiorna) kg += 0.5;
    for (const x of rv.serie) await aggiornaSerie(s.id, voceId, x.n, { kg: x.n === ultima.n ? kg : undefined, rip: x.rip_prev, fatta: true });
    const rm1 = () => stato.value.programma!.test.squat.rm1;
    expect(rm1()).toBe(rm1Test);
    await aggiornaSerie(s.id, voceId, ultima.n, { sforzo: 'facile' });
    expect(rm1()).toBe(valutaRicalcolo(rm1Test, kg, ultima.rip_prev, 2).stima);
    expect(stato.value.programma!.carichiCorrenti.squat).toBeUndefined();
    await aggiornaSerie(s.id, voceId, ultima.n, { sforzo: 'limite' });
    expect(rm1()).toBe(rm1Test);
    expect(stato.value.programma!.carichiCorrenti.squat?.kg).toBe(kg);
  });
});
