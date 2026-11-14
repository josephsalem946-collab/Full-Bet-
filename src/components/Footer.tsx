import React from 'react';
import { ShieldCheck, Mail, Smartphone, FileText, CheckCircle } from 'lucide-react';
import { APP_VERSION } from '../version';
import { useTranslation } from '../context/LanguageContext';

interface FooterProps {
  onOpenRules?: () => void;
  onOpenDownloadApp?: () => void;
  onOpenTicketVerify?: () => void;
  onOpenPrivacyPolicy?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenRules,
  onOpenDownloadApp,
  onOpenTicketVerify,
  onOpenPrivacyPolicy
}) => {
  const { t } = useTranslation();

  return (
    <footer className="w-full bg-[#090e1a] text-slate-300 border-t border-slate-800/80 pt-8 pb-12 px-4 mt-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 border-b border-slate-800/80">
          {/* Col 1: Brand & Identity */}
          <div className="space-y-2.5 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-white p-0.5 flex items-center justify-center shrink-0">
                <img
                  src="/assets/aistudio/20261024_195031_0000_e0e7da2c.png"
                  alt="Full Bet Official Logo"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-display font-black text-lg tracking-wider">
                <span className="text-amber-400">FULL</span>{' '}
                <span className="text-sky-400">BET</span>
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              Plateforme certifiée de paris sportifs en direct, jeux de casino et tirages officiels de Borlette (New York & Floride). Paiements locaux sécurisés via Natcash, Moncash et Crypto.
            </p>

            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold pt-1">
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                {t('certified18')}
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {t('instantPayments')}
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                SSL 256-bit TLS
              </span>
            </div>
          </div>

          {/* Col 2: Navigation Rapide */}
          <div className="space-y-2.5 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              {t('linksAndServices')}
            </h4>
            <ul className="space-y-2 text-slate-400">
              {onOpenDownloadApp && (
                <li>
                  <button
                    onClick={onOpenDownloadApp}
                    className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{t('downloadApp')} (Android / iOS)</span>
                  </button>
                </li>
              )}
              {onOpenTicketVerify && (
                <li>
                  <button
                    onClick={onOpenTicketVerify}
                    className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{t('ticketVerifier')}</span>
                  </button>
                </li>
              )}
              {onOpenRules && (
                <li>
                  <button
                    onClick={onOpenRules}
                    className="hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{t('rulesAndTerms')}</span>
                  </button>
                </li>
              )}
              {onOpenPrivacyPolicy && (
                <li>
                  <button
                    onClick={onOpenPrivacyPolicy}
                    className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{t('privacyPolicy')}</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Col 3: Support Client & Contact */}
          <div className="space-y-2.5 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              {t('officialSupport')}
            </h4>
            <div className="p-3 rounded-xl bg-[#0e1628] border border-slate-800 space-y-1.5">
              <span className="text-slate-400 text-[11px] block">Contact officiel :</span>
              <a
                href="mailto:fullbet509@gmail.com"
                className="font-mono font-bold text-amber-400 hover:text-amber-300 text-xs flex items-center gap-1.5 break-all transition-colors"
              >
                <Mail className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span>fullbet509@gmail.com</span>
              </a>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {t('supportDesc')}
            </p>
          </div>
        </div>

        {/* Bottom Legal & Version Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 text-center sm:text-left">
          <div>
            <span>{t('legalMentions')}</span>
            <span className="mx-2 text-slate-600">•</span>
            <span className="font-mono text-slate-500">v{APP_VERSION.fullVersionString}</span>
          </div>
          <div className="text-slate-500">
            {t('allRightsReserved')}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
