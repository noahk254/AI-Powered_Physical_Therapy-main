import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pause, Play, RotateCcw, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, exerciseConfigs, backendExerciseMap, SessionResult } from '../services/api';

const ExerciseSession = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const analysisIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [count, setCount] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('Start session to begin AI analysis');
  const [repComplete, setRepComplete] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentResult, setCurrentResult] = useState<SessionResult | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [exerciseType, setExerciseType] = useState('shoulder_raises');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const config = exerciseConfigs[id || '1'];
  const backendType = backendExerciseMap[id || '1'];

  useEffect(() => {
    if (backendType) {
      setExerciseType(backendType);
    }
  }, [backendType]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const startCamera = async () => {
    try {
      // Check if we're on a mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: isMobile ? 640 : 640 },
          height: { ideal: isMobile ? 480 : 480 },
          frameRate: { ideal: 30, max: 30 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Ensure video plays on mobile
        videoRef.current.play();
      }
      setError(null);
    } catch (err) {
      console.error('Camera error:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Camera access denied. Please enable camera permissions and refresh the page.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found. Please connect a camera and try again.');
        } else if (err.name === 'NotReadableError') {
          setError('Camera is already in use by another application.');
        } else {
          setError(`Camera error: ${err.message}`);
        }
      } else {
        setError('Camera access failed. Please check your browser settings.');
      }
    }
  };

  const connectWebSocket = useCallback(() => {
    if (!user?.id) return;

    const ws = api.createWebSocket(user.id);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const result = JSON.parse(event.data);
        if (result.error) {
          console.error('WebSocket error:', result.error);
          return;
        }
        handleAnalysisResult(result);
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    };
  }, [user?.id]);

  const captureAndAnalyzeFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !user?.id || isPaused) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== 4) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const frameData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    const timestamp = Date.now() / 1000;

    try {
      const result = await api.analyzeFrame(frameData, timestamp, user.id, exerciseType);
      handleAnalysisResult(result);
    } catch (err) {
      console.error('Frame analysis error:', err);
    }
  }, [user?.id, exerciseType, isPaused]);

  const handleAnalysisResult = (result: SessionResult) => {
    setCurrentResult(result);
    setScore(Math.round(result.score));
    setFeedback(result.feedback_message);

    if (result.is_correct && result.score > 70) {
      setCount(prev => {
        const newCount = prev + 1;
        if (newCount > prev) {
          setRepComplete(true);
          setTimeout(() => setRepComplete(false), 500);
        }
        return newCount;
      });
    }
  };

  const handleStart = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await startCamera();

      if (user?.id) {
        const session = await api.startSession(user.id, exerciseType);
        setSessionId(session.session_id);
      }

      connectWebSocket();

      analysisIntervalRef.current = setInterval(() => {
        if (isActive && !isPaused) {
          captureAndAnalyzeFrame();
        }
      }, 500);

      setIsActive(true);
      setIsPaused(false);
      setCount(0);
      setScore(0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start session';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = () => {
    setIsPaused(true);
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
    }
  };

  const handleResume = () => {
    setIsPaused(false);
    analysisIntervalRef.current = setInterval(() => {
      if (isActive && !isPaused) {
        captureAndAnalyzeFrame();
      }
    }, 500);
  };

  const handleRestart = async () => {
    cleanup();
    setCount(0);
    setScore(0);
    setCurrentResult(null);
    setSessionId(null);
    await handleStart();
  };

  const handleEnd = async () => {
    if (sessionId) {
      try {
        await api.endSession(sessionId);
      } catch (err) {
        console.error('Failed to end session:', err);
      }
    }
    cleanup();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <canvas ref={canvasRef} className="hidden" />
      
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-gray-300 hover:text-white touch-manipulation"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>
            <div className="h-6 w-px bg-gray-600" />
            <h1 className="text-xl font-semibold">{config?.name || 'Exercise'}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              {isConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              <span className="text-sm">{isConnected ? 'Connected' : 'Offline'}</span>
            </div>
            <span className="text-gray-400">Set 1/3</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden">
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-900/50 p-4">
                  <div className="text-center max-w-sm">
                    <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <p className="text-red-300 text-sm leading-relaxed">{error}</p>
                    {error.includes('camera') && (
                      <div className="mt-4 text-left text-xs text-gray-300 space-y-2">
                        <p><strong>Troubleshooting:</strong></p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Ensure camera permissions are granted</li>
                          <li>Try refreshing the page</li>
                          <li>Check if another app is using the camera</li>
                          <li>On mobile: ensure you're using HTTPS</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {!isActive ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                  <div className="text-center max-w-sm">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-700 rounded-full flex items-center justify-center mb-4 mx-auto">
                      <Play className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                    </div>
                    <p className="text-gray-400 mb-4 text-sm sm:text-base">Click Start to begin AI-powered analysis</p>
                    <button 
                      onClick={handleStart}
                      disabled={isLoading || !user}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 sm:px-8 sm:py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px]"
                    >
                      {isLoading ? 'Starting...' : user ? 'Start Session' : 'Please login first'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <video 
                    ref={videoRef}
                    autoPlay 
                    playsInline 
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                  
                  {isConnected && (
                    <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-green-500 px-2 py-1 sm:px-4 sm:py-2 rounded-full font-medium flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse" />
                      <span>AI Tracking Active</span>
                    </div>
                  )}

                  <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-black/50 backdrop-blur-sm px-3 py-1.5 sm:px-6 sm:py-3 rounded-xl">
                    <div className="text-2xl sm:text-4xl font-bold">{count}/{config?.reps || 15}</div>
                    <div className="text-gray-300 text-xs sm:text-sm">Reps</div>
                  </div>

                  <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 bg-black/50 backdrop-blur-sm px-3 py-1.5 sm:px-6 sm:py-3 rounded-xl">
                    <div className="text-lg sm:text-2xl font-bold text-green-400">{score}%</div>
                    <div className="text-gray-300 text-xs sm:text-sm">Form Score</div>
                  </div>

                  <div className={`absolute bottom-2 right-2 sm:bottom-4 sm:right-4 px-3 py-1.5 sm:px-6 sm:py-3 rounded-xl backdrop-blur-sm text-xs sm:text-sm ${
                    score >= 80 ? 'bg-green-500/80' : score >= 60 ? 'bg-yellow-500/80' : score > 0 ? 'bg-red-500/80' : 'bg-gray-500/80'
                  }`}>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      {score >= 80 ? (
                        <CheckCircle className="h-3 w-3 sm:h-5 sm:w-5" />
                      ) : score > 0 ? (
                        <AlertCircle className="h-3 w-3 sm:h-5 sm:w-5" />
                      ) : null}
                      <span className="font-medium">{feedback}</span>
                    </div>
                  </div>

                  {currentResult?.corrections && currentResult.corrections.length > 0 && score < 80 && (
                    <div className="absolute top-12 left-2 right-2 sm:top-16 sm:left-4 sm:right-4 bg-black/70 backdrop-blur-sm px-3 py-2 sm:px-4 sm:py-3 rounded-xl">
                      <div className="text-xs sm:text-sm text-yellow-300 font-medium mb-1 sm:mb-2">Corrections:</div>
                      <ul className="text-xs sm:text-sm text-yellow-200 space-y-0.5 sm:space-y-1">
                        {currentResult.corrections.map((correction, idx) => (
                          <li key={idx} className="flex items-start space-x-1 sm:space-x-2">
                            <span className="text-yellow-400">•</span>
                            <span>{correction}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {repComplete && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-white/20 backdrop-blur-sm px-6 py-3 sm:px-8 sm:py-4 rounded-xl animate-pulse">
                        <span className="text-3xl sm:text-4xl font-bold">+1</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {isActive && (
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                <button 
                  onClick={handleRestart}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg transition-colors touch-manipulation min-h-[44px]"
                >
                  <RotateCcw className="h-5 w-5" />
                  <span>Restart</span>
                </button>
                
                {isPaused ? (
                  <button 
                    onClick={handleResume}
                    className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 px-6 py-3 sm:px-8 rounded-lg transition-colors touch-manipulation min-h-[44px]"
                  >
                    <Play className="h-5 w-5" />
                    <span>Resume</span>
                  </button>
                ) : (
                  <button 
                    onClick={handlePause}
                    className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-yellow-600 hover:bg-yellow-700 px-6 py-3 sm:px-8 rounded-lg transition-colors touch-manipulation min-h-[44px]"
                  >
                    <Pause className="h-5 w-5" />
                    <span>Pause</span>
                  </button>
                )}
                
                <button 
                  onClick={handleEnd}
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg transition-colors touch-manipulation min-h-[44px]"
                >
                  End Session
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-gray-800 rounded-xl p-4 sm:p-6">
              <h2 className="text-lg font-semibold mb-4">Exercise Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Exercise</span>
                  <span className="font-medium">{config?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sets</span>
                  <span className="font-medium">{config?.sets || 3}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Reps</span>
                  <span className="font-medium">{config?.reps || 15}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Target</span>
                  <span className="font-medium text-green-400">90° angle</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-4 sm:p-6">
              <h2 className="text-lg font-semibold mb-4">AI Analysis</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Pose Detected</span>
                  <span className={`font-medium ${currentResult?.pose_landmarks ? 'text-green-400' : 'text-gray-500'}`}>
                    {currentResult?.pose_landmarks ? 'Yes' : 'Waiting...'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Form Status</span>
                  <span className={`font-medium ${currentResult?.is_correct ? 'text-green-400' : 'text-yellow-400'}`}>
                    {currentResult?.is_correct ? 'Correct' : currentResult ? 'Needs Work' : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Confidence</span>
                  <span className="font-medium">{currentResult?.pose_landmarks ? '95%' : '0%'}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-4 sm:p-6">
              <h2 className="text-lg font-semibold mb-4">Tips</h2>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-400">•</span>
                  <span>Keep your back straight</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-400">•</span>
                  <span>Move slowly and controlled</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-400">•</span>
                  <span>Don't swing your arms</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-400">•</span>
                  <span>Breathe steadily</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExerciseSession;
