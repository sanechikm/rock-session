// app/admin/(auth)/login/page.tsx
// Страница входа в админку. Рендерится без каркаса (layout.tsx пропускает /admin/login).

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setLoading(false);
      // Показываем реальную причину: "Email not confirmed", "Invalid login credentials" и т.п.
      setError(
        authError.message === 'Invalid login credentials'
          ? 'Неверный email или пароль'
          : authError.message
      );
      return;
    }

    // Вход успешен: сессия записана в куки → middleware пропустит в /admin
    router.push('/admin');
    router.refresh();
  };

  return (
    <>
      <style>{LOGIN_CSS}</style>

      <div className="lg">
        <form className="lg__card" onSubmit={handleSubmit} noValidate>
          <h1 className="lg__title">RockSession Club</h1>
          <p className="lg__subtitle">Вход в админ-панель</p>

          <div className="lg__field">
            <label className="lg__label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className="lg__input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gmail.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="lg__field">
            <label className="lg__label" htmlFor="login-password">Пароль</label>
            <input
              id="login-password"
              className="lg__input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="lg__error">{error}</p>}

          <button type="submit" className="lg__submit" disabled={loading}>
            {loading ? 'Вход…' : 'Войти'}
          </button>
        </form>
      </div>
    </>
  );
}

const LOGIN_CSS = `
  .lg {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: #060606;
  }

  .lg__card {
    width: min(400px, 100%);
    padding: 40px 36px;
    background: #141414;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 14px;
  }

  .lg__title {
    margin: 0 0 6px;
    font-family: 'Tablon', 'Arial Black', sans-serif;
    font-size: 26px;
    font-weight: 400;
    text-transform: uppercase;
    color: #ffffff;
  }

  .lg__subtitle {
    margin: 0 0 32px;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    color: #8e8e93;
  }

  .lg__field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;
  }

  .lg__label {
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    color: #8e8e93;
  }

  .lg__input {
    padding: 13px 16px;
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    color: #ffffff;
    background: #060606;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    outline: none;
    transition: border-color 0.2s ease;
  }

  .lg__input:focus {
    border-color: #00c3d0;
  }

  .lg__input::placeholder {
    color: #464646;
  }

  .lg__error {
    margin: 4px 0 16px;
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    color: #ff5a5a;
  }

  .lg__submit {
    width: 100%;
    padding: 14px 24px;
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    font-weight: 500;
    color: #060606;
    background: #00c3d0;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: opacity 0.2s ease;
  }

  .lg__submit:hover:not(:disabled) {
    opacity: 0.85;
  }

  .lg__submit:disabled {
    opacity: 0.6;
  }
`;