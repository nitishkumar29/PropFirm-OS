export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center text-white">
      <div className="max-w-md space-y-3 rounded-[24px] border border-white/10 bg-slate-900/70 p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Offline</p>
        <h1 className="text-2xl font-semibold">The workspace is temporarily unavailable offline.</h1>
        <p className="text-sm text-slate-400">Reconnect to sync the latest data or continue using the last cached version.</p>
      </div>
    </main>
  );
}
