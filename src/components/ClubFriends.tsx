"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { FlagSvg, Sym } from "@/components/svg";
import { CollectibleGlyph } from "@/components/CollectibleArt";
import { ShieldArt } from "@/components/game-art";
import { useProfile } from "@/components/ProfileContext";
import { useOnline } from "@/components/realtime/presence";
import { createClient } from "@/lib/supabase-browser";
import {
  searchPlayers,
  sendFriendRequest,
  respondFriendRequest,
  cancelFriendRequest,
  removeFriend,
  myFriendsOverview,
} from "@/app/actions/friends";
import type { PlayerCard, RequestCard } from "@/actions/friends";

type Tab = "amigos" | "solicitudes" | "buscar";

interface Overview {
  friends: PlayerCard[];
  incoming: RequestCard[];
  outgoing: RequestCard[];
}

const EMPTY: Overview = { friends: [], incoming: [], outgoing: [] };

function Crest({ art }: { art: PlayerCard["art"] }) {
  return (
    <span className="cf-crest">
      {art ? <CollectibleGlyph c={art} /> : <ShieldArt id={null} />}
    </span>
  );
}

export function ClubFriends() {
  const { id: userId } = useProfile();
  const online = useOnline();

  const [tab, setTab] = useState<Tab>("amigos");
  const [data, setData] = useState<Overview>(EMPTY);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Search state.
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlayerCard[]>([]);
  const [searching, setSearching] = useState(false);
  const [requested, setRequested] = useState<Set<string>>(() => new Set());

  const reload = useCallback(() => {
    myFriendsOverview().then(setData);
  }, []);

  // Initial load + live refresh on any friend_requests / friendships change
  // (RLS scopes the delivered rows to this user, so no explicit filter needed).
  useEffect(() => {
    if (!userId) return;
    reload();
    const supabase = createClient();
    const channel = supabase
      .channel(`friends:${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "friend_requests" }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, reload)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, reload]);

  // Debounced player search, driven from the input handler (no effect needed).
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onQuery = (value: string) => {
    setQuery(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const q = value.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(() => {
      searchPlayers(q)
        .then(setResults)
        .finally(() => setSearching(false));
    }, 300);
  };
  useEffect(() => () => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
  }, []);

  const act = (id: string, fn: () => Promise<unknown>, after?: () => void) => {
    setPendingId(id);
    startTransition(async () => {
      await fn();
      reload();
      after?.();
      setPendingId(null);
    });
  };

  const incomingCount = data.incoming.length;

  return (
    <div className="club-friends">
      <div className="cf-head">
        <h3>AMIGOS</h3>
        <div className="cf-tabs">
          <button className={`ht${tab === "amigos" ? " on" : ""}`} onClick={() => setTab("amigos")}>
            Amigos <span className="cf-n">{data.friends.length}</span>
          </button>
          <button
            className={`ht${tab === "solicitudes" ? " on" : ""}`}
            onClick={() => setTab("solicitudes")}
          >
            Solicitudes
            {incomingCount > 0 && <span className="cf-dot">{incomingCount}</span>}
          </button>
          <button className={`ht${tab === "buscar" ? " on" : ""}`} onClick={() => setTab("buscar")}>
            Buscar
          </button>
        </div>
      </div>

      {/* AMIGOS */}
      {tab === "amigos" && (
        <div className="cf-list">
          {data.friends.length === 0 ? (
            <div className="cf-empty">
              Aún no tienes amigos. Ve a <b>Buscar</b> para agregar presidentes.
            </div>
          ) : (
            data.friends.map((f) => {
              const isOnline = online.has(f.id);
              return (
                <div className="cf-row" key={f.id}>
                  <Crest art={f.art} />
                  <div className="cf-tx">
                    <b>
                      {f.president}
                      {f.country && (
                        <span className="cf-fl">
                          <FlagSvg code={f.country} slice />
                        </span>
                      )}
                    </b>
                    <small>{f.club}</small>
                  </div>
                  <span className={`cf-st ${isOnline ? "on" : "off"}`}>
                    <span className="cf-stdot" />
                    {isOnline ? "En línea" : "Desconectado"}
                  </span>
                  <button
                    className="cf-rm"
                    disabled={pendingId === f.id}
                    onClick={() => act(f.id, () => removeFriend(f.id))}
                    aria-label={`Eliminar a ${f.president}`}
                  >
                    Eliminar
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SOLICITUDES */}
      {tab === "solicitudes" && (
        <div className="cf-list">
          {data.incoming.length === 0 && data.outgoing.length === 0 && (
            <div className="cf-empty">No tienes solicitudes pendientes.</div>
          )}
          {data.incoming.length > 0 && (
            <div className="cf-sub">RECIBIDAS</div>
          )}
          {data.incoming.map(({ requestId, player }) => (
            <div className="cf-row" key={requestId}>
              <Crest art={player.art} />
              <div className="cf-tx">
                <b>{player.president}</b>
                <small>{player.club}</small>
              </div>
              <span className="cf-acts">
                <button
                  className="cf-yes"
                  disabled={pendingId === requestId}
                  onClick={() => act(requestId, () => respondFriendRequest(requestId, true))}
                >
                  Aceptar
                </button>
                <button
                  className="cf-no"
                  disabled={pendingId === requestId}
                  onClick={() => act(requestId, () => respondFriendRequest(requestId, false))}
                >
                  Rechazar
                </button>
              </span>
            </div>
          ))}
          {data.outgoing.length > 0 && <div className="cf-sub">ENVIADAS</div>}
          {data.outgoing.map(({ requestId, player }) => (
            <div className="cf-row" key={requestId}>
              <Crest art={player.art} />
              <div className="cf-tx">
                <b>{player.president}</b>
                <small>{player.club}</small>
              </div>
              <span className="cf-pending">Pendiente</span>
              <button
                className="cf-rm"
                disabled={pendingId === requestId}
                onClick={() => act(requestId, () => cancelFriendRequest(requestId))}
              >
                Cancelar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* BUSCAR */}
      {tab === "buscar" && (
        <div className="cf-search">
          <div className="cf-searchbar">
            <Sym id="ic-user" />
            <input
              type="text"
              placeholder="Busca por nombre de presidente…"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              autoComplete="off"
              maxLength={40}
            />
          </div>
          <div className="cf-list">
            {query.trim().length < 2 ? (
              <div className="cf-empty">Escribe al menos 2 letras para buscar.</div>
            ) : searching ? (
              <div className="cf-empty">Buscando…</div>
            ) : results.length === 0 ? (
              <div className="cf-empty">Sin resultados para “{query.trim()}”.</div>
            ) : (
              results.map((p) => {
                const sent = requested.has(p.id);
                return (
                  <div className="cf-row" key={p.id}>
                    <Crest art={p.art} />
                    <div className="cf-tx">
                      <b>
                        {p.president}
                        {p.country && (
                          <span className="cf-fl">
                            <FlagSvg code={p.country} slice />
                          </span>
                        )}
                      </b>
                      <small>{p.club}</small>
                    </div>
                    <button
                      className="cf-add"
                      disabled={sent || pendingId === p.id}
                      onClick={() =>
                        act(
                          p.id,
                          () => sendFriendRequest(p.id),
                          () => setRequested((s) => new Set(s).add(p.id)),
                        )
                      }
                    >
                      {sent ? "Enviada" : "Agregar"}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
