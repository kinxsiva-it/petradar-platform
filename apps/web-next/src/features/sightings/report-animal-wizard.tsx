'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';

import { PrivateLocationPicker } from '../../components/map/private-location-picker';
import { PhotoPicker } from '../../components/uploads/photo-picker';
import { ApiClientError } from '../../lib/api/http-client';
import { formatStatus } from '../../lib/formatting/display';
import { routes } from '../../lib/routes';
import { useAuth } from '../auth/use-auth';
import { createSighting, uploadSightingPhotos } from './sightings-api';
import type { AnimalCondition, AnimalSpecies, CollarStatus, UrgencyLevel } from './sighting-types';

type Step = 1 | 2 | 3;
interface ReportForm { collarStatus: CollarStatus; color: string; condition: '' | AnimalCondition; count: string; description: string; latitude: string; locationConfirmed: boolean; longitude: string; pattern: string; seenAt: string; species: '' | AnimalSpecies; urgency: '' | UrgencyLevel; }
const initialForm: ReportForm = { collarStatus: 'UNKNOWN', color: '', condition: '', count: '1', description: '', latitude: '', locationConfirmed: false, longitude: '', pattern: '', seenAt: '', species: '', urgency: '' };

export function ReportAnimalWizard() {
  const auth = useAuth();
  const [form, setForm] = useState(initialForm);
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);

  function next() {
    const message = step === 1 ? validateDetails(form) : validateLocation(form);
    if (message) { setError(message); return; }
    setError(''); setStep(step === 1 ? 2 : 3);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = validateDetails(form) ?? validateLocation(form);
    if (message || !form.species || !form.condition || !form.urgency) { setError(message ?? 'Complete all required fields.'); return; }
    setSubmitting(true); setError(''); setUploadError('');
    let sightingId = createdId;
    try {
      if (!sightingId) {
        const created = await createSighting(auth.authenticatedRequest, {
          collarStatus: form.collarStatus,
          ...(form.color.trim() ? { color: form.color.trim() } : {}),
          condition: form.condition,
          count: Number(form.count),
          ...(form.description.trim() ? { description: form.description.trim() } : {}),
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          ...(form.pattern.trim() ? { pattern: form.pattern.trim() } : {}),
          seenAt: new Date(form.seenAt).toISOString(), species: form.species, urgency: form.urgency,
        });
        sightingId = created.id; setCreatedId(created.id);
      }
      if (photos.length) await uploadSightingPhotos(auth.authenticatedRequest, sightingId, photos);
      setCompleted(true);
    } catch (submitError) {
      const detail = submitError instanceof ApiClientError ? submitError.message : 'The report could not be submitted.';
      if (sightingId) setUploadError(`${detail} Your sighting is saved; retry the photo upload without creating another report.`); else setError(detail);
    } finally { setSubmitting(false); }
  }

  if (completed && createdId) return <div className="page-container state-page"><section className="success-state"><span aria-hidden="true">✓</span><span className="eyebrow">Report submitted</span><h1>Thank you for helping.</h1><p>Your report was created as <strong>{createdId.slice(0, 8).toUpperCase()}</strong>{photos.length ? ` with ${String(photos.length)} photo${photos.length === 1 ? '' : 's'}` : ''}. PetRadar generated the public approximate area on the backend.</p><div className="action-row"><Link className="primary-action" href={routes.myReports}>View My Reports</Link><Link className="secondary-action" href={routes.home}>Return home</Link></div></section></div>;

  return <div className="page-container form-page"><header className="page-heading"><div><span className="eyebrow">Community reporting</span><h1>Report an Animal</h1><p>Share what you observed while keeping the exact location protected.</p></div><span className="phase-badge">Step {step} of 3</span></header><ol className="form-stepper" aria-label="Report progress"><StepItem active={step === 1} done={step > 1} label="Animal details" /><StepItem active={step === 2} done={step > 2} label="Private location" /><StepItem active={step === 3} done={false} label="Review" /></ol><form className="wizard-panel" onSubmit={submit} noValidate>{error ? <div className="feedback feedback-error" role="alert">{error}</div> : null}{uploadError ? <div className="feedback feedback-error" role="alert">{uploadError}</div> : null}{step === 1 ? <DetailsStep form={form} photos={photos} setForm={setForm} setPhotos={setPhotos} setUploadError={setUploadError} /> : null}{step === 2 ? <LocationStep form={form} setForm={setForm} /> : null}{step === 3 ? <ReviewStep form={form} photoCount={photos.length} /> : null}<footer className="wizard-actions">{step > 1 ? <button className="secondary-action" type="button" onClick={() => { setError(''); setStep(step === 3 ? 2 : 1); }}>Back</button> : <span />}{step < 3 ? <button className="primary-action" type="button" onClick={next}>Continue</button> : <button className="primary-action" disabled={submitting} type="submit">{submitting ? 'Submitting…' : createdId ? 'Retry photo upload' : 'Submit report'}</button>}</footer></form></div>;
}

