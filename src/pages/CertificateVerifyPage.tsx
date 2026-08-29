import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { Award, ShieldCheck, CheckCircle2, XCircle, ArrowLeft, ExternalLink } from 'lucide-react';

export function CertificateVerifyPage() {
  const { id } = useParams<{ id: string }>();
  const [cert, setCert] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/api/courses/certificates/${id}/verify`)
      .then(res => setCert(res.certificate))
      .catch(err => setError(err.message || 'Certificate verification failed'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto w-full space-y-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to SkillBridge</span>
        </Link>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-700 pb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Public Credential Verification</h2>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/60">
              SIH 2026 Registry
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Querying verification ledger...</div>
          ) : error || !cert ? (
            <div className="p-6 rounded-xl bg-red-900/30 border border-red-700/60 text-center space-y-2">
              <XCircle className="w-10 h-10 text-red-400 mx-auto" />
              <h3 className="text-base font-bold text-red-200">Invalid or Unverified Credential</h3>
              <p className="text-xs text-red-300">
                The certificate number <strong>{id}</strong> could not be verified in the national registry.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-700/60 flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-emerald-200">Authentic & Verified Credential</h4>
                  <p className="text-xs text-emerald-300">
                    This certificate is officially registered and verified on the SkillBridge capacity ledger.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/70 p-5 rounded-xl border border-slate-700/80 space-y-3 text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Recipient Name:</span>
                  <strong className="text-white font-bold">{cert.recipientName}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Course / Competency:</span>
                  <strong className="text-blue-300 font-bold">{cert.courseTitle}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Assessment Score:</span>
                  <strong className="text-emerald-400 font-bold">{cert.score}% (Passed)</strong>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Certificate ID:</span>
                  <span className="font-mono text-amber-300 font-bold">{cert.certificateNumber}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Issue Date:</span>
                  <span className="text-slate-200">{new Date(cert.issuedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Issuing Organization:</span>
                  <span className="text-slate-200">{cert.organization}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
