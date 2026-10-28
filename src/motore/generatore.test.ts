import { describe, expect, it } from 'vitest';
import { alternative, generaSettimana, nuovoBlocco, primoCicloModificabile, rigeneraSeduteFuture } from './generatore';
import { RECUPERI_DEFAULT } from '../data/tabelle';
import type { ParametriGeneratore, Profilo } from '../tipi';
import { CONTENITORI } from '../data/contenitori';
import { ESERCIZI_PER_ID } from '../data/esercizi';

const base: ParametriGeneratore = { N: 3, T: 60, priorita: [], esclusi: [], esperienza: 'intermedio', preset: 'uomo_base', bloccoBreve: false };
const profilo: Pick<Profilo, 'sostituzioni' | 'esercizi_personalizzati' | 'impostazioni'> = {
  sostituzioni: {},
  esercizi_personalizzati: [],
  impostazioni: { arrotondamento: 0.5, fattore_lavoro: 0.9, recuperi: RECUPERI_DEFAULT, suoni: true, vibrazione: true, notifiche: false, stripping: false },
};

describe('contenitori: vincoli strutturali (SPEC §4.3)', () => {
  it('max 2 R1 per seduta, R1 sempre fondamentali, default esistenti', () => {
    for (const c of CONTENITORI) {
      expect(c.sessioni.length).toBe(c.N);
      for (const s of c.sessioni) {
        const r1 = s.slot.filter((x) => x.ruolo === 'R1');
        expect(r1.length, `${c.id} ${s.nome}`).toBeLessThanOrEqual(2);
        for (const slot of s.slot) {
          expect(ESERCIZI_PER_ID[slot.default], `${c.id} ${s.nome} ${slot.default}`).toBeDefined();
          expect(ESERCIZI_PER_ID[slot.default].classe).toBe(slot.classe);
          if (slot.ruolo === 'R1' || slot.ruolo === 'L') expect(ESERCIZI_PER_ID[slot.default].fondamentale, slot.default).toBe(true);
          if (slot.ruolo === 'C' || slot.ruolo === 'AB') {
            if (slot.ruolo === 'C') expect(slot.serie).toBeDefined();
          }
        }
        // Dorso senza fondamentale.
        expect(s.slot.some((x) => x.gruppo === 'dorso' && x.ruolo === 'R1')).toBe(false);
      }
    }
  });

  it('ogni gruppo grande compare in ≥2 sedute se N ≥ 3', () => {
    for (const c of CONTENITORI.filter((x) => x.N >= 3)) {
      for (const g of ['petto', 'dorso', 'spalle', 'gambe'] as const) {
        const n = c.sessioni.filter((s) => s.slot.some((x) => x.gruppo === g)).length;
        expect(n, `${c.id} ${g}`).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

describe('generaSettimana — N=3 uomo, T=60', () => {
  const r = generaSettimana(base, profilo);
  it('3 sessioni, 17 cicli, 51 sedute', () => {
    expect(r.sessioni.length).toBe(3);
    expect(r.cicliTotali).toBe(17);
    expect(r.seduteTotali).toBe(51);
  });
  it('copertura sottogruppi ≥ 4 serie', () => {
    for (const [sg, n] of Object.entries(r.copertura)) expect(n, sg).toBeGreaterThanOrEqual(4);
  });
  it('R1 mai toccati, max 2 per seduta; con T=60 le sedute pesanti sforano e l’app lo segnala', () => {
    for (const s of r.sessioni) expect(s.esercizi.filter((e) => e.ruolo === 'R1').length).toBeLessThanOrEqual(2);
    expect(r.sessioni[0].esercizi.map((e) => e.esercizio_id)).toContain('panca_piana');
    expect(r.sessioni[0].esercizi.map((e) => e.esercizio_id)).toContain('squat');
    expect(r.sessioni[1].esercizi.map((e) => e.esercizio_id)).toContain('military_press');
    expect(r.sessioni[1].esercizi.map((e) => e.esercizio_id)).toContain('stacco_da_terra');
    // Il military è la guida delle spalle: Target R2 a carico fisso, non fondamentale (TEST_INIZIO_BLOCCO §1b).
    expect(r.sessioni[1].esercizi.find((e) => e.esercizio_id === 'military_press')?.tabella).toBe('R3b');
    // I complementari di copertura restano (almeno 2 serie), gli altri possono sparire.
    expect(r.sessioni[1].esercizi.some((e) => e.esercizio_id === 'leg_curl')).toBe(true);
    const sfora = r.sessioni.filter((s) => s.durataS > 62 * 60);
    if (sfora.length) expect(r.avvisi.some((a) => /oltre il limite/.test(a))).toBe(true);
  });
});

describe('generaSettimana — N=3 uomo, T=75 (tutto nei limiti)', () => {
  const r = generaSettimana({ ...base, T: 75 }, profilo);
  it('gruppi grandi ≥ 10, nessuna seduta oltre T+2, nessun avviso', () => {
    for (const g of ['petto', 'dorso', 'spalle', 'gambe'] as const) expect(r.volume[g], g).toBeGreaterThanOrEqual(10);
    for (const s of r.sessioni) expect(s.durataS, s.nome).toBeLessThanOrEqual(77 * 60);
    // Resta solo l'avviso "struttura generica" (a 3 giorni non esiste il programma dei video).
    expect(r.avvisi.filter((a) => !/Da definire/.test(a))).toEqual([]);
  });
  it('sedute attese (SPEC §4.6): S1 panca/manubri/squat/pressa + braccia; S2 military/lat/rematore/stacco; S3 inclinata/T-bar', () => {
    const ids = (i: number) => r.sessioni[i].esercizi.map((e) => e.esercizio_id);
    expect(ids(0)).toEqual(expect.arrayContaining(['panca_piana', 'panca_manubri', 'squat', 'pressa', 'curl_ez', 'french_ez']));
    expect(ids(1)).toEqual(expect.arrayContaining(['military_press', 'lat_machine', 'rematore_manubrio', 'stacco_da_terra', 'leg_curl']));
    expect(ids(2)).toEqual(expect.arrayContaining(['panca_inclinata_manubri', 't_bar']));
  });
});

describe('generaSettimana — altri N', () => {
  it('N=4 → 68 sedute; N=2 → 34; blocco breve N=3 → 36', () => {
    expect(generaSettimana({ ...base, N: 4 }, profilo).seduteTotali).toBe(68);
    expect(generaSettimana({ ...base, N: 2 }, profilo).seduteTotali).toBe(34);
    expect(generaSettimana({ ...base, bloccoBreve: true }, profilo).seduteTotali).toBe(36);
  });
  it('N=2 T=60: avviso volume basso su almeno un gruppo grande', () => {
    const r = generaSettimana({ ...base, N: 2 }, profilo);
    expect(r.avvisi.some((a) => /sotto il minimo/.test(a))).toBe(true);
  });
  it('N=5: avviso del libro', () => {
    expect(generaSettimana({ ...base, N: 5 }, profilo).avvisi.some((a) => /sconsiglia/.test(a))).toBe(true);
  });
});

describe('esclusioni e alternative (SPEC §4.5, §5)', () => {
  it('ogni esercizio di default ha almeno 1 alternativa nella stessa classe', () => {
    for (const c of CONTENITORI) for (const s of c.sessioni) for (const slot of s.slot) {
      expect(alternative(slot.default).length, `${c.id} ${slot.default}`).toBeGreaterThanOrEqual(1);
    }
  });
  it('escludere lo stacco da terra lo sostituisce con un’alternativa di cerniera', () => {
    const r = generaSettimana({ ...base, esclusi: ['stacco_da_terra'] }, profilo);
    const ids = r.sessioni.flatMap((s) => s.esercizi.map((e) => e.esercizio_id));
    expect(ids).not.toContain('stacco_da_terra');
    const sostituto = r.sessioni[1].esercizi.find((e) => e.ruolo === 'R1' && e.gruppo === 'gambe');
    expect(sostituto).toBeDefined();
    expect(ESERCIZI_PER_ID[sostituto!.esercizio_id].classe).toBe('cerniera_anca');
  });
  it('sostituzione permanente del profilo', () => {
    const r = generaSettimana(base, { ...profilo, sostituzioni: { panca_manubri: 'chest_press' } });
    expect(r.sessioni[0].esercizi.map((e) => e.esercizio_id)).toContain('chest_press');
  });
  it('priorità: più serie ai complementari del gruppo prioritario rispetto al default', () => {
    const senza = generaSettimana({ ...base, T: 90 }, profilo);
    const con = generaSettimana({ ...base, T: 90, priorita: ['spalle'] }, profilo);
    expect(con.volume.spalle).toBeGreaterThan(senza.volume.spalle);
  });
});

describe('preset donna (PROVVISORIO, SPEC §8)', () => {
  it('N=3: hip thrust e stacco in S2, panca e squat in S1, guida spalle (Target) nella jolly', () => {
    const r = generaSettimana({ ...base, preset: 'donna_glutei', priorita: ['gambe'] }, profilo);
    const ids = (i: number) => r.sessioni[i].esercizi.map((e) => e.esercizio_id);
    expect(ids(0)).toContain('panca_piana');
    expect(ids(0)).toContain('squat');
    expect(ids(1)).toContain('hip_thrust');
    expect(ids(1)).toContain('stacco_da_terra');
    const mil = r.sessioni[2].esercizi.find((e) => e.esercizio_id === 'military_press');
    expect(mil?.tabella).toBe('R3b');
    expect(r.copertura.glutei).toBeGreaterThanOrEqual(12);
  });
});

describe('esercizio guida per blocco (TEST_INIZIO_BLOCCO §1b)', () => {
  it('Blocco 1 (generico): military guida in B1 e spinte in B2; Blocco 2 a 4 giorni uomo usa il programma fisso; la rotazione vale nei contenitori generici', () => {
    const b1 = generaSettimana({ ...base, N: 4, T: 90 }, profilo, 1);
    expect(b1.contenitore.id).toBe('b1u4');
    expect(b1.sessioni[2].esercizi.find((e) => e.esercizio_id === 'military_press')?.tabella).toBe('R2');
    const d1 = generaSettimana({ ...base, N: 4, T: 90, preset: 'donna_glutei' }, profilo, 1);
    expect(d1.sessioni[2].esercizi.find((e) => e.gruppo === 'spalle' && e.tabella === 'R3b')?.esercizio_id).toBe('military_press');
    const b2 = generaSettimana({ ...base, N: 4, T: 90 }, profilo, 2);
    expect(b2.contenitore.id).toBe('b2u4');
    expect(b2.sessioni[3].esercizi.find((e) => e.gruppo === 'spalle' && e.ruolo === 'R2')?.esercizio_id).toBe('spinte_manubri_seduto');
    expect(b2.sessioni[1].esercizi.find((e) => e.esercizio_id === 'military_press')?.tabella).toBe('R3b');
    // Contenitore generico nel blocco 2 (es. 3 giorni): la guida ruota.
    const b2gen = generaSettimana({ ...base, N: 3, T: 90 }, profilo, 2);
    expect(b2gen.sessioni[1].esercizi.find((e) => e.gruppo === 'spalle' && e.tabella === 'R3b')?.esercizio_id).toBe('spinte_manubri_seduto');
    expect(b2gen.avvisi.some((a) => /Da definire/.test(a))).toBe(true);
    const b3 = generaSettimana({ ...base, N: 3, T: 90 }, profilo, 3);
    expect(b3.sessioni[1].esercizi.find((e) => e.gruppo === 'spalle' && e.tabella === 'R3b')?.esercizio_id).toBe('military_press');
  });
  it('la guida non è mai R1/L di default; promossa dall’utente diventa R1 (o L se ci sono già 2 R1)', () => {
    const r = generaSettimana(base, profilo, 1);
    expect(r.sessioni.flatMap((s) => s.esercizi).filter((e) => (e.ruolo === 'R1' || e.ruolo === 'L') && !ESERCIZI_PER_ID[e.esercizio_id].fondamentale)).toEqual([]);
    const promosso = generaSettimana(base, { ...profilo, fondamentali_promossi: ['military_press'] }, 1);
    expect(promosso.sessioni[1].esercizi.find((e) => e.esercizio_id === 'military_press')?.ruolo).toBe('R1');
    const donna = generaSettimana({ ...base, N: 2, preset: 'donna_glutei' }, { ...profilo, fondamentali_promossi: ['military_press'] }, 1);
    const mil = donna.sessioni.flatMap((s) => s.esercizi).find((e) => e.esercizio_id === 'military_press');
    expect(['R1', 'L']).toContain(mil?.ruolo);
  });
  it('la sostituzione del profilo prevale sulla rotazione', () => {
    const r = generaSettimana(base, { ...profilo, sostituzioni: { military_press: 'shoulder_press_macchina' } }, 2);
    expect(r.sessioni[1].esercizi.find((e) => e.gruppo === 'spalle' && e.tabella === 'R3b')?.esercizio_id).toBe('shoulder_press_macchina');
  });
});

describe('blocco e rigenerazione (SPEC §4.7, §12.2)', () => {
  it('nuovoBlocco N=3: 51 sedute numerate, fasi 3+15+15+3+15, tutte future', () => {
    const b = nuovoBlocco(base, profilo);
    expect(b.sedute.length).toBe(51);
    const conta = (f: string) => b.sedute.filter((s) => s.fase === f).length;
    expect([conta('test'), conta('fase1'), conta('fase2'), conta('scarico'), conta('fase3')]).toEqual([3, 15, 15, 3, 15]);
    expect(b.sedute.every((s) => s.stato === 'futura')).toBe(true);
    expect(b.sedute[0].nome).toBe('Test 1');
    expect(b.sedute[3].nome).toBe('Seduta 1');
    expect(b.sedute[3].cicloFase).toBe(1);
    expect(b.sedute[50].fase).toBe('fase3');
    expect(b.sedute[50].cicloFase).toBe(5);
  });

  it('cambio N 3→4 a metà blocco: le sedute fatte restano, le future si rigenerano, test intatti', () => {
    const b = nuovoBlocco(base, profilo);
    b.test.panca_piana = { esercizio_id: 'panca_piana', kg: 80, rip: 5, modo: 'stima', rm1: 90 };
    // Completo test (ciclo 1) e il primo ciclo di Fase 1 (ciclo 2), inizio la prima del ciclo 3.
    for (const s of b.sedute) if (s.ciclo <= 2) s.stato = 'completata';
    b.sedute[6].stato = 'in_corso';
    expect(primoCicloModificabile(b)).toBe(4);
    const nuovo = rigeneraSeduteFuture(b, { ...base, N: 4 }, profilo);
    expect(nuovo.test.panca_piana.rm1).toBe(90);
    const conservate = nuovo.sedute.filter((s) => s.ciclo <= 3);
    expect(conservate.length).toBe(9);
    expect(conservate.filter((s) => s.stato === 'completata').length).toBe(6);
    const future = nuovo.sedute.filter((s) => s.ciclo >= 4);
    expect(future.length).toBe(14 * 4);
    expect(nuovo.sedute.length).toBe(9 + 56);
    // Numerazione continua e cicli coerenti.
    expect(nuovo.sedute.map((s) => s.numero)).toEqual(nuovo.sedute.map((_, i) => i + 1));
    expect(future[0].ciclo).toBe(4);
    expect(future[0].fase).toBe('fase1');
    expect(future[0].cicloFase).toBe(3);
    expect(nuovo.sedute.at(-1)!.fase).toBe('fase3');
  });
});
