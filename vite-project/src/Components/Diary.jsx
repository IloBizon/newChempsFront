import React, { useState, useEffect } from 'react';

const Diary = ({ onBack }) => {
    const [entries, setEntries] = useState([]);
    const [diaryRecord, setDiaryRecord] = useState({
        mark: 5, symptoms: [], intensity: 5, factors: '', measures: ''
    });

    // Поиск
    const [searchTerm, setSearchTerm] = useState('');
    const [searchDate, setSearchDate] = useState('');

    const symptomsList = ["Головная боль", "Слабость", "Головокружение", "Одышка", "Тошнота"];
    const token = localStorage.getItem('token');

    // Автономная загрузка данных
    const fetchEntries = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8000/health-diary/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setEntries(Array.isArray(data) ? data : data.results || []);
        } catch (e) {
            console.error("Ошибка загрузки архива");
        }
    };

    useEffect(() => {
        fetchEntries();
    }, []);

    const handleAddDiary = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8000/health-diary/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    mark: parseInt(diaryRecord.mark),
                    text: `Симптомы: ${diaryRecord.symptoms.join(', ')}. Интенсивность: ${diaryRecord.intensity}. Факторы: ${diaryRecord.factors}`,
                    measures_taken: diaryRecord.measures
                })
            });
            if (res.ok) {
                alert("Запись сохранена");
                setDiaryRecord({ mark: 5, symptoms: [], intensity: 5, factors: '', measures: '' });
                fetchEntries();
            }
        } catch (e) {
            alert("Ошибка сохранения");
        }
    };

    const filteredEntries = entries.filter(entry => {
        const matchesText = entry.text.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDate = searchDate ? entry.date.startsWith(searchDate) : true;
        return matchesText && matchesDate;
    });

    return (
        <div style={s.container}>
            <div style={s.headerRow}>
                <h2>Дневник самочувствия</h2>
                <button onClick={onBack} style={s.flatBtn}>Назад</button>
            </div>

            <div style={s.card}>
                <p style={s.label}>Как вы себя чувствуете? (1-10)</p>
                <div style={s.rowJc}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(m => (
                        <button key={m}
                            onClick={() => setDiaryRecord({ ...diaryRecord, mark: m })}
                            style={diaryRecord.mark === m ? s.emojiBtnActive : s.emojiBtn}>
                            {m}
                        </button>
                    ))}
                </div>

                <p style={s.label}>Симптомы:</p>
                <div style={s.checkboxGrid}>
                    {symptomsList.map(symptom => (
                        <label key={symptom} style={s.checkLabel}>
                            <input type="checkbox"
                                checked={diaryRecord.symptoms.includes(symptom)}
                                onChange={(e) => {
                                    const newSymp = e.target.checked
                                        ? [...diaryRecord.symptoms, symptom]
                                        : diaryRecord.symptoms.filter(item => item !== symptom);
                                    setDiaryRecord({ ...diaryRecord, symptoms: newSymp });
                                }}
                            /> {symptom}
                        </label>
                    ))}
                </div>
                <p style={s.label}>Принятые меры:</p>
                <textarea 
                    placeholder="Что вы предприняли? (например: выпил воды, отдохнул)" 
                    style={s.textarea}
                    value={diaryRecord.measures}
                    onChange={e => setDiaryRecord({...diaryRecord, measures: e.target.value})} 
                />

                <button onClick={handleAddDiary} style={s.btnBlack}>Записать</button>
            </div>

            <div style={s.archive}>
                <h3>Архив и поиск</h3>
                <div style={s.searchBar}>
                    <input type="text" placeholder="Поиск по тексту..." style={s.input} onChange={e => setSearchTerm(e.target.value)} />
                    <input type="date" style={s.input} onChange={e => setSearchDate(e.target.value)} />
                </div>

                <div style={s.list}>
                    {filteredEntries.map(entry => (
                        <div key={entry.id} style={s.entry}>
                            <div style={s.entryHead}>
                                <b>{new Date(entry.date).toLocaleDateString()}</b>
                                <span>Оценка: {entry.mark}</span>
                            </div>
                            <p style={s.entryBody}>{entry.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const s = {
    container: { maxWidth: '500px', margin: '0 auto' },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    card: { border: '1px solid #000', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' },
    rowJc: { display: 'flex', gap: '2px' },
    emojiBtn: { flex: 1, padding: '5px', border: '1px solid #000', background: '#fff', cursor: 'pointer' },
    emojiBtnActive: { flex: 1, padding: '5px', border: '1px solid #000', background: '#000', color: '#fff' },
    checkboxGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' },
    checkLabel: { fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' },
    btnBlack: { padding: '10px', background: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' },
    flatBtn: { background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' },
    archive: { marginTop: '30px', borderTop: '1px solid #000', paddingTop: '20px' },
    searchBar: { display: 'flex', gap: '5px', marginBottom: '15px' },
    input: { flex: 1, padding: '8px', border: '1px solid #000' },
    list: { display: 'flex', flexDirection: 'column', gap: '10px' },
    entry: { border: '1px solid #eee', padding: '10px', background: '#fcfcfc' },
    entryHead: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px solid #eee', paddingBottom: '5px' },
    entryBody: { fontSize: '13px', margin: '5px 0 0 0' },
    label: { fontSize: '13px', margin: '0' }
};

export default Diary;
