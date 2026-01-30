import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaStar } from 'react-icons/fa';
import * as ratingService from '../../services/ratingService';
import { toast } from 'react-toastify';

const RatingModal = ({ backendUrl, provider, onClose, onRated }) => {
  const [value, setValue] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const submit = async () => {
    setError(null);
    if (value < 1 || value > 5) {
      setError('Please select a rating between 1 and 5');
      return;
    }
    try {
      setLoading(true);
      console.log('Submitting rating', { providerId: provider?._id, value, comment });
      const res = await ratingService.rateProvider(backendUrl, provider._id, value, comment);
      setLoading(false);
      toast.success('Rating submitted');
      console.log('Rating response', res);
      onRated?.();
      onClose?.();
    } catch (err) {
      setLoading(false);
      const msg = err?.response?.data?.message || err.message || 'Failed to submit rating';
      setError(msg);
      toast.error(msg);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Rate {provider?.name || 'provider'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="flex items-center space-x-2 mb-4">
          {[1,2,3,4,5].map((i) => (
            <button
              key={i}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setValue(i)}
              className={`p-1 focus:outline-none ${i <= (hover || value) ? 'text-yellow-400' : 'text-gray-300'}`}
            >
              <FaStar className="w-6 h-6" />
            </button>
          ))}
          <div className="text-sm text-gray-600">{value ? `${value} / 5` : 'Select'}</div>
        </div>

        <textarea
          placeholder="Add a comment (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full border rounded p-2 mb-3 text-sm"
          rows={4}
        />

        {error && <div className="text-sm text-red-600 mb-2">{error}</div>}

        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
          <button onClick={submit} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;

  return createPortal(modalContent, document.body);
};

export default RatingModal;
