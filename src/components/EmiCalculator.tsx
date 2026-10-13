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
    <section id="calculator" className="py-12 sm:py-20 lg:py-28 border-b border-orange-200/60 bg-[#FFF3EB] w-full max-w-full overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full max-w-full">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-800 mb-1.5 sm:mb-2 font-sans">
            Financial Planning
          </div>
          <h2 className="font-serif-luxury text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 uppercase">
            Home Loan &amp; EMI Calculator
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
            Calculate your monthly repayment schedules with competitive interest rates from top institutional lenders in Noida.
          </p>
        </div>

        {/* Calculator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch max-w-6xl mx-auto">
          
          {/* Sliders Input Panel (Col 7) */}
          <div className="lg:col-span-7 rounded-3xl border border-orange-100/60 bg-white p-6 sm:p-8 shadow-xl shadow-orange-950/5 space-y-6 flex flex-col justify-between text-slate-900">
            
            {/* Loan Amount Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <IndianRupee className="h-3.5 w-3.5 text-amber-700" />
                  Loan Amount
                </label>
                <span className="font-sans text-base sm:text-lg font-bold text-amber-800 tabular-nums">
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
                className="w-full h-2.5 bg-[#FDEBDD] rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-medium">
                <span>₹10 Lakh</span>
                <span>₹2.5 Cr</span>
                <span>₹5 Cr</span>
                <span>₹10 Cr</span>
              </div>
              {/* Quick Presets */}
              <div className="flex flex-wrap sm:flex-nowrap gap-2 mt-3">
                {[50, 100, 150, 250, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setLoanAmountLakhs(amt)}
                    className={`px-3.5 py-1 text-xs rounded-lg transition-all cursor-pointer font-medium ${
                      loanAmountLakhs === amt
                        ? 'bg-amber-500 text-slate-950 font-bold border border-amber-500 shadow-xs'
                        : 'bg-white hover:bg-orange-50 border border-orange-200/80 text-slate-700'
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
                  % Interest Rate (% p.a.)
                </label>
                <span className="font-sans text-base sm:text-lg font-bold text-slate-900 tabular-nums">
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
                className="w-full h-2.5 bg-[#FDEBDD] rounded-lg appearance-none cursor-pointer accent-amber-500"
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
                <span className="font-sans text-sm sm:text-base font-bold text-slate-900 tabular-nums">
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
                className="w-full h-2.5 bg-[#FDEBDD] rounded-lg appearance-none cursor-pointer accent-amber-500"
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
          <div className="lg:col-span-5 rounded-3xl bg-[#18120F] p-6 sm:p-8 shadow-2xl shadow-black/25 flex flex-col justify-between text-white border border-white/5">
            <div>
              <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-400 mb-1 font-sans">
                Monthly Outflow
              </div>
              
              <div className="flex items-baseline gap-2 mb-6">
                <span className="font-sans text-3xl sm:text-4xl font-extrabold text-amber-400 tabular-nums tracking-tight">
                  ₹{calculation.monthlyEmi.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-stone-400 font-medium">/month</span>
              </div>

              {/* Split breakdown */}
              <div className="space-y-3 pt-4 border-t border-stone-800 text-xs">
                <div className="flex justify-between text-stone-300">
                  <span className="text-stone-400">Principal Loan:</span>
                  <span className="font-sans font-bold text-white text-sm tabular-nums">{formatRupees(loanAmountLakhs * 100000)}</span>
                </div>
                <div className="flex justify-between text-stone-300">
                  <span className="text-stone-400">Total Interest Payable:</span>
                  <span className="font-sans font-bold text-amber-400 text-sm tabular-nums">{formatRupees(calculation.totalInterest)}</span>
                </div>
                <div className="flex justify-between text-stone-300">
                  <span className="text-stone-400">Total Amount Payable:</span>
                  <span className="font-sans font-bold text-white text-sm tabular-nums">{formatRupees(calculation.totalPayment)}</span>
                </div>
              </div>

              {/* Visual ratio bar */}
              <div className="mt-6">
                <div className="h-2.5 sm:h-3 w-full bg-stone-800 rounded-full overflow-hidden flex">
                  <div 
                    style={{ width: `${calculation.principalPercent}%` }} 
                    className="bg-amber-400 transition-all duration-300"
                    title={`Principal: ${calculation.principalPercent}%`}
                  />
                  <div 
                    style={{ width: `${calculation.interestPercent}%` }} 
                    className="bg-[#6366F1] transition-all duration-300"
                    title={`Interest: ${calculation.interestPercent}%`}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-stone-400 mt-2 font-medium">
                  <span className="flex items-center gap-1.5 text-amber-300">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    Principal ({calculation.principalPercent}%)
                  </span>
                  <span className="flex items-center gap-1.5 text-indigo-400">
                    <span className="h-2 w-2 rounded-full bg-[#6366F1]" />
                    Interest ({calculation.interestPercent}%)
                  </span>
                </div>
              </div>
            </div>

            {/* KR Estate Bank Partners Assistance */}
            <div className="mt-6 pt-4 border-t border-stone-800">
              <span className="text-[11px] font-semibold text-stone-300 block mb-2.5">
                Pre-Approved Banking Partners with KR Estate:
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-3 py-1 rounded-lg bg-stone-900 border border-stone-800 text-stone-200 font-medium">HDFC Bank</span>
                <span className="px-3 py-1 rounded-lg bg-stone-900 border border-stone-800 text-stone-200 font-medium">State Bank of India</span>
                <span className="px-3 py-1 rounded-lg bg-stone-900 border border-stone-800 text-stone-200 font-medium">ICICI Bank</span>
                <span className="px-3 py-1 rounded-lg bg-stone-900 border border-stone-800 text-stone-200 font-medium">Axis Bank</span>
              </div>
              <p className="text-[11px] text-stone-400 mt-3 leading-relaxed">
                KR Estate clients receive prioritized loan sanctioning with zero processing surcharges.
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
