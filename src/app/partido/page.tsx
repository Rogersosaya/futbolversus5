import { CrestSvg } from "@/components/svg";
import { ImageSlot } from "@/components/ImageSlot";
import { MATCH_HUD } from "@/data/match";

/** Live match HUD screen — scoreboard, event toast, radar and possession. */
export default function MatchScreen() {
  const { home, away, clock, event, possession, radar } = MATCH_HUD;

  return (
    <section className="screen active" data-screen="match" data-screen-label="Partido en vivo">
      <div className="match">
        <ImageSlot placeholder="Suelta una foto del estadio / juego" />
        <div className="dim" />

        <div className="scoreboard">
          <div className="sb-team home">
            <span className="cr">
              <CrestSvg id={home.crest} />
            </span>
            <span className="ab">{home.ab}</span>
          </div>
          <div className="sb-score">
            <span className="g">{home.score}</span>
            <span className="g">{away.score}</span>
          </div>
          <div className="sb-time">
            <b>{clock.time}</b>
            <small>{clock.half}</small>
          </div>
          <div className="sb-team away">
            <span className="cr">
              <CrestSvg id={away.crest} />
            </span>
            <span className="ab">{away.ab}</span>
          </div>
        </div>

        <div className="event-toast">
          <span className="badge">{event.badge}</span>
          <span>
            <b>{event.player}</b> · {event.detail}
          </span>
        </div>

        <div className="radar">
          <div className="ln" />
          <div className="cc" />
          {radar.map((dot, i) => (
            <i key={i} className={dot.side} style={{ left: `${dot.left}%`, top: `${dot.top}%` }} />
          ))}
        </div>

        <div className="poss">
          <div className="ph">
            <span>
              <b>{possession.home}%</b> {home.ab}
            </span>
            <span>
              {away.ab} <b>{possession.away}%</b>
            </span>
          </div>
          <div className="bar">
            <i className="h" style={{ width: `${possession.home}%` }} />
            <i className="a" style={{ width: `${possession.away}%` }} />
          </div>
          <div className="lab">POSESIÓN</div>
        </div>
      </div>

      <div className="prompts center">
        <div className="prompt">
          <span className="glyph circle">○</span>
          <span>Pausa</span>
        </div>
        <div className="prompt">
          <span className="glyph sq">□</span>
          <span>Cambios</span>
        </div>
        <div className="prompt">
          <span className="glyph tri">△</span>
          <span>Repetición</span>
        </div>
      </div>
    </section>
  );
}
