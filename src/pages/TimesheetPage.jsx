import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Calendar, FileText, Users as UsersIcon, ChevronDown, ChevronUp, Clock, Map, MapPin } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function TimesheetPage() {
    const [users] = useLocalStorage('users', []);
    const [crews] = useLocalStorage('crews', []);
    const [timesheets, setTimesheets] = useLocalStorage('timesheets', []);
    const [circuits] = useLocalStorage('circuits', []);

    // Helper to get next Saturday from current date
    const getNextSaturday = () => {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
        const daysToSaturday = (6 - dayOfWeek + 7) % 7;
        const nextSaturday = new Date(today);
        nextSaturday.setDate(today.getDate() + daysToSaturday);
        return nextSaturday.toISOString().split('T')[0];
    };

    const [selectedCrew, setSelectedCrew] = useState('');
    const [weekEnding, setWeekEnding] = useState(getNextSaturday());
    const [selectedCircuitId, setSelectedCircuitId] = useState('');
    const [milesCompleted, setMilesCompleted] = useState(0);
    const [crewEntries, setCrewEntries] = useState([]);
    const [equipment, setEquipment] = useState([{ name: 'PICK UP 4X4', id: 'PU 22146', hours: 0 }]);
    const [projectInfo] = useState({
        company: 'DUKE INDIANA',
        manager: '',
        location: 'Mohawk 1218',
        region: '871'
    });

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

    // When crew is selected, populate entries with its members and equipment
    useEffect(() => {
        if (selectedCrew) {
            const members = users.filter(u =>
                (u.crew && u.crew.trim() === selectedCrew.trim()) ||
                (u.crewId && u.crewId === selectedCrew)
            );

            setCrewEntries(members.map(m => ({
                userId: m.id,
                userName: m.name,
                employeeNumber: m.employeeNumber,
                position: m.position,
                payRate: m.payRate,
                otRate: m.otRate,
                dailyHours: Array(7).fill(0), // Now just an array of numbers
                manualDT: 0, // Option for manual Double Time if needed
                expanded: true
            })));

            const crewData = crews.find(c => c.name === selectedCrew || c.id === selectedCrew);
            if (crewData && crewData.equipment && crewData.equipment.length > 0) {
                setEquipment(crewData.equipment.map(eq => ({ ...eq, hours: 0 })));
            }
        } else {
            setCrewEntries([]);
            setEquipment([{ name: 'PICK UP 4X4', id: 'PU 22146', hours: 0 }]);
        }
    }, [selectedCrew, users, crews]);

    const updateHours = (userIndex, dayIndex, value) => {
        const newEntries = [...crewEntries];
        newEntries[userIndex].dailyHours[dayIndex] = Number(value);
        setCrewEntries(newEntries);
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

    const crewTotals = crewEntries.reduce((acc, entry) => {
        const totals = calculateUserTotals(entry);
        return {
            hours: acc.hours + totals.totalWeekly,
            cost: acc.cost + totals.cost
        };
    }, { hours: 0, cost: 0 });

    const handleSaveBatch = () => {
        if (!selectedCrew || !weekEnding) {
            alert('Selecciona una cuadrilla y fecha de cierre.');
            return;
        }

        const selectedCircuit = circuits.find(c => c.id === selectedCircuitId);
        const circuitName = selectedCircuit ? selectedCircuit.name : '';

        const newRecords = crewEntries.map(entry => {
            const totals = calculateUserTotals(entry);
            return {
                id: Date.now().toString() + entry.userId,
                userId: entry.userId,
                employeeNumber: entry.employeeNumber,
                position: entry.position,
                userName: entry.userName,
                crewName: selectedCrew,
                weekEnding,
                circuitId: selectedCircuitId,
                circuitName: circuitName,
                milesCompleted: parseFloat(milesCompleted) || 0,
                stRate: entry.payRate,
                otRate: entry.otRate,
                dailyHours: entry.dailyHours, // Save as flat array
                stHours: totals.stHours,
                otHours: totals.otHours,
                dtHours: totals.dtHours,
                equipment,
                projectInfo,
                totalHours: totals.totalWeekly,
                totalCost: totals.cost,
                timestamp: new Date().toISOString()
            };
        });

        setTimesheets([...timesheets, ...newRecords]);
        alert(`Se han guardado ${newRecords.length} reportes automatizados.`);
        setSelectedCrew('');
        setSelectedCircuitId('');
        setMilesCompleted(0);
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
                    <div className="glass-card p-6 space-y-6">
                        <div className="flex items-center gap-3 text-blue-400 mb-2">
                            <Calendar size={20} />
                            <h3 className="font-bold uppercase tracking-widest text-sm text-gradient-blue">Configuración</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Cuadrilla</label>
                                <select
                                    value={selectedCrew}
                                    onChange={e => setSelectedCrew(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                                >
                                    <option value="">Elegir equipo...</option>
                                    {crews.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Fin de Semana</label>
                                <input
                                    type="date"
                                    value={weekEnding}
                                    onChange={e => setWeekEnding(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                />
                            </div>

                            <div className="pt-4 border-t border-white/5 space-y-4">
                                <div>
                                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                                        <Map size={14} />
                                        Circuito
                                    </label>
                                    <select
                                        value={selectedCircuitId}
                                        onChange={e => setSelectedCircuitId(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                                    >
                                        <option value="">Ninguno...</option>
                                        {circuits.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>

                                {selectedCircuitId && (
                                    <div className="animate-fade-in">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-emerald-500/80 uppercase tracking-widest mb-2">
                                            <MapPin size={14} />
                                            Millas Completadas
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={milesCompleted}
                                            onChange={e => setMilesCompleted(e.target.value)}
                                            className="w-full bg-emerald-500/5 text-emerald-400 border border-emerald-500/20 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Totals Summary */}
                    <div className="glass-card p-6 border-l-4 border-emerald-500 bg-emerald-500/5">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Totales de Cuadrilla</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <span className="text-slate-400 text-[10px] font-bold uppercase">Horas Totales</span>
                                <span className="text-2xl font-black text-white">{crewTotals.hours.toFixed(1)}</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-slate-400 text-[10px] font-bold uppercase">Costo Estimado</span>
                                <span className="text-2xl font-black text-emerald-400">${crewTotals.cost.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Entry Area */}
                <div className="xl:col-span-3 space-y-6">
                    {!selectedCrew ? (
                        <div className="glass-card flex flex-col items-center justify-center p-20 text-center border-2 border-dashed border-slate-800">
                            <UsersIcon size={48} className="text-slate-700 mb-4" />
                            <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest">Selecciona una cuadrilla para comenzar</h3>
                        </div>
                    ) : crewEntries.length === 0 ? (
                        <div className="glass-card p-20 text-center border-2 border-dashed border-amber-500/20">
                            <h3 className="text-amber-500 font-bold uppercase tracking-widest">Esta cuadrilla no tiene integrantes</h3>
                            <p className="text-slate-500 text-sm mt-2">Asigna trabajadores en la sección de Usuarios o Cuadrillas.</p>
                        </div>
                    ) : (
                        <div className="glass-card overflow-x-auto">
                            <table className="w-full text-left min-w-[800px]">
                                <thead>
                                    <tr className="bg-slate-950/50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                                        <th className="p-4 w-48">Integrante</th>
                                        {days.map(day => <th key={day} className="p-4 text-center">{day}</th>)}
                                        <th className="p-4 text-center bg-blue-500/5 text-blue-400">TOTAL</th>
                                        <th className="p-4 text-center border-l border-white/5">ST/OT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {crewEntries.map((entry, uIdx) => {
                                        const totals = calculateUserTotals(entry);
                                        return (
                                            <tr key={entry.userId} className="border-b border-white/5 hover:bg-white/[0.02] group">
                                                <td className="p-4">
                                                    <p className="font-bold text-white leading-none">{entry.userName}</p>
                                                    <p className="text-[9px] text-slate-500 font-black uppercase mt-1">#{entry.employeeNumber}</p>
                                                </td>
                                                {entry.dailyHours.map((h, dIdx) => (
                                                    <td key={dIdx} className="p-1">
                                                        <input
                                                            type="number"
                                                            className="w-full bg-slate-900 border border-transparent focus:border-blue-500/50 rounded-lg text-center font-mono text-white font-bold py-2 outline-none transition-all"
                                                            value={h || ''}
                                                            placeholder="0"
                                                            onChange={e => updateHours(uIdx, dIdx, e.target.value)}
                                                        />
                                                    </td>
                                                ))}
                                                <td className="p-4 text-center">
                                                    <span className="text-lg font-black text-white">{totals.totalWeekly}</span>
                                                </td>
                                                <td className="p-4 border-l border-white/5">
                                                    <div className="flex flex-col gap-1 items-center">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-black text-slate-500 uppercase">ST:</span>
                                                            <span className="text-xs font-bold text-slate-200">{totals.stHours}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-black text-blue-500 uppercase">OT:</span>
                                                            <span className="text-xs font-bold text-blue-400">{totals.otHours}</span>
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

                    {/* Equipment Section in Batch */}
                    {selectedCrew && (
                        <div className="glass-card p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <Clock className="text-amber-400" size={18} />
                                <h3 className="font-black text-white uppercase tracking-widest text-sm">Horas de Maquinaria</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {equipment.map((eq, idx) => (
                                    <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-white/5 flex flex-col gap-3 relative group">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-xs font-bold text-white">{eq.name}</p>
                                                <p className="text-[10px] text-slate-500 font-mono italic">{eq.id}</p>
                                            </div>
                                            <button
                                                onClick={() => setEquipment(equipment.filter((_, i) => i !== idx))}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-red-400 transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 bg-slate-900 rounded-xl px-3 py-1.5 ring-1 ring-white/5">
                                            <Clock size={12} className="text-blue-500" />
                                            <input
                                                type="number"
                                                className="bg-transparent w-full text-right font-mono text-sm text-blue-400 font-bold outline-none"
                                                placeholder="Horas"
                                                value={eq.hours || ''}
                                                onChange={e => {
                                                    const newEq = [...equipment];
                                                    newEq[idx].hours = e.target.value;
                                                    setEquipment(newEq);
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={() => setEquipment([...equipment, { name: '', id: '', hours: 0 }])}
                                    className="border-2 border-dashed border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 hover:border-slate-700 hover:bg-white/[0.01] transition-all group"
                                >
                                    <Plus size={20} className="text-slate-600 group-hover:text-slate-400" />
                                    <span className="text-[10px] font-black text-slate-600 group-hover:text-slate-400 uppercase tracking-widest">Maquinaria</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