function DetailsStep({ form, photos, setForm, setPhotos, setUploadError }: { form: ReportForm; photos: File[]; setForm: React.Dispatch<React.SetStateAction<ReportForm>>; setPhotos(files: File[]): void; setUploadError(message: string): void }) {
  return <section className="wizard-step"><div className="section-heading"><span className="eyebrow">Animal details</span><h2>What did you see?</h2><p>Required details help the community understand the situation.</p></div><div className="form-grid"><SelectField label="Species" value={form.species} onChange={(value) => { if (value === '' || isSpecies(value)) setForm((current) => ({ ...current, species: value })); }} options={[["","Choose species"],["CAT","Cat"],["DOG","Dog"],["OTHER","Other"]]} required /><label className="form-field"><span>Animal count</span><input min="1" max="20" type="number" value={form.count} onChange={(event) => setForm((current) => ({ ...current, count: event.target.value }))} required /></label><SelectField label="Condition" value={form.condition} onChange={(value) => { if (value === '' || isCondition(value)) setForm((current) => ({ ...current, condition: value })); }} options={conditionOptions} required /><SelectField label="Urgency" value={form.urgency} onChange={(value) => { if (value === '' || isUrgency(value)) setForm((current) => ({ ...current, urgency: value })); }} options={[["","Choose urgency"],["LOW","Low"],["MEDIUM","Medium"],["HIGH","High"],["EMERGENCY","Emergency"]]} required /><label className="form-field"><span>Seen date and time</span><input type="datetime-local" value={form.seenAt} onChange={(event) => setForm((current) => ({ ...current, seenAt: event.target.value }))} required /></label><SelectField label="Collar" value={form.collarStatus} onChange={(value) => { if (isCollar(value)) setForm((current) => ({ ...current, collarStatus: value })); }} options={[["UNKNOWN","Unknown"],["NO_COLLAR","No collar"],["BLUE_COLLAR","Blue collar"],["RED_COLLAR_WITH_BELL","Red collar with bell"],["OTHER","Other"]]} /><label className="form-field"><span>Color <small>Optional</small></span><input maxLength={80} value={form.color} onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))} /></label><label className="form-field"><span>Pattern <small>Optional</small></span><input maxLength={120} value={form.pattern} onChange={(event) => setForm((current) => ({ ...current, pattern: event.target.value }))} /></label><label className="form-field form-field-wide"><span>Description <small>Optional</small></span><textarea maxLength={2000} rows={5} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></label></div><PhotoPicker files={photos} onChange={(files) => { setUploadError(''); setPhotos(files); }} onError={setUploadError} /></section>;
}

function LocationStep({ form, setForm }: { form: ReportForm; setForm: React.Dispatch<React.SetStateAction<ReportForm>> }) {
  return <section className="wizard-step"><div className="section-heading"><span className="eyebrow">Private location</span><h2>Confirm the exact sighting point</h2><p>Place a private pin or use the manual coordinate fallback.</p></div><PrivateLocationPicker latitude={form.latitude} longitude={form.longitude} onChange={(location) => setForm((current) => ({ ...current, latitude: String(location.latitude), locationConfirmed: false, longitude: String(location.longitude) }))} /><div className="form-grid"><label className="form-field"><span>Latitude</span><input inputMode="decimal" placeholder="13.7563" value={form.latitude} onChange={(event) => setForm((current) => ({ ...current, latitude: event.target.value, locationConfirmed: false }))} required /></label><label className="form-field"><span>Longitude</span><input inputMode="decimal" placeholder="100.5018" value={form.longitude} onChange={(event) => setForm((current) => ({ ...current, longitude: event.target.value, locationConfirmed: false }))} required /></label></div><label className="check-field"><input type="checkbox" checked={form.locationConfirmed} onChange={(event) => setForm((current) => ({ ...current, locationConfirmed: event.target.checked }))} /><span>I confirm this private point represents where the animal was seen.</span></label></section>;
}

