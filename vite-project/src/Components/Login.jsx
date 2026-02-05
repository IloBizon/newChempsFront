import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ email: '', doctorId: '', password: '' });
    const [twoFA, setTwoFA] = useState(['', '', '', '']);
    const [error, setError] = useState('');

    const inputRefs = [useRef(), useRef(), useRef(), useRef()];
    const correctOrder = ["Гипотензивная терапия", "Контроль гликемии", "Запись ЭКГ", "Консультация кардиолога"];
    const [caseItems, setCaseItems] = useState([...correctOrder].sort(() => Math.random() - 0.5));

    const handleMove = (index) => {
        const newItems = [...caseItems];
        const [movedItem] = newItems.splice(index, 1);
        newItems.push(movedItem);
        setCaseItems(newItems);
    };

    const handleFirstStage = () => {
        const idRegex = /^[a-zA-Z]\d{7}$/;
        if (!idRegex.test(formData.doctorId)) return setError("ID: 1 буква и 7 цифр (D1234567)");
        if (formData.password.length < 10) return setError("Пароль: 10+ символов");
        if (!formData.email.includes('@')) return setError("Введите корректный email");
        setError('');
        setStep(2);
    };

    const verifyCase = () => {
        if (JSON.stringify(caseItems) === JSON.stringify(correctOrder)) {
            setError('');
            setStep(3);
            setTimeout(() => inputRefs[0].current?.focus(), 100);
        } else {
            setError("Ошибка: неверная последовательность мер!");
        }
    };

    const handleCodeChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;

        const newCode = [...twoFA];
        newCode[index] = value.slice(-1); 
        setTwoFA(newCode);

        if (value && index < 3) {
            inputRefs[index + 1].current.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !twoFA[index] && index > 0) {
            inputRefs[index - 1].current.focus();
        }
    };

    const handleActualLogin = async () => {
        if (twoFA.join('') !== '5555') return setError("Неверный код 2FA (ожидается 5555)");

        try {
            const response = await fetch('http://127.0.0.1:8000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, password: formData.password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('refresh', data.refresh);
                localStorage.setItem('user_data', JSON.stringify(data.data));
                localStorage.setItem('is_doctor', 'true');
                navigate('/dashboard');
            } else {
                setError(data.detail || "Ошибка доступа");
                setStep(1);
            }
        } catch (err) {
            setError("Связь с сервером не установлена");
        }
    };

    return (
        <div style={s.page}>
            <div style={s.card}>
                <h2 style={s.title}>ВРАЧЕБНЫЙ ТЕРМИНАЛ</h2>
                {error && <p style={s.error}>{error}</p>}

                {step === 1 && (
                    <div style={s.col}>
                        <input placeholder="Email" style={s.input} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        <input placeholder="Врачебный ID (D1234567)" style={s.input} value={formData.doctorId} onChange={e => setFormData({ ...formData, doctorId: e.target.value })} />
                        <input type="password" placeholder="Пароль" style={s.input} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                        <button onClick={handleFirstStage} style={s.btn}>ДАЛЕЕ</button>
                    </div>
                )}

                {step === 2 && (
                    <div style={s.col}>
                        <div style={s.hintBox}>
                            <b>💡 ПОДСКАЗКА:</b> "Гипотензивная терапия", "Контроль гликемии", "Запись ЭКГ", "Консультация кардиолога"
                        </div>
                        <p style={s.caseText}>КЕЙС: Пациент 65 лет, АД 170/100, Глюкоза 8.5.</p>
                        {caseItems.map((item, i) => (
                            <div key={item} onClick={() => handleMove(i)} style={s.caseItem}>
                                <span style={s.itemNum}>{i + 1}</span> {item}
                            </div>
                        ))}
                        <button onClick={verifyCase} style={s.btn}>ПОДТВЕРДИТЬ ПРИОРЕТЕТЫ</button>
                    </div>
                )}

                {step === 3 && (
                    <div style={s.col}>
                        <p style={s.caseText}>ДВУХФАКТОРНАЯ ПРОВЕРКА (Код: 5555)</p>
                        <div style={s.row}>
                            {twoFA.map((n, i) => (
                                <input
                                    key={i}
                                    ref={inputRefs[i]}
                                    value={n}
                                    style={s.codeInput}
                                    onChange={e => handleCodeChange(i, e.target.value)}
                                    onKeyDown={e => handleKeyDown(i, e)}
                                />
                            ))}
                        </div>
                        <button onClick={handleActualLogin} style={s.btn}>ЗАВЕРШИТЬ ВХОД</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const s = {
    page: { background: '#f4f4f4', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'monospace' },
    card: { border: '2px solid #000', padding: '30px', width: '380px', background: '#fff', boxShadow: '10px 10px 0px #000' },
    title: { borderBottom: '2px solid #000', paddingBottom: '10px', textAlign: 'center', fontSize: '18px', marginBottom: '20px' },
    col: { display: 'flex', flexDirection: 'column', gap: '15px' },
    input: { padding: '12px', border: '1px solid #000', outline: 'none' },
    btn: { background: '#000', color: '#fff', border: 'none', padding: '15px', cursor: 'pointer', fontWeight: 'bold' },
    error: { background: '#ff0000', color: '#fff', padding: '10px', fontSize: '12px', textAlign: 'center' },
    hintBox: { fontSize: '11px', background: '#eee', padding: '8px', borderLeft: '3px solid #000', marginBottom: '5px' },
    caseItem: { padding: '10px', border: '1px solid #000', cursor: 'pointer', background: '#fff', display: 'flex', alignItems: 'center', gap: '10px' },
    itemNum: { background: '#000', color: '#fff', padding: '2px 6px', fontSize: '10px' },
    caseText: { fontSize: '12px', fontWeight: 'bold' },
    row: { display: 'flex', gap: '8px', justifyContent: 'center' },
    codeInput: { width: '45px', height: '50px', textAlign: 'center', border: '2px solid #000', fontSize: '22px', outline: 'none' }
};

export default Login;
