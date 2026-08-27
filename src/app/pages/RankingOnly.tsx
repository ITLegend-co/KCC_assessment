import { RankingBoard } from '../components/RankingBoard';

export default function RankingOnly() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            🧗 Bouldering Competition Rankings
          </h1>
          <p className="text-slate-600">Live Results - Auto-refreshing</p>
        </div>
        <RankingBoard showCopyLink={false} />
      </div>
    </div>
  );
}
