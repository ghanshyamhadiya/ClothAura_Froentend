import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const ReviewList = ({ reviews, onWriteReviewClick, canReview, productId, user }) => {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Write Review Button – Triggering the Modal */}
      {canReview && (
        <div className="text-center mb-10">
            <motion.button
                onClick={onWriteReviewClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-3 bg-black text-white px-8 py-3 rounded-full font-semibold text-base hover:bg-gray-800 transition-colors shadow-lg"
            >
                Write a Review
            </motion.button>
        </div>
      )}

      {/* Reviews Feed */}
      <div className="space-y-16">
        {reviews.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-xl text-gray-500">No reviews yet.</p>
            <p className="text-gray-400 mt-2">Be the first to share your experience!</p>
          </div>
        ) : (
          reviews.map((r, i) => (
            <motion.article
              key={r._id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="max-w-4xl mx-auto border-b pb-8" // Added a subtle border
            >
              {/* Avatar + Name + Date */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0">
                  {(r.userId && (typeof r.userId === 'object' ? r.userId.username?.[0] : null)) || user?.name?.[0] || 'A'}
                </div>

                <div>
                  {(() => {
                    const ownerId =
                      typeof r.userId === 'string'
                        ? r.userId
                        : r.userId?._id || r.userId?.id || null;
                    const isOwner = !!(ownerId && user?._id && ownerId === user._id);

                    return (
                      <>
                        <p className="font-semibold text-lg">
                          {r.userId && typeof r.userId === 'object'
                            ? r.userId.username || 'Anonymous'
                            : (r.userId || 'Anonymous')}
                          {isOwner && (
                            <span className="text-gray-500 text-sm ml-2 px-2 py-0.5 bg-gray-200 rounded-full">you</span>
                          )}
                        </p>

                        <p className="text-sm text-gray-500">
                          {new Date(r.createdAt).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    className={i < r.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}
                  />
                ))}
              </div>

              {/* Review Text */}
              <p className="text-lg text-gray-800 leading-relaxed mb-6 whitespace-pre-wrap">
                {r.content}
              </p>

              {/* Smart Media Grid */}
              {r.media?.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {r.media.map((m, mi) => (
                    <motion.div
                      key={mi}
                      whileHover={{ scale: 1.03 }}
                      className="aspect-square rounded-xl overflow-hidden shadow-md cursor-pointer relative"
                      onClick={() => window.open(m.url, '_blank')}
                    >
                      {m.type === 'image' ? (
                        <img
                          src={m.url}
                          alt="review media"
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <Video size={40} className="text-gray-500 absolute" />
                            <video
                                src={m.url}
                                className="w-full h-full object-cover opacity-70"
                                preload="metadata"
                            />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.article>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewList;