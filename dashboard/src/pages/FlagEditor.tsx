/**
 * FlagEditor Component
 *
 * Create and edit feature flag configurations.
 *
 * Design Principle: Suggestions beat diagnoses.
 * Design Principle: Validate before you compute.
 * Design Principle: Intentional restraint — show less by default.
 */
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import type { Environment, FlagConfig } from '@jikken/shared';
import { PATTERNS } from '@jikken/shared';
import { flagStore } from '@/store/flagStore';

interface FlagFormValues {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rollout_percentage: number;
  environment: Environment;
}

const DEFAULT_VALUES: FlagFormValues = {
  id: '',
  name: '',
  description: '',
  enabled: true,
  rollout_percentage: 100,
  environment: 'development',
};

/** Turn a bad flag-id input into a valid suggestion — "Try X" beats "Error: Y". */
export function suggestFlagId(input: string): string {
  return input
    // Insert a hyphen at camelCase boundaries: "DarkMode" -> "Dark-Mode"
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    // Anything that isn't a-z, 0-9, or hyphen becomes a hyphen.
    .replace(/[^a-z0-9-]+/g, '-')
    // Squash repeats and trim.
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function FlagEditor() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const flagId = params.id ?? 'new';
  const isNew = flagId === 'new';

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loaded, setLoaded] = useState(isNew);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    trigger,
    formState: { errors, isValid },
  } = useForm<FlagFormValues>({
    mode: 'onChange',
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    flagStore.getFlag(flagId).then((flag) => {
      if (cancelled || !flag) return;
      reset({
        id: flag.id,
        name: flag.name,
        description: flag.description ?? '',
        enabled: flag.enabled,
        rollout_percentage: flag.rollout_percentage,
        environment: flag.environment,
      });
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [flagId, isNew, reset]);

  useEffect(() => {
    // Compute isValid on mount so "Save" starts correctly disabled/enabled.
    trigger();
  }, [trigger]);

  const rolloutValue = watch('rollout_percentage');
  const idValue = watch('id');

  const handleSave = async (formData: FlagFormValues) => {
    const existing = isNew ? null : await flagStore.getFlag(flagId);
    const now = new Date().toISOString();
    const config: FlagConfig = {
      id: formData.id,
      name: formData.name,
      description: formData.description || undefined,
      enabled: formData.enabled,
      rollout_percentage: Number(formData.rollout_percentage),
      environment: formData.environment,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    };
    await flagStore.saveFlag(config);
    navigate('/flags');
  };

  const idError = errors.id?.message;
  const showSuggestion = typeof idError === 'string' && idError.toLowerCase().includes('lowercase');

  if (!loaded) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-6">{isNew ? 'New Flag' : 'Edit Flag'}</h2>

      <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
        {/* Flag ID — Required */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Flag ID <span className="text-red-500">*</span>
          </label>
          <input
            {...register('id', {
              required: 'Flag ID is required',
              pattern: {
                value: PATTERNS.FLAG_ID,
                message: 'Use lowercase letters, numbers, and hyphens only',
              },
            })}
            disabled={!isNew}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="dark-mode"
          />
          {errors.id && <p className="text-sm text-red-600 mt-1">{errors.id.message}</p>}
          {showSuggestion && (
            <p className="text-xs text-gray-500 mt-1">
              Tip: Try "{suggestFlagId(idValue) || 'dark-mode'}" instead of "{idValue}"
            </p>
          )}
        </div>

        {/* Display Name — Required */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Display Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('name', { required: 'Name is required' })}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            placeholder="Dark Mode Toggle"
          />
          {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
        </div>

        {/* Rollout Percentage — Required */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Rollout Percentage <span className="text-gray-500">(0–100%)</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            {...register('rollout_percentage', {
              required: 'Rollout percentage is required',
              min: 0,
              max: 100,
              valueAsNumber: true,
            })}
            className="w-full"
          />
          <div className="text-right text-sm font-medium mt-1">{rolloutValue ?? 100}%</div>
        </div>

        {/* Environment — Dropdown */}
        <div>
          <label className="block text-sm font-medium mb-1">Environment</label>
          <select
            {...register('environment')}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="development">Development</option>
            <option value="staging">Staging</option>
            <option value="production">Production</option>
          </select>
        </div>

        {/* Description — Optional */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Description <span className="text-gray-500">(optional)</span>
          </label>
          <textarea
            {...register('description')}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Explain what this flag controls"
          />
        </div>

        {/* Advanced Settings — Collapsed by default */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showAdvanced ? '▾ Hide advanced settings' : '▸ Show advanced settings'}
          </button>

          {showAdvanced && (
            <div className="mt-3 p-4 bg-gray-50 rounded space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Audience Rules <span className="text-gray-500">(optional)</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Target specific user segments, countries, or email domains
                </p>
                {/* Audience rule builder would go here */}
                <div className="text-sm text-gray-400 italic">
                  Audience rule builder — add rules to target specific users
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/flags')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isValid}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Flag
          </button>
        </div>
      </form>
    </div>
  );
}
