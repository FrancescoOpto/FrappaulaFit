import type { Gruppo, IconaId } from '../../tipi';
import { esercizio as trovaEsercizio } from '../../data/esercizi';
import type { Esercizio } from '../../tipi';

// Pittogrammi degli esercizi (SPEC_PIANIFICATORE v2 §11c): SVG nostri, monocromatici (currentColor), viewBox 24×24,
// a tratto (1,75, estremi arrotondati), una sagoma per schema di movimento. Nessuna immagine scaricata.
// Se un esercizio non ha `icona` si usa quella del gruppo; se manca anche quella, resta lo spazio vuoto.

/** Contenuto SVG (dentro il viewBox 24×24) per ogni schema di movimento. */
export const ICONE: Record<IconaId, string> = {
  // Bilanciere sulle spalle, accosciata (vista frontale).
  squat: '<circle cx="12" cy="4.5" r="2"/><path d="M4 8h16M5 6.5v3M19 6.5v3M12 6.5V12M12 12l-4.5 3 1 5M12 12l4.5 3-1 5M7.5 20h2M14.5 20h2"/>',
  // Seduto sullo schienale inclinato, gambe che spingono la pedana.
  pressa: '<circle cx="6.5" cy="10.5" r="2"/><path d="M3 19l4-6h4l4-4 4 2M17 6l4 8M3 19h10"/>',
  // Busto piegato in avanti, bilanciere a terra.
  stacco: '<circle cx="15.5" cy="5.5" r="2"/><path d="M14 7.5l-5 5v7.5M13.5 9.5V16M10 16.5h7"/><circle cx="15" cy="18" r="2.5"/>',
  // Schiena sulla panca, bacino alto con il disco sui fianchi.
  hip_thrust: '<circle cx="4" cy="8" r="2"/><path d="M6 10.5l7-1 3 4.5v6M2 13h5M4 13v7"/><circle cx="13" cy="6.5" r="2.5"/>',
  // Seduto, gamba che si estende in avanti.
  leg_extension: '<circle cx="6" cy="5" r="2"/><path d="M6 7v6h6l6-2M4 13h9M6 13v7M12 13v6"/>',
  // Prono sulla panca, gamba che si piega verso l\'alto.
  leg_curl: '<circle cx="4.5" cy="9" r="2"/><path d="M7 11h11l1-6M3 13h16M5 13v6M17 13v6"/>',
  // In piedi sulle punte.
  polpacci: '<circle cx="12" cy="4" r="2"/><path d="M12 6v7l-2 6M12 13l2 6M7 21h10M9 19v2M15 19v2"/>',
  // Sdraiato sulla panca, bilanciere spinto in alto.
  panca: '<circle cx="5" cy="12.5" r="2"/><path d="M7 13h10l2 3v4M12 13V7M6 7h12M7.5 5.5v3M16.5 5.5v3M3 15h14M5 15v5"/>',
  // Sdraiato, braccia ad arco con i manubri.
  croci: '<circle cx="12" cy="5" r="2"/><path d="M12 7v9M12 10c-3-1-5 1-7 4M12 10c3-1 5 1 7 4M4 13l2 2M18 15l2-2M9 20l3-4 3 4"/>',
  // In piedi, bilanciere sopra la testa.
  military: '<circle cx="12" cy="8" r="2"/><path d="M12 10v6l-2.5 5M12 16l2.5 5M12 10L8 7.5 7 5M12 10l4-2.5 1-2.5M5 5h14M6 3.5v3M18 3.5v3"/>',
  // In piedi, braccia aperte in orizzontale con i manubri.
  alzate_laterali: '<circle cx="12" cy="4.5" r="2"/><path d="M12 6.5v9l-2.5 5M12 15.5l2.5 5M12 9H5M12 9h7M5 7.5v3M19 7.5v3"/>',
  // Busto piegato, braccia aperte (vista da dietro).
  alzate_posteriori: '<circle cx="12" cy="12.5" r="2"/><path d="M5 8h14M5.5 6.5v3M18.5 6.5v3M12 10.5V8M9 14.5v6M15 14.5v6"/>',
  // Seduto, barra larga tirata dall\'alto.
  lat: '<circle cx="12" cy="9" r="2"/><path d="M12 11v6h4v4M12 17h-3M12 12L8 8 7 4M12 12l4-4 1-4M4 4h16"/>',
  // Busto piegato, bilanciere tirato verso la vita.
  rematore: '<circle cx="16" cy="5.5" r="2"/><path d="M14.5 7.5 9 11.5V20M12 9.5v5M8 14.5h8M9 13v3M15 13v3"/>',
  // In piedi, avambraccio piegato con il manubrio.
  curl: '<circle cx="11" cy="4.5" r="2"/><path d="M11 6.5v9l-2 5M11 15.5l2 5M11 9l2.5 4.5 4-3M16 9l3 2"/>',
  // In piedi, avambraccio che spinge in basso la barra del cavo.
  tricipiti: '<circle cx="11" cy="4.5" r="2"/><path d="M11 6.5v9l-2 5M11 15.5l2 5M11 9l2.5 4.5 3.5 1.5M17 3v12M15 15h4"/>',
  // Crunch: busto sollevato, ginocchia piegate.
  addome: '<circle cx="5" cy="7" r="2"/><path d="M6.5 8.5 12 14l5-4 3 5M3 19h18M8 10l3 2"/>',
  // Affondo: gamba avanti piegata, gamba dietro distesa.
  affondi: '<circle cx="12" cy="4" r="2"/><path d="M12 6v7l-4 2v5M12 13l4 3 3 4M6 20h4M17 20h4"/>',
};

