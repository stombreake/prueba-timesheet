import React, { useState } from 'react';
import { UserPlus, Search, Trash2, Edit2, ShieldCheck, UserCircle, X } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function UserPage() {
    const [users, setUsers] = useLocalStorage('users', []);
    const [isAdding, setIsAdding] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);
    const [crews] = useLocalStorage('crews', []);
    const [newUser, setNewUser] = useState({ name: '', employeeNumber: '', position: '', payRate: '', otRate: '', crew: '' });

    const handleAddUser = (e) => {
        e.preventDefault();
        if (editingUserId) {
            const updatedUsers = users.map(u =>
                u.id === editingUserId ? { ...u, ...newUser } : u
            );
            setUsers(updatedUsers);
            setEditingUserId(null);
        } else {
            const userWithId = { ...newUser, id: Date.now().toString() };
            setUsers([...users, userWithId]);
        }
        setNewUser({ name: '', employeeNumber: '', position: '', payRate: '', otRate: '', crew: '' });
        setIsAdding(false);
    };

    const deleteUser = (id) => {
        if (confirm('¿Estás seguro de eliminar este usuario?')) {
            setUsers(users.filter(u => u.id !== id));
        }
    };

    const startEdit = (user) => {
        setNewUser({ ...user });
        setEditingUserId(user.id);
        setIsAdding(true);
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="mb-2 text-white">Gestión de Usuarios</h1>
                    <p className="text-slate-400">Agrega y administra los empleados de tu cuadrilla.</p>
                </div>
                <button
                    onClick={() => {
                        setNewUser({ name: '', employeeNumber: '', position: '', payRate: '', otRate: '', crew: '' });
                        setEditingUserId(null);
                        setIsAdding(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                    <UserPlus size={20} />
                    Nuevo Usuario
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User Card List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="glass-card p-4 flex items-center gap-4 border border-white/5 bg-white/[0.02]">
                        <Search className="text-slate-500" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o cargo..."
                            className="bg-transparent border-none outline-none text-slate-200 w-full"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {users.length === 0 ? (
                            <div className="col-span-full glass-card p-12 flex flex-col items-center justify-center text-slate-500 text-center border-2 border-dashed border-slate-800">
                                <UserCircle size={48} className="mb-4 opacity-20" />
                                <p>No hay usuarios registrados.</p>
                                <p className="text-sm mt-1">Haz clic en "Nuevo Usuario" para comenzar.</p>
                            </div>
                        ) : users.map(user => (
                            <div key={user.id} className="glass-card p-5 group flex flex-col relative overflow-hidden border border-white/5 hover:border-blue-500/30 transition-all bg-white/[0.01]">
                                <div className="absolute top-0 right-0 p-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <button
                                        onClick={() => startEdit(user)}
                                        className="p-2 bg-slate-900/80 rounded-lg text-slate-400 hover:text-blue-400 transition-colors border border-white/5"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => deleteUser(user.id)}
                                        className="p-2 bg-slate-900/80 rounded-lg text-slate-400 hover:text-red-400 transition-colors border border-white/5"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600/20 to-indigo-600/20 flex items-center justify-center text-xl font-black text-blue-400 border border-blue-500/20 relative group-hover:border-blue-500/50 transition-colors">
                                        {user.name.charAt(0)}
                                        <div className="absolute -bottom-1 -right-1 bg-blue-600 text-[8px] px-1.5 py-0.5 rounded-full text-white font-black shadow-lg">#{user.employeeNumber || '000'}</div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white leading-tight uppercase tracking-tight">{user.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-blue-400 text-[9px] font-black uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/10">{user.position}</span>
                                            {user.crew && <span className="text-emerald-400 text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/10">{user.crew}</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-auto pt-4 border-t border-white/5">
                                    <div>
                                        <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-black mb-1">Tarifa ST</p>
                                        <p className="text-lg font-black font-mono text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.1)]">${user.payRate}<span className="text-[10px] text-slate-500 ml-1">/HR</span></p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-black mb-1">Tarifa OT</p>
                                        <p className="text-lg font-black font-mono text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.1)]">${user.otRate || '-'}<span className="text-[10px] text-slate-500 ml-1">/HR</span></p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Info Card / Total counts */}
                <div className="space-y-4">
                    <div className="glass-card p-6 bg-blue-600/5 border border-blue-500/20">
                        <div className="flex items-center gap-3 text-blue-400 mb-4">
                            <ShieldCheck size={20} />
                            <h3 className="font-black uppercase tracking-widest text-sm text-gradient-blue">Total Empresa</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Empleados Activos</span>
                                <span className="text-3xl font-black text-white">{users.length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Form */}
            {isAdding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
                    <div className="glass-card w-full max-w-lg p-6 md:p-8 shadow-2xl relative my-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">
                                {editingUserId ? 'Editar Empleado' : 'Nuevo Empleado'}
                            </h2>
                            <button onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleAddUser} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Nombre Completo</label>
                                    <input
                                        required
                                        type="text"
                                        value={newUser.name}
                                        onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="Ej: Angel Rodriguez"
                                    />
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest"># Empleado</label>
                                    <input
                                        required
                                        type="text"
                                        value={newUser.employeeNumber}
                                        onChange={e => setNewUser({ ...newUser, employeeNumber: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
                                        placeholder="228"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Cargo / Posición</label>
                                    <select
                                        required
                                        value={newUser.position}
                                        onChange={e => setNewUser({ ...newUser, position: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                                    >
                                        <option value="">Elegir...</option>
                                        <option value="General foreman">General foreman</option>
                                        <option value="foreman">foreman</option>
                                        <option value="Ground Person">Ground Person</option>
                                        <option value="Trimmer">Trimmer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Cuadrilla / Equipo</label>
                                    <select
                                        value={newUser.crew}
                                        onChange={e => setNewUser({ ...newUser, crew: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                                    >
                                        <option value="">Sin Asignar</option>
                                        {crews.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Tarifa ST ($)</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        value={newUser.payRate}
                                        onChange={e => {
                                            const val = e.target.value;
                                            const ot = val ? (parseFloat(val) * 1.5).toFixed(2) : '';
                                            setNewUser({ ...newUser, payRate: val, otRate: ot });
                                        }}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Tarifa OT (1.5x)</label>
                                    <input
                                        readOnly
                                        disabled
                                        type="number"
                                        value={newUser.otRate}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-500 outline-none font-mono"
                                        placeholder="Automática"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="flex-1 px-6 py-4 rounded-2xl border border-white/5 text-slate-400 hover:bg-white/5 transition-all font-black uppercase tracking-widest text-[10px]"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl px-6 py-4 hover:shadow-2xl hover:shadow-blue-500/20 transition-all active:scale-95 uppercase tracking-widest text-[10px]"
                                >
                                    {editingUserId ? 'Actualizar Datos' : 'Registrar Empleado'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
