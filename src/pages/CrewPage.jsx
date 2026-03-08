import React, { useState } from 'react';
import { Users as UsersIcon, Plus, Trash2, Edit2, LayoutGrid, Briefcase, Check, UserPlus, Truck, X } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function CrewPage() {
    const [crews, setCrews] = useLocalStorage('crews', []);
    const [users, setUsers] = useLocalStorage('users', []);
    const [isAdding, setIsAdding] = useState(false);
    const [editingCrewId, setEditingCrewId] = useState(null);
    const [newCrew, setNewCrew] = useState({
        name: '',
        supervisor: '',
        region: '',
        members: [],
        equipment: [{ name: 'PICK UP 4X4', id: 'PU 22146', hours: 0 }]
    });

    const supervisors = users.filter(u =>
        u.position === 'General foreman' || u.position === 'foreman'
    );

    const availableUsers = users;

    const handleAddCrew = (e) => {
        e.preventDefault();

        if (editingCrewId) {
            // Find old crew name to update users
            const oldCrew = crews.find(c => c.id === editingCrewId);
            const oldName = oldCrew?.name;

            // 1. Update the crew
            const updatedCrews = crews.map(c =>
                c.id === editingCrewId ? { ...c, ...newCrew } : c
            );
            setCrews(updatedCrews);

            // 2. Update users: 
            // - Unassign users who were in this crew but are no longer in 'newCrew.members'
            // - Assign users who are now in 'newCrew.members'
            // - Update crew name for everyone if it changed
            const updatedUsers = users.map(u => {
                const isNowMember = newCrew.members.includes(u.id);
                const wasMember = u.crew === oldName || u.crewId === editingCrewId;

                if (isNowMember) {
                    return { ...u, crew: newCrew.name, crewId: editingCrewId };
                } else if (wasMember) {
                    // Was a member but no longer is
                    return { ...u, crew: '', crewId: '' };
                }
                return u;
            });
            setUsers(updatedUsers);
            setEditingCrewId(null);
        } else {
            const crewId = Date.now().toString();

            // Final safety check: ensure none of the members are already in another crew
            const busyMembers = users.filter(u => newCrew.members.includes(u.id) && u.crewId);
            if (busyMembers.length > 0) {
                alert(`Error: Los siguientes empleados ya están en otra cuadrilla: ${busyMembers.map(u => u.name).join(', ')}`);
                return;
            }

            const crewWithId = { ...newCrew, id: crewId };
            setCrews([...crews, crewWithId]);

            const updatedUsers = users.map(u => {
                if (newCrew.members.includes(u.id)) {
                    return { ...u, crew: newCrew.name, crewId: crewId };
                }
                return u;
            });
            setUsers(updatedUsers);
        }

        setNewCrew({
            name: '',
            supervisor: '',
            region: '',
            members: [],
            equipment: [{ name: 'PICK UP 4X4', id: 'PU 22146', hours: 0 }]
        });
        setIsAdding(false);
    };

    const deleteCrew = (id, crewName) => {
        if (confirm(`¿Estás seguro de eliminar la cuadrilla "${crewName}"? Los trabajadores quedarán sin equipo.`)) {
            setCrews(crews.filter(c => c.id !== id));
            setUsers(users.map(u => (u.crew === crewName || u.crewId === id) ? { ...u, crew: '', crewId: '' } : u));
        }
    };

    const startEdit = (crew) => {
        // Members in the state are user IDs
        // However, some old records might not have IDs in 'members' list if they were created before
        // Let's ensure 'members' list reflects current users assigned to this crew
        const currentMembers = users.filter(u => u.crew === crew.name || u.crewId === crew.id).map(u => u.id);

        setNewCrew({
            ...crew,
            members: currentMembers,
            equipment: crew.equipment || [{ name: 'PICK UP 4X4', id: 'PU 22146', hours: 0 }]
        });
        setEditingCrewId(crew.id);
        setIsAdding(true);
    };

    const toggleMember = (userId) => {
        setNewCrew(prev => ({
            ...prev,
            members: prev.members.includes(userId)
                ? prev.members.filter(id => id !== userId)
                : [...prev.members, userId]
        }));
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="mb-2 text-white">Gestión de Cuadrillas</h1>
                    <p className="text-slate-400">Configura equipos completos con personal y equipo asignado.</p>
                </div>
                <button
                    onClick={() => {
                        setNewCrew({ name: '', supervisor: '', region: '', members: [], equipment: [{ name: 'PICK UP 4X4', id: 'PU 22146', hours: 0 }] });
                        setEditingCrewId(null);
                        setIsAdding(true);
                    }}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                    <Plus size={20} />
                    Nueva Cuadrilla
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                {crews.length === 0 ? (
                    <div className="col-span-full glass-card p-12 flex flex-col items-center justify-center text-slate-500 text-center border-2 border-dashed border-slate-800">
                        <LayoutGrid size={48} className="mb-4 opacity-20" />
                        <p>No hay cuadrillas registradas.</p>
                    </div>
                ) : crews.map(crew => (
                    <div key={crew.id} className="glass-card p-6 group hover:border-indigo-500/30 transition-all flex flex-col bg-white/[0.01] border border-white/5">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-indigo-600/10 rounded-xl text-indigo-400 border border-indigo-500/10">
                                <Briefcase size={24} />
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => startEdit(crew)}
                                    className="p-2 bg-slate-900/80 rounded-lg text-slate-400 hover:text-blue-400 border border-white/5"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => deleteCrew(crew.id, crew.name)}
                                    className="p-2 bg-slate-900/80 rounded-lg text-slate-400 hover:text-red-400 border border-white/5"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <h3 className="text-xl font-black text-white mb-1 uppercase tracking-tight">{crew.name}</h3>
                        <p className="text-[10px] text-slate-500 mb-4 flex items-center gap-2 uppercase tracking-widest font-black">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                            Región: {crew.region || '871'}
                        </p>

                        <div className="space-y-4 flex-grow">
                            <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Líder de Equipo</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-black text-xs uppercase border border-indigo-500/10">
                                        {crew.supervisor?.charAt(0) || '?'}
                                    </div>
                                    <span className="text-sm font-bold text-slate-200">{crew.supervisor || 'Pendiente'}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-900/50 rounded-2xl p-3 border border-white/5">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Personal</p>
                                    <p className="text-xl font-black text-white flex items-center gap-2">
                                        <UsersIcon size={16} className="text-blue-400" />
                                        {users.filter(u => u.crew === crew.name || u.crewId === crew.id).length}
                                    </p>
                                </div>
                                <div className="bg-slate-900/50 rounded-2xl p-3 border border-white/5">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Maquinaria</p>
                                    <p className="text-xl font-black text-white flex items-center gap-2">
                                        <Truck size={16} className="text-amber-400" />
                                        {crew.equipment?.length || 0}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Comprehensive Crew Creation/Editing Modal */}
            {isAdding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-slate-950/90 backdrop-blur-md animate-fade-in">
                    <div className="glass-card w-[95vw] max-w-[1600px] h-full max-h-[90vh] flex flex-col p-4 md:p-8 shadow-2xl relative border border-white/10">
                        <div className="flex justify-between items-center mb-6 flex-shrink-0">
                            <div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">
                                    {editingCrewId ? 'Editar Configuración' : 'Nueva Cuadrilla'}
                                </h2>
                                <p className="text-slate-500 text-sm">Gestiona el equipo, personal y maquinaria asignada.</p>
                            </div>
                            <button onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleAddCrew} className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-2 gap-8 overflow-y-auto lg:overflow-y-auto pr-2 custom-scrollbar">
                            <div className="flex flex-col space-y-6 lg:min-h-0">
                                <div className="glass-card p-6 bg-white/[0.02] border border-white/5 space-y-4 flex-shrink-0">
                                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                        <LayoutGrid size={14} /> Información General
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Nombre Equipo</label>
                                            <input
                                                required
                                                type="text"
                                                value={newCrew.name}
                                                onChange={e => setNewCrew({ ...newCrew, name: e.target.value })}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                placeholder="Ej: Alpha"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Región</label>
                                            <input
                                                type="text"
                                                value={newCrew.region}
                                                onChange={e => setNewCrew({ ...newCrew, region: e.target.value })}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                placeholder="871"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Supervisor Responsable</label>
                                        <select
                                            required
                                            value={newCrew.supervisor}
                                            onChange={e => setNewCrew({ ...newCrew, supervisor: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                        >
                                            <option value="">Elegir Líder...</option>
                                            {supervisors.map(s => (
                                                <option key={s.id} value={s.name}>{s.name} ({s.position})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="glass-card p-6 bg-white/[0.02] border border-white/5 flex flex-col min-h-[300px] lg:flex-1">
                                    <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 flex-shrink-0">
                                        <UserPlus size={14} /> Miembros de Cuadrilla
                                    </h4>
                                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2 min-h-0">
                                        {availableUsers.map(user => {
                                            const isOccupied = user.crewId && user.crewId !== editingCrewId;
                                            const isSelected = newCrew.members.includes(user.id);

                                            return (
                                                <label
                                                    key={user.id}
                                                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${isSelected
                                                            ? 'bg-blue-600/10 border-blue-500/30'
                                                            : isOccupied
                                                                ? 'bg-slate-900/20 border-white/5 opacity-50 cursor-not-allowed'
                                                                : 'bg-slate-900/50 border-white/5 hover:border-white/10 cursor-pointer'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-600'}`}>
                                                            {isSelected ? <Check size={14} /> : user.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-xs font-black text-slate-200">{user.name}</p>
                                                                {isOccupied && (
                                                                    <span className="text-[7px] font-black bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/10 uppercase tracking-widest">
                                                                        En: {user.crew}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">{user.position}</p>
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        disabled={isOccupied}
                                                        checked={isSelected}
                                                        onChange={() => !isOccupied && toggleMember(user.id)}
                                                    />
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col space-y-6 lg:min-h-0">
                                <div className="glass-card p-6 bg-white/[0.02] border border-white/5 flex flex-col min-h-[300px] lg:flex-1">
                                    <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 flex-shrink-0">
                                        <Truck size={14} /> Maquinaria de Cuadrilla
                                    </h4>

                                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 min-h-0">
                                        {newCrew.equipment.map((eq, idx) => (
                                            <div key={idx} className="flex gap-2 items-center group">
                                                <div className="flex-grow grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-white/5 shadow-inner">
                                                    <input
                                                        className="bg-transparent text-xs font-black text-slate-200 outline-none placeholder:text-slate-700"
                                                        placeholder="Herramienta / Maquina"
                                                        value={eq.name}
                                                        onChange={e => {
                                                            const eqCopy = [...newCrew.equipment];
                                                            eqCopy[idx].name = e.target.value;
                                                            setNewCrew({ ...newCrew, equipment: eqCopy });
                                                        }}
                                                    />
                                                    <input
                                                        className="bg-transparent text-[10px] text-amber-400/50 font-mono text-right outline-none placeholder:text-slate-700"
                                                        placeholder="ID / VIN"
                                                        value={eq.id}
                                                        onChange={e => {
                                                            const eqCopy = [...newCrew.equipment];
                                                            eqCopy[idx].id = e.target.value;
                                                            setNewCrew({ ...newCrew, equipment: eqCopy });
                                                        }}
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setNewCrew({ ...newCrew, equipment: newCrew.equipment.filter((_, i) => i !== idx) })}
                                                    className="p-3 text-red-400/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}

                                        <button
                                            type="button"
                                            onClick={() => setNewCrew({ ...newCrew, equipment: [...newCrew.equipment, { name: '', id: '', hours: 0 }] })}
                                            className="w-full py-4 border-2 border-dashed border-slate-800 rounded-2xl text-[10px] font-black text-slate-600 hover:text-white hover:border-slate-500 transition-all uppercase tracking-[0.2em]"
                                        >
                                            + Vincular Nueva Maquina
                                        </button>
                                    </div>

                                </div>

                                <div className="mt-6 pt-6 border-t border-white/5 flex gap-4 flex-shrink-0">
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
                                        {editingCrewId ? 'Guardar Cambios' : 'Crear Equipo'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
