// Grafico a linea minimale in SVG (colori dal tema): punti in ordine, asse y con minimo e massimo.

export function GraficoLinea({ punti, unita }: { punti: { x: string; y: number }[]; unita?: string }) {
  if (punti.length < 2) return null;
  const W = 320;
  const H = 120;
  const pad = 8;
  const ys = punti.map((p) => p.y);
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const span = max - min || 1;
  const px = (i: number) => pad + (i * (W - 2 * pad)) / (punti.length - 1);
  const py = (y: number) => H - pad - ((y - min) / span) * (H - 2 * pad);
  const d = punti.map((p, i) => `${i ? 'L' : 'M'}${px(i).toFixed(1)},${py(p.y).toFixed(1)}`).join(' ');
  return (
    <div class="colonna" style="gap:4px">
      <svg class="grafico" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Andamento">
        <path d={d} fill="none" stroke="var(--accento)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
        {punti.map((p, i) => <circle cx={px(i)} cy={py(p.y)} r="3" fill="var(--accento)" />)}
      </svg>
      <div class="riga spazio piccolo"><span>min {min.toLocaleString('it-IT')}{unita ? ` ${unita}` : ''}</span><span>ultimo {ys[ys.length - 1].toLocaleString('it-IT')}{unita ? ` ${unita}` : ''}</span><span>max {max.toLocaleString('it-IT')}{unita ? ` ${unita}` : ''}</span></div>
    </div>
  );
}
