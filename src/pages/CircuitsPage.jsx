import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
    Plus,
    Search,
    Trash2,
    Edit2,
    Map, // Changed from MapSpace
    MapPin, // Changed from Milestone
    X,
    Save
} from 'lucide-react';

export default function CircuitsPage() {
    const [circuits, setCircuits] = useLocalStorage('circuits', []);
    const [globalPricePerMile, setGlobalPricePerMile] = useLocalStorage('globalPricePerMile', 0);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingCircuit, setEditingCircuit] = useState(null);

    // Form State
    const [name, setName] = useState('');
    const [miles, setMiles] = useState('');

    const filteredCircuits = circuits.filter(circuit =>
        circuit.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!name || !miles) return;

        if (editingCircuit) {
            setCircuits(circuits.map(c =>
                c.id === editingCircuit.id
                    ? { ...c, name, miles: parseFloat(miles) }
                    : c
            ));
        } else {
            const newCircuit = {
                id: Date.now().toString(),
                name,
                miles: parseFloat(miles),
                createdAt: new Date().toISOString()
            };
            setCircuits([...circuits, newCircuit]);
        }

        closeModal();
    };

    const openEditModal = (circuit) => {
        setEditingCircuit(circuit);
        setName(circuit.name);
        setMiles(circuit.miles.toString());
        setIsAddModalOpen(true);
    };

    const closeModal = () => {
        setIsAddModalOpen(false);
        setEditingCircuit(null);
        setName('');
        setMiles('');
    };

    const deleteCircuit = (id, circuitName) => {
        if (confirm(`¿Estás seguro de que deseas eliminar el circuito "${circuitName}" ? `)) {
            setCircuits(circuits.filter(c => c.id !== id));
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header with Global Settings */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-slate-900/40 p-6 rounded-2xl border border-white/5">
                <div>
                    <h1 className="mb-2 text-white italic tracking-tighter uppercase font-black">
                        Gestión de Circuitos
                    </h1>
                    <p className="text-slate-400 font-medium text-sm">
                        Administra los circuitos y define el Precio por Milla global.
                    </p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="bg-slate-950/50 p-2 rounded-xl flex items-center gap-3 border border-slate-800 flex-grow md:flex-grow-0">
                        <div className="bg-emerald-500/10 p-2 rounded-lg">
                            <span className="font-black text-emerald-400 text-sm">$</span>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Precio x Milla</label>
                            <input
                                type="number"
                                step="0.01"
                                value={globalPricePerMile}
                                onChange={(e) => setGlobalPricePerMile(e.target.value)}
                                className="bg-transparent text-white font-mono font-bold w-20 outline-none text-lg leading-none mt-1"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-500/20 whitespace-nowrap"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">Nuevo Circuito</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="glass-card p-6 md:p-8 border border-white/5 space-y-6">

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar circuito por nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                    />
                </div>

                {/* Circuits List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCircuits.length === 0 ? (
                        <div className="col-span-full py-20 text-center flex flex-col items-center gap-4 text-slate-600">
                            <Map size={48} className="opacity-20" /> {/* Changed from MapSpace */}
                            <p className="font-black uppercase tracking-widest text-sm">No se encontraron circuitos</p>
                        </div>
                    ) : (
                        filteredCircuits.map(circuit => (
                            <div key={circuit.id} className="group bg-slate-900/40 border border-white/5 p-6 rounded-2xl hover:bg-slate-800/60 transition-all flex flex-col justify-between h-40">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-black text-white uppercase italic tracking-tighter group-hover:text-blue-400 transition-colors">
                                            {circuit.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-2 text-slate-400 bg-slate-950/50 w-fit px-3 py-1 rounded-lg border border-white/5">
                                            <MapPin size={14} className="text-emerald-500" />
                                            <span className="font-mono font-bold text-sm text-emerald-400">{circuit.miles}</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest">Millas</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openEditModal(circuit)}
                                            className="p-2 text-slate-500 hover:text-blue-400 bg-slate-950/50 rounded-lg transition-colors border border-white/5 hover:border-blue-500/20"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => deleteCircuit(circuit.id, circuit.name)}
                                            className="p-2 text-slate-500 hover:text-red-400 bg-slate-950/50 rounded-lg transition-colors border border-white/5 hover:border-red-500/20"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Add / Edit Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#0f172a] border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl relative">
                        <button
                            onClick={closeModal}
                            className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                                {editingCircuit ? 'Editar Circuito' : 'Nuevo Circuito'}
                            </h2>
                            <p className="text-slate-400 text-sm mt-1">
                                {editingCircuit ? 'Actualiza los datos del circuito.' : 'Añade un nuevo circuito al sistema.'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Nombre del Circuito
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ej. Mohawk 1218"
                                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600 font-bold"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Distancia (Millas)
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} /> {/* Changed from Milestone */}
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={miles}
                                        onChange={(e) => setMiles(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono font-bold"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-slate-500">Millas</span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black uppercase text-xs tracking-widest rounded-2xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 mt-4"
                            >
                                <Save size={18} />
                                <span>{editingCircuit ? 'Guardar Cambios' : 'Crear Circuito'}</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
