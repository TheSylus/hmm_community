import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useTranslation } from '../i18n';
import { SpinnerIcon, UserGroupIcon } from './Icons';

export const Auth: React.FC = () => {
    const { t } = useTranslation();
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [hasInvite, setHasInvite] = useState(false);

    useEffect(() => {
        // Check for pending invite
        const pendingInvite = localStorage.getItem('pending_household_invite');
        if (pendingInvite) {
            setHasInvite(true);
        }
    }, []);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        const credentials = { email, password };
        const { error } = isSignUp
            ? await supabase.auth.signUp(credentials)
            : await supabase.auth.signInWithPassword(credentials);

        if (error) {
            setError(error.message);
        } else {
            if (isSignUp) {
                setMessage(t('auth.magicLinkSuccess'));
            }
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl relative overflow-hidden">
                
                {hasInvite && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 border-b border-indigo-100 dark:border-indigo-800 -mx-8 -mt-8 mb-6 p-4 flex items-center justify-center gap-3 text-indigo-700 dark:text-indigo-200 animate-pulse">
                        <UserGroupIcon className="w-6 h-6" />
                        <p className="text-sm font-semibold">
                            {isSignUp ? "Registriere dich, um beizutreten!" : "Melde dich an, um beizutreten!"}
                        </p>
                    </div>
                )}

                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-green-500 dark:from-indigo-400 dark:to-green-400 mb-6 text-center">
                    {t('header.title')}
                </h1>

                <form onSubmit={handleAuth} className="space-y-6">
                    <input
                        type="email"
                        placeholder={t('auth.emailPlaceholder')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3 transition"
                    />
                    <input
                        type="password"
                        placeholder={t('auth.passwordPlaceholder')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-3 transition"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-md transition-colors text-lg disabled:bg-indigo-400 dark:disabled:bg-gray-600"
                    >
                        {loading && <SpinnerIcon className="w-6 h-6" />}
                        {isSignUp ? t('auth.signUp') : t('auth.signIn')}
                    </button>
                </form>

                {error && <p className="mt-4 text-center text-red-500 dark:text-red-400">{error}</p>}
                {message && <p className="mt-4 text-center text-green-600 dark:text-green-400">{message}</p>}

                <div className="mt-6 text-center">
                    <button
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError(null);
                            setMessage(null);
                        }}
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                        {isSignUp ? t('auth.toggle.signIn') : t('auth.toggle.signUp')}
                    </button>
                </div>
            </div>
        </div>
    );
};