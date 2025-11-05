import React, { useState } from 'react';
import { ShoppingList, UserProfile } from '../types';
import { useTranslation } from '../i18n';
import { useToast } from '../contexts/ToastContext';
import { XMarkIcon, TrashIcon, SpinnerIcon, UserPlusIcon } from './Icons';

interface ManageMembersModalProps {
    list: ShoppingList;
    members: UserProfile[];
    ownerId: string;
    currentUserId: string;
    onClose: () => void;
    onRemoveMember: (args: { listId: string; memberId: string; }) => Promise<any>;
    onAddMember: (args: { listId: string; email: string; }) => Promise<any>;
}

export const ManageMembersModal: React.FC<ManageMembersModalProps> = ({
    list,
    members,
    ownerId,
    currentUserId,
    onClose,
    onRemoveMember,
    onAddMember,
}) => {
    const { t } = useTranslation();
    const { addToast } = useToast();
    const isOwner = ownerId === currentUserId;

    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);

    const handleRemove = async (member: UserProfile) => {
        if (window.confirm(t('manageMembers.confirm.remove', { email: member.email }))) {
            try {
                await onRemoveMember({ listId: list.id, memberId: member.id });
                addToast({ message: t('toast.memberRemoved'), type: 'success' });
            } catch (error) {
                addToast({ message: t('toast.memberRemoveError'), type: 'error' });
            }
        }
    };
    
    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim() || !isOwner) return;

        setIsInviting(true);
        try {
            await onAddMember({ listId: list.id, email: inviteEmail.trim() });
            addToast({ message: t('toast.memberInvited'), type: 'success' });
            setInviteEmail('');
        } catch (error: any) {
            let message = t('toast.memberInviteError');
            if (error?.message?.includes('ALREADY_MEMBER')) {
                message = t('toast.memberAlreadyExists');
            } else if (error?.message?.includes('USER_NOT_FOUND')) {
                message = t('toast.userNotFound');
            }
            addToast({ message, type: 'error' });
            console.error(error);
        } finally {
            setIsInviting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={onClose}
        >
            <div
                className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('manageMembers.title')}</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                
                {isOwner && (
                    <form onSubmit={handleInvite} className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
                        <h3 className="font-semibold text-gray-700 dark:text-gray-300">{t('manageMembers.invite.title')}</h3>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                                placeholder={t('manageMembers.invite.placeholder')}
                                className="flex-grow bg-gray-100 dark:bg-gray-700 p-2 rounded-md"
                                required
                                disabled={isInviting}
                            />
                            <button type="submit" disabled={isInviting || !inviteEmail.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold flex items-center gap-2 disabled:bg-indigo-400">
                                {isInviting ? <SpinnerIcon className="w-5 h-5"/> : <UserPlusIcon className="w-5 h-5"/>}
                                <span>{t('manageMembers.invite.button')}</span>
                            </button>
                        </div>
                    </form>
                )}

                <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                    {members.map(member => (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700/50 rounded-md">
                            <div>
                                <p className="font-semibold text-gray-800 dark:text-gray-200">{member.email}</p>
                                {member.id === ownerId && (
                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{t('manageMembers.owner')}</span>
                                )}
                            </div>
                            {isOwner && member.id !== ownerId && (
                                <button
                                    onClick={() => handleRemove(member)}
                                    className="p-2 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50 rounded-full transition-colors"
                                    title={t('manageMembers.remove')}
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                 <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <button 
                        onClick={onClose}
                        className="w-full px-10 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition-colors"
                    >
                        {t('settings.button.done')}
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fadeIn 0.2s ease-out; }
            `}</style>
        </div>
    );
};