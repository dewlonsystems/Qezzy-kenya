import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

// ====== ICONS ======
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
const LockIcon = ({ className = "", size = 24 }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const LoaderIcon = ({ className = "", size = 24 }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
    <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
  </svg>
);

// ====== TYPES ======

/**
 * Shape of each item from GET /surveys/categories/
 *
 * The backend (SurveyCategoryListView) filters out approved + pending_review
 * categories entirely. So `status` here is ONLY ever 'not_started' or 'rejected' —
 * it is the computed submission status, not the admin publish status.
 */
interface CategoryListItem {
  id: number;
  name: string;
  description: string;
  tier_level: number;
  amount_kes: string;
  question_count: number;
  status: 'not_started' | 'rejected';
  rejection_reason: string | null;
}

/**
 * Shape of each item from GET /surveys/submissions/
 * Covers ALL statuses including pending_review and approved
 * (which never appear in the categories list).
 */
interface SubmissionItem {
  id: number;
  category_id: number;
  category_name: string;
  status: 'active' | 'pending_review' | 'approved' | 'rejected';
  rejection_reason: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  amount_kes: string;
  tier_level: number;
}

/**
 * Shape from GET /subscriptions/status/
 * tier_level is REQUIRED — the page shows a hard error if it is absent.
 */
interface SubscriptionStatus {
  has_active_subscription: boolean;
  tier_level: number;
  grace_end_date: string | null;
}

/** Questions returned by GET /surveys/categories/<id>/ */
interface SurveyQuestion {
  id: number;
  text: string;
  type: 'multiple_choice' | 'text' | 'rating_1_to_5';
  required: boolean;
  options?: string[];
  order: number;
}

/** Detail response from GET /surveys/categories/<id>/ */
interface CategoryDetail {
  category: {
    id: number;
    name: string;
    description: string;
    amount_kes: string;
    submission_id: number;
    current_status: string;
  };
  questions: SurveyQuestion[];
}

/** What the modal receives — list data merged with fetched questions */
interface ModalCategory {
  id: number;
  name: string;
  description: string;
  amount_kes: string;
  tier_level: number;
  status: 'not_started' | 'rejected';
  rejection_reason: string | null;
  questions: SurveyQuestion[];
}

type TabStatus = 'available' | 'pending_review' | 'approved' | 'rejected';

// ====== CATEGORY DISPLAY CONFIG ======
const categoryConfig: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
  'rivers':        { icon: WaterIcon,      color: 'from-blue-500 to-cyan-400',     bgColor: 'bg-blue-500/10',    label: 'Rivers & Water' },
  'health':        { icon: HeartPulseIcon, color: 'from-rose-500 to-pink-400',     bgColor: 'bg-rose-500/10',    label: 'Health & Wellness' },
  'transport':     { icon: CarIcon,        color: 'from-violet-500 to-purple-400', bgColor: 'bg-violet-500/10',  label: 'Transport' },
  'environment':   { icon: TreesIcon,      color: 'from-emerald-500 to-green-400', bgColor: 'bg-emerald-500/10', label: 'Environment' },
  'nutrition':     { icon: HeartPulseIcon, color: 'from-amber-500 to-orange-400',  bgColor: 'bg-amber-500/10',   label: 'Nutrition' },
  'mental-health': { icon: HeartPulseIcon, color: 'from-indigo-500 to-purple-400', bgColor: 'bg-indigo-500/10',  label: 'Mental Health' },
  'tech':          { icon: BriefcaseIcon,  color: 'from-gray-500 to-blue-400',     bgColor: 'bg-gray-500/10',    label: 'Technology' },
  'finance':       { icon: CoinsIcon,      color: 'from-green-500 to-teal-400',    bgColor: 'bg-green-500/10',   label: 'Finance' },
  'education':     { icon: BriefcaseIcon,  color: 'from-yellow-500 to-amber-400',  bgColor: 'bg-yellow-500/10',  label: 'Education' },
  'other':         { icon: QuestionIcon,   color: 'from-gray-500 to-gray-400',     bgColor: 'bg-gray-500/10',    label: 'Other' },
};

const getCategoryCfg = (name: string) => {
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  return categoryConfig[slug] ?? categoryConfig['other'];
};

