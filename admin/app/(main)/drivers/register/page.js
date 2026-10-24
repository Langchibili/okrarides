'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { adminClient } from '@/lib/api/adminClient';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';

const steps = [
  { title: 'Account & identity', description: 'Driver account and contact details' },
  { title: 'Documents', description: 'Required details and selected files' },
  { title: 'Vehicle', description: 'Vehicle type and registration information' },
  { title: 'Review & submit', description: 'Confirm the driver registration' },
];

const documentFields = [
  { key: 'driverLicenseFront', label: 'Driver license — front', requirement: 'driverLicense', accept: 'image/*,.pdf' },
  { key: 'driverLicenseBack', label: 'Driver license — back', requirement: 'driverLicense', accept: 'image/*,.pdf' },
  { key: 'nationalIdFront', label: 'National ID — front', requirement: 'nationalId', accept: 'image/*,.pdf' },
  { key: 'nationalIdBack', label: 'National ID — back', requirement: 'nationalId', accept: 'image/*,.pdf' },
  { key: 'profilePicture', label: 'Driver profile photo', required: true, accept: 'image/*' },
  { key: 'proofOfAddress', label: 'Proof of address', requirement: 'proofOfAddress', accept: 'image/*,.pdf' },
  { key: 'insuranceCertificate', label: 'Vehicle insurance certificate', requirement: 'insurance', accept: 'image/*,.pdf' },
  { key: 'roadTaxCertificate', label: 'Road tax certificate', requirement: 'roadTax', accept: 'image/*,.pdf' },
  { key: 'fitnessDocument', label: 'Vehicle fitness document', requirement: 'fitnessDocument', accept: 'image/*,.pdf' },
  { key: 'registrationDocument', label: 'Vehicle registration document', requirement: 'vehicleRegistration', accept: 'image/*,.pdf' },
];

const requirementAliases = {
  driverLicense: ['driverLicense', 'license', 'driverLicenseRequired', 'licenseRequired', 'isDriverLicenseRequired', 'isLicenseRequired'],
  nationalId: ['nationalId', 'nationalID', 'nrc', 'nationalIdRequired', 'nrcRequired', 'isNationalIdRequired', 'isNRCRequired'],
  proofOfAddress: ['proofOfAddress', 'address', 'proofOfAddressRequired', 'addressRequired', 'isProofOfAddressRequired', 'isAddressRequired'],
  insurance: ['insurance', 'insuranceCertificate', 'insuranceRequired', 'insuranceCertificateRequired', 'isInsuranceRequired', 'isInsuranceCertificateRequired'],
  roadTax: ['roadTax', 'roadTaxCertificate', 'roadTaxRequired', 'roadTaxCertificateRequired'],
  fitnessDocument: ['fitnessDocument', 'fitness', 'fitnessRequired', 'fitnessDocumentRequired'],
  vehicleRegistration: ['vehicleRegistration', 'registrationDocument', 'vehicleRegistrationRequired', 'registrationRequired'],
};
const optionalVehicleRequirements = new Set(['roadTax', 'fitnessDocument', 'vehicleRegistration']);

function getCountryList(payload) {
  const result = payload?.data?.countries || payload?.countries || payload?.data?.data || payload?.data || payload;
  return Array.isArray(result) ? result : [];
}

function normalizeRequirements(payload) {
  let source = payload?.data?.requirements
    || payload?.requirements
    || payload?.data?.data?.requirements
    || payload?.data?.data
    || payload?.data
    || payload;
  source = source?.documents || source?.requiredDocuments || source;
  if (Array.isArray(source)) {
    source = Object.fromEntries(source.map(item => [item?.key || item?.name, item?.required ?? item?.isRequired]));
  }
  if (!source || typeof source !== 'object') return null;
  const normalized = {};
  for (const [key, aliases] of Object.entries(requirementAliases)) {
    const alias = aliases.find(name => source[name] !== undefined);
    const rawValue = alias ? source[alias] : undefined;
    const value = typeof rawValue === 'object' && rawValue !== null
      ? rawValue.required ?? rawValue.isRequired
      : rawValue;
    if (value === undefined && !optionalVehicleRequirements.has(key)) return null;
    normalized[key] = value === true || value === 1 || value === 'true';
  }
  return normalized;
}

const inputClass = 'mt-1 block w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60';
const labelClass = 'block text-sm font-medium text-slate-200';

function FormField({ label, error, children, required }) {
  return (
    <label className={labelClass}>
      {label}{required && <span className="ml-1 text-rose-400" aria-hidden="true">*</span>}
      {children}
      {error && <span className="mt-1 block text-xs text-rose-400">{error}</span>}
    </label>
  );
}

function StepHeading({ number, title, description }) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-bold text-emerald-300">
        {number}
      </span>
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function valueOrDash(value) {
  return value || 'Not provided';
}

