import type { FC } from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: FC<LoadingSpinnerProps> = ({ 
  message = "Loading..." 
}) => {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
      {/* Background ambient glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-accent/10 rounded-full blur-2xl animate-pulse-glow" />
      </div>

      {/* Main spinner container */}
      <div className="relative w-40 h-40 mb-8">
        {/* Outer morphing ring */}
        <div className="absolute inset-0 animate-morph animate-spin-slow">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="outerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(38, 92%, 50%)" stopOpacity="0.8" />
                <stop offset="50%" stopColor="hsl(25, 100%, 55%)" stopOpacity="0.6" />
                <stop offset="100%" stopColor="hsl(38, 92%, 50%)" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#outerGradient)"
              strokeWidth="2"
              strokeDasharray="70 30"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Middle rotating ring */}
        <div className="absolute inset-4 animate-spin-reverse">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="middleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(38, 92%, 50%)" stopOpacity="0.6" />
                <stop offset="100%" stopColor="hsl(30, 90%, 40%)" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="url(#middleGradient)"
              strokeWidth="3"
              strokeDasharray="40 60"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Inner pulsing ring */}
        <div className="absolute inset-8">
          <svg viewBox="0 0 100 100" className="w-full h-full animate-pulse-glow">
            <defs>
              <linearGradient id="innerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(38, 100%, 60%)" />
                <stop offset="100%" stopColor="hsl(25, 100%, 55%)" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="35"
              fill="none"
              stroke="url(#innerGradient)"
              strokeWidth="2"
              strokeDasharray="20 80"
              strokeLinecap="round"
              className="animate-spin-slow"
            />
          </svg>
        </div>

        {/* Orbiting particles */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute animate-orbit">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-primary to-accent shadow-glow" />
          </div>
          <div className="absolute animate-orbit-reverse">
            <div className="w-2 h-2 rounded-full bg-gradient-to-br from-accent to-primary-deep shadow-glow" />
          </div>
          <div className="absolute animate-orbit-large">
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-primary-glow to-primary shadow-glow" />
          </div>
          <div className="absolute animate-orbit" style={{ animationDuration: '3.5s' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-primary opacity-80" />
          </div>
        </div>

        {/* Center core */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute w-16 h-16 rounded-full border-2 border-primary/30 animate-ripple" />
          <div className="absolute w-16 h-16 rounded-full border-2 border-primary/20 animate-ripple" />
          
          <div className="relative">
            <div className="absolute inset-0 w-14 h-14 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 rounded-full bg-primary/40 blur-xl animate-pulse-glow" />
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary via-accent to-primary-deep flex items-center justify-center shadow-glow-intense animate-float">
              <svg viewBox="0 0 32 32" className="w-7 h-7 text-primary-foreground">
                <text
                  x="50%"
                  y="55%"
                  dominantBaseline="middle"
                  textAnchor="middle"
                  fontSize="22"
                  fontWeight="800"
                  fill="currentColor"
                  fontFamily="Inter, sans-serif"
                >
                  Q
                </text>
              </svg>
            </div>
          </div>
        </div>

        {/* Sparkles */}
        <div className="absolute -top-2 left-1/2 w-1 h-1 rounded-full bg-primary animate-pulse-glow" />
        <div className="absolute -bottom-1 left-1/4 w-1.5 h-1.5 rounded-full bg-accent animate-pulse-glow" />
        <div className="absolute top-1/4 -right-1 w-1 h-1 rounded-full bg-primary-glow animate-pulse-glow" />
      </div>

      {/* Message and brand */}
      <div className="relative z-10 text-center">
        <p className="text-lg font-medium text-foreground mb-3 animate-fade-in-up">
          {message}
        </p>
        <p className="text-sm text-muted-foreground animate-fade-in-up">
          Qezzy Kenya
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;