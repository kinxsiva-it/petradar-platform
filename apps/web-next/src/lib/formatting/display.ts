export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatSpecies(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export function formatStatus(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatReward(value: number | null): string | null {
  if (value === null || value <= 0) {
    return null;
  }

  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(value / 100);
}
