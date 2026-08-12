import { useCallback, useEffect, useRef, useState } from "react";
import { isTauriApp } from "../configuracao/appVersion";

/**
 * Auto-update do GasPass PDV (só Tauri).
 * Fases: idle | checking | update_available | uptodate | downloading | installing | error
 */
export function useAppUpdater({ autoCheck = true, intervalMs = 60 * 60 * 1000 } = {}) {
  const [fase, setFase] = useState("idle");
  const [manifest, setManifest] = useState(null);
  const [erro, setErro] = useState("");
  const [progresso, setProgresso] = useState(null);
  const updateRef = useRef(null);
  const silentRef = useRef(false);

  const check = useCallback(async ({ silent = false } = {}) => {
    if (!isTauriApp()) {
      setFase("idle");
      return null;
    }
    silentRef.current = silent;
    if (!silent) {
      setFase("checking");
      setErro("");
    }
    try {
      const { check: checkUpdate } = await import("@tauri-apps/plugin-updater");
      const update = await checkUpdate();
      if (update) {
        updateRef.current = update;
        setManifest({
          version: update.version,
          notes: update.body || update.notes || "",
          date: update.date || ""
        });
        setFase("update_available");
        return update;
      }
      updateRef.current = null;
      setManifest(null);
      if (!silent) setFase("uptodate");
      else setFase((f) => (f === "update_available" ? f : "uptodate"));
      return null;
    } catch (err) {
      const msg = err?.message || String(err);
      setErro(msg);
      if (!silent) setFase("error");
      return null;
    }
  }, []);

  const installAndRelaunch = useCallback(async () => {
    if (!isTauriApp()) return;
    let update = updateRef.current;
    if (!update) {
      update = await check({ silent: false });
    }
    if (!update) return;
    setFase("downloading");
    setProgresso(null);
    setErro("");
    try {
      await update.downloadAndInstall((event) => {
        if (event.event === "Started") {
          setFase("downloading");
        } else if (event.event === "Progress") {
          setProgresso(event.data);
          setFase("downloading");
        } else if (event.event === "Finished") {
          setFase("installing");
        }
      });
      setFase("installing");
      const { relaunch } = await import("@tauri-apps/plugin-process");
      await relaunch();
    } catch (err) {
      setErro(err?.message || String(err));
      setFase("error");
    }
  }, [check]);

  useEffect(() => {
    if (!autoCheck || !isTauriApp()) return undefined;
    check({ silent: false });
    const id = window.setInterval(() => check({ silent: true }), intervalMs);
    return () => window.clearInterval(id);
  }, [autoCheck, intervalMs, check]);

  return {
    fase,
    manifest,
    erro,
    progresso,
    check,
    installAndRelaunch,
    isTauri: isTauriApp()
  };
}
