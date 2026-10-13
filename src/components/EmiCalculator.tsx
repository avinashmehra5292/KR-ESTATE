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
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8B5A2B] mb-2 font-sans">
            FINANCIAL PLANNING
          </div>
          <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-[#0F172A] uppercase">
            HOME LOAN &amp; EMI CALCULATOR
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#475569] leading-relaxed font-normal">
            Calculate your monthly repayment schedules with competitive interest rates from top institutional lenders in Noida.
          </p>
        </div>

        {/* Calculator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-8 items-stretch max-w-6xl mx-auto">
          
          {/* Sliders Input Panel (Col 7) */}
          <div className="lg:col-span-7 rounded-[32px] border border-[#FDEEE4]/80 bg-white p-7 sm:p-8 lg:p-9 shadow-[0_12px_40px_rgba(200,140,100,0.12)] flex flex-col justify-between text-slate-900">
            
            {/* Loan Amount Slider */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-[13px] sm:text-sm font-bold text-[#1E293B] flex items-center gap-1.5 font-sans">
                  <IndianRupee className="h-4 w-4 text-[#D97706]" />
                  <span>Loan Amount</span>
                </label>
                <span className="font-serif-luxury text-lg sm:text-xl font-bold text-[#9A5B2D] tabular-nums">
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
                className="w-full luxury-range cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-[#64748B] mt-2 font-medium font-sans">
                <span>₹10 Lakh</span>
                <span>₹2.5 Cr</span>
                <span>₹5 Cr</span>
                <span>₹10 Cr</span>
              </div>
              {/* Quick Presets */}
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mt-3.5">
                {[50, 100, 150, 250, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setLoanAmountLakhs(amt)}
                    className={`w-full text-center py-2 sm:py-1.5 px-1 sm:px-2 text-[11px] sm:text-xs rounded-xl transition-all cursor-pointer font-sans whitespace-nowrap ${
                      loanAmountLakhs === amt
                        ? 'bg-[#F5A623] text-slate-950 font-bold border border-[#E09015] shadow-xs'
                        : 'bg-[#FFFDFB] hover:bg-orange-50 border border-[#FDE3CF] text-[#334155] font-medium'
                    }`}
                  >
                    {amt >= 100 ? `₹${amt / 100} Cr` : `₹${amt}L`}
                  </button>
                ))}
              </div>
            </div>

            {/* Interest Rate Slider */}
            <div className="mt-7 lg:mt-8">
              <div className="flex items-center justify-between mb-3">
                <label className="text-[13px] sm:text-sm font-bold text-[#1E293B] flex items-center gap-1.5 font-sans">
                  <Percent className="h-4 w-4 text-[#D97706]" />
                  <span>% Interest Rate (% p.a.)</span>
                </label>
                <span className="font-serif-luxury text-lg sm:text-xl font-bold text-[#0F172A] tabular-nums">
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
                className="w-full luxury-range cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-[#64748B] mt-2 font-medium font-sans">
                <span>6.5%</span>
                <span>8.5% (Typical)</span>
                <span>12.0%</span>
              </div>
            </div>

            {/* Tenure Slider */}
            <div className="mt-7 lg:mt-8">
              <div className="flex items-center justify-between mb-3">
                <label className="text-[13px] sm:text-sm font-bold text-[#1E293B] flex items-center gap-1.5 font-sans">
                  <Clock className="h-4 w-4 text-[#D97706]" />
                  <span>Loan Duration</span>
                </label>
                <div className="flex items-baseline gap-1 font-serif-luxury">
                  <span className="text-lg sm:text-xl font-bold text-[#0F172A] tabular-nums">
                    {tenureYears} Yrs
                  </span>
                  <span className="text-xs text-[#64748B] font-normal font-sans">
                    ({tenureYears * 12}m)
                  </span>
                </div>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={tenureYears}
                onChange={(e) => setTenureYears(Number(e.target.value))}
                className="w-full luxury-range cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-[#64748B] mt-2 font-medium font-sans">
                <span>5 Yrs</span>
                <span>15 Yrs</span>
                <span>20 Yrs</span>
                <span>30 Yrs</span>
              </div>
            </div>

          </div>

          {/* Results Summary Box (Col 5) */}
          <div className="lg:col-span-5 rounded-[32px] bg-[#18120F] p-7 sm:p-8 lg:p-9 shadow-[0_16px_48px_rgba(24,18,15,0.4)] flex flex-col justify-between text-white border border-white/[0.04]">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#F5A623] mb-2 font-sans">
                MONTHLY OUTFLOW
              </div>
              
              <div className="flex items-baseline gap-2 mb-7">
                <span className="font-serif-luxury text-3xl sm:text-[38px] lg:text-[42px] font-bold text-[#F5A623] tabular-nums tracking-tight leading-none">
                  ₹{calculation.monthlyEmi.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-[#9CA3AF] font-normal font-sans">/month</span>
              </div>

              {/* Split breakdown */}
              <div className="space-y-3.5 text-xs font-sans">
                <div className="flex justify-between text-[#9CA3AF]">
                  <span>Principal Loan:</span>
                  <span className="font-serif-luxury font-bold text-white text-sm tabular-nums">
                    {formatRupees(loanAmountLakhs * 100000)}
                  </span>
                </div>
                <div className="flex justify-between text-[#9CA3AF]">
                  <span>Total Interest Payable:</span>
                  <span className="font-serif-luxury font-bold text-[#F5A623] text-sm tabular-nums">
                    {formatRupees(calculation.totalInterest)}
                  </span>
                </div>
                <div className="flex justify-between text-[#9CA3AF]">
                  <span>Total Amount Payable:</span>
                  <span className="font-serif-luxury font-bold text-white text-sm tabular-nums">
                    {formatRupees(calculation.totalPayment)}
                  </span>
                </div>
              </div>

              {/* Visual ratio bar */}
              <div className="mt-6">
                <div className="h-[9px] w-full bg-[#2A2320] rounded-full overflow-hidden flex">
                  <div 
                    style={{ width: `${calculation.principalPercent}%` }} 
                    className="bg-[#F5A623] transition-all duration-300"
                    title={`Principal: ${calculation.principalPercent}%`}
                  />
                  <div 
                    style={{ width: `${calculation.interestPercent}%` }} 
                    className="bg-[#6366F1] transition-all duration-300"
                    title={`Interest: ${calculation.interestPercent}%`}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-sans mt-2 font-medium">
                  <span className="flex items-center gap-1.5 text-[#F5A623]">
                    <span className="w-2 h-2 rounded-full bg-[#F5A623]" />
                    Principal ({calculation.principalPercent}%)
                  </span>
                  <span className="flex items-center gap-1.5 text-[#A5B4FC]">
                    <span className="w-2 h-2 rounded-full bg-[#6366F1]" />
                    Interest ({calculation.interestPercent}%)
                  </span>
                </div>
              </div>
            </div>

            {/* KR Estate Bank Partners Assistance */}
            <div className="mt-7">
              <span className="text-[11px] font-semibold text-[#E2E8F0] block mb-2.5 font-sans">
                Pre-Approved Banking Partners with KR Estate:
              </span>
              <div className="flex flex-wrap gap-2 text-xs font-sans">
                <span className="px-3.5 py-1.5 rounded-lg bg-[#241D1A] border border-white/[0.08] text-[#E2E8F0] font-medium">HDFC Bank</span>
                <span className="px-3.5 py-1.5 rounded-lg bg-[#241D1A] border border-white/[0.08] text-[#E2E8F0] font-medium">State Bank of India</span>
                <span className="px-3.5 py-1.5 rounded-lg bg-[#241D1A] border border-white/[0.08] text-[#E2E8F0] font-medium">ICICI Bank</span>
                <span className="px-3.5 py-1.5 rounded-lg bg-[#241D1A] border border-white/[0.08] text-[#E2E8F0] font-medium">Axis Bank</span>
              </div>
              <p className="text-[11px] text-[#8A8480] mt-3.5 leading-relaxed font-sans font-normal">
                KR Estate clients receive prioritized loan sanctioning with zero processing surcharges.
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