const statusDisplayConfig = {
  available:      { icon: PlayIcon,        color: 'text-primary',     bgColor: 'bg-primary/10',     label: 'Available' },
  pending_review: { icon: ClockIcon,       color: 'text-amber-500',   bgColor: 'bg-amber-500/10',   label: 'Under Review' },
  approved:       { icon: CheckCircleIcon, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', label: 'Completed' },
  rejected:       { icon: XCircleIcon,     color: 'text-red-500',     bgColor: 'bg-red-500/10',     label: 'Needs Revision' },
};

// ====== TAB BUTTON ======
const TabButton = ({
  active, onClick, icon: Icon, label, count,
}: {
  active: boolean; onClick: () => void; icon: any; label: string; count: number;
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
    <span className={`min-w-[24px] h-6 flex items-center justify-center rounded-full text-xs font-bold
      ${active ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'}`}>
      {count}
    </span>
    {active && (
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/20 to-transparent opacity-50 pointer-events-none" />
    )}
  </button>
);

// ====== SURVEY CARD (Available + Rejected tabs) ======
// Renders CategoryListItem data — only shown for 'not_started' and 'rejected' categories
// because the backend never returns 'approved' or 'pending_review' in this endpoint.
const SurveyCard = ({
  item, userTierLevel, onClick, onUpgradeClick, isLoadingDetail,
}: {
  item: CategoryListItem;
  userTierLevel: number;
  onClick: () => void;
  onUpgradeClick: () => void;
  isLoadingDetail: boolean;
}) => {
  const cfg = getCategoryCfg(item.name);
  const CategoryIcon = cfg.icon;
  const displayStatus: TabStatus = item.status === 'not_started' ? 'available' : 'rejected';
  const statusCfg = statusDisplayConfig[displayStatus];
  const StatusIcon = statusCfg.icon;
  const isAccessible = userTierLevel >= item.tier_level;

  return (
    <div
      onClick={isAccessible ? onClick : undefined}
      className={`
        group relative bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-5
        transition-all duration-500 overflow-hidden
        ${!isAccessible
          ? 'opacity-60 cursor-not-allowed grayscale'
          : 'cursor-pointer hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 hover:border-primary/30'
        }
      `}
    >
      {/* Locked overlay */}
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

      {/* Loading overlay while fetching questions */}
      {isLoadingDetail && (
        <div className="absolute inset-0 bg-card/80 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-2xl">
          <LoaderIcon size={24} className="text-primary animate-spin" />
        </div>
      )}

      {isAccessible && (
        <>
          <div className={`absolute inset-0 bg-gradient-to-br ${cfg.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </div>
        </>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${cfg.bgColor}`}>
          <CategoryIcon size={14} />
          <span className="text-xs font-medium text-foreground/80">{cfg.label}</span>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusCfg.bgColor}`}>
          <StatusIcon size={12} className={statusCfg.color} />
          <span className={`text-xs font-medium ${statusCfg.color}`}>{statusCfg.label}</span>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
        {item.name}
      </h3>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{item.description}</p>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <QuestionIcon size={14} />
          <span className="text-sm">{item.question_count} questions</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <ClockIcon size={14} />
          <span className="text-sm">~{item.question_count * 2} min</span>
        </div>
      </div>

      {/* Rejection reason preview */}
      {displayStatus === 'rejected' && item.rejection_reason && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-xs text-red-600 line-clamp-2">
            <span className="font-semibold">Feedback: </span>{item.rejection_reason}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-amber-400/20 flex items-center justify-center">
            <CoinsIcon size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Reward</p>
            <p className="text-lg font-bold text-foreground">KES {item.amount_kes}</p>
          </div>
        </div>

        {isAccessible && displayStatus === 'available' && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-amber-500 text-primary-foreground font-medium group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-300">
            <span className="text-sm">Start</span>
            <ArrowRightIcon size={16} className="group-hover:translate-x-1 transition-transform" />
          </div>
        )}
        {isAccessible && displayStatus === 'rejected' && (
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
            <span className="text-sm">Tier {item.tier_level}+</span>
          </button>
        )}
      </div>

      {isAccessible && (
        <div className={`absolute -top-10 -right-10 w-24 h-24 rounded-full bg-gradient-to-br ${cfg.color} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-500`} />
      )}
    </div>
  );
};

// ====== SUBMISSION CARD (Under Review + Completed tabs) ======
// These use SubmissionItem data because the /categories/ endpoint never returns
// pending_review or approved items — they are completely absent from that list.
const SubmissionCard = ({ submission }: { submission: SubmissionItem }) => {
  const cfg = getCategoryCfg(submission.category_name);
  const CategoryIcon = cfg.icon;
  const statusCfg = statusDisplayConfig[submission.status as TabStatus] ?? statusDisplayConfig.available;
  const StatusIcon = statusCfg.icon;

  return (
    <div className="group relative bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-5 transition-all duration-300 overflow-hidden cursor-default hover:border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${cfg.bgColor}`}>
          <CategoryIcon size={14} />
          <span className="text-xs font-medium text-foreground/80">{cfg.label}</span>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusCfg.bgColor}`}>
          <StatusIcon size={12} className={statusCfg.color} />
          <span className={`text-xs font-medium ${statusCfg.color}`}>{statusCfg.label}</span>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-3 line-clamp-2">
        {submission.category_name}
      </h3>

      <div className="flex flex-col gap-1 mb-4">
        {submission.submitted_at && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <SendIcon size={13} />
            <span className="text-sm">
              Submitted {new Date(submission.submitted_at).toLocaleDateString()}
            </span>
          </div>
        )}
        {submission.reviewed_at && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <CheckCircleIcon size={13} />
            <span className="text-sm">
              Reviewed {new Date(submission.reviewed_at).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-amber-400/20 flex items-center justify-center">
            <CoinsIcon size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Reward</p>
            <p className="text-lg font-bold text-foreground">KES {submission.amount_kes}</p>
          </div>
        </div>

        {submission.status === 'pending_review' && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-600 font-medium">
            <ClockIcon size={16} className="animate-pulse" />
            <span className="text-sm">Reviewing</span>
          </div>
        )}
        {submission.status === 'approved' && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 font-medium">
            <CheckCircleIcon size={16} />
            <span className="text-sm">Paid</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ====== SURVEY MODAL ======
const SurveyModal = ({
  category, onClose, onSubmit,
}: {
  category: ModalCategory;
  onClose: () => void;
  onSubmit: (answers: Record<string, any>) => Promise<void>;
}) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // For rejected: show feedback first, then let them edit
  const [isEditingResubmit, setIsEditingResubmit] = useState(false);

  const cfg = getCategoryCfg(category.name);
  const CategoryIcon = cfg.icon;
  const isRejected = category.status === 'rejected';
  const showFeedbackScreen = isRejected && !isEditingResubmit;
  const questions = category.questions;
  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  const validateAnswers = (): string | null => {
    for (const q of questions) {
      if (q.required) {
        const val = answers[q.id];
        if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
          return `"${q.text}" is required.`;
        }
        if (q.type === 'rating_1_to_5' && (Number(val) < 1 || Number(val) > 5)) {
          return `"${q.text}" must be rated 1–5.`;
        }
        if (q.type === 'multiple_choice' && q.options && !q.options.includes(val)) {
          return `"${q.text}" has an invalid selection.`;
        }
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateAnswers();
    if (validationError) { setError(validationError); return; }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(answers);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Submission failed. Please try again.');
      setSubmitting(false);
    }
  };

  const renderInput = (question: SurveyQuestion) => {
    const value = answers[question.id];
    if (question.type === 'multiple_choice') {
      return (
        <div className="space-y-2">
          {question.options?.map((option, idx) => (
            <label key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50 cursor-pointer hover:bg-muted transition-colors">
              <input
                type="radio"
                name={`q-${question.id}`}
                value={option}
                checked={value === option}
                onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                className="w-4 h-4 text-primary"
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
          {[1, 2, 3, 4, 5].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setAnswers({ ...answers, [question.id]: r })}
              className={`w-10 h-10 rounded-xl font-bold transition-all ${
                value === r
                  ? 'bg-gradient-to-r from-primary to-amber-500 text-white shadow-lg'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      );
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-card rounded-3xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className={`relative p-6 bg-gradient-to-r ${cfg.color} flex-shrink-0`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <CategoryIcon size={28} className="text-white" />
              </div>
              <div>
                <p className="text-white/70 text-sm font-medium">{cfg.label}</p>
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

          {/* Rejection feedback — always visible when rejected */}
          {isRejected && category.rejection_reason && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-400/30 rounded-xl">
              <p className="text-sm text-white/90">
                <strong>Reviewer feedback:</strong> {category.rejection_reason}
              </p>
            </div>
          )}

          {/* Progress bar — only while answering questions */}
          {!showFeedbackScreen && questions.length > 0 && (
            <div className="mt-6">
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

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          {showFeedbackScreen ? (
            // Rejection review screen
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
                <XCircleIcon size={32} className="text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Survey Needs Revision</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Review the feedback above, then update your answers and resubmit.
              </p>
              <button
                onClick={() => setIsEditingResubmit(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all"
              >
                <SendIcon size={18} />
                Edit &amp; Resubmit
              </button>
            </div>
          ) : (
            // Question answering flow
            <div key={currentQuestion}>
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-amber-400/20 flex items-center justify-center text-primary font-bold text-xl">
                  {currentQuestion + 1}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Question {currentQuestion + 1} of {questions.length}
                  </p>
                  <h3 className="text-xl font-semibold text-foreground">
                    {questions[currentQuestion]?.text}
                    {questions[currentQuestion]?.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </h3>
                </div>
              </div>

              {renderInput(questions[currentQuestion])}

              {/* Dot navigator */}
              <div className="flex justify-center gap-2 mt-6">
                {questions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentQuestion(i)}
                    aria-label={`Go to question ${i + 1}`}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      i === currentQuestion
                        ? 'bg-primary scale-125'
                        : answers[q.id] !== undefined && answers[q.id] !== ''
                          ? 'bg-primary/50'
                          : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer — only during answering */}
        {!showFeedbackScreen && questions.length > 0 && (
          <div className="p-6 border-t border-border/50 bg-muted/30 flex-shrink-0">
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
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-amber-500 text-primary-foreground font-medium shadow-lg shadow-primary/30 hover:shadow-xl transition-all hover:-translate-y-0.5"
                >
                  Next <ArrowRightIcon size={18} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-medium shadow-lg shadow-emerald-500/30 hover:shadow-xl transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? <LoaderIcon size={18} className="animate-spin" /> : <SendIcon size={18} />}
                  {isRejected ? 'Resubmit Survey' : 'Submit Survey'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ====== EMPTY STATE ======
const EmptyState = ({ tab }: { tab: TabStatus }) => {
  const messages: Record<TabStatus, { title: string; description: string }> = {
    available:      { title: 'No surveys available',     description: 'Check back soon — new surveys are posted daily.' },
    pending_review: { title: 'No surveys under review',  description: 'Surveys you submit will appear here while awaiting review.' },
    approved:       { title: 'No completed surveys yet', description: 'Complete surveys and get them approved to start earning!' },
    rejected:       { title: 'No revisions needed',      description: 'Great job keeping your answers high quality!' },
  };
  const { title, description } = messages[tab];
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-amber-400/20 flex items-center justify-center mb-6">
        <ClipboardIcon size={40} className="text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-center max-w-sm">{description}</p>
    </div>
  );
};

// ====== STATS BAR ======
const StatsBar = ({
  categories, submissions, userTierLevel,
}: {
  categories: CategoryListItem[];
  submissions: SubmissionItem[];
  userTierLevel: number;
}) => {
  // Available = not_started or active categories the user's tier can access
  const availableCount = categories.filter(
    c => c.status === 'not_started' && userTierLevel >= c.tier_level
  ).length;
  const pendingCount  = submissions.filter(s => s.status === 'pending_review').length;
  const approvedCount = submissions.filter(s => s.status === 'approved').length;
  const totalEarned   = submissions
    .filter(s => s.status === 'approved')
    .reduce((sum, s) => sum + parseFloat(s.amount_kes), 0);

  const stats = [
    { label: 'Available',    value: availableCount,                  icon: BriefcaseIcon,   color: 'text-primary' },
    { label: 'Pending',      value: pendingCount,                    icon: ClockIcon,       color: 'text-amber-500' },
    { label: 'Approved',     value: approvedCount,                   icon: CheckCircleIcon, color: 'text-emerald-500' },
    { label: 'Total Earned', value: `KES ${totalEarned.toFixed(2)}`, icon: CoinsIcon,       color: 'text-primary' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="relative bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-4 hover:border-primary/30 transition-all duration-300 overflow-hidden group"
          style={{ animationDelay: `${i * 0.1}s` }}
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

// ====== MAIN PAGE ======
const SurveysPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [activeTab,       setActiveTab]       = useState<TabStatus>('available');
  const [modalCategory,   setModalCategory]   = useState<ModalCategory | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);

  // Two separate arrays — one per backend endpoint
  const [categories,   setCategories]   = useState<CategoryListItem[]>([]);  // /surveys/categories/
  const [submissions,  setSubmissions]  = useState<SubmissionItem[]>([]);    // /surveys/submissions/
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);

  const [loading,   setLoading]   = useState(true);
  const [tierError, setTierError] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // ---- Auth guard (early return before hooks would be called) ----
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

  // ---- Data fetching ----
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setTierError(false);
    try {
      const [catRes, subRes, subStatusRes] = await Promise.all([
        api.get('/surveys/categories/'),
        api.get('/surveys/submissions/'),
        api.get('/subscriptions/status/'),
      ]);

      const fetchedCategories: CategoryListItem[] = catRes.data.categories ?? catRes.data;
      const fetchedSubmissions: SubmissionItem[]  = subRes.data.submissions ?? subRes.data;
      const subStatusData = subStatusRes.data;

      // tier_level may be at root or nested inside plan — handle both
      const tierLevel: number | undefined =
        typeof subStatusData?.tier_level === 'number'
          ? subStatusData.tier_level
          : typeof subStatusData?.plan?.tier_level === 'number'
            ? subStatusData.plan.tier_level
            : undefined;

      if (tierLevel === undefined) {
        // Hard failure — cannot determine what surveys user can see
        setTierError(true);
        return;
      }

      setCategories(fetchedCategories);
      setSubmissions(fetchedSubmissions);
      setSubscription({ ...subStatusData, tier_level: tierLevel });

    } catch (err: any) {
      console.error('Failed to load surveys:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      } else if (err.response?.status === 403) {
        setError('Access denied. Please check your subscription.');
      } else {
        setError('Failed to load surveys. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ---- Tab counts — computed from both data sources simultaneously ----
  //
  // Available + Rejected come from /categories/ (backend already filters to these two)
  // Pending  + Approved  come from /submissions/ (the only source for those statuses)
  //
  // These are always recalculated from the full datasets so every tab badge
  // shows the correct number immediately on page load, not just the active tab.
  const tabCounts: Record<TabStatus, number> = {
    available:      categories.filter(c => c.status === 'not_started').length,
    rejected:       categories.filter(c => c.status === 'rejected').length,
    pending_review: submissions.filter(s => s.status === 'pending_review').length,
    approved:       submissions.filter(s => s.status === 'approved').length,
  };

  // ---- Items shown in the current tab ----
  const showCategoryGrid  = activeTab === 'available' || activeTab === 'rejected';
  const showSubmissionGrid = activeTab === 'pending_review' || activeTab === 'approved';

  const categoryTabItems  = categories.filter(c =>
    activeTab === 'available' ? c.status === 'not_started' : c.status === 'rejected'
  );
  const submissionTabItems = submissions.filter(s => s.status === activeTab);

  const isEmpty = showCategoryGrid ? categoryTabItems.length === 0 : submissionTabItems.length === 0;

  // ---- Open modal — fetch questions from detail endpoint ----
  const openModal = async (item: CategoryListItem) => {
    setLoadingDetailId(item.id);
    try {
      const res = await api.get(`/surveys/categories/${item.id}/`);
      const detail: CategoryDetail = res.data;
      setModalCategory({
        id:               item.id,
        name:             item.name,
        description:      item.description,
        amount_kes:       item.amount_kes,
        tier_level:       item.tier_level,
        status:           item.status,
        rejection_reason: item.rejection_reason,
        questions:        detail.questions,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to load survey. Please try again.';
      alert(msg);
    } finally {
      setLoadingDetailId(null);
    }
  };

  // ---- Submit answers ----
  // The backend validates by str(q.id) so we must send string keys.
  // After submission we refresh BOTH endpoints so all tab counts update instantly.
  const handleSubmit = async (answers: Record<string, any>) => {
    if (!modalCategory) return;

    const stringifiedAnswers: Record<string, any> = {};
    for (const [k, v] of Object.entries(answers)) {
      stringifiedAnswers[String(k)] = v;
    }

    await api.post('/surveys/submit/', {
      category_id: modalCategory.id,
      answers: stringifiedAnswers,
    });

    // Refresh both sources so every tab is immediately up to date
    const [catRes, subRes] = await Promise.all([
      api.get('/surveys/categories/'),
      api.get('/surveys/submissions/'),
    ]);
    setCategories(catRes.data.categories ?? catRes.data);
    setSubmissions(subRes.data.submissions ?? subRes.data);

    setModalCategory(null);
    setActiveTab('pending_review');
  };

  const handleUpgradeClick = () => {
    navigate('/subscriptions', {
      state: { from: '/surveys', message: 'Upgrade to unlock higher-paying surveys' },
    });
  };

  // ---- Loading / error states ----
  if (loading) return <LoadingSpinner message="Loading surveys..." />;

  if (tierError) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <LockIcon size={32} className="text-red-600" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">Subscription Tier Unavailable</h3>
        <p className="text-muted-foreground text-center mb-6">
          We could not determine your subscription tier. Please visit your subscription page or contact support.
        </p>
        <div className="flex gap-3">
          <button onClick={() => navigate('/subscriptions')}
            className="px-6 py-3 bg-gradient-to-r from-primary to-amber-500 text-white font-medium rounded-xl hover:shadow-lg transition-all">
            View Subscriptions
          </button>
          <button onClick={fetchData}
            className="px-6 py-3 bg-muted text-foreground font-medium rounded-xl hover:bg-muted/80 transition-all">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <XCircleIcon size={32} className="text-red-600" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">Something went wrong</h3>
        <p className="text-muted-foreground text-center mb-6">{error}</p>
        <button onClick={fetchData}
          className="px-6 py-3 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition-colors">
          Try Again
        </button>
      </div>
    );
  }

  const userTierLevel = subscription!.tier_level;

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shadow-lg shadow-primary/30">
            <BriefcaseIcon size={24} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Surveys</h1>
            <p className="text-muted-foreground">Complete surveys and earn money</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 text-primary">
          <SparklesIcon size={18} className="animate-pulse" />
          <span className="text-sm font-medium">New surveys available daily!</span>
        </div>
      </div>

      <StatsBar
        categories={categories}
        submissions={submissions}
        userTierLevel={userTierLevel}
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-3 mb-8">
        {([
          { status: 'available'      as TabStatus, icon: PlayIcon,        label: 'Available' },
          { status: 'pending_review' as TabStatus, icon: ClockIcon,       label: 'Under Review' },
          { status: 'approved'       as TabStatus, icon: CheckCircleIcon, label: 'Completed' },
          { status: 'rejected'       as TabStatus, icon: XCircleIcon,     label: 'Needs Revision' },
        ]).map(tab => (
          <TabButton
            key={tab.status}
            active={activeTab === tab.status}
            onClick={() => setActiveTab(tab.status)}
            icon={tab.icon}
            label={tab.label}
            count={tabCounts[tab.status]}
          />
        ))}
      </div>

      {/* Grid */}
      {isEmpty ? (
        <EmptyState tab={activeTab} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Available + Rejected tabs */}
          {showCategoryGrid && categoryTabItems.map((item, i) => (
            <div key={item.id} className="animate-fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
              <SurveyCard
                item={item}
                userTierLevel={userTierLevel}
                onClick={() => openModal(item)}
                onUpgradeClick={handleUpgradeClick}
                isLoadingDetail={loadingDetailId === item.id}
              />
            </div>
          ))}

          {/* Under Review + Completed tabs */}
          {showSubmissionGrid && submissionTabItems.map((sub, i) => (
            <div key={sub.id} className="animate-fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
              <SubmissionCard submission={sub} />
            </div>
          ))}

        </div>
      )}

      {/* Modal */}
      {modalCategory && (
        <SurveyModal
          category={modalCategory}
          onClose={() => setModalCategory(null)}
          onSubmit={handleSubmit}
        />
      )}
    </>
  );
};

export default SurveysPage;