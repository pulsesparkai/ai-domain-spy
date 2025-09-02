import { useState, useEffect } from 'react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';
import { useAuth } from '@/contexts/AuthContext';

interface OnboardingTourProps {
  startTour?: boolean;
  onComplete?: () => void;
}

export const OnboardingTour = ({ startTour = false, onComplete }: OnboardingTourProps) => {
  const { user } = useAuth();
  const [runTour, setRunTour] = useState(false);

  const steps: Step[] = [
    {
      target: '.scan-interface',
      content: (
        <div>
          <h3 className="text-lg font-semibold mb-2">Welcome to PulseSpark.ai!</h3>
          <p>Let's take a quick tour to get you started with AI visibility scanning.</p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.domain-input',
      content: (
        <div>
          <h4 className="font-semibold mb-1">Enter Your Domain and Queries</h4>
          <p>Enter your domain and queries here. Add search terms related to your brand or business to monitor your AI visibility.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.start-scan-button',
      content: (
        <div>
          <h4 className="font-semibold mb-1">Click to Start Scan</h4>
          <p>Click here to start analyzing your AI visibility across platforms like Perplexity, ChatGPT, and more.</p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '.scan-results',
      content: (
        <div>
          <h4 className="font-semibold mb-1">View Your Metrics</h4>
          <p>Here you'll see your AI visibility score, citations, mentions, and detailed analytics from all platforms.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.settings-link',
      content: (
        <div>
          <h4 className="font-semibold mb-1">Configure API Keys</h4>
          <p>Add your API keys here to unlock the full power of AI scanning. You can also manage your subscription and export data.</p>
        </div>
      ),
      placement: 'bottom',
    },
  ];

  useEffect(() => {
    if (startTour && user) {
      // Check if user has completed onboarding before
      const hasCompletedOnboarding = localStorage.getItem(`onboarding_completed_${user.id}`);
      if (!hasCompletedOnboarding) {
        setRunTour(true);
      }
    }
  }, [startTour, user]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    
    if (status === 'finished' || status === 'skipped') {
      setRunTour(false);
      
      // Mark onboarding as completed
      if (user) {
        localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
      }
      
      onComplete?.();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={runTour}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#6B5BFF',
          backgroundColor: '#FFFFFF',
          textColor: '#1A1A1A',
          zIndex: 1000,
        },
        tooltip: {
          fontSize: 14,
          borderRadius: 8,
        },
        tooltipContent: {
          padding: '20px',
        },
        buttonNext: {
          backgroundColor: '#6B5BFF',
          color: '#FFFFFF',
          borderRadius: 6,
          padding: '8px 16px',
        },
        buttonBack: {
          color: '#6B5BFF',
          marginRight: 10,
        },
        buttonSkip: {
          color: '#6B5BFF',
        },
      }}
    />
  );
};