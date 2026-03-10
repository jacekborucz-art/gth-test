
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MailMessage, MailType } from '../../types';
import { useGame } from '../../context/GameContext';

interface MailDetailsModalProps {
  mail: MailMessage;
  onClose: () => void;
}

export const MailDetailsModal: React.FC<MailDetailsModalProps> = ({ mail, onClose }) => {
  const { finalizeFreeAgentContract } = useGame();
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
  };

  const handleContractClose = () => {
    finalizeFreeAgentContract(mail.id);
    handleClose();
  };

  const getTypeColor = (type: MailType) => {
    switch (type) {
      case MailType.BOARD: return 'text-amber-500';
      case MailType.FANS: return 'text-rose-500';
      case MailType.STAFF: return 'text-blue-500';
      case MailType.MEDIA: return 'text-emerald-500';
      case MailType.SCOUT: return 'text-cyan-400';
      default: return 'text-slate-400';
    }
  };

  const getAvatarIcon = (type: MailType) => {
    switch (type) {
      case MailType.BOARD: return '🏛️';
      case MailType.FANS: return '📣';
      case MailType.STAFF: return '🩺';
      case MailType.MEDIA: return '📰';
      case MailType.SCOUT: return '📥';
      default: return '📧';
    }
  };

  // Target: mailbox panel is on the right side of the dashboard
  const mailboxTarget = { x: '42vw', y: '-8vh' };

  return (
    <motion.div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-6"
      initial={{ backgroundColor: 'rgba(0,0,0,0)' }}
      animate={{ backgroundColor: isClosing ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,0.70)' }}
      transition={{ duration: 0.35 }}
    >
      <motion.div
        className={`${mail.type === MailType.SCOUT ? 'max-w-[1693px] w-[88vw] h-[86vh]' : 'max-w-2xl max-h-[90vh]'} w-full backdrop-blur-2xl border border-white/12 shadow-[0_40px_80px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col relative`}
        style={{ background: 'rgba(20, 27, 42, 0.82)' }}
        initial={{ scale: 0.04, opacity: 0, x: mailboxTarget.x, y: mailboxTarget.y, borderRadius: '50%' }}
        animate={isClosing
          ? { scale: 0.04, opacity: 0, x: mailboxTarget.x, y: mailboxTarget.y, borderRadius: '50%' }
          : { scale: 1, opacity: 1, x: 0, y: 0, borderRadius: '16px' }
        }
        transition={{
          duration: isClosing ? 0.38 : 0.42,
          ease: isClosing ? [0.4, 0, 1, 1] : [0, 0, 0.2, 1],
        }}
        onAnimationComplete={() => {
          if (isClosing) onClose();
        }}
      >
        {/* ── Client-bar: sender branding ── */}
        <div className="border-b border-white/8 px-6 py-4 flex items-center justify-between shrink-0" style={{ background: 'rgba(0,0,0,0.18)' }}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-black/50 flex items-center justify-center text-xl border border-white/8">
              {getAvatarIcon(mail.type)}
            </div>
            <div>
              <span className={`text-[11px] font-black uppercase tracking-[0.35em] ${getTypeColor(mail.type)}`}>WIADOMOŚĆ PRZYCHODZĄCA</span>
              <div className="flex items-center gap-2 mt-0.5">
                <h2 className="text-base font-black text-white uppercase tracking-wider">{mail.sender}</h2>
                <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-widest">· {mail.role}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-white/15 hover:text-white transition-all text-sm"
          >
            ✕
          </button>
        </div>

        {/* ── Email metadata strip ── */}
        <div className="border-b border-white/6 px-7 py-4 shrink-0 space-y-1.5" style={{ background: 'rgba(0,0,0,0.12)' }}>
          <div className="flex items-baseline gap-3">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest w-12 shrink-0">OD:</span>
            <span className="text-[13px] text-slate-300 font-medium">{mail.sender} &lt;{mail.role.toLowerCase().replace(/\s+/g, '.')}@{mail.sender.toLowerCase().replace(/\s+/g, '-')}.pl&gt;</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest w-12 shrink-0">DO:</span>
            <span className="text-[13px] text-slate-300 font-medium">Pierwszy Trener &lt;manager@klub.pl&gt;</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest w-12 shrink-0">DATA:</span>
            <span className="text-[13px] text-slate-300 font-medium">{mail.date.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          <div className="flex items-baseline gap-3 pt-1 border-t border-white/5 mt-1">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest w-12 shrink-0">TEMAT:</span>
            <span className="text-[14px] text-white font-bold">{mail.subject}</span>
          </div>
        </div>

        {/* ── Email body ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="px-8 py-7">
            <div className={`w-full h-px mb-6 opacity-30 ${getTypeColor(mail.type).replace('text-', 'bg-')}`} />
            {mail.type === MailType.SCOUT
              ? <div className="prose prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: mail.body }} />
              : (
                <div className="text-slate-100 text-[16px] leading-[1.9] font-normal space-y-5">
                  {mail.body.split('\n\n').map((paragraph, i) => (
                    paragraph.trim() ? (
                      <p key={i} className={paragraph.startsWith('Z poważaniem') || paragraph.startsWith('Z szacunkiem') ? 'text-slate-400 text-sm pt-3 border-t border-white/6 mt-4' : ''}>
                        {paragraph}
                      </p>
                    ) : null
                  ))}
                </div>
              )
            }
            <div className={`w-full h-px mt-8 opacity-20 ${getTypeColor(mail.type).replace('text-', 'bg-')}`} />
          </div>
        </div>

        {/* ── Footer / actions ── */}
        <div className="px-6 py-4 border-t border-white/8 flex justify-between items-center shrink-0" style={{ background: 'rgba(0,0,0,0.15)' }}>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${getTypeColor(mail.type).replace('text-', 'bg-')}`} />
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
              {mail.date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {mail.metadata?.type === 'CONTRACT_OFFER' && mail.metadata.accepted && (
              <button
                onClick={handleContractClose}
                className="px-6 py-2.5 bg-emerald-600/90 text-white font-black italic uppercase tracking-widest text-xs rounded-lg hover:bg-emerald-500 hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                PODPISZ KONTRAKT ✍️
              </button>
            )}
            <button
              onClick={handleClose}
              className="px-7 py-2.5 bg-white/10 border border-white/15 text-white font-black italic uppercase tracking-widest text-xs rounded-lg hover:bg-white/20 hover:scale-105 active:scale-95 transition-all"
            >
              ZAMKNIJ WIADOMOŚĆ
            </button>
          </div>
        </div>

      </motion.div>
    </motion.div>
  );
};

