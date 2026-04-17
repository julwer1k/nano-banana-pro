import { useState } from 'react';
import useGenerationStore from '../stores/useGenerationStore';
import useHistoryStore from '../stores/useHistoryStore';
import ImageCard from './ImageCard';
import ImageModal from './ImageModal';
import Loader from './Loader';

export default function ResultsGrid() {
  const { pendingCards, isGenerating } = useGenerationStore();
  const { items } = useHistoryStore();
  const [modalItem, setModalItem] = useState(null);

  const hasContent = items.length > 0 || isGenerating;

  return (
    <>
      {!hasContent ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-bg-card border border-border flex items-center justify-center">
              <svg className="w-7 h-7 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <p className="text-sm text-text-muted mb-1">No images yet</p>
            <p className="text-xs text-text-muted/60">Write a prompt and click Generate to start</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* Pending loaders */}
          {isGenerating && pendingCards.map((id) => <Loader key={id} />)}

          {/* Completed items */}
          {items.map((item) => (
            <ImageCard key={item.id} item={item} onExpand={setModalItem} />
          ))}
        </div>
      )}

      {/* Modal */}
      {modalItem && <ImageModal item={modalItem} onClose={() => setModalItem(null)} />}
    </>
  );
}
