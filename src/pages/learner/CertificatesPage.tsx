import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { useTheme } from '../../context/ThemeContext.js';
import { CertificateItem } from '../../types.js';
import { Award, CheckCircle2, ShieldCheck, Download, Printer, ExternalLink, QrCode, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { playClickSound, playCelebrationFanfare } from '../../lib/sound.js';
import { triggerConfetti } from '../../lib/confetti.js';

export function CertificatesPage() {
  const { soundEnabled } = useTheme();
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<CertificateItem | null>(null);

  const loadCertificates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/courses/user/certificates');
      setCertificates(res.certificates || []);
    } catch (err) {
      console.error('Failed to load certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCertificates();
  }, []);

  const handleOpenCertificate = (cert: CertificateItem) => {
    playCelebrationFanfare(soundEnabled);
    triggerConfetti();
    setSelectedCert(cert);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xs transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Verifiable Digital Credentials
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">Tamper-Proof SIH 2026 Registry</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
          Earned Competency Certificates
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Official digital credentials issued upon scoring 70%+ in comprehensive assessments. All credentials include unique verification identifiers.
        </p>
      </div>

      {/* Certificate List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">Loading certificate registry...</div>
      ) : certificates.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Award className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">No Certificates Earned Yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Complete active courses and pass the final evaluation quiz (70%+ passing threshold) to earn verifiable credentials.
          </p>
          <Link
            to="/learner/courses"
            onClick={() => playClickSound(soundEnabled)}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
          >
            Explore Available Courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-lg transition-all p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <Award className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {cert.certificateNumber}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-2">{cert.courseTitle}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Recipient: <strong className="text-slate-800 dark:text-slate-200">{cert.recipientName}</strong></p>

                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Evaluation Score:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{cert.score}% (Passed)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Issued On:</span>
                    <span className="text-slate-700 dark:text-slate-300">{new Date(cert.issuedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Issuing Body:</span>
                    <span className="text-slate-700 dark:text-slate-300">{cert.organization}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  id={`btn-view-cert-${cert.id}`}
                  onClick={() => handleOpenCertificate(cert)}
                  className="flex-1 py-2 px-3 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 font-semibold text-xs rounded-xl text-center transition-colors cursor-pointer"
                >
                  View Certificate
                </button>
                <Link
                  to={`/verify/${cert.certificateNumber}`}
                  onClick={() => playClickSound(soundEnabled)}
                  className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Open Public Verification Link"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Official Certificate Modal / Print View */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-300 dark:border-slate-800 w-full max-w-3xl overflow-hidden my-8">
            {/* Modal Controls */}
            <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between print:hidden">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Official Digital Credential • ID: {selectedCert.certificateNumber}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
                <button
                  onClick={() => setSelectedCert(null)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Certificate Frame */}
            <div className="p-8 sm:p-12 bg-gradient-to-b from-amber-50/40 via-white to-amber-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 border-8 border-double border-amber-800/60 dark:border-amber-600/40 relative m-4 rounded-xl text-center space-y-6">
              {/* Watermark Logo */}
              <div className="flex justify-center items-center gap-2 mb-2">
                <Award className="w-10 h-10 text-amber-700 dark:text-amber-500" />
                <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white uppercase">
                  National Digital Capacity Academy
                </span>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs uppercase font-bold tracking-widest text-amber-800 dark:text-amber-400">
                  Smart India Hackathon 2026 • Certificate of Competence
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">This is proudly awarded to</p>
              </div>

              {/* Recipient Name */}
              <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 dark:text-white py-2 border-b-2 border-amber-900/30 dark:border-amber-500/30 max-w-lg mx-auto">
                {selectedCert.recipientName}
              </h2>

              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
                For successfully fulfilling all curriculum requirements and demonstrating verified competency with a score of{' '}
                <strong className="text-slate-900 dark:text-white font-bold">{selectedCert.score}%</strong> in the official evaluation of
              </p>

              <h3 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-400">
                {selectedCert.courseTitle}
              </h3>

              {/* Signatures & Seal */}
              <div className="pt-8 grid grid-cols-3 items-end gap-4 text-xs text-slate-600 dark:text-slate-400 border-t border-amber-900/20 dark:border-slate-800">
                <div className="text-center">
                  <div className="font-serif italic text-sm text-slate-800 dark:text-slate-200 font-bold">Dr. Vikramaditya Sharma</div>
                  <div className="border-t border-slate-400 dark:border-slate-700 mt-1 pt-0.5 text-[10px] text-slate-500">Lead Academic Director</div>
                </div>

                {/* Gold Seal */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border-2 border-amber-600 flex items-center justify-center shadow-md text-amber-950 font-black text-[9px] uppercase text-center p-1">
                    Verified Credential
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 font-mono">{selectedCert.certificateNumber}</span>
                </div>

                <div className="text-center">
                  <div className="font-serif italic text-sm text-slate-800 dark:text-slate-200 font-bold">Prof. Rajeshwar Verma</div>
                  <div className="border-t border-slate-400 dark:border-slate-700 mt-1 pt-0.5 text-[10px] text-slate-500">SIH Evaluation Board</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
