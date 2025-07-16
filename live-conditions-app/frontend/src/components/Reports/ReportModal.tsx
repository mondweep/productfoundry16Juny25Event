'use client';

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Upload, MapPin, Camera, AlertTriangle } from 'lucide-react';
import { Location, CreateUserReportPayload } from '@/types';
import { useApi } from '@/hooks/useApi';
import { useAuthStore } from '@/hooks/useStore';
import toast from 'react-hot-toast';

const reportSchema = z.object({
  type: z.enum(['weather', 'fire', 'flood', 'traffic', 'other']),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  severity: z.enum(['low', 'moderate', 'high', 'extreme']),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  location?: Location;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  location,
}) => {
  const { createUserReport, isLoading } = useApi();
  const { user } = useAuthStore();
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      type: 'other',
      severity: 'moderate',
    },
  });

  const watchedType = watch('type');

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + selectedImages.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    const newImages = [...selectedImages, ...files];
    setSelectedImages(newImages);

    // Create preview URLs
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviewUrls = previewUrls.filter((_, i) => i !== index);
    
    // Revoke the old URL to prevent memory leaks
    URL.revokeObjectURL(previewUrls[index]);
    
    setSelectedImages(newImages);
    setPreviewUrls(newPreviewUrls);
  };

  const handleClose = () => {
    // Clean up preview URLs
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedImages([]);
    setPreviewUrls([]);
    reset();
    onClose();
  };

  const onSubmit = async (data: ReportFormData) => {
    if (!user) {
      toast.error('You must be logged in to create a report');
      return;
    }

    if (!location) {
      toast.error('Location is required');
      return;
    }

    const reportData: CreateUserReportPayload = {
      ...data,
      location,
      images: selectedImages.length > 0 ? selectedImages : undefined,
    };

    const result = await createUserReport(reportData);
    
    if (result) {
      toast.success('Report created successfully!');
      handleClose();
    } else {
      toast.error('Failed to create report. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div 
        className="modal-content max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Report an Issue</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          {/* Location display */}
          {location && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </span>
              </div>
            </div>
          )}

          {/* Report type */}
          <div className="form-field">
            <label className="form-label">Type of Issue</label>
            <select {...register('type')} className="form-input">
              <option value="weather">Weather</option>
              <option value="fire">Fire</option>
              <option value="flood">Flood</option>
              <option value="traffic">Traffic</option>
              <option value="other">Other</option>
            </select>
            {errors.type && (
              <p className="text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          {/* Title */}
          <div className="form-field">
            <label className="form-label">Title</label>
            <input
              type="text"
              {...register('title')}
              className="form-input"
              placeholder="Brief description of the issue"
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Severity */}
          <div className="form-field">
            <label className="form-label">Severity</label>
            <select {...register('severity')} className="form-input">
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
              <option value="extreme">Extreme</option>
            </select>
            {errors.severity && (
              <p className="text-sm text-red-600">{errors.severity.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="form-field">
            <label className="form-label">Description</label>
            <textarea
              {...register('description')}
              className="form-textarea"
              rows={4}
              placeholder="Provide detailed information about the issue, including what you observed, when it occurred, and any relevant details..."
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Image upload */}
          <div className="form-field">
            <label className="form-label">Photos (Optional)</label>
            <div className="space-y-3">
              {/* Upload button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                disabled={selectedImages.length >= 5}
              >
                <div className="flex flex-col items-center gap-2">
                  <Camera className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {selectedImages.length >= 5 
                      ? 'Maximum 5 images reached'
                      : 'Click to add photos'
                    }
                  </span>
                </div>
              </button>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />

              {/* Image previews */}
              {previewUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-20 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Context-specific tips */}
          {watchedType && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-blue-700 mb-1">Tips for {watchedType} reports:</h4>
              <ul className="text-xs text-blue-600 space-y-1">
                {watchedType === 'weather' && (
                  <>
                    <li>• Include temperature, wind conditions, and visibility</li>
                    <li>• Note if conditions are changing rapidly</li>
                  </>
                )}
                {watchedType === 'fire' && (
                  <>
                    <li>• Describe smoke color, wind direction, and size</li>
                    <li>• Note any structures or vegetation at risk</li>
                  </>
                )}
                {watchedType === 'flood' && (
                  <>
                    <li>• Estimate water depth and affected roads</li>
                    <li>• Note if water is rising or receding</li>
                  </>
                )}
                {watchedType === 'traffic' && (
                  <>
                    <li>• Include road names and direction of travel</li>
                    <li>• Estimate delay time and alternate routes</li>
                  </>
                )}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary flex-1"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1 flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner w-4 h-4"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Create Report
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};