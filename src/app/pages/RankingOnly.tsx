import { RankingBoard } from '../components/RankingBoard';

export default function RankingOnly() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 sm:mb-6 px-2 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl leading-tight font-bold text-slate-900 mb-2">
            🧗 Bouldering Competition Rankings
          </h1>
          <p className="text-sm sm:text-base text-slate-600">Live Results - Auto-refreshing</p>
        </div>
        <RankingBoard showCopyLink={false} />
      </div>
    </div>
  );
}
