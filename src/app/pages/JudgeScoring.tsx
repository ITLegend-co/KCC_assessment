import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { BackButton } from '../components/BackButton';
import { SearchableSelect } from '../components/SearchableSelect';
import { Save, Trash2, Undo2, ChevronRight, ChevronLeft, History, X as CloseIcon, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { database } from '../lib/firebase';
import { ref, push, onValue, remove } from 'firebase/database';
import { getCurrentUser } from '../lib/auth';
import { calculateBoulderPoints } from '../lib/scoring';
import { QrScannerModal } from '../components/QrScannerModal';

interface Student {
  id: string;
  name: string;
  school: string;
  class: string;
  age: number;
  gender?: 'male' | 'female';
  key?: string;
}

interface Score {
  id: string;
  round: string;
  boulder: number;
  at: number | null;
  az: number | null;
  attemptCount?: number;
  timestamp: number;
  version: number;
  key?: string;
}

export default function JudgeScoring() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const canViewScores = currentUser?.role === 'administrator' || currentUser?.role === 'chief-judge';

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    const canAccess =
      currentUser.role === 'administrator' ||
      currentUser.role === 'chief-judge' ||
      currentUser.role === 'judge';
    if (!canAccess) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [round, setRound] = useState('');
  const [boulder, setBoulder] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);
  const [az, setAz] = useState<number | null>(null);
  const [at, setAt] = useState<number | null>(null);
  const [selectedScores, setSelectedScores] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [isTopReached, setIsTopReached] = useState(false);
  const [showClashModal, setShowClashModal] = useState(false);
  const [clashLatestScore, setClashLatestScore] = useState<Score | null>(null);
  const [scoreSearch, setScoreSearch] = useState('');
