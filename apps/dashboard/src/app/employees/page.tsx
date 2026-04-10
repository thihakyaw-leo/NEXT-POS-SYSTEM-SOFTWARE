"use client";

import React, { useState } from "react";

const PRODUCT_TIERS = [
  { id: "pos-lite", name: "POS Lite" },
  { id: "pos-premium", name: "POS Premium" },
  { id: "pos-enterprise", name: "POS Enterprise" },
  { id: "hr-enterprise", name: "HR Management System Enterprise" },
];

export default function EmployeesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [role, setRole] = useState("staff");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    branchId: "",
    productTier: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting:", { ...formData, role });
    // TODO: Connect to api-worker
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-cyan-400 text-glow">EMPLOYEE MANAGEMENT</h2>
          <p className="text-slate-400">Manage your workforce and service owners</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="glass-panel px-6 py-3 rounded-xl border-glow hover:bg-cyan-500/20 transition-all font-bold text-cyan-400"
        >
          + REGISTER NEW
        </button>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-900/50 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Branch / Product</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <tr className="hover:bg-white/5 transition-colors">
              <td className="px-6 py-4 font-medium">System Admin</td>
              <td className="px-6 py-4"><span className="px-3 py-1 bg-amber-500/20 text-amber-500 rounded-full text-xs font-bold border border-amber-500/30">ADMIN</span></td>
              <td className="px-6 py-4 text-slate-400">Headquarters</td>
              <td className="px-6 py-4 text-cyan-400">Online</td>
            </tr>
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold text-cyan-400">Register Employee</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Full Name</label>
                <input 
                  type="text" required
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500"
                  placeholder="Enter name..."
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Role</label>
                <select 
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  title="Select employee role"
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="owner">Owner</option>
                </select>
              </div>

              {role === 'owner' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1 text-amber-400">Service Product Tier</label>
                  <select 
                    className="w-full bg-slate-900/50 border border-amber-500/30 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500"
                    value={formData.productTier}
                    onChange={e => setFormData({...formData, productTier: e.target.value})}
                    title="Select service product tier"
                  >
                    <option value="">Select a Product...</option>
                    {PRODUCT_TIERS.map(pt => (
                      <option key={pt.id} value={pt.id}>{pt.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Branch Node</label>
                  <select 
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500"
                    value={formData.branchId}
                    onChange={e => setFormData({...formData, branchId: e.target.value})}
                    title="Select branch node"
                  >
                    <option value="branch-1">Main Branch</option>
                    <option value="branch-2">East Wing</option>
                  </select>
                </div>
              )}

              <div className="pt-4">
                <button type="submit" className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-2xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                  INITIALIZE ACCOUNT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
