import React from 'react';
import { computeSectorColours } from '../utils/openf1';

const SECTOR_COLOUR = {
  purple: 'bg-purple-500 text-white',
  green:  'bg-green-500 text-black',
  yellow: 'bg-yellow-500 text-black',
  grey:   'bg-f1border text-f1muted',
};

function SectorBox({ time, colour }) {
  const cls = SECTOR_COLOUR[colour] ?? SECTOR_COLOUR.grey;
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] number-font font-bold min-w-12 text-center ${cls}`}>
      {time ? time.toFixed(3) : '—'}
    </span>
  );
}

export default function SectorPanel({ positions, drivers, lapData, carData, speedTraps }) {
  const { allLaps = [] } = lapData ?? {};
  const sectorColours = computeSectorColours(allLaps);
  if (!positions?.length) return null;
  const allSpeeds = Object.values(speedTraps ?? {});
  const bestI1 = allSpeeds.length ? Math.max(...allSpeeds.map(s => s.i1 ?? 0)) : 0;
  const bestI2 = allSpeeds.length ? Math.max(...allSpeeds.map(s => s.i2 ?? 0)) : 0;
  const bestST = allSpeeds.length ? Math.max(...allSpeeds.map(s => s.st ?? 0)) : 0;

  return (
    <div className="f1-card overflow-hidden animate-slide-up">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-f1border">
              <th className="text-left text-f1muted font-mono uppercase px-3 py-2 w-8">#</th>
              <th className="text-left text-f1muted font-mono uppercase px-3 py-2">Driver</th>
              <th className="text-center text-f1muted font-mono uppercase px-2 py-2">S1</th>
              <th className="text-center text-f1muted font-mono uppercase px-2 py-2">S2</th>
              <th className="text-center text-f1muted font-mono uppercase px-2 py-2">S3</th>
              <th className="text-center text-f1muted font-mono uppercase px-2 py-2 hidden sm:table-cell">DRS</th>
              <th className="text-center text-f1muted font-mono uppercase px-2 py-2 hidden md:table-cell">I1</th>
              <th className="text-center text-f1muted font-mono uppercase px-2 py-2 hidden md:table-cell">I2</th>
              <th className="text-center text-f1muted font-mono uppercase px-2 py-2 hidden lg:table-cell">ST</th>
            </tr>
          </thead>
          <tbody>
            {positions.map(p => {
              const n = p.driver_number;
              const driver = drivers?.[n];
              const sc = sectorColours[n] ?? {};
              const car = carData?.[n];
              const sp = speedTraps?.[n];
              const drsActive = (car?.drs ?? 0) >= 10;
              const teamColor = driver?.team_colour ? `#${driver.team_colour}` : '#888';
              return (
                <tr key={n} className="border-b border-f1border/30 hover:bg-f1border/20 transition-colors">
                  <td className="px-3 py-2"><span className="number-font text-f1muted font-bold">{p.position}</span></td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-0.5 h-5 rounded-full" style={{ background: teamColor }} />
                      <span className="font-display font-bold text-white text-xs">{driver?.name_acronym ?? `#${n}`}</span>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-center"><SectorBox time={sc.s1Time} colour={sc.s1} /></td>
                  <td className="px-2 py-2 text-center"><SectorBox time={sc.s2Time} colour={sc.s2} /></td>
                  <td className="px-2 py-2 text-center"><SectorBox time={sc.s3Time} colour={sc.s3} /></td>
                  <td className="px-2 py-2 text-center hidden sm:table-cell">
                    <span className={`inline-flex items-center justify-center w-8 h-5 rounded text-[9px] font-mono font-bold ${drsActive ? 'bg-green-500 text-black' : 'bg-f1border text-f1muted'}`}>DRS</span>
                  </td>
                  <td className="px-2 py-2 text-center hidden md:table-cell">
                    <span className={`number-font text-xs ${sp?.i1 === bestI1 && bestI1 > 0 ? 'text-purple-400 font-bold' : 'text-f1muted'}`}>{sp?.i1 ?? '—'}</span>
                  </td>
                  <td className="px-2 py-2 text-center hidden md:table-cell">
                    <span className={`number-font text-xs ${sp?.i2 === bestI2 && bestI2 > 0 ? 'text-purple-400 font-bold' : 'text-f1muted'}`}>{sp?.i2 ?? '—'}</span>
                  </td>
                  <td className="px-2 py-2 text-center hidden lg:table-cell">
                    <span className={`number-font text-xs ${sp?.st === bestST && bestST > 0 ? 'text-purple-400 font-bold' : 'text-f1muted'}`}>{sp?.st ?? '—'}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-3 py-2 flex gap-3 border-t border-f1border/30">
        {[['purple','Session Best'],['green','Personal Best'],['yellow','Slower']].map(([c,l])=>(
          <div key={c} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded-sm ${c==='purple'?'bg-purple-500':c==='green'?'bg-green-500':'bg-yellow-500'}`}/>
            <span className="text-f1muted font-mono text-[10px]">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}