const [scoreSortBy, setScoreSortBy] = useState<'name' | 'id' | 'round' | 'boulder' | 'at' | 'az' | 'points'>('name');
const [scoreSortOrder, setScoreSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isEditingLatest, setIsEditingLatest] = useState(false);
  const [scannerMode, setScannerMode] = useState<'student' | 'boulder' | null>(null);

  // Multi-step state
  const [currentStep, setCurrentStep] = useState(1);

  // History modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedScoreHistory, setSelectedScoreHistory] = useState<Score[]>([]);

  // Add history for undo functionality
  const [attemptHistory, setAttemptHistory] = useState<Array<{
    attemptCount: number;
    az: number | null;
    at: number | null;
  }>>([]);

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
    // Reset selectAll when scores change
    if (selectedScores.size === 0) {
      setSelectAll(false);
    } else if (getLatestScores().length > 0 && selectedScores.size === getLatestScores().length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedScores, scores]);

  // Get only the latest version of each score
  const getLatestScores = (): Score[] => {
    const grouped: { [key: string]: Score[] } = {};

    scores.forEach((score) => {
  const key = JSON.stringify({
    id: score.id,
    round: score.round,
    boulder: score.boulder,
  });

  if (!grouped[key]) {
    grouped[key] = [];
  }

  grouped[key].push(score);
});

    const latestScores: Score[] = [];
    Object.values(grouped).forEach((versions) => {
      const latest = versions.reduce((prev, current) => {
        const prevVersion = prev.version || 0;
        const currentVersion = current.version || 0;
        return currentVersion > prevVersion ? current : prev;
      });
      latestScores.push(latest);
    });

    return latestScores;
  };

  const getFilteredAndSortedScores = (): Score[] => {
  const search = scoreSearch.toLowerCase();

  return getLatestScores()
    .filter((score) => {
      const studentName = getStudentName(score.id).toLowerCase();

      return (
        score.id.toLowerCase().includes(search) ||
        studentName.includes(search) ||
        score.round.toLowerCase().includes(search) ||
        String(score.boulder).includes(search) ||
        String(score.at ?? '-').includes(search) ||
        String(score.az ?? '-').includes(search)
      );
    })
    .sort((a, b) => {
      let valueA: string | number = '';
      let valueB: string | number = '';

      if (scoreSortBy === 'name') {
        valueA = getStudentName(a.id).toLowerCase();
        valueB = getStudentName(b.id).toLowerCase();
      } else if (scoreSortBy === 'id') {
        valueA = a.id.toLowerCase();
        valueB = b.id.toLowerCase();
      } else if (scoreSortBy === 'round') {
        valueA = a.round.toLowerCase();
        valueB = b.round.toLowerCase();
      } else if (scoreSortBy === 'boulder') {
        valueA = a.boulder;
        valueB = b.boulder;
      } else if (scoreSortBy === 'at') {
        valueA = a.at ?? 9999;
        valueB = b.at ?? 9999;
      } else if (scoreSortBy === 'az') {
        valueA = a.az ?? 9999;
        valueB = b.az ?? 9999;
      } else if (scoreSortBy === 'points') {
        valueA = calculateBoulderPoints(a.at, a.az);
        valueB = calculateBoulderPoints(b.at, b.az);
      }

      if (valueA < valueB) return scoreSortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return scoreSortOrder === 'asc' ? 1 : -1;
      return 0;
    });
};

  // Check if a score has been edited (has multiple versions)
  const hasEditHistory = (id: string, round: string, boulder: number): boolean => {
    const versions = scores.filter(
      (s) => s.id === id && s.round === round && s.boulder === boulder
    );
    return versions.length > 1;
  };

  // Get all versions of a score
  const getScoreHistory = (id: string, round: string, boulder: number): Score[] => {
    return scores
      .filter((s) => s.id === id && s.round === round && s.boulder === boulder)
      .sort((a, b) => {
        const aVersion = a.version || 0;
        const bVersion = b.version || 0;
        return bVersion - aVersion;
      });
  };

  const recordAttempt = (type: 'fall' | 'zone' | 'top') => {
  if (isTopReached) return;

  const newAttemptCount = attemptCount + 1;

  setAttemptHistory((prevHistory) => [
    ...prevHistory,
    { attemptCount, az, at },
  ]);

  setAttemptCount(newAttemptCount);

  if (type === 'zone') {
    if (az == null) {
      setAz(newAttemptCount);
    }
  }

  if (type === 'top') {
    setAz((prevAz) => prevAz ?? newAttemptCount);
    setAt(newAttemptCount);
    setIsTopReached(true);
  }
};

  const resetAttempts = () => {
    setAttemptCount(0);
    setAz(null);
    setAt(null);
    setIsTopReached(false);
    setAttemptHistory([]);
  };

  const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();

  try {
    const existingVersions = scores.filter(
      (s) =>
        s.id === selectedStudent &&
        s.round === round &&
        s.boulder === Number(boulder)
    );

    const nextVersion =
      existingVersions.length > 0
        ? Math.max(...existingVersions.map((s) => s.version || 0)) + 1
        : 1;

    const newScore = {
      id: selectedStudent,
      round,
      boulder: Number(boulder),
      at: at ?? null,
      az: az ?? null,
      attemptCount: attemptCount ?? 0,
      points: calculateBoulderPoints(at, az),
      timestamp: Date.now(),
      version: nextVersion,
    };

    await push(ref(database, 'scores'), newScore);

    setIsEditingLatest(false);

    if (canViewScores) {
      setCurrentStep(5);
    } else {
      resetForm();
    }
  } catch (error) {
    console.error('Failed to save score:', error);
    alert('Failed to save score. Please try again.');
  }
};

  const resetForm = () => {
  setSelectedStudent('');
  setRound('');
  setBoulder('');
  setCurrentStep(1);
  setIsEditingLatest(false);
  resetAttempts();
};

  const getStudentName = (id: string) => {
    const student = students.find((s) => s.id === id);
    return student ? student.name : 'Unknown';
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedScores(new Set());
      setSelectAll(false);
    } else {
      const allKeys = new Set(
        getLatestScores().map((s) =>
  JSON.stringify({
    id: s.id,
    round: s.round,
    boulder: s.boulder,
  })
)
      );
      setSelectedScores(allKeys);
      setSelectAll(true);
    }
  };

  const handleSelectScore = (comboKey: string) => {
    const newSelected = new Set(selectedScores);
    if (newSelected.has(comboKey)) {
      newSelected.delete(comboKey);
    } else {
      newSelected.add(comboKey);
    }
    setSelectedScores(newSelected);
  };

  const handleDeleteSelected = async () => {
  if (selectedScores.size === 0) {
    alert('Please select scores to delete');
    return;
  }

  const count = selectedScores.size;
  if (!window.confirm(`Delete ${count} selected score${count > 1 ? 's' : ''} and all their versions?`)) {
    return;
  }

  const deletePromises: Promise<void>[] = [];

  selectedScores.forEach((comboKey) => {
    const selected = JSON.parse(comboKey);
    const id = selected.id;
    const round = selected.round;
    const boulder = Number(selected.boulder);

    const versionsToDelete = scores.filter(
      (s) =>
        s.id === id &&
        s.round === round &&
        s.boulder === boulder &&
        s.key
    );

    versionsToDelete.forEach((score) => {
      if (score.key) {
        deletePromises.push(remove(ref(database, `scores/${score.key}`)));
      }
    });
  });

  await Promise.all(deletePromises);
  setSelectedScores(new Set());
  setSelectAll(false);
};

  const handleUndo = () => {
    if (attemptHistory.length > 0) {
      const lastState = attemptHistory[attemptHistory.length - 1];
      setAttemptCount(lastState.attemptCount);
      setAz(lastState.az);
      setAt(lastState.at);
      if (isTopReached && lastState.at === null) {
        setIsTopReached(false);
      }
      setAttemptHistory((prevHistory) => prevHistory.slice(0, -1));
    }
  };

  const getLatestScoreForSelection = () => {
  const matching = scores.filter(
    (s) =>
      s.id === selectedStudent &&
      s.round === round &&
      s.boulder === Number(boulder)
  );

  if (matching.length === 0) return null;

  return matching.reduce((latest, current) => {
    const latestVersion = latest.version || 0;
    const currentVersion = current.version || 0;
    return currentVersion > latestVersion ? current : latest;
  });
};