export default function RegisterDriverPage() {
  const router = useRouter();
  const toast = useToast();
  const { canWrite, loading: authLoading } = useAuth();
  const permitted = canWrite('drivers');
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    countryId: '',
    partnerId: '',
    driverType: 'driver',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    licenseNumber: '',
    licenseExpiryDate: '',
    nationalIdNumber: '',
    address: '',
    vehicleType: 'taxi',
    numberPlate: '',
    make: '',
    model: '',
    year: String(new Date().getFullYear()),
    seatingCapacity: '4',
    color: '',
    insuranceExpiryDate: '',
    vehicleMode: 'new',
    existingVehicleId: '',
  });
  const [documents, setDocuments] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [createdDriver, setCreatedDriver] = useState(null);
  const [pendingUploads, setPendingUploads] = useState([]);
  const [countries, setCountries] = useState([]);
  const [partners, setPartners] = useState([]);
  const [vehicleOptions, setVehicleOptions] = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [vehiclesError, setVehiclesError] = useState('');
  const [vehiclesRetry, setVehiclesRetry] = useState(0);
  const [partnersError, setPartnersError] = useState('');
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [countriesError, setCountriesError] = useState('');
  const [countriesRetry, setCountriesRetry] = useState(0);
  const [requirements, setRequirements] = useState(null);
  const [requirementsLoading, setRequirementsLoading] = useState(false);
  const [requirementsError, setRequirementsError] = useState('');
  const [requirementsRetry, setRequirementsRetry] = useState(0);
  const [uploadingAll, setUploadingAll] = useState(false);
  const compatibleVehicleOptions = vehicleOptions.filter(vehicle => {
    const type = String(vehicle.vehicleType || '').toLowerCase();
    return form.driverType === 'courier'
      ? ['taxi', 'motorcycle', 'motorbike', 'truck'].includes(type)
      : ['taxi', 'bus', 'motorcycle', 'motorbike'].includes(type);
  });

  useEffect(() => {
    let active = true;
    adminClient.get('/drivers/countries')
      .then(payload => {
        if (active) setCountries(getCountryList(payload));
      })
      .catch(error => {
        if (active) setCountriesError(error.message || 'Failed to load countries');
      })
      .finally(() => {
        if (active) setCountriesLoading(false);
      });
    return () => { active = false; };
  }, [countriesRetry]);

  useEffect(() => {
    let active = true;
    adminClient.get('/drivers/partners')
      .then(payload => {
        const list = payload?.data ?? payload?.partners ?? payload;
        if (active) setPartners(Array.isArray(list) ? list : []);
      })
      .catch(error => {
        if (active) setPartnersError(error.message || 'Failed to load partner accounts');
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!form.countryId) {
      setVehicleOptions([]);
      setVehiclesError('');
      setVehiclesLoading(false);
      return undefined;
    }
    let active = true;
    setVehiclesLoading(true);
    setVehiclesError('');
    adminClient.get('/drivers/vehicles', {
      countryId: form.countryId,
      ...(form.partnerId ? { partnerId: form.partnerId } : {}),
    })
      .then(payload => {
        const list = Array.isArray(payload) ? payload : payload?.data || [];
        if (active) setVehicleOptions(list);
      })
      .catch(error => {
        if (active) setVehiclesError(error.message || 'Could not load available vehicles');
      })
      .finally(() => {
        if (active) setVehiclesLoading(false);
      });
    return () => { active = false; };
  }, [form.countryId, form.partnerId, vehiclesRetry]);

  useEffect(() => {
    if (!form.countryId) {
      setRequirements(null);
      setRequirementsError('');
      setRequirementsLoading(false);
      return undefined;
    }
    let active = true;
    setRequirements(null);
    setRequirementsError('');
    setRequirementsLoading(true);
    adminClient.get('/drivers/requirements', { countryId: form.countryId })
      .then(payload => {
        if (!active) return;
        const normalized = normalizeRequirements(payload);
        if (!normalized) throw new Error('Country document requirements response is incomplete');
        setRequirements(normalized);
      })
      .catch(error => {
        if (active) setRequirementsError(error.message || 'Failed to load document requirements');
      })
      .finally(() => {
        if (active) setRequirementsLoading(false);
      });
    return () => { active = false; };
  }, [form.countryId, requirementsRetry]);

  const updateForm = (name, value) => {
    setForm(current => ({ ...current, [name]: value }));
    setErrors(current => ({ ...current, [name]: undefined }));
  };

  const validateStep = currentStep => {
    const nextErrors = {};
    if (currentStep === 0) {
      if (!form.countryId) nextErrors.countryId = 'Country is required';
      if (!form.firstName.trim()) nextErrors.firstName = 'First name is required';
      if (!form.lastName.trim()) nextErrors.lastName = 'Last name is required';
      if (!form.phoneNumber.trim()) nextErrors.phoneNumber = 'Phone number is required';
      else if (form.phoneNumber.replace(/\D/g, '').length < 7) {
        nextErrors.phoneNumber = 'Enter a valid phone number';
      }
      if (form.countryId && (requirementsLoading || requirementsError || !requirements)) {
        nextErrors.countryId = requirementsLoading
          ? 'Wait for this country’s document requirements to load'
          : 'Country document requirements could not be loaded';
      }
    }
    if (currentStep === 1) {
      if (!requirements) {
        nextErrors.countryId = 'Select a country and load its document requirements first';
      } else {
        if (requirements.driverLicense && !form.licenseNumber.trim()) nextErrors.licenseNumber = 'License number is required';
        if (requirements.driverLicense && !form.licenseExpiryDate) nextErrors.licenseExpiryDate = 'License expiry date is required';
        else if (requirements.driverLicense && form.licenseExpiryDate < new Date().toISOString().slice(0, 10)) {
          nextErrors.licenseExpiryDate = 'License must not be expired';
        }
        if (requirements.nationalId && !form.nationalIdNumber.trim()) nextErrors.nationalIdNumber = 'National ID number is required';
        documentFields.filter(field => field.required || requirements[field.requirement]).forEach(field => {
          if (!documents[field.key]) nextErrors[field.key] = `${field.label} is required`;
        });
      }
    }
    if (currentStep === 2) {
      if (form.vehicleMode === 'existing') {
        if (!form.existingVehicleId) nextErrors.existingVehicleId = 'Select an available vehicle';
      } else {
        if (!form.vehicleType) nextErrors.vehicleType = 'Vehicle type is required';
        if (!form.numberPlate.trim()) nextErrors.numberPlate = 'Number plate is required';
        if (!form.make.trim()) nextErrors.make = 'Vehicle make is required';
        if (!form.model.trim()) nextErrors.model = 'Vehicle model is required';
        const year = Number(form.year);
        if (!form.year || !Number.isInteger(year) || year < 1900 || year > new Date().getFullYear() + 1) {
          nextErrors.year = 'Enter a valid vehicle year';
        }
        const seats = Number(form.seatingCapacity);
        if (!form.seatingCapacity || !Number.isInteger(seats) || seats < 2 || seats > 50) {
          nextErrors.seatingCapacity = 'Enter a seating capacity from 2 to 50';
        }
        if (!form.color.trim()) nextErrors.color = 'Vehicle color is required';
        if (!form.insuranceExpiryDate) nextErrors.insuranceExpiryDate = 'Insurance expiry date is required';
        else if (form.insuranceExpiryDate < new Date().toISOString().slice(0, 10)) {
          nextErrors.insuranceExpiryDate = 'Insurance must not be expired';
        }
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goToStep = nextStep => {
    if (nextStep > step) {
      for (let currentStep = step; currentStep < nextStep; currentStep += 1) {
        if (!validateStep(currentStep)) {
          setStep(currentStep);
          return;
        }
      }
    }
    setStep(nextStep);
  };

  const uploadSelectedDocuments = async (driverId, selectedFiles) => {
    let failed = 0;
    for (const item of selectedFiles) {
      setPendingUploads(current => current.map(upload => (
        upload.field === item.field ? { ...upload, status: 'uploading', error: '' } : upload
      )));
      try {
        const formData = new FormData();
        formData.append('file', item.file);
        formData.append('field', item.field);
        await adminClient.upload(`/drivers/${encodeURIComponent(driverId)}/documents`, formData);
        setPendingUploads(current => current.map(upload => (
          upload.field === item.field ? { ...upload, status: 'success', error: '' } : upload
        )));
      } catch (error) {
        failed += 1;
        setPendingUploads(current => current.map(upload => (
          upload.field === item.field ? { ...upload, status: 'failed', error: error.message || 'Upload failed' } : upload
        )));
      }
    }
    return failed;
  };

  const retryFailedUploads = async fields => {
    if (!permitted || !createdDriver?.id || uploadingAll) return;
    const failedFiles = pendingUploads.filter(item => item.status === 'failed' && (!fields || fields.includes(item.field)));
    if (!failedFiles.length) return;
    setUploadingAll(true);
    const failed = await uploadSelectedDocuments(createdDriver.id, failedFiles);
    setUploadingAll(false);
    if (failed) toast.error(`${failed} document upload${failed === 1 ? '' : 's'} still failed. Retry is available.`);
    else if (pendingUploads.some(item => item.status === 'failed' && !failedFiles.some(retried => retried.field === item.field))) {
      toast.info('Retried document uploaded; other failed uploads still need attention.');
    } else toast.success('All selected documents uploaded successfully.');
  };

  const submitRegistration = async event => {
    event.preventDefault();
    if (!permitted) {
      toast.error('You do not have permission to create drivers');
      return;
    }
    for (let currentStep = 0; currentStep < 3; currentStep += 1) {
      if (!validateStep(currentStep)) {
        setStep(currentStep);
        toast.error('Complete the required fields before submitting');
        return;
      }
    }

    setSubmitting(true);
    try {
      const registrationPayload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phoneNumber: form.phoneNumber.trim().replace(/\s+/g, ''),
        countryId: Number.isNaN(Number(form.countryId)) ? form.countryId : Number(form.countryId),
        partnerId: form.partnerId ? Number(form.partnerId) : null,
        driverType: form.driverType,
        licenseNumber: form.licenseNumber.trim(),
        licenseExpiryDate: form.licenseExpiryDate,
        nationalIdNumber: form.nationalIdNumber.trim(),
        address: form.address.trim() || undefined,
        ...(form.vehicleMode === 'existing'
          ? { vehicleId: Number(form.existingVehicleId) }
          : {
            vehicleType: form.vehicleType,
            vehicle: {
          numberPlate: form.numberPlate.trim().toUpperCase(),
          make: form.make.trim(),
          model: form.model.trim(),
          year: Number(form.year),
          seatingCapacity: Number(form.seatingCapacity),
          color: form.color.trim(),
          insuranceExpiryDate: form.insuranceExpiryDate,
            },
          }),
      };

      const response = await adminClient.post('/drivers/register', registrationPayload);
      const result = response?.data?.driver || response?.driver || response?.data || response;
      const driverId = result?.id ?? result?.driverId ?? result?.user?.id ?? null;
      const driverProfileId = result?.driverProfile?.id ?? result?.driverProfileId ?? null;
      const stagedFiles = documentFields
        .filter(field => documents[field.key])
        .map(field => ({
          field: field.key,
          file: documents[field.key],
          fileName: documents[field.key].name,
          required: Boolean(field.required || requirements?.[field.requirement]),
          status: 'pending',
          error: '',
        }));

      setCreatedDriver({ id: driverId, driverProfileId });
      setPendingUploads(stagedFiles);
      if (!driverId) {
        setPendingUploads(stagedFiles.map(item => ({
          ...item,
          status: 'failed',
          error: 'The response did not include a driver ID, so this file cannot be uploaded.',
        })));
        toast.error('Driver created, but the response did not include an ID required for document uploads.');
      } else if (stagedFiles.length) {
        setUploadingAll(true);
        const failed = await uploadSelectedDocuments(driverId, stagedFiles);
        setUploadingAll(false);
        if (failed) toast.error(`Driver created; ${failed} document upload${failed === 1 ? '' : 's'} failed.`);
        else toast.success('Driver created and all selected documents uploaded successfully.');
      } else {
        toast.success('Driver created successfully. No document files were selected.');
      }
    } catch (error) {
      setUploadingAll(false);
      toast.error(error.message || 'Driver registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return <main className="mx-auto max-w-5xl p-6 text-sm text-slate-400">Checking permissions…</main>;
  }

  if (!permitted) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-200" role="alert">
          You do not have permission to create drivers.
          <Link href="/drivers" className="ml-2 font-semibold underline">Return to drivers</Link>
        </div>
      </main>
    );
  }

  if (createdDriver) {
    return (
      <main className="mx-auto max-w-4xl p-4 sm:p-6">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-xl text-emerald-300" aria-hidden="true">✓</span>
            <div>
              <h1 className="text-xl font-bold text-white">Driver created</h1>
              <p className="text-sm text-slate-400">The registration request was accepted.</p>
            </div>
          </div>
          <div className={`rounded-xl border p-4 text-sm ${pendingUploads.some(item => item.status === 'failed') ? 'border-amber-500/30 bg-amber-500/10 text-amber-100' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'}`} role="status" aria-live="polite">
            {pendingUploads.length === 0 ? (
              <p className="font-semibold">Driver created. No document files were selected.</p>
            ) : (
              <p className="font-semibold">
                {pendingUploads.every(item => item.status === 'success')
                  ? 'Driver created and all selected documents uploaded successfully.'
                  : pendingUploads.some(item => item.status === 'failed')
                    ? 'Driver created. Some document uploads failed; retry them below.'
                    : 'Driver created. Document uploads are in progress.'}
              </p>
            )}
            {createdDriver.id && <p className="mt-2 text-xs opacity-80">Driver ID: {createdDriver.id}</p>}
          </div>
          {pendingUploads.length > 0 && (
            <ul className="mt-4 space-y-2 text-sm text-slate-300" aria-label="Document upload results">
              {pendingUploads.map(item => (
                <li key={item.field} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-900/70 px-3 py-2">
                  <span>{documentFields.find(field => field.key === item.field)?.label}<span className="ml-2 text-slate-500">{item.fileName}</span></span>
                  <span className="flex items-center gap-3">
                    <span className={item.status === 'success' ? 'text-emerald-300' : item.status === 'failed' ? 'text-rose-300' : 'text-slate-400'}>
                      {item.status === 'success' ? 'Uploaded' : item.status === 'failed' ? `Failed: ${item.error}` : item.status === 'uploading' ? 'Uploading…' : 'Waiting'}
                    </span>
                    {item.status === 'failed' && createdDriver.id && (
                      <button type="button" disabled={uploadingAll} onClick={() => retryFailedUploads([item.field])} className="font-semibold text-emerald-300 underline disabled:opacity-50">
                        Retry
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {pendingUploads.some(item => item.status === 'failed') && createdDriver.id && (
            <button type="button" disabled={uploadingAll} onClick={() => retryFailedUploads()} className="mt-4 rounded-lg border border-emerald-500/50 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-50">
              {uploadingAll ? 'Retrying uploads…' : 'Retry all failed uploads'}
            </button>
          )}
          <Link href="/drivers" className="mt-6 inline-flex rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500">
            Return to drivers
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/drivers" className="text-sm text-slate-400 hover:text-white">← Drivers</Link>
          <h1 className="mt-2 text-2xl font-bold text-white">Register a driver</h1>
          <p className="mt-1 text-sm text-slate-400">Create the account, upload required onboarding documents and register a vehicle.</p>
        </div>
        <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300">
          Step {step + 1} of {steps.length}
        </span>
      </header>

      <nav aria-label="Registration steps" className="mb-6 grid grid-cols-2 gap-2 md:grid-cols-4">
        {steps.map((item, index) => (
          <button
            key={item.title}
            type="button"
            onClick={() => goToStep(index)}
            aria-current={index === step ? 'step' : undefined}
            className={`rounded-xl border p-3 text-left transition ${index === step ? 'border-emerald-500/60 bg-emerald-500/10' : 'border-slate-700 bg-slate-900/50 hover:border-slate-500'}`}
          >
            <span className={`text-xs font-bold ${index === step ? 'text-emerald-300' : 'text-slate-500'}`}>0{index + 1}</span>
            <span className="mt-1 block text-sm font-semibold text-slate-100">{item.title}</span>
            <span className="mt-1 hidden text-xs text-slate-400 sm:block">{item.description}</span>
          </button>
        ))}
      </nav>

      <form onSubmit={submitRegistration} noValidate>
        <section className="rounded-2xl border border-slate-700 bg-slate-800/70 p-5 sm:p-7">
          {step === 0 && (
            <>
              <StepHeading number="1" title="Account & basic identity" description="A phone number is used as the driver's contact and account identifier." />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Account type" required>
                  <select className={inputClass} value={form.driverType} onChange={event => {
                    setForm(current => ({ ...current, driverType: event.target.value, existingVehicleId: '' }));
                    setErrors(current => ({ ...current, existingVehicleId: undefined }));
                  }}>
                    <option value="driver">Normal driver</option>
                    <option value="courier">Courier / delivery driver</option>
                  </select>
                </FormField>
                <FormField label="Partner">
                  <select className={inputClass} value={form.partnerId} onChange={event => {
                    setForm(current => ({ ...current, partnerId: event.target.value, existingVehicleId: '' }));
                    setErrors(current => ({ ...current, existingVehicleId: undefined }));
                  }}>
                    <option value="">No partner (independent)</option>
                    {partners.map(partner => (
                      <option key={partner.id} value={partner.id}>
                        {partner.name}{partner.country?.name ? ` · ${partner.country.name}` : ''}
                      </option>
                    ))}
                  </select>
                  {partnersError && <span className="mt-1 block text-xs text-amber-300">{partnersError}</span>}
                </FormField>
                <FormField label="Country" required error={errors.countryId}>
                  <select
                    className={inputClass}
                    value={form.countryId}
                    disabled={countriesLoading || countries.length === 0}
                    onChange={event => {
                      setForm(current => ({ ...current, countryId: event.target.value, existingVehicleId: '' }));
                      setErrors(current => ({ ...current, countryId: undefined, existingVehicleId: undefined }));
                      setRequirements(null);
                      setRequirementsError('');
                    }}
                  >
                    <option value="">{countriesLoading ? 'Loading countries…' : 'Select a country'}</option>
                    {countries.map(country => (
                      <option key={country.id} value={country.id}>
                        {country.name || country.countryName || country.label || country.attributes?.name || country.attributes?.countryName || country.code || `Country ${country.id}`}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="First name" required error={errors.firstName}>
                  <input className={inputClass} autoComplete="given-name" value={form.firstName} onChange={event => updateForm('firstName', event.target.value)} />
                </FormField>
                <FormField label="Last name" required error={errors.lastName}>
                  <input className={inputClass} autoComplete="family-name" value={form.lastName} onChange={event => updateForm('lastName', event.target.value)} />
                </FormField>
                <FormField label="Phone number" required error={errors.phoneNumber}>
                  <input className={inputClass} type="tel" autoComplete="tel" placeholder="+260 97 000 0000" value={form.phoneNumber} onChange={event => updateForm('phoneNumber', event.target.value)} />
                </FormField>
              </div>
              {countriesError && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-rose-300" role="alert">
                  <span>{countriesError}</span>
                  <button type="button" onClick={() => { setCountriesLoading(true); setCountriesError(''); setCountriesRetry(value => value + 1); }} className="font-semibold underline">Retry</button>
                </div>
              )}
              {!countriesLoading && !countriesError && countries.length === 0 && (
                <p className="mt-3 text-sm text-rose-300" role="alert">No countries are available for driver registration.</p>
              )}
              {form.countryId && (
                <div className="mt-3 text-sm" role="status" aria-live="polite">
                  {requirementsLoading && <span className="text-slate-400">Loading country document requirements…</span>}
                  {requirementsError && (
                    <span className="text-rose-300">
                      {requirementsError}{' '}
                      <button type="button" onClick={() => setRequirementsRetry(value => value + 1)} className="font-semibold underline">Retry</button>
                    </span>
                  )}
                  {requirements && (
                    <span className="text-emerald-300">
                      Country requirements loaded: license {requirements.driverLicense ? 'required' : 'optional'}, national ID {requirements.nationalId ? 'required' : 'optional'}, proof of address {requirements.proofOfAddress ? 'required' : 'optional'}, insurance {requirements.insurance ? 'required' : 'optional'}, road tax {requirements.roadTax ? 'required' : 'optional'}, fitness document {requirements.fitnessDocument ? 'required' : 'optional'}, vehicle registration {requirements.vehicleRegistration ? 'required' : 'optional'}.
                    </span>
                  )}
                </div>
              )}
              <p className="mt-4 rounded-lg border border-sky-500/20 bg-sky-500/5 p-3 text-xs text-sky-100/80">
                Account credentials and any initial password are handled by the registration endpoint; this form does not create credentials in the browser.
              </p>
            </>
          )}

          {step === 1 && (
            <>
              <StepHeading number="2" title="Documents & required details" description="Enter identity details and select the files required for the selected country." />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Driver license number" required={requirements?.driverLicense} error={errors.licenseNumber}>
                  <input className={inputClass} value={form.licenseNumber} onChange={event => updateForm('licenseNumber', event.target.value)} />
                </FormField>
                <FormField label="License expiry date" required={requirements?.driverLicense} error={errors.licenseExpiryDate}>
                  <input className={inputClass} type="date" min={new Date().toISOString().slice(0, 10)} value={form.licenseExpiryDate} onChange={event => updateForm('licenseExpiryDate', event.target.value)} />
                </FormField>
                <FormField label="National ID number" required={requirements?.nationalId} error={errors.nationalIdNumber}>
                  <input className={inputClass} value={form.nationalIdNumber} onChange={event => updateForm('nationalIdNumber', event.target.value)} />
                </FormField>
                <FormField label="Residential address">
                  <input className={inputClass} autoComplete="street-address" value={form.address} onChange={event => updateForm('address', event.target.value)} />
                </FormField>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {documentFields.map(field => (
                  <FormField key={field.key} label={`${field.label}${field.required || requirements?.[field.requirement] ? ' (required)' : ' (optional)'}`} error={errors[field.key]}>
                    <input
                      className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-slate-700 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-100`}
                      type="file"
                      accept={field.accept}
                      onChange={event => {
                        const file = event.target.files?.[0] || null;
                        setDocuments(current => ({ ...current, [field.key]: file }));
                        setErrors(current => ({ ...current, [field.key]: undefined }));
                      }}
                    />
                    {documents[field.key] && (
                      <span className="mt-1 block truncate text-xs text-slate-400">{documents[field.key].name} · ready to upload after creation</span>
                    )}
                  </FormField>
                ))}
              </div>
              <p className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-100/80">
                Required files follow this country’s requirements; the profile photo is always required. Selected files upload after the driver is created.
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <StepHeading number="3" title="Vehicle type & information" description="Create a vehicle or attach an available vehicle using the partner onboarding workflow." />
              <div className="mb-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => updateForm('vehicleMode', 'new')}
                  className={`rounded-xl border p-4 text-left ${form.vehicleMode === 'new' ? 'border-emerald-500/60 bg-emerald-500/10' : 'border-slate-700 bg-slate-900/50'}`}
                >
                  <strong className="block text-sm text-white">Register a new vehicle</strong>
                  <span className="mt-1 block text-xs text-slate-400">Enter vehicle details and create its record with the driver.</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateForm('vehicleMode', 'existing')}
                  className={`rounded-xl border p-4 text-left ${form.vehicleMode === 'existing' ? 'border-emerald-500/60 bg-emerald-500/10' : 'border-slate-700 bg-slate-900/50'}`}
                >
                  <strong className="block text-sm text-white">Attach an existing vehicle</strong>
                  <span className="mt-1 block text-xs text-slate-400">Select an unassigned vehicle available to this partner or to no partner.</span>
                </button>
              </div>

              {form.vehicleMode === 'existing' ? (
                <div className="space-y-3">
                  <FormField label="Available vehicle" required error={errors.existingVehicleId}>
                    <select
                      className={inputClass}
                      value={form.existingVehicleId}
                      disabled={vehiclesLoading || !form.countryId || !compatibleVehicleOptions.length}
                      onChange={event => updateForm('existingVehicleId', event.target.value)}
                    >
                      <option value="">
                        {vehiclesLoading ? 'Loading available vehicles…' : compatibleVehicleOptions.length ? 'Select a vehicle' : 'No compatible available vehicles'}
                      </option>
                      {compatibleVehicleOptions.map(vehicle => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.numberPlate} · {vehicle.make} {vehicle.model} · {vehicle.vehicleType}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  {vehiclesError && (
                    <p className="text-sm text-rose-300" role="alert">
                      {vehiclesError}{' '}
                      <button type="button" className="font-semibold underline" onClick={() => setVehiclesRetry(value => value + 1)}>Retry</button>
                    </p>
                  )}
                  {form.existingVehicleId && (() => {
                    const vehicle = compatibleVehicleOptions.find(item => String(item.id) === String(form.existingVehicleId));
                    return vehicle ? (
                      <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-200">
                        <strong>{vehicle.year || ''} {vehicle.make} {vehicle.model}</strong>
                        <span className="ml-2 font-mono text-emerald-300">{vehicle.numberPlate}</span>
                        <p className="mt-1 text-xs capitalize text-slate-400">{vehicle.vehicleType} · {vehicle.color || 'Color not provided'} · {vehicle.verificationStatus || 'not verified'}</p>
                      </div>
                    ) : null;
                  })()}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Vehicle type" required error={errors.vehicleType}>
                  <select className={inputClass} value={form.vehicleType} onChange={event => updateForm('vehicleType', event.target.value)}>
                    <option value="taxi">Taxi / Sedan</option>
                    {form.driverType === 'driver' && <option value="bus">Bus / Minibus</option>}
                    {form.driverType === 'courier' && <option value="truck">Truck</option>}
                    <option value="motorcycle">Motorbike</option>
                  </select>
                </FormField>
                <FormField label="Number plate" required error={errors.numberPlate}>
                  <input className={inputClass} autoCapitalize="characters" value={form.numberPlate} onChange={event => updateForm('numberPlate', event.target.value.toUpperCase())} />
                </FormField>
                <FormField label="Make" required error={errors.make}>
                  <input className={inputClass} placeholder="e.g. Toyota" value={form.make} onChange={event => updateForm('make', event.target.value)} />
                </FormField>
                <FormField label="Model" required error={errors.model}>
                  <input className={inputClass} placeholder="e.g. Corolla" value={form.model} onChange={event => updateForm('model', event.target.value)} />
                </FormField>
                <FormField label="Year" required error={errors.year}>
                  <input className={inputClass} type="number" min="1900" max={new Date().getFullYear() + 1} value={form.year} onChange={event => updateForm('year', event.target.value)} />
                </FormField>
                <FormField label="Seating capacity" required error={errors.seatingCapacity}>
                  <input className={inputClass} type="number" min="2" max="50" value={form.seatingCapacity} onChange={event => updateForm('seatingCapacity', event.target.value)} />
                </FormField>
                <FormField label="Vehicle color" required error={errors.color}>
                  <input className={inputClass} value={form.color} onChange={event => updateForm('color', event.target.value)} />
                </FormField>
                <FormField label="Insurance expiry date" required error={errors.insuranceExpiryDate}>
                  <input className={inputClass} type="date" min={new Date().toISOString().slice(0, 10)} value={form.insuranceExpiryDate} onChange={event => updateForm('insuranceExpiryDate', event.target.value)} />
                </FormField>
                </div>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <StepHeading number="4" title="Review & submit" description="Check the details. Selected files upload immediately after driver creation." />
              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-white">Account & identity</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between gap-3"><dt className="text-slate-400">Name</dt><dd className="text-right text-slate-100">{form.firstName} {form.lastName}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-slate-400">Country</dt><dd className="text-right text-slate-100">{countries.find(country => String(country.id) === String(form.countryId))?.name || countries.find(country => String(country.id) === String(form.countryId))?.countryName || countries.find(country => String(country.id) === String(form.countryId))?.attributes?.name || 'Selected country'}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-slate-400">Phone</dt><dd className="text-right text-slate-100">{form.phoneNumber}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-slate-400">Account type</dt><dd className="text-right text-slate-100">{form.driverType === 'courier' ? 'Courier / delivery driver' : 'Normal driver'}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-slate-400">Partner</dt><dd className="text-right text-slate-100">{partners.find(partner => String(partner.id) === String(form.partnerId))?.name || 'No partner'}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-slate-400">License</dt><dd className="text-right text-slate-100">{form.licenseNumber} · expires {form.licenseExpiryDate}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-slate-400">National ID</dt><dd className="text-right text-slate-100">{form.nationalIdNumber}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-slate-400">Address</dt><dd className="text-right text-slate-100">{valueOrDash(form.address)}</dd></div>
                  </dl>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-white">Vehicle</h3>
                  <dl className="space-y-2 text-sm">
                    {form.vehicleMode === 'existing' ? (() => {
                      const vehicle = compatibleVehicleOptions.find(item => String(item.id) === String(form.existingVehicleId));
                      return vehicle ? (
                        <>
                          <div className="flex justify-between gap-3"><dt className="text-slate-400">Vehicle type</dt><dd className="text-right capitalize text-slate-100">{vehicle.vehicleType}</dd></div>
                          <div className="flex justify-between gap-3"><dt className="text-slate-400">Vehicle</dt><dd className="text-right text-slate-100">{vehicle.year || ''} {vehicle.make} {vehicle.model}</dd></div>
                          <div className="flex justify-between gap-3"><dt className="text-slate-400">Plate</dt><dd className="text-right font-mono text-slate-100">{vehicle.numberPlate}</dd></div>
                          <div className="flex justify-between gap-3"><dt className="text-slate-400">Color / seats</dt><dd className="text-right capitalize text-slate-100">{vehicle.color || '—'} · {vehicle.seatingCapacity || '—'}</dd></div>
                          <div className="flex justify-between gap-3"><dt className="text-slate-400">Insurance expires</dt><dd className="text-right text-slate-100">{vehicle.insuranceExpiryDate || '—'}</dd></div>
                        </>
                      ) : <p className="text-slate-400">No vehicle selected.</p>;
                    })() : (
                      <>
                        <div className="flex justify-between gap-3"><dt className="text-slate-400">Type</dt><dd className="text-right capitalize text-slate-100">{form.vehicleType}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-slate-400">Vehicle</dt><dd className="text-right text-slate-100">{form.year} {form.make} {form.model}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-slate-400">Plate</dt><dd className="text-right font-mono text-slate-100">{form.numberPlate}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-slate-400">Color / seats</dt><dd className="text-right capitalize text-slate-100">{form.color} · {form.seatingCapacity}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-slate-400">Insurance expires</dt><dd className="text-right text-slate-100">{form.insuranceExpiryDate}</dd></div>
                      </>
                    )}
                  </dl>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                <h3 className="text-sm font-semibold text-white">Selected documents</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {documentFields.map(field => (
                    <li key={field.key} className="flex flex-wrap justify-between gap-2">
                      <span className="text-slate-300">{field.label}</span>
                      <span className={documents[field.key] ? 'text-amber-300' : field.required || requirements?.[field.requirement] ? 'text-rose-300' : 'text-slate-500'}>
                        {documents[field.key]?.name || (field.required || requirements?.[field.requirement] ? 'Missing' : 'Not selected')}
                        {documents[field.key] ? ' · uploads after creation' : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-100/80">
                Driver and vehicle details are submitted as JSON. Selected document files are uploaded separately immediately after creation.
              </p>
            </>
          )}

          <div className="mt-7 flex flex-wrap justify-between gap-3 border-t border-slate-700 pt-5">
            <button
              type="button"
              onClick={() => step === 0 ? router.push('/drivers') : setStep(current => current - 1)}
              className="rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700"
            >
              {step === 0 ? 'Cancel' : 'Back'}
            </button>
            {step < steps.length - 1 ? (
              <button type="button" onClick={() => goToStep(step + 1)} className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500">
                Continue
              </button>
            ) : (
              <button type="submit" disabled={submitting || !permitted} className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-60">
                {submitting ? 'Creating driver…' : 'Create driver'}
              </button>
            )}
          </div>
        </section>
      </form>
    </main>
  );
}
