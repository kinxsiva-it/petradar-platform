'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';

import { PrivateLocationPicker } from '../../components/map/private-location-picker';
import { ApiClientError } from '../../lib/api/http-client';
import { formatStatus } from '../../lib/formatting/display';
import { lostPetDetailRoute, routes } from '../../lib/routes';
import { useAuth } from '../auth/use-auth';
import { createLostPet, getMyLostPet, updateLostPet } from './owner-lost-pets-api';
import type { AnimalSpecies, LostPetSex } from './lost-pet-types';

interface LostPetFormProps { id?: string; }
type Step = 1 | 2 | 3;
interface FormState {
  age: string; breed: string; collarDescription: string; color: string; contactMethod: string;
  description: string; lastSeenAt: string; latitude: string; locationConfirmed: boolean;
  longitude: string; microchipped: boolean; name: string; pattern: string; rewardBaht: string;
  sex: LostPetSex; species: '' | AnimalSpecies;
}
const emptyForm: FormState = { age: '', breed: '', collarDescription: '', color: '', contactMethod: '', description: '', lastSeenAt: '', latitude: '', locationConfirmed: false, longitude: '', microchipped: false, name: '', pattern: '', rewardBaht: '', sex: 'UNKNOWN', species: '' };

export function LostPetForm({ id }: LostPetFormProps) {
  const auth = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photoUrlDraft, setPhotoUrlDraft] = useState('');

  useEffect(() => {
    if (!id) return;
    let active = true;
    void getMyLostPet(auth.authenticatedRequest, id).then((pet) => {
      if (!active) return;
      setForm({ age: pet.age ?? '', breed: pet.breed ?? '', collarDescription: pet.collarDescription ?? '', color: pet.color ?? '', contactMethod: pet.contactMethod ?? '', description: pet.description ?? '', lastSeenAt: toLocalDateTime(pet.lastSeenAt), latitude: pet.exactLocation ? String(pet.exactLocation.latitude) : '', locationConfirmed: Boolean(pet.exactLocation), longitude: pet.exactLocation ? String(pet.exactLocation.longitude) : '', microchipped: pet.microchipped, name: pet.name, pattern: pet.pattern ?? '', rewardBaht: pet.rewardCents === null ? '' : String(pet.rewardCents / 100), sex: pet.sex, species: pet.species });
      setPhotoUrls(pet.photoUrls);
    }).catch(() => { if (active) setError('This owner lost-pet post could not be loaded.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [auth.authenticatedRequest, id]);

  function next() {
    const message = step === 1 ? validatePet(form, photoUrlDraft) : validateLostLocation(form);
    if (message) { setError(message); return; }
    setError(''); setStep(step === 1 ? 2 : 3);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = validatePet(form, photoUrlDraft) ?? validateLostLocation(form);
    if (message || !form.species) { setError(message ?? 'Complete all required fields.'); return; }
    const reward = form.rewardBaht.trim() ? Math.round(Number(form.rewardBaht) * 100) : undefined;
    const payload = {
      ...(form.age.trim() ? { age: form.age.trim() } : {}), ...(form.breed.trim() ? { breed: form.breed.trim() } : {}), ...(form.collarDescription.trim() ? { collarDescription: form.collarDescription.trim() } : {}), ...(form.color.trim() ? { color: form.color.trim() } : {}), ...(form.contactMethod.trim() ? { contactMethod: form.contactMethod.trim() } : {}), ...(form.description.trim() ? { description: form.description.trim() } : {}), lastSeenAt: new Date(form.lastSeenAt).toISOString(), latitude: Number(form.latitude), longitude: Number(form.longitude), microchipped: form.microchipped, name: form.name.trim(), ...(form.pattern.trim() ? { pattern: form.pattern.trim() } : {}), photoUrls, ...(reward === undefined ? {} : { rewardCents: reward }), sex: form.sex, species: form.species,
    };
    setSubmitting(true); setError('');
    try { const saved = id ? await updateLostPet(auth.authenticatedRequest, id, payload) : await createLostPet(auth.authenticatedRequest, payload); setSavedId(saved.id); }
    catch (submitError) { setError(submitError instanceof ApiClientError ? submitError.message : 'The lost-pet post could not be saved.'); }
    finally { setSubmitting(false); }
  }

  if (loading) return <div className="page-container state-page"><section className="loading-state workspace-state"><span className="loading-pulse" /><p>Loading your lost-pet post…</p></section></div>;
  if (savedId) return <div className="page-container state-page"><section className="success-state"><span aria-hidden="true">✓</span><span className="eyebrow">{id ? 'Post updated' : 'Post created'}</span><h1>{form.name} is saved.</h1><p>PetRadar keeps the exact last-seen point private and publishes only the backend-generated approximate area.</p><div className="action-row"><Link className="primary-action" href={routes.myLostPets}>View My Lost Pets</Link><Link className="secondary-action" href={lostPetDetailRoute(savedId)}>View public post</Link></div></section></div>;

  return <div className="page-container form-page"><header className="page-heading"><div><span className="eyebrow">Pet owner workspace</span><h1>{id ? 'Edit lost-pet post' : 'Post a lost pet'}</h1><p>{id ? 'Update owner fields without exposing private location or contact details publicly.' : 'Create a privacy-aware post that can be compared with community sightings.'}</p></div><span className="phase-badge">Step {step} of 3</span></header><ol className="form-stepper" aria-label="Lost-pet post progress"><StepItem active={step === 1} done={step > 1} label="Pet details" /><StepItem active={step === 2} done={step > 2} label="Last seen" /><StepItem active={step === 3} done={false} label="Review" /></ol><form className="wizard-panel" onSubmit={submit} noValidate>{error ? <div className="feedback feedback-error" role="alert">{error}</div> : null}{photoError ? <div className="feedback feedback-error" role="alert">{photoError}</div> : null}{step === 1 ? <PetStep form={form} photoUrlDraft={photoUrlDraft} photoUrls={photoUrls} setForm={setForm} setPhotoError={setPhotoError} setPhotoUrlDraft={setPhotoUrlDraft} setPhotoUrls={setPhotoUrls} /> : null}{step === 2 ? <LastSeenStep form={form} setForm={setForm} /> : null}{step === 3 ? <LostPetReview form={form} photoCount={photoUrls.length} /> : null}<footer className="wizard-actions">{step > 1 ? <button className="secondary-action" type="button" onClick={() => { setError(''); setStep(step === 3 ? 2 : 1); }}>Back</button> : <span />}{step < 3 ? <button className="primary-action" type="button" onClick={next}>Continue</button> : <button className="primary-action" disabled={submitting} type="submit">{submitting ? 'Saving…' : id ? 'Save changes' : 'Create post'}</button>}</footer></form></div>;
}

interface FormPartProps { form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>>; }
interface PetStepProps extends FormPartProps { photoUrlDraft: string; photoUrls: string[]; setPhotoError(message: string): void; setPhotoUrlDraft(value: string): void; setPhotoUrls(value: string[]): void; }

function PetStep({ form, photoUrlDraft, photoUrls, setForm, setPhotoError, setPhotoUrlDraft, setPhotoUrls }: PetStepProps) {
  function addPhoto() { const value = photoUrlDraft.trim(); if (photoUrls.length >= 5) { setPhotoError('Lost-pet posts accept at most 5 photo URLs.'); return; } if (!/^https?:\/\//i.test(value)) { setPhotoError('Use a photo URL that starts with http:// or https://.'); return; } setPhotoUrls([...photoUrls, value]); setPhotoUrlDraft(''); setPhotoError(''); }
  return <section className="wizard-step"><div className="section-heading"><span className="eyebrow">Pet details</span><h2>Tell the community who to look for</h2><p>Use recognizable details without adding private contact information to the public description.</p></div><div className="form-grid"><TextField label="Pet name" value={form.name} onChange={(name) => setForm((current) => ({ ...current, name }))} required /><label className="form-field"><span>Species</span><select required value={form.species} onChange={(event) => { const value = event.target.value; if (isSpecies(value) || value === '') setForm((current) => ({ ...current, species: value })); }}><option value="">Choose species</option><option value="CAT">Cat</option><option value="DOG">Dog</option><option value="OTHER">Other</option></select></label><TextField label="Breed" value={form.breed} onChange={(breed) => setForm((current) => ({ ...current, breed }))} /><label className="form-field"><span>Sex</span><select value={form.sex} onChange={(event) => { const value = event.target.value; if (isSex(value)) setForm((current) => ({ ...current, sex: value })); }}><option value="UNKNOWN">Unknown</option><option value="FEMALE">Female</option><option value="MALE">Male</option></select></label><TextField label="Age" value={form.age} onChange={(age) => setForm((current) => ({ ...current, age }))} /><TextField label="Color" value={form.color} onChange={(color) => setForm((current) => ({ ...current, color }))} /><TextField label="Pattern" value={form.pattern} onChange={(pattern) => setForm((current) => ({ ...current, pattern }))} /><TextField label="Collar" value={form.collarDescription} onChange={(collarDescription) => setForm((current) => ({ ...current, collarDescription }))} /><label className="check-field"><input type="checkbox" checked={form.microchipped} onChange={(event) => setForm((current) => ({ ...current, microchipped: event.target.checked }))} /><span>Microchipped</span></label><label className="form-field form-field-wide"><span>Public description <small>Optional</small></span><textarea maxLength={2000} rows={5} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></label></div><section className="url-photo-editor"><div className="section-heading"><span className="eyebrow">Supported photo behavior</span><h3>Add server-hosted photo URLs</h3><p>The lost-pet API does not expose binary upload yet. Photo URLs are the supported parity path.</p></div><div className="url-photo-row"><label className="form-field"><span>Photo URL</span><input type="url" value={photoUrlDraft} onChange={(event) => setPhotoUrlDraft(event.target.value)} placeholder="https://example.com/pet.jpg" /></label><button className="secondary-action" type="button" onClick={addPhoto}>Add URL</button></div>{photoUrls.length ? <div className="photo-preview-grid">{photoUrls.map((url, index) => <figure key={`${url}-${String(index)}`}><img src={url} alt={`Lost pet photo ${String(index + 1)} preview`} /><figcaption><span>Photo {index + 1}</span><button type="button" onClick={() => setPhotoUrls(photoUrls.filter((_, candidate) => candidate !== index))}>Remove</button></figcaption></figure>)}</div> : <p className="photo-empty">No photo URLs added. Public cards use their existing placeholder.</p>}</section></section>;
}

function LastSeenStep({ form, setForm }: FormPartProps) { return <section className="wizard-step"><div className="section-heading"><span className="eyebrow">Private last-seen point</span><h2>Where and when was your pet last seen?</h2><p>Place the private pin or use the manual coordinate fallback.</p></div><PrivateLocationPicker latitude={form.latitude} longitude={form.longitude} onChange={(location) => setForm((current) => ({ ...current, latitude: String(location.latitude), locationConfirmed: false, longitude: String(location.longitude) }))} /><div className="form-grid"><label className="form-field"><span>Last-seen date and time</span><input type="datetime-local" required value={form.lastSeenAt} onChange={(event) => setForm((current) => ({ ...current, lastSeenAt: event.target.value }))} /></label><label className="form-field"><span>Reward in THB <small>Optional</small></span><input min="0" step="1" type="number" value={form.rewardBaht} onChange={(event) => setForm((current) => ({ ...current, rewardBaht: event.target.value }))} /></label><TextField label="Latitude" value={form.latitude} onChange={(latitude) => setForm((current) => ({ ...current, latitude, locationConfirmed: false }))} required /><TextField label="Longitude" value={form.longitude} onChange={(longitude) => setForm((current) => ({ ...current, longitude, locationConfirmed: false }))} required /><label className="form-field form-field-wide"><span>Private contact method <small>Optional</small></span><input maxLength={200} value={form.contactMethod} onChange={(event) => setForm((current) => ({ ...current, contactMethod: event.target.value }))} /><small>This is not rendered by public Next pages.</small></label></div><label className="check-field"><input type="checkbox" checked={form.locationConfirmed} onChange={(event) => setForm((current) => ({ ...current, locationConfirmed: event.target.checked }))} /><span>I confirm this private point is the best known last-seen location.</span></label></section>; }
function LostPetReview({ form, photoCount }: { form: FormState; photoCount: number }) { return <section className="wizard-step"><div className="section-heading"><span className="eyebrow">Review</span><h2>Check the lost-pet post</h2></div><dl className="review-list"><Review label="Name" value={form.name} /><Review label="Species" value={form.species ? formatStatus(form.species) : 'Missing'} /><Review label="Last seen" value={new Date(form.lastSeenAt).toLocaleString()} /><Review label="Photos" value={photoCount ? String(photoCount) : 'None'} /><Review label="Private point" value={`${Number(form.latitude).toFixed(5)}, ${Number(form.longitude).toFixed(5)}`} /><Review label="Contact" value={form.contactMethod || 'Not provided'} /><Review label="Reward" value={form.rewardBaht ? `฿${form.rewardBaht}` : 'Not offered'} /></dl><aside className="privacy-note compact-note"><strong>Public/private separation</strong><span>Contact and exact coordinates remain owner-only. The public page receives safe pet details and an approximate location.</span></aside></section>; }
function TextField({ label, onChange, required, value }: { label: string; onChange(value: string): void; required?: boolean; value: string }) { return <label className="form-field"><span>{label}{required ? null : <small> Optional</small>}</span><input maxLength={200} required={required} value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
function StepItem({ active, done, label }: { active: boolean; done: boolean; label: string }) { return <li className={active ? 'active' : done ? 'done' : ''}><span>{done ? '✓' : ''}</span><strong>{label}</strong></li>; }
function Review({ label, value }: { label: string; value: string }) { return <div><dt>{label}</dt><dd>{value}</dd></div>; }
function isSpecies(value: string): value is AnimalSpecies { return value === 'CAT' || value === 'DOG' || value === 'OTHER'; }
function isSex(value: string): value is LostPetSex { return value === 'FEMALE' || value === 'MALE' || value === 'UNKNOWN'; }
function toLocalDateTime(value: string): string { const date = new Date(value); const offset = date.getTimezoneOffset() * 60_000; return new Date(date.getTime() - offset).toISOString().slice(0, 16); }
function validatePet(form: FormState, photoUrlDraft: string): string | null { if (!form.name.trim()) return 'Enter the pet name.'; if (form.name.trim().length > 120) return 'Pet name must be 120 characters or fewer.'; if (!form.species) return 'Choose the pet species.'; if (form.contactMethod.length > 200) return 'Contact instructions must be 200 characters or fewer.'; if (photoUrlDraft.trim()) return /^https?:\/\//i.test(photoUrlDraft.trim()) ? 'Select Add URL to include this photo, or clear the field.' : 'Use a photo URL that starts with http:// or https://.'; return null; }
function validateLostLocation(form: FormState): string | null { const date = new Date(form.lastSeenAt); if (!form.lastSeenAt || Number.isNaN(date.getTime())) return 'Enter a valid last-seen date and time.'; if (date.getTime() > Date.now() + 5 * 60 * 1000) return 'Last-seen time cannot be in the future.'; const latitude = Number(form.latitude); const longitude = Number(form.longitude); if (!form.latitude || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) return 'Place the pin or enter a latitude between -90 and 90.'; if (!form.longitude || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) return 'Place the pin or enter a longitude between -180 and 180.'; const reward = form.rewardBaht.trim() ? Number(form.rewardBaht) : 0; if (!Number.isFinite(reward) || reward < 0) return 'Reward must be zero or greater.'; if (!form.locationConfirmed) return 'Confirm the private last-seen point.'; return null; }
