export interface ValidationError {
  field: string;
  message: string;
}

export const validateDateRange = (start: Date, end: Date): ValidationError | null => {
  if (end <= start) {
    return {
      field: 'endDate',
      message: 'End date must be after start date',
    };
  }
  return null;
};

export const validateDuration = (durationSeconds: number): ValidationError | null => {
  if (durationSeconds <= 0) {
    return {
      field: 'duration',
      message: 'Duration must be greater than 0',
    };
  }
  if (durationSeconds > 86400) {
    return {
      field: 'duration',
      message: 'Duration cannot exceed 24 hours',
    };
  }
  return null;
};

export const validateRequired = (value: string | null | undefined, fieldName: string): ValidationError | null => {
  if (!value || value.trim() === '') {
    return {
      field: fieldName,
      message: `${fieldName} is required`,
    };
  }
  return null;
};

export const validateManualEntry = (entry: {
  type: string;
  startedAt: Date;
  endedAt: Date;
}): ValidationError[] => {
  const errors: ValidationError[] = [];

  const typeError = validateRequired(entry.type, 'type');
  if (typeError) errors.push(typeError);

  const dateError = validateDateRange(entry.startedAt, entry.endedAt);
  if (dateError) errors.push(dateError);

  const duration = Math.floor((entry.endedAt.getTime() - entry.startedAt.getTime()) / 1000);
  const durationError = validateDuration(duration);
  if (durationError) errors.push(durationError);

  return errors;
};
