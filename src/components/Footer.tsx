import React from 'react';
import { ShieldCheck, Mail, Smartphone, Award, FileText, CheckCircle } from 'lucide-react';
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
    <footer className="w-full bg-[#0b1329] text-slate-300 border-t border-slate-800 pt-8 pb-12 px-4 sm:px-6 mt-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Section: Brand & Badges */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 border-b border-slate-800/80">
          {/* Col 1: Brand & Identity */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full overflow-hidden bg-white border border-sky-400/50 p-0.5 shadow-md flex items-center justify-center shrink-0">
                <img
                  src="/assets/aistudio/20261024_195031_0000_e0e7da2c.png"
                  alt="Full Bet Official Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-display font-black text-xl uppercase tracking-wider">
                <span className="text-amber-400">FULL</span>{' '}
                <span className="text-sky-400">BET</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              Plateforme certifiée de paris sportifs en direct, jeux de casino en ligne et tirages officiels de Borlette (New York & Floride). Intégration directe des passerelles mobiles sécurisées Natcash et Moncash.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <Award className="w-3.5 h-3.5" />
                <span>{t('certified18')}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t('instantPayments')}</span>
              </span>
            </div>
          </div>

          {/* Col 2: Navigation Rapide */}
          <div className="space-y-2.5 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-white text-[11px] font-display">
              {t('linksAndServices')}
            </h4>
            <ul className="space-y-2 text-slate-400">
              {onOpenDownloadApp && (
                <li>
                  <button
                    onClick={onOpenDownloadApp}
                    className="hover:text-sky-400 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>{t('downloadApp')} (.APK / iOS)</span>
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
                    className="hover:text-sky-400 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>{t('privacyPolicy')}</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Col 3: Support Client & Contact */}
          <div className="space-y-2.5 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-white text-[11px] font-display">
              {t('officialSupport')}
            </h4>
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <span className="text-slate-400 text-[11px] block">Contact :</span>
                <a
                  href="mailto:fullbet509@gmail.com"
                  className="font-mono font-bold text-sky-400 hover:text-sky-300 text-xs flex items-center gap-1.5 break-all"
                >
                  <Mail className="w-3.5 h-3.5 shrink-0 text-sky-400" />
                  <span>fullbet509@gmail.com</span>
                </a>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                {t('supportDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* Technical Info & Version Section (Informations techniques) */}
        <div className="bg-[#0e172e] border border-slate-800/90 rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {t('technicalInfo')}
              </div>
              <div className="font-mono text-xs sm:text-[13px] text-slate-200 font-semibold flex flex-wrap items-center justify-center md:justify-start gap-1.5">
                <span>Version : <strong className="text-amber-300 font-bold">{APP_VERSION.fullVersionString}</strong></span>
                <span className="text-slate-600">•</span>
                <span>Code : <strong className="text-sky-300 font-bold">Dans 2</strong></span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 font-bold">Android & PWA.</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 text-[11px] font-mono border border-slate-700">
                SSL 256-bit TLS
              </span>
              <span className="px-2.5 py-1 rounded-md bg-emerald-950/50 text-emerald-300 text-[11px] font-mono border border-emerald-800/50">
                {t('certified18')}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Section: Mentions légales & Droits */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-[11px] text-slate-400 text-center sm:text-left">
          <div>
            <strong className="text-slate-300 font-semibold">
              {t('legalMentions')}
            </strong>
          </div>
          <div className="text-[10px] text-slate-400">
            {t('allRightsReserved')}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
