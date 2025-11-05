import React from 'react';
import { ShoppingList, UserProfile } from '../types';
import { useTranslation } from '../i18n';
import { useToast } from '../contexts/ToastContext';
import { XMarkIcon, TrashIcon } from './Icons';

interface ManageMembersModalProps {
    list: ShoppingList;
    members: UserProfile[];
    ownerId: string;
    currentUserId: string;
    onClose: () => void;
    onRemoveMember: (args: { listId: string; memberId: string; }) => Promise<any>;
}

export const ManageMembersModal: React.FC<ManageMembersModalProps> = ({
    list,
    members,
    ownerId,
    currentUserId,
    onClose,
    onRemoveMember,
}) => {
    const { t } = useTranslation();
    const { addToast } = useToast();
    const isOwner = ownerId === currentUserId;

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
                {/* Note: Invite functionality requires a secure backend function (RPC) to look up users by email, so it's omitted here. */}
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
