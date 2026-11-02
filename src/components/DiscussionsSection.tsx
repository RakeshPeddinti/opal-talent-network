import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, User, Clock, Send, Plus, X, MessageCircle, ChevronLeft } from 'lucide-react';
import { cn } from '../utils';
import { db, auth } from '../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  getDoc,
  updateDoc,
  increment
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

interface Comment {
  id: string;
  content: string;
  authorName: string;
  authorRole: string;
  createdAt: any;
}

interface Discussion {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorRole: string;
  category: string;
  createdAt: any;
  commentCount: number;
  comments?: Comment[];
}

interface DiscussionsSectionProps {
  onOpenLogin: () => void;
  user: any;
}

export const DiscussionsSection: React.FC<DiscussionsSectionProps> = ({ onOpenLogin, user }) => {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'General' });
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'discussions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Discussion[];
      setDiscussions(docs);
      setIsLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'discussions');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedDiscussion) {
      const q = query(collection(db, `discussions/${selectedDiscussion.id}/comments`), orderBy('createdAt', 'asc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const comments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Comment[];
        setSelectedDiscussion(prev => prev ? { ...prev, comments } : null);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, `discussions/${selectedDiscussion.id}/comments`);
      });
      return () => unsubscribe();
    }
  }, [selectedDiscussion?.id]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenLogin();
      return;
    }

    try {
      // If it's a simple auth user, we already have their data in the user object
      const authorName = user.displayName || user.name || 'Anonymous';
      const authorRole = user.role || 'seeker';
      const authorUid = user.uid;

      await addDoc(collection(db, 'discussions'), {
        title: newPost.title,
        content: newPost.content,
        category: newPost.category,
        authorName,
        authorRole,
        authorId: authorUid,
        createdAt: serverTimestamp(),
        commentCount: 0
      });

      setNewPost({ title: '', content: '', category: 'General' });
      setIsNewPostModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'discussions');
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenLogin();
      return;
    }

    if (!selectedDiscussion || !newComment.trim()) return;

    try {
      const authorName = user.displayName || user.name || 'Anonymous';
      const authorRole = user.role || 'seeker';
      const authorUid = user.uid;

      await addDoc(collection(db, `discussions/${selectedDiscussion.id}/comments`), {
        content: newComment,
        authorName,
        authorRole,
        authorId: authorUid,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'discussions', selectedDiscussion.id), {
        commentCount: increment(1)
      });

      setNewComment('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `discussions/${selectedDiscussion.id}/comments`);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  return (
    <section id="discussions" className="py-24 bg-brand-cream/30">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-5xl font-serif mb-4">Community Discussions</h2>
              <p className="text-brand-muted">Connect, share, and discuss with seekers and providers.</p>
            </div>
            <button 
              onClick={() => user ? setIsNewPostModalOpen(true) : onOpenLogin()}
              className="flex items-center gap-2 px-6 py-3 bg-brand-dark text-white rounded-xl hover:bg-brand-gold transition-all shadow-lg font-bold text-sm"
            >
              <Plus className="w-4 h-4" />
              New Discussion
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : selectedDiscussion ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-3xl border border-brand-gold/10 shadow-sm overflow-hidden"
            >
              <div className="p-8 border-b border-brand-gold/5">
                <button 
                  onClick={() => setSelectedDiscussion(null)}
                  className="flex items-center gap-2 text-brand-muted hover:text-brand-gold transition-colors mb-6 text-sm font-bold uppercase tracking-widest"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to List
                </button>
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-brand-gold/10 text-brand-gold text-[10px] font-bold uppercase tracking-widest rounded-full">
                    {selectedDiscussion.category}
                  </span>
                  <span className="text-xs text-brand-muted flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(selectedDiscussion.createdAt)}
                  </span>
                </div>
                <h3 className="text-3xl font-serif mb-4">{selectedDiscussion.title}</h3>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-brand-gold/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-brand-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-dark">{selectedDiscussion.authorName}</p>
                    <p className="text-[10px] uppercase tracking-widest text-brand-muted">{selectedDiscussion.authorRole}</p>
                  </div>
                </div>
                <div className="prose prose-brand max-w-none text-brand-dark/80 leading-relaxed">
                  {selectedDiscussion.content}
                </div>
              </div>

              <div className="bg-brand-cream/20 p-8">
                <h4 className="text-lg font-serif mb-6 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-brand-gold" />
                  Comments ({selectedDiscussion.comments?.length || 0})
                </h4>

                <div className="space-y-6 mb-8">
                  {selectedDiscussion.comments?.map((comment) => (
                    <div key={comment.id} className="bg-white p-6 rounded-2xl border border-brand-gold/5 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-brand-dark/5 flex items-center justify-center">
                            <User className="w-3 h-3 text-brand-muted" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-brand-dark">{comment.authorName}</p>
                            <p className="text-[8px] uppercase tracking-widest text-brand-muted">{comment.authorRole}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-brand-muted">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-brand-dark/80 leading-relaxed">{comment.content}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handlePostComment} className="relative">
                  <textarea 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full px-6 py-4 bg-white rounded-2xl border border-brand-gold/10 focus:ring-2 focus:ring-brand-gold/30 outline-none min-h-[120px] text-sm resize-none"
                    required
                  />
                  <button 
                    type="submit"
                    className="absolute bottom-4 right-4 p-3 bg-brand-gold text-white rounded-xl hover:bg-brand-dark transition-all shadow-lg"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          ) : (
            <div className="grid gap-6">
              {discussions.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-brand-gold/30">
                  <p className="text-brand-muted italic">No discussions yet. Be the first to start one!</p>
                </div>
              ) : (
                discussions.map((discussion) => (
                  <motion.div
                    key={discussion.id}
                    whileHover={{ y: -5 }}
                    onClick={() => setSelectedDiscussion(discussion)}
                    className="bg-white p-8 rounded-3xl border border-brand-gold/10 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-brand-gold/10 text-brand-gold text-[10px] font-bold uppercase tracking-widest rounded-full">
                          {discussion.category}
                        </span>
                        <span className="text-xs text-brand-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(discussion.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-brand-muted group-hover:text-brand-gold transition-colors">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-xs font-bold">{discussion.commentCount}</span>
                      </div>
                    </div>
                    <h3 className="text-2xl font-serif mb-4 group-hover:text-brand-gold transition-colors">{discussion.title}</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-gold/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-brand-gold" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-brand-dark">{discussion.authorName}</p>
                          <p className="text-[8px] uppercase tracking-widest text-brand-muted">{discussion.authorRole}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-brand-gold opacity-0 group-hover:opacity-100 transition-all">
                        Read More →
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* New Post Modal */}
      <AnimatePresence>
        {isNewPostModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewPostModalOpen(false)}
              className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-10">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-3xl font-serif">Start a Discussion</h3>
                  <button onClick={() => setIsNewPostModalOpen(false)} className="p-2 hover:bg-brand-cream rounded-full transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleCreatePost} className="space-y-6">
                  <div>
                    <label className="block text-xs uppercase tracking-widest font-bold mb-2 text-brand-muted">Category</label>
                    <select 
                      value={newPost.category}
                      onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                      className="w-full px-6 py-4 bg-brand-cream/50 rounded-2xl border-none focus:ring-2 focus:ring-brand-gold/30 outline-none text-sm appearance-none"
                    >
                      <option value="General">General</option>
                      <option value="Advice">Advice</option>
                      <option value="Feedback">Feedback</option>
                      <option value="Question">Question</option>
                      <option value="Success Story">Success Story</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest font-bold mb-2 text-brand-muted">Title</label>
                    <input 
                      type="text" 
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                      className="w-full px-6 py-4 bg-brand-cream/50 rounded-2xl border-none focus:ring-2 focus:ring-brand-gold/30 outline-none text-sm"
                      placeholder="What's on your mind?"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest font-bold mb-2 text-brand-muted">Content</label>
                    <textarea 
                      value={newPost.content}
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                      className="w-full px-6 py-4 bg-brand-cream/50 rounded-2xl border-none focus:ring-2 focus:ring-brand-gold/30 outline-none text-sm min-h-[200px] resize-none"
                      placeholder="Share your thoughts..."
                      required
                    />
                  </div>
                  {error && <p className="text-xs text-red-500">{error}</p>}
                  <button 
                    type="submit"
                    className="w-full py-5 bg-brand-gold text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-brand-dark transition-all shadow-xl"
                  >
                    Post Discussion
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
