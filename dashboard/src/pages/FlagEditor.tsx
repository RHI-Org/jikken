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
import { Plus, Trash2 } from 'lucide-react';
import type { AudienceRule, Environment, FlagConfig } from '@jikken/shared';
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

type RuleType = AudienceRule['type'];
type RuleOperator = AudienceRule['operator'];

interface EditableAudienceRule {
  type: RuleType;
  operator: RuleOperator;
  value: string;
}

const RULE_TYPES: { value: RuleType; label: string }[] = [
  { value: 'segment', label: 'Segment' },
  { value: 'country', label: 'Country' },
  { value: 'email_domain', label: 'Email domain' },
  { value: 'user_id', label: 'User ID' },
  { value: 'plan_tier', label: 'Plan tier' },
  { value: 'income_band', label: 'Income band' },
  { value: 'age_band', label: 'Age band' },
  { value: 'region', label: 'Region' },
];

const RULE_OPERATORS: { value: RuleOperator; label: string }[] = [
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'does not equal' },
  { value: 'contains', label: 'contains' },
  { value: 'in_list', label: 'is one of' },
];

const emptyRule = (): EditableAudienceRule => ({ type: 'segment', operator: 'equals', value: '' });

function toEditableRule(rule: AudienceRule): EditableAudienceRule {
  return { ...rule, value: Array.isArray(rule.value) ? rule.value.join(', ') : rule.value };
}

function toAudienceRule(rule: EditableAudienceRule): AudienceRule {
  const value = rule.operator === 'in_list'
    ? rule.value.split(',').map((item) => item.trim()).filter(Boolean)
    : rule.value.trim();
  return { type: rule.type, operator: rule.operator, value };
}

function ruleDescription(rule: EditableAudienceRule): string {
  const type = RULE_TYPES.find((option) => option.value === rule.type)?.label ?? rule.type;
  const operator = RULE_OPERATORS.find((option) => option.value === rule.operator)?.label ?? rule.operator;
  const values = rule.operator === 'in_list'
    ? rule.value.split(',').map((item) => item.trim()).filter(Boolean).join(', ')
    : rule.value.trim();
  return `${type} ${operator} ${values ? `“${values}”` : '…'}`;
}

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
  const [audienceRules, setAudienceRules] = useState<EditableAudienceRule[]>([]);

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
      setAudienceRules((flag.audience_rules ?? []).map(toEditableRule));
      if ((flag.audience_rules?.length ?? 0) > 0) setShowAdvanced(true);
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
  const rulesValid = audienceRules.every((rule) => rule.value.trim().length > 0);

  const updateRule = (index: number, patch: Partial<EditableAudienceRule>) => {
    setAudienceRules((current) => current.map((rule, ruleIndex) => (
      ruleIndex === index ? { ...rule, ...patch } : rule
    )));
  };

  const handleSave = async (formData: FlagFormValues) => {
    if (!rulesValid) return;
    const existing = isNew ? null : await flagStore.getFlag(flagId);
    const now = new Date().toISOString();
    const config: FlagConfig = {
      id: formData.id,
      name: formData.name,
      description: formData.description || undefined,
      enabled: formData.enabled,
      rollout_percentage: Number(formData.rollout_percentage),
      audience_rules: audienceRules.map(toAudienceRule),
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
                <div className="space-y-3">
                  {audienceRules.map((rule, index) => (
                    <div key={index} className="rounded-lg border border-gray-200 bg-white p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Rule {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => setAudienceRules((current) => current.filter((_, ruleIndex) => ruleIndex !== index))}
                          aria-label={`Remove rule ${index + 1}`}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-500 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Remove
                        </button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1.2fr]">
                        <div>
                          <label htmlFor={`rule-${index}-type`} className="sr-only">Rule {index + 1} attribute</label>
                          <select
                            id={`rule-${index}-type`}
                            aria-label={`Rule ${index + 1} attribute`}
                            value={rule.type}
                            onChange={(event) => updateRule(index, { type: event.target.value as RuleType })}
                            className="w-full rounded border border-gray-300 bg-white px-2 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          >
                            {RULE_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label htmlFor={`rule-${index}-operator`} className="sr-only">Rule {index + 1} operator</label>
                          <select
                            id={`rule-${index}-operator`}
                            aria-label={`Rule ${index + 1} operator`}
                            value={rule.operator}
                            onChange={(event) => updateRule(index, { operator: event.target.value as RuleOperator })}
                            className="w-full rounded border border-gray-300 bg-white px-2 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          >
                            {RULE_OPERATORS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label htmlFor={`rule-${index}-value`} className="sr-only">Rule {index + 1} value</label>
                          <input
                            id={`rule-${index}-value`}
                            aria-label={`Rule ${index + 1} value`}
                            value={rule.value}
                            onChange={(event) => updateRule(index, { value: event.target.value })}
                            placeholder={rule.operator === 'in_list' ? 'US, CA, UK' : 'Enter a value'}
                            className={`w-full rounded border px-2 py-2 text-sm focus:ring-2 ${rule.value.trim() ? 'border-gray-300 focus:border-blue-500 focus:ring-blue-100' : 'border-red-300 focus:border-red-500 focus:ring-red-100'}`}
                          />
                        </div>
                      </div>
                      {!rule.value.trim() && <p className="mt-1 text-xs text-red-600">Enter a value for this rule.</p>}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => setAudienceRules((current) => [...current, emptyRule()])}
                    className="inline-flex items-center gap-1.5 rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-blue-400 hover:text-blue-700"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add audience rule
                  </button>

                  {audienceRules.length > 0 && (
                    <div className="rounded border border-blue-100 bg-blue-50 p-3 text-xs text-blue-900" aria-label="Audience rule preview">
                      <div className="font-semibold">All rules must match (AND)</div>
                      <div className="mt-1 leading-5">{audienceRules.map(ruleDescription).join(' AND ')}</div>
                    </div>
                  )}
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
            disabled={!isValid || !rulesValid}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Flag
          </button>
        </div>
      </form>
    </div>
  );
}
