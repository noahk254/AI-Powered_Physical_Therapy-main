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
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setError(null);
    } catch (err) {
      setError('Camera access denied. Please enable camera permissions.');
      console.error('Camera error:', err);
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
              className="flex items-center space-x-2 text-gray-300 hover:text-white"
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
                <div className="absolute inset-0 flex items-center justify-center bg-red-900/50">
                  <div className="text-center p-6">
                    <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <p className="text-red-300">{error}</p>
                  </div>
                </div>
              )}
              
              {!isActive ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                      <Play className="h-10 w-10 text-gray-400" />
                    </div>
                    <p className="text-gray-400 mb-4">Click Start to begin AI-powered analysis</p>
                    <button 
                      onClick={handleStart}
                      disabled={isLoading || !user}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <div className="absolute top-4 left-4 bg-green-500 px-4 py-2 rounded-full font-medium flex items-center space-x-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span>AI Tracking Active</span>
                    </div>
                  )}

                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm px-6 py-3 rounded-xl">
                    <div className="text-4xl font-bold">{count}/{config?.reps || 15}</div>
                    <div className="text-gray-300 text-sm">Reps</div>
                  </div>

                  <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-6 py-3 rounded-xl">
                    <div className="text-2xl font-bold text-green-400">{score}%</div>
                    <div className="text-gray-300 text-sm">Form Score</div>
                  </div>

                  <div className={`absolute bottom-4 right-4 px-6 py-3 rounded-xl backdrop-blur-sm ${
                    score >= 80 ? 'bg-green-500/80' : score >= 60 ? 'bg-yellow-500/80' : score > 0 ? 'bg-red-500/80' : 'bg-gray-500/80'
                  }`}>
                    <div className="flex items-center space-x-2">
                      {score >= 80 ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : score > 0 ? (
                        <AlertCircle className="h-5 w-5" />
                      ) : null}
                      <span className="font-medium">{feedback}</span>
                    </div>
                  </div>

                  {currentResult?.corrections && currentResult.corrections.length > 0 && score < 80 && (
                    <div className="absolute top-16 left-4 right-4 bg-black/70 backdrop-blur-sm px-4 py-3 rounded-xl">
                      <div className="text-sm text-yellow-300 font-medium mb-2">Corrections:</div>
                      <ul className="text-sm text-yellow-200 space-y-1">
                        {currentResult.corrections.map((correction, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <span className="text-yellow-400">•</span>
                            <span>{correction}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {repComplete && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-white/20 backdrop-blur-sm px-8 py-4 rounded-xl animate-pulse">
                        <span className="text-4xl font-bold">+1</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {isActive && (
              <div className="flex items-center justify-center space-x-4">
                <button 
                  onClick={handleRestart}
                  className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg transition-colors"
                >
                  <RotateCcw className="h-5 w-5" />
                  <span>Restart</span>
                </button>
                
                {isPaused ? (
                  <button 
                    onClick={handleResume}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-8 py-3 rounded-lg transition-colors"
                  >
                    <Play className="h-5 w-5" />
                    <span>Resume</span>
                  </button>
                ) : (
                  <button 
                    onClick={handlePause}
                    className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 px-8 py-3 rounded-lg transition-colors"
                  >
                    <Pause className="h-5 w-5" />
                    <span>Pause</span>
                  </button>
                )}
                
                <button 
                  onClick={handleEnd}
                  className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg transition-colors"
                >
                  End Session
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-gray-800 rounded-xl p-6">
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

            <div className="bg-gray-800 rounded-xl p-6">
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

            <div className="bg-gray-800 rounded-xl p-6">
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
