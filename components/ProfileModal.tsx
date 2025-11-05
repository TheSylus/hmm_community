import React, { useState } from 'react';
import { useTranslation } from '../i18n/index';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../services/supabaseClient';
import { XMarkIcon, SpinnerIcon } from './Icons';

interface ProfileModalProps {
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { addToast } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast({ message: "Passwords do not match.", type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      addToast({ message: "Password should be at least 6 characters.", type: 'error' });
      return;
    }
    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      addToast({ message: t('toast.passwordUpdateError'), type: 'error' });
    } else {
      addToast({ message: t('toast.passwordUpdated'), type: 'success' });
      setNewPassword('');
      setConfirmPassword('');
    }
    setPasswordLoading(false);
  };

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      addToast({ message: t('toast.emailUpdateError'), type: 'error' });
    } else {
      addToast({ message: t('toast.emailUpdated'), type: 'info' });
      setNewEmail('');
    }
    setEmailLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      addToast({ message: "Confirmation text does not match.", type: 'error' });
      return;
    }
    setDeleteLoading(true);
    const { error } = await supabase.functions.invoke('delete_user_account');
    setDeleteLoading(false);
    if (error) {
      addToast({ message: `${t('toast.accountDeleteError')}: ${error.message}`, type: 'error' });
    } else {
      addToast({ message: t('toast.accountDeleted'), type: 'info' });
      signOut();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
      role="dialog" aria-modal="true" aria-labelledby="profile-modal-title"
    >
      <div
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h2 id="profile-modal-title" className="text-2xl font-bold text-gray-900 dark:text-white">{t('profileModal.title')}</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700" aria-label={t('settings.closeAria')}>
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
          {/* Change Password */}
          <form onSubmit={handlePasswordUpdate} className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('profileModal.password.title')}</h3>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder={t('profileModal.password.new')} className="w-full bg-gray-100 dark:bg-gray-700 p-2 rounded-md" required />
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder={t('profileModal.password.confirm')} className="w-full bg-gray-100 dark:bg-gray-700 p-2 rounded-md" required />
            <button type="submit" disabled={passwordLoading} className="w-full flex justify-center items-center gap-2 p-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 disabled:bg-indigo-400">
              {passwordLoading && <SpinnerIcon className="w-5 h-5" />}
              {t('profileModal.password.button')}
            </button>
          </form>

          <hr className="border-gray-200 dark:border-gray-700" />

          {/* Change Email */}
          <form onSubmit={handleEmailUpdate} className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('profileModal.email.title')}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('profileModal.email.description')}</p>
            <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder={user?.email || t('profileModal.email.new')} className="w-full bg-gray-100 dark:bg-gray-700 p-2 rounded-md" required />
            <button type="submit" disabled={emailLoading} className="w-full flex justify-center items-center gap-2 p-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 disabled:bg-indigo-400">
              {emailLoading && <SpinnerIcon className="w-5 h-5" />}
              {t('profileModal.email.button')}
            </button>
          </form>

          <hr className="border-gray-200 dark:border-gray-700" />

          {/* Delete Account */}
          <div className="space-y-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">{t('profileModal.delete.title')}</h3>
            <p className="text-sm text-red-700 dark:text-red-400">{t('profileModal.delete.description')}</p>
            {!showDeleteConfirm ? (
              <button onClick={() => setShowDeleteConfirm(true)} className="w-full p-2 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700">
                {t('profileModal.delete.button')}
              </button>
            ) : (
              <div className="space-y-3 pt-2">
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">{t('profileModal.delete.confirm.description')}</p>
                <input type="text" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder={t('profileModal.delete.confirm.inputPlaceholder')} className="w-full bg-white dark:bg-gray-800 p-2 rounded-md border-red-500" />
                <button onClick={handleDeleteAccount} disabled={deleteLoading || deleteConfirm !== 'DELETE'} className="w-full flex justify-center items-center gap-2 p-2 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 disabled:bg-red-400">
                  {deleteLoading && <SpinnerIcon className="w-5 h-5" />}
                  {t('profileModal.delete.confirm.button')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};