import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { assetService } from '../../services/assetService';
import { AuthenticatedImage } from '../../components/common/AuthenticatedImage';
import { ownerService } from '../../services/ownerService';
import { lookupService } from '../../services/lookupService';
import { AssetCategory, Owner, OwnerRole } from '../../types';
import { useSecurity } from '../../context/SecurityContext';
import { ArrowLeft, Box, Building2, CalendarDays, ChevronRight, ClipboardList, Download, FileText, Info, LockKeyhole, Phone, Printer, QrCode, ShieldCheck, Tag, UserRound, Users, Barcode } from 'lucide-react';
import QRCode from 'qrcode';

const getLocalDateTime = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const textOnlyPattern = /^[\p{L}\p{M}\p{P}\s]*$/u;
const hasTextLetterPattern = /[\p{L}\p{M}]/u;
const isTextOnly = (value: string) => textOnlyPattern.test(value) && !value.includes('_') && (!value.trim() || hasTextLetterPattern.test(value));
const textOnlyHint = 'Use letters, spaces, and punctuation only.';
const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <label className="asset-form-field"><span>{label}{required && <b> *</b>}</span>{children}</label>
);

export const AssetFormPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast, currentUser } = useSecurity();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [assetCategories, setAssetCategories] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serial, setSerial] = useState('');
  const [category, setCategory] = useState<AssetCategory>('');
  const [description, setDescription] = useState('');
  const [ownerFullName, setOwnerFullName] = useState('');
  const [ownerIdNumber, setOwnerIdNumber] = useState('');
  const [ownerRole, setOwnerRole] = useState<OwnerRole>('STUDENT');
  const [ownerDepartment, setOwnerDepartment] = useState('');
  const [ownerPhoneNumber, setOwnerPhoneNumber] = useState('');
  const [ownerPhoto, setOwnerPhoto] = useState<File | null>(null);
  const [ownerPhotoPreview, setOwnerPhotoPreview] = useState('');
  const ownerPhotoInputRef = useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState('');
  const selectedOwner = owners.find((owner) => owner.fullName.trim().toLocaleLowerCase() === ownerFullName.trim().toLocaleLowerCase());
  const duplicateOwnerId = !selectedOwner && ownerIdNumber.trim()
    ? owners.find((owner) => owner.universityId.trim().toLocaleLowerCase() === ownerIdNumber.trim().toLocaleLowerCase())
    : undefined;
  const invalidOwnerName = !selectedOwner && Boolean(ownerFullName.trim()) && !isTextOnly(ownerFullName);
  const invalidDepartment = !selectedOwner && Boolean(ownerDepartment.trim()) && !isTextOnly(ownerDepartment);
  const invalidDescription = Boolean(description.trim()) && !isTextOnly(description);
  const invalidNotes = Boolean(notes.trim()) && !isTextOnly(notes);
  const department = selectedOwner?.department ?? ownerDepartment;
  const phoneNumber = selectedOwner?.phone ?? ownerPhoneNumber;
  const [registrationDateTime, setRegistrationDateTime] = useState(getLocalDateTime);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  useEffect(() => {
    void lookupService.getAll().then((lookups) => setAssetCategories(lookups.assetCategories)).catch(() => undefined);
    ownerService.getAll().then((allOwners) => {
      setOwners(allOwners);
      const preselectedOwner = allOwners.find((owner) => owner.universityId === searchParams.get('ownerId'));
      if (preselectedOwner) setOwnerFullName(preselectedOwner.fullName);
    });
  }, [searchParams]);

  useEffect(() => {
    if (selectedOwner) {
      setOwnerDepartment(selectedOwner.department);
      setOwnerPhoneNumber(selectedOwner.phone);
      setOwnerRole(selectedOwner.role);
    }
  }, [selectedOwner?.id]);

  useEffect(() => {
    if (!ownerPhoto) {
      setOwnerPhotoPreview('');
      return;
    }
    const previewUrl = URL.createObjectURL(ownerPhoto);
    setOwnerPhotoPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [ownerPhoto]);

  useEffect(() => {
    let isCurrent = true;
    const code = serial.trim().toUpperCase();

    if (!code) {
      setQrCodeDataUrl('');
      return () => {
        isCurrent = false;
      };
    }

    QRCode.toDataURL(code, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 280,
      color: { dark: '#000000', light: '#ffffff' },
    }).then((dataUrl) => {
      if (isCurrent) setQrCodeDataUrl(dataUrl);
    }).catch((error: unknown) => {
      console.error('Could not generate the asset QR preview.', error);
      if (isCurrent) {
        showToast({
          type: 'error',
          title: 'QR Generation Failed',
          message: 'Could not generate a QR preview for this asset.',
        });
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [serial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerFullName.trim()) {
      showToast({ type: 'warning', title: 'Owner name required', message: 'Enter the owner’s full name before registering this asset.' });
      return;
    }
    if (!department.trim()) {
      showToast({ type: 'warning', title: 'Department required', message: 'Enter the owner’s department before registering this asset.' });
      return;
    }
    if ((!selectedOwner && !isTextOnly(ownerFullName)) || (!selectedOwner && !isTextOnly(department)) || !isTextOnly(description) || !isTextOnly(notes)) {
      showToast({ type: 'warning', title: 'Text validation failed', message: textOnlyHint });
      return;
    }
    if (!selectedOwner && !ownerIdNumber.trim()) {
      showToast({ type: 'warning', title: 'ID number required', message: 'Enter the owner’s ID number before registering this asset.' });
      return;
    }
    if (duplicateOwnerId) {
      showToast({ type: 'warning', title: 'ID number already registered', message: `This ID number belongs to ${duplicateOwnerId.fullName}. Select that registered owner instead.` });
      return;
    }
    setIsSubmitting(true);
    const extraNotes = [description && `Description: ${description}`, notes].filter(Boolean).join('\n');
    try {
      const savedOwner = selectedOwner
        ? selectedOwner
        : await ownerService.create({
          fullName: ownerFullName.trim(),
          universityId: ownerIdNumber.trim(),
          email: '',
          phone: phoneNumber.trim(),
          department: department.trim(),
          role: ownerRole,
          photo: ownerPhoto || undefined,
        });
      setOwners((current) => [savedOwner, ...current.filter((owner) => owner.id !== savedOwner.id)]);
      const created = await assetService.create({
        name, brand, model, serial, category, color: '', ownerId: savedOwner.universityId, ownerName: savedOwner.fullName, ownerMatric: savedOwner.universityId,
        department, status: 'AUTHORIZED', description, notes: extraNotes || undefined, registrationDateTime: new Date(registrationDateTime).toISOString(),
      });
      showToast({ type: 'success', title: 'Asset Registered', message: `${created.name} registered under ID ${created.id}.` });
      navigate(`/assets/${created.id}`);
    } catch (error: unknown) {
      const message = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
        ? error.message
        : 'Could not create asset record. Check the required fields.';
      showToast({ type: 'error', title: 'Registration Error', message });
    } finally { setIsSubmitting(false); }
  };

  const clearSelectedOwner = () => {
    setOwnerFullName('');
    setOwnerIdNumber('');
    setOwnerDepartment('');
    setOwnerPhoneNumber('');
    setOwnerRole('STUDENT');
    setOwnerPhoto(null);
    if (ownerPhotoInputRef.current) ownerPhotoInputRef.current.value = '';
  };

  return (
    <div className="content-page asset-registration-page">
      <div className="asset-breadcrumb"><button type="button" onClick={() => navigate('/')} aria-label="Home"><Box size={16} /></button><ChevronRight size={14} /><button type="button" onClick={() => navigate('/assets')}>Assets</button><ChevronRight size={14} /><span>Register Asset</span></div>
      <header className="asset-registration-heading">
        <div className="asset-heading-icon"><Box size={27} /></div>
        <div><h1>Register Physical Asset</h1><p>Create a new asset record and generate a QR identifier for secure tracking and verification.</p></div>
      </header>

      <form onSubmit={handleSubmit} className="asset-registration-form">
        <div className="asset-form-sections">
          <section className="soc-card asset-form-card">
            <h2><ClipboardList size={18} /> <span>1. Hardware Identification</span></h2>
            <div className="asset-field-grid">
              <Field label="Asset Title" required><input className="soc-input" placeholder="e.g. Dell Latitude 5420" value={name} onChange={(e) => setName(e.target.value)} required /></Field>
              <Field label="Asset Code" required><div className="asset-input-icon"><Tag size={16} /><input className="soc-input" value="Generated on save" readOnly /></div></Field>
              <Field label="Category" required><input className="soc-input" list="registered-asset-categories" placeholder="Enter or select a category" value={category} onChange={(e) => setCategory(e.target.value)} required /><datalist id="registered-asset-categories">{assetCategories.map((item) => <option key={item} value={item} />)}</datalist></Field>
              <Field label="Model"><input className="soc-input" placeholder="e.g. Latitude 5420" value={model} onChange={(e) => setModel(e.target.value)} /></Field>
              <Field label="Manufacturer"><input className="soc-input" placeholder="e.g. Dell" value={brand} onChange={(e) => setBrand(e.target.value)} /></Field>
              <Field label="Serial Number" required><div className="asset-input-icon"><Barcode size={16} /><input className="soc-input" placeholder="e.g. DL5420-001" value={serial} onChange={(e) => setSerial(e.target.value)} required /></div></Field>
              <Field label="Description"><div className="asset-input-icon asset-textarea-icon"><FileText size={16} /><textarea className="soc-input" placeholder="Additional details about the asset..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} aria-invalid={invalidDescription} /></div>{invalidDescription && <small role="alert">{textOnlyHint}</small>}</Field>
            </div>
          </section>

          <section className="soc-card asset-form-card">
            <h2><Users size={18} /> <span>2. Ownership &amp; Campus Assignment</span></h2>
            <div className="asset-field-grid asset-assignment-grid">
              <Field label="Owner" required><div className="asset-input-icon"><UserRound size={16} /><input className="soc-input" list="registered-owner-names" placeholder="Enter owner full name" value={ownerFullName} readOnly={Boolean(selectedOwner)} onChange={(event) => setOwnerFullName(event.target.value)} required autoComplete="off" aria-invalid={invalidOwnerName} /><datalist id="registered-owner-names">{owners.map((owner) => <option key={owner.id} value={owner.fullName} label={`${owner.universityId} · ${owner.role}`} />)}</datalist></div>{invalidOwnerName && <small role="alert">{textOnlyHint}</small>}{selectedOwner && <button type="button" className="asset-owner-change" onClick={clearSelectedOwner}>Change owner</button>}</Field>
              <Field label="ID Number" required><input className="soc-input" placeholder="Enter university or staff ID number" value={selectedOwner?.universityId ?? ownerIdNumber} onChange={(event) => setOwnerIdNumber(event.target.value)} readOnly={Boolean(selectedOwner)} maxLength={50} required={!selectedOwner} aria-invalid={Boolean(duplicateOwnerId)} />{duplicateOwnerId && <small role="alert">This ID number is already registered to {duplicateOwnerId.fullName}.</small>}</Field>
              <Field label="Department" required><div className="asset-input-icon"><Building2 size={16} /><input className="soc-input" placeholder="Enter department" value={selectedOwner?.department ?? department} readOnly={Boolean(selectedOwner)} onChange={(event) => setOwnerDepartment(event.target.value)} required aria-invalid={invalidDepartment} /></div>{invalidDepartment && <small role="alert">{textOnlyHint}</small>}</Field>
              <Field label="Phone Number"><div className="asset-input-icon"><Phone size={16} /><input className="soc-input" type="tel" placeholder="Enter phone number" value={selectedOwner?.phone ?? phoneNumber} readOnly={Boolean(selectedOwner)} onChange={(event) => setOwnerPhoneNumber(event.target.value)} /></div></Field>
              <Field label="Role" required><select className="soc-input" value={selectedOwner?.role ?? ownerRole} disabled={Boolean(selectedOwner)} onChange={(event) => setOwnerRole(event.target.value as OwnerRole)}><option value="STUDENT">Student</option><option value="STAFF">Staff</option><option value="FACULTY">Faculty</option><option value="VISITOR">Other</option></select></Field>
              <div className="registered-owner-preview" style={{ gridColumn: '1 / -1' }}>
                <h3>Registered owner</h3>
                <div className="registered-owner-identity">
                  <div className="registered-owner-avatar">{selectedOwner?.avatarUrl ? <AuthenticatedImage src={selectedOwner.avatarUrl} alt={`${selectedOwner.fullName} profile`} /> : ownerPhotoPreview && !selectedOwner ? <img src={ownerPhotoPreview} alt="Owner profile preview" /> : <UserRound size={24} />}</div>
                  <div><strong>{(selectedOwner?.fullName ?? ownerFullName.trim()) || 'Unassigned'}</strong><span>{selectedOwner?.universityId ?? (ownerFullName.trim() ? `New owner · ${ownerRole === 'STUDENT' ? 'Student' : ownerRole === 'STAFF' ? 'Staff' : ownerRole === 'FACULTY' ? 'Faculty' : 'Other'}` : 'N/A')}</span></div>
                </div>
                <p>Department: <strong>{department || 'General Campus'}</strong></p>
                <p>Phone Number: <strong>{phoneNumber || 'N/A'}</strong></p>
                <p>Role: <strong>{(selectedOwner?.role ?? ownerRole) === 'STUDENT' ? 'Student' : (selectedOwner?.role ?? ownerRole) === 'STAFF' ? 'Staff' : (selectedOwner?.role ?? ownerRole) === 'FACULTY' ? 'Faculty' : 'Other'}</strong></p>
                <p>Campus: <strong>Debre Berhan University (Main)</strong></p>
                {selectedOwner
                  ? <small className="registered-owner-photo-name">Registered owner details are read-only while assigning an asset.</small>
                  : <>
                    <button type="button" className="registered-owner-upload" onClick={() => ownerPhotoInputRef.current?.click()}>
                      <UserRound size={15} /> {ownerPhoto ? 'Choose a different photo' : 'Upload owner photo'}
                    </button>
                    <input ref={ownerPhotoInputRef} className="registered-owner-file-input" type="file" accept="image/*" onChange={(event) => setOwnerPhoto(event.target.files?.[0] ?? null)} />
                    {ownerPhoto && <small className="registered-owner-photo-name">{ownerPhoto.name} · saved to the owner’s profile when you register the asset</small>}
                  </>}
              </div>
            </div>
          </section>

          <section className="soc-card asset-form-card">
            <h2><CalendarDays size={18} /> <span>4. Registration Details</span></h2>
            <div className="asset-field-grid">
              <Field label="Registered By"><div className="asset-input-icon"><UserRound size={16} /><input className="soc-input" value={`${currentUser.firstName} ${currentUser.lastName}`} readOnly /></div></Field>
              <Field label="Registration Date" required><div className="asset-input-icon"><CalendarDays size={16} /><input className="soc-input" type="datetime-local" value={registrationDateTime} onChange={(event) => setRegistrationDateTime(event.target.value)} required /></div></Field>
              <Field label="Notes"><div className="asset-input-icon asset-textarea-icon"><FileText size={16} /><textarea className="soc-input" placeholder="Any additional notes..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} aria-invalid={invalidNotes} /></div>{invalidNotes && <small role="alert">{textOnlyHint}</small>}</Field>
            </div>
          </section>
        </div>

        <aside className="soc-card asset-qr-panel">
          <div className="asset-qr-heading"><h2><QrCode size={20} /> QR Identifier</h2><span className="asset-qr-pending"><i /> {serial.trim() ? 'Serial number preview' : 'Enter serial number'}</span></div>
          <p>Scan this QR code to look up the asset by its serial number.</p>
          <div className="asset-qr-placeholder">
            {qrCodeDataUrl ? <img src={qrCodeDataUrl} alt="QR code preview for the asset serial number" width="140" height="140" /> : <QrCode size={120} strokeWidth={1.5} />}
            {!qrCodeDataUrl && <small>Enter a serial number to generate QR</small>}
          </div>
          <div className="asset-qr-code-label">QR Content</div><strong className="asset-qr-code">{serial.trim().toUpperCase() || 'Enter serial number'}</strong>
          <div className="asset-qr-info"><span><ShieldCheck size={20} /></span><p>This QR contains only the serial number and can be used after the asset is registered.</p></div>
          <div className="asset-qr-actions"><a className="soc-btn soc-btn-outline" href={qrCodeDataUrl || undefined} download={`${serial.trim().toUpperCase() || 'asset'}-qr.png`} aria-disabled={!qrCodeDataUrl} onClick={(event) => { if (!qrCodeDataUrl) { event.preventDefault(); showToast({ type: 'warning', title: 'Enter a serial number', message: 'Enter the asset serial number to generate its QR code.' }); } }}><Download size={16} /> Download QR</a><button type="button" className="soc-btn soc-btn-outline" onClick={() => window.print()}><Printer size={16} /> Print</button></div>
        </aside>

        <footer className="asset-form-footer"><button type="button" className="soc-btn soc-btn-outline" onClick={() => navigate('/assets')}><ArrowLeft size={16} /> Cancel</button><button type="submit" disabled={isSubmitting} className="soc-btn soc-btn-primary"><LockKeyhole size={16} /> {isSubmitting ? 'Registering…' : 'Register Asset'}</button></footer>
      </form>
      <div className="asset-form-note"><Info size={16} /> Choose an existing student or staff member from the Owners directory so each asset has a registered owner.</div>
    </div>
  );
};
