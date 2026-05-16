import { useEffect, useRef, useState } from "react";

const SNOOZE_KEY = "pwa_update_snoozed_until";
const SNOOZE_HOURS = 24;

export default function PwaUpdateBanner() {
  const [isUpdateReady, setIsUpdateReady] = useState(false);
  const [isSnoozed, setIsSnoozed] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const hasReloaded = useRef(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const onControllerChange = () => {
      if (hasReloaded.current) {
        return;
      }
      hasReloaded.current = true;
      window.location.reload();
    };

    let checkTimer: ReturnType<typeof setInterval> | null = null;
    let currentRegistration: ServiceWorkerRegistration | null = null;

    const monitorRegistration = (reg: ServiceWorkerRegistration) => {
      currentRegistration = reg;
      setRegistration(reg);

      if (reg.waiting && navigator.serviceWorker.controller) {
        setWaitingWorker(reg.waiting);
        setIsUpdateReady(true);
      }

      reg.addEventListener("updatefound", () => {
        const installingWorker = reg.installing;
        if (!installingWorker) {
          return;
        }

        installingWorker.addEventListener("statechange", () => {
          if (
            installingWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            setWaitingWorker(reg.waiting ?? installingWorker);
            setIsUpdateReady(true);
          }
        });
      });
    };

    const init = async () => {
      // 나중에를 누른 시간이 아직 유효하면 배너를 숨깁니다.
      const snoozedUntil = localStorage.getItem(SNOOZE_KEY);
      if (snoozedUntil && Date.now() < Number(snoozedUntil)) {
        setIsSnoozed(true);
      }

      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        return;
      }

      monitorRegistration(reg);

      // Keep checking updates while the app is open.
      checkTimer = setInterval(() => {
        (currentRegistration ?? reg).update().catch(() => {
          // Ignore intermittent network failures.
        });
      }, 60 * 1000);
    };

    init().catch((error) => {
      console.error("[PWA] 업데이트 감지 초기화 실패:", error);
    });

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      if (checkTimer) {
        clearInterval(checkTimer);
      }
    };
  }, []);

  const handleUpdate = async () => {
    setIsApplying(true);

    try {
      const reg = registration ?? (await navigator.serviceWorker.getRegistration());
      const worker = waitingWorker ?? reg?.waiting;

      if (worker) {
        worker.postMessage({ type: "SKIP_WAITING" });
        return;
      }

      if (reg) {
        await reg.update();
      }
    } catch (error) {
      console.error("[PWA] 업데이트 적용 실패:", error);
      window.location.reload();
    } finally {
      setIsApplying(false);
    }
  };

  const handleSnooze = () => {
    const until = Date.now() + SNOOZE_HOURS * 60 * 60 * 1000;
    localStorage.setItem(SNOOZE_KEY, String(until));
    setIsSnoozed(true);
  };

  if (!isUpdateReady || isSnoozed) {
    return null;
  }

  return (
    <div className="fixed left-0 right-0 top-12 z-[1000] mx-auto w-full max-w-xl px-2">
      <div className="flex items-center justify-between px-3 py-2 border rounded-md shadow-sm border-amber-200 bg-amber-50">
        <p className="text-sm text-amber-900">새 버전이 있습니다.</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSnooze}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-amber-700 transition hover:bg-amber-100"
          >
            나중에
          </button>
          <button
            type="button"
            onClick={handleUpdate}
            disabled={isApplying}
            className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isApplying ? "업데이트 중..." : "지금 업데이트"}
          </button>
        </div>
      </div>
    </div>
  );
}
