import { useState, useEffect } from 'react';
import { Check, Clock, Zap } from 'lucide-react';

interface ScanStep {
  id: string;
  title: string;
  description: string;
  progress: { min: number; max: number };
}

interface ScanProgressStepsProps {
  progress: number;
  isScanning: boolean;
}

const scanSteps: ScanStep[] = [
  {
    id: 'structure',
    title: 'Analyzing content structure',
    description: 'Examining page architecture and semantic elements...',
    progress: { min: 0, max: 20 }
  },
  {
    id: 'citations',
    title: 'Checking AI platform citations',
    description: 'Searching for existing mentions across AI platforms...',
    progress: { min: 20, max: 40 }
  },
  {
    id: 'authority',
    title: 'Evaluating brand authority',
    description: 'Assessing domain credibility and trust signals...',
    progress: { min: 40, max: 60 }
  },
  {
    id: 'visibility',
    title: 'Calculating visibility score',
    description: 'Computing AI discoverability metrics...',
    progress: { min: 60, max: 80 }
  },
  {
    id: 'recommendations',
    title: 'Generating recommendations',
    description: 'Creating personalized optimization suggestions...',
    progress: { min: 80, max: 100 }
  }
];

export const ScanProgressSteps = ({ progress, isScanning }: ScanProgressStepsProps) => {
  const [typingText, setTypingText] = useState('');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Determine current step based on progress
  useEffect(() => {
    const activeStep = scanSteps.findIndex(step => 
      progress >= step.progress.min && progress < step.progress.max
    );
    if (activeStep !== -1) {
      setCurrentStepIndex(activeStep);
    } else if (progress >= 100) {
      setCurrentStepIndex(scanSteps.length - 1);
    }
  }, [progress]);

  // Update completed steps
  useEffect(() => {
    const newCompletedSteps = new Set<string>();
    scanSteps.forEach((step, index) => {
      if (progress > step.progress.max || (progress >= 100 && index <= currentStepIndex)) {
        newCompletedSteps.add(step.id);
      }
    });
    setCompletedSteps(newCompletedSteps);
  }, [progress, currentStepIndex]);

  // Typing animation for current step
  useEffect(() => {
    if (!isScanning || currentStepIndex >= scanSteps.length) return;

    const currentStep = scanSteps[currentStepIndex];
    const text = currentStep.description;
    let index = 0;
    setTypingText('');

    const typeInterval = setInterval(() => {
      if (index < text.length) {
        setTypingText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(typeInterval);
      }
    }, 30);

    return () => clearInterval(typeInterval);
  }, [currentStepIndex, isScanning]);

  const getStepStatus = (stepIndex: number) => {
    const step = scanSteps[stepIndex];
    if (completedSteps.has(step.id)) return 'completed';
    if (stepIndex === currentStepIndex && isScanning) return 'active';
    return 'pending';
  };

  const LoadingDots = () => (
    <div className="flex space-x-1 ml-2">
      {[0, 1, 2].map((dot) => (
        <div
          key={dot}
          className="w-1 h-1 bg-primary rounded-full animate-pulse"
          style={{
            animationDelay: `${dot * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="relative">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
        </div>
        <div className="text-right text-sm text-muted-foreground mt-1">
          {Math.round(progress)}%
        </div>
      </div>

      {/* Step Indicators */}
      <div className="space-y-4">
        {scanSteps.map((step, index) => {
          const status = getStepStatus(index);
          return (
            <div 
              key={step.id} 
              className={`flex items-start space-x-3 transition-all duration-300 ${
                status === 'active' ? 'scale-105' : ''
              }`}
            >
              {/* Step Icon */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                status === 'completed' 
                  ? 'bg-green-500 text-white' 
                  : status === 'active'
                  ? 'bg-primary text-white animate-pulse'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {status === 'completed' ? (
                  <Check className="w-4 h-4" />
                ) : status === 'active' ? (
                  <Zap className="w-4 h-4" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <h4 className={`font-medium transition-colors duration-300 ${
                  status === 'active' ? 'text-primary' : 
                  status === 'completed' ? 'text-green-600' : 'text-muted-foreground'
                }`}>
                  {step.title}
                  {status === 'active' && <LoadingDots />}
                  {status === 'completed' && (
                    <span className="ml-2 text-green-500">✓</span>
                  )}
                </h4>
                
                {status === 'active' && isScanning && (
                  <p className="text-sm text-muted-foreground mt-1 font-mono">
                    {typingText}
                    <span className="animate-pulse">|</span>
                  </p>
                )}
                
                {status === 'completed' && (
                  <p className="text-sm text-green-600 mt-1">
                    Completed successfully
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Current Action Display */}
      {isScanning && currentStepIndex < scanSteps.length && (
        <div className="mt-6 p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm font-medium text-primary">
              AI Analysis in Progress
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Our AI is carefully examining your content to provide the most accurate visibility assessment...
          </p>
        </div>
      )}
    </div>
  );
};