/** Icona di riserva per gruppo muscolare. */
export const ICONA_GRUPPO: Record<Gruppo, IconaId> = {
  petto: 'panca',
  dorso: 'lat',
  spalle: 'military',
  gambe: 'squat',
  bicipiti: 'curl',
  tricipiti: 'tricipiti',
  addome: 'addome',
};

export function iconaDi(def: Pick<Esercizio, 'icona' | 'gruppo'> | undefined): IconaId | undefined {
  if (!def) return undefined;
  return def.icona ?? ICONA_GRUPPO[def.gruppo];
}

/** Pittogramma dell'esercizio: 28 px in seduta, 24 px negli elenchi (`piccola`). Spazio riservato se manca. */
export function IconaEsercizio({ id, def, piccola, classe }: { id?: string; def?: Pick<Esercizio, 'icona' | 'gruppo'>; piccola?: boolean; classe?: string }) {
  const d = def ?? (id ? trovaEsercizio(id) : undefined);
  const icona = iconaDi(d);
  return (
    <span class={`icona-esercizio ${piccola ? 'piccola' : ''} ${classe ?? ''}`} aria-hidden="true">
      {icona ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" dangerouslySetInnerHTML={{ __html: ICONE[icona] }} />
      ) : null}
    </span>
  );
}

/** Icona generica a tratto (spunta, ingranaggio, freccia…) per i pulsanti. */
export function Icona({ nome, dimensione = 20 }: { nome: 'spunta' | 'impostazioni' | 'indietro' | 'scambia' | 'freccia' | 'bandiera' | 'punto' | 'giu' | 'su' | 'play'; dimensione?: number }) {
  const d: Record<string, string> = {
    spunta: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    impostazioni: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    indietro: '<path d="M15 18l-6-6 6-6"/>',
    scambia: '<path d="M4 7h13l-3-3M20 17H7l3 3"/>',
    freccia: '<path d="M9 6l6 6-6 6"/>',
    bandiera: '<path d="M5 21V4h11l-2 4 2 4H5"/>',
    punto: '<circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"/>',
    giu: '<path d="M6 9l6 6 6-6"/>',
    su: '<path d="M6 15l6-6 6 6"/>',
    play: '<path d="M8 5v14l11-7z"/>',
  };
  return <svg width={dimensione} height={dimensione} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: d[nome] }} />;
}
