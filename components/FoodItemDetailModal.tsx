import React, { useState, useMemo, useCallback } from 'react';
import { FoodItem, Like, CommentWithProfile } from '../types';
import { useTranslation } from '../i18n/index';
import { XMarkIcon, PencilIcon, HeartIcon, TrashIcon, BookmarkSquareIcon } from './Icons';
import { FoodItemDetailView } from './FoodItemDetailView';
import { User } from '@supabase/supabase-js';

interface FoodItemDetailModalProps {
  item: FoodItem;
  likes: Like[];
  comments: CommentWithProfile[];
  currentUser: User | null;
  onClose: () => void;
  onEdit: (id: string) => void;
  onImageClick: (imageUrl: string) => void;
  onToggleLike: (foodItemId: string) => void;
  onAddComment: (foodItemId: string, content: string) => void;
  onDeleteComment: (commentId: string) => void;
  onAddToCollection: (item: FoodItem) => void;
}

const CommentSection: React.FC<{
    comments: CommentWithProfile[];
    currentUser: User | null;
    onAddComment: (content: string) => void;
    onDeleteComment: (commentId: string) => void;
}> = ({ comments, currentUser, onAddComment, onDeleteComment }) => {
    const { t } = useTranslation();
    const [newComment, setNewComment] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim()) {
            onAddComment(newComment.trim());
            setNewComment('');
        }
    };

    const getInitials = (name?: string | null) => {
        if (!name) return '?';
        const parts = name.replace(/[^a-zA-Z\s]/g, ' ').split(' ').filter(Boolean);
        if (parts.length > 1 && parts[0] && parts[parts.length -1]) {
            return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
        }
        if (parts.length === 1 && parts[0]) {
            return parts[0].substring(0, 2).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const getDisplayName = (comment: CommentWithProfile) => {
        return comment.profiles?.display_name || 'Anonymous';
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('detail.commentsTitle')} ({comments.length})</h3>
            <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
                {comments.length > 0 ? comments.map(comment => (
                    <div key={comment.id} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 flex-shrink-0">
                            {getInitials(comment.profiles?.display_name)}
                        </div>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                            <div className="flex justify-between items-center">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {getDisplayName(comment)}
                                </p>
                                {currentUser?.id === comment.user_id && (
                                    <button onClick={() => onDeleteComment(comment.id)} className="text-gray-400 hover:text-red-500">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{comment.content}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right">
                                {new Date(comment.created_at).toLocaleString()}
                            </p>
                        </div>
                    </div>
                )) : (
                     <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">{t('detail.noComments')}</p>
                )}
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={t('detail.addCommentPlaceholder')}
                    className="flex-1 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white p-2"
                />
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition-colors disabled:bg-indigo-400" disabled={!newComment.trim()}>
                    {t('detail.sendComment')}
                </button>
            </form>
        </div>
    );
};


export const FoodItemDetailModal: React.FC<FoodItemDetailModalProps> = ({ 
  item, likes, comments, currentUser, onClose, onEdit, onImageClick, onToggleLike, onAddComment, onDeleteComment, onAddToCollection
}) => {
  const { t } = useTranslation();
  
  const hasUserLiked = useMemo(() => {
      return !!currentUser && likes.some(l => l.user_id === currentUser.id);
  }, [likes, currentUser]);

  const handleEditClick = () => {
    onEdit(item.id);
  };
  
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative bg-white dark:bg-gray-900 p-6 rounded-lg shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-6">
            <FoodItemDetailView item={item} onImageClick={onImageClick} />
            
            {item.isPublic && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700/50">
                    <CommentSection
                        comments={comments}
                        currentUser={currentUser}
                        onAddComment={(content) => onAddComment(item.id, content)}
                        onDeleteComment={onDeleteComment}
                    />
                </div>
            )}
        </div>
        <div className="mt-6 flex flex-col sm:flex-row justify-end items-center gap-4 border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex-1 flex items-center gap-4">
            {item.isPublic && (
                <button 
                    onClick={() => onToggleLike(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-colors ${hasUserLiked ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'}`}
                >
                    <HeartIcon className="w-5 h-5" filled={hasUserLiked} />
                    <span>{likes.length}</span>
                </button>
            )}
          </div>
          <button onClick={onClose} className="w-full sm:w-auto px-6 py-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-md font-semibold transition-colors">{t('modal.shared.close')}</button>
          {item.user_id === currentUser?.id && (
            <>
              <button onClick={() => onAddToCollection(item)} className="w-full sm:w-auto px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2">
                  <BookmarkSquareIcon className="w-5 h-5" />
                  <span>{t('collection.addTo')}</span>
              </button>
              <button onClick={handleEditClick} className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                  <PencilIcon className="w-5 h-5" />
                  <span>{t('form.editTitle')}</span>
              </button>
            </>
          )}
        </div>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label={t('settings.closeAria')}
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
         <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            .animate-fade-in { animation: fadeIn 0.2s ease-out; }
            .pr-2.-mr-2::-webkit-scrollbar { width: 8px; }
            .pr-2.-mr-2::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
            .dark .pr-2.-mr-2::-webkit-scrollbar-track { background: #374151; }
            .pr-2.-mr-2::-webkit-scrollbar-thumb { background: #9ca3af; border-radius: 4px; }
            .dark .pr-2.-mr-2::-webkit-scrollbar-thumb { background: #4b5563; }
            .pr-2.-mr-2::-webkit-scrollbar-thumb:hover { background: #6b7280; }
            .dark .pr-2.-mr-2::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
          `}</style>
      </div>
    </div>
  );
};