import { ChevronRight, ClipboardPaste, Copy, History, RefreshCw } from 'lucide-react';
import { useState, useSyncExternalStore, type ReactNode } from 'react';
import { applyLiveUpdateNow, checkLiveUpdateManually, currentBundleVersion, liveUpdateReady } from '../lib/liveUpdate';
import { isNativeAndroid } from '../lib/platform';
import { exportBackup, importBackup } from '../lib/storage';
import type { AppData } from '../lib/todos';
import { PageHeader } from './PageHeader';
import { UnlockSection } from './UnlockSection';

interface Props {
  data: AppData;
  onBack: () => void;
  onOpenHistory: () => void;
  onReplaceData: (data: AppData) => void;
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-4">
      <h2 className="m-0 mb-2 px-2 text-[13px] font-bold text-muted">{title}</h2>
      <div className="rounded-2xl bg-surface px-4">{children}</div>
    </section>
  );
}

export function SettingsView({ data, onBack, onOpenHistory, onReplaceData }: Props) {
  const readyVersion = useSyncExternalStore(liveUpdateReady.subscribe, liveUpdateReady.get);
  const [message, setMessage] = useState('');
  const [checking, setChecking] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasted, setPasted] = useState('');

  async function checkUpdate() {
    setChecking(true);
    setUpdateMessage('');
    setUpdateMessage(await checkLiveUpdateManually());
    setChecking(false);
  }

  async function copyBackup() {
    try {
      await navigator.clipboard.writeText(exportBackup(data));
      setMessage('백업을 복사했어요. 메모나 메신저에 붙여넣어 보관하세요.');
    } catch {
      setMessage('복사하지 못했어요.');
    }
  }

  function restoreBackup() {
    const parsed = importBackup(pasted);
    if (!parsed) {
      setMessage('올바른 백업이 아니에요.');
      return;
    }
    onReplaceData(parsed);
    setPasted('');
    setPasteOpen(false);
    setMessage(`복구했어요 · 할 일 ${parsed.todos.length}개, 이력 ${parsed.history.length}개`);
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="설정" onBack={onBack} />

      <div className="flex-1 overflow-y-auto px-4" style={{ paddingBottom: 'calc(var(--safe-bottom) + 24px)' }}>
        <Card title="실행">
          <UnlockSection />
        </Card>

        <Card title="기록">
          <button type="button" onClick={onOpenHistory} className="flex min-h-[64px] w-full items-center gap-3 py-2 text-left">
            <span className="grid size-10 place-items-center rounded-full bg-sunken text-muted">
              <History size={20} />
            </span>
            <span className="flex-1">
              <span className="block text-[17px] font-bold">완료 이력</span>
              <span className="block text-[13px] text-muted">끝낸 일 {data.history.length}개</span>
            </span>
            <ChevronRight size={22} className="text-muted" />
          </button>
        </Card>

        <Card title="백업">
          <div className="flex gap-2 py-3">
            <button type="button" onClick={() => void copyBackup()} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-sunken text-[15px] font-bold">
              <Copy size={18} /> 백업 복사
            </button>
            <button type="button" onClick={() => setPasteOpen(open => !open)} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-sunken text-[15px] font-bold">
              <ClipboardPaste size={18} /> 복구
            </button>
          </div>
          {pasteOpen && (
            <div className="pb-3">
              <textarea
                value={pasted}
                onChange={event => setPasted(event.target.value)}
                placeholder="복사해 둔 백업을 여기에 붙여넣으세요"
                rows={4}
                className="w-full resize-none rounded-xl border border-line bg-bg p-3 text-[14px] outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={restoreBackup}
                disabled={!pasted.trim()}
                className="mt-2 h-12 w-full rounded-xl bg-accent text-[15px] font-bold text-accent-ink disabled:opacity-35"
              >
                지금 목록을 이 백업으로 바꾸기
              </button>
            </div>
          )}
          {message && <p className="m-0 pb-3 text-[13px] text-muted">{message}</p>}
        </Card>

        <Card title="앱 정보">
          <div className="flex min-h-[56px] items-center justify-between py-2 text-[15px]">
            <span className="text-muted">버전</span>
            <span className="font-semibold">{__APP_BUILD__.version} · {currentBundleVersion().slice(0, 7)}</span>
          </div>
          {isNativeAndroid() && (
            <>
              <button
                type="button"
                onClick={() => void checkUpdate()}
                disabled={checking}
                className="mb-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-sunken text-[15px] font-bold disabled:opacity-50"
              >
                <RefreshCw size={18} className={checking ? 'animate-spin' : ''} /> {checking ? '확인하는 중…' : '업데이트 확인'}
              </button>
              {updateMessage && <p role="status" className="m-0 mb-3 text-[13px] text-muted">{updateMessage}</p>}
            </>
          )}
          {readyVersion && (
            <button
              type="button"
              onClick={() => void applyLiveUpdateNow()}
              className="mb-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-[15px] font-bold text-accent-ink"
            >
              <RefreshCw size={18} /> 새 화면 적용하기
            </button>
          )}
        </Card>
      </div>
    </div>
  );
}
