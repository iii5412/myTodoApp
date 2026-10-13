import { App as CapacitorApp } from '@capacitor/app';
import { Battery, Check, Layers } from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { isNativeAndroid } from '../lib/platform';
import { UnlockLaunch, type UnlockStatus } from '../native/unlockLaunch';

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (next: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-9 w-16 shrink-0 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-sunken'}`}
    >
      <span
        className={`absolute top-1 left-1 size-7 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-7' : ''}`}
      />
    </button>
  );
}

function Step({ icon, title, hint, done, onFix, required }: { icon: ReactNode; title: string; hint: string; done: boolean; onFix: () => void; required?: boolean }) {
  return (
    <li className="flex min-h-[64px] items-center gap-3 py-2">
      <span className={`grid size-10 shrink-0 place-items-center rounded-full ${done ? 'bg-tag-green/15 text-tag-green' : 'bg-sunken text-muted'}`}>
        {done ? <Check size={20} strokeWidth={3} /> : icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="m-0 text-[16px] font-semibold">
          {title}
          {required && !done && <span className="ml-1.5 text-[12px] font-bold text-danger">필수</span>}
        </p>
        <p className="m-0 text-[13px] text-muted">{hint}</p>
      </div>
      {!done && (
        <button type="button" onClick={onFix} className="h-11 shrink-0 rounded-xl bg-accent px-4 text-[15px] font-bold text-accent-ink">
          허용
        </button>
      )}
    </li>
  );
}

/** Re-reads overlay and battery settings when the user returns from system settings. */
export function UnlockSection() {
  const [status, setStatus] = useState<UnlockStatus | null>(null);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      setStatus(await UnlockLaunch.getStatus());
    } catch {
      setError('상태를 불러오지 못했어요. 앱을 최신 버전으로 설치했는지 확인해 주세요.');
    }
  }, []);

  useEffect(() => {
    if (!isNativeAndroid()) return;
    void refresh();
    const handle = CapacitorApp.addListener('resume', () => void refresh());
    return () => {
      void handle.then(h => h.remove());
    };
  }, [refresh]);

  if (!isNativeAndroid()) {
    return <p className="m-0 py-3 text-[14px] text-muted">안드로이드 앱에서만 사용할 수 있어요.</p>;
  }

  async function toggle(enabled: boolean) {
    setError('');
    try {
      setStatus(await UnlockLaunch.setEnabled({ enabled }));
    } catch {
      setError('설정을 바꾸지 못했어요.');
    }
  }

  const ready = status?.enabled && status.overlayGranted;

  return (
    <div>
      <div className="flex min-h-[64px] items-center gap-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[17px] font-bold">잠금 해제하면 바로 열기</p>
          <p className="m-0 text-[13px] text-muted">
            {!status?.enabled ? '꺼져 있어요' : ready ? '켜짐 · 잠금을 풀면 할 일이 바로 떠요' : '켜짐 · 아래 필수 권한을 허용해 주세요'}
          </p>
        </div>
        <Switch checked={Boolean(status?.enabled)} onChange={toggle} label="잠금 해제하면 바로 열기" />
      </div>

      {status?.enabled && (
        <ul className="m-0 list-none divide-y divide-line border-t border-line p-0">
          <Step
            required
            icon={<Layers size={20} />}
            title="다른 앱 위에 표시"
            hint="앱이 스스로 화면을 띄우려면 필요해요"
            done={status.overlayGranted}
            onFix={() => void UnlockLaunch.openOverlaySettings()}
          />
          <Step
            icon={<Battery size={20} />}
            title="배터리 제한 없음"
            hint="절전 모드가 기능을 끄지 않게 해요"
            done={status.batteryUnrestricted}
            onFix={() => void UnlockLaunch.openBatterySettings()}
          />
        </ul>
      )}
      {error && <p className="m-0 pt-2 text-[13px] text-danger">{error}</p>}
    </div>
  );
}
