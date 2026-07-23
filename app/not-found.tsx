export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-200">
      <h1 className="text-3xl font-bold">404 - Page Not Found</h1>
      <p className="text-slate-400 mt-2 text-sm">The requested resource could not be found.</p>
    </div>
  );
}
