import React, { useState } from "react";
import { calculatePayrollForMonth, approvePayrollRun } from "@/lib/payroll-actions";

interface PayrollResult {
  employeeId: string;
  month: number;
  year: number;
  baseSalary: number;
  daysPresent: number;
  totalWorkingDays: number;
  grossWage: number;
  damageDeduction: number;
  taxDeduction: number;
  ssDeduction: number;
  netWage: number;
  remainingDamageBalance: number;
  status: 'pending' | 'paid';
}

export default function PayrollPage() {
  const [payrollData, setPayrollData] = useState<PayrollResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPayPeriod, setSelectedPayPeriod] = useState("2024-04");
  const [viewingPayslip, setViewingPayslip] = useState<PayrollResult | null>(null);

  const handleRunPayroll = async () => {
    setIsLoading(true);
    // Hardcoded branch-1 for demo
    const data = await calculatePayrollForMonth("branch-1", 4, 2024);
    setPayrollData(data as any); // Cast as any if external types are still syncing
    setIsLoading(false);
  };

  const handleApprove = async () => {
    await approvePayrollRun(payrollData);
    alert("Payroll Approved & Damage Balances Updated!");
    setPayrollData([]);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-cyan-400 text-glow">PAYROLL PROCESSING</h2>
          <p className="text-slate-400">Calculate wages and manage damage deductions</p>
        </div>
        
        <div className="flex gap-4">
          <input 
            type="month" 
            value={selectedPayPeriod}
            onChange={(e) => setSelectedPayPeriod(e.target.value)}
            className="glass-panel px-4 py-3 rounded-xl focus:border-cyan-500 outline-none"
          />
          <button 
            onClick={handleRunPayroll}
            disabled={isLoading}
            className="bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-3 rounded-xl font-black transition-all"
          >
            {isLoading ? "CALCULATING..." : "RUN CALCULATIONS"}
          </button>
        </div>
      </div>

      {payrollData.length > 0 && (
        <div className="space-y-6 animate-in slide-in-from-bottom flex-1">
          <div className="glass-panel rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-900/50 border-b border-white/10 text-xs font-bold text-slate-400 uppercase">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4 text-center">Base Salary</th>
                  <th className="px-6 py-4 text-center">Gross (90%)</th>
                  <th className="px-6 py-4 text-center text-amber-400">Damage Ded.</th>
                  <th className="px-6 py-4 text-center">Net Pay</th>
                  <th className="px-6 py-4 text-center">Remaining Damage</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payrollData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-bold">{row.employeeId.split('-')[0]}...</td>
                    <td className="px-6 py-4 text-center">{row.baseSalary.toLocaleString()} Ks</td>
                    <td className="px-6 py-4 text-center text-green-400">{row.grossWage.toLocaleString()} Ks</td>
                    <td className="px-6 py-4 text-center text-amber-500 font-bold">-{row.damageDeduction.toLocaleString()} Ks</td>
                    <td className="px-6 py-4 text-center font-black text-cyan-400">{row.netWage.toLocaleString()} Ks</td>
                    <td className="px-6 py-4 text-center text-slate-500">{row.remainingDamageBalance.toLocaleString()} Ks</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setViewingPayslip(row)}
                        className="text-xs font-bold border border-white/20 px-3 py-1 rounded hover:bg-white/10"
                      >
                        VIEW PAYSLIP
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end p-4 glass-panel rounded-2xl border-t border-cyan-500/30">
             <button 
              onClick={handleApprove}
              className="px-10 py-4 bg-cyan-500 text-black font-black rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:scale-105 transition-transform"
             >
                APPROVE PAYROLL RUN
             </button>
          </div>
        </div>
      )}

      {viewingPayslip && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-10 space-y-8 border-cyan-500/50">
            <div className="flex justify-between items-start">
               <div>
                  <h3 className="text-3xl font-black text-cyan-400">PAYSLIP</h3>
                  <p className="text-slate-400 uppercase text-xs font-bold tracking-widest mt-1">Period: {selectedPayPeriod}</p>
               </div>
               <button onClick={() => setViewingPayslip(null)} className="text-slate-500 hover:text-white">✕</button>
            </div>

            <div className="space-y-4">
               <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-slate-400">Total Working Days</span>
                  <span className="font-bold">{viewingPayslip.totalWorkingDays}</span>
               </div>
               <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-slate-400">Days Present (90% Adj.)</span>
                  <span className="font-bold">{viewingPayslip.daysPresent}</span>
               </div>
               <div className="pt-4 flex justify-between text-lg">
                  <span className="font-medium">Gross Salary</span>
                  <span className="font-black text-green-400">{viewingPayslip.grossWage.toLocaleString()} Ks</span>
               </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 space-y-3">
               <div className="flex justify-between text-amber-400 font-bold">
                  <span>Damage Recovery Deduction</span>
                  <span>-{viewingPayslip.damageDeduction.toLocaleString()} Ks</span>
               </div>
               <div className="flex justify-between text-xs text-amber-500/70 border-t border-amber-500/20 pt-2">
                  <span>Outstanding Balance (Carry-over)</span>
                  <span>{viewingPayslip.remainingDamageBalance.toLocaleString()} Ks</span>
               </div>
               <p className="text-[10px] text-amber-500/50 italic">* Calculated based on 20% Gross Pay Deduction Cap.</p>
            </div>

            <div className="pt-4 text-center space-y-2">
               <p className="text-sm text-slate-500 uppercase font-bold tracking-widest">NET PAYABLE AMOUNT</p>
               <h4 className="text-5xl font-black text-white text-glow">
                  {viewingPayslip.netWage.toLocaleString()} <span className="text-xl text-cyan-400">Ks</span>
               </h4>
            </div>

            <button 
               onClick={() => window.print()} 
               className="w-full py-4 border border-cyan-500/30 rounded-2xl font-bold hover:bg-cyan-500/10 transition-colors"
            >
               PRINT PAYSLIP
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
