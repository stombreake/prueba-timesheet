import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Calendar, FileText, Users as UsersIcon, ChevronDown, ChevronUp, Clock, Map, MapPin, Briefcase, X } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function TimesheetPage() {
    const [users] = useLocalStorage('users', []);
    const [crews] = useLocalStorage('crews', []);
    const [timesheets, setTimesheets] = useLocalStorage('timesheets', []);
    const [circuits] = useLocalStorage('circuits', []);
    const [globalPricePerMile] = useLocalStorage('globalPricePerMile', 0);

    // Helper to get next Saturday from current date
    const getNextSaturday = () => {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
        const daysToSaturday = (6 - dayOfWeek + 7) % 7;
        const nextSaturday = new Date(today);
        nextSaturday.setDate(today.getDate() + daysToSaturday);
        return nextSaturday.toISOString().split('T')[0];
    };

    const [weekEnding, setWeekEnding] = useState(getNextSaturday());
    const [selectedCircuitId, setSelectedCircuitId] = useState('');
    const [milesCompleted, setMilesCompleted] = useState(0);
    const [allCrewsData, setAllCrewsData] = useState({});
    const [projectInfo] = useState({
        company: 'DUKE INDIANA',
        manager: '',
        location: 'Mohawk 1218',
        region: '871'
    });
    const [externalGains, setExternalGains] = useState([
        { label: 'Árboles Removidos', amount: 0 },
        { label: 'Unidades Cobradas', amount: 0 }
    ]);

    const days = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];

    // Auto-update miles when a circuit is selected
    useEffect(() => {
        if (selectedCircuitId) {
            const circuit = circuits.find(c => c.id === selectedCircuitId);
            if (circuit) {
                setMilesCompleted(circuit.miles);
            }
        } else {
            setMilesCompleted(0);
        }
    }, [selectedCircuitId, circuits]);

    // Initialize data for all crews
    useEffect(() => {
        if (crews.length > 0 && users.length > 0) {
            const initialData = {};
            crews.forEach(crew => {
                const members = users.filter(u =>
                    (u.crew && u.crew.trim() === crew.name.trim()) ||
                    (u.crewId && u.crewId === crew.id)
                );

                initialData[crew.name] = {
                    entries: members.map(m => ({
                        userId: m.id,
                        userName: m.name,
                        employeeNumber: m.employeeNumber,
                        position: m.position,
                        payRate: m.payRate,
                        otRate: m.otRate,
                        dailyHours: Array(7).fill(0),
                        manualDT: 0
                    })),
                    machinery: (crew.equipment || []).map(eq => ({
                        ...eq,
                        dailyHours: Array(7).fill(0)
                    })),
                    collapsed: false
                };
            });
            setAllCrewsData(initialData);
        }
    }, [crews, users]);

    const updateHours = (crewName, userIndex, dayIndex, value) => {
        setAllCrewsData(prev => ({
            ...prev,
            [crewName]: {
                ...prev[crewName],
                entries: prev[crewName].entries.map((entry, idx) =>
                    idx === userIndex
                        ? { ...entry, dailyHours: entry.dailyHours.map((h, i) => i === dayIndex ? Number(value) : h) }
                        : entry
                )
            }
        }));
    };

    const updateEquipmentHours = (crewName, eqIndex, dayIndex, value) => {
        setAllCrewsData(prev => ({
            ...prev,
            [crewName]: {
                ...prev[crewName],
                machinery: prev[crewName].machinery.map((eq, idx) =>
                    idx === eqIndex
                        ? { ...eq, dailyHours: eq.dailyHours.map((h, i) => i === dayIndex ? Number(value) : h) }
                        : eq
                )
            }
        }));
    };

    const toggleCrewCollapse = (crewName) => {
        setAllCrewsData(prev => ({
            ...prev,
            [crewName]: {
                ...prev[crewName],
                collapsed: !prev[crewName].collapsed
            }
        }));
    };

    const addMachineryToCrew = (crewName) => {
        setAllCrewsData(prev => ({
            ...prev,
            [crewName]: {
                ...prev[crewName],
                machinery: [...prev[crewName].machinery, { name: '', id: '', dailyHours: Array(7).fill(0) }]
            }
        }));
    };

    const removeMachineryFromCrew = (crewName, eqIndex) => {
        setAllCrewsData(prev => ({
            ...prev,
            [crewName]: {
                ...prev[crewName],
                machinery: prev[crewName].machinery.filter((_, i) => i !== eqIndex)
            }
        }));
    };

    const updateMachineryField = (crewName, eqIndex, field, value) => {
        setAllCrewsData(prev => ({
            ...prev,
            [crewName]: {
                ...prev[crewName],
                machinery: prev[crewName].machinery.map((eq, i) => i === eqIndex ? { ...eq, [field]: value } : eq)
            }
        }));
    };

    const calculateUserTotals = (entry) => {
        const totalWeekly = entry.dailyHours.reduce((acc, h) => acc + Number(h || 0), 0);

        // Automated Logic:
        // ST is up to 40
        // OT is everything above 40 (excluding DT if manually entered)
        // For this implementation, we split ST and OT automatically.
        const stHours = Math.min(totalWeekly, 40);
        const otHours = Math.max(0, totalWeekly - 40);
        const dtHours = Number(entry.manualDT || 0);

        const cost = (stHours * Number(entry.payRate)) +
            (otHours * Number(entry.otRate)) +
            (dtHours * (Number(entry.payRate) * 2));

        return { totalWeekly, stHours, otHours, dtHours, cost };
    };

    const globalTotals = Object.values(allCrewsData).reduce((globalAcc, crewData) => {
        const crewSubTotal = crewData.entries.reduce((acc, entry) => {
            const totals = calculateUserTotals(entry);
            return {
                hours: acc.hours + totals.totalWeekly,
                cost: acc.cost + totals.cost
            };
        }, { hours: 0, cost: 0 });

        return {
            hours: globalAcc.hours + crewSubTotal.hours,
            cost: globalAcc.cost + crewSubTotal.cost
        };
    }, { hours: 0, cost: 0 });

    const totalWeeklyEarnings = (parseFloat(milesCompleted) || 0) * (parseFloat(globalPricePerMile) || 0);
    const totalExternalGainsAmount = externalGains.reduce((sum, g) => sum + (parseFloat(g.amount) || 0), 0);
    const totalRevenue = totalWeeklyEarnings + totalExternalGainsAmount;
    const profitMargin = totalRevenue > 0 ? ((totalRevenue - globalTotals.cost) / totalRevenue) * 100 : 0;

    const handleSaveBatch = () => {
        if (!weekEnding) {
            alert('Selecciona una fecha de cierre.');
            return;
        }

        const selectedCircuit = circuits.find(c => c.id === selectedCircuitId);
        const circuitName = selectedCircuit ? selectedCircuit.name : '';

        const allRecordsToSave = [];
        let revenueAssigned = false;

        Object.entries(allCrewsData).forEach(([crewName, crewData]) => {
            // Only save if the crew has some hours entered
            const hasHours = crewData.entries.some(e => e.dailyHours.some(h => Number(h) > 0));
            if (!hasHours) return;

            const crewRecords = crewData.entries.map(entry => {
                const totals = calculateUserTotals(entry);
                return {
                    id: Date.now().toString() + entry.userId + crewName,
                    userId: entry.userId,
                    employeeNumber: entry.employeeNumber,
                    position: entry.position,
                    userName: entry.userName,
                    crewName: crewName,
                    weekEnding,
                    circuitId: selectedCircuitId,
                    circuitName: circuitName,
                    milesCompleted: !revenueAssigned ? (parseFloat(milesCompleted) || 0) : 0,
                    stRate: entry.payRate,
                    otRate: entry.otRate,
                    dailyHours: entry.dailyHours,
                    stHours: totals.stHours,
                    otHours: totals.otHours,
                    dtHours: totals.dtHours,
                    equipment: crewData.machinery,
                    projectInfo,
                    externalGains: !revenueAssigned ? externalGains : [],
                    totalHours: totals.totalWeekly,
                    totalCost: totals.cost,
                    timestamp: new Date().toISOString()
                };
            });
            allRecordsToSave.push(...crewRecords);
            revenueAssigned = true;
        });

        if (allRecordsToSave.length === 0) {
            alert('No hay horas ingresadas para guardar.');
            return;
        }

        // Implementation of Overwrite Logic:
        // Filter out existing records that match the current save criteria (week, crew, and user)
        const newRecordsUserIds = allRecordsToSave.map(r => r.userId);
        const filteredExistingTimesheets = timesheets.filter(existing => {
            const isMatch = existing.weekEnding === weekEnding &&
                allRecordsToSave.some(newRec => newRec.crewName === existing.crewName && newRec.userId === existing.userId);
            return !isMatch;
        });

        setTimesheets([...filteredExistingTimesheets, ...allRecordsToSave]);
        alert(`Se han guardado y actualizado los reportes para las cuadrillas activas.`);

        // Reset only values, keep allCrewsData structure
        const resetCrewsData = {};
        Object.entries(allCrewsData).forEach(([name, data]) => {
            resetCrewsData[name] = {
                ...data,
                entries: data.entries.map(e => ({ ...e, dailyHours: Array(7).fill(0) })),
                machinery: data.machinery.map(m => ({ ...m, dailyHours: Array(7).fill(0) }))
            };
        });
        setAllCrewsData(resetCrewsData);

        setSelectedCircuitId('');
        setMilesCompleted(0);
        setExternalGains([
            { label: 'Árboles Removidos', amount: 0 },
            { label: 'Unidades Cobradas', amount: 0 }
        ]);
        setWeekEnding(getNextSaturday());
    };

    return (
        <div className="space-y-8 animate-fade-in pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="mb-2 text-white">Reporte Inteligente</h1>
                    <p className="text-slate-400">Ingresa horas diarias; el sistema calcula ST y OT automáticamente (Corte 40h).</p>
                </div>
                <button
                    onClick={handleSaveBatch}
                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all active:scale-95"
                >
                    <Save size={20} />
                    Guardar Semana
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Configuration Sidebar */}
                <div className="xl:col-span-1 space-y-6">
                    <div className="glass-panel p-6 rounded-[2rem] space-y-8 sticky top-6">
                        {/* Section 1: Datos Generales */}
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex items-center gap-3 text-blue-400 mb-2">
                                <UsersIcon size={18} className="opacity-80" />
                                <h3 className="font-black uppercase tracking-[0.2em] text-[10px] text-blue-400/80">Datos Generales</h3>
                            </div>
                            <div className="grid gap-4">
                                {/* Removed Cuadrilla Responsable selector as all crews are now shown */}
                                <div className="group">
                                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 group-focus-within:text-blue-400 transition-colors">Cierre de Semana</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-all" size={16} />
                                        <input
                                            type="date"
                                            value={weekEnding}
                                            onChange={e => setWeekEnding(e.target.value)}
                                            className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50 font-mono transition-all hover:bg-slate-900"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Seguimiento de Circuito */}
                        <div className="space-y-4 pt-6 border-t border-white/5 animate-fade-in animate-stagger-1">
                            <div className="flex items-center gap-3 text-emerald-400 mb-2">
                                <MapPin size={18} className="opacity-80" />
                                <h3 className="font-black uppercase tracking-[0.2em] text-[10px] text-emerald-400/80">Seguimiento de Circuito</h3>
                            </div>
                            <div className="grid gap-4">
                                <div>
                                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Seleccionar Circuito</label>
                                    <select
                                        value={selectedCircuitId}
                                        onChange={e => setSelectedCircuitId(e.target.value)}
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-4 py-3 text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/50 font-bold transition-all hover:bg-slate-900"
                                    >
                                        <option value="">Ninguno...</option>
                                        {circuits.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                {selectedCircuitId && (
                                    <div className="animate-fade-in">
                                        <label className="block text-[9px] font-black text-emerald-500/80 uppercase tracking-widest mb-2">Millas Completadas</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={milesCompleted || ''}
                                            placeholder="0"
                                            onChange={e => setMilesCompleted(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                            className="w-full bg-emerald-500/5 text-emerald-400 border border-emerald-500/20 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold transition-all shadow-lg shadow-emerald-500/5"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section 3: Ganancias Externas */}
                        <div className="space-y-4 pt-6 border-t border-white/5 animate-fade-in animate-stagger-2">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3 text-amber-400">
                                    <Briefcase size={18} className="opacity-80" />
                                    <h3 className="font-black uppercase tracking-[0.2em] text-[10px] text-amber-400/80">Ganancias Externas</h3>
                                </div>
                                <button
                                    onClick={() => setExternalGains([...externalGains, { label: '', amount: 0 }])}
                                    className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500 hover:text-white transition-all shadow-lg shadow-amber-500/10"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>

                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {externalGains.map((gain, idx) => (
                                    <div key={idx} className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-3 relative group hover:border-amber-500/30 transition-all">
                                        <button
                                            onClick={() => setExternalGains(externalGains.filter((_, i) => i !== idx))}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:scale-110 active:scale-90"
                                        >
                                            <X size={10} />
                                        </button>
                                        <input
                                            type="text"
                                            placeholder="Descripción..."
                                            value={gain.label}
                                            onChange={e => {
                                                const newGains = [...externalGains];
                                                newGains[idx].label = e.target.value;
                                                setExternalGains(newGains);
                                            }}
                                            className="w-full bg-transparent border-b border-slate-800 px-0 py-1 text-xs text-white font-bold outline-none focus:border-amber-500/50 transition-all"
                                        />
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-tighter mb-1 block">Monto Total $</label>
                                                <input
                                                    type="number"
                                                    value={gain.amount || ''}
                                                    placeholder="0"
                                                    onChange={e => {
                                                        const newGains = [...externalGains];
                                                        newGains[idx].amount = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                                        setExternalGains(newGains);
                                                    }}
                                                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-amber-400 outline-none font-mono font-bold focus:ring-1 focus:ring-amber-500/30"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {externalGains.length === 0 && (
                                    <div className="text-center py-8 opacity-40">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sin cargos extra</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section 4: Totals Summary */}
                        <div className="pt-6 border-t border-white/5 animate-fade-in animate-stagger-3">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[1.5rem] p-5 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Horas Totales (Global)</span>
                                    <span className="text-xl font-black text-white">{globalTotals.hours.toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Ganancia Total (Millas + Ext)</span>
                                    <span className="text-xl font-black text-blue-400">${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Costo Estimado (Global)</span>
                                    <span className="text-xl font-black text-emerald-400">${globalTotals.cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-emerald-500/10">
                                    <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Margen de Utilidad</span>
                                    <span className={`text-xl font-black ${profitMargin >= 55 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                        {profitMargin.toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="xl:col-span-3 space-y-8">
                    {Object.entries(allCrewsData).length === 0 ? (
                        <div className="glass-panel flex flex-col items-center justify-center p-32 text-center rounded-[2.5rem] border-2 border-dashed border-slate-800 animate-fade-in">
                            <div className="p-8 rounded-full bg-slate-900/50 border border-slate-800 mb-6 text-slate-700">
                                <UsersIcon size={64} strokeWidth={1} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-400 uppercase tracking-tighter mb-3">Sin Cuadrillas</h3>
                            <p className="text-slate-600 max-w-sm font-medium">Ve a la sección de **Cuadrillas** para crear equipos de trabajo.</p>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {Object.entries(allCrewsData).map(([crewName, crewData]) => (
                                <div key={crewName} className="space-y-6">
                                    <div className="glass-panel rounded-[2rem] overflow-hidden animate-fade-in border border-white/5 shadow-2xl relative">
                                        <div className="bg-slate-950/40 p-6 border-b border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20">
                                                    <UsersIcon size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-black text-white leading-tight uppercase tracking-tight">{crewName}</h3>
                                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{crewData.entries.length} Integrantes</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => toggleCrewCollapse(crewName)}
                                                className="p-2 hover:bg-white/5 rounded-xl transition-all text-slate-400 hover:text-white"
                                            >
                                                {crewData.collapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                                            </button>
                                        </div>

                                        {!crewData.collapsed && (
                                            <div className="animate-fade-in">
                                                {crewData.entries.length === 0 ? (
                                                    <div className="p-12 text-center opacity-40">
                                                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Sin integrantes asignados</p>
                                                    </div>
                                                ) : (
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left min-w-[750px]">
                                                            <thead>
                                                                <tr className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5">
                                                                    <th className="p-4 pl-6">Integrante</th>
                                                                    {days.map(d => (
                                                                        <th key={d} className="p-2 text-center text-blue-400/60">{d}</th>
                                                                    ))}
                                                                    <th className="p-4 text-center bg-blue-500/[0.03]">Total</th>
                                                                    <th className="p-4 border-l border-white/5 text-center">ST / OT</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {crewData.entries.map((entry, uIdx) => {
                                                                    const totals = calculateUserTotals(entry);
                                                                    return (
                                                                        <tr key={entry.userId} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                                                            <td className="p-4">
                                                                                <div>
                                                                                    <p className="font-bold text-white text-sm leading-none group-hover:text-blue-400 transition-colors">{entry.userName}</p>
                                                                                    <div className="flex items-center gap-2 mt-1.5">
                                                                                        <span className="text-[8px] font-black text-slate-600 bg-slate-900/50 px-1.5 py-0.5 rounded-md border border-white/5 uppercase tracking-widest">{entry.position}</span>
                                                                                        <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">#{entry.employeeNumber}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </td>
                                                                            {entry.dailyHours.map((h, dIdx) => (
                                                                                <td key={dIdx} className="p-1 px-1.5 text-center">
                                                                                    <div className="relative group/input">
                                                                                        <input
                                                                                            type="number"
                                                                                            className="w-11 h-11 bg-slate-950/50 border border-slate-800 group-hover/input:border-blue-500/50 focus:border-blue-500 rounded-xl text-center font-mono text-white font-bold text-base outline-none transition-all focus:ring-4 focus:ring-blue-500/10"
                                                                                            value={h || ''}
                                                                                            placeholder="0"
                                                                                            onChange={e => updateHours(crewName, uIdx, dIdx, e.target.value)}
                                                                                        />
                                                                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-blue-500 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                                                                    </div>
                                                                                </td>
                                                                            ))}
                                                                            <td className="p-4 text-center bg-blue-500/[0.02]">
                                                                                <span className="text-xl font-black text-white">{totals.totalWeekly}</span>
                                                                            </td>
                                                                            <td className="p-4 border-l border-white/5 bg-slate-950/20">
                                                                                <div className="flex flex-col gap-2">
                                                                                    <div className="flex items-center justify-between gap-4 min-w-[60px]">
                                                                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">ST</span>
                                                                                        <span className="text-[10px] font-black text-slate-200 bg-slate-800/50 px-1.5 py-0.5 rounded-lg border border-white/5">{totals.stHours}h</span>
                                                                                    </div>
                                                                                    <div className="flex items-center justify-between gap-4 min-w-[60px]">
                                                                                        <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">OT</span>
                                                                                        <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-lg border border-blue-500/20">{totals.otHours}h</span>
                                                                                    </div>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {!crewData.collapsed && (
                                        <div className="glass-panel p-8 rounded-[2rem] border border-white/5 shadow-xl animate-fade-in animate-stagger-1 mt-4">
                                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
                                                        <Clock size={24} />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-black text-white uppercase tracking-tight text-lg leading-tight text-amber-100">Uso de Maquinaria - {crewName}</h3>
                                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Registro de horas de equipos asignados</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left min-w-[750px]">
                                                    <thead>
                                                        <tr className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5">
                                                            <th className="p-4 pl-6">Equipo / Maquinaria</th>
                                                            {days.map(d => (
                                                                <th key={d} className="p-2 text-center text-amber-500/60">{d}</th>
                                                            ))}
                                                            <th className="p-4 text-center bg-amber-500/[0.03]">Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {crewData.machinery.map((eq, idx) => {
                                                            const totalEqHours = eq.dailyHours.reduce((acc, h) => acc + Number(h || 0), 0);
                                                            return (
                                                                <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                                                    <td className="p-4 pl-6">
                                                                        <div className="flex flex-col gap-1 min-w-0">
                                                                            <span className="text-sm font-black text-white truncate">{eq.name}</span>
                                                                            <span className="text-[10px] font-mono text-slate-500 truncate">{eq.id}</span>
                                                                        </div>
                                                                    </td>
                                                                    {eq.dailyHours.map((h, dIdx) => (
                                                                        <td key={dIdx} className="p-1 px-1.5 text-center">
                                                                            <div className="relative group/input">
                                                                                <input
                                                                                    type="number"
                                                                                    className="w-11 h-11 bg-slate-950/50 border border-slate-800 group-hover/input:border-amber-500/50 focus:border-amber-500 rounded-xl text-center font-mono text-amber-400 font-bold text-base outline-none transition-all focus:ring-4 focus:ring-amber-500/10"
                                                                                    value={h || ''}
                                                                                    placeholder="0"
                                                                                    onChange={e => updateEquipmentHours(crewName, idx, dIdx, e.target.value)}
                                                                                />
                                                                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-amber-500 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                                                            </div>
                                                                        </td>
                                                                    ))}
                                                                    <td className="p-4 text-center bg-amber-500/[0.02]">
                                                                        <span className="text-xl font-black text-white">{totalEqHours}</span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                        {crewData.machinery.length === 0 && (
                                                            <tr>
                                                                <td colSpan={10} className="py-12 text-center opacity-40">
                                                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Sin maquinaria registrada</p>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
