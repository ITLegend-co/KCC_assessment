import { useState, useEffect, useRef } from 'react';
import { 
  Timer, 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Volume2, 
  X, 
  Save, 
  Minus, 
  Maximize 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import whistleMp3 from '../../assets/whistle.mp3';
import airhornMp3 from '../../assets/airhorn.mp3';
import buzzerMp3 from '../../assets/buzzer.mp3';

type SoundType = 'beep' | 'airhorn' | 'whistle' | 'buzzer' | 'bell';

interface TimerSettings {
  preCountdownSeconds: number;
  officialCountdownSeconds: number;
  startSound: SoundType;
  endSound: SoundType;
}

export function TimerButton() {
  const [showTimer, setShowTimer] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  
  // Timer states
  const [isRunning, setIsRunning] = useState(false);
  const [isPreCountdown, setIsPreCountdown] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  const [settings, setSettings] = useState<TimerSettings>(() => {
    // Load saved settings from localStorage
    const saved = localStorage.getItem('timerSettings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {
          preCountdownSeconds: 10,
          officialCountdownSeconds: 240,
          startSound: 'beep' as SoundType,
          endSound: 'beep' as SoundType,
        };
      }
    }
    return {
      preCountdownSeconds: 10,
      officialCountdownSeconds: 240,
      startSound: 'beep' as SoundType,
      endSound: 'beep' as SoundType,
    };
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const minimizedRef = useRef<HTMLDivElement>(null);
  const whistleAudio = useRef<HTMLAudioElement | null>(null);
const airhornAudio = useRef<HTMLAudioElement | null>(null);
const buzzerAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
  // Initialize audio files
  whistleAudio.current = new Audio(whistleMp3);
  airhornAudio.current = new Audio(airhornMp3);
  buzzerAudio.current = new Audio(buzzerMp3);

  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };
}, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (isPreCountdown) {
              setIsPreCountdown(false);
              playAlert(settings.startSound);
              return settings.officialCountdownSeconds;
            } else {
              setIsRunning(false);
              playAlert(settings.endSound);
              return 0;
            }
          }
          
          if (isPreCountdown && prev > 1) {
            playTickSound();
          }
          
          if (!isPreCountdown && prev === 10) {
            playTickSound();
          }
          
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPreCountdown, settings]);

  const playTickSound = () => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  };

  const playAlert = (soundType: SoundType) => {
  switch (soundType) {
    case 'whistle':
      whistleAudio.current?.play();
      break;

    case 'airhorn':
      airhornAudio.current?.play();
      break;

    case 'buzzer':
      buzzerAudio.current?.play();
      break;

    case 'beep':
      whistleAudio.current?.play();
      break;

    case 'bell':
      whistleAudio.current?.play();
      break;
  }
};

  const handleStart = () => {
    if (settings.preCountdownSeconds > 0) {
      setIsPreCountdown(true);
      setTimeLeft(settings.preCountdownSeconds);
    } else {
      setIsPreCountdown(false);
      setTimeLeft(settings.officialCountdownSeconds);
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPreCountdown(false);
    setTimeLeft(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const saveSettings = () => {
    localStorage.setItem('timerSettings', JSON.stringify(settings));
    // Show a brief success message
    const originalText = 'Save Settings';
    const button = document.getElementById('save-button');
    if (button) {
      button.textContent = '✓ Saved!';
      setTimeout(() => {
        button.textContent = originalText;
      }, 2000);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.current.x,
          y: e.clientY - dragStart.current.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <>
      {/* Floating Timer Button (when not showing timer) */}
      {!showTimer && !isMinimized && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowTimer(true)}
          className="fixed bottom-6 right-6 z-40 w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:shadow-purple-500/50"
          title="Competition Timer"
        >
          <Timer className="w-8 h-8" />
        </motion.button>
      )}

      {/* Minimized Timer Widget (draggable) */}
      <AnimatePresence>
        {isMinimized && (
          <motion.div
            ref={minimizedRef}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            style={{
              position: 'fixed',
              left: position.x,
              top: position.y,
              cursor: isDragging ? 'grabbing' : 'grab',
              zIndex: 50,
            }}
            onMouseDown={handleMouseDown}
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl border-2 border-slate-700"
          >
            <div className="p-4 min-w-[240px]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-purple-400" />
                  <span className="text-white font-semibold">Timer</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMinimized(false);
                      setShowTimer(true);
                    }}
                    className="p-1 text-slate-400 hover:text-white transition-colors"
                    title="Maximize"
                  >
                    <Maximize className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMinimized(false);
                      handleReset();
                    }}
                    className="p-1 text-slate-400 hover:text-white transition-colors"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-center mb-3">
                <div className={`text-xs font-semibold mb-1 ${isPreCountdown ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {isPreCountdown ? 'GET READY' : 'CLIMBING TIME'}
                </div>
                <div className={`text-4xl font-bold tabular-nums ${
                  timeLeft <= 10 && !isPreCountdown ? 'text-red-500' : 'text-white'
                }`}>
                  {formatTime(timeLeft)}
                </div>
              </div>

              <div className="flex items-center justify-center gap-2">
                {!isRunning ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStart();
                    }}
                    className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full transition-colors"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePause();
                    }}
                    className="p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full transition-colors"
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReset();
                  }}
                  className="p-2 bg-slate-600 hover:bg-slate-700 text-white rounded-full transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSettings(true);
                  }}
                  className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Timer Modal */}
      <AnimatePresence>
        {showTimer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowTimer(false);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-6xl"
            >
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl p-8 relative">
                {/* Header with controls */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={() => {
                      setShowTimer(false);
                      setIsMinimized(true);
                    }}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                    title="Minimize"
                  >
                    <Minus className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setShowTimer(false)}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                    title="Close"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Settings Panel */}
                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm z-10 rounded-2xl p-8 flex items-center justify-center"
                    >
                      <div className="bg-slate-800 rounded-xl p-8 max-w-md w-full space-y-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-2xl font-bold text-white">Timer Settings</h3>
                          <button
                            onClick={() => setShowSettings(false)}
                            className="p-2 text-slate-400 hover:text-white transition-colors"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>

                        <div>
  <label className="block text-sm font-semibold text-slate-300 mb-2">
    Pre-Countdown (seconds)
  </label>

  <input
    type="number"
    min="0"
    max="30"
    value={settings.preCountdownSeconds}
    onChange={(e) =>
      setSettings({
        ...settings,
        preCountdownSeconds: parseInt(e.target.value) || 0,
      })
    }
    className="w-full px-4 py-2 bg-slate-700 text-white border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500"
  />

  <p className="text-xs text-slate-400 mt-1">
    Countdown before official timer starts (0 to disable)
  </p>
</div>

{/* Official Countdown */}
<div>
  <label className="block text-sm font-semibold text-slate-300 mb-2">
    Official Countdown (HH:MM:SS)
  </label>

  <div className="grid grid-cols-3 gap-2">
  {/* Hours */}
  <input
    type="number"
    min="0"
    max="23"
    placeholder="HH"
    value={Math.floor(settings.officialCountdownSeconds / 3600)}
    onChange={(e) => {
      const hours = parseInt(e.target.value) || 0;
      const minutes = Math.floor((settings.officialCountdownSeconds % 3600) / 60);
      const seconds = settings.officialCountdownSeconds % 60;

      setSettings({
        ...settings,
        officialCountdownSeconds:
          hours * 3600 + minutes * 60 + seconds,
      });
    }}
    className="w-full px-4 py-2 bg-slate-700 text-white border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500"
  />

  {/* Minutes */}
  <input
    type="number"
    min="0"
    max="59"
    placeholder="MM"
    value={Math.floor((settings.officialCountdownSeconds % 3600) / 60)}
    onChange={(e) => {
      const hours = Math.floor(settings.officialCountdownSeconds / 3600);
      const minutes = parseInt(e.target.value) || 0;
      const seconds = settings.officialCountdownSeconds % 60;

      setSettings({
        ...settings,
        officialCountdownSeconds:
          hours * 3600 + minutes * 60 + seconds,
      });
    }}
    className="w-full px-4 py-2 bg-slate-700 text-white border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500"
  />

  {/* Seconds */}
  <input
    type="number"
    min="0"
    max="59"
    placeholder="SS"
    value={settings.officialCountdownSeconds % 60}
    onChange={(e) => {
      const hours = Math.floor(settings.officialCountdownSeconds / 3600);
      const minutes = Math.floor((settings.officialCountdownSeconds % 3600) / 60);
      const seconds = parseInt(e.target.value) || 0;

      setSettings({
        ...settings,
        officialCountdownSeconds:
          hours * 3600 + minutes * 60 + seconds,
      });
    }}
    className="w-full px-4 py-2 bg-slate-700 text-white border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500"
  />
</div>

  <p className="text-xs text-slate-400 mt-1">
    Main competition timer duration
  </p>
</div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-2">
                            Start Sound
                          </label>
                          <select
                            value={settings.startSound}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                startSound: e.target.value as SoundType,
                              })
                            }
                            className="w-full px-4 py-2 bg-slate-700 text-white border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="beep">Triple Beep</option>
                            <option value="airhorn">Air Horn</option>
                            <option value="whistle">Whistle</option>
                            <option value="buzzer">Buzzer</option>
                            <option value="bell">Bell</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-2">
                            End Sound
                          </label>
                          <select
                            value={settings.endSound}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                endSound: e.target.value as SoundType,
                              })
                            }
                            className="w-full px-4 py-2 bg-slate-700 text-white border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="beep">Triple Beep</option>
                            <option value="airhorn">Air Horn</option>
                            <option value="whistle">Whistle</option>
                            <option value="buzzer">Buzzer</option>
                            <option value="bell">Bell</option>
                          </select>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              playAlert(settings.startSound);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                          >
                            <Volume2 className="w-5 h-5" />
                            Test Start
                          </button>
                          <button
                            onClick={() => {
                              playAlert(settings.endSound);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                          >
                            <Volume2 className="w-5 h-5" />
                            Test End
                          </button>
                        </div>

                        <button
                          id="save-button"
                          onClick={saveSettings}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                        >
                          <Save className="w-5 h-5" />
                          Save Settings
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Timer Display */}
                <div className="flex flex-col items-center justify-center py-12">
                  <motion.div
                    key={isPreCountdown ? 'pre' : 'official'}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-4xl font-bold mb-8 ${
                      isPreCountdown ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {isPreCountdown ? 'GET READY' : 'CLIMBING TIME'}
                  </motion.div>

                  <motion.div
                    key={timeLeft}
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className={`text-[10rem] font-bold tabular-nums leading-none ${
                      timeLeft <= 10 && !isPreCountdown
                        ? 'text-red-500 animate-pulse'
                        : isPreCountdown
                        ? 'text-amber-400'
                        : 'text-white'
                    }`}
                  >
                    {formatTime(timeLeft)}
                  </motion.div>

                  <div className="flex items-center gap-6 mt-12">
                    {!isRunning ? (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleStart}
                        className="w-16 h-16 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg transition-colors"
                      >
                        <Play className="w-8 h-8" />
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handlePause}
                        className="w-16 h-16 flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg transition-colors"
                      >
                        <Pause className="w-8 h-8" />
                      </motion.button>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleReset}
                      className="w-16 h-16 flex items-center justify-center bg-slate-600 hover:bg-slate-700 text-white rounded-full shadow-lg transition-colors"
                    >
                      <RotateCcw className="w-8 h-8" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowSettings(true)}
                      className="w-16 h-16 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-colors"
                    >
                      <Settings className="w-8 h-8" />
                    </motion.button>
                  </div>

                  {!isRunning && timeLeft === 0 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-slate-400 mt-8 text-lg"
                    >
                      Press play to start the timer
                    </motion.p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
