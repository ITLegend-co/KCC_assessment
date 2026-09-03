import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Search, Copy, Check, Users, X, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { database } from '../lib/firebase';
import { ref, onValue } from 'firebase/database';
import { calculateBoulderPoints } from '../lib/scoring';
import { QrCodeCard } from './QrCodeCard';
import { useRounds } from '../hooks/useRounds';

const RANKING_ONLY_URL = 'https://itlegend-co.github.io/KCC_assessment/#/ranking-only';

interface Student {
  id: string;
  name: string;
  school: string;
  class: string;
  age: number;
  gender: 'male' | 'female';
  key?: string;
}

interface Score {
  id: string;
  round: string;
  boulder: number;
  at: number | null;
  az: number | null;
  timestamp?: number;
  version?: number;
  key?: string;
}

interface RankingEntry {
  id: string;
  name: string;
  points: number;
  gender: 'male' | 'female';
  originalRank?: number;
}

type GenderFilter = 'both' | 'male' | 'female';

interface RankingBoardProps {
  showCopyLink?: boolean;
}

export function RankingBoard({ showCopyLink = false }: RankingBoardProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [selectedRound, setSelectedRound] = useState('Qualifier');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('both');
  const [searchQuery, setSearchQuery] = useState('');
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [linkCopied, setLinkCopied] = useState(false);
  const [selectedStudentInfo, setSelectedStudentInfo] = useState<Student | null>(null);
  const [showRankingQr, setShowRankingQr] = useState(false);
  const rounds = useRounds();

  useEffect(() => {
    if (!rounds.includes(selectedRound)) {
      setSelectedRound(rounds[0]);
    }
  }, [rounds, selectedRound]);

  useEffect(() => {
    // Load students from Firebase
    const studentsRef = ref(database, 'students');
    const unsubscribeStudents = onValue(studentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const studentsList: Student[] = Object.keys(data).map((key) => ({
          ...data[key],
          key,
        }));
        setStudents(studentsList);
        localStorage.setItem('students', JSON.stringify(studentsList));
      } else {
        setStudents([]);
      }
    });

    // Load scores from Firebase
    const scoresRef = ref(database, 'scores');
    const unsubscribeScores = onValue(scoresRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const scoresList: Score[] = Object.keys(data).map((key) => ({
          ...data[key],
          key,
        }));
        setScores(scoresList);
        localStorage.setItem('scores', JSON.stringify(scoresList));
      } else {
        setScores([]);
      }
    });

    return () => {
      unsubscribeStudents();
      unsubscribeScores();
    };
  }, []);

  useEffect(() => {
    calculateRanking();
  }, [selectedRound, scores, students, genderFilter]);

  // Get only the latest version of each score
  const getLatestScores = (): Score[] => {
    const grouped: { [key: string]: Score[] } = {};

    scores.forEach((score) => {
      const key = `${score.id}-${score.round}-${score.boulder}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(score);
    });

    const latestScores: Score[] = [];
    Object.values(grouped).forEach((versions) => {
      // If versions exist, get the one with highest version number
      // Otherwise, just use the score as-is (backwards compatibility)
      if (versions.length > 0) {
        const latest = versions.reduce((prev, current) => {
          const prevVersion = prev.version || 0;
          const currentVersion = current.version || 0;
          return currentVersion > prevVersion ? current : prev;
        });
        latestScores.push(latest);
      }
    });

    return latestScores;
  };

  const calculateRanking = () => {
    const summary: { [key: string]: RankingEntry } = {};

    getLatestScores()
      .filter((s) => s.round === selectedRound)
      .forEach((s) => {
        if (!summary[s.id]) {
          const student = students.find((st) => st.id === s.id);
          if (!student) return;

          summary[s.id] = {
            id: s.id,
            name: student.name,
            points: 0,
            gender: student.gender || 'male',
          };
        }

        summary[s.id].points = Number(
          (summary[s.id].points + calculateBoulderPoints(s.at, s.az)).toFixed(1),
        );
      });

    let result = Object.values(summary);

    // Filter by gender
    if (genderFilter !== 'both') {
      result = result.filter((entry) => entry.gender === genderFilter);
    }

    // Point-based ranking: highest total points first.
    result.sort((a, b) => b.points - a.points);

    setRanking(result);
  };

  const filteredRanking = ranking.filter((entry) => {
  const search = searchQuery.toLowerCase();

  return (
    entry.name.toLowerCase().includes(search) ||
    entry.id.toLowerCase().includes(search)
  );
});

  const maleRanking = ranking.filter((entry) => entry.gender === 'male');
  const femaleRanking = ranking.filter((entry) => entry.gender === 'female');
  
  // Apply search filter to gender-specific rankings when searching
  const searchedMaleRanking = searchQuery
    ? maleRanking.filter((entry) => {
    const search = searchQuery.toLowerCase();
    return entry.name.toLowerCase().includes(search) || entry.id.toLowerCase().includes(search);
  })
    : maleRanking;
  
  const searchedFemaleRanking = searchQuery
    ? femaleRanking.filter((entry) => {
    const search = searchQuery.toLowerCase();
    return entry.name.toLowerCase().includes(search) || entry.id.toLowerCase().includes(search);
  })
    : femaleRanking;

  const getRankDisplay = (index: number, list: RankingEntry[]) => {
    if (index === 0) return { rank: 1 };

    const current = list[index];
    const prev = list[index - 1];

    if (
      current.points === prev.points
    ) {
      // Same rank as previous
      return getRankDisplay(index - 1, list);
    }

    return { rank: index + 1 };
  };
  
  // Get the original rank from the full ranking list
  const getOriginalRank = (entry: RankingEntry, fullList: RankingEntry[]) => {
    const originalIndex = fullList.findIndex((e) => 
      e.id === entry.id && e.name === entry.name
    );
    if (originalIndex === -1) return 0;
    return getRankDisplay(originalIndex, fullList).rank;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return null;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white';
    if (rank === 2) return 'bg-gradient-to-br from-slate-300 to-slate-500 text-white';
    if (rank === 3) return 'bg-gradient-to-br from-amber-500 to-amber-700 text-white';
    return 'bg-slate-100 text-slate-700';
  };

  const handleCopyLink = () => {
    const url = RANKING_ONLY_URL;
    
    // Fallback method that works without Clipboard API
    const textArea = document.createElement('textarea');
    textArea.value = url;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      textArea.remove();
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      textArea.remove();
      // Fallback: show the URL in an alert
      alert(`Copy this link: ${url}`);
    }
  };

  const renderRankingTable = (rankingList: RankingEntry[], title?: string, fullRankingList?: RankingEntry[]) => {
    if (rankingList.length === 0) {
      return (
        <div className="text-center py-12 text-slate-500">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p className="text-lg">No results{title ? ` for ${title}` : ''} in this round yet</p>
        </div>
      );
    }

    // Use full list for rank calculation if provided (for search results)
    const listForRank = fullRankingList || rankingList;

    return (
      <div className="w-full overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          {title && (
            <div className="px-3 sm:px-6 py-3 bg-slate-50 border-b-2 border-slate-200">
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5" />
                {title}
              </h3>
            </div>
          )}
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="w-[4.5rem] px-2 sm:px-4 py-3 text-left text-sm sm:text-base font-bold text-slate-700">Rank</th>
                <th className="w-[3.75rem] sm:w-[5.5rem] px-1 sm:px-4 py-3 text-left text-sm sm:text-base font-bold text-slate-700">BIB</th>
                <th className="px-2 sm:px-4 py-3 text-left text-sm sm:text-base font-bold text-slate-700">Name</th>
                <th className="w-[4.75rem] sm:w-[6.5rem] px-1 sm:px-4 py-3 text-center text-sm sm:text-base font-bold text-slate-700">Points</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {rankingList.map((entry) => {
                  // Find rank in the full list
                  const fullIndex = listForRank.findIndex((e) => e.id === entry.id);
                  const { rank } = getRankDisplay(fullIndex, listForRank);
                  const icon = getRankIcon(rank);
                  const badgeColor = getRankBadgeColor(rank);
                  const isHighlighted = searchQuery && entry.name.toLowerCase().includes(searchQuery.toLowerCase());

                  return (
                    <motion.tr
                      key={entry.id}
                      layout
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{
                        layout: { duration: 0.5, type: 'spring', stiffness: 100, damping: 20 },
                        opacity: { duration: 0.3 },
                        y: { duration: 0.3 }
                      }}
                      className={`border-b border-slate-100 transition-colors ${
                        isHighlighted
                          ? 'bg-amber-50 hover:bg-amber-100'
                          : rank <= 3
                          ? 'bg-slate-50'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-2 sm:px-4 py-3 sm:py-4">
                        <motion.div 
                          className="flex items-center gap-1 sm:gap-2"
                          layout="position"
                          transition={{ duration: 0.3 }}
                        >
                          <motion.span
                            layout
                            className={`inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full font-bold text-base sm:text-lg ${badgeColor} shadow-sm shrink-0`}
                            transition={{ duration: 0.3 }}
                          >
                            {rank}
                          </motion.span>
                          {icon && (
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ duration: 0.4, type: 'spring' }}
                            >
                              <span className="hidden sm:inline-flex">{icon}</span>
                            </motion.div>
                          )}
                        </motion.div>
                      </td>
                      <td className="px-1 sm:px-4 py-3 sm:py-4 font-mono text-xs sm:text-sm text-slate-600 break-words">{entry.id}</td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 font-semibold text-sm sm:text-base text-slate-900 min-w-0">
                        <button
                          onClick={() => {
                            const student = students.find((s) => s.id === entry.id);
                            setSelectedStudentInfo(student || null);
                          }}
                          className="block w-full text-left leading-snug break-words hover:text-emerald-600 hover:underline transition-colors"
                        >
                          {entry.name}
                        </button>
                        {isHighlighted && (
                          <motion.span
                            className="ml-2 text-xs text-amber-600 font-normal"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            (Search Match)
                          </motion.span>
                        )}
                      </td>
                      <td className="px-1 sm:px-4 py-3 sm:py-4 text-center">
                        <motion.span
                          className="inline-flex items-center justify-center w-full sm:min-w-[4.5rem] h-9 sm:h-10 px-1 sm:px-3 rounded-lg bg-blue-100 text-blue-700 text-sm sm:text-base font-bold"
                          key={`points-${entry.id}-${entry.points}`}
                          initial={{ scale: 1 }}
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.4 }}
                        >
                          {entry.points.toFixed(1)}
                        </motion.span>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6 md:p-8 mb-6">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Student Ranking</h2>

            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-slate-700">Round:</label>
              <select
                value={selectedRound}
                onChange={(e) => setSelectedRound(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
              >
                {rounds.map((roundName) => (
                  <option key={roundName} value={roundName}>{roundName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Gender Filter */}
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setGenderFilter('both')}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                  genderFilter === 'both'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Both
              </button>
              <button
                onClick={() => setGenderFilter('male')}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                  genderFilter === 'male'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Male
              </button>
              <button
                onClick={() => setGenderFilter('female')}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                  genderFilter === 'female'
                    ? 'bg-pink-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Female
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by BIB or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            {/* Copy Link Button */}
            {showCopyLink && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <button onClick={handleCopyLink} className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow-md">
                {linkCopied ? (
                  <>
                    <Check className="w-5 h-5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copy Ranking Link
                  </>
                )}
                </button>
                <button onClick={() => setShowRankingQr(true)} className="flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 font-medium text-white shadow-md hover:bg-violet-700">
                  <QrCode className="h-5 w-5" /> Generate Ranking QR
                </button>
              </div>
            )}
          </div>
        </div>

        {ranking.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-lg">No results for this round yet</p>
          </div>
        ) : genderFilter === 'both' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border-2 border-blue-200 rounded-lg overflow-hidden">
              {renderRankingTable(searchedMaleRanking, 'Male Category', maleRanking)}
            </div>
            <div className="bg-white border-2 border-pink-200 rounded-lg overflow-hidden">
              {renderRankingTable(searchedFemaleRanking, 'Female Category', femaleRanking)}
            </div>
          </div>
        ) : (
          renderRankingTable(filteredRanking, undefined, ranking)
        )}
      </div>

      <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-xl shadow-lg p-6 text-white">
        <h3 className="text-lg font-bold mb-3">Scoring Legend</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Top:</span>
            <span>25.0 − 0.1 per failed attempt before Top</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Zone only:</span>
            <span>10.0 − 0.1 per failed attempt before Zone</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Per boulder:</span>
            <span>Higher of Top or Zone, minimum 0.0</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Maximum:</span>
            <span>125.0 for 5 boulders; 150.0 for 6</span>
          </div>
        </div>
      </div>

      {/* Student Information Modal */}
      <AnimatePresence>
        {showRankingQr && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowRankingQr(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowRankingQr(false)} className="absolute right-3 top-3 z-10 rounded-lg bg-white p-2 shadow hover:bg-slate-100"><X className="h-5 w-5" /></button>
              <QrCodeCard value={RANKING_ONLY_URL} title="Student Ranking" subtitle="Scan to view live rankings" fileName="KCC-Student-Ranking" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Student Information Modal */}
      <AnimatePresence>
        {selectedStudentInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedStudentInfo(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl shadow-2xl p-6 md:p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-900">Student Information</h3>
                <button
                  onClick={() => setSelectedStudentInfo(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-slate-200">
                  <span className="font-semibold text-slate-700">BIB:</span>
                  <span className="text-slate-900 font-mono">{selectedStudentInfo.id}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-200">
                  <span className="font-semibold text-slate-700">Name:</span>
                  <span className="text-slate-900 font-semibold">{selectedStudentInfo.name}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-200">
                  <span className="font-semibold text-slate-700">School:</span>
                  <span className="text-slate-900">{selectedStudentInfo.school}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-200">
                  <span className="font-semibold text-slate-700">Class:</span>
                  <span className="text-slate-900">{selectedStudentInfo.class}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-200">
                  <span className="font-semibold text-slate-700">Age:</span>
                  <span className="text-slate-900">{selectedStudentInfo.age}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-200">
                  <span className="font-semibold text-slate-700">Gender:</span>
                  <span className={`px-3 py-1 rounded-full font-medium ${
                    selectedStudentInfo.gender === 'male'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-pink-100 text-pink-700'
                  }`}>
                    {selectedStudentInfo.gender === 'male' ? 'Male' : 'Female'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudentInfo(null)}
                className="mt-6 w-full px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
