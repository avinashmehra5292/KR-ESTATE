import React, { useState, useMemo } from 'react';
import { Calculator, CheckCircle2, Percent, IndianRupee, Clock } from 'lucide-react';

export const EmiCalculator: React.FC = () => {
  const [loanAmountLakhs, setLoanAmountLakhs] = useState<number>(150); // 1.5 Cr default
  const [interestRate, setInterestRate] = useState<number>(8.5); // 8.5% default
  const [tenureYears, setTenureYears] = useState<number>(20); // 20 years default

  // EMI Formula: P * r * (1 + r)^n / ((1 + r)^n - 1)
  const calculation = useMemo(() => {
    const P = loanAmountLakhs * 100000;
    const r = interestRate / (12 * 100);
    const n = tenureYears * 12;

    if (r === 0) {
      const emi = P / n;
      return {
        monthlyEmi: Math.round(emi),
        totalInterest: 0,
        totalPayment: P,
        principalPercent: 100,
        interestPercent: 0,
      };
    }

    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = emi * n;
    const totalInterest = totalPayment - P;

    const principalPercent = Math.round((P / totalPayment) * 100);
    const interestPercent = 100 - principalPercent;

    return {
      monthlyEmi: Math.round(emi),
      totalInterest: Math.round(totalInterest),
      totalPayment: Math.round(totalPayment),
      principalPercent,
      interestPercent,
    };
  }, [loanAmountLakhs, interestRate, tenureYears]);

  const formatRupees = (val: number) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} Lakh`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <section id="calculator" className="py-10 sm:py-20 lg:py-28 border-b border-orange-200/60 bg-[#FBE8DC] w-full max-w-full overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full max-w-full">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-800 mb-1.5 sm:mb-2">
            Financial Planning
          </div>
          <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Home Loan &amp; EMI Calculator
          </h2>
          <p className="mt-2 text-xs sm:text-base text-slate-700 leading-relaxed">
            Calculate your monthly repayment schedules with competitive interest rates from top institutional lenders in Noida.
          </p>
        </div>

        {/* Calculator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center max-w-6xl mx-auto">
          
          {/* Sliders Input Panel (Col 7) */}
          <div className="lg:col-span-7 rounded-2xl sm:rounded-3xl border border-orange-200/80 bg-white/95 p-4 sm:p-8 backdrop-blur-xl shadow-lg space-y-5 sm:space-y-6">
            
            {/* Loan Amount Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <IndianRupee className="h-3.5 w-3.5 text-amber-700" />
                  Loan Amount
                </label>
                <span className="font-mono text-base sm:text-lg font-bold text-amber-800 tabular-nums">
                  {formatRupees(loanAmountLakhs * 100000)}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="1000"
                step="5"
                value={loanAmountLakhs}
                onChange={(e) => setLoanAmountLakhs(Number(e.target.value))}
                className="w-full h-2.5 bg-orange-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-medium">
                <span>₹10 Lakh</span>
                <span>₹2.5 Cr</span>
                <span>₹5 Cr</span>
                <span>₹10 Cr</span>
              </div>
              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2.5">
                {[50, 100, 150, 250, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setLoanAmountLakhs(amt)}
                    className={`px-2.5 py-1 text-xs rounded-lg transition-all cursor-pointer ${
                      loanAmountLakhs === amt
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold shadow-md'
                        : 'bg-orange-50 text-slate-700 hover:text-slate-950 hover:bg-orange-100 border border-orange-200/80'
                    }`}
                  >
                    {amt >= 100 ? `₹${amt / 100} Cr` : `₹${amt}L`}
                  </button>
                ))}
              </div>
            </div>

            {/* Interest Rate Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Percent className="h-3.5 w-3.5 text-amber-700" />
                  Interest Rate (% p.a.)
                </label>
                <span className="font-mono text-base sm:text-lg font-bold text-slate-900 tabular-nums">
                  {interestRate.toFixed(2)}%
                </span>
              </div>
              <input
                type="range"
                min="6.5"
                max="12.0"
                step="0.05"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full h-2.5 bg-orange-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-medium">
                <span>6.5%</span>
                <span>8.5% (Typical)</span>
                <span>12.0%</span>
              </div>
            </div>

            {/* Tenure Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-700" />
                  Loan Duration
                </label>
                <span className="font-mono text-sm sm:text-base font-bold text-slate-900 tabular-nums">
                  {tenureYears} Yrs <span className="text-slate-500 text-xs font-normal">({tenureYears * 12}m)</span>
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={tenureYears}
                onChange={(e) => setTenureYears(Number(e.target.value))}
                className="w-full h-2.5 bg-orange-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-medium">
                <span>5 Yrs</span>
                <span>15 Yrs</span>
                <span>20 Yrs</span>
                <span>30 Yrs</span>
              </div>
            </div>

          </div>

          {/* Results Summary Box (Col 5) */}
          <div className="lg:col-span-5 rounded-2xl sm:rounded-3xl border border-amber-500/40 bg-gradient-to-br from-[#1C120C] via-[#2A1B12] to-[#180F0A] p-5 sm:p-8 backdrop-blur-xl shadow-xl relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 -mr-12 -mt-12 h-44 w-44 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

            <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
              Monthly Outflow
            </div>
            
            <div className="flex items-baseline gap-2 mb-6">
              <span className="font-mono text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 tabular-nums drop-shadow-[0_0_15px_rgba(245,158,11,0.35)]">
                ₹{calculation.monthlyEmi.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-400 font-medium">/ month</span>
            </div>

            {/* Split breakdown */}
            <div className="space-y-3 pt-4 border-t border-slate-800/80 text-xs">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Principal Loan:</span>
                <span className="font-mono font-bold text-white">{formatRupees(loanAmountLakhs * 100000)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Total Interest Payable:</span>
                <span className="font-mono font-bold text-amber-400">{formatRupees(calculation.totalInterest)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Total Amount Payable:</span>
                <span className="font-mono font-bold text-white">{formatRupees(calculation.totalPayment)}</span>
              </div>
            </div>

            {/* Visual ratio bar */}
            <div className="mt-6">
              <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                <div 
                  style={{ width: `${calculation.principalPercent}%` }} 
                  className="bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300"
                  title={`Principal: ${calculation.principalPercent}%`}
                />
                <div 
                  style={{ width: `${calculation.interestPercent}%` }} 
                  className="bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-300"
                  title={`Interest: ${calculation.interestPercent}%`}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-2 font-medium">
                <span className="flex items-center gap-1.5 text-amber-300">
                  <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                  Principal ({calculation.principalPercent}%)
                </span>
                <span className="flex items-center gap-1.5 text-indigo-300">
                  <span className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.8)]" />
                  Interest ({calculation.interestPercent}%)
                </span>
              </div>
            </div>

            {/* KR Estate Bank Partners Assistance */}
            <div className="mt-6 pt-4 border-t border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-300 block mb-2">
                Pre-Approved Banking Partners with KR Estate:
              </span>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-200 font-medium">HDFC Bank</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-200 font-medium">State Bank of India</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-200 font-medium">ICICI Bank</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-200 font-medium">Axis Bank</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
                KR Estate clients receive prioritized loan sanctioning with zero processing surcharges.
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