function ReviewStep({ form, photoCount }: { form: ReportForm; photoCount: number }) { return <section className="wizard-step"><div className="section-heading"><span className="eyebrow">Review</span><h2>Check before submitting</h2><p>No report is created until you submit this review.</p></div><dl className="review-list"><Review label="Species" value={form.species ? formatStatus(form.species) : 'Missing'} /><Review label="Condition" value={form.condition ? formatStatus(form.condition) : 'Missing'} /><Review label="Urgency" value={form.urgency ? formatStatus(form.urgency) : 'Missing'} /><Review label="Seen" value={new Date(form.seenAt).toLocaleString()} /><Review label="Animals" value={form.count} /><Review label="Photos" value={photoCount ? String(photoCount) : 'None'} /><Review label="Private point" value={`${Number(form.latitude).toFixed(5)}, ${Number(form.longitude).toFixed(5)}`} /></dl><aside className="privacy-note compact-note"><strong>Privacy check</strong><span>The exact point is owner/reporter-authorized data. Public users receive only the backend-generated approximate area. Photo metadata is sanitized by the API.</span></aside></section>; }
function StepItem({ active, done, label }: { active: boolean; done: boolean; label: string }) { return <li className={active ? 'active' : done ? 'done' : ''}><span>{done ? '✓' : ''}</span><strong>{label}</strong></li>; }
function SelectField({ label, onChange, options, required, value }: { label: string; onChange(value: string): void; options: readonly (readonly [string,string])[]; required?: boolean; value: string }) { return <label className="form-field"><span>{label}</span><select required={required} value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([optionValue, optionLabel]) => <option key={optionValue || 'empty'} value={optionValue}>{optionLabel}</option>)}</select></label>; }
function Review({ label, value }: { label: string; value: string }) { return <div><dt>{label}</dt><dd>{value}</dd></div>; }
function isSpecies(value: string): value is AnimalSpecies { return value === 'CAT' || value === 'DOG' || value === 'OTHER'; }
function isCondition(value: string): value is AnimalCondition { return conditionOptions.some(([candidate]) => candidate !== '' && candidate === value); }
function isUrgency(value: string): value is UrgencyLevel { return value === 'LOW' || value === 'MEDIUM' || value === 'HIGH' || value === 'EMERGENCY'; }
function isCollar(value: string): value is CollarStatus { return value === 'NO_COLLAR' || value === 'RED_COLLAR_WITH_BELL' || value === 'BLUE_COLLAR' || value === 'UNKNOWN' || value === 'OTHER'; }
const conditionOptions: readonly (readonly [string, string])[] = [['','Choose condition'],['NORMAL_STRAY','Normal stray'],['INJURED','Injured'],['NEEDS_RESCUE','Needs rescue'],['NEWBORN_LITTER','Newborn litter'],['POSSIBLE_LOST_PET','Possible lost pet'],['SICK','Sick'],['PREGNANT','Pregnant'],['AGGRESSIVE','Aggressive'],['UNKNOWN','Unknown']];
function validateDetails(form: ReportForm): string | null { if (!form.species) return 'Choose the animal species.'; const count = Number(form.count); if (!Number.isInteger(count) || count < 1 || count > 20) return 'Animal count must be between 1 and 20.'; if (!form.condition) return 'Choose the animal condition.'; if (!form.urgency) return 'Choose an urgency level.'; const date = new Date(form.seenAt); if (!form.seenAt || Number.isNaN(date.getTime())) return 'Enter a valid seen date and time.'; if (date.getTime() > Date.now() + 5 * 60 * 1000) return 'Seen time cannot be in the future.'; return null; }
function validateLocation(form: ReportForm): string | null { const latitude = Number(form.latitude); const longitude = Number(form.longitude); if (!form.latitude || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) return 'Place the pin or enter a latitude between -90 and 90.'; if (!form.longitude || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) return 'Place the pin or enter a longitude between -180 and 180.'; if (!form.locationConfirmed) return 'Confirm the private sighting point.'; return null; }
