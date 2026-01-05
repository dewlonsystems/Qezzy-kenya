// src/pages/JobsPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import type { Job } from '../types';
import { getCategorySlug } from '../utils/categorySlug';
import LoadingSpinner from '../components/LoadingSpinner';

// Custom inline SVG icons (exactly as in your mock)
const BriefcaseIcon = ({ className = "", size = 24 }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);

const ClipboardIcon = ({ className = "", size = 24 }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
  </svg>
);

const CheckCircleIcon = ({ className = "", size = 24 }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const ClockIcon = ({ className = "", size = 24 }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const XCircleIcon = ({ className = "", size = 24 }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

const CoinsIcon = ({ className = "", size = 24 }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6"/>
    <path d="M18.09 10.37A6 6 0 1 1 10.34 18"/>
    <path d="M7 6h1v4"/>
    <path d="M16.71 13.88l.7.71-2.82 2.82"/>
  </svg>
);

const QuestionIcon = ({ className = "", size = 24 }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const PlayIcon = ({ className = "", size = 24 }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);

const ArrowRightIcon = ({ className = "", size = 24 }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

const SparklesIcon = ({ className = "", size = 24 }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/><path d="M3 5h4"/><path d="M19 17v4"/><path d="M17 19h4"/>
  </svg>
);

const WaterIcon = ({ className = "", size = 24 }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
  </svg>
);

const HeartPulseIcon = ({ className = "", size = 24 }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>
  </svg>
);

const CarIcon = ({ className = "", size = 24 }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h2"/>
    <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
  </svg>
);

const TreesIcon = ({ className = "", size = 24 }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 10v.2A3 3 0 0 1 8.9 16v0H5v0h0a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/>
    <path d="M7 16v6"/><path d="M13 19v3"/>
    <path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5"/>
  </svg>
);

const EyeIcon = ({ className = "", size = 24 }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const XIcon = ({ className = "", size = 24 }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const SendIcon = ({ className = "", size = 24 }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

// Types
type JobStatus = 'open' | 'submitted' | 'completed' | 'declined';

// Category config (matches your mock)
const categoryConfig = {
  rivers: { icon: WaterIcon, color: 'from-blue-500 to-cyan-400', bgColor: 'bg-blue-500/10', label: 'Rivers & Water' },
  health: { icon: HeartPulseIcon, color: 'from-rose-500 to-pink-400', bgColor: 'bg-rose-500/10', label: 'Health & Wellness' },
  transport: { icon: CarIcon, color: 'from-violet-500 to-purple-400', bgColor: 'bg-violet-500/10', label: 'Transport' },
  environment: { icon: TreesIcon, color: 'from-emerald-500 to-green-400', bgColor: 'bg-emerald-500/10', label: 'Environment' },
  nutrition: { icon: HeartPulseIcon, color: 'from-amber-500 to-orange-400', bgColor: 'bg-amber-500/10', label: 'Nutrition' },
  'mental-health': { icon: HeartPulseIcon, color: 'from-indigo-500 to-purple-400', bgColor: 'bg-indigo-500/10', label: 'Mental Health' },
  tech: { icon: BriefcaseIcon, color: 'from-gray-500 to-blue-400', bgColor: 'bg-gray-500/10', label: 'Technology' },
  finance: { icon: CoinsIcon, color: 'from-green-500 to-teal-400', bgColor: 'bg-green-500/10', label: 'Finance' },
  education: { icon: BriefcaseIcon, color: 'from-yellow-500 to-amber-400', bgColor: 'bg-yellow-500/10', label: 'Education' },
  other: { icon: QuestionIcon, color: 'from-gray-500 to-gray-400', bgColor: 'bg-gray-500/10', label: 'Other' },
};

const statusConfig = {
  open: { icon: PlayIcon, color: 'text-primary', bgColor: 'bg-primary/10', label: 'Open' },
  submitted: { icon: ClockIcon, color: 'text-amber-500', bgColor: 'bg-amber-500/10', label: 'Under Review' },
  completed: { icon: CheckCircleIcon, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', label: 'Completed' },
  declined: { icon: XCircleIcon, color: 'text-red-500', bgColor: 'bg-red-500/10', label: 'Declined' },
};

// Floating particle component
const FloatingParticle = ({ delay, size, left, duration }: { delay: number; size: number; left: string; duration: number }) => (
  <div
    className="absolute rounded-full bg-gradient-to-br from-primary/30 to-amber-300/20 blur-sm"
    style={{
      width: size,
      height: size,
      left,
      bottom: '-20px',
      animation: `float ${duration}s ease-in-out infinite`,
      animationDelay: `${delay}s`,
    }}
  />
);

// Glowing orb component
const GlowingOrb = ({ size, top, left, delay }: { size: number; top: string; left: string; delay: number }) => (
  <div
    className="absolute rounded-full bg-gradient-radial from-primary/20 via-amber-400/10 to-transparent blur-2xl"
    style={{
      width: size,
      height: size,
      top,
      left,
      animation: `pulse-glow 4s ease-in-out infinite`,
      animationDelay: `${delay}s`,
    }}
  />
);

// Tab button component
const TabButton = ({ 
  active, 
  onClick, 
  icon: Icon, 
  label, 
  count 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: typeof BriefcaseIcon; 
  label: string; 
  count: number;
}) => (
  <button
    onClick={onClick}
    className={`
      relative flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300
      ${active 
        ? 'bg-gradient-to-r from-primary to-amber-500 text-primary-foreground shadow-lg shadow-primary/30' 
        : 'bg-card/50 text-muted-foreground hover:bg-card hover:text-foreground border border-border/50'
      }
    `}
  >
    <Icon size={18} className={active ? 'animate-pulse' : ''} />
    <span className="hidden sm:inline">{label}</span>
    <span className={`min-w-[24px] h-6 flex items-center justify-center rounded-full text-xs font-bold ${active ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'}`}>
      {count}
    </span>
    {active && (
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/20 to-transparent opacity-50" />
    )}
  </button>
);

// Job card component
const JobCard = ({ job, onClick }: { job: Job; onClick: () => void }) => {
  const slug = job.category || 'other';
  const category = categoryConfig[slug as keyof typeof categoryConfig] || categoryConfig.other;
  const status = statusConfig[job.status];
  const CategoryIcon = category.icon;
  const StatusIcon = status.icon;

  return (
    <div
      onClick={onClick}
      className="group relative bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-5 cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 hover:border-primary/30 overflow-hidden"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${category.bgColor}`}>
          <CategoryIcon size={14} className={`text-${slug}-500`} />
          <span className="text-xs font-medium text-foreground/80">{category.label}</span>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${status.bgColor}`}>
          <StatusIcon size={12} className={status.color} />
          <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
        {job.title}
      </h3>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <QuestionIcon size={14} />
          <span className="text-sm">{job.question_count} questions</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <ClockIcon size={14} />
          <span className="text-sm">~{job.question_count * 2} min</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-amber-400/20 flex items-center justify-center">
            <CoinsIcon size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Reward</p>
            <p className="text-lg font-bold text-foreground">KES {job.reward_kes}</p>
          </div>
        </div>
        
        {job.status === 'open' && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-amber-500 text-primary-foreground font-medium group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-300">
            <span className="text-sm">Start</span>
            <ArrowRightIcon size={16} className="group-hover:translate-x-1 transition-transform" />
          </div>
        )}
        
        {job.status === 'submitted' && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-600 font-medium">
            <ClockIcon size={16} className="animate-pulse" />
            <span className="text-sm">Pending</span>
          </div>
        )}
        
        {job.status === 'completed' && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 font-medium">
            <CheckCircleIcon size={16} />
            <span className="text-sm">Paid</span>
          </div>
        )}
        
        {job.status === 'declined' && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-500 font-medium">
            <EyeIcon size={16} />
            <span className="text-sm">View</span>
          </div>
        )}
      </div>

      <div className={`absolute -top-10 -right-10 w-24 h-24 rounded-full bg-gradient-to-br ${category.color} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-500`} />
    </div>
  );
};

// Survey modal component
const SurveyModal = ({ 
  job, 
  onClose, 
  onSubmit 
}: { 
  job: Job; 
  onClose: () => void; 
  onSubmit: (answers: Record<string, string>) => void;
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const slug = job.category || 'other';
  const category = categoryConfig[slug as keyof typeof categoryConfig] || categoryConfig.other;
  const CategoryIcon = category.icon;
  const isCompleted = job.status !== 'open';
  const progress = ((currentQuestion + 1) / job.questions!.length) * 100;
  const allAnswered = job.questions!.every(q => answers[q.id]?.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-card rounded-3xl shadow-2xl animate-scale-in">
        <div className={`relative p-6 bg-gradient-to-r ${category.color} overflow-hidden`}>
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-white/20 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
          
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <CategoryIcon size={28} className="text-white" />
              </div>
              <div>
                <p className="text-white/70 text-sm font-medium">{category.label}</p>
                <h2 className="text-xl font-bold text-white">{job.title}</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-all"
            >
              <XIcon size={20} />
            </button>
          </div>

          {!isCompleted && (
            <div className="relative mt-6">
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-white/70 text-sm">
                <span>Question {currentQuestion + 1} of {job.questions!.length}</span>
                <span className="flex items-center gap-1">
                  <CoinsIcon size={14} />
                  KES {job.reward_kes}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {isCompleted ? (
            <div className="space-y-6">
              {job.questions!.map((question, index) => (
                <div key={question.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="flex items-start gap-3 mb-2">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {index + 1}
                    </span>
                    <p className="text-foreground font-medium pt-1">{question.text}</p>
                  </div>
                  <div className="ml-11 p-4 rounded-xl bg-muted/50 border border-border/50">
                    <p className="text-muted-foreground italic">Answer submitted</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="animate-fade-in" key={currentQuestion}>
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-amber-400/20 flex items-center justify-center text-primary font-bold text-xl">
                  {currentQuestion + 1}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Question {currentQuestion + 1}</p>
                  <h3 className="text-xl font-semibold text-foreground">
                    {job.questions![currentQuestion].text}
                  </h3>
                </div>
              </div>

              <textarea
                value={answers[job.questions![currentQuestion].id] || ''}
                onChange={(e) => setAnswers({
                  ...answers,
                  [job.questions![currentQuestion].id]: e.target.value
                })}
                placeholder="Type your answer here..."
                className="w-full h-40 p-4 rounded-2xl bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />

              <div className="flex justify-center gap-2 mt-6">
                {job.questions!.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentQuestion 
                        ? 'bg-primary scale-125' 
                        : answers[job.questions![index].id] 
                          ? 'bg-primary/50' 
                          : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border/50 bg-muted/30">
          {isCompleted ? (
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' :
                job.status === 'declined' ? 'bg-red-500/10 text-red-500' :
                'bg-amber-500/10 text-amber-600'
              }`}>
                {job.status === 'completed' && <CheckCircleIcon size={18} />}
                {job.status === 'declined' && <XCircleIcon size={18} />}
                {job.status === 'submitted' && <ClockIcon size={18} />}
                <span className="font-medium capitalize">{job.status}</span>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl bg-muted text-foreground font-medium hover:bg-muted/80 transition-all"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
                className="px-5 py-3 rounded-xl bg-muted text-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/80 transition-all"
              >
                Previous
              </button>

              {currentQuestion < job.questions!.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestion(currentQuestion + 1)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-amber-500 text-primary-foreground font-medium shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all hover:-translate-y-0.5"
                >
                  Next
                  <ArrowRightIcon size={18} />
                </button>
              ) : (
                <button
                  onClick={() => onSubmit(answers)}
                  disabled={!allAnswered}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-medium shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  <SendIcon size={18} />
                  Submit Survey
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Empty state component
const EmptyState = ({ status }: { status: JobStatus }) => {
  const messages = {
    open: { title: 'No open surveys', description: 'Check back soon! New surveys are generated daily.' },
    submitted: { title: 'No pending reviews', description: 'Your submitted surveys will appear here.' },
    completed: { title: 'No completed surveys yet', description: 'Complete surveys to start earning!' },
    declined: { title: 'No declined surveys', description: 'Great job keeping quality high!' },
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-amber-400/20 flex items-center justify-center mb-6">
        <ClipboardIcon size={40} className="text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{messages[status].title}</h3>
      <p className="text-muted-foreground text-center max-w-sm">{messages[status].description}</p>
    </div>
  );
};

// Stats bar component
const StatsBar = ({ jobs }: { jobs: Job[] }) => {
  const stats = [
    { 
      label: 'Available', 
      value: jobs.filter(j => j.status === 'open').length,
      icon: BriefcaseIcon,
      color: 'text-primary'
    },
    { 
      label: 'Pending', 
      value: jobs.filter(j => j.status === 'submitted').length,
      icon: ClockIcon,
      color: 'text-amber-500'
    },
    { 
      label: 'Completed', 
      value: jobs.filter(j => j.status === 'completed').length,
      icon: CheckCircleIcon,
      color: 'text-emerald-500'
    },
    { 
      label: 'Total Earned', 
      value: `KES ${jobs.filter(j => j.status === 'completed').reduce((sum, j) => sum + j.reward_kes, 0)}`,
      icon: CoinsIcon,
      color: 'text-primary'
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => (
        <div 
          key={stat.label}
          className="relative bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-4 hover:border-primary/30 transition-all duration-300 overflow-hidden group animate-fade-in"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Main Jobs Page Component
const JobsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<JobStatus>('open');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all jobs on mount
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await api.get('/jobs/');
        // Normalize category to slug
        const normalizedJobs = res.data.map((job: any) => ({
          ...job,
          category: getCategorySlug(job.category?.name || ''),
        }));
        setJobs(normalizedJobs);
      } catch (err: any) {
        console.error('Failed to load jobs:', err);
        if (err.response?.status === 403) {
          alert('Your account is not active. Please activate to access jobs.');
          navigate('/activation');
        } else {
          alert('Failed to load jobs. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [navigate]);

  // Fetch job detail when opening modal
  const openJobDetail = async (job: Job) => {
    if (job.status !== 'open') {
      setSelectedJob(job);
      return;
    }
    try {
      const res = await api.get(`/jobs/${job.id}/`);
      const detailedJob: Job = {
        ...job,
        questions: res.data.questions.map((q: any) => ({ id: q.id, text: q.text })),
      };
      setSelectedJob(detailedJob);
    } catch (err) {
      alert('Failed to load survey. Please try again.');
    }
  };

  const filteredJobs = jobs.filter(job => job.status === activeTab);

  const tabs: { status: JobStatus; icon: typeof BriefcaseIcon; label: string }[] = [
    { status: 'open', icon: PlayIcon, label: 'Open' },
    { status: 'submitted', icon: ClockIcon, label: 'Submitted' },
    { status: 'completed', icon: CheckCircleIcon, label: 'Completed' },
    { status: 'declined', icon: XCircleIcon, label: 'Declined' },
  ];

  const handleSubmit = async (answers: Record<string, string>) => {
    if (selectedJob) {
      try {
        await api.post(`/jobs/${selectedJob.id}/`, { answers });
        // Refresh job list to update status
        const res = await api.get('/jobs/');
        const normalizedJobs = res.data.map((job: any) => ({
          ...job,
          category: getCategorySlug(job.category?.name || ''),
        }));
        setJobs(normalizedJobs);
        setSelectedJob(null);
      } catch (err) {
        alert('Failed to submit survey. Please try again.');
      }
    }
  };

  if (loading) {
    return <LoadingSpinner message="Fetching available jobs..." />;
    }
   

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <GlowingOrb size={400} top="-10%" left="-10%" delay={0} />
        <GlowingOrb size={300} top="60%" left="80%" delay={2} />
        <GlowingOrb size={250} top="30%" left="50%" delay={4} />
        {[...Array(8)].map((_, i) => (
          <FloatingParticle
            key={i}
            delay={i * 0.8}
            size={6 + Math.random() * 10}
            left={`${10 + i * 12}%`}
            duration={6 + Math.random() * 4}
          />
        ))}
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-7xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shadow-lg shadow-primary/30">
              <BriefcaseIcon size={24} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Available Jobs</h1>
              <p className="text-muted-foreground">Complete surveys and earn money</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 text-primary">
            <SparklesIcon size={18} className="animate-pulse" />
            <span className="text-sm font-medium">New surveys available daily!</span>
          </div>
        </div>

        <StatsBar jobs={jobs} />

        <div className="flex flex-wrap gap-3 mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          {tabs.map(tab => (
            <TabButton
              key={tab.status}
              active={activeTab === tab.status}
              onClick={() => setActiveTab(tab.status)}
              icon={tab.icon}
              label={tab.label}
              count={jobs.filter(j => j.status === tab.status).length}
            />
          ))}
        </div>

        {filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job, index) => (
              <div
                key={job.id}
                className="animate-fade-in"
                style={{ animationDelay: `${0.3 + index * 0.1}s` }}
              >
                <JobCard job={job} onClick={() => openJobDetail(job)} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState status={activeTab} />
        )}
      </div>

      {selectedJob && (
        <SurveyModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};

export default JobsPage;