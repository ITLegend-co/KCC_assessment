import { useState, useEffect, useRef } from 'react';
import { 
  Timer, 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Maximize2, 
  Minimize2,
  Volume2,
  X,
  Save,
  Minus,
  Maximize
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type AlertType = 'beep' | 'airhorn' | 'whistle';
type SoundType = 'beep' | 'airhorn' | 'whistle' | 'buzzer' | 'bell';

interface TimerSettings {
  preCountdownSeconds: number;
  officialCountdownSeconds: number;
  startSound: SoundType;
  endSound: SoundType;
}

interface CompetitionTimerProps {
  onClose?: () => void;
}

export function CompetitionTimer({ onClose }: CompetitionTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isPreCountdown, setIsPreCountdown] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timerSize, setTimerSize] = useState<'small' | 'medium' | 'large'>('medium');
  
  const [settings, setSettings] = useState<TimerSettings>({
    preCountdownSeconds: 10,
    officialCountdownSeconds: 240, // 4 minutes default
    startSound: 'beep',
    endSound: 'beep',
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Web Audio API
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (isPreCountdown) {
              // Pre-countdown finished, start official countdown
              setIsPreCountdown(false);
              playAlert(settings.startSound);
              return settings.officialCountdownSeconds;
            } else {
              // Official countdown finished
              setIsRunning(false);
              playAlert(settings.endSound);
              return 0;
            }
          }
          
          // Play countdown sound every second during pre-countdown
          if (isPreCountdown && prev > 1) {
            playTickSound();
          }
          
          // Play alert at 10 seconds remaining in official countdown
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
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    
    switch (soundType) {
      case 'beep':
        playBeepAlert(ctx);
        break;
      case 'airhorn':
        playAirhornAlert(ctx);
        break;
      case 'whistle':
        playWhistleAlert(ctx);
        break;
      case 'buzzer':
        playBuzzerAlert(ctx);
        break;
      case 'bell':
        playBellAlert(ctx);
        break;
    }
  };

  const playBeepAlert = (ctx: AudioContext) => {
    const times = [0, 0.15, 0.3];
    times.forEach((time) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = 1200;
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0.5, ctx.currentTime + time);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time + 0.1);
      
      oscillator.start(ctx.currentTime + time);
      oscillator.stop(ctx.currentTime + time + 0.1);
    });
  };

  const playAirhornAlert = (ctx: AudioContext) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(200, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 1);
    oscillator.type = 'sawtooth';
    
    gainNode.gain.setValueAtTime(0.6, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 1);
  };

  const playWhistleAlert = (ctx: AudioContext) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(2000, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.3);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  };

  const playBuzzerAlert = (ctx: AudioContext) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(1000, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.5);
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  };

  const playBellAlert = (ctx: AudioContext) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(500, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.5);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
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

  const toggleFullscreen = () => {
    // Check if fullscreen API is available and allowed
    const isFullscreenAvailable = 
      document.fullscreenEnabled !== false && 
      containerRef.current?.requestFullscreen;

    if (isFullscreenAvailable) {
      try {
        if (!document.fullscreenElement) {
          containerRef.current?.requestFullscreen().catch(() => {
            // Fallback: just maximize the timer size
            setIsFullscreen(true);
          });
        } else {
          document.exitFullscreen().catch(() => {
            setIsFullscreen(false);
          });
        }
      } catch (error) {
        // Toggle simulated fullscreen mode
        setIsFullscreen(!isFullscreen);
      }
    } else {
      // Fullscreen not available, use simulated fullscreen
      setIsFullscreen(!isFullscreen);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const getSizeClasses = () => {
    if (isFullscreen) {
      return {
        container: 'w-screen h-screen',
        time: 'text-[20rem]',
        label: 'text-6xl',
        buttons: 'w-24 h-24',
        icon: 'w-12 h-12',
      };
    }
    
    switch (timerSize) {
      case 'small':
        return {
          container: 'w-full max-w-2xl',
          time: 'text-8xl',
          label: 'text-2xl',
          buttons: 'w-14 h-14',
          icon: 'w-6 h-6',
        };
      case 'large':
        return {
          container: 'w-full max-w-7xl',
          time: 'text-[12rem]',
          label: 'text-5xl',
          buttons: 'w-20 h-20',
          icon: 'w-10 h-10',
        };
      default: // medium
        return {
          container: 'w-full max-w-4xl',
          time: 'text-[10rem]',
          label: 'text-4xl',
          buttons: 'w-16 h-16',
          icon: 'w-8 h-8',
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div
      ref={containerRef}
      className={`${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
          : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl p-8'
      } ${sizeClasses.container} mx-auto relative`}
    >
      {/* Close Button */}
      {!isFullscreen && onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      )}

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm z-10 rounded-2xl p-8 flex items-center justify-center"
          >
            <div className="bg-slate-800 rounded-xl p-8 max-w-md w-full space-y-6">
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

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Official Countdown (seconds)
                </label>
                <input
                  type="number"
                  min="30"
                  max="600"
                  value={settings.officialCountdownSeconds}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      officialCountdownSeconds: parseInt(e.target.value) || 60,
                    })
                  }
                  className="w-full px-4 py-2 bg-slate-700 text-white border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
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

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Timer Size
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => setTimerSize(size)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        timerSize === size
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  playAlert(settings.startSound);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                <Volume2 className="w-5 h-5" />
                Test Alert Sound
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timer Display */}
      <div className="flex flex-col items-center justify-center h-full">
        {/* Phase Label */}
        <motion.div
          key={isPreCountdown ? 'pre' : 'official'}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${sizeClasses.label} font-bold mb-8 ${
            isPreCountdown ? 'text-amber-400' : 'text-emerald-400'
          }`}
        >
          {isPreCountdown ? 'GET READY' : 'CLIMBING TIME'}
        </motion.div>

        {/* Time Display */}
        <motion.div
          key={timeLeft}
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className={`${sizeClasses.time} font-bold tabular-nums leading-none ${
            timeLeft <= 10 && !isPreCountdown
              ? 'text-red-500 animate-pulse'
              : isPreCountdown
              ? 'text-amber-400'
              : 'text-white'
          }`}
        >
          {formatTime(timeLeft)}
        </motion.div>

        {/* Controls */}
        <div className="flex items-center gap-6 mt-12">
          {!isRunning ? (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleStart}
              className={`${sizeClasses.buttons} flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg transition-colors`}
            >
              <Play className={sizeClasses.icon} />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handlePause}
              className={`${sizeClasses.buttons} flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg transition-colors`}
            >
              <Pause className={sizeClasses.icon} />
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleReset}
            className={`${sizeClasses.buttons} flex items-center justify-center bg-slate-600 hover:bg-slate-700 text-white rounded-full shadow-lg transition-colors`}
          >
            <RotateCcw className={sizeClasses.icon} />
          </motion.button>

          {!isFullscreen && (
            <>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowSettings(true)}
                className={`${sizeClasses.buttons} flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-colors`}
              >
                <Settings className={sizeClasses.icon} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleFullscreen}
                className={`${sizeClasses.buttons} flex items-center justify-center bg-purple-500 hover:bg-purple-600 text-white rounded-full shadow-lg transition-colors`}
              >
                <Maximize2 className={sizeClasses.icon} />
              </motion.button>
            </>
          )}

          {isFullscreen && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleFullscreen}
              className={`${sizeClasses.buttons} flex items-center justify-center bg-purple-500 hover:bg-purple-600 text-white rounded-full shadow-lg transition-colors`}
            >
              <Minimize2 className={sizeClasses.icon} />
            </motion.button>
          )}
        </div>

        {/* Info Text */}
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
  );
}