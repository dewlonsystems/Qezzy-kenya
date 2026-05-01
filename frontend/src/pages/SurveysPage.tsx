import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

// ====== TYPED SVG ICONS (same as JobsPage, renamed for clarity) ======
const BriefcaseIcon = ({ className = "", size = 24 }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);

const ClipboardIcon = ({ className = "", size = 24 }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 1 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
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
    <path d="M5 3v4"/><path d="M3 5h4"/><path d="M19 17v4"/><path d="M17 19 h4"/>
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

const LockIcon = ({ className = "", size = 24 }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

// ====== TYPES ======
interface SurveyQuestion {
  id: number;
  text: string;
  type: 'multiple_choice' | 'text' | 'rating_1_to_5';
  required: boolean;
  options?: string[]; // For multiple_choice
  order: number;
}

interface SurveyCategory {
  id: number;
  name: string;
  description: string;
  tier_level: number; // 0=Free, 1=Basic, 2=Standard, 3=Premium, 4=Elite
  amount_kes: string;
  status: 'active' | 'draft' | 'archived';
  question_count: number;
  questions?: SurveyQuestion[]; // Fetched on detail view
}

interface UserSurveySubmission {
  id: number;
  category_id: number;
  status: 'active' | 'pending_review' | 'approved' | 'rejected';
  rejection_reason?: string;
  submitted_at?: string;
  reviewed_at?: string;
}

interface SubscriptionStatus {
  has_active_subscription: boolean;
  tier_level: number;
  grace_end_date: string | null;
}

// ====== CATEGORY CONFIG (maps category names to icons/colors) ======
const categoryConfig: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
  'rivers': { icon: WaterIcon, color: 'from-blue-500 to-cyan-400', bgColor: 'bg-blue-500/10', label: 'Rivers & Water' },
  'health': { icon: HeartPulseIcon, color: 'from-rose-500 to-pink-400', bgColor: 'bg-rose-500/10', label: 'Health & Wellness' },
  'transport': { icon: CarIcon, color: 'from-violet-500 to-purple-400', bgColor: 'bg-violet-500/10', label: 'Transport' },
  'environment': { icon: TreesIcon, color: 'from-emerald-500 to-green-400', bgColor: 'bg-emerald-500/10', label: 'Environment' },
  'nutrition': { icon: HeartPulseIcon, color: 'from-amber-500 to-orange-400', bgColor: 'bg-amber-500/10', label: 'Nutrition' },
  'mental-health': { icon: HeartPulseIcon, color: 'from-indigo-500 to-purple-400', bgColor: 'bg-indigo-500/10', label: 'Mental Health' },
  'tech': { icon: BriefcaseIcon, color: 'from-gray-500 to-blue-400', bgColor: 'bg-gray-500/10', label: 'Technology' },
  'finance': { icon: CoinsIcon, color: 'from-green-500 to-teal-400', bgColor: 'bg-green-500/10', label: 'Finance' },
  'education': { icon: BriefcaseIcon, color: 'from-yellow-500 to-amber-400', bgColor: 'bg-yellow-500/10', label: 'Education' },
  'other': { icon: QuestionIcon, color: 'from-gray-500 to-gray-400', bgColor: 'bg-gray-500/10', label: 'Other' },
};

// ====== STATUS CONFIG (new survey workflow) ======
const statusConfig: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
  active: { icon: PlayIcon, color: 'text-primary', bgColor: 'bg-primary/10', label: 'Available' },
  pending_review: { icon: ClockIcon, color: 'text-amber-500', bgColor: 'bg-amber-500/10', label: 'Under Review' },
  approved: { icon: CheckCircleIcon, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', label: 'Approved' },
  rejected: { icon: XCircleIcon, color: 'text-red-500', bgColor: 'bg-red-500/10', label: 'Needs Revision' },
};

// ====== TAB BUTTON COMPONENT ======
const TabButton = ({ 
  active, 
  onClick, 
  icon: Icon, 
  label, 
  count 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: any; 
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

// ====== SURVEY CARD COMPONENT (tier-aware) ======
const SurveyCard = ({ 
  category, 
  submission, 
  userTierLevel, 
  onClick,
  onUpgradeClick 
}: { 
  category: SurveyCategory; 
  submission?: UserSurveySubmission; 
  userTierLevel: number;
  onClick: () => void;
  onUpgradeClick: () => void;
}) => {
  const slug = category.name.toLowerCase().replace(/\s+/g, '-');
  const categoryCfg = categoryConfig[slug] || categoryConfig.other;
  const statusCfg = submission ? statusConfig[submission.status] : statusConfig.active;
  const CategoryIcon = categoryCfg.icon;
  const StatusIcon = statusCfg.icon;

  // Tier access logic
  const isAccessible = userTierLevel >= category.tier_level;
  const isCompleted = submission?.status === 'approved';
  const isPending = submission?.status === 'pending_review';
  const isRejected = submission?.status === 'rejected';
  
  // Only clickable if accessible AND (active or rejected)
  const isClickable = isAccessible && (submission?.status === 'active' || isRejected);

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={`
        group relative bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-5 
        transition-all duration-500 overflow-hidden
        ${!isAccessible 
          ? 'opacity-60 cursor-not-allowed grayscale' 
          : isClickable 
            ? 'cursor-pointer hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 hover:border-primary/30' 
            : 'cursor-default'
        }
      `}
    >
      {/* Locked overlay for inaccessible tiers */}
      {!isAccessible && (
        <div className="absolute inset-0 bg-black/5 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-2xl">
          <button
            onClick={(e) => { e.stopPropagation(); onUpgradeClick(); }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
          >
            <LockIcon size={16} />
            Upgrade to Unlock
          </button>
        </div>
      )}

      {/* Hover effects only for clickable cards */}
      {isAccessible && isClickable && (
        <>
          <div className={`absolute inset-0 bg-gradient-to-br ${categoryCfg.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </div>
        </>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${categoryCfg.bgColor}`}>
          <CategoryIcon size={14} className={`text-${slug}-500`} />
          <span className="text-xs font-medium text-foreground/80">{categoryCfg.label}</span>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusCfg.bgColor}`}>
          <StatusIcon size={12} className={statusCfg.color} />
          <span className={`text-xs font-medium ${statusCfg.color}`}>
            {isCompleted ? 'Paid' : isPending ? 'Reviewing' : isRejected ? 'Revise' : statusCfg.label}
          </span>
        </div>
      </div>

      <h3 className={`text-lg font-semibold text-foreground mb-3 line-clamp-2 ${
        isAccessible && isClickable ? 'group-hover:text-primary transition-colors' : ''
      }`}>
        {category.name}
      </h3>

      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{category.description}</p>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <QuestionIcon size={14} />
          <span className="text-sm">{category.question_count} questions</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <ClockIcon size={14} />
          <span className="text-sm">~{category.question_count * 2} min</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-amber-400/20 flex items-center justify-center">
            <CoinsIcon size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Reward</p>
            <p className="text-lg font-bold text-foreground">KES {category.amount_kes}</p>
          </div>
        </div>
        
        {isAccessible && submission?.status === 'active' && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-amber-500 text-primary-foreground font-medium group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-300">
            <span className="text-sm">Start</span>
            <ArrowRightIcon size={16} className="group-hover:translate-x-1 transition-transform" />
          </div>
        )}
        
        {isAccessible && submission?.status === 'pending_review' && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-600 font-medium">
            <ClockIcon size={16} className="animate-pulse" />
            <span className="text-sm">Reviewing</span>
          </div>
        )}
        
        {isAccessible && submission?.status === 'approved' && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 font-medium">
            <CheckCircleIcon size={16} />
            <span className="text-sm">Paid</span>
          </div>
        )}
        
        {isAccessible && submission?.status === 'rejected' && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-500 font-medium">
            <EyeIcon size={16} />
            <span className="text-sm">Revise</span>
          </div>
        )}
        
        {!isAccessible && (
          <button
            onClick={(e) => { e.stopPropagation(); onUpgradeClick(); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-500/10 text-gray-600 font-medium hover:bg-gray-500/20 transition-colors"
          >
            <LockIcon size={16} />
            <span className="text-sm">Tier {category.tier_level}+</span>
          </button>
        )}
      </div>

      {isAccessible && isClickable && (
        <div className={`absolute -top-10 -right-10 w-24 h-24 rounded-full bg-gradient-to-br ${categoryCfg.color} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-500`} />
      )}
    </div>
  );
};

// ====== SURVEY MODAL (supports new question types) ======
const SurveyModal = ({ 
  category, 
  submission,
  onClose, 
  onSubmit,
  onResubmit
}: { 
  category: SurveyCategory; 
  submission?: UserSurveySubmission;
  onClose: () => void; 
  onSubmit: (answers: Record<string, any>) => void;
  onResubmit: () => void;
}) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const slug = category.name.toLowerCase().replace(/\s+/g, '-');
  const categoryCfg = categoryConfig[slug] || categoryConfig.other;
  const CategoryIcon = categoryCfg.icon;
  
  const isRejected = submission?.status === 'rejected';
  const questions = category.questions || [];
  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;
  
  // Validate required fields before submit
  const validateAnswers = () => {
    for (const q of questions) {
      if (q.required) {
        const val = answers[q.id];
        if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
          return `Question "${q.text}" is required`;
        }
        if (q.type === 'rating_1_to_5' && (val < 1 || val > 5)) {
          return `Question "${q.text}" must be rated 1-5`;
        }
        if (q.type === 'multiple_choice' && q.options && !q.options.includes(val)) {
          return `Question "${q.text}" has an invalid selection`;
        }
      }
    }
    return null;
  };

  const handleSubmit = () => {
    const validationError = validateAnswers();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    onSubmit(answers);
  };

  const renderQuestionInput = (question: SurveyQuestion) => {
    const value = answers[question.id];
    
    if (question.type === 'multiple_choice') {
      return (
        <div className="space-y-2">
          {question.options?.map((option, idx) => (
            <label key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50 cursor-pointer hover:bg-muted transition-colors">
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option}
                checked={value === option}
                onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                className="w-4 h-4 text-primary focus:ring-primary"
              />
              <span className="text-foreground">{option}</span>
            </label>
          ))}
        </div>
      );
    }
    
    if (question.type === 'rating_1_to_5') {
      return (
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => setAnswers({ ...answers, [question.id]: rating })}
              className={`w-10 h-10 rounded-xl font-bold transition-all ${
                value === rating
                  ? 'bg-gradient-to-r from-primary to-amber-500 text-white shadow-lg'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {rating}
            </button>
          ))}
        </div>
      );
    }
    
    // Default: text input
    return (
      <textarea
        value={value || ''}
        onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
        placeholder="Type your answer here..."
        className="w-full h-32 p-4 rounded-2xl bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
      />
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-card rounded-3xl shadow-2xl animate-scale-in">
        {/* Header */}
        <div className={`relative p-6 bg-gradient-to-r ${categoryCfg.color} overflow-hidden`}>
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
                <p className="text-white/70 text-sm font-medium">{categoryCfg.label}</p>
                <h2 className="text-xl font-bold text-white">{category.name}</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-all"
            >
              <XIcon size={20} />
            </button>
          </div>

          {/* Rejection reason banner */}
          {isRejected && submission?.rejection_reason && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-400/30 rounded-xl">
              <p className="text-sm text-white/90">
                <strong>Feedback:</strong> {submission.rejection_reason}
              </p>
            </div>
          )}

          {/* Progress bar (only for active submissions) */}
          {!isRejected && questions.length > 0 && (
            <div className="relative mt-6">
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-white/70 text-sm">
                <span>Question {currentQuestion + 1} of {questions.length}</span>
                <span className="flex items-center gap-1">
                  <CoinsIcon size={14} />
                  KES {category.amount_kes}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}
          
          {isRejected ? (
            // Rejected state: show answers + resubmit button
            <div className="space-y-6">
              {questions.map((question, index) => (
                <div key={question.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="flex items-start gap-3 mb-2">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {index + 1}
                    </span>
                    <p className="text-foreground font-medium pt-1">{question.text}</p>
                    {question.required && <span className="text-red-500 text-sm">*</span>}
                  </div>
                  <div className="ml-11 p-4 rounded-xl bg-muted/50 border border-border/50">
                    <p className="text-muted-foreground">
                      {answers[question.id] || <em className="text-red-500">No answer provided</em>}
                    </p>
                  </div>
                </div>
              ))}
              <button
                onClick={onResubmit}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
              >
                <SendIcon size={18} />
                Resubmit with Changes
              </button>
            </div>
          ) : (
            // Active state: question-by-question input
            <div className="animate-fade-in" key={currentQuestion}>
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-amber-400/20 flex items-center justify-center text-primary font-bold text-xl">
                  {currentQuestion + 1}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Question {currentQuestion + 1}</p>
                  <h3 className="text-xl font-semibold text-foreground">
                    {questions[currentQuestion]?.text}
                    {questions[currentQuestion]?.required && <span className="text-red-500 ml-1">*</span>}
                  </h3>
                </div>
              </div>

              {renderQuestionInput(questions[currentQuestion])}

              <div className="flex justify-center gap-2 mt-6">
                {questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentQuestion 
                        ? 'bg-primary scale-125' 
                        : answers[questions[index].id] 
                          ? 'bg-primary/50' 
                          : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border/50 bg-muted/30">
          {!isRejected && questions.length > 0 && (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
                className="px-5 py-3 rounded-xl bg-muted text-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/80 transition-all"
              >
                Previous
              </button>

              {currentQuestion < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestion(currentQuestion + 1)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-amber-500 text-primary-foreground font-medium shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all hover:-translate-y-0.5"
                >
                  Next
                  <ArrowRightIcon size={18} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-medium shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5"
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

// ====== EMPTY STATE COMPONENT ======
const EmptyState = ({ status, hasLocked }: { status: string; hasLocked: boolean }) => {
  const messages: Record<string, { title: string; description: string }> = {
    active: hasLocked
      ? { title: 'No accessible surveys', description: 'Upgrade your subscription to unlock higher-paying surveys.' }
      : { title: 'No surveys available', description: 'Check back soon! New surveys are posted daily.' },
    pending_review: { title: 'No pending reviews', description: 'Your submitted surveys will appear here.' },
    approved: { title: 'No completed surveys yet', description: 'Complete surveys to start earning!' },
    rejected: { title: 'No revisions needed', description: 'Great job keeping quality high!' },
  };

  const msg = messages[status] || messages.active;

  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-amber-400/20 flex items-center justify-center mb-6">
        <ClipboardIcon size={40} className="text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{msg.title}</h3>
      <p className="text-muted-foreground text-center max-w-sm">{msg.description}</p>
      {hasLocked && status === 'active' && (
        <button
          onClick={() => window.location.href = '/subscriptions'}
          className="mt-6 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium rounded-xl hover:shadow-lg transition-all"
        >
          View Subscription Plans
        </button>
      )}
    </div>
  );
};

// ====== STATS BAR COMPONENT ======
const StatsBar = ({ categories, submissions }: { categories: SurveyCategory[]; submissions: UserSurveySubmission[] }) => {
  const stats = [
    { 
      label: 'Available', 
      value: categories.filter(c => c.status === 'active').length,
      icon: BriefcaseIcon,
      color: 'text-primary'
    },
    { 
      label: 'Pending', 
      value: submissions.filter(s => s.status === 'pending_review').length,
      icon: ClockIcon,
      color: 'text-amber-500'
    },
    { 
      label: 'Approved', 
      value: submissions.filter(s => s.status === 'approved').length,
      icon: CheckCircleIcon,
      color: 'text-emerald-500'
    },
    { 
      label: 'Total Earned', 
      value: `KES ${submissions.filter(s => s.status === 'approved').reduce((sum, s) => {
        const cat = categories.find(c => c.id === s.category_id);
        return sum + (cat ? parseFloat(cat.amount_kes) : 0);
      }, 0).toFixed(2)}`,
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

// ====== MAIN SURVEYS PAGE COMPONENT ======
const SurveysPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'not_started' | 'active' | 'pending_review' | 'approved' | 'rejected'>('not_started');
  const [selectedCategory, setSelectedCategory] = useState<SurveyCategory | null>(null);
  const [categories, setCategories] = useState<SurveyCategory[]>([]);
  const [submissions, setSubmissions] = useState<UserSurveySubmission[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated
  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
          <LockIcon size={32} className="text-amber-600" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">Authentication Required</h3>
        <p className="text-muted-foreground text-center mb-6">Please log in to access surveys.</p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-3 bg-gradient-to-r from-primary to-amber-500 text-white font-medium rounded-xl hover:shadow-lg transition-all"
        >
          Log In
        </button>
      </div>
    );
  }

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, submissionsRes, subStatusRes] = await Promise.all([
          api.get('/surveys/categories/'),
          api.get('/surveys/submissions/'), // Endpoint to fetch user's submissions
          api.get('/subscriptions/status/'),
        ]);
        
        setCategories(categoriesRes.data.categories || categoriesRes.data);
        setSubmissions(submissionsRes.data.submissions || submissionsRes.data);
        setSubscriptionStatus(subStatusRes.data);
      } catch (err: any) {
        console.error('Failed to load surveys:', err);
        if (err.response?.status === 403) {
          setError('Access denied. Please check your subscription tier.');
        } else {
          setError('Failed to load surveys. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter categories by tab status
  const filteredCategories = categories.filter(cat => {
    const submission = submissions.find(s => s.category_id === cat.id);
    const status = submission?.status || 'active';
    return status === activeTab;
  });

  // Check if any categories are locked due to tier
  const hasLockedCategories = categories.some(cat => 
    subscriptionStatus && cat.tier_level > subscriptionStatus.tier_level
  );

  // Open survey detail (fetch questions)
  const openSurveyDetail = async (category: SurveyCategory) => {
    try {
      const res = await api.get(`/surveys/categories/${category.id}/`);
      const detailedCategory: SurveyCategory = {
        ...category,
        questions: res.data.questions,
      };
      setSelectedCategory(detailedCategory);
    } catch (err) {
      console.error('Failed to load survey:', err);
      alert('Failed to load survey. Please try again.');
    }
  };

  // Submit survey answers
  const handleSubmit = async (answers: Record<string, any>) => {
    if (!selectedCategory) return;
    try {
      await api.post('/surveys/submit/', {
        category_id: selectedCategory.id,
        answers,
      });
      // Refresh submissions list
      const res = await api.get('/surveys/submissions/');
      setSubmissions(res.data.submissions || res.data);
      setSelectedCategory(null);
    } catch (err) {
      console.error('Failed to submit survey:', err);
      alert('Failed to submit survey. Please try again.');
    }
  };

  // Resubmit after rejection
  const handleResubmit = () => {
    if (selectedCategory) {
      // Reset to active state for editing
      setSelectedCategory({
        ...selectedCategory,
        // Keep questions, allow re-editing
      });
    }
  };

  // Navigate to subscriptions for upgrade
  const handleUpgradeClick = () => {
    navigate('/subscriptions', { 
      state: { from: '/surveys', message: 'Upgrade to unlock higher-paying surveys' } 
    });
  };

  if (loading) {
    return <LoadingSpinner message="Loading surveys..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <XCircleIcon size={32} className="text-red-600" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">Error</h3>
        <p className="text-muted-foreground text-center mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const userTierLevel = subscriptionStatus?.tier_level ?? 0;

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shadow-lg shadow-primary/30">
            <BriefcaseIcon size={24} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Available Surveys</h1>
            <p className="text-muted-foreground">Complete surveys and earn money</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 text-primary">
          <SparklesIcon size={18} className="animate-pulse" />
          <span className="text-sm font-medium">New surveys available daily!</span>
        </div>
      </div>

      <StatsBar categories={categories} submissions={submissions} />

      {/* Tabs */}
      <div className="flex flex-wrap gap-3 mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        {[
          { status: 'active' as const, icon: PlayIcon, label: 'Available' },
          { status: 'pending_review' as const, icon: ClockIcon, label: 'Under Review' },
          { status: 'approved' as const, icon: CheckCircleIcon, label: 'Completed' },
          { status: 'rejected' as const, icon: XCircleIcon, label: 'Needs Revision' },
        ].map(tab => (
          <TabButton
            key={tab.status}
            active={activeTab === tab.status}
            onClick={() => setActiveTab(tab.status)}
            icon={tab.icon}
            label={tab.label}
            count={filteredCategories.filter(c => {
              const sub = submissions.find(s => s.category_id === c.id);
              return (sub?.status || 'active') === tab.status;
            }).length}
          />
        ))}
      </div>

      {/* Survey Grid */}
      {filteredCategories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category, index) => {
            const submission = submissions.find(s => s.category_id === category.id);
            return (
              <div
                key={category.id}
                className="animate-fade-in"
                style={{ animationDelay: `${0.3 + index * 0.1}s` }}
              >
                <SurveyCard 
                  category={category}
                  submission={submission}
                  userTierLevel={userTierLevel}
                  onClick={() => openSurveyDetail(category)}
                  onUpgradeClick={handleUpgradeClick}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState status={activeTab} hasLocked={hasLockedCategories} />
      )}

      {/* Survey Modal */}
      {selectedCategory && (
        <SurveyModal
          category={selectedCategory}
          submission={submissions.find(s => s.category_id === selectedCategory.id)}
          onClose={() => setSelectedCategory(null)}
          onSubmit={handleSubmit}
          onResubmit={handleResubmit}
        />
      )}
    </>
  );
};

export default SurveysPage;