const startEditFromLatest = () => {
  if (!clashLatestScore) return;

  const latestAttemptCount =
    clashLatestScore.attemptCount ??
    Math.max(clashLatestScore.at ?? 0, clashLatestScore.az ?? 0);

  setAttemptCount(latestAttemptCount);
  setAz(clashLatestScore.az ?? null);
  setAt(clashLatestScore.at ?? null);

  setIsTopReached(false);
  setIsEditingLatest(true);

  setAttemptHistory([]);
  setShowClashModal(false);
  setCurrentStep(4);
};

const startCreateNew = () => {
  resetAttempts();
  setIsEditingLatest(false);
  setShowClashModal(false);
  setCurrentStep(4);
};
  
  const handleNextStep = () => {
  if (currentStep === 1) {
    if (!round) {
      alert('Please select a round');
      return;
    }
    setCurrentStep(2);
    return;
  }

  if (currentStep === 2) {
    if (!selectedStudent) {
      alert('Please select or scan a student');
      return;
    }
    setCurrentStep(3);
    return;
  }

  if (currentStep === 3) {
    if (!boulder || Number(boulder) < 1) {
      alert('Please enter or scan a valid boulder number');
      return;
    }

    const latestScore = getLatestScoreForSelection();

    if (latestScore) {
      setClashLatestScore(latestScore);
      setShowClashModal(true);
      return;
    }

    resetAttempts();
    setCurrentStep(4);
  }
};

  const handlePreviousStep = () => {
    if (currentStep === 4) {
      setCurrentStep(3);
      resetAttempts();
    } else if (currentStep > 1 && currentStep < 4) {
      setCurrentStep(currentStep - 1);
    } else if (currentStep === 5) {
      setCurrentStep(4);
    }
  };

  const handleQrScan = (rawValue: string) => {
    if (scannerMode === 'student') {
      const scannedBib = rawValue.startsWith('KCC:BIB:')
        ? rawValue.slice('KCC:BIB:'.length).trim()
        : rawValue.trim();
      const student = students.find((item) => item.id.toLowerCase() === scannedBib.toLowerCase());
      if (!student) {
        alert(`No student found for BIB: ${scannedBib}`);
        setScannerMode(null);
        return;
      }
      setSelectedStudent(student.id);
    }

    if (scannerMode === 'boulder') {
      const scannedBoulder = rawValue.startsWith('KCC:BOULDER:')
        ? rawValue.slice('KCC:BOULDER:'.length).trim()
        : rawValue.trim();
      if (!/^\d+$/.test(scannedBoulder) || Number(scannedBoulder) < 1) {
        alert('This is not a valid boulder QR code.');
        setScannerMode(null);
        return;
      }
      setBoulder(String(Number(scannedBoulder)));
    }

    setScannerMode(null);
  };

  const pointDisplay = at
    ? `${calculateBoulderPoints(at, az).toFixed(1)} / 25`
    : az
      ? `${calculateBoulderPoints(at, az).toFixed(1)} / 10.0`
      : '0.0 / 0.0';

  const handleShowHistory = (id: string, round: string, boulder: number) => {
    const history = getScoreHistory(id, round, boulder);
    setSelectedScoreHistory(history);
    setShowHistoryModal(true);
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <BackButton />
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">
            Judge Scoring – Student Category
          </h2>

          {/* Step Indicator */}
          <div className="mb-6">
            <div className="flex items-start justify-center overflow-x-auto pb-2">
              {(canViewScores ? ['Round', 'Student', 'Boulder', 'Scoring', 'Records'] : ['Round', 'Student', 'Boulder', 'Scoring']).map((label, index, steps) => {
                const step = index + 1;
                return (
                  <div key={label} className="flex items-start">
                    <div className="flex w-16 flex-col items-center sm:w-20">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full font-bold ${currentStep >= step ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {step}
                      </div>
                      <span className={`mt-2 text-xs ${currentStep === step ? 'font-semibold text-emerald-700' : 'text-slate-500'}`}>{label}</span>
                    </div>
                    {index < steps.length - 1 && <div className={`mt-4 h-1 w-6 sm:w-10 ${currentStep > step ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
                  </div>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Step 1: Round */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Round
                  </label>
                  <select
                    value={round}
                    onChange={(e) => setRound(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">-- Select Round --</option>
                    <option value="Qualifier">Qualifier</option>
                    <option value="Semi Final">Semi Final</option>
                    <option value="Final">Final</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {/* Step 2: Student */}
            {currentStep === 2 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                <div className="rounded-lg bg-slate-50 p-4 text-sm"><strong>Round:</strong> {round}</div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Select Student</label>
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <SearchableSelect
                        value={selectedStudent}
                        onChange={setSelectedStudent}
                        options={students.map((student) => ({ value: student.id, label: `${student.id} - ${student.name}` }))}
                        placeholder="Search BIB or student name"
                        required
                      />
                    </div>
                    <button type="button" onClick={() => setScannerMode('student')} aria-label="Scan student BIB QR" title="Scan student BIB QR" className="rounded-lg bg-violet-600 p-3 text-white shadow-md hover:bg-violet-700">
                      <Camera className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={handlePreviousStep} className="flex-1 rounded-lg bg-slate-500 px-6 py-3 font-semibold text-white hover:bg-slate-600"><ChevronLeft className="mr-2 inline h-5 w-5" />Previous</button>
                  <button type="button" onClick={handleNextStep} className="flex-1 rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700">Next<ChevronRight className="ml-2 inline h-5 w-5" /></button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Boulder */}
            {currentStep === 3 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                <div className="rounded-lg bg-slate-50 p-4 text-sm"><strong>Round:</strong> {round}<span className="mx-3 text-slate-300">|</span><strong>Student:</strong> {getStudentName(selectedStudent)}</div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Boulder Number</label>
                  <div className="flex gap-2">
                    <input type="number" min="1" value={boulder} onChange={(e) => setBoulder(e.target.value)} placeholder="Enter boulder number" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-emerald-500" />
                    <button type="button" onClick={() => setScannerMode('boulder')} aria-label="Scan boulder QR" title="Scan boulder QR" className="rounded-lg bg-violet-600 p-3 text-white shadow-md hover:bg-violet-700">
                      <Camera className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={handlePreviousStep} className="flex-1 rounded-lg bg-slate-500 px-6 py-3 font-semibold text-white hover:bg-slate-600"><ChevronLeft className="mr-2 inline h-5 w-5" />Previous</button>
                  <button type="button" onClick={handleNextStep} className="flex-1 rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700">Next<ChevronRight className="ml-2 inline h-5 w-5" /></button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Scoring */}
            {currentStep === 4 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-semibold text-slate-700">Student:</span>{' '}
                      <span className="text-slate-900">{getStudentName(selectedStudent)}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Round:</span>{' '}
                      <span className="text-slate-900">{round}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Boulder:</span>{' '}
                      <span className="text-slate-900">{boulder}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-6 space-y-3">
                  <div className="text-lg font-bold text-slate-900">
                    Attempts: <span className="text-emerald-600">{attemptCount}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-lg">
                    <div>
                      <span className="font-semibold text-slate-700">AZ:</span>{' '}
                      <span className="font-bold text-amber-600">{az ?? '-'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">AT:</span>{' '}
                      <span className="font-bold text-emerald-600">{at ?? '-'}</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-200 text-lg">
                    <span className="font-semibold text-slate-700">Boulder Points:</span>{' '}
                    <span className="font-bold text-blue-600">
                      {pointDisplay}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={attemptHistory.length === 0}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg disabled:shadow-none"
                >
                  <Undo2 className="w-5 h-5" />
                  Back (Undo Last Action)
                </button>

                <div className="grid grid-cols-3 gap-3">
  <button
    type="button"
    onClick={() => recordAttempt('fall')}
    disabled={isTopReached}
    className={`px-4 py-3 font-semibold rounded-lg transition-colors shadow-md ${
      isTopReached
        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
        : 'bg-red-600 hover:bg-red-700 text-white hover:shadow-lg'
    }`}
  >
    Fall
  </button>

  <button
    type="button"
    onClick={() => recordAttempt('zone')}
    disabled={isTopReached}
    className={`px-4 py-3 font-semibold rounded-lg transition-colors shadow-md ${
      isTopReached
        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
        : 'bg-amber-500 hover:bg-amber-600 text-white hover:shadow-lg'
    }`}
  >
    Zone
  </button>

  <button
    type="button"
    onClick={() => recordAttempt('top')}
    disabled={isTopReached}
    className={`px-4 py-3 font-semibold rounded-lg transition-colors shadow-md ${
      isTopReached
        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
        : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg'
    }`}
  >
    Top
  </button>
</div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-500 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Previous
                  </button>
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
                  >
                    <Save className="w-5 h-5" />
                    Save Score
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 5: Recorded Scores (Admin/Chief Judge only) */}
            {currentStep === 5 && canViewScores && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-700 font-semibold">
                    ✓ Score saved successfully!
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
                >
                  Score Another Student
                </button>
              </motion.div>
            )}
          </form>
        </div>

        {canViewScores && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Table Header with Actions */}
            {getLatestScores().length > 0 && (
              <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
                <div className="w-full space-y-3">
  <h3 className="text-lg font-bold text-slate-900">Recorded Scores</h3>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
    <input
      type="text"
      value={scoreSearch}
      onChange={(e) => setScoreSearch(e.target.value)}
      placeholder="Search BIB, name, round, boulder..."
      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
    />

    <select
      value={scoreSortBy}
      onChange={(e) => setScoreSortBy(e.target.value as typeof scoreSortBy)}
      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
    >
      <option value="name">Sort by Name</option>
      <option value="id">Sort by BIB</option>
      <option value="round">Sort by Round</option>
      <option value="boulder">Sort by Boulder</option>
      <option value="at">Sort by AT</option>
      <option value="az">Sort by AZ</option>
      <option value="points">Sort by Points</option>
    </select>

    <select
      value={scoreSortOrder}
      onChange={(e) => setScoreSortOrder(e.target.value as typeof scoreSortOrder)}
      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
    >
      <option value="asc">Ascending</option>
      <option value="desc">Descending</option>
    </select>
  </div>
</div>
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  disabled={selectedScores.size === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg disabled:shadow-none"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected ({selectedScores.size})
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-3 py-3 text-left text-sm font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="mr-2"
                      />
                      BIB
                    </th>
                    <th className="px-3 py-3 text-left text-sm font-semibold text-slate-700">
                      Name
                    </th>
                    <th className="px-3 py-3 text-left text-sm font-semibold text-slate-700 hidden sm:table-cell">
                      Round
                    </th>
                    <th className="px-3 py-3 text-center text-sm font-semibold text-slate-700">
                      Boulder
                    </th>
                    <th className="px-3 py-3 text-center text-sm font-semibold text-slate-700">
                      AT
                    </th>
                    <th className="px-3 py-3 text-center text-sm font-semibold text-slate-700">
                      AZ
                    </th>
                    <th className="px-3 py-3 text-center text-sm font-semibold text-slate-700">
                      Points
                    </th>
                    <th className="px-3 py-3 text-center text-sm font-semibold text-slate-700">
                      History
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {getFilteredAndSortedScores().length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        No scores recorded yet
                      </td>
                    </tr>
                  ) : (
                    getFilteredAndSortedScores().map((score) => {
                      const comboKey = JSON.stringify({
  id: score.id,
  round: score.round,
  boulder: score.boulder,
});
                      const hasHistory = hasEditHistory(score.id, score.round, score.boulder);

                      return (
                        <tr
                          key={comboKey}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-3 py-3 text-sm text-slate-900">
                            <input
                              type="checkbox"
                              checked={selectedScores.has(comboKey)}
                              onChange={() => handleSelectScore(comboKey)}
                              className="mr-2"
                            />
                            {score.id}
                          </td>
                          <td className="px-3 py-3 text-sm text-slate-900">
                            {getStudentName(score.id)}
                          </td>
                          <td className="px-3 py-3 text-sm text-slate-600 hidden sm:table-cell">
                            {score.round}
                          </td>
                          <td className="px-3 py-3 text-sm text-center text-slate-900">
                            {score.boulder}
                          </td>
                          <td className="px-3 py-3 text-sm text-center font-semibold text-emerald-600">
                            {score.at ?? '-'}
                          </td>
                          <td className="px-3 py-3 text-sm text-center font-semibold text-amber-600">
                            {score.az ?? '-'}
                          </td>
                          <td className="px-3 py-3 text-sm text-center font-bold text-blue-600">
                            {calculateBoulderPoints(score.at, score.az).toFixed(1)}
                          </td>
                          <td className="px-3 py-3 text-center">
                            {hasHistory ? (
                              <button
                                onClick={() => handleShowHistory(score.id, score.round, score.boulder)}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-semibold rounded-lg transition-colors"
                              >
                                <History className="w-3 h-3" />
                                Edited
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {scannerMode && (
          <QrScannerModal
            title={scannerMode === 'student' ? 'Scan Student BIB' : 'Scan Boulder QR'}
            onScan={handleQrScan}
            onClose={() => setScannerMode(null)}
          />
        )}

        <AnimatePresence>
  {showClashModal && clashLatestScore && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full"
      >
        <h3 className="text-xl font-bold text-slate-900 mb-3">
          Existing Score Found
        </h3>

        <p className="text-slate-600 mb-4">
          This student already has a score for the same round and boulder.
        </p>

        <div className="bg-slate-50 rounded-lg p-4 mb-5 text-sm">
          <p><strong>Student:</strong> {getStudentName(selectedStudent)}</p>
          <p><strong>Round:</strong> {round}</p>
          <p><strong>Boulder:</strong> {boulder}</p>
          <p><strong>Latest AT:</strong> {clashLatestScore.at ?? '-'}</p>
          <p><strong>Latest AZ:</strong> {clashLatestScore.az ?? '-'}</p>
          <p><strong>Points:</strong> {calculateBoulderPoints(clashLatestScore.at, clashLatestScore.az).toFixed(1)}</p>
          <p><strong>Version:</strong> {clashLatestScore.version || 1}</p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={startEditFromLatest}
            className="w-full px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
          >
            Edit From Latest Score
          </button>

          <button
            type="button"
            onClick={startCreateNew}
            className="w-full px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg"
          >
            Create New Score
          </button>

          <button
            type="button"
            onClick={() => setShowClashModal(false)}
            className="w-full px-5 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
        
        {/* History Modal */}
        <AnimatePresence>
          {showHistoryModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowHistoryModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-xl shadow-2xl p-6 md:p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <History className="w-6 h-6 text-blue-600" />
                    <h3 className="text-2xl font-bold text-slate-900">Score History</h3>
                  </div>
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <CloseIcon className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                {selectedScoreHistory.length > 0 && (
                  <div className="mb-4 bg-slate-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-semibold text-slate-700">Student:</span>{' '}
                        <span className="text-slate-900">{getStudentName(selectedScoreHistory[0].id)}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">Round:</span>{' '}
                        <span className="text-slate-900">{selectedScoreHistory[0].round}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">Boulder:</span>{' '}
                        <span className="text-slate-900">{selectedScoreHistory[0].boulder}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {selectedScoreHistory.map((score, index) => (
                    <div
                      key={score.key}
                      className={`border-2 rounded-lg p-4 ${
                        index === 0
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-700">
                            Version {score.version || 1}
                          </span>
                          {index === 0 && (
                            <span className="px-2 py-1 bg-emerald-600 text-white text-xs font-bold rounded">
                              CURRENT
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">
                          {score.timestamp ? new Date(score.timestamp).toLocaleString() : 'Unknown date'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-slate-600">AT:</span>{' '}
                          <span className="text-lg font-bold text-emerald-600">
                            {score.at ?? '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-slate-600">Points:</span>{' '}
                          <span className="text-lg font-bold text-blue-600">
                            {calculateBoulderPoints(score.at, score.az).toFixed(1)}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-slate-600">AZ:</span>{' '}
                          <span className="text-lg font-bold text-amber-600">
                            {score.az ?? '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="mt-6 w-full px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
