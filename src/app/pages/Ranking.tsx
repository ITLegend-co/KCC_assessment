import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { BackButton } from '../components/BackButton';
import { RankingBoard } from '../components/RankingBoard';
import { TimerButton } from '../components/TimerButton';
import { getCurrentUser } from '../lib/auth';

export default function Ranking() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  if (!currentUser) {
    return null;
  }

  return (
    <div className="kcc-page kcc-ranking-page min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-2 pb-[max(5rem,env(safe-area-inset-bottom))] sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <BackButton title="Student" accent="Ranking" />
        </div>
        <RankingBoard showCopyLink={true} showAssessmentResults={true} />
      </div>
      <TimerButton />
    </div>
  );